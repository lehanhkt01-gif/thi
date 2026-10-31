"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  Filter,
  Download,
  Calendar,
  Landmark,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  User,
  Building2,
  Lock,
} from "lucide-react";
import SparklineChart from "@/components/SparklineChart";
import FloatingActionBar from "@/components/FloatingActionBar";
import { EA_SUP_VILLAGES } from "@/lib/store";

export default function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [scope, setScope] = useState<"individual" | "organization">("individual");
  const [period, setPeriod] = useState<"week" | "contest">("contest");
  const [authUser, setAuthUser] = useState<any>(null);

  // Kiểm tra quyền: Chỉ Quản trị viên (ADMIN) mới được xuất file Excel và dùng thanh công cụ nổi
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

  const isAdmin = authUser?.role === "ADMIN";
  const isCreator =
    !!authUser &&
    Boolean(
      (data?.creatorEmail && authUser.email && data.creatorEmail.toLowerCase() === authUser.email.toLowerCase()) ||
      (data?.creatorId && authUser.id && data.creatorId === authUser.id) ||
      (data?.organizerEmail && authUser.email && data.organizerEmail.toLowerCase() === authUser.email.toLowerCase())
    );
  const isContestEnded =
    data?.status === "CLOSED" ||
    data?.status === "ARCHIVED" ||
    (data?.endTime && !isNaN(new Date(data.endTime).getTime()) && new Date(data.endTime).getTime() <= Date.now());

  const canViewResults = isAdmin || isCreator || isContestEnded;

  const fetchResults = () => {
    setLoading(true);
    const query = new URLSearchParams();
    query.append("scope", scope);
    query.append("period", period);
    if (search) query.append("search", search);
    if (selectedUnit && selectedUnit !== "ALL") query.append("unitName", selectedUnit);
    if (fromDate) query.append("fromDate", fromDate);
    if (toDate) query.append("toDate", toDate);

    fetch(`/api/contests/${slug}/results?${query.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, [slug, selectedUnit, fromDate, toDate, scope, period]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Banner của chính cuộc thi đó */}
      {data?.bannerUrl && (
        <div className="w-full mb-6 rounded-2xl overflow-hidden shadow-md max-h-[300px] sm:max-h-[420px] md:max-h-[480px] border border-slate-200 bg-slate-900 flex items-center justify-center">
          <img
            src={data.bannerUrl}
            alt={data.contestTitle || "Banner cuộc thi"}
            className="w-full h-auto max-h-[300px] sm:max-h-[420px] md:max-h-[480px] object-contain sm:object-cover"
            onError={(e) => {
              e.currentTarget.src = "/banner-easup.png";
            }}
          />
        </div>
      )}

      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#DC2626] uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" />
            <span>Xã Ea Súp • Cổng Công Khai Kết Quả Thi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Bảng Xếp Hạng &amp; Thống Kê Kết Quả Cuộc Thi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {data?.contestTitle || "Đang tải dữ liệu cuộc thi..."}
          </p>
        </div>

        {/* Action Buttons: Nút Xuất file Excel chỉ hiển thị cho Quản trị viên (ADMIN) */}
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <a
              href={`/api/contests/${slug}/export?${new URLSearchParams({
                search,
                unitName: selectedUnit,
                fromDate,
                toDate,
              }).toString()}`}
              download
              className="btn-admin-primary text-xs px-4 py-2.5 font-bold bg-emerald-700 hover:bg-emerald-800 border-emerald-800 inline-flex items-center shadow-xs"
            >
              <Download className="w-4 h-4 mr-1.5" /> Xuất file Excel (.xlsx)
            </a>
          )}

          <Link
            href={`/thi/${slug}`}
            className="btn-admin-primary text-xs px-4 py-2.5 font-bold"
          >
            Vào phòng thi
          </Link>
        </div>
      </div>

      {/* Khi cuộc thi đang diễn ra và người xem KHÔNG PHẢI là Admin hay Người tạo cuộc thi: BẢO MẬT KẾT QUẢ (Ảnh 2) */}
      {!loading && data && !canViewResults ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center my-8 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Kết Quả Cuộc Thi Đang Được Bảo Mật
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Cuộc thi hiện đang trong thời gian diễn ra. Bảng xếp hạng và kết quả thi sẽ được tự động công bố công khai sau khi cuộc thi chính thức kết thúc{data.endTime ? ` (dự kiến ${new Date(data.endTime).toLocaleDateString("vi-VN")})` : ""}.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6 flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Hiện tại chỉ Quản trị viên (Admin) và Người tạo cuộc thi / Ban Tổ chức mới có quyền theo dõi số liệu.</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/thi/${slug}`}
              className="btn-admin-primary px-6 py-3 font-bold text-sm rounded-full shadow-md w-full sm:w-auto flex items-center justify-center space-x-2"
            >
              <span>Vào phòng thi</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="px-6 py-3 font-bold text-sm rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      ) : (
        <>
      {/* 2 Sparkline Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <SparklineChart
          title="Tổng lượt làm bài thi"
          totalValue={data?.stats?.totalAttempts ?? 0}
          subTitle="Thống kê toàn xã Ea Súp"
          data={data?.stats?.attemptsSparkline ?? [0, 0, 0, 0, 0, 0, 0]}
          variant="orange-red"
          trendPercentage={data?.stats?.totalAttempts ? "+100%" : "0%"}
        />
        <SparklineChart
          title="Tổng số thí sinh tham gia"
          totalValue={data?.stats?.totalParticipants ?? 0}
          subTitle="Từ 20 thôn, buôn và khối đoàn thể"
          data={data?.stats?.registrationsSparkline ?? [0, 0, 0, 0, 0, 0, 0]}
          variant="blue"
          trendPercentage={data?.stats?.totalParticipants ? "+100%" : "0%"}
        />
      </div>

      {/* Filter Bar & Scope/Period Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
        {/* Pills chọn Scope (Cá nhân / Tổ chức) & Period (Theo tuần / Toàn cuộc thi) - Chuẩn Ảnh 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setScope("individual")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                scope === "individual"
                  ? "bg-[#00A9E0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Cá nhân</span>
            </button>
            <button
              type="button"
              onClick={() => setScope("organization")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                scope === "organization"
                  ? "bg-[#00A9E0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Tổ chức / Đơn vị</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                period === "week"
                  ? "bg-[#00A9E0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo tuần</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod("contest")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                period === "contest"
                  ? "bg-[#00A9E0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Toàn cuộc thi</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Tìm kiếm */}
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Họ tên hoặc số CCCD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#00A9E0]"
            />
          </div>

          {/* Chọn Đơn vị thôn buôn / cơ quan (Đồng bộ 2 chiều từ contest.units - Ảnh 1) */}
          <div className="sm:col-span-1">
            {(() => {
              const displayUnits = (data?.units && data.units.length > 0)
                ? data.units.map((u: any) => typeof u === "string" ? u : u.name)
                : EA_SUP_VILLAGES;
              return (
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium outline-none focus:border-[#00A9E0]"
                >
                  <option value="ALL">-- Tất cả {displayUnits.length} Đơn vị --</option>
                  {displayUnits.map((v: string) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>

          {/* Từ ngày */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-500 whitespace-nowrap">Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#00A9E0]"
            />
          </div>

          {/* Đến ngày & Nút tìm */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-[#00A9E0]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#00A9E0] hover:bg-[#0096ca] text-white text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
            >
              Lọc
            </button>
          </div>
        </form>
      </div>

      {/* Detailed Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#00A9E0]" />
            <h3 className="text-sm font-bold text-slate-900">
              {scope === "individual"
                ? `Danh Sách Xếp Hạng Cá Nhân (${data?.leaderboard?.length || 0} thí sinh)`
                : `Bảng Xếp Hạng Thi Đua Tổ Chức / Đơn Vị (${data?.leaderboard?.length || 0} đơn vị)`}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {data?.periodLabel ? `📅 ${data.periodLabel}` : ""} • {data?.totalParticipants ?? 0} người tham gia • {data?.totalAttempts ?? 0} lượt thi
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-[#00A9E0] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Đang tổng hợp bảng xếp hạng...
          </div>
        ) : (data?.leaderboard || []).length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Không tìm thấy kết quả nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : scope === "individual" ? (
          /* BẢNG CÁ NHÂN */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Hạng</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Đơn vị</th>
                  <th className="py-3 px-4">Ngày dự thi</th>
                  <th className="py-3 px-4">Kết quả (Cao nhất)</th>
                  <th className="py-3 px-4">Độ chính xác</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Dự đoán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.leaderboard || []).map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {row.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-400 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium pl-1">{row.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{row.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal flex items-center space-x-1.5 mt-0.5">
                        <span>{row.phoneMasked || row.cccdMasked || row.cccd}</span>
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                          Đã thi {row.attemptCount || 1} lượt
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{row.unitName}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#00A9E0]">
                      {row.score} điểm ({row.correctCount}/{row.totalQuestions})
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {row.accuracyPercent}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {Math.floor(row.durationSeconds / 60)}p {row.durationSeconds % 60}s
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {row.tieBreakerPrediction?.toLocaleString("vi-VN") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* BẢNG TỔ CHỨC / ĐƠN VỊ */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-center w-14">Hạng</th>
                  <th className="py-3 px-4">Tổ chức / Đơn vị / Thôn buôn</th>
                  <th className="py-3 px-4 text-center">Số người tham gia</th>
                  <th className="py-3 px-4 text-center">Tổng lượt thi</th>
                  <th className="py-3 px-4 text-center">Điểm TB</th>
                  <th className="py-3 px-4 text-center">Thời gian TB</th>
                  <th className="py-3 px-4 text-center">Tỷ lệ đạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.leaderboard || []).map((org: any) => {
                  const hasData = org.uniqueParticipants > 0;
                  return (
                    <tr key={org.unitName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold">
                        {org.rank === 1 && hasData ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                            1
                          </span>
                        ) : org.rank === 2 && hasData ? (
                          <span className="w-6 h-6 rounded-full bg-slate-400 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                            2
                          </span>
                        ) : org.rank === 3 && hasData ? (
                          <span className="w-6 h-6 rounded-full bg-orange-500 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
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
                      <td className="py-3.5 px-4 text-center font-bold text-[#00A9E0]">
                        {org.uniqueParticipants}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-mono">
                        {org.totalAttempts}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {hasData ? `${org.avgBestScore} đ` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-mono">
                        {hasData ? `${Math.floor(org.avgDurationSeconds / 60)}p ${org.avgDurationSeconds % 60}s` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
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
        )}
      </div>
        </>
      )}

      {/* Floating Action Bar - Chỉ hiển thị cho Quản trị viên (ADMIN) */}
      {isAdmin && <FloatingActionBar contestSlug={slug} />}
    </div>
  );
}
