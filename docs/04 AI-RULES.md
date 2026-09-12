# DZMenu — AI Development Rules

## Before Making Changes

1. Read PRODUCT.md, ARCHITECTURE.md, and SECURITY.md before making changes that affect their respective areas.
2. Inspect the existing implementation before creating new architecture.
3. Do not invent major requirements that are not documented.

## Architecture

1. Do not change the architecture without explicit approval.
2. Business logic must not depend directly on Supabase-specific APIs.
3. Keep database access behind the defined data-access layer in lib/db/.
4. Strict Boundaries: UI Components must NEVER contain direct Database Logic. All database access must be routed through lib/db/.
5. Modularity (Loose Coupling): Build features in isolation. A bug or change in one feature (such as QR codes) must never break unrelated features (such as Menu management).
6. Do not introduce microservices or other unnecessary infrastructure unless explicitly approved.

## Restaurant Isolation

1. Never allow one restaurant to access another restaurant's private data.
2. Never trust a restaurantId received from the client without server-side authorization.
3. Any change affecting tenant isolation must include tests.

## QR Stability

1. Never change or invalidate an existing QR identity.
2. Never change an existing public restaurant URL without a migration or compatibility strategy.
3. Changing menu content, templates, themes, or subscriptions must not require regenerating existing QR codes.

## Database & Data Safety

1. Never modify production data directly.
2. Data Safety (Soft Deletes): NEVER use hard DELETE queries for core entities (Restaurant, Menu Item, Subscription, etc.). Always use soft deletes via fields like status (e.g., ACTIVE, ARCHIVED, SUSPENDED) or deletedAt. Data must never be truly lost.
3. Every schema change must use a migration.
4. Never delete production data as part of a normal development task.
5. Before destructive changes, verify backup and recovery procedures.

## Security

1. Never bypass authentication or authorization for convenience.
2. Never expose secrets or privileged credentials to the client.
3. Never disable security controls just to make development easier.
4. Treat all user input as untrusted.
5. Do not allow restaurant customization to execute arbitrary JavaScript or server-side code.

## Existing Customers

1. Existing restaurant data is production-critical.
2. Do not introduce breaking changes without a compatibility or migration plan.
3. Before modifying shared components, identify all existing consumers.
4. Prefer extending existing functionality over replacing working systems unnecessarily.

## Dependencies

1. Do not add a new dependency without explaining why it is necessary.
2. Prefer existing project dependencies when they are sufficient.
3. Do not replace a core technology simply because another technology appears cleaner.

## Change Procedure

For significant changes, report:

- What is changing?
- Why is it needed?
- Which files/modules are affected?
- What existing functionality could break?
- Is a migration required?
- How will the change be tested?

## Testing

After significant changes:

1. Run relevant tests.
2. Verify existing functionality.
3. Verify authorization.
4. Verify restaurant isolation.
5. Verify QR and public menu behavior when affected.
6. Fix any regression before continuing.

## Simplicity

Use the simplest solution that satisfies the documented requirements.

Do not turn DZMenu into a large enterprise architecture without a real requirement.

## No Guessing

If a requirement is ambiguous and the decision could affect architecture, security, existing restaurants, or data, stop and ask for clarification instead of making a major assumption.