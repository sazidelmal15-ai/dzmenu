import Fuse, { IFuseOptions } from "fuse.js";

/**
 * Normalizes Arabic text by removing diacritics (Harakat/Tashkeel), Tatweel,
 * and normalizing common letter variations (Alef forms, Taa Marbuta, Alif Maqsura, Hamzas).
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";

  return (
    text
      // 1. Remove Arabic diacritics / Tashkeel & Quranic annotations:
      // \u064B-\u065F: Tanween, Fatha, Damma, Kasra, Shadda, Sukun, etc.
      // \u0670: Superscript Alef
      .replace(/[\u064B-\u065F\u0670]/g, "")
      // 2. Remove Tatweel / Kashida (ـ)
      .replace(/\u0640/g, "")
      // 3. Normalize Alef forms: [أإآٱ] -> ا
      .replace(/[أإآٱ]/g, "ا")
      // 4. Normalize Taa Marbuta: ة -> ه
      .replace(/ة/g, "ه")
      // 5. Normalize Alif Maqsura: ى -> ي
      .replace(/ى/g, "ي")
      // 6. Normalize Hamza variants: ؤ -> و, ئ -> ي
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
  );
}

/**
 * Combined normalization for multi-lingual search (Arabic + Latin / French / English).
 * Lowercases, strips diacritics, normalizes Arabic letters, and collapses whitespace.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return "";

  const str = String(text).trim().toLowerCase();
  return normalizeArabicText(str).replace(/\s+/g, " ");
}

/**
 * Searchable item wrapper for Fuse.js indexing.
 */
interface SearchableItemWrapper<T> {
  original: T;
  _normName: string;
  _normCategory: string;
  _normDesc: string;
  _normVariants: string;
  _normBadges: string;
}

export interface FuzzySearchOptions {
  threshold?: number;
}

export interface SearchableItemBase {
  id: string;
  name: string;
  description?: string | null;
  categoryName?: string | null;
  variants?: Array<{ name?: string }> | null;
  badges?: string[] | null;
}

/**
 * Perform intelligent, typo-tolerant fuzzy search on menu items using Fuse.js.
 * Supports both Latin (English/French) and Arabic with typo tolerance.
 */
export function searchMenuItems<T extends SearchableItemBase>(
  items: T[],
  query: string,
  options: FuzzySearchOptions = {}
): T[] {
  if (!items || items.length === 0) return [];

  const rawQuery = (query || "").trim();
  const normalizedQuery = normalizeSearchText(rawQuery);

  // If no query, return original items
  if (!normalizedQuery) {
    return items;
  }

  // Pre-process items with normalized fields for maximum speed and accuracy
  const searchableList: SearchableItemWrapper<T>[] = items.map((item) => {
    const rawItem = item as unknown as Record<string, unknown>;
    const variants = Array.isArray(rawItem.variants)
      ? (rawItem.variants as Array<{ name?: string }>).map((v) => v.name || "").join(" ")
      : "";
    const badges = Array.isArray(rawItem.badges) ? (rawItem.badges as string[]).join(" ") : "";

    return {
      original: item,
      _normName: normalizeSearchText(item.name),
      _normCategory: normalizeSearchText((item.categoryName as string) || ""),
      _normDesc: normalizeSearchText(item.description || ""),
      _normVariants: normalizeSearchText(variants),
      _normBadges: normalizeSearchText(badges),
    };
  });

  // Short single-character search: fast exact substring check to avoid noisy fuzzy results
  if (normalizedQuery.length === 1) {
    return searchableList
      .filter(
        (s) =>
          s._normName.includes(normalizedQuery) ||
          s._normCategory.includes(normalizedQuery) ||
          s._normDesc.includes(normalizedQuery)
      )
      .map((s) => s.original);
  }

  // Fuse.js configuration tuned for menu items (Dish names highest, followed by category & description)
  const fuseOptions: IFuseOptions<SearchableItemWrapper<T>> = {
    keys: [
      { name: "_normName", weight: 0.65 },
      { name: "_normCategory", weight: 0.2 },
      { name: "_normDesc", weight: 0.1 },
      { name: "_normVariants", weight: 0.05 },
    ],
    threshold: options.threshold ?? 0.35, // 0.35 allows typos like "croisant" or "كبتشينو" without noisy mismatches
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 2,
    shouldSort: true,
    includeScore: true,
  };

  const fuse = new Fuse(searchableList, fuseOptions);
  const results = fuse.search(normalizedQuery);

  // Direct exact substring matches get an extra boost to always rank first
  const exactMatches: T[] = [];
  const fuzzyMatches: T[] = [];

  for (const res of results) {
    const isDirectMatch =
      res.item._normName.includes(normalizedQuery) ||
      res.item._normCategory.includes(normalizedQuery);

    if (isDirectMatch) {
      exactMatches.push(res.item.original);
    } else {
      fuzzyMatches.push(res.item.original);
    }
  }

  return [...exactMatches, ...fuzzyMatches];
}

