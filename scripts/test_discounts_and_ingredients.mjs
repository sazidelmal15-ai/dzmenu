import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDiscountState,
  isDiscountActive,
  calculateDiscountPercentage,
  calculateSavings,
  evaluateItemDiscount,
  sanitizeIngredients,
  formatDateTimeLocal,
  parseDateTimeLocal,
  menuItemCreateSchema,
  menuItemUpdateSchema,
  MAX_INGREDIENTS_COUNT,
  MAX_INGREDIENT_LENGTH,
} from "../lib/menu/discounts.ts";

test("Discounts Domain & Boundary Testing Suite", async (t) => {
  await t.test("1. No discount (originalPrice is null or undefined)", () => {
    const stateNull = calculateDiscountState({
      price: 850,
      originalPrice: null,
      now: new Date("2026-09-13T12:00:00Z"),
    });
    assert.equal(stateNull, "none");
    assert.equal(isDiscountActive({ price: 850, originalPrice: null }), false);

    const info = evaluateItemDiscount({ price: 850, originalPrice: undefined });
    assert.equal(info.state, "none");
    assert.equal(info.isActive, false);
    assert.equal(info.percentage, null);
    assert.equal(info.savings, null);
  });

  await t.test("2. Invalid discount (originalPrice <= price)", () => {
    // Equal price
    const stateEqual = calculateDiscountState({
      price: 850,
      originalPrice: 850,
    });
    assert.equal(stateEqual, "none");
    assert.equal(calculateDiscountPercentage(850, 850), null);

    // Lower original price
    const stateLower = calculateDiscountState({
      price: 850,
      originalPrice: 500,
    });
    assert.equal(stateLower, "none");
    assert.equal(calculateDiscountPercentage(850, 500), null);
    assert.equal(calculateSavings(850, 500), null);
  });

  await t.test("3. Before start window (now < startsAt)", () => {
    const startsAt = "2026-09-15T00:00:00Z";
    const endsAt = "2026-09-20T00:00:00Z";
    const now = new Date("2026-09-14T23:59:59Z");

    const state = calculateDiscountState({
      price: 800,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });

    assert.equal(state, "scheduled");
    assert.equal(isDiscountActive({ price: 800, originalPrice: 1000, discountStartsAt: startsAt, discountEndsAt: endsAt, now }), false);

    const info = evaluateItemDiscount({
      price: 800,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });
    assert.equal(info.state, "scheduled");
    assert.equal(info.isActive, false);
    assert.equal(info.percentage, null);
  });

  await t.test("4. Exactly at start boundary (now === startsAt)", () => {
    const startsAt = "2026-09-15T10:00:00Z";
    const endsAt = "2026-09-20T10:00:00Z";
    const now = new Date("2026-09-15T10:00:00.000Z");

    const state = calculateDiscountState({
      price: 750,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });

    assert.equal(state, "active");
    assert.equal(isDiscountActive({ price: 750, originalPrice: 1000, discountStartsAt: startsAt, discountEndsAt: endsAt, now }), true);

    const info = evaluateItemDiscount({
      price: 750,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });
    assert.equal(info.isActive, true);
    assert.equal(info.percentage, 25);
    assert.equal(info.savings, 250);
  });

  await t.test("5. During promotion window (startsAt < now < endsAt)", () => {
    const startsAt = "2026-09-15T00:00:00Z";
    const endsAt = "2026-09-20T00:00:00Z";
    const now = new Date("2026-09-17T15:30:00Z");

    const state = calculateDiscountState({
      price: 600,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });

    assert.equal(state, "active");
    assert.equal(calculateDiscountPercentage(600, 1000), 40);
    assert.equal(calculateSavings(600, 1000), 400);
  });

  await t.test("6. Exactly at end boundary (now === endsAt)", () => {
    // Under the convention `startsAt <= now < endsAt`, at endsAt the discount expires
    const startsAt = "2026-09-15T00:00:00Z";
    const endsAt = "2026-09-20T00:00:00.000Z";
    const now = new Date("2026-09-20T00:00:00.000Z");

    const state = calculateDiscountState({
      price: 800,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });

    assert.equal(state, "expired");
    assert.equal(isDiscountActive({ price: 800, originalPrice: 1000, discountStartsAt: startsAt, discountEndsAt: endsAt, now }), false);
  });

  await t.test("7. After end window (now > endsAt)", () => {
    const startsAt = "2026-09-15T00:00:00Z";
    const endsAt = "2026-09-20T00:00:00Z";
    const now = new Date("2026-09-21T08:00:00Z");

    const state = calculateDiscountState({
      price: 800,
      originalPrice: 1000,
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
      now,
    });

    assert.equal(state, "expired");
    assert.equal(isDiscountActive({ price: 800, originalPrice: 1000, discountStartsAt: startsAt, discountEndsAt: endsAt, now }), false);
  });

  await t.test("8. Deterministic discount percentage calculations", () => {
    // 850 DA with original 1100 DA -> (250/1100)*100 = 22.727% -> 23%
    assert.equal(calculateDiscountPercentage(850, 1100), 23);

    // 750 DA with original 1000 DA -> 25%
    assert.equal(calculateDiscountPercentage(750, 1000), 25);

    // 950 DA with original 1250 DA -> 24%
    assert.equal(calculateDiscountPercentage(950, 1250), 24);

    // Negative / Zero cases
    assert.equal(calculateDiscountPercentage(0, 100), 100);
    assert.equal(calculateDiscountPercentage(100, 0), null);
    assert.equal(calculateDiscountPercentage(-10, 100), 110);
  });

  await t.test("9. Reorderable Ingredients Sanitization & Canonical Order Preservation", () => {
    const raw = [
      "  Angus Beef Patty  ",
      "",
      "Melted Cheddar",
      "   ",
      "Caramelized Onions",
      "Smoky BBQ Sauce",
    ];

    const sanitized = sanitizeIngredients(raw);

    assert.deepEqual(sanitized, [
      "Angus Beef Patty",
      "Melted Cheddar",
      "Caramelized Onions",
      "Smoky BBQ Sauce",
    ]);

    // Order must be strictly 0, 1, 2, 3
    assert.equal(sanitized[0], "Angus Beef Patty");
    assert.equal(sanitized[1], "Melted Cheddar");
    assert.equal(sanitized[2], "Caramelized Onions");
    assert.equal(sanitized[3], "Smoky BBQ Sauce");

    // Non-array input fallback
    assert.deepEqual(sanitizeIngredients(null), []);
    assert.deepEqual(sanitizeIngredients(undefined), []);
    assert.deepEqual(sanitizeIngredients("not an array"), []);

    // Limit to max 30 ingredients
    const largeList = Array.from({ length: 40 }, (_, i) => `Ingredient ${i + 1}`);
    const capped = sanitizeIngredients(largeList);
    assert.equal(capped.length, MAX_INGREDIENTS_COUNT);
    assert.equal(capped[0], "Ingredient 1");
    assert.equal(capped[29], "Ingredient 30");
  });

  await t.test("10. Server-Side Zod Validation Schemas", () => {
    // Valid creation payload
    const validCreate = menuItemCreateSchema.safeParse({
      name: "Gourmet Truffle Burger",
      price: 900,
      originalPrice: 1200,
      discountStartsAt: "2026-09-15T00:00:00Z",
      discountEndsAt: "2026-09-20T00:00:00Z",
      ingredients: ["Angus Patty", "Truffle Mayo", "Brioche"],
    });
    assert.equal(validCreate.success, true);

    // Invalid: originalPrice <= price
    const invalidPrice = menuItemCreateSchema.safeParse({
      name: "Gourmet Truffle Burger",
      price: 1200,
      originalPrice: 900,
    });
    assert.equal(invalidPrice.success, false);

    // Invalid: startsAt >= endsAt
    const invalidSchedule = menuItemCreateSchema.safeParse({
      name: "Gourmet Truffle Burger",
      price: 900,
      originalPrice: 1200,
      discountStartsAt: "2026-09-20T00:00:00Z",
      discountEndsAt: "2026-09-15T00:00:00Z",
    });
    assert.equal(invalidSchedule.success, false);

    // Invalid: ingredient too long (> 120 chars)
    const longIngredient = "A".repeat(MAX_INGREDIENT_LENGTH + 1);
    const invalidIngredient = menuItemCreateSchema.safeParse({
      name: "Burger",
      price: 500,
      ingredients: [longIngredient],
    });
    assert.equal(invalidIngredient.success, false);
  });

  await t.test("11. Timezone Correctness: Africa/Algiers (13 September 2026 18:00)", () => {
    // A restaurant in Algeria enters 13 September 2026 18:00.
    // In Africa/Algiers (UTC+1), 18:00 corresponds to 17:00:00.000Z.
    const rawInput = "2026-09-13T18:00";
    const parsedIso = parseDateTimeLocal(rawInput, "Africa/Algiers");
    assert.equal(parsedIso, "2026-09-13T17:00:00.000Z");

    // Formatting it back to the restaurant context produces exact 18:00
    const formattedLocal = formatDateTimeLocal(parsedIso, "Africa/Algiers");
    assert.equal(formattedLocal, "2026-09-13T18:00");

    // Simulated server comparison:
    // At 16:59:59Z (17:59:59 in Algiers) -> scheduled / inactive
    const beforeTime = new Date("2026-09-13T16:59:59Z");
    const stateBefore = calculateDiscountState({
      price: 800,
      originalPrice: 1000,
      discountStartsAt: parsedIso,
      discountEndsAt: "2026-09-13T20:00:00.000Z",
      now: beforeTime,
    });
    assert.equal(stateBefore, "scheduled");

    // At 17:00:00Z (18:00:00 in Algiers) -> active
    const exactStart = new Date("2026-09-13T17:00:00Z");
    const stateAtStart = calculateDiscountState({
      price: 800,
      originalPrice: 1000,
      discountStartsAt: parsedIso,
      discountEndsAt: "2026-09-13T20:00:00.000Z",
      now: exactStart,
    });
    assert.equal(stateAtStart, "active");
  });

  await t.test("12. Server-Side menuItemUpdateSchema validation", () => {
    // Valid partial update
    const validUpdate = menuItemUpdateSchema.safeParse({
      price: 700,
      originalPrice: 950,
      ingredients: ["Fresh Basil", "Mozzarella Di Bufala"],
    });
    assert.equal(validUpdate.success, true);

    // Valid discount removal on item with demo/relative image url
    const discountRemovalUpdate = menuItemUpdateSchema.safeParse({
      name: "Margherita Special Pizza",
      price: 1250,
      originalPrice: null,
      discountStartsAt: null,
      discountEndsAt: null,
      imageUrl: "/images/demo/margherita_special_pizza.jpg",
      ingredients: ["عجينة نابوليتان مخمرة 48 ساعة", "صلصة طماطم سان مارزانو"],
    });
    assert.equal(discountRemovalUpdate.success, true);

    // Invalid update: originalPrice <= price
    const invalidUpdate = menuItemUpdateSchema.safeParse({
      price: 1000,
      originalPrice: 900,
    });
    assert.equal(invalidUpdate.success, false);
  });

  // =========================================================================
  // PRODUCTION REDESIGN SCENARIO TESTS (Scenarios A through F)
  // =========================================================================

  await t.test("13. Scenario A — Scheduled Promotion (Start: future, End: later future)", () => {
    const start = "2026-09-13T18:00:00Z";
    const end = "2026-09-13T22:00:00Z";
    const now = new Date("2026-09-13T14:38:28Z"); // 3h 21m 32s before start

    const state = calculateDiscountState({
      price: 1500,
      originalPrice: 2000,
      discountStartsAt: start,
      discountEndsAt: end,
      now,
    });

    assert.equal(state, "scheduled");
    assert.equal(isDiscountActive({ price: 1500, originalPrice: 2000, discountStartsAt: start, discountEndsAt: end, now }), false);
  });

  await t.test("14. Scenario B — Active Promotion (Start: current/past, End: future)", () => {
    const start = "2026-09-13T18:00:00Z";
    const end = "2026-09-13T22:00:00Z";
    const now = new Date("2026-09-13T20:17:53Z"); // 1h 42m 07s remaining

    const state = calculateDiscountState({
      price: 1500,
      originalPrice: 2000,
      discountStartsAt: start,
      discountEndsAt: end,
      now,
    });

    assert.equal(state, "active");
    assert.equal(isDiscountActive({ price: 1500, originalPrice: 2000, discountStartsAt: start, discountEndsAt: end, now }), true);
    assert.equal(calculateDiscountPercentage(1500, 2000), 25);
    assert.equal(calculateSavings(1500, 2000), 500);
  });

  await t.test("15. Scenario C — Expired Promotion (End: past)", () => {
    const start = "2026-09-13T18:00:00Z";
    const end = "2026-09-13T22:00:00Z";
    const now = new Date("2026-09-13T22:05:00Z"); // After end

    const state = calculateDiscountState({
      price: 1500,
      originalPrice: 2000,
      discountStartsAt: start,
      discountEndsAt: end,
      now,
    });

    assert.equal(state, "expired");
    assert.equal(isDiscountActive({ price: 1500, originalPrice: 2000, discountStartsAt: start, discountEndsAt: end, now }), false);
  });

  await t.test("16. Scenario D — Invalid Price (Promotional price >= regular price)", () => {
    // Equal prices: 2000 and 2000
    const equalValidation = menuItemCreateSchema.safeParse({
      name: "Burger",
      price: 2000,
      originalPrice: 2000,
    });
    assert.equal(equalValidation.success, false);

    // Higher promo price: 2500 vs 2000
    const higherValidation = menuItemCreateSchema.safeParse({
      name: "Burger",
      price: 2500,
      originalPrice: 2000,
    });
    assert.equal(higherValidation.success, false);
  });

  await t.test("17. Scenario E — Invalid Schedule (End <= Start)", () => {
    const invalidSchedule = menuItemCreateSchema.safeParse({
      name: "Burger",
      price: 1500,
      originalPrice: 2000,
      discountStartsAt: "2026-09-13T22:00:00Z",
      discountEndsAt: "2026-09-13T18:00:00Z",
    });
    assert.equal(invalidSchedule.success, false);
  });

  await t.test("18. Scenario F — Customer Menu Dynamic Presentation Mapping (No DB Mutation)", () => {
    const start = "2026-09-13T18:00:00Z";
    const end = "2026-09-13T22:00:00Z";

    // Item as stored in DB: price = 1500 (promo), originalPrice = 2000 (regular)
    const dbItem = {
      id: "item-1",
      categoryId: "cat-1",
      name: "Artisan Burger",
      description: "Juicy beef patty",
      price: 1500,
      originalPrice: 2000,
      discountStartsAt: start,
      discountEndsAt: end,
      imageUrl: "/uploads/burger.webp",
      ingredients: ["Beef", "Cheddar"],
      isVisible: true,
      isAvailable: true,
      isFeatured: false,
    };

    // Phase 1: Scheduled (Before start, 14:00Z)
    const scheduledInfo = evaluateItemDiscount({
      price: dbItem.price,
      originalPrice: dbItem.originalPrice,
      discountStartsAt: dbItem.discountStartsAt,
      discountEndsAt: dbItem.discountEndsAt,
      now: new Date("2026-09-13T14:00:00Z"),
    });
    // Under scheduled window, the effective presentation price is regular price (2000 DA)
    // and isActive is false
    const effectivePriceScheduled = scheduledInfo.isActive ? dbItem.price : (dbItem.originalPrice ?? dbItem.price);
    assert.equal(scheduledInfo.isActive, false);
    assert.equal(scheduledInfo.state, "scheduled");
    assert.equal(effectivePriceScheduled, 2000);

    // Phase 2: Active (During promo window, e.g. 19:00Z)
    // When now is inside the window:
    const activeInfo = evaluateItemDiscount({
      price: dbItem.price,
      originalPrice: dbItem.originalPrice,
      discountStartsAt: dbItem.discountStartsAt,
      discountEndsAt: dbItem.discountEndsAt,
      now: new Date("2026-09-13T19:00:00Z"),
    });
    assert.equal(activeInfo.isActive, true);
    assert.equal(activeInfo.percentage, 25);
    assert.equal(activeInfo.savings, 500);

    // Phase 3: Expired (After promo window, e.g. 23:00Z)
    const expiredInfo = evaluateItemDiscount({
      price: dbItem.price,
      originalPrice: dbItem.originalPrice,
      discountStartsAt: dbItem.discountStartsAt,
      discountEndsAt: dbItem.discountEndsAt,
      now: new Date("2026-09-13T23:00:00Z"),
    });
    assert.equal(expiredInfo.isActive, false);
    assert.equal(expiredInfo.state, "expired");
  });
});
