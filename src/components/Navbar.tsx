"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  User,
  PlusCircle,
  Menu,
  X,
  Landmark,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Authentication State (Admin & Người dùng)
  const [authUser, setAuthUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "USER">("ADMIN");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [orgNameInput, setOrgNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [authAlert, setAuthAlert] = useState<string | null>(null);

  // Nạp và đồng bộ trạng thái đăng nhập từ localStorage & Server
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
        console.warn("Lỗi đọc session auth:", e);
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

  // Chỉ hiển thị Navbar tại trang chủ theo yêu cầu
  if (pathname !== "/") {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/ket-qua/phong-chong-te-nan-2026?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthAlert(null);

    if (authMode === "register") {
      if (!nameInput.trim() || !orgNameInput.trim() || !emailInput.trim() || !phoneInput.trim() || !passwordInput.trim() || !confirmPasswordInput.trim()) {
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

      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameInput.trim(),
            email: emailInput.trim(),
            phone: phoneInput.trim(),
            role: "USER", // Mặc định tài khoản đăng ký mới là Người dùng
            status: "PENDING", // Chưa phê duyệt
            organizationName: orgNameInput.trim(),
            password: passwordInput,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert("Đăng ký không thành công: " + (data.error || "Có lỗi xảy ra"));
          return;
        }

        // CHƯA PHÊ DUYỆT THÌ CHƯA THỂ ĐĂNG NHẬP THÀNH CÔNG -> TUYỆT ĐỐI KHÔNG TỰ ĐỘNG LƯU SESSION
        alert(
          "Đăng ký tài khoản thành công!\n\n" +
          "Tài khoản của bạn đang ở trạng thái 'Chờ xét duyệt'. Quản trị viên (Admin) sẽ xem xét và phê duyệt trước khi bạn có thể đăng nhập vào hệ thống."
        );
        setAuthMode("login");
        setPasswordInput("");
        setConfirmPasswordInput("");
        return;
      } catch (err: any) {
        alert("Lỗi kết nối máy chủ khi đăng ký: " + err.message);
        return;
      }
    } else {
      // ĐĂNG NHẬP: GỬI LÊN SERVER XÁC THỰC MẬT KHẨU, TRẠNG THÁI PHÊ DUYỆT VÀ PHÂN QUYỀN
      if (!emailInput.trim() || !passwordInput.trim()) {
        alert("Vui lòng nhập email/tên tài khoản và mật khẩu!");
        return;
      }

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
          return;
        }

        // Đăng nhập thành công với vai trò thực tế trả về từ Server
        localStorage.setItem("cuocthi_admin_auth", JSON.stringify(data.user));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("cuocthi_auth_change"));
        setAuthUser(data.user);
        setShowLoginModal(false);
      } catch (err: any) {
        alert("Lỗi kết nối máy chủ khi đăng nhập: " + err.message);
      }
    }
  };

  // 1-Click: Đăng nhập quyền Admin
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
    setShowLoginModal(false);
  };

  // 1-Click: Đăng nhập quyền Người dùng
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
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("cuocthi_admin_auth");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cuocthi_auth_change"));
    setAuthUser(null);
  };

  const handleCreateContestClick = (e: React.MouseEvent) => {
    if (!authUser) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-xs">
      {/* Top Administrative Bar */}
      <div className="bg-[#B91C1C] text-white text-[11px] py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold uppercase tracking-wider">
              Hệ Thống Tổ Chức Cuộc Thi Trực Tuyến Đa Tổ Chức
            </span>
            <span className="hidden sm:inline text-red-200">•</span>
            <span className="hidden sm:inline text-red-100">Bảo mật Zero-Trust &amp; Đồng hồ máy chủ</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-100">
            <a
              href="https://easupso.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center hover:text-white underline decoration-red-300"
            >
              Hệ sinh thái số easupso.com <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-[#DC2626] transition-colors">
                Cuộc Thi
              </span>
              <div className="w-5 h-5 rounded-full bg-[#DC2626] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                ✦
              </div>
            </Link>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-64 lg:w-72">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-full border border-slate-200 focus:border-[#DC2626] outline-none transition-all"
              />
            </form>
          </div>

          {/* Desktop Links & Auth State */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-4 text-xs font-semibold text-slate-600">
            <Link href="/thi/phong-chong-te-nan-2026" className="hover:text-slate-900 transition-colors">
              Hướng dẫn
            </Link>

            {/* Nút Tạo cuộc thi (Chỉ xuất hiện khi đã đăng nhập) */}
            {authUser && (
              <Link
                href="/admin/tao-cuoc-thi"
                className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-all shadow-xs"
                title="Khởi tạo cuộc thi trực tuyến"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Tạo cuộc thi
              </Link>
            )}

            {/* Nút Quản trị & Đăng nhập (Role-based) */}
            {authUser ? (
              <div className="flex items-center space-x-2">
                {/* Nút Quản trị / Quản lý cuộc thi */}
                <Link
                  href="/admin"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#DC2626] border border-slate-200 transition-all shadow-2xs inline-flex items-center"
                  title="Mở Bảng điều khiển Quản trị cuộc thi"
                >
                  <Landmark className="w-3.5 h-3.5 mr-1 text-[#DC2626]" />
                  <span>{authUser.role === "ADMIN" ? "Quản trị" : "Quản lý cuộc thi"}</span>
                </Link>

                {/* Trạng thái Đăng nhập theo Vai trò */}
                {authUser.role === "ADMIN" ? (
                  <div
                    className="inline-flex items-center space-x-1.5 bg-red-50 border border-red-300 pl-3 pr-2.5 py-1.5 rounded-full text-xs text-red-800 font-bold shadow-2xs"
                    title={`Admin: ${authUser.name}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    <span>Admin</span>
                    <span className="inline-flex items-center bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold shadow-2xs">
                      Toàn quyền
                    </span>
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-300 pl-3 pr-2.5 py-1.5 rounded-full text-xs text-blue-800 font-bold shadow-2xs"
                    title={`Người dùng: ${authUser.name}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>Người dùng</span>
                    <span className="inline-flex items-center bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold shadow-2xs">
                      Tạo &amp; Xuất KQ
                    </span>
                  </div>
                )}

                {/* Nút Đăng xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setShowLoginModal(true);
                }}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-[#DC2626] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Đăng nhập tài khoản"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                <span>Đăng nhập</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 outline-none"
            />
          </form>

          {authUser ? (
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${authUser.role === "ADMIN" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
              <div className="font-bold flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${authUser.role === "ADMIN" ? "bg-red-600" : "bg-blue-600"}`}></span>
                  <span className={authUser.role === "ADMIN" ? "text-red-900" : "text-blue-900"}>
                    {authUser.role === "ADMIN" ? "Tài khoản Admin" : "Tài khoản Người dùng"}
                  </span>
                </div>
                <button onClick={handleLogout} className="text-red-600 font-bold underline cursor-pointer">
                  Đăng xuất
                </button>
              </div>
              <div className="text-[11px] text-slate-700 font-medium">{authUser.name}</div>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-3 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 flex items-center justify-center space-x-1.5 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Landmark className="w-4 h-4 text-[#DC2626]" />
                <span>{authUser.role === "ADMIN" ? "Vào trang Quản trị" : "Vào trang Quản lý cuộc thi"}</span>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLoginModal(true);
              }}
              className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          )}

          {authUser && (
            <Link
              href="/admin/tao-cuoc-thi"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#DC2626] py-1"
            >
              + Tạo cuộc thi (5-Step Wizard)
            </Link>
          )}
        </div>
      )}

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ PHÂN QUYỀN ADMIN & NGƯỜI DÙNG */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-dialog border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {authMode === "login" ? "Đăng Nhập Hệ Thống" : "Đăng Ký Tài Khoản Mới"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === "login"
                  ? "Đăng nhập tài khoản hệ thống (Mặc định: Người dùng; Admin: Khi được phân quyền)"
                  : "Đăng ký tài khoản cho cơ quan, chi bộ, thôn buôn (Cần Admin xét duyệt)"}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authMode === "login" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Hệ thống tự động phân quyền theo tài khoản đã được phê duyệt. Tài khoản mới tạo mặc định quyền <strong>Người dùng</strong>.
                  </span>
                </div>
              )}

              {authMode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên người đại diện <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên cơ quan / Thôn buôn / Đơn vị <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orgNameInput}
                      onChange={(e) => setOrgNameInput(e.target.value)}
                      placeholder="Ví dụ: Hội Nông dân Xã Ea Súp hoặc Thôn 3"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email / Tên tài khoản <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={authMode === "login" && selectedRole === "ADMIN" ? "admin@easupso.com" : "nongdan@easupso.com"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                />
              </div>

              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0888023023"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
                  />
                </div>
              )}

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-red-600 outline-none"
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

              {/* Nhập lại mật khẩu (Chỉ hiển thị khi Đăng ký - 2 lần để tránh sai) */}
              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhập lại mật khẩu <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Nhập lại chính xác mật khẩu ở trên"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
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
                className="w-full py-3 rounded-full text-sm font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-md mt-2 cursor-pointer"
              >
                {authMode === "login" ? "Đăng nhập ngay" : "Hoàn tất đăng ký & Gửi xét duyệt"}
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
      )}
    </header>
  );
}
