import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const newStatus = body.status as "PUBLISHED" | "PENDING_APPROVAL" | "DRAFT";

    if (!newStatus || !["PUBLISHED", "PENDING_APPROVAL", "DRAFT"].includes(newStatus)) {
      return NextResponse.json(
        { error: "Trạng thái phê duyệt không hợp lệ!" },
        { status: 400 }
      );
    }

    const userRole = req.headers.get("x-user-role") || body.userRole || "";
    const userEmail = req.headers.get("x-user-email") || body.userEmail || "";

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ Quản trị viên (Admin) mới có quyền phê duyệt cuộc thi!" },
        { status: 403 }
      );
    }

    const result = store.approveMediaContest(slug, newStatus, {
      role: userRole,
      email: userEmail,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contest: result.contest,
      message:
        newStatus === "PUBLISHED"
          ? "Đã phê duyệt và công khai cuộc thi ảnh/video thành công!"
          : "Đã cập nhật trạng thái cuộc thi!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi phê duyệt cuộc thi ảnh/video: " + error.message },
      { status: 500 }
    );
  }
}

