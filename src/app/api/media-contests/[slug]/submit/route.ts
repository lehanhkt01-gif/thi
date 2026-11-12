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

    // Bắt buộc người dùng phải đăng nhập tài khoản mới được nộp tác phẩm dự thi
    const submitterEmail = (body.submitterEmail || req.headers.get("x-user-email") || "").trim();
    const submitterId = (body.submitterId || req.headers.get("x-user-id") || "").trim();
    if (!submitterEmail && !submitterId) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập tài khoản trước khi nộp tác phẩm dự thi!" },
        { status: 401 }
      );
    }

    // Kiểm tra giới hạn: Mỗi tài khoản chỉ được đăng tối đa 2 tác phẩm dự thi
    const existingUserSubs = store.getUserMediaSubmissions(contest.id || contest.slug, {
      id: submitterId,
      email: submitterEmail || body.authorEmail,
      phone: body.authorPhone,
    });
    if (existingUserSubs.length >= 2) {
      return NextResponse.json(
        { error: "Bạn đã gửi đủ 2 tác phẩm dự thi", maxSubmissionsReached: true },
        { status: 400 }
      );
    }

    if (!body.title || !body.authorName || !body.unitName) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ: Tên tác phẩm, Họ tên tác giả và Đơn vị thôn/buôn!" },
        { status: 400 }
      );
    }

    const maxImgs = contest.maxImagesPerSubmission || 5;
    const rawUrls: string[] = Array.isArray(body.mediaUrls) && body.mediaUrls.length > 0
      ? body.mediaUrls.filter(Boolean).slice(0, maxImgs)
      : body.mediaUrl
        ? [body.mediaUrl]
        : ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"];

    const newSub = store.addMediaSubmission({
      contestId: contest.id,
      contestSlug: contest.slug,
      title: body.title,
      authorName: body.authorName,
      authorPhone: body.authorPhone || "",
      authorCccd: body.authorCccd || "",
      authorEmail: (body.authorEmail || body.submitterEmail || req.headers.get("x-user-email") || "").toLowerCase().trim(),
      userId: body.submitterId || req.headers.get("x-user-id") || undefined,
      unitName: body.unitName,
      mediaType: body.mediaType || contest.type || "IMAGE",
      mediaUrl: rawUrls[0],
      mediaUrls: rawUrls,
      orientation: body.orientation || undefined,
      description: body.description || "",
      status: contest.requireApproval ? "PENDING" : "APPROVED",
    });

    return NextResponse.json({ success: true, submission: newSub });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi nộp tác phẩm dự thi: " + error.message },
      { status: 500 }
    );
  }
}
