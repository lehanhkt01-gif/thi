// src/app/api/contests/[slug]/start/route.ts
// QUY TẮC BẢO MẬT SỐ 1: ZERO ANSWER LEAKAGE (Tuyệt đối không lộ đáp án đúng và giải thích)
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

    if (contest.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Cuộc thi hiện chưa mở hoặc đã kết thúc!" }, { status: 400 });
    }

    const body = await req.json();
    const { fullName, cccd, phone, unitId, birthYear, address } = body;

    if (!fullName || !cccd || !phone || !unitId) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ: Họ tên, Số CCCD/Định danh, Số điện thoại và Đơn vị dự thi!" },
        { status: 400 }
      );
    }

    // Đăng ký hoặc lấy thông tin thí sinh
    const participant = store.registerOrGetParticipant(
      contest.id,
      fullName,
      cccd,
      phone,
      unitId,
      birthYear ? parseInt(birthYear, 10) : undefined,
      address
    );

    // Kiểm tra số lượt thi đã thực hiện
    const userAttempts = store.getParticipantAttempts(contest.id, participant.id);
    if (userAttempts.length >= contest.maxAttempts) {
      return NextResponse.json(
        {
          error: `Bạn đã tham gia đủ tối đa ${contest.maxAttempts} lượt thi theo thể lệ quy định!`,
          hasReachedMaxAttempts: true,
          previousAttempts: userAttempts.map((a) => ({
            id: a.id,
            score: a.score,
            accuracyPercent: a.accuracyPercent,
            durationSeconds: a.durationSeconds,
            submittedAt: a.submittedAt,
          })),
        },
        { status: 403 }
      );
    }

    // Lấy IP nếu có
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Khởi tạo phiên thi trên máy chủ (Server Timer kích hoạt từ startedAt)
    const { attempt, safeQuestions } = store.startAttempt(contest.id, participant.id, ipAddress);

    // BẢO MẬT: safeQuestions được lọc hoàn toàn không có correctOptionIds và explanation
    return NextResponse.json({
      success: true,
      message: "Bắt đầu làm bài thi thành công",
      attemptId: attempt.id,
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        cccd: participant.cccd,
        unitName: participant.unitName,
        attemptNumber: userAttempts.length + 1,
        maxAttempts: contest.maxAttempts,
      },
      durationMinutes: contest.durationMinutes,
      startedAt: attempt.startedAt,
      hasTieBreaker: contest.hasTieBreaker,
      questions: safeQuestions, // ZERO ANSWER LEAKAGE
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Không thể bắt đầu làm bài thi!" },
      { status: 500 }
    );
  }
}

// Hỗ trợ GET kiểm tra tình trạng thí sinh và nhận đề thi
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
    const cccd = searchParams.get("cccd");

    if (!cccd) {
      // Trả về câu hỏi dạng an toàn không có đáp án
      const safeQuestions = store.getContestQuestions(contest.id, true);
      return NextResponse.json({
        success: true,
        contestId: contest.id,
        durationMinutes: contest.durationMinutes,
        questions: safeQuestions, // ZERO ANSWER LEAKAGE
      });
    }

    return NextResponse.json({ success: true, message: "Sẵn sàng thi" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi kết nối phòng thi: " + error.message },
      { status: 500 }
    );
  }
}
