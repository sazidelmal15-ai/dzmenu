# DZMenu — Architecture

## 1. Purpose

This document defines the technical architecture and architectural rules of DZMenu.

DZMenu must remain simple, maintainable, secure, and scalable.

The architecture must support thousands of restaurants without requiring a separate application for each restaurant.

The architecture must also allow internal technologies and infrastructure to change in the future without breaking existing restaurants, menus, subscriptions, public URLs, or QR codes.

---

## 2. Core Architectural Principles

DZMenu follows these principles:

1. Keep the system as simple as possible.
2. Build only what the current product requires.
3. Keep business logic independent from infrastructure providers.
4. Keep restaurant data strongly isolated.
5. Keep public restaurant URLs stable.
6. Keep QR identities stable.
7. Keep menu data separate from menu presentation.
8. Keep authentication separate from authorization.
9. Keep privileged operations on the server.
10. All database schema changes must use migrations.
11. Do not introduce complexity without a real requirement.
12. Internal architecture may evolve, but existing restaurants must not be broken by internal changes.

---

## 3. High-Level System

DZMenu consists of three main user-facing areas:

### Public Web

Used by customers to view restaurant menus.

### Restaurant Dashboard

Used by restaurant owners to manage their restaurant and menu.

### Admin Panel

Used by platform administrators and support staff to manage the DZMenu platform.

General structure:

Public Web
        |
Restaurant Dashboard
        |
Admin Panel
        |
Application Layer
        |
Business / Domain Logic
        |
Data Access Layer
        |
PostgreSQL / Infrastructure

The exact implementation may evolve as the system grows.

---

## 4. Multi-Tenant Architecture

DZMenu is a multi-tenant application.

Each restaurant represents a tenant.

Restaurant-owned data must belong to exactly one restaurant unless the model explicitly defines another ownership relationship.

Example:

Restaurant A
- Categories A
- Menu Items A
- Subscription A
- QR A
- Analytics A

Restaurant B
- Categories B
- Menu Items B
- Subscription B
- QR B
- Analytics B

Restaurant A must never be able to access private data belonging to Restaurant B.

Tenant isolation is a fundamental architectural requirement.

---

## 5. Restaurant Context

Every authenticated restaurant request must operate within a clearly defined restaurant context.

The application must determine:

1. Who is the authenticated user?
2. What role does the user have?
3. Which restaurant does the user belong to?
4. Is the requested resource owned by that restaurant?
5. Is the requested action allowed?

The application must never trust a restaurant identifier supplied by the client without verifying ownership and authorization.

---

## 6. Application Layers

The application should use clear boundaries between different responsibilities.

### Presentation Layer

Responsible for:

- UI
- Pages
- Components
- Forms
- User interaction
- Public menu rendering

The presentation layer must not contain sensitive business logic or privileged database operations.

### Application / Service Layer

Responsible for:

- Application workflows
- Business operations
- Permission checks where appropriate
- Coordinating multiple domain operations
- Validating business rules

### Domain / Core Layer

Responsible for core product concepts and business rules.

Examples:

- Restaurant
- Menu
- Category
- Menu Item
- Subscription
- QR
- Theme

The domain layer should not depend directly on UI frameworks or infrastructure providers.

### Data Access Layer

Responsible for reading and writing persistent data.

Database-specific logic must be kept here whenever practical.

### Infrastructure Layer

Responsible for external infrastructure such as:

- Database provider
- File storage
- Email provider
- Hosting
- Caching
- Other external services

Infrastructure providers must not define DZMenu's core business logic.

---

## 7. Supabase

Supabase may be used as an infrastructure provider.

Possible Supabase usage includes:

- PostgreSQL
- Authentication
- Storage
- Other infrastructure services when justified

However:

Supabase is not the DZMenu business domain.

Business logic must not be tightly coupled to Supabase-specific APIs throughout the application.

The system should isolate provider-specific code so infrastructure can be replaced or changed later if necessary.

The architecture must treat PostgreSQL as the underlying database model rather than designing the business domain around proprietary assumptions.

---

## 8. Database Strategy

DZMenu should initially use a shared PostgreSQL database with strong tenant isolation.

A separate database should not be created for every restaurant unless a future architectural decision explicitly requires it.

Restaurant-owned records should contain a direct or traceable relationship to their restaurant.

Examples include:

- Categories
- Menu Items
- Subscriptions
- QR codes
- Analytics events
- Restaurant settings

