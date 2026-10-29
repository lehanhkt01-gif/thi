"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Save,
  User,
  Phone,
  Landmark,
  Calendar,
  Globe,
  QrCode,
  FileText,
  ChevronDown,
  Trophy,
  Scale,
  BookOpen,
  X,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import AudioPlayerAnNhien from "@/components/AudioPlayerAnNhien";
import FloatingActionBar from "@/components/FloatingActionBar";

interface QuestionItem {
  id: string;
  category?: string;
  content: string;
  options: { id: string; text: string }[];
  questionType?: string;
}

interface ReviewItem {
  questionId: string;
  category: string;
  content: string;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
  explanation: string;
}

interface LeaderboardItem {
  rank: number;
  id: string;
  fullName: string;
  unitName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  submittedAt: string;
}

export default function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // States
  const [contest, setContest] = useState<any>(null);
  const [loadingContest, setLoadingContest] = useState(true);
  const [examStep, setExamStep] = useState<"landing" | "testing" | "result">("landing");

  // Registration Modal (Ảnh 1: Xóa thông tin gợi ý mặc định)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [unitId, setUnitId] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [acceptedConsent, setAcceptedConsent] = useState(true);
  const [regError, setRegError] = useState("");
  const [starting, setStarting] = useState(false);

  // Informational Modals (Thể lệ, Kế hoạch)
  const [infoModal, setInfoModal] = useState<"rules" | "plan" | null>(null);

  // Leaderboard filters & state (Ảnh 4)
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [rankTab, setRankTab] = useState<"personal" | "group">("personal");
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("week");
  const [currentPage, setCurrentPage] = useState(1);

  // Giant Countdown Timer (Ảnh 2 & 3: 19 : 12 : 29 : 20)
  const [countdown, setCountdown] = useState({
    days: 19,
    hours: 12,
    minutes: 29,
    seconds: 20,
  });

  // Active Exam Room
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [tieBreaker, setTieBreaker] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(20 * 60);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");

  // Result
  const [resultData, setResultData] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    accuracyPercent: number;
    durationSeconds: number;
    review: ReviewItem[];
  } | null>(null);

  // 1. Nạp thông tin cuộc thi & Bảng xếp hạng (Hỗ trợ Preview live từ Query Params & Local Draft)
  useEffect(() => {
    const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const localDraftStr = typeof window !== "undefined" ? localStorage.getItem(`easup_contest_draft_${slug}`) : null;
    let localDraft: any = null;
    if (localDraftStr) {
      try {
        localDraft = JSON.parse(localDraftStr);
      } catch (e) {}
    }

    fetch(`/api/contests/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        let finalContest = data.contest || localDraft;
        if (!finalContest && localDraft) {
          finalContest = localDraft;
        }

        if (finalContest) {
          // Gộp với draft nếu có
          if (localDraft && (!data.contest || queryParams?.get("preview") === "1")) {
            finalContest = { ...finalContest, ...localDraft };
          }
          // Gộp các giá trị live query params khi xem trước (Mobile Preview modal)
          if (queryParams?.get("theme")) finalContest.themeColor = queryParams.get("theme");
          if (queryParams?.get("title")) finalContest.title = queryParams.get("title");
          if (queryParams?.get("banner")) finalContest.bannerUrl = queryParams.get("banner");
          if (queryParams?.get("start")) finalContest.startTime = queryParams.get("start");
          if (queryParams?.get("end")) finalContest.endTime = queryParams.get("end");
          if (queryParams?.get("desc")) finalContest.shortDesc = queryParams.get("desc");

          setContest(finalContest);
          setTimeLeftSeconds((finalContest.durationMinutes || 20) * 60);
          if (finalContest.units && finalContest.units.length > 0) {
            setUnitId(finalContest.units[0].id);
          }
        } else if (localDraft) {
          setContest(localDraft);
        }
      })
      .catch((err) => {
        console.error("Lỗi nạp cuộc thi:", err);
        if (localDraft) {
          setContest(localDraft);
        }
      })
      .finally(() => setLoadingContest(false));

    // Nạp Bảng xếp hạng thực tế
    fetch(`/api/contests/${slug}/results`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        } else {
          setLeaderboard([]);
        }
      })
      .catch((err) => {
        console.warn("Lỗi nạp bảng xếp hạng:", err);
        setLeaderboard([]);
      });
  }, [slug]);

  // 2. Countdown Timer Effect theo contest.endTime thực tế
  useEffect(() => {
    const updateCountdown = () => {
      if (!contest?.endTime) return;
      const target = new Date(contest.endTime).getTime();
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [contest?.endTime]);

  // 3. Chống gian lận: Bắt sự kiện chuyển tab / rời màn hình thi
  useEffect(() => {
    if (examStep !== "testing") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examStep]);

  // 4. Đồng hồ đếm ngược phòng thi (Server-backed timer)
  useEffect(() => {
    if (examStep !== "testing") return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStep, answers, attemptId, tieBreaker, tabSwitchCount]);

  // 5. LocalStorage Auto-Save (Mạng 4G chập chờn)
  const saveDraftToLocal = (updatedAnswers: Record<string, string[]>, pred: string) => {
    if (!contest || !cccd) return;
    try {
      const draftKey = `easup_draft_${contest.id}_${cccd.trim()}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers: updatedAnswers,
          tieBreaker: pred,
          savedAt: new Date().toLocaleTimeString("vi-VN"),
        })
      );
      setLastSavedTime(new Date().toLocaleTimeString("vi-VN"));
    } catch (e) {
      console.warn("Không thể lưu LocalStorage:", e);
    }
  };

  const restoreDraft = (contestId: string, userCccd: string) => {
    try {
      const draftKey = `easup_draft_${contestId}_${userCccd.trim()}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.tieBreaker) setTieBreaker(parsed.tieBreaker);
        if (parsed.savedAt) setLastSavedTime(parsed.savedAt);
      }
    } catch (e) {
      console.warn("Lỗi khôi phục nháp:", e);
    }
  };

  // 6. Bắt đầu thi (Gọi API /start an toàn - Zero Answer Leakage)
  const handleStartExam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRegError("");

    if (!acceptedConsent) {
      setRegError("Bạn cần đồng ý với điều khoản thu thập dữ liệu của BTC để tiếp tục!");
      return;
    }

    if (!cccd.trim() || cccd.trim().length < 9) {
      setRegError("Thí sinh không tồn tại trong danh sách thí sinh của cuộc thi. Vui lòng kiểm tra lại số CCCD/Mã định danh!");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !unitId) {
      setRegError("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Đơn vị dự thi!");
      return;
    }

    setStarting(true);
    try {
      const res = await fetch(`/api/contests/${slug}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          cccd,
          phone,
          unitId,
          birthYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || "Không thể khởi tạo phòng thi!");
        setStarting(false);
        return;
      }

      setAttemptId(data.attemptId);
      setQuestions(data.questions || []);
      setTimeLeftSeconds((data.durationMinutes || 20) * 60);

      // Thử khôi phục nháp
      restoreDraft(contest.id, cccd);

      setShowRegisterModal(false);
      setExamStep("testing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setRegError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setStarting(false);
    }
  };

  // Chọn đáp án
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: [optionId] };
      saveDraftToLocal(next, tieBreaker);
      return next;
    });
  };

  // Nộp bài thi
  const handleFinalSubmit = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch(`/api/contests/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
          tieBreakerPrediction: tieBreaker ? parseInt(tieBreaker, 10) : undefined,
          tabSwitchCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Lỗi khi nộp bài thi!");
        setSubmitting(false);
        return;
      }

      setResultData(data);
      setExamStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (data.accuracyPercent >= 80) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      if (contest && cccd) {
        localStorage.removeItem(`easup_draft_${contest.id}_${cccd.trim()}`);
      }
    } catch (err: any) {
      alert("Lỗi kết nối nộp bài: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loadingContest) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium text-sm">Đang nạp dữ liệu cuộc thi trực tuyến...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy cuộc thi!</h2>
        <Link href="/" className="btn-admin-primary mt-4 inline-block text-sm">
          Quay lại Cổng cuộc thi
        </Link>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: GIAO DIỆN CUỘC THI CHUẨN ẢNH 2, 3, 4
  // ==========================================
  if (examStep === "landing") {
    const top1 = leaderboard[0];
    const top2 = leaderboard[1];
    const top3 = leaderboard[2];
    const restRanks = leaderboard.slice(3, 8);

    return (
      <div className="w-full bg-[#F8FAFC] min-h-screen text-slate-800 pb-16">
        {/* 1. SUB-NAVBAR CHUẨN ẢNH 2 (TRANG CHỦ - THỂ LỆ - KẾ HOẠCH - BẢNG XẾP HẠNG) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-700">
              <ChevronLeft className="w-4 h-4" />
              <span>Cổng Cuộc thi</span>
            </Link>

            <nav className="flex items-center space-x-6 sm:space-x-10 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Link href="/" className="text-[#DC2626] hover:text-red-700 transition-colors">
                TRANG CHỦ
              </Link>
              <button
                onClick={() => setInfoModal("rules")}
                className="text-slate-700 hover:text-[#0052CC] transition-colors"
              >
                THỂ LỆ
              </button>
              <button
                onClick={() => setInfoModal("plan")}
                className="text-slate-700 hover:text-[#0052CC] transition-colors"
              >
                KẾ HOẠCH
              </button>
              <a
                href="#bang-xep-hang"
                className="text-slate-700 hover:text-[#0052CC] transition-colors hidden sm:inline"
              >
                BẢNG XẾP HẠNG
              </a>
            </nav>

            <button
              onClick={() => setShowRegisterModal(true)}
              style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
              className="text-xs font-bold text-white hover:opacity-90 px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer"
            >
              Vào thi
            </button>
          </div>
        </header>

        {/* 2. HERO BANNER CHUẨN ẢNH 3 - BANNER NẰM TRÙM LÊN CHE TOÀN BỘ KHU VỰC HERO (ĐÃ THU GỌN 1/3) */}
        <section
          className="relative w-full overflow-hidden py-3 sm:py-5 px-2 sm:px-4 shadow-md transition-colors duration-300"
          style={{
            backgroundColor: contest?.themeColor || "#990000",
            backgroundImage: `radial-gradient(ellipse at 50% 30%, ${contest?.themeColor || "#DC2626"} 0%, #991B1B 65%, #7F1D1D 100%)`,
          }}
        >
          {/* Decorative Lighting */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent"></div>

          {contest?.bannerUrl ? (
            <div className="max-w-4xl lg:max-w-5xl mx-auto relative z-10 flex justify-center">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/30 bg-black/10 backdrop-blur-xs w-full max-h-[220px] sm:max-h-[300px] md:max-h-[360px] flex items-center justify-center">
                <img
                  src={contest.bannerUrl}
                  alt={contest.title}
                  className="w-full h-full max-h-[220px] sm:max-h-[300px] md:max-h-[360px] block object-cover object-center transform hover:scale-[1.005] transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("cuocthi-phapluat")) {
                      target.src = "/banners/cuocthi-phapluat-2026.png";
                    } else {
                      target.style.display = "none";
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            /* Fallback Text Hero chỉ khi chưa thiết lập banner hình ảnh */
            <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 py-6">
              {/* Left Content / Main Title */}
              <div className="text-center md:text-left md:flex-1 space-y-3">
                {/* Seal / Organization */}
                <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase text-white border border-white/20">
                  <Landmark className="w-4 h-4 text-amber-300" />
                  <span>{contest.organizationName || "Ủy ban Nhân dân xã Ea Súp"}</span>
                </div>

                {/* Red Ribbon Pill: CUỘC THI TRỰC TUYẾN */}
                <div>
                  <span className="inline-block bg-[#DC2626] text-white text-xs sm:text-sm font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md border border-red-300/40">
                    CUỘC THI TRỰC TUYẾN
                  </span>
                </div>

                {/* Grand Main Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md tracking-tight uppercase max-w-2xl">
                  {contest.title}
                </h1>

                {/* Short Description */}
                {contest.shortDesc && (
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
                    {contest.shortDesc}
                  </p>
                )}

                {/* 2 Pill Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs">
                  <div className="flex items-center space-x-2 bg-white text-slate-800 font-semibold px-3.5 py-1.5 rounded-full shadow-xs">
                    <Calendar className="w-4 h-4" style={{ color: contest?.themeColor || "#DC2626" }} />
                    <span>
                      Thời gian: Từ {contest.startTime ? new Date(contest.startTime).toLocaleDateString("vi-VN") : "01/03/2026"} đến {contest.endTime ? new Date(contest.endTime).toLocaleDateString("vi-VN") : "31/12/2026"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 bg-white text-slate-800 font-semibold px-3.5 py-1.5 rounded-full shadow-xs">
                    <Globe className="w-4 h-4" style={{ color: contest?.themeColor || "#DC2626" }} />
                    <span>Tham gia tại: <strong>cuocthi.easupso.com</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Graphic: QR Code */}
              <div className="flex-shrink-0 flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
                <div className="bg-white p-2 rounded-xl shadow-xs text-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-900 rounded-lg flex items-center justify-center p-2 text-white">
                    <QrCode className="w-full h-full text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mt-1">
                    QUÉT MÃ DỰ THI
                  </span>
                </div>

                <div className="hidden sm:flex flex-col space-y-2 text-xs text-white/90">
                  <div className="flex items-center space-x-1.5">
                    <Scale className="w-4 h-4 text-amber-300" />
                    <span>Công bằng - Khách quan</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Bảo mật Zero-Trust</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-sky-200" />
                    <span>Tìm hiểu kiến thức pháp luật</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. MARQUEE TICKER CHUẨN ẢNH 2 */}
        <div
          className="w-full text-white py-2 overflow-hidden shadow-inner border-y border-white/20"
          style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
        >
          <div className="animate-marquee whitespace-nowrap text-xs sm:text-sm font-bold tracking-widest uppercase flex items-center space-x-8">
            <span>CUỘC THI DIỄN RA TỪ {contest.startTime ? new Date(contest.startTime).toLocaleDateString("vi-VN") : "15/10/2026"} ĐẾN {contest.endTime ? new Date(contest.endTime).toLocaleDateString("vi-VN") : "15/11/2026"}</span>
            <span className="text-amber-300">✦</span>
            <span>{contest.title}</span>
            <span className="text-amber-300">✦</span>
            <span>CUỘC THI DIỄN RA TỪ {contest.startTime ? new Date(contest.startTime).toLocaleDateString("vi-VN") : "15/10/2026"} ĐẾN {contest.endTime ? new Date(contest.endTime).toLocaleDateString("vi-VN") : "15/11/2026"}</span>
            <span className="text-amber-300">✦</span>
            <span>{contest.title}</span>
          </div>
        </div>

        {/* 4. GIANT COUNTDOWN TIMER & BUTTON "THAM GIA" CHUẨN ẢNH 2 & 3 */}
        <section className="max-w-4xl mx-auto px-4 pt-10 pb-6 text-center">
          <h2
            className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-3"
            style={{ color: contest?.themeColor || "#DC2626" }}
          >
            THỜI GIAN CÒN LẠI
          </h2>

          {/* Digital Timer Numbers (Ảnh 2 & 3) */}
          <div
            className="flex items-center justify-center space-x-2 sm:space-x-4 text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight select-none"
            style={{ color: contest?.themeColor || "#DC2626" }}
          >
            <span className="w-16 sm:w-24 text-center">{String(countdown.days).padStart(2, "0")}</span>
            <span className="opacity-60">:</span>
            <span className="w-16 sm:w-24 text-center">{String(countdown.hours).padStart(2, "0")}</span>
            <span className="opacity-60">:</span>
            <span className="w-16 sm:w-24 text-center">{String(countdown.minutes).padStart(2, "0")}</span>
            <span className="opacity-60">:</span>
            <span className="w-16 sm:w-24 text-center">{String(countdown.seconds).padStart(2, "0")}</span>
          </div>

          {/* Labels: Ngày - Giờ - Phút - Giây */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm font-semibold text-slate-500 mt-1 mb-8">
            <span className="w-16 sm:w-24 text-center">Ngày</span>
            <span className="w-4 text-transparent">:</span>
            <span className="w-16 sm:w-24 text-center">Giờ</span>
            <span className="w-4 text-transparent">:</span>
            <span className="w-16 sm:w-24 text-center">Phút</span>
            <span className="w-4 text-transparent">:</span>
            <span className="w-16 sm:w-24 text-center">Giây</span>
          </div>

          {/* Big Pill Button "THAM GIA" (Ảnh 3) */}
          <div className="space-y-2">
            <button
              onClick={() => setShowRegisterModal(true)}
              style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
              className="inline-flex items-center justify-center px-12 py-3.5 rounded-full text-base sm:text-lg font-black text-white transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 uppercase tracking-wide cursor-pointer hover:opacity-95"
            >
              THAM GIA
            </button>
            <div>
              <button
                onClick={() => setShowRegisterModal(true)}
                style={{ color: contest?.themeColor || "#DC2626" }}
                className="text-xs hover:underline font-semibold"
              >
                Bạn cần đăng nhập để dự thi
              </button>
            </div>
          </div>

          {/* Loa An Nhiên đọc thể lệ */}
          <div className="mt-6 max-w-md mx-auto">
            <AudioPlayerAnNhien
              label="Nghe đọc Thể lệ (Giọng đọc An Nhiên)"
              text={`Chào mừng bà con và các bạn đến với ${contest.title}. Thời gian làm bài ${contest.durationMinutes} phút. Mỗi thí sinh có tối đa ${contest.maxAttempts} lượt thi. Đề nghị điền chính xác số Căn cước công dân và chọn đơn vị dự thi.`}
            />
          </div>
        </section>



        {/* 6. CƠ CẤU GIẢI THƯỞNG DÀNH CHO CÁ NHÂN CHUẨN ẢNH 3 */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-black text-lg sm:text-2xl px-8 py-2.5 rounded-full uppercase tracking-wider shadow-md">
              CƠ CẤU GIẢI THƯỞNG DÀNH CHO CÁ NHÂN
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Giải Nhất */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/60 border border-amber-300 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                <Trophy className="w-9 h-9 text-amber-500" />
              </div>
              <div className="bg-amber-600 text-white font-black text-xs sm:text-sm py-1.5 px-3 rounded-lg uppercase tracking-wide mb-2 shadow-xs">
                {contest.prize1Count || "01"} GIẢI NHẤT
              </div>
              <div className="text-base sm:text-lg font-black text-amber-800">
                {contest.prize1 || "5.000.000 đồng/giải"}
              </div>
            </div>

            {/* Giải Nhì */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-300/40 flex items-center justify-center text-slate-600">
                <Trophy className="w-9 h-9 text-slate-500" />
              </div>
              <div className="bg-slate-700 text-white font-black text-xs sm:text-sm py-1.5 px-3 rounded-lg uppercase tracking-wide mb-2 shadow-xs">
                {contest.prize2Count || "02"} GIẢI NHÌ
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800">
                {contest.prize2 || "3.000.000 đồng/giải"}
              </div>
            </div>

            {/* Giải Ba */}
            <div className="bg-gradient-to-b from-orange-50 to-orange-100/60 border border-orange-300 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-400/20 flex items-center justify-center text-orange-600">
                <Trophy className="w-9 h-9 text-orange-600" />
              </div>
              <div className="bg-orange-600 text-white font-black text-xs sm:text-sm py-1.5 px-3 rounded-lg uppercase tracking-wide mb-2 shadow-xs">
                {contest.prize3Count || "03"} GIẢI BA
              </div>
              <div className="text-base sm:text-lg font-black text-orange-800">
                {contest.prize3 || "1.000.000 đồng/giải"}
              </div>
            </div>

            {/* Giải Khuyến Khích */}
            <div className="bg-gradient-to-b from-purple-50 to-purple-100/60 border border-purple-300 rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600">
                <Award className="w-9 h-9 text-purple-600" />
              </div>
              <div className="bg-purple-700 text-white font-black text-xs sm:text-sm py-1.5 px-3 rounded-lg uppercase tracking-wide mb-2 shadow-xs">
                {contest.prize4Count || "05"} GIẢI KHUYẾN KHÍCH
              </div>
              <div className="text-base sm:text-lg font-black text-purple-900">
                {contest.prize4 || "750.000 đồng/giải"}
              </div>
            </div>
          </div>
        </section>

        {/* 7. BẢNG XẾP HẠNG & TOP 3 PODIUM CHUẨN ẢNH 4 */}
        <section id="bang-xep-hang" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h2
            className="text-2xl sm:text-3xl font-black text-center mb-4"
            style={{ color: contest?.themeColor || "#DC2626" }}
          >
            Bảng xếp hạng
          </h2>

          {/* Filter Dropdowns (Ảnh 4) */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <button
              onClick={() => setRankTab(rankTab === "personal" ? "group" : "personal")}
              style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
              className="inline-flex items-center space-x-1.5 text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <span>{rankTab === "personal" ? "Cá nhân" : "Tập thể"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTimeFilter(timeFilter === "week" ? "all" : "week")}
              style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
              className="inline-flex items-center space-x-1.5 text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <span>{timeFilter === "week" ? "Theo tuần" : "Toàn cuộc thi"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Empty state khi chưa có thí sinh */}
          {leaderboard.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs mb-8">
              <div className="w-16 h-16 rounded-full bg-red-50 text-[#DC2626] mx-auto flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có kết quả dự thi</h3>
              <p className="text-xs text-slate-500 mb-5">
                Chưa có thí sinh nào hoàn thành bài thi. Hãy là người đầu tiên tham gia và ghi danh lên Bảng xếp hạng của xã Ea Súp!
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Vào thi ngay ➔
              </button>
            </div>
          ) : (
            <>
              {/* TOP 3 PODIUM STEPS (Ảnh 4) */}
              <div className="flex items-end justify-center max-w-2xl mx-auto mb-10 px-4">
                {/* Hạng 2 */}
                {top2 && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-300 border-2 border-white shadow-md flex items-center justify-center text-slate-600 font-bold">
                        <User className="w-7 h-7" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        2
                      </div>
                    </div>
                    <div className="text-center mb-2 px-1">
                      <div className="text-xs font-black text-slate-900 uppercase line-clamp-1">{top2.fullName}</div>
                      <div className="text-[11px] text-slate-500">{top2.unitName}</div>
                      <div
                        className="text-xs font-black"
                        style={{ color: contest?.themeColor || "#DC2626" }}
                      >
                        {top2.correctCount}/{top2.totalQuestions}
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                      className="w-full rounded-t-xl h-28 flex items-center justify-center text-white font-black text-2xl shadow-md opacity-90"
                    >
                      2
                    </div>
                  </div>
                )}

                {/* Hạng 1 */}
                {top1 && (
                  <div className="flex-1 flex flex-col items-center -mx-2 z-10">
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-amber-200 border-2 border-amber-400 shadow-lg flex items-center justify-center text-amber-700 font-bold">
                        <User className="w-8 h-8" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                        1
                      </div>
                    </div>
                    <div className="text-center mb-2 px-1">
                      <div className="text-xs font-black text-slate-900 uppercase line-clamp-1">{top1.fullName}</div>
                      <div className="text-[11px] text-slate-500">{top1.unitName}</div>
                      <div
                        className="text-xs font-black"
                        style={{ color: contest?.themeColor || "#DC2626" }}
                      >
                        {top1.correctCount}/{top1.totalQuestions}
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                      className="w-full rounded-t-2xl h-40 flex items-center justify-center text-white font-black text-3xl shadow-lg border-x-2 border-t-2 border-white/20"
                    >
                      1
                    </div>
                  </div>
                )}

                {/* Hạng 3 */}
                {top3 && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-orange-200 border-2 border-white shadow-md flex items-center justify-center text-orange-700 font-bold">
                        <User className="w-7 h-7" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        3
                      </div>
                    </div>
                    <div className="text-center mb-2 px-1">
                      <div className="text-xs font-black text-slate-900 uppercase line-clamp-1">{top3.fullName}</div>
                      <div className="text-[11px] text-slate-500">{top3.unitName}</div>
                      <div
                        className="text-xs font-black"
                        style={{ color: contest?.themeColor || "#DC2626" }}
                      >
                        {top3.correctCount}/{top3.totalQuestions}
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                      className="w-full rounded-t-xl h-20 flex items-center justify-center text-white font-black text-2xl shadow-md opacity-80"
                    >
                      3
                    </div>
                  </div>
                )}
              </div>

              {/* TABLE RANK 4 TO 8+ */}
              {restRanks.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-w-4xl mx-auto mb-6">
                  {restRanks.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-7 h-7 rounded-full bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 4}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                            {item.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.unitName}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                        {item.correctCount}/{item.totalQuestions}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {leaderboard.length > 8 && (
                <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-700">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="w-7 h-7 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-[#0052CC]"
                  >
                    ◀
                  </button>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        currentPage === p
                          ? "bg-[#0052CC] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="w-7 h-7 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-[#0052CC]"
                  >
                    ▶
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* 8. TIN TỪ BAN TỔ CHỨC CHUẨN ẢNH 4 */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0052CC] text-center mb-8">
            Tin từ ban tổ chức
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: KẾ HOẠCH CUỘC THI */}
            <div
              onClick={() => setInfoModal("plan")}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-r from-sky-600 via-sky-500 to-blue-700 p-4 text-white flex flex-col justify-between">
                <span className="text-[10px] font-bold text-sky-200 uppercase">Kế hoạch tổ chức</span>
                <h4 className="text-sm font-black uppercase text-white drop-shadow-sm line-clamp-2">
                  Kế hoạch tổ chức {contest.title}
                </h4>
                <span className="text-[10px] text-sky-100">Chi tiết lộ trình các đợt thi</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-black text-[#0052CC] group-hover:underline uppercase tracking-wide">
                  KẾ HOẠCH CUỘC THI
                </span>
              </div>
            </div>

            {/* Card 2: THỂ LỆ CUỘC THI */}
            <div
              onClick={() => setInfoModal("rules")}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 p-4 text-white flex flex-col justify-between">
                <span className="text-[10px] font-bold text-indigo-200 uppercase">Quy chế &amp; Thể lệ</span>
                <h4 className="text-sm font-black uppercase text-white drop-shadow-sm line-clamp-2">
                  Thể lệ dự thi, cách thức tính điểm và xét giải
                </h4>
                <span className="text-[10px] text-indigo-100">Quy định chi tiết cho thí sinh</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-black text-[#0052CC] group-hover:underline uppercase tracking-wide">
                  THỂ LỆ CUỘC THI
                </span>
              </div>
            </div>

            {/* Card 3: KẾT QUẢ CUỘC THI */}
            <Link
              href={`/ket-qua/${slug}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group block"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-4 text-white flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-200 uppercase">Công bố kết quả</span>
                <h4 className="text-sm font-black uppercase text-white drop-shadow-sm line-clamp-2">
                  Bảng vàng vinh danh &amp; Thống kê số liệu
                </h4>
                <span className="text-[10px] text-amber-100">Cập nhật liên tục từ máy chủ</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-black text-[#0052CC] group-hover:underline uppercase tracking-wide">
                  KẾT QUẢ CUỘC THI
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 9. MODAL "ĐĂNG KÝ TÀI KHOẢN DỰ THI" CHUẨN ẢNH 5 */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-dialog border border-slate-100 relative">
              {/* Close Button ✕ (Ảnh 5) */}
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Subtitle (Ảnh 5) */}
              <div className="text-center mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Đăng ký tài khoản dự thi
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Nhập số CCCD/Mã định danh để bắt đầu quá trình đăng ký
                </p>
              </div>

              {/* Error Message */}
              {regError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                  {regError}
                </div>
              )}

              <form onSubmit={handleStartExam} className="space-y-4">
                {/* Floating Border Input for CCCD (Ảnh 5) */}
                <div className="relative pt-1">
                  <div className="border border-slate-300 rounded-xl px-3.5 pt-3 pb-2.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-slate-500">
                      Nhập số CCCD/Mã định danh của bạn
                    </label>
                    <input
                      type="text"
                      required
                      value={cccd}
                      onChange={(e) => setCccd(e.target.value.replace(/\D/g, ""))}
                      maxLength={12}
                      placeholder="Nhập 12 số CCCD / Mã định danh..."
                      className="w-full text-sm sm:text-base font-semibold text-slate-900 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Additional Profile Fields */}
                <div className="space-y-3 pt-1">
                  {/* Họ và tên */}
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Họ và Tên thí sinh"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Số điện thoại liên hệ"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none"
                    />
                  </div>

                  {/* Đơn vị tham gia */}
                  <div>
                    <select
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="">-- Chọn đơn vị tham gia --</option>
                      {(contest.units || []).map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pink Callout Box (Ảnh 5) */}
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-red-200/80 text-center text-xs text-red-700 italic">
                  Bạn cần khai báo đúng thông tin, thông tin tạo tài khoản sẽ không được điều chỉnh
                </div>

                {/* Consent Checkbox (Ảnh 5) */}
                <div className="flex items-start space-x-2 pt-1 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    id="consent-check"
                    checked={acceptedConsent}
                    onChange={(e) => setAcceptedConsent(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="consent-check" className="cursor-pointer leading-relaxed">
                    Tôi đã đọc và đồng ý với việc{" "}
                    <button
                      type="button"
                      onClick={() => alert("Thông tin của bạn được lưu trữ an toàn theo tiêu chuẩn bảo mật của BTC cuộc thi và không chia sẻ cho bên thứ ba.")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      thu thập dữ liệu
                    </button>{" "}
                    của BTC cuộc thi. Xem chi tiết{" "}
                    <button
                      type="button"
                      onClick={() => setInfoModal("rules")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      tại đây
                    </button>.
                  </label>
                </div>

                {/* Action Button "➔ Tiếp tục" (Ảnh 5) */}
                <button
                  type="submit"
                  disabled={starting}
                  className="w-full py-3.5 rounded-full text-base font-bold bg-[#0052CC] hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>{starting ? "Đang chuẩn bị phòng thi..." : "Tiếp tục"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thông tin Thể lệ / Kế hoạch */}
        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-dialog border border-slate-100 max-h-[80vh] overflow-y-auto relative">
              <button
                onClick={() => setInfoModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 uppercase">
                {infoModal === "rules" ? "Thể Lệ Cuộc Thi" : "Kế Hoạch Tổ Chức"}
              </h3>
              <div
                className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contest.rulesHtml || "<p>Thông tin đang được cập nhật...</p>" }}
              />
              <div className="mt-6 pt-3 border-t border-slate-100 text-right">
                <button
                  onClick={() => setInfoModal(null)}
                  className="btn-admin-primary px-5 py-2 text-xs font-bold"
                >
                  Đã hiểu &amp; Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Action Bar */}
        <FloatingActionBar contestSlug={slug} />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PHÒNG THI ĐANG LÀM BÀI (MOBILE-FIRST)
  // ==========================================
  if (examStep === "testing") {
    const currentQ = questions[currentQIndex];
    const isUrgent = timeLeftSeconds < 120;

    return (
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        {/* Sticky Top Timer & Anti-Cheat Header */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-3 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            {/* Server Timer */}
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base ${
                  isUrgent
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-slate-900 text-white"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Đồng hồ máy chủ
              </span>
            </div>

            {/* Tab switch warning & 4G Auto-save */}
            <div className="flex items-center space-x-2">
              {tabSwitchCount > 0 && (
                <div className="flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  <span>Rời màn hình: {tabSwitchCount}</span>
                </div>
              )}
              {lastSavedTime && (
                <div className="hidden sm:flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  <Save className="w-3 h-3 mr-1" />
                  <span>Đã lưu {lastSavedTime}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="btn-admin-primary px-3 py-1.5 text-xs font-bold"
              >
                Nộp bài
              </button>
            </div>
          </div>

          {/* Question Jump Grid (1 - N) */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between overflow-x-auto gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = !!(answers[q.id] && answers[q.id].length > 0);
              const isCurrent = idx === currentQIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center flex-shrink-0 ${
                    isCurrent
                      ? "bg-[#0052CC] text-white ring-2 ring-blue-200"
                      : isAnswered
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-[#0052CC] uppercase tracking-wider">
                Câu {currentQIndex + 1} / {questions.length} • {currentQ.category || "Pháp luật"}
              </span>
              <AudioPlayerAnNhien
                isCompact
                text={currentQ.content}
              />
            </div>

            {/* Question text */}
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-5">
              {currentQ.content}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = (answers[currentQ.id] || []).includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`quiz-option ${isSelected ? "selected" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mr-3 transition-colors ${
                        isSelected
                          ? "bg-[#0052CC] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {opt.id}
                    </div>
                    <div className="text-sm sm:text-base text-slate-800 pt-0.5 leading-relaxed font-normal">
                      {opt.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="btn-admin-secondary text-xs sm:text-sm px-3.5 py-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Câu trước
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="btn-admin-primary text-xs sm:text-sm px-4 py-2 bg-[#0052CC] hover:bg-blue-700 border-blue-700"
                >
                  Câu tiếp <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="btn-admin-primary text-xs sm:text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
                >
                  Hoàn thành &amp; Nộp bài
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tie Breaker Prediction */}
        {contest.hasTieBreaker && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0052CC] mb-1">
              Câu hỏi phụ (Tiêu chí xét giải phụ)
            </h4>
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Theo bạn, có bao nhiêu lượt người tham gia cuộc thi này?
            </p>
            <input
              type="number"
              placeholder="Nhập số dự đoán (Ví dụ: 12500)"
              value={tieBreaker}
              onChange={(e) => {
                setTieBreaker(e.target.value);
                saveDraftToLocal(answers, e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            />
          </div>
        )}

        {/* Confirm Submit Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dialog border border-slate-200 text-center">
              <HelpCircle className="w-12 h-12 text-[#0052CC] mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Bạn có chắc chắn muốn nộp bài?
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Bạn đã trả lời {Object.keys(answers).length}/{questions.length} câu hỏi. Sau khi nộp, hệ thống máy chủ sẽ tự động chấm điểm và công bố kết quả tức thì.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-admin-secondary text-xs py-2.5"
                >
                  Kiểm tra lại
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFinalSubmit(false)}
                  className="btn-admin-primary text-xs py-2.5 font-bold bg-[#0052CC] hover:bg-blue-700 border-blue-700"
                >
                  {submitting ? "Đang chấm..." : "Xác nhận nộp"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: KẾT QUẢ THI & GIẢI THÍCH ĐIỀU KHOẢN LUẬT
  // ==========================================
  if (examStep === "result" && resultData) {
    const isPassed = resultData.accuracyPercent >= 50;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card mb-6">
          {/* Result Header */}
          <div className={`p-6 sm:p-8 text-white text-center ${isPassed ? "bg-emerald-600" : "bg-[#DC2626]"}`}>
            <Award className="w-16 h-16 mx-auto mb-3 text-white/90" />
            <h2 className="text-2xl font-black mb-1">
              {isPassed ? "Chúc Mừng Bạn Đã Hoàn Thành Bài Thi!" : "Đã Hoàn Thành Lượt Thi!"}
            </h2>
            <p className="text-xs text-white/80">
              {contest.title}
            </p>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-2 mt-6 max-w-sm mx-auto bg-black/15 rounded-xl p-3 backdrop-blur-xs">
              <div>
                <div className="text-[11px] text-white/80 uppercase font-semibold">Điểm số</div>
                <div className="text-2xl font-black mt-0.5">{resultData.score}</div>
              </div>
              <div className="border-x border-white/20">
                <div className="text-[11px] text-white/80 uppercase font-semibold">Đúng</div>
                <div className="text-2xl font-black mt-0.5">{resultData.correctCount}/{resultData.totalQuestions}</div>
              </div>
              <div>
                <div className="text-[11px] text-white/80 uppercase font-semibold">Độ chính xác</div>
                <div className="text-2xl font-black mt-0.5">{resultData.accuracyPercent}%</div>
              </div>
            </div>
          </div>

          {/* Duration & Tab switches summary */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Thời gian làm bài: <strong>{Math.floor(resultData.durationSeconds / 60)} phút {resultData.durationSeconds % 60} giây</strong></span>
            {tabSwitchCount > 0 ? (
              <span className="text-amber-700 font-semibold">Số lần rời màn hình: {tabSwitchCount}</span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kỷ luật thi tốt
              </span>
            )}
          </div>

          {/* Detailed Question Review with Legal Citations */}
          <div className="p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              Chi Tiết Bài Làm &amp; Căn Cứ Pháp Lý
            </h3>

            {resultData.review.map((item, idx) => (
              <div
                key={item.questionId}
                className={`p-4 rounded-xl border ${
                  item.isCorrect
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-red-50/50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Câu {idx + 1} • {item.category}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.isCorrect
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.isCorrect ? "Chính xác (+10đ)" : "Chưa chính xác (0đ)"}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 mb-2 leading-relaxed">
                  {item.content}
                </div>

                <div className="text-xs text-slate-700 space-y-1 mb-3">
                  <div>
                    Bạn chọn: <strong className={item.isCorrect ? "text-emerald-700" : "text-red-700"}>{item.selectedOptionIds.join(", ") || "Chưa chọn"}</strong>
                  </div>
                  <div>
                    Đáp án đúng: <strong className="text-emerald-700">{item.correctOptionIds.join(", ")}</strong>
                  </div>
                </div>

                {/* Legal Citation */}
                {item.explanation && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-[#0052CC]">Trích dẫn điều khoản: </strong>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setExamStep("landing");
                  setAnswers({});
                  setTieBreaker("");
                }}
                className="btn-admin-secondary w-full sm:w-1/2 py-2.5 text-xs font-semibold"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Quay lại trang cuộc thi
              </button>

              <Link
                href={`/ket-qua/${slug}`}
                className="btn-admin-primary w-full sm:w-1/2 py-2.5 text-xs font-bold text-center bg-[#0052CC] hover:bg-blue-700 border-blue-700"
              >
                <Award className="w-4 h-4 mr-1.5 inline" /> Xem Bảng xếp hạng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
