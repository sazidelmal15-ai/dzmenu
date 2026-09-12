/**
 * DZMenu Theme System V2 — Menu Presentation Mapper
 *
 * Transforms raw database models (Restaurant, Category, MenuItem) into a clean,
 * decoupled, presentation-ready MenuPresentationModel for themes.
 *
 * Themes never consume database entities directly.
 */

import type { Restaurant } from "@/types/restaurant";
import type { Category, MenuItem } from "@/types/menu";
import type {
  MenuPresentationModel,
  MenuRestaurantView,
  MenuCategoryView,
  MenuItemView,
  MenuItemDietaryView,
  MenuRestaurantScheduleView,
  OperatingHourDaySchedule,
} from "@/types/theme-contract";

export interface PresentationMapperOptions {
  locale?: string;
  currency?: string;
  includeHiddenItems?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  DZD: "DA",
  DA: "DA",
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "$",
  SAR: "SAR",
  AED: "AED",
  QAR: "QAR",
  KWD: "KWD",
  TRY: "₺",
  EGP: "EGP",
  MAD: "MAD",
  TND: "TND",
};

/**
 * Resolves standard human-readable currency symbol for a currency code.
 */
export function getCurrencySymbol(currency: string = "DZD"): string {
  const upper = (currency || "DZD").toUpperCase().trim();
  return CURRENCY_SYMBOLS[upper] || upper;
}

/**
 * Formats a numeric price with currency symbol and locale formatting.
 */
export function formatPrice(price: number, currency: string = "DZD", locale: string = "fr-DZ"): string {
  const numericPrice = typeof price === "number" && !isNaN(price) ? price : 0;
  const symbol = getCurrencySymbol(currency);

  try {
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);

    return `${formattedNumber} ${symbol}`;
  } catch {
    // Fallback if locale is unsupported
    const formattedNumber = numericPrice.toLocaleString();
    return `${formattedNumber} ${symbol}`;
  }
}

/**
 * Extracts dietary flags and badges from explicit tags/badge or legacy text heuristics.
 * Explicit badge/tags are the Source of Truth. Text heuristics are ONLY a backward-compatible fallback.
 */
export function extractDietaryAndBadges(item: MenuItem): {
  badges: string[];
  dietary: MenuItemDietaryView;
} {
  const hasExplicitTags = Array.isArray(item.tags) && item.tags.length > 0;

  let dietary: MenuItemDietaryView;

  if (hasExplicitTags) {
    // 1. Explicit tags are the authoritative Source of Truth
    const tagsSet = new Set(item.tags);
    dietary = {
      isVegetarian: tagsSet.has("vegetarian"),
      isVegan: tagsSet.has("vegan"),
      isGlutenFree: tagsSet.has("gluten_free"),
      isSpicy: tagsSet.has("spicy"),
    };
  } else {
    // 2. Fallback heuristic for legacy data with no explicit tags
    const text = `${item.name} ${item.description || ""}`.toLowerCase();
    dietary = {
      isVegetarian:
        text.includes("vegetarian") ||
        text.includes("végétarien") ||
        text.includes("نباتي"),
      isVegan:
        text.includes("vegan") ||
        text.includes("végan") ||
        text.includes("نباتي صرف"),
      isGlutenFree:
        text.includes("gluten-free") ||
        text.includes("sans gluten") ||
        text.includes("خالي من الغلوتين"),
      isSpicy:
        text.includes("spicy") ||
        text.includes("épicé") ||
        text.includes("حار") ||
        text.includes("piquant"),
    };
  }

  const badges: string[] = [];

  // Add explicit promotional badge if set
  if (item.badge) {
    badges.push(item.badge);
  }

  if (item.isFeatured && !badges.includes("Featured")) {
    badges.push("Featured");
  }

  if (dietary.isSpicy) badges.push("Spicy");
  if (dietary.isVegan) badges.push("Vegan");
  else if (dietary.isVegetarian) badges.push("Vegetarian");
  if (dietary.isGlutenFree) badges.push("Gluten-Free");

  return { badges, dietary };
}

/**
 * Days map matching the profile settings format.
 */
const DAY_INDEX_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * Calculates real-time opening status and formatted schedule text.
 */
