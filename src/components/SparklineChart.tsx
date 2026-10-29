"use client";

import React from "react";

interface SparklineChartProps {
  title: string;
  totalValue: number | string;
  subTitle?: string;
  data: number[];
  variant?: "orange-red" | "blue";
  trendPercentage?: string;
}

export default function SparklineChart({
  title,
  totalValue,
  subTitle = "Cập nhật thời gian thực",
  data,
  variant = "orange-red",
  trendPercentage = "+18.4%",
}: SparklineChartProps) {
  // Tính toán tọa độ SVG
  const width = 240;
  const height = 55;
  const padding = 5;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const isRed = variant === "orange-red";
  const strokeColor = isRed ? "#EA580C" : "#0284C7";
  const gradientId = `gradient-${isRed ? "red" : "blue"}-${Math.random().toString(36).substring(2, 6)}`;
  const stopColor = isRed ? "#EA580C" : "#0284C7";
  const badgeBg = isRed ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-sky-50 text-sky-700 border-sky-200";

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {typeof totalValue === "number" ? totalValue.toLocaleString("vi-VN") : totalValue}
          </div>
        </div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
          {trendPercentage}
        </div>
      </div>

      {/* SVG Sparkline Area */}
      <div className="mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-12 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stopColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={stopColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Filled Area */}
          <path d={areaD} fill={`url(#${gradientId})`} />
          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Last Point Indicator */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3.5"
            fill={strokeColor}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 border-t border-slate-100 pt-2">
        <span>{subTitle}</span>
        <span className="font-medium text-slate-700">7 ngày gần nhất</span>
      </div>
    </div>
  );
}
