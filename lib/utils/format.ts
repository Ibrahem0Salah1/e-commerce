const formatter = new Intl.NumberFormat("en-US");

export function formatNumber(n: number): string {
  return formatter.format(n);
}
