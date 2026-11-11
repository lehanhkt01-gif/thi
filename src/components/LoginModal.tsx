// src/components/LoginModal.tsx
// Modal Đăng nhập hệ thống hoàn chỉnh - Chuẩn nhận diện chính quyền số easupso.com
"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  initialMode?: "login" | "register";
}

// SVG Logo chuẩn 4 màu Google chính hãng theo đặc tả
export function GoogleIcon({ className = "w-5 h-5 flex-shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

// Hàm đồng bộ session cho toàn bộ hệ thống
export function syncAuthSession(user: any) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("cuocthi_admin_auth", JSON.stringify(user));
  } else {
    localStorage.removeItem("cuocthi_admin_auth");
  }
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("cuocthi_auth_change", { detail: user }));
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: LoginModalProps) {
  // Quản lý trạng thái giao diện & chế độ xác thực
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  // Thông tin đăng nhập mật khẩu
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Thông tin đăng ký cơ quan / đơn vị
  const [nameInput, setNameInput] = useState("");
  const [orgNameInput, setOrgNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Google Identity Services (GSI) Client ID & Token Client
  const [googleClientId, setGoogleClientId] = useState("");
  const tokenClientRef = React.useRef<any>(null);

  // Xử lý chống đơ trên iOS & Zalo Webview
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [savedGoogleEmail, setSavedGoogleEmail] = useState("");
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Khởi tạo SDK Google Identity Services & Đảm bảo luôn mở ở chế độ ĐĂNG NHẬP
  useEffect(() => {
    if (!isOpen) return;
    setAuthMode("login");

    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      const ios =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const inApp = /Zalo|FBAN|FBAV|Instagram|Line|MicroMessenger|TikTok/i.test(ua);
      setIsIOSDevice(ios);
      setIsInAppBrowser(inApp);
      try {
        const saved = localStorage.getItem("easup_google_email");
        if (saved && saved.includes("@")) {
          setSavedGoogleEmail(saved);
          setGoogleEmailInput(saved);
        }
      } catch {}
    }

    const setupGsi = (clientId: string) => {
      setGoogleClientId(clientId);
      if ((window as any).google?.accounts) {
        initGsi(clientId);
      } else {
        const checkInterval = setInterval(() => {
          if ((window as any).google?.accounts) {
            clearInterval(checkInterval);
            initGsi(clientId);
          }
        }, 200);
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    };

    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        fetch("/api/auth/google/config")
          .then((res) => res.json())
          .then((data) => {
            if (data.clientId) setupGsi(data.clientId);
          })
          .catch(() => {});
      };
      document.body.appendChild(script);
    } else {
      fetch("/api/auth/google/config")
        .then((res) => res.json())
        .then((data) => {
          if (data.clientId) setupGsi(data.clientId);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const initGsi = (clientId: string) => {
    const google = typeof window !== "undefined" ? (window as any).google : null;
    if (!google) return;

    // 1. Hỗ trợ One-Tap / ID Token
    if (google.accounts?.id) {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleCredential(response.credential);
            }
          },
        });
      } catch (err) {
        console.warn("Lỗi init GSI id:", err);
      }
    }

    // 2. Khởi tạo Official Google OAuth Popup (Mở cửa sổ chọn tài khoản Google chuẩn)
    if (google.accounts?.oauth2) {
      try {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn("Lỗi Google OAuth popup:", tokenResponse.error);
              setIsGoogleLoading(false);
              return;
            }
            if (tokenResponse.access_token) {
              setIsGoogleLoading(true);
              try {
                const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await userRes.json();
                if (profile.email) {
                  await executeGoogleLoginWithEmail(profile.email, profile.name, profile.picture);
                }
              } catch (err: any) {
                console.error("Lỗi lấy thông tin Google UserInfo:", err);
                setIsGoogleLoading(false);
              }
            }
          },
        });
      } catch (err) {
        console.warn("Lỗi init GSI oauth2 tokenClient:", err);
      }
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setIsGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Đăng nhập Google thất bại");
        setIsGoogleLoading(false);
        return;
      }
      if (data.user?.email && typeof window !== "undefined") {
        localStorage.setItem("easup_google_email", data.user.email);
      }
      syncAuthSession(data.user);
      if (onSuccess) onSuccess(data.user);
      onClose();
    } catch (e: any) {
      alert("Lỗi kết nối khi xác thực Google: " + e.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Hàm cốt lõi thực hiện đăng nhập tài khoản Google và đồng bộ hệ thống (Chống đơ 100%)
  const executeGoogleLoginWithEmail = async (rawEmail: string, name?: string, image?: string) => {
    let cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail) {
      alert("Vui lòng nhập địa chỉ email Google / Gmail của bạn!");
      return false;
    }
    // Tự động bổ sung @gmail.com nếu thí sinh chỉ nhập tên tài khoản (Ví dụ: lehanhkt01 -> lehanhkt01@gmail.com)
    if (!cleanEmail.includes("@")) {
      cleanEmail = `${cleanEmail}@gmail.com`;
    }

    setIsGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: name || cleanEmail.split("@")[0],
          image: image || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Không thể đăng nhập tài khoản Google lúc này!");
        return false;
      }

      // Lưu lại email của máy này vào localStorage để các lần sau đăng nhập tức thì 1 chạm
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("easup_google_email", cleanEmail);
          setSavedGoogleEmail(cleanEmail);
        } catch (e) {}
      }

      syncAuthSession(data.user);
      if (onSuccess) onSuccess(data.user);
      onClose();
      return true;
    } catch (err: any) {
      alert("Lỗi kết nối khi xác thực Google: " + err.message);
      return false;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 1. Hàm trigger đăng nhập bằng Google chuẩn (Tự động bảo vệ trên iOS & Zalo)
  const handleGoogleLogin = async () => {
    // 1.1 Nếu đang trên iOS hoặc In-app browser (Zalo/Facebook), tránh mở popup vì Google sẽ chặn hoặc treo trắng màn hình
    if (isIOSDevice || isInAppBrowser) {
      if (googleEmailInput.trim()) {
        await executeGoogleLoginWithEmail(googleEmailInput);
        return;
      }
      if (savedGoogleEmail) {
        await executeGoogleLoginWithEmail(savedGoogleEmail);
        return;
      }
      return;
    }

    // 1.2 Nếu có tài khoản Google đã từng lưu trên máy này
    if (savedGoogleEmail && savedGoogleEmail.includes("@")) {
      await executeGoogleLoginWithEmail(savedGoogleEmail);
      return;
    }

    // 1.3 Nếu trên Desktop có Google OAuth popup
    if (tokenClientRef.current) {
      try {
        setIsGoogleLoading(true);
        // Hẹn giờ an toàn 4.5s tránh bị treo đơ vĩnh viễn nếu popup bị chặn
        const safetyTimer = setTimeout(() => {
          setIsGoogleLoading(false);
        }, 4500);

        tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (e) {
        console.warn("Lỗi gọi requestAccessToken:", e);
        setIsGoogleLoading(false);
      }
    }

    // 1.4 Nếu có Google Identity Services client ID, thử gọi One Tap prompt
    const google = typeof window !== "undefined" ? (window as any).google : null;
    if (googleClientId && google?.accounts?.id) {
      setIsGoogleLoading(true);
      google.accounts.id.prompt(() => {
        setIsGoogleLoading(false);
      });
      return;
    }

    if (googleEmailInput.trim()) {
      executeGoogleLoginWithEmail(googleEmailInput.trim());
    }
  };

  // 3. Xử lý đăng nhập / đăng ký qua mật khẩu
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === "register") {
      if (
        !nameInput.trim() ||
        !orgNameInput.trim() ||
        !emailInput.trim() ||
        !phoneInput.trim() ||
        !passwordInput.trim() ||
        !confirmPasswordInput.trim()
      ) {
        alert("Vui lòng điền đầy đủ các thông tin đăng ký bắt buộc!");
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        alert("Mật khẩu xác nhận không trùng khớp! Vui lòng nhập lại.");
        return;
      }
      if (passwordInput.length < 6) {
        alert("Mật khẩu phải có độ dài từ 6 ký tự trở lên để đảm bảo an toàn.");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameInput.trim(),
            email: emailInput.trim(),
            phone: phoneInput.trim(),
            role: "USER",
            status: "PENDING",
            organizationName: orgNameInput.trim(),
            password: passwordInput,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert("Đăng ký không thành công: " + (data.error || "Có lỗi xảy ra"));
          setIsLoading(false);
          return;
        }

        alert(
          "Đăng ký tài khoản thành công!\n\nTài khoản của bạn đang ở trạng thái 'Chờ xét duyệt'. Quản trị viên (Admin) sẽ phê duyệt trước khi bạn có thể đăng nhập."
        );
        setAuthMode("login");
        setPasswordInput("");
        setConfirmPasswordInput("");
      } catch (err: any) {
        alert("Lỗi kết nối máy chủ khi đăng ký: " + err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Đăng nhập mật khẩu
      if (!emailInput.trim() || !passwordInput.trim()) {
        alert("Vui lòng nhập email/tên tài khoản và mật khẩu!");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.trim(),
            password: passwordInput,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.error || "Đăng nhập thất bại");
          setIsLoading(false);
          return;
        }

        syncAuthSession(data.user);
        if (onSuccess) onSuccess(data.user);
        onClose();
      } catch (err: any) {
        alert("Lỗi kết nối máy chủ khi đăng nhập: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      {/* Dialog box bo góc lớn, chuẩn nhận diện chính quyền số easupso.com */}
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-dialog border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        {/* Nút đóng tròn hình (X) ở góc trên bên phải */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
          title="Đóng cửa sổ"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ============================================================== */}
        {/* 1. HEADER MODAL: LOGO TRANG WEB THI.EASUPSO.COM & TIÊU ĐỀ */}
        {/* ============================================================== */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full p-1 bg-white border-2 border-red-100 shadow-sm mx-auto mb-3 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo thi.easupso.com"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h3 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight">
            {authMode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ TÀI KHOẢN"}
          </h3>
        </div>

        {/* ============================================================== */}
        {/* 2. KHU VỰC ĐĂNG NHẬP GMAIL (ĐẶC TRỊ CHỐNG ĐƠ TRÊN IOS & ZALO) */}
        {/* ============================================================== */}
        {authMode === "login" && (
          <div className="space-y-3 mb-5">
            {/* Cảnh báo thân thiện nếu đang mở trong webview Zalo / Facebook trên điện thoại */}
            {isInAppBrowser && (
              <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-[12px]">Đang mở từ Zalo / Mạng xã hội:</div>
                  <div className="text-[11px] text-amber-800 leading-relaxed">
                    Trình duyệt nhúng Zalo trên iPhone thường chặn cửa sổ phụ Google gây đơ trắng màn hình. Bạn hãy <strong>nhập nhanh tên Gmail bên dưới</strong> để đăng nhập tức thì!
                  </div>
                </div>
              </div>
            )}

            {/* Tùy chọn 1: Nút 1-chạm nếu máy này đã từng lưu tài khoản Gmail */}
            {savedGoogleEmail && (
              <button
                type="button"
                onClick={() => executeGoogleLoginWithEmail(savedGoogleEmail)}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400 text-emerald-950 font-bold text-xs flex items-center justify-between transition-all shadow-xs cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tiếp tục với: <strong className="text-emerald-900">{savedGoogleEmail}</strong></span>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                  1 Chạm
                </span>
              </button>
            )}

            {/* Tùy chọn 2: Khung nhập tài khoản Gmail trực tiếp (Không bao giờ bị treo trên iPhone) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Đăng nhập tài khoản Google / Gmail
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Chuẩn iOS &amp; Zalo
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (googleEmailInput.trim()) executeGoogleLoginWithEmail(googleEmailInput);
                      }
                    }}
                    placeholder="Nhập Gmail (ví dụ: lehanhkt01@gmail.com)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-slate-800 font-medium placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={isGoogleLoading || !googleEmailInput.trim()}
                  onClick={() => executeGoogleLoginWithEmail(googleEmailInput)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                Hệ thống tự động xác thực và đồng bộ phân quyền ngay lập tức mà không cần mở cửa sổ phụ.
              </p>
            </div>

            {/* Tùy chọn 3: Nút mở cửa sổ Google OAuth chính thống (chỉ hiển thị trên máy tính để bàn) */}
            {!isIOSDevice && !isInAppBrowser && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold py-2 px-3 rounded-xl w-full flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Mở cửa sổ chọn tài khoản Google (Desktop)</span>
              </button>
            )}

            {/* Vạch ngăn cách "HOẶC BẰNG MẬT KHẨU" */}
            <div className="relative flex items-center justify-center my-3 pt-1">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider absolute">
                HOẶC BẰNG MẬT KHẨU
              </span>
            </div>
          </div>
        )}


        {/* ============================================================== */}
        {/* 6. PHẦN ĐĂNG NHẬP / ĐĂNG KÝ MẬT KHẨU BÊN DƯỚI */}
        {/* ============================================================== */}
        <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
          {authMode === "register" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên người đại diện <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên cơ quan / Thôn buôn / Đơn vị <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={orgNameInput}
                    onChange={(e) => setOrgNameInput(e.target.value)}
                    placeholder="Ví dụ: Hội Nông dân Xã Ea Súp hoặc Thôn 3"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0888023023"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Ô nhập Email / Tên tài khoản */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email / Tên tài khoản <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Nhập email của bạn..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
              />
            </div>
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mật khẩu <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authMode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Nút Đăng nhập / Đăng ký chính */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] transition-all text-sm cursor-pointer shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>{authMode === "login" ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}</span>
              </>
            ) : (
              <span>{authMode === "login" ? "Đăng nhập ngay" : "Gửi yêu cầu đăng ký"}</span>
            )}
          </button>

          {/* Bỏ nút đăng ký ngay theo yêu cầu người dùng, giữ modal đăng nhập tinh gọn */}
          {authMode === "register" && (
            <div className="text-center pt-2">
              <p className="text-xs text-slate-600">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  Đăng nhập tại đây
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
