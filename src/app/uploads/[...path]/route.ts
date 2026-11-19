// src/app/uploads/[...path]/route.ts - Dynamic Static File Server cho Next.js Standalone (Hỗ trợ HTTP 206 Partial Content để tua video mượt mà)
import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { createReadStream } from "fs";
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
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".ogv": "video/ogg",
};

function nodeStreamToWebStream(nodeStream: ReturnType<typeof createReadStream>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer | string) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(buf));
      });
      nodeStream.on("end", () => {
        controller.close();
      });
      nodeStream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

async function resolveUploadedFile(pathSegments: string[]): Promise<{ foundPath: string; size: number } | null> {
  const relativePath = pathSegments.join("/");
  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");

  const candidatePaths = [
    path.join(process.cwd(), "public", "uploads", safePath),
    path.join(process.cwd(), "storage", "uploads", safePath),
    path.join(process.cwd(), "uploads", safePath),
    path.join(process.cwd(), "public", safePath),
  ];

  for (const p of candidatePaths) {
    try {
      const fileStat = await stat(p);
      if (fileStat.isFile()) {
        return { foundPath: p, size: fileStat.size };
      }
    } catch {
      // Thử đường dẫn kế tiếp
    }
  }
  return null;
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse(null, { status: 404 });
    }
    const resolved = await resolveUploadedFile(pathSegments);
    if (!resolved) {
      return new NextResponse(null, { status: 404 });
    }
    const ext = path.extname(resolved.foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(resolved.size),
        "Accept-Ranges": "bytes",
        "Content-Disposition": "inline",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

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
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
    const resolved = await resolveUploadedFile(pathSegments);

    if (!resolved) {
      if (safePath.includes("banner") && !/\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i.test(safePath)) {
        try {
          const defaultBannerPath = path.join(process.cwd(), "public", "banner-easup.png");
          const defaultBuffer = await readFile(defaultBannerPath);
          return new NextResponse(defaultBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch {}
      }
      return new NextResponse("File Not Found", { status: 404 });
    }

    const { foundPath, size: totalSize } = resolved;
    const ext = path.extname(foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const rangeHeader = request.headers.get("range");

    // Xử lý HTTP 206 Partial Content khi trình duyệt tua thanh trượt tới/lui trên video
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const rangeSpec = rangeHeader.replace(/^bytes=/, "").split(",")[0].trim();
      const [startStr, endStr] = rangeSpec.split("-");

      let start: number;
      let end: number;

      if (startStr === "" && endStr !== "") {
        // Suffix byte range: bytes=-500
        const suffixLen = parseInt(endStr, 10);
        start = Math.max(0, totalSize - suffixLen);
        end = totalSize - 1;
      } else {
        start = parseInt(startStr, 10);
        end = endStr ? parseInt(endStr, 10) : totalSize - 1;
      }

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end >= totalSize ||
        start > end
      ) {
        return new NextResponse("Requested Range Not Satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${totalSize}`,
            "Accept-Ranges": "bytes",
          },
        });
      }

      const chunkSize = end - start + 1;
      const stream = nodeStreamToWebStream(createReadStream(foundPath, { start, end }));

      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Content-Disposition": "inline",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Phản hồi đầy đủ 200 OK bằng stream (kèm Content-Length & Accept-Ranges)
    const fullStream = nodeStreamToWebStream(createReadStream(foundPath));
    return new NextResponse(fullStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(totalSize),
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("[Uploads Route Handler] Lỗi phục vụ file tĩnh:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
