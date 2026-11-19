// src/app/api/upload/route.ts - API tiếp nhận và lưu trữ ảnh / PDF / Video upload an toàn (hỗ trợ chunked upload & nén video FFmpeg < 30MB)
import { NextRequest, NextResponse } from "next/server";
import { writeFile, appendFile, mkdir, stat, unlink, copyFile, rename } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv", ".ogv"]);
const MAX_TARGET_VIDEO_BYTES = 30 * 1024 * 1024; // 30MB

async function checkFfmpegInstalled(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function probeVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: 10000 }
    );
    const val = parseFloat((stdout || "").trim());
    return isFinite(val) && val > 0 ? val : 60;
  } catch {
    return 60;
  }
}

async function compressVideoWithFfmpeg(
  publicFilePath: string,
  storageFilePath: string
): Promise<{ finalPublicPath: string; finalFileName: string; originalSize: number; finalSize: number }> {
  const st = await stat(publicFilePath);
  const originalSize = st.size;
  const duration = await probeVideoDuration(publicFilePath);

  // Mục tiêu ~26.5MB để chắc chắn dưới 30MB nhưng giữ chất lượng hình ảnh sắc nét nhất có thể
  const targetBits = 26.5 * 1024 * 1024 * 8;
  const totalBps = Math.floor(targetBits / Math.max(duration, 1));
  const audioBps = 96000;
  let videoMaxRate = Math.max(250000, Math.min(2400000, totalBps - audioBps));

  // Chọn độ phân giải tối ưu theo bitrate để hình ảnh sắc nét, không bị vỡ hạt
  let maxDim = 1280; // 720p
  if (videoMaxRate < 420000) maxDim = 854; // 480p
  else if (videoMaxRate < 750000) maxDim = 960; // 540p

  const dir = path.dirname(publicFilePath);
  const baseNoExt = path.basename(publicFilePath, path.extname(publicFilePath));
  const compressedFileName = `${baseNoExt}-opt.mp4`;
  const tempOutputPath = path.join(dir, compressedFileName);

  const runPass = async (crf: number, maxRate: number, dim: number) => {
    const vf = `scale='min(${dim},iw)':'min(${dim},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        publicFilePath,
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        String(crf),
        "-maxrate",
        String(maxRate),
        "-bufsize",
        String(maxRate * 2),
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        tempOutputPath,
      ],
      { timeout: 180000 }
    );
  };

  await runPass(23, videoMaxRate, maxDim);
  let outStat = await stat(tempOutputPath);

  // Nếu lần 1 vẫn > 30MB, nén thêm 1 lượt nhẹ ở bitrate thấp hơn
  if (outStat.size > MAX_TARGET_VIDEO_BYTES) {
    const nextDim = maxDim > 854 ? 854 : 640;
    const nextRate = Math.max(180000, Math.floor(videoMaxRate * 0.7));
    await runPass(27, nextRate, nextDim);
    outStat = await stat(tempOutputPath);
  }

  const finalMp4Name = `${baseNoExt}.mp4`;
  const finalPublicPath = path.join(dir, finalMp4Name);
  const finalStoragePath = path.join(path.dirname(storageFilePath), finalMp4Name);

  // Xóa file gốc nặng > 30MB và thay bằng bản MP4 chuẩn đã tối ưu
  if (publicFilePath !== finalPublicPath) {
    await unlink(publicFilePath).catch(() => {});
    await unlink(storageFilePath).catch(() => {});
  }
  await rename(tempOutputPath, finalPublicPath);
  await copyFile(finalPublicPath, finalStoragePath).catch(() => {});

  return {
    finalPublicPath,
    finalFileName: finalMp4Name,
    originalSize,
    finalSize: outStat.size,
  };
}

export async function GET() {
  const ffmpegAvailable = await checkFfmpegInstalled();
  return NextResponse.json({ success: true, ffmpegAvailable });
}

export async function POST(req: NextRequest) {
  try {
    let fileBuffer: Buffer | null = null;
    let fileNameOriginal = "banner.png";
    let fileExt = ".png";
    let fileSize = 0;
    let chunkIndex: number | null = null;
    let totalChunks: number | null = null;
    let uploadId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy tệp tải lên trong form data" },
          { status: 400 }
        );
      }

      const rawName = (formData.get("fileName") as string) || file.name || "banner.png";
      fileNameOriginal = rawName;
      fileExt = path.extname(fileNameOriginal).toLowerCase() || ".png";
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileSize = file.size;

      if (formData.get("chunkIndex") !== null && formData.get("totalChunks") !== null) {
        chunkIndex = Number(formData.get("chunkIndex"));
        totalChunks = Number(formData.get("totalChunks"));
        uploadId = String(formData.get("uploadId") || "");
      }
    } else if (contentType.includes("application/json")) {
      // Hỗ trợ upload qua JSON Base64
      const body = await req.json();
      const base64Data = body.base64 || body.image || body.data;
      if (!base64Data) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy dữ liệu ảnh Base64" },
          { status: 400 }
        );
      }

      if (body.name) {
        fileNameOriginal = body.name;
        const extFromName = path.extname(fileNameOriginal).toLowerCase();
        if (extFromName) fileExt = extFromName;
      }

      const matches = base64Data.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("jpeg") || mime.includes("jpg")) fileExt = ".jpg";
        else if (mime.includes("webp")) fileExt = ".webp";
        else if (mime.includes("gif")) fileExt = ".gif";
        else if (mime.includes("pdf")) fileExt = ".pdf";
        else if (mime.includes("mp4")) fileExt = ".mp4";
        else if (mime.includes("webm")) fileExt = ".webm";
        else if (mime.includes("quicktime") || mime.includes("mov")) fileExt = ".mov";
        else if (!path.extname(fileNameOriginal)) fileExt = ".png";

        fileBuffer = Buffer.from(matches[2], "base64");
      } else {
        fileBuffer = Buffer.from(base64Data, "base64");
      }
      fileSize = fileBuffer.length;
    } else {
      return NextResponse.json(
        { success: false, error: "Định dạng request không hợp lệ (hỗ trợ multipart hoặc json base64)" },
        { status: 400 }
      );
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tệp tải lên rỗng hoặc không có dữ liệu" },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng mỗi request/tệp tối đa 32MB (cho phép video <= 30MB sau khi nén)
    if (fileSize > 32 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Dung lượng tệp vượt quá giới hạn 30MB. Vui lòng nén tệp hoặc chọn tệp nhỏ hơn." },
        { status: 400 }
      );
    }

    // Các thư mục lưu trữ (Ghi cả vào public/uploads và storage/uploads)
    const publicUploadDir = path.join(process.cwd(), "public", "uploads");
    const storageUploadDir = path.join(process.cwd(), "storage", "uploads");

    await mkdir(publicUploadDir, { recursive: true }).catch(() => {});
    await mkdir(storageUploadDir, { recursive: true }).catch(() => {});

    // Tạo tên file an toàn
    const cleanBase = path.basename(fileNameOriginal, fileExt)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "banner";

    const safeUploadId = uploadId
      ? uploadId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)
      : String(Date.now());
    const finalFileName = `banner-${safeUploadId}-${cleanBase}${fileExt}`;

    const publicFilePath = path.join(publicUploadDir, finalFileName);
    const storageFilePath = path.join(storageUploadDir, finalFileName);

    if (chunkIndex !== null && totalChunks !== null && totalChunks > 1) {
      if (chunkIndex === 0) {
        await writeFile(publicFilePath, fileBuffer);
        await writeFile(storageFilePath, fileBuffer).catch(() => {});
      } else {
        await appendFile(publicFilePath, fileBuffer);
        await appendFile(storageFilePath, fileBuffer).catch(() => {});
      }
      const isComplete = chunkIndex >= totalChunks - 1;

      if (isComplete && VIDEO_EXTS.has(fileExt)) {
        try {
          const st = await stat(publicFilePath);
          if (st.size > MAX_TARGET_VIDEO_BYTES) {
            const hasFfmpeg = await checkFfmpegInstalled();
            if (hasFfmpeg) {
              const comp = await compressVideoWithFfmpeg(publicFilePath, storageFilePath);
              return NextResponse.json({
                success: true,
                complete: true,
                chunkIndex,
                totalChunks,
                url: `/uploads/${comp.finalFileName}`,
                fileName: comp.finalFileName,
                compressed: true,
                originalSize: comp.originalSize,
                finalSize: comp.finalSize,
              });
            } else {
              await unlink(publicFilePath).catch(() => {});
              await unlink(storageFilePath).catch(() => {});
              return NextResponse.json(
                {
                  success: false,
                  error: "Video vượt quá 30MB và máy chủ chưa cài đặt FFmpeg để nén.",
                },
                { status: 400 }
              );
            }
          }
        } catch (compErr: any) {
          console.error("[API Upload] Lỗi nén video FFmpeg:", compErr);
          return NextResponse.json(
            {
              success: false,
              error: "Không thể nén video xuống dưới 30MB: " + (compErr?.message || "Lỗi FFmpeg"),
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        complete: isComplete,
        chunkIndex,
        totalChunks,
        url: `/uploads/${finalFileName}`,
        fileName: finalFileName,
      });
    }

    // Ghi file một lần (khi <= 700KB)
    await writeFile(publicFilePath, fileBuffer);
    await writeFile(storageFilePath, fileBuffer).catch(() => {});

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      size: fileSize,
      message: "Tải lên tệp thành công",
    });
  } catch (error: any) {
    console.error("[API Upload] Lỗi khi xử lý ảnh:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý tệp tải lên: " + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
