"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Calendar,
  Share2,
  Copy,
  Check,
  Search,
  Upload,
  Heart,
  ExternalLink,
  ChevronRight,
  Settings,
  Image as ImageIcon,
  Video,
  X,
  Sparkles,
  MapPin,
  User,
  Phone,
  FileText,
  AlertCircle,
  FolderOpen,
  ArrowLeft,
  LayoutGrid,
  List,
} from "lucide-react";
import confetti from "canvas-confetti";
import { EA_SUP_VILLAGES } from "@/lib/store";

interface MediaContest {
  id: string;
  title: string;
  slug: string;
  bannerUrl: string;
  type: "IMAGE" | "VIDEO";
  startDate: string;
  endDate: string;
  displayStartDate?: string;
  displayEndDate?: string;
  submissionsCount: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  description?: string;
  organizerName: string;
}

interface MediaSubmission {
  id: string;
  contestId: string;
  contestSlug: string;
  title: string;
  authorName: string;
  authorPhone?: string;
  authorCccd?: string;
  unitName: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  description: string;
  votesCount: number;
  status: string;
  createdAt: string;
}

export default function MediaContestPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [contest, setContest] = useState<MediaContest | null>(null);
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: "02",
    hours: "23",
    minutes: "55",
    seconds: "10",
  });

  // Modal State for Submitting artwork
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    authorName: "",
    authorPhone: "",
    authorCccd: "",
    unitName: EA_SUP_VILLAGES[0],
    mediaType: "IMAGE" as "IMAGE" | "VIDEO",
    mediaUrl: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  // Fetch contest data
  const loadData = async () => {
    try {
      const res = await fetch(`/api/media-contests/${slug}`);
      const data = await res.json();
      if (data.contest) {
        setContest(data.contest);
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error("Lỗi nạp dữ liệu cuộc thi ảnh/video:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  // Real-time countdown calculator
  useEffect(() => {
    const calculateCountdown = () => {
      if (!contest?.endDate) {
        // Fallback demo matching Image 3 (2 days 23 hours 55 mins 10 secs)
        return;
      }

      const target = new Date(contest.endDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(days).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
        });
      } else {
        // Fallback default
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  // Handle Share / Copy link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Handle Voting
  const handleVote = async (submissionId: string) => {
    if (votedMap[submissionId]) return;

    try {
      const res = await fetch(`/api/media-contests/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (data.success) {
        setVotedMap((prev) => ({ ...prev, [submissionId]: true }));
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, votesCount: data.votesCount } : s))
        );

        // Confetti celebration
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#10B981", "#DC2626", "#F59E0B", "#3B82F6"],
        });
      }
    } catch (err) {
      console.error("Lỗi bình chọn:", err);
    }
  };

  // Handle Artwork Submission
  const handleSubmitArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.title || !submitForm.authorName || !submitForm.unitName) {
      alert("Vui lòng điền đầy đủ tên tác phẩm, tác giả và đơn vị!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/media-contests/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submitForm,
          mediaUrl:
            submitForm.mediaUrl ||
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        loadData();
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitSuccess(false);
          setSubmitForm({
            title: "",
            authorName: "",
            authorPhone: "",
            authorCccd: "",
            unitName: EA_SUP_VILLAGES[0],
            mediaType: "IMAGE",
            mediaUrl: "",
            description: "",
          });
        }, 1500);

        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else {
        alert(data.error || "Lỗi nộp bài");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.authorName.toLowerCase().includes(q) ||
      s.unitName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Floating Mini Header */}
      <div className="bg-slate-900 text-white py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="inline-flex items-center text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Cổng Cuộc Thi Ea Súp
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Hệ sinh thái số easupso.com</span>
          </div>

          <Link
            href="/admin"
            className="text-slate-300 hover:text-white text-[11px] underline underline-offset-2"
          >
            Bảng điều khiển Ban Tổ Chức
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BIG BANNER AT TOP (Ảnh 3) */}
      {/* ========================================================================= */}
      <div className="relative w-full h-56 sm:h-72 md:h-96 lg:h-[420px] bg-slate-950 overflow-hidden">
        <img
          src={contest?.bannerUrl || "/images/contest_stage_banner.jpg"}
          alt={contest?.title || "Banner Cuộc thi bình chọn"}
          className="w-full h-full object-cover object-center"
        />
        {/* Neon Green Accent Divider under banner matching Image 3 */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTEST TITLE & FLIP COUNTDOWN CLOCK (Ảnh 3) */}
      {/* ========================================================================= */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-6 text-center space-y-6">
        {/* Contest Title with Share Link Icon */}
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#009E60] tracking-tight">
            &quot;{contest?.title || "CUỘC THI BÌNH CHỌN MỚI"}&quot;
          </h1>
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 text-[#009E60] hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all"
            title="Sao chép liên kết chia sẻ cuộc thi"
          >
            {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <ExternalLink className="w-5 h-5" />}
          </button>
        </div>

        {copiedLink && (
          <div className="inline-block text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full animate-fade-in">
            ✓ Đã sao chép liên kết cuộc thi vào bộ nhớ tạm!
          </div>
        )}

        {/* Subtitle: THỜI GIAN NỘP BÀI KẾT THÚC SAU */}
        <div className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-800">
          THỜI GIAN NỘP BÀI KẾT THÚC SAU
        </div>

        {/* FLIP COUNTDOWN CLOCK CONTAINER (Dark Slate Gray Background - Image 3) */}
        <div className="inline-block bg-[#5A6570] text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-500/40 relative max-w-md w-full mx-auto">
          {/* Settings icon on top right */}
          <div className="absolute top-2.5 right-3 text-slate-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <Settings className="w-3.5 h-3.5" />
          </div>

          {/* Column Headers: NGÀY | GIỜ | PHÚT | GIÂY */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 text-[10px] sm:text-xs font-black tracking-wider uppercase text-slate-200 mb-2">
            <div>NGÀY</div>
            <div>GIỜ</div>
            <div>PHÚT</div>
            <div>GIÂY</div>
          </div>

          {/* Flip Number Cards: 02 : 23 : 55 : 10 */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 items-center">
            {/* Box 1: NGÀY */}
            <div className="bg-white text-slate-900 font-extrabold text-2xl sm:text-3xl md:text-4xl py-2.5 sm:py-3 rounded-lg shadow-inner flex items-center justify-center font-mono border border-slate-300">
              {timeLeft.days}
            </div>

            {/* Box 2: GIỜ */}
            <div className="bg-white text-slate-900 font-extrabold text-2xl sm:text-3xl md:text-4xl py-2.5 sm:py-3 rounded-lg shadow-inner flex items-center justify-center font-mono border border-slate-300">
              {timeLeft.hours}
            </div>

            {/* Box 3: PHÚT */}
            <div className="bg-white text-slate-900 font-extrabold text-2xl sm:text-3xl md:text-4xl py-2.5 sm:py-3 rounded-lg shadow-inner flex items-center justify-center font-mono border border-slate-300">
              {timeLeft.minutes}
            </div>

            {/* Box 4: GIÂY */}
            <div className="bg-white text-slate-900 font-extrabold text-2xl sm:text-3xl md:text-4xl py-2.5 sm:py-3 rounded-lg shadow-inner flex items-center justify-center font-mono border border-slate-300">
              {timeLeft.seconds}
            </div>
          </div>
        </div>

        {/* CTA BUTTON: NỘP TÁC PHẨM >> (Ảnh 3) */}
        <div className="pt-2 flex items-center justify-center space-x-2">
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center px-8 py-3 rounded-full bg-[#009E60] hover:bg-[#008552] text-white font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            NỘP TÁC PHẨM &gt;&gt;
          </button>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Cài đặt tác phẩm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: DANH SÁCH TÁC PHẨM & TÌM KIẾM (Ảnh 3) */}
      {/* ========================================================================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          {/* Left: DANH SÁCH TÁC PHẨM with green accent */}
          <div>
            <div className="w-12 h-1 bg-[#009E60] rounded-full mb-1.5"></div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                DANH SÁCH TÁC PHẨM
              </h2>
              <div className="flex items-center text-slate-400 space-x-1 ml-2">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded ${viewMode === "grid" ? "text-[#009E60] bg-emerald-50" : "hover:text-slate-600"}`}
                  title="Xem dạng lưới"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded ${viewMode === "list" ? "text-[#009E60] bg-emerald-50" : "hover:text-slate-600"}`}
                  title="Xem dạng danh sách"
                >
                  <List className="w-4 h-4" />
                </button>
                <Settings className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>

          {/* Right: Search Input with Green Button (Ảnh 3) */}
          <div className="flex items-center max-w-sm w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tác phẩm"
                className="w-full pl-3 pr-3 py-2 text-xs rounded-l-full border border-slate-300 focus:outline-none focus:border-emerald-500 bg-white"
              />
            </div>
            <button
              type="button"
              className="px-5 py-2 bg-[#009E60] hover:bg-[#008552] text-white text-xs font-bold rounded-r-full transition-colors shrink-0"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Content: Empty state arch (Ảnh 3) OR Submissions Grid */}
        {filteredSubmissions.length === 0 ? (
          /* ========================================================= */
          /* EMPTY STATE ARCH GRAPHIC EXACTLY AS IN IMAGE 3 */
          /* ========================================================= */
          <div className="pt-10 pb-16 flex flex-col items-center justify-center">
            {/* Curved dome arch */}
            <div className="w-full max-w-md sm:max-w-lg bg-gradient-to-b from-[#EEF2FF] to-white rounded-t-[180px] sm:rounded-t-[220px] pt-14 pb-10 px-6 flex flex-col items-center justify-center text-center shadow-xs border-t border-x border-slate-100">
              {/* Document / Folder Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center opacity-85">
                <div className="w-16 h-14 bg-white rounded-xl shadow-md border border-slate-200 relative flex items-center justify-center">
                  <div className="w-10 h-7 bg-slate-100 rounded border border-slate-300 space-y-1 p-1">
                    <div className="w-6 h-0.5 bg-slate-300 rounded"></div>
                    <div className="w-8 h-0.5 bg-slate-300 rounded"></div>
                    <div className="w-4 h-0.5 bg-slate-300 rounded"></div>
                  </div>
                  <div className="absolute -top-1.5 left-2 w-5 h-2 bg-slate-200 rounded-t border-t border-x border-slate-300"></div>
                </div>
              </div>

              {/* Text from Image 3 */}
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Chưa có tác phẩm nào cho cuộc thi bình chọn này!
              </p>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="mt-4 px-4 py-1.5 rounded-full border border-emerald-500 text-[#009E60] hover:bg-emerald-50 text-xs font-bold transition-colors"
              >
                + Hãy là người nộp tác phẩm đầu tiên
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* SUBMISSIONS GALLERY GRID WITH VOTING */
          /* ========================================================= */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredSubmissions.map((sub) => {
              const hasVoted = votedMap[sub.id];
              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex ${
                    viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row"
                  }`}
                >
                  {/* Media Thumbnail */}
                  <div
                    className={`relative bg-slate-100 overflow-hidden ${
                      viewMode === "grid" ? "h-52 w-full" : "sm:w-64 h-52 shrink-0"
                    }`}
                  >
                    <img
                      src={sub.mediaUrl}
                      alt={sub.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center">
                      {sub.mediaType === "VIDEO" ? (
                        <Video className="w-3 h-3 mr-1 text-red-400" />
                      ) : (
                        <ImageIcon className="w-3 h-3 mr-1 text-sky-400" />
                      )}
                      {sub.mediaType === "VIDEO" ? "Video clip" : "Hình ảnh"}
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                      {sub.unitName}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 line-clamp-1 hover:text-emerald-700 transition-colors">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {sub.description || "Tác phẩm tham dự bình chọn trực tuyến xã Ea Súp."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">{sub.authorName}</span>
                      </div>

                      {/* Vote Button */}
                      <button
                        type="button"
                        onClick={() => handleVote(sub.id)}
                        disabled={hasVoted}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          hasVoted
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-[#009E60] hover:bg-[#008552] text-white shadow-xs cursor-pointer active:scale-95"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasVoted ? "fill-rose-500" : ""}`} />
                        <span>{sub.votesCount} bình chọn</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: NỘP TÁC PHẨM DỰ THI (SUBMISSION MODAL) */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#009E60] flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nộp Tác Phẩm Dự Thi</h3>
                <p className="text-xs text-slate-500">
                  {contest?.title || "Cuộc thi bình chọn ảnh/video trực tuyến"}
                </p>
              </div>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-[#009E60] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Nộp tác phẩm thành công!
                </h4>
                <p className="text-xs text-slate-500">
                  Tác phẩm của bạn đã được ghi nhận vào hệ thống và hiển thị trong danh sách bình chọn.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitArtwork} className="space-y-4 text-xs">
                {/* 1. Tên tác phẩm */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên tác phẩm / Tiêu đề ảnh - video <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={submitForm.title}
                    onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                    placeholder="VD: Hoàng hôn trên Hồ Ea Súp Thượng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                {/* 2. Họ và tên tác giả + Đơn vị thôn buôn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Họ và tên tác giả <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={submitForm.authorName}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, authorName: e.target.value })
                      }
                      placeholder="VD: Lê Thị Ánh Tuyết"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Thôn / Buôn dự thi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={submitForm.unitName}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, unitName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      {EA_SUP_VILLAGES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Số điện thoại & CCCD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={submitForm.authorPhone}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, authorPhone: e.target.value })
                      }
                      placeholder="0984 xxx xxx"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số CCCD (Bảo mật)</label>
                    <input
                      type="text"
                      value={submitForm.authorCccd}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, authorCccd: e.target.value })
                      }
                      placeholder="066092xxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>

                {/* 4. Link Ảnh hoặc Video */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Đường dẫn hình ảnh hoặc video
                    </label>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSubmitForm({ ...submitForm, mediaType: "IMAGE" })}
                        className={`px-2 py-0.5 rounded ${
                          submitForm.mediaType === "IMAGE"
                            ? "bg-emerald-100 text-emerald-800 font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        Ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmitForm({ ...submitForm, mediaType: "VIDEO" })}
                        className={`px-2 py-0.5 rounded ${
                          submitForm.mediaType === "VIDEO"
                            ? "bg-emerald-100 text-emerald-800 font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        Video
                      </button>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={submitForm.mediaUrl}
                    onChange={(e) => setSubmitForm({ ...submitForm, mediaUrl: e.target.value })}
                    placeholder="https://... (hoặc để trống để dùng ảnh mẫu)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">
                    Hỗ trợ liên kết ảnh JPEG/PNG, video YouTube hoặc Google Drive công khai.
                  </span>
                </div>

                {/* 5. Lời bình / Thuyết minh */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lời bình / Thuyết minh tác phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={submitForm.description}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, description: e.target.value })
                    }
                    placeholder="Giới thiệu ý nghĩa, hoàn cảnh sáng tác và thông điệp gửi tới bà con nhân dân..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#009E60] hover:bg-[#008552] text-white font-bold text-xs shadow-md transition-all flex items-center cursor-pointer"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi tác phẩm dự thi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
