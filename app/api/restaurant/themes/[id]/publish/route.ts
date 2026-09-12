import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/context";
import { themeQueries } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/themes/[id]/publish
 * Atomically publishes a theme instance, setting restaurants.active_theme_id as the Single Source of Truth.
 * Strictly resolves owning restaurant for the authenticated user.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await themeQueries.findThemeForUser(id, user.id);

    if (!result) {
      return NextResponse.json({ error: "Theme not found or unauthorized" }, { status: 404 });
    }

    const { restaurant } = result;
    const publishResult = await themeQueries.publishAtomic(id, restaurant.id);

    revalidatePath(`/themes/${id}/editor`);
    revalidatePath("/themes");
    revalidatePath(`/m/${restaurant.slug}`);
    revalidatePath(`/preview/menu/${restaurant.slug}`);

    return NextResponse.json({
      success: true,
      activeThemeId: publishResult.activeThemeId,
      message: "Theme published successfully! Your digital menu is now live with this theme.",
    });
  } catch (error: unknown) {
    console.error("[POST /api/restaurant/themes/[id]/publish] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to publish theme";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
