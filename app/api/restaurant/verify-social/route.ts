import { NextRequest, NextResponse } from "next/server";
import { parseSocialLink, SocialPlatform } from "@/lib/utils/social-verifier";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get("platform") || "tiktok") as SocialPlatform;
    const input = searchParams.get("input") || "";

    if (!input.trim()) {
      return NextResponse.json({
        isValidPlatform: true,
        extractedUsername: null,
        canonicalUrl: null,
        status: "EMPTY",
        message: "",
      });
    }

    // Validate platform domain, profile URL structure, and extract handle
    const parsed = parseSocialLink(input, platform);

    if (!parsed.isValidPlatform || !parsed.extractedUsername) {
      return NextResponse.json({
        isValidPlatform: false,
        extractedUsername: null,
        canonicalUrl: null,
        status: "INVALID_PLATFORM",
        message: "رابط غير صالح",
      });
    }

    // Valid platform link
    let label = "المعرف المستخرج:";
    if (platform === "facebook") label = "الصفحة المستخرجة:";

    return NextResponse.json({
      isValidPlatform: true,
      extractedUsername: parsed.extractedUsername,
      canonicalUrl: parsed.canonicalUrl,
      status: "VALID",
      message: `${label} ${parsed.extractedUsername}`,
    });
  } catch (error: any) {
    console.error("[verify-social] Error:", error);
    return NextResponse.json(
      {
        isValidPlatform: false,
        status: "ERROR",
        message: "حدث خطأ أثناء فحص الرابط",
      },
      { status: 500 }
    );
  }
}
