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

  const fetchResults = () => {
    setLoading(true);
    const query = new URLSearchParams();
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
  }, [slug, selectedUnit, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Banner của chính cuộc thi đó */}
      {data?.bannerUrl && (
        <div className="w-full mb-6 rounded-2xl overflow-hidden shadow-md max-h-56 sm:max-h-72 border border-slate-200 bg-slate-900">
          <img
            src={data.bannerUrl}
            alt={data.contestTitle || "Banner cuộc thi"}
            className="w-full h-full object-cover max-h-56 sm:max-h-72"
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

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
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

          <Link
            href={`/thi/${slug}`}
            className="btn-admin-primary text-xs px-4 py-2.5 font-bold"
          >
            Vào thi ngay
          </Link>
        </div>
      </div>

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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Tìm kiếm */}
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Họ tên hoặc số CCCD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-red-600"
            />
          </div>

          {/* Chọn Đơn vị thôn buôn / cơ quan */}
          <div className="sm:col-span-1">
            {(() => {
              const displayUnits = (data?.units && data.units.length > 0)
                ? data.units.map((u: any) => typeof u === "string" ? u : u.name)
                : EA_SUP_VILLAGES;
              return (
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium outline-none"
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
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
            />
          </div>

          {/* Đến ngày & Nút tìm */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none"
            />
            <button
              type="submit"
              className="btn-admin-primary text-xs px-3.5 py-2 font-bold whitespace-nowrap"
            >
              Lọc
            </button>
          </div>
        </form>
      </div>

      {/* Detailed Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#DC2626]" />
            <h3 className="text-sm font-bold text-slate-900">
              Danh Sách Xếp Hạng Chi Tiết ({data?.leaderboard?.length || 0} lượt thi)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Tiêu chí: Điểm cao nhất → Thời gian làm bài ngắn nhất
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Đang tổng hợp bảng xếp hạng...
          </div>
        ) : (data?.leaderboard || []).length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Không tìm thấy thí sinh nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Hạng</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Đơn vị</th>
                  <th className="py-3 px-4">Ngày dự thi</th>
                  <th className="py-3 px-4">Kết quả</th>
                  <th className="py-3 px-4">Độ chính xác (%)</th>
                  <th className="py-3 px-4">Thời gian làm</th>
                  <th className="py-3 px-4">Dự đoán người thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.leaderboard || []).map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {row.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                          🥇
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-400 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                          🥈
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center font-bold text-xs shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium pl-1">{row.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.fullName}
                      <div className="text-[10px] text-slate-400 font-normal">{row.cccd}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{row.unitName}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#DC2626]">
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
        )}
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar contestSlug={slug} />
    </div>
  );
}
