-- ==============================================================================
-- DZMenu — Complete Production Database Schema
-- PostgreSQL 15+ / Supabase Compatible
-- Includes: Multi-Tenancy, Soft Deletes, RLS, Auto-Triggers, Default Seed Data
-- ==============================================================================
-- Version   : 2.0.0
-- Author    : DZMenu Engineering
-- Updated   : 2026-09-04
-- ==============================================================================


-- ==============================================================================
-- EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- UTILITY: updated_at AUTO-TRIGGER
-- Automatically sets updated_at = NOW() on every row update.
-- Applied to all tables with an updated_at column.
-- ==============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 1. USERS TABLE
-- Stores platform admins, support staff, and restaurant owners.
-- Soft delete enforced via deleted_at and is_active.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    full_name     VARCHAR(255)  NULL,
    role          VARCHAR(50)   NOT NULL DEFAULT 'RESTAURANT_OWNER',
    -- Allowed: 'SUPER_OWNER' | 'SUPPORT' | 'RESTAURANT_OWNER'
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    deleted_at    TIMESTAMPTZ   NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Unique email among non-deleted users (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
    ON users(LOWER(email))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role)
    WHERE deleted_at IS NULL;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ==============================================================================
-- 2. SESSIONS TABLE
-- Server-side authenticated sessions.
-- Tokens stored as SHA-256 hashes to prevent plaintext leaks.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id         VARCHAR(255)  PRIMARY KEY,
    -- Format: sess_<timestamp>_<random>
    user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64)   NOT NULL UNIQUE,
    -- SHA-256 hex digest of the session secret
    expires_at TIMESTAMPTZ   NOT NULL,
    user_agent TEXT          NULL,
    ip_address VARCHAR(45)   NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ==============================================================================
-- 3. RESTAURANTS TABLE
-- Primary tenant model. One record = one restaurant business.
-- Soft delete via deleted_at + status field.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS restaurants (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255)  NOT NULL,
    slug                VARCHAR(100)  NOT NULL,
    -- Public URL: dzmenu.com/menu/<slug>
    logo_url            TEXT          NULL,
    cover_url           TEXT          NULL,
    tagline             VARCHAR(255)  NULL,
    description         TEXT          NULL,
    is_subdomain_locked BOOLEAN       NOT NULL DEFAULT FALSE,
    cuisine_types       JSONB         NOT NULL DEFAULT '[]'::jsonb,
    phone               VARCHAR(50)   NULL,
    whatsapp            VARCHAR(50)   NULL,
    city                VARCHAR(100)  NULL,
    address             TEXT          NULL,
    google_maps_url     TEXT          NULL,
    always_open         BOOLEAN       NOT NULL DEFAULT FALSE,
    operating_hours     JSONB         NOT NULL DEFAULT '[]'::jsonb,
    tiktok_url          TEXT          NULL,
    instagram_url       TEXT          NULL,
    facebook_url        TEXT          NULL,
    wifi_ssid           VARCHAR(100)  NULL,
    wifi_password       VARCHAR(100)  NULL,
    currency            VARCHAR(10)   NOT NULL DEFAULT 'DZD',
    status              VARCHAR(50)   NOT NULL DEFAULT 'ACTIVE',
    -- Allowed: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED'
    deleted_at          TIMESTAMPTZ   NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Unique slug among non-deleted restaurants
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug_active
    ON restaurants(slug)
    WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION trigger_normalize_restaurant_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NOT NULL THEN
    NEW.slug = LOWER(TRIM(NEW.slug));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_restaurants_normalize_slug
    BEFORE INSERT OR UPDATE OF slug ON restaurants
    FOR EACH ROW EXECUTE FUNCTION trigger_normalize_restaurant_slug();

