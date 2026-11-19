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

    if (!body.title || !body.authorName || !body.unitName) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ: Tên tác phẩm, Họ tên tác giả và Đơn vị thôn/buôn!" },
        { status: 400 }
      );
    }

    const maxImgs = contest.maxImagesPerSubmission || 5;
    const rawUrls: string[] = Array.isArray(body.mediaUrls) && body.mediaUrls.length > 0
      ? body.mediaUrls.map((u: any) => String(u || "").trim()).filter(Boolean).slice(0, maxImgs)
      : body.mediaUrl && String(body.mediaUrl).trim()
        ? [String(body.mediaUrl).trim()]
        : [];

    if (rawUrls.length === 0) {
      return NextResponse.json(
        {
          error:
            contest.type === "VIDEO"
              ? "Vui lòng tải lên tệp Video dự thi trước khi gửi!"
              : "Vui lòng tải lên Hình ảnh dự thi trước khi gửi!",
        },
        { status: 400 }
      );
    }

    const isVideoMediaUrl = (url: string): boolean => {
      const clean = url.trim().toLowerCase();
      if (clean.startsWith("data:video/")) return true;
      const withoutQuery = clean.split("?")[0].split("#")[0];
      return /\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/.test(withoutQuery);
    };

    if (contest.type === "VIDEO") {
      const hasNonVideo = rawUrls.some((u) => !isVideoMediaUrl(u));
      if (hasNonVideo) {
        return NextResponse.json(
          {
            error:
              "Cuộc thi này đang thiết lập chế độ Bình chọn Video. Không thể nộp hình ảnh hoặc đường dẫn không phải Video (.mp4, .webm, .mov...)!",
          },
          { status: 400 }
        );
      }
    } else if (contest.type === "IMAGE") {
      const hasVideo = rawUrls.some((u) => isVideoMediaUrl(u));
      if (hasVideo) {
        return NextResponse.json(
          {
            error:
              "Cuộc thi này đang thiết lập chế độ Bình chọn Ảnh. Vui lòng chỉ nộp hình ảnh!",
          },
          { status: 400 }
        );
      }
    }

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
      mediaType: contest.type || "IMAGE",
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
