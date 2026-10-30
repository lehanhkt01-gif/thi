"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  BrainCircuit,
  Upload,
  CheckCircle2,
  Users,
  Info,
  Share2,
  Calendar,
  Clock,
  Layers,
  Landmark,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Search,
  Filter,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Trophy,
  Award,
  BookOpen,
  Lock,
  User,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Smartphone,
  X,
  QrCode,
  Eye,
  EyeOff,
  Sliders,
  Settings,
  HelpCircle,
  Send,
  Bell,
  Home,
  BarChart2,
  Navigation,
  Compass,
} from "lucide-react";
import FloatingActionBar from "@/components/FloatingActionBar";
import SparklineChart from "@/components/SparklineChart";
import { EA_SUP_VILLAGES, DEFAULT_ORGANIZATIONS } from "@/lib/store";
import { GoogleIcon, syncAuthSession } from "@/components/LoginModal";
import ExamSettingsDrawer, { ExamMixPackageItem } from "@/components/ExamSettingsDrawer";

export default function ContestWizardPage() {
  // Trạng thái xác thực & Quyền khởi tạo cuộc thi (Ảnh 2)
  const [authUser, setAuthUser] = useState<any>({
    name: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
    email: "Easupsohoa@gmail.com",
    phone: "0888023023",
    role: "ORG_ADMIN",
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regOrgName, setRegOrgName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showGoogleInputPrompt, setShowGoogleInputPrompt] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Bước 1: Tổng quan
  const [title, setTitle] = useState("Cuộc thi trực tuyến tìm hiểu Nghị quyết & Chuyển đổi số xã Ea Súp 2026");
  const [slug, setSlug] = useState("tim-hieu-nghi-quyet-chuyen-doi-so-2026");
  const [bannerUrl, setBannerUrl] = useState("/banner-easup.png");
  const bannerFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Xử lý nén ảnh trên Client Canvas (chuyển đổi ảnh chụp nặng thành kích thước tối ưu < 500KB)
  const compressImage = (file: File): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
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
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/webp", 0.88);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({ blob, dataUrl });
                } else {
                  resolve({ blob: file, dataUrl: (readerEvent.target?.result as string) || "" });
                }
              },
              "image/webp",
              0.88
            );
          } else {
            resolve({ blob: file, dataUrl: (readerEvent.target?.result as string) || "" });
          }
        };
        img.onerror = () => {
          resolve({ blob: file, dataUrl: (readerEvent.target?.result as string) || "" });
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Xử lý tải ảnh banner lên từ máy tính / điện thoại
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)!");
      return;
    }

    try {
      setIsUploadingBanner(true);

      // Nén ảnh tự động trên client
      const { blob, dataUrl } = await compressImage(file);

      // Hiển thị xem trước ngay lập tức bằng dataUrl
      setBannerUrl(dataUrl);

      // Gửi tệp lên API /api/upload để lưu trữ lâu dài trên server
      const formData = new FormData();
      formData.append("file", blob, file.name.replace(/\.[^/.]+$/, ".webp"));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setBannerUrl(data.url);
      } else {
        console.warn("Upload server trả về cảnh báo, duy trì ảnh preview:", data.error);
      }
    } catch (err: any) {
      console.warn("Lỗi khi gửi ảnh lên server, tự động duy trì ảnh hiển thị:", err);
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = "";
    }
  };
  const [rulesHtml, setRulesHtml] = useState(`
<h3>I. MỤC ĐÍCH & Ý NGHĨA</h3>
<p>Nâng cao hiểu biết cho cán bộ, đoàn viên và nhân dân 20 thôn buôn xã Ea Súp về công tác chuyển đổi số và nghị quyết phát triển kinh tế - xã hội địa phương.</p>
<h3>II. HÌNH THỨC & THỜI GIAN</h3>
<p>Thi trực tuyến trên cổng cuocthi.easupso.com. Mỗi thí sinh có 3 lượt thi, thời gian 15 phút/lượt.</p>
  `.trim());
  const [startTime, setStartTime] = useState("2026-03-01T00:00");
  const [endTime, setEndTime] = useState("2026-12-31T23:59");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [questionCount, setQuestionCount] = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [hasTieBreaker, setHasTieBreaker] = useState(true);

  // Cấu hình giao diện & bảo mật MyAloha (Ảnh 2, 3, 4, 5)
  const [themeColor, setThemeColor] = useState("#DC2626");
  const [examPassword, setExamPassword] = useState("");
  const [requirePortrait, setRequirePortrait] = useState("none");
  const [fullScreenExam, setFullScreenExam] = useState(true);
  const [shortDesc, setShortDesc] = useState("Mỗi thí sinh được tham gia tối đa 1 lần để tìm hiểu, bằng cách trắc nghiệm.");
  // 4 hạng mục giải thưởng đồng bộ với trang thi (Ảnh 2 & Ảnh 3)
  const [prize1, setPrize1] = useState("5.000.000 đồng/giải");
  const [prize2, setPrize2] = useState("3.000.000 đồng/giải");
  const [prize3, setPrize3] = useState("1.000.000 đồng/giải");
  const [prize4, setPrize4] = useState("750.000 đồng/giải");
  const [prize1Count, setPrize1Count] = useState("01");
  const [prize2Count, setPrize2Count] = useState("02");
  const [prize3Count, setPrize3Count] = useState("03");
  const [prize4Count, setPrize4Count] = useState("05");
  const [requiredFields, setRequiredFields] = useState("Họ tên thí sinh, Số điện thoại, CCCD/Mã định danh, Thôn/Buôn/Đơn vị");
  const [customLeaderboard, setCustomLeaderboard] = useState("Lượt thi, lượt đăng ký, Xếp hạng...");

  // Modal trạng thái Quick-Action (Ảnh 2, 3, 4, 5)
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Cài đặt nâng cao đề thi (Ảnh 1)
  const [showExamSettingsDrawer, setShowExamSettingsDrawer] = useState(false);
  const [showResultMode, setShowResultMode] = useState<"SCORE_ONLY" | "SCORE_AND_ANSWERS" | "HIDDEN">("SCORE_ONLY");
  const [attemptCalculation, setAttemptCalculation] = useState<"ENTIRE_CONTEST" | "DAILY" | "WEEKLY">("ENTIRE_CONTEST");
  const [shuffleMode, setShuffleMode] = useState<"NONE" | "ALL" | "QUESTIONS_ONLY" | "ANSWERS_ONLY">("NONE");
  const [examMixPackages, setExamMixPackages] = useState<ExamMixPackageItem[]>([
    {
      id: "mix-1",
      packageName: "Đề thi mới tạo",
      mcqCount: 30,
      essayCount: 0,
    },
  ]);

  // Chế độ Tạo mới hay Chỉnh sửa cuộc thi (Yêu cầu 4)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState("");

  // Modal Thông tin bắt buộc khi đăng ký (Yêu cầu 3 - Ảnh 2)
  const [showRequiredFieldsModal, setShowRequiredFieldsModal] = useState(false);
  const [selectedRequiredFields, setSelectedRequiredFields] = useState<string[]>([
    "fullName",
    "phone",
    "cccd"
  ]);

  // Danh sách các trường thông tin đề xuất chuẩn xác theo Ảnh 2
  const PROPOSED_REQUIRED_FIELDS = [
    { id: "fullName", label: "Họ tên thí sinh", isLocked: true },
    { id: "email", label: "Email", isLocked: false },
    { id: "birthday", label: "Ngày sinh", isLocked: false, hasInfo: true },
    { id: "phone", label: "Số điện thoại", isLocked: false },
    { id: "cccd", label: "CCCD/Mã định danh", isLocked: false },
    { id: "job", label: "Nghề nghiệp", isLocked: false },
    { id: "gender", label: "Giới tính", isLocked: false },
    { id: "workplace", label: "Lớp, MSSV, Nơi công tác", isLocked: false },
    { id: "custom1", label: "Tùy chỉnh", isLocked: true },
    { id: "custom2", label: "Tùy chỉnh", isLocked: true },
    { id: "custom3", label: "Tùy chỉnh", isLocked: true },
    { id: "custom4", label: "Tùy chỉnh", isLocked: true },
  ];

  // Bật/tắt chọn trường thông tin
  const handleToggleRequiredField = (id: string) => {
    if (id === "fullName") return; // Họ tên luôn bắt buộc
    const target = PROPOSED_REQUIRED_FIELDS.find((f) => f.id === id);
    if (target?.isLocked) return;

    if (selectedRequiredFields.includes(id)) {
      setSelectedRequiredFields(selectedRequiredFields.filter((item) => item !== id));
    } else {
      setSelectedRequiredFields([...selectedRequiredFields, id]);
    }
  };

  // Lưu thiết lập thông tin bắt buộc từ modal
  const handleSaveRequiredFields = () => {
    const labels = PROPOSED_REQUIRED_FIELDS
      .filter((f) => selectedRequiredFields.includes(f.id))
      .map((f) => f.label)
      .join(", ");
    setRequiredFields(labels);
    setShowRequiredFieldsModal(false);
  };

  // Lưu Bước 1 và chuyển tiếp sang Bước 2 (Yêu cầu 4)
  const handleSaveStep1AndNext = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tên cuộc thi!");
      return;
    }
    setIsSavingStep1(true);
    try {
      const draft = {
        title,
        slug,
        bannerUrl,
        shortDesc,
        startTime,
        endTime,
        themeColor,
        examPassword,
        requirePortrait,
        fullScreenExam,
        requiredFields,
        customLeaderboard,
        durationMinutes,
        maxAttempts,
        resultVisibility: showResultMode,
        attemptCalculation,
        shuffleMode,
        examMixPackages,
        prize1,
        prize2,
        prize3,
        prize4,
        prize1Count,
        prize2Count,
        prize3Count,
        prize4Count,
        creatorEmail: authUser?.email,
        creatorId: authUser?.id,
        unitGroupId: selectedGroupId,
        unitGroupName: unitGroupName.trim() || (unitGroups.find((g) => g.id === selectedGroupId)?.name || (organizerName ? `Khối ${organizerName}` : "Đơn vị đã cấu hình")),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`easup_contest_draft_${slug}`, JSON.stringify(draft));
      localStorage.setItem("easup_last_edited_slug", slug);
      localStorage.setItem("easup_contest_draft_last", JSON.stringify(draft));

      // Cập nhật URL trình duyệt với param ?edit=${slug}&step=2 để khi reload hay đăng nhập lại không bị mất
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("edit", slug);
        currentUrl.searchParams.set("step", "2");
        window.history.replaceState({}, "", currentUrl.toString());
      }

      // Đồng bộ trực tiếp lên Server store để toàn bộ hệ thống nhận dữ liệu ngay lập tức
      const res = await fetch(`/api/contests/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
        body: JSON.stringify(draft),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(resData.error || "Bạn không có quyền chỉnh sửa cuộc thi này!");
        return;
      }

      const msg = isEditMode
        ? "Đã lưu thay đổi thông tin cuộc thi thành công!"
        : "Đã lưu cuộc thi mới thành công!";
      setSaveToastMessage(msg);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
      setIsEditMode(true);

      // Chuyển sang Bước 2: Cài đặt đề thi
      handleNavigateStep(2);
    } catch (err: any) {
      console.error("Lỗi khi lưu cuộc thi:", err);
    } finally {
      setIsSavingStep1(false);
    }
  };
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [step2NoticeDismissed, setStep2NoticeDismissed] = useState(false);

  // Danh sách thông báo BTC (Ảnh 5)
  const [announcementsList, setAnnouncementsList] = useState<Array<{ id: string; title: string; time: string; author: string }>>([
    {
      id: "ann-1",
      title: "Phát động cuộc thi trực tuyến rộng rãi trên địa bàn 20 thôn buôn xã Ea Súp",
      time: "28/10/2026 08:00",
      author: "Ban Tổ Chức"
    },
    {
      id: "ann-2",
      title: "Đề nghị các đồng chí Trưởng thôn, Buôn trưởng đôn đốc đoàn viên, hội viên tham gia",
      time: "28/10/2026 09:30",
      author: "Ban Tuyên Giáo"
    }
  ]);
  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [showStep5Drawer, setShowStep5Drawer] = useState(true);
  const [copiedShortLink, setCopiedShortLink] = useState(false);
  const [copiedFullLink, setCopiedFullLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const THEME_COLORS = [
    "#0F172A",
    "#DC2626",
    "#E11D48",
    "#BE185D",
    "#047857",
    "#0F766E",
    "#0284C7",
    "#1D4ED8",
    "#D97706",
    "#B45309",
    "#06B6D4",
    "#0EA5E9",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#EC4899",
  ];

  // Bước 2: Cài đặt đề thi (2 chế độ: Ngân hàng & Thủ công)
  const [examMode, setExamMode] = useState<"manual" | "bank">("bank");
  const [questionsList, setQuestionsList] = useState<any[]>([]);

  // Tự động thiết lập số câu hỏi trong đề thi là tổng số câu hỏi đã chọn từ "ĐỀ THI HIỆN TẠI"
  // Khống chế số câu hỏi sử dụng trong cuộc thi luôn nhỏ hơn hoặc bằng tối đa trong tổng số trên
  useEffect(() => {
    const totalSelected = questionsList.length;
    if (totalSelected > 0) {
      setQuestionCount((prev) => {
        if (!prev || prev > totalSelected) {
          return totalSelected;
        }
        return prev;
      });

      setExamMixPackages((prev) => {
        if (prev.length > 0) {
          const first = prev[0];
          const currentCount = first.mcqCount;
          // Nếu chưa có hoặc lớn hơn tổng số câu đã chọn, tự động đặt bằng tổng số câu đã chọn
          const newCount = (!currentCount || currentCount > totalSelected) ? totalSelected : currentCount;
          return [
            {
              ...first,
              mcqCount: newCount,
            },
            ...prev.slice(1),
          ];
        }
        return [
          {
            id: "mix-1",
            packageName: "Đề thi mới tạo",
            mcqCount: totalSelected,
            essayCount: 0,
          },
        ];
      });
    }
  }, [questionsList.length]);

  // AI Generator state
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiTopic, setAiTopic] = useState("Luật Đất đai 2024 và Luật Căn cước 2023");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResultNotice, setAiResultNotice] = useState("");

  // Kho câu hỏi state đồng bộ với Kho đề thi (Ảnh 2)
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [bankPackages, setBankPackages] = useState<any[]>([]);
  const [selectedBankPackageId, setSelectedBankPackageId] = useState<string>("ALL");
  const [bankSearchQuery, setBankSearchQuery] = useState<string>("");
  const [isLoadingBank, setIsLoadingBank] = useState<boolean>(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  // Thủ công state
  const [manualQ, setManualQ] = useState({
    category: "Pháp luật chung",
    content: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: "A",
    explanation: "",
  });

  // Bước 3: Đơn vị dự thi (Nhóm đơn vị & Đơn vị con)
  const DEFAULT_UNIT_GROUPS = [
    {
      id: "group-party",
      name: "Khối Cơ quan Đảng - Đoàn thể",
      units: [
        "Ban Tuyên giáo Đảng ủy",
        "Ủy ban MTTQ Việt Nam xã Ea Súp",
        "Đoàn Thanh niên Cộng sản Hồ Chí Minh",
        "Hội Liên hiệp Phụ nữ xã",
        "Hội Nông dân xã Ea Súp",
        "Hội Cựu chiến binh xã",
        "Công đoàn cơ sở xã",
      ],
    },
    {
      id: "group-villages",
      name: "20 Thôn, Buôn Xã Ea Súp",
      units: EA_SUP_VILLAGES,
    },
    {
      id: "group-ubnd",
      name: "Khối UBND & Lực lượng vũ trang",
      units: [
        "Bộ phận Một cửa UBND xã",
        "Công an xã Ea Súp",
        "Ban Chỉ huy Quân sự xã",
        "Bộ phận Địa chính - Nông nghiệp",
        "Bộ phận Tư pháp - Hộ tịch",
      ],
    },
    {
      id: "group-schools",
      name: "Khối Trường học & Giáo dục",
      units: [
        "Trường THPT Ea Súp",
        "Trường THCS Lê Hồng Phong",
        "Trường Tiểu học Hùng Vương",
        "Trường Mầm non Hoa Phượng",
      ],
    },
    {
      id: "group-branches",
      name: "Khối Chi bộ trực thuộc Đảng ủy",
      units: [
        "Chi bộ Thôn 1",
        "Chi bộ Thôn 2",
        "Chi bộ Buôn Ea Súp",
        "Chi bộ Quân sự",
        "Chi bộ Công an",
        "Chi bộ Y tế",
      ],
    },
  ];

  const [unitGroups, setUnitGroups] = useState(DEFAULT_UNIT_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState("group-party");
  const [unitGroupName, setUnitGroupName] = useState("Khối Cơ quan Đảng - Đoàn thể");
  const [contestUnits, setContestUnits] = useState<string[]>([...DEFAULT_UNIT_GROUPS[0].units]);
  const [newUnitInput, setNewUnitInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupUnitsText, setNewGroupUnitsText] = useState("");
  const [unitFilterSearch, setUnitFilterSearch] = useState("");

  // Cho phép sửa tên nhóm / tổ chức trực tiếp tại ô Chọn đơn vị (Ảnh 1)
  const handleUnitGroupNameChange = (val: string) => {
    setUnitGroupName(val);
    setUnitGroups((prev) =>
      prev.map((g) => (g.id === selectedGroupId ? { ...g, name: val } : g))
    );
  };

  // Chọn nhóm đơn vị từ dropdown
  const handleSelectUnitGroup = (groupId: string) => {
    if (groupId === "NEW_GROUP") {
      setShowAddGroupModal(true);
      return;
    }
    setSelectedGroupId(groupId);
    const found = unitGroups.find((g) => g.id === groupId);
    if (found) {
      setUnitGroupName(found.name);
      setContestUnits([...found.units]);
    }
  };

  // Thêm đơn vị con mới (hỗ trợ nhập 1 hoặc nhiều cách nhau bằng dấu phẩy / xuống dòng)
  const handleAddUnit = () => {
    const val = newUnitInput.trim();
    if (!val) return;
    const splitUnits = val
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (splitUnits.length === 0) return;

    const newSet = new Set([...contestUnits]);
    splitUnits.forEach((u) => newSet.add(u));
    const next = Array.from(newSet);

    setContestUnits(next);
    setUnitGroups((prev) =>
      prev.map((g) => (g.id === selectedGroupId ? { ...g, units: next } : g))
    );
    setNewUnitInput("");
  };

  // Tạo tổ chức / đơn vị con mới (Ảnh 2)
  const handleCreateNewGroup = () => {
    if (!newGroupName.trim()) {
      alert("Vui lòng nhập tên tổ chức / đơn vị mới!");
      return;
    }
    const units = newGroupUnitsText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const createdGroup = {
      id: `group-custom-${Date.now()}`,
      name: newGroupName.trim(),
      units: units.length > 0 ? units : [newGroupName.trim()],
    };

    setUnitGroups((prev) => [createdGroup, ...prev]);
    setSelectedGroupId(createdGroup.id);
    setUnitGroupName(createdGroup.name);
    setContestUnits(createdGroup.units);
    setNewGroupName("");
    setNewGroupUnitsText("");
    setShowAddGroupModal(false);
  };

  // Thêm / dán hàng loạt đơn vị con
  const handleAddBulkUnits = () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const set = new Set([...contestUnits, ...lines]);
    const next = Array.from(set);
    setContestUnits(next);
    setUnitGroups((prev) =>
      prev.map((g) => (g.id === selectedGroupId ? { ...g, units: next } : g))
    );
    setBulkInput("");
    setShowBulkModal(false);
  };

  // Xóa 1 đơn vị con
  const handleRemoveUnit = (name: string) => {
    setContestUnits((prev) => {
      const next = prev.filter((u) => u !== name);
      setUnitGroups((prevGroups) =>
        prevGroups.map((g) => (g.id === selectedGroupId ? { ...g, units: next } : g))
      );
      return next;
    });
  };

  // Xóa tất cả đơn vị
  const handleClearAllUnits = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách đơn vị hiện tại?")) {
      setContestUnits([]);
      setUnitGroups((prevGroups) =>
        prevGroups.map((g) => (g.id === selectedGroupId ? { ...g, units: [] } : g))
      );
    }
  };

  // Bước 4: Trang thông tin BTC
  const [selectedOrgId, setSelectedOrgId] = useState("UBND");
  const [organizerName, setOrganizerName] = useState("Ủy ban Nhân dân xã Ea Súp");
  const [organizerAddress, setOrganizerAddress] = useState("Trung tâm hành chính xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk");
  const [organizerEmail, setOrganizerEmail] = useState("ubnd.easup@daklak.gov.vn");
  const [organizerPhone, setOrganizerPhone] = useState("0262.3688.114");
  const [announcement, setAnnouncement] = useState("Đề nghị các đồng chí Trưởng thôn, Buôn trưởng và Chi bộ tích cực đôn đốc nhân dân tham gia dự thi đạt 100% chỉ tiêu!");

  // Bước 5: Thống kê & Bảng xếp hạng
  const [statsData, setStatsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("ALL");
  const [copiedLink, setCopiedLink] = useState(false);

  // Đồng bộ kiểm tra trạng thái đăng nhập Ban Tổ Chức
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
                // Đồng bộ chính xác vai trò từ cơ sở dữ liệu
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Đăng nhập thất bại");
        return;
      }

      localStorage.setItem("cuocthi_admin_auth", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cuocthi_auth_change"));
      setAuthUser(data.user);
      setAuthError("");

      // Gắn thông tin người dùng vừa đăng nhập vào cuộc thi hiện tại để không bị quên
      if (slug && data.user) {
        fetch(`/api/contests/${slug}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": data.user.role || "",
            "x-user-email": data.user.email || "",
            "x-user-id": data.user.id || "",
          },
          body: JSON.stringify({
            creatorEmail: data.user.email,
            creatorId: data.user.id,
            creatorName: data.user.name,
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      setAuthError("Lỗi kết nối máy chủ khi đăng nhập: " + err.message);
    }
  };

  const handleGoogleLogin = async (overrideEmail?: string, overrideName?: string) => {
    const emailToUse = (overrideEmail || customGoogleEmail).trim().toLowerCase();
    if (!emailToUse) {
      const google = typeof window !== "undefined" ? (window as any).google : null;
      if (google?.accounts?.id) {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGoogleInputPrompt(true);
          }
        });
        return;
      }
      setShowGoogleInputPrompt(true);
      return;
    }

    try {
      setIsGoogleLoading(true);
      const nameToUse = overrideName || emailToUse.split("@")[0];

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, name: nameToUse }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Không thể đăng nhập Google");
        return;
      }
      syncAuthSession(data.user);
      setAuthUser(data.user);
      setAuthError("");
      setShowGoogleInputPrompt(false);

      if (slug && data.user) {
        fetch(`/api/contests/${slug}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": data.user.role || "",
            "x-user-email": data.user.email || "",
            "x-user-id": data.user.id || "",
          },
          body: JSON.stringify({
            creatorEmail: data.user.email,
            creatorId: data.user.id,
            creatorName: data.user.name,
          }),
        }).catch(() => {});
      }
    } catch (e: any) {
      setAuthError("Lỗi kết nối máy chủ Google: " + e.message);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOrgName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setAuthError("Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError("Mật khẩu xác nhận không trùng khớp! Vui lòng kiểm tra và nhập lại.");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regOrgName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          role: "USER", // Mặc định tài khoản đăng ký là Người dùng
          status: "PENDING", // Chưa phê duyệt
          organizationName: regOrgName.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError("Đăng ký không thành công: " + (data.error || "Có lỗi xảy ra"));
        return;
      }

      // CHƯA PHÊ DUYỆT THÌ CHƯA THỂ ĐĂNG NHẬP THÀNH CÔNG -> TUYỆT ĐỐI KHÔNG TỰ ĐỘNG ĐĂNG NHẬP
      alert(
        "Đăng ký tài khoản đơn vị thành công!\n\n" +
        "Tài khoản của bạn đang ở trạng thái 'Chờ xét duyệt'. Vui lòng đợi Quản trị viên (Admin) phê duyệt trước khi có thể đăng nhập khởi tạo cuộc thi."
      );
      setAuthTab("login");
      setLoginEmail(regEmail.trim());
      setLoginPassword("");
      setRegPassword("");
      setRegConfirmPassword("");
      setAuthError("");
    } catch (err: any) {
      setAuthError("Lỗi kết nối máy chủ khi đăng ký: " + err.message);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("cuocthi_admin_auth");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cuocthi_auth_change"));
    setAuthUser(null);
  };

  // Tự động sinh slug từ Title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setSlug(autoSlug);
  };

  // Nạp kho câu hỏi và bộ đề đồng bộ từ server theo quyền người dùng
  const loadBankQuestionsAndPackages = async (targetPkgId?: string, query?: string) => {
    try {
      setIsLoadingBank(true);
      const pkg = targetPkgId !== undefined ? targetPkgId : selectedBankPackageId;
      const q = query !== undefined ? query : bankSearchQuery;

      const params = new URLSearchParams();
      if (pkg && pkg !== "ALL") params.set("packageId", pkg);
      if (q && q.trim()) params.set("search", q.trim());

      const res = await fetch(`/api/questions/bank?${params.toString()}`, {
        headers: {
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
      });
      const data = await res.json();
      if (data.questions) {
        setBankQuestions(data.questions);
        // Nếu đề thi đang tạo chưa có câu nào và mới nạp lần đầu, chọn 5 câu đầu tiên làm mẫu
        setQuestionsList((prev) => {
          if (prev.length === 0 && (!targetPkgId || targetPkgId === "ALL") && !query) {
            return data.questions.slice(0, 5);
          }
          return prev;
        });
      }
      if (data.packages) {
        setBankPackages(data.packages);
      }
    } catch (err) {
      console.error("Lỗi nạp kho câu hỏi & bộ đề:", err);
    } finally {
      setIsLoadingBank(false);
    }
  };

  useEffect(() => {
    loadBankQuestionsAndPackages();
  }, [authUser]);

  // Chọn bộ đề trong kho
  const handleSelectBankPackage = (pkgId: string) => {
    setSelectedBankPackageId(pkgId);
    loadBankQuestionsAndPackages(pkgId, bankSearchQuery);
  };

  // Tìm kiếm câu hỏi trong kho
  const handleBankSearch = (query: string) => {
    setBankSearchQuery(query);
    loadBankQuestionsAndPackages(selectedBankPackageId, query);
  };

  // Thêm tất cả câu hỏi trong bộ lọc hiện tại vào đề thi
  const handleAddAllFilteredFromBank = () => {
    setQuestionsList((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const toAdd = bankQuestions.filter((q) => !existingIds.has(q.id));
      return [...prev, ...toAdd];
    });
  };

  // Bỏ chọn tất cả câu hỏi trong bộ lọc hiện tại khỏi đề thi
  const handleRemoveAllFilteredFromBank = () => {
    const filterIds = new Set(bankQuestions.map((q) => q.id));
    setQuestionsList((prev) => prev.filter((q) => !filterIds.has(q.id)));
  };

  // Nạp thống kê cho Bước 5
  useEffect(() => {
    if (currentStep === 5) {
      const activeSlug = slug || "tim-hieu-phap-luat-ea-sup-2026";
      fetch(`/api/contests/${activeSlug}/results?search=${encodeURIComponent(searchTerm)}&unitName=${filterUnit}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.stats) setStatsData(data);
        })
        .catch((err) => console.error(err));
    }
  }, [currentStep, searchTerm, filterUnit, slug]);

  // Xử lý tạo câu hỏi bằng AI
  const handleGenerateAi = async () => {
    setAiGenerating(true);
    setAiResultNotice("");

    const formData = new FormData();
    if (aiFile) formData.append("file", aiFile);
    formData.append("topic", aiTopic);
    formData.append("count", questionCount.toString());

    try {
      const res = await fetch("/api/admin/ai-generate-questions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAiResultNotice(data.error || "Lỗi tạo câu hỏi AI");
        return;
      }

      if (data.questions && data.questions.length > 0) {
        setQuestionsList((prev) => [...prev, ...data.questions]);
        setAiResultNotice(`✅ AI Gemini đã tạo thành công ${data.questions.length} câu hỏi kèm điều khoản trích dẫn!`);
      }
    } catch (err: any) {
      setAiResultNotice("Lỗi kết nối AI: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Thêm câu hỏi thủ công
  const handleAddManualQuestion = () => {
    if (!manualQ.content || !manualQ.optionA || !manualQ.optionB) {
      alert("Vui lòng nhập nội dung câu hỏi và ít nhất phương án A, B!");
      return;
    }

    const newQ = {
      id: `manual-${Date.now()}`,
      category: manualQ.category,
      content: manualQ.content,
      questionType: "SINGLE_CHOICE",
      options: [
        { id: "A", text: manualQ.optionA },
        { id: "B", text: manualQ.optionB },
        { id: "C", text: manualQ.optionC || "Phương án C" },
        { id: "D", text: manualQ.optionD || "Phương án D" },
      ],
      correctOptionIds: [manualQ.correct],
      explanation: manualQ.explanation || "Căn cứ quy định pháp luật hiện hành.",
      points: 10,
    };

    setQuestionsList((prev) => [...prev, newQ]);
    setManualQ({
      category: "Pháp luật chung",
      content: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct: "A",
      explanation: "",
    });
  };

  // Thêm câu hỏi từ Ngân hàng
  const handleAddFromBank = (q: any) => {
    if (questionsList.some((item) => item.id === q.id)) {
      setQuestionsList((prev) => prev.filter((item) => item.id !== q.id));
    } else {
      setQuestionsList((prev) => [...prev, q]);
    }
  };

  // Hoàn tất Xuất bản cuộc thi
  const handlePublishContest = async () => {
    setIsSubmitting(true);
    try {
      const unitsPayload = contestUnits.map((name, idx) => ({
        id: `unit-${idx + 1}`,
        name,
        groupType: "AGENCY",
      }));

      const method = isEditMode ? "PUT" : "POST";
      const endpoint = isEditMode ? `/api/contests/${slug}` : "/api/contests";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": authUser?.role || "",
          "x-user-email": authUser?.email || "",
          "x-user-id": authUser?.id || "",
        },
        body: JSON.stringify({
          title,
          slug,
          bannerUrl,
          rulesHtml,
          organizerName,
          organizerAddress,
          organizerEmail,
          organizerPhone,
          announcement,
          creatorEmail: authUser?.email,
          creatorId: authUser?.id,
          creatorName: authUser?.name,
          startTime,
          endTime,
          durationMinutes,
          questionCount: questionsList.length > 0
            ? Math.min(examMixPackages[0]?.mcqCount || questionsList.length, questionsList.length)
            : (questionCount || 5),
          maxAttempts,
          resultVisibility: showResultMode,
          attemptCalculation,
          shuffleMode,
          examMixPackages,
          hasTieBreaker,
          themeColor,
          shortDesc,
          requiredFields,
          customLeaderboard,
          examPassword,
          requirePortrait,
          fullScreenExam,
          prize1,
          prize2,
          prize3,
          prize4,
          prize1Count,
          prize2Count,
          prize3Count,
          prize4Count,
          unitGroupId: selectedGroupId,
          unitGroupName: unitGroupName.trim() || (unitGroups.find((g) => g.id === selectedGroupId)?.name || (organizerName ? `Khối ${organizerName}` : "Đơn vị đã cấu hình")),
          units: unitsPayload,
          questions: questionsList,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("easup_last_edited_slug", slug);
        localStorage.setItem(`easup_contest_draft_${slug}`, JSON.stringify({
          title, slug, bannerUrl, shortDesc, rulesHtml,
          prize1, prize2, prize3, prize4,
          prize1Count, prize2Count, prize3Count, prize4Count,
          unitGroupId: selectedGroupId,
          unitGroupName,
        }));
        if (typeof window !== "undefined") {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set("edit", slug);
          currentUrl.searchParams.set("step", "5");
          window.history.replaceState({}, "", currentUrl.toString());
        }
        setPublishSuccess(true);
        handleNavigateStep(5);
      } else {
        alert(data.error || "Không thể lưu cuộc thi!");
      }
    } catch (err: any) {
      alert("Lỗi xuất bản: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, title: "Tổng quan" },
    { num: 2, title: "Cài đặt đề thi" },
    { num: 3, title: "Chọn đơn vị" },
    { num: 4, title: "Trang thông tin" },
    { num: 5, title: "Xuất bản" },
  ];

  // Đồng bộ URL parameter ?edit=slug&step=1..5 và nạp dữ liệu cuộc thi khi Chỉnh sửa
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      if (stepParam) {
        const stepNum = parseInt(stepParam, 10);
        if (stepNum >= 1 && stepNum <= 5) {
          setCurrentStep(stepNum);
        }
      }

      const editSlug = params.get("edit") || params.get("slug");
      if (editSlug) {
        setIsEditMode(true);
        fetch(`/api/contests/${editSlug}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.contest) {
              const c = data.contest;

              // Kiểm tra quyền: Người dùng chỉ được sửa cuộc thi do chính mình tạo
              try {
                const savedAuth = localStorage.getItem("cuocthi_admin_auth");
                const currentAuth = savedAuth ? JSON.parse(savedAuth) : null;
                if (currentAuth && currentAuth.role !== "ADMIN") {
                  const userEmail = (currentAuth.email || "").toLowerCase().trim();
                  const creatorEmail = (c.creatorEmail || c.organizerEmail || "").toLowerCase().trim();
                  const isOwner =
                    (!creatorEmail && !c.creatorId) ||
                    (creatorEmail && creatorEmail === userEmail) ||
                    (c.creatorId && c.creatorId === currentAuth.id);
                  if (!isOwner) {
                    alert("Bạn không có quyền chỉnh sửa cuộc thi do đơn vị khác tạo! Hệ thống sẽ đưa bạn về Bảng điều khiển.");
                    window.location.href = "/admin";
                    return;
                  }
                }
              } catch (authErr) {
                console.error("Lỗi kiểm tra quyền sửa:", authErr);
              }

              if (c.title) setTitle(c.title);
              if (c.slug) setSlug(c.slug);
              if (c.bannerUrl) setBannerUrl(c.bannerUrl);
              if (c.shortDesc) setShortDesc(c.shortDesc);
              if (c.rulesHtml) setRulesHtml(c.rulesHtml);
              if (c.organizerName) setOrganizerName(c.organizerName);
              if (c.organizerAddress) setOrganizerAddress(c.organizerAddress);
              if (c.organizerEmail) setOrganizerEmail(c.organizerEmail);
              if (c.organizerPhone) setOrganizerPhone(c.organizerPhone);
              if (c.announcement) setAnnouncement(c.announcement);
              if (c.startTime) setStartTime(c.startTime.slice(0, 16));
              if (c.endTime) setEndTime(c.endTime.slice(0, 16));
              if (c.durationMinutes !== undefined) setDurationMinutes(c.durationMinutes);
              if (c.questionCount) setQuestionCount(c.questionCount);
              if (c.maxAttempts !== undefined) setMaxAttempts(c.maxAttempts);
              if (c.resultVisibility) setShowResultMode(c.resultVisibility);
              if (c.attemptCalculation) setAttemptCalculation(c.attemptCalculation);
              if (c.shuffleMode) setShuffleMode(c.shuffleMode);
              if (c.examMixPackages && Array.isArray(c.examMixPackages) && c.examMixPackages.length > 0) {
                setExamMixPackages(c.examMixPackages);
              }
              if (c.hasTieBreaker !== undefined) setHasTieBreaker(c.hasTieBreaker);
              if (c.themeColor) setThemeColor(c.themeColor);
              if (c.examPassword) setExamPassword(c.examPassword);
              if (c.requirePortrait) setRequirePortrait(c.requirePortrait);
              if (c.fullScreenExam !== undefined) setFullScreenExam(c.fullScreenExam);
              if (c.requiredFields) setRequiredFields(c.requiredFields);
              if (c.customLeaderboard) setCustomLeaderboard(c.customLeaderboard);
              if (c.prize1) setPrize1(c.prize1);
              if (c.prize2) setPrize2(c.prize2);
              if (c.prize3) setPrize3(c.prize3);
              if (c.prize4) setPrize4(c.prize4);
              if (c.prize1Count) setPrize1Count(c.prize1Count);
              if (c.prize2Count) setPrize2Count(c.prize2Count);
              if (c.prize3Count) setPrize3Count(c.prize3Count);
              if (c.prize4Count) setPrize4Count(c.prize4Count);
              if (c.units && c.units.length > 0) {
                const loadedUnitNames = c.units.map((u: any) =>
                  typeof u === "string" ? u : u.name
                );
                setContestUnits(loadedUnitNames);

                // Khớp ô "Chọn đơn vị" với thông tin đã thiết lập từ trước
                const matchedGroup = DEFAULT_UNIT_GROUPS.find(
                  (g) =>
                    g.units.length === loadedUnitNames.length &&
                    g.units.every((uName) => loadedUnitNames.includes(uName))
                );

                if (matchedGroup) {
                  setSelectedGroupId(matchedGroup.id);
                  setUnitGroupName(c.unitGroupName || matchedGroup.name);
                  setUnitGroups((groups) =>
                    groups.map((g) =>
                      g.id === matchedGroup.id ? { ...g, name: c.unitGroupName || matchedGroup.name, units: loadedUnitNames } : g
                    )
                  );
                } else {
                  // Đơn vị tùy chỉnh riêng đã cấu hình cho cuộc thi này
                  const customId = c.unitGroupId || `group-saved-${c.slug || c.id || "custom"}`;
                  const customName =
                    c.unitGroupName ||
                    (c.organizerName
                      ? `Khối ${c.organizerName}`
                      : `Đơn vị đã cấu hình (${c.title || "Cuộc thi"})`);

                  const savedGroup = {
                    id: customId,
                    name: customName,
                    units: loadedUnitNames,
                  };

                  setUnitGroups((prev) => {
                    const filtered = prev.filter(
                      (g) => g.id !== customId && g.id !== "group-saved-custom"
                    );
                    return [savedGroup, ...filtered];
                  });
                  setSelectedGroupId(customId);
                  setUnitGroupName(customName);
                }
              }
              if (c.questions && c.questions.length > 0) {
                setQuestionsList(c.questions);
              }
            }
          })
          .catch((err) => console.error("Lỗi nạp cuộc thi để chỉnh sửa:", err));
      } else {
        // Tự động khôi phục bản nháp hoặc cuộc thi đã tạo gần nhất khi người dùng đăng nhập lại
        try {
          const lastSlug = localStorage.getItem("easup_last_edited_slug");
          if (lastSlug) {
            fetch(`/api/contests/${lastSlug}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.contest) {
                  const c = data.contest;
                  if (c.title) setTitle(c.title);
                  if (c.slug) setSlug(c.slug);
                  if (c.bannerUrl) setBannerUrl(c.bannerUrl);
                  if (c.shortDesc) setShortDesc(c.shortDesc);
                  if (c.rulesHtml) setRulesHtml(c.rulesHtml);
                  if (c.prize1) setPrize1(c.prize1);
                  if (c.prize2) setPrize2(c.prize2);
                  if (c.prize3) setPrize3(c.prize3);
                  if (c.prize4) setPrize4(c.prize4);
                  if (c.prize1Count) setPrize1Count(c.prize1Count);
                  if (c.prize2Count) setPrize2Count(c.prize2Count);
                  if (c.prize3Count) setPrize3Count(c.prize3Count);
                  if (c.prize4Count) setPrize4Count(c.prize4Count);
                  if (c.unitGroupId) setSelectedGroupId(c.unitGroupId);
                  if (c.unitGroupName) setUnitGroupName(c.unitGroupName);
                  if (c.questions && c.questions.length > 0) setQuestionsList(c.questions);
                  setIsEditMode(true);
                }
              })
              .catch(() => {});
          } else {
            const lastDraftRaw = localStorage.getItem("easup_contest_draft_last");
            if (lastDraftRaw) {
              const d = JSON.parse(lastDraftRaw);
              if (d.title) setTitle(d.title);
              if (d.slug) setSlug(d.slug);
              if (d.bannerUrl) setBannerUrl(d.bannerUrl);
              if (d.shortDesc) setShortDesc(d.shortDesc);
              if (d.rulesHtml) setRulesHtml(d.rulesHtml);
              if (d.prize1) setPrize1(d.prize1);
              if (d.prize2) setPrize2(d.prize2);
              if (d.prize3) setPrize3(d.prize3);
              if (d.prize4) setPrize4(d.prize4);
              if (d.prize1Count) setPrize1Count(d.prize1Count);
              if (d.prize2Count) setPrize2Count(d.prize2Count);
              if (d.prize3Count) setPrize3Count(d.prize3Count);
              if (d.prize4Count) setPrize4Count(d.prize4Count);
              if (d.unitGroupId) setSelectedGroupId(d.unitGroupId);
              if (d.unitGroupName) setUnitGroupName(d.unitGroupName);
            }
          }
        } catch (e) {
          console.error("Lỗi phục hồi bản nháp:", e);
        }
      }
    }

    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const stepParam = params.get("step");
        if (stepParam) {
          const stepNum = parseInt(stepParam, 10);
          if (stepNum >= 1 && stepNum <= 5) {
            setCurrentStep(stepNum);
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigateStep = (stepNum: number) => {
    if (stepNum < 1 || stepNum > 5) return;
    setCurrentStep(stepNum);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", String(stepNum));
      window.history.pushState({}, "", url.toString());
    }
  };

  // Trạng thái đang kiểm tra authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Đang kiểm tra quyền truy cập Quản trị viên...</p>
        </div>
      </div>
    );
  }

  // Giao diện Đăng nhập / Đăng ký hệ thống (Đồng bộ chuẩn xác theo modal Trang chủ - Ảnh 5)
  if (!authUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-dialog border border-slate-200 relative">
          {/* Nút thoát về Trang chủ */}
          <Link
            href="/"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
            title="Đóng / Về Trang chủ"
          >
            <X className="w-4 h-4" />
          </Link>

          {/* Header Modal */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Landmark className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {authTab === "login" ? "Đăng Nhập Hệ Thống" : "Đăng Ký Tài Khoản Mới"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {authTab === "login"
                ? "Đăng nhập tài khoản hệ thống (Mặc định: Người dùng; Admin: Khi được phân quyền)"
                : "Đăng ký tài khoản cho cơ quan, chi bộ, thôn buôn (Cần Admin xét duyệt)"}
            </p>
          </div>

          {/* Box phân quyền tự động theo Ảnh 5 */}
          {authTab === "login" && (
            <div className="p-3 mb-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Hệ thống tự động phân quyền theo tài khoản đã được phê duyệt. Tài khoản mới tạo mặc định quyền <strong>Người dùng</strong>.
              </span>
            </div>
          )}

          {authError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          {/* FORM ĐĂNG NHẬP (ẢNH 5) */}
          {authTab === "login" ? (
            <div className="space-y-4">
              {/* Nút Đăng nhập Google */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <GoogleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{isGoogleLoading ? "Đang xác thực Google..." : "Đăng nhập bằng Google"}</span>
                </button>

                {showGoogleInputPrompt && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                      <span>Nhập tài khoản Google (@gmail.com) trên máy bạn:</span>
                      <button
                        type="button"
                        onClick={() => setShowGoogleInputPrompt(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        required
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="tai-khoan-cua-ban@gmail.com"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-800"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleGoogleLogin(customGoogleEmail)}
                        disabled={isGoogleLoading}
                        className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                    Hoặc qua mật khẩu
                  </span>
                </div>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email / Tên tài khoản <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                    title={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] transition-all text-sm cursor-pointer shadow-sm"
              >
                Đăng nhập ngay
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    setAuthError("");
                  }}
                  className="text-xs text-slate-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Chưa có tài khoản đơn vị? <strong className="text-[#DC2626] underline">Đăng ký ngay</strong>
                </button>
              </div>
            </form>
          </div>
          ) : (
            /* FORM ĐĂNG KÝ */
            <form onSubmit={handleAdminRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên cơ quan / Thôn buôn / Đơn vị <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regOrgName}
                  onChange={(e) => setRegOrgName(e.target.value)}
                  placeholder="Ví dụ: Hội Nông dân Xã Ea Súp hoặc Thôn 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email liên hệ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="donvi@easupso.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0888023023"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhập lại mật khẩu <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] transition-all text-sm cursor-pointer shadow-sm"
              >
                Đăng ký tài khoản ngay
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setAuthError("");
                  }}
                  className="text-xs text-slate-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Đã có tài khoản? <strong className="text-[#DC2626] underline">Đăng nhập ngay</strong>
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 text-center border-t border-slate-100 mt-5">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center space-x-1"
            >
              <span>← Quay về Trang chủ Cổng Cuộc thi</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-6">
      {/* Auth Status Bar (Ghi thật ngắn gọn: chỉ ghi họ tên) */}
      <div className="mb-5 bg-emerald-50 border border-emerald-300 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-950 truncate">
            {authUser.name}
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <Link
            href="/admin"
            className="text-xs font-bold text-slate-700 hover:text-[#DC2626] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors inline-flex items-center"
          >
            <Landmark className="w-3.5 h-3.5 mr-1 text-[#DC2626]" />
            Bảng điều khiển BTC
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-colors"
          >
            Về Trang chủ
          </Link>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
            title="Đăng xuất tài khoản"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* 2-Column Wizard Layout with Persistent Left Sidebar on ALL 5 Steps */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ========================================================= */}
        {/* THANH CÔNG CỤ BÊN TRÁI THEO MẪU MYALOHA (ÁP DỤNG MỌI BƯỚC) */}
        {/* ========================================================= */}
        <aside className="w-full lg:w-60 xl:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs lg:sticky lg:top-6 space-y-4">
          {/* Nhóm Điều Hướng Chính */}
          <div className="space-y-1">
            {/* 1. Trang chủ */}
            <Link
              href="/admin"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#DC2626] hover:bg-red-50/60 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Home className="w-4 h-4 text-[#DC2626]" />
              </div>
              <span>Trang chủ</span>
            </Link>

            {/* 2. Cuộc thi Trắc nghiệm */}
            <Link
              href="/admin"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#DC2626] bg-red-50/70 border border-red-100/60 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="truncate">Cuộc thi Trắc nghiệm</span>
            </Link>

            {/* 3. Cuộc thi Ảnh/Video */}
            <Link
              href="/admin"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#DC2626] hover:bg-red-50/60 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Compass className="w-4 h-4 text-[#DC2626]" />
              </div>
              <span className="truncate">Cuộc thi Ảnh/Video</span>
            </Link>
          </div>

          {/* Phân mục Kho Nội Dung */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 px-3 mb-2 flex items-center justify-between">
              <span>KHO NỘI DUNG</span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">
                bước 2-4
              </span>
            </div>

            <div className="space-y-1">
              {/* Đề thi */}
              <button
                type="button"
                onClick={() => handleNavigateStep(2)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                  currentStep === 2
                    ? "font-bold text-[#DC2626] bg-red-50 border border-red-200"
                    : "font-medium text-slate-700 hover:text-[#DC2626] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <span>Đề thi</span>
                </div>
                {questionsList.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {questionsList.length}
                  </span>
                )}
              </button>

              {/* Thông báo BTC */}
              <button
                type="button"
                onClick={() => handleNavigateStep(4)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                  currentStep === 4
                    ? "font-bold text-[#DC2626] bg-red-50 border border-red-200"
                    : "font-medium text-slate-700 hover:text-[#DC2626] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <span>Thông báo BTC</span>
                </div>
                {announcementsList.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {announcementsList.length}
                  </span>
                )}
              </button>

              {/* Đơn vị */}
              <button
                type="button"
                onClick={() => handleNavigateStep(3)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                  currentStep === 3
                    ? "font-bold text-[#DC2626] bg-red-50 border border-red-200"
                    : "font-medium text-slate-700 hover:text-[#DC2626] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <span>Đơn vị</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {contestUnits.length}
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* CỘT NỘI DUNG CHÍNH (Stepper + Các Bước 1, 2, 3, 4, 5) */}
        <main className="flex-1 min-w-0 w-full space-y-6">

          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* MYALOHA 5-STEP STEPPER (Ảnh 2, 3, 4, 5) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Stepper with 5 connected circular buttons */}
              <div className="flex-1 max-w-2xl mx-auto py-1">
                <div className="flex items-center justify-between relative">
                  {/* Continuous background connecting line */}
                  <div className="absolute top-4 left-6 right-6 h-[2px] bg-slate-200 -z-0">
                    <div
                      className="h-full bg-[#DC2626] transition-all duration-300"
                      style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                    />
                  </div>

                  {/* 5 Step Nodes */}
                  {stepsHeader.map((step) => {
                    const isPassed = step.num <= currentStep;
                    const isCurrent = step.num === currentStep;

                    return (
                      <button
                        key={step.num}
                        type="button"
                        onClick={() => handleNavigateStep(step.num)}
                        className="group relative z-10 flex flex-col items-center focus:outline-none cursor-pointer"
                      >
                        {/* Circular Number Badge */}
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            isPassed
                              ? "bg-[#DC2626] text-white shadow-sm ring-4 ring-red-50"
                              : "bg-[#94A3B8] text-white hover:bg-slate-400"
                          }`}
                        >
                          {step.num}
                        </div>

                        {/* Title Label Underneath */}
                        <span
                          className={`mt-1.5 text-[11px] sm:text-xs tracking-tight transition-colors ${
                            isCurrent
                              ? "text-slate-900 font-bold"
                              : isPassed
                              ? "text-slate-700 font-medium"
                              : "text-slate-400 font-normal"
                          }`}
                        >
                          {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nút kích hoạt mở panel bên phải khi đang thu gọn */}
              {!showStep5Drawer && (
                <button
                  type="button"
                  onClick={() => setShowStep5Drawer(true)}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#DC2626] hover:border-red-200 bg-slate-50 transition-all cursor-pointer shadow-2xs"
                  title="Mở bảng tiện ích & QR"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Bảng tiện ích</span>
                </button>
              )}
            </div>
          </div>

      {/* Main Form Body */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        {/* ========================================================= */}
        {/* BƯỚC 1: TỔNG QUAN (Layout 2 cột Ảnh 2) */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Trái: Live Mobile/Tablet Preview (Ảnh 2) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-lg bg-[#111827] p-3 sm:p-4 rounded-3xl shadow-2xl border-4 border-slate-700 text-white relative overflow-hidden">
                {/* Screen Header Bar */}
                <div className="flex items-center justify-between pb-3 px-1 text-xs text-slate-300 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-white text-red-600 flex items-center justify-center font-bold text-xs shadow-xs">
                      🏛️
                    </div>
                    <span className="font-semibold text-slate-200">cuocthi.easupso.com</span>
                  </div>
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                    Ea Súp Live
                  </span>
                </div>

                {/* Banner Preview Area */}
                <div
                  className="rounded-2xl p-4 sm:p-5 relative overflow-hidden text-center shadow-inner transition-colors duration-300"
                  style={{ backgroundColor: themeColor }}
                >
                  {/* Subtle lotus ornament background */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                  {/* Banner Image Preview nếu người dùng đã tải banner */}
                  {bannerUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden shadow-md max-h-36 border border-white/20">
                      <img
                        src={bannerUrl}
                        alt="Banner Preview"
                        className="w-full h-28 sm:h-32 object-cover"
                      />
                    </div>
                  )}

                  <div className="inline-block bg-white text-red-600 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-xs">
                    Tham gia ngay »»»
                  </div>

                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight text-white mb-1">
                    NỀN TẢNG TUYÊN TRUYỀN TRỰC TUYẾN XÃ EA SÚP
                  </h3>
                  <p className="text-[11px] text-white/90 max-w-xs mx-auto leading-relaxed">
                    {shortDesc || "với công nghệ chống gian lận bảo mật Zero-Trust"}
                  </p>

                  {/* Contest title bar */}
                  <div className="mt-4 bg-black/35 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                    <p className="text-[10px] uppercase tracking-widest text-red-200 font-semibold mb-0.5">
                      Cuộc thi trực tuyến
                    </p>
                    <h4 className="text-sm sm:text-base font-bold text-white uppercase leading-snug">
                      {title || "CUỘC THI TÌM HIỂU NGHỊ QUYẾT XÃ EA SÚP"}
                    </h4>
                  </div>

                  {/* Countdown Block with Lotus Decoration (Ảnh 2) */}
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="text-[11px] font-bold text-amber-300 tracking-wider uppercase mb-2">
                      THỜI GIAN CÒN LẠI
                    </p>
                    {(() => {
                      const target = endTime ? new Date(endTime).getTime() : Date.now() + 30 * 86400000;
                      const diff = Math.max(0, target - Date.now());
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                      const minutes = Math.floor((diff / 1000 / 60) % 60);
                      const seconds = Math.floor((diff / 1000) % 60);
                      return (
                        <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-slate-900">
                          <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm text-center min-w-[42px]">
                            <span className="block text-sm sm:text-base font-black leading-none text-red-600">{String(days).padStart(2, "0")}</span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">Ngày</span>
                          </div>
                          <span className="text-white font-bold text-base">:</span>
                          <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm text-center min-w-[42px]">
                            <span className="block text-sm sm:text-base font-black leading-none text-red-600">{String(hours).padStart(2, "0")}</span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">Giờ</span>
                          </div>
                          <span className="text-white font-bold text-base">:</span>
                          <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm text-center min-w-[42px]">
                            <span className="block text-sm sm:text-base font-black leading-none text-red-600">{String(minutes).padStart(2, "0")}</span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">Phút</span>
                          </div>
                          <span className="text-white font-bold text-base">:</span>
                          <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm text-center min-w-[42px]">
                            <span className="block text-sm sm:text-base font-black leading-none text-red-600">{String(seconds).padStart(2, "0")}</span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">Giây</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Lotus flower silhouette SVG decoration */}
                    <div className="mt-4 text-center">
                      <svg className="w-14 h-14 mx-auto opacity-40 text-white" viewBox="0 0 100 100" fill="currentColor">
                        <path d="M50 15 C45 35 30 50 10 55 C30 60 45 75 50 95 C55 75 70 60 90 55 C70 50 55 35 50 15 Z" />
                      </svg>
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleNavigateStep(2)}
                        className="w-full py-2.5 px-4 bg-white text-red-600 font-black text-xs uppercase rounded-xl shadow-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Vào làm bài thi thử nghiệm »
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5 text-slate-300 font-semibold mb-1">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>Xem trước màn hình thí sinh (Mobile-Ready)</span>
                  </div>
                  <p>
                    Giao diện tự động co giãn tối ưu chuẩn màn hình 375px - 414px khi bà con mở liên kết từ Zalo hoặc quét mã QR.
                  </p>
                </div>
              </div>
            </div>

            {/* Cột Phải: Settings Drawer (Ảnh 2) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Banner Upload Box with (X) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Banner</label>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingBanner ? "Đang tải ảnh..." : "Tải banner lên"}</span>
                  </button>
                </div>

                {/* Input file ẩn hỗ trợ chọn ảnh từ máy */}
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  onChange={handleBannerUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                {/* Khung ảnh preview Banner */}
                <div
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="relative rounded-xl border border-slate-200 overflow-hidden group bg-slate-50 cursor-pointer transition-all hover:border-red-400 hover:shadow-xs"
                  title="Nhấp để tải ảnh banner mới từ thiết bị"
                >
                  <img
                    src={bannerUrl || "/banner-easup.png"}
                    alt="Banner cuộc thi"
                    className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("banner-easup.png")) {
                        target.src = "/banner-easup.png";
                      }
                    }}
                  />

                  {/* Nút (X) tròn ở góc trên bên trái đúng như ảnh chụp */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBannerUrl("/banner-easup.png");
                    }}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors text-xs z-10 cursor-pointer"
                    title="Đặt lại ảnh mặc định"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Lớp overlay hướng dẫn khi rê chuột */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1">
                    <Upload className="w-5 h-5 drop-shadow" />
                    <span className="text-xs font-bold drop-shadow">Nhấp để thay đổi ảnh banner</span>
                  </div>

                  {/* Hiệu ứng loading khi đang upload */}
                  {isUploadingBanner && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center space-x-2 z-20">
                      <div className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-slate-800">Đang tải ảnh lên...</span>
                    </div>
                  )}
                </div>

                {/* Nút bấm tải banner lên (Đã bỏ ô nhập URL theo Yêu cầu 1) */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-red-300 bg-red-50/70 hover:bg-red-100/80 text-[#DC2626] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                  >
                    <Upload className="w-4 h-4 text-[#DC2626]" />
                    <span>{isUploadingBanner ? "Đang xử lý tệp..." : "Tải banner từ thiết bị (JPG, PNG, WEBP)"}</span>
                  </button>
                </div>
              </div>

              {/* Tên cuộc thi với bộ đếm ký tự 75/300 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center">
                    Tên cuộc thi <Info className="w-3.5 h-3.5 ml-1 text-slate-400" />
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {title.length} / 300
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Nhập tên cuộc thi..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 outline-none font-semibold text-slate-800 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Thể lệ cuộc thi (Đồng bộ Ảnh 1) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Thể lệ cuộc thi</label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {shortDesc.length} ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={shortDesc}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShortDesc(val);
                    setRulesHtml(val.replace(/\n/g, "<br/>"));
                  }}
                  placeholder="Nhập thể lệ cuộc thi..."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 outline-none text-slate-700 focus:border-red-600 leading-relaxed bg-white"
                />
              </div>

              {/* 4 Ô Nhập thông tin giải thưởng - Mỗi giải một hàng rộng rãi (Đồng bộ Ảnh 2 & Ảnh 3) */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center">
                    <Trophy className="w-4 h-4 mr-1.5 text-amber-500" />
                    Cơ cấu giải thưởng cá nhân (Đồng bộ trang thi &amp; lưu trữ hệ thống)
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">Mỗi giải 1 hàng - Không gian nhập rộng rãi</span>
                </div>

                <div className="space-y-2.5">
                  {/* Hàng 1: Giải Nhất */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-amber-200/80 shadow-2xs hover:border-amber-400 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="w-20 sm:w-24 shrink-0 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5 shrink-0"></span>
                        <span className="text-xs font-black text-amber-800 uppercase tracking-wide">Giải Nhất</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Số giải:</span>
                        <input
                          type="text"
                          value={prize1Count}
                          onChange={(e) => setPrize1Count(e.target.value)}
                          placeholder="01"
                          title="Số lượng giải Nhất"
                          className="w-12 sm:w-14 px-1.5 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-300 outline-none bg-amber-50/40 text-amber-900 focus:border-amber-500 focus:bg-white shadow-2xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 w-full">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Phần thưởng:</span>
                        <input
                          type="text"
                          value={prize1}
                          onChange={(e) => setPrize1(e.target.value)}
                          placeholder="VD: 5.000.000 đồng/giải hoặc Giấy khen + Tiền thưởng..."
                          className="w-full flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none bg-white font-medium text-slate-800 focus:border-amber-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hàng 2: Giải Nhì */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-400 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="w-20 sm:w-24 shrink-0 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500 mr-1.5 shrink-0"></span>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Giải Nhì</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Số giải:</span>
                        <input
                          type="text"
                          value={prize2Count}
                          onChange={(e) => setPrize2Count(e.target.value)}
                          placeholder="02"
                          title="Số lượng giải Nhì"
                          className="w-12 sm:w-14 px-1.5 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-300 outline-none bg-slate-50 text-slate-900 focus:border-slate-500 focus:bg-white shadow-2xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 w-full">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Phần thưởng:</span>
                        <input
                          type="text"
                          value={prize2}
                          onChange={(e) => setPrize2(e.target.value)}
                          placeholder="VD: 3.000.000 đồng/giải hoặc Giấy khen + Tiền thưởng..."
                          className="w-full flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none bg-white font-medium text-slate-800 focus:border-slate-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hàng 3: Giải Ba */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-orange-200/80 shadow-2xs hover:border-orange-400 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="w-20 sm:w-24 shrink-0 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5 shrink-0"></span>
                        <span className="text-xs font-black text-orange-800 uppercase tracking-wide">Giải Ba</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Số giải:</span>
                        <input
                          type="text"
                          value={prize3Count}
                          onChange={(e) => setPrize3Count(e.target.value)}
                          placeholder="03"
                          title="Số lượng giải Ba"
                          className="w-12 sm:w-14 px-1.5 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-300 outline-none bg-orange-50/40 text-orange-900 focus:border-orange-500 focus:bg-white shadow-2xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 w-full">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Phần thưởng:</span>
                        <input
                          type="text"
                          value={prize3}
                          onChange={(e) => setPrize3(e.target.value)}
                          placeholder="VD: 1.000.000 đồng/giải hoặc Giấy khen + Tiền thưởng..."
                          className="w-full flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none bg-white font-medium text-slate-800 focus:border-orange-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hàng 4: Giải Khuyến khích */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-purple-200/80 shadow-2xs hover:border-purple-400 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="w-20 sm:w-24 shrink-0 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 shrink-0"></span>
                        <span className="text-xs font-black text-purple-800 uppercase tracking-wide">Giải KK</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Số giải:</span>
                        <input
                          type="text"
                          value={prize4Count}
                          onChange={(e) => setPrize4Count(e.target.value)}
                          placeholder="05"
                          title="Số lượng giải Khuyến khích"
                          className="w-12 sm:w-14 px-1.5 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-300 outline-none bg-purple-50/40 text-purple-900 focus:border-purple-500 focus:bg-white shadow-2xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 w-full">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">Phần thưởng:</span>
                        <input
                          type="text"
                          value={prize4}
                          onChange={(e) => setPrize4(e.target.value)}
                          placeholder="VD: 750.000 đồng/giải hoặc Giấy khen + Tiền thưởng..."
                          className="w-full flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none bg-white font-medium text-slate-800 focus:border-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bắt đầu & Kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kết thúc</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Màu chủ đề (16 Swatches - Ảnh 2) */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center mb-1.5">
                  Màu chủ đề <Lock className="w-3 h-3 ml-1 text-slate-400" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setThemeColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        themeColor === c ? "scale-125 ring-2 ring-slate-900 ring-offset-2" : "hover:scale-110"
                      }`}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Mật khẩu phòng thi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="text"
                  value={examPassword}
                  onChange={(e) => setExamPassword(e.target.value)}
                  placeholder="Để trống nếu không đặt mật khẩu phòng thi"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none"
                />
              </div>

              {/* Yêu cầu chụp ảnh chân dung */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center mb-1">
                  Yêu cầu chụp ảnh chân dung <Lock className="w-3 h-3 ml-1 text-slate-400" />
                </label>
                <select
                  value={requirePortrait}
                  onChange={(e) => setRequirePortrait(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none"
                >
                  <option value="none">Không yêu cầu</option>
                  <option value="start">Chụp khi bắt đầu thi</option>
                  <option value="periodic">Chụp định kỳ ngẫu nhiên</option>
                </select>
              </div>

              {/* Mở toàn màn hình khi thi (Toggle) */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700">Mở toàn màn hình khi thi</span>
                <button
                  type="button"
                  onClick={() => setFullScreenExam(!fullScreenExam)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    fullScreenExam ? "bg-[#DC2626]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      fullScreenExam ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Thông tin bắt buộc (Yêu cầu 3 - Ảnh 2) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Thông tin bắt buộc</label>
                  <button
                    type="button"
                    onClick={() => setShowRequiredFieldsModal(true)}
                    className="text-[11px] font-bold text-[#DC2626] hover:text-red-700 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Thiết lập</span>
                  </button>
                </div>
                <div
                  onClick={() => setShowRequiredFieldsModal(true)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                  title="Nhấp để thiết lập các trường thông tin bắt buộc khi thí sinh đăng ký (Ảnh 2)"
                >
                  <span className="truncate font-medium text-slate-800">{requiredFields}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              </div>

              {/* Tùy chỉnh Bảng xếp hạng */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center mb-1">
                  Tùy chỉnh Bảng xếp hạng <Lock className="w-3 h-3 ml-1 text-slate-400" />
                </label>
                <input
                  type="text"
                  value={customLeaderboard}
                  onChange={(e) => setCustomLeaderboard(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none text-slate-600 bg-slate-50"
                />
              </div>

              {/* Cấu hình thời gian làm bài & Số lượt */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian (Phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lượt thi tối đa</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Nút Lưu / Lưu thay đổi để tiếp tục sang Bước 2 (Yêu cầu 4) */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingStep1}
                  onClick={handleSaveStep1AndNext}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                  title={isEditMode ? "Lưu thay đổi và chuyển sang Bước 2" : "Lưu cuộc thi mới và chuyển sang Bước 2"}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingStep1 ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Lưu"}</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 2: CÀI ĐẶT ĐỀ THI (Layout 2 cột Ảnh 3) */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Trái: 3 Thẻ Lựa Chọn Phương Thức Soạn Đề (Ảnh 3) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Thẻ 1: Chọn từ Kho đề thi */}
                <div
                  onClick={() => setExamMode("bank")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center group ${
                    examMode === "bank"
                      ? "border-[#DC2626] bg-red-50/40 shadow-sm ring-1 ring-red-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                    Chọn từ Kho đề thi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chọn câu hỏi có sẵn của xã Ea Súp
                  </p>
                </div>

                {/* Thẻ 2: Soạn đề thủ công */}
                <div
                  onClick={() => setExamMode("manual")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center group ${
                    examMode === "manual"
                      ? "border-[#DC2626] bg-red-50/40 shadow-sm ring-1 ring-red-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Sliders className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                    Soạn đề thủ công
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tự thêm từng câu hỏi &amp; đáp án
                  </p>
                </div>
              </div>

              {examMode === "manual" && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="text-sm font-bold text-slate-900">
                    Thêm Câu Hỏi Mới Thủ Công
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nội dung câu hỏi
                      </label>
                      <textarea
                        rows={2}
                        value={manualQ.content}
                        onChange={(e) => setManualQ({ ...manualQ, content: e.target.value })}
                        placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phương án A</label>
                      <input
                        type="text"
                        value={manualQ.optionA}
                        onChange={(e) => setManualQ({ ...manualQ, optionA: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phương án B</label>
                      <input
                        type="text"
                        value={manualQ.optionB}
                        onChange={(e) => setManualQ({ ...manualQ, optionB: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phương án C</label>
                      <input
                        type="text"
                        value={manualQ.optionC}
                        onChange={(e) => setManualQ({ ...manualQ, optionC: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phương án D</label>
                      <input
                        type="text"
                        value={manualQ.optionD}
                        onChange={(e) => setManualQ({ ...manualQ, optionD: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Đáp án đúng</label>
                      <select
                        value={manualQ.correct}
                        onChange={(e) => setManualQ({ ...manualQ, correct: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold text-emerald-700"
                      >
                        <option value="A">Phương án A</option>
                        <option value="B">Phương án B</option>
                        <option value="C">Phương án C</option>
                        <option value="D">Phương án D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trích dẫn điều khoản luật</label>
                      <input
                        type="text"
                        value={manualQ.explanation}
                        onChange={(e) => setManualQ({ ...manualQ, explanation: e.target.value })}
                        placeholder="Ví dụ: Căn cứ Điều 159 Luật Đất đai 2024..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddManualQuestion}
                      className="btn-admin-primary text-xs px-4 py-2 font-bold"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Thêm vào đề thi
                    </button>
                  </div>
                </div>
              )}

              {examMode === "bank" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  {/* THANH BỘ ĐỀ (PACKAGE FILTER & SEARCH - ĐỒNG BỘ ẢNH 2) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <Layers className="w-4 h-4 text-[#DC2626]" />
                        <span>Bộ Đề Thi ({bankPackages.length} BỘ ĐỀ):</span>
                      </div>

                      <div className="relative max-w-xs w-full">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={bankSearchQuery}
                          onChange={(e) => handleBankSearch(e.target.value)}
                          placeholder="Tìm câu hỏi, điều khoản luật..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-red-600"
                        />
                      </div>
                    </div>

                    {/* Pills danh sách bộ đề (Tất cả, Cựu chiến binh, Bộ đề Chung Xã Ea Súp...) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectBankPackage("ALL")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedBankPackageId === "ALL"
                            ? "bg-[#DC2626] text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        Tất cả ({bankPackages.reduce((acc, p) => acc + (p.questionCount || 0), 0) || bankQuestions.length})
                      </button>

                      {bankPackages.map((pkg) => {
                        const isSelected = selectedBankPackageId === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => handleSelectBankPackage(pkg.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                              isSelected
                                ? "bg-[#DC2626] text-white shadow-xs font-bold"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span>{pkg.isSystem ? "🏛️" : "📁"}</span>
                            <span className="max-w-[180px] truncate">{pkg.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {pkg.questionCount || 0}
                            </span>
                            {!pkg.isSystem && (
                              <span title="Bộ đề riêng tư của bạn">
                                <Lock
                                  className={`w-3 h-3 ${isSelected ? "text-white" : "text-amber-600"}`}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* THANH THAO TÁC NHANH & THỐNG KÊ */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1 border-b border-slate-100 text-xs">
                    <div className="text-slate-600">
                      Hiển thị <strong className="text-slate-900">{bankQuestions.length}</strong> câu hỏi • Đã chọn vào đề:{" "}
                      <strong className="text-[#DC2626]">
                        {bankQuestions.filter((q) => questionsList.some((item) => item.id === q.id)).length}
                      </strong>
                      /{bankQuestions.length} câu
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleAddAllFilteredFromBank}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] transition-all cursor-pointer"
                        title="Thêm toàn bộ câu hỏi trong bộ lọc hiện tại vào đề thi"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        + Chọn tất cả ({bankQuestions.length} câu)
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveAllFilteredFromBank}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-[11px] transition-all cursor-pointer"
                        title="Bỏ các câu hỏi trong bộ lọc này khỏi đề thi"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Bỏ chọn bộ lọc này
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÂU HỎI TRONG KHO (HIỂN THỊ ĐẦY ĐỦ NHƯ ẢNH 2) */}
                  {isLoadingBank ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Đang tải câu hỏi từ kho đề thi...
                    </div>
                  ) : bankQuestions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                      Không tìm thấy câu hỏi nào trong bộ đề này.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                      {bankQuestions.map((q, idx) => {
                        const isAdded = questionsList.some((item) => item.id === q.id);
                        return (
                          <div
                            key={q.id || idx}
                            className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                              isAdded
                                ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-[#DC2626]">[{q.category}]</span>
                                {q.packageName && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
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
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                                  {q.points || 10} điểm
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleAddFromBank(q)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center ${
                                    isAdded
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                      : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300"
                                  }`}
                                  title={isAdded ? "Bấm để bỏ câu này khỏi đề thi" : "Bấm để thêm câu này vào đề thi"}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 mr-1" />
                                      Đã chọn
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5 mr-1" />
                                      + Thêm
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Nội dung câu hỏi */}
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-relaxed">
                              Câu {idx + 1}: {q.content}
                            </div>

                            {/* Lưới các phương án A, B, C, D (Đồng bộ ảnh 2) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                              {q.options?.map((opt: any) => {
                                const isCorrect = q.correctOptionIds?.includes(opt.id);
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2 rounded-lg border text-[11px] leading-snug transition-colors ${
                                      isCorrect
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                        : "bg-white border-slate-200"
                                    }`}
                                  >
                                    <span className="font-bold mr-1">{opt.id}.</span> {opt.text}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Trích dẫn điều khoản luật (Ảnh 2) */}
                            {q.explanation && (
                              <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 leading-relaxed">
                                <strong>Trích dẫn luật:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cột Phải: Drawer Thông Báo & Danh Sách Đề Thi (Ảnh 3) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Thông báo hướng dẫn xem trước (Ảnh 3) */}
              {!step2NoticeDismissed && (
                <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs text-slate-700 relative flex items-start space-x-2">
                  <span className="text-[#DC2626] font-bold text-sm leading-none mt-0.5">↑</span>
                  <div className="flex-1 pr-4">
                    Chọn nút xem trước và nhấn tham gia để thi thử ngay sau khi cài đặt xong đề thi.{" "}
                    <button
                      type="button"
                      onClick={() => setStep2NoticeDismissed(true)}
                      className="text-[#DC2626] font-bold underline hover:text-red-800"
                    >
                      Đã hiểu
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep2NoticeDismissed(true)}
                    className="absolute top-2.5 right-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Danh sách đề thi */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Đề thi hiện tại ({questionsList.length} câu)
                  </h4>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowExamSettingsDrawer(true)}
                      className="text-[11px] text-[#DC2626] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                      title="Mở bảng cài đặt đề thi nâng cao"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Cài đặt đề thi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMobileModal(true)}
                      className="text-[11px] text-[#DC2626] font-semibold hover:underline cursor-pointer"
                    >
                      Xem trước
                    </button>
                  </div>
                </div>

                {questionsList.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-500 mb-2">
                      Chưa có đề thi.{" "}
                      <span
                        onClick={() => setExamMode("manual")}
                        className="text-[#DC2626] font-bold underline cursor-pointer"
                      >
                        Thêm ngay
                      </span>
                    </p>
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto text-sm">
                      📝
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {questionsList.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between hover:border-slate-300 shadow-2xs"
                      >
                        <div className="text-xs pr-2">
                          <div className="font-bold text-slate-900 mb-0.5">
                            Câu {idx + 1}: {q.content}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Đáp án: <strong className="text-emerald-700">{q.correct || "A"}</strong> • {q.category}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestionsList((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Xóa câu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 3: CHỌN ĐƠN VỊ (Theo yêu cầu Ảnh 1 & Ảnh 2) */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Trái: Toàn bộ phần này chỉ để 1 nút "TẠO TỔ CHỨC/ĐƠN VỊ CON" (Ảnh 2) */}
            <div className="lg:col-span-4 flex flex-col justify-start">
              <button
                type="button"
                onClick={() => setShowAddGroupModal(true)}
                className="w-full py-4 px-5 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>TẠO TỔ CHỨC/ĐƠN VỊ CON</span>
              </button>
            </div>

            {/* Cột Phải: Ô text Chọn đơn vị & Thêm / Xóa đơn vị con (Ảnh 1) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Ô text Chọn đơn vị (Ảnh 1 - cho phép sửa trực tiếp) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Chọn đơn vị
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Chọn mẫu nhanh:</span>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => handleSelectUnitGroup(e.target.value)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 font-medium outline-none cursor-pointer"
                    >
                      {unitGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.units.length} đơn vị con)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  value={unitGroupName}
                  onChange={(e) => handleUnitGroupNameChange(e.target.value)}
                  placeholder="Nhập hoặc chỉnh sửa tên tổ chức / đơn vị..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-800 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 shadow-2xs"
                />
              </div>

              {/* Danh sách các đơn vị con đã cấu hình (Ảnh 1 - cho phép thêm, xóa đơn vị con) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    ĐÃ CẤU HÌNH {contestUnits.length} ĐƠN VỊ
                  </span>
                  {contestUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllUnits}
                      className="text-[11px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Ô nhập thêm đơn vị con mới (Ảnh 1) */}
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={newUnitInput}
                    onChange={(e) => setNewUnitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUnit();
                      }
                    }}
                    placeholder="Nhập tên đơn vị con mới rồi bấm Thêm (VD: Chi hội Buôn Ea Súp)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Thêm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(true)}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Dán danh sách nhiều đơn vị con"
                  >
                    <span>Dán nhiều</span>
                  </button>
                </div>

                {/* Danh sách thẻ tag đơn vị con (Ảnh 1 - nút X xóa từng đơn vị) */}
                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {contestUnits.length === 0 ? (
                    <div className="w-full text-center py-4 text-xs text-slate-400">
                      Chưa có đơn vị con nào. Hãy nhập tên đơn vị con ở trên hoặc chọn mẫu nhanh.
                    </div>
                  ) : (
                    contestUnits.map((u, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <span>{u}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(u)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition-colors cursor-pointer"
                          title={`Xóa ${u}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 4: TRANG THÔNG TIN BAN TỔ CHỨC */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center">
                <Info className="w-4 h-4 mr-2 text-[#DC2626]" />
                THÔNG TIN BAN TỔ CHỨC
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="Lê Hạnh / Thường trực UB MTTQ Việt Nam xã Ea Súp"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={organizerAddress}
                    onChange={(e) => setOrganizerAddress(e.target.value)}
                    placeholder="Vui lòng nhập địa chỉ"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={organizerPhone}
                    onChange={(e) => setOrganizerPhone(e.target.value)}
                    placeholder="Vui lòng nhập số điện thoại"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* THÔNG BÁO BAN TỔ CHỨC */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-[#DC2626]" />
                THÔNG BÁO BAN TỔ CHỨC
              </h3>
              <textarea
                rows={4}
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Nhập nội dung thông điệp, chỉ đạo hoặc lưu ý của Ban Tổ Chức..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 5: XUẤT BẢN & THỐNG KÊ (MẪU ẢNH MYALOHA) */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6">

            {/* Bảng KẾT QUẢ THI & 2 Thẻ Sóng (Mẫu Ảnh MyAloha) */}
            <div className="space-y-6">
              {/* 2 Thẻ Sóng (Red & Blue Wave Cards theo đúng Mẫu Ảnh) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Thẻ 1: Lượt thi (Sóng đỏ) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between h-44 relative group hover:shadow-md transition-shadow">
                  <div className="p-5 z-10">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {statsData?.stats?.totalAttempts || 0}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                      Lượt thi
                    </div>
                  </div>
                  <div className="w-full h-20 -mb-1">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="redWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#EF4444" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#FEE2E2" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,80 C150,140 300,10 500,70 L500,150 L0,150 Z"
                        fill="url(#redWaveGrad)"
                      />
                      <path
                        d="M0,80 C150,140 300,10 500,70"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>
                </div>

                {/* Thẻ 2: Lượt đăng ký (Sóng xanh) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between h-44 relative group hover:shadow-md transition-shadow">
                  <div className="p-5 z-10">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {statsData?.stats?.totalParticipants || 0}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                      Lượt đăng ký
                    </div>
                  </div>
                  <div className="w-full h-20 -mb-1">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="blueWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,70 C180,10 320,130 500,60 L500,150 L0,150 Z"
                        fill="url(#blueWaveGrad)"
                      />
                      <path
                        d="M0,70 C180,10 320,130 500,60"
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phần KẾT QUẢ THI */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                    KẾT QUẢ THI
                  </h2>

                  <div className="flex items-center space-x-2">
                    {!showStep5Drawer && (
                      <button
                        type="button"
                        onClick={() => setShowStep5Drawer(true)}
                        className="btn-admin-secondary text-xs px-3 py-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" /> Mở Cột Tiện Ích &amp; QR
                      </button>
                    )}
                    <a
                      href={`/api/contests/${slug || "tim-hieu-phap-luat-ea-sup-2026"}/export`}
                      download
                      className="btn-admin-primary text-xs px-4 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 border-emerald-800 inline-flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1.5" /> Xuất file Excel (.xlsx)
                    </a>
                  </div>
                </div>

                {/* Bộ lọc Từ ngày - Đến ngày & Tìm kiếm */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo Họ tên, CCCD hoặc SĐT..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs outline-none"
                    />
                  </div>

                  <div>
                    {(() => {
                      const displayUnits = (contestUnits && contestUnits.length > 0)
                        ? contestUnits
                        : (statsData?.units && statsData.units.length > 0)
                          ? statsData.units.map((u: any) => typeof u === "string" ? u : u.name)
                          : EA_SUP_VILLAGES;
                      return (
                        <select
                          value={filterUnit}
                          onChange={(e) => setFilterUnit(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                        >
                          <option value="ALL">
                            -- Tất cả {displayUnits.length} Đơn vị đã cấu hình --
                          </option>
                          {displayUnits.map((v: string) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Ranking Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Hạng</th>
                        <th className="py-3 px-3">Họ và Tên</th>
                        <th className="py-3 px-3">Đơn vị (Thôn/Buôn)</th>
                        <th className="py-3 px-3">Ngày dự thi</th>
                        <th className="py-3 px-3">Kết quả</th>
                        <th className="py-3 px-3">Độ chính xác</th>
                        <th className="py-3 px-3">Thời gian làm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(statsData?.leaderboard || []).map((row: any) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {row.rank <= 3 ? (
                              <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white inline-flex items-center justify-center text-[10px]">
                                {row.rank}
                              </span>
                            ) : (
                              row.rank
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {row.fullName}
                            <div className="text-[10px] text-slate-400 font-normal">{row.cccd}</div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">{row.unitName}</td>
                          <td className="py-3 px-3 text-slate-500">
                            {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#DC2626]">
                            {row.score} điểm ({row.correctCount}/{row.totalQuestions})
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-700">
                            {row.accuracyPercent}%
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {Math.floor(row.durationSeconds / 60)}p {row.durationSeconds % 60}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-8">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => handleNavigateStep(currentStep - 1)}
            className="btn-admin-secondary text-xs sm:text-sm px-4 py-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Bước trước
          </button>

          <div className="flex items-center space-x-3">
            {currentStep === 1 ? (
              <button
                type="button"
                disabled={isSavingStep1}
                onClick={handleSaveStep1AndNext}
                className="btn-admin-primary text-xs sm:text-sm px-6 py-2.5 font-bold cursor-pointer flex items-center shadow-sm"
                title={isEditMode ? "Lưu thay đổi thông tin cuộc thi và sang bước tiếp theo" : "Lưu thông tin cuộc thi và sang bước tiếp theo"}
              >
                {isSavingStep1 ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Lưu"}
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : currentStep < 4 ? (
              <button
                type="button"
                onClick={() => handleNavigateStep(currentStep + 1)}
                className="btn-admin-primary text-xs sm:text-sm px-5 py-2 font-bold cursor-pointer"
              >
                Tiếp tục <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : currentStep === 4 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishContest}
                className="btn-admin-primary text-xs sm:text-sm px-6 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-700 shadow-md cursor-pointer"
              >
                {isSubmitting ? "Đang xuất bản..." : "Xuất bản cuộc thi (Hoàn tất)"}
              </button>
            ) : (
              <Link
                href={`/thi/${slug}`}
                className="btn-admin-primary text-xs sm:text-sm px-5 py-2 font-bold"
              >
                Xem trang thi thực tế
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  </div>

      {/* ========================================================= */}
      {/* QUICK-ACTION MODALS (Ảnh 2, 3, 4, 5) */}
      {/* ========================================================= */}

      {/* 1. Modal Xem Trước Giao Diện Mobile 375px */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <Smartphone className="w-4 h-4 mr-1.5 text-[#DC2626]" />
                Xem trước Mobile (375px)
              </span>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 relative">
              <iframe
                src={`/thi/${slug}?preview=1&theme=${encodeURIComponent(themeColor)}&title=${encodeURIComponent(title)}&banner=${encodeURIComponent(bannerUrl)}&start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}&desc=${encodeURIComponent(shortDesc)}&t=${Date.now()}`}
                className="w-full h-full border-0"
                title="Mobile Preview Frame"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Bảo Mật Zero-Trust */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Tiêu Chuẩn Bảo Mật Zero-Trust Phòng Thi</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="font-bold text-emerald-900 mb-0.5">1. Zero Answer Leakage</p>
                <p>Máy chủ không trả về đáp án đúng khi thí sinh bắt đầu làm bài. Toàn bộ chấm điểm thực hiện tại Server.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-0.5">2. Server-Side Timer &amp; Anti-cheat</p>
                <p>Thời gian làm bài tính từ timestamp Server. Tự động đếm số lần chuyển tab (tabSwitchCount).</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-0.5">3. LocalStorage 4G Auto-save</p>
                <p>Tự động lưu tạm đáp án trên điện thoại phòng khi mạng 4G chập chờn hoặc reload trang.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="btn-admin-primary text-xs px-4 py-2 font-bold"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Chia Sẻ Cuộc Thi & QR */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <Share2 className="w-4 h-4 mr-1.5 text-sky-600" />
                Chia Sẻ Cuộc Thi Trực Tuyến
              </span>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-40 h-40 bg-slate-100 border border-slate-200 rounded-2xl mx-auto flex items-center justify-center p-2 mb-4">
              <QrCode className="w-28 h-28 text-slate-800" />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Quét mã QR bằng Camera điện thoại hoặc Zalo để vào phòng thi
            </p>
            <div className="flex items-center bg-slate-50 p-2 rounded-xl border border-slate-200 mb-4">
              <input
                type="text"
                readOnly
                value={`https://cuocthi.easupso.com/thi/${slug}`}
                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://cuocthi.easupso.com/thi/${slug}`);
                  alert("Đã sao chép liên kết vào bộ nhớ tạm!");
                }}
                className="ml-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                Sao chép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Mẫu Kế Hoạch Tổ Chức */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>Mẫu Kế Hoạch Tổ Chức Cuộc Thi Trực Tuyến Xã Ea Súp</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-serif">
              <p className="text-center font-bold uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                Độc lập - Tự do - Hạnh phúc
              </p>
              <p className="text-center italic text-slate-500">
                Ea Súp, ngày 28 tháng 10 năm 2026
              </p>
              <p className="text-center font-bold text-sm uppercase text-red-700">
                KẾ HOẠCH TỔ CHỨC CUỘC THI TRỰC TUYẾN<br />
                NĂM 2026 TRÊN ĐỊA BÀN XÃ EA SÚP
              </p>
              <p>
                <strong>I. MỤC ĐÍCH, YÊU CẦU:</strong> Tuyên truyền sâu rộng nghị quyết, pháp luật và chuyển đổi số đến 100% cán bộ, đoàn viên, hội viên và nhân dân 20 thôn, buôn.
              </p>
              <p>
                <strong>II. HÌNH THỨC DỰ THI:</strong> Thi trắc nghiệm trực tuyến trên cổng <code>cuocthi.easupso.com</code>.
              </p>
              <p>
                <strong>III. THỜI GIAN:</strong> Phát động từ tháng 10/2026 đến hết tháng 12/2026.
              </p>
            </div>
            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => alert("Đang xuất mẫu kế hoạch định dạng Word (.docx)...")}
                className="btn-admin-primary text-xs px-4 py-2 font-bold"
              >
                <Download className="w-3.5 h-3.5 mr-1 inline" /> Tải về (.docx)
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="btn-admin-secondary text-xs px-4 py-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Thêm Thông Báo Ban Tổ Chức (Ảnh 5) */}
      {showAddAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
              <Plus className="w-4 h-4 mr-1 text-[#DC2626]" />
              Thêm Thông Báo Mới Ban Tổ Chức
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Thông báo sẽ hiển thị trên drawer thông tin cuộc thi gửi đến các thí sinh.
            </p>
            <textarea
              rows={3}
              value={newAnnTitle}
              onChange={(e) => setNewAnnTitle(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddAnnModal(false);
                  setNewAnnTitle("");
                }}
                className="btn-admin-secondary text-xs px-4 py-2"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newAnnTitle.trim()) return;
                  const newAnn = {
                    id: "ann-" + Date.now(),
                    title: newAnnTitle.trim(),
                    time: "Hôm nay, " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                    author: organizerName || "Ban Tổ Chức"
                  };
                  setAnnouncementsList((prev) => [newAnn, ...prev]);
                  setNewAnnTitle("");
                  setShowAddAnnModal(false);
                }}
                className="btn-admin-primary text-xs px-4 py-2 font-bold"
              >
                Đăng thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Thông tin bắt buộc khi thí sinh đăng ký (Theo đúng mẫu thiết kế Ảnh 2) */}
      {showRequiredFieldsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowRequiredFieldsModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tiêu đề & phụ đề căn giữa theo đúng Ảnh 2 */}
            <div className="text-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">
                Thông tin bắt buộc
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Yêu cầu người tham dự nhập vào
              </p>
            </div>

            {/* Danh sách 12 trường thông tin */}
            <div className="space-y-3.5 mb-8 max-h-[55vh] overflow-y-auto px-1">
              {PROPOSED_REQUIRED_FIELDS.map((field) => {
                const isSelected = selectedRequiredFields.includes(field.id);
                const isLocked = field.isLocked;

                return (
                  <div
                    key={field.id}
                    onClick={() => {
                      if (!isLocked) handleToggleRequiredField(field.id);
                    }}
                    className={`flex items-center space-x-3 select-none ${
                      isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer group"
                    }`}
                  >
                    {/* Checkbox phong cách Ảnh 2: bo tròn nhẹ, màu đỏ khi chọn */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-[#DC2626] border-[#DC2626] text-white"
                          : "border-slate-300 bg-white group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Nhãn trường */}
                    <span
                      className={`text-sm font-medium flex items-center ${
                        isSelected ? "text-slate-900 font-semibold" : "text-slate-600"
                      }`}
                    >
                      {field.label}
                      {field.hasInfo && (
                        <Info className="w-4 h-4 ml-1.5 text-slate-400 inline" />
                      )}
                      {field.isLocked && (
                        <Lock className="w-3.5 h-3.5 ml-1.5 text-slate-400 inline" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Nút Lưu thay đổi màu đỏ rực rỡ bo tròn theo đúng Ảnh 2 */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSaveRequiredFields}
                className="w-full sm:w-auto px-10 py-3 rounded-2xl bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Thêm / Dán Hàng Loạt Đơn Vị Con (Ảnh 1) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Thêm / Dán Hàng Loạt Đơn Vị Con
                </h3>
                <p className="text-xs text-slate-500">
                  Mỗi dòng là một đơn vị con (Thôn, Buôn, Chi bộ, Lớp học...)
                </p>
              </div>
            </div>

            {/* Các nút nạp nhanh */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  const prefix = bulkInput.trim() ? bulkInput + "\n" : "";
                  setBulkInput(prefix + EA_SUP_VILLAGES.join("\n"));
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer"
              >
                + 20 Thôn, Buôn Ea Súp
              </button>
              <button
                type="button"
                onClick={() => {
                  const doanThe = [
                    "Ban Tuyên giáo Đảng ủy",
                    "Ủy ban MTTQ Việt Nam xã Ea Súp",
                    "Đoàn Thanh niên Cộng sản Hồ Chí Minh",
                    "Hội Liên hiệp Phụ nữ xã",
                    "Hội Nông dân xã Ea Súp",
                    "Hội Cựu chiến binh xã",
                    "Công đoàn cơ sở xã",
                  ];
                  const prefix = bulkInput.trim() ? bulkInput + "\n" : "";
                  setBulkInput(prefix + doanThe.join("\n"));
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer"
              >
                + Khối Đoàn Thể
              </button>
              <button
                type="button"
                onClick={() => {
                  const truongHoc = [
                    "Trường THPT Ea Súp",
                    "Trường THCS Lê Hồng Phong",
                    "Trường Tiểu học Hùng Vương",
                    "Trường Mầm non Hoa Phượng",
                  ];
                  const prefix = bulkInput.trim() ? bulkInput + "\n" : "";
                  setBulkInput(prefix + truongHoc.join("\n"));
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              >
                + Khối Trường Học
              </button>
            </div>

            <textarea
              rows={8}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={"Ví dụ:\nThôn 1\nThôn 2\nBuôn Ea Súp\nChi bộ Quân sự\nChi đoàn Thanh niên..."}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-500 mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkInput("");
                }}
                className="btn-admin-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddBulkUnits}
                className="btn-admin-primary text-xs px-5 py-2 font-bold cursor-pointer"
              >
                + Thêm vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Tạo Tổ Chức / Đơn Vị Con (Ảnh 2) */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowAddGroupModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase">
                  TẠO TỔ CHỨC / ĐƠN VỊ CON
                </h3>
                <p className="text-xs text-slate-500">
                  Tạo khối tổ chức dự thi và danh sách các chi hội, thôn buôn, chi bộ trực thuộc
                </p>
              </div>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tổ chức / Đơn vị <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Khối HỘI CCB XÃ EA SÚP hoặc Khối Doanh nghiệp"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-red-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Danh sách đơn vị con thuộc nhóm (Mỗi dòng một đơn vị)
                </label>
                <textarea
                  rows={6}
                  value={newGroupUnitsText}
                  onChange={(e) => setNewGroupUnitsText(e.target.value)}
                  placeholder={"Ví dụ:\nChi hội thôn 1\nChi hội thôn 2\nChi hội thôn 3\nChi hội thôn 4\nChi hội thôn 5\nChi hội thôn 6..."}
                  className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddGroupModal(false);
                  setNewGroupName("");
                  setNewGroupUnitsText("");
                }}
                className="btn-admin-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateNewGroup}
                className="btn-admin-primary text-xs px-5 py-2 font-bold cursor-pointer"
              >
                Tạo &amp; Áp dụng ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo lưu thành công */}
      {showSaveToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center space-x-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{saveToastMessage}</span>
        </div>
      )}

      {/* Floating Action Bar */}
      <FloatingActionBar
        contestSlug={slug}
        currentStep={currentStep}
        onNavigateStep={(step) => handleNavigateStep(step)}
        onOpenExamSettings={() => setShowExamSettingsDrawer(true)}
        onToggleMobilePreview={() => setShowMobileModal(true)}
      />

      {/* Drawer Cài Đặt Đề Thi Nâng Cao (Ảnh 1) */}
      <ExamSettingsDrawer
        isOpen={showExamSettingsDrawer}
        onClose={() => setShowExamSettingsDrawer(false)}
        totalSelectedQuestions={questionsList.length}
        durationMinutes={durationMinutes}
        onChangeDurationMinutes={setDurationMinutes}
        showResultMode={showResultMode}
        onChangeShowResultMode={setShowResultMode}
        maxAttempts={maxAttempts}
        onChangeMaxAttempts={setMaxAttempts}
        attemptCalculation={attemptCalculation}
        onChangeAttemptCalculation={setAttemptCalculation}
        shuffleMode={shuffleMode}
        onChangeShuffleMode={setShuffleMode}
        examMixPackages={examMixPackages}
        onChangeExamMixPackages={setExamMixPackages}
        availablePackages={bankPackages.map((p) => ({ id: p.id, name: p.name }))}
        currentStep={currentStep}
        onNavigateStep={handleNavigateStep}
        onToggleMobilePreview={() => setShowMobileModal(true)}
        onOpenSecurity={() => setShowSecurityModal(true)}
        onOpenShare={() => setShowShareModal(true)}
        onApplySettings={() => {
          const draft = {
            ...JSON.parse(localStorage.getItem(`easup_contest_draft_${slug}`) || "{}"),
            durationMinutes,
            maxAttempts,
            resultVisibility: showResultMode,
            attemptCalculation,
            shuffleMode,
            examMixPackages,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(`easup_contest_draft_${slug}`, JSON.stringify(draft));
          if (slug) {
            fetch(`/api/contests/${slug}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
            }).catch(() => {});
          }
          setSaveToastMessage("Đã lưu các thiết lập đề thi tiên tiến thành công!");
          setShowSaveToast(true);
          setTimeout(() => setShowSaveToast(false), 3000);
        }}
      />
    </div>
  );
}
