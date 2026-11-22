// src/lib/videoThumbnailServer.ts - Trích xuất ảnh đại diện (thumbnail) rõ nét tại giây thứ 5 của video bằng FFmpeg
import { stat, copyFile, mkdir } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i;

export function isServerVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().split("?")[0].split("#")[0];
  return VIDEO_EXT_REGEX.test(clean);
}

export function getExpectedThumbFileName(videoFileName: string): string {
  const baseNoExt = path.basename(videoFileName, path.extname(videoFileName));
  return `${baseNoExt}-thumb.jpg`;
}

async function probeDuration(filePath: string): Promise<number> {
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
      { timeout: 8000 }
    );
    const val = parseFloat((stdout || "").trim());
    return isFinite(val) && val > 0 ? val : 10;
  } catch {
    return 10;
  }
}

/**
 * Tạo ảnh thumbnail tại giây thứ 5 (hoặc khung hình rõ nét gần giây thứ 5) từ file video trên ổ đĩa.
 * Trả về đường dẫn công khai `/uploads/<name>-thumb.jpg` hoặc `null` nếu không tạo được.
 */
export async function generateVideoThumbnailFromFile(
  videoPublicPath: string,
  videoStoragePath?: string
): Promise<string | null> {
  try {
    const thumbFileName = getExpectedThumbFileName(path.basename(videoPublicPath));
    const publicDir = path.dirname(videoPublicPath);
    const thumbPublicPath = path.join(publicDir, thumbFileName);

    // Nếu ảnh thumbnail đã tồn tại thì dùng luôn
    try {
      const existing = await stat(thumbPublicPath);
      if (existing.isFile() && existing.size > 500) {
        return `/uploads/${thumbFileName}`;
      }
    } catch {}

    const duration = await probeDuration(videoPublicPath);
    // Lấy khung hình tại giây thứ 5 (nếu video ngắn hơn 6s thì lấy ở ~40% thời lượng)
    const seekSec = duration >= 6 ? 5 : Math.max(0.5, Number((duration * 0.4).toFixed(2)));

    await mkdir(publicDir, { recursive: true }).catch(() => {});

    // Sử dụng filter `thumbnail=12` bắt đầu từ giây thứ 5 để chọn khung hình rõ nét nhất, tránh khung hình đen/mờ
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        String(seekSec),
        "-i",
        videoPublicPath,
        "-vf",
        "thumbnail=12,scale='min(1280,iw)':-2",
        "-frames:v",
        "1",
        "-q:v",
        "2",
        thumbPublicPath,
      ],
      { timeout: 25000 }
    );

    const outStat = await stat(thumbPublicPath).catch(() => null);
    if (!outStat || !outStat.isFile() || outStat.size < 200) {
      // Fallback không dùng filter thumbnail nếu video quá ngắn
      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-ss",
          String(Math.min(seekSec, 1)),
          "-i",
          videoPublicPath,
          "-vframes",
          "1",
          "-q:v",
          "2",
          "-vf",
          "scale='min(1280,iw)':-2",
          thumbPublicPath,
        ],
        { timeout: 15000 }
      ).catch(() => {});
    }

    const finalStat = await stat(thumbPublicPath).catch(() => null);
    if (!finalStat || !finalStat.isFile() || finalStat.size < 200) {
      return null;
    }

    if (videoStoragePath) {
      const storageThumbPath = path.join(path.dirname(videoStoragePath), thumbFileName);
      await mkdir(path.dirname(storageThumbPath), { recursive: true }).catch(() => {});
      await copyFile(thumbPublicPath, storageThumbPath).catch(() => {});
    }

    return `/uploads/${thumbFileName}`;
  } catch {
    return null;
  }
}

/**
 * Đảm bảo một URL video `/uploads/...mp4` luôn có file ảnh thumbnail `-thumb.jpg` đi kèm.
 * Tự động tạo nếu video đã được đăng từ trước khi tính năng này ra đời.
 */
export async function ensureVideoThumbnailForUrl(videoUrl?: string | null): Promise<string | null> {
  if (!videoUrl || !isServerVideoUrl(videoUrl)) return null;
  const cleanRel = videoUrl.trim().split("?")[0].split("#")[0];
  if (!cleanRel.startsWith("/uploads/")) return null;

  const fileName = path.basename(cleanRel);
  const publicUploadDir = path.join(process.cwd(), "public", "uploads");
  const storageUploadDir = path.join(process.cwd(), "storage", "uploads");

  const thumbFileName = getExpectedThumbFileName(fileName);
  const thumbCandidates = [
    path.join(publicUploadDir, thumbFileName),
    path.join(storageUploadDir, thumbFileName),
  ];

  for (const tp of thumbCandidates) {
    try {
      const st = await stat(tp);
      if (st.isFile() && st.size > 200) {
        return `/uploads/${thumbFileName}`;
      }
    } catch {}
  }

  // Tìm file video gốc trên đĩa để trích xuất khung hình tại giây thứ 5
  const videoCandidates = [
    path.join(publicUploadDir, fileName),
    path.join(storageUploadDir, fileName),
  ];

  for (const vp of videoCandidates) {
    try {
      const st = await stat(vp);
      if (st.isFile()) {
        const publicTarget = path.join(publicUploadDir, fileName);
        const storageTarget = path.join(storageUploadDir, fileName);
        if (vp !== publicTarget) {
          await mkdir(publicUploadDir, { recursive: true }).catch(() => {});
          await copyFile(vp, publicTarget).catch(() => {});
        }
        return await generateVideoThumbnailFromFile(vp, storageTarget);
      }
    } catch {}
  }

  return null;
}
