// src/app/api/media-contests/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contest = store.getMediaContestBySlug(slug);

    if (!contest) {
      return NextResponse.json(
        { error: "Không tìm thấy cuộc thi bình chọn!" },
        { status: 404 }
      );
    }

    const submissions = store.getMediaSubmissions(contest.id);

    return NextResponse.json({
      success: true,
      contest,
      submissions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải thông tin cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contest = store.getMediaContestBySlug(slug);
    if (!contest) {
      return NextResponse.json({ error: "Không tìm thấy cuộc thi!" }, { status: 404 });
    }

    const userRole = req.headers.get("x-user-role") || undefined;
    const userEmail = req.headers.get("x-user-email") || undefined;
    const userId = req.headers.get("x-user-id") || undefined;

    const res = store.deleteMediaContest(contest.id, {
      role: userRole,
      email: userEmail,
      id: userId,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error || "Không thể xóa cuộc thi!" }, { status: 403 });
    }
    return NextResponse.json({ success: true, message: "Đã xóa cuộc thi thành công!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const targetId = body.editingId || body.id || slug;
    let contest = store.getMediaContestBySlug(targetId);
    if (!contest) {
      contest = store.getMediaContestBySlug(slug);
    }
    if (!contest) {
      return NextResponse.json({ error: "Không tìm thấy cuộc thi!" }, { status: 404 });
    }

    const userRole = req.headers.get("x-user-role") || body.editorRole || body.userRole;
    const userEmail = req.headers.get("x-user-email") || body.editorEmail || body.userEmail;
    const userId = req.headers.get("x-user-id") || body.editorId || body.userId;

    if (!userEmail && !userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập tài khoản có thẩm quyền để chỉnh sửa cuộc thi!" },
        { status: 401 }
      );
    }

    const canEdit = store.canUserEditMediaContest(contest, {
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

    const updated = store.updateMediaContest(contest.id, body);
    return NextResponse.json({ success: true, contest: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return PATCH(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return PATCH(req, context);
}