/**
 * Filter categories and items with fuzzy search.
 * - When query is empty: filters strictly by selectedCategoryId (if supplied and not "all").
 * - When query is present:
 *   - Searches across active categories.
 *   - If searchCategoryFilter is given (not "all"): filters to that specific category's matches.
 *   - Otherwise: returns all categories with matching items.
 */
export function filterCategoriesWithSearch<
  T extends SearchableItemBase,
  C extends { id: string; name: string; items: T[]; isActive?: boolean }
>(
  categories: C[],
  query: string,
  selectedCategoryId?: string | null,
  searchCategoryFilter?: string | null
): C[] {
  const trimmed = (query || "").trim();
  const activeCats = categories.filter((c) => (c.isActive !== undefined ? c.isActive : true));

  // Mode 1: No search query -> Standard category browsing
  if (!trimmed) {
    return activeCats
      .map((cat) => {
        if (selectedCategoryId && selectedCategoryId !== "all" && cat.id !== selectedCategoryId) {
          return { ...cat, items: [] };
        }
        return cat;
      })
      .filter((cat) => cat.items.length > 0);
  }

  // Mode 2: Search query active -> Fuzzy search across items
  const allItems: T[] = [];
  const itemToCatMap = new Map<string, string>();

  for (const cat of activeCats) {
    for (const item of cat.items) {
      allItems.push(item);
      itemToCatMap.set(item.id, cat.id);
    }
  }

  const matchedItems = searchMenuItems(allItems, trimmed);

  // Map back to categories in the order of matches
  const matchedCategories = activeCats
    .map((cat) => {
      // Maintain matched order for items within this category
      const catMatchedItems = matchedItems.filter((i) => itemToCatMap.get(i.id) === cat.id);
      return {
        ...cat,
        items: catMatchedItems,
      };
    })
    .filter((cat) => cat.items.length > 0);

  // If user selected a specific category filter during search
  if (searchCategoryFilter && searchCategoryFilter !== "all") {
    return matchedCategories.filter((cat) => cat.id === searchCategoryFilter);
  }

  return matchedCategories;
}

/**
 * Calculate per-category match counts for search queries.
 */
export function getCategorySearchCounts<
  T extends SearchableItemBase,
  C extends { id: string; name: string; items: T[]; isActive?: boolean }
>(
  categories: C[],
  query: string
): { countsByCategoryId: Record<string, number>; totalMatches: number } {
  const trimmed = (query || "").trim();
  const countsByCategoryId: Record<string, number> = {};
  let totalMatches = 0;

  if (!trimmed) {
    return { countsByCategoryId, totalMatches: 0 };
  }

  const activeCats = categories.filter((c) => (c.isActive !== undefined ? c.isActive : true));
  const allItems: T[] = [];
  const itemToCatMap = new Map<string, string>();

  for (const cat of activeCats) {
    for (const item of cat.items) {
      allItems.push(item);
      itemToCatMap.set(item.id, cat.id);
    }
  }

  const matchedItems = searchMenuItems(allItems, trimmed);
  totalMatches = matchedItems.length;

  for (const cat of activeCats) {
    countsByCategoryId[cat.id] = 0;
  }

  for (const item of matchedItems) {
    const catId = itemToCatMap.get(item.id);
    if (catId) {
      countsByCategoryId[catId] = (countsByCategoryId[catId] || 0) + 1;
    }
  }

  return { countsByCategoryId, totalMatches };
}
