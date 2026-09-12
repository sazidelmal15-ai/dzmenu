import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth/context";
import { restaurantQueries, themeQueries } from "@/lib/db/queries";
import { getSupabaseStorageClient, deleteStorageFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "menu-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

/**
 * POST /api/restaurant/themes/upload
 * Securely uploads a theme artwork / banner image to Object Storage.
 * Optionally deletes previous image to prevent orphaned storage waste.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Tenant Ownership Check
    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    if (!userRestaurants || userRestaurants.length === 0) {
      return NextResponse.json({ error: "No associated restaurant found" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const previousUrl = formData.get("previousUrl") as string | null;
    const requestedRestaurantId = formData.get("restaurantId") as string | null;
    const themeId = formData.get("themeId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Resolve target restaurant
    let targetRestaurant = userRestaurants[0];
    if (requestedRestaurantId) {
      const matched = userRestaurants.find((r) => r.id === requestedRestaurantId);
      if (!matched) {
        return NextResponse.json(
          { error: "Access denied to the specified restaurant" },
          { status: 403 }
        );
      }
      targetRestaurant = matched;
    }

    // If themeId is provided, verify theme ownership
    if (themeId) {
      const theme = await themeQueries.findById(themeId, targetRestaurant.id);
      if (!theme) {
        return NextResponse.json(
          { error: "Theme instance not found or does not belong to your restaurant" },
          { status: 404 }
        );
      }
    }

    // 3. MIME Type & File Size Validation
    const ext = ALLOWED_MIME_TYPES[file.type.toLowerCase()];
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid image format. Allowed formats: PNG, JPEG, WebP, SVG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB maximum limit" },
        { status: 400 }
      );
    }

    // 4. Clean up previous image if replacing
    if (previousUrl && previousUrl.includes("supabase.co")) {
      try {
        await deleteStorageFile(previousUrl, BUCKET);
      } catch (delErr) {
        console.warn("[Theme Media Upload] Non-blocking error cleaning up old image:", delErr);
      }
    }

    // 5. Secure Random UUID Object Path
    const uniqueId = randomUUID();
    const folder = `restaurants/${targetRestaurant.id}/themes/${themeId || "assets"}`;
    const filePath = `${folder}/${uniqueId}${ext}`;

    const supabase = getSupabaseStorageClient();
    if (!supabase) {
      console.error("[Theme Media Upload] Supabase Storage client is not configured.");
      return NextResponse.json(
        { error: "Storage service configuration missing on server" },
        { status: 500 }
      );
    }

    // 6. Convert File to buffer & Upload to Object Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Theme Media Upload] Supabase storage upload error:", uploadError.message);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 7. Retrieve public HTTPS URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrlData.publicUrl,
        filePath,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error: unknown) {
    console.error("[POST /api/restaurant/themes/upload] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/restaurant/themes/upload
 * Removes a theme image from Supabase Storage bucket.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRestaurants = await restaurantQueries.findByUserId(user.id);
    if (!userRestaurants || userRestaurants.length === 0) {
      return NextResponse.json({ error: "No associated restaurant found" }, { status: 403 });
    }

    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Delete file from Supabase storage
    const deleted = await deleteStorageFile(url, BUCKET);

    return NextResponse.json({
      success: true,
      deleted,
      message: "Image deleted from storage",
    });
  } catch (error: unknown) {
    console.error("[DELETE /api/restaurant/themes/upload] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
