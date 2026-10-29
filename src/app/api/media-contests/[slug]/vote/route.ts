// src/app/api/media-contests/[slug]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await req.json();

    if (!body.submissionId) {
      return NextResponse.json(
        { error: "Thiếu mã tác phẩm bình chọn!" },
        { status: 400 }
      );
    }

    const result = store.voteMediaSubmission(body.submissionId);

    if (!result.success) {
      return NextResponse.json(
        { error: "Không tìm thấy tác phẩm này để bình chọn!" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      votesCount: result.votesCount,
      message: "Bình chọn thành công!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi bình chọn: " + error.message },
      { status: 500 }
    );
  }
}
