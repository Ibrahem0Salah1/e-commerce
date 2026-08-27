/**
 * Builds a wa.me deep link from a raw phone number, normalizing Egyptian
 * formats to international form:
 *   "01012345678"      → 201012345678
 *   "+20 101 234 5678" → 201012345678
 *   "00201012345678"   → 201012345678
 * Unknown shapes are passed through as-is (wa.me handles them or fails softly).
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2); // strip international prefix
  }
  if (digits.startsWith("0")) {
    digits = `20${digits.slice(1)}`; // local Egyptian → country code
  }

  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}
