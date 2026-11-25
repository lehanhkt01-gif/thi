"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  ShieldCheck,
  Eye,
  Share2,
  Star,
  Download,
  Copy,
  Check,
  Search,
  LayoutGrid,
  List,
  X,
  ZoomIn,
  ExternalLink,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import * as XLSX from "xlsx";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import { isVideoUrl } from "@/lib/videoUpload";

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
  description?: string;
}

interface MediaSubmission {
  id: string;
  contestId: string;
  contestSlug: string;
  title: string;
  authorName: string;
  authorPhone?: string;
  authorCccd?: string;
  authorEmail?: string;
  unitName: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  mediaUrls?: string[];
  thumbnailUrl?: string;
  orientation?: "vertical" | "horizontal";
  description: string;
  viewsCount?: number;
  votesCount: number;
  realVotesCount?: number;
  voters?: string[];
  sharesCount?: number;
  score?: number;
  status: string;
  createdAt: string;
}

function computeRealVotesCount(s?: MediaSubmission | null): number {
  if (!s) return 0;
  if (typeof s.realVotesCount === "number") return s.realVotesCount;
  if (!Array.isArray(s.voters) || s.voters.length === 0) return 0;
  const uniqueSet = new Set<string>();
  for (const raw of s.voters) {
    const cleaned = String(raw || "").trim().toLowerCase();
    if (
      !cleaned ||
      cleaned === "anonymous" ||
      cleaned === "guest" ||
      cleaned === "undefined" ||
      cleaned === "null"
    ) {
      continue;
    }
    if (cleaned.includes("@")) {
      const [localPart, domainPart] = cleaned.split("@");
      if (!localPart || !domainPart) continue;
      const baseLocal = localPart.split("+")[0] || localPart;
      if (domainPart === "gmail.com" || domainPart === "googlemail.com") {
        uniqueSet.add(`${baseLocal.replace(/\./g, "") || baseLocal}@gmail.com`);
      } else {
        uniqueSet.add(`${baseLocal}@${domainPart}`);
      }
    } else {
      uniqueSet.add(cleaned);
    }
  }
  return Math.min(Math.max(0, Number(s.votesCount) || 0), uniqueSet.size);
}

