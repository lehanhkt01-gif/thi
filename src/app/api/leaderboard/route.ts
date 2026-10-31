import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scopeParam = searchParams.get("scope");
    const scope = scopeParam === "organization" ? "organization" : "individual";
    const periodParam = searchParams.get("period");
    const period = periodParam === "contest" ? "contest" : "week";
    const contestId = searchParams.get("contestId") || searchParams.get("contestSlug") || undefined;
    const unitName = searchParams.get("unitName") || undefined;
    const search = searchParams.get("search") || undefined;
    const weekOffsetStr = searchParams.get("weekOffset");
    const weekOffset = weekOffsetStr ? parseInt(weekOffsetStr, 10) || 0 : 0;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    const result = store.getMultiDimensionalLeaderboard(contestId, {
      scope,
      period,
      weekOffset,
      unitName,
      search,
      fromDate,
      toDate,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Lỗi lấy dữ liệu bảng xếp hạng:", error);
    return NextResponse.json(
      { error: "Lỗi tải bảng xếp hạng đa chiều: " + error.message },
      { status: 500 }
    );
  }
}
