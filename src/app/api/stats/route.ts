import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = store.getSystemStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải thống kê hệ thống: " + error.message },
      { status: 500 }
    );
  }
}
