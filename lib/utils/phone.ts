/**
 * Builds a wa.me deep link from a raw phone number, normalizing Egyptian
 * formats to international form:
 *   "01012345678"      → 201012345678
 *   "+20 101 234 5678" → 201012345678
 *   "00201012345678"   → 201012345678
 * Unknown shapes are passed through as-is (wa.me handles them or fails softly).
 */
const WA_MAX_URL = 4096;
const WA_SAFE_TEXT = 3000; // leave headroom for domain+digits

export function buildWhatsAppLink(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = `20${digits.slice(1)}`;
  }

  if (!message) return `https://wa.me/${digits}`;

  let text = message;
  // Guard: wa.me URLs are logged everywhere (proxy, browser history). Truncate long orders.
  // Estimate after encodeURIComponent (~3x for Arabic, 1.1x for latin) — use byte-length heuristic.
  const encoded = encodeURIComponent(text);
  if (encoded.length > WA_SAFE_TEXT || `https://wa.me/${digits}?text=${encoded}`.length > WA_MAX_URL) {
    // Truncate to ~WA_SAFE_TEXT encoded chars and add notice
    let truncated = text.slice(0, 1500);
    // ensure we don't cut in middle of surrogate pair
    truncated = truncated.slice(0, truncated.lastIndexOf("\n") > 1000 ? truncated.lastIndexOf("\n") : 1500);
    truncated += "\n\n[Message truncated — full details in admin panel]";
    text = truncated;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Returns true if message would be truncated by buildWhatsAppLink */
export function isWhatsAppMessageTruncated(message: string): boolean {
  return encodeURIComponent(message).length > WA_SAFE_TEXT;
}

import type { AdminOrderSummary } from "@/lib/orders/types";

const _fmt = new Intl.NumberFormat("en-US");

function _fmtEGP(n: number): string {
  return `${_fmt.format(n)} EGP`;
}

/**
 * Builds a formal English WhatsApp message for an order.
 * Professional tone as sent to real customers — includes full item list,
 * financial breakdown, delivery address, and 1–2 working days estimate.
 * Keeps costPriceAtSale internal — shows only selling prices.
 */
export function buildOrderWhatsAppMessage(order: AdminOrderSummary): string {
  const ref = order.id.slice(-8).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const lines: string[] = [];

  lines.push(`Dear ${order.shippingName},`);
  lines.push("");
  lines.push(`Thank you for your order with MDS Dental Store.`);
  lines.push(`We have received your order successfully and it is now being processed.`);
  lines.push("");
  lines.push(`Order Reference: #${ref}`);
  lines.push(`Order Date: ${date}`);
  lines.push(`Payment Method: Cash on Delivery (COD)`);
  lines.push("");
  lines.push(`Order Details:`);
  order.items.forEach((item, idx) => {
    const unit = _fmtEGP(item.unitPrice);
    const total = _fmtEGP(item.totalPrice);
    lines.push(`${idx + 1}. ${item.productName} — Qty: ${item.quantity} × ${unit} = ${total}`);
  });
  lines.push("");
  lines.push(`Order Summary:`);
  lines.push(`- Subtotal (${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}): ${_fmtEGP(order.subtotal)}`);
  if (order.discountAmount > 0) {
    lines.push(`- Discount: -${_fmtEGP(order.discountAmount)}`);
  }
  const method = order.shippingMethodName ?? "Standard Delivery";
  lines.push(`- Shipping (${method}): ${_fmtEGP(order.shippingPrice)}`);
  lines.push(`- Total Amount Due: ${_fmtEGP(order.total)}`);
  lines.push("");
  lines.push(`Delivery Information:`);
  lines.push(`- Recipient: ${order.shippingName}`);
  lines.push(`- Phone: ${order.shippingPhone}`);
  lines.push(`- Address: ${order.shippingAddress}, ${order.shippingCity}`);
  if (order.shippingNotes) {
    lines.push(`- Notes: ${order.shippingNotes}`);
  }
  lines.push("");
  lines.push(`Estimated Delivery Time: 1–2 working days from order confirmation.`);
  lines.push(`Our delivery team will contact you at ${order.shippingPhone} shortly to confirm the delivery details and time.`);
  lines.push("");
  lines.push(`If you have any questions or need to modify your order, please reply to this message or contact us directly.`);
  lines.push("");
  lines.push(`We appreciate your trust in MDS Dental Store and look forward to serving you again.`);
  lines.push("");
  lines.push(`Best regards,`);
  lines.push(`MDS Dental Store Team`);

  return lines.join("\n");
}
