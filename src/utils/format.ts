/** Fixed-decimal number formatting for scientific readouts (en-US digits, thousands separators). */
export function formatQuantity(value: number, digits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