Database constraints and application authorization should work together to prevent invalid ownership relationships.

---

## 9. Authentication and Authorization

Authentication answers:

"Who is this user?"

Authorization answers:

"What is this user allowed to do?"

These concepts must remain separate.

Authentication should be handled using a trusted authentication system.

Authorization must be enforced by DZMenu application rules.

Examples:

A Restaurant Owner can manage their own restaurant.

A Support user has limited administrative permissions.

A Super Admin has platform-level permissions.

A Customer has public read-only access and does not require an account.

---

## 10. Public Menu Architecture

The public menu is a read-heavy part of the application.

General flow:

Customer
    |
QR / Public URL
    |
Resolve Restaurant
    |
Check public availability
    |
Load restaurant menu
    |
Load active theme
    |
Render public menu

The public menu must not require customer authentication.

The public experience must be optimized for mobile devices and fast loading.

Public menu performance should be improved over time using appropriate techniques such as:

- Efficient database queries
- Caching
- CDN usage
- Image optimization
- Static or partially cached rendering where appropriate

These techniques should only be introduced when they are useful and justified.

---

## 11. QR Architecture

QR codes represent stable public access points.

A QR code must resolve to a stable DZMenu identity or public URL.

The QR should not directly encode:

- Menu contents
- Template configuration
- Subscription state
- Internal database structure

The general flow is:

QR
    |
Stable QR Identity / Public URL
    |
Resolve Restaurant
    |
Record scan event
    |
Load current restaurant menu
    |
Load current template
    |
Display menu

Changing the following must not require replacing the QR:

- Menu items
- Prices
- Categories
- Images
- Template
- Theme settings
- Restaurant information
- Internal backend implementation

---

## 12. Public URL Stability

Existing public URLs are considered stable contracts.

An internal architecture change must not unnecessarily change the public URL of an existing restaurant.

If a URL structure ever needs to change, a compatibility or redirect strategy must be created before the change is deployed.

Existing QR codes must continue to resolve correctly.

---

## 13. Theme Architecture

Theme data and restaurant menu data must remain separate.

A theme defines presentation.

Restaurant data defines content.

Conceptually:

Restaurant
    |
Menu Data
    |
Selected Theme
    |
Theme Configuration
    |
Public Menu

A theme must not own or permanently modify restaurant menu data.

Changing the selected theme must not delete or rewrite menu content.

Adding a new theme must not require rewriting existing themes.

Theme implementations should be isolated so that a change to one theme does not unexpectedly affect another theme.

---

## 14. Subscription Architecture

Subscription state must be separate from menu content.

A restaurant may have a subscription record containing information such as:

- Plan
- Status
- Start date
- Expiration date

The initial product uses one subscription plan.

The architecture should allow additional plans in the future without requiring a redesign of the menu system.

An expired subscription must not automatically destroy restaurant data.

Subscription enforcement must be implemented as an application rule and must not be hardcoded into menu content.

---

## 15. Analytics Architecture

Analytics should use event-based recording where appropriate.

For example:

QR scan
    |
Scan Event
    |
Restaurant Analytics

Analytics data should be separated from core menu data.

Analytics should not be allowed to compromise restaurant data isolation.

The initial analytics system should remain simple and focused on useful menu usage information.

Detailed analytics infrastructure should only be introduced when required by actual traffic and product needs.

---

## 16. File and Image Storage

Restaurant-uploaded images should be stored using a dedicated storage system rather than directly inside database records.

Examples:

- Restaurant logo
- Cover image
- Menu item images

The database should store references or metadata rather than large binary image contents when practical.

Uploads must follow the security requirements defined in SECURITY.md.

---

## 17. Custom Domains

Custom domains may be supported in the future.

The architecture should keep public restaurant identity separate from the domain used to access it.

A restaurant may eventually use:

restaurant.dzmenu.com

or:

menu.restaurant.com

Changing a restaurant's domain must not change its internal restaurant identity or invalidate its QR code.

Custom domain functionality is not required for the initial MVP unless explicitly approved.

---

## 18. Stable and Replaceable Parts

The following should be treated as stable public or product-level concepts:

- Restaurant identity
- QR identity
- Public menu identity
- Existing menu data
- Subscription records
- Existing restaurant access

The following should remain replaceable where practical:

- Hosting provider
- Database provider implementation
- Storage provider
- Caching provider
- Internal service implementation
- Infrastructure details
- Authentication provider implementation

