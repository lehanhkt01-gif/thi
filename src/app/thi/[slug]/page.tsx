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
  Users,
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
  LogOut,
  Upload,
  Download,
  ExternalLink,
  Trash2,
  Eye,
  FileCheck,
} from "lucide-react";
import AudioPlayerAnNhien from "@/components/AudioPlayerAnNhien";
import LoginModal, { GoogleIcon, syncAuthSession } from "@/components/LoginModal";
import LeaderboardSection from "@/components/LeaderboardSection";

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
  const [subUnitName, setSubUnitName] = useState("");
  const [customSubUnit, setCustomSubUnit] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [job, setJob] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [acceptedConsent, setAcceptedConsent] = useState(true);
  const [regError, setRegError] = useState("");
  const [starting, setStarting] = useState(false);
  const [checkingCccd, setCheckingCccd] = useState(false);
  const [cccdSyncStatus, setCccdSyncStatus] = useState<{
    exists: boolean;
    submittedAttemptsCount: number;
    maxAttempts: number;
    hasReachedMaxAttempts: boolean;
    highestScore?: number | null;
  } | null>(null);

  // Helper kiểm tra trường thông tin nào bắt buộc dựa theo thiết lập cuộc thi (Đồng bộ 2 chiều với Ảnh 3)
  const isFieldRequired = (fieldKey: string): boolean => {
    if (fieldKey === "fullName") return true;

    const reqKeys: string[] = contest?.requiredFieldKeys || [];
    if (reqKeys.length > 0) {
      return reqKeys.includes(fieldKey);
    }

    const rf = (contest?.requiredFields || "").toLowerCase();
    if (!rf) {
      return ["fullName", "cccd", "phone", "unitId"].includes(fieldKey);
    }

    if (fieldKey === "cccd") return rf.includes("cccd") || rf.includes("định danh");
    if (fieldKey === "phone") return rf.includes("điện thoại") || rf.includes("phone") || rf.includes("sđt");
    if (fieldKey === "email") return rf.includes("email");
    if (fieldKey === "birthday") return rf.includes("ngày sinh") || rf.includes("năm sinh");
    if (fieldKey === "gender") return rf.includes("giới tính");
    if (fieldKey === "job") return rf.includes("nghề nghiệp");
    if (fieldKey === "workplace") return rf.includes("công tác") || rf.includes("lớp") || rf.includes("mssv");
    if (fieldKey === "unitId") return true;

    return false;
  };

  // Informational Modals (Thể lệ, Kế hoạch)
  const [infoModal, setInfoModal] = useState<"rules" | "plan" | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Tải lên file PDF hoặc Hình ảnh đính kèm Thể lệ / Kế hoạch (Ảnh 3)
  const handleDocFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: "rulesFileUrl" | "planFileUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Tệp tải lên không được vượt quá 25MB!");
      return;
    }

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Tải tệp lên máy chủ thất bại!");
      }

      const fileUrl = data.url;

      // Cập nhật cuộc thi lưu trữ lâu dài trên server
      const updateRes = await fetch(`/api/contests/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
        },
        body: JSON.stringify({
          [targetField]: fileUrl,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.error || "Lưu đường dẫn tệp vào cuộc thi thất bại!");
      }

      setContest((prev: any) => ({
        ...prev,
        [targetField]: fileUrl,
      }));

      alert(`Đã cập nhật ${targetField === "rulesFileUrl" ? "file Thể lệ" : "file Kế hoạch"} thành công!`);
    } catch (err: any) {
      alert("Lỗi khi tải file: " + err.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  // Gỡ bỏ file đính kèm
  const handleRemoveDocFile = async (targetField: "rulesFileUrl" | "planFileUrl") => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ bỏ file ${targetField === "rulesFileUrl" ? "Thể lệ" : "Kế hoạch"} này không?`)) {
      return;
    }

    try {
      setUploadingDoc(true);
      const updateRes = await fetch(`/api/contests/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
        },
        body: JSON.stringify({
          [targetField]: "",
        }),
      });

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.error || "Gỡ file thất bại!");
      }

      setContest((prev: any) => ({
        ...prev,
        [targetField]: "",
      }));

      alert(`Đã gỡ bỏ file ${targetField === "rulesFileUrl" ? "Thể lệ" : "Kế hoạch"} thành công!`);
    } catch (err: any) {
      alert("Lỗi khi gỡ file: " + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Authentication State & SSO Sync (Đồng bộ đăng nhập hệ thống & Google)
  const [authUser, setAuthUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

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

  // Phân quyền xem ô công bố kết quả (Ảnh 3): chỉ admin, người tạo cuộc thi hoặc khi cuộc thi kết thúc
  const isAdmin = authUser?.role === "ADMIN";
  const isCreator =
    !!authUser &&
    Boolean(
      (contest?.creatorEmail && authUser.email && contest.creatorEmail.toLowerCase() === authUser.email.toLowerCase()) ||
      (contest?.creatorId && authUser.id && contest.creatorId === authUser.id) ||
      (contest?.organizerEmail && authUser.email && contest.organizerEmail.toLowerCase() === authUser.email.toLowerCase())
    );
  const now = Date.now();
  const startTimeMs = contest?.startTime && !isNaN(new Date(contest.startTime).getTime()) ? new Date(contest.startTime).getTime() : 0;
  const endTimeMs = contest?.endTime && !isNaN(new Date(contest.endTime).getTime()) ? new Date(contest.endTime).getTime() : 0;

  const isNotStarted = startTimeMs > 0 && now < startTimeMs;
  const isContestEnded =
    contest?.status === "CLOSED" ||
    contest?.status === "ARCHIVED" ||
    (endTimeMs > 0 && now >= endTimeMs);
  const isOngoing = !isNotStarted && !isContestEnded;

  const canViewResults = isAdmin || isCreator || isContestEnded;

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
    score?: number;
    correctCount?: number;
    totalQuestions?: number;
    accuracyPercent?: number;
    durationSeconds: number;
    tieBreakerPrediction?: number;
    review?: ReviewItem[];
    resultVisibility?: string;
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

  // 2. Countdown Timer Effect đồng bộ 2 chiều theo contest.startTime và contest.endTime thực tế
  useEffect(() => {
    const updateCountdown = () => {
      const currentTime = Date.now();
      const startMs = contest?.startTime && !isNaN(new Date(contest.startTime).getTime()) ? new Date(contest.startTime).getTime() : 0;
      const endMs = contest?.endTime && !isNaN(new Date(contest.endTime).getTime()) ? new Date(contest.endTime).getTime() : 0;

      // TH1: Khi chưa đến thời gian bắt đầu: Đếm lùi thời gian đến khi bắt đầu cuộc thi (ảnh 2)
      if (startMs > 0 && currentTime < startMs) {
        const diff = Math.max(0, startMs - currentTime);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown({ days, hours, minutes, seconds });
        return;
      }

      // TH2: Trong thời gian thi: Đếm lùi thời gian còn lại đến khi kết thúc cuộc thi
      if (endMs > 0 && currentTime < endMs) {
        const diff = Math.max(0, endMs - currentTime);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown({ days, hours, minutes, seconds });
        return;
      }

      // TH3: Cuộc thi đã kết thúc
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [contest?.startTime, contest?.endTime]);

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

  // Đồng bộ 2 chiều: Xác minh thí sinh bằng CCCD hoặc Số điện thoại với hồ sơ và số lượt thi
  const verifyParticipant = async ({ cccdVal, phoneVal }: { cccdVal?: string; phoneVal?: string }) => {
    const cleanCccd = (cccdVal !== undefined ? cccdVal : cccd).replace(/\D/g, "");
    const cleanPhone = (phoneVal !== undefined ? phoneVal : phone).replace(/\D/g, "");

    const identifier = cleanCccd.length >= 9 ? cleanCccd : (cleanPhone.length >= 9 ? cleanPhone : "");
    if (!identifier) {
      setCccdSyncStatus(null);
      return;
    }
    setCheckingCccd(true);
    try {
      const queryParam = cleanCccd.length >= 9 ? `cccd=${cleanCccd}` : `phone=${cleanPhone}`;
      const res = await fetch(`/api/contests/${slug}/start?${queryParam}`);
      const data = await res.json();
      if (data.success) {
        setCccdSyncStatus({
          exists: data.exists,
          submittedAttemptsCount: data.submittedAttemptsCount || 0,
          maxAttempts: data.maxAttempts || 3,
          hasReachedMaxAttempts: !!data.hasReachedMaxAttempts,
          highestScore: data.highestScore,
        });

        // Tự động điền thông tin (đồng bộ 2 chiều từ danh sách vào form) nếu chưa nhập hoặc cần đồng bộ
        if (data.participant) {
          if (data.participant.fullName) setFullName(data.participant.fullName);
          if (data.participant.phone) setPhone(data.participant.phone);
          if (data.participant.unitId) setUnitId(data.participant.unitId);
          if (data.participant.email) setEmail(data.participant.email);
          if (data.participant.gender) setGender(data.participant.gender);
          if (data.participant.job) setJob(data.participant.job);
          if (data.participant.workplace) setWorkplace(data.participant.workplace);
          if (data.participant.birthday) {
            setBirthday(data.participant.birthday);
          } else if (data.participant.birthYear) {
            setBirthday(String(data.participant.birthYear));
          }
        }

        if (data.hasReachedMaxAttempts) {
          setRegError(
            `Bạn đã tham gia đủ tối đa ${data.maxAttempts || 3} lượt thi theo thể lệ quy định! (Lần cao nhất: ${data.highestScore ?? 0} điểm)`
          );
        } else {
          setRegError("");
        }
      }
    } catch (e) {
      console.warn("Lỗi xác minh thí sinh:", e);
    } finally {
      setCheckingCccd(false);
    }
  };

  const handleCccdChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setCccd(clean);
    if (clean.length >= 9) {
      verifyParticipant({ cccdVal: clean });
    } else if (!phone || phone.length < 9) {
      setCccdSyncStatus(null);
      setRegError("");
    }
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setPhone(clean);
    if (!cccd || cccd.length < 9) {
      if (clean.length >= 9) {
        verifyParticipant({ phoneVal: clean });
      } else {
        setCccdSyncStatus(null);
        setRegError("");
      }
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

    if (!fullName.trim()) {
      setRegError("Vui lòng nhập Họ tên thí sinh!");
      return;
    }

    if (isFieldRequired("cccd") && (!cccd.trim() || cccd.trim().length < 9)) {
      setRegError("Vui lòng nhập đúng số CCCD/Mã định danh (từ 9 đến 12 chữ số)!");
      return;
    }

    if (isFieldRequired("phone") && (!phone.trim() || phone.trim().length < 9)) {
      setRegError("Vui lòng nhập Số điện thoại liên hệ hợp lệ!");
      return;
    }

    if (isFieldRequired("email") && (!email.trim() || !email.includes("@"))) {
      setRegError("Vui lòng nhập Email hợp lệ!");
      return;
    }

    if (isFieldRequired("birthday") && !birthday.trim()) {
      setRegError("Vui lòng nhập Ngày sinh của bạn!");
      return;
    }

    if (isFieldRequired("gender") && !gender.trim()) {
      setRegError("Vui lòng chọn Giới tính!");
      return;
    }

    if (isFieldRequired("job") && !job.trim()) {
      setRegError("Vui lòng nhập Nghề nghiệp!");
      return;
    }

    if (isFieldRequired("workplace") && !workplace.trim()) {
      setRegError("Vui lòng nhập Lớp, MSSV hoặc Nơi công tác!");
      return;
    }

    if (!unitId) {
      setRegError("Vui lòng chọn Đơn vị dự thi!");
      return;
    }

    setStarting(true);
    try {
      const res = await fetch(`/api/contests/${slug}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          cccd: cccd.trim() || phone.trim() || "ANONYMOUS",
          phone,
          unitId,
          subUnitName: subUnitName === "OTHER" ? customSubUnit.trim() : subUnitName.trim(),
          email,
          birthday,
          gender,
          job,
          workplace,
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

      // Phát sự kiện đồng bộ 2 chiều tức thời tới tất cả các trang và tab khác
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cuocthi_exam_submitted"));
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
        {/* 1. SUB-NAVBAR CHUẨN ẢNH 3 (< TRANG CHỦ, THỂ LỆ, KẾ HOẠCH) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#DC2626] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>TRANG CHỦ</span>
            </Link>

            <nav className="flex items-center space-x-6 sm:space-x-10 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setInfoModal("rules")}
                className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-[#DC2626] transition-colors cursor-pointer group"
                title="Xem Thể lệ cuộc thi (Khớp nối 2 chiều với ô Thể lệ bên dưới)"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#DC2626]" />
                <span>THỂ LỆ</span>
                {contest?.rulesFileUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Đã có văn bản đính kèm"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setInfoModal("plan")}
                className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-[#DC2626] transition-colors cursor-pointer group"
                title="Xem Kế hoạch cuộc thi (Khớp nối 2 chiều với ô Kế hoạch bên dưới)"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#DC2626]" />
                <span>KẾ HOẠCH</span>
                {contest?.planFileUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Đã có văn bản đính kèm"></span>
                )}
              </button>
            </nav>

            <div className="flex items-center space-x-2">
              {/* Nút Đăng nhập / Trạng thái tài khoản (Ảnh 2 chuẩn) */}
              {authUser ? (
                <div className="flex items-center space-x-1.5">
                  <div
                    className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 pl-2.5 pr-3 py-1 rounded-full text-xs text-blue-900 font-bold shadow-2xs max-w-[150px] sm:max-w-[200px]"
                    title={`Đang đăng nhập: ${authUser.name} (${authUser.role === "ADMIN" ? "Quản trị viên" : "Người dùng"})`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${authUser.role === "ADMIN" ? "bg-red-600" : "bg-blue-600"}`}></span>
                    <span className="truncate">{authUser.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      syncAuthSession(null);
                      setAuthUser(null);
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-[#DC2626] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  title="Đăng nhập tài khoản"
                >
                  <User className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  <span>Đăng nhập</span>
                </button>
              )}

              {/* Nút Vào thi */}
              <button
                onClick={() => {
                  if (!authUser) {
                    setShowLoginModal(true);
                  } else {
                    setShowRegisterModal(true);
                  }
                }}
                style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                className="text-xs font-bold text-white hover:opacity-90 px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer"
              >
                Vào thi
              </button>
            </div>
          </div>
        </header>

        {/* 2. HERO BANNER CHUẨN ẢNH 3 - KÉO DÀI CHIỀU CAO SÁT MÉP ĐỎ TRÊN VÀ DƯỚI, HẠN CHẾ CHE KHUẤT HÌNH ẢNH */}
        <section
          className="relative w-full overflow-hidden py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 shadow-md transition-colors duration-300"
          style={{
            backgroundColor: contest?.themeColor || "#990000",
            backgroundImage: `radial-gradient(ellipse at 50% 30%, ${contest?.themeColor || "#DC2626"} 0%, #991B1B 65%, #7F1D1D 100%)`,
          }}
        >
          {/* Decorative Lighting */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent"></div>

          {contest?.bannerUrl || true ? (
            <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto relative z-10 flex justify-center">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-black/15 backdrop-blur-xs w-full flex items-center justify-center">
                <img
                  src={contest?.bannerUrl || "/banner-easup.png"}
                  alt={contest?.title || "Cuộc thi trực tuyến"}
                  className="w-full h-auto block object-contain object-center transform hover:scale-[1.002] transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("banner-easup.png")) {
                      target.src = "/banner-easup.png";
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
            {isNotStarted
              ? "CUỘC THI BẮT ĐẦU SAU"
              : isContestEnded
              ? "CUỘC THI ĐÃ KẾT THÚC"
              : "THỜI GIAN CÒN LẠI"}
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

          {/* Big Pill Button "THAM GIA" & Nút Đăng nhập Google (Ảnh 1 & 2 chuẩn) */}
          <div className="space-y-3">
            {isNotStarted ? (
              /* TRƯỜNG HỢP CHƯA ĐẾN THỜI GIAN BẮT ĐẦU: NÚT "THAM GIA" MỜ ĐI (ẢNH 2) */
              <div className="flex flex-col items-center space-y-2">
                <button
                  type="button"
                  disabled
                  style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                  className="inline-flex items-center justify-center px-12 py-3.5 rounded-full text-base sm:text-lg font-black text-white uppercase tracking-wide opacity-35 cursor-not-allowed select-none shadow-none pointer-events-none"
                  title="Cuộc thi chưa đến thời gian mở thi"
                >
                  THAM GIA
                </button>
                <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Cuộc thi chính thức mở lúc:{" "}
                    <strong>{contest.startTime ? new Date(contest.startTime).toLocaleString("vi-VN") : "Sắp diễn ra"}</strong>
                  </span>
                </div>
              </div>
            ) : isContestEnded ? (
              /* TRƯỜNG HỢP CUỘC THI ĐÃ KẾT THÚC */
              <div className="flex flex-col items-center space-y-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center px-12 py-3.5 rounded-full text-base sm:text-lg font-black text-white uppercase tracking-wide bg-slate-400 opacity-60 cursor-not-allowed select-none shadow-none pointer-events-none"
                >
                  ĐÃ KẾT THÚC
                </button>
                <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Cuộc thi đã khép lại vào lúc {contest.endTime ? new Date(contest.endTime).toLocaleString("vi-VN") : "Hết hạn"}
                  </span>
                </div>
              </div>
            ) : (
              /* TRƯỜNG HỢP ĐANG TRONG THỜI GIAN THI: NÚT THAM GIA HOẠT ĐỘNG BÌNH THƯỜNG */
              <>
                <button
                  onClick={() => {
                    if (!authUser) {
                      setShowLoginModal(true);
                    } else {
                      setShowRegisterModal(true);
                    }
                  }}
                  style={{ backgroundColor: contest?.themeColor || "#DC2626" }}
                  className="inline-flex items-center justify-center px-12 py-3.5 rounded-full text-base sm:text-lg font-black text-white transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 uppercase tracking-wide cursor-pointer hover:opacity-95"
                >
                  THAM GIA
                </button>

                {authUser ? (
                  <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-4 rounded-full max-w-md mx-auto shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Đã đăng nhập: <strong>{authUser.name}</strong> • Sẵn sàng tham gia</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(true)}
                      style={{ color: contest?.themeColor || "#DC2626" }}
                      className="text-xs hover:underline font-semibold cursor-pointer"
                    >
                      Bạn cần đăng nhập để dự thi
                    </button>

                    {/* Nút Đăng nhập bằng Google tại vị trí thời gian đếm ngược */}
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-full text-xs font-bold text-slate-700 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                    >
                      <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Đăng nhập bằng Google</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Loa An Nhiên đọc thể lệ (Đọc nội dung trong ô "Thể lệ cuộc thi" thuộc phần "1 tổng quan" - Ảnh 1) */}
          <div className="mt-6 max-w-md mx-auto">
            <AudioPlayerAnNhien
              label="Nghe đọc Thể lệ (Giọng đọc An Nhiên)"
              text={
                (contest.shortDesc && contest.shortDesc.trim()) ||
                (contest.rulesHtml
                  ? contest.rulesHtml
                      .replace(/<[^>]*>/g, " ")
                      .replace(/&nbsp;/g, " ")
                      .replace(/\s+/g, " ")
                      .trim()
                  : "") ||
                `Chào mừng bà con và các bạn đến với ${contest.title}. Thời gian làm bài ${contest.durationMinutes} phút. Mỗi thí sinh có tối đa ${contest.maxAttempts} lượt thi. Đề nghị điền chính xác số Căn cước công dân và chọn đơn vị dự thi.`
              }
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

        {/* 7. MODULE BẢNG XẾP HẠNG ĐA CHIỀU CHUẨN ẢNH 1 & ẢNH 2 */}
        <LeaderboardSection
          contestSlug={slug}
          contestTitle={contest?.title}
          initialUnits={contest?.units?.map((u: any) => (typeof u === "string" ? u : u.name))}
          themeColor={contest?.themeColor || "#00A9E0"}
          isContestEnded={isContestEnded}
          canViewHiddenLeaderboard={canViewResults}
          endTime={contest?.endTime}
          onEnterExam={() => {
            if (!authUser) {
              setShowLoginModal(true);
            } else {
              setShowRegisterModal(true);
            }
          }}
        />

        {/* 8. TIN TỪ BAN TỔ CHỨC CHUẨN ẢNH 4 */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0052CC] text-center mb-8">
            Tin từ ban tổ chức
          </h2>

          <div className={`grid grid-cols-1 ${canViewResults ? "md:grid-cols-3" : "md:grid-cols-2 max-w-4xl mx-auto"} gap-6`}>
            {/* Card 1: KẾ HOẠCH CUỘC THI - Khớp nối 2 chiều với nút KẾ HOẠCH trên đầu trang (Ảnh 4) */}
            <div
              onClick={() => setInfoModal("plan")}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-r from-sky-600 via-sky-500 to-blue-700 p-4 sm:p-5 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[11px] font-black text-sky-100 uppercase tracking-wider flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Kế hoạch tổ chức</span>
                  </span>
                  {contest.planFileUrl ? (
                    <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                      <FileCheck className="w-3 h-3" />
                      <span>{contest.planFileUrl.toLowerCase().endsWith(".pdf") ? "VĂN BẢN PDF" : "HÌNH ẢNH"}</span>
                    </span>
                  ) : (
                    <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      LỘ TRÌNH
                    </span>
                  )}
                </div>

                <div className="my-auto py-2 z-10">
                  <h4 className="text-sm sm:text-base font-black uppercase text-white drop-shadow-sm line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors">
                    Kế hoạch tổ chức {contest.title}
                  </h4>
                  <p className="text-[11px] text-sky-100 mt-1 line-clamp-1 flex items-center space-x-1">
                    <span>Thời gian:</span>
                    <span className="font-semibold text-white">
                      {contest.startTime && contest.endTime
                        ? `${new Date(contest.startTime).toLocaleDateString("vi-VN")} - ${new Date(contest.endTime).toLocaleDateString("vi-VN")}`
                        : "Tháng 10 – Tháng 12/2026"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-sky-100 z-10 pt-1 border-t border-white/15">
                  <span className="truncate">
                    {contest.planFileUrl ? "Đã đính kèm văn bản chính thức ban hành" : "Chi tiết lộ trình các đợt thi"}
                  </span>
                  <Eye className="w-3.5 h-3.5 text-sky-200 group-hover:scale-125 transition-transform shrink-0 ml-1" />
                </div>
              </div>

              <div className="p-4 text-center bg-white flex items-center justify-center space-x-2 border-t border-slate-100">
                <span className="text-xs sm:text-sm font-black text-[#0052CC] group-hover:text-blue-700 uppercase tracking-wide flex items-center space-x-1.5">
                  <span>KẾ HOẠCH CUỘC THI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 2: THỂ LỆ CUỘC THI - Khớp nối 2 chiều với nút THỂ LỆ trên đầu trang (Ảnh 4) */}
            <div
              onClick={() => setInfoModal("rules")}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 p-4 sm:p-5 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[11px] font-black text-indigo-100 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Quy chế &amp; Thể lệ</span>
                  </span>
                  {contest.rulesFileUrl ? (
                    <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                      <FileCheck className="w-3 h-3" />
                      <span>{contest.rulesFileUrl.toLowerCase().endsWith(".pdf") ? "VĂN BẢN PDF" : "HÌNH ẢNH"}</span>
                    </span>
                  ) : (
                    <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      QUY CHẾ
                    </span>
                  )}
                </div>

                <div className="my-auto py-2 z-10">
                  <h4 className="text-sm sm:text-base font-black uppercase text-white drop-shadow-sm line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors">
                    Thể lệ dự thi, cách thức tính điểm và xét giải
                  </h4>
                  <p className="text-[11px] text-indigo-100 mt-1 line-clamp-1 flex items-center space-x-1">
                    <span>Định dạng:</span>
                    <span className="font-semibold text-white">
                      {contest.questionCount || 20} câu trắc nghiệm • {contest.durationMinutes || 15} phút/lượt
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-indigo-100 z-10 pt-1 border-t border-white/15">
                  <span className="truncate">
                    {contest.rulesFileUrl ? "Đã đính kèm văn bản thể lệ chính thức" : "Quy định chi tiết cho thí sinh"}
                  </span>
                  <Eye className="w-3.5 h-3.5 text-indigo-200 group-hover:scale-125 transition-transform shrink-0 ml-1" />
                </div>
              </div>

              <div className="p-4 text-center bg-white flex items-center justify-center space-x-2 border-t border-slate-100">
                <span className="text-xs sm:text-sm font-black text-[#0052CC] group-hover:text-blue-700 uppercase tracking-wide flex items-center space-x-1.5">
                  <span>THỂ LỆ CUỘC THI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 3: KẾT QUẢ CUỘC THI - Chỉ hiển thị cho Admin, Người tạo cuộc thi hoặc khi cuộc thi kết thúc (Ảnh 3) */}
            {canViewResults && (
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
            )}
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
                  {isFieldRequired("cccd")
                    ? "Nhập số CCCD/Mã định danh để bắt đầu quá trình đăng ký"
                    : "Nhập thông tin thí sinh để bắt đầu làm bài thi"}
                </p>
              </div>

              {/* Error Message */}
              {regError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                  {regError}
                </div>
              )}

              {/* Status Badge khi đồng bộ thí sinh 2 chiều thành công */}
              {cccdSyncStatus && !regError && (
                <div className="mb-4 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      {cccdSyncStatus.exists
                        ? `Đã đồng bộ • Lượt thi ${cccdSyncStatus.submittedAttemptsCount + 1}/${cccdSyncStatus.maxAttempts}`
                        : `Thí sinh mới • Lượt thi 1/${cccdSyncStatus.maxAttempts}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold bg-blue-100/80 px-2 py-0.5 rounded-full">
                    Lưu điểm cao nhất
                  </span>
                </div>
              )}

              <form onSubmit={handleStartExam} className="space-y-4">
                {/* Floating Border Input for CCCD (Ảnh 1 & 3) */}
                {isFieldRequired("cccd") && (
                  <div className="relative pt-1">
                    <div className="border border-slate-300 rounded-xl px-3.5 pt-3 pb-2.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white relative">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-slate-500">
                        Nhập số CCCD/Mã định danh của bạn
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          required
                          value={cccd}
                          onChange={(e) => handleCccdChange(e.target.value)}
                          maxLength={12}
                          placeholder="Nhập 12 số CCCD / Mã định danh..."
                          className="w-full text-sm sm:text-base font-semibold text-slate-900 outline-none bg-transparent"
                        />
                        {checkingCccd && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Profile Fields (Đồng bộ 2 chiều với Cài đặt đề thi Ảnh 3) */}
                <div className="space-y-3 pt-1">
                  {/* Họ và tên (Bắt buộc khóa) */}
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Họ và Tên thí sinh *"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none font-medium text-slate-900"
                    />
                  </div>

                  {/* Số điện thoại */}
                  {isFieldRequired("phone") && (
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Số điện thoại liên hệ *"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none font-medium text-slate-900"
                      />
                    </div>
                  )}

                  {/* Email */}
                  {isFieldRequired("email") && (
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Địa chỉ Email *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none font-medium text-slate-900"
                      />
                    </div>
                  )}

                  {/* Ngày sinh */}
                  {isFieldRequired("birthday") && (
                    <div>
                      <input
                        type="date"
                        required
                        placeholder="Ngày sinh *"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none font-medium text-slate-900"
                      />
                    </div>
                  )}

                  {/* Giới tính */}
                  {isFieldRequired("gender") && (
                    <div>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none bg-white font-medium text-slate-800"
                      >
                        <option value="">-- Chọn giới tính * --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  )}

                  {/* Nghề nghiệp */}
                  {isFieldRequired("job") && (
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Nghề nghiệp *"
                        value={job}
                        onChange={(e) => setJob(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none font-medium text-slate-900"
                      />
                    </div>
                  )}

                  {/* Lớp, MSSV, Nơi công tác */}
                  {isFieldRequired("workplace") && (
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Lớp, MSSV, Nơi công tác *"
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none font-medium text-slate-900"
                      />
                    </div>
                  )}

                  {/* Đơn vị tham gia (Cấp 2: Trường THPT, Chi đoàn, Thôn buôn) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Đơn vị tham gia (Cấp 2) <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={unitId}
                      onChange={(e) => {
                        setUnitId(e.target.value);
                        setSubUnitName("");
                        setCustomSubUnit("");
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="">-- Chọn đơn vị tham gia * --</option>
                      {(contest.units || []).map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.subUnits && u.subUnits.length > 0 ? `(${u.subUnits.length} lớp/đơn vị trực thuộc)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Đơn vị trực thuộc / Lớp con (Cấp 3 - Tự động hiển thị khi đơn vị có cấp 3) */}
                  {(() => {
                    const selectedUnitObj = (contest?.units || []).find(
                      (u: any) => u.id === unitId || u.name === unitId
                    );
                    const subUnitsList: string[] = selectedUnitObj?.subUnits || [];
                    if (subUnitsList.length === 0) return null;

                    return (
                      <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                        <label className="block text-xs font-bold text-blue-900">
                          Lớp / Chi đoàn trực thuộc (Cấp 3) <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={subUnitName}
                          onChange={(e) => setSubUnitName(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs sm:text-sm focus:border-blue-600 outline-none bg-white font-medium text-slate-900 shadow-2xs"
                        >
                          <option value="">-- Chọn Lớp / Chi đoàn con * --</option>
                          {subUnitsList.map((sub, sIdx) => (
                            <option key={sIdx} value={sub}>
                              {sub}
                            </option>
                          ))}
                          <option value="OTHER">-- Đơn vị / Lớp khác (Tự nhập tay) --</option>
                        </select>
                        {subUnitName === "OTHER" && (
                          <input
                            type="text"
                            value={customSubUnit}
                            onChange={(e) => setCustomSubUnit(e.target.value)}
                            placeholder="Nhập tên lớp / chi đoàn con của bạn..."
                            required
                            className="w-full mt-2 px-3 py-2 rounded-xl border border-blue-300 text-xs bg-white outline-none focus:border-blue-600 font-medium"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Pink Callout Box (Ảnh 1 & Thể lệ 3 lần thi) */}
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-red-200/80 text-center text-xs text-red-700 italic">
                  Hệ thống tự động đồng bộ 2 chiều thông tin thí sinh. Mỗi thí sinh được phép thi 3 lần, hệ thống sẽ lưu toàn bộ thông tin của lần cao điểm nhất.
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
                  disabled={starting || !!cccdSyncStatus?.hasReachedMaxAttempts}
                  className="w-full py-3.5 rounded-full text-base font-bold bg-[#0052CC] hover:bg-blue-700 disabled:bg-slate-300 text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed mt-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>{starting ? "Đang chuẩn bị phòng thi..." : "Tiếp tục"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thông tin Thể lệ / Kế hoạch (Ảnh 1 & 2: Đã loại bỏ hoàn toàn các dòng chữ thừa; hỗ trợ xem và đính kèm file) */}
        {infoModal && (() => {
          const isRules = infoModal === "rules";
          const currentFileUrl = isRules ? contest.rulesFileUrl : contest.planFileUrl;
          const isPdf = currentFileUrl && (currentFileUrl.toLowerCase().endsWith(".pdf") || currentFileUrl.includes(".pdf"));
          const isImg = currentFileUrl && (!isPdf || currentFileUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) || currentFileUrl.startsWith("data:image/"));
          
          // Lọc sạch nội dung theo yêu cầu Ảnh 1 và Ảnh 2
          let cleanContent = "";
          if (isRules) {
            let rawRules = contest.rulesHtml || "";
            // Bỏ dòng chữ "Mỗi thí sinh được tham gia tối đa 3 lần để tìm hiểu, bằng cách trắc nghiệm." (Ảnh 1)
            rawRules = rawRules
              .replace(/<p[^>]*>.*?Mỗi thí sinh được tham gia tối đa.*?<\/p>/gi, "")
              .replace(/Mỗi thí sinh được tham gia tối đa.*?trắc nghiệm\./gi, "")
              .replace(/Mỗi thí sinh được tham gia tối đa.*?[!\.]/gi, "")
              .trim();
            cleanContent = rawRules;
          } else {
            let rawPlan = contest.planHtml || "";
            // Bỏ dòng chữ "Đề nghị các đồng chí tham gia đúng tiến độ" (Ảnh 2)
            rawPlan = rawPlan
              .replace(/<p[^>]*>.*?Đề nghị các đồng chí.*?<\/p>/gi, "")
              .replace(/Đề nghị các đồng chí tham gia đúng tiến độ/gi, "")
              .replace(/Đề nghị các đồng chí.*?[!\.]/gi, "")
              .trim();
            cleanContent = rawPlan;
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-5 sm:p-7 shadow-dialog border border-slate-100 max-h-[88vh] overflow-y-auto relative flex flex-col">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      {isRules ? "Thể Lệ Cuộc Thi" : "Kế Hoạch Tổ Chức"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setInfoModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Đóng modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quản lý tải lên file PDF/Hình ảnh dành cho Người tạo cuộc thi & Admin (Ảnh 3) */}
                {(isAdmin || isCreator) && (
                  <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2">
                        <Upload className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            Cập nhật file PDF / Hình ảnh {isRules ? "Thể lệ" : "Kế hoạch"}
                          </p>
                          <p className="text-[11px] text-amber-700">
                            (Dành cho Người tạo &amp; Ban tổ chức • Thí sinh bấm vào sẽ nổi lên xem trực tiếp)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <label className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${uploadingDoc ? "bg-slate-400 cursor-not-allowed" : "bg-[#DC2626] hover:bg-red-700"}`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingDoc ? "Đang tải lên..." : (currentFileUrl ? "Đổi file khác" : "Tải file lên")}</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            disabled={uploadingDoc}
                            onChange={(e) => handleDocFileUpload(e, isRules ? "rulesFileUrl" : "planFileUrl")}
                            className="hidden"
                          />
                        </label>

                        {currentFileUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDocFile(isRules ? "rulesFileUrl" : "planFileUrl")}
                            disabled={uploadingDoc}
                            className="p-1.5 rounded-xl text-red-600 hover:bg-red-100/60 border border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                            title="Gỡ bỏ file hiện tại"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nội dung văn bản (Đã loại bỏ sạch text thừa theo Ảnh 1 và Ảnh 2) */}
                {cleanContent ? (
                  <div
                    className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed mb-4 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: cleanContent }}
                  />
                ) : !currentFileUrl ? (
                  <div className="text-xs sm:text-sm text-slate-500 italic py-2">
                    {isRules
                      ? "Thông tin thể lệ chính thức đang được Ban tổ chức cập nhật..."
                      : "Kế hoạch tổ chức chi tiết đang được Ban tổ chức cập nhật..."}
                  </div>
                ) : null}

                {/* Khu vực hiển thị file đính kèm nổi lên trên (Ảnh 3: PDF / Hình ảnh) */}
                {currentFileUrl && (
                  <div className="mt-2 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {isPdf ? "Văn bản đính kèm chính thức (Định dạng PDF)" : "Hình ảnh / Tài liệu đính kèm"}
                        </span>
                      </div>
                      <a
                        href={currentFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-[#0052CC] hover:underline"
                      >
                        <span>{isPdf ? "Mở tab mới / Tải PDF" : "Xem ảnh gốc"}</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                      </a>
                    </div>

                    {isPdf ? (
                      <div className="w-full h-[360px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 shadow-inner">
                        <iframe
                          src={`${currentFileUrl}#toolbar=1`}
                          title={isRules ? "Thể lệ cuộc thi PDF" : "Kế hoạch cuộc thi PDF"}
                          className="w-full h-full border-none"
                        />
                      </div>
                    ) : (
                      <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex justify-center shadow-xs">
                        <img
                          src={currentFileUrl}
                          alt={isRules ? "Thể lệ cuộc thi" : "Kế hoạch cuộc thi"}
                          className="w-full max-h-[500px] object-contain rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Modal */}
                <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Hệ sinh thái chuyển đổi số easupso.com
                  </div>
                  <button
                    onClick={() => setInfoModal(null)}
                    className="btn-admin-primary px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Đã hiểu &amp; Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL ĐĂNG NHẬP HỆ THỐNG & GOOGLE SIGN-IN */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={(user) => {
            setAuthUser(user);
            if (!fullName && user.name) setFullName(user.name);
            if (!phone && user.phone) setPhone(user.phone);
          }}
        />
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
      <div className="w-full min-h-screen bg-[#F8FAFC]">
        {/* Sticky Top Timer & Anti-Cheat Header - ĐƯA LÊN TRÊN CÙNG, KHÔNG CHE KHUẤT CÂU HỎI VÀ CÔNG CỤ */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-3xl mx-auto px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              {/* Server Timer */}
              <div className="flex items-center space-x-2 shrink-0">
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

              {/* Tab switch warning & 4G Auto-save & Nộp bài */}
              <div className="flex items-center space-x-2">
                {tabSwitchCount > 0 && (
                  <div className="flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    <span>Rời màn hình: {tabSwitchCount}</span>
                  </div>
                )}
                {lastSavedTime && (
                  <div className="hidden sm:flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    <Save className="w-3 h-3 mr-1 text-emerald-600" />
                    <span>Đã lưu {lastSavedTime}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Nộp bài
                </button>
              </div>
            </div>

            {/* Question Jump Grid (1 - N) */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-start sm:justify-center overflow-x-auto gap-1.5 py-0.5">
              {questions.map((q, idx) => {
                const isAnswered = !!(answers[q.id] && answers[q.id].length > 0);
                const isCurrent = idx === currentQIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      isCurrent
                        ? "bg-[#0052CC] text-white ring-2 ring-blue-300 shadow-xs"
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
        </div>

        {/* Question Card Container (Đủ khoảng cách, tuyệt đối không bị che khuất) */}
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">

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
        </div>

        {/* Confirm Submit Modal với Bảng câu hỏi phụ Dự đoán số người tham dự */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-dialog border border-slate-200 text-center animate-scale-up">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-2xs">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">
                Xác Nhận Nộp Bài Thi
              </h3>
              
              {/* Tình trạng làm bài */}
              <div className="mb-4">
                <p className="text-xs text-slate-600 font-medium">
                  Bạn đã trả lời <strong className="text-blue-600 font-bold">{Object.keys(answers).length}/{questions.length}</strong> câu hỏi.
                </p>
                {Object.keys(answers).length < questions.length && (
                  <div className="mt-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 py-1 px-3 rounded-lg inline-block">
                    ⚠️ Bạn vẫn còn {questions.length - Object.keys(answers).length} câu hỏi chưa chọn đáp án!
                  </div>
                )}
              </div>

              {/* BẢNG CÂU HỎI PHỤ: DỰ ĐOÁN SỐ NGƯỜI THAM DỰ */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-left mb-5 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-800 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Câu hỏi phụ (Tiêu chí phụ xếp hạng khi bằng điểm)</span>
                </div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Theo bạn, có bao nhiêu người tham gia cuộc thi này? <span className="text-red-600">*</span>
                </label>
                
                <div className="relative">
                  <Users className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    placeholder="Nhập số người dự đoán (Ví dụ: 1500)..."
                    value={tieBreaker}
                    onChange={(e) => {
                      setTieBreaker(e.target.value);
                      saveDraftToLocal(answers, e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-blue-300 text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white shadow-2xs"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed italic">
                  💡 Số dự đoán của bạn sẽ được hệ thống tự động ghi nhận vào kết quả thi và làm tiêu chí phụ phân định giải thưởng khi các thí sinh có cùng điểm số và thời gian làm bài.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-admin-secondary text-xs py-2.5 font-bold cursor-pointer rounded-xl"
                >
                  Kiểm tra lại bài
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFinalSubmit(false)}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs py-2.5 font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Đang chấm..." : "Xác nhận nộp bài"}
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
    const visibility = resultData.resultVisibility || contest?.resultVisibility || "SCORE_ONLY";
    const isPassed = (resultData.accuracyPercent ?? 0) >= 50;

    // 1. TRƯỜNG HỢP "KHÔNG CHO XEM" (HIDDEN)
    if (visibility === "HIDDEN") {
      return (
        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card mb-6">
            <div className="p-8 sm:p-10 bg-slate-900 text-white text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-black mb-2 uppercase tracking-tight">
                Bài Làm Đã Được Ghi Nhận Thành Công!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                {contest.title}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5 text-center">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs sm:text-sm text-blue-900 leading-relaxed">
                Theo thể lệ của Ban tổ chức, kết quả bài thi được bảo mật tuyệt đối và sẽ được công bố chính thức sau khi cuộc thi kết thúc. Cảm ơn bạn đã tích cực tham gia!
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>Thời gian: <strong>{Math.floor(resultData.durationSeconds / 60)}p {resultData.durationSeconds % 60}s</strong></span>
                {tieBreaker && (
                  <span className="text-blue-700 font-semibold flex items-center bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded-lg">
                    <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Dự đoán: {Number(tieBreaker).toLocaleString("vi-VN")} người
                  </span>
                )}
                {tabSwitchCount > 0 ? (
                  <span className="text-amber-700 font-semibold">Rời màn hình: {tabSwitchCount}</span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kỷ luật tốt
                  </span>
                )}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setExamStep("landing");
                    setAnswers({});
                    setTieBreaker("");
                  }}
                  className="btn-admin-secondary w-full sm:w-1/2 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Quay lại trang cuộc thi
                </button>
                <Link
                  href="/"
                  className="btn-admin-primary w-full sm:w-1/2 py-2.5 text-xs font-bold text-center bg-[#DC2626] hover:bg-red-700 border-red-700 cursor-pointer"
                >
                  Về Cổng Cuộc thi Ea Súp
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. TRƯỜNG HỢP "CHỈ CHO XEM ĐIỂM" (SCORE_ONLY) VÀ "CHO XEM ĐIỂM VÀ ĐÁP ÁN" (SCORE_AND_ANSWERS)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
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
                <div className="text-2xl font-black mt-0.5">{resultData.score ?? 0}</div>
              </div>
              <div className="border-x border-white/20">
                <div className="text-[11px] text-white/80 uppercase font-semibold">Đúng</div>
                <div className="text-2xl font-black mt-0.5">{resultData.correctCount ?? 0}/{resultData.totalQuestions ?? 0}</div>
              </div>
              <div>
                <div className="text-[11px] text-white/80 uppercase font-semibold">Độ chính xác</div>
                <div className="text-2xl font-black mt-0.5">{resultData.accuracyPercent ?? 0}%</div>
              </div>
            </div>
          </div>

          {/* Duration & Tab switches summary */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>Thời gian làm bài: <strong>{Math.floor(resultData.durationSeconds / 60)} phút {resultData.durationSeconds % 60} giây</strong></span>
            {tieBreaker && (
              <span className="text-blue-700 font-semibold flex items-center bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Dự đoán: <strong className="ml-1 text-blue-900">{Number(tieBreaker).toLocaleString("vi-VN")} người</strong>
              </span>
            )}
            {tabSwitchCount > 0 ? (
              <span className="text-amber-700 font-semibold">Số lần rời màn hình: {tabSwitchCount}</span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kỷ luật thi tốt
              </span>
            )}
          </div>

          {/* TRƯỜNG HỢP 2A: CHỈ CHO XEM ĐIỂM (Bảo mật tuyệt đối đáp án và câu hỏi) */}
          {visibility === "SCORE_ONLY" && (
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs sm:text-sm text-blue-900 leading-relaxed text-center">
                Ban tổ chức chỉ công bố điểm số của lượt thi này. Toàn bộ đáp án chi tiết và căn cứ pháp lý được bảo mật theo quy định thể lệ cuộc thi.
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setExamStep("landing");
                    setAnswers({});
                    setTieBreaker("");
                  }}
                  className="btn-admin-secondary w-full sm:w-1/2 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Quay lại trang cuộc thi
                </button>

                <Link
                  href={`/ket-qua/${slug}`}
                  className="btn-admin-primary w-full sm:w-1/2 py-2.5 text-xs font-bold text-center bg-[#0052CC] hover:bg-blue-700 border-blue-700 cursor-pointer"
                >
                  <Award className="w-4 h-4 mr-1.5 inline" /> Xem Bảng xếp hạng
                </Link>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2B: CHO XEM ĐIỂM VÀ ĐÁP ÁN (Detailed Review with Legal Citations) */}
          {visibility === "SCORE_AND_ANSWERS" && (
            <div className="p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                Chi Tiết Bài Làm &amp; Căn Cứ Pháp Lý
              </h3>

              {(resultData.review || []).map((item, idx) => (
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
                  className="btn-admin-secondary w-full sm:w-1/2 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Quay lại trang cuộc thi
                </button>

                <Link
                  href={`/ket-qua/${slug}`}
                  className="btn-admin-primary w-full sm:w-1/2 py-2.5 text-xs font-bold text-center bg-[#0052CC] hover:bg-blue-700 border-blue-700 cursor-pointer"
                >
                  <Award className="w-4 h-4 mr-1.5 inline" /> Xem Bảng xếp hạng
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
