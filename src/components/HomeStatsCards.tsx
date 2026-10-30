// src/components/HomeStatsCards.tsx - Thống kê 3 chỉ số trang chủ đồng bộ 2 chiều thời gian thực
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, BarChart3 } from "lucide-react";

interface HomeStatsCardsProps {
  initialStats: {
    upcomingContests: number;
    activeContests: number;
    totalAttempts: number;
    totalParticipants: number;
    totalAttempts7Days?: number;
  };
}

export default function HomeStatsCards({ initialStats }: HomeStatsCardsProps) {
  const [stats, setStats] = useState(initialStats);

  // Đồng bộ 2 chiều tự động: Cập nhật chỉ số khi có thí sinh nộp bài hoặc quay lại trang
  useEffect(() => {
    const fetchLatestStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        }
      } catch (e) {
        // Fallback to current stats
      }
    };

    // Lắng nghe khi thí sinh nộp bài hoặc chuyển tab
    window.addEventListener("focus", fetchLatestStats);
    window.addEventListener("storage", fetchLatestStats);
    window.addEventListener("cuocthi_exam_submitted", fetchLatestStats);

    // Chu kỳ đồng bộ 10s một lần
    const interval = setInterval(fetchLatestStats, 10000);

    return () => {
      window.removeEventListener("focus", fetchLatestStats);
      window.removeEventListener("storage", fetchLatestStats);
      window.removeEventListener("cuocthi_exam_submitted", fetchLatestStats);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {/* Card 1: Sắp diễn ra */}
      <div className="bg-white hover:bg-slate-50 rounded-lg p-2 border border-slate-200 shadow-2xs transition-colors flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">
            Sắp diễn ra
          </span>
          <div className="text-sm sm:text-base font-black text-slate-900 leading-none mt-0.5">
            {stats.upcomingContests ?? 0}
          </div>
        </div>
        <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Card 2: Đang diễn ra */}
      <div className="bg-white hover:bg-slate-50 rounded-lg p-2 border border-slate-200 shadow-2xs transition-colors flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">
            Đang diễn ra
          </span>
          <div className="text-sm sm:text-base font-black text-red-600 leading-none mt-0.5">
            {stats.activeContests ?? 0}
          </div>
        </div>
        <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Card 3: Tổng lượt thi (Đồng bộ 2 chiều với tổng số lượt thi của tất cả thí sinh) */}
      <div className="bg-white hover:bg-slate-50 rounded-lg p-2 border border-slate-200 shadow-2xs transition-colors flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate" title="Tổng số lượt làm bài thi của thí sinh">
            Tổng lượt thi
          </span>
          <div className="text-sm sm:text-base font-black text-emerald-700 leading-none mt-0.5">
            {new Intl.NumberFormat("vi-VN").format(stats.totalAttempts ?? 0)}
          </div>
        </div>
        <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <BarChart3 className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
