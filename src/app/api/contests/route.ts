// src/app/api/contests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const contests = store.getContests();
    const stats = store.getSystemStats();
    // Ẩn bớt danh sách câu hỏi khi lấy danh sách tổng quát
    const summarized = contests.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      bannerUrl: c.bannerUrl,
      organizerName: c.organizerName,
      organizerEmail: c.organizerEmail,
      creatorEmail: c.creatorEmail,
      creatorId: c.creatorId,
      creatorName: c.creatorName,
      startTime: c.startTime,
      endTime: c.endTime,
      durationMinutes: c.durationMinutes,
      questionCount: c.questionCount,
      maxAttempts: c.maxAttempts,
      status: c.status,
      units: c.units,
      unitCount: c.units.length,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, contests: summarized, stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải danh sách cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên cuộc thi và đường dẫn tĩnh (slug)!" },
        { status: 400 }
      );
    }

    // Nếu cuộc thi đã tồn tại (do đã lưu nháp ở Bước 1 hoặc đang chỉnh sửa), cập nhật và xuất bản
    const existing = store.getContestBySlug(body.slug);
    if (existing) {
      const updated = store.upsertContest({
        ...body,
        slug: body.slug,
        status: body.status || "PUBLISHED",
      });
      return NextResponse.json({ success: true, contest: updated }, { status: 200 });
    }

    const newContest = store.createContest({
      organizationId: body.organizationId || "org-ubnd",
      organizationName: body.organizationName || "Ủy ban Nhân dân xã Ea Súp",
      title: body.title,
      slug: body.slug,
      bannerUrl: body.bannerUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
      rulesHtml: body.rulesHtml || "<p>Thể lệ cuộc thi trực tuyến xã Ea Súp...</p>",
      organizerName: body.organizerName || "Ủy ban Nhân dân xã Ea Súp",
      organizerAddress: body.organizerAddress || "Trung tâm hành chính xã Ea Súp",
      organizerEmail: body.organizerEmail || "ubnd.easup@daklak.gov.vn",
      organizerPhone: body.organizerPhone || "0262.3688.114",
      announcement: body.announcement || "",
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime || new Date(Date.now() + 30 * 86400000).toISOString(),
      durationMinutes: parseInt(body.durationMinutes || "15", 10),
      questionCount: parseInt(body.questionCount || "10", 10),
      maxAttempts: parseInt(body.maxAttempts || "3", 10),
      hasTieBreaker: body.hasTieBreaker !== false,
      status: body.status || "PUBLISHED",
      audioUrl: body.audioUrl || "",
      themeColor: body.themeColor || "#DC2626",
      shortDesc: body.shortDesc || "",
      creatorEmail: body.creatorEmail || undefined,
      creatorId: body.creatorId || undefined,
      creatorName: body.creatorName || undefined,
      requiredFields: body.requiredFields || "Họ tên thí sinh, Số điện thoại, CCCD/Mã định danh",
      customLeaderboard: body.customLeaderboard || "",
      examPassword: body.examPassword || "",
      requirePortrait: body.requirePortrait || "none",
      fullScreenExam: body.fullScreenExam ?? true,
      units: (body.units || []).map((u: any, idx: number) => ({
        id: u.id || `unit-${idx + 1}`,
        contestId: "",
        name: typeof u === "string" ? u : u.name,
        groupType: u.groupType || "VILLAGE",
      })),
      questions: (body.questions && body.questions.length > 0)
        ? body.questions.map((q: any, idx: number) => ({
            id: q.id || `q-custom-${Date.now()}-${idx + 1}`,
            category: q.category || "Pháp luật chung",
            content: q.content,
            questionType: q.questionType || "SINGLE_CHOICE",
            options: q.options || [],
            correctOptionIds: q.correctOptionIds || ["A"],
            explanation: q.explanation || "Căn cứ quy định pháp luật hiện hành.",
            points: q.points || 10,
          }))
        : store.getMasterQuestionBank().slice(0, parseInt(body.questionCount || "5", 10)),
    });

    return NextResponse.json({ success: true, contest: newContest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Không thể tạo cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}
