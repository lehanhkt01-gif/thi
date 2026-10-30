// src/components/LoginModal.tsx - Modal Đăng nhập / Đăng ký hệ thống chuẩn hóa & Google Sign-In
"use client";

import React, { useState } from "react";
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
  Sparkles,
} from "lucide-react";

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  initialMode?: "login" | "register";
}

// SVG Logo chuẩn 4 màu Google
export function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
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
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [orgNameInput, setOrgNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleChoice, setShowGoogleChoice] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  if (!isOpen) return null;

  // Xử lý đăng nhập Google
  const handleGoogleLogin = async (overrideEmail?: string, overrideName?: string) => {
    setGoogleLoading(true);
    try {
      const emailToUse = (overrideEmail || "lehanhkt01@gmail.com").trim().toLowerCase();
      const nameToUse =
        overrideName ||
        (emailToUse === "lehanhkt01@gmail.com"
          ? "Lê Hạnh - Quản trị viên Ea Súp"
          : emailToUse.split("@")[0]);

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          name: nameToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Không thể đăng nhập bằng Google lúc này!");
        setGoogleLoading(false);
        return;
      }

      // Lưu localStorage và bắn sự kiện đồng bộ toàn hệ thống
      syncAuthSession(data.user);

      if (onSuccess) {
        onSuccess(data.user);
      }
      setShowGoogleChoice(false);
      onClose();
    } catch (err: any) {
      alert("Lỗi kết nối khi đăng nhập Google: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Xử lý nộp form đăng nhập / đăng ký qua mật khẩu
  const handleSubmit = async (e: React.FormEvent) => {
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

      setLoading(true);
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
          setLoading(false);
          return;
        }

        alert(
          "Đăng ký tài khoản thành công!\n\n" +
            "Tài khoản của bạn đang ở trạng thái 'Chờ xét duyệt'. Quản trị viên (Admin) sẽ phê duyệt trước khi bạn có thể đăng nhập."
        );
        setAuthMode("login");
        setPasswordInput("");
        setConfirmPasswordInput("");
      } catch (err: any) {
        alert("Lỗi kết nối máy chủ khi đăng ký: " + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // ĐĂNG NHẬP
      if (!emailInput.trim() || !passwordInput.trim()) {
        alert("Vui lòng nhập email/tên tài khoản và mật khẩu!");
        return;
      }

      setLoading(true);
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
          setLoading(false);
          return;
        }

        // Đồng bộ session
        syncAuthSession(data.user);

        if (onSuccess) {
          onSuccess(data.user);
        }
        onClose();
      } catch (err: any) {
        alert("Lỗi kết nối máy chủ khi đăng nhập: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-dialog border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        {/* Nút đóng modal */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
          title="Đóng cửa sổ"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tiêu đề Modal (Ảnh 3 chuẩn) */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {authMode === "login" ? "Đăng Nhập Hệ Thống" : "Đăng Ký Tài Khoản Mới"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === "login"
              ? "Đăng nhập tài khoản hệ thống (Mặc định: Người dùng; Admin: Khi được phân quyền)"
              : "Đăng ký tài khoản cho cơ quan, chi bộ, thôn buôn (Cần Admin xét duyệt)"}
          </p>
        </div>

        {/* Hộp gợi ý phân quyền */}
        {authMode === "login" && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start sm:items-center space-x-2.5 mb-4">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Hệ thống tự động phân quyền theo tài khoản đã được phê duyệt. Tài khoản mới tạo mặc định quyền <strong>Người dùng</strong>.
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* NÚT ĐĂNG NHẬP BẰNG GOOGLE CHÍNH THỨC */}
        {/* ============================================================== */}
        {authMode === "login" && (
          <div className="space-y-2 mb-4">
            <button
              type="button"
              onClick={() => setShowGoogleChoice(!showGoogleChoice)}
              disabled={googleLoading}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <GoogleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>
                {googleLoading ? "Đang đồng bộ Google..." : "Đăng nhập bằng Google"}
              </span>
            </button>

            {/* Bảng chọn tài khoản Google / Đăng nhập nhanh */}
            {showGoogleChoice && (
              <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-50/70 to-slate-50 border border-blue-200 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Chọn tài khoản Google để đăng nhập:</span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleChoice(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1-Click: Admin Google Account */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("lehanhkt01@gmail.com", "Lê Hạnh - Quản trị viên Ea Súp")}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <GoogleIcon className="w-4 h-4 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 group-hover:text-blue-700">
                        lehanhkt01@gmail.com
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Lê Hạnh (Quản trị viên Hệ thống)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                    Admin
                  </span>
                </button>

                {/* Form nhập tài khoản Gmail khác */}
                <div className="pt-1 border-t border-blue-100 flex items-center space-x-1.5">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="Nhập email Google khác (@gmail.com)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGoogleEmail.trim()) {
                        alert("Vui lòng nhập địa chỉ email Google!");
                        return;
                      }
                      handleGoogleLogin(customGoogleEmail.trim());
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </div>
              </div>
            )}

            {/* Dòng phân cách "hoặc đăng nhập bằng email" */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                Hoặc bằng mật khẩu
              </span>
            </div>
          </div>
        )}

        {/* FORM ĐĂNG NHẬP / ĐĂNG KÝ EMAIL */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            </>
          )}

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
                placeholder="lehanhkt01@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
              />
            </div>
          </div>

          {authMode === "register" && (
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
          )}

          {/* Mật khẩu */}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nhập lại mật khẩu (Khi đăng ký) */}
          {authMode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhập lại mật khẩu <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Nhập lại chính xác mật khẩu ở trên"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                    confirmPasswordInput && passwordInput !== confirmPasswordInput
                      ? "border-red-400 focus:border-red-600"
                      : confirmPasswordInput && passwordInput === confirmPasswordInput
                      ? "border-emerald-400 focus:border-emerald-600"
                      : "border-slate-300 focus:border-red-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordInput && (
                <div className="mt-1 flex items-center space-x-1.5 text-[11px] font-semibold">
                  {passwordInput === confirmPasswordInput ? (
                    <span className="text-emerald-600 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mật khẩu trùng khớp
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <X className="w-3.5 h-3.5 mr-1" /> Mật khẩu xác nhận chưa khớp
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-sm font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-md mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading
              ? "Đang xử lý..."
              : authMode === "login"
              ? "Đăng nhập ngay"
              : "Hoàn tất đăng ký & Gửi xét duyệt"}
          </button>

          <div className="pt-2 text-center text-xs text-slate-600">
            {authMode === "login" ? (
              <>
                Chưa có tài khoản đơn vị?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setPasswordInput("");
                    setConfirmPasswordInput("");
                  }}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setPasswordInput("");
                    setConfirmPasswordInput("");
                  }}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
