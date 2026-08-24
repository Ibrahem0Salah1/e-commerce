# Checkout Load-Test Runbook

Load-tests the **real** checkout pipeline (`lib/orders/create-order.ts`) through a
secret-gated internal route, so results reflect genuine database contention —
not a mock.

Two environments:

1. **Local Docker** (recommended, primary) — Postgres + Toxiproxy with
   injectable latency. Full control; see section 1 below.
2. **Remote (Vercel/Neon)** — production-shaped but network-confounded;
   historical reference only.

---

## 1. LOCAL DOCKER ENVIRONMENT (primary)

### 1.0 One-time: install Docker Desktop

```powershell
winget install Docker.DockerDesktop
```

Launch **Docker Desktop** from the Start menu once and let it finish
initializing (accepts WSL2 backend). Verify in a NEW terminal:

```powershell
docker --version
docker compose version
```

### 1.1 Start the stack

```powershell
docker compose -f tests/load/docker-compose.yml up -d
.\tests\load\proxy.ps1 init        # create the postgres proxy entry (idempotent)
```

App-facing connection string (latency-controllable):

```
postgresql://loadtest:loadtest@127.0.0.1:15432/ecommerce_loadtest
```

Direct bypass port (admin only): `127.0.0.1:15433`.

### 1.2 Latency controls

```powershell
.\tests\load\proxy.ps1 rtt -Ms 10     # ~10ms RTT per query  (degraded prod)
.\tests\load\proxy.ps1 rtt -Ms 100    # ~100ms RTT           (worst case / Egypt<->Frankfurt)
.\tests\load\proxy.ps1 clear          # 0ms                  (ceiling)
.\tests\load\proxy.ps1 status         # inspect current toxics
```

Latency is applied to BOTH directions with ±20% jitter and can be toggled at
runtime — no app restart needed between arms (existing pooled connections pick
up new toxics immediately).

### 1.3 Prepare schema + data against the local DB

Run these from a terminal where `DATABASE_URL` points at the proxy:

```powershell
$env:DATABASE_URL = "postgresql://loadtest:loadtest@127.0.0.1:15432/ecommerce_loadtest"
npx prisma db push --skip-generate      # fresh schema on empty volume
npx tsx scripts/seed-loadtest.ts        # products/shipping/test user
```

Sign the test user up through the running app (once):

```powershell
curl -X POST http://localhost:3000/api/auth/sign-up/email `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"loadtester@mds.test\",\"password\":\"LoadTest123!\",\"name\":\"Load Tester\"}'
```

### 1.4 Start the app against Docker

Shell env overrides `.env` (Next.js never clobbers pre-set variables), so your
real Neon config stays untouched. In the server terminal:

```powershell
$env:DATABASE_URL = "postgresql://loadtest:loadtest@127.0.0.1:15432/ecommerce_loadtest"
npm start
```

k6 terminal stays as before (`BASE_URL=http://localhost:3000`, `LOADTEST_SECRET`).

### 1.5 The arm matrix (run top to bottom)

Set isolation via env when starting the server:
`$env:ORDER_TX_ISOLATION="ReadCommitted"` or leave unset for Serializable.
Restart `npm start` after changing it.

| Order | Latency | Isolation | Expectation |
|---|---|---|---|
| 1 | clear | Serializable | Sanity: ~100% SUCCESS at moderate rps |
| 2 | rtt 100 | Serializable | **Reproduces the Neon incident**: high BUSY(TX_CONFLICT) even low rps |
| 3 | rtt 100 | ReadCommitted | Same pain, BUSY collapses → the decision data |
| 4 | rtt 10 | Serializable | Where does degradation start at prod-like-ish latency? |
| 5 | rtt 10 | ReadCommitted | Comparison under middle setting |
| 6 | clear | ReadCommitted | Ceiling |

Per-arm protocol (each arm): re-seed hot stock → warm-up `HOT_RPS=10`/30s →
ramp 25 / 50 / 100 × 60s → scorecard row → oversell SQL.

Scorecard template (fill one table per latency tier):

