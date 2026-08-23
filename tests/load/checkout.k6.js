// tests/load/checkout.k6.js
//
// Load-test scenarios for the checkout hot path (POST /api/internal/loadtest/order),
// which runs the EXACT production order-creation pipeline (validation â†’
// idempotency â†’ transactional execution with P2034 retries).
//
// Prereqs (see tests/load/README.md):
//   1. k6 installed            â†’ winget install Grafana.k6  (or brew install k6)
//   2. App running (prod build)â†’ BASE_URL env (default http://localhost:3000)
//   3. LOADTEST_SECRET set on the server AND passed here
//   4. Seed data               â†’ npx tsx scripts/seed-loadtest.ts
//   5. Test user created       â†’ curl sign-up command in README
//
// Scenarios:
//   hot    â€” every VU buys the SAME product. Measures serialization contention,
//            busy-rate, and proves zero oversell under race conditions.
//   spread â€” each VU buys its OWN product. Healthy-case throughput/p95.
//   soak   â€” sustained mixed load to surface pool exhaustion / leaks.
//
// Usage examples:
//   k6 run -e HOT_RPS=100 -e HOT_DURATION=2m tests/load/checkout.k6.js
//   k6 run -e SCENARIO=spread -e SPREAD_RPS=50 tests/load/checkout.k6.js
//   k6 run -e SCENARIO=soak tests/load/checkout.k6.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";
import exec from "k6/execution";

// RFC4122 v4 formatter — self-contained so the script never depends on
// remote jslib modules at load time.
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const LOADTEST_SECRET = __ENV.LOADTEST_SECRET || "";
const TEST_EMAIL = __ENV.TEST_EMAIL || "loadtester@mds.test";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "LoadTest123!";

const HOT_SLUG = __ENV.HOT_SLUG || "loadtest-hot";
const SPREAD_PREFIX = __ENV.SPREAD_PREFIX || "loadtest-spread-";
const SPREAD_COUNT = Number(__ENV.SPREAD_COUNT || 50);

const SCENARIO = __ENV.SCENARIO || "hot";
const HOT_RPS = Number(__ENV.HOT_RPS || 100);
const HOT_DURATION = __ENV.HOT_DURATION || "2m";
const SPREAD_RPS = Number(__ENV.SPREAD_RPS || 50);
const SOAK_RPS = Number(__ENV.SOAK_RPS || 30);
const SOAK_DURATION = __ENV.SOAK_DURATION || "15m";

// â”€â”€ Custom  
const outcomeCounter = new Counter("checkout_outcomes");
const checkoutDuration = new Trend("checkout_duration", true);

const OUTCOME_SUCCESS = "SUCCESS";
const OUTCOME_BUSY = "BUSY"; // SERVER_ERROR after exhausting retries
const OUTCOME_OUT_OF_STOCK = "OUT_OF_STOCK";
const OUTCOME_OTHER = "OTHER";

function scenarioOptions() {
  switch (SCENARIO) {
    case "hot":
      return {
        hot: {
          executor: "constant-arrival-rate",
          rate: HOT_RPS,
          timeUnit: "1s", // HOT_RPS orders/second â€” a true arrival rate
          duration: HOT_DURATION,
          preAllocatedVUs: Math.max(HOT_RPS, 10),
          maxVUs: Math.max(HOT_RPS * 5, 50), // must stay >= preAllocatedVUs
          exec: "hotOrder",
        },
      };
    case "spread":
      return {
        spread: {
          executor: "constant-arrival-rate",
          rate: SPREAD_RPS,
          timeUnit: "1s",
          duration: __ENV.SPREAD_DURATION || "2m",
          preAllocatedVUs: Math.max(SPREAD_RPS, 10),
          maxVUs: Math.max(SPREAD_RPS * 5, 50),
          exec: "spreadOrder",
        },
      };
    case "soak":
      return {
        soak: {
          executor: "ramping-arrival-rate",
          startRate: 5,
          stages: [
            { target: SOAK_RPS, duration: "2m" },
            { target: SOAK_RPS, duration: SOAK_DURATION },
            { target: 0, duration: "1m" },
          ],
          preAllocatedVUs: SOAK_RPS * 2,
          maxVUs: SOAK_RPS * 5,
          exec: "mixedOrder",
        },
      };
    default:
      throw new Error(`Unknown SCENARIO: ${SCENARIO}`);
  }
}

