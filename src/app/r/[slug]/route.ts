import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Lấy Base URL chính xác trong môi trường Docker, Nginx Proxy hoặc Localhost
 * Tuyệt đối không để lọt 0.0.0.0 (non-routable meta-address gây ERR_ADDRESS_INVALID)
 */
function resolveBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto");

  // Ưu tiên x-forwarded-host từ Reverse Proxy / Cloudflare
  let host = (forwardedHost || hostHeader || "thi.easupso.com").trim();

  // Nếu host chứa 0.0.0.0 hoặc port nội bộ container 3000/8077
  if (host.includes("0.0.0.0") || host.includes(":3000") || host.includes(":8077") || !host) {
    host = (forwardedHost && !forwardedHost.includes("0.0.0.0")) ? forwardedHost : "thi.easupso.com";
  }

  // Xác định giao thức (https/http)
  let protocol = "https";
  if (forwardedProto) {
    protocol = forwardedProto.split(",")[0].trim();
  } else if (host.includes("localhost") || host.startsWith("192.168.")) {
    protocol = "http";
  }

  return `${protocol}://${host}`;
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

    const baseUrl = resolveBaseUrl(req);

    if (contest) {
      // Tăng biến đếm lượt click_count bền vững
      store.incrementContestClickCount(contest.id);

      // Chuyển hướng 302 đến trang thi chi tiết với URL chuẩn
      const targetUrl = new URL(`/thi/${contest.slug}`, baseUrl);

      // Giữ nguyên các query params nếu có (ví dụ utm_source, ref...)
      req.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
      });

      return NextResponse.redirect(targetUrl, 302);
    }

    // Nếu không tìm thấy cuộc thi, chuyển hướng về trang chủ kèm thông báo
    const homeUrl = new URL("/", baseUrl);
    homeUrl.searchParams.set("error", "shortlink_not_found");
    homeUrl.searchParams.set("slug", cleanSlug);
    return NextResponse.redirect(homeUrl, 302);
  } catch (error: any) {
    console.error("Lỗi chuyển hướng shortlink /r/[slug]:", error);
    const fallbackBaseUrl = resolveBaseUrl(req);
    return NextResponse.redirect(new URL("/", fallbackBaseUrl), 302);
  }
}
