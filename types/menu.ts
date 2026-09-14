/**
 * Menu Category domain model.
 */
export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  shortName?: string | null;
  description: string | null;
  icon: string | null;
  imageUrl?: string | null;
  badge?: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Menu item variant option (e.g. Flavor, Spiciness).
 */
export interface MenuItemVariant {
  name: string;
  price?: number | string;
  isDefault?: boolean;
}

/**
 * Menu item size pricing (e.g. Small, Medium, Large).
 */
export interface MenuItemSize {
  name: string;
  price: number | string;
}

/**
 * Menu item add-on / extra (e.g. Extra Cheese, Sauce).
 */
export interface MenuItemExtra {
  name: string;
  price: number | string;
}

/**
 * Predefined promotional badges for menu items (Single Choice).
 */
export const MENU_ITEM_BADGES = [
  "CHEF_PICK",
  "BEST_SELLER",
  "NEW",
  "SIGNATURE",
  "SPECIAL_OFFER",
] as const;

export type MenuItemBadge = (typeof MENU_ITEM_BADGES)[number];

/**
 * Predefined dietary and attribute tags for menu items (Multiple Choice).
 */
export const MENU_ITEM_TAGS = [
  "spicy",
  "vegetarian",
  "vegan",
  "gluten_free",
  "nuts",
] as const;

export type MenuItemTag = (typeof MENU_ITEM_TAGS)[number];

export interface BadgeDefinition {
  label: string;
  labelAr: string;
  icon: string;
}

export interface TagDefinition {
  label: string;
  labelAr: string;
  icon: string;
}

export const BADGE_DEFINITIONS: Record<MenuItemBadge, BadgeDefinition> = {
  CHEF_PICK: { label: "Chef's Special", labelAr: "توصية الشيف", icon: "👨‍🍳" },
  BEST_SELLER: { label: "Best Seller", labelAr: "الأكثر طلباً", icon: "⭐" },
  NEW: { label: "New", labelAr: "جديد", icon: "🔥" },
  SIGNATURE: { label: "Signature Dish", labelAr: "طبق مميز", icon: "👑" },
  SPECIAL_OFFER: { label: "Special Offer", labelAr: "عرض خاص", icon: "🏷️" },
};

export const TAG_DEFINITIONS: Record<MenuItemTag, TagDefinition> = {
  spicy: { label: "Spicy", labelAr: "حار", icon: "🌶️" },
  vegetarian: { label: "Vegetarian", labelAr: "نباتي", icon: "🥗" },
  vegan: { label: "Vegan", labelAr: "نباتي صرف", icon: "🌱" },
  gluten_free: { label: "Gluten-Free", labelAr: "خالي من الغلوتين", icon: "🌾" },
  nuts: { label: "Contains Nuts", labelAr: "يحتوي مكسرات", icon: "🥜" },
};

/**
 * Menu Item Availability state (Single Source of Truth).
 * - AVAILABLE: Shown publicly on menu and available for ordering/selection.
 * - SOLD_OUT: Shown publicly on menu with a clear "Sold Out" status badge.
 * - HIDDEN: Completely hidden and excluded from public menu rendering.
 */
export const MENU_ITEM_AVAILABILITIES = ["AVAILABLE", "SOLD_OUT", "HIDDEN"] as const;
export type MenuItemAvailability = (typeof MENU_ITEM_AVAILABILITIES)[number];

/**
 * Menu Item domain model.
 */
export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  categoryName?: string | null;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  discountStartsAt?: string | Date | null;
  discountEndsAt?: string | Date | null;
  imageUrl: string | null;
  badge?: MenuItemBadge | null;
  tags?: MenuItemTag[];
  ingredients: string[];
  availability: MenuItemAvailability;
  isVisible: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  variants: MenuItemVariant[];
  sizes: MenuItemSize[];
  extras: MenuItemExtra[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}


