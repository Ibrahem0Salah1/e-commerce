For this, code will explain the concepts far better than prose. I'll build it in two parts: the schema addition for shipping methods, then the actual createOrder action showing how all six requirements interlock.

Quick answer to your question 6 first: yes, use a table, not an enum. Enums are for values that never change without a code deploy (like OrderStatus). Shipping options with owner-configurable prices need to live in the DB so the owner can edit them without you touching code.

Created 2 files, ran a command, read a file
The two things you specifically asked about, explained

Idempotency (#3): You've got it right conceptually. The trick is doing it in two layers: a quick pre-check before the transaction (fast, good UX for the common "user clicked twice" case), and relying on the @unique constraint on idempotencyKey as the real guarantee — because two identical requests can both pass the pre-check if they arrive in the same instant. The DB unique constraint is what actually can't be raced.

Race condition on stock (#4): This is the important one. The naive approach — "read the stock, check if enough, then write the new stock" — has a gap between the read and the write where two requests can both read "1 left" and both think they succeeded. The fix is to never separate the check from the write: updateMany({ where: { stock: { gte: quantity } }, data: { decrement } }) performs the check and the write as a single atomic database operation. Postgres guarantees only one concurrent request can satisfy that WHERE clause for the last unit — the other gets count: 0 back, telling you it lost the race, and you throw OUT_OF_STOCK for them to retry or get told the item's gone. I also wrapped everything in a Serializable transaction as a second layer of protection.

A few things you'll need to fill in based on your actual Product/Coupon schemas (I inferred field names like product.price, product.costPrice, coupon.type) — swap those for whatever your real models use. Also worth adding: a cron or webhook to auto-cancel PENDING orders after some timeout and restore the stock, in case a user abandons checkout after stock was already decremented.

Schema additions
PRISMA 
Create order action
TS 

what do u think? are we missing something? based on ur experince and ur big data's brain xD. what other devploers think about and what we should expect of edge cases that may happen?

Thought for 27s

Good question to ask before writing more code. Here's what's still on the table, roughly ordered by how much I've seen these actually bite people in production:

1. Stock reservation vs. stock confirmation — this is the big one. Right now stock gets decremented the moment PENDING order is created, before payment is confirmed. If a user abandons checkout (closes tab, payment gateway times out, bank declines), that stock stays locked away from other buyers indefinitely — you're essentially reselling nothing. You need a cleanup job: a cron/queue worker that finds PENDING orders older than, say, 15-30 minutes with no successful payment and cancels them, restoring stock in the same transaction. This is the flip side of the atomic decrement you just built — decrementing safely is only half the story, you also need reliable un-decrementing.

2. Payment webhook idempotency. Whatever gateway you use (Paymob, Stripe, etc.), it will deliver the same webhook event more than once eventually — that's documented behavior, not a bug on their end. Your webhook handler needs its own idempotency check (e.g., store processed event IDs) or you'll risk double-fulfilling an order or double-crediting something. Also: always verify the webhook signature — an unauthenticated /api/webhooks/payment route that just trusts the payload is a direct path to "mark my own order as paid."

3. Ownership check on the idempotency pre-check. Small but real bug in what I gave you: the pre-check findUnique({ where: { idempotencyKey } }) returns whatever order has that key, without checking it belongs to the requesting user. If two different users' clients ever generated the same key (bad UUID randomness, replayed request, etc.), user A could get user B's order details back. Cheap fix: add userId to that lookup, or verify existingOrder.userId === userId before returning it.

4. Coupon race condition — same class of bug as stock. If a coupon has a usage limit (maxUses: 100), checking "has it been used < 100 times" and then incrementing afterward has the exact same TOCTOU gap as stock did. Needs the same atomic updateMany treatment: where: { usageCount: { lt: maxUses } }, data: { increment: 1 } }.

5. Duplicate productId entries within one cart payload. Nothing currently stops a client from sending the same product twice as separate array entries, each under your max(50) cap — quietly letting someone order 100 units through two 50-unit lines. Worth aggregating by productId (sum quantities) right after validation, before touching stock.

6. Order status as a state machine, not a free-form field. Nothing currently stops an admin action (or a bug) from moving DELIVERED → PENDING or CANCELLED → SHIPPED. Worth a small allowedTransitions map you check server-side before any status update — cheap insurance against weird support-tool bugs.

7. Serializable transaction retries. Serializable isolation is great for correctness but Postgres will abort a transaction with a serialization failure (P2034 in Prisma) under real concurrent load rather than silently queue it. Your createOrder needs to catch that specific error and retry the whole transaction a few times (2-3 attempts with small backoff) — otherwise a burst of simultaneous orders on the same popular product will show real users a hard failure instead of a quick retry.

8. Price drift between "add to cart" and "checkout." If a product's price changes while it's sitting in someone's cart, you're already safe (you always re-read price from DB), but you may want to tell the user their total changed rather than silently charging a different amount than what they saw on the cart page — better UX, avoids "why was I charged more" support tickets.

9. Suspended/banned users. If you ever add account suspension, remember the session check only confirms who they are, not whether they're currently allowed to order — worth a quick user.status === 'ACTIVE' check alongside auth.

10. Rate limiting the checkout route itself. Separate from the stock race, someone scripting repeated checkout requests (even with different idempotency keys) can hammer your DB or scalp limited-stock items. A basic per-user/per-IP rate limit on createOrder is worth adding early.

If I had to pick the two to do before shipping this feature: the stale-PENDING-order cleanup job and the coupon race condition — both are the same bug class as the stock issue you already solved, just hiding in different fields. Everything else is good hardening but less likely to cause a visible incident on day one.

i think we should add two more tables => 
1-payment status => that can be enum
2- payment method => that the user can choose, but rn and for that mvp and by a request of the owner we only gonna use COD method only
answers to ur points =>
1-the order 's payment method is gonna be COD so it's not a realted time isuue because the payment will be updated by the admin once the order is delivered and completed, but what we should do is a worker that if the user cancelled an order the stock should be reversed and reinvalidated. (actually i don't wanna add a feat for a user to cancel an order, that makes them easily can cancel an order. otherwise, i make this feat only for admin to cancel an order. and the user can only call or contact the stackholders to cancel it) 
2- no payment webhook for now and no paymob, only COD.
3-valid pint => add it
4-at mvp we are not gonna use copuns for now
5-explain more pint of about duplicate productId
6- valid point => noted
7-explain more the Serializable transaction retries. and why we need it and give me example or two in easy words
8-valid point => noted 
9-valid point => add it
10-valid point gonna add it
also talk to me more about captcha (google recaptch) do i need it? someone talked to me about it but is it needed really in ordering? and if not, i also in some sort of websites i found a cloudflare loading i think it's seeing if u are a real user or something? or if ur ip adress is valid? idk what was that but it's some sort of securtiy, so how can i use that cloudflare option and what is it actually and is it free? once i get my domain on cloudflare can i use that feat of cloudflare?

Thought for 10s

Great, COD actually simplifies a lot of what we discussed (no webhook race, no payment gateway trust issues) — but it introduces its own specific risk that we should talk about at the end. Let's go through everything.

Schema: PaymentStatus + PaymentMethod
Schema additions for PaymentStatus and PaymentMethod, structured to support COD now and more methods later without a migration rewrite
Point 1 — Cancellation & stock reversal, admin-only

Good call restricting cancellation to admin — that removes an entire class of abuse (users gaming stock by repeatedly ordering/cancelling to hold inventory hostage from other buyers). The logic:

typescript
// admin-only action, gated by role check
export async function adminCancelOrder(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "ADMIN") {
    throw new OrderError("Unauthorized", "AUTH");
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderError("Order not found", "VALIDATION");
    if (order.status === "CANCELLED") return; // already cancelled, no-op (idempotent)
    if (order.status === "DELIVERED") {
      throw new OrderError("Cannot cancel a delivered order", "VALIDATION");
    }

    // reverse stock for every item
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}

You don't need a "worker" for this specifically since it's an explicit admin action, not time-based — the worker is only needed for stale PENDING orders nobody ever confirmed (a customer who fills the form but never actually submits, or a bug leaves it dangling). That one's still worth having on a cron, since with COD there's no payment step that would naturally clean things up.

Point 5 — Duplicate productId, explained with an example

Say your cart validation allows up to 50 units per line item, and the client sends:

json
"items": [
  { "productId": "prod_123", "quantity": 50 },
  { "productId": "prod_123", "quantity": 50 }
]

Both entries individually pass your .max(50) rule — but together, someone just ordered 100 units of prod_123 in a single checkout, in two separate OrderItem rows, and your stock decrement loop runs twice against the same product. It'll still be safe (no exploit, no negative stock — the atomic guard still works fine per-line) but it's messy: it creates two OrderItem database rows for what should be one line, it makes your "max 50 per item" business rule meaningless since it's trivially bypassed by splitting quantity across duplicate entries, and it makes order emails/receipts show the same product twice instead of once with combined quantity. The fix is one line, right after validation:

typescript
const mergedItems = Object.values(
  input.items.reduce((acc, item) => {
    acc[item.productId] = acc[item.productId]
      ? { ...acc[item.productId], quantity: acc[item.productId].quantity + item.quantity }
      : item;
    return acc;
  }, {} as Record<string, typeof input.items[number]>)
);
// then re-check the max(50) rule AFTER merging, and use mergedItems everywhere below
Point 7 — Serializable retries, in easy terms

Think of Serializable isolation as Postgres's strictest promise: "I guarantee this transaction behaves as if it ran completely alone, with no other transaction happening at the same time — even if others actually were." To keep that promise when two transactions genuinely conflict, Postgres doesn't try to cleverly merge them — it just aborts one of them and tells your app "sorry, try again," rather than risk giving you a subtly wrong result.

Example 1 — two orders on the last unit of a product, arriving in the same millisecond. Even though your updateMany guard already prevents negative stock, Postgres running in Serializable mode might still decide the two transactions' overall set of reads/writes can't be cleanly ordered relative to each other, and abort one with a 40001 serialization failure error (Prisma surfaces this as error code P2034). The losing request didn't do anything wrong — it just needs to be retried, and on retry it'll see the updated stock and correctly fail with your normal OUT_OF_STOCK error instead.

Example 2 — admin cancelling an order at the exact moment a customer's createOrder transaction is reading that same product's stock row. One is incrementing stock (cancel/reversal), the other is decrementing it (new order) — Postgres may abort one to guarantee neither sees a "torn," half-updated state.

Without retry logic, that abort surfaces to your user as a raw 500 error on an innocent request — annoying, and support tickets will say "the site is buggy" when really it briefly collided with another request. The fix is small: wrap the transaction call in a retry loop.

typescript
async function createOrderWithRetry(input: unknown, attempts = 3): Promise<ReturnType<typeof createOrder>> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await createOrder(input);
    } catch (err) {
      const isSerializationFailure =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (!isSerializationFailure || i === attempts - 1) throw err; // real error, or out of retries — bubble up
      await new Promise((r) => setTimeout(r, 50 * (i + 1))); // small backoff: 50ms, 100ms, 150ms
    }
  }
  throw new Error("unreachable");
}

