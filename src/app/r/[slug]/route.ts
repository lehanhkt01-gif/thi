import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /r/[slug]
 * Tự động chuyển hướng HTTP 302 đến trang thi chi tiết và tăng click_count
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const cleanSlug = (slug || "").trim().toLowerCase();

    // Tìm cuộc thi theo customSlug, slug gốc hoặc id
    const contest =
      store.getContestByCustomSlug(cleanSlug) ||
      store.getContestBySlug(cleanSlug) ||
      store.getContestById(cleanSlug);

    if (contest) {
      // Tăng biến đếm lượt click_count bền vững
      store.incrementContestClickCount(contest.id);

      // Chuyển hướng 302 đến trang thi chi tiết
      const targetUrl = new URL(`/thi/${contest.slug}`, req.url);
      
      // Giữ nguyên các query params nếu có (ví dụ utm_source, ref...)
      req.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
      });

      return NextResponse.redirect(targetUrl, 302);
    }

    // Nếu không tìm thấy cuộc thi, chuyển hướng về trang chủ kèm thông báo
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("error", "shortlink_not_found");
    homeUrl.searchParams.set("slug", cleanSlug);
    return NextResponse.redirect(homeUrl, 302);
  } catch (error: any) {
    console.error("Lỗi chuyển hướng shortlink /r/[slug]:", error);
    return NextResponse.redirect(new URL("/", req.url), 302);
  }
}
