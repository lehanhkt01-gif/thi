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
    const { fullName, cccd, phone, unitId, subUnitName, birthYear, birthday, address, email, gender, job, workplace } = body;

    const reqKeys: string[] = contest.requiredFieldKeys || [];
    const reqText = (contest.requiredFields || "").toLowerCase();

    const needCccd = reqKeys.includes("cccd") || (reqKeys.length === 0 && (reqText.includes("cccd") || reqText.includes("định danh")));
    const needPhone = reqKeys.includes("phone") || (reqKeys.length === 0 && (reqText.includes("điện thoại") || reqText.includes("phone")));
    const needEmail = reqKeys.includes("email") || (reqKeys.length === 0 && reqText.includes("email"));
    const needBirthday = reqKeys.includes("birthday") || (reqKeys.length === 0 && reqText.includes("ngày sinh"));
    const needGender = reqKeys.includes("gender") || (reqKeys.length === 0 && reqText.includes("giới tính"));
    const needJob = reqKeys.includes("job") || (reqKeys.length === 0 && reqText.includes("nghề nghiệp"));
    const needWorkplace = reqKeys.includes("workplace") || (reqKeys.length === 0 && reqText.includes("công tác"));

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập họ và tên thí sinh!" }, { status: 400 });
    }
    if (needCccd && (!cccd || !cccd.trim())) {
      return NextResponse.json({ error: "Vui lòng nhập số CCCD/Mã định danh!" }, { status: 400 });
    }
    if (needPhone && (!phone || !phone.trim())) {
      return NextResponse.json({ error: "Vui lòng nhập số điện thoại liên hệ!" }, { status: 400 });
    }
    if (needEmail && (!email || !email.trim())) {
      return NextResponse.json({ error: "Vui lòng nhập địa chỉ Email!" }, { status: 400 });
    }
    if (needBirthday && (!birthday && !birthYear)) {
      return NextResponse.json({ error: "Vui lòng nhập ngày tháng năm sinh!" }, { status: 400 });
    }
    if (needGender && (!gender || !gender.trim())) {
      return NextResponse.json({ error: "Vui lòng chọn giới tính!" }, { status: 400 });
    }
    if (needJob && (!job || !job.trim())) {
      return NextResponse.json({ error: "Vui lòng nhập nghề nghiệp!" }, { status: 400 });
    }
    if (needWorkplace && (!workplace || !workplace.trim())) {
      return NextResponse.json({ error: "Vui lòng nhập nơi công tác / trường lớp!" }, { status: 400 });
    }

    // Đăng ký hoặc lấy thông tin thí sinh (Đồng bộ 2 chiều toàn diện)
    const effectiveUnitId = unitId || (contest.units && contest.units[0]?.id) || "u-1";
    const participant = store.registerOrGetParticipant(
      contest.id,
      fullName,
      cccd || "",
      phone || "",
      effectiveUnitId,
      birthYear ? parseInt(String(birthYear), 10) : (birthday ? parseInt(String(birthday).split("-")[0], 10) : undefined),
      address,
      { email, birthday, gender, job, workplace, subUnitName }
    );

    // Kiểm tra số lượt thi đã nộp bài thành công (chỉ tính lượt đã nộp bài)
    const userAttempts = store.getParticipantAttempts(contest.id, participant.id, true);
    if (userAttempts.length >= (contest.maxAttempts || 3)) {
      return NextResponse.json(
        {
          error: `Bạn đã tham gia đủ tối đa ${contest.maxAttempts || 3} lượt thi theo thể lệ quy định!`,
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
        cccd: participant.cccd.startsWith("TEL_") ? "" : participant.cccd,
        phone: participant.phone,
        unitName: participant.unitName,
        attemptNumber: userAttempts.length + 1,
        maxAttempts: contest.maxAttempts || 3,
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

// Hỗ trợ GET kiểm tra tình trạng thí sinh và nhận đề thi (Đồng bộ 2 chiều qua CCCD hoặc SĐT)
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
    const phone = searchParams.get("phone");
    const identifier = cccd || phone;

    if (!identifier) {
      // Trả về câu hỏi dạng an toàn không có đáp án
      const safeQuestions = store.getContestQuestions(contest.id, true);
      return NextResponse.json({
        success: true,
        contestId: contest.id,
        durationMinutes: contest.durationMinutes,
        questions: safeQuestions, // ZERO ANSWER LEAKAGE
      });
    }

    // Tra cứu đồng bộ 2 chiều thông tin thí sinh và số lượt thi theo CCCD hoặc SĐT
    const lookup = store.getParticipantByCccd(identifier, contest.id);
    return NextResponse.json({
      success: true,
      exists: !!lookup.participant,
      participant: lookup.participant
        ? {
            id: lookup.participant.id,
            fullName: lookup.participant.fullName,
            cccd: lookup.participant.cccd.startsWith("TEL_") ? "" : lookup.participant.cccd,
            phone: lookup.participant.phone,
            unitId: lookup.participant.unitId,
            unitName: lookup.participant.unitName,
            birthYear: lookup.participant.birthYear,
            email: lookup.participant.email,
            birthday: lookup.participant.birthday,
            gender: lookup.participant.gender,
            job: lookup.participant.job,
            workplace: lookup.participant.workplace,
          }
        : null,
      submittedAttemptsCount: lookup.submittedAttemptsCount,
      maxAttempts: lookup.maxAttempts,
      remainingAttempts: Math.max(0, lookup.maxAttempts - lookup.submittedAttemptsCount),
      hasReachedMaxAttempts: lookup.submittedAttemptsCount >= lookup.maxAttempts,
      highestScore: lookup.highestScoreAttempt?.score ?? null,
      highestScoreDuration: lookup.highestScoreAttempt?.durationSeconds ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi kết nối phòng thi: " + error.message },
      { status: 500 }
    );
  }
}
