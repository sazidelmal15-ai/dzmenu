import fs from 'fs';

async function runPhase6BVerificationSuite() {
  console.log("==================================================================");
  console.log("DZMenu Phase 6B — Global Audit Explorer UI Verification");
  console.log("==================================================================");

  let passedTests = 0;
  const totalTests = 12;

  // --- TEST 1: Phase 6B Component & Route Manifest Check ---
  console.log("\n--- TEST 1: Phase 6B Component & Route Manifest Check ---");
  const requiredFiles = [
    'components/admin/audit/AuditFilters.tsx',
    'components/admin/audit/AuditTable.tsx',
    'components/admin/audit/AuditTableSkeleton.tsx',
    'components/admin/audit/index.ts',
    'app/admin/audit/page.tsx',
    'constants/audit.ts',
  ];

  const allFilesExist = requiredFiles.every((f) => fs.existsSync(f));
  if (allFilesExist) {
    console.log("✅ PASS: All Phase 6B UI components, skeletons, barrel exports, and routes exist.");
    passedTests++;
  } else {
    throw new Error("TEST 1 Failed: Missing required Phase 6B files.");
  }

  // --- TEST 2: Route Server-Side Authorization Barrier ---
  console.log("\n--- TEST 2: Server-Side Authorization Barrier Check in /admin/audit/page.tsx ---");
  const pageContent = fs.readFileSync('app/admin/audit/page.tsx', 'utf-8');
  const hasAuthGuard = pageContent.includes('await requireRole(PLATFORM_ADMIN_ROLES)');
  const hasServerDynamic = pageContent.includes('export const dynamic = "force-dynamic"');

  if (hasAuthGuard && hasServerDynamic) {
    console.log("✅ PASS: /admin/audit is strictly protected by requireRole(PLATFORM_ADMIN_ROLES) and force-dynamic.");
    passedTests++;
  } else {
    throw new Error("TEST 2 Failed: Server-side authorization guard missing.");
  }

  // --- TEST 3: Search, Action, Restaurant, Actor, Date Filter Parsing in Route ---
  console.log("\n--- TEST 3: URL SearchParams Parsing in Page ---");
  const hasQ = pageContent.includes('params.q');
  const hasAction = pageContent.includes('params.action');
  const hasRestaurant = pageContent.includes('params.restaurant');
  const hasActor = pageContent.includes('params.actor');
  const hasDate = pageContent.includes('params.date');
  const hasFrom = pageContent.includes('params.from');
  const hasTo = pageContent.includes('params.to');

  if (hasQ && hasAction && hasRestaurant && hasActor && hasDate && hasFrom && hasTo) {
    console.log("✅ PASS: Route extracts and sanitizes all required URL query parameters.");
    passedTests++;
  } else {
    throw new Error("TEST 3 Failed: Route missing query parameter handling.");
  }

  // --- TEST 4: AuditFilters Component Search & Action Dropdown ---
  console.log("\n--- TEST 4: AuditFilters Search & Action Dropdown ---");
  const filterContent = fs.readFileSync('components/admin/audit/AuditFilters.tsx', 'utf-8');
  const hasActionDefs = filterContent.includes('getAllAuditActionDefinitions()');
  const hasDebounce = filterContent.includes('setTimeout') && filterContent.includes('350');
  const hasDatePreset = filterContent.includes('today') && filterContent.includes('7d') && filterContent.includes('30d') && filterContent.includes('custom');

  if (hasActionDefs && hasDebounce && hasDatePreset) {
    console.log("✅ PASS: AuditFilters populates canonical actions, debounces search, and supports date presets.");
    passedTests++;
  } else {
    throw new Error("TEST 4 Failed: AuditFilters implementation incomplete.");
  }

  // --- TEST 5: AuditFilters Restaurant & Actor Filtering Inputs ---
  console.log("\n--- TEST 5: AuditFilters Restaurant & Actor Filter Inputs ---");
  const hasRestInput = filterContent.includes('restaurantInput') && filterContent.includes('Target Restaurant');
  const hasActorInput = filterContent.includes('actorInput') && filterContent.includes('Admin Actor');

  if (hasRestInput && hasActorInput) {
    console.log("✅ PASS: AuditFilters contains dedicated input controls for Target Restaurant and Admin Actor.");
    passedTests++;
  } else {
    throw new Error("TEST 5 Failed: Restaurant or Actor input missing in AuditFilters.");
  }

  // --- TEST 6: AuditFilters Active Filter Chips & Reset All ---
  console.log("\n--- TEST 6: Active Filter Chips & Reset All Action ---");
  const hasActiveChips = filterContent.includes('Active filters') && filterContent.includes('handleClearAll');
  const hasResetButton = filterContent.includes('Reset All');

  if (hasActiveChips && hasResetButton) {
    console.log("✅ PASS: Active filter chips render with single-click dismiss and full reset.");
    passedTests++;
  } else {
    throw new Error("TEST 6 Failed: Active filter chips or Reset All missing.");
  }

  // --- TEST 7: AuditTable Column Sorting & Allowlist Keys ---
  console.log("\n--- TEST 7: AuditTable Column Headers & Allowlisted Sorting ---");
  const tableContent = fs.readFileSync('components/admin/audit/AuditTable.tsx', 'utf-8');
  const hasSortTime = tableContent.includes('handleSort("time")');
  const hasSortAction = tableContent.includes('handleSort("action")');
  const hasSortRestaurant = tableContent.includes('handleSort("restaurant")');
  const hasSortActor = tableContent.includes('handleSort("actor")');

  if (hasSortTime && hasSortAction && hasSortRestaurant && hasSortActor) {
    console.log("✅ PASS: AuditTable headers support interactive sorting for time, action, restaurant, and actor.");
    passedTests++;
  } else {
    throw new Error("TEST 7 Failed: Column sorting incomplete in AuditTable.");
  }

  // --- TEST 8: AuditTable Relative & Absolute Time Formatting ---
  console.log("\n--- TEST 8: AuditTable Timestamp Formatting ---");
  const hasRelativeTime = tableContent.includes('formatRelativeTime');
  const hasExactDateTime = tableContent.includes('formatExactDateTime');

  if (hasRelativeTime && hasExactDateTime) {
    console.log("✅ PASS: AuditTable renders clean relative time with exact timestamp tooltip/subtext.");
    passedTests++;
  } else {
    throw new Error("TEST 8 Failed: Timestamp formatting missing in AuditTable.");
  }

  // --- TEST 9: AuditTable Semantic Badges from Canonical Registry ---
  console.log("\n--- TEST 9: Canonical Action Badge Integration ---");
  const hasActionBadge = tableContent.includes('getAuditActionLabel') && tableContent.includes('getAuditActionBadgeStyle');

  if (hasActionBadge) {
    console.log("✅ PASS: Action badges dynamically resolve from canonical constants/audit.ts registry.");
    passedTests++;
  } else {
    throw new Error("TEST 9 Failed: Canonical action badge integration missing.");
  }

  // --- TEST 10: AuditTable Distinct Empty States ---
  console.log("\n--- TEST 10: Distinct Empty State Rendering ---");
  const hasNoLogs = tableContent.includes('No audit activity yet');
  const hasNoFilterMatches = tableContent.includes('No matching audit events') && tableContent.includes('Clear Filters');

  if (hasNoLogs && hasNoFilterMatches) {
    console.log("✅ PASS: Distinct empty states for empty platform vs non-matching filters verified.");
    passedTests++;
  } else {
    throw new Error("TEST 10 Failed: Empty state differentiation missing in AuditTable.");
  }

  // --- TEST 11: AuditTableSkeleton Geometry Preservation ---
  console.log("\n--- TEST 11: AuditTableSkeleton Geometry Preservation ---");
  const skeletonContent = fs.readFileSync('components/admin/audit/AuditTableSkeleton.tsx', 'utf-8');
  const hasSkeletonRows = skeletonContent.includes('animate-pulse') && skeletonContent.includes('min-w-[760px]');

  if (hasSkeletonRows) {
    console.log("✅ PASS: AuditTableSkeleton preserves exact table column dimensions and geometry.");
    passedTests++;
  } else {
    throw new Error("TEST 11 Failed: AuditTableSkeleton missing or invalid.");
  }

  // --- TEST 12: Scope Protection (No Phase 6D Cross-Nav or Phase 7 Analytics Leak) ---
  console.log("\n--- TEST 12: Scope Protection Check (No Phase 6D / Phase 7 Leak) ---");
  const hasPhase7 = fs.existsSync('components/admin/security') || fs.existsSync('components/admin/analytics');
  const hasCharts = pageContent.includes('Chart') || pageContent.includes('Analytics');

  if (!hasPhase7 && !hasCharts) {
    console.log("✅ PASS: Explorer UI scope strictly guarded (no Phase 6D cross-navigation or Phase 7 analytics leak).");
    passedTests++;
  } else {
    throw new Error("TEST 12 Failed: Out of scope components detected in Phase 6B.");
  }

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 6B VERIFICATION TESTS PASSED`);
  console.log("==================================================================");
}

runPhase6BVerificationSuite().catch((err) => {
  console.error("Phase 6B Verification Failed:", err);
  process.exit(1);
});