```text
Isolation   Rate | p95(ms) | SUCCESS | BUSY_TX_CONFLICT | BUSY_DB_CONNECTION | OOS | OVERSOLD?
Serializable  25 |
Serializable  50 |
Serializable 100 |
ReadCommitted 25 |
...
```

### 1.6 Oversell check (after every hot run)

```sql
SELECT stock < 0 AS oversold FROM products WHERE slug='loadtest-hot';
SELECT count(*) FROM order_items oi JOIN products p ON p.id=oi."productId"
WHERE p.slug='loadtest-hot';   -- must equal k6 SUCCESS count
```

Any `oversold=true` = critical bug, stop everything.

### 1.7 Teardown / reset

```powershell
docker compose -f tests/load/docker-compose.yml down          # keeps data
docker compose -f tests/load/docker-compose.yml down -v       # nukes data too
```


## 2. Shared prerequisites & server env

```powershell
winget install Grafana.k6   # one-time
```

Environment variables understood by the app under test:

| Var | Purpose |
|---|---|
| `LOADTEST_SECRET` | Required. Route returns **403 without it** (fail-closed). |
| `ORDER_TX_ISOLATION` | `Serializable` (default) or `ReadCommitted` — the A/B lever. |
| `SESSION_COOKIE` *(k6-side)* | Optional: reuse a signed-in session across runs instead of logging in each time — avoids better-auth's sign-in rate limit (3 / 20 min) during long sessions. |

⚠️ Always test against a **disposable database**, never production.
⚠️ Use a **production build** (`npm run build && npm start`) — dev-mode numbers are meaningless.

## 3. Scenario variants (beyond hot)

```powershell
$env:BASE_URL="http://localhost:3000"; $env:LOADTEST_SECRET="load_test"

# Spread: same rate across 50 different products (healthy path)
k6 run -e SCENARIO=spread -e SPREAD_RPS=100 tests/load/checkout.k6.js

# Soak: ramp to sustained mixed load for 15 minutes
k6 run -e SCENARIO=soak -e SOAK_RPS=30 tests/load/checkout.k6.js
```

Ramp rates gradually (10 → 50 → 100 → 200 rps) and record at each step.

## 4. What to record per run

From k6 output:
- `checkout_duration` p50 / p95 / p99
- `checkout_outcomes{outcome=SUCCESS|BUSY|OUT_OF_STOCK|OTHER}` counts
- `http_req_failed` rate

Server side while running:

```sql
-- connection pool pressure
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
-- lock waits on the product row
SELECT count(*) FROM pg_locks WHERE NOT granted;
```

## 5. Decision rule (Serializable vs ReadCommitted)

Compare the arm tables from section 1.5:

- ReadCommitted meaningfully lowers BUSY(TX_CONFLICT)% and p95 at equal
  latency/rate → adopt it. Oversell safety is unchanged (the atomic conditional
  decrement guards stock under ANY isolation level).
- No measurable difference → keep Serializable for the stronger guarantee.

## 6. Verify zero oversell after every hot run

```sql
-- initial stock was printed by the seeder (HOT_STOCK)
SELECT stock FROM products WHERE slug = 'loadtest-hot';
-- must equal initial − successful orders × qty(1):
SELECT count(*) FROM order_items oi
JOIN products p ON p.id = oi."productId"
WHERE p.slug = 'loadtest-hot';
-- and never negative:
SELECT stock < 0 AS oversold FROM products WHERE slug = 'loadtest-hot';
```

Any `oversold = true` is a critical bug — stop and report.

## Notes & limits

- The route skips rate limiting/Turnstile by design; everything else
  (validation, idempotency keys, transactional execution) is identical to
  production checkout.
- SERVER_ERROR outcomes carry a sanitized `reason`: `TX_CONFLICT` (P2034
  serialization aborts) or `DB_CONNECTION` (pool/network) — k6 tags outcomes
  with it, so runs are self-diagnosing without server logs.
- Single shared test user is intentional: user identity doesn't affect row
  contention on products. Re-run with several users if you suspect otherwise.
- k6 `constant-arrival-rate` measures requests/second — `*_RPS`, not VUs.