This is rare in practice unless you get real concurrent traffic on the same product, but it costs almost nothing to add and turns a scary user-facing crash into an invisible 100ms retry.

reCAPTCHA / Cloudflare Turnstile — and why this actually matters more for you because of COD

Here's the thing nobody tells people until it happens to them: COD-only stores are the #1 target for fake-order spam and prank orders, far more than card-payment stores. Why? Because placing a fake order costs the attacker literally nothing — no card, no payment gate, just a form submission. A bored person, a competitor, or a bot script can flood your createOrder endpoint with hundreds of fake COD orders in minutes: fake names, fake addresses, real or fake phone numbers. Best case it's just annoying inventory noise (your stock gets decremented for orders that'll never be picked up); worst case it's someone deliberately harassing you or a rival business spamming to hurt your fulfillment operations. So yes — for a COD checkout specifically, bot/spam protection is not optional-nice-to-have, it's close to essential.

Do you need Google reCAPTCHA specifically? No — Cloudflare Turnstile is the better modern choice and directly answers your second question:

What that "Cloudflare loading" screen you saw actually is: it's Cloudflare sitting in front of a website as a reverse proxy, and before letting a request reach the real server, it runs a quick behind-the-scenes check (browser fingerprinting, JS challenge, sometimes a visible "verify you're human" widget) to decide if the visitor looks like a bot or a real browser. That's Cloudflare Turnstile (their reCAPTCHA alternative — free, no annoying "click all the traffic lights" puzzles, just a quiet background check in most cases) combined with their general Bot Fight Mode / WAF (Web Application Firewall).

How to get it, step by step:

Once your domain is added to Cloudflare (free plan) and DNS is proxied through them (the orange cloud icon, not grey), you automatically get: basic DDoS protection, a WAF with managed rulesets, and Bot Fight Mode — all free, no code changes needed, it just filters traffic before it reaches Vercel.
For the checkout form specifically, go to the Cloudflare dashboard → Turnstile → create a new widget for your domain. It's free with generous limits.
Add the Turnstile widget to your checkout form client-side (small script + a <div>), and verify the token server-side in your createOrder action before processing — reject the request if verification fails. This is the same pattern as reCAPTCHA v3: invisible to legitimate users almost all the time, blocks scripted/bot submissions.

Is it free? Yes — Turnstile itself is free with no meaningful volume cap for a store your size, and Cloudflare's free plan covers the DNS proxying, basic WAF, and Bot Fight Mode. You'd only pay if you wanted their Pro/Business tiers for more advanced WAF rules or analytics, which you don't need yet.

Where I'd actually put it, practically: on the checkout submit button specifically (not every page — that'd hurt UX for no reason), plus rate-limiting the createOrder server action itself (point 10 from before) as a second, code-level layer — Turnstile stops most bots at the edge, rate limiting catches anything that gets through or comes from a real-but-abusive human clicking fast.


