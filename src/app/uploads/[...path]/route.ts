// src/app/uploads/[...path]/route.ts - Dynamic Static File Server cho Next.js Standalone
import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const relativePath = pathSegments.join("/");
    // Ngăn chặn Path Traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");

    // Danh sách các thư mục kiểm tra (Ưu tiên public/uploads, dự phòng storage/uploads)
    const candidatePaths = [
      path.join(process.cwd(), "public", "uploads", safePath),
      path.join(process.cwd(), "storage", "uploads", safePath),
      path.join(process.cwd(), "uploads", safePath),
      path.join(process.cwd(), "public", safePath),
    ];

    let foundPath: string | null = null;
    for (const p of candidatePaths) {
      try {
        const fileStat = await stat(p);
        if (fileStat.isFile()) {
          foundPath = p;
          break;
        }
      } catch (e) {
        // File doesn't exist in this path, try next
      }
    }

    if (!foundPath) {
      // Nếu là ảnh banner bị thiếu, trả về banner mặc định nếu có
      if (safePath.includes("banner")) {
        try {
          const defaultBannerPath = path.join(process.cwd(), "public", "banner-easup.png");
          const defaultBuffer = await readFile(defaultBannerPath);
          return new NextResponse(defaultBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (e) {}
      }
      return new NextResponse("File Not Found", { status: 404 });
    }

    const buffer = await readFile(foundPath);
    const ext = path.extname(foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("[Uploads Route Handler] Lỗi phục vụ file tĩnh:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
