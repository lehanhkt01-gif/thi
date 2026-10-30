// src/components/ExamSettingsDrawer.tsx
"use client";

import React from "react";
import {
  Smartphone,
  Lock,
  Share2,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import ExamSettingsContent from "./ExamSettingsContent";

export interface ExamMixPackageItem {
  id: string;
  packageId?: string;
  packageName: string;
  mcqCount: number;
  essayCount: number;
}

export interface ExamSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // Tổng số câu hỏi đã chọn trong "ĐỀ THI HIỆN TẠI"
  totalSelectedQuestions?: number;
  // Các cài đặt nâng cao đề thi (Ảnh 1)
  durationMinutes: number;
  onChangeDurationMinutes: (val: number) => void;
  showResultMode: "SCORE_ONLY" | "SCORE_AND_ANSWERS" | "HIDDEN";
  onChangeShowResultMode: (val: "SCORE_ONLY" | "SCORE_AND_ANSWERS" | "HIDDEN") => void;
  maxAttempts: number;
  onChangeMaxAttempts: (val: number) => void;
  attemptCalculation: "ENTIRE_CONTEST" | "DAILY" | "WEEKLY";
  onChangeAttemptCalculation: (val: "ENTIRE_CONTEST" | "DAILY" | "WEEKLY") => void;
  shuffleMode: "NONE" | "AUTO";
  onChangeShuffleMode: (val: "NONE" | "AUTO") => void;
  // Cấu hình trộn nhiều đề thi (Ảnh 1)
  examMixPackages: ExamMixPackageItem[];
  onChangeExamMixPackages: (packages: ExamMixPackageItem[]) => void;
  availablePackages?: Array<{ id: string; name: string }>;
  // Điều hướng & hành động từ thanh công cụ trên cùng
  currentStep?: number;
  onNavigateStep?: (step: number) => void;
  onToggleMobilePreview?: () => void;
  onOpenSecurity?: () => void;
  onOpenShare?: () => void;
  onApplySettings?: () => void;
}

export default function ExamSettingsDrawer(props: ExamSettingsDrawerProps) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop mờ phía sau */}
      <div
        onClick={props.onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
      />

      {/* Drawer Panel chính (Chuẩn xác theo Ảnh 1) */}
      <div className="relative w-full max-w-[410px] sm:max-w-[450px] bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Nút đóng tròn hình (X) ở góc trên bên trái của Drawer đúng như Ảnh 1 */}
        <button
          type="button"
          onClick={props.onClose}
          className="absolute -left-3.5 top-28 w-7 h-7 rounded-full bg-white border border-slate-300 text-slate-400 hover:text-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors z-20"
          title="Đóng bảng cài đặt đề thi"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* ============================================================== */}
        {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (CÁC ICON TRÒN CHUẨN ẢNH 1) */}
        {/* ============================================================== */}
        <div className="bg-[#F1F5F9] border-b border-slate-200 px-3 py-2.5 flex items-center justify-between shrink-0">
          {/* Nhóm nút bên trái: Điện thoại, Khóa, Chia sẻ, Thống kê */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={props.onToggleMobilePreview}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-blue-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Xem trước trên điện thoại di động"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={props.onOpenSecurity}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-emerald-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Khóa & Bảo mật Zero-Trust"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={props.onOpenShare}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-amber-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Chia sẻ Link Zalo & Mã QR"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => props.onNavigateStep && props.onNavigateStep(5)}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-indigo-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Thống kê kết quả & Bảng xếp hạng"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Nhóm nút điều hướng bước bên phải: Mũi tên trái / phải */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => props.onNavigateStep && props.onNavigateStep(Math.max(1, (props.currentStep || 2) - 1))}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Quay lại bước trước"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => props.onNavigateStep && props.onNavigateStep(Math.min(5, (props.currentStep || 2) + 1))}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Tiếp tục sang bước sau"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. NỘI DUNG FORM CÀI ĐẶT ĐỀ THI (ĐỒNG BỘ 100% VỚI CỤM NẰM CỨNG) */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4">
          <ExamSettingsContent
            totalSelectedQuestions={props.totalSelectedQuestions}
            durationMinutes={props.durationMinutes}
            onChangeDurationMinutes={props.onChangeDurationMinutes}
            showResultMode={props.showResultMode}
            onChangeShowResultMode={props.onChangeShowResultMode}
            maxAttempts={props.maxAttempts}
            onChangeMaxAttempts={props.onChangeMaxAttempts}
            attemptCalculation={props.attemptCalculation}
            onChangeAttemptCalculation={props.onChangeAttemptCalculation}
            shuffleMode={props.shuffleMode}
            onChangeShuffleMode={props.onChangeShuffleMode}
            examMixPackages={props.examMixPackages}
            onChangeExamMixPackages={props.onChangeExamMixPackages}
            availablePackages={props.availablePackages}
            onApplySettings={props.onApplySettings}
            isEmbedded={false}
          />
        </div>
      </div>
    </div>
  );
}