code snippets => "use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // your better-auth instance
import { headers } from "next/headers";

// ── 1. VALIDATE THE SHAPE OF WHAT THE CLIENT SENDS ──────────────────────────
// Notice: no price fields here. The client tells us WHAT they want (productId,
// quantity, variant, shipping method, shipping info) — never HOW MUCH it costs.
// Price is always derived server-side from the DB, per your schema comment.

const cartItemInput = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(50), // sane upper bound stops absurd orders
});

const createOrderInput = z.object({
  idempotencyKey: z.string().uuid(), // client generates this ONCE per checkout attempt
  items: z.array(cartItemInput).min(1, "Cart is empty"),
  shippingMethodId: z.string().cuid(),
  couponCode: z.string().trim().min(1).optional(),
  shipping: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^01[0-2,5]{1}[0-9]{8}$/, "Invalid phone number"), // adjust to your locale
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(100),
    notes: z.string().trim().max(500).optional(),
  }),
});

type CreateOrderInput = z.infer<typeof createOrderInput>;

// ── ERROR TYPE so the client can distinguish "stock ran out" from "validation failed" ──
class OrderError extends Error {
  constructor(
    message: string,
    public code: "AUTH" | "VALIDATION" | "OUT_OF_STOCK" | "INVALID_ITEM" | "DUPLICATE" | "SHIPPING_INVALID"
  ) {
    super(message);
  }
}

