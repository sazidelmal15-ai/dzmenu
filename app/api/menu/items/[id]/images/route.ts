import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Return dummy success for uploaded image attachment
    return NextResponse.json({
      data: {
        id: `img_${Date.now()}`,
        itemId: id,
        url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to upload image" }, { status: 500 });
  }
}
