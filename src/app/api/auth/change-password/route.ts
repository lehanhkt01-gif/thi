// src/app/api/auth/change-password/route.ts - API Người dùng và Admin đổi mật khẩu an toàn
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { updateEnvAdminPassword } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SYSTEM_ADMIN_EMAILS = [
  "lehanhkt01@gmail.com",
  "admin@easupso.com",
  "easupsohoa@gmail.com",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, currentPassword, newPassword } = body;

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới phải có tối thiểu 6 ký tự!" },
        { status: 400 }
      );
    }

    let user = userId ? store.getUserById(userId) : undefined;
    if (!user && email) {
      user = store.getUserByEmail(email.trim().toLowerCase());
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thông tin tài khoản người dùng!" },
        { status: 404 }
      );
    }

    // Kiểm tra mật khẩu hiện tại nếu tài khoản đã có mật khẩu
    if (user.password && user.password !== currentPassword) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!" },
        { status: 400 }
      );
    }

    const trimmedNewPass = newPassword.trim();

    // 1. Cập nhật mật khẩu trong cơ sở dữ liệu bền vững
    const updated = store.updateUserPassword(user.id, trimmedNewPass);

    // 2. Nếu là tài khoản Admin toàn quyền, cập nhật vào file bảo mật .env
    const isSystemAdmin =
      user.role === "ADMIN" || SYSTEM_ADMIN_EMAILS.includes(user.email.toLowerCase());

    let envUpdated = false;
    if (isSystemAdmin) {
      envUpdated = updateEnvAdminPassword(trimmedNewPass);
    }

    return NextResponse.json({
      success: true,
      message: isSystemAdmin
        ? "Đổi mật khẩu Admin thành công! Mật khẩu mới đã được lưu an toàn vào tệp môi trường .env trên hệ thống."
        : "Đổi mật khẩu tài khoản thành công!",
      user: {
        id: updated?.id,
        name: updated?.name,
        email: updated?.email,
        role: updated?.role,
      },
      envSaved: isSystemAdmin ? envUpdated : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý đổi mật khẩu" },
      { status: 500 }
    );
  }
}