export function calculateScheduleStatus(
  operatingHours: OperatingHourDaySchedule[] | null | undefined,
  alwaysOpen: boolean = false
): MenuRestaurantScheduleView {
  if (alwaysOpen) {
    return {
      alwaysOpen: true,
      isOpenNow: true,
      formattedHours: "Open 24/7",
      operatingHours: [],
      notice: null,
    };
  }

  const hoursArray = Array.isArray(operatingHours) ? operatingHours : [];
  if (hoursArray.length === 0) {
    return {
      alwaysOpen: false,
      isOpenNow: true,
      formattedHours: "Open",
      operatingHours: [],
      notice: null,
    };
  }

  // Calibrate with Africa/Algiers timezone (UTC+1)
  let currentDayKey = DAY_INDEX_MAP[new Date().getDay()] || "sunday";
  let currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Algiers",
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    let weekdayStr = "";
    let hourVal = 0;
    let minuteVal = 0;
    for (const p of parts) {
      if (p.type === "weekday") weekdayStr = p.value.toLowerCase();
      if (p.type === "hour") hourVal = parseInt(p.value, 10) || 0;
      if (p.type === "minute") minuteVal = parseInt(p.value, 10) || 0;
    }
    if (weekdayStr) currentDayKey = weekdayStr;
    currentMinutes = hourVal * 60 + minuteVal;
  } catch {
    // fallback to system machine time
  }

  const todaySchedule = hoursArray.find(
    (d: OperatingHourDaySchedule) => d && (d.id === currentDayKey || d.day === currentDayKey || d.label?.toLowerCase() === currentDayKey)
  );

  let isOpenNow = false;
  let formattedHours = "Closed today";
  let notice: string | null = null;

  if (todaySchedule && todaySchedule.isOpen) {
    const openTime = todaySchedule.defaultOpen || todaySchedule.open || "10:00";
    const closeTime = todaySchedule.defaultClose || todaySchedule.close || "23:00";

    const [openH, openM] = openTime.split(":").map((v: string) => parseInt(v, 10) || 0);
    const [closeH, closeM] = closeTime.split(":").map((v: string) => parseInt(v, 10) || 0);

    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    // Handle past midnight closing times (e.g. 00:00 or 01:30)
    if (closeMinutes <= openMinutes) {
      closeMinutes += 24 * 60;
    }

    const currentMinutesAdjusted =
      currentMinutes < openMinutes && closeMinutes > 24 * 60
        ? currentMinutes + 24 * 60
        : currentMinutes;

    isOpenNow = currentMinutesAdjusted >= openMinutes && currentMinutesAdjusted < closeMinutes;
    formattedHours = `${openTime} - ${closeTime}`;

    if (isOpenNow && closeMinutes - currentMinutesAdjusted <= 45) {
      notice = "Closing soon";
    }
  }

  // Normalize operating hours array for bulletproof display in all theme templates
  const normalizedHours: OperatingHourDaySchedule[] = hoursArray.map((d, idx) => {
    const dayKey = (d.id || d.day || d.label || "").toLowerCase();
    const openTime = d.open || d.defaultOpen || "10:00";
    const closeTime = d.close || d.defaultClose || "23:00";
    const label = d.label || (dayKey ? dayKey.charAt(0).toUpperCase() + dayKey.slice(1) : `Day ${idx + 1}`);

    return {
      ...d,
      id: d.id || dayKey,
      day: d.day || dayKey,
      label,
      open: openTime,
      close: closeTime,
      defaultOpen: openTime,
      defaultClose: closeTime,
      isOpen: d.isOpen !== false,
    };
  });

  return {
    alwaysOpen: false,
    isOpenNow,
    formattedHours,
    operatingHours: normalizedHours,
    notice,
  };
}

/**
 * Transforms a raw MenuItem into a decoupled MenuItemView.
 */
