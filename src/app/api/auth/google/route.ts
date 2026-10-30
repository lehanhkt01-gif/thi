// src/app/api/auth/google/route.ts - API Đăng nhập và đồng bộ tài khoản Google
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

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
    let { email, name, image, credential } = body;

    // Nếu nhận được Google ID Token (Credential) từ Google Identity Services (GSI)
    if (credential && !email) {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
          if (payload.email) email = payload.email;
          if (payload.name && !name) name = payload.name;
          if (payload.picture && !image) image = payload.picture;
        }
      } catch (e) {
        console.warn("[GoogleAuth] Lỗi giải mã credential:", e);
      }
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thông tin email tài khoản Google!" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const isSystemAdmin = SYSTEM_ADMIN_EMAILS.includes(cleanEmail);

    let user = store.getUserByEmail(cleanEmail);

    if (!user) {
      // Tự động khởi tạo tài khoản mới từ Google (được phê duyệt ngay)
      const defaultName =
        name ||
        (cleanEmail === "lehanhkt01@gmail.com"
          ? "Lê Hạnh - Quản trị viên Ea Súp"
          : cleanEmail.split("@")[0]);

      user = store.createUser({
        name: defaultName,
        email: cleanEmail,
        phone: "0888023023",
        password: "12345678@",
        role: isSystemAdmin ? "ADMIN" : "USER",
        status: "APPROVED",
        organizationName: isSystemAdmin
          ? "Ủy ban Nhân dân xã Ea Súp"
          : "Đăng nhập Google (Ea Súp)",
      });
    } else {
      // Nếu đã tồn tại, đảm bảo tài khoản Admin luôn có quyền ADMIN và APPROVED
      const updates: any = {};
      if (isSystemAdmin) {
        updates.role = "ADMIN";
        updates.status = "APPROVED";
      } else if (user.status === "PENDING") {
        updates.status = "APPROVED";
      }
      if (name && name !== user.name) {
        updates.name = name;
      }
      if (Object.keys(updates).length > 0) {
        user = store.updateUser(user.id, updates) || user;
      }
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role === "ADMIN" ? "ADMIN" : "USER",
      status: "APPROVED",
      organizationName: user.organizationName,
      avatarUrl: image || undefined,
      authProvider: "google",
      loggedInAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: `Đăng nhập Google thành công với vai trò ${sessionUser.role === "ADMIN" ? "Quản trị viên (Admin)" : "Người dùng"}`,
      user: sessionUser,
    });

    // Thiết lập cookie phiên để đồng bộ Single Sign-On cho trình duyệt
    response.cookies.set("cuocthi_auth_session", encodeURIComponent(JSON.stringify(sessionUser)), {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 ngày
      sameSite: "lax",
      httpOnly: false, // Để client script có thể đọc đồng bộ
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý đăng nhập Google: " + error.message },
      { status: 500 }
    );
  }
}
