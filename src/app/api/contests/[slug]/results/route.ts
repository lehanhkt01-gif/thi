// src/app/api/contests/[slug]/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contest = store.getContestBySlug(slug);

    if (!contest) {
      return NextResponse.json({ error: "Cuộc thi không tồn tại!" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") === "organization" ? "organization" : "individual";
    const period = searchParams.get("period") === "week" ? "week" : "contest";
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10) || 0;
    const search = searchParams.get("search") || undefined;
    const unitName = searchParams.get("unitName") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    // Lấy thống kê và biểu đồ sóng (Sparklines)
    const stats = store.getContestStats(contest.id);

    // Lấy bảng xếp hạng đa chiều theo chuẩn quy ước (Cá nhân / Tổ chức x Theo tuần / Toàn cuộc thi)
    const multiRes = store.getMultiDimensionalLeaderboard(contest.id, {
      scope,
      period,
      weekOffset,
      search,
      unitName,
      fromDate,
      toDate,
    });

    return NextResponse.json({
      success: true,
      contestTitle: contest.title,
      bannerUrl: contest.bannerUrl,
      creatorEmail: contest.creatorEmail,
      creatorId: contest.creatorId,
      organizerEmail: contest.organizerEmail,
      startTime: contest.startTime,
      endTime: contest.endTime,
      status: contest.status,
      stats,
      units: multiRes.units, // Đồng bộ 2 chiều với đơn vị con đã cấu hình (Ảnh 1)
      scope: multiRes.scope,
      period: multiRes.period,
      periodLabel: multiRes.periodLabel,
      totalParticipants: multiRes.totalParticipants,
      totalAttempts: multiRes.totalAttempts,
      leaderboard: multiRes.rankings,
      rankings: multiRes.rankings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải dữ liệu thống kê: " + error.message },
      { status: 500 }
    );
  }
}