export function mapItemToView(item: MenuItem, currency: string, locale: string): MenuItemView {
  const { badges, dietary } = extractDietaryAndBadges(item);

  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryName: item.categoryName ?? null,
    name: item.name,
    description: item.description ?? null,
    price: Number(item.price) || 0,
    formattedPrice: formatPrice(Number(item.price) || 0, currency, locale),
    imageUrl: item.imageUrl ?? null,
    isVisible: item.isVisible ?? true,
    isAvailable: item.isAvailable ?? true,
    isFeatured: item.isFeatured ?? false,
    sortOrder: item.sortOrder ?? 0,
    variants: Array.isArray(item.variants)
      ? item.variants.map((v) => ({
          name: v.name,
          price: v.price,
          isDefault: v.isDefault,
        }))
      : [],
    sizes: Array.isArray(item.sizes)
      ? item.sizes.map((s) => ({
          name: s.name,
          price: s.price,
        }))
      : [],
    extras: Array.isArray(item.extras)
      ? item.extras.map((e) => ({
          name: e.name,
          price: e.price,
        }))
      : [],
    badges,
    badge: item.badge || null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    dietary,
  };
}

/**
 * Primary presentation model mapper.
 * Transforms database models into a fully structured, presentation-ready context.
 */
export function mapToPresentationModel(
  restaurant: Restaurant,
  categories: Category[],
  items: MenuItem[],
  options: PresentationMapperOptions = {}
): MenuPresentationModel {
  const currency = options.currency || restaurant.currency || "DZD";
  const locale = options.locale || "fr-DZ";
  const includeHidden = options.includeHiddenItems ?? false;

  // 1. Map restaurant info
  const schedule = calculateScheduleStatus(restaurant.operatingHours, restaurant.alwaysOpen);

  const restaurantView: MenuRestaurantView = {
    id: restaurant.id,
    name: restaurant.name || "Menu",
    slug: restaurant.slug,
    tagline: restaurant.tagline ?? null,
    description: restaurant.description ?? null,
    currency,
    currencySymbol: getCurrencySymbol(currency),
    locale,
    logoUrl: restaurant.logoUrl ?? null,
    coverUrl: restaurant.coverUrl ?? null,
    cuisineTypes: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
    status: restaurant.status,
    contact: {
      phone: restaurant.phone ?? null,
      whatsapp: restaurant.whatsapp ?? null,
      instagram: restaurant.instagramUrl ?? null,
      tiktok: restaurant.tiktokUrl ?? null,
      facebook: restaurant.facebookUrl ?? null,
      address: restaurant.address ?? null,
      city: restaurant.city ?? null,
      googleMapsUrl: restaurant.googleMapsUrl ?? null,
    },
    schedule,
    wifi: {
      ssid: restaurant.wifiSsid ?? null,
      password: restaurant.wifiPassword ?? null,
    },
  };

  // 2. Filter & map menu items
  const eligibleItems = items
    .filter((item) => includeHidden || (item.isVisible !== false && item.isAvailable !== false))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const mappedItems = eligibleItems.map((item) => mapItemToView(item, currency, locale));

  // Map of categoryId -> items
  const itemsByCategoryId = new Map<string, MenuItemView[]>();
  const uncategorizedItems: MenuItemView[] = [];

  for (const item of mappedItems) {
    if (item.categoryId) {
      const existing = itemsByCategoryId.get(item.categoryId) || [];
      existing.push(item);
      itemsByCategoryId.set(item.categoryId, existing);
    } else {
      uncategorizedItems.push(item);
    }
  }

  // 3. Map categories
  const sortedCategories = [...categories]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const categoryViews: MenuCategoryView[] = sortedCategories.map((c) => {
    const catItems = itemsByCategoryId.get(c.id) || [];
    return {
      id: c.id,
      name: c.name,
      shortName: c.shortName ?? null,
      description: c.description ?? null,
      icon: c.icon ?? null,
      imageUrl: c.imageUrl ?? null,
      badge: c.badge ?? null,
      sortOrder: c.sortOrder ?? 0,
      isActive: c.isActive ?? true,
      itemCount: catItems.length,
      items: catItems,
    };
  });

  // If there are uncategorized items, append a synthetic category
  if (uncategorizedItems.length > 0) {
    categoryViews.push({
      id: "uncategorized",
      name: "Other Items",
      shortName: null,
      description: null,
      icon: null,
      imageUrl: null,
      badge: null,
      sortOrder: 9999,
      isActive: true,
      itemCount: uncategorizedItems.length,
      items: uncategorizedItems,
    });
  }

  // 4. Collect featured items
  const featuredItems = mappedItems.filter((i) => i.isFeatured);

  return {
    restaurant: restaurantView,
    categories: categoryViews,
    featuredItems,
    totalItemCount: mappedItems.length,
  };
}
