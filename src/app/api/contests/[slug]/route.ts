// src/app/api/contests/[slug]/route.ts
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

    // Trả về thông tin công khai của cuộc thi (không lộ câu hỏi và đáp án trước khi thi)
    return NextResponse.json({
      success: true,
      contest: {
        id: contest.id,
        title: contest.title,
        slug: contest.slug,
        bannerUrl: contest.bannerUrl,
        themeColor: contest.themeColor || "#DC2626",
        shortDesc: contest.shortDesc || "",
        rulesHtml: contest.rulesHtml,
        organizerName: contest.organizerName,
        organizerAddress: contest.organizerAddress,
        organizerEmail: contest.organizerEmail,
        organizerPhone: contest.organizerPhone,
        announcement: contest.announcement,
        creatorEmail: contest.creatorEmail,
        creatorId: contest.creatorId,
        creatorName: contest.creatorName,
        startTime: contest.startTime,
        endTime: contest.endTime,
        durationMinutes: contest.durationMinutes,
        questionCount: contest.questionCount,
        maxAttempts: contest.maxAttempts,
        hasTieBreaker: contest.hasTieBreaker,
        requiredFields: contest.requiredFields,
        customLeaderboard: contest.customLeaderboard,
        examPassword: contest.examPassword,
        requirePortrait: contest.requirePortrait,
        fullScreenExam: contest.fullScreenExam,
        unitGroupName: contest.unitGroupName,
        unitGroupId: contest.unitGroupId,
        prize1: contest.prize1 || "5.000.000 đồng/giải",
        prize2: contest.prize2 || "3.000.000 đồng/giải",
        prize3: contest.prize3 || "1.000.000 đồng/giải",
        prize4: contest.prize4 || "750.000 đồng/giải",
        status: contest.status,
        audioUrl: contest.audioUrl,
        units: contest.units,
        questions: contest.questions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải thông tin cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const existing = store.getContestBySlug(slug);
    const userRole = req.headers.get("x-user-role") || body.userRole;
    const userEmail = req.headers.get("x-user-email") || body.userEmail;

    if (existing && userRole && userRole !== "ADMIN") {
      const emailA = (userEmail || "").toLowerCase().trim();
      const creatorA = (existing.creatorEmail || existing.organizerEmail || "").toLowerCase().trim();
      if (creatorA && emailA && creatorA !== emailA) {
        return NextResponse.json(
          { error: "Bạn không có quyền chỉnh sửa cuộc thi do người khác tạo!" },
          { status: 403 }
        );
      }
    }

    const updated = store.upsertContest({
      ...body,
      slug,
    });
    return NextResponse.json({ success: true, contest: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi cập nhật cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userRole = req.headers.get("x-user-role") || undefined;
    const userEmail = req.headers.get("x-user-email") || undefined;
    const userId = req.headers.get("x-user-id") || undefined;

    const res = store.deleteContest(slug, {
      role: userRole,
      email: userEmail,
      id: userId,
    });

    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "Không thể xóa cuộc thi!" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, message: "Đã xóa cuộc thi thành công!" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi xóa cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}
