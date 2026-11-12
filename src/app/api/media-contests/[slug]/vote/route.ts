// src/app/api/media-contests/[slug]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    if (!body.submissionId) {
      return NextResponse.json(
        { error: "Thiếu mã tác phẩm bình chọn!" },
        { status: 400 }
      );
    }

    // Lấy thông tin tài khoản đăng nhập (qua headers hoặc body)
    const userRole = req.headers.get("x-user-role") || body.userRole;
    const userEmail = req.headers.get("x-user-email") || body.userEmail;
    const userPhone = req.headers.get("x-user-phone") || body.userPhone;
    const userId = req.headers.get("x-user-id") || body.userId;

    if (!userId && !userEmail && !userPhone) {
      return NextResponse.json(
        {
          error: "Vui lòng đăng nhập tài khoản để thực hiện bình chọn!",
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const result = store.voteMediaSubmission(body.submissionId, {
      id: userId,
      email: userEmail,
      phone: userPhone,
      role: userRole,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Không thể thực hiện bình chọn!",
          requireLogin: result.requireLogin,
          alreadyVoted: result.alreadyVoted,
          votesCount: result.votesCount,
        },
        { status: result.requireLogin ? 401 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      votesCount: result.votesCount,
      message: result.message || "Bình chọn thành công!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi bình chọn: " + error.message },
      { status: 500 }
    );
  }
}
