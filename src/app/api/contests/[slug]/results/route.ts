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
    const search = searchParams.get("search") || undefined;
    const unitName = searchParams.get("unitName") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    // Lấy thống kê và biểu đồ sóng (Sparklines)
    const stats = store.getContestStats(contest.id);

    // Lấy bảng xếp hạng theo bộ lọc
    const leaderboard = store.getLeaderboard(contest.id, {
      search,
      unitName,
      fromDate,
      toDate,
    });

    const formattedList = leaderboard.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      fullName: item.participantName,
      cccd: item.participantCccd ? item.participantCccd.slice(0, 4) + "****" + item.participantCccd.slice(-3) : "",
      fullCccd: item.participantCccd,
      unitName: item.unitName,
      score: item.score,
      correctCount: item.correctCount,
      totalQuestions: item.totalQuestions,
      accuracyPercent: item.accuracyPercent,
      durationSeconds: item.durationSeconds,
      tieBreakerPrediction: item.tieBreakerPrediction,
      submittedAt: item.submittedAt,
      attemptCount: (item as any).attemptCount || 1,
      maxAttempts: contest.maxAttempts || 3,
    }));

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
      units: contest.units,
      leaderboard: formattedList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải dữ liệu thống kê: " + error.message },
      { status: 500 }
    );
  }
}
