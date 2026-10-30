"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Smartphone,
  ShieldCheck,
  Share2,
  BarChart3,
  X,
  Copy,
  Check,
  QrCode,
  Lock,
} from "lucide-react";

interface FloatingActionBarProps {
  contestSlug?: string;
  currentStep?: number;
  onNavigateStep?: (step: number) => void;
  onToggleMobilePreview?: () => void;
  onOpenExamSettings?: () => void;
}

export default function FloatingActionBar({
  contestSlug = "tim-hieu-phap-luat-ea-sup-2026",
  currentStep,
  onNavigateStep,
  onToggleMobilePreview,
  onOpenExamSettings,
}: FloatingActionBarProps) {
  const [authUser, setAuthUser] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<"security" | "share" | null>(null);
  const [copied, setCopied] = useState(false);

  // Chỉ hiển thị thanh công cụ nổi bên phải khi đã đăng nhập
  useEffect(() => {
    const checkAuth = () => {
      try {
        const saved = localStorage.getItem("cuocthi_admin_auth");
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.status === "APPROVED") {
            setAuthUser(user);
            return;
          }
        }
        setAuthUser(null);
      } catch (e) {
        setAuthUser(null);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("cuocthi_auth_change", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("cuocthi_auth_change", checkAuth);
    };
  }, []);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/thi/${contestSlug}`
    : `https://cuocthi.easupso.com/thi/${contestSlug}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Chỉ hiển thị cho Quản trị viên (ADMIN) - Người dùng cơ sở (USER) và khách truy cập ẩn hoàn toàn
  if (!authUser || authUser.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      {/* Floating Vertical Bar on Right */}
      <aside aria-label="Thanh công cụ nổi nhanh" className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center bg-white border border-[#CBD5E1] rounded-2xl p-1.5 shadow-float space-y-2 backdrop-blur-sm bg-white/95">
        {/* 1. Cài đặt đề thi (Nhấp để mở Drawer Cài đặt nâng cao Ảnh 1) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenExamSettings) {
              onOpenExamSettings();
            } else if (onNavigateStep) {
              onNavigateStep(2);
            }
          }}
          className={`group relative p-2.5 rounded-xl transition-all cursor-pointer ${
            currentStep === 2
              ? "bg-[#DC2626] text-white shadow-md"
              : "text-slate-700 hover:text-white hover:bg-[#DC2626]"
          }`}
          title="Cài đặt đề thi"
        >
          <Settings className="w-5 h-5" />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            1. Cài đặt đề thi
          </span>
        </button>

        {/* 2. Xem giao diện Mobile */}
        <button
          type="button"
          onClick={() => {
            if (onToggleMobilePreview) {
              onToggleMobilePreview();
            } else {
              window.open(`/thi/${contestSlug}`, "_blank");
            }
          }}
          className="group relative p-2.5 rounded-xl text-slate-700 hover:text-white hover:bg-[#0284C7] transition-all"
          title="Xem giao diện Mobile (375px)"
        >
          <Smartphone className="w-5 h-5" />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            2. Xem giao diện Mobile
          </span>
        </button>

        {/* 3. Khóa & Bảo mật cuộc thi */}
        <button
          type="button"
          onClick={() => setActiveModal("security")}
          className="group relative p-2.5 rounded-xl text-slate-700 hover:text-white hover:bg-emerald-600 transition-all"
          title="Khóa / Bảo mật Zero-Trust"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            3. Khóa & Bảo mật Zero-Trust
          </span>
        </button>

        {/* 4. Chia sẻ Link & Mã QR */}
        <button
          type="button"
          onClick={() => setActiveModal("share")}
          className="group relative p-2.5 rounded-xl text-slate-700 hover:text-white hover:bg-amber-600 transition-all"
          title="Chia sẻ Link Zalo & Mã QR"
        >
          <Share2 className="w-5 h-5" />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            4. Chia sẻ Zalo & QR
          </span>
        </button>

        {/* 5. Thống kê nhanh */}
        <button
          type="button"
          onClick={() => onNavigateStep && onNavigateStep(5)}
          className="group relative p-2.5 rounded-xl text-slate-700 hover:text-white hover:bg-indigo-600 transition-all"
          title="Thống kê kết quả nhanh"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            5. Thống kê & Xếp hạng
          </span>
        </button>
      </aside>

      {/* Security Modal */}
      {activeModal === "security" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-dialog border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-base">Bảo Mật Phòng Thi Zero-Trust</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="font-semibold text-emerald-800 mb-1 flex items-center">
                  <Lock className="w-4 h-4 mr-1" /> 1. Chống lộ đáp án tuyệt đối (Zero Answer Leakage)
                </div>
                Đáp án đúng và trích dẫn điều khoản luật chỉ được lưu an toàn tại máy chủ. Trình duyệt người thi không bao giờ nhận được trường dữ liệu này khi phát đề.
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="font-semibold text-blue-800 mb-1">
                  2. Đồng hồ Server-Side & Chống gian lận thời gian
                </div>
                Thời gian làm bài được tính trực tiếp từ mốc timestamp khởi tạo tại Server (`startedAt`). Ngăn chặn tuyệt đối việc chỉnh đồng hồ hệ điều hành.
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="font-semibold text-amber-800 mb-1">
                  3. Phát hiện chuyển tab & Rời màn hình thi
                </div>
                Hệ thống tự động kích hoạt lắng nghe sự kiện `visibilitychange` để ghi nhận số lần chuyển tab hoặc mở ứng dụng khác trong quá trình thi.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-admin-primary w-full text-sm"
              >
                Đã hiểu quy chế bảo mật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / QR Modal */}
      {activeModal === "share" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dialog border border-slate-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-base">Chia Sẻ Cuộc Thi</span>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Visual */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  shareUrl
                )}`}
                alt="Mã QR tham gia thi"
                className="w-40 h-40 mx-auto rounded-lg shadow-xs"
              />
              <span className="text-[11px] text-slate-500 mt-2 block">
                Quét mã để vào thi trên Zalo / Điện thoại
              </span>
            </div>

            {/* Link Box */}
            <div className="mt-4 flex items-center bg-slate-100 rounded-lg p-1.5 border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-700 flex-1 px-2 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? "Đã chép" : "Sao chép"}
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Chia sẻ vào nhóm Zalo thôn/buôn và cơ quan để bà con dễ dàng tham gia bằng 1 cú chạm!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
