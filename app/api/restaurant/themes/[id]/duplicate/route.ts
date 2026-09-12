import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/context";
import { themeQueries } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/themes/[id]/duplicate
 * Clones an existing theme instance into a standalone draft copy.
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
    const copy = await themeQueries.duplicate(id, restaurant.id);

    return NextResponse.json({
      success: true,
      theme: copy,
      message: `Created duplicate "${copy.name}" in your library`,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/restaurant/themes/[id]/duplicate] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to duplicate theme";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
