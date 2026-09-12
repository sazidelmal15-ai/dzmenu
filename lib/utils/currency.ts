/**
 * Multi-Currency Utility for DZMenu
 * Formats prices, symbols, and labels dynamically based on restaurant settings.
 */

export type CurrencyCode = "DZD" | "SAR" | "EUR" | "USD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  nameArabic: string;
  flag: string;
  position: "before" | "after";
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  DZD: {
    code: "DZD",
    symbol: "DA",
    label: "DZD (DA)",
    nameArabic: "دينار جزائري",
    flag: "🇩🇿",
    position: "after",
    decimals: 0,
  },
  SAR: {
    code: "SAR",
    symbol: "SAR",
    label: "SAR (ر.س)",
    nameArabic: "ريال سعودي",
    flag: "🇸🇦",
    position: "after",
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "EUR (€)",
    nameArabic: "يورو",
    flag: "🇪🇺",
    position: "after",
    decimals: 2,
  },
  USD: {
    code: "USD",
    symbol: "$",
    label: "USD ($)",
    nameArabic: "دولار أمريكي",
    flag: "🇺🇸",
    position: "before",
    decimals: 2,
  },
};

/**
 * Returns the short symbol for the currency (e.g. "DA", "SAR", "€", "$")
 */
export function getCurrencySymbol(currency?: string | null): string {
  const normalized = (currency || "DZD").toUpperCase() as CurrencyCode;
  return CURRENCIES[normalized]?.symbol || "DA";
}

/**
 * Formats a numeric price into a localized currency string.
 * Example:
 * formatPrice(500, "DZD") => "500 DA"
 * formatPrice(50, "SAR") => "50.00 SAR"
 * formatPrice(12.5, "USD") => "$12.50"
 * formatPrice(10, "EUR") => "10.00 €"
 */
export function formatPrice(price: number | string | null | undefined, currency?: string | null): string {
  const num = Number(price) || 0;
  const normalized = (currency || "DZD").toUpperCase() as CurrencyCode;
  const config = CURRENCIES[normalized] || CURRENCIES.DZD;

  const formattedNum = config.decimals === 0 
    ? Math.round(num).toString() 
    : num.toFixed(config.decimals);

  if (config.position === "before") {
    return `${config.symbol}${formattedNum}`;
  }

  return `${formattedNum} ${config.symbol}`;
}
