# Checkout Load-Test Runbook

Load-tests the **real** checkout pipeline (`lib/orders/create-order.ts`) through a
secret-gated internal route, so results reflect genuine database contention —
not a mock.

## 0. Prerequisites

```powershell
winget install Grafana.k6   # one-time
```

Environment variables (server side, e.g. `.env` of the app you test against):

| Var | Purpose |
|---|---|
| `LOADTEST_SECRET` | Required. Route returns **403 without it** (fail-closed). |
| `ORDER_TX_ISOLATION` | `Serializable` (default) or `ReadCommitted` — the A/B lever. |

⚠️ Always run against a **staging/local database**, never production.
⚠️ Use a **production build** (`npm run build && npm start`) — dev-mode numbers are meaningless.

## 1. Seed + create the test user

```powershell
npx tsx scripts/seed-loadtest.ts
```

Creates (idempotently): category, hot product `loadtest-hot` (stock 10k),
50 spread products `loadtest-spread-001…050`, shipping method `LoadTest Standard`,
and prints the test-user credentials. Then sign the user up once via the real
auth endpoint (better-auth needs its account/credential rows):

```powershell
curl -X POST http://localhost:3000/api/auth/sign-up/email `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"loadtester@mds.test\",\"password\":\"LoadTest123!\",\"name\":\"Load Tester\"}'
```

(Skip if it already exists — the seed script tells you.)

## 2. Run scenarios

```powershell
$env:BASE_URL="http://localhost:3000"; $env:LOADTEST_SECRET="<your-secret>"

# Hot burst: N orders/second all buying the SAME product (contention)
k6 run -e HOT_RPS=100 -e HOT_DURATION=2m tests/load/checkout.k6.js

# Spread: same rate across 50 different products (healthy path)
k6 run -e SCENARIO=spread -e SPREAD_RPS=100 tests/load/checkout.k6.js

# Soak: ramp to sustained mixed load for 15 minutes
k6 run -e SCENARIO=soak -e SOAK_RPS=30 tests/load/checkout.k6.js
```

Ramp rates gradually (10 → 50 → 100 → 200 rps) and record at each step.

## 3. What to record per run

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

## 4. The experiment: Serializable vs ReadCommitted

1. Baseline: server runs default (`ORDER_TX_ISOLATION` unset = Serializable).
   Run **hot** at increasing rates; note where BUSY outcomes appear and p95.
2. Restart the app with `ORDER_TX_ISOLATION=ReadCommitted`.
   Repeat the exact same rates.
3. Compare tables. Decision rule:
   - ReadCommitted meaningfully lowers BUSY% and p95 → adopt it.
     Oversell safety is unchanged (the atomic conditional decrement guards
     stock under ANY isolation level).
   - No measurable difference → keep Serializable for the stronger guarantee.

## 5. Verify zero oversell after every hot run

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
- Single shared test user is intentional: user identity doesn't affect row
  contention on products. Re-run with several users if you suspect otherwise.
- k6 `constant-arrival-rate` measures requests/second — `*_RPS`, not VUs.
