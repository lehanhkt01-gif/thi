// src/app/api/admin/users/route.ts - API Quản lý Người dùng & Xét duyệt (Admin & User)
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const users = store.getUsers({ role, status, search });
    return NextResponse.json(
      { success: true, users, total: users.length },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, status, organizationName, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Họ tên và email là bắt buộc" },
        { status: 400 }
      );
    }

    const newUser = store.createUser({
      name,
      email,
      phone: phone || "0888023023",
      role: role || "USER",
      status: status || "PENDING",
      organizationName: organizationName || "Xã Ea Súp",
      password: password || "123456",
    });

    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản thành công",
      user: newUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
