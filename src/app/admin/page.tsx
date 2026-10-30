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
  List,
  Navigation,
  User,
  UserCheck,
  UserX,
  ShieldAlert,
  Key,
  KeyRound,
  Upload,
  FolderPlus,
  Folder,
} from "lucide-react";
import * as XLSX from "xlsx";
import { EA_SUP_VILLAGES, DEFAULT_ORGANIZATIONS } from "@/lib/store";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import LoginModal from "@/components/LoginModal";

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
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [selectedMediaContestIds, setSelectedMediaContestIds] = useState<string[]>([]);
  const [showCreateMediaModal, setShowCreateMediaModal] = useState(false);
  const [showPlanTemplateModal, setShowPlanTemplateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [activeMediaContestForSubmissions, setActiveMediaContestForSubmissions] = useState<any>(null);
  const [currentMediaSubmissions, setCurrentMediaSubmissions] = useState<any[]>([]);

  // Form State for creating Media Contest
  const [newMediaForm, setNewMediaForm] = useState({
    title: "CUỘC THI BÌNH CHỌN MỚI",
    slug: "cuoc-thi-binh-chon-moi",
    type: "IMAGE" as "IMAGE" | "VIDEO",
    startDate: "2026-11-02",
    endDate: "2026-11-05",
    displayStartDate: "2 thg 11, 2026",
    displayEndDate: "5 thg 11, 2026",
    bannerUrl: "/images/contest_stage_banner.jpg",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
    description: "Cuộc thi bình chọn tác phẩm hình ảnh/video trực tuyến",
  });

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
    fetch("/api/contests")
      .then((res) => res.json())
      .then((data) => {
        if (data.contests) setContests(data.contests);
      })
      .catch((err) => console.error("Error loading contests:", err));

    fetch("/api/questions/bank")
      .then((res) => res.json())
      .then((data) => {
        if (data.questions) setQuestions(data.questions);
      })
      .catch((err) => console.error("Error loading questions:", err));

    loadMediaContests();
    loadUsers();
  }, []);

  // Helper kiểm tra quyền sở hữu cuộc thi:
  // Admin toàn quyền; Người dùng (USER) chỉ có quyền Sửa/Xóa các cuộc thi do chính mình tạo
  const canUserManageContest = (c: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    const userEmail = (authUser.email || "").toLowerCase().trim();
    const creatorEmail = (c?.creatorEmail || c?.organizerEmail || "").toLowerCase().trim();
    const creatorId = c?.creatorId || c?.userId;
    if (creatorEmail && creatorEmail === userEmail) return true;
    if (creatorId && creatorId === authUser.id) return true;
    return false;
  };

  const canUserManageMediaContest = (c: any) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    const userEmail = (authUser.email || "").toLowerCase().trim();
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
    if (target && !canUserManageContest(target)) {
      alert("Bạn không có quyền xóa cuộc thi này vì do người khác tạo!");
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
        setContests((prev) => prev.filter((c) => c.slug !== slug && c.id !== slug));
      } else {
        alert(data.error || "Không thể xóa cuộc thi");
      }
    } catch (e: any) {
      alert("Lỗi khi xóa cuộc thi: " + e.message);
    }
  };

  // Fetch Media Contests
  const loadMediaContests = async () => {
    try {
      const res = await fetch("/api/media-contests");
      const data = await res.json();
      if (data.contests) setMediaContests(data.contests);
    } catch (err) {
      console.error("Lỗi tải cuộc thi ảnh/video:", err);
    }
  };

  const handleCreateMediaContest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/media-contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMediaForm,
          creatorEmail: authUser?.email,
          creatorId: authUser?.id,
          creatorName: authUser?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateMediaModal(false);
        loadMediaContests();
        alert("Khởi tạo cuộc thi bình chọn mới thành công!");
      } else {
        alert(data.error || "Lỗi tạo cuộc thi");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
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

  // Danh sách cuộc thi mà tài khoản được quyền xem trong trang quản trị:
  // - Admin (Toàn quyền): Xem tất cả các cuộc thi trên hệ thống
  // - Người dùng cơ sở (USER): CHỈ XEM ĐƯỢC các cuộc thi do chính mình tạo
  // - Chưa đăng nhập: Không xem được danh sách quản trị
  const visibleContests = contests.filter((c) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    return canUserManageContest(c);
  });

  // Filtered contests
  const filteredContests = visibleContests.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && c.status === "PUBLISHED") ||
      (statusFilter === "DRAFT" && c.status === "DRAFT");
    return matchesSearch && matchesStatus;
  });

  // Danh sách cuộc thi bình chọn Ảnh/Video phân quyền:
  // - Admin: Xem tất cả
  // - Người dùng: Chỉ xem cuộc thi do mình tạo
  const visibleMediaContests = mediaContests.filter((c) => {
    if (!authUser) return false;
    if (authUser.role === "ADMIN") return true;
    return canUserManageMediaContest(c);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Administrative Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <img
                src="/logo.png"
                alt="Logo Cuộc thi trực tuyến"
                className="w-9 h-9 object-contain rounded-full shadow-xs"
              />
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                THI TRỰC TUYẾN
              </span>
            </Link>
            {authUser && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center">
                  <Landmark className="w-4 h-4 mr-1 text-[#DC2626]" />
                  Bảng Điều Khiển Ban Tổ Chức
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {authUser ? (
              <div
                className={`flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold shadow-2xs border ${
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

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tên cuộc thi hoặc đường dẫn slug..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-red-600"
                  />
                </div>

                {/* List of Contests Cards */}
                {filteredContests.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs sm:text-sm">
                    {authUser?.role === "ADMIN"
                      ? "Không tìm thấy cuộc thi nào phù hợp. Hãy bấm nút Tạo mới để khởi tạo cuộc thi đầu tiên!"
                      : "Bạn chưa tạo cuộc thi nào. Hãy bấm nút Tạo mới để bắt đầu khởi tạo cuộc thi của đơn vị mình!"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredContests.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Contest Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
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
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {c.status === "PUBLISHED" ? "ĐANG DIỄN RA" : "BẢN NHÁP"}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                                {c.organizerName || "UBND Xã Ea Súp"}
                              </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                              {c.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {c.durationMinutes || 15} phút/lượt
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {c.units?.length || 20} đơn vị tham gia
                              </span>
                              <span className="flex items-center font-mono text-[11px] text-slate-400">
                                /thi/{c.slug}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                          <Link
                            href={`/thi/${c.slug}`}
                            target="_blank"
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Xem phòng thi
                          </Link>

                          <Link
                            href={`/ket-qua/${c.slug}`}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center"
                          >
                            <BarChart2 className="w-3.5 h-3.5 mr-1" /> Bảng xếp hạng
                          </Link>

                          {authUser && (
                            <a
                              href={`/api/contests/${c.slug}/export`}
                              download
                              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors inline-flex items-center"
                              title="Tải file Excel kết quả"
                            >
                              <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Xuất Excel
                            </a>
                          )}

                          {canUserManageContest(c) ? (
                            <>
                              <Link
                                href={`/admin/tao-cuoc-thi?edit=${c.slug}&step=1`}
                                className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors inline-flex items-center shadow-xs cursor-pointer"
                                title={`Chỉnh sửa cuộc thi: ${c.title}`}
                              >
                                <Edit className="w-3.5 h-3.5 mr-1" /> Chỉnh sửa
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteContest(c.slug, c.title)}
                                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors inline-flex items-center cursor-pointer"
                                title="Xóa cuộc thi này khỏi hệ thống"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-600" /> Xóa
                              </button>
                            </>
                          ) : (
                            <span
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200 inline-flex items-center select-none"
                              title="Cuộc thi này do đơn vị khác tạo. Bạn có quyền theo dõi phòng thi, bảng xếp hạng và xuất file Excel kết quả."
                            >
                              <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Chỉ xem (Đơn vị khác)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB NỘI DUNG 2: CUỘC THI ẢNH / VIDEO (Ảnh 2) */}
            {/* ========================================================= */}
            {authUser && activeTab === "anh-video" && (
              <div className="space-y-4">
                {/* TOP ACTION BAR: Mẫu kế hoạch ↓ + Tìm kiếm... + Hướng dẫn [avatar] (Ảnh 2) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:px-5 sm:py-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Phân hệ: Cuộc thi Bình chọn
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    {/* Nút Mẫu kế hoạch ↓ */}
                    <button
                      type="button"
                      onClick={() => setShowPlanTemplateModal(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <span>Mẫu kế hoạch</span>
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Input Tìm kiếm... (pill) */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={mediaSearchQuery}
                        onChange={(e) => setMediaSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-slate-200 focus:outline-none focus:border-red-500 bg-white w-32 sm:w-44 text-slate-700"
                      />
                    </div>

                    {/* Hướng dẫn + Avatar */}
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors pl-1 cursor-pointer"
                    >
                      <span>Hướng dẫn</span>
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                          alt="Avatar Admin"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  </div>
                </div>

                {/* MAIN CARD: DANH SÁCH CUỘC THI (Ảnh 2) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
                  {/* Tiêu đề & Nút [ Xóa ] [ + Thêm mới ] [ Tìm kiếm cuộc thi... ] (Ảnh 2) */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4">
                      Danh sách cuộc thi
                    </h2>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {/* Nút Xóa (border đỏ, icon thùng rác) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMediaContests()}
                          className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg border border-red-300 text-red-600 bg-white hover:bg-red-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Xóa</span>
                        </button>

                        {/* Nút + Thêm mới (nền đỏ nổi bật) - Chỉ khi đã đăng nhập */}
                        {authUser && (
                          <button
                            type="button"
                            onClick={() => setShowCreateMediaModal(true)}
                            className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm mới</span>
                          </button>
                        )}
                      </div>

                      {/* Right Input: Tìm kiếm cuộc thi... */}
                      <div className="relative">
                        <input
                          type="text"
                          value={mediaSearchQuery}
                          onChange={(e) => setMediaSearchQuery(e.target.value)}
                          placeholder="Tìm kiếm cuộc thi..."
                          className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 w-full sm:w-56 focus:outline-none focus:border-red-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BẢNG DỮ LIỆU CUỘC THI ẢNH/VIDEO CHUẨN XÁC THEO ẢNH 2 */}
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                visibleMediaContests.length > 0 &&
                                selectedMediaContestIds.length === visibleMediaContests.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMediaContestIds(visibleMediaContests.map((c) => c.id));
                                } else {
                                  setSelectedMediaContestIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-2 w-12 text-slate-700"># ⇅</th>
                          <th className="py-3 px-3 text-slate-700">Tên cuộc thi ⇅</th>
                          <th className="py-3 px-3 text-slate-700">Ngày bắt đầu ⇅</th>
                          <th className="py-3 px-3 text-slate-700">Ngày kết thúc ⇅</th>
                          <th className="py-3 px-3 text-center text-slate-700">Tổng số tác phẩm ⇅</th>
                          <th className="py-3 px-3 text-center text-slate-700">Loại bình chọn ⇅</th>
                          <th className="py-3 px-3 text-center text-slate-700">Trạng thái ⇅</th>
                          <th className="py-3 px-3 text-center text-slate-700">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleMediaContests
                          .filter((c) =>
                            !mediaSearchQuery ||
                            c.title.toLowerCase().includes(mediaSearchQuery.toLowerCase())
                          )
                          .map((c, idx) => {
                            const isSelected = selectedMediaContestIds.includes(c.id);
                            return (
                              <tr
                                key={c.id}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                  isSelected ? "bg-red-50/30" : ""
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMediaContestIds([...selectedMediaContestIds, c.id]);
                                      } else {
                                        setSelectedMediaContestIds(
                                          selectedMediaContestIds.filter((id) => id !== c.id)
                                        );
                                      }
                                    }}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                  />
                                </td>

                                {/* # */}
                                <td className="py-3 px-2 text-slate-500 font-mono">
                                  {idx + 1}
                                </td>

                                {/* Tên cuộc thi + Thumbnail (Ảnh 2) */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-14 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                      <img
                                        src={c.bannerUrl || "/images/contest_stage_banner.jpg"}
                                        alt={c.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <Link
                                        href={`/binh-chon/${c.slug}`}
                                        target="_blank"
                                        className="font-bold text-slate-900 uppercase hover:text-[#DC2626] transition-colors line-clamp-1"
                                      >
                                        {c.title}
                                      </Link>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        /binh-chon/{c.slug}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Ngày bắt đầu */}
                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                  {c.displayStartDate || "2 thg 11, 2026"}
                                </td>

                                {/* Ngày kết thúc */}
                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                  {c.displayEndDate || "5 thg 11, 2026"}
                                </td>

                                {/* Tổng số tác phẩm */}
                                <td className="py-3 px-3 text-center font-bold text-slate-800">
                                  {c.submissionsCount ?? 0}
                                </td>

                                {/* Loại bình chọn: [ Hình ảnh ] hoặc [ Video ] */}
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-block px-2.5 py-0.5 rounded-md border border-sky-400 text-sky-600 bg-sky-50/50 text-[11px] font-medium whitespace-nowrap">
                                    {c.type === "VIDEO" ? "Video clip" : "Hình ảnh"}
                                  </span>
                                </td>

                                {/* Trạng thái: [ Nháp ] hoặc [ Đang diễn ra ] */}
                                <td className="py-3 px-3 text-center">
                                  {c.status === "PUBLISHED" ? (
                                    <span className="inline-block px-2.5 py-0.5 rounded-md border border-emerald-400 text-emerald-600 bg-emerald-50/50 text-[11px] font-medium whitespace-nowrap">
                                      Đang diễn ra
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-0.5 rounded-md border border-amber-400 text-amber-600 bg-amber-50/50 text-[11px] font-medium whitespace-nowrap">
                                      Nháp
                                    </span>
                                  )}
                                </td>

                                {/* Thao tác: Edit, Submissions, Link, Download, Trash (Ảnh 2) */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-center space-x-1.5 text-slate-500">
                                    {/* Edit (Chỉ hiển thị nếu là người tạo hoặc Admin) */}
                                    {canUserManageMediaContest(c) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewMediaForm({
                                            title: c.title,
                                            slug: c.slug,
                                            type: c.type || "IMAGE",
                                            startDate: c.startDate || "2026-11-02",
                                            endDate: c.endDate || "2026-11-05",
                                            displayStartDate: c.displayStartDate || "2 thg 11, 2026",
                                            displayEndDate: c.displayEndDate || "5 thg 11, 2026",
                                            bannerUrl: c.bannerUrl || "/images/contest_stage_banner.jpg",
                                            status: c.status || "DRAFT",
                                            description: c.description || "",
                                          });
                                          setShowCreateMediaModal(true);
                                        }}
                                        className="p-1 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="Chỉnh sửa thông tin"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Submissions List */}
                                    <button
                                      type="button"
                                      onClick={() => handleViewSubmissions(c)}
                                      className="p-1 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Xem danh sách tác phẩm nộp"
                                    >
                                      <List className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Copy / Open Link (Ảnh 3) */}
                                    <Link
                                      href={`/binh-chon/${c.slug}`}
                                      target="_blank"
                                      className="p-1 hover:text-sky-600 rounded hover:bg-sky-50 transition-colors"
                                      title="Xem trang bình chọn công khai (Ảnh 3)"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>

                                    {/* Download (Chỉ khi đã đăng nhập) */}
                                    {authUser && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          alert(`Đang xuất dữ liệu bình chọn cuộc thi: ${c.title}`);
                                        }}
                                        className="p-1 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                                        title="Tải dữ liệu báo cáo"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Delete (Chỉ hiển thị nếu là người tạo hoặc Admin) */}
                                    {canUserManageMediaContest(c) ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMediaContests(c.id)}
                                        className="p-1 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                        title="Xóa cuộc thi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <span
                                        className="p-1 text-slate-300 select-none"
                                        title="Chỉ xem (Đơn vị khác tạo)"
                                      >
                                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* PHÂN TRANG BÊN DƯỚI (Ảnh 2) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <span>
                        Hiển thị từ 1 đến {mediaContests.length} trong tổng số{" "}
                        {mediaContests.length} tác phẩm
                      </span>
                      <select className="border border-slate-200 rounded px-2 py-1 bg-white text-xs text-slate-700">
                        <option value="10">10 ⌄</option>
                        <option value="20">20 ⌄</option>
                        <option value="50">50 ⌄</option>
                      </select>
                    </div>

                    {/* Pagination Buttons with Red Active Circle (Ảnh 2) */}
                    <div className="flex items-center space-x-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        disabled
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs opacity-60 cursor-not-allowed"
                      >
                        «
                      </button>
                      <button
                        type="button"
                        disabled
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs opacity-60 cursor-not-allowed"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-xs font-bold shadow-xs"
                      >
                        1
                      </button>
                      <button
                        type="button"
                        disabled
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs opacity-60 cursor-not-allowed"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        disabled
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs opacity-60 cursor-not-allowed"
                      >
                        »
                      </button>
                    </div>
                  </div>
                </div>
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
      {/* MODAL 1: TẠO MỚI / THÊM MỚI CUỘC THI ẢNH/VIDEO */}
      {/* ========================================================= */}
      {showCreateMediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowCreateMediaModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 fill-current rotate-45" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Thêm Mới Cuộc Thi Bình Chọn
                </h3>
                <p className="text-xs text-slate-500">
                  Khởi tạo cuộc thi bình chọn hình ảnh / video clip trực tuyến
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateMediaContest} className="space-y-4 text-xs">
              {/* Tên cuộc thi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên cuộc thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMediaForm.title}
                  onChange={(e) =>
                    setNewMediaForm({ ...newMediaForm, title: e.target.value })
                  }
                  placeholder="VD: CUỘC THI BÌNH CHỌN MỚI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white"
                />
              </div>

              {/* Loại bình chọn & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Loại bình chọn
                  </label>
                  <select
                    value={newMediaForm.type}
                    onChange={(e) =>
                      setNewMediaForm({
                        ...newMediaForm,
                        type: e.target.value as "IMAGE" | "VIDEO",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white"
                  >
                    <option value="IMAGE">Hình ảnh (Ảnh đẹp)</option>
                    <option value="VIDEO">Video clip (Tiểu phẩm)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={newMediaForm.status}
                    onChange={(e) =>
                      setNewMediaForm({
                        ...newMediaForm,
                        status: e.target.value as "DRAFT" | "PUBLISHED",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white"
                  >
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PUBLISHED">Đang diễn ra (Công khai)</option>
                  </select>
                </div>
              </div>

              {/* Ngày bắt đầu & Ngày kết thúc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={newMediaForm.startDate}
                    onChange={(e) =>
                      setNewMediaForm({
                        ...newMediaForm,
                        startDate: e.target.value,
                        displayStartDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={newMediaForm.endDate}
                    onChange={(e) =>
                      setNewMediaForm({
                        ...newMediaForm,
                        endDate: e.target.value,
                        displayEndDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white"
                  />
                </div>
              </div>

              {/* Ảnh Banner */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn Banner sân khấu / lễ hội
                </label>
                <input
                  type="text"
                  value={newMediaForm.bannerUrl}
                  onChange={(e) =>
                    setNewMediaForm({ ...newMediaForm, bannerUrl: e.target.value })
                  }
                  placeholder="/images/contest_stage_banner.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả / Thể lệ tóm tắt
                </label>
                <textarea
                  rows={2}
                  value={newMediaForm.description}
                  onChange={(e) =>
                    setNewMediaForm({ ...newMediaForm, description: e.target.value })
                  }
                  placeholder="Mô tả mục đích, ý nghĩa và hướng dẫn gửi ảnh/video..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-600 bg-white resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateMediaModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Tạo cuộc thi ngay
                </button>
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

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ❤️ {sub.votesCount} bình chọn
                      </span>
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
    </div>
  );
}
