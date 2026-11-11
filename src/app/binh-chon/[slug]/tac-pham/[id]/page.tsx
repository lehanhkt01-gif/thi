"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Share2,
  Copy,
  Check,
  QrCode,
  Eye,
  Calendar,
  Home,
  Trophy,
  ArrowLeft,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface MediaContest {
  id: string;
  title: string;
  slug: string;
  bannerUrl: string;
  type: "IMAGE" | "VIDEO";
  startDate: string;
  endDate: string;
  status: string;
  themeColor?: string;
  organizerName: string;
  organizerEmail?: string;
  creatorEmail?: string;
  creatorId?: string;
  sharedEmails?: string[];
  enableSocialShare?: boolean;
}

interface MediaSubmission {
  id: string;
  contestId: string;
  contestSlug: string;
  title: string;
  authorName: string;
  authorPhone?: string;
  authorEmail?: string;
  userId?: string;
  unitName: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  mediaUrls?: string[];
  orientation?: "vertical" | "horizontal";
  description: string;
  viewsCount?: number;
  votesCount: number;
  sharesCount?: number;
  score?: number;
  status: string;
  createdAt: string;
}

// Định dạng ngày giờ chuẩn: HH:mm ngày dd/MM/yyyy (như Ảnh 2)
function formatSubmissionDate(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

// Lấy mã thiết bị định danh duy nhất cho người dùng
function getClientDeviceId(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let devId = localStorage.getItem("easup_device_id");
    if (!devId) {
      devId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("easup_device_id", devId);
    }
    return devId;
  } catch {
    return "anon";
  }
}

