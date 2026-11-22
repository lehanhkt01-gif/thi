// src/lib/videoUpload.ts - Tiện ích nén giảm độ phân giải video > 30MB và tải lên theo từng phần (chunked upload)

export const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024; // 30MB

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith("data:video/")) return true;
  const withoutQuery = clean.split("?")[0].split("#")[0];
  return /\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/.test(withoutQuery);
}

export function isVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i.test(file.name);
}

export function formatFileSizeMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

interface VideoMeta {
  width: number;
  height: number;
  duration: number;
  orientation: "vertical" | "horizontal";
}

function getVideoMetadata(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
    };

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 30;
      const orientation: "vertical" | "horizontal" = width < height ? "vertical" : "horizontal";
      cleanup();
      resolve({ width, height, duration, orientation });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Không thể đọc thông tin video. Vui lòng kiểm tra định dạng tệp (.mp4, .webm, .mov)."));
    };

    video.src = url;
  });
}

function pickSupportedVideoMimeType(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", ext: ".webm" };
  }
  const candidates = [
    { mimeType: "video/mp4;codecs=avc1,mp4a.40.2", ext: ".mp4" },
    { mimeType: "video/mp4", ext: ".mp4" },
    { mimeType: "video/webm;codecs=vp9,opus", ext: ".webm" },
    { mimeType: "video/webm;codecs=vp8,opus", ext: ".webm" },
    { mimeType: "video/webm", ext: ".webm" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: "", ext: ".webm" };
}

function transcodeVideoInBrowser(
  file: File,
  meta: VideoMeta,
  maxDimension: number,
  videoBitsPerSecond: number,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; ext: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = false;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;

    // Tính kích thước mới giữ nguyên tỷ lệ khung hình (chẵn chia hết cho 2 cho codec H264/VP8)
    const scale = Math.min(1, maxDimension / Math.max(meta.width, meta.height));
    const targetWidth = Math.max(2, Math.floor((meta.width * scale) / 2) * 2);
    const targetHeight = Math.max(2, Math.floor((meta.height * scale) / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      URL.revokeObjectURL(url);
      reject(new Error("Trình duyệt không hỗ trợ nén video trực tiếp. Vui lòng dùng trình duyệt Chrome/Edge/Safari mới nhất."));
      return;
    }

    let audioCtx: AudioContext | null = null;
    let animationId = 0;
    let vfcId = 0;
    let recorder: MediaRecorder | null = null;
    const chunks: BlobPart[] = [];

    // Gắn video & canvas vào DOM (ẩn ở ngoài màn hình với opacity 0.01) để trình duyệt không tạm dừng giải mã khung hình (tránh lỗi đứng hình)
    const hostContainer = document.createElement("div");
    hostContainer.style.cssText =
      "position:fixed;left:-9999px;top:0;width:4px;height:4px;opacity:0.01;pointer-events:none;overflow:hidden;z-index:-1;";
    video.style.cssText = "width:100%;height:100%;";
    canvas.style.cssText = "width:100%;height:100%;";
    hostContainer.appendChild(video);
    hostContainer.appendChild(canvas);
    document.body.appendChild(hostContainer);

    const cleanup = () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (vfcId && typeof (video as any).cancelVideoFrameCallback === "function") {
        (video as any).cancelVideoFrameCallback(vfcId);
      }
      URL.revokeObjectURL(url);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
      video.pause();
      video.removeAttribute("src");
      if (hostContainer.parentNode) {
        hostContainer.parentNode.removeChild(hostContainer);
      }
    };

    video.onloadeddata = () => {
      try {
        const canvasStream = canvas.captureStream(30);
        const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

        // Tách luồng âm thanh im lặng qua AudioContext để giữ nguyên tiếng trong video nén
        try {
          const AudioContextClass =
            window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaElementSource(video);
            const destination = audioCtx.createMediaStreamDestination();
            source.connect(destination);
            // Không connect vào audioCtx.destination để không phát tiếng ồn khi đang nén
            destination.stream.getAudioTracks().forEach((t) => tracks.push(t));
          }
        } catch {
          // Video không có audio hoặc trình duyệt chặn audio capture -> vẫn tiếp tục nén hình
        }

        const combinedStream = new MediaStream(tracks);
        const { mimeType, ext } = pickSupportedVideoMimeType();
        const options: MediaRecorderOptions = {
          videoBitsPerSecond,
          audioBitsPerSecond: 96000,
        };
        if (mimeType) {
          options.mimeType = mimeType;
        }

        recorder = new MediaRecorder(combinedStream, options);

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            chunks.push(ev.data);
          }
        };

        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType || "video/webm" });
          cleanup();
          resolve({ blob: finalBlob, ext });
        };

        recorder.onerror = () => {
          cleanup();
          reject(new Error("Quá trình nén video bị gián đoạn."));
        };

        const drawCurrentFrame = () => {
          if (video.readyState >= 2) {
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          }
          if (onProgress && meta.duration > 0) {
            const pct = Math.min(99, Math.round((video.currentTime / meta.duration) * 100));
            onProgress(pct);
          }
        };

        const useVfc = typeof (video as any).requestVideoFrameCallback === "function";
        const scheduleNextFrame = () => {
          if (video.paused || video.ended) return;
          if (useVfc) {
            vfcId = (video as any).requestVideoFrameCallback(() => {
              drawCurrentFrame();
              scheduleNextFrame();
            });
          } else {
            animationId = requestAnimationFrame(() => {
              drawCurrentFrame();
              scheduleNextFrame();
            });
          }
        };

        video.onended = () => {
          drawCurrentFrame();
          if (onProgress) onProgress(100);
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        };

        // Vẽ khung hình đầu tiên trước khi start
        drawCurrentFrame();
        recorder.start(500);
        video.play().then(() => {
          scheduleNextFrame();
        }).catch((playErr) => {
          cleanup();
          reject(new Error("Không thể phát video để nén: " + (playErr?.message || "")));
        });
      } catch (err: any) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Không thể đọc dữ liệu video để giảm độ phân giải."));
    };
  });
}

