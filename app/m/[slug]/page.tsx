import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { restaurantQueries, categoryQueries, menuItemQueries } from "@/lib/db/queries";
import { resolveRestaurantTheme } from "@/lib/themes/resolver";
import { getCurrentUser } from "@/lib/auth/context";
import { hasActiveSubscription } from "@/lib/permissions/guards";
import { mapToPresentationModel } from "@/lib/menu/presentation-mapper";
import { ThemeDispatcher } from "@/components/theme-engine/ThemeDispatcher";
import { THEME_REGISTRY } from "@/themes/registry";
import { RestaurantMaintenanceScreen } from "@/components/menu/RestaurantMaintenanceScreen";
import { MenuTracker } from "@/components/analytics/MenuTracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview_theme?: string; preview_live?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await restaurantQueries.findBySlug(slug);

  if (!restaurant) {
    return {
      title: "Menu Not Found | DZMenu",
    };
  }

  const hasActive = await hasActiveSubscription(restaurant.id);

  if (restaurant.status !== "ACTIVE" || !hasActive) {
    return {
      title: `${restaurant.name} | Under Maintenance`,
      description: `The digital menu for ${restaurant.name} is temporarily paused.`,
    };
  }

  return {
    title: `${restaurant.name} | Digital QR Menu`,
    description: restaurant.tagline || restaurant.description || `Browse the official digital menu of ${restaurant.name}.`,
    openGraph: {
      title: `${restaurant.name} — Digital Menu`,
      description: restaurant.tagline || `Browse dishes, specials, and prices online.`,
      images: restaurant.coverUrl ? [restaurant.coverUrl] : undefined,
    },
  };
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview_theme, preview_live } = await searchParams;

  // 1. Resolve restaurant by public slug
  const restaurant = await restaurantQueries.findBySlug(slug);
  if (!restaurant) {
    notFound();
  }

  // 2. Check for authorized owner access
  let isOwner = false;
  const user = await getCurrentUser();
  if (user) {
    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    isOwner = userRestaurants.some((r) => r.id === restaurant.id);
  }

  const isAuthorizedPreview = Boolean(preview_theme && isOwner);
  const isAuthorizedLiveOverride = Boolean(preview_live === "true" && isOwner);

  // 3. Check subscription & lifecycle status (must be ACTIVE with unexpired subscription)
  const hasActive = await hasActiveSubscription(restaurant.id);
  const isLiveForPublic = restaurant.status === "ACTIVE" && hasActive;

  // 4. If restaurant is paused / expired / under maintenance and not in authorized preview mode
  if (!isLiveForPublic && !isAuthorizedPreview && !isAuthorizedLiveOverride) {
    return <RestaurantMaintenanceScreen restaurant={restaurant} isOwner={isOwner} />;
  }

  // 5. Resolve theme, categories & menu items in parallel for maximum speed
  const [theme, categories, items] = await Promise.all([
    resolveRestaurantTheme(restaurant.id, {
      previewThemeId: preview_theme,
      isAuthorizedPreview,
    }),
    categoryQueries.listByRestaurantId(restaurant.id),
    menuItemQueries.listByRestaurantId(restaurant.id),
  ]);

  // 6. Convert to clean decoupled presentation model
  const presentationModel = mapToPresentationModel(restaurant, categories, items);
  const themeId = (theme.presetId || "gourmet").toLowerCase();

  // 7. 100% V2 Unified Presentation Dispatcher
  const targetThemeId = THEME_REGISTRY[themeId] ? themeId : "gourmet";
  const rawSettings = (theme.settings as unknown as Record<string, unknown>) || {};
  const imageSlots = (rawSettings.image_slots as Record<string, string | null>) || {};

  return (
    <>
      {!isLiveForPublic && isOwner && (
        <div className="sticky top-0 z-50 bg-amber-500 text-black px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
          <span>⚠️ Owner Mode: Menu is currently PAUSED for visitors.</span>
          <a
            href={`/m/${restaurant.slug}`}
            className="underline ml-2 hover:opacity-80"
          >
            View Maintenance Page
          </a>
        </div>
      )}
      <ThemeDispatcher
        themeId={targetThemeId}
        rawSettings={rawSettings}
        imageSlots={imageSlots}
        menu={presentationModel}
        isEditorPreview={Boolean(preview_theme)}
      />
      {!isAuthorizedPreview && <MenuTracker restaurantSlug={restaurant.slug} />}
    </>
  );
}