Replacing an infrastructure component must include a migration strategy where necessary.

---

## 19. Development Environments

DZMenu should maintain separate environments.

### Development

Used for active implementation and experimentation.

### Staging

Used to test changes in an environment similar to production.

### Production

Used by real restaurants and customers.

Development and AI tools must not directly modify production data.

Production changes must follow a controlled deployment process.

---

## 20. Database Migrations

Database schema changes must be performed through versioned migrations.

Never replace the production database schema manually as part of normal development.

A schema change should follow a process such as:

Design
    |
Migration
    |
Test
    |
Staging
    |
Verify existing data
    |
Production

Destructive changes require additional review and a recovery plan.

---

## 21. Backups and Recovery

Production data must be backed up according to the operational requirements of the platform.

Before high-risk or destructive database changes:

1. Verify a current backup exists.
2. Test the migration in a safe environment.
3. Review the migration impact.
4. Deploy only after verification.

The platform must have a documented recovery strategy as it approaches real production scale.

---

## 22. Caching and Performance

Caching should be introduced based on measured needs.

The architecture should avoid unnecessary caching complexity during the MVP.

Because public menus may receive significantly more traffic than dashboards, caching and optimized reads should focus first on public menu traffic.

Cache invalidation must ensure menu updates eventually become visible according to the defined consistency requirements.

The QR itself must never need regeneration because of caching.

---

## 23. Error Handling

The system must fail safely.

Errors should:

- Not expose secrets
- Not expose internal database details
- Not reveal sensitive information
- Provide useful feedback to users
- Be logged appropriately on the server

Public users should receive simple and safe error messages.

Internal logs may contain additional diagnostic information when appropriate.

---

## 24. Logging and Auditability

Important administrative and security-sensitive actions should be logged.

Examples:

- Restaurant suspension
- Subscription changes
- Sensitive account changes
- Administrative actions
- Security-related events

Logs must not contain unnecessary sensitive information.

The logging strategy should evolve as the platform grows.

---

## 25. Scalability Goal

The initial architecture should be capable of supporting:

- Thousands of restaurants
- Large numbers of public menu visits
- Read-heavy traffic
- Increasing analytics events
- Multiple themes
- Future custom domains
- Future international expansion

The system should scale incrementally rather than introducing unnecessary distributed-system complexity from the beginning.

---

## 26. Architecture Change Policy

Architecture is allowed to evolve.

However, major architectural changes must answer:

1. Why is the change necessary?
2. What problem does it solve?
3. What existing functionality could be affected?
4. What data could be affected?
5. Could existing QR codes break?
6. Could existing public URLs break?
7. Could existing restaurants be affected?
8. Is migration required?
9. How will the change be tested?
10. What is the rollback or recovery strategy?

No major architectural change should be introduced only because a different implementation appears cleaner.

---

## 27. Backward Compatibility

Existing restaurants are first-class production users.

Any significant change must consider backward compatibility.

Existing:

- Restaurants
- Menu data
- QR codes
- Public URLs
- Subscriptions
- Theme configurations

must remain functional unless a deliberate migration is planned and approved.

---

## 28. Architecture Simplicity Rule

DZMenu should use the simplest architecture that safely satisfies current requirements.

Do not add:

- Microservices
- Queues
- Event buses
- Distributed systems
- Complex caching systems
- Additional databases
- Additional infrastructure

unless the product has a clear need for them.

Future scale should be supported through good boundaries and incremental improvements, not premature complexity.

---

## 29. Architecture Decision Records

Important architectural decisions should be documented separately when necessary.

Examples:

- Database provider
- Authentication strategy
- Multi-tenancy strategy
- QR identity strategy
- Theme architecture
- Custom domain architecture
- Major infrastructure changes

Each important decision should record:

- Context
- Decision
- Alternatives considered
- Reason
- Trade-offs
- Date
- Current status

---

## 30. Final Architectural Principles

The following principles are mandatory:

1. Restaurant data must remain isolated.
2. QR identities must remain stable.
3. Public menu identities must remain stable.
4. Business logic must not depend directly on a specific infrastructure provider.
5. Production data must be protected from unsafe development changes.
6. Database changes must use migrations.
7. Menu content must remain separate from theme presentation.
8. Authentication and authorization must remain separate.
9. Internal architecture may evolve without unnecessarily affecting existing restaurants.
10. Simplicity is preferred until real scale requires additional complexity.