// src/app/api/admin/users/[id]/route.ts - Sửa, xóa, phân quyền & xét duyệt người dùng
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = store.getUserById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    // Hành động xét duyệt nhanh
    if (body.action === "APPROVE" || body.action === "APPROVED") {
      const approved = store.approveUser(id, "APPROVED");
      return NextResponse.json({ success: true, message: "Đã phê duyệt tài khoản thành công", user: approved });
    }

    if (body.action === "REJECT" || body.action === "REJECTED") {
      const rejected = store.approveUser(id, "REJECTED");
      return NextResponse.json({ success: true, message: "Đã từ chối tài khoản", user: rejected });
    }

    // Hành động đổi vai trò (Phân quyền Admin <-> Người dùng)
    if (body.action === "CHANGE_ROLE" && (body.role === "ADMIN" || body.role === "USER")) {
      const updated = store.changeUserRole(id, body.role);
      return NextResponse.json({
        success: true,
        message: `Đã thay đổi quyền tài khoản thành ${body.role === "ADMIN" ? "Quản trị viên (Admin)" : "Người dùng"}`,
        user: updated,
      });
    }

    // Hành động đặt lại mật khẩu về mật khẩu mặc định 12345678@
    if (body.action === "RESET_PASSWORD") {
      const DEFAULT_RESET_PASSWORD = process.env.DEFAULT_RESET_PASSWORD || "12345678@";
      const updated = store.updateUserPassword(id, DEFAULT_RESET_PASSWORD);
      return NextResponse.json({
        success: true,
        message: `Đã đặt lại mật khẩu cho tài khoản "${existing.name}" về mật khẩu mặc định: 12345678@`,
        user: updated,
      });
    }

    // Cập nhật thông tin thông thường
    const updated = store.updateUser(id, body);
    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const existing = store.getUserById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const ok = store.deleteUser(id);
    return NextResponse.json({
      success: ok,
      message: ok ? `Đã xóa tài khoản "${existing.name}" khỏi hệ thống` : "Xóa thất bại",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