function formatSubmissionDate(isoString?: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ngày ${dd}/${mo}/${yyyy}`;
}

export default function Top20Round2Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [contest, setContest] = useState<MediaContest | null>(null);
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal xem chi tiết tác phẩm
  const [selectedSubmission, setSelectedSubmission] = useState<MediaSubmission | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Lightbox phóng to toàn màn hình
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState("");
  const [lightboxAuthor, setLightboxAuthor] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/media-contests/${encodeURIComponent(slug)}?t=${Date.now()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (isMounted && data.contest) {
          setContest(data.contest);
          setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách 20 tác phẩm vòng 2:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const themeColor = contest?.themeColor || "#1B7F5C";

  // Sắp xếp toàn bộ tác phẩm từ cao xuống thấp theo số lượt Bình chọn thực tế và lấy Top 20
  const top20Submissions = React.useMemo(() => {
    const approved = submissions.filter((s) => s.status !== "REJECTED");
    return [...approved]
      .sort((a, b) => {
        const diffReal = computeRealVotesCount(b) - computeRealVotesCount(a);
        if (diffReal !== 0) return diffReal;
        const diffVotes = (b.votesCount || 0) - (a.votesCount || 0);
        if (diffVotes !== 0) return diffVotes;
        const diffShares = (b.sharesCount || 0) - (a.sharesCount || 0);
        if (diffShares !== 0) return diffShares;
        const diffViews = (b.viewsCount || 0) - (a.viewsCount || 0);
        if (diffViews !== 0) return diffViews;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      })
      .slice(0, 20);
  }, [submissions]);

  const filteredTop20 = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return top20Submissions.map((item, index) => ({ item, rank: index + 1 }));
    return top20Submissions
      .map((item, index) => ({ item, rank: index + 1 }))
      .filter(
        ({ item }) =>
          (item.title || "").toLowerCase().includes(q) ||
          (item.authorName || "").toLowerCase().includes(q) ||
          (item.unitName || "").toLowerCase().includes(q)
      );
  }, [top20Submissions, searchQuery]);

  const totalTop20RealVotes = top20Submissions.reduce(
    (sum, s) => sum + computeRealVotesCount(s),
    0
  );
  const totalTop20Votes = top20Submissions.reduce(
    (sum, s) => sum + (s.votesCount || 0),
    0
  );
  const totalTop20Views = top20Submissions.reduce(
    (sum, s) => sum + (s.viewsCount || 0),
    0
  );

  const handleCopyPageLink = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://thi.easupso.com/binh-chon/${slug}/vong-2`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleExportTop20Excel = () => {
    const rows = top20Submissions.map((s, idx) => ({
      "Hạng Vòng 2": idx + 1,
      "Mã bài": s.id,
      "Tên tác phẩm": s.title || "",
      "Tác giả": s.authorName || "",
      "Đơn vị / Thôn buôn": s.unitName || "",
      "Bình chọn thực": computeRealVotesCount(s),
      "Lượt bình chọn": s.votesCount || 0,
      "Lượt xem": s.viewsCount || 0,
      "Lượt chia sẻ": s.sharesCount || 0,
      "Số lượng ảnh":
        Array.isArray(s.mediaUrls) && s.mediaUrls.length > 0 ? s.mediaUrls.length : 1,
      "Ngày nộp": s.createdAt ? new Date(s.createdAt).toLocaleString("vi-VN") : "",
      "Mô tả tác phẩm": s.description || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top20_XetVong2");
    XLSX.writeFile(wb, `top_20_tac_pham_xet_vong_2_${slug}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div
          style={{ borderTopColor: themeColor }}
          className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin mb-3"
        />
        <p className="text-sm font-semibold text-slate-600">
          Đang tổng hợp 20 tác phẩm có lượt bình chọn thực tế cao nhất...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Thanh điều hướng trên cùng */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/binh-chon/${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại cuộc thi</span>
            </Link>
            <span className="text-xs font-semibold text-slate-500 truncate hidden md:inline">
              {contest?.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPageLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Sao chép đường dẫn trang 20 tác phẩm xét vòng 2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép link</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Sao chép link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportTop20Excel}
              style={{ backgroundColor: themeColor }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
              title="Tải file Excel danh sách 20 tác phẩm xét vòng 2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel Vòng 2</span>
            </button>
          </div>
        </div>
      </header>

      {/* Khối tiêu đề & Thống kê tổng hợp Vòng 2 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảng tổng hợp xét duyệt Vòng 2</span>
            </div>
            <h1
              style={{ color: themeColor }}
              className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight leading-snug"
            >
              20 TÁC PHẨM XÉT VÒNG 2
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              {contest?.title || "Cuộc thi bình chọn trực tuyến xã Ea Súp"}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổng hợp 20 tác phẩm có số lượt <strong>Bình chọn thực tế</strong> cao nhất (đã xác
              thực đăng nhập, mỗi tài khoản chỉ được tính 01 lượt bình chọn duy nhất), sắp xếp theo
              thứ tự từ cao xuống thấp.
            </p>
          </div>

          {/* 4 thẻ số liệu thống kê Top 20 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase">
                  Tác phẩm xét Vòng 2
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-0.5">
                  {top20Submissions.length} <span className="text-xs font-semibold">/ 20</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-900 uppercase">
                  Tổng Bình chọn thực (Top 20)
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                  {totalTop20RealVotes.toLocaleString()}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-600 uppercase">
                  Tổng bình chọn hiển thị
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">
                  {totalTop20Votes.toLocaleString()}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                <Star className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-sky-900 uppercase">
                  Tổng lượt xem (Top 20)
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-sky-700 mt-0.5">
                  {totalTop20Views.toLocaleString()}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Thanh công cụ tìm kiếm & chuyển chế độ xem */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  style={
                    viewMode === "grid" ? { backgroundColor: themeColor, color: "#FFFFFF" } : {}
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "grid" ? "shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Dạng thẻ hình ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  style={
                    viewMode === "table" ? { backgroundColor: themeColor, color: "#FFFFFF" } : {}
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "table" ? "shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Dạng bảng xếp hạng</span>
                </button>
              </div>
            </div>

            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lọc trong 20 tác phẩm (tên, tác giả, đơn vị)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách 20 tác phẩm xét vòng 2 */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {filteredTop20.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Không tìm thấy tác phẩm nào phù hợp.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-stretch">
            {filteredTop20.map(({ item: sub, rank }) => {
              const subImages =
                Array.isArray(sub.mediaUrls) && sub.mediaUrls.length > 0
                  ? sub.mediaUrls
                  : [sub.mediaUrl];
              const isVid = sub.mediaType === "VIDEO" || isVideoUrl(subImages[0] || sub.mediaUrl);
              const realVotes = computeRealVotesCount(sub);

              const rankBadgeClass =
                rank === 1
                  ? "bg-amber-500 text-white border-amber-300"
                  : rank === 2
                    ? "bg-slate-700 text-white border-slate-400"
                    : rank === 3
                      ? "bg-amber-700 text-white border-amber-500"
                      : "bg-emerald-700 text-white border-emerald-400";

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setSelectedImageIdx(0);
                  }}
                  style={{ borderColor: rank <= 3 ? "#F59E0B" : themeColor }}
                  className="bg-white rounded-2xl border-2 p-3 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Ảnh / Video tác phẩm */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-900/5 aspect-[3/4]">
                      {isVid ? (
                        sub.thumbnailUrl ? (
                          <img
                            src={sub.thumbnailUrl}
                            alt={sub.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <video
                            src={subImages[0] || sub.mediaUrl}
                            muted
                            playsInline
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              const vEl = e.currentTarget;
                              if (
                                vEl.duration &&
                                isFinite(vEl.duration) &&
                                vEl.currentTime < 0.5
                              ) {
                                vEl.currentTime =
                                  vEl.duration >= 6 ? 5 : Math.max(0.3, vEl.duration * 0.4);
                              }
                            }}
                            className="w-full h-full object-cover bg-slate-900"
                          />
                        )
                      ) : (
                        <img
                          src={subImages[0] || sub.mediaUrl}
                          alt={sub.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* Huy hiệu Hạng Vòng 2 */}
                      <div
                        className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-md border flex items-center gap-1 ${rankBadgeClass}`}
                      >
                        <Trophy className="w-3 h-3" />
                        <span>Hạng #{rank}</span>
                      </div>

                      {/* Số lượng hình hoặc nhãn Video */}
                      {isVid ? (
                        <span className="absolute top-2.5 right-2.5 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                          <Video className="w-3 h-3 text-red-400" />
                          <span>VIDEO</span>
                        </span>
                      ) : (
                        subImages.length > 1 && (
                          <span className="absolute top-2.5 right-2.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                            📷 {subImages.length} hình
                          </span>
                        )
                      )}
                    </div>

                    {/* Tiêu đề & Tác giả */}
                    <div className="mt-3 text-center space-y-1 px-1">
                      <h3 className="font-extrabold text-sm sm:text-[15px] text-slate-900 group-hover:text-emerald-800 line-clamp-2 leading-snug">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {sub.authorName} • {sub.unitName}
                      </p>
                    </div>
                  </div>

                  {/* Số liệu Bình chọn thực tế nổi bật */}
                  <div className="mt-3 pt-2 space-y-2">
                    <div
                      style={{ backgroundColor: themeColor }}
                      className="w-full py-2 px-4 rounded-full text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{realVotes.toLocaleString()} bình chọn thực</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-600 px-0.5">
                      <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                        <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{sub.viewsCount || 0} xem</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Tổng: {sub.votesCount || 0}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                        <Share2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                        <span>{sub.sharesCount || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Chế độ Bảng xếp hạng chi tiết */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px]">
                    <th className="py-3.5 px-4 text-center w-16">Hạng</th>
                    <th className="py-3.5 px-4">Tác phẩm</th>
                    <th className="py-3.5 px-4">Tác giả &amp; Đơn vị</th>
                    <th className="py-3.5 px-4 text-center">Bình chọn thực</th>
                    <th className="py-3.5 px-4 text-center">Tổng bình chọn</th>
                    <th className="py-3.5 px-4 text-center">Lượt xem</th>
                    <th className="py-3.5 px-4 text-center">Chia sẻ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTop20.map(({ item: sub, rank }) => {
                    const thumbSrc =
                      sub.thumbnailUrl ||
                      (Array.isArray(sub.mediaUrls) && sub.mediaUrls.length > 0
                        ? sub.mediaUrls[0]
                        : sub.mediaUrl);
                    const realVotes = computeRealVotesCount(sub);

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setSelectedImageIdx(0);
                        }}
                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-center">
                          <span
                            style={
                              rank <= 3
                                ? { backgroundColor: themeColor, color: "#FFFFFF" }
                                : {}
                            }
                            className="inline-flex w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-extrabold items-center justify-center text-xs"
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={thumbSrc}
                              alt={sub.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-800 line-clamp-1">
                                {sub.title}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Mã: {sub.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{sub.authorName}</div>
                          <div className="text-xs text-slate-500">{sub.unitName}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            style={{ backgroundColor: themeColor }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white font-extrabold text-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>{realVotes.toLocaleString()}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">
                          {(sub.votesCount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-blue-600">
                          {(sub.viewsCount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-600">
                          {(sub.sharesCount || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal xem chi tiết hình ảnh & thông tin tác phẩm */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative border border-slate-200 my-auto">
            <button
              type="button"
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-start">
              {(() => {
                const imgs =
                  Array.isArray(selectedSubmission.mediaUrls) &&
                  selectedSubmission.mediaUrls.length > 0
                    ? selectedSubmission.mediaUrls
                    : [selectedSubmission.mediaUrl];
                const safeIdx = Math.min(selectedImageIdx, imgs.length - 1);
                const currentMediaUrl = imgs[safeIdx] || selectedSubmission.mediaUrl;
                const isCurrentVideo = isVideoUrl(currentMediaUrl);

                return (
                  <div className="md:col-span-6 flex flex-col items-center">
                    {isCurrentVideo ? (
                      <div className="w-full relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-2xs flex items-center justify-center">
                        <video
                          key={currentMediaUrl}
                          src={currentMediaUrl}
                          poster={selectedSubmission.thumbnailUrl || undefined}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-[520px] rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setLightboxImages(imgs);
                          setLightboxIndex(safeIdx);
                          setLightboxTitle(selectedSubmission.title);
                          setLightboxAuthor(
                            `${selectedSubmission.authorName} (${selectedSubmission.unitName})`
                          );
                          setShowLightbox(true);
                        }}
                        className="w-full relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs flex items-center justify-center cursor-zoom-in group"
                        title="Bấm vào hình để phóng to toàn màn hình"
                      >
                        <img
                          src={currentMediaUrl}
                          alt={selectedSubmission.title}
                          className="w-full h-auto max-h-[520px] object-contain rounded-2xl group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/65 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-md pointer-events-none">
                          <ZoomIn className="w-3.5 h-3.5 text-white" />
                          <span>Bấm để phóng to</span>
                        </div>
                      </div>
                    )}
                    {imgs.length > 1 && (
                      <div className="w-full flex items-center justify-center space-x-2 pt-3 overflow-x-auto">
                        {imgs.map((u, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedImageIdx(i)}
                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              i === safeIdx
                                ? "border-emerald-600 scale-105 shadow-2xs"
                                : "border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={u} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="md:col-span-6 flex flex-col space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                    {selectedSubmission.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-medium">
                    {formatSubmissionDate(selectedSubmission.createdAt)}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl py-3 px-3 sm:px-5 shadow-2xs grid grid-cols-3 text-center divide-x divide-slate-100">
                  <div className="px-1">
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-600">
                      {selectedSubmission.viewsCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">lượt xem</div>
                  </div>
                  <div className="px-1">
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                      {computeRealVotesCount(selectedSubmission)}
                    </div>
                    <div className="text-xs text-emerald-700 font-bold mt-0.5">bình chọn thực</div>
                    <div className="text-[10px] text-slate-400">
                      (Tổng: {selectedSubmission.votesCount || 0})
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800">
                      {selectedSubmission.sharesCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">lượt chia sẻ</div>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      style={{ backgroundColor: themeColor }}
                      className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                    >
                      {selectedSubmission.authorName
                        ? selectedSubmission.authorName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {selectedSubmission.authorName}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                        {selectedSubmission.unitName}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                    Tác giả
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Mô tả
                  </div>
                  <div className="border-b border-slate-200/80" />
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto pr-1">
                    {selectedSubmission.description || "Không có mô tả"}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <Link
                    href={`/binh-chon/${encodeURIComponent(slug)}/tac-pham/${selectedSubmission.id}`}
                    style={{ backgroundColor: themeColor }}
                    className="px-5 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-95 inline-flex items-center gap-1.5"
                  >
                    <span>Xem trang riêng tác phẩm</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox phóng to ảnh toàn màn hình */}
      <ImageLightboxModal
        isOpen={showLightbox}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        title={lightboxTitle}
        authorName={lightboxAuthor}
        onClose={() => setShowLightbox(false)}
      />
    </div>
  );
}
