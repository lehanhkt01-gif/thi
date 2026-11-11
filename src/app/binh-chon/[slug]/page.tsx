"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
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
  ChevronDown,
  ChevronLeft,
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
  ArrowLeft,
  LayoutGrid,
  List,
  Edit,
  Plus,
  Home,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trophy,
  Bell,
  Lock,
  Save,
  QrCode,
  Eye,
  LogOut,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { EA_SUP_VILLAGES } from "@/lib/store";
import LoginModal, { syncAuthSession } from "@/components/LoginModal";

interface MediaContest {
  id: string;
  title: string;
  slug: string;
  bannerUrl: string;
  type: "IMAGE" | "VIDEO";
  startDate: string;
  endDate: string;
  submitStartDate?: string;
  submitEndDate?: string;
  voteStartDate?: string;
  voteEndDate?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  submissionsCount: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  description?: string;
  rulesHtml?: string;
  rulesFileUrl?: string;
  announcement?: string;
  themeColor?: string;
  layoutMode?: "vertical" | "horizontal" | "both";
  layoutModes?: ("vertical" | "horizontal")[];
  maxImagesPerSubmission?: number;
  sortBy?: "createdAt" | "votesCount" | "score";
  enableSocialShare?: boolean;
  sharePlatforms?: ("facebook" | "zalo")[];
  requiredParticipantFields?: string[];
  requireApproval?: boolean;
  maxVotesPerUser?: number;
  contestPassword?: string;
  showLeaderboard?: boolean;
  showVoteCount?: boolean;
  showShareCount?: boolean;
  organizerName: string;
  organizerAddress?: string;
  organizerPhone?: string;
  organizerEmail?: string;
  creatorEmail?: string;
  creatorId?: string;
  creatorName?: string;
  sharedEmails?: string[];
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

const THEME_SWATCHES = [
  "#DC2626", // Đỏ hành chính (Ảnh 2)
  "#264653", // Xanh than đậm (Ảnh 2)
  "#2A9D8F", // Xanh ngọc lục bảo (Ảnh 2 & Ảnh 4)
  "#0284C7", // Xanh dương (Ảnh 2)
  "#F4A261", // Cam vàng (Ảnh 2)
  "#E76F51", // Cam đất (Ảnh 2)
  "#1B7F5C", // Xanh lá đậm chuẩn MyAloha (Ảnh 4)
];

type SettingsSectionKey =
  | "cau-hinh"
  | "yeu-cau-thong-tin"
  | "bao-mat"
  | "cai-dat-bai-du-thi"
  | "bang-xep-hang"
  | "the-le"
  | "thong-bao"
  | "ban-to-chuc";

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
  const [topSearchQuery, setTopSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Auth & Admin Dashboard Controls
  const [authUser, setAuthUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingSubmitAfterLogin, setPendingSubmitAfterLogin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<SettingsSectionKey, boolean>>({
    "cau-hinh": true,
    "yeu-cau-thong-tin": false,
    "bao-mat": false,
    "cai-dat-bai-du-thi": true,
    "bang-xep-hang": false,
    "the-le": false,
    "thong-bao": false,
    "ban-to-chuc": false,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingSubmitImage, setIsUploadingSubmitImage] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const submitFileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Lightbox / Detail Modal for viewing a submission
  const [selectedSubmission, setSelectedSubmission] = useState<MediaSubmission | null>(null);
  const [selectedSubmissionImageIdx, setSelectedSubmissionImageIdx] = useState(0);
  const [viewOrientation, setViewOrientation] = useState<"vertical" | "horizontal">("vertical");
  // Rules / Announcement Modal
  const [infoModalTab, setInfoModalTab] = useState<"rules" | "announcement" | "leaderboard" | null>(null);

  // Countdown timer state (Ảnh 4: 07 : 20 : 19 : 38)
  const [timeLeft, setTimeLeft] = useState({
    days: "07",
    hours: "20",
    minutes: "19",
    seconds: "38",
  });

  // Modal State for Submitting artwork
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    authorName: "",
    authorPhone: "",
    authorCccd: "",
    authorEmail: "",
    unitName: "",
    mediaType: "IMAGE" as "IMAGE" | "VIDEO",
    mediaUrl: "",
    mediaUrls: [] as string[],
    orientation: "vertical" as "vertical" | "horizontal",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareModalTarget, setShareModalTarget] = useState<MediaSubmission | "CONTEST" | null>(null);
  const [copiedShareModalLink, setCopiedShareModalLink] = useState(false);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});
  const [imageOrientations, setImageOrientations] = useState<Record<string, "vertical" | "horizontal">>({});

