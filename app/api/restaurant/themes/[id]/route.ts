import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/context";
import { themeQueries } from "@/lib/db/queries";
import { THEME_DEFINITIONS } from "@/lib/themes/definitions";
import { themeSectionSchema } from "@/lib/themes/sanitizer";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/themes/[id]
 * Fetches a single theme instance + its definition schema controls for the customizer.
 * Strictly resolves owning restaurant for the authenticated user.
 */
export async function GET(
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

    const { theme, restaurant } = result;
    const definition = THEME_DEFINITIONS[theme.presetId] || THEME_DEFINITIONS.gourmet;
    const isLive = restaurant.activeThemeId === theme.id;

    return NextResponse.json({
      success: true,
      theme: { ...theme, isLive },
      definition: {
        controls: definition.controls,
        supportedSections: definition.supportedSections,
        supportedBlocks: definition.supportedBlocks,
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/restaurant/themes/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching theme" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/restaurant/themes/[id]
 * Updates theme name, settings, and/or sections with validation.
 * Strictly checks tenant authorization against the user's restaurant membership.
 */
export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();

    // 1. Validate theme name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "Theme name cannot be empty" },
          { status: 400 }
        );
      }
      if (body.name.length > 100) {
        return NextResponse.json(
          { error: "Theme name cannot exceed 100 characters" },
          { status: 400 }
        );
      }
    }

    // 2. Validate theme settings if provided
    if (body.settings !== undefined) {
      if (typeof body.settings !== "object" || body.settings === null || Array.isArray(body.settings)) {
        return NextResponse.json(
          { error: "Theme settings must be a valid JSON object" },
          { status: 400 }
        );
      }
    }

    // 3. Validate theme sections if provided
    if (body.sections !== undefined) {
      if (!Array.isArray(body.sections)) {
        return NextResponse.json(
          { error: "Theme sections must be an array" },
          { status: 400 }
        );
      }
      for (const s of body.sections) {
        const secValidation = themeSectionSchema.safeParse(s);
        if (!secValidation.success) {
          return NextResponse.json(
            {
              error: "Invalid section structure in theme payload",
              details: secValidation.error.flatten(),
            },
            { status: 400 }
          );
        }
      }
    }

    const updated = await themeQueries.update(id, restaurant.id, {
      name: body.name,
      settings: body.settings,
      sections: body.sections,
    });

    // Invalidate Next.js cache so that pages re-render with fresh theme data
    revalidatePath(`/themes/${id}/editor`);
    revalidatePath("/themes");
    revalidatePath(`/m/${restaurant.slug}`);
    revalidatePath(`/preview/menu/${restaurant.slug}`);

    return NextResponse.json({
      success: true,
      theme: updated,
      message: "Theme updated successfully",
    });
  } catch (error: unknown) {
    console.error("[PATCH /api/restaurant/themes/[id]] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update theme";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/restaurant/themes/[id]
 * Deletes an unpublished draft theme.
 * Active-theme deletion protection: strictly blocks deleting the active live theme!
 */
export async function DELETE(
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
    const deleteResult = await themeQueries.delete(id, restaurant.id);

    return NextResponse.json({
      success: true,
      deleted: deleteResult.deleted,
      message: "Theme removed from library",
    });
  } catch (error: unknown) {
    console.error("[DELETE /api/restaurant/themes/[id]] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete theme";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