let cachedFfmpegAvailable: boolean | null = null;

export async function isServerFfmpegAvailable(): Promise<boolean> {
  if (cachedFfmpegAvailable !== null) return cachedFfmpegAvailable;
  try {
    const res = await fetch("/api/upload", { method: "GET", cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      cachedFfmpegAvailable = Boolean(data?.ffmpegAvailable);
      return cachedFfmpegAvailable;
    }
  } catch {}
  cachedFfmpegAvailable = false;
  return false;
}

export async function compressVideoIfNeeded(
  file: File,
  maxBytes: number = MAX_VIDEO_SIZE_BYTES,
  onProgress?: (pct: number, statusText: string) => void
): Promise<{
  blob: Blob;
  fileName: string;
  orientation: "vertical" | "horizontal";
  compressed: boolean;
  serverCompression?: boolean;
  originalSize: number;
  finalSize: number;
}> {
  const meta = await getVideoMetadata(file);

  if (file.size <= maxBytes) {
    return {
      blob: file,
      fileName: file.name,
      orientation: meta.orientation,
      compressed: false,
      originalSize: file.size,
      finalSize: file.size,
    };
  }

  // Ưu tiên nén bằng FFmpeg trên máy chủ để đạt chất lượng hình ảnh sắc nét (H.264 + faststart) và không bao giờ bị đứng hình
  const hasServerFfmpeg = await isServerFfmpegAvailable();
  if (hasServerFfmpeg) {
    return {
      blob: file,
      fileName: file.name,
      orientation: meta.orientation,
      compressed: false,
      serverCompression: true,
      originalSize: file.size,
      finalSize: file.size,
    };
  }

  // Fallback: Nén trực tiếp trên trình duyệt nếu máy chủ không có FFmpeg
  const targetBytes = Math.floor(maxBytes * 0.88);
  const targetTotalBps = Math.floor((targetBytes * 8) / Math.max(meta.duration, 1));
  const audioBps = 96000;
  const videoBps = Math.max(250000, Math.min(2400000, targetTotalBps - audioBps));

  let maxDim = 1280;
  if (videoBps < 450000) maxDim = 640;
  else if (videoBps < 900000) maxDim = 960;
  else maxDim = 1280;

  if (onProgress) {
    onProgress(
      1,
      `Video ${formatFileSizeMB(file.size)} > 30MB. Đang xử lý tối ưu chất lượng xuống dưới 30MB...`
    );
  }

  let result = await transcodeVideoInBrowser(file, meta, maxDim, videoBps, (pct) => {
    if (onProgress) {
      onProgress(
        pct,
        `Đang tối ưu video xuống dưới 30MB (giữ nét)... ${pct}%`
      );
    }
  });

  if (result.blob.size > maxBytes) {
    const pass2Dim = maxDim > 854 ? 854 : 640;
    const pass2Bps = Math.max(180000, Math.floor(videoBps * 0.65));
    if (onProgress) {
      onProgress(
        1,
        `Dung lượng sau nén (${formatFileSizeMB(result.blob.size)}) vẫn > 30MB. Đang tối ưu thêm...`
      );
    }
    result = await transcodeVideoInBrowser(file, meta, pass2Dim, pass2Bps, (pct) => {
      if (onProgress) {
        onProgress(
          pct,
          `Đang tối ưu video xuống dưới 30MB... ${pct}%`
        );
      }
    });
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  return {
    blob: result.blob,
    fileName: `${baseName}-compressed${result.ext}`,
    orientation: meta.orientation,
    compressed: true,
    originalSize: file.size,
    finalSize: result.blob.size,
  };
}

/**
 * Trích xuất 1 khung hình rõ nét từ video (mặc định tại giây thứ 5, hoặc 40% thời lượng nếu video ngắn)
 */
export function extractVideoThumbnail(file: File, seekSeconds = 5): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    let settled = false;
    const cleanup = (result: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(result);
    };

    const timer = setTimeout(() => cleanup(null), 6000);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const targetTime =
        duration && isFinite(duration) && duration > 0
          ? duration >= seekSeconds + 0.5
            ? seekSeconds
            : Math.max(0.2, Number((duration * 0.4).toFixed(2)))
          : 0;
      try {
        video.currentTime = targetTime;
      } catch {
        clearTimeout(timer);
        cleanup(null);
      }
    };

    video.onseeked = () => {
      try {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(vw, vh));
        const cw = Math.max(2, Math.round(vw * scale));
        const ch = Math.max(2, Math.round(vh * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          clearTimeout(timer);
          cleanup(null);
          return;
        }
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timer);
            cleanup(blob);
          },
          "image/jpeg",
          0.88
        );
      } catch {
        clearTimeout(timer);
        cleanup(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanup(null);
    };
  });
}

