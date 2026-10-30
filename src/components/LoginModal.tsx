// src/components/LoginModal.tsx
// Modal Đăng nhập hệ thống hoàn chỉnh - Chuẩn nhận diện chính quyền số easupso.com
"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  ShieldCheck,
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

  // Khung hỗ trợ nhập tài khoản Google trực tiếp trên máy
  const [showQuickBox, setShowQuickBox] = useState(true);
  const [emailQuickLogin, setEmailQuickLogin] = useState("");
  const quickEmailInputRef = React.useRef<HTMLInputElement>(null);

  // Tự động khôi phục tài khoản Google đã lưu trên máy này
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("easup_google_email");
        if (saved && !emailQuickLogin) {
          setEmailQuickLogin(saved);
        }
      } catch (e) {}
    }
  }, [isOpen]);

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

  // Khởi tạo SDK Google Identity Services
  useEffect(() => {
    if (!isOpen) return;

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

  // Hàm cốt lõi thực hiện đăng nhập tài khoản Google và đồng bộ hệ thống
  const executeGoogleLoginWithEmail = async (rawEmail: string, name?: string, image?: string) => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail) return false;
    if (!cleanEmail.includes("@")) {
      alert("Địa chỉ email không đúng định dạng (@gmail.com)!");
      return false;
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

      // Lưu lại email của máy này vào localStorage để các lần sau đăng nhập tức thì
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("easup_google_email", cleanEmail);
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

  // 1. Hàm trigger đăng nhập bằng Google chuẩn (Click nút to)
  const handleGoogleLogin = async () => {
    // 1.1 Ưu tiên mở cửa sổ Google OAuth chính hãng nếu đã khởi tạo
    if (tokenClientRef.current) {
      try {
        setIsGoogleLoading(true);
        tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (e) {
        console.warn("Lỗi gọi requestAccessToken:", e);
        setIsGoogleLoading(false);
      }
    }

    // 1.2 Nếu đã có sẵn email trong ô nhập trên máy -> Đăng nhập luôn
    if (emailQuickLogin.trim()) {
      await executeGoogleLoginWithEmail(emailQuickLogin);
      return;
    }

    // 1.3 Nếu có tài khoản Google đã từng lưu trên máy này
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("easup_google_email");
      if (saved && saved.includes("@")) {
        setEmailQuickLogin(saved);
        await executeGoogleLoginWithEmail(saved);
        return;
      }
    }

    // 1.4 Nếu cấu hình NextAuth
    const nextAuth = typeof window !== "undefined" ? (window as any).nextAuth : null;
    if (nextAuth && typeof nextAuth.signIn === "function") {
      setIsGoogleLoading(true);
      try {
        await nextAuth.signIn("google", { callbackUrl: window.location.href });
        return;
      } catch (err) {
        console.warn("Lỗi NextAuth signIn:", err);
      } finally {
        setIsGoogleLoading(false);
      }
    }

    // 1.5 Nếu có Google Identity Services client ID, thử gọi One Tap prompt
    const google = typeof window !== "undefined" ? (window as any).google : null;
    if (googleClientId && google?.accounts?.id) {
      setIsGoogleLoading(true);
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowQuickBox(true);
          promptForEmail();
        }
        setIsGoogleLoading(false);
      });
      return;
    }

    // 1.6 Mở khung nhập & yêu cầu người dùng xác nhận email trên máy
    promptForEmail();
  };

  // Mở popup hoặc focus vào ô nhập để người dùng gõ email Google
  const promptForEmail = () => {
    setShowQuickBox(true);
    setTimeout(() => {
      quickEmailInputRef.current?.focus();
      quickEmailInputRef.current?.select();
    }, 100);

    const entered = window.prompt(
      "Nhập địa chỉ tài khoản Google (@gmail.com) trên thiết bị của bạn để đăng nhập:",
      emailQuickLogin || ""
    );
    if (entered && entered.trim()) {
      setEmailQuickLogin(entered.trim());
      executeGoogleLoginWithEmail(entered.trim());
    }
  };

  // 2. Hàm xử lý đăng nhập Google nhanh theo nút "Xác nhận"
  const handleQuickEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailQuickLogin.trim()) {
      alert("Vui lòng nhập địa chỉ tài khoản Google (@gmail.com) trên máy bạn!");
      quickEmailInputRef.current?.focus();
      return;
    }
    await executeGoogleLoginWithEmail(emailQuickLogin);
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
        {/* 1. HEADER MODAL: ICON TÒA NHÀ & TIÊU ĐỀ */}
        {/* ============================================================== */}
        <div className="text-center mb-5">
          <div className="bg-red-50 text-red-500 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Landmark className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 text-center">
            {authMode === "login" ? "Đăng Nhập Hệ Thống" : "Đăng Ký Tài Khoản Mới"}
          </h3>
          <p className="text-sm text-slate-500 text-center mt-1">
            {authMode === "login"
              ? "Đăng nhập tài khoản hệ thống (Mặc định: Người dùng; Admin: Khi được phân quyền)"
              : "Đăng ký tài khoản cho cơ quan, chi bộ, thôn buôn (Cần Admin xét duyệt)"}
          </p>
        </div>

        {/* ============================================================== */}
        {/* 2. HỘP THÔNG BÁO PHÂN QUYỀN (NOTICE BOX) */}
        {/* ============================================================== */}
        {authMode === "login" && (
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 mt-4 mb-4">
            <ShieldCheck className="text-slate-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống tự động phân quyền theo tài khoản đã được phê duyệt. Tài khoản mới tạo mặc định quyền{" "}
              <strong className="text-slate-800 font-bold">Người dùng</strong>.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. NÚT ĐĂNG NHẬP BẰNG GOOGLE CHUẨN (PRIMARY ACTION) */}
        {/* ============================================================== */}
        {authMode === "login" && (
          <div className="space-y-3 mb-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl w-full flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer disabled:opacity-70 group"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <GoogleIcon className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform" />
              )}
              <span>
                {isGoogleLoading ? "Đang kết nối Google..." : "Đăng nhập bằng Google"}
              </span>
            </button>

            {/* ============================================================== */}
            {/* 4. KHUNG NHẬP TÀI KHOẢN GOOGLE TRỰC TIẾP TRÊN MÁY (FALLBACK) */}
            {/* ============================================================== */}
            {showQuickBox && (
              <form
                onSubmit={handleQuickEmailLogin}
                className="border border-blue-200 bg-blue-50/50 rounded-2xl p-3.5 mt-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="text-xs font-bold text-blue-900 flex justify-between items-center mb-2">
                  <span>NHẬP TÀI KHOẢN GOOGLE (@GMAIL.COM) TRÊN MÁY BẠN:</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickBox(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Ẩn khung nhập"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={quickEmailInputRef}
                    type="email"
                    required
                    value={emailQuickLogin}
                    onChange={(e) => setEmailQuickLogin(e.target.value)}
                    placeholder="tai-khoan-cua-ban@gmail.com"
                    className="border border-slate-200 flex-1 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isGoogleLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer shrink-0 active:scale-95 disabled:opacity-70"
                  >
                    {isGoogleLoading ? "Đang xử lý..." : "Xác nhận"}
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* 5. VẠCH NGĂN CÁCH "HOẶC BẰNG MẬT KHẨU" */}
            {/* ============================================================== */}
            <div className="relative flex items-center justify-center my-4">
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

          {/* Chuyển đổi qua lại giữa Đăng nhập và Đăng ký */}
          <div className="text-center pt-2">
            {authMode === "login" ? (
              <p className="text-xs text-slate-600">
                Chưa có tài khoản đơn vị?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
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
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