export async function createOrder(rawInput: unknown) {
  // ── 2. REQUIRE AN AUTHENTICATED SESSION ───────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new OrderError("You must be signed in to place an order", "AUTH");
  }
  const userId = session.user.id;

  // ── 3. VALIDATE THE INPUT SHAPE (form data, cart items) ───────────────────
  const parsed = createOrderInput.safeParse(rawInput);
  if (!parsed.success) {
    throw new OrderError(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION");
  }
  const input: CreateOrderInput = parsed.data;

  // ── 4. IDEMPOTENCY CHECK — has this exact checkout attempt already succeeded? ──
  // This handles the "user double-clicked Pay" / "network retried the request" case.
  // We check BEFORE the transaction to fail fast, and rely on the @unique constraint
  // on idempotencyKey as the real guarantee (see step 8) in case two requests race
  // past this check at the exact same millisecond.
  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existingOrder) {
    // Not an error — return the already-created order. This makes retries safe.
    return { orderId: existingOrder.id, status: existingOrder.status, alreadyExisted: true };
  }

  // ── 5. EVERYTHING BELOW RUNS IN ONE TRANSACTION ────────────────────────────
  // Why a transaction: if stock decrement succeeds but order creation fails
  // (e.g. a validation error midway), we do NOT want stock permanently reduced
  // for an order that was never actually placed. All-or-nothing.
  const result = await prisma.$transaction(
    async (tx) => {
      // -- 5a. Fetch the shipping method fresh from DB (never trust a client-sent price) --
      const shippingMethod = await tx.shippingMethod.findUnique({
        where: { id: input.shippingMethodId },
      });
      if (!shippingMethod || !shippingMethod.isActive) {
        throw new OrderError("Selected shipping method is unavailable", "SHIPPING_INVALID");
      }

      // -- 5b. Fetch all requested products fresh from DB in one query --
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      // Make sure every productId the client sent actually exists and is purchasable
      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product || !product.isActive) {
          throw new OrderError(`One of the items in your cart is no longer available`, "INVALID_ITEM");
        }
      }

      // -- 6. RACE-CONDITION-SAFE STOCK DECREMENT ────────────────────────────
      // The dangerous scenario: two users buy the LAST unit of a product at the
      // same instant. If we do "read stock, check if >= quantity, then write",
      // BOTH requests can read stock=1 before either writes — both think they
      // succeeded, and stock goes negative. This is a classic TOCTOU
      // (time-of-check-to-time-of-use) race condition.
      //
      // The fix: use a single ATOMIC conditional UPDATE instead of read-then-write.
      // updateMany's WHERE clause is evaluated by Postgres atomically against the
      // CURRENT row state at the moment of the write — so only one of the two
      // concurrent transactions can satisfy `stock >= quantity` for the last unit.
      // The other gets `count: 0` back and we know it lost the race.
      for (const item of input.items) {
        const decrementResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity }, // <-- the atomic guard
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (decrementResult.count === 0) {
          // Either stock was insufficient, or another concurrent request
          // just took the remaining units between our fetch and this write.
          throw new OrderError(
            `Not enough stock for one of your items — someone may have just purchased it`,
            "OUT_OF_STOCK"
          );
        }
      }

      // -- 5c. Compute prices SERVER-SIDE — never from client input --
      let subtotal = new Prisma.Decimal(0);
      const orderItemsData = input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = product.price; // Decimal from DB, trusted source
        const totalPrice = unitPrice.mul(item.quantity);
        subtotal = subtotal.add(totalPrice);

        return {
          productId: product.id,
          productName: product.name,
          variantName: product.variantName ?? "",
          unitPrice,
          totalPrice,
          costPriceAtSale: product.costPrice ?? null,
          quantity: item.quantity,
        };
      });

      // -- 5d. Validate + apply coupon (server-side lookup, never trust a client discount amount) --
      let discountAmount = new Prisma.Decimal(0);
      let couponId: string | null = null;
      let couponCode: string | null = null;

      if (input.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode } });
        const now = new Date();
        const isValid =
          coupon &&
          coupon.isActive &&
          (!coupon.expiresAt || coupon.expiresAt > now) &&
          (!coupon.minOrderAmount || subtotal.gte(coupon.minOrderAmount));

        if (!isValid) {
          throw new OrderError("Coupon is invalid or expired", "VALIDATION");
        }

        discountAmount = coupon.type === "PERCENTAGE"
          ? subtotal.mul(coupon.value).div(100)
          : coupon.value;
        couponId = coupon.id;
        couponCode = coupon.code;
      }

      const total = subtotal.sub(discountAmount).add(shippingMethod.price);

      // -- 5e. Create the order + items together --
      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          idempotencyKey: input.idempotencyKey,
          subtotal,
          discountAmount,
          total,
          couponId,
          couponCode,
          shippingMethodId: shippingMethod.id,
          shippingPrice: shippingMethod.price,
          shippingName: input.shipping.name,
          shippingPhone: input.shipping.phone,
          shippingAddress: input.shipping.address,
          shippingCity: input.shipping.city,
          shippingNotes: input.shipping.notes,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      return order;
    },
    {
      // Serializable isolation adds an extra layer of protection on top of the
      // atomic updateMany guard above — Postgres will abort and retry the whole
      // transaction if it detects a conflicting concurrent write it can't reconcile.
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  ).catch((err) => {
    // The @unique constraint on idempotencyKey is the FINAL safety net: if two
    // identical requests somehow both pass the pre-check above and reach the
    // transaction at the same time, Postgres itself rejects the second insert.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new OrderError("This order was already submitted", "DUPLICATE");
    }
    throw err;
  });

  return { orderId: result.id, status: result.status, alreadyExisted: false };
}


