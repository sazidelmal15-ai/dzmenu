# DZMenu — Product Specification

## 1. Product Overview

DZMenu is a SaaS platform for restaurants that provides customizable digital menus accessible through QR codes.

The restaurant owner can create and manage their menu from a dedicated dashboard. They can add, edit, hide, show, reorder, and organize menu items and categories. They can also customize the visual appearance of their public menu using predefined templates and customization options.

Customers do not need an account. They simply scan the restaurant's QR code and view the restaurant's current digital menu on their mobile device.

The restaurant can update its menu at any time without replacing or reprinting the QR code.

The initial target market is Algeria, with the architecture designed so the product can expand internationally later.

---

## 2. Product Vision

The vision of DZMenu is to become a secure, fast, beautiful, and highly customizable digital menu platform for restaurants.

DZMenu should make managing a restaurant's digital menu extremely simple while providing a professional customer-facing experience.

The product should focus on doing one thing exceptionally well:

Providing restaurants with a professional digital menu that is easy to manage and customize.

---

## 3. Problem

Traditional printed restaurant menus are difficult to maintain.

Restaurants may frequently need to change:

- Prices
- Menu items
- Ingredients
- Descriptions
- Images
- Availability
- Categories

Every significant change to a printed menu may require new printing.

DZMenu solves this problem by allowing restaurants to maintain one digital menu that can be updated instantly.

The QR code can remain printed on the restaurant's tables while the content behind it changes over time.

---

## 4. Core Product Experience

The main experience is:

Restaurant owner:

1. Creates or receives a restaurant account.
2. Opens the restaurant dashboard.
3. Creates menu categories.
4. Adds menu items.
5. Adds prices, descriptions, ingredients, and images.
6. Sets item availability and visibility.
7. Chooses a menu template.
8. Customizes the appearance of the menu.
9. Publishes the menu.
10. Uses the generated QR code.
11. Prints the QR code and places it in the restaurant.

Customer:

1. Scans the QR code.
2. Opens the restaurant's public menu.
3. Views the current menu.
4. Browses categories and menu items.
5. Reads descriptions, ingredients, prices, and other information provided by the restaurant.

Any future menu changes should become visible without requiring the QR code to be regenerated.

---

## 5. User Types

DZMenu has four logical user types:

### Super Admin

The platform owner with full control over the DZMenu platform.

### Support

A staff member who helps restaurants and has limited administrative permissions.

### Restaurant Owner

The owner or authorized manager of a restaurant who manages that restaurant's menu and settings.

### Customer

A public visitor who views a restaurant's menu.

Customers do not need an account.

---

## 6. Core Features

### 6.1 Restaurant Management

Each restaurant has its own profile and public menu.

Restaurant information may include:

- Restaurant name
- Logo
- Cover image
- Description
- Address
- Phone number
- Social links
- Opening hours
- Other basic public information

---

### 6.2 Menu Management

Restaurant owners can manage their menu.

Menu functionality includes:

- Create categories
- Edit categories
- Delete categories
- Reorder categories
- Show or hide categories
- Create menu items
- Edit menu items
- Delete menu items
- Reorder menu items
- Show or hide menu items
- Mark items as available or unavailable

---

### 6.3 Menu Item Information

A menu item may contain:

- Name
- Description
- Price
- Ingredients
- Image
- Availability status
- Visibility status
- Position/order
- Category

The product should allow the menu structure to remain flexible enough for different types of restaurants.

---

### 6.4 Menu Customization

Restaurant owners can customize the public menu through predefined templates.

Customization may include:

- Template selection
- Colors
- Typography
- Logo
- Cover image
- Menu layout
- Image style
- Section appearance
- Other controlled visual settings

Customization should remain controlled so that restaurant owners cannot accidentally break the menu layout or functionality.

DZMenu is not intended to be a completely unrestricted page builder.

---

## 7. Theme and Template System

DZMenu uses a template-based design system.

Templates define the visual structure of the public menu.

Examples of possible templates include:

- Modern
- Elegant
- Minimal
- Classic
- Bold

Templates may contain sections such as:

- Header
- Restaurant information
- Hero / cover
- Categories
- Featured items
- Menu
- About section
- Contact section
- Footer

Menu data must remain separate from presentation.

Changing a template must not modify or destroy the restaurant's underlying menu data.

Adding or updating a template must not break existing templates.

---

## 8. QR System

DZMenu uses dynamic QR codes.

The QR code is associated with a permanent restaurant or QR identity rather than directly storing menu content.

The general flow is:

QR Code
→ DZMenu public URL
→ Resolve restaurant
→ Load current menu
→ Load current template
→ Display menu

The QR code must remain usable when:

- Prices change
- Items are added
- Items are removed
- Categories change
- The menu design changes
- The restaurant changes its template
- Internal application architecture changes