export default function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);

  const [contest, setContest] = useState<MediaContest | null>(null);
  const [submission, setSubmission] = useState<MediaSubmission | null>(null);
  const [otherSubmissions, setOtherSubmissions] = useState<MediaSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingFbShare, setPendingFbShare] = useState<{
    targetId: string;
    startTime: number;
    popup?: Window | null;
  } | null>(null);
  const [shareSuccessToast, setShareSuccessToast] = useState("");

  const themeColor = contest?.themeColor || "#1B7F5C";

  // Đồng bộ phiên đăng nhập người dùng / admin
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cuocthi_admin_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status === "APPROVED") {
          setAuthUser(parsed);
        }
      }
    } catch {}
  }, []);

  // Phân quyền: CHỈ Admin hoặc Người tạo cuộc thi mới được quản lý / xóa tác phẩm
  // Người dùng đăng nhập thông thường (USER) tuyệt đối không có quyền
  const canManage = (() => {
    if (!authUser) return false;
    // 1. Quản trị viên toàn quyền hệ thống (Admin)
    if (authUser.role === "ADMIN") return true;

    const uEmail = (authUser.email || "").toLowerCase().trim();
    if (!uEmail && !authUser.id) return false;

    // 2. Chỉ người tạo cuộc thi (creatorEmail hoặc creatorId). Tuyệt đối không dùng organizerEmail
    const cEmail = (contest?.creatorEmail || "").toLowerCase().trim();
    const isCreator = Boolean(
      (cEmail && uEmail && uEmail === cEmail) ||
        (contest?.creatorId && authUser.id && contest.creatorId === authUser.id)
    );
    if (isCreator) return true;

    // 3. Người được chia sẻ quyền quản trị
    const sharedList = Array.isArray(contest?.sharedEmails) ? contest!.sharedEmails! : [];
    const isShared = Boolean(
      uEmail && sharedList.some((em) => String(em || "").toLowerCase().trim() === uEmail)
    );
    return isShared;
  })();

  // Phân quyền: CHỈ Người tạo cuộc thi / Quản trị viên mới được phép xóa tác phẩm
  // Tất cả người dùng khác đều không được xóa sản phẩm
  const canDeleteArtwork = Boolean(canManage);

  // Xử lý xóa tác phẩm
  const handleDeleteArtwork = async () => {
    if (!authUser || !submission || !canManage) {
      alert("Chỉ người tạo cuộc thi hoặc Quản trị viên (Admin) mới có quyền xóa tác phẩm!");
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn xóa tác phẩm dự thi:\n"${submission.title}"\nTác giả: ${submission.authorName} (${submission.unitName})\n\nLưu ý: Tác phẩm và toàn bộ lượt bình chọn liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsDeleting(true);
      const res = await fetch(
        `/api/media-contests/${encodeURIComponent(slug)}/tac-pham/${encodeURIComponent(submission.id)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": authUser.role || "USER",
            "x-user-email": authUser.email || "",
            "x-user-phone": authUser.phone || "",
            "x-user-id": authUser.id || "",
          },
          body: JSON.stringify({
            userRole: authUser.role,
            userEmail: authUser.email,
            userPhone: authUser.phone,
            userId: authUser.id,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("Đã xóa tác phẩm dự thi thành công!");
        window.location.href = `/binh-chon/${slug}`;
      } else {
        alert(data.error || "Không thể xóa tác phẩm này!");
      }
    } catch (err: any) {
      alert("Lỗi khi xóa tác phẩm: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Nạp dữ liệu tác phẩm & cuộc thi
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/media-contests/${encodeURIComponent(slug)}/tac-pham/${encodeURIComponent(id)}?view=1&t=${Date.now()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success && isMounted) {
          setContest(data.contest);
          setSubmission(data.submission);
          setOtherSubmissions(data.otherSubmissions || []);

          // Kiểm tra xem đã bình chọn tác phẩm này chưa
          try {
            const votedSaved = localStorage.getItem(`easup_media_voted_${slug}`);
            if (votedSaved) {
              const votedMap = JSON.parse(votedSaved);
              if (votedMap && votedMap[id]) {
                setHasVoted(true);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error("Lỗi nạp tác phẩm:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug, id]);

  // Xử lý bình chọn
  const handleVote = async () => {
    if (hasVoted || !submission) return;

    try {
      const res = await fetch(`/api/media-contests/${encodeURIComponent(slug)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      const data = await res.json();
      if (data.success) {
        setHasVoted(true);
        setSubmission((prev) => (prev ? { ...prev, votesCount: data.votesCount } : prev));

        // Lưu localStorage
        try {
          const votedSaved = localStorage.getItem(`easup_media_voted_${slug}`);
          const votedMap = votedSaved ? JSON.parse(votedSaved) : {};
          votedMap[submission.id] = true;
          localStorage.setItem(`easup_media_voted_${slug}`, JSON.stringify(votedMap));
        } catch {}

        // Hiệu ứng pháo hoa chúc mừng
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.65 },
          colors: [themeColor, "#DC2626", "#F59E0B", "#0284C7"],
        });
      }
    } catch (err) {
      console.error("Lỗi bình chọn:", err);
    }
  };

  // Ghi nhận lượt chia sẻ thành công lên server (Giới hạn tối đa 3 lần / tài khoản)
  const recordShareSuccess = async () => {
    if (!submission) return;
    try {
      const userKey = authUser?.email || authUser?.id || getClientDeviceId();
      const res = await fetch(
        `/api/media-contests/${encodeURIComponent(slug)}/tac-pham/${encodeURIComponent(submission.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "share",
            userKey,
            userEmail: authUser?.email,
            userId: authUser?.id,
          }),
        }
      );
      const data = await res.json();
      if (data.maxReached) {
        setShareSuccessToast("⚠️ Bạn đã đạt giới hạn tối đa 3 lượt chia sẻ cho tác phẩm này!");
        setTimeout(() => setShareSuccessToast(""), 4500);
        return;
      }
      if (data.sharesCount !== undefined) {
        setSubmission((prev) => (prev ? { ...prev, sharesCount: data.sharesCount } : prev));
      }
      setShareSuccessToast(
        data.message ||
          `✓ Đã ghi nhận 1 lượt chia sẻ thành công (${data.userSharesCount || 1}/3 lần tối đa của bạn)!`
      );
      setTimeout(() => setShareSuccessToast(""), 4000);
    } catch {}
  };

  // Giám sát cửa sổ Facebook: Nếu người dùng bấm chia sẻ rồi tắt cửa sổ (< 3.5 giây) thì tự động hủy, KHÔNG tính lượt
  useEffect(() => {
    if (!pendingFbShare?.popup) return;
    const interval = setInterval(() => {
      try {
        if (pendingFbShare.popup?.closed) {
          const duration = Date.now() - pendingFbShare.startTime;
          // Người dùng bấm chia sẻ xong rồi tắt luôn (< 3.5 giây) -> KHÔNG tính lượt
          if (duration < 3500) {
            setPendingFbShare(null);
            clearInterval(interval);
          }
        }
      } catch {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [pendingFbShare]);

  // Chia sẻ tác phẩm đa nền tảng (Chỉ tính khi chia sẻ thành công)
  const handleShare = async (platform: "native" | "facebook" | "zalo" | "copy" = "native") => {
    if (!submission) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = `${submission.title} - Tác giả: ${submission.authorName} (${submission.unitName})`;
    const shareText = `Mời bạn xem và bình chọn cho tác phẩm "${submission.title}" của tác giả ${submission.authorName} (${submission.unitName}) tại Cuộc thi: ${contest?.title || "Bình chọn trực tuyến Ea Súp"}`;

    // Chế độ Native Share hệ thống (Mở bảng chọn chia sẻ điện thoại: Zalo, Facebook, Tin nhắn... như Ảnh 2)
    if (platform === "native") {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: url,
          });
          // Trình duyệt / hệ điều hành trả về thành công khi người dùng đã chọn ứng dụng và hoàn tất chia sẻ
          await recordShareSuccess();
          return;
        } catch (err: any) {
          // Người dùng bấm HỦY hoặc tắt bảng chia sẻ -> TUYỆT ĐỐI KHÔNG TÍNH LƯỢT CHIA SẺ!
          return;
        }
      }
      // Nếu thiết bị / trình duyệt không hỗ trợ Web Share (máy tính để bàn), mở modal chia sẻ kèm mã QR
      setShowShareModal(true);
      return;
    }

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      return;
    }

    if (platform === "facebook") {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareTitle)}`;
      const startTime = Date.now();
      const popup = window.open(
        fbUrl,
        "fb_share_popup",
        "width=640,height=580,toolbar=0,menubar=0,location=0,status=1,scrollbars=1,resizable=1"
      );
      // Hiển thị hộp xác nhận, chờ người dùng hoàn tất đăng bài trên Facebook
      setPendingFbShare({
        targetId: submission.id,
        startTime,
        popup,
      });
      return;
    }

    if (platform === "zalo") {
      window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}`, "_blank");
      return;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Đang tải thông tin tác phẩm...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200 space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy tác phẩm</h2>
          <p className="text-xs text-slate-600">
            Tác phẩm có thể đã được gỡ hoặc liên kết không chính xác.
          </p>
          <Link
            href={`/binh-chon/${slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại trang cuộc thi</span>
          </Link>
        </div>
      </div>
    );
  }

  const images =
    Array.isArray(submission.mediaUrls) && submission.mediaUrls.length > 0
      ? submission.mediaUrls
      : [submission.mediaUrl];
  const safeIdx = Math.min(activeImageIdx, images.length - 1);
  const currentImageUrl = images[safeIdx] || submission.mediaUrl;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* ========================================================================= */}
      {/* THANH ĐIỀU HƯỚNG BREADCRUMBS TOP BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <nav className="flex items-center space-x-2 text-xs text-slate-600 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-emerald-700 font-semibold transition-colors shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cổng Cuộc thi</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/binh-chon/${slug}`}
              className="hover:text-emerald-700 font-semibold truncate max-w-[180px] sm:max-w-xs transition-colors"
              title={contest?.title}
            >
              {contest?.title || "Cuộc thi"}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
              {submission.title}
            </span>
          </nav>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {canDeleteArtwork && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteArtwork}
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Xóa bài thi này (quyền Người tạo cuộc thi)"
              >
                <Trash2 className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{isDeleting ? "Đang xóa..." : "Xóa tác phẩm"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              title="Chia sẻ tác phẩm"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600 sm:mr-1" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>
            <Link
              href={`/binh-chon/${slug}`}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              title="Quay lại danh sách bình chọn"
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Quay lại</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* NỘI DUNG CHÍNH: KHUNG TÁC PHẨM & BÌNH CHỌN (MÔ PHỎNG CHUẨN ẢNH 2) */}
      {/* ========================================================================= */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* CỘT TRÁI: HÌNH ẢNH TÁC PHẨM DỰ THI (ẢNH 2) */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="w-full relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-sm flex items-center justify-center">
                <img
                  src={currentImageUrl}
                  alt={submission.title}
                  className="w-full h-auto max-h-[640px] object-contain rounded-2xl"
                />
              </div>

              {/* Dải thumbnail xem các ảnh khác nếu bài dự thi có nhiều hình */}
              {images.length > 1 && (
                <div className="w-full flex items-center justify-center space-x-2.5 pt-3.5 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        idx === safeIdx
                          ? "border-emerald-600 scale-105 shadow-sm"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: THÔNG TIN CHI TIẾT & BÌNH CHỌN (CHUẨN ẢNH 2) */}
            <div className="md:col-span-6 flex flex-col space-y-6">
              {/* Tên tác phẩm & Thời gian nộp bài */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {submission.title}
                </h1>
                <div className="text-xs sm:text-sm text-slate-400 font-medium">
                  {formatSubmissionDate(submission.createdAt)}
                </div>
              </div>

              {/* Khung số liệu: Lượt xem, Lượt bình chọn & Lượt chia sẻ (Ảnh 2 & 3) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl py-3.5 px-3 sm:px-6 shadow-2xs grid grid-cols-3 text-center divide-x divide-slate-100">
                <div className="px-1 sm:px-2">
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
                    {submission.viewsCount || 0}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    lượt xem
                  </div>
                </div>
                <div className="px-1 sm:px-2">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {submission.votesCount || 0}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    lượt bình chọn
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleShare("native")}
                  className="px-1 sm:px-2 hover:bg-slate-50 transition-colors cursor-pointer group"
                  title="Chia sẻ tác phẩm này"
                >
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                    {submission.sharesCount || 0}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5 group-hover:text-blue-600 transition-colors">
                    lượt chia sẻ
                  </div>
                </button>
              </div>

              {/* Thông tin Tác giả & Đơn vị (Ảnh 2) */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    style={{ backgroundColor: themeColor }}
                    className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    {submission.authorName ? submission.authorName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {submission.authorName}
                    </div>
                    {submission.unitName && (
                      <div className="text-xs text-slate-500 font-medium truncate">
                        {submission.unitName}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                  Tác giả
                </span>
              </div>

              {/* Lời bình / Thuyết minh tác phẩm (Ảnh 2: "Mô tả" + đường kẻ + nội dung) */}
              <div className="space-y-2">
                <div className="text-sm font-bold text-slate-800">Mô tả</div>
                <div className="border-b border-slate-200/80" />
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line pt-0.5">
                  {submission.description || "Con gái Thái"}
                </div>
              </div>

              {/* Hàng nút bấm: Nút BÌNH CHỌN (Xanh) + Xem thêm (Ảnh 2) */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={hasVoted}
                  style={{
                    backgroundColor: hasVoted ? "#E2E8F0" : themeColor,
                    color: hasVoted ? "#475569" : "#FFFFFF",
                  }}
                  className={`px-8 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                    hasVoted
                      ? "cursor-not-allowed opacity-90"
                      : "hover:opacity-95 hover:shadow-md active:scale-95"
                  }`}
                >
                  {hasVoted ? "ĐÃ BÌNH CHỌN" : "BÌNH CHỌN"}
                </button>

                <Link
                  href={`/binh-chon/${slug}`}
                  style={{ color: themeColor }}
                  className="text-sm font-semibold hover:underline cursor-pointer"
                >
                  Xem thêm
                </Link>
              </div>

              {/* Nút chia sẻ tác phẩm: gom thành 1 nút chia sẻ hệ thống chuẩn Ảnh 2 */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lan tỏa tác phẩm
                </div>
                <button
                  type="button"
                  onClick={() => handleShare("native")}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0068FF] hover:bg-[#0056D6] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Chia sẻ tác phẩm (Zalo, Facebook, Tin nhắn, Cốc Cốc...)"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ tác phẩm</span>
                </button>
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-red-600" />
                    <span>Xem mã QR &amp; sao chép liên kết</span>
                  </button>
                </div>
              </div>

              {/* Nút Xóa tác phẩm: Chỉ Người tạo cuộc thi hoặc Quản trị viên */}
              {canDeleteArtwork && (
                <div className="pt-3 border-t border-red-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Quyền Người tạo cuộc thi
                  </span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteArtwork}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Xóa tác phẩm này (Chỉ dành cho Người tạo cuộc thi)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? "Đang xóa..." : "Xóa tác phẩm này"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CÁC TÁC PHẨM KHÁC TRONG CÙNG CUỘC THI */}
        {/* ========================================================================= */}
        {otherSubmissions.length > 0 && (
          <section className="mt-12 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Tác phẩm khác cùng cuộc thi
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Khám phá và tiếp tục bình chọn cho các thí sinh khác
                </p>
              </div>
              <Link
                href={`/binh-chon/${slug}`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả ({contest?.title})</span>
                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherSubmissions.map((other) => (
                <Link
                  key={other.id}
                  href={`/binh-chon/${slug}/tac-pham/${other.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                    <img
                      src={
                        Array.isArray(other.mediaUrls) && other.mediaUrls.length > 0
                          ? other.mediaUrls[0]
                          : other.mediaUrl
                      }
                      alt={other.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                      <span>👁️ {other.viewsCount || 0}</span>
                      <span>★ {other.votesCount || 0}</span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {other.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {other.authorName} • {other.unitName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL MÃ QR & CHIA SẺ ĐA NỀN TẢNG */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Mã QR tác phẩm
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {submission.title}
                </p>
              </div>

              {/* QR Code image generated via quickchart / google api */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl inline-block shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    typeof window !== "undefined" ? window.location.href : ""
                  )}`}
                  alt="Mã QR"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleShare("copy")}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Đã sao chép liên kết!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép liên kết tác phẩm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hộp xác nhận chia sẻ Facebook - Chống bấm xong rồi tắt không tính */}
      {pendingFbShare && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-blue-50 text-[#1877F2] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              f
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-base">Xác nhận chia sẻ Facebook</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống đang mở Facebook để bạn đăng bài. Lượt chia sẻ chỉ được tính khi bạn đã hoàn tất đăng bài lên Facebook.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingFbShare(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                ✕ Tôi đã tắt / Chưa đăng
              </button>
              <button
                type="button"
                onClick={async () => {
                  const elapsed = Date.now() - pendingFbShare.startTime;
                  if (elapsed < 3500) {
                    alert("Cửa sổ Facebook vừa mở hoặc đã tắt quá nhanh! Vui lòng hoàn tất đăng bài trên Facebook trước khi xác nhận.");
                    return;
                  }
                  await recordShareSuccess();
                  setPendingFbShare(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#1464CC] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                ✓ Đã đăng bài thành công
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo ghi nhận chia sẻ thành công */}
      {shareSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>✓</span>
          <span>{shareSuccessToast}</span>
        </div>
      )}
    </div>
  );
}

