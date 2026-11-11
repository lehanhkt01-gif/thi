// src/app/api/media-contests/[slug]/tac-pham/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const contest = store.getMediaContestBySlug(slug);

    if (!contest) {
      return NextResponse.json(
        { error: "Không tìm thấy cuộc thi bình chọn!" },
        { status: 404 }
      );
    }

    const allSubmissions = store.getMediaSubmissions(contest.id);
    const submission = allSubmissions.find((s) => s.id === id);

    if (!submission) {
      return NextResponse.json(
        { error: "Không tìm thấy tác phẩm dự thi này!" },
        { status: 404 }
      );
    }

    // Tự động tăng số lượt xem tác phẩm khi thí sinh / người xem truy cập chi tiết
    const isView = req.nextUrl.searchParams.get("view") === "1" || req.headers.get("x-action") === "view";
    if (isView) {
      const viewRes = store.incrementMediaSubmissionViews(id);
      if (viewRes.success) {
        submission.viewsCount = viewRes.viewsCount;
      }
    }

    const otherSubmissions = allSubmissions
      .filter((s) => s.id !== id)
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      contest,
      submission,
      otherSubmissions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải thông tin tác phẩm: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const action = body.action || "view";
    if (action === "share") {
      const res = store.incrementMediaSubmissionShares(id);
      return NextResponse.json({ success: true, sharesCount: res.sharesCount });
    } else {
      const res = store.incrementMediaSubmissionViews(id);
      return NextResponse.json({ success: true, viewsCount: res.viewsCount });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

    let userRole = req.headers.get("x-user-role") || undefined;
    let userEmail = req.headers.get("x-user-email") || undefined;
    let userPhone = req.headers.get("x-user-phone") || undefined;
    let userId = req.headers.get("x-user-id") || undefined;

    try {
      const body = await req.json();
      if (body) {
        if (!userRole && body.userRole) userRole = body.userRole;
        if (!userEmail && body.userEmail) userEmail = body.userEmail;
        if (!userPhone && body.userPhone) userPhone = body.userPhone;
        if (!userId && body.userId) userId = body.userId;
      }
    } catch {}

    const result = store.deleteMediaSubmission(id, {
      role: userRole,
      email: userEmail,
      phone: userPhone,
      id: userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể xóa tác phẩm này!" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa tác phẩm dự thi thành công!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi xóa tác phẩm: " + error.message },
      { status: 500 }
    );
  }
}