export const options = {
  scenarios: scenarioOptions(),
  thresholds: {
    // Informational defaults â€” tighten after establishing baselines.
    checkout_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.25"],
  },
  tags: { scenario: SCENARIO },
};

// â”€â”€ Setup: sign in once, discover ids â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function setup() {
  if (!LOADTEST_SECRET) {
    throw new Error("LOADTEST_SECRET env var is required");
  }

  const loginRes = http.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(loginRes, { "signed in": (r) => r.status === 200 });

  const cookie = loginRes.headers["Set-Cookie"];
  if (!cookie) {
    throw new Error(
      `Sign-in failed (status ${loginRes.status}). Create the test user first â€” see README.`,
    );
  }

  const slugs = [HOT_SLUG];
  for (let i = 1; i <= SPREAD_COUNT; i++) {
    slugs.push(`${SPREAD_PREFIX}${String(i).padStart(3, "0")}`);
  }

  const discRes = http.get(
    `${BASE_URL}/api/internal/loadtest/order?slugs=${slugs.join(",")}`,
    { headers: { "x-loadtest-secret": LOADTEST_SECRET } },
  );
  check(discRes, { "discovery ok": (r) => r.status === 200 });

  const data = discRes.json();
  if (!data.shippingMethods || data.shippingMethods.length === 0) {
    throw new Error("No active shipping methods found â€” did you seed?");
  }

  const bySlug = {};
  for (const p of data.products || []) bySlug[p.slug] = p;

  if (!bySlug[HOT_SLUG]) throw new Error(`Missing seeded product: ${HOT_SLUG}`);

  return {
    cookie,
    shippingMethodId: data.shippingMethods[0].id,
    hotProductId: bySlug[HOT_SLUG].id,
    hotInitialStock: bySlug[HOT_SLUG].stock,
    spreadIds: Array.from({ length: SPREAD_COUNT }, (_, i) => {
      const slug = `${SPREAD_PREFIX}${String(i + 1).padStart(3, "0")}`;
      if (!bySlug[slug]) throw new Error(`Missing seeded product: ${slug}`);
      return bySlug[slug].id;
    }),
  };
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HEADERS = (data) => ({
  "Content-Type": "application/json",
  "x-loadtest-secret": LOADTEST_SECRET,
  Cookie: data.cookie,
});

function placeOrder(productId, data) {
  const payload = {
    idempotencyKey: uuidv4(), // unique per attempt â€” retries are NEW orders here
    items: [{ productId, quantity: 1 }],
    shippingMethodId: data.shippingMethodId,
    shippingName: "Load Tester",
    shippingPhone: "01012345678",
    shippingAddress: "Loadtest Street 1",
    shippingCity: "Cairo",
  };

  const res = http.post(
    `${BASE_URL}/api/internal/loadtest/order`,
    JSON.stringify(payload),
    { headers: HEADERS(data) },
  );

  checkoutDuration.add(res.timings.duration);

  let code = "UNKNOWN";
  let reason = "";
  try {
    const body = res.json();
    code = body.code || (res.status === 200 ? "OK" : `HTTP_${res.status}`);
    reason = body.reason || "";
  } catch (_) {
    code = `HTTP_${res.status}`;
  }

  let outcome;
  if (res.status === 200 && code !== "VALIDATION") {
    outcome = OUTCOME_SUCCESS;
  } else if (code === "SERVER_ERROR" || res.status >= 500) {
    outcome = OUTCOME_BUSY;
  } else if (code === "OUT_OF_STOCK" || code === "INVALID_ITEM") {
    outcome = OUTCOME_OUT_OF_STOCK;
  } else {
    outcome = OUTCOME_OTHER;
  }

  // reason dimension (TX_CONFLICT / DB_CONNECTION) comes from the server for
  // SERVER_ERROR outcomes; empty string otherwise.
  outcomeCounter.add(1, { outcome, reason });

  return res;
}

// â”€â”€ Scenario entry points â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function hotOrder(data) {
  placeOrder(data.hotProductId, data);
  sleep(0.2);
}

export function spreadOrder(data) {
  const ids = data.spreadIds;
  placeOrder(ids[exec.vu.idInTest % ids.length], data);
  sleep(0.2);
}

export function mixedOrder(data) {
  // Soak: 80% spread traffic, 20% hot contention
  if (exec.vu.idInTest % 5 === 0) hotOrder(data);
  else spreadOrder(data);
}
