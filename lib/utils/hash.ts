/**
 * Computes SHA-256 hash hex string of a File object using Web Crypto API.
 */
export async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hexString;
}