suggested toDO List =>
Here's the full build checklist, organized in the order you'd actually build it.

1. Schema (Prisma)
 Add ShippingMethod model (id, name, price, isActive, sortOrder)
 Add shippingMethodId + shippingPrice (snapshot) fields to Order
 Add PaymentStatus enum (UNPAID, PAID, REFUNDED, FAILED)
 Add PaymentMethod enum (COD only for now)
 Add paymentMethod, paymentStatus, paidAt fields to Order
 Add UserStatus enum (ACTIVE, SUSPENDED) + status field on User
 Confirm idempotencyKey is @unique (already is)
 Run prisma migrate dev --name add_shipping_payment_status locally, verify it applies cleanly
 Seed ShippingMethod table with your 3 real options (University A, University B, Clinic) + real prices
2. Backend — createOrder server action
 Auth check via auth.api.getSession() — reject if no session
 Check session.user.status === "ACTIVE" — reject suspended users
 Zod schema for input: idempotencyKey (uuid), items[], shippingMethodId, shipping{name, phone, address, city, notes?} — no price fields anywhere
 Merge duplicate productId entries in items[] before any further processing, then re-validate max-quantity rule on merged result
 Idempotency pre-check: findUnique({ where: { idempotencyKey } }) — and verify existingOrder.userId === session.user.id before returning it (the ownership-leak fix)
 Fetch ShippingMethod fresh from DB inside the transaction, reject if missing/inactive
 Fetch all Product rows fresh from DB inside the transaction, reject if any missing/inactive
 Atomic stock decrement per item: updateMany({ where: { id, stock: { gte: quantity } }, data: { decrement } }), check count === 0 → throw OUT_OF_STOCK
 Compute subtotal, total server-side from DB prices only (total = subtotal + shippingPrice, no discount logic for MVP)
 Create Order + OrderItem[] in the same transaction, paymentMethod: "COD", paymentStatus: "UNPAID", status: "PENDING"
 Wrap $transaction call with isolationLevel: Serializable
 Catch P2002 (unique constraint) → throw DUPLICATE error
 Wrap the whole thing in a retry loop (2–3 attempts, small backoff) catching P2034 (serialization failure)
 Rate-limit the action itself (per-user and/or per-IP — Upstash Ratelimit or similar works well with Vercel)
 Verify Cloudflare Turnstile token server-side before doing anything else — reject if invalid
