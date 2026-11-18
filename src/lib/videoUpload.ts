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
    let recorder: MediaRecorder | null = null;
    const chunks: BlobPart[] = [];

    const cleanup = () => {
      if (animationId) cancelAnimationFrame(animationId);
      URL.revokeObjectURL(url);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
      video.pause();
      video.removeAttribute("src");
    };

    video.onloadeddata = () => {
      try {
        const canvasStream = canvas.captureStream(24);
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
          audioBitsPerSecond: 64000,
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

        const renderFrame = () => {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          if (onProgress && meta.duration > 0) {
            const pct = Math.min(99, Math.round((video.currentTime / meta.duration) * 100));
            onProgress(pct);
          }
          animationId = requestAnimationFrame(renderFrame);
        };

        video.onended = () => {
          if (onProgress) onProgress(100);
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        };

        recorder.start(500);
        video.play().then(() => {
          renderFrame();
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

export async function compressVideoIfNeeded(
  file: File,
  maxBytes: number = MAX_VIDEO_SIZE_BYTES,
  onProgress?: (pct: number, statusText: string) => void
): Promise<{
  blob: Blob;
  fileName: string;
  orientation: "vertical" | "horizontal";
  compressed: boolean;
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

  // Mục tiêu nén xuống ~26MB để đảm bảo chắc chắn dưới 30MB
  const targetBytes = Math.floor(maxBytes * 0.86);
  const targetTotalBps = Math.floor((targetBytes * 8) / Math.max(meta.duration, 1));
  const audioBps = 64000;
  let videoBps = Math.max(150000, Math.min(2200000, targetTotalBps - audioBps));

  // Chọn độ phân giải giảm dần theo thời lượng / bitrate
  let maxDim = 720;
  if (videoBps < 450000) maxDim = 480;
  else if (videoBps < 900000) maxDim = 640;
  else maxDim = 720;

  if (onProgress) {
    onProgress(
      1,
      `Video ${formatFileSizeMB(file.size)} > 30MB. Đang giảm độ phân giải xuống ${maxDim}p...`
    );
  }

  let result = await transcodeVideoInBrowser(file, meta, maxDim, videoBps, (pct) => {
    if (onProgress) {
      onProgress(
        pct,
        `Đang giảm độ phân giải (${maxDim}p) để đưa dung lượng dưới 30MB... ${pct}%`
      );
    }
  });

  // Nếu lần 1 vẫn > 30MB, tự động nén tiếp lần 2 ở độ phân giải thấp hơn (480p / 360p)
  if (result.blob.size > maxBytes) {
    const pass2Dim = maxDim > 480 ? 480 : 360;
    const pass2Bps = Math.max(120000, Math.floor(videoBps * 0.6));
    if (onProgress) {
      onProgress(
        1,
        `Dung lượng sau nén (${formatFileSizeMB(result.blob.size)}) vẫn > 30MB. Đang nén tối ưu mức ${pass2Dim}p...`
      );
    }
    result = await transcodeVideoInBrowser(file, meta, pass2Dim, pass2Bps, (pct) => {
      if (onProgress) {
        onProgress(
          pct,
          `Đang tối ưu độ phân giải (${pass2Dim}p) xuống dưới 30MB... ${pct}%`
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

export async function uploadFileChunked(
  blob: Blob,
  fileName: string,
  onProgress?: (pct: number) => void
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

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  if (!finalUrl) {
    throw new Error("Không nhận được đường dẫn tệp sau khi tải lên.");
  }

  return finalUrl;
}
