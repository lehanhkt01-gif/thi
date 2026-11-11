"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  BarChart2,
  Image as ImageIcon,
  Plus,
  PlusCircle,
  FileText,
  BookOpen,
  Building,
  Users,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  Download,
  Share2,
  Trash2,
  Edit,
  Sparkles,
  HelpCircle,
  X,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  Filter,
  Layers,
  ArrowRight,
  Landmark,
  Video,
  Copy,
  Check,
  ChevronLeft,
  ChevronDown,
  List,
  Navigation,
  User,
  Settings,
  Sliders,
  UserCheck,
  UserX,
  ShieldAlert,
  Key,
  KeyRound,
  Upload,
  FolderPlus,
  Folder,
  Link2,
  QrCode,
  Mail,
} from "lucide-react";
import * as XLSX from "xlsx";
import { EA_SUP_VILLAGES, DEFAULT_ORGANIZATIONS } from "@/lib/store";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import LoginModal from "@/components/LoginModal";
import ShortlinkQrModal from "@/components/ShortlinkQrModal";
import ShareContestModal from "@/components/ShareContestModal";

export default function AdminDashboardPage() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "trac-nghiem" | "anh-video" | "de-thi" | "thong-bao" | "don-vi" | "quan-ly-nguoi-dung"
  >("trac-nghiem");

  // Auth State
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Contest list & Filters
  const [contests, setContests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [creatorFilter, setCreatorFilter] = useState<string>("ALL");

  // Share Contest State (Ảnh 1)
  const [selectedContestForShare, setSelectedContestForShare] = useState<any>(null);

  // Shortlink & QR Modal State
  const [selectedContestForShortlink, setSelectedContestForShortlink] = useState<any>(null);
  const [shortlinkModalTab, setShortlinkModalTab] = useState<"custom-link" | "qr-code">("custom-link");
  const [copiedContestSlug, setCopiedContestSlug] = useState<string | null>(null);

  const handleCopyContestShortlink = async (c: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://thi.easupso.com";
    const effectiveSlug = c.customSlug || c.slug;
    const shortUrl = `${origin}/r/${effectiveSlug}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedContestSlug(c.slug);
      setTimeout(() => setCopiedContestSlug(null), 2500);
    } catch {
      prompt("Sao chép link rút gọn:", shortUrl);
    }
  };

  // Question Bank State (Kho đề thi & Phân loại Bộ đề)
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionCategory, setQuestionCategory] = useState("ALL");
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("ALL");
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPackageMode, setImportPackageMode] = useState<"new" | "existing">("new");
  const [importNewPackageName, setImportNewPackageName] = useState("");
  const [importExistingPackageId, setImportExistingPackageId] = useState("");
  const [importPreviewQuestions, setImportPreviewQuestions] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  // Units State (Đơn vị)
  const [unitsList, setUnitsList] = useState<string[]>([
    ...EA_SUP_VILLAGES,
    "Khối Cơ quan Đảng - Đoàn thể",
    "Khối UBND & Lực lượng vũ trang",
    "Trường THCS Lê Hồng Phong",
    "Chi đoàn Thanh niên",
    "Chi bộ Quân sự",
  ]);
  const [newUnitName, setNewUnitName] = useState("");

  // Announcements State (Thông báo BTC)
  const [announcements, setAnnouncements] = useState([
    {
      id: "ann-1",
      title: "Thông báo phát động Cuộc thi trực tuyến tìm hiểu Nghị quyết & Chuyển đổi số năm 2026",
      date: "20/10/2026",
      sender: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
      content: "Đề nghị các đồng chí Trưởng ban công tác Mặt trận 20 thôn buôn tích cực đôn đốc đoàn viên, hội viên và nhân dân tham gia dự thi đạt 100% chỉ tiêu.",
    },
    {
      id: "ann-2",
      title: "Hướng dẫn cài đặt và đăng ký tham gia thi trên điện thoại di động mạng 4G",
      date: "18/10/2026",
      sender: "Ban Tổ Chức Cuộc Thi",
      content: "Thí sinh có thể mở trực tiếp liên kết từ Zalo hoặc quét mã QR tại các nhà văn hóa thôn buôn để làm bài thi mà không cần tải ứng dụng.",
    },
  ]);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");

  // Guide Modal
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Media Contests State (Ảnh 2)
  const [mediaContests, setMediaContests] = useState<any[]>([]);
  const [mediaStatusFilter, setMediaStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [mediaCreatorFilter, setMediaCreatorFilter] = useState<string>("ALL");
  const [selectedMediaContestIds, setSelectedMediaContestIds] = useState<string[]>([]);
  const [showCreateMediaModal, setShowCreateMediaModal] = useState(false);
  const [showPlanTemplateModal, setShowPlanTemplateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [activeMediaContestForSubmissions, setActiveMediaContestForSubmissions] = useState<any>(null);
  const [currentMediaSubmissions, setCurrentMediaSubmissions] = useState<any[]>([]);

  // Form State for creating / editing Media Contest (MyAloha Photo Voting Settings - Ảnh 2 & Ảnh 3)
  const [editingMediaContestId, setEditingMediaContestId] = useState<string | null>(null);
  const [mediaSettingsSection, setMediaSettingsSection] = useState<string>("config");
  const [uploadingMediaBanner, setUploadingMediaBanner] = useState(false);

  const defaultMediaFormState = {
    title: "Nét đẹp văn hóa các dân tộc - Ea Súp năm 2026",
    slug: "",
    type: "IMAGE" as "IMAGE" | "VIDEO",
    startDate: "2026-11-10T07:00",
    endDate: "2026-11-24T07:00",
    submitStartDate: "2026-11-10T07:00",
    submitEndDate: "2026-11-18T07:00",
    voteStartDate: "2026-11-18T08:00",
    voteEndDate: "2026-11-24T07:00",
    displayStartDate: "10/11/2026",
    displayEndDate: "24/11/2026",
    bannerUrl: "/images/contest_stage_banner.jpg",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
    description: "Cuộc thi bình chọn tác phẩm hình ảnh/video trực tuyến",
    themeColor: "#1B7F5C",
    layoutMode: "both" as "vertical" | "horizontal" | "both",
    layoutModes: ["vertical", "horizontal"] as ("vertical" | "horizontal")[],
    maxImagesPerSubmission: 5,
    sortBy: "votesCount" as "createdAt" | "votesCount" | "score",
    enableSocialShare: true,
    sharePlatforms: ["facebook", "zalo"] as string[],
    requiredParticipantFields: ["authorName", "authorPhone", "unitName", "description"] as string[],
    requireApproval: false,
    maxVotesPerUser: 3,
    contestPassword: "",
    showLeaderboard: true,
    showVoteCount: true,
    showShareCount: true,
    rulesHtml: "",
    rulesFileUrl: "",
    announcement: "",
    organizerName: "Ủy ban MTTQ Việt Nam & Đoàn Thanh niên xã Ea Súp",
    organizerAddress: "72 Hùng Vương, xã Ea Súp, Tỉnh Đắk Lắk",
    organizerPhone: "0888023023",
    organizerEmail: "ubnd.easup@daklak.gov.vn",
  };

  const [newMediaForm, setNewMediaForm] = useState(defaultMediaFormState);

  // Sync URL query params (?tab=anh-video&create=1)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "anh-video") {
        setActiveTab("anh-video");
      }
      if (params.get("create") === "1") {
        setActiveTab("anh-video");
        setEditingMediaContestId(null);
        setNewMediaForm(defaultMediaFormState);
        setMediaSettingsSection("config");
        setShowCreateMediaModal(true);
      }
    }
  }, []);

  // Synchronize Authentication with Server
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const saved = localStorage.getItem("cuocthi_admin_auth");
        if (saved) {
          const parsed = JSON.parse(saved);
          setAuthUser(parsed);

          // Kiểm tra và đồng bộ lại với danh sách tài khoản thực tế trên Server
          try {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(parsed.email)}`);
            const data = await res.json();
            if (data.users && data.users.length > 0) {
              const found = data.users.find(
                (u: any) => u.email.toLowerCase() === parsed.email.toLowerCase()
              );
              if (found) {
                // CHƯA PHÊ DUYỆT THÌ KHÔNG THỂ DUY TRÌ ĐĂNG NHẬP
                if (found.status !== "APPROVED") {
                  localStorage.removeItem("cuocthi_admin_auth");
                  setAuthUser(null);
                  return;
                }
                // Đồng bộ chính xác vai trò từ cơ sở dữ liệu (mặc định USER nếu chưa được nâng cấp Admin)
                if (parsed.role !== found.role) {
                  parsed.role = found.role;
                  localStorage.setItem("cuocthi_admin_auth", JSON.stringify(parsed));
                  setAuthUser(parsed);
                }
              }
            }
          } catch (err) {
            console.warn("Lỗi kiểm tra auth:", err);
          }
        } else {
          setAuthUser(null);
        }
      } catch (e) {
        setAuthUser(null);
      } finally {
        setIsAuthLoading(false);
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

  // Fetch Contests & Question Bank
  useEffect(() => {
    fetch(`/api/contests?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.contests) setContests(data.contests);
      })
      .catch((err) => console.error("Error loading contests:", err));

    fetch(`/api/questions/bank?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.questions) setQuestions(data.questions);
      })
      .catch((err) => console.error("Error loading questions:", err));

    loadMediaContests();
    loadUsers();
  }, []);

  // Helper kiểm tra quyền sở hữu và quản lý cuộc thi:
  // Admin toàn quyền; Người dùng (USER) chỉ có quyền Quản lý/Chỉnh sửa các cuộc thi do chính mình tạo HOẶC được chia sẻ quyền
  const canUserManageContest = (c: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    if (!userEmail && !authUser.id) return false;
    const creatorEmail = (c?.creatorEmail || "").toLowerCase().trim();
    const creatorId = c?.creatorId || c?.userId;
    if (creatorEmail && creatorEmail === userEmail) return true;
    if (creatorId && creatorId === authUser.id) return true;
    // Kiểm tra danh sách được chia sẻ quyền quản lý, chỉnh sửa
    if (Array.isArray(c?.sharedEmails) && c.sharedEmails.some((e: string) => (e || "").toLowerCase().trim() === userEmail)) {
      return true;
    }
    return false;
  };

  // Helper kiểm tra quyền chia sẻ cuộc thi:
  // Chỉ Chủ sở hữu cuộc thi (người tạo) hoặc Admin toàn quyền mới có thể thêm/bớt người đồng quản lý hoặc xóa cuộc thi
  const canUserShareContest = (c: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    if (!userEmail && !authUser.id) return false;
    const creatorEmail = (c?.creatorEmail || "").toLowerCase().trim();
    const creatorId = c?.creatorId || c?.userId;
    if (creatorEmail && creatorEmail === userEmail) return true;
    if (creatorId && creatorId === authUser.id) return true;
    return false;
  };

  const canUserManageMediaContest = (c: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    if (!userEmail && !authUser.id) return false;
    const creatorEmail = (c?.creatorEmail || "").toLowerCase().trim();
    const creatorId = c?.creatorId;
    if (creatorEmail && creatorEmail === userEmail) return true;
    if (creatorId && creatorId === authUser.id) return true;
    if (
      Array.isArray(c?.sharedEmails) &&
      c.sharedEmails.some((e: string) => (e || "").toLowerCase().trim() === userEmail)
    ) {
      return true;
    }
    return false;
  };

  const canUserShareMediaContest = (c: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    if (!userEmail && !authUser.id) return false;
    const creatorEmail = (c?.creatorEmail || "").toLowerCase().trim();
    const creatorId = c?.creatorId;
    if (creatorEmail && creatorEmail === userEmail) return true;
    if (creatorId && creatorId === authUser.id) return true;
    return false;
  };

  const canUserManageQuestion = (q: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    if (q?.isSystem) return false;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    return q?.creatorEmail && q.creatorEmail.toLowerCase().trim() === userEmail;
  };

  const canUserManagePackage = (pkg: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    if (pkg?.isSystem) return false;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    return pkg?.creatorEmail && pkg.creatorEmail.toLowerCase().trim() === userEmail;
  };

  const loadQuestionBank = async (pkgId?: string, search?: string) => {
    try {
      const pId = pkgId !== undefined ? pkgId : selectedPackageId;
      const s = search !== undefined ? search : questionSearchQuery;
      const res = await fetch(
        `/api/questions/bank?packageId=${encodeURIComponent(pId)}&search=${encodeURIComponent(s)}`,
        {
          headers: {
            "x-user-role": authUser?.role || "",
            "x-user-email": authUser?.email || "",
            "x-user-id": authUser?.id || "",
          },
        }
      );
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      if (data.packages) setPackagesList(data.packages);
    } catch (err) {
      console.error("Lỗi nạp kho câu hỏi:", err);
    }
  };

  useEffect(() => {
    loadQuestionBank(selectedPackageId, questionSearchQuery);
  }, [authUser, selectedPackageId]);

  const handleFileSelectForImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError("");

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows || rows.length === 0) {
        setImportError("Tệp Excel không có dòng dữ liệu câu hỏi nào!");
        setImportPreviewQuestions([]);
        return;
      }

      const parsed: any[] = [];
      let detectedPkg = "";

      for (const row of rows) {
        const content =
          row["Nội dung câu hỏi"] || row["Câu hỏi"] || row["content"] || row["Nội dung"] || "";
        if (!content || !String(content).trim()) continue;

        const optA = String(row["Phương án A"] || row["A"] || row["optA"] || "").trim();
        const optB = String(row["Phương án B"] || row["B"] || row["optB"] || "").trim();
        const optC = String(row["Phương án C"] || row["C"] || row["optC"] || "").trim();
        const optD = String(row["Phương án D"] || row["D"] || row["optD"] || "").trim();
        if (!optA || !optB) continue;

        const options = [{ id: "A", text: optA }, { id: "B", text: optB }];
        if (optC) options.push({ id: "C", text: optC });
        if (optD) options.push({ id: "D", text: optD });

        const rawAns = String(row["Đáp án đúng (A/B/C/D)"] || row["Đáp án đúng"] || row["Đáp án"] || "A")
          .toUpperCase()
          .trim();
        const correct = ["A", "B", "C", "D"].includes(rawAns) ? rawAns : "A";
        const category = String(
          row["Chuyên đề / Lĩnh vực"] || row["Lĩnh vực"] || row["Chuyên đề"] || "Pháp luật chung"
        ).trim();
        const explanation = String(
          row["Trích dẫn điều khoản luật / Giải thích"] || row["Trích dẫn luật"] || row["Giải thích"] || ""
        ).trim();
        const points = Number(row["Điểm số"] || row["Điểm"]) || 10;

        if (!detectedPkg && row["Bộ đề"]) {
          detectedPkg = String(row["Bộ đề"]).trim();
        }

        parsed.push({
          content: String(content).trim(),
          category,
          options,
          correctOptionIds: [correct],
          explanation,
          points,
        });
      }

      if (parsed.length === 0) {
        setImportError(
          "Không tìm thấy câu hỏi hợp lệ nào (Cần ít nhất: Nội dung câu hỏi, Phương án A, Phương án B)."
        );
      } else {
        setImportPreviewQuestions(parsed);
        if (detectedPkg && !importNewPackageName) {
          setImportNewPackageName(detectedPkg);
        }
      }
    } catch (err: any) {
      setImportError("Lỗi đọc file Excel: " + err.message);
      setImportPreviewQuestions([]);
    }
  };

  const handleExecuteImport = async () => {
    if (!importFile) {
      alert("Vui lòng chọn tệp Excel trước khi bấm nhập!");
      return;
    }
    if (importPreviewQuestions.length === 0) {
      alert("Tệp Excel chưa có câu hỏi hợp lệ để nhập!");
      return;
    }
    if (importPackageMode === "new" && !importNewPackageName.trim()) {
      alert("Vui lòng nhập tên cho Bộ đề mới!");
      return;
    }
    if (importPackageMode === "existing" && !importExistingPackageId) {
      alert("Vui lòng chọn một bộ đề đã có!");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("userName", authUser?.name || "");
      formData.append("userEmail", authUser?.email || "");
      formData.append("userId", authUser?.id || "");
      formData.append("userRole", authUser?.role || "");
      if (importPackageMode === "new") {
        formData.append("packageName", importNewPackageName.trim());
      } else {
        formData.append("packageId", importExistingPackageId);
      }

      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: {
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
          "x-user-name": encodeURIComponent(authUser?.name || ""),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Có lỗi xảy ra khi nhập câu hỏi!");
        return;
      }

      alert(`✅ ${data.message || `Đã nhập thành công ${data.importedCount} câu hỏi!`}`);
      setShowImportModal(false);
      setImportFile(null);
      setImportPreviewQuestions([]);
      setImportNewPackageName("");
      loadQuestionBank();
    } catch (err: any) {
      setImportError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi bộ đề?")) return;
    try {
      const res = await fetch(`/api/questions/bank?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        loadQuestionBank();
      } else {
        alert(data.error || "Không thể xóa câu hỏi!");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeletePackage = async (pkgId: string, pkgName: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn bộ đề "${pkgName}" cùng toàn bộ câu hỏi bên trong?`
      )
    )
      return;
    try {
      const res = await fetch(`/api/questions/bank?packageId=${pkgId}`, {
        method: "DELETE",
        headers: {
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPackageId("ALL");
        loadQuestionBank("ALL");
        alert("Đã xóa bộ đề thành công!");
      } else {
        alert(data.error || "Không thể xóa bộ đề!");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteContest = async (slug: string, title: string) => {
    const target = contests.find((c) => c.slug === slug || c.id === slug);
    if (target && !canUserShareContest(target)) {
      alert("Bạn không có quyền xóa cuộc thi này! Chỉ Chủ cuộc thi hoặc Quản trị viên cấp cao mới có thể xóa.");
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn cuộc thi "${title}" khỏi hệ thống?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/contests/${slug}`, {
        method: "DELETE",
        headers: {
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setContests((prev) => prev.filter((c) => c.slug !== slug && c.id !== slug && (!target || (c.id !== target.id && c.slug !== target.slug))));
        try {
          localStorage.removeItem(`easup_contest_draft_${slug}`);
          if (target?.slug) localStorage.removeItem(`easup_contest_draft_${target.slug}`);
          const lastSlug = localStorage.getItem("easup_last_edited_slug");
          if (lastSlug === slug || (target && (lastSlug === target.slug || lastSlug === target.id))) {
            localStorage.removeItem("easup_last_edited_slug");
            localStorage.removeItem("easup_contest_draft_last");
          }
        } catch {}
      } else {
        alert(data.error || "Không thể xóa cuộc thi");
      }
    } catch (e: any) {
      alert("Lỗi khi xóa cuộc thi: " + e.message);
    }
  };

  // Safe JSON helper chống lỗi Unexpected token '<', "<html>..." is not valid JSON
  const safeParseMediaResponse = async (res: Response) => {
    const raw = await res.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {
        _isHtmlError: true,
        error: `Máy chủ phản hồi mã trạng thái ${res.status}. Đang tự động tối ưu hóa dữ liệu...`,
      };
    }
  };

  // Nén ảnh client-side xuống < 180KB để không bao giờ bị Nginx chặn 413 HTML
  const compressMediaImageFile = (file: File, maxWidth = 1280, quality = 0.78): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context error"));
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve({ blob, dataUrl });
              else reject(new Error("Blob error"));
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Phát tín hiệu đồng bộ 2 chiều giữa /admin và /binh-chon/[slug]
  const broadcastMediaContestSync = (updatedContest?: any) => {
    try {
      if (typeof window !== "undefined") {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("easup_media_contest_sync");
          bc.postMessage({
            type: "MEDIA_CONTEST_SYNC",
            contest: updatedContest || null,
            timestamp: Date.now(),
          });
          bc.close();
        }
        localStorage.setItem(
          "easup_media_contest_sync_event",
          JSON.stringify({
            contestId: updatedContest?.id,
            slug: updatedContest?.slug,
            ts: Date.now(),
          })
        );
      }
    } catch {}
  };

  // Fetch Media Contests
  const loadMediaContests = async () => {
    try {
      const res = await fetch(`/api/media-contests?t=${Date.now()}`, { cache: "no-store" });
      const data = await safeParseMediaResponse(res);
      if (data.contests) {
        setMediaContests(data.contests);
      }
    } catch (err) {
      console.error("Lỗi tải cuộc thi ảnh/video:", err);
    }
  };

  // Lắng nghe đồng bộ 2 chiều realtime từ trang /binh-chon/[slug]
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSyncContestToForm = (incoming: any) => {
      if (!incoming) return;
      setMediaContests((prev) => {
        const exists = prev.some((c) => c.id === incoming.id || c.slug === incoming.slug);
        if (!exists) return [incoming, ...prev];
        return prev.map((c) =>
          c.id === incoming.id || c.slug === incoming.slug ? { ...c, ...incoming } : c
        );
      });

      if (
        editingMediaContestId &&
        (incoming.id === editingMediaContestId || incoming.slug === editingMediaContestId)
      ) {
        const syncedModes: ("vertical" | "horizontal")[] =
          Array.isArray(incoming.layoutModes) && incoming.layoutModes.length > 0
            ? incoming.layoutModes
            : incoming.layoutMode === "both"
              ? ["vertical", "horizontal"]
              : [incoming.layoutMode || "vertical"];
        setNewMediaForm((prev) => ({
          ...prev,
          ...incoming,
          submitStartDate: (incoming.submitStartDate || incoming.startDate || prev.submitStartDate).slice(0, 16),
          submitEndDate: (incoming.submitEndDate || prev.submitEndDate).slice(0, 16),
          voteStartDate: (incoming.voteStartDate || prev.voteStartDate).slice(0, 16),
          voteEndDate: (incoming.voteEndDate || incoming.endDate || prev.voteEndDate).slice(0, 16),
          layoutModes: syncedModes,
          layoutMode: syncedModes.length >= 2 ? "both" : syncedModes[0] || "vertical",
          maxImagesPerSubmission: Number(incoming.maxImagesPerSubmission) || prev.maxImagesPerSubmission || 5,
        }));
      }
    };

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel("easup_media_contest_sync");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "MEDIA_CONTEST_SYNC") {
          if (ev.data.contest) {
            handleSyncContestToForm(ev.data.contest);
          }
          loadMediaContests();
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "easup_media_contest_sync_event") {
        loadMediaContests();
      }
    };
    const onFocus = () => {
      loadMediaContests();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [editingMediaContestId]);

  const handleMediaBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMediaBanner(true);
    try {
      const { blob, dataUrl } = await compressMediaImageFile(file);
      setNewMediaForm((prev) => ({ ...prev, bannerUrl: dataUrl }));

      const formData = new FormData();
      formData.append("file", blob, file.name.replace(/\.[^/.]+$/, ".jpg"));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await safeParseMediaResponse(res);
      if (data.url) {
        setNewMediaForm((prev) => ({ ...prev, bannerUrl: data.url }));
      }
    } catch {
      try {
        const { dataUrl } = await compressMediaImageFile(file, 960, 0.7);
        setNewMediaForm((prev) => ({ ...prev, bannerUrl: dataUrl }));
      } catch {}
    } finally {
      setUploadingMediaBanner(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleCreateMediaContest = async (e: React.FormEvent, openDashboardAfter = false) => {
    e.preventDefault();
    try {
      const formatDisplayDate = (dt: string) => {
        if (!dt) return "";
        const d = dt.split("T")[0];
        const parts = d.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dt;
      };

      // Nếu bannerUrl là chuỗi data:base64 thì đẩy lên /api/upload trước để tránh lỗi 413 HTML từ Nginx
      let cleanBannerUrl = newMediaForm.bannerUrl;
      if (cleanBannerUrl && cleanBannerUrl.startsWith("data:")) {
        try {
          const upRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: cleanBannerUrl, name: "media-banner.jpg" }),
          });
          const upData = await safeParseMediaResponse(upRes);
          if (upData.url) {
            cleanBannerUrl = upData.url;
          }
        } catch {}
      }

      const normalizedModes: ("vertical" | "horizontal")[] =
        Array.isArray(newMediaForm.layoutModes) && newMediaForm.layoutModes.length > 0
          ? newMediaForm.layoutModes
          : ["vertical"];
      const normalizedLayoutMode: "vertical" | "horizontal" | "both" =
        normalizedModes.length >= 2 ? "both" : normalizedModes[0] || "vertical";

      const payload = {
        ...newMediaForm,
        bannerUrl: cleanBannerUrl,
        editingId: editingMediaContestId || undefined,
        action: editingMediaContestId ? "update" : "create",
        editorRole: authUser?.role,
        editorEmail: authUser?.email,
        editorId: authUser?.id,
        layoutModes: normalizedModes,
        layoutMode: normalizedLayoutMode,
        maxImagesPerSubmission: Number(newMediaForm.maxImagesPerSubmission) > 0 ? Number(newMediaForm.maxImagesPerSubmission) : 5,
        startDate: newMediaForm.submitStartDate || newMediaForm.startDate,
        endDate: newMediaForm.voteEndDate || newMediaForm.endDate,
        displayStartDate: formatDisplayDate(newMediaForm.submitStartDate || newMediaForm.startDate),
        displayEndDate: formatDisplayDate(newMediaForm.voteEndDate || newMediaForm.endDate),
        creatorEmail: authUser?.email,
        creatorId: authUser?.id,
        creatorName: authUser?.name,
      };

      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-role": authUser?.role || "",
        "x-user-email": authUser?.email || "",
        "x-user-id": authUser?.id || "",
      };

      // Luôn gửi qua POST /api/media-contests để tương thích 100% với mọi cấu hình Nginx/Cloudflare
      let res = await fetch("/api/media-contests", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
      });
      let data = await safeParseMediaResponse(res);

      // Nếu vì lý do nào đó payload lớn bị chặn HTML, tự động rút gọn bannerUrl và gửi lại
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
        data = await safeParseMediaResponse(res);
      }

      if (data.success || data.contest) {
        const savedContest = data.contest;
        await loadMediaContests();
        broadcastMediaContestSync(savedContest);
        setShowCreateMediaModal(false);
        setEditingMediaContestId(null);
        const savedSlug = savedContest?.slug || editingMediaContestId;
        if (openDashboardAfter && savedSlug) {
          window.open(`/binh-chon/${savedSlug}?settings=1`, "_blank");
        } else {
          alert(
            editingMediaContestId
              ? "Đã lưu & đồng bộ cài đặt cuộc thi ảnh thành công!"
              : "Khởi tạo cuộc thi bình chọn mới thành công!"
          );
        }
      } else {
        alert(data.error || "Lỗi lưu cuộc thi");
      }
    } catch (err: any) {
      alert("Lỗi khi lưu cài đặt: " + (err?.message || "Vui lòng thử lại"));
    }
  };

  const handleDeleteMediaContests = async (id?: string) => {
    const idsToDelete = id ? [id] : selectedMediaContestIds;
    if (idsToDelete.length === 0) {
      alert("Vui lòng chọn ít nhất một cuộc thi để xóa!");
      return;
    }

    // Kiểm tra quyền: Người dùng thông thường chỉ được xóa cuộc thi do mình tạo
    if (authUser?.role !== "ADMIN") {
      const unpermitted = idsToDelete.filter((item) => {
        const found = mediaContests.find((c) => c.id === item);
        return found && !canUserManageMediaContest(found);
      });
      if (unpermitted.length > 0) {
        alert("Bạn không thể xóa cuộc thi do đơn vị khác tạo!");
        return;
      }
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${idsToDelete.length} cuộc thi đã chọn?`)) {
      return;
    }

    for (const item of idsToDelete) {
      const found = mediaContests.find((c) => c.id === item);
      if (found) {
        await fetch(`/api/media-contests/${found.slug}`, {
          method: "DELETE",
          headers: {
            "x-user-role": authUser?.role || "",
            "x-user-email": authUser?.email || "",
            "x-user-id": authUser?.id || "",
          },
        });
      }
    }
    setSelectedMediaContestIds([]);
    loadMediaContests();
  };

  const handleViewSubmissions = async (contest: any) => {
    setActiveMediaContestForSubmissions(contest);
    try {
      const res = await fetch(`/api/media-contests/${contest.slug}`);
      const data = await res.json();
      if (data.submissions) {
        setCurrentMediaSubmissions(data.submissions);
      }
      setShowSubmissionsModal(true);
    } catch (err) {
      console.error("Lỗi nạp tác phẩm:", err);
    }
  };

  const handleDeleteMediaSubmissionFromAdmin = async (sub: any) => {
    if (!activeMediaContestForSubmissions) return;
    const confirmMsg = `Bạn có chắc chắn muốn xóa tác phẩm dự thi:\n"${sub.title}" của tác giả ${sub.authorName} (${sub.unitName})?\n\nLưu ý: Tác phẩm và số lượt bình chọn liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `/api/media-contests/${encodeURIComponent(activeMediaContestForSubmissions.slug)}/tac-pham/${encodeURIComponent(sub.id)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": authUser?.role || "ADMIN",
            "x-user-email": authUser?.email || "",
            "x-user-id": authUser?.id || "",
          },
          body: JSON.stringify({
            userRole: authUser?.role,
            userEmail: authUser?.email,
            userId: authUser?.id,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setCurrentMediaSubmissions((prev: any[]) => prev.filter((s: any) => s.id !== sub.id));
        setMediaContests((prev: any[]) =>
          prev.map((c) =>
            c.id === activeMediaContestForSubmissions.id
              ? { ...c, submissionsCount: Math.max(0, (c.submissionsCount || 1) - 1) }
              : c
          )
        );
        alert("Đã xóa tác phẩm dự thi thành công!");
      } else {
        alert(data.error || "Không thể xóa tác phẩm này!");
      }
    } catch (err: any) {
      alert("Lỗi khi xóa tác phẩm: " + (err.message || "Vui lòng thử lại"));
    }
  };

  const handleOpenEditMediaContest = (c: any) => {
    if (!canUserManageMediaContest(c)) {
      alert("Chỉ người tạo, Quản trị viên (Admin) hoặc người được chia sẻ quyền mới được chỉnh sửa cuộc thi này!");
      return;
    }
    const initModes: ("vertical" | "horizontal")[] =
      Array.isArray(c.layoutModes) && c.layoutModes.length > 0
        ? c.layoutModes
        : c.layoutMode === "both"
          ? ["vertical", "horizontal"]
          : [c.layoutMode || "vertical"];
    setEditingMediaContestId(c.id || c.slug);
    setNewMediaForm({
      title: c.title || "",
      slug: c.slug || "",
      type: c.type || "IMAGE",
      startDate: (c.startDate || "2026-11-10T07:00").slice(0, 16),
      endDate: (c.endDate || "2026-11-24T07:00").slice(0, 16),
      submitStartDate: (c.submitStartDate || c.startDate || "2026-11-10T07:00").slice(0, 16),
      submitEndDate: (c.submitEndDate || "2026-11-18T07:00").slice(0, 16),
      voteStartDate: (c.voteStartDate || "2026-11-18T08:00").slice(0, 16),
      voteEndDate: (c.voteEndDate || c.endDate || "2026-11-24T07:00").slice(0, 16),
      displayStartDate: c.displayStartDate || "10/11/2026",
      displayEndDate: c.displayEndDate || "24/11/2026",
      bannerUrl: c.bannerUrl || "/images/contest_stage_banner.jpg",
      status: c.status || "PUBLISHED",
      description: c.description || "",
      themeColor: c.themeColor || "#1B7F5C",
      layoutMode: initModes.length >= 2 ? "both" : initModes[0] || "vertical",
      layoutModes: initModes,
      maxImagesPerSubmission: Number(c.maxImagesPerSubmission) > 0 ? Number(c.maxImagesPerSubmission) : 5,
      sortBy: c.sortBy || "votesCount",
      enableSocialShare: c.enableSocialShare ?? true,
      sharePlatforms: Array.isArray(c.sharePlatforms) ? c.sharePlatforms : ["facebook", "zalo"],
      requiredParticipantFields: Array.isArray(c.requiredParticipantFields)
        ? c.requiredParticipantFields
        : ["authorName", "authorPhone", "unitName", "description"],
      requireApproval: c.requireApproval ?? false,
      maxVotesPerUser: c.maxVotesPerUser ?? 3,
      contestPassword: c.contestPassword || "",
      showLeaderboard: c.showLeaderboard ?? true,
      showVoteCount: c.showVoteCount ?? true,
      showShareCount: c.showShareCount ?? true,
      rulesHtml: c.rulesHtml || c.description || "",
      rulesFileUrl: c.rulesFileUrl || "",
      announcement: c.announcement || "",
      organizerName: c.organizerName || "Ủy ban MTTQ Việt Nam & Đoàn Thanh niên xã Ea Súp",
      organizerAddress: c.organizerAddress || "72 Hùng Vương, xã Ea Súp, Tỉnh Đắk Lắk",
      organizerPhone: c.organizerPhone || "0888023023",
      organizerEmail: c.organizerEmail || "ubnd.easup@daklak.gov.vn",
    });
    setMediaSettingsSection("config");
    setShowCreateMediaModal(true);
  };

  const handleExportMediaContestExcel = async (c: any) => {
    try {
      const res = await fetch(`/api/media-contests/${c.slug}?t=${Date.now()}`, { cache: "no-store" });
      const data = await safeParseMediaResponse(res);
      const list = Array.isArray(data.submissions) ? [...data.submissions] : [];
      list.sort((a: any, b: any) => (b.votesCount || 0) - (a.votesCount || 0));

      const rows =
        list.length > 0
          ? list.map((s: any, idx: number) => ({
              "Hạng": idx + 1,
              "Mã bài": s.id,
              "Tên tác phẩm": s.title || "",
              "Tác giả": s.authorName || "",
              "Đơn vị / Thôn buôn": s.unitName || "",
              "Số điện thoại": s.authorPhone || "",
              "CCCD": s.authorCccd || "",
              "Số lượng ảnh": Array.isArray(s.mediaUrls) && s.mediaUrls.length > 0 ? s.mediaUrls.length : 1,
              "Bố cục": s.orientation === "horizontal" ? "Bố cục ngang" : "Bố cục dọc",
              "Lượt xem": s.viewsCount || 0,
              "Lượt bình chọn": s.votesCount || 0,
              "Lượt chia sẻ": s.sharesCount || 0,
              "Điểm BTC": s.score || 0,
              "Trạng thái": s.status === "APPROVED" ? "Đã duyệt" : s.status === "PENDING" ? "Chờ duyệt" : "Từ chối",
              "Ngày nộp": s.createdAt ? new Date(s.createdAt).toLocaleString("vi-VN") : "",
              "Mô tả tác phẩm": s.description || "",
            }))
          : [
              {
                "Hạng": "",
                "Mã bài": "",
                "Tên tác phẩm": "Chưa có tác phẩm dự thi nào",
                "Tác giả": "",
                "Đơn vị / Thôn buôn": "",
                "Số điện thoại": "",
                "CCCD": "",
                "Số lượng ảnh": 0,
                "Bố cục": "",
                "Lượt xem": 0,
                "Lượt bình chọn": 0,
                "Lượt chia sẻ": 0,
                "Điểm BTC": 0,
                "Trạng thái": "",
                "Ngày nộp": "",
                "Mô tả tác phẩm": "",
              },
            ];

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KetQuaBinhChon");
      XLSX.writeFile(wb, `ket_qua_binh_chon_${c.slug || "cuoc_thi_anh"}.xlsx`);
    } catch (err: any) {
      alert("Lỗi xuất file Excel: " + (err?.message || "Vui lòng thử lại"));
    }
  };

  // User Management State (Chỉ Quản trị viên - Admin)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminLoginEmail, setAdminLoginEmail] = useState("");
  const [adminLoginPassword, setAdminLoginPassword] = useState("");
  const [showAdminLoginPassword, setShowAdminLoginPassword] = useState(false);
  const [adminLoginRole, setAdminLoginRole] = useState<"ADMIN" | "USER">("ADMIN");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showUserFormPassword, setShowUserFormPassword] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
    status: "APPROVED" as "APPROVED" | "PENDING" | "REJECTED",
    organizationName: "",
  });

  const isAdmin = authUser?.role === "ADMIN";
  const isUser = authUser?.role === "USER";
  const pendingUsersCount = usersList.filter((u) => u.status === "PENDING").length;

  // Load Users (luôn lấy dữ liệu mới nhất không cache)
  const loadUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.error("Lỗi tải danh sách người dùng:", e);
    }
  };

  const handleApproveUser = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || (status === "APPROVED" ? "Phê duyệt tài khoản thành công!" : "Đã từ chối tài khoản!"));
        // Tự động đặt lại bộ lọc trạng thái về "ALL" để người dùng vừa duyệt xuất hiện ngay lập tức trong bảng với huy hiệu "Đã duyệt"
        setUserStatusFilter("ALL");
        await loadUsers();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleChangeRole = async (id: string, newRole: "ADMIN" | "USER") => {
    if (!confirm(`Bạn có chắc chắn muốn chuyển vai trò tài khoản này thành ${newRole === "ADMIN" ? "Quản trị viên (Admin)" : "Người dùng"}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHANGE_ROLE", role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadUsers();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  // Đặt lại mật khẩu người dùng về mặc định 12345678@
  const handleResetUserPassword = async (u: any) => {
    if (!confirm(`Bạn có chắc chắn muốn đặt lại mật khẩu của "${u.name}" về mật khẩu mặc định (12345678@)?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Đã đặt lại mật khẩu cho ${u.name} về 12345678@`);
        loadUsers();
      } else {
        alert(data.error || "Có lỗi xảy ra khi đặt lại mật khẩu");
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadUsers();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserFormData({
      name: "",
      email: "",
      phone: "",
      password: "12345678@",
      role: "USER",
      status: "APPROVED",
      organizationName: "Xã Ea Súp",
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      password: u.password || "",
      role: u.role,
      status: u.status,
      organizationName: u.organizationName || "",
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userFormData),
        });
        const data = await res.json();
        if (data.success) {
          alert("Cập nhật thông tin tài khoản thành công!");
          setShowUserModal(false);
          loadUsers();
        } else {
          alert(data.error || "Có lỗi xảy ra");
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userFormData),
        });
        const data = await res.json();
        if (data.success) {
          alert("Thêm mới tài khoản thành công!");
          setShowUserModal(false);
          loadUsers();
        } else {
          alert(data.error || "Có lỗi xảy ra");
        }
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleAdminFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginEmail.trim() || !adminLoginPassword.trim()) {
      alert("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminLoginEmail.trim(),
          password: adminLoginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Đăng nhập thất bại");
        return;
      }
      localStorage.setItem("cuocthi_admin_auth", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cuocthi_auth_change"));
      setAuthUser(data.user);
      setShowAdminLoginModal(false);
      if (data.user.role === "USER" && activeTab === "quan-ly-nguoi-dung") {
        setActiveTab("trac-nghiem");
      }
    } catch (err: any) {
      alert("Lỗi kết nối máy chủ khi đăng nhập: " + err.message);
    }
  };

  const handleQuickLoginAdmin = () => {
    const adminUser = {
      id: "user-admin-1",
      name: "Quản trị viên Hệ thống Ea Súp",
      email: "admin@easupso.com",
      phone: "0888023023",
      role: "ADMIN",
      status: "APPROVED",
      organizationName: "Trung tâm Điều hành & Chuyển đổi số Xã Ea Súp",
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem("cuocthi_admin_auth", JSON.stringify(adminUser));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cuocthi_auth_change"));
    setAuthUser(adminUser);
    setShowAdminLoginModal(false);
  };

  const handleQuickLoginUser = () => {
    const regularUser = {
      id: "user-regular-1",
      name: "Cán bộ Hội Nông dân Xã Ea Súp",
      email: "nongdan@easupso.com",
      phone: "0912345678",
      role: "USER",
      status: "APPROVED",
      organizationName: "Hội Nông dân xã Ea Súp",
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem("cuocthi_admin_auth", JSON.stringify(regularUser));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cuocthi_auth_change"));
    setAuthUser(regularUser);
    setShowAdminLoginModal(false);
    if (activeTab === "quan-ly-nguoi-dung") {
      setActiveTab("trac-nghiem");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cuocthi_admin_auth");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cuocthi_auth_change"));
    setAuthUser(null);
    if (activeTab === "quan-ly-nguoi-dung") {
      setActiveTab("trac-nghiem");
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUnitName.trim();
    if (trimmed && !unitsList.includes(trimmed)) {
      setUnitsList([...unitsList, trimmed]);
      setNewUnitName("");
    }
  };

  const handleRemoveUnit = (name: string) => {
    if (EA_SUP_VILLAGES.includes(name)) {
      alert("Đây là 20 Thôn, Buôn đơn vị hành chính chính thức của xã Ea Súp, không thể xóa!");
      return;
    }
    if (authUser?.role !== "ADMIN") {
      alert("Chỉ Quản trị viên (Admin) mới có quyền xóa các đơn vị dùng chung của toàn xã!");
      return;
    }
    setUnitsList(unitsList.filter((u) => u !== name));
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;
    const item = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      date: new Date().toLocaleDateString("vi-VN"),
      sender: authUser?.name || "Ban Tổ Chức Cuộc Thi",
      content: newAnnContent.trim(),
    };
    setAnnouncements([item, ...announcements]);
    setNewAnnTitle("");
    setNewAnnContent("");
  };

  // Định dạng thời điểm tạo cuộc thi (HH:mm - DD/MM/YYYY)
  const formatContestCreatedAt = (c: any) => {
    let rawDate = c?.createdAt;
    if (!rawDate && typeof c?.id === "string") {
      const match = c.id.match(/(?:contest|media)-(\d{10,14})/);
      if (match) {
        rawDate = Number(match[1]);
      }
    }
    if (!rawDate) {
      rawDate = c?.startTime || c?.startDate;
    }
    if (!rawDate) return "Chưa rõ";
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Helper lấy thông tin chi tiết tài khoản tạo cuộc thi trắc nghiệm
  const getContestCreatorInfo = (c: any) => {
    const rawEmail = (c?.creatorEmail || "").trim();
    const rawId = c?.creatorId || "";
    const rawName = (c?.creatorName || "").trim();

    // Đối chiếu với danh sách tài khoản người dùng thực tế
    const matchedUser = usersList.find(
      (u) =>
        (rawEmail && u.email?.toLowerCase() === rawEmail.toLowerCase()) ||
        (rawId && u.id === rawId)
    );

    const displayName =
      rawName ||
      matchedUser?.name ||
      (c?.organizerEmail && c.organizerEmail.toLowerCase() === rawEmail.toLowerCase() ? c.organizerName : "") ||
      (rawEmail ? rawEmail.split("@")[0] : "") ||
      c?.organizerName ||
      "Ban Tổ Chức";

    const displayEmail = rawEmail || matchedUser?.email || (c?.organizerEmail || "");
    const org = matchedUser?.organizationName || c?.organizationName || "";
    const filterKey = (rawEmail || rawId || rawName || displayName).toLowerCase().trim();

    return {
      name: displayName,
      email: displayEmail,
      org,
      filterKey,
      role: matchedUser?.role || (rawEmail === "admin@easupso.com" || rawEmail === "lehanhkt01@gmail.com" ? "ADMIN" : "USER"),
    };
  };

  // Danh sách cuộc thi mà tài khoản được quyền xem trong trang quản trị:
  // - Admin (Toàn quyền): Xem tất cả các cuộc thi trên hệ thống
  // - Người dùng cơ sở (USER): CHỈ XEM ĐƯỢC các cuộc thi do chính mình tạo
  // - Chưa đăng nhập: Không xem được danh sách quản trị
  const visibleContests = contests.filter((c) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    return canUserManageContest(c);
  });

  // Danh sách các tài khoản người tạo duy nhất để đưa vào Dropdown bộ lọc cuộc thi trắc nghiệm
  const contestCreators = React.useMemo(() => {
    const map = new Map<string, { key: string; name: string; email: string; count: number; org?: string }>();
    visibleContests.forEach((c) => {
      const info = getContestCreatorInfo(c);
      const key = info.filterKey;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: info.name,
          email: info.email,
          org: info.org,
          count: 1,
        });
      } else {
        map.get(key)!.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [visibleContests, usersList]);

  // Filtered contests theo từ khóa tìm kiếm, trạng thái và BỘ LỌC NGƯỜI TẠO
  const filteredContests = visibleContests.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.organizerName && c.organizerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.creatorName && c.creatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.creatorEmail && c.creatorEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && c.status === "PUBLISHED") ||
      (statusFilter === "DRAFT" && c.status === "DRAFT");

    if (creatorFilter === "ALL") {
      return matchesSearch && matchesStatus;
    }

    const info = getContestCreatorInfo(c);
    const targetKey = creatorFilter.toLowerCase().trim();
    const matchesCreator =
      info.filterKey === targetKey ||
      (info.email && info.email.toLowerCase() === targetKey) ||
      (c.creatorEmail && c.creatorEmail.toLowerCase() === targetKey) ||
      (c.creatorId && c.creatorId === creatorFilter);

    return matchesSearch && matchesStatus && matchesCreator;
  });

  // Helper lấy thông tin người tạo cuộc thi bình chọn Ảnh/Video
  const getMediaContestCreatorInfo = (c: any) => {
    const rawEmail = (c?.creatorEmail || "").trim();
    const rawId = c?.creatorId || "";
    const rawName = (c?.creatorName || "").trim();

    const matchedUser = usersList.find(
      (u) =>
        (rawEmail && u.email?.toLowerCase() === rawEmail.toLowerCase()) ||
        (rawId && u.id === rawId)
    );

    const displayName =
      rawName ||
      matchedUser?.name ||
      (rawEmail ? rawEmail.split("@")[0] : "") ||
      "Ban Tổ Chức";

    const displayEmail = rawEmail || matchedUser?.email || "";
    const filterKey = (rawEmail || rawId || rawName || displayName).toLowerCase().trim();

    return {
      name: displayName,
      email: displayEmail,
      filterKey,
    };
  };

  // Danh sách cuộc thi bình chọn Ảnh/Video phân quyền:
  // - Admin: Xem tất cả
  // - Người dùng: Chỉ xem cuộc thi do mình tạo
  const visibleMediaContests = mediaContests.filter((c) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    return canUserManageMediaContest(c);
  });

  const mediaContestCreators = React.useMemo(() => {
    const map = new Map<string, { key: string; name: string; email: string; count: number }>();
    visibleMediaContests.forEach((c) => {
      const info = getMediaContestCreatorInfo(c);
      const key = info.filterKey;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { key, name: info.name, email: info.email, count: 1 });
      } else {
        map.get(key)!.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [visibleMediaContests, usersList]);

  const filteredMediaContests = visibleMediaContests.filter((c) => {
    const q = mediaSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.customSlug && c.customSlug.toLowerCase().includes(q)) ||
      (c.organizerName && c.organizerName.toLowerCase().includes(q)) ||
      (c.creatorName && c.creatorName.toLowerCase().includes(q)) ||
      (c.creatorEmail && c.creatorEmail.toLowerCase().includes(q));

    const matchesStatus =
      mediaStatusFilter === "ALL" ||
      (mediaStatusFilter === "PUBLISHED" && c.status === "PUBLISHED") ||
      (mediaStatusFilter === "DRAFT" && c.status !== "PUBLISHED");

    if (mediaCreatorFilter === "ALL") return matchesSearch && matchesStatus;

    const info = getMediaContestCreatorInfo(c);
    const targetKey = mediaCreatorFilter.toLowerCase().trim();
    const matchesCreator =
      info.filterKey === targetKey ||
      (info.email && info.email.toLowerCase() === targetKey) ||
      (c.creatorEmail && c.creatorEmail.toLowerCase() === targetKey) ||
      (c.creatorId && c.creatorId === mediaCreatorFilter);

    return matchesSearch && matchesStatus && matchesCreator;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Administrative Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <img
                src="/logo.png"
                alt="Logo Cuộc thi trực tuyến"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-full shadow-xs"
              />
              <span className="text-base sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                THI TRỰC TUYẾN
              </span>
            </Link>
            {authUser && (
              <>
                <span className="hidden lg:inline text-slate-300">|</span>
                <span className="hidden lg:flex text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide items-center">
                  <Landmark className="w-4 h-4 mr-1 text-[#DC2626]" />
                  Bảng Điều Khiển Ban Tổ Chức
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {authUser ? (
              <>
                {/* Giao diện Mobile (< sm): Tinh gọn chỉ hiện các biểu tượng gọn gàng nhất (Ảnh 2) */}
                <div className="flex sm:hidden items-center space-x-1.5">
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border shadow-2xs ${
                      authUser.role === "ADMIN"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-blue-50 border-blue-300 text-blue-700"
                    }`}
                    title={`Đang đăng nhập: ${authUser.name} (${authUser.role === "ADMIN" ? "Quản trị viên" : "Người dùng"})`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(true)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs"
                    title="Đổi mật khẩu tài khoản"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Giao diện Desktop (>= sm): Hiển thị đầy đủ thông tin */}
                <div
                  className={`hidden sm:flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold shadow-2xs border ${
                    authUser.role === "ADMIN"
                      ? "bg-red-50 border-red-300 text-red-900"
                      : "bg-blue-50 border-blue-300 text-blue-900"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      authUser.role === "ADMIN" ? "bg-red-600" : "bg-blue-600"
                    }`}
                  ></span>
                  <span className="max-w-[160px] sm:max-w-[220px] truncate" title={authUser.name}>
                    {authUser.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      authUser.role === "ADMIN"
                        ? "text-red-700 bg-red-100"
                        : "text-blue-700 bg-blue-100"
                    }`}
                  >
                    {authUser.role === "ADMIN" ? "Admin (Toàn quyền)" : "Người dùng"}
                  </span>
                  {/* Nút Đổi mật khẩu tài khoản */}
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(true)}
                    className="p-1 rounded-full text-slate-500 hover:text-amber-600 hover:bg-amber-100/60 transition-colors cursor-pointer"
                    title="Đổi mật khẩu tài khoản"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 rounded-full text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdminLoginModal(true)}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-xs cursor-pointer"
                title="Đăng nhập tài khoản"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                <span>Đăng nhập</span>
              </button>
            )}

            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors hidden sm:inline-block"
            >
              Về Cổng Thi
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container: 2 Columns Layout when logged in, or Full-width Contest List when not logged in */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* ========================================================= */}
          {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG (Chỉ hiển thị khi đã đăng nhập) */}
          {/* ========================================================= */}
          {authUser && (
            <aside className="w-full md:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm space-y-4">
              {/* 1. Trang chủ */}
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-slate-700 hover:bg-slate-50 transition-colors text-sm font-semibold group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Home className="w-4 h-4" />
                </div>
                <span className="group-hover:text-slate-900">Trang chủ</span>
              </Link>

              {/* 2. Cuộc thi Trắc nghiệm (Active State như Ảnh 2) */}
              <button
                type="button"
                onClick={() => setActiveTab("trac-nghiem")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === "trac-nghiem"
                    ? "bg-slate-100/90 text-slate-900 shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    activeTab === "trac-nghiem"
                      ? "bg-[#DC2626] text-white shadow-xs"
                      : "bg-red-50 text-[#DC2626]"
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                </div>
                <span>Cuộc thi Trắc nghiệm</span>
              </button>

              {/* 3. Cuộc thi Ảnh/Video */}
              <button
                type="button"
                onClick={() => setActiveTab("anh-video")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === "anh-video"
                    ? "bg-slate-100 text-slate-900 shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                      activeTab === "anh-video"
                        ? "bg-[#DC2626] text-white"
                        : "bg-red-50 text-[#DC2626]"
                    }`}
                  >
                    <Navigation className="w-4 h-4 fill-current rotate-45" />
                  </div>
                  <span className="font-bold text-slate-800">Cuộc thi Ảnh/Video</span>
                </div>
              </button>

              {/* 5. PHÂN MỤC: KHO NỘI DUNG */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider mb-2 px-3">
                  KHO NỘI DUNG
                </div>

                {/* Đề thi */}
                <button
                  type="button"
                  onClick={() => setActiveTab("de-thi")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    activeTab === "de-thi"
                      ? "bg-red-50 text-[#DC2626] font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>Đề thi</span>
                </button>

                {/* Thông báo BTC */}
                <button
                  type="button"
                  onClick={() => setActiveTab("thong-bao")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    activeTab === "thong-bao"
                      ? "bg-red-50 text-[#DC2626] font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>Thông báo BTC</span>
                </button>

                {/* Đơn vị */}
                <button
                  type="button"
                  onClick={() => setActiveTab("don-vi")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    activeTab === "don-vi"
                      ? "bg-red-50 text-[#DC2626] font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Building className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>Đơn vị</span>
                </button>
              </div>

              {/* 6. PHÂN QUYỀN & QUẢN TRỊ NGƯỜI DÙNG (CHỈ ADMIN MỚI THẤY) */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-black uppercase text-red-600 tracking-wider mb-2 px-3 flex items-center justify-between">
                    <span>QUẢN TRỊ HỆ THỐNG</span>
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">Admin</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("quan-ly-nguoi-dung")}
                    className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      activeTab === "quan-ly-nguoi-dung"
                        ? "bg-red-50 text-[#DC2626] shadow-2xs"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-[#DC2626] shrink-0" />
                      <span className="whitespace-nowrap">Người dùng &amp; Xét duyệt</span>
                    </div>
                    {pendingUsersCount > 0 && (
                      <span
                        className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shrink-0 ml-1 animate-pulse"
                        title={`${pendingUsersCount} tài khoản chờ xét duyệt`}
                      >
                        {pendingUsersCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* ========================================================= */}
          {/* CỘT PHẢI: NỘI DUNG CHÍNH (Ảnh 2) */}
          {/* ========================================================= */}
          <main className="flex-1 min-w-0 space-y-6 w-full">
            {/* PHẦN ĐẦU TRANG & 3 THẺ TỔ CHỨC CUỘC THI: CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP Ở TAB TRẮC NGHIỆM */}
            {authUser && activeTab === "trac-nghiem" && (
              <>
                {/* TIÊU ĐỀ CHÍNH: TỔ CHỨC CUỘC THI TRỰC TUYẾN */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight uppercase">
                      TỔ CHỨC CUỘC THI TRỰC TUYẾN
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quản lý, điều hành và khởi tạo cuộc thi cho cán bộ, đoàn viên và nhân dân xã Ea Súp
                    </p>
                  </div>
                </div>

                {/* KHỐI 3 THẺ: TẠO MỚI (Cam) + HƯỚNG DẪN (Tím) + BANNER ROBOT AI (Ảnh 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
                  {/* Thẻ 1: Tạo mới (Nút cam lớn với icon +) - Chỉ hiển thị khi đã đăng nhập */}
                  {authUser && (
                    <div className="sm:col-span-3 lg:col-span-2">
                      <Link
                        href="/admin/tao-cuoc-thi"
                        className="h-full bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#EA580C] group-hover:bg-[#C2410C] text-white flex items-center justify-center shadow-md mb-2 transition-transform group-hover:scale-105">
                          <Plus className="w-9 h-9 stroke-[2.5]" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-[#EA580C] transition-colors">
                          Tạo mới
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Thẻ 2: Hướng dẫn (Nút tím lớn với icon cuốn sách) */}
                  <div className={authUser ? "sm:col-span-3 lg:col-span-2" : "sm:col-span-4 lg:col-span-3"}>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="w-full h-full bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#7C3AED] group-hover:bg-[#6D28D9] text-white flex items-center justify-center shadow-md mb-2 transition-transform group-hover:scale-105">
                        <BookOpen className="w-9 h-9 stroke-[2.2]" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-[#7C3AED] transition-colors">
                        Hướng dẫn
                      </span>
                    </button>
                  </div>

                  {/* Thẻ 3: Banner Robot AI Tết / Trợ lý AI Gemini (Ảnh 2) */}
                  <div className={`${authUser ? "sm:col-span-6 lg:col-span-8" : "sm:col-span-8 lg:col-span-9"} bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl overflow-hidden shadow-sm border border-red-500 text-white relative min-h-[140px] flex items-center`}>
                    <div className="p-5 sm:p-6 z-10 max-w-[62%] sm:max-w-[65%]">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-800/60 backdrop-blur-xs text-[10px] font-bold text-red-100 uppercase tracking-wider mb-2 border border-red-400/40">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Trợ Lý AI Gemini Đọc Luật</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black leading-tight text-white mb-1">
                        Soạn Đề Thi Trắc Nghiệm Tự Động Trong 3 Giây
                      </h3>
                      <p className="text-xs text-red-100 hidden sm:block leading-relaxed line-clamp-2">
                        Tải lên văn bản pháp luật (.pdf, .docx), AI tự động tạo ngân hàng câu hỏi kèm trích dẫn điều khoản luật chuẩn xác.
                      </p>
                    </div>

                    {/* Banner Illustration */}
                    <div className="absolute right-0 top-0 bottom-0 w-44 sm:w-56 overflow-hidden">
                      <img
                        src="/images/ai_robot_banner.jpg"
                        alt="AI Robot Assistant Ea Sup"
                        className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-transparent to-transparent"></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 1: DANH SÁCH CUỘC THI TRẮC NGHIỆM */}
            {/* ========================================================= */}
            {!authUser ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center my-6 shadow-xs max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Yêu Cầu Đăng Nhập
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Vui lòng đăng nhập tài khoản Quản trị viên (Admin) hoặc tài khoản Người dùng đã được phê duyệt để quản lý các cuộc thi của đơn vị bạn.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(true)}
                  className="w-full py-3 rounded-full text-sm font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập hệ thống</span>
                </button>
              </div>
            ) : activeTab === "trac-nghiem" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                    DANH SÁCH CUỘC THI
                  </h2>

                  {/* Filter Status Tabs */}
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setStatusFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        statusFilter === "ALL"
                          ? "bg-[#DC2626] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tất cả ({visibleContests.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("PUBLISHED")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        statusFilter === "PUBLISHED"
                          ? "bg-[#DC2626] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Đang diễn ra ({visibleContests.filter((c) => c.status === "PUBLISHED").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("DRAFT")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        statusFilter === "DRAFT"
                          ? "bg-[#DC2626] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Bản nháp ({visibleContests.filter((c) => c.status === "DRAFT").length})
                    </button>
                  </div>
                </div>

                {/* Search Bar & Bộ lọc người tạo */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Search Bar */}
                  <div className="relative sm:col-span-7 lg:col-span-8">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm theo tên cuộc thi, đường dẫn slug hoặc người tạo..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-red-600 shadow-2xs"
                    />
                  </div>

                  {/* Dropdown Bộ lọc danh sách người tạo */}
                  <div className="sm:col-span-5 lg:col-span-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <select
                        value={creatorFilter}
                        onChange={(e) => setCreatorFilter(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-red-600 appearance-none font-medium text-slate-700 cursor-pointer shadow-2xs truncate"
                        title="Lọc danh sách theo tài khoản người tạo"
                      >
                        <option value="ALL">👤 Tất cả người tạo ({visibleContests.length})</option>
                        {contestCreators.map((cr) => (
                          <option key={cr.key} value={cr.key}>
                            {cr.name} ({cr.count} cuộc thi)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {creatorFilter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => setCreatorFilter("ALL")}
                        className="px-2.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Bỏ lọc người tạo"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter tags summary nếu đang lọc theo người tạo */}
                {creatorFilter !== "ALL" && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Filter className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Đang lọc theo người tạo:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {contestCreators.find((cr) => cr.key === creatorFilter)?.name || creatorFilter}
                    </span>
                    <span className="text-slate-400">({filteredContests.length} cuộc thi)</span>
                    <button
                      type="button"
                      onClick={() => setCreatorFilter("ALL")}
                      className="ml-auto text-red-600 hover:text-red-700 font-semibold hover:underline"
                    >
                      Bỏ lọc
                    </button>
                  </div>
                )}

                {/* List of Contests Cards */}
                {filteredContests.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs sm:text-sm">
                    {authUser?.role === "ADMIN"
                      ? "Không tìm thấy cuộc thi nào phù hợp với bộ lọc hiện tại. Hãy thử chọn Tất cả người tạo hoặc bấm nút Tạo mới!"
                      : "Bạn chưa tạo cuộc thi nào. Hãy bấm nút Tạo mới để bắt đầu khởi tạo cuộc thi của đơn vị mình!"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {filteredContests.map((c) => {
                      const creatorInfo = getContestCreatorInfo(c);
                      const creatorEmail = creatorInfo.email || c.creatorEmail || "hethong@easupso.com";
                      return (
                      <div
                        key={c.id}
                        className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-2"
                      >
                        {/* HÀNG 1: THUMBNAIL + THÔNG TIN CHÍNH + CỤM NÚT HÀNH ĐỘNG GỌN GÀNG */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                          {/* Trái: Ảnh và Tiêu đề, Đơn vị, Email người tạo */}
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            {/* Contest Thumbnail gọn gàng 40x40 */}
                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                              <img
                                src={c.bannerUrl || "/banners/banner-nong-dan-ea-sup.jpg"}
                                alt={c.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/banners/banner-nong-dan-ea-sup.jpg";
                                }}
                              />
                            </div>

                            {/* Contest Info */}
                            <div className="min-w-0 flex-1">
                              {/* Meta: Trạng thái • Đơn vị • Email người tạo (1 dòng flex-nowrap thẳng hàng, không xuống dòng) */}
                              <div className="flex items-center gap-1.5 text-xs overflow-hidden whitespace-nowrap">
                                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                  c.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {c.status === "PUBLISHED" ? "ĐANG DIỄN RA" : "BẢN NHÁP"}
                                </span>
                                <span className="shrink-0 text-slate-300">•</span>
                                <span className="font-semibold text-slate-700 truncate max-w-[130px] sm:max-w-[200px]" title={c.organizerName}>
                                  {c.organizerName || "UBND Xã Ea Súp"}
                                </span>
                                <span className="shrink-0 text-slate-300">•</span>
                                
                                {/* Rút gọn thông tin người tạo chỉ cần email đăng nhập */}
                                <button
                                  type="button"
                                  onClick={() => setCreatorFilter(creatorInfo.filterKey)}
                                  title={`Bấm để lọc cuộc thi do ${creatorEmail} tạo`}
                                  className="inline-flex items-center text-[11px] font-mono text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-1.5 py-0.2 rounded border border-slate-200 transition-colors cursor-pointer shrink-0 truncate max-w-[150px] sm:max-w-[190px]"
                                >
                                  <Mail className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                  <span className="truncate">{creatorEmail}</span>
                                </button>

                                {/* Badge thông báo nếu user hiện tại là người được chia sẻ quyền */}
                                {authUser && Array.isArray(c.sharedEmails) && c.sharedEmails.some((e: string) => (e || "").toLowerCase().trim() === (authUser.email || "").toLowerCase().trim()) && (
                                  <span
                                    className="shrink-0 inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 select-none"
                                    title="Bạn được chia sẻ quyền quản lý, chỉnh sửa cuộc thi này"
                                  >
                                    🤝 Được chia sẻ
                                  </span>
                                )}
                              </div>

                              {/* Tiêu đề cuộc thi: Rõ nét, 1 dòng gọn gàng */}
                              <h3 className="text-sm font-bold text-slate-900 leading-snug truncate mt-0.5" title={c.title}>
                                {c.title}
                              </h3>
                            </div>
                          </div>

                          {/* Phải: Cụm nút hành động tinh gọn, tiết kiệm không gian */}
                          <div className="flex items-center gap-1 shrink-0 self-end xl:self-center">
                            <Link
                              href={`/thi/${c.slug}`}
                              target="_blank"
                              className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs"
                              title="Xem giao diện phòng thi"
                            >
                              <Eye className="w-3.5 h-3.5 sm:mr-1 text-slate-500" />
                              <span className="hidden sm:inline">Phòng thi</span>
                            </Link>

                            <Link
                              href={`/ket-qua/${c.slug}`}
                              className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs"
                              title="Xem bảng xếp hạng kết quả"
                            >
                              <BarChart2 className="w-3.5 h-3.5 sm:mr-1 text-slate-500" />
                              <span className="hidden sm:inline">Xếp hạng</span>
                            </Link>

                            {authUser && (
                              <a
                                href={`/api/contests/${c.slug}/export`}
                                download
                                className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs"
                                title="Tải file Excel kết quả"
                              >
                                <Download className="w-3.5 h-3.5 sm:mr-1 text-emerald-600" />
                                <span className="hidden sm:inline">Xuất Excel</span>
                              </a>
                            )}

                            {/* NÚT CHIA SẺ QUYỀN QUẢN LÝ / CHỈNH SỬA CUỘC THI CHO NGƯỜI KHÁC (ẢNH 1) */}
                            {canUserShareContest(c) && (
                              <button
                                type="button"
                                onClick={() => setSelectedContestForShare(c)}
                                className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs cursor-pointer"
                                title="Thiết lập chia sẻ quyền quản lý, chỉnh sửa cuộc thi cho người khác"
                              >
                                <Share2 className="w-3.5 h-3.5 sm:mr-1 text-indigo-600" />
                                <span className="hidden sm:inline">Chia sẻ</span>
                                {Array.isArray(c.sharedEmails) && c.sharedEmails.length > 0 && (
                                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-600 text-white font-mono font-bold">
                                    {c.sharedEmails.length}
                                  </span>
                                )}
                              </button>
                            )}

                            {canUserManageContest(c) ? (
                              <>
                                <Link
                                  href={`/admin/tao-cuoc-thi?edit=${c.slug}&step=1`}
                                  className="px-2.5 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors inline-flex items-center shadow-xs cursor-pointer"
                                  title={`Chỉnh sửa cuộc thi: ${c.title}`}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
                                </Link>

                                {canUserShareContest(c) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteContest(c.slug, c.title)}
                                    className="p-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors inline-flex items-center cursor-pointer"
                                    title="Xóa cuộc thi này khỏi hệ thống"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span
                                className="px-2 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs font-medium border border-slate-200 inline-flex items-center select-none"
                                title="Cuộc thi này do đơn vị khác tạo"
                              >
                                <Lock className="w-3.5 h-3.5 mr-1" /> Khóa
                              </span>
                            )}
                          </div>
                        </div>

                        {/* HÀNG 2: THÔNG SỐ VÀ CỤM TIỆN ÍCH LINK RÚT GỌN / QR CODE TRÊN CÙNG 1 DÒNG */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs text-slate-500">
                          {/* Thông số cuộc thi */}
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className="inline-flex items-center text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80"
                              title="Thời điểm khởi tạo cuộc thi"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1 text-[#DC2626] shrink-0" />
                              <span>
                                Tạo lúc: <strong className="font-semibold text-slate-800">{formatContestCreatedAt(c)}</strong>
                              </span>
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {c.durationMinutes || 15} phút/lượt
                            </span>
                            <span className="flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {c.units?.length || 20} đơn vị tham gia
                            </span>
                            {c.clickCount ? (
                              <span className="flex items-center font-semibold text-slate-600" title="Số lượt click qua link rút gọn">
                                <Eye className="w-3 h-3 mr-1 text-slate-400" />
                                {c.clickCount} lượt truy cập
                              </span>
                            ) : null}
                          </div>

                          {/* Cụm Link rút gọn & QR Code nhỏ gọn, liền mạch */}
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                            <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Link:</span>
                            <span className="font-mono text-xs font-bold text-red-600 max-w-[200px] truncate" title={`https://thi.easupso.com/r/${c.customSlug || c.slug}`}>
                              /r/{c.customSlug || c.slug}
                            </span>

                            {/* Nút Sao chép link 1-chạm */}
                            <button
                              type="button"
                              onClick={() => handleCopyContestShortlink(c)}
                              className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Sao chép link rút gọn 1-chạm"
                            >
                              {copiedContestSlug === c.slug ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Nút Mã QR */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedContestForShortlink(c);
                                setShortlinkModalTab("qr-code");
                              }}
                              className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Tạo mã QR và tải ảnh PNG in ấn"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Tùy chỉnh link */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedContestForShortlink(c);
                                setShortlinkModalTab("custom-link");
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-red-300 text-[11px] font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Tùy chỉnh link rút gọn"
                            >
                              <Link2 className="w-3 h-3 inline mr-1" />
                              Tùy chỉnh
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 2: CUỘC THI ẢNH / VIDEO (Đồng bộ giao diện thẻ ngang như Trắc nghiệm - Ảnh 2) */}
            {/* ========================================================= */}
            {authUser && activeTab === "anh-video" && (
              <div className="space-y-4">
                {/* TIÊU ĐỀ & KHỐI TẠO MỚI CUỘC THI ẢNH / VIDEO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight uppercase">
                      TỔ CHỨC CUỘC THI ẢNH / VIDEO TRỰC TUYẾN
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quản lý, điều hành và bình chọn tác phẩm ảnh đẹp, video tuyên truyền của các cơ quan, đơn vị xã Ea Súp
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMediaContestId(null);
                        setNewMediaForm(defaultMediaFormState);
                        setMediaSettingsSection("config");
                        setShowCreateMediaModal(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Thêm mới cuộc thi ảnh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPlanTemplateModal(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>Mẫu kế hoạch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Hướng dẫn</span>
                    </button>
                  </div>
                </div>

                {/* HEADER DANH SÁCH CUỘC THI & FILTER TABS (Đồng bộ 100% với Ảnh 2) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2 pt-1">
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                    DANH SÁCH CUỘC THI
                  </h2>

                  {/* Filter Status Tabs */}
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setMediaStatusFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        mediaStatusFilter === "ALL"
                          ? "bg-[#DC2626] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tất cả ({visibleMediaContests.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaStatusFilter("PUBLISHED")}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        mediaStatusFilter === "PUBLISHED"
                          ? "bg-[#DC2626] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Đang diễn ra ({visibleMediaContests.filter((c) => c.status === "PUBLISHED").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaStatusFilter("DRAFT")}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        mediaStatusFilter === "DRAFT"
                          ? "bg-[#DC2626] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Bản nháp ({visibleMediaContests.filter((c) => c.status !== "PUBLISHED").length})
                    </button>
                  </div>
                </div>

                {/* Search Bar & Bộ lọc người tạo (Đồng bộ 100% với Ảnh 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Search Bar */}
                  <div className="relative sm:col-span-7 lg:col-span-8">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={mediaSearchQuery}
                      onChange={(e) => setMediaSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm theo tên cuộc thi, đường dẫn slug hoặc người tạo..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-red-600 shadow-2xs"
                    />
                  </div>

                  {/* Dropdown Bộ lọc danh sách người tạo */}
                  <div className="sm:col-span-5 lg:col-span-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <select
                        value={mediaCreatorFilter}
                        onChange={(e) => setMediaCreatorFilter(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-red-600 appearance-none font-medium text-slate-700 cursor-pointer shadow-2xs truncate"
                        title="Lọc danh sách theo tài khoản người tạo"
                      >
                        <option value="ALL">👤 Tất cả người tạo ({visibleMediaContests.length})</option>
                        {mediaContestCreators.map((cr) => (
                          <option key={cr.key} value={cr.key}>
                            {cr.name} ({cr.count} cuộc thi)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {mediaCreatorFilter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => setMediaCreatorFilter("ALL")}
                        className="px-2.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Bỏ lọc người tạo"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter tags summary nếu đang lọc theo người tạo */}
                {mediaCreatorFilter !== "ALL" && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Filter className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Đang lọc theo người tạo:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {mediaContestCreators.find((cr) => cr.key === mediaCreatorFilter)?.name || mediaCreatorFilter}
                    </span>
                    <span className="text-slate-400">({filteredMediaContests.length} cuộc thi)</span>
                    <button
                      type="button"
                      onClick={() => setMediaCreatorFilter("ALL")}
                      className="ml-auto text-red-600 hover:text-red-700 font-semibold hover:underline cursor-pointer"
                    >
                      Bỏ lọc
                    </button>
                  </div>
                )}

                {/* Danh sách thẻ ngang Cuộc thi Ảnh / Video (Đồng bộ 100% bố cục Ảnh 2) */}
                {filteredMediaContests.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs sm:text-sm">
                    {authUser?.role === "ADMIN"
                      ? "Không tìm thấy cuộc thi ảnh/video nào phù hợp với bộ lọc hiện tại. Hãy thử chọn Tất cả người tạo hoặc bấm nút Thêm mới!"
                      : "Bạn chưa tạo cuộc thi ảnh/video nào. Hãy bấm nút Thêm mới cuộc thi ảnh để bắt đầu khởi tạo!"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {filteredMediaContests.map((c) => {
                      const mediaCreatorInfo = getMediaContestCreatorInfo(c);
                      const creatorEmail =
                        mediaCreatorInfo.email ||
                        c.creatorEmail ||
                        c.organizerEmail ||
                        "hethong@easupso.com";
                      return (
                        <div
                          key={c.id}
                          className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-2"
                        >
                          {/* HÀNG 1: THUMBNAIL + THÔNG TIN CHÍNH + CỤM NÚT HÀNH ĐỘNG GỌN GÀNG */}
                          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                            {/* Trái: Ảnh và Tiêu đề, Đơn vị, Email người tạo */}
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              {/* Contest Thumbnail gọn gàng 40x40 */}
                              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                                <img
                                  src={c.bannerUrl || "/images/contest_stage_banner.jpg"}
                                  alt={c.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/images/contest_stage_banner.jpg";
                                  }}
                                />
                              </div>

                              {/* Contest Info */}
                              <div className="min-w-0 flex-1">
                                {/* Meta: Trạng thái • Đơn vị • Email người tạo */}
                                <div className="flex items-center gap-1.5 text-xs overflow-hidden whitespace-nowrap">
                                  <span
                                    className={`shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                      c.status === "PUBLISHED"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {c.status === "PUBLISHED" ? "ĐANG DIỄN RA" : "BẢN NHÁP"}
                                  </span>
                                  <span className="shrink-0 text-slate-300">•</span>
                                  <span
                                    className="font-semibold text-slate-700 truncate max-w-[130px] sm:max-w-[200px]"
                                    title={c.organizerName || mediaCreatorInfo.name}
                                  >
                                    {c.organizerName || mediaCreatorInfo.name || "UBND Xã Ea Súp"}
                                  </span>
                                  <span className="shrink-0 text-slate-300">•</span>

                                  {/* Rút gọn thông tin người tạo chỉ cần email đăng nhập */}
                                  <button
                                    type="button"
                                    onClick={() => setMediaCreatorFilter(mediaCreatorInfo.filterKey)}
                                    title={`Bấm để lọc cuộc thi do ${creatorEmail} tạo`}
                                    className="inline-flex items-center text-[11px] font-mono text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-1.5 py-0.2 rounded border border-slate-200 transition-colors cursor-pointer shrink-0 truncate max-w-[150px] sm:max-w-[190px]"
                                  >
                                    <Mail className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                    <span className="truncate">{creatorEmail}</span>
                                  </button>

                                  {/* Badge thông báo nếu user hiện tại là người được chia sẻ quyền */}
                                  {authUser &&
                                    Array.isArray(c.sharedEmails) &&
                                    c.sharedEmails.some(
                                      (e: string) =>
                                        (e || "").toLowerCase().trim() ===
                                        (authUser.email || "").toLowerCase().trim()
                                    ) && (
                                      <span
                                        className="shrink-0 inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 select-none"
                                        title="Bạn được chia sẻ quyền quản lý, chỉnh sửa cuộc thi này"
                                      >
                                        🤝 Được chia sẻ
                                      </span>
                                    )}
                                </div>

                                {/* Tiêu đề cuộc thi: Rõ nét, đầy đủ như Ảnh 2 */}
                                <h3
                                  className="text-sm font-bold text-slate-900 leading-snug truncate mt-0.5 uppercase"
                                  title={c.title}
                                >
                                  <Link
                                    href={`/binh-chon/${c.slug}`}
                                    target="_blank"
                                    className="hover:text-[#DC2626] transition-colors"
                                  >
                                    {c.title}
                                  </Link>
                                </h3>
                              </div>
                            </div>

                            {/* Phải: Cụm nút hành động chuẩn Ảnh 2 (Phòng thi, Xếp hạng, Xuất Excel, Chia sẻ, Sửa, Xóa) */}
                            <div className="flex items-center gap-1 shrink-0 self-end xl:self-center">
                              <Link
                                href={`/binh-chon/${c.slug}`}
                                target="_blank"
                                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs"
                                title="Xem giao diện phòng bình chọn ảnh/video"
                              >
                                <Eye className="w-3.5 h-3.5 sm:mr-1 text-slate-500" />
                                <span className="hidden sm:inline">Phòng thi</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleViewSubmissions(c)}
                                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs cursor-pointer"
                                title="Xem bảng xếp hạng & danh sách tác phẩm dự thi"
                              >
                                <BarChart2 className="w-3.5 h-3.5 sm:mr-1 text-slate-500" />
                                <span className="hidden sm:inline">Xếp hạng</span>
                              </button>

                              {authUser && (
                                <button
                                  type="button"
                                  onClick={() => handleExportMediaContestExcel(c)}
                                  className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs cursor-pointer"
                                  title="Tải file Excel kết quả bình chọn (.xlsx)"
                                >
                                  <Download className="w-3.5 h-3.5 sm:mr-1 text-emerald-600" />
                                  <span className="hidden sm:inline">Xuất Excel</span>
                                </button>
                              )}

                              {/* NÚT CHIA SẺ QUYỀN QUẢN LÝ / CHỈNH SỬA CUỘC THI CHO NGƯỜI KHÁC */}
                              {canUserShareMediaContest(c) && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedContestForShare(c)}
                                  className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors inline-flex items-center shadow-2xs cursor-pointer"
                                  title="Thiết lập chia sẻ quyền quản lý, chỉnh sửa cuộc thi cho người khác"
                                >
                                  <Share2 className="w-3.5 h-3.5 sm:mr-1 text-indigo-600" />
                                  <span className="hidden sm:inline">Chia sẻ</span>
                                  {Array.isArray(c.sharedEmails) && c.sharedEmails.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-600 text-white font-mono font-bold">
                                      {c.sharedEmails.length}
                                    </span>
                                  )}
                                </button>
                              )}

                              {canUserManageMediaContest(c) ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditMediaContest(c)}
                                    className="px-2.5 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors inline-flex items-center shadow-xs cursor-pointer"
                                    title={`Chỉnh sửa & cài đặt cuộc thi: ${c.title}`}
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
                                  </button>

                                  {canUserShareMediaContest(c) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMediaContests(c.id)}
                                      className="p-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors inline-flex items-center cursor-pointer"
                                      title="Xóa cuộc thi này khỏi hệ thống"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span
                                  className="px-2 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs font-medium border border-slate-200 inline-flex items-center select-none"
                                  title="Cuộc thi này do đơn vị khác tạo"
                                >
                                  <Lock className="w-3.5 h-3.5 mr-1" /> Khóa
                                </span>
                              )}
                            </div>
                          </div>

                          {/* HÀNG 2: THÔNG SỐ VÀ CỤM TIỆN ÍCH LINK RÚT GỌN / QR CODE TRÊN CÙNG 1 DÒNG */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs text-slate-500">
                            {/* Thông số cuộc thi */}
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className="inline-flex items-center text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80"
                                title="Thời điểm khởi tạo cuộc thi"
                              >
                                <Calendar className="w-3.5 h-3.5 mr-1 text-[#DC2626] shrink-0" />
                                <span>
                                  Tạo lúc:{" "}
                                  <strong className="font-semibold text-slate-800">
                                    {formatContestCreatedAt(c)}
                                  </strong>
                                </span>
                              </span>

                              <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {c.displayStartDate || "10/11/2026"} - {c.displayEndDate || "24/11/2026"}
                              </span>

                              <span className="flex items-center">
                                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {c.submissionsCount ?? 0} tác phẩm dự thi
                              </span>

                              <span className="flex items-center">
                                <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                Tối đa {c.maxImagesPerSubmission || 5} hình/bài
                              </span>

                              {c.clickCount ? (
                                <span
                                  className="flex items-center font-semibold text-slate-600"
                                  title="Số lượt click qua link rút gọn"
                                >
                                  <Eye className="w-3 h-3 mr-1 text-slate-400" />
                                  {c.clickCount} lượt truy cập
                                </span>
                              ) : null}
                            </div>

                            {/* Cụm Link rút gọn & QR Code nhỏ gọn, liền mạch chuẩn Ảnh 2 */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                              <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
                                Link:
                              </span>
                              <span
                                className="font-mono text-xs font-bold text-red-600 max-w-[200px] truncate"
                                title={`https://thi.easupso.com/r/${c.customSlug || c.slug}`}
                              >
                                /r/{c.customSlug || c.slug}
                              </span>

                              {/* Nút Sao chép link 1-chạm */}
                              <button
                                type="button"
                                onClick={() => handleCopyContestShortlink(c)}
                                className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Sao chép link rút gọn 1-chạm"
                              >
                                {copiedContestSlug === c.slug ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Nút Mã QR */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContestForShortlink(c);
                                  setShortlinkModalTab("qr-code");
                                }}
                                className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Tạo mã QR và tải ảnh PNG in ấn"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút Tùy chỉnh link */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContestForShortlink(c);
                                  setShortlinkModalTab("custom-link");
                                }}
                                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-red-300 text-[11px] font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Tùy chỉnh link rút gọn"
                              >
                                <Link2 className="w-3 h-3 inline mr-1" />
                                Tùy chỉnh
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 3: KHO NỘI DUNG -> ĐỀ THI */}
            {/* ========================================================= */}
            {authUser && activeTab === "de-thi" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
                {/* TIÊU ĐỀ & CÁC NÚT THAO TÁC HÀNG ĐẦU */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
                      <span>Quản trị</span>
                      <span>/</span>
                      <span>Kho nội dung</span>
                      <span>/</span>
                      <span className="text-[#DC2626] font-bold">Đề thi</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center flex-wrap gap-2">
                      <div className="flex items-center">
                        <FileText className="w-6 h-6 mr-2 text-[#DC2626] shrink-0" />
                        <span>KHO ĐỀ THI &amp; NGÂN HÀNG CÂU HỎI</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full normal-case">
                        {questions.length} câu
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Quản lý ngân hàng câu hỏi, phân chia theo từng bộ đề độc lập và bảo mật quyền sở hữu riêng tư
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút Tải file Excel mẫu */}
                    <a
                      href="/api/questions/template"
                      download="mau_de_thi_trac_nghiem_ea_sup.xlsx"
                      className="inline-flex items-center px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      title="Tải tệp mẫu Excel chuẩn để soạn câu hỏi trắc nghiệm"
                    >
                      <Download className="w-4 h-4 mr-1.5 text-emerald-600" />
                      <span>Tải file Excel mẫu</span>
                    </a>

                    {/* Nút Nhập đồng loạt đề thi (Chỉ khi đã đăng nhập) */}
                    {authUser && (
                      <button
                        type="button"
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Tải lên tệp Excel chứa danh sách câu hỏi để nhập đồng loạt vào hệ thống"
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        <span>Nhập đồng loạt đề thi</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* THANH BỘ ĐỀ (PACKAGE FILTER & SEARCH) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                      <Layers className="w-4 h-4 text-[#DC2626]" />
                      <span>Bộ Đề Thi ({packagesList.length} bộ đề):</span>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={questionSearchQuery}
                        onChange={(e) => {
                          setQuestionSearchQuery(e.target.value);
                          loadQuestionBank(selectedPackageId, e.target.value);
                        }}
                        placeholder="Tìm câu hỏi, điều khoản luật..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Pills danh sách bộ đề */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPackageId("ALL")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedPackageId === "ALL"
                          ? "bg-[#DC2626] text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Tất cả ({packagesList.reduce((acc, p) => acc + (p.questionCount || 0), 0)})
                    </button>

                    {packagesList.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      const isOwner = canUserManagePackage(pkg);
                      return (
                        <div key={pkg.id} className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                              isSelected
                                ? "bg-[#DC2626] text-white shadow-xs font-bold"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span>{pkg.isSystem ? "🏛️" : "📁"}</span>
                            <span className="max-w-[200px] truncate">{pkg.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {pkg.questionCount || 0}
                            </span>
                            {!pkg.isSystem && (
                              <span title="Chỉ bạn có quyền quản trị bộ đề này">
                                <Lock
                                  className={`w-3 h-3 ${isSelected ? "text-white" : "text-amber-600"}`}
                                />
                              </span>
                            )}
                          </button>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                              className="ml-1 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={`Xóa bộ đề "${pkg.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DANH SÁCH CÂU HỎI */}
                {questions.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    Không có câu hỏi nào trong bộ đề này. Hãy bấm nút{" "}
                    <strong className="text-blue-600">"Nhập đồng loạt đề thi"</strong> để tải tệp
                    Excel lên!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-[#DC2626]">[{q.category}]</span>
                            {q.packageName && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-semibold">
                                📁 {q.packageName}
                              </span>
                            )}
                            {q.isPrivate && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold inline-flex items-center">
                                <Lock className="w-2.5 h-2.5 mr-1 text-amber-600" /> Riêng tư của bạn
                              </span>
                            )}
                            {q.isSystem && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                                🏛️ Dùng chung xã
                              </span>
                            )}
                            <span className="font-semibold text-slate-800 ml-1">
                              Câu {idx + 1}: {q.content}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                              {q.points || 10} điểm
                            </span>
                            {canUserManageQuestion(q) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-slate-600">
                          {q.options?.map((opt: any) => (
                            <div
                              key={opt.id}
                              className={`p-1.5 rounded-lg border text-[11px] ${
                                q.correctOptionIds?.includes(opt.id)
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <strong>{opt.id}.</strong> {opt.text}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                            <strong>Trích dẫn luật:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 4: KHO NỘI DUNG -> THÔNG BÁO BTC */}
            {/* ========================================================= */}
            {authUser && activeTab === "thong-bao" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-[#DC2626]" />
                    Quản Lý Thông Báo Ban Tổ Chức
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đăng tải thể lệ, công văn chỉ đạo và lịch phát động cuộc thi
                  </p>
                </div>

                {/* Form thêm thông báo mới */}
                <form
                  onSubmit={handleAddAnnouncement}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    + Đăng Thông Báo Mới
                  </div>
                  <input
                    type="text"
                    required
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    placeholder="Tiêu đề thông báo / công văn..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-red-600 bg-white"
                  />
                  <textarea
                    rows={3}
                    required
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    placeholder="Nội dung thông báo chỉ đạo..."
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-red-600 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Đăng thông báo
                  </button>
                </form>

                {/* Danh sách thông báo hiện có */}
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{ann.title}</span>
                        <span className="text-[11px] text-slate-400">{ann.date}</span>
                      </div>
                      <div className="text-[11px] text-[#DC2626] font-semibold">{ann.sender}</div>
                      <p className="text-slate-600 leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 5: KHO NỘI DUNG -> ĐƠN VỊ */}
            {/* ========================================================= */}
            {authUser && activeTab === "don-vi" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight flex items-center">
                    <Building className="w-5 h-5 mr-2 text-[#DC2626]" />
                    Quản Lý Danh Sách Đơn Vị Tham Gia Dự Thi ({unitsList.length} đơn vị)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bao gồm 20 thôn buôn xã Ea Súp và các đơn vị tự tạo (lớp, nhóm, cơ quan, chi bộ...)
                  </p>
                </div>

                {/* Thêm đơn vị mới */}
                <form onSubmit={handleAddUnit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Nhập tên đơn vị mới (Ví dụ: Chi bộ Quân sự, Chi đoàn 1, Lớp 12A1...)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-red-600 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    + Thêm đơn vị
                  </button>
                </form>

                {/* Danh sách các đơn vị dạng thẻ tags */}
                <div className="flex flex-wrap gap-2">
                  {unitsList.map((unit) => (
                    <div
                      key={unit}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 hover:border-slate-300 transition-colors"
                    >
                      <span>{unit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(unit)}
                        className="ml-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Xóa đơn vị"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 6: QUẢN LÝ NGƯỜI DÙNG & XÉT DUYỆT (CHỈ ADMIN) */}
            {/* ========================================================= */}
            {activeTab === "quan-ly-nguoi-dung" && (
              isAdmin ? (
                <div className="space-y-6">
                  {/* Tiêu đề & Nút thêm tài khoản */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-8 h-8 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center font-bold">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">
                            QUẢN LÝ NGƯỜI DÙNG &amp; XÉT DUYỆT HỆ THỐNG
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 pl-10">
                          Toàn quyền quản trị: Phân quyền Admin &amp; Người dùng, thêm/sửa/xóa tài khoản và xét duyệt hồ sơ người dùng đăng ký mới.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenCreateUser}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Thêm tài khoản mới
                      </button>
                    </div>

                    {/* 4 Thẻ Thống Kê Nhanh */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
                      {/* Tổng tài khoản */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-xs font-semibold text-slate-500">Tổng tài khoản</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                          {usersList.length}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Admin &amp; Người dùng</div>
                      </div>

                      {/* Quản trị viên (Admin) */}
                      <div className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                        <div className="text-xs font-semibold text-red-700 flex items-center justify-between">
                          <span>Quản trị viên (Admin)</span>
                          <ShieldCheck className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-2xl font-black text-red-900 mt-1">
                          {usersList.filter((u) => u.role === "ADMIN").length}
                        </div>
                        <div className="text-[11px] text-red-600 mt-0.5">Toàn quyền hệ thống</div>
                      </div>

                      {/* Người dùng (Đã duyệt) */}
                      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                        <div className="text-xs font-semibold text-blue-700 flex items-center justify-between">
                          <span>Người dùng (Đã duyệt)</span>
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-blue-900 mt-1">
                          {usersList.filter((u) => u.role === "USER" && u.status === "APPROVED").length}
                        </div>
                        <div className="text-[11px] text-blue-600 mt-0.5">Tạo cuộc thi &amp; xuất kết quả</div>
                      </div>

                      {/* Chờ xét duyệt */}
                      <div
                        onClick={() => setUserStatusFilter("PENDING")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          pendingUsersCount > 0
                            ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                            : "bg-slate-50 border-slate-200"
                        }`}
                        title="Bấm để lọc danh sách chờ duyệt"
                      >
                        <div className="text-xs font-semibold text-amber-800 flex items-center justify-between">
                          <span>Chờ xét duyệt</span>
                          {pendingUsersCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          )}
                        </div>
                        <div className="text-2xl font-black text-amber-900 mt-1">
                          {pendingUsersCount}
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
                          {pendingUsersCount > 0 ? "Cần Admin phê duyệt ngay" : "Không có hồ sơ chờ"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thanh Tìm Kiếm & Bộ Lọc */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Tìm theo họ tên, email, SĐT, đơn vị..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none focus:border-red-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {/* Lọc theo Vai trò */}
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                      >
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="ADMIN">Chỉ Admin (Toàn quyền)</option>
                        <option value="USER">Chỉ Người dùng</option>
                      </select>

                      {/* Lọc theo Trạng thái */}
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="APPROVED">Đã duyệt</option>
                        <option value="PENDING">Chờ xét duyệt</option>
                        <option value="REJECTED">Đã từ chối</option>
                      </select>

                      {(userSearchQuery || userRoleFilter !== "ALL" || userStatusFilter !== "ALL") && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearchQuery("");
                            setUserRoleFilter("ALL");
                            setUserStatusFilter("ALL");
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Đặt lại lọc
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BẢNG DANH SÁCH NGƯỜI DÙNG & PHÂN QUYỀN */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3.5 px-4">Tài khoản &amp; Đơn vị</th>
                            <th className="py-3.5 px-4">Thông tin liên hệ</th>
                            <th className="py-3.5 px-4 text-center">Vai trò (Phân quyền)</th>
                            <th className="py-3.5 px-4 text-center">Trạng thái xét duyệt</th>
                            <th className="py-3.5 px-4 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {usersList
                            .filter((u) => {
                              const q = userSearchQuery.toLowerCase().trim();
                              const matchesSearch =
                                !q ||
                                u.name?.toLowerCase().includes(q) ||
                                u.email?.toLowerCase().includes(q) ||
                                u.phone?.includes(q) ||
                                u.organizationName?.toLowerCase().includes(q);
                              const matchesRole =
                                userRoleFilter === "ALL" || u.role === userRoleFilter;
                              const matchesStatus =
                                userStatusFilter === "ALL" || u.status === userStatusFilter;
                              return matchesSearch && matchesRole && matchesStatus;
                            })
                            .map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Tài khoản & Đơn vị */}
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center space-x-1">
                                    <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{u.organizationName || "Ủy ban Nhân dân xã Ea Súp"}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Tạo: {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                  </div>
                                </td>

                                {/* Liên hệ */}
                                <td className="py-3.5 px-4">
                                  <div className="font-mono text-slate-800 font-medium">{u.email}</div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">{u.phone}</div>
                                </td>

                                {/* Vai trò (Phân quyền) */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="inline-flex flex-col items-center space-y-1">
                                    {u.role === "ADMIN" ? (
                                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>ADMIN (Toàn quyền)</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                                        <User className="w-3.5 h-3.5" />
                                        <span>NGƯỜI DÙNG</span>
                                      </span>
                                    )}

                                    {/* Nút Phân quyền nhanh */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleChangeRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")
                                      }
                                      className="text-[10px] text-slate-500 hover:text-red-600 underline font-semibold cursor-pointer"
                                      title="Chuyển đổi vai trò tài khoản này"
                                    >
                                      {u.role === "ADMIN" ? "Đổi sang Người dùng" : "Nâng cấp lên Admin"}
                                    </button>
                                  </div>
                                </td>

                                {/* Trạng thái xét duyệt */}
                                <td className="py-3.5 px-4 text-center">
                                  {u.status === "APPROVED" && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Đã duyệt</span>
                                    </span>
                                  )}
                                  {u.status === "PENDING" && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] animate-pulse">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Chờ xét duyệt</span>
                                    </span>
                                  )}
                                  {u.status === "REJECTED" && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px]">
                                      <X className="w-3 h-3 text-slate-500" />
                                      <span>Đã từ chối</span>
                                    </span>
                                  )}
                                </td>

                                {/* Thao tác */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    {/* Nút Xét duyệt nếu đang Chờ duyệt */}
                                    {u.status === "PENDING" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveUser(u.id, "APPROVED")}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                          title="Phê duyệt tài khoản này"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Duyệt</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveUser(u.id, "REJECTED")}
                                          className="px-2 py-1 rounded-lg border border-slate-300 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors inline-flex items-center cursor-pointer"
                                          title="Từ chối tài khoản này"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {/* Nút Đặt lại mật khẩu về mặc định 12345678@ */}
                                    <button
                                      type="button"
                                      onClick={() => handleResetUserPassword(u)}
                                      className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                      title="Đặt lại mật khẩu về mặc định (12345678@)"
                                    >
                                      <KeyRound className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Nút Chỉnh sửa */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(u)}
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Chỉnh sửa tài khoản"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Nút Xóa */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u.id, u.name)}
                                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Xóa tài khoản khỏi hệ thống"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Access Denied Banner for Non-Admin */
                <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Khu Vực Dành Riêng Cho Quản Trị Viên (Admin)
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tài khoản của bạn có vai trò <strong>Người dùng</strong>. Bạn không có quyền truy cập vào phân hệ Quản lý Người dùng &amp; Xét duyệt.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("trac-nghiem")}
                    className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold shadow-xs hover:bg-[#B91C1C] transition-colors"
                  >
                    Quay về Quản lý Cuộc thi
                  </button>
                </div>
              )
            )}
          </main>
        </div>
      </div>

      {/* MODAL HƯỚNG DẪN QUẢN TRỊ VIÊN (Khi nhấn nút Hướng dẫn màu tím) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-dialog border border-slate-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Hướng Dẫn Khởi Tạo &amp; Vận Hành Cuộc Thi
                </h3>
                <p className="text-xs text-slate-500">
                  Quy trình 5 bước chuẩn mực - Hệ thống thi trắc nghiệm xã Ea Súp
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-bold text-slate-900 text-sm mb-1 text-purple-900">
                  Bước 1: Thiết lập Thông tin Tổng quan
                </div>
                Nhập tên cuộc thi, đường dẫn slug duy nhất, ảnh banner đại diện, thời gian mở/đóng thi, thời gian làm bài (phút) và nội dung thể lệ.
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-bold text-slate-900 text-sm mb-1 text-purple-900">
                  Bước 2: Cài đặt Đề thi (AI Gemini, Thủ công hoặc Kho đề)
                </div>
                Bạn có thể tải lên file văn bản pháp luật (.pdf/.docx), trợ lý AI Gemini sẽ tự động đọc và trích xuất câu hỏi trắc nghiệm kèm điều khoản luật trích dẫn chính xác.
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-bold text-slate-900 text-sm mb-1 text-purple-900">
                  Bước 3: Chọn đơn vị dự thi
                </div>
                Hệ thống nạp sẵn 20 thôn buôn xã Ea Súp và cho phép tự do tạo thêm các đơn vị: chi bộ, chi đoàn, lớp học, hội thi...
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-bold text-slate-900 text-sm mb-1 text-purple-900">
                  Bước 4: Trang thông tin Ban Tổ Chức
                </div>
                Xác nhận cơ quan chủ quản (UBND, MTTQ, Đoàn thanh niên...), địa chỉ liên hệ và số điện thoại hỗ trợ thí sinh.
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-bold text-slate-900 text-sm mb-1 text-purple-900">
                  Bước 5: Xuất bản, Xem thống kê &amp; Tải file Excel
                </div>
                Xem biểu đồ lượt thi theo ngày, độ chính xác %, bảng xếp hạng Top thí sinh và tải trực tiếp file Excel (.xlsx) chuẩn mẫu để trao thưởng.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/admin/tao-cuoc-thi"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md inline-flex items-center"
              >
                Bắt đầu tạo cuộc thi ngay <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CÀI ĐẶT & KHỞI TẠO CUỘC THI ẢNH/VIDEO (CHUẨN MYALOHA - ẢNH 2 & ẢNH 3) */}
      {/* ========================================================= */}
      {showCreateMediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end overflow-hidden">
          <div className="bg-white w-full max-w-[460px] h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingMediaContestId ? "Cài đặt cuộc thi bình chọn" : "Thiết lập cuộc thi ảnh / video mới"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấu hình giao diện & thể lệ bình chọn trực tuyến
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateMediaModal(false);
                  setEditingMediaContestId(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable 8-Section Accordion Body (Chuẩn Ảnh 2 & Ảnh 3) */}
            <form
              onSubmit={(e) => handleCreateMediaContest(e, false)}
              className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs"
            >
              {/* 1. CẤU HÌNH (Ảnh 2) */}
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(mediaSettingsSection === "config" ? "" : "config")
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Cấu hình</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "config" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "config" && (
                  <div className="mt-3 space-y-3.5">
                    {/* Ảnh bìa + Radio Bình chọn ảnh / Bình chọn video */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-800 text-xs">Ảnh bìa</label>
                        <label className="text-[11px] font-semibold text-[#DC2626] hover:underline cursor-pointer">
                          {uploadingMediaBanner ? "Đang tải ảnh..." : "Đổi ảnh bìa"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleMediaBannerUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <label className="block relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/9] cursor-pointer group">
                        <img
                          src={newMediaForm.bannerUrl || "/images/contest_stage_banner.jpg"}
                          alt="Ảnh bìa cuộc thi"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 font-bold text-xs shadow">
                            Nhấn để tải ảnh bìa mới
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMediaBannerUpload}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        value={newMediaForm.bannerUrl}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, bannerUrl: e.target.value })
                        }
                        placeholder="Hoặc dán đường dẫn URL ảnh bìa..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 focus:outline-none focus:border-red-500"
                      />

                      {/* Radio: Bình chọn ảnh / Bình chọn video (Ảnh 2) */}
                      <div className="flex items-center space-x-8 pt-1">
                        <label
                          onClick={() => setNewMediaForm({ ...newMediaForm, type: "IMAGE" })}
                          className="inline-flex items-center space-x-2 cursor-pointer select-none"
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                              newMediaForm.type === "IMAGE"
                                ? "border-[#EF4444] bg-[#EF4444]"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {newMediaForm.type === "IMAGE" && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-xs font-medium text-slate-800">Bình chọn ảnh</span>
                        </label>

                        <label
                          onClick={() => setNewMediaForm({ ...newMediaForm, type: "VIDEO" })}
                          className="inline-flex items-center space-x-2 cursor-pointer select-none"
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                              newMediaForm.type === "VIDEO"
                                ? "border-[#EF4444] bg-[#EF4444]"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {newMediaForm.type === "VIDEO" && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-xs font-medium text-slate-800">Bình chọn video</span>
                        </label>
                      </div>
                    </div>

                    {/* Tên cuộc thi (Ảnh 2) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2">
                      <label className="block font-bold text-slate-800 text-xs">Tên cuộc thi</label>
                      <input
                        type="text"
                        required
                        value={newMediaForm.title}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, title: e.target.value })
                        }
                        placeholder="Nét đẹp văn hóa các dân tộc - Ea Súp năm 2026"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Thời gian nộp tác phẩm (Ảnh 2) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2">
                      <label className="block font-bold text-slate-800 text-xs">
                        Thời gian nộp tác phẩm
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="datetime-local"
                          value={newMediaForm.submitStartDate}
                          onChange={(e) =>
                            setNewMediaForm({
                              ...newMediaForm,
                              submitStartDate: e.target.value,
                              startDate: e.target.value,
                            })
                          }
                          className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200 text-[11px] text-slate-800 focus:outline-none focus:border-red-500"
                        />
                        <span className="text-slate-400 font-bold">→</span>
                        <input
                          type="datetime-local"
                          value={newMediaForm.submitEndDate}
                          onChange={(e) =>
                            setNewMediaForm({ ...newMediaForm, submitEndDate: e.target.value })
                          }
                          className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200 text-[11px] text-slate-800 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Thời gian bình chọn (Ảnh 2) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2">
                      <label className="block font-bold text-slate-800 text-xs">
                        Thời gian bình chọn
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="datetime-local"
                          value={newMediaForm.voteStartDate}
                          onChange={(e) =>
                            setNewMediaForm({ ...newMediaForm, voteStartDate: e.target.value })
                          }
                          className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200 text-[11px] text-slate-800 focus:outline-none focus:border-red-500"
                        />
                        <span className="text-slate-400 font-bold">→</span>
                        <input
                          type="datetime-local"
                          value={newMediaForm.voteEndDate}
                          onChange={(e) =>
                            setNewMediaForm({
                              ...newMediaForm,
                              voteEndDate: e.target.value,
                              endDate: e.target.value,
                            })
                          }
                          className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200 text-[11px] text-slate-800 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Màu chủ đề (7 ô màu chuẩn Ảnh 2) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                      <label className="block font-bold text-slate-800 text-xs">Màu chủ đề</label>
                      <div className="flex items-center space-x-2.5">
                        {[
                          "#DC2626",
                          "#264653",
                          "#2A9D8F",
                          "#0284C7",
                          "#F4A261",
                          "#E76F51",
                          "#1B7F5C",
                        ].map((color) => {
                          const isSelected =
                            (newMediaForm.themeColor || "#1B7F5C").toLowerCase() ===
                            color.toLowerCase();
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() =>
                                setNewMediaForm({ ...newMediaForm, themeColor: color })
                              }
                              style={{ backgroundColor: color }}
                              className={`w-9 h-9 rounded-lg transition-transform flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? "ring-2 ring-offset-2 ring-slate-800 scale-105"
                                  : "hover:scale-105"
                              }`}
                              title={`Màu ${color}`}
                            >
                              {color === "#1B7F5C" && (
                                <Sliders className="w-4 h-4 text-white/90" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. YÊU CẦU NGƯỜI THAM GIA NHẬP THÔNG TIN (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(
                      mediaSettingsSection === "participant" ? "" : "participant"
                    )
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Yêu cầu người tham gia nhập thông tin</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "participant" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "participant" && (
                  <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                    {[
                      { id: "authorName", label: "Họ và tên tác giả (Bắt buộc)" },
                      { id: "unitName", label: "Đơn Vị" },
                      { id: "authorPhone", label: "Số điện thoại liên hệ" },
                      { id: "authorCccd", label: "Số Căn cước công dân (CCCD)" },
                      { id: "authorEmail", label: "Địa chỉ Email" },
                      { id: "description", label: "Lời bình / Mô tả tác phẩm" },
                    ].map((field) => {
                      const checked = newMediaForm.requiredParticipantFields.includes(field.id);
                      return (
                        <label
                          key={field.id}
                          className="flex items-center space-x-2.5 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...newMediaForm.requiredParticipantFields, field.id]
                                : newMediaForm.requiredParticipantFields.filter(
                                    (f) => f !== field.id
                                  );
                              setNewMediaForm({
                                ...newMediaForm,
                                requiredParticipantFields: next,
                              });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#DC2626] focus:ring-red-500"
                          />
                          <span className="text-xs text-slate-700 font-medium">{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. BẢO MẬT (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(mediaSettingsSection === "security" ? "" : "security")
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Bảo mật</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "security" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "security" && (
                  <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">
                        Trạng thái xuất bản cuộc thi
                      </span>
                      <select
                        value={newMediaForm.status}
                        onChange={(e) =>
                          setNewMediaForm({
                            ...newMediaForm,
                            status: e.target.value as "DRAFT" | "PUBLISHED",
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                      >
                        <option value="PUBLISHED">Đang diễn ra (Công khai)</option>
                        <option value="DRAFT">Bản nháp (Nội bộ)</option>
                      </select>
                    </div>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-medium text-slate-700">
                        Duyệt bài trước khi hiển thị công khai
                      </span>
                      <input
                        type="checkbox"
                        checked={newMediaForm.requireApproval}
                        onChange={(e) =>
                          setNewMediaForm({
                            ...newMediaForm,
                            requireApproval: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-[#DC2626]"
                      />
                    </label>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">
                        Số lượt bình chọn tối đa / người
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newMediaForm.maxVotesPerUser}
                        onChange={(e) =>
                          setNewMediaForm({
                            ...newMediaForm,
                            maxVotesPerUser: Number(e.target.value) || 1,
                          })
                        }
                        className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-center font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. CÀI ĐẶT BÀI DỰ THI (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(
                      mediaSettingsSection === "submissions" ? "" : "submissions"
                    )
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Cài đặt bài dự thi</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "submissions" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "submissions" && (
                  <div className="mt-3 space-y-3">
                    {/* Bố cục: Cho phép chọn cả Bố cục dọc VÀ Bố cục ngang (Ảnh 2) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-800 text-xs">Bố cục</label>
                        <span className="text-[10px] text-slate-400">
                          Có thể chọn 1 hoặc cả 2 chiều
                        </span>
                      </div>
                      <div className="flex items-center space-x-8">
                        {([
                          { id: "vertical", label: "Bố cục dọc" },
                          { id: "horizontal", label: "Bố cục ngang" },
                        ] as const).map((item) => {
                          const currentModes: ("vertical" | "horizontal")[] =
                            Array.isArray(newMediaForm.layoutModes) &&
                            newMediaForm.layoutModes.length > 0
                              ? newMediaForm.layoutModes
                              : ["vertical"];
                          const isChecked = currentModes.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              onClick={() => {
                                let nextModes: ("vertical" | "horizontal")[];
                                if (isChecked) {
                                  // Nếu đang chọn cả 2 thì bỏ bớt 1; nếu chỉ còn 1 mà bấm tiếp thì chuyển sang chiều kia
                                  if (currentModes.length > 1) {
                                    nextModes = currentModes.filter((m) => m !== item.id);
                                  } else {
                                    nextModes = [item.id === "vertical" ? "horizontal" : "vertical"];
                                  }
                                } else {
                                  nextModes = [...currentModes, item.id];
                                }
                                setNewMediaForm({
                                  ...newMediaForm,
                                  layoutModes: nextModes,
                                  layoutMode:
                                    nextModes.length >= 2 ? "both" : nextModes[0] || "vertical",
                                });
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
                              <span className="text-xs font-medium text-slate-800">
                                {item.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Số lượng hình tối đa dự thi */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-800 text-xs">
                          Số lượng hình tối đa dự thi
                        </label>
                        <span className="text-[11px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-md">
                          Tối đa {newMediaForm.maxImagesPerSubmission || 5} hình / bài
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 3, 5, 10].map((num) => {
                            const active = (newMediaForm.maxImagesPerSubmission || 5) === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() =>
                                  setNewMediaForm({
                                    ...newMediaForm,
                                    maxImagesPerSubmission: num,
                                  })
                                }
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
                            value={newMediaForm.maxImagesPerSubmission || 5}
                            onChange={(e) =>
                              setNewMediaForm({
                                ...newMediaForm,
                                maxImagesPerSubmission: Math.max(
                                  1,
                                  Math.min(20, Number(e.target.value) || 1)
                                ),
                              })
                            }
                            className="w-14 px-2 py-1 rounded-lg border border-slate-200 text-xs text-center font-bold text-slate-800 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sắp xếp bài dự thi theo: Ngày nộp / Số lượt bình chọn / Số điểm (Ảnh 3) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                      <label className="block font-bold text-slate-800 text-xs">
                        Sắp xếp bài dự thi theo
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: "createdAt", label: "Ngày nộp" },
                          { id: "votesCount", label: "Số lượt bình chọn" },
                          { id: "score", label: "Số điểm" },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            onClick={() =>
                              setNewMediaForm({
                                ...newMediaForm,
                                sortBy: opt.id as "createdAt" | "votesCount" | "score",
                              })
                            }
                            className="flex items-center space-x-2.5 cursor-pointer select-none"
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                newMediaForm.sortBy === opt.id
                                  ? "border-[#EF4444] bg-[#EF4444]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {newMediaForm.sortBy === opt.id && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                            <span className="text-xs font-medium text-slate-800">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Chia sẻ mạng xã hội: Toggle + Facebook / Zalo (Ảnh 3) */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() =>
                            setNewMediaForm({
                              ...newMediaForm,
                              enableSocialShare: !newMediaForm.enableSocialShare,
                            })
                          }
                          className={`w-11 h-6 rounded-full border transition-colors flex items-center px-0.5 cursor-pointer ${
                            newMediaForm.enableSocialShare
                              ? "border-[#EF4444] bg-white justify-end"
                              : "border-slate-300 bg-slate-100 justify-start"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              newMediaForm.enableSocialShare
                                ? "bg-[#EF4444] text-white"
                                : "bg-slate-400 text-white"
                            }`}
                          >
                            {newMediaForm.enableSocialShare ? "✓" : ""}
                          </span>
                        </button>
                        <span className="font-bold text-slate-800 text-xs">
                          Chia sẻ mạng xã hội
                        </span>
                      </div>

                      {newMediaForm.enableSocialShare && (
                        <div className="space-y-2 pl-1">
                          {[
                            { id: "facebook", label: "Facebook" },
                            { id: "zalo", label: "Zalo" },
                          ].map((plat) => {
                            const checked = newMediaForm.sharePlatforms.includes(plat.id);
                            return (
                              <label
                                key={plat.id}
                                className="flex items-center space-x-2.5 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...newMediaForm.sharePlatforms, plat.id]
                                      : newMediaForm.sharePlatforms.filter((p) => p !== plat.id);
                                    setNewMediaForm({ ...newMediaForm, sharePlatforms: next });
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-[#EF4444] focus:ring-red-500"
                                />
                                <span className="text-xs text-slate-700 font-medium">
                                  {plat.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. CÀI ĐẶT BẢNG XẾP HẠNG (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(
                      mediaSettingsSection === "leaderboard" ? "" : "leaderboard"
                    )
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Cài đặt bảng xếp hạng</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "leaderboard" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "leaderboard" && (
                  <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-700 font-medium">
                        Hiển thị bảng xếp hạng công khai
                      </span>
                      <input
                        type="checkbox"
                        checked={newMediaForm.showLeaderboard}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, showLeaderboard: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-[#DC2626]"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-700 font-medium">
                        Hiển thị số lượt bình chọn trên từng tác phẩm
                      </span>
                      <input
                        type="checkbox"
                        checked={newMediaForm.showVoteCount}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, showVoteCount: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-[#DC2626]"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-700 font-medium">
                        Hiển thị số lượt chia sẻ trên từng tác phẩm
                      </span>
                      <input
                        type="checkbox"
                        checked={newMediaForm.showShareCount}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, showShareCount: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-[#DC2626]"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 6. THỂ LỆ CUỘC THI (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(mediaSettingsSection === "rules" ? "" : "rules")
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Thể lệ cuộc thi</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "rules" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "rules" && (
                  <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                    <textarea
                      rows={4}
                      value={newMediaForm.description}
                      onChange={(e) =>
                        setNewMediaForm({
                          ...newMediaForm,
                          description: e.target.value,
                          rulesHtml: e.target.value,
                        })
                      }
                      placeholder="Nhập nội dung thể lệ, quy định đối tượng tham gia, cơ cấu giải thưởng..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              {/* 7. THÔNG BÁO (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(
                      mediaSettingsSection === "announcement" ? "" : "announcement"
                    )
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Thông báo</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "announcement" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "announcement" && (
                  <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2">
                    <textarea
                      rows={3}
                      value={newMediaForm.announcement}
                      onChange={(e) =>
                        setNewMediaForm({ ...newMediaForm, announcement: e.target.value })
                      }
                      placeholder="Nhập thông báo từ Ban tổ chức gửi tới người tham gia..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              {/* 8. THÔNG TIN BAN TỔ CHỨC (Ảnh 3) */}
              <div className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setMediaSettingsSection(mediaSettingsSection === "organizer" ? "" : "organizer")
                  }
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 py-1 cursor-pointer"
                >
                  <span>Thông tin ban tổ chức</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      mediaSettingsSection === "organizer" ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                </button>

                {mediaSettingsSection === "organizer" && (
                  <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-200 bg-white space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Đơn vị tổ chức
                      </label>
                      <input
                        type="text"
                        value={newMediaForm.organizerName}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, organizerName: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Địa chỉ liên hệ
                      </label>
                      <input
                        type="text"
                        value={newMediaForm.organizerAddress}
                        onChange={(e) =>
                          setNewMediaForm({ ...newMediaForm, organizerAddress: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Điện thoại
                        </label>
                        <input
                          type="text"
                          value={newMediaForm.organizerPhone}
                          onChange={(e) =>
                            setNewMediaForm({ ...newMediaForm, organizerPhone: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={newMediaForm.organizerEmail}
                          onChange={(e) =>
                            setNewMediaForm({ ...newMediaForm, organizerEmail: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer Actions */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 sticky bottom-0">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateMediaModal(false);
                      setEditingMediaContestId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleCreateMediaContest(e as any, true)}
                      className="px-3.5 py-2.5 rounded-xl border border-[#1B7F5C] text-[#1B7F5C] bg-emerald-50/60 hover:bg-emerald-100 font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                    >
                      <span>Lưu & Mở Dashboard</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      {editingMediaContestId ? "Lưu cài đặt" : "Tạo cuộc thi"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: MẪU KẾ HOẠCH TỔ CHỨC CUỘC THI (Ảnh 2) */}
      {/* ========================================================= */}
      {showPlanTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowPlanTemplateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Mẫu Kế Hoạch Tổ Chức Cuộc Thi
                </h3>
                <p className="text-xs text-slate-500">
                  Văn bản hành chính chuẩn mẫu ban hành cho 20 thôn buôn xã Ea Súp
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-serif leading-relaxed max-h-96 overflow-y-auto">
              <div className="text-center font-bold">
                <div className="uppercase">ỦY BAN NHÂN DÂN XÃ EA SÚP</div>
                <div className="text-[11px] font-normal italic">Số: 125/KH-UBND — Ea Súp, ngày 28 tháng 10 năm 2026</div>
                <div className="uppercase mt-2 font-bold text-sm text-[#DC2626]">
                  KẾ HOẠCH<br />Tổ chức Cuộc thi Ảnh &amp; Video clip tuyên truyền chuyển đổi số và pháp luật năm 2026
                </div>
              </div>

              <div>
                <strong>I. MỤC ĐÍCH, YÊU CẦU:</strong>
                <p>1. Tuyên truyền sâu rộng các chủ trương của Đảng, pháp luật của Nhà nước và phong trào thi đua yêu nước tới cán bộ, đoàn viên và nhân dân 20 thôn, buôn.</p>
                <p>2. Khuyến khích ứng dụng công nghệ số, bình chọn minh bạch trên cổng cuocthi.easupso.com.</p>
              </div>

              <div>
                <strong>II. ĐỐI TƯỢNG VÀ HÌNH THỨC DỰ THI:</strong>
                <p>- Đối tượng: Toàn thể công dân đang sinh sống, học tập và làm việc trên địa bàn xã Ea Súp.</p>
                <p>- Hình thức: Gửi tác phẩm ảnh hoặc video qua cổng bình chọn trực tuyến, bà con nhân dân tham gia bình chọn bằng số điện thoại/CCCD.</p>
              </div>

              <div>
                <strong>III. CƠ CẤU GIẢI THƯỞNG:</strong>
                <p>- 01 Giải Nhất: Giấy khen UBND xã + Tiền thưởng 3.000.000 VNĐ</p>
                <p>- 02 Giải Nhì: Giấy khen UBND xã + Tiền thưởng 1.500.000 VNĐ</p>
                <p>- 03 Giải Ba &amp; 05 Giải Khuyến khích dành cho tác phẩm có lượt bình chọn cao nhất.</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Định dạng hỗ trợ: Microsoft Word (.docx) &amp; PDF</span>
              <button
                type="button"
                onClick={() => {
                  alert("Đang tải file: Ke_hoach_cuoc_thi_anh_video_Ea_Sup_2026.docx");
                  setShowPlanTemplateModal(false);
                }}
                className="px-5 py-2.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md transition-all inline-flex items-center"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Tải về máy (.DOCX)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DANH SÁCH TÁC PHẨM ĐÃ NỘP (Dành cho Quản trị viên) */}
      {/* ========================================================= */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl relative my-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowSubmissionsModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <List className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Danh Sách Tác Phẩm Nộp ({currentMediaSubmissions.length} bài)
                </h3>
                <p className="text-xs text-slate-500">
                  {activeMediaContestForSubmissions?.title || "Cuộc thi bình chọn"}
                </p>
              </div>
            </div>

            {currentMediaSubmissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chưa có tác phẩm nào nộp cho cuộc thi này. Thí sinh có thể gửi bài tại trang:{" "}
                <Link
                  href={`/binh-chon/${activeMediaContestForSubmissions?.slug}`}
                  target="_blank"
                  className="text-emerald-600 underline font-bold"
                >
                  /binh-chon/{activeMediaContestForSubmissions?.slug}
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {currentMediaSubmissions.map((sub, i) => (
                  <div
                    key={sub.id || i}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                        <img
                          src={sub.mediaUrl}
                          alt={sub.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {sub.title}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Tác giả: <strong>{sub.authorName}</strong> • {sub.unitName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                        👁️ {sub.viewsCount || 0} xem
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const current = sub.sharesCount || 0;
                          const input = window.prompt(`Điều chỉnh số lượt chia sẻ cho "${sub.title}":`, String(current));
                          if (input === null) return;
                          const count = parseInt(input, 10);
                          if (isNaN(count) || count < 0) return alert("Số lượt không hợp lệ!");
                          try {
                            const res = await fetch(`/api/media-contests/${activeMediaContestForSubmissions?.slug}/tac-pham/${sub.id}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "reset-shares", sharesCount: count }),
                            });
                            const d = await res.json();
                            if (d.success) {
                              setCurrentMediaSubmissions((prev: any) =>
                                prev.map((s: any) => (s.id === sub.id ? { ...s, sharesCount: count } : s))
                              );
                              alert("Đã cập nhật số lượt chia sẻ thành công!");
                            }
                          } catch {}
                        }}
                        className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-100 hover:bg-sky-100 cursor-pointer"
                        title="Bấm để sửa hoặc đặt lại số lượt chia sẻ"
                      >
                        🔗 {sub.sharesCount || 0} chia sẻ ✏️
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ❤️ {sub.votesCount} bình chọn
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteMediaSubmissionFromAdmin(sub)}
                        className="px-2.5 py-1 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Xóa tác phẩm này khỏi cuộc thi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Link
                href={`/binh-chon/${activeMediaContestForSubmissions?.slug}`}
                target="_blank"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center"
              >
                Mở trang bình chọn công khai <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA TÀI KHOẢN & PHÂN QUYỀN (CHỈ ADMIN) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-dialog border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingUserId ? "Chỉnh Sửa Tài Khoản" : "Thêm Mới Tài Khoản &amp; Phân Quyền"}
                </h3>
                <p className="text-xs text-slate-500">
                  Thiết lập phân quyền Admin và Người dùng trên hệ thống
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              {/* Họ tên */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white"
                />
              </div>

              {/* Cơ quan / Đơn vị */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cơ quan / Thôn buôn / Đơn vị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.organizationName}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, organizationName: e.target.value })
                  }
                  placeholder="Ví dụ: Hội Nông dân Xã Ea Súp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white"
                />
              </div>

              {/* Email & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="nongdan@easupso.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="0888023023"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <div className="relative">
                  <input
                    type={showUserFormPassword ? "text" : "password"}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserFormPassword(!showUserFormPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                    title={showUserFormPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showUserFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phân quyền (Vai trò) & Trạng thái xét duyệt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai trò (Phân quyền) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value as "ADMIN" | "USER" })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white font-semibold"
                  >
                    <option value="USER">1. Người dùng (Tạo cuộc thi &amp; xuất kết quả)</option>
                    <option value="ADMIN">2. Admin (Toàn quyền quản trị &amp; xét duyệt)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trạng thái xét duyệt <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormData.status}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        status: e.target.value as "APPROVED" | "PENDING" | "REJECTED",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 bg-white font-semibold"
                  >
                    <option value="APPROVED">Đã phê duyệt (Hoạt động)</option>
                    <option value="PENDING">Chờ xét duyệt</option>
                    <option value="REJECTED">Đã từ chối</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold shadow-md transition-all cursor-pointer"
                >
                  {editingUserId ? "Lưu thay đổi" : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHẬP VÀO HỆ THỐNG - ĐỒNG BỘ 100% TOÀN HỆ THỐNG */}
      <LoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={(user) => {
          setAuthUser(user);
          setShowAdminLoginModal(false);
          if (user.role === "USER" && activeTab === "quan-ly-nguoi-dung") {
            setActiveTab("trac-nghiem");
          }
        }}
      />
      {/* MODAL NHẬP ĐỒNG LOẠT ĐỀ THI TỪ FILE EXCEL (PHÂN QUYỀN RIÊNG TƯ & THEO BỘ ĐỀ) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-dialog border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportPreviewQuestions([]);
                setImportError("");
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Nhập Đồng Loạt Đề Thi Từ File Excel
                </h3>
                <p className="text-xs text-slate-500">
                  Phân chia theo từng bộ đề và bảo mật quyền sở hữu riêng tư
                </p>
              </div>
            </div>

            {/* Thông báo phân quyền bảo mật */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5 mb-5 shadow-2xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">Chế độ bảo mật riêng tư:</strong> Tài khoản{" "}
                <strong>{authUser?.name || "Người dùng"}</strong> có toàn quyền quản lý, chỉnh sửa,
                xóa bộ đề và câu hỏi này.{" "}
                <span className="text-amber-700 font-bold">
                  Các tài khoản khác tuyệt đối không thể xem hoặc can thiệp.
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* BƯỚC 1: CHỌN HOẶC ĐẶT TÊN BỘ ĐỀ */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Phân loại theo Bộ Đề Thi <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importPackageMode === "new"
                        ? "bg-white border-blue-600 shadow-2xs font-bold text-blue-900"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pkgMode"
                      checked={importPackageMode === "new"}
                      onChange={() => setImportPackageMode("new")}
                      className="text-blue-600"
                    />
                    <span>Khởi tạo Bộ đề mới</span>
                  </label>

                  <label
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importPackageMode === "existing"
                        ? "bg-white border-blue-600 shadow-2xs font-bold text-blue-900"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pkgMode"
                      checked={importPackageMode === "existing"}
                      onChange={() => setImportPackageMode("existing")}
                      className="text-blue-600"
                    />
                    <span>Nhập vào Bộ đề đã có</span>
                  </label>
                </div>

                {importPackageMode === "new" ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Đặt tên cho Bộ đề mới:
                    </label>
                    <input
                      type="text"
                      value={importNewPackageName}
                      onChange={(e) => setImportNewPackageName(e.target.value)}
                      placeholder="Ví dụ: Bộ đề Hội thi Thôn 3, Bộ đề Nông dân 2026..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-blue-600 bg-white text-xs sm:text-sm font-medium"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chọn Bộ đề của bạn:
                    </label>
                    <select
                      value={importExistingPackageId}
                      onChange={(e) => setImportExistingPackageId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-blue-600 bg-white text-xs sm:text-sm font-medium"
                    >
                      <option value="">-- Chọn bộ đề để bổ sung câu hỏi --</option>
                      {packagesList
                        .filter((p) => canUserManagePackage(p))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            📁 {p.name} ({p.questionCount || 0} câu)
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* BƯỚC 2: CHỌN TỆP EXCEL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Chọn tệp Excel (.xlsx, .xls) <span className="text-red-500">*</span>
                  </label>
                  <a
                    href="/api/questions/template"
                    download="mau_de_thi_trac_nghiem_ea_sup.xlsx"
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline inline-flex items-center text-[11px]"
                    title="Bấm để tải file Excel mẫu về máy"
                  >
                    <Download className="w-3 h-3 mr-1" /> Tải file Excel mẫu tại đây
                  </a>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-white hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="excelFileInput"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileSelectForImport}
                    className="hidden"
                  />
                  <label htmlFor="excelFileInput" className="cursor-pointer block">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    {importFile ? (
                      <div>
                        <span className="font-bold text-blue-700 text-xs sm:text-sm block">
                          📄 {importFile.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({(importFile.size / 1024).toFixed(1)} KB) • Bấm để đổi tệp khác
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold text-slate-700 text-xs sm:text-sm block">
                          Bấm vào đây để chọn tệp Excel từ máy tính / điện thoại
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Hỗ trợ định dạng .xlsx, .xls, .csv theo cấu trúc mẫu
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* LỖI NẾU CÓ */}
              {importError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  ⚠️ {importError}
                </div>
              )}

              {/* BƯỚC 3: XEM TRƯỚC (PREVIEW) */}
              {importPreviewQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center">
                      <Check className="w-4 h-4 mr-1 text-emerald-600" /> Đã kiểm tra hợp lệ:{" "}
                      <strong className="ml-1 text-slate-900">{importPreviewQuestions.length} câu hỏi</strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">Xem trước dữ liệu sẽ nhập</span>
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 space-y-2">
                    {importPreviewQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-slate-800">
                            Câu {idx + 1}: {q.content}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0 ml-2">
                            Đáp án: {q.correctOptionIds?.[0]}
                          </span>
                        </div>
                        <div className="text-slate-500 flex flex-wrap gap-2 text-[10px]">
                          {q.options?.map((opt: any) => (
                            <span key={opt.id}>
                              <strong>{opt.id}.</strong> {opt.text}
                            </span>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="text-[10px] text-emerald-700 italic">
                            Luật: {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BUTTONS ACTION */}
              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreviewQuestions([]);
                    setImportError("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  disabled={importPreviewQuestions.length === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-md cursor-pointer inline-flex items-center space-x-1.5 ${
                    importPreviewQuestions.length === 0 || isImporting
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-[#DC2626] hover:bg-[#B91C1C]"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isImporting
                      ? "Đang xử lý nhập..."
                      : `Xác nhận nhập ${importPreviewQuestions.length > 0 ? `${importPreviewQuestions.length} câu hỏi` : ""}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU TÀI KHOẢN (NGƯỜI DÙNG & ADMIN) */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        user={authUser}
      />

      {/* MODAL QUẢN LÝ LINK RÚT GỌN & QR CODE IN ẤN CHO CUỘC THI */}
      {selectedContestForShortlink && (
        <ShortlinkQrModal
          isOpen={!!selectedContestForShortlink}
          onClose={() => setSelectedContestForShortlink(null)}
          contestSlug={selectedContestForShortlink.slug}
          contestTitle={selectedContestForShortlink.title}
          initialCustomSlug={selectedContestForShortlink.customSlug}
          initialClickCount={selectedContestForShortlink.clickCount || 0}
          initialTab={shortlinkModalTab}
          onSuccess={(newSlug) => {
            setContests((prev) =>
              prev.map((c) =>
                c.slug === selectedContestForShortlink.slug || c.id === selectedContestForShortlink.id
                  ? { ...c, customSlug: newSlug }
                  : c
              )
            );
            setMediaContests((prev) =>
              prev.map((c) =>
                c.slug === selectedContestForShortlink.slug || c.id === selectedContestForShortlink.id
                  ? { ...c, customSlug: newSlug }
                  : c
              )
            );
          }}
        />
      )}

      {/* MODAL CHIA SẺ QUYỀN QUẢN LÝ & CHỈNH SỬA CUỘC THI CHO NGƯỜI KHÁC (ẢNH 1) */}
      {selectedContestForShare && (
        <ShareContestModal
          isOpen={!!selectedContestForShare}
          onClose={() => setSelectedContestForShare(null)}
          contest={selectedContestForShare}
          currentUser={authUser}
          usersList={usersList}
          onSuccess={(newSharedEmails) => {
            setContests((prev) =>
              prev.map((c) =>
                c.slug === selectedContestForShare.slug || c.id === selectedContestForShare.id
                  ? { ...c, sharedEmails: newSharedEmails }
                  : c
              )
            );
            setMediaContests((prev) =>
              prev.map((c) =>
                c.slug === selectedContestForShare.slug || c.id === selectedContestForShare.id
                  ? { ...c, sharedEmails: newSharedEmails }
                  : c
              )
            );
          }}
        />
      )}
    </div>
  );
}