3. Backend — admin actions
 adminCancelOrder(orderId) — gate on session.user.role === "ADMIN"
 Inside transaction: reverse stock for every OrderItem (increment by quantity)
 Set status: "CANCELLED", cancelledAt: new Date()
 Make it idempotent — no-op if already CANCELLED, reject if already DELIVERED
 adminMarkOrderPaid(orderId) — sets paymentStatus: "PAID", paidAt: new Date() (called once COD is collected)
 adminUpdateOrderStatus(orderId, newStatus) — enforce an allowedTransitions map (e.g. PENDING → CONFIRMED → SHIPPED → DELIVERED, CANCELLED reachable from PENDING/CONFIRMED only) — reject illegal jumps

 Rate limit createOrder (and ideally the cleanup-worker endpoint) at the app layer too
 Confirm better-auth session cookie has httpOnly, secure (prod), and appropriate sameSite
 Double-check no NEXT_PUBLIC_* env var accidentally holds a secret
6. Frontend — React Hook Form + Zod
 Define a client-side mirror of your input Zod schema (same shape as the server one, minus idempotencyKey/session stuff) — this is for UX only, the server re-validates independently and is the real gate
 useForm({ resolver: zodResolver(checkoutSchema) })
 Cart step: pull items from your cart state (context/Zustand/whatever you're using) — display only, quantities editable, but remember: whatever the client shows is irrelevant to price, server recalculates everything
 Shipping info step: controlled fields for name, phone, address, city, notes — bind via register(), show Zod error messages inline per field
 Shipping method step: fetch active ShippingMethod[] from a server component/route, render as radio group (University A / University B / Clinic), bound via Controller since it's not a plain input
 Generate idempotencyKey once when the checkout form mounts (useState(() => crypto.randomUUID())), not on every render — this is what makes double-submit-safe retries work
 Disable the submit button immediately on click (isSubmitting from RHF) to reduce accidental double-submits at the UI layer, in addition to the server-side idempotency guarantee
 On submit: call createOrder(formData) server action, handle each OrderError.code distinctly in the UI (OUT_OF_STOCK → "this item just sold out, remove it and continue," SHIPPING_INVALID → refetch shipping methods, DUPLICATE → treat as success, AUTH → redirect to login)
 On success: clear cart state, redirect to an order confirmation page showing the order ID, total (including calculated shipping price), and "pay on delivery" messaging
 Render the Turnstile widget inside the form, include its response token as a hidden field submitted alongside the rest
7. Nice-to-have, not blocking MVP
 Order confirmation email/SMS (even a simple one) so users have proof of their order without needing an account
 Admin dashboard order list filterable by status + paymentStatus
 Basic analytics on cancelled/stale orders to catch abuse patterns early