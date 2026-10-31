"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Link2,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Share2,
} from "lucide-react";
import QRCode from "qrcode";

interface ShortlinkQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestSlug: string;
  contestTitle: string;
  initialCustomSlug?: string;
  initialClickCount?: number;
  initialTab?: "custom-link" | "qr-code";
  onSuccess?: (updatedCustomSlug: string) => void;
}

export default function ShortlinkQrModal({
  isOpen,
  onClose,
  contestSlug,
  contestTitle,
  initialCustomSlug = "",
  initialClickCount = 0,
  initialTab = "custom-link",
  onSuccess,
}: ShortlinkQrModalProps) {
  const [activeTab, setActiveTab] = useState<"custom-link" | "qr-code">(initialTab);
  const [customSlug, setCustomSlug] = useState(initialCustomSlug || contestSlug);
  const [currentSavedSlug, setCurrentSavedSlug] = useState(initialCustomSlug || contestSlug);
  const [clickCount, setClickCount] = useState(initialClickCount);

  // Validation state
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // QR Canvas Ref
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Host info
  const [origin, setOrigin] = useState("https://thi.easupso.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Fetch latest shortlink info
      fetchShortlinkInfo();
    }
  }, [isOpen, contestSlug, initialTab]);

  const fetchShortlinkInfo = async () => {
    try {
      const res = await fetch(`/api/contests/${contestSlug}/shortlink`);
      const data = await res.json();
      if (data.success) {
        const saved = data.customSlug || data.slug;
        setCustomSlug(saved);
        setCurrentSavedSlug(saved);
        setClickCount(data.clickCount || 0);
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin shortlink:", e);
    }
  };

  // Hiển thị toast tự tắt sau 3 giây
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Normalize slug input (chữ thường, số, dấu gạch nối)
  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Chuyển tiếng Việt có dấu thành không dấu và thay khoảng trắng bằng gạch nối
    const clean = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    setCustomSlug(clean);
  };

  // Realtime check debounce
  useEffect(() => {
    if (!isOpen) return;
    const clean = customSlug.trim().toLowerCase();

    // Nếu không thay đổi so với slug hiện tại đã lưu
    if (clean === currentSavedSlug) {
      setValidationResult({ available: true, reason: "Đây là đường dẫn rút gọn hiện tại của cuộc thi." });
      return;
    }

    if (!clean) {
      setValidationResult({ available: false, reason: "Đường dẫn không được để trống." });
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/contests/${contestSlug}/shortlink`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customSlug: clean }),
        });
        const data = await res.json();
        setValidationResult({
          available: !!data.available,
          reason: data.reason || (data.available ? "Đường dẫn khả dụng!" : "Đường dẫn không hợp lệ"),
        });
      } catch (err) {
        setValidationResult({ available: false, reason: "Không thể kiểm tra đường dẫn lúc này." });
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customSlug, currentSavedSlug, contestSlug, isOpen]);

  // Vẽ QR Canvas khi ở tab qr-code
  useEffect(() => {
    if (!isOpen || !qrCanvasRef.current) return;
    const effectiveSlug = currentSavedSlug || customSlug || contestSlug;
    const shortUrl = `${origin}/r/${effectiveSlug}`;

    QRCode.toCanvas(
      qrCanvasRef.current,
      shortUrl,
      {
        width: 240,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      },
      (err) => {
        if (err) console.error("Lỗi tạo mã QR:", err);
      }
    );
  }, [isOpen, activeTab, currentSavedSlug, customSlug, origin, contestSlug]);

  // Lưu link rút gọn
  const handleSaveCustomSlug = async () => {
    const clean = customSlug.trim().toLowerCase();
    if (!clean) {
      alert("Vui lòng nhập link rút gọn!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/contests/${contestSlug}/shortlink`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customSlug: clean }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSavedSlug(clean);
        showToast("Đã lưu liên kết rút gọn thành công!");
        if (onSuccess) onSuccess(clean);
      } else {
        alert(data.error || "Có lỗi xảy ra khi lưu liên kết.");
      }
    } catch (e: any) {
      alert("Lỗi máy chủ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Sao chép link rút gọn 1-chạm
  const handleCopyShortlink = async () => {
    const effectiveSlug = currentSavedSlug || customSlug || contestSlug;
    const shortUrl = `${origin}/r/${effectiveSlug}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setIsCopied(true);
      showToast("Đã sao chép link rút gọn vào Clipboard!");
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      // Fallback
      prompt("Sao chép liên kết rút gọn bên dưới:", shortUrl);
    }
  };

  // Tải ảnh QR Code (PNG) chất lượng cao để in ấn truyền thông tại 20 thôn buôn
  const handleDownloadQrPng = async () => {
    setIsDownloading(true);
    try {
      const effectiveSlug = currentSavedSlug || customSlug || contestSlug;
      const shortUrl = `${origin}/r/${effectiveSlug}`;

      // Tạo canvas độ phân giải cao (1000 x 1280 px) cho in ấn sắc nét
      const printCanvas = document.createElement("canvas");
      printCanvas.width = 1000;
      printCanvas.height = 1280;
      const ctx = printCanvas.getContext("2d");
      if (!ctx) return;

      // 1. Nền trắng
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

      // 2. Viền khung sang trọng đỏ son & bo góc
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, printCanvas.width - 60, printCanvas.height - 60);

      // 3. Header dải màu đỏ
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(37, 37, printCanvas.width - 74, 150);

      // 4. Text Header
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("CỔNG THI TRỰC TUYẾN XÃ EA SÚP", printCanvas.width / 2, 95);
      ctx.font = "600 24px sans-serif";
      ctx.fillText("QUÉT MÃ QR ĐỂ THAM GIA CUỘC THI", printCanvas.width / 2, 145);

      // 5. Tên cuộc thi
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 34px sans-serif";
      const titleLines = wrapText(ctx, contestTitle.toUpperCase(), printCanvas.width - 160);
      let yOffset = 250;
      titleLines.slice(0, 3).forEach((line) => {
        ctx.fillText(line, printCanvas.width / 2, yOffset);
        yOffset += 44;
      });

      // 6. Tạo mã QR độ phân giải cao (560x560 px)
      const qrDataUrl = await QRCode.toDataURL(shortUrl, {
        width: 560,
        margin: 2,
        color: { dark: "#0F172A", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

      // Khung chứa QR
      const qrBoxSize = 600;
      const qrBoxX = (printCanvas.width - qrBoxSize) / 2;
      const qrBoxY = yOffset + 30;

      ctx.fillStyle = "#F8FAFC";
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      ctx.fill();
      ctx.stroke();

      // Vẽ ảnh QR
      ctx.drawImage(qrImg, qrBoxX + 20, qrBoxY + 20, 560, 560);

      // 7. Hiển thị đường dẫn rút gọn to rõ
      const linkBoxY = qrBoxY + qrBoxSize + 40;
      ctx.fillStyle = "#0284C7";
      ctx.font = "bold 32px monospace";
      ctx.fillText(shortUrl.replace(/^https?:\/\//, ""), printCanvas.width / 2, linkBoxY);

      // 8. Chân trang hướng dẫn & Đơn vị
      ctx.fillStyle = "#64748B";
      ctx.font = "500 22px sans-serif";
      ctx.fillText("Mở Camera điện thoại hoặc Zalo để quét mã • Làm bài thi 4G tốc độ cao", printCanvas.width / 2, linkBoxY + 45);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("HỆ SINH THÁI CHUYỂN ĐỔI SỐ EASUPSO.COM • BẢO MẬT ZERO-TRUST", printCanvas.width / 2, linkBoxY + 85);

      // Xuất file và tải về
      const dataUrl = printCanvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `MA_QR_${effectiveSlug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast("Đã tải ảnh mã QR (PNG) chất lượng cao thành công!");
    } catch (err: any) {
      alert("Lỗi tạo ảnh QR: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper ngắt dòng text canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  if (!isOpen) return null;

  const effectiveSlug = currentSavedSlug || customSlug || contestSlug;
  const currentShortUrl = `${origin}/r/${effectiveSlug}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate">
                Tạo Link Rút Gọn &amp; Mã QR Tuyên Truyền
              </h3>
              <p className="text-xs text-red-100 truncate">
                Cuộc thi: {contestTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("custom-link")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "custom-link"
                ? "bg-white text-[#DC2626] border-[#DC2626] shadow-2xs"
                : "text-slate-600 hover:text-slate-900 border-transparent"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>1. Tùy chỉnh link rút gọn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("qr-code")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "qr-code"
                ? "bg-white text-[#DC2626] border-[#DC2626] shadow-2xs"
                : "text-slate-600 hover:text-slate-900 border-transparent"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>2. Mã QR in ấn &amp; Tải ảnh</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* TAB 1: TÙY CHỈNH LINK RÚT GỌN */}
          {activeTab === "custom-link" && (
            <div className="space-y-4">
              {/* Thẻ hiển thị xem trước URL */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Xem trước liên kết rút gọn:</span>
                  <span className="flex items-center text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs font-mono text-[11px]">
                    <Eye className="w-3 h-3 mr-1 text-slate-400" />
                    {clickCount} lượt truy cập
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm shadow-inner overflow-x-auto">
                  <span className="text-slate-400 select-none">{origin}/r/</span>
                  <span className="font-bold text-red-600">{customSlug || "..."}</span>
                </div>
              </div>

              {/* Ô nhập custom_slug */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Đường dẫn rút gọn tùy chỉnh (Slug)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customSlug}
                    onChange={handleSlugInputChange}
                    placeholder="ví dụ: dangbo-2026, nongdan, phapluat..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all pr-10"
                  />
                  <div className="absolute right-3 top-3">
                    {isChecking ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : validationResult?.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : validationResult && !validationResult.available ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : null}
                  </div>
                </div>

                {/* Validation message realtime */}
                {validationResult && (
                  <p
                    className={`text-xs flex items-center gap-1.5 mt-1 font-medium ${
                      validationResult.available ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {validationResult.available ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{validationResult.reason}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400 italic">
                  * Quy ước: Chuỗi duy nhất, không dấu tiếng Việt, viết liền có gạch nối (Ví dụ: `dangbo-2026`, `nongdan-easup`).
                </p>
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomSlug}
                  disabled={isSaving || isChecking || (validationResult !== null && !validationResult.available)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu link rút gọn</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyShortlink}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>

                <a
                  href={`/r/${effectiveSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center space-x-1"
                  title="Thử nghiệm chuyển hướng 302 trực tiếp"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở thử</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: MÃ QR IN ẤN & TẢI ẢNH */}
          {activeTab === "qr-code" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-md flex flex-col items-center">
                <canvas ref={qrCanvasRef} className="rounded-lg shadow-2xs" />
                <div className="text-center mt-3">
                  <div className="font-mono text-xs font-bold text-red-600">
                    {currentShortUrl.replace(/^https?:\/\//, "")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Tự động chuyển tiếp đến phòng thi chính thức
                  </div>
                </div>
              </div>

              {/* Nút Tải ảnh QR PNG & Sao chép */}
              <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  disabled={isDownloading}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xuất ảnh PNG...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Tải ảnh QR (PNG) in ấn</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyShortlink}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao chép link</span>
                </button>
              </div>

              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Mẹo tuyên truyền:</strong> Tải ảnh QR có sẵn tiêu đề và khung in ấn để gửi qua nhóm Zalo hoặc in khổ A4 dán tại 20 nhà văn hóa thôn, buôn xã Ea Súp giúp bà con mở camera quét tham gia thi ngay lập tức!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 text-center transition-all flex items-center justify-center space-x-2 animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
