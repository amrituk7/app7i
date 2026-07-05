/**
 * Format a number as a GBP currency string for UK driving instructors.
 * Whole numbers render as `£38`; non-integers as `£38.50`.
 */
export function formatGBP(amount: number | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return Number.isInteger(value) ? `£${value}` : `£${value.toFixed(2)}`;
}
