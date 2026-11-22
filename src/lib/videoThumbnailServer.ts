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

async function getImageLuma(imagePath: string): Promise<number> {
  try {
    const normalized = imagePath.replace(/\\/g, "/").replace(/:/g, "\\:");
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        `movie='${normalized}',signalstats`,
        "-show_entries",
        "frame_tags=lavfi.signalstats.YAVG",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
      ],
      { timeout: 6000 }
    );
    const val = parseFloat((stdout || "").trim().split(/\s+/)[0] || "");
    return isFinite(val) ? val : 255;
  } catch {
    return 255;
  }
}

function buildSeekCandidates(duration: number): number[] {
  const safeMax = Math.max(0.5, duration - 0.5);
  const raw = [
    5,
    10,
    15,
    Number((duration * 0.25).toFixed(2)),
    Number((duration * 0.5).toFixed(2)),
    Number((duration * 0.15).toFixed(2)),
    2,
    0.5,
  ];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const t of raw) {
    const clamped = Math.min(safeMax, Math.max(0.2, Number(t.toFixed(2))));
    const key = Math.round(clamped * 10);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(clamped);
    }
  }
  return result;
}

/**
 * Tạo ảnh thumbnail tại giây thứ 5 (hoặc khung hình rõ nét, không bị đen gần giây thứ 5) từ file video trên ổ đĩa.
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

    // Nếu ảnh thumbnail đã tồn tại và không bị đen thì dùng luôn
    try {
      const existing = await stat(thumbPublicPath);
      if (existing.isFile() && existing.size > 500) {
        const existingLuma = await getImageLuma(thumbPublicPath);
        if (existingLuma >= 24) {
          return `/uploads/${thumbFileName}`;
        }
      }
    } catch {}

    const duration = await probeDuration(videoPublicPath);
    const candidates = buildSeekCandidates(duration);

    await mkdir(publicDir, { recursive: true }).catch(() => {});

    let bestLuma = -1;
    let bestTempPath: string | null = null;

    for (let idx = 0; idx < candidates.length; idx++) {
      const seekSec = candidates[idx];
      const tempPath = `${thumbPublicPath}.cand${idx}.jpg`;

      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-ss",
          String(seekSec),
          "-i",
          videoPublicPath,
          "-vf",
          "thumbnail=15,scale='min(1280,iw)':-2",
          "-frames:v",
          "1",
          "-q:v",
          "2",
          tempPath,
        ],
        { timeout: 25000 }
      ).catch(() => {});

      const outStat = await stat(tempPath).catch(() => null);
      if (!outStat || !outStat.isFile() || outStat.size < 200) {
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
            tempPath,
          ],
          { timeout: 15000 }
        ).catch(() => {});
      }

      const candStat = await stat(tempPath).catch(() => null);
      if (!candStat || !candStat.isFile() || candStat.size < 200) continue;

      const luma = await getImageLuma(tempPath);
      if (luma > bestLuma) {
        if (bestTempPath) {
          await import("fs/promises").then((fs) => fs.unlink(bestTempPath!).catch(() => {}));
        }
        bestLuma = luma;
        bestTempPath = tempPath;
      } else {
        await import("fs/promises").then((fs) => fs.unlink(tempPath).catch(() => {}));
      }

      // Đạt độ sáng rõ nét (>= 24) và dung lượng hợp lý -> chọn luôn không cần dò tiếp
      if (luma >= 24 && candStat.size >= 3000) {
        break;
      }
      // Thử tối đa 5 mốc thời gian để không làm chậm API
      if (idx >= 4) break;
    }

    if (bestTempPath) {
      await import("fs/promises").then((fs) => fs.rename(bestTempPath!, thumbPublicPath));
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
        const luma = await getImageLuma(tp);
        if (luma >= 24) {
          const publicThumb = path.join(publicUploadDir, thumbFileName);
          if (tp !== publicThumb) {
            await mkdir(publicUploadDir, { recursive: true }).catch(() => {});
            await copyFile(tp, publicThumb).catch(() => {});
          }
          return `/uploads/${thumbFileName}`;
        }
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

