import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMimeTypeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function tryReadLocalBannerFile(relativeUrl: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const cleanRel = relativeUrl.split("?")[0].replace(/^\/+/, "");
  const candidates = [
    path.join(process.cwd(), "public", cleanRel),
    path.join(process.cwd(), "storage", cleanRel),
  ];

  // Nếu là /uploads/xxx, thử tìm thêm trong storage/uploads/xxx
  if (cleanRel.startsWith("uploads/")) {
    const fileName = path.basename(cleanRel);
    candidates.push(path.join(process.cwd(), "public", "uploads", fileName));
    candidates.push(path.join(process.cwd(), "storage", "uploads", fileName));
  }

  for (const filePath of candidates) {
    try {
      const buf = await readFile(filePath);
      if (buf && buf.length > 0) {
        return {
          buffer: buf,
          mimeType: getMimeTypeFromExt(filePath),
        };
      }
    } catch {}
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug || "").trim();

    let bannerUrl = "";

    if (cleanSlug === "home" || cleanSlug === "default") {
      const mediaContests = store.getMediaContests().filter((c) => c.status !== "CLOSED");
      const contests = store.getContests();
      bannerUrl =
        mediaContests[0]?.bannerUrl ||
        contests[0]?.bannerUrl ||
        "/banner-easup.png";
    } else {
      const mediaContest = store.getMediaContestBySlug(cleanSlug);
      if (mediaContest?.bannerUrl) {
        bannerUrl = mediaContest.bannerUrl;
      } else {
        const contest =
          store.getContestBySlug(cleanSlug) ||
          store.getContestById(cleanSlug) ||
          store.getContestByAnySlug(cleanSlug) ||
          store.getContestByCustomSlug(cleanSlug);
        if (contest?.bannerUrl) {
          bannerUrl = contest.bannerUrl;
        }
      }
    }

    if (!bannerUrl) {
      bannerUrl = "/banner-easup.png";
    }

    // 1. Trường hợp bannerUrl là chuỗi Base64 (data:image/...)
    if (bannerUrl.startsWith("data:")) {
      const matches = bannerUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1] || "image/jpeg";
        const buffer = Buffer.from(matches[2], "base64");
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          },
        });
      }
    }

    // 2. Trường hợp bannerUrl là đường dẫn nội bộ (/uploads/..., /banners/..., /images/...)
    if (bannerUrl.startsWith("/")) {
      const localFile = await tryReadLocalBannerFile(bannerUrl);
      if (localFile) {
        return new NextResponse(new Uint8Array(localFile.buffer), {
          status: 200,
          headers: {
            "Content-Type": localFile.mimeType,
            "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          },
        });
      }
    }

    // 3. Trường hợp bannerUrl là URL tuyệt đối bên ngoài (https://...)
    if (bannerUrl.startsWith("http://") || bannerUrl.startsWith("https://")) {
      return NextResponse.redirect(bannerUrl, 302);
    }

    // 4. Fallback về /banner-easup.png trên ổ đĩa
    const fallbackFile = await tryReadLocalBannerFile("/banner-easup.png");
    if (fallbackFile) {
      return new NextResponse(new Uint8Array(fallbackFile.buffer), {
        status: 200,
        headers: {
          "Content-Type": fallbackFile.mimeType,
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    return NextResponse.redirect(new URL("/banner-easup.png", req.url), 302);
  } catch (err) {
    return NextResponse.redirect(new URL("/banner-easup.png", req.url), 302);
  }
}