export async function uploadFileChunked(
  blob: Blob,
  fileName: string,
  onProgress?: (pct: number) => void,
  onServerResult?: (info: {
    compressed?: boolean;
    originalSize?: number;
    finalSize?: number;
    thumbnailUrl?: string;
  }) => void
): Promise<string> {
  const CHUNK_SIZE = 512 * 1024; // 512KB mỗi phần (an toàn qua Nginx 1MB limit)
  const totalChunks = Math.max(1, Math.ceil(blob.size / CHUNK_SIZE));
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let finalUrl = "";

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(blob.size, start + CHUNK_SIZE);
    const chunk = blob.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunk, fileName);
    formData.append("fileName", fileName);
    formData.append("chunkIndex", String(i));
    formData.append("totalChunks", String(totalChunks));
    formData.append("uploadId", uploadId);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Máy chủ trả về phản hồi không hợp lệ (Mã ${res.status})`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || `Lỗi tải lên phần ${i + 1}/${totalChunks}`);
    }

    if (data.url) {
      finalUrl = data.url;
    }

    if (i === totalChunks - 1 && onServerResult) {
      onServerResult({
        compressed: data.compressed,
        originalSize: data.originalSize,
        finalSize: data.finalSize,
        thumbnailUrl: data.thumbnailUrl,
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  if (!finalUrl) {
    throw new Error("Không nhận được đường dẫn tệp sau khi tải lên.");
  }

  return finalUrl;
}

