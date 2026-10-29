// src/app/api/auth/login/route.ts - API Đăng nhập xác thực và kiểm tra phê duyệt & phân quyền
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ email/tên tài khoản và mật khẩu!" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = store.getUserByEmail(cleanEmail);

    const SYSTEM_ADMIN_EMAILS = [
      "lehanhkt01@gmail.com",
      "admin@easupso.com",
      "easupsohoa@gmail.com",
    ];

    const isSystemAdmin = SYSTEM_ADMIN_EMAILS.includes(cleanEmail);

    if (!user) {
      if (isSystemAdmin) {
        // Tự động khởi tạo và phê duyệt tài khoản Quản trị viên hệ thống vào cơ sở dữ liệu bền vững
        user = store.createUser({
          name: cleanEmail === "lehanhkt01@gmail.com" ? "Lê Hạnh - Quản trị viên Ea Súp" : "Quản trị viên Hệ thống Ea Súp",
          email: cleanEmail,
          phone: "0888023023",
          password: password,
          role: "ADMIN",
          status: "APPROVED",
          organizationName: "Ủy ban Nhân dân xã Ea Súp",
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Tài khoản hoặc email chưa được đăng ký trong hệ thống. Vui lòng đăng ký tài khoản mới!",
          },
          { status: 404 }
        );
      }
    }

    // 1. Kiểm tra mật khẩu (nếu user có mật khẩu)
    if (user.password && user.password !== password) {
      // Nếu là tài khoản Quản trị viên hệ thống, cập nhật mật khẩu mới và cho phép đăng nhập
      if (isSystemAdmin) {
        user = store.updateUser(user.id, { password }) || user;
      } else {
        return NextResponse.json(
          { success: false, error: "Mật khẩu đăng nhập không chính xác! Vui lòng thử lại." },
          { status: 401 }
        );
      }
    }

    // Đảm bảo tài khoản Quản trị viên hệ thống luôn ở trạng thái APPROVED và role ADMIN
    if (isSystemAdmin && (user.status !== "APPROVED" || user.role !== "ADMIN")) {
      user = store.updateUser(user.id, { status: "APPROVED", role: "ADMIN" }) || user;
    }

    // 2. Kiểm tra trạng thái xét duyệt: CHƯA PHÊ DUYỆT THÌ CHƯA THỂ ĐĂNG NHẬP THÀNH CÔNG
    if (user.status === "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản của bạn đang ở trạng thái 'Chờ xét duyệt'. Vui lòng đợi Quản trị viên (Admin) phê duyệt trước khi có thể đăng nhập vào hệ thống!",
          userStatus: "PENDING",
        },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản của bạn đã bị từ chối phê duyệt. Không thể đăng nhập vào hệ thống!",
          userStatus: "REJECTED",
        },
        { status: 403 }
      );
    }

    // 3. Phân quyền: Mặc định là Người dùng (USER), chỉ Admin khi được chỉ định rõ trong cơ sở dữ liệu
    const role = user.role === "ADMIN" ? "ADMIN" : "USER";

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: role,
      status: user.status,
      organizationName: user.organizationName,
      loggedInAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Đăng nhập thành công với vai trò ${role === "ADMIN" ? "Quản trị viên (Admin)" : "Người dùng"}!`,
      user: sessionUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý đăng nhập máy chủ" },
      { status: 500 }
    );
  }
}
