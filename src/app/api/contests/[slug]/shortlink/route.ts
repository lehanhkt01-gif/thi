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

  let host = (forwardedHost || hostHeader || "thi.easupso.com").trim();

  // Nếu host chứa 0.0.0.0 hoặc port nội bộ container 3000/8077
  if (host.includes("0.0.0.0") || host.includes(":3000") || host.includes(":8077") || !host) {
    host = (forwardedHost && !forwardedHost.includes("0.0.0.0")) ? forwardedHost : "thi.easupso.com";
  }

  let protocol = "https";
  if (forwardedProto) {
    protocol = forwardedProto.split(",")[0].trim();
  } else if (host.includes("localhost") || host.startsWith("192.168.")) {
    protocol = "http";
  }

  return `${protocol}://${host}`;
}

/**
 * GET /api/contests/[slug]/shortlink
 * Lấy thông tin link rút gọn, clickCount và URL
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const contest = store.getContestBySlug(slug) || store.getContestById(slug) || store.getContestByCustomSlug(slug);

    if (!contest) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy cuộc thi." },
        { status: 404 }
      );
    }

    const baseUrl = resolveBaseUrl(req);
    const effectiveSlug = contest.customSlug || contest.slug;
    const shortUrl = `${baseUrl}/r/${effectiveSlug}`;
    const directUrl = `${baseUrl}/thi/${contest.slug}`;

    return NextResponse.json({
      success: true,
      contestId: contest.id,
      contestTitle: contest.title,
      slug: contest.slug,
      customSlug: contest.customSlug || "",
      clickCount: contest.clickCount || 0,
      shortUrl,
      directUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ nội bộ." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contests/[slug]/shortlink
 * Kiểm tra tính khả dụng của customSlug (Realtime validation)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { customSlug } = body;

    const contest = store.getContestBySlug(slug) || store.getContestById(slug);
    if (!contest) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy cuộc thi." },
        { status: 404 }
      );
    }

    const check = store.checkCustomSlugAvailable(customSlug, contest.id);
    const baseUrl = resolveBaseUrl(req);
    const previewUrl = `${baseUrl}/r/${(customSlug || "").trim().toLowerCase()}`;

    return NextResponse.json({
      success: true,
      available: check.available,
      reason: check.reason,
      previewUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi kiểm tra link rút gọn." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contests/[slug]/shortlink
 * Cập nhật customSlug cho cuộc thi
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { customSlug } = body;

    const contest = store.getContestBySlug(slug) || store.getContestById(slug);
    if (!contest) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy cuộc thi." },
        { status: 404 }
      );
    }

    const result = store.updateContestCustomSlug(contest.id, customSlug);
    if (!result.success || !result.contest) {
      return NextResponse.json(
        { success: false, error: result.error || "Không thể cập nhật link rút gọn." },
        { status: 400 }
      );
    }

    const baseUrl = resolveBaseUrl(req);
    const shortUrl = `${baseUrl}/r/${result.contest.customSlug}`;

    return NextResponse.json({
      success: true,
      message: `Đã lưu link rút gọn thành công: /r/${result.contest.customSlug}`,
      customSlug: result.contest.customSlug,
      shortUrl,
      contest: result.contest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật link rút gọn." },
      { status: 500 }
    );
  }
}
