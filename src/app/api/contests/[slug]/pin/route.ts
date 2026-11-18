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
    const isPinned = Boolean(body.isPinned);

    const userRole = req.headers.get("x-user-role") || body.userRole || "";
    const userEmail = req.headers.get("x-user-email") || body.userEmail || "";

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ Quản trị viên (Admin) mới có quyền ghim cuộc thi lên trên cùng!" },
        { status: 403 }
      );
    }

    const result = store.pinContest(slug, isPinned, {
      role: userRole,
      email: userEmail,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contest: result.contest,
      message: isPinned
        ? "Đã ghim cuộc thi lên trên cùng (đồng bộ với Trang chủ)!"
        : "Đã bỏ ghim cuộc thi!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi ghim cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}
