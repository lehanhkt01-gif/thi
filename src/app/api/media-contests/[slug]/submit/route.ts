// src/app/api/media-contests/[slug]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contest = store.getMediaContestBySlug(slug);

    if (!contest) {
      return NextResponse.json(
        { error: "Không tìm thấy cuộc thi bình chọn!" },
        { status: 404 }
      );
    }

    const body = await req.json();

    if (!body.title || !body.authorName || !body.unitName) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ: Tên tác phẩm, Họ tên tác giả và Đơn vị thôn/buôn!" },
        { status: 400 }
      );
    }

    const newSub = store.addMediaSubmission({
      contestId: contest.id,
      contestSlug: contest.slug,
      title: body.title,
      authorName: body.authorName,
      authorPhone: body.authorPhone || "",
      authorCccd: body.authorCccd || "",
      unitName: body.unitName,
      mediaType: body.mediaType || contest.type || "IMAGE",
      mediaUrl: body.mediaUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      description: body.description || "",
      status: "APPROVED",
    });

    return NextResponse.json({ success: true, submission: newSub });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi nộp tác phẩm dự thi: " + error.message },
      { status: 500 }
    );
  }
}