CREATE OR REPLACE TRIGGER trg_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ==============================================================================
-- 4. RESTAURANT_MEMBERS TABLE
-- Maps users to restaurants with tenant-level roles.
-- Enables future multi-user access per restaurant.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS restaurant_members (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    restaurant_id UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    role          VARCHAR(50)  NOT NULL DEFAULT 'RESTAURANT_OWNER',
    -- Allowed: 'RESTAURANT_OWNER' | 'MANAGER'
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_restaurant_members_user_restaurant UNIQUE (user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_members_user       ON restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant ON restaurant_members(restaurant_id);

-- ==============================================================================
-- 5. SUBSCRIPTIONS TABLE
-- Controls restaurant plan status and billing validity.
-- One subscription per restaurant (UNIQUE enforced).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id        UUID         NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
    plan                 VARCHAR(50)  NOT NULL DEFAULT 'STANDARD_ANNUAL',
    -- Allowed: 'STANDARD_ANNUAL'
    status               VARCHAR(50)  NOT NULL DEFAULT 'INACTIVE',
    -- Allowed: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'INACTIVE'
    current_period_start TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE OR REPLACE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ==============================================================================
-- 6. CATEGORIES TABLE
-- Stores menu categories per restaurant.
-- Supports emoji icon, cover image, badge label, and drag-sort ordering.
-- Soft delete via deleted_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(255)  NOT NULL,
    short_name    VARCHAR(100)  NULL,
    description   TEXT          NULL,
    icon          TEXT          NULL DEFAULT '🍽️',
    image_url     TEXT          NULL,
    badge         VARCHAR(50)   NULL,
    -- e.g. 'NEW', 'HOT', 'SPECIAL'
    sort_order    INT           NOT NULL DEFAULT 0,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    deleted_at    TIMESTAMPTZ   NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id
    ON categories(restaurant_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_sort_order
    ON categories(restaurant_id, sort_order)
    WHERE deleted_at IS NULL;

CREATE OR REPLACE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ==============================================================================
-- 7. MENU_ITEMS TABLE
-- Stores individual dish/item records per restaurant.
-- JSONB for variants, sizes, extras — maximum menu flexibility.
-- Soft delete via deleted_at. Full display control via 3 boolean flags.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS menu_items (
    id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id   UUID            NULL     REFERENCES categories(id)  ON DELETE SET NULL,
    name          VARCHAR(255)    NOT NULL,
    description   TEXT            NULL,
    price         NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    image_url     TEXT            NULL,

    -- Display Settings & Merchandising
    badge         VARCHAR(50)     NULL,
    -- e.g. 'CHEF_PICK', 'BEST_SELLER', 'NEW', 'SIGNATURE', 'SPECIAL_OFFER'
    tags          JSONB           NOT NULL DEFAULT '[]'::jsonb,
    -- e.g. ["spicy", "vegetarian", "vegan", "gluten_free", "nuts"]
    is_visible    BOOLEAN         NOT NULL DEFAULT TRUE,
    -- TRUE = shown to customers | FALSE = hidden
    is_available  BOOLEAN         NOT NULL DEFAULT TRUE,
    -- TRUE = can be ordered | FALSE = out of stock
    is_featured   BOOLEAN         NOT NULL DEFAULT FALSE,
    -- TRUE = shown in featured/highlighted sections

    -- Flexible JSONB Modifiers
    -- variants: [{ name: string, price?: number, isDefault?: boolean }]
    variants      JSONB           NOT NULL DEFAULT '[]'::jsonb,
    -- sizes: [{ name: string, price: number }]
    sizes         JSONB           NOT NULL DEFAULT '[]'::jsonb,
    -- extras: [{ name: string, price: number }]
    extras        JSONB           NOT NULL DEFAULT '[]'::jsonb,

    sort_order    INT             NOT NULL DEFAULT 0,
    deleted_at    TIMESTAMPTZ     NULL,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- MIGRATION SAFETY — Ensure all v2.0 columns exist on pre-existing tables.
-- Uses ADD COLUMN IF NOT EXISTS so this block is fully idempotent.
-- Must run BEFORE any index that references these columns.
-- ==============================================================================

-- categories: columns added after initial schema release
ALTER TABLE categories ADD COLUMN IF NOT EXISTS short_name  VARCHAR(100)  NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url   TEXT          NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS badge       VARCHAR(50)   NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active   BOOLEAN       NOT NULL DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ   NULL;

-- menu_items: display-control & merchandising columns added in v2.0
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS badge        VARCHAR(50)  NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags         JSONB        NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_visible   BOOLEAN      NOT NULL DEFAULT TRUE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN      NOT NULL DEFAULT TRUE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured  BOOLEAN      NOT NULL DEFAULT FALSE;

-- menu_items: JSONB modifier columns
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sizes    JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS extras   JSONB NOT NULL DEFAULT '[]'::jsonb;

-- menu_items: sort_order
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Core lookup: all active items for a restaurant
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id
    ON menu_items(restaurant_id)
    WHERE deleted_at IS NULL;

-- Category filter index
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id
    ON menu_items(category_id)
    WHERE deleted_at IS NULL;

-- Featured items fast lookup
CREATE INDEX IF NOT EXISTS idx_menu_items_featured
    ON menu_items(restaurant_id, is_featured)
    WHERE is_featured = TRUE AND deleted_at IS NULL;

-- Full-text search readiness (GIN index for future ILIKE / full-text queries)
CREATE INDEX IF NOT EXISTS idx_menu_items_name_gin
    ON menu_items USING gin(to_tsvector('simple', name));

CREATE OR REPLACE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ==============================================================================
-- 8. DEFAULT CATEGORIES & DISHES AUTO-SEED TRIGGER
-- Fires AFTER every new restaurant INSERT.
-- Automatically creates 22 ready-to-use default categories and starter demo dishes
-- for the new tenant.
-- Owner can rename, reorder, or delete any of these at any time.
-- Entirely database-side — no application code changes required.
-- ==============================================================================

CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  v_burger_id UUID;
  v_pizza_id UUID;
  v_drinks_id UUID;
BEGIN
  -- 1. Insert Categories in Exact Canonical Order (0 to 21)
  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES (NEW.id, 'Burgers', '🍔', 'Delicious burgers made with premium ingredients', 0, TRUE, NULL, NOW() + INTERVAL '1 millisecond', NOW())
  RETURNING id INTO v_burger_id;

  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES (NEW.id, 'Pizza', '🍕', 'Freshly baked pizzas with authentic toppings', 1, TRUE, NULL, NOW() + INTERVAL '2 millisecond', NOW())
  RETURNING id INTO v_pizza_id;

  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES (NEW.id, 'Drinks', '🥤', 'Refreshing beverages and cold drinks', 2, TRUE, NULL, NOW() + INTERVAL '3 millisecond', NOW())
  RETURNING id INTO v_drinks_id;

  INSERT INTO categories (restaurant_id, name, icon, description, sort_order, is_active, deleted_at, created_at, updated_at)
  VALUES
    (NEW.id, 'Coffee',       '☕', 'Hot and cold brewed coffees and espresso', 3,  TRUE, NULL, NOW() + INTERVAL '4 millisecond', NOW()),
    (NEW.id, 'Ice Cream',    '🍦', 'Sweet and creamy ice cream flavors', 4,  TRUE, NULL, NOW() + INTERVAL '5 millisecond', NOW()),
    (NEW.id, 'Desserts',     '🍰', 'Cakes, pastries, and sweet treats', 5,  TRUE, NULL, NOW() + INTERVAL '6 millisecond', NOW()),
    (NEW.id, 'Salads',       '🥗', 'Healthy and fresh tossed salads', 6,  TRUE, NULL, NOW() + INTERVAL '7 millisecond', NOW()),
    (NEW.id, 'Pasta',        '🍝', 'Classic Italian pasta dishes', 7,  TRUE, NULL, NOW() + INTERVAL '8 millisecond', NOW()),
    (NEW.id, 'Chicken',      '🍗', 'Fried, roasted, and grilled chicken', 8,  TRUE, NULL, NOW() + INTERVAL '9 millisecond', NOW()),
    (NEW.id, 'Grills',       '🥩', 'Premium grilled meats and steaks', 9,  TRUE, NULL, NOW() + INTERVAL '10 millisecond', NOW()),
    (NEW.id, 'Sandwiches',   '🥪', 'Freshly made sandwiches and subs', 10, TRUE, NULL, NOW() + INTERVAL '11 millisecond', NOW()),
    (NEW.id, 'Main Dishes',  '🍽️', 'Hearty main dishes and platters', 11, TRUE, NULL, NOW() + INTERVAL '12 millisecond', NOW()),
    (NEW.id, 'Tacos',        '🌮', 'Authentic Mexican tacos and burritos', 12, TRUE, NULL, NOW() + INTERVAL '13 millisecond', NOW()),
    (NEW.id, 'Seafood',      '🦐', 'Fresh fish and seafood dishes', 13, TRUE, NULL, NOW() + INTERVAL '14 millisecond', NOW()),
    (NEW.id, 'Soups',        '🥣', 'Warm and comforting soups', 14, TRUE, NULL, NOW() + INTERVAL '15 millisecond', NOW()),
    (NEW.id, 'Appetizers',   '🥟', 'Starters and bite-sized snacks', 15, TRUE, NULL, NOW() + INTERVAL '16 millisecond', NOW()),
    (NEW.id, 'Breakfast',    '🍳', 'Morning favorites and breakfast plates', 16, TRUE, NULL, NOW() + INTERVAL '17 millisecond', NOW()),
    (NEW.id, 'Sides',        '🍟', 'Side dishes and extras', 17, TRUE, NULL, NOW() + INTERVAL '18 millisecond', NOW()),
    (NEW.id, 'Hot Drinks',   '☕', 'Hot tea, coffee, and specialty drinks', 18, TRUE, NULL, NOW() + INTERVAL '19 millisecond', NOW()),
    (NEW.id, 'Fresh Juices', '🧃', 'Freshly squeezed natural juices', 19, TRUE, NULL, NOW() + INTERVAL '20 millisecond', NOW()),
    (NEW.id, 'Kids Menu',    '🍟', 'Kid-friendly meals and combos', 20, TRUE, NULL, NOW() + INTERVAL '21 millisecond', NOW()),
    (NEW.id, 'Specials',     '⭐', 'Chef specials and limited edition dishes', 21, TRUE, NULL, NOW() + INTERVAL '22 millisecond', NOW());

  -- 2. Insert Starter Demo Dishes with High-Res Professional Photography
  IF v_burger_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
    VALUES (
      NEW.id,
      v_burger_id,
      'Double Classic Beef Burger',
      'Juicy double beef patties with melted cheddar, crisp lettuce, tomato, pickles, and signature sauce on a toasted brioche bun.',
      850.00,
      '/images/demo/double_classic_burger.jpg',
      TRUE, TRUE, TRUE,
      '[{"name": "Classic Beef", "price": 850, "isDefault": true}, {"name": "Spicy Beef", "price": 900}]'::jsonb,
      '[{"name": "Single", "price": 650}, {"name": "Double", "price": 850}, {"name": "Triple", "price": 1100}]'::jsonb,
      '[{"name": "Extra Cheese", "price": 100}, {"name": "Crispy Bacon", "price": 150}]'::jsonb,
      0
    );
  END IF;

  IF v_pizza_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_visible, is_available, is_featured, variants, sizes, extras, sort_order)
    VALUES (
      NEW.id,
      v_pizza_id,
      'Margherita Special Pizza',
      'Authentic Italian crust topped with rich tomato sauce, fresh buffalo mozzarella, fresh basil leaves, and extra virgin olive oil.',
      950.00,
      '/images/demo/margherita_special_pizza.jpg',
      TRUE, TRUE, TRUE,
      '[]'::jsonb,
      '[{"name": "Medium", "price": 950}, {"name": "Large", "price": 1350}]'::jsonb,
      '[{"name": "Extra Mozzarella", "price": 150}, {"name": "Mushrooms", "price": 100}]'::jsonb,
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_default_categories ON restaurants;
CREATE TRIGGER trg_seed_default_categories
    AFTER INSERT ON restaurants
    FOR EACH ROW EXECUTE FUNCTION seed_default_categories();


-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- Hard tenant isolation at the database level.
-- A restaurant can NEVER read or write another restaurant's data —
-- enforced by the database itself, not the application.
--
-- Usage: SET app.restaurant_id = '<uuid>'  before each query session.
-- In Supabase: set via JWT claim or per-request session variable.
-- ==============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_categories" ON categories;
CREATE POLICY "tenant_isolation_categories"
    ON categories
    FOR ALL
    USING     (restaurant_id::text = current_setting('app.restaurant_id', TRUE))
    WITH CHECK (restaurant_id::text = current_setting('app.restaurant_id', TRUE));

DROP POLICY IF EXISTS "tenant_isolation_menu_items" ON menu_items;
CREATE POLICY "tenant_isolation_menu_items"
    ON menu_items
    FOR ALL
    USING     (restaurant_id::text = current_setting('app.restaurant_id', TRUE))
    WITH CHECK (restaurant_id::text = current_setting('app.restaurant_id', TRUE));


-- ==============================================================================
-- 10. INITIAL PLATFORM ADMIN SEED (SUPER_OWNER)
-- Creates the default platform super-admin account.
-- This is the platform operator — NOT a restaurant owner.
--
-- Default credentials:
--   Email    : admin@dzmenu.local
--   Password : Admin@DZMenu2026!
--   Hash     : bcrypt (12 rounds)
--
-- IMPORTANT: Change these credentials immediately after first login.
-- ==============================================================================

INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@dzmenu.local',
    '$2b$12$YyKZL0CDvjLPjMexBuglmOWCNvUgzlAfU49UQMmACyjs2RvM3xavO',
    'Platform Super Owner',
    'SUPER_OWNER',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role       = 'SUPER_OWNER',
    is_active  = TRUE,
    updated_at = NOW();


-- ==============================================================================
-- MIGRATION SAFETY — Ensure all v2.0 columns exist on pre-existing tables.
-- Uses ADD COLUMN IF NOT EXISTS so this block is fully idempotent.
-- Must run BEFORE any index that references these columns.
-- ==============================================================================

-- categories: columns added after initial schema release
ALTER TABLE categories ADD COLUMN IF NOT EXISTS short_name  VARCHAR(100)  NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url   TEXT          NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS badge       VARCHAR(50)   NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active   BOOLEAN       NOT NULL DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ   NULL;

-- FIX: icon was VARCHAR(50) in old schema — must be TEXT to support Fluent emoji URLs
-- Error: "value too long for type character varying(50)"
ALTER TABLE categories ALTER COLUMN icon TYPE TEXT;

-- menu_items: display-control columns added in v2.0
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_visible   BOOLEAN  NOT NULL DEFAULT TRUE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN  NOT NULL DEFAULT TRUE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured  BOOLEAN  NOT NULL DEFAULT FALSE;

-- menu_items: JSONB modifier columns
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sizes    JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS extras   JSONB NOT NULL DEFAULT '[]'::jsonb;

-- menu_items: sort_order
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- ==============================================================================
-- 11. RESTAURANT_THEMES TABLE (SHOPIFY-GRADE THEME ARCHITECTURE)
-- Stores tenant theme instances with versioned settings and sections.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS restaurant_themes (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    preset_id     VARCHAR(50)   NOT NULL,
    name          VARCHAR(255)  NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'draft',
    settings      JSONB         NOT NULL DEFAULT '{
        "schema_version": 1,
        "colors": {
            "primary": "#D97706",
            "accent": "#F59E0B",
            "secondary": "#78350F",
            "background": "#FAF9F5",
            "surface": "#FFFFFF",
            "text": "#18181B",
            "text_secondary": "#71717A"
        },
        "typography": {
            "font_family": "Outfit",
            "heading_weight": "bold"
        },
        "layout": {
            "category_style": "stories",
            "card_style": "hero",
            "show_header_banner": true,
            "show_cart_bar": true,
            "show_search": true
        }
    }'::jsonb,
    sections      JSONB         NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_themes_restaurant 
    ON restaurant_themes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_themes_status 
    ON restaurant_themes(restaurant_id, status);

CREATE OR REPLACE TRIGGER trg_restaurant_themes_updated_at
    BEFORE UPDATE ON restaurant_themes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Active Theme on restaurants: ON DELETE RESTRICT prevents deleting currently live theme
ALTER TABLE restaurants 
    ADD COLUMN IF NOT EXISTS active_theme_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'restaurants' AND constraint_name = 'fk_restaurants_active_theme'
  ) THEN
    ALTER TABLE restaurants 
      ADD CONSTRAINT fk_restaurants_active_theme 
      FOREIGN KEY (active_theme_id) 
      REFERENCES restaurant_themes(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restaurants_active_theme 
    ON restaurants(active_theme_id);


