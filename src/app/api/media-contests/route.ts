// src/app/api/media-contests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const list = store.getMediaContests();
    return NextResponse.json({ success: true, contests: list });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải danh sách cuộc thi ảnh/video: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Hỗ trợ cập nhật cuộc thi hiện có qua POST (tránh lỗi Nginx/WAF chặn method PATCH trả về HTML)
    const targetUpdateId = body.editingId || (body.action === "update" ? body.id || body.slug : null);
    if (targetUpdateId) {
      const existing =
        store.getMediaContestBySlug(targetUpdateId) ||
        (body.slug ? store.getMediaContestBySlug(body.slug) : undefined);

      const userRole = req.headers.get("x-user-role") || body.editorRole || body.userRole;
      const userEmail = req.headers.get("x-user-email") || body.editorEmail || body.userEmail;
      const userId = req.headers.get("x-user-id") || body.editorId || body.userId;

      if (existing) {
        if (!userEmail && !userId && userRole !== "ADMIN") {
          return NextResponse.json(
            { error: "Vui lòng đăng nhập tài khoản có thẩm quyền để chỉnh sửa cuộc thi!" },
            { status: 401 }
          );
        }
        const canEdit = store.canUserEditMediaContest(existing, {
          role: userRole,
          email: userEmail,
          id: userId,
        });
        if (!canEdit) {
          return NextResponse.json(
            { error: "Chỉ người tạo, Quản trị viên (Admin) hoặc người được chia sẻ quyền mới được chỉnh sửa cuộc thi này!" },
            { status: 403 }
          );
        }
      }

      // Quy định an toàn: Chỉ Quản trị viên (Admin) mới có quyền duyệt sang PUBLISHED
      if (userRole !== "ADMIN") {
        if (body.status === "PUBLISHED" && existing?.status !== "PUBLISHED") {
          body.status = "PENDING_APPROVAL";
        }
      }

      const updated = store.updateMediaContest(targetUpdateId, body);
      if (updated) {
        return NextResponse.json({ success: true, contest: updated, mode: "updated" });
      }
      // Fallback: thử tìm theo slug nếu truyền id không khớp
      if (body.slug) {
        const updatedBySlug = store.updateMediaContest(body.slug, body);
        if (updatedBySlug) {
          return NextResponse.json({ success: true, contest: updatedBySlug, mode: "updated" });
        }
      }
    }

    if (!body.title) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên cuộc thi bình chọn!" },
        { status: 400 }
      );
    }

    const creatorRole = req.headers.get("x-user-role") || body.editorRole || body.userRole || "";
    const newMediaStatus =
      creatorRole === "ADMIN"
        ? (body.status || "PUBLISHED")
        : (body.status === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL");

    const newContest = store.createMediaContest({
      ...body,
      title: body.title,
      slug: body.slug,
      type: body.type || "IMAGE",
      bannerUrl: body.bannerUrl || "/images/contest_stage_banner.jpg",
      startDate: body.startDate || body.submitStartDate || "2026-11-10T07:00",
      endDate: body.endDate || body.voteEndDate || "2026-11-24T07:00",
      submitStartDate: body.submitStartDate || body.startDate || "2026-11-10T07:00",
      submitEndDate: body.submitEndDate || "2026-11-18T07:00",
      voteStartDate: body.voteStartDate || "2026-11-18T08:00",
      voteEndDate: body.voteEndDate || body.endDate || "2026-11-24T07:00",
      displayStartDate: body.displayStartDate || "10/11/2026",
      displayEndDate: body.displayEndDate || "24/11/2026",
      status: newMediaStatus,
      description: body.description || "",
      layoutModes: body.layoutModes || (body.layoutMode === "both" ? ["vertical", "horizontal"] : [body.layoutMode || "vertical"]),
      layoutMode: body.layoutMode || "vertical",
      maxImagesPerSubmission: Number(body.maxImagesPerSubmission) > 0 ? Number(body.maxImagesPerSubmission) : 5,
      organizerName: body.organizerName || "Ủy ban MTTQ Việt Nam & Đoàn Thanh niên xã Ea Súp",
      creatorEmail: body.creatorEmail,
      creatorId: body.creatorId,
      creatorName: body.creatorName,
    });

    return NextResponse.json({ success: true, contest: newContest, mode: "created" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi lưu cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}