The goal is to allow a restaurant to print the QR code once and continue using it while updating the digital menu indefinitely.

---

## 9. Analytics

DZMenu may collect basic analytics related to public menu access.

Possible analytics include:

- QR scans
- Menu views
- Estimated unique visitors
- Date and time of visits
- General device category
- Other non-sensitive aggregated statistics

Analytics should focus on useful business information while minimizing unnecessary collection of personal data.

A scan must not automatically be interpreted as a unique individual customer.

---

## 10. Subscription Model

The initial DZMenu business model is based on an annual subscription.

Initial pricing:

10,000 DZD per year.

The initial product uses one subscription plan.

The architecture should remain flexible enough to support additional plans in the future without requiring a complete redesign of the system.

Subscription management is controlled by the platform administration.

---

## 11. Public Menu

The public menu must be:

- Mobile-first
- Fast
- Responsive
- Easy to read
- Easy to navigate
- Visually polished
- Optimized for QR visitors

Customers should be able to access the public menu without creating an account.

The public menu should require minimal interaction before the customer can view the menu.

---

## 12. International Expansion

The initial market is Algeria.

The architecture should avoid unnecessary assumptions that permanently lock the product to Algeria.

Future international support may include:

- Multiple languages
- Multiple currencies
- Different locales
- Different countries
- International domains

International expansion is not part of the initial MVP but should remain possible without rebuilding the entire product.

---

## 13. Custom Domains

Custom domains may be supported in the future.

A restaurant may eventually use:

restaurant-name.dzmenu.com

or a custom domain such as:

menu.restaurant.com

A custom domain must not change or invalidate the restaurant's existing QR identity.

Custom domains are considered a future feature unless explicitly included in the current development phase.

---

## 14. Security as a Product Principle

Security is a core product requirement.

DZMenu must protect:

- Restaurant accounts
- Restaurant data
- Platform administration
- Subscription information
- Uploaded media
- Internal platform data

Each restaurant must be isolated from all other restaurants.

A restaurant owner must never be able to access or modify another restaurant's private data.

Security requirements are defined separately in SECURITY.md.

---

## 15. Product Simplicity

DZMenu should remain focused.

The product is a digital menu platform, not a complete restaurant management system.

The following are not part of the initial product scope:

- POS
- Delivery management
- Restaurant ordering system
- Payment processing
- Reservation system
- Loyalty system
- Full restaurant management
- Inventory management
- Accounting

These features must not be added simply because they could be useful.

The product should prioritize excellence in digital menus instead.

---

## 16. Initial MVP Scope

The first usable version should include:

- Authentication
- Restaurant account
- Restaurant dashboard
- Menu categories
- Menu items
- Item prices
- Item descriptions
- Ingredients
- Item images
- Item availability
- Item visibility
- Ordering of categories and items
- Public menu
- Menu templates
- Basic customization
- Dynamic QR
- Basic analytics
- Super Admin management
- Subscription management
- Basic support role structure
- Basic security protections

The MVP should be usable by real restaurants.

---

## 17. MVP Definition of Done

The MVP is considered complete when:

1. A restaurant can securely access its dashboard.
2. A restaurant can create and manage its menu.
3. A restaurant can organize categories and items.
4. A restaurant can update prices and content.
5. A restaurant can control item availability and visibility.
6. A restaurant can select and customize a menu template.
7. A restaurant can generate and download a QR code.
8. A customer can scan the QR code and view the public menu on a mobile device.
9. Menu changes appear without regenerating or reprinting the QR code.
10. Restaurant data is isolated from other restaurants.
11. Subscription status can be managed by the platform administrator.
12. Basic analytics can record menu access.
13. The product is stable enough to be tested with real restaurants.

---

## 18. Future Features

The following features are considered future possibilities and are not required for the initial MVP:

- AI-powered customer and restaurant support
- Advanced analytics
- Custom domains
- More advanced template customization
- Additional templates
- Multiple languages
- Multiple currencies
- International expansion
- Additional subscription plans
- White-label capabilities
- Other features discovered through real customer feedback

Future features must not be added to the current product unless they are explicitly approved and documented.

---

## 19. Product Principles

DZMenu should follow these principles:

### Simplicity

The product should be easy for restaurant owners to understand and operate.

### Customization

Restaurants should be able to create a menu that reflects their brand.

### Performance

The public menu should load quickly, especially on mobile devices.

### Security

Restaurant and platform data must be strongly protected.

### Stability

Existing restaurant menus and QR codes must remain stable when the platform evolves.

### Maintainability

The system should be designed so internal implementation can evolve without breaking existing restaurants.

### Focus

DZMenu should remain focused on digital menus instead of becoming an unnecessary all-in-one restaurant platform.