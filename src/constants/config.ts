/**
 * Global Application Configuration & Constants
 */

export const APP_CONFIG = {
  currency: {
    code: "EGP",
    symbol: "EGP",
    name: "Egyptian Pound",
  },
  restaurant: {
    name: "VOYA House",
    defaultTable: "Table 04",
  },
} as const;

export const CURRENCY = APP_CONFIG.currency.symbol;

/**
 * Format a number as a localized currency string.
 * Examples:
 *   formatPrice(25) => "25 EGP"
 *   formatPrice(28.5) => "28.50 EGP"
 */
export function formatPrice(amount: number): string {
  const formattedNumber = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return `${formattedNumber} ${CURRENCY}`;
}