  // Safe JSON helper chống lỗi Unexpected token '<', "<html>..." is not valid JSON
  const safeParseResponseJson = async (res: Response) => {
    const raw = await res.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {
        _isHtmlError: true,
        error: `Máy chủ phản hồi mã ${res.status}. Đang tự động tối ưu hóa dữ liệu...`,
      };
    }
  };

  // Phát tín hiệu đồng bộ 2 chiều giữa /binh-chon/[slug] và /admin
  const broadcastMediaContestSync = (updatedContest?: any) => {
    try {
      if (typeof window !== "undefined") {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("easup_media_contest_sync");
          bc.postMessage({
            type: "MEDIA_CONTEST_SYNC",
            contest: updatedContest || contest || null,
            timestamp: Date.now(),
          });
          bc.close();
        }
        localStorage.setItem(
          "easup_media_contest_sync_event",
          JSON.stringify({
            contestId: (updatedContest || contest)?.id,
            slug: (updatedContest || contest)?.slug || slug,
            ts: Date.now(),
          })
        );
      }
    } catch {}
  };

  // Nén ảnh JPEG < 250KB tương thích iOS Safari & vượt giới hạn 1MB của Nginx + Tự động nhận diện chiều khung hình (dọc/ngang)
  const compressImageToJpeg = (
    file: File
  ): Promise<{ blob: Blob; dataUrl: string; orientation: "vertical" | "horizontal" }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const naturalOrientation: "vertical" | "horizontal" =
            img.width > img.height ? "horizontal" : "vertical";
          const maxWidth = 1600;
          const maxHeight = 900;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            let quality = 0.82;
            let dataUrl = canvas.toDataURL("image/jpeg", quality);
            while (dataUrl.length > 450000 && quality > 0.45) {
              quality -= 0.12;
              dataUrl = canvas.toDataURL("image/jpeg", quality);
            }
            canvas.toBlob(
              (blob) => {
                resolve({ blob: blob || file, dataUrl, orientation: naturalOrientation });
              },
              "image/jpeg",
              quality
            );
          } else {
            resolve({
              blob: file,
              dataUrl: (readerEvent.target?.result as string) || "",
              orientation: naturalOrientation,
            });
          }
        };
        img.onerror = () => {
          resolve({
            blob: file,
            dataUrl: (readerEvent.target?.result as string) || "",
            orientation: "vertical",
          });
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Kiểm tra đăng nhập & tham số URL (?settings=1)
  useEffect(() => {
    const syncAuth = () => {
      try {
        const saved = localStorage.getItem("cuocthi_admin_auth");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.status === "APPROVED") {
            // Tự động đối soát và bảo vệ phân quyền: Chỉ lehanhkt01@gmail.com hoặc admin@easupso.com mới là Admin hệ thống
            const cleanEm = (parsed.email || "").toLowerCase().trim();
            const isSysAdmin = cleanEm === "lehanhkt01@gmail.com" || cleanEm === "admin@easupso.com";
            if (!isSysAdmin && parsed.role === "ADMIN") {
              fetch(`/api/admin/users?search=${encodeURIComponent(cleanEm)}`)
                .then((r) => r.json())
                .then((data) => {
                  const found = data.users?.find((u: any) => u.email.toLowerCase() === cleanEm);
                  if (found && found.role !== "ADMIN") {
                    parsed.role = "USER";
                    try {
                      localStorage.setItem("cuocthi_admin_auth", JSON.stringify(parsed));
                    } catch {}
                    setAuthUser({ ...parsed });
                  }
                })
                .catch(() => {});
            }

            setAuthUser(parsed);
            setSubmitForm((prev) => ({
              ...prev,
              authorName: prev.authorName || parsed.name || "",
              authorPhone: prev.authorPhone || parsed.phone || "",
              authorEmail: prev.authorEmail || parsed.email || "",
            }));
          } else {
            setAuthUser(null);
          }
        } else {
          setAuthUser(null);
        }
      } catch {
        setAuthUser(null);
      }
    };

    syncAuth();
    try {
      const votedSaved = localStorage.getItem(`easup_media_voted_${slug}`);
      if (votedSaved) {
        setVotedMap(JSON.parse(votedSaved));
      }
    } catch {}

    window.addEventListener("storage", syncAuth);
    window.addEventListener("cuocthi_auth_change", syncAuth);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("settings") === "1" || params.get("edit") === "1") {
        setShowSettingsDrawer(true);
      }
    }

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("cuocthi_auth_change", syncAuth);
    };
  }, [slug]);

  // Chỉ người trực tiếp tạo cuộc thi hoặc Quản trị viên (Admin) mới có quyền cài đặt, sửa, xóa cuộc thi & tác phẩm
  // Người dùng đăng nhập thông thường (USER) tuyệt đối không có quyền quản lý
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

  // Bắt buộc đăng nhập tài khoản trước khi mở hộp thoại nộp tác phẩm dự thi
  const handleOpenSubmitArtwork = () => {
    if (!authUser) {
      setPendingSubmitAfterLogin(true);
      setShowLoginModal(true);
      return;
    }
    if (!showSettingsDrawer) {
      loadData();
    }
    setSubmitForm((prev) => ({
      ...prev,
      authorName: prev.authorName || authUser.name || "",
      authorPhone: prev.authorPhone || authUser.phone || "",
      authorEmail: prev.authorEmail || authUser.email || "",
    }));
    setShowSubmitModal(true);
  };

  // Fetch contest data
  const loadData = async () => {
    try {
      const res = await fetch(`/api/media-contests/${encodeURIComponent(slug)}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await safeParseResponseJson(res);
      if (data.contest) {
        const initModes: ("vertical" | "horizontal")[] =
          Array.isArray(data.contest.layoutModes) && data.contest.layoutModes.length > 0
            ? data.contest.layoutModes
            : data.contest.layoutMode === "both"
              ? ["vertical", "horizontal"]
              : [data.contest.layoutMode || "vertical"];

        const c: MediaContest = {
          themeColor: "#1B7F5C",
          layoutMode: initModes.length >= 2 ? "both" : initModes[0] || "vertical",
          layoutModes: initModes,
          maxImagesPerSubmission: Number(data.contest.maxImagesPerSubmission) > 0 ? Number(data.contest.maxImagesPerSubmission) : 5,
          sortBy: "votesCount",
          enableSocialShare: true,
          sharePlatforms: ["facebook", "zalo"],
          requiredParticipantFields: ["authorName", "unitName", "authorPhone", "description"],
          requireApproval: false,
          maxVotesPerUser: 5,
          showLeaderboard: true,
          showVoteCount: true,
          showShareCount: true,
          submitStartDate: data.contest.submitStartDate || data.contest.startDate?.slice(0, 16) || "2026-11-10T07:00",
          submitEndDate: data.contest.submitEndDate || "2026-11-18T07:00",
          voteStartDate: data.contest.voteStartDate || "2026-11-18T08:00",
          voteEndDate: data.contest.voteEndDate || data.contest.endDate?.slice(0, 16) || "2026-11-24T07:00",
          ...data.contest,
        };
        c.layoutModes = initModes;
        c.layoutMode = initModes.length >= 2 ? "both" : initModes[0] || "vertical";
        setContest(c);
        if (!initModes.includes(viewOrientation)) {
          setViewOrientation(initModes[0] || "vertical");
        }
        const loadedSubs: MediaSubmission[] = data.submissions || [];
        setSubmissions(loadedSubs);
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const artworkId = urlParams.get("artwork");
          if (artworkId) {
            const matchedSub = loadedSubs.find((s) => s.id === artworkId);
            if (matchedSub) {
              setSelectedSubmission(matchedSub);
            }
          }
        }
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

  // Lắng nghe đồng bộ 2 chiều từ /admin sang /binh-chon/[slug]
  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel("easup_media_contest_sync");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "MEDIA_CONTEST_SYNC") {
          loadData();
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "easup_media_contest_sync_event") {
        loadData();
      }
    };

    const onFocus = () => {
      loadData();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [slug]);

  // Real-time countdown calculator
  useEffect(() => {
    const calculateCountdown = () => {
      const targetDateStr = contest?.submitEndDate || contest?.voteEndDate || contest?.endDate;
      if (!targetDateStr) return;

      const target = new Date(targetDateStr).getTime();
      const now = Date.now();
      const difference = target - now;

      if (!isNaN(target) && difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(Math.min(days, 99)).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
        });
      } else {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contest?.submitEndDate, contest?.voteEndDate, contest?.endDate]);

  const themeColor = contest?.themeColor || "#1B7F5C";
  const layoutModes: ("vertical" | "horizontal")[] =
    Array.isArray(contest?.layoutModes) && contest!.layoutModes!.length > 0
      ? contest!.layoutModes!
      : contest?.layoutMode === "both"
        ? ["vertical", "horizontal"]
        : [contest?.layoutMode === "horizontal" ? "horizontal" : "vertical"];
  const layoutMode = layoutModes.includes(viewOrientation)
    ? viewOrientation
    : layoutModes[0] || "vertical";
  const maxImagesPerSubmission = Number(contest?.maxImagesPerSubmission) > 0 ? Number(contest?.maxImagesPerSubmission) : 5;
  const sortBy = contest?.sortBy || "votesCount";

  // Tự động đồng bộ giới hạn hình ảnh trong form nộp bài khi cài đặt số lượng hình tối đa thay đổi
  useEffect(() => {
    setSubmitForm((prev) => {
      if (prev.mediaUrls.length <= maxImagesPerSubmission) return prev;
      const trimmed = prev.mediaUrls.slice(0, maxImagesPerSubmission);
      return {
        ...prev,
        mediaUrls: trimmed,
        mediaUrl: trimmed[0] || "",
      };
    });
  }, [maxImagesPerSubmission]);

  // Tự động lưu nháp & đồng bộ 2 chiều ngay khi quản trị viên thay đổi các thông số cài đặt trong Drawer
  useEffect(() => {
    if (!showSettingsDrawer || !contest || !canManage) return;
    const timer = setTimeout(async () => {
      try {
        if (contest.bannerUrl && contest.bannerUrl.startsWith("data:")) return;
        const normalizedModes: ("vertical" | "horizontal")[] =
          Array.isArray(contest.layoutModes) && contest.layoutModes.length > 0
            ? contest.layoutModes
            : ["vertical"];
        const normalizedLayoutMode: "vertical" | "horizontal" | "both" =
          normalizedModes.length >= 2 ? "both" : normalizedModes[0] || "vertical";

        const syncPayload = {
          ...contest,
          editingId: contest.id || slug,
          action: "update",
          editorRole: authUser?.role,
          editorEmail: authUser?.email,
          editorId: authUser?.id,
          layoutModes: normalizedModes,
          layoutMode: normalizedLayoutMode,
          maxImagesPerSubmission:
            Number(contest.maxImagesPerSubmission) > 0
              ? Number(contest.maxImagesPerSubmission)
              : 5,
        };
        const res = await fetch("/api/media-contests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": authUser?.role || "",
            "x-user-email": authUser?.email || "",
            "x-user-id": authUser?.id || "",
          },
          body: JSON.stringify(syncPayload),
        });
        const data = await safeParseResponseJson(res);
        if (res.ok && data.contest) {
          broadcastMediaContestSync(data.contest);
        }
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [
    showSettingsDrawer,
    canManage,
    contest?.maxImagesPerSubmission,
    contest?.requiredParticipantFields,
    contest?.layoutModes,
    contest?.themeColor,
    contest?.sortBy,
    contest?.enableSocialShare,
    contest?.sharePlatforms,
    contest?.requireApproval,
    contest?.maxVotesPerUser,
    contest?.showLeaderboard,
    contest?.showVoteCount,
    contest?.showShareCount,
  ]);

  const toggleAccordion = (key: SettingsSectionKey) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openSpecificSetting = (key: SettingsSectionKey) => {
    if (!canManage) return;
    setShowSettingsDrawer(true);
    setOpenAccordions((prev) => ({ ...prev, [key]: true }));
  };

  const updateContestField = <K extends keyof MediaContest>(field: K, value: MediaContest[K]) => {
    setContest((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Upload Ảnh bìa trong Cài đặt
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const { blob, dataUrl } = await compressImageToJpeg(file);
      updateContestField("bannerUrl", dataUrl);

      const formData = new FormData();
      formData.append("file", blob, file.name.replace(/\.[^/.]+$/, ".jpg"));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await safeParseResponseJson(res);
      if (res.ok && data.success && data.url) {
        updateContestField("bannerUrl", data.url);
      }
    } catch (err) {
      console.warn("Lỗi tải ảnh bìa:", err);
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = "";
    }
  };

  // Upload nhiều ảnh tác phẩm (tối đa maxImagesPerSubmission hình) khi thí sinh nộp bài & Tự động nhận diện chiều khung hình
  const handleSubmissionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const currentUrls = submitForm.mediaUrls.length > 0
      ? [...submitForm.mediaUrls]
      : submitForm.mediaUrl
        ? [submitForm.mediaUrl]
        : [];

    const remainingSlots = maxImagesPerSubmission - currentUrls.length;
    if (remainingSlots <= 0) {
      alert(`Mỗi bài dự thi chỉ được tải lên tối đa ${maxImagesPerSubmission} hình ảnh!`);
      if (e.target) e.target.value = "";
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    if (fileList.length > remainingSlots) {
      alert(`Chỉ chọn thêm ${remainingSlots} hình để đảm bảo giới hạn tối đa ${maxImagesPerSubmission} hình/bài dự thi.`);
    }

    try {
      setIsUploadingSubmitImage(true);
      const uploadedUrls: string[] = [];
      let detectedOrientation: "vertical" | "horizontal" | null = null;

      for (const file of filesToProcess) {
        const { blob, dataUrl, orientation } = await compressImageToJpeg(file);
        if (!detectedOrientation) {
          detectedOrientation = orientation;
        }
        let finalUrl = dataUrl;
        try {
          const formData = new FormData();
          formData.append("file", blob, file.name.replace(/\.[^/.]+$/, ".jpg"));
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await safeParseResponseJson(res);
          if (res.ok && data.success && data.url) {
            finalUrl = data.url;
          }
        } catch {}
        uploadedUrls.push(finalUrl);
      }

      const nextUrls = [...currentUrls, ...uploadedUrls].slice(0, maxImagesPerSubmission);
      setSubmitForm((prev) => ({
        ...prev,
        mediaUrls: nextUrls,
        mediaUrl: nextUrls[0] || "",
        orientation:
          currentUrls.length === 0 && detectedOrientation
            ? detectedOrientation
            : prev.orientation,
      }));
    } catch (err) {
      console.warn("Lỗi tải ảnh tác phẩm:", err);
    } finally {
      setIsUploadingSubmitImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Lưu toàn bộ cấu hình cuộc thi ảnh lên máy chủ & đồng bộ 2 chiều về /admin
  const handleSaveContestSettings = async () => {
    if (!contest || !canManage) {
      alert("Chỉ người tạo, Quản trị viên (Admin) hoặc người được chia sẻ quyền mới được chỉnh sửa cuộc thi này!");
      return;
    }
    setIsSavingSettings(true);
    try {
      let cleanBanner = contest.bannerUrl;
      if (cleanBanner && cleanBanner.startsWith("data:")) {
        try {
          const upRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: cleanBanner, name: "banner-photo.jpg" }),
          });
          const upData = await safeParseResponseJson(upRes);
          if (upRes.ok && upData.success && upData.url) {
            cleanBanner = upData.url;
          }
        } catch {}
      }

      const normalizedModes: ("vertical" | "horizontal")[] =
        Array.isArray(contest.layoutModes) && contest.layoutModes.length > 0
          ? contest.layoutModes
          : ["vertical"];
      const normalizedLayoutMode: "vertical" | "horizontal" | "both" =
        normalizedModes.length >= 2 ? "both" : normalizedModes[0] || "vertical";

      const payload = {
        ...contest,
        editingId: contest.id || slug,
        action: "update",
        editorRole: authUser?.role,
        editorEmail: authUser?.email,
        editorId: authUser?.id,
        bannerUrl: cleanBanner,
        layoutModes: normalizedModes,
        layoutMode: normalizedLayoutMode,
        maxImagesPerSubmission: Number(contest.maxImagesPerSubmission) > 0 ? Number(contest.maxImagesPerSubmission) : 5,
        startDate: contest.submitStartDate || contest.startDate,
        endDate: contest.voteEndDate || contest.endDate,
        displayStartDate: (contest.submitStartDate || contest.startDate || "").slice(0, 10),
        displayEndDate: (contest.voteEndDate || contest.endDate || "").slice(0, 10),
      };

      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-role": authUser?.role || "",
        "x-user-email": authUser?.email || "",
        "x-user-id": authUser?.id || "",
      };

      // Gửi qua POST /api/media-contests để tránh lỗi Nginx chặn PATCH trả về HTML
      let res = await fetch("/api/media-contests", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
      });
      let data = await safeParseResponseJson(res);

      if (data._isHtmlError) {
        const retryPayload = {
          ...payload,
          bannerUrl:
            payload.bannerUrl && payload.bannerUrl.startsWith("data:")
              ? "/images/contest_stage_banner.jpg"
              : payload.bannerUrl,
        };
        res = await fetch("/api/media-contests", {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify(retryPayload),
        });
        data = await safeParseResponseJson(res);
      }

      if (!res.ok && !data.contest) {
        throw new Error(data.error || "Không thể lưu cài đặt cuộc thi!");
      }
      if (data.contest) {
        setContest((prev) => ({ ...prev, ...data.contest }));
        broadcastMediaContestSync(data.contest);
      } else {
        broadcastMediaContestSync(payload);
      }
      setSaveToast("Đã lưu & đồng bộ cài đặt cuộc thi ảnh thành công!");
      setTimeout(() => setSaveToast(""), 3000);
    } catch (err: any) {
      alert("Lỗi khi lưu cài đặt: " + (err?.message || "Vui lòng thử lại"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Share / Copy link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Tăng biến đếm chia sẻ cho tác phẩm
  const incrementSubmissionShareCount = (subId: string) => {
    // Gọi API lưu số lượt chia sẻ
    fetch(`/api/media-contests/${encodeURIComponent(slug)}/tac-pham/${encodeURIComponent(subId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "share" }),
    }).catch(() => {});

    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, sharesCount: (s.sharesCount || 0) + 1 } : s))
    );
    if (selectedSubmission?.id === subId) {
      setSelectedSubmission((prev) =>
        prev ? { ...prev, sharesCount: (prev.sharesCount || 0) + 1 } : prev
      );
    }
    setShareModalTarget((prev) =>
      prev && prev !== "CONTEST" && prev.id === subId
        ? { ...prev, sharesCount: (prev.sharesCount || 0) + 1 }
        : prev
    );
  };

  // Mở hộp thoại chia sẻ đa nền tảng (tương tự cuộc thi trắc nghiệm trực tuyến)
  const openShareModal = (target: MediaSubmission | "CONTEST") => {
    setCopiedShareModalLink(false);
    setShareModalTarget(target);
  };

  // Chia sẻ toàn bộ cuộc thi (Ưu tiên Native Share hệ thống điện thoại như Ảnh 2)
  const handleShareContest = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/binh-chon/${slug}`
        : `https://thi.easupso.com/binh-chon/${slug}`;
    const shareTitle = contest?.title || "Cuộc thi Ảnh đẹp trực tuyến xã Ea Súp";
    const shareText = `Tham gia và bình chọn tại Cuộc thi: ${shareTitle}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      navigator
        .share({
          title: shareTitle,
          text: shareText,
          url: baseUrl,
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            openShareModal("CONTEST");
          }
        });
    } else {
      openShareModal("CONTEST");
    }
  };

  // Chia sẻ tác phẩm hoặc cuộc thi đa nền tảng (Zalo, Facebook, Telegram, Email, Sao chép link, Web Share)
  const handleShareSubmission = (
    sub: MediaSubmission,
    platform?: "facebook" | "zalo" | "telegram" | "email" | "native" | "copy"
  ) => {
    if (!platform) {
      openShareModal(sub);
      return;
    }
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/binh-chon/${slug}`
        : `https://thi.easupso.com/binh-chon/${slug}`;
    const shareUrl = `${baseUrl}/tac-pham/${encodeURIComponent(sub.id)}`;
    const shareTitle = `${sub.title} - Tác giả: ${sub.authorName} (${sub.unitName}) | ${contest?.title || "Cuộc thi Ảnh đẹp Ea Súp"}`;

    incrementSubmissionShareCount(sub.id);

    if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`,
        "_blank",
        "width=640,height=480"
      );
    } else if (platform === "zalo") {
      window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
        "_blank",
        "width=640,height=480"
      );
    } else if (platform === "email") {
      window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`Mời bạn xem và bình chọn cho tác phẩm "${sub.title}" của tác giả ${sub.authorName} (${sub.unitName}) tại đường dẫn:\n${shareUrl}`)}`;
    } else if (platform === "native") {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        navigator
          .share({
            title: shareTitle,
            text: `Bình chọn cho tác phẩm "${sub.title}" - ${sub.authorName} (${sub.unitName})`,
            url: shareUrl,
          })
          .catch((err) => {
            if (err?.name !== "AbortError") {
              openShareModal(sub);
            }
          });
      } else {
        openShareModal(sub);
      }
    } else {
      navigator.clipboard?.writeText(shareUrl);
      setCopiedShareModalLink(true);
      setTimeout(() => setCopiedShareModalLink(false), 2500);
      setSaveToast(`Đã sao chép liên kết chia sẻ tác phẩm "${sub.title}"!`);
      setTimeout(() => setSaveToast(""), 2500);
    }
  };

  // Handle Voting
  const handleVote = async (submissionId: string) => {
    if (votedMap[submissionId]) return;

    try {
      const res = await fetch(`/api/media-contests/${encodeURIComponent(slug)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (data.success) {
        const nextVoted = { ...votedMap, [submissionId]: true };
        setVotedMap(nextVoted);
        try {
          localStorage.setItem(`easup_media_voted_${slug}`, JSON.stringify(nextVoted));
        } catch {}

        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, votesCount: data.votesCount } : s))
        );
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission((prev) => (prev ? { ...prev, votesCount: data.votesCount } : prev));
        }
        broadcastMediaContestSync();

        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.7 },
          colors: [themeColor, "#DC2626", "#F59E0B", "#0284C7"],
        });
      }
    } catch (err) {
      console.error("Lỗi bình chọn:", err);
    }
  };

  const [isDeletingSubId, setIsDeletingSubId] = useState<string | null>(null);

  // Xóa tác phẩm dự thi (CHỈ dành riêng cho Người tạo cuộc thi hoặc Quản trị viên)
  const handleDeleteSubmission = async (sub: MediaSubmission) => {
    if (!authUser || !canManage) {
      alert("Chỉ người tạo cuộc thi hoặc Quản trị viên (Admin) mới có quyền xóa tác phẩm!");
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn xóa tác phẩm dự thi:\n"${sub.title}"\nTác giả: ${sub.authorName} (${sub.unitName})\n\nLưu ý: Tác phẩm và toàn bộ lượt bình chọn liên quan sẽ bị xóa hoàn toàn khỏi hệ thống!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsDeletingSubId(sub.id);
      const res = await fetch(
        `/api/media-contests/${encodeURIComponent(slug)}/tac-pham/${encodeURIComponent(sub.id)}`,
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
        setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
        if (selectedSubmission?.id === sub.id) {
          setSelectedSubmission(null);
        }
        broadcastMediaContestSync();
        alert("Đã xóa tác phẩm dự thi thành công!");
      } else {
        alert(data.error || "Không thể xóa tác phẩm này!");
      }
    } catch (err: any) {
      alert("Lỗi khi xóa tác phẩm: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setIsDeletingSubId(null);
    }
  };

  // Handle Artwork Submission
  const handleSubmitArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      setShowSubmitModal(false);
      setPendingSubmitAfterLogin(true);
      setShowLoginModal(true);
      return;
    }
    if (
      !submitForm.title.trim() ||
      !submitForm.authorName.trim() ||
      (reqFields.includes("unitName") && !submitForm.unitName.trim())
    ) {
      alert("Vui lòng điền đầy đủ tên tác phẩm, tác giả và đơn vị!");
      return;
    }

    setIsSubmitting(true);
    try {
      const candidateUrls =
        submitForm.mediaUrls.length > 0
          ? submitForm.mediaUrls
          : submitForm.mediaUrl
            ? [submitForm.mediaUrl]
            : [];

      const uploadedUrls: string[] = [];
      for (const itemUrl of candidateUrls.slice(0, maxImagesPerSubmission)) {
        if (itemUrl && itemUrl.startsWith("data:")) {
          try {
            const upRes = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64: itemUrl, name: "tac-pham.jpg" }),
            });
            const upData = await safeParseResponseJson(upRes);
            if (upRes.ok && upData.success && upData.url) {
              uploadedUrls.push(upData.url);
            } else {
              uploadedUrls.push(itemUrl);
            }
          } catch {
            uploadedUrls.push(itemUrl);
          }
        } else if (itemUrl) {
          uploadedUrls.push(itemUrl);
        }
      }

      const finalMediaUrls =
        uploadedUrls.length > 0
          ? uploadedUrls
          : ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"];

      const res = await fetch(`/api/media-contests/${encodeURIComponent(slug)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
        body: JSON.stringify({
          ...submitForm,
          submitterEmail: authUser?.email || "",
          submitterId: authUser?.id || "",
          mediaType: contest?.type || submitForm.mediaType,
          mediaUrl: finalMediaUrls[0],
          mediaUrls: finalMediaUrls,
          orientation: submitForm.orientation,
        }),
      });
      const data = await safeParseResponseJson(res);
      if (data.success) {
        setSubmitSuccess(true);
        await loadData();
        broadcastMediaContestSync();
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitSuccess(false);
          setSubmitForm({
            title: "",
            authorName: "",
            authorPhone: "",
            authorCccd: "",
            authorEmail: "",
            unitName: "",
            mediaType: contest?.type || "IMAGE",
            mediaUrl: "",
            mediaUrls: [],
            orientation: "vertical",
            description: "",
          });
        }, 1400);

        confetti({
          particleCount: 70,
          spread: 75,
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

  // Filtered & Sorted submissions (theo cài đặt Cài đặt bài dự thi - Ảnh 3)
  const effectiveQuery = (searchQuery || topSearchQuery).toLowerCase().trim();
  const filteredSubmissions = submissions
    .filter((s) => {
      if (!effectiveQuery) return true;
      return (
        s.title.toLowerCase().includes(effectiveQuery) ||
        s.authorName.toLowerCase().includes(effectiveQuery) ||
        s.unitName.toLowerCase().includes(effectiveQuery)
      );
    })
    .sort((a, b) => {
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "score") {
        return (b.score || b.votesCount || 0) - (a.score || a.votesCount || 0);
      }
      return (b.votesCount || 0) - (a.votesCount || 0);
    });

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE));
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const reqFields = contest?.requiredParticipantFields || [
    "authorName",
    "unitName",
    "authorPhone",
    "description",
  ];

  const toggleRequiredField = (fieldKey: string) => {
    if (fieldKey === "authorName") return; // Họ tên tác giả luôn bắt buộc
    const current = contest?.requiredParticipantFields || [
      "authorName",
      "unitName",
      "authorPhone",
      "description",
    ];
    if (current.includes(fieldKey)) {
      updateContestField(
        "requiredParticipantFields",
        current.filter((k) => k !== fieldKey)
      );
    } else {
      updateContestField("requiredParticipantFields", [...current, fieldKey]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex relative overflow-x-clip">
      {/* Toast thông báo lưu cài đặt */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG DASHBOARD MÔ PHỎNG MYALOHA (ẢNH 4) */}
      {/* ========================================================================= */}
      {authUser && (
        <aside
          className={`hidden lg:flex flex-col justify-between bg-white border-r border-slate-200 shrink-0 transition-all duration-200 z-30 ${
            sidebarCollapsed ? "w-14" : "w-52"
          }`}
        >
          <div className="p-3 space-y-4">
            {/* Logo & Nút thu gọn Sidebar */}
            <div className="flex items-center justify-between px-1">
              {!sidebarCollapsed && (
                <Link href="/" className="flex items-center space-x-1.5 font-black text-base tracking-tight text-slate-900">
                  <span>EaSúp</span>
                  <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] flex items-center justify-center font-bold">
                    Số
                  </span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Menu điều hướng */}
            <nav className="space-y-1.5 text-xs">
              <Link
                href="/"
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-colors"
              >
                <Home className="w-4 h-4 text-[#DC2626] shrink-0" />
                {!sidebarCollapsed && <span>Trang chủ</span>}
              </Link>

              <Link
                href="/admin?tab=anh-video"
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-red-50 text-[#DC2626] font-bold transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-[#DC2626] shrink-0" />
                {!sidebarCollapsed && <span>Cuộc thi Ảnh/Video</span>}
              </Link>

              {!sidebarCollapsed && (
                <Link
                  href="/admin?tab=anh-video&create=1"
                  className="mt-2 w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-dashed border-red-400 text-[#DC2626] hover:bg-red-50/60 font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo mới</span>
                </Link>
              )}
            </nav>

            {/* Thẻ hỗ trợ đỏ giống hệt Ảnh 4 */}
            {!sidebarCollapsed && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white space-y-2 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-xs font-bold leading-snug">Chào mừng khách hàng</div>
                <p className="text-[10px] text-red-100 leading-relaxed">
                  Hãy liên hệ ngay với Ban Tổ Chức khi cần hỗ trợ kỹ thuật
                </p>
                <a
                  href={`tel:${contest?.organizerPhone || "0888023023"}`}
                  className="block text-center py-1.5 px-2 rounded-lg bg-white text-[#DC2626] font-extrabold text-[11px] shadow-2xs hover:bg-red-50 transition-colors"
                >
                  {contest?.organizerPhone || "0888.023.023"}
                </a>
              </div>
            )}
          </div>

          {/* Chứng nhận an toàn thông tin phía dưới (Ảnh 4) */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-100 space-y-2 text-[10px] text-slate-500">
              <div className="font-bold text-slate-700">An toàn thông tin</div>
              <div className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="leading-tight font-medium text-slate-600">
                  ISO/IEC 27001 • Cổng số Ea Súp
                </span>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ========================================================================= */}
      {/* VÙNG CHÍNH GIỮA: GIAO DIỆN CUỘC THI ẢNH (ẢNH 4) */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Thanh công cụ phía trên: Thiết kế tinh gọn, trên Mobile chỉ hiển thị biểu tượng (icon-only) để không bao giờ bị tràn/che khuất */}
        <div className="w-full px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs shrink-0">
            <Link
              href={authUser ? "/admin?tab=anh-video" : "/"}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#DC2626] font-semibold shadow-2xs transition-colors shrink-0"
              title={authUser ? "Quản lý Thi Ảnh" : "Cổng Cuộc Thi Ea Súp"}
            >
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden md:inline">{authUser ? "Quản lý Thi Ảnh" : "Cổng Cuộc Thi Ea Súp"}</span>
            </Link>

            <button
              type="button"
              onClick={() => setInfoModalTab("rules")}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Thể lệ cuộc thi"
            >
              <FileText className="w-4 h-4 text-slate-500 sm:mr-1" />
              <span className="hidden md:inline">Thể lệ</span>
            </button>

            {contest?.showLeaderboard !== false && (
              <button
                type="button"
                onClick={() => setInfoModalTab("leaderboard")}
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                title="Bảng xếp hạng"
              >
                <Trophy className="w-4 h-4 text-amber-500 sm:mr-1" />
                <span className="hidden md:inline">Bảng xếp hạng</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareContest}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-[#0284C7] hover:border-sky-300 font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Chia sẻ cuộc thi (Mở menu chia sẻ điện thoại: Zalo, Facebook, Tin nhắn...)"
            >
              <Share2 className="w-4 h-4 text-[#0284C7] sm:mr-1" />
              <span className="hidden md:inline">Chia sẻ</span>
            </button>
          </div>

          {/* Cụm nút bên phải: [ Đăng nhập / Tài khoản ] + [ Cài đặt cuộc thi ] + [ Ô tìm kiếm ] */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {authUser ? (
              <div
                className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs shadow-2xs shrink-0"
                title={`Đã đăng nhập: ${authUser.name || authUser.email}`}
              >
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-700 max-w-[100px] truncate hidden md:inline">
                  {authUser.name || authUser.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    syncAuthSession(null);
                    setAuthUser(null);
                    setShowSettingsDrawer(false);
                  }}
                  className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingSubmitAfterLogin(false);
                  setShowLoginModal(true);
                }}
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                title="Đăng nhập"
              >
                <User className="w-4 h-4 text-[#DC2626] sm:mr-1" />
                <span className="hidden md:inline">Đăng nhập</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className="inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-1.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
                title={showSettingsDrawer ? "Đóng cài đặt" : "Cài đặt cuộc thi"}
              >
                <SlidersHorizontal className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden md:inline">{showSettingsDrawer ? "Đóng cài đặt" : "Cài đặt cuộc thi"}</span>
              </button>
            )}

            <div className="relative hidden lg:block shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={topSearchQuery}
                onChange={(e) => {
                  setTopSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm..."
                className="pl-8 pr-3 py-1 text-xs rounded-full border border-slate-200 bg-white focus:outline-none focus:border-slate-400 w-32 xl:w-44"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. ẢNH BÌA BANNER ĐƠN LỚP GỌN NHẸ (BỎ LỚP NỀN & HÌNH MẶC ĐỊNH BÊN DƯỚI) */}
        {/* ========================================================================= */}
        <section className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 pt-1 pb-2">
          {isLoading && !contest ? (
            <div className="w-full h-48 sm:h-72 md:h-80 rounded-xl sm:rounded-2xl bg-slate-100 animate-pulse" />
          ) : contest?.bannerUrl ? (
            <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-slate-200/80 flex items-center justify-center group">
              <img
                src={contest.bannerUrl}
                alt={contest.title || "Ảnh bìa cuộc thi"}
                decoding="async"
                fetchPriority="high"
                className="w-full h-auto block object-contain object-center"
              />
              {canManage && (
                <button
                  type="button"
                  onClick={() => openSpecificSetting("cau-hinh")}
                  className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/85 text-white text-xs font-bold backdrop-blur-xs flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Thay ảnh bìa</span>
                </button>
              )}
            </div>
          ) : null}
        </section>

        {/* ========================================================================= */}
        {/* 2. TIÊU ĐỀ CUỘC THI & ĐỒNG HỒ FLIP CLOCK 8 Ô SỐ (ẢNH 4) */}
        {/* ========================================================================= */}
        <div className="max-w-5xl lg:max-w-6xl w-full mx-auto px-4 pt-6 pb-4 text-center space-y-5">
          {/* Tên cuộc thi với icon cây bút chỉnh sửa giống Ảnh 4 */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight leading-snug"
              style={{ color: themeColor }}
            >
              &quot;{contest?.title || "NÉT ĐẸP VĂN HÓA CÁC DÂN TỘC - EA SÚP NĂM 2026"}&quot;
            </h1>
            {canManage && (
              <button
                type="button"
                onClick={() => openSpecificSetting("cau-hinh")}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Đổi tên cuộc thi"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleShareContest}
              className="p-1.5 rounded-full text-slate-400 hover:text-[#0284C7] hover:bg-sky-50 transition-colors cursor-pointer"
              title="Chia sẻ cuộc thi (Mở menu chia sẻ điện thoại: Zalo, Facebook, Tin nhắn...)"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Dòng chữ: THỜI GIAN NỘP BÀI KẾT THÚC SAU */}
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
            THỜI GIAN NỘP BÀI KẾT THÚC SAU
          </div>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC FLIP-CLOCK 8 LÁ SỐ TÁCH ĐÔI CHUẨN ẢNH 4 */}
          <div className="inline-block bg-[#6C757D] text-white px-4 sm:px-6 pt-3 pb-4 rounded-xl shadow-lg relative mx-auto">
            {canManage && (
              <button
                type="button"
                onClick={() => openSpecificSetting("cau-hinh")}
                className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Cài đặt thời gian nộp tác phẩm & bình chọn"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
              {[
                { label: "NGÀY", val: timeLeft.days },
                { label: "GIỜ", val: timeLeft.hours },
                { label: "PHÚT", val: timeLeft.minutes },
                { label: "GIÂY", val: timeLeft.seconds },
              ].map((unit, idx) => {
                const d1 = unit.val[0] || "0";
                const d2 = unit.val[1] || "0";
                return (
                  <React.Fragment key={unit.label}>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-100 mb-1.5">
                        {unit.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {[d1, d2].map((digit, dIdx) => (
                          <div
                            key={dIdx}
                            className="relative w-7 sm:w-10 h-11 sm:h-14 bg-white text-slate-900 rounded-md shadow-inner flex items-center justify-center font-extrabold text-xl sm:text-3xl font-mono overflow-hidden"
                          >
                            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-300/80" />
                            <span className="relative z-10">{digit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {idx < 3 && (
                      <div className="text-xl sm:text-2xl font-black text-white pt-5 select-none">:</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* NÚT NỘP TÁC PHẨM >> KÈM ICON BÁNH RĂNG (ẢNH 4) - YÊU CẦU ĐĂNG NHẬP TRƯỚC KHI NỘP */}
          <div className="pt-2 flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={handleOpenSubmitArtwork}
              style={{ backgroundColor: themeColor }}
              className="inline-flex items-center px-7 py-2.5 rounded-full text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              NỘP TÁC PHẨM &gt;&gt;
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => openSpecificSetting("yeu-cau-thong-tin")}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Cài đặt thông tin người tham gia nộp tác phẩm"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DANH SÁCH TÁC PHẨM & BỘ LỌC TÌM KIẾM (ẢNH 4) */}
        {/* ========================================================================= */}
        <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6 flex-1">
          {/* Header: DANH SÁCH TÁC PHẨM (Trái) & Ô Tìm kiếm tác phẩm (Phải) - Căn chỉnh khoa học, không chồng lấn */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3.5 border-b border-slate-200">
            <div>
              <div
                className="w-14 h-1 rounded-full mb-2"
                style={{ backgroundColor: themeColor }}
              />
              <div className="flex items-center flex-wrap gap-2.5">
                <h2 className="text-sm sm:text-base font-extrabold uppercase text-slate-800 tracking-wide whitespace-nowrap">
                  DANH SÁCH TÁC PHẨM
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setViewOrientation((prev) =>
                      prev === "vertical" ? "horizontal" : "vertical"
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                  title={layoutMode === "vertical" ? "Đang xem: Bố cục dọc" : "Đang xem: Bố cục ngang"}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                {layoutModes.length >= 2 && (
                  <div className="inline-flex items-center rounded-full bg-slate-200/80 p-1 text-xs font-bold gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewOrientation("vertical")}
                      style={
                        layoutMode === "vertical"
                          ? { backgroundColor: themeColor, color: "#fff" }
                          : {}
                      }
                      className="px-3.5 py-1 rounded-full text-slate-700 transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      Dọc
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewOrientation("horizontal")}
                      style={
                        layoutMode === "horizontal"
                          ? { backgroundColor: themeColor, color: "#fff" }
                          : {}
                      }
                      className="px-3.5 py-1 rounded-full text-slate-700 transition-all whitespace-nowrap cursor-pointer"
                    >
                      Ngang
                    </button>
                  </div>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openSpecificSetting("cai-dat-bai-du-thi")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="Cài đặt bố cục & sắp xếp bài dự thi"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ô tìm kiếm tác phẩm + Nút Tìm kiếm bo tròn theo màu chủ đề (Ảnh 4) */}
            <div className="flex items-center gap-2 max-w-sm w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm tác phẩm, tác giả, đơn vị..."
                className="flex-1 px-4 py-2 text-xs rounded-full border border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              />
              <button
                type="button"
                style={{ backgroundColor: themeColor }}
                className="px-4 py-2 text-white text-xs font-bold rounded-full shadow-2xs hover:opacity-95 transition-opacity shrink-0 whitespace-nowrap cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Danh sách bài dự thi (Thiết kế khoa học, cân đối, tuyệt đối không chồng lấn chữ & nút như Ảnh 1) */}
          {paginatedSubmissions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs space-y-3">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  Chưa có tác phẩm nào phù hợp trong danh sách bình chọn!
                </p>
                <button
                  type="button"
                  onClick={handleOpenSubmitArtwork}
                  style={{ color: themeColor, borderColor: themeColor }}
                  className="px-4 py-1.5 rounded-full border text-xs font-bold hover:opacity-80 transition-opacity cursor-pointer"
                >
                  + Gửi tác phẩm dự thi đầu tiên
                </button>
              </div>
            </div>
          ) : (
            <div
              className={
                layoutMode === "vertical"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-stretch"
                  : "grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
              }
            >
              {paginatedSubmissions.map((sub) => {
                const hasVoted = votedMap[sub.id];
                // Phân quyền: CHỈ Người tạo ra cuộc thi / Admin mới được hiện nút xóa tác phẩm
                // Tất cả người dùng khác đều không được xóa sản phẩm
                const canDeleteThisSub = Boolean(canManage);
                const subImages =
                  Array.isArray(sub.mediaUrls) && sub.mediaUrls.length > 0
                    ? sub.mediaUrls
                    : [sub.mediaUrl];
                // Tự động nhận diện tỷ lệ hình ảnh nhưng cấu trúc thẻ tuân theo chế độ lưới (Dọc / Ngang) để không bao giờ bị ép hẹp chữ
                const autoImageOrientation = imageOrientations[sub.id] || sub.orientation || "vertical";
                const isHorizontalCardLayout = layoutMode === "horizontal";

                return (
                  <div
                    key={sub.id}
                    style={{ borderColor: themeColor }}
                    className={`bg-white rounded-2xl border-2 p-3 shadow-xs hover:shadow-md transition-all flex justify-between relative ${
                      isHorizontalCardLayout
                        ? "flex-col sm:flex-row gap-4 items-stretch"
                        : "flex-col gap-3"
                    }`}
                  >
                    {/* Khung Ảnh / Video tác phẩm */}
                    <div className="relative">
                      <Link
                        href={`/binh-chon/${slug}/tac-pham/${sub.id}`}
                        className={`relative rounded-xl overflow-hidden bg-slate-900/5 cursor-pointer group block ${
                          isHorizontalCardLayout
                            ? "w-full sm:w-52 md:w-60 aspect-[4/3] shrink-0"
                            : autoImageOrientation === "horizontal"
                              ? "w-full aspect-[4/3]"
                              : "w-full aspect-[3/4]"
                        }`}
                      >
                        <img
                          src={subImages[0] || sub.mediaUrl}
                          alt={sub.title}
                          onLoad={(e) => {
                            const imgEl = e.currentTarget;
                            if (imgEl.naturalWidth && imgEl.naturalHeight) {
                              const naturalOrient: "vertical" | "horizontal" =
                                imgEl.naturalWidth > imgEl.naturalHeight
                                  ? "horizontal"
                                  : "vertical";
                              if (imageOrientations[sub.id] !== naturalOrient) {
                                setImageOrientations((prev) => ({
                                  ...prev,
                                  [sub.id]: naturalOrient,
                                }));
                              }
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {subImages.length > 1 && (
                          <span className="absolute top-2.5 right-2.5 bg-black/75 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            📷 {subImages.length} hình
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-black/75 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 transition-opacity shadow-sm">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem chi tiết &amp; Bình chọn</span>
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Phần tên tác phẩm, tác giả, nút Bình chọn và hàng thống kê ☆ bình chọn / 🔗 chia sẻ cân đối, rõ ràng */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between text-center px-1 py-0.5">
                      <div className="space-y-1">
                        <Link
                          href={`/binh-chon/${slug}/tac-pham/${sub.id}`}
                          title={sub.title}
                          className="font-extrabold text-sm sm:text-[15px] text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:underline block"
                        >
                          {sub.title}
                        </Link>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {sub.authorName} • {sub.unitName}
                        </p>
                      </div>

                      <div className="mt-3 pt-1 space-y-2.5">
                        <button
                          type="button"
                          onClick={() => handleVote(sub.id)}
                          disabled={hasVoted}
                          style={{
                            backgroundColor: hasVoted ? "#E2E8F0" : themeColor,
                            color: hasVoted ? "#334155" : "#FFFFFF",
                          }}
                          className="w-full max-w-[165px] mx-auto py-2 px-5 rounded-full text-xs font-bold whitespace-nowrap shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                        >
                          {hasVoted ? "✓ Đã bình chọn" : "Bình chọn"}
                        </button>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-600 px-0.5">
                          <span className="inline-flex items-center space-x-1 whitespace-nowrap font-medium text-blue-600" title="Lượt xem tác phẩm">
                            <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{sub.viewsCount || 0} xem</span>
                          </span>

                          {contest?.showVoteCount !== false ? (
                            <span className="inline-flex items-center space-x-1 whitespace-nowrap font-medium text-slate-600">
                              <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{sub.votesCount || 0} bình chọn</span>
                            </span>
                          ) : (
                            <span />
                          )}

                          {contest?.enableSocialShare !== false && contest?.showShareCount !== false && (
                            <button
                              type="button"
                              onClick={() => handleShareSubmission(sub, "native")}
                              className="inline-flex items-center space-x-1 whitespace-nowrap font-semibold text-slate-600 hover:text-[#0284C7] hover:bg-sky-50 px-1 sm:px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                              title="Chia sẻ tác phẩm (Mở menu chia sẻ điện thoại: Zalo, Facebook, Tin nhắn...)"
                            >
                              <Share2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                              <span>{sub.sharesCount || 0} chia sẻ</span>
                            </button>
                          )}
                        </div>

                        {canDeleteThisSub && (
                          <div className="pt-2 border-t border-red-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-500 font-medium">
                              Quyền Người tạo cuộc thi
                            </span>
                            <button
                              type="button"
                              disabled={isDeletingSubId === sub.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteSubmission(sub);
                              }}
                              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              title="Xóa tác phẩm này (Chỉ dành cho Người tạo cuộc thi)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isDeletingSubId === sub.id ? "Đang xóa..." : "Xóa tác phẩm"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Phân trang dưới cùng giống Ảnh 4: [ <-- ] [ 1 ] [ --> ] */}
          <div className="pt-6 flex items-center justify-center space-x-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-500 text-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              &lt;--
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                style={
                  currentPage === pageNum
                    ? { backgroundColor: themeColor, color: "#FFFFFF", borderColor: themeColor }
                    : {}
                }
                className="w-7 h-7 rounded border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-500 text-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              --&gt;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI: DRAWER CÀI ĐẶT CUỘC THI ẢNH 8 MỤC ACCORDION (ẢNH 2 & ẢNH 3) */}
      {/* ========================================================================= */}
      {showSettingsDrawer && canManage && contest && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[370px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header Drawer */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-[#DC2626]" />
              <span className="font-bold text-sm text-slate-900">Cài đặt cuộc thi ảnh</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(false)}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nội dung cuộn 8 mục Accordion (Ảnh 2 & Ảnh 3) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
            {/* ----------------------------------------------------------------- */}
            {/* MỤC 1: CẤU HÌNH (ẢNH 2) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("cau-hinh")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Cấu hình</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["cau-hinh"] ? "rotate-180" : "-rotate-90"
                  }`}
                />
              </button>

              {openAccordions["cau-hinh"] && (
                <div className="mt-3 space-y-3">
                  {/* Khối Ảnh bìa + Radio Bình chọn ảnh / Bình chọn video */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-800">Ảnh bìa</div>
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer group flex items-center justify-center"
                    >
                      <img
                        src={contest.bannerUrl || "/images/contest_stage_banner.jpg"}
                        alt="Ảnh bìa"
                        className="w-full h-auto max-h-44 object-contain block"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs shadow">
                          {isUploadingBanner ? "Đang tải ảnh..." : "Bấm để đổi ảnh bìa"}
                        </span>
                      </div>
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="hidden"
                    />

                    {/* Radio: Bình chọn ảnh | Bình chọn video */}
                    <div className="flex items-center space-x-6 pt-1">
                      <label className="inline-flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mediaTypeRadio"
                          checked={contest.type === "IMAGE"}
                          onChange={() => updateContestField("type", "IMAGE")}
                          className="w-4 h-4 accent-[#DC2626]"
                        />
                        <span className="font-medium text-slate-800">Bình chọn ảnh</span>
                      </label>

                      <label className="inline-flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mediaTypeRadio"
                          checked={contest.type === "VIDEO"}
                          onChange={() => updateContestField("type", "VIDEO")}
                          className="w-4 h-4 accent-[#DC2626]"
                        />
                        <span className="font-medium text-slate-800">Bình chọn video</span>
                      </label>
                    </div>
                  </div>

                  {/* Tên cuộc thi */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-1.5">
                    <label className="block font-bold text-slate-800">Tên cuộc thi</label>
                    <input
                      type="text"
                      value={contest.title}
                      onChange={(e) => updateContestField("title", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Thời gian nộp tác phẩm */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-1.5">
                    <label className="block font-bold text-slate-800">Thời gian nộp tác phẩm</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={(contest.submitStartDate || "2026-11-10T07:00").slice(0, 16)}
                        onChange={(e) => updateContestField("submitStartDate", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 focus:outline-none focus:border-red-500"
                      />
                      <span className="text-slate-400">→</span>
                      <input
                        type="datetime-local"
                        value={(contest.submitEndDate || "2026-11-18T07:00").slice(0, 16)}
                        onChange={(e) => updateContestField("submitEndDate", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Thời gian bình chọn */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-1.5">
                    <label className="block font-bold text-slate-800">Thời gian bình chọn</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={(contest.voteStartDate || "2026-11-18T08:00").slice(0, 16)}
                        onChange={(e) => updateContestField("voteStartDate", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 focus:outline-none focus:border-red-500"
                      />
                      <span className="text-slate-400">→</span>
                      <input
                        type="datetime-local"
                        value={(contest.voteEndDate || "2026-11-24T07:00").slice(0, 16)}
                        onChange={(e) => updateContestField("voteEndDate", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Màu chủ đề (Ảnh 2) */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-800">Màu chủ đề</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {THEME_SWATCHES.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateContestField("themeColor", color)}
                          style={{ backgroundColor: color }}
                          className={`w-8 h-8 rounded-lg transition-transform cursor-pointer ${
                            themeColor.toLowerCase() === color.toLowerCase()
                              ? "ring-2 ring-offset-2 ring-slate-900 scale-105"
                              : "hover:scale-105"
                          }`}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => colorPickerRef.current?.click()}
                        style={{ backgroundColor: themeColor }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs cursor-pointer"
                        title="Tùy chỉnh màu chủ đề"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      <input
                        ref={colorPickerRef}
                        type="color"
                        value={themeColor}
                        onChange={(e) => updateContestField("themeColor", e.target.value)}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 2: YÊU CẦU NGƯỜI THAM GIA NHẬP THÔNG TIN (ẢNH 3) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("yeu-cau-thong-tin")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Yêu cầu người tham gia nhập thông tin</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["yeu-cau-thong-tin"] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {openAccordions["yeu-cau-thong-tin"] && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
                  {[
                    { key: "authorName", label: "Họ và tên tác giả (Bắt buộc)", locked: true },
                    { key: "unitName", label: "Đơn vị / Thôn buôn dự thi" },
                    { key: "authorPhone", label: "Số điện thoại liên hệ" },
                    { key: "authorCccd", label: "Số CCCD / Mã định danh" },
                    { key: "authorEmail", label: "Địa chỉ Email" },
                    { key: "description", label: "Lời bình / Thuyết minh tác phẩm" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center space-x-2.5 py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={reqFields.includes(item.key)}
                        disabled={item.locked}
                        onChange={() => toggleRequiredField(item.key)}
                        className="w-4 h-4 rounded accent-[#DC2626]"
                      />
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 3: BẢO MẬT (ẢNH 3) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("bao-mat")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Bảo mật</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["bao-mat"] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {openAccordions["bao-mat"] && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-slate-700">Duyệt tác phẩm trước khi hiển thị</span>
                    <input
                      type="checkbox"
                      checked={Boolean(contest.requireApproval)}
                      onChange={(e) => updateContestField("requireApproval", e.target.checked)}
                      className="w-4 h-4 accent-[#DC2626]"
                    />
                  </label>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số lượt bình chọn tối đa / người
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={contest.maxVotesPerUser || 5}
                      onChange={(e) => updateContestField("maxVotesPerUser", Number(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mật khẩu cuộc thi (để trống nếu công khai)
                    </label>
                    <input
                      type="text"
                      value={contest.contestPassword || ""}
                      onChange={(e) => updateContestField("contestPassword", e.target.value)}
                      placeholder="Không đặt mật khẩu"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 4: CÀI ĐẶT BÀI DỰ THI (ẢNH 3 - MỞ RỘNG) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("cai-dat-bai-du-thi")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Cài đặt bài dự thi</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["cai-dat-bai-du-thi"] ? "rotate-180" : "-rotate-90"
                  }`}
                />
              </button>

              {openAccordions["cai-dat-bai-du-thi"] && (
                <div className="mt-3 space-y-3">
                  {/* Bố cục: Cho phép chọn cả chiều dọc VÀ chiều ngang (Ảnh 2 & 3) */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Bố cục</span>
                      <span className="text-[10px] text-slate-400">
                        Có thể chọn 1 hoặc cả 2 chiều
                      </span>
                    </div>
                    <div className="flex items-center space-x-6">
                      {([
                        { id: "vertical", label: "Bố cục dọc" },
                        { id: "horizontal", label: "Bố cục ngang" },
                      ] as const).map((item) => {
                        const isChecked = layoutModes.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            onClick={() => {
                              let nextModes: ("vertical" | "horizontal")[];
                              if (isChecked) {
                                if (layoutModes.length > 1) {
                                  nextModes = layoutModes.filter((m) => m !== item.id);
                                } else {
                                  nextModes = [item.id === "vertical" ? "horizontal" : "vertical"];
                                }
                              } else {
                                nextModes = [...layoutModes, item.id];
                              }
                              const nextLayoutMode =
                                nextModes.length >= 2 ? "both" : nextModes[0] || "vertical";
                              setContest((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      layoutModes: nextModes,
                                      layoutMode: nextLayoutMode,
                                    }
                                  : prev
                              );
                              if (!nextModes.includes(viewOrientation)) {
                                setViewOrientation(nextModes[0] || "vertical");
                              }
                            }}
                            className="inline-flex items-center space-x-2 cursor-pointer select-none"
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isChecked
                                  ? "border-[#EF4444] bg-[#EF4444]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isChecked && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                            <span className="font-medium text-slate-800">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Số lượng hình tối đa dự thi */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Số lượng hình tối đa dự thi</span>
                      <span className="text-[11px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-md">
                        Tối đa {maxImagesPerSubmission} hình / bài
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[1, 3, 5, 10].map((num) => {
                          const active = maxImagesPerSubmission === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => updateContestField("maxImagesPerSubmission", num)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                active
                                  ? "border-[#EF4444] bg-[#EF4444] text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {num} hình
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500">Tùy chỉnh:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={maxImagesPerSubmission}
                          onChange={(e) =>
                            updateContestField(
                              "maxImagesPerSubmission",
                              Math.max(1, Math.min(20, Number(e.target.value) || 1))
                            )
                          }
                          className="w-14 px-2 py-1 rounded-lg border border-slate-200 text-xs text-center font-bold text-slate-800 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sắp xếp bài dự thi theo: Ngày nộp | Số lượt bình chọn | Số điểm (Ảnh 3) */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800">Sắp xếp bài dự thi theo</div>
                    <div className="space-y-2">
                      {[
                        { val: "createdAt", label: "Ngày nộp" },
                        { val: "votesCount", label: "Số lượt bình chọn" },
                        { val: "score", label: "Số điểm" },
                      ].map((opt) => (
                        <label
                          key={opt.val}
                          className="flex items-center space-x-2.5 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="sortByRadio"
                            checked={sortBy === opt.val}
                            onChange={() =>
                              updateContestField("sortBy", opt.val as "createdAt" | "votesCount" | "score")
                            }
                            className="w-4 h-4 accent-[#DC2626]"
                          />
                          <span className="font-medium text-slate-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Chia sẻ mạng xã hội: Toggle + Facebook / Zalo (Ảnh 3) */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateContestField("enableSocialShare", contest.enableSocialShare === false)
                        }
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                          contest.enableSocialShare !== false
                            ? "bg-white border-2 border-[#DC2626] justify-end"
                            : "bg-slate-200 border-2 border-slate-300 justify-start"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            contest.enableSocialShare !== false
                              ? "bg-[#DC2626] text-white"
                              : "bg-white text-slate-400"
                          }`}
                        >
                          {contest.enableSocialShare !== false ? "✓" : ""}
                        </span>
                      </button>
                      <span className="font-bold text-slate-800">Chia sẻ mạng xã hội</span>
                    </div>

                    {contest.enableSocialShare !== false && (
                      <div className="space-y-2 pl-1 pt-1">
                        {[
                          { id: "facebook" as const, label: "Facebook" },
                          { id: "zalo" as const, label: "Zalo" },
                        ].map((plat) => {
                          const platforms = contest.sharePlatforms || ["facebook", "zalo"];
                          const checked = platforms.includes(plat.id);
                          return (
                            <label
                              key={plat.id}
                              className="flex items-center space-x-2.5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? platforms.filter((p) => p !== plat.id)
                                    : [...platforms, plat.id];
                                  updateContestField("sharePlatforms", next);
                                }}
                                className="w-4 h-4 rounded accent-[#DC2626]"
                              />
                              <span className="font-medium text-slate-700">{plat.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 5: CÀI ĐẶT BẢNG XẾP HẠNG (ẢNH 3) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("bang-xep-hang")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Cài đặt bảng xếp hạng</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["bang-xep-hang"] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {openAccordions["bang-xep-hang"] && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Hiển thị bảng xếp hạng công khai</span>
                    <input
                      type="checkbox"
                      checked={contest.showLeaderboard !== false}
                      onChange={(e) => updateContestField("showLeaderboard", e.target.checked)}
                      className="w-4 h-4 accent-[#DC2626]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Hiển thị số lượt bình chọn</span>
                    <input
                      type="checkbox"
                      checked={contest.showVoteCount !== false}
                      onChange={(e) => updateContestField("showVoteCount", e.target.checked)}
                      className="w-4 h-4 accent-[#DC2626]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Hiển thị số lượt chia sẻ</span>
                    <input
                      type="checkbox"
                      checked={contest.showShareCount !== false}
                      onChange={(e) => updateContestField("showShareCount", e.target.checked)}
                      className="w-4 h-4 accent-[#DC2626]"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 6: THỂ LỆ CUỘC THI (ẢNH 3) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("the-le")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Thể lệ cuộc thi</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["the-le"] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {openAccordions["the-le"] && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <textarea
                    rows={4}
                    value={contest.rulesHtml || contest.description || ""}
                    onChange={(e) => {
                      updateContestField("rulesHtml", e.target.value);
                      updateContestField("description", e.target.value);
                    }}
                    placeholder="Nhập nội dung thể lệ cuộc thi ảnh/video..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 7: THÔNG BÁO (ẢNH 3) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("thong-bao")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Thông báo</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["thong-bao"] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {openAccordions["thong-bao"] && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <textarea
                    rows={3}
                    value={contest.announcement || ""}
                    onChange={(e) => updateContestField("announcement", e.target.value)}
                    placeholder="Nhập thông báo từ Ban Tổ Chức gửi đến thí sinh..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MỤC 8: THÔNG TIN BAN TỔ CHỨC (ẢNH 3) */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-4">
              <button
                type="button"
                onClick={() => toggleAccordion("ban-to-chuc")}
                className="w-full flex items-center justify-between font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>Thông tin ban tổ chức</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openAccordions["ban-to-chuc"] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {openAccordions["ban-to-chuc"] && (
                <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Đơn vị tổ chức</label>
                    <input
                      type="text"
                      value={contest.organizerName || ""}
                      onChange={(e) => updateContestField("organizerName", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      value={contest.organizerAddress || ""}
                      onChange={(e) => updateContestField("organizerAddress", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Điện thoại</label>
                      <input
                        type="text"
                        value={contest.organizerPhone || ""}
                        onChange={(e) => updateContestField("organizerPhone", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="text"
                        value={contest.organizerEmail || ""}
                        onChange={(e) => updateContestField("organizerEmail", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MÃ QR & LINK CHIA SẺ PHÍA DƯỚI DRAWER (ẢNH 3) */}
            <div className="p-4 flex flex-col items-center space-y-2 bg-slate-50/50">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 w-full">
                <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-800 truncate">
                    /binh-chon/{contest.slug}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mt-1 inline-flex items-center space-x-1 text-[11px] font-bold text-[#DC2626] hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedLink ? "Đã sao chép liên kết!" : "Sao chép link bình chọn"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Nút Lưu cài đặt cố định ở đáy Drawer */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isSavingSettings}
              onClick={handleSaveContestSettings}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? "Đang lưu..." : "Lưu cài đặt cuộc thi"}</span>
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* MODAL NỘP TÁC PHẨM DỰ THI (TỰ ĐỘNG ĐỒNG BỘ THEO MỤC 2 CÀI ĐẶT) */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div
                style={{ backgroundColor: `${themeColor}18`, color: themeColor }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nộp Tác Phẩm Dự Thi</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{contest?.title}</p>
              </div>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div
                  style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl font-bold"
                >
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-900">Nộp tác phẩm thành công!</h4>
                <p className="text-xs text-slate-500">
                  Tác phẩm của bạn đã được ghi nhận vào danh sách bình chọn.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitArtwork} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên tác phẩm dự thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={submitForm.title}
                    onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                    placeholder="VD: Nét đẹp Đồng Quê"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Họ và tên tác giả <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={submitForm.authorName}
                      onChange={(e) => setSubmitForm({ ...submitForm, authorName: e.target.value })}
                      placeholder="VD: Nguyễn Thị Mai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                    />
                  </div>

                  {reqFields.includes("unitName") && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Đơn vị / Thôn buôn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={submitForm.unitName}
                        onChange={(e) => setSubmitForm({ ...submitForm, unitName: e.target.value })}
                        placeholder="Nhập đơn vị / thôn buôn / trường học..."
                        list="unitNameSuggestions"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                      />
                      <datalist id="unitNameSuggestions">
                        {EA_SUP_VILLAGES.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>

                {(reqFields.includes("authorPhone") || reqFields.includes("authorCccd")) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reqFields.includes("authorPhone") && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          value={submitForm.authorPhone}
                          onChange={(e) => setSubmitForm({ ...submitForm, authorPhone: e.target.value })}
                          placeholder="0984 xxx xxx"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                        />
                      </div>
                    )}
                    {reqFields.includes("authorCccd") && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Số CCCD</label>
                        <input
                          type="text"
                          value={submitForm.authorCccd}
                          onChange={(e) => setSubmitForm({ ...submitForm, authorCccd: e.target.value })}
                          placeholder="066092xxxxxx"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {reqFields.includes("authorEmail") && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Địa chỉ Email</label>
                    <input
                      type="email"
                      value={submitForm.authorEmail}
                      onChange={(e) => setSubmitForm({ ...submitForm, authorEmail: e.target.value })}
                      placeholder="tenban@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                    />
                  </div>
                )}

                {/* Tải nhiều ảnh trực tiếp từ máy tính / điện thoại (Tối đa maxImagesPerSubmission hình - Tự động nhận diện khung hình dọc/ngang theo ảnh) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">
                      Hình ảnh / Video tác phẩm <span className="text-red-500">*</span>{" "}
                      <span className="text-[11px] font-normal text-slate-500">
                        (Đã chọn {submitForm.mediaUrls.length}/{maxImagesPerSubmission} hình tối đa)
                      </span>
                    </label>
                    <button
                      type="button"
                      disabled={submitForm.mediaUrls.length >= maxImagesPerSubmission}
                      onClick={() => submitFileInputRef.current?.click()}
                      style={{ color: themeColor }}
                      className="text-xs font-bold hover:underline flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isUploadingSubmitImage
                          ? "Đang tải ảnh..."
                          : submitForm.mediaUrls.length > 0
                            ? "+ Thêm hình"
                            : "Tải ảnh từ máy"}
                      </span>
                    </button>
                    <input
                      ref={submitFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple={maxImagesPerSubmission > 1}
                      onChange={handleSubmissionFileChange}
                      className="hidden"
                    />
                  </div>

                  {submitForm.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                      {submitForm.mediaUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
                        >
                          <img
                            src={url}
                            alt={`Hình ${idx + 1}`}
                            onLoad={(e) => {
                              if (idx === 0) {
                                const imgEl = e.currentTarget;
                                if (imgEl.naturalWidth && imgEl.naturalHeight) {
                                  const autoOrient: "vertical" | "horizontal" =
                                    imgEl.naturalWidth > imgEl.naturalHeight
                                      ? "horizontal"
                                      : "vertical";
                                  if (submitForm.orientation !== autoOrient) {
                                    setSubmitForm((prev) => ({
                                      ...prev,
                                      orientation: autoOrient,
                                    }));
                                  }
                                }
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = submitForm.mediaUrls.filter((_, i) => i !== idx);
                              setSubmitForm({
                                ...submitForm,
                                mediaUrls: next,
                                mediaUrl: next[0] || "",
                              });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px] hover:bg-red-600 cursor-pointer"
                            title="Xóa hình này"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.2 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={submitForm.mediaUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubmitForm({
                        ...submitForm,
                        mediaUrl: val,
                        mediaUrls: val
                          ? submitForm.mediaUrls.length > 0
                            ? [val, ...submitForm.mediaUrls.slice(1)]
                            : [val]
                          : [],
                      });
                    }}
                    placeholder="Hoặc dán đường dẫn ảnh/video (https://...)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white"
                  />
                </div>

                {reqFields.includes("description") && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lời bình / Thuyết minh tác phẩm
                    </label>
                    <textarea
                      rows={3}
                      value={submitForm.description}
                      onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                      placeholder="Giới thiệu ý nghĩa, hoàn cảnh sáng tác tác phẩm..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-slate-600 bg-white resize-none"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingSubmitImage}
                    style={{ backgroundColor: themeColor }}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi tác phẩm dự thi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XEM CHI TIẾT TÁC PHẨM & BÌNH CHỌN (MÔ PHỎNG CHUẨN ẢNH 2) */}
      {/* ========================================================================= */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-start">
              {/* CỘT TRÁI: HÌNH ẢNH TÁC PHẨM (CHUẨN ẢNH 2, NỀN SÁNG THANH LỊCH) */}
              {(() => {
                const imgs =
                  Array.isArray(selectedSubmission.mediaUrls) &&
                  selectedSubmission.mediaUrls.length > 0
                    ? selectedSubmission.mediaUrls
                    : [selectedSubmission.mediaUrl];
                const safeIdx = Math.min(selectedSubmissionImageIdx, imgs.length - 1);
                return (
                  <div className="md:col-span-6 flex flex-col items-center">
                    <div className="w-full relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs flex items-center justify-center">
                      <img
                        src={imgs[safeIdx] || selectedSubmission.mediaUrl}
                        alt={selectedSubmission.title}
                        className="w-full h-auto max-h-[520px] object-contain rounded-2xl"
                      />
                    </div>
                    {imgs.length > 1 && (
                      <div className="w-full flex items-center justify-center space-x-2 pt-3 overflow-x-auto">
                        {imgs.map((u, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedSubmissionImageIdx(i)}
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

              {/* CỘT PHẢI: CHI TIẾT THÔNG TIN & BÌNH CHỌN (CHUẨN ẢNH 2) */}
              <div className="md:col-span-6 flex flex-col space-y-4">
                {/* Tên tác phẩm & Thời gian nộp bài */}
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight">
                    {selectedSubmission.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-medium">
                    {formatSubmissionDate(selectedSubmission.createdAt)}
                  </div>
                </div>

                {/* Khung số liệu: Lượt xem, Lượt bình chọn & Lượt chia sẻ (Ảnh 2 & 3) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl py-3 px-3 sm:px-5 shadow-2xs grid grid-cols-3 text-center divide-x divide-slate-100">
                  <div className="px-1">
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight">
                      {selectedSubmission.viewsCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      lượt xem
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                      {selectedSubmission.votesCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      lượt bình chọn
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShareSubmission(selectedSubmission, "native")}
                    className="px-1 hover:bg-slate-50 transition-colors cursor-pointer group"
                    title="Chia sẻ tác phẩm này"
                  >
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                      {selectedSubmission.sharesCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5 group-hover:text-blue-600 transition-colors">
                      lượt chia sẻ
                    </div>
                  </button>
                </div>

                {/* Thông tin Tác giả & Đơn vị (Ảnh 2) */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: themeColor }}
                      className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      {selectedSubmission.authorName ? selectedSubmission.authorName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {selectedSubmission.authorName}
                      </div>
                      {selectedSubmission.unitName && (
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {selectedSubmission.unitName}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                    Tác giả
                  </span>
                </div>

                {/* Lời bình / Thuyết minh tác phẩm (Ảnh 2: "Mô tả" + đường kẻ + nội dung) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mô tả</div>
                  <div className="border-b border-slate-200/80" />
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto pr-1">
                    {selectedSubmission.description || "Con gái Thái"}
                  </div>
                </div>

                {/* Hàng nút bấm: Nút BÌNH CHỌN (Xanh) + Xem thêm (Ảnh 2) */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleVote(selectedSubmission.id)}
                    disabled={votedMap[selectedSubmission.id]}
                    style={{
                      backgroundColor: votedMap[selectedSubmission.id] ? "#E2E8F0" : themeColor,
                      color: votedMap[selectedSubmission.id] ? "#475569" : "#FFFFFF",
                    }}
                    className={`px-7 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                      votedMap[selectedSubmission.id]
                        ? "cursor-not-allowed opacity-90"
                        : "hover:opacity-95 hover:shadow-md active:scale-95"
                    }`}
                  >
                    {votedMap[selectedSubmission.id] ? "ĐÃ BÌNH CHỌN" : "BÌNH CHỌN"}
                  </button>

                  <Link
                    href={`/binh-chon/${slug}/tac-pham/${selectedSubmission.id}`}
                    style={{ color: themeColor }}
                    className="text-xs sm:text-sm font-semibold hover:underline cursor-pointer"
                  >
                    Xem toàn trang →
                  </Link>
                </div>

                {/* Nút chia sẻ tác phẩm: gom thành 1 nút chia sẻ hệ thống chuẩn Ảnh 2 */}
                {contest?.enableSocialShare !== false && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleShareSubmission(selectedSubmission, "native")}
                      className="w-full py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0056D6] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
                      title="Chia sẻ tác phẩm (Zalo, Facebook, Tin nhắn, Cốc Cốc...)"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Chia sẻ tác phẩm</span>
                    </button>
                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => openShareModal(selectedSubmission)}
                        className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-red-600" />
                        <span>Xem mã QR &amp; sao chép liên kết</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Nút xóa tác phẩm: Chỉ Người tạo cuộc thi hoặc Quản trị viên mới được xóa */}
                {canManage && (
                  <div className="pt-2 border-t border-red-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Quyền Người tạo cuộc thi
                    </span>
                    <button
                      type="button"
                      disabled={isDeletingSubId === selectedSubmission.id}
                      onClick={() => handleDeleteSubmission(selectedSubmission)}
                      className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Xóa tác phẩm này (Chỉ dành cho Người tạo cuộc thi)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingSubId === selectedSubmission.id ? "Đang xóa..." : "Xóa tác phẩm"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THỂ LỆ / BẢNG XẾP HẠNG TÁC PHẨM */}
      {/* ========================================================================= */}
      {infoModalTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              type="button"
              onClick={() => setInfoModalTab(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {infoModalTab === "rules" ? (
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-900 uppercase">
                  Thể lệ &amp; Thông tin Ban Tổ Chức
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-80 overflow-y-auto">
                  {contest?.rulesHtml ||
                    contest?.description ||
                    "Cuộc thi bình chọn tác phẩm ảnh/video trực tuyến xã Ea Súp."}
                </div>
                {contest?.announcement && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Thông báo BTC:</strong> {contest.announcement}
                  </div>
                )}
                <div className="pt-2 text-[11px] text-slate-500 space-y-0.5">
                  <div>
                    <strong>Đơn vị tổ chức:</strong> {contest?.organizerName}
                  </div>
                  {contest?.organizerAddress && (
                    <div>
                      <strong>Địa chỉ:</strong> {contest.organizerAddress}
                    </div>
                  )}
                  {contest?.organizerPhone && (
                    <div>
                      <strong>Điện thoại:</strong> {contest.organizerPhone}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-900 uppercase flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Bảng xếp hạng Tác phẩm dẫn đầu</span>
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {[...submissions]
                    .sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0))
                    .map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span
                            style={idx < 3 ? { backgroundColor: themeColor, color: "#fff" } : {}}
                            className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0"
                          >
                            {idx + 1}
                          </span>
                          <img
                            src={sub.mediaUrl}
                            alt={sub.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{sub.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {sub.authorName} • {sub.unitName}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{ color: themeColor }}
                          className="font-extrabold whitespace-nowrap shrink-0"
                        >
                          {sub.votesCount || 0} bình chọn
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL CHIA SẺ ĐA NỀN TẢNG & MÃ QR (ẢNH 2 - TƯƠNG TỰ CUỘC THI TRẮC NGHIỆM) */}
      {/* ========================================================================= */}
      {shareModalTarget && (() => {
        const isArtworkShare = shareModalTarget !== "CONTEST";
        const baseUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/binh-chon/${slug}`
            : `https://thi.easupso.com/binh-chon/${slug}`;
        const targetShareUrl = isArtworkShare
          ? `${baseUrl}/tac-pham/${encodeURIComponent(shareModalTarget.id)}`
          : baseUrl;
        const targetShareTitle = isArtworkShare
          ? `Tác phẩm: "${shareModalTarget.title}" - Tác giả: ${shareModalTarget.authorName} (${shareModalTarget.unitName})`
          : contest?.title || "Cuộc thi Ảnh đẹp trực tuyến xã Ea Súp";
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(targetShareUrl)}`;

        const triggerPlatformShare = (
          platform: "zalo" | "facebook" | "telegram" | "email" | "native" | "copy"
        ) => {
          if (isArtworkShare) {
            handleShareSubmission(shareModalTarget, platform);
            return;
          }
          if (platform === "facebook") {
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetShareUrl)}&quote=${encodeURIComponent(targetShareTitle)}`,
              "_blank",
              "width=640,height=480"
            );
          } else if (platform === "zalo") {
            window.open(`https://zalo.me/share?url=${encodeURIComponent(targetShareUrl)}`, "_blank");
          } else if (platform === "telegram") {
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(targetShareUrl)}&text=${encodeURIComponent(targetShareTitle)}`,
              "_blank",
              "width=640,height=480"
            );
          } else if (platform === "email") {
            window.location.href = `mailto:?subject=${encodeURIComponent(targetShareTitle)}&body=${encodeURIComponent(`Mời bạn tham gia và bình chọn tại:\n${targetShareUrl}`)}`;
          } else if (platform === "native" && typeof navigator !== "undefined" && navigator.share) {
            navigator
              .share({
                title: targetShareTitle,
                text: targetShareTitle,
                url: targetShareUrl,
              })
              .catch(() => {});
          } else {
            navigator.clipboard?.writeText(targetShareUrl);
            setCopiedShareModalLink(true);
            setTimeout(() => setCopiedShareModalLink(false), 2500);
            setSaveToast("Đã sao chép liên kết chia sẻ vào bộ nhớ tạm!");
            setTimeout(() => setSaveToast(""), 2500);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative text-center space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm sm:text-base">
                  <Share2 className="w-4 h-4 text-[#0284C7]" />
                  <span>
                    {isArtworkShare ? "Chia Sẻ Tác Phẩm Dự Thi" : "Chia Sẻ Cuộc Thi Trực Tuyến"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShareModalTarget(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thông tin tóm tắt Tác phẩm / Cuộc thi */}
              {isArtworkShare ? (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                  <img
                    src={
                      (Array.isArray(shareModalTarget.mediaUrls) && shareModalTarget.mediaUrls[0]) ||
                      shareModalTarget.mediaUrl
                    }
                    alt={shareModalTarget.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {shareModalTarget.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Tác giả: <strong className="text-slate-700">{shareModalTarget.authorName}</strong> • {shareModalTarget.unitName}
                    </div>
                    <div className="text-[11px] font-bold mt-1 flex items-center gap-2.5 sm:gap-3 flex-wrap" style={{ color: themeColor }}>
                      <span className="text-blue-600">👁️ {shareModalTarget.viewsCount || 0} xem</span>
                      <span>⭐ {shareModalTarget.votesCount || 0} bình chọn</span>
                      <span>🔗 {shareModalTarget.sharesCount || 0} chia sẻ</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-700 px-2 line-clamp-2">
                  {contest?.title}
                </div>
              )}

              {/* Các nút Chia sẻ nhanh Đa nền tảng (Zalo, Facebook, Telegram, Email, Hệ thống) */}
              <div className="space-y-2 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Chia sẻ nhanh qua mạng xã hội &amp; ứng dụng
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerPlatformShare("zalo")}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-[#0068FF] hover:bg-[#0056D6] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-black text-[11px]">
                      Zalo
                    </span>
                    <span>Zalo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerPlatformShare("facebook")}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-[#1877F2] hover:bg-[#1464CC] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                      f
                    </span>
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerPlatformShare("telegram")}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-[#229ED9] hover:bg-[#1C88BD] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerPlatformShare("email")}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Email</span>
                  </button>
                </div>

                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    type="button"
                    onClick={() => triggerPlatformShare("native")}
                    className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284C7] border border-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Mở menu chia sẻ nhanh trên điện thoại (Zalo, Messenger, SMS...)</span>
                  </button>
                )}
              </div>

              {/* Mã QR quét trực tiếp (Tương tự chia sẻ cuộc thi trắc nghiệm trực tuyến) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto">
                <img
                  src={qrImageUrl}
                  alt="Mã QR chia sẻ"
                  className="w-36 h-36 mx-auto rounded-xl bg-white p-1.5 border border-slate-200 shadow-2xs"
                />
                <span className="text-[11px] text-slate-500 font-medium mt-2 block">
                  Quét mã QR bằng Camera điện thoại hoặc Zalo để mở nhanh
                </span>
              </div>

              {/* Ô Sao chép liên kết trực tiếp */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-2">
                <input
                  type="text"
                  readOnly
                  value={targetShareUrl}
                  className="flex-1 bg-transparent text-xs text-slate-700 font-mono px-2 outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() => triggerPlatformShare("copy")}
                  style={{
                    backgroundColor: copiedShareModalLink ? "#059669" : "#DC2626",
                  }}
                  className="px-3.5 py-2 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedShareModalLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL ĐĂNG NHẬP BẮT BUỘC TRƯỚC KHI NỘP TÁC PHẨM DỰ THI */}
      {/* ========================================================================= */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingSubmitAfterLogin(false);
        }}
        onSuccess={(user) => {
          setAuthUser(user);
          setSubmitForm((prev) => ({
            ...prev,
            authorName: prev.authorName || user.name || "",
            authorPhone: prev.authorPhone || user.phone || "",
            authorEmail: prev.authorEmail || user.email || "",
          }));
          if (pendingSubmitAfterLogin) {
            setPendingSubmitAfterLogin(false);
            if (!showSettingsDrawer) {
              loadData();
            }
            setShowSubmitModal(true);
          }
        }}
      />
    </div>
  );
}
