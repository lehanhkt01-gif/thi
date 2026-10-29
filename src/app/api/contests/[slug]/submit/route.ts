// src/app/api/contests/[slug]/submit/route.ts
// CHẤM ĐIỂM SERVER-SIDE, TÍNH THỜI GIAN THẬT & BẢO VỆ PHÒNG THI
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contest = store.getContestBySlug(slug);

    if (!contest) {
      return NextResponse.json({ error: "Cuộc thi không tồn tại!" }, { status: 404 });
    }

    const body = await req.json();
    const {
      attemptId,
      answers, // { [questionId]: ["A"] }
      tieBreakerPrediction,
      tabSwitchCount = 0,
    } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Thiếu mã lượt thi (attemptId)!" }, { status: 400 });
    }

    // Chấm điểm và tính thời gian trên Server
    const result = store.submitAttempt(
      attemptId,
      answers || {},
      tieBreakerPrediction ? parseInt(tieBreakerPrediction, 10) : undefined,
      tabSwitchCount
    );

    return NextResponse.json({
      success: true,
      message: "Nộp bài thi thành công!",
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      accuracyPercent: result.accuracyPercent,
      durationSeconds: result.durationSeconds,
      tabSwitchCount,
      review: result.review, // Trả về chi tiết và căn cứ pháp luật sau khi đã nộp bài
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi khi nộp bài thi!" },
      { status: 500 }
    );
  }
}
