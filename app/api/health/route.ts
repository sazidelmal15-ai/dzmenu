import { NextResponse } from "next/server";
import type { ApiSuccessResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const responseData: ApiSuccessResponse<{
    status: string;
    timestamp: string;
    version: string;
  }> = {
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
    },
  };

  return NextResponse.json(responseData);
}
