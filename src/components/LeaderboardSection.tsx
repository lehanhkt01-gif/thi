"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Users,
  User,
  Calendar,
  Building2,
  ChevronDown,
  Clock,
  CheckCircle2,
  Medal,
  Award,
  Search,
  Filter,
  Flame,
  ArrowUpDown,
  Lock,
  ShieldCheck,
  Download,
} from "lucide-react";

interface LeaderboardSectionProps {
  contestSlug?: string;
  contestId?: string;
  contestTitle?: string;
  initialUnits?: string[];
  themeColor?: string;
  isContestEnded?: boolean;
  canViewHiddenLeaderboard?: boolean;
  endTime?: string;
  onEnterExam?: () => void;
}

export default function LeaderboardSection({
  contestSlug,
  contestId,
  contestTitle,
  initialUnits = [],
  themeColor = "#00A9E0",
  isContestEnded = true,
  canViewHiddenLeaderboard = false,
  endTime,
  onEnterExam,
}: LeaderboardSectionProps) {
  // Bộ lọc ma trận 2 chiều (Mặc định: Toàn cuộc thi để Admin & Ban Tổ Chức xem được đầy đủ toàn bộ thí sinh)
  const [scope, setScope] = useState<"individual" | "organization">("individual");
  const [period, setPeriod] = useState<"week" | "contest">("contest");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Kiểm tra tài khoản đăng nhập để cấp toàn quyền cho Admin và Người tạo cuộc thi
  const [localAuth, setLocalAuth] = useState<any>(null);
  const [contestInfo, setContestInfo] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cuocthi_admin_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status === "APPROVED") {
          setLocalAuth(parsed);
        }
      }
    } catch {}
  }, []);

  const isUserAdmin = localAuth?.role === "ADMIN";
  const userEmail = (localAuth?.email || "").toLowerCase().trim();
  const creatorEmail = (contestInfo?.creatorEmail || contestInfo?.organizerEmail || "").toLowerCase().trim();
  const creatorId = contestInfo?.creatorId;
  const isUserCreator = Boolean(
    localAuth && (
      (creatorEmail && userEmail && creatorEmail === userEmail) ||
      (creatorId && localAuth?.id && creatorId === localAuth.id) ||
      (Array.isArray(contestInfo?.sharedEmails) && contestInfo.sharedEmails.some((e: string) => (e || "").toLowerCase().trim() === userEmail))
    )
  );
  const hasFullAccess = canViewHiddenLeaderboard || isUserAdmin || isUserCreator;

  // Dữ liệu API trả về
  const [rankings, setRankings] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<string[]>(initialUnits);
  const [unitsHierarchy, setUnitsHierarchy] = useState<Array<{ name: string; subUnits?: string[] }>>([]);
  const [unitGroupName, setUnitGroupName] = useState<string>("");
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Phân trang danh sách người thi trắc nghiệm (10 người / trang)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Điều khiển Dropdown menus
  const [openScopeDropdown, setOpenScopeDropdown] = useState<boolean>(false);
  const [openPeriodDropdown, setOpenPeriodDropdown] = useState<boolean>(false);

  const scopeRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scopeRef.current && !scopeRef.current.contains(e.target as Node)) {
        setOpenScopeDropdown(false);
      }
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setOpenPeriodDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dữ liệu bảng xếp hạng đa chiều từ Server
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (contestSlug) params.set("contestSlug", contestSlug);
      else if (contestId) params.set("contestId", contestId);

      params.set("scope", scope);
      params.set("period", period);
      if (selectedUnit && selectedUnit !== "ALL") params.set("unitName", selectedUnit);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (data.contest) {
          setContestInfo(data.contest);
        }
        setRankings(data.rankings || []);
        if (data.units && Array.isArray(data.units) && data.units.length > 0) {
          setUnitsList(data.units);
        }
        if (data.unitsHierarchy && Array.isArray(data.unitsHierarchy)) {
          setUnitsHierarchy(data.unitsHierarchy);
        }
        if (data.unitGroupName) {
          setUnitGroupName(data.unitGroupName);
        }
        setPeriodLabel(data.periodLabel || "");
        setTotalParticipants(data.totalParticipants || 0);
        setTotalAttempts(data.totalAttempts || 0);
      }
    } catch (err) {
      console.error("Lỗi nạp bảng xếp hạng đa chiều:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchLeaderboardData();
  }, [contestSlug, contestId, scope, period, selectedUnit]);

  // Handle tìm kiếm
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLeaderboardData();
  };

  // Top 1, 2, 3 cho Cá nhân
  const top1 = scope === "individual" && rankings.length > 0 ? rankings[0] : null;
  const top2 = scope === "individual" && rankings.length > 1 ? rankings[1] : null;
  const top3 = scope === "individual" && rankings.length > 2 ? rankings[2] : null;
  const restRankings = scope === "individual" ? rankings.slice(3) : rankings;

  // Phân trang: 10 người thi / trang (theo yêu cầu)
  const totalPages = Math.max(1, Math.ceil(rankings.length / ITEMS_PER_PAGE));
  const paginatedRankings = rankings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <section id="bang-xep-hang" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 1. TIÊU ĐỀ CHUẨN ẢNH 2: "Bảng xếp hạng" MÀU XANH CYAN SÁNG */}
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#00A9E0] tracking-tight">
          Bảng xếp hạng
        </h2>
      </div>

      {/* TRƯỜNG HỢP ẨN BẢNG XẾP HẠNG TRONG THỜI GIAN THI CHO THÍ SINH CÔNG KHAI (CHỈ ADMIN VÀ NGƯỜI TẠO ĐƯỢC XEM) */}
      {!isContestEnded && !hasFullAccess ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-2xs">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full mb-3">
            BẢO MẬT BẢNG XẾP HẠNG
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
            Bảng Xếp Hạng Đang Được Bảo Mật
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-5">
            Trong thời gian cuộc thi đang diễn ra, bảng xếp hạng và điểm số được tạm ẩn để đảm bảo tính công bằng, khách quan và bảo mật tuyệt đối cho mọi thí sinh.
          </p>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 mb-6">
            <Clock className="w-4 h-4 text-red-600" />
            <span>Công bố đầy đủ sau khi kết thúc: <strong>{endTime ? new Date(endTime).toLocaleString("vi-VN") : "khi cuộc thi khép lại"}</strong></span>
          </div>
          {onEnterExam && (
            <div>
              <button
                type="button"
                onClick={onEnterExam}
                className="inline-flex items-center px-8 py-3 rounded-full text-sm font-bold text-white bg-[#00A9E0] hover:bg-[#0096ca] shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Vào phòng thi ngay ➔
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 2. CỤM 2 NÚT PILL DROPDOWN MÀU XANH CYAN CHUẨN ẢNH 2 & BỘ LỌC ĐƠN VỊ ẢNH 1 */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
        {/* Nút 1: [ Cá nhân ⌵ ] / [ Tổ chức ⌵ ] */}
        <div className="relative" ref={scopeRef}>
          <button
            type="button"
            onClick={() => {
              setOpenScopeDropdown(!openScopeDropdown);
              setOpenPeriodDropdown(false);
            }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#00A9E0] hover:bg-[#0096ca] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            {scope === "individual" ? (
              <>
                <User className="w-4 h-4" />
                <span>Cá nhân</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Tổ chức / Đơn vị</span>
              </>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${openScopeDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Menu Dropdown 1 */}
          {openScopeDropdown && (
            <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => {
                  setScope("individual");
                  setOpenScopeDropdown(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-2.5 hover:bg-slate-50 cursor-pointer ${
                  scope === "individual" ? "text-[#00A9E0] bg-cyan-50/50" : ""
                }`}
              >
                <User className="w-4 h-4" />
                <span>Xếp hạng Cá nhân</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope("organization");
                  setOpenScopeDropdown(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-2.5 hover:bg-slate-50 cursor-pointer ${
                  scope === "organization" ? "text-[#00A9E0] bg-cyan-50/50" : ""
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Xếp hạng Tổ chức / Đơn vị</span>
              </button>
            </div>
          )}
        </div>

        {/* Nút 2: [ Theo tuần ⌵ ] / [ Theo cuộc thi ⌵ ] */}
        <div className="relative" ref={periodRef}>
          <button
            type="button"
            onClick={() => {
              setOpenPeriodDropdown(!openPeriodDropdown);
              setOpenScopeDropdown(false);
            }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#00A9E0] hover:bg-[#0096ca] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            {period === "week" ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>Theo tuần</span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                <span>Toàn cuộc thi</span>
              </>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${openPeriodDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Menu Dropdown 2 */}
          {openPeriodDropdown && (
            <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => {
                  setPeriod("week");
                  setOpenPeriodDropdown(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-2.5 hover:bg-slate-50 cursor-pointer ${
                  period === "week" ? "text-[#00A9E0] bg-cyan-50/50" : ""
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Theo tuần hiện tại</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriod("contest");
                  setOpenPeriodDropdown(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-2.5 hover:bg-slate-50 cursor-pointer ${
                  period === "contest" ? "text-[#00A9E0] bg-cyan-50/50" : ""
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Toàn bộ cuộc thi</span>
              </button>
            </div>
          )}
        </div>

        {/* Bộ lọc Đơn vị con (ĐỒNG BỘ 2 CHIỀU VỚI CÁC ĐƠN VỊ THIẾT LẬP KHI TẠO CUỘC THI - ẢNH 1 - HỖ TRỢ 3 CẤP) */}
        {scope === "individual" && (
          <div className="relative">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-semibold shadow-xs hover:border-slate-400 focus:border-[#00A9E0] outline-none cursor-pointer pr-9 appearance-none max-w-[280px] truncate"
            >
              <option value="ALL">
                -- Tất cả {unitsHierarchy.length > 0 ? unitsHierarchy.length : unitsList.length} Đơn vị --
              </option>
              {unitsHierarchy.length > 0
                ? unitsHierarchy.map((u, i) => (
                    <React.Fragment key={i}>
                      <option value={u.name} className="font-bold text-slate-900 bg-slate-100">
                        {u.name} {u.subUnits && u.subUnits.length > 0 ? `(Toàn đơn vị - ${u.subUnits.length} lớp con)` : ""}
                      </option>
                      {u.subUnits &&
                        u.subUnits.map((sub, sIdx) => (
                          <option key={`${i}-${sIdx}`} value={sub} className="text-slate-600">
                            &nbsp;&nbsp;↳ {sub}
                          </option>
                        ))}
                    </React.Fragment>
                  ))
                : unitsList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Ô Tìm kiếm thí sinh (khi ở chế độ Cá nhân) */}
        {scope === "individual" && (
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm tên thí sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm shadow-xs focus:border-[#00A9E0] outline-none w-40 sm:w-52"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        )}
      </div>

      {/* 3. TRẠNG THÁI LOADING / EMPTY */}
      {isLoading ? (
        <div className="space-y-3 max-w-4xl mx-auto py-8">
          <div className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs mb-8">
          <div className="w-16 h-16 rounded-full bg-cyan-50 text-[#00A9E0] mx-auto flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Chưa có kết quả xếp hạng trong kỳ này
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            {period === "week"
              ? "Tuần này chưa ghi nhận lượt nộp bài mới nào. Bạn có thể chuyển sang xem xếp hạng 'Toàn cuộc thi' để xem toàn bộ danh sách thí sinh đã tham gia từ trước đến nay!"
              : "Cuộc thi chưa có lượt thi nào hoàn tất. Hãy tham gia thi ngay!"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {period === "week" && (
              <button
                type="button"
                onClick={() => setPeriod("contest")}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#00A9E0] hover:bg-[#0096ca] shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Xem xếp hạng Toàn cuộc thi ➔</span>
              </button>
            )}
            {onEnterExam && (
              <button
                type="button"
                onClick={onEnterExam}
                className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                Vào phòng thi ngay ➔
              </button>
            )}
          </div>
        </div>
      ) : scope === "individual" ? (
        /* ========================================================= */
        /* 4. CHẾ ĐỘ CÁ NHÂN (INDIVIDUAL LEADERBOARD) */
        /* ========================================================= */
        <>
          {/* TOP 3 PODIUM NỔI BẬT (CHỈ HIỂN THỊ Ở TRANG 1 ĐỂ TRANG TIẾP THEO TẬP TRUNG VÀO BẢNG) */}
          {currentPage === 1 && (top1 || top2 || top3) && (
            <div className="flex items-end justify-center max-w-2xl mx-auto mb-10 px-4">
            {/* Hạng 2 (Bạc) */}
            {top2 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-md flex items-center justify-center text-slate-600 font-bold">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    2
                  </div>
                </div>
                <div className="text-center mb-2 px-1">
                  <div className="text-xs font-black text-slate-900 uppercase line-clamp-1">{top2.fullName}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {top2.unitName} {top2.subUnitName ? `(${top2.subUnitName})` : ""}
                  </div>
                  <div className="text-xs font-black text-[#00A9E0]">
                    {top2.score} điểm ({top2.correctCount}/{top2.totalQuestions})
                  </div>
                </div>
                <div className="w-full rounded-t-xl h-28 bg-slate-400 flex items-center justify-center text-white font-black text-2xl shadow-md">
                  2
                </div>
              </div>
            )}

            {/* Hạng 1 (Vàng Kim Vương Miện) */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center -mx-2 z-10">
                <div className="relative mb-2 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-3 border-amber-400 shadow-xl flex items-center justify-center text-amber-600 font-bold">
                    <Trophy className="w-9 h-9 text-amber-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shadow-md">
                    1
                  </div>
                </div>
                <div className="text-center mb-2 px-1">
                  <div className="text-xs sm:text-sm font-black text-slate-900 uppercase line-clamp-1">{top1.fullName}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {top1.unitName} {top1.subUnitName ? `(${top1.subUnitName})` : ""}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#00A9E0]">
                    {top1.score} điểm ({top1.correctCount}/{top1.totalQuestions})
                  </div>
                </div>
                <div className="w-full rounded-t-2xl h-40 bg-gradient-to-t from-amber-500 to-amber-400 flex items-center justify-center text-white font-black text-3xl shadow-xl border-x-2 border-t-2 border-white/30">
                  1
                </div>
              </div>
            )}

            {/* Hạng 3 (Đồng) */}
            {top3 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-white shadow-md flex items-center justify-center text-orange-600 font-bold">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    3
                  </div>
                </div>
                <div className="text-center mb-2 px-1">
                  <div className="text-xs font-black text-slate-900 uppercase line-clamp-1">{top3.fullName}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {top3.unitName} {top3.subUnitName ? `(${top3.subUnitName})` : ""}
                  </div>
                  <div className="text-xs font-black text-[#00A9E0]">
                    {top3.score} điểm ({top3.correctCount}/{top3.totalQuestions})
                  </div>
                </div>
                <div className="w-full rounded-t-xl h-20 bg-amber-700/80 flex items-center justify-center text-white font-black text-2xl shadow-md">
                  3
                </div>
              </div>
            )}
          </div>
          )}

          {/* BẢNG CHI TIẾT TỪ HẠNG 4 TRỞ ĐI */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-3 px-3 text-center w-14">Hạng</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3">Đơn vị / Thôn buôn</th>
                    <th className="py-3 px-3 text-center">Kết quả</th>
                    <th className="py-3 px-3 text-center">Thời gian</th>
                    <th className="py-3 px-3 text-center">Lượt thi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRankings.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-cyan-50/40 transition-colors ${
                        item.rank <= 3 ? "bg-amber-50/20 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center font-bold">
                        {item.rank === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center mx-auto text-xs shadow-xs font-black">
                            1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center mx-auto text-xs shadow-xs font-black">
                            2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto text-xs shadow-xs font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">{item.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{item.fullName}</div>
                        {item.phoneMasked && (
                          <div className="text-[10px] text-slate-400 font-mono">{item.phoneMasked}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="font-semibold text-slate-800">{item.unitName}</div>
                        {item.subUnitName && (
                          <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400">↳</span>
                            <span>{item.subUnitName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-[#00A9E0] text-sm">{item.score}</span>{" "}
                        <span className="text-slate-500 text-[11px]">
                          ({item.correctCount}/{item.totalQuestions})
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                        {Math.floor(item.durationSeconds / 60)}p {item.durationSeconds % 60}s
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-500">
                        Lần {item.attemptCount || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thanh phân trang 10 người thi / trang (chuẩn yêu cầu) */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                Hiển thị{" "}
                <strong className="text-slate-800">
                  {rankings.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, rankings.length)}
                </strong>{" "}
                trong số <strong className="text-slate-800">{rankings.length}</strong> thí sinh
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const hasGap = prev && page - prev > 1;
                      return (
                        <React.Fragment key={page}>
                          {hasGap && <span className="px-1 text-slate-400">...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentPage === page
                                ? "bg-[#00A9E0] text-white shadow-xs"
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                  >
                    Sau ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ========================================================= */
        /* 5. CHẾ ĐỘ TỔ CHỨC / ĐƠN VỊ (ORGANIZATION LEADERBOARD) */
        /* ========================================================= */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden max-w-5xl mx-auto">
          <div className="p-4 bg-cyan-50/60 border-b border-cyan-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
            <span className="font-bold flex items-center">
              <Building2 className="w-4 h-4 mr-1.5 text-[#00A9E0]" />
              Bảng xếp hạng thi đua giữa các Tổ chức & 20 Thôn buôn
            </span>
            <span className="text-slate-500">
              * Ưu tiên xét số lượng người dân tham gia và tỷ lệ đạt yêu cầu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3 text-center w-14">Hạng</th>
                  <th className="py-3 px-4">Tổ chức / Đơn vị / Thôn buôn</th>
                  <th className="py-3 px-3 text-center">Số người tham gia</th>
                  <th className="py-3 px-3 text-center">Tổng lượt thi</th>
                  <th className="py-3 px-3 text-center">Điểm TB</th>
                  <th className="py-3 px-3 text-center">Thời gian TB</th>
                  <th className="py-3 px-3 text-center">Tỷ lệ đạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRankings.map((org) => {
                  const hasData = org.uniqueParticipants > 0;
                  return (
                    <tr
                      key={org.unitName}
                      className={`hover:bg-cyan-50/30 transition-colors ${
                        org.rank <= 3 && hasData ? "bg-cyan-50/20 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center font-bold">
                        {org.rank === 1 && hasData ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center mx-auto text-xs shadow-xs font-black">
                            1
                          </span>
                        ) : org.rank === 2 && hasData ? (
                          <span className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center mx-auto text-xs shadow-xs font-black">
                            2
                          </span>
                        ) : org.rank === 3 && hasData ? (
                          <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto text-xs shadow-xs font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">{org.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {org.unitName}
                        {!hasData && (
                          <span className="ml-2 text-[10px] font-normal text-slate-400 italic">
                            (Chưa có bài thi)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {hasData ? (
                          <span className="inline-flex items-center text-[#00A9E0] font-black text-sm">
                            <Users className="w-3.5 h-3.5 mr-1" />
                            {org.uniqueParticipants}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                        {org.totalAttempts}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                        {hasData ? `${org.avgBestScore} đ` : "-"}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                        {hasData ? `${Math.floor(org.avgDurationSeconds / 60)}p ${org.avgDurationSeconds % 60}s` : "-"}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {hasData ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              org.completionRate >= 80
                                ? "bg-emerald-100 text-emerald-800"
                                : org.completionRate >= 50
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {org.completionRate}%
                          </span>
                        ) : (
                          <span className="text-slate-400">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang tổ chức / đơn vị 10 dòng / trang */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Hiển thị{" "}
              <strong className="text-slate-800">
                {rankings.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, rankings.length)}
              </strong>{" "}
              trong số <strong className="text-slate-800">{rankings.length}</strong> đơn vị
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                >
                  ‹ Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-[#00A9E0] text-white shadow-xs"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                >
                  Sau ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </section>
  );
}
