// src/app/api/contests/[slug]/share/route.ts - API Chia sẻ quyền quản lý, chỉnh sửa cuộc thi
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
    const contest =
      store.getContestBySlug(slug) ||
      store.getContestById(slug) ||
      store.getMediaContestBySlug(slug);
    if (!contest) {
      return NextResponse.json({ error: "Cuộc thi không tồn tại!" }, { status: 404 });
    }

    // Danh sách tài khoản hệ thống để gợi ý chia sẻ
    const allUsers = store.getUsers({ status: "APPROVED" }).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      organizationName: u.organizationName,
    }));

    return NextResponse.json({
      success: true,
      contestId: contest.id,
      slug: contest.slug,
      title: contest.title,
      creatorEmail: contest.creatorEmail || contest.organizerEmail || "",
      creatorName: contest.creatorName || contest.organizerName || "",
      sharedEmails: contest.sharedEmails || [],
      availableUsers: allUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi lấy thông tin chia sẻ: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const userRole = req.headers.get("x-user-role") || body.userRole;
    const userEmail = req.headers.get("x-user-email") || body.userEmail;
    const userId = req.headers.get("x-user-id") || body.userId;

    const contest =
      store.getContestBySlug(slug) ||
      store.getContestById(slug) ||
      store.getMediaContestBySlug(slug);
    if (!contest) {
      return NextResponse.json({ error: "Cuộc thi không tồn tại!" }, { status: 404 });
    }

    // Danh sách sharedEmails mới
    let newSharedEmails: string[] = [];
    if (Array.isArray(body.sharedEmails)) {
      newSharedEmails = body.sharedEmails;
    } else if (body.action === "add" && body.email) {
      const current = contest.sharedEmails || [];
      newSharedEmails = [...current, body.email];
    } else if (body.action === "remove" && body.email) {
      const current = contest.sharedEmails || [];
      const target = body.email.toLowerCase().trim();
      newSharedEmails = current.filter((e) => e.toLowerCase().trim() !== target);
    } else {
      return NextResponse.json(
        { error: "Dữ liệu chia sẻ không hợp lệ!" },
        { status: 400 }
      );
    }

    const res = store.shareContest(contest.id, newSharedEmails, {
      role: userRole,
      email: userEmail,
      id: userId,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật quyền chia sẻ thành công!",
      sharedEmails: res.contest?.sharedEmails || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi cập nhật chia sẻ quyền quản lý: " + error.message },
      { status: 500 }
    );
  }
}
