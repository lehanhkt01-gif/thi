// src/components/ExamSettingsDrawer.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Lock,
  Share2,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  X,
  Pencil,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";

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
  shuffleMode: "NONE" | "ALL" | "QUESTIONS_ONLY" | "ANSWERS_ONLY";
  onChangeShuffleMode: (val: "NONE" | "ALL" | "QUESTIONS_ONLY" | "ANSWERS_ONLY") => void;
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

export default function ExamSettingsDrawer({
  isOpen,
  onClose,
  totalSelectedQuestions = 0,
  durationMinutes,
  onChangeDurationMinutes,
  showResultMode,
  onChangeShowResultMode,
  maxAttempts,
  onChangeMaxAttempts,
  attemptCalculation,
  onChangeAttemptCalculation,
  shuffleMode,
  onChangeShuffleMode,
  examMixPackages,
  onChangeExamMixPackages,
  availablePackages = [],
  currentStep = 2,
  onNavigateStep,
  onToggleMobilePreview,
  onOpenSecurity,
  onOpenShare,
  onApplySettings,
}: ExamSettingsDrawerProps) {
  const [tipDismissed, setTipDismissed] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Tính tổng số câu hỏi từ các gói đề
  const totalMCQ = examMixPackages.reduce(
    (sum, p) => sum + (Number(p.mcqCount) || 0),
    0
  );
  const totalEssay = examMixPackages.reduce(
    (sum, p) => sum + (Number(p.essayCount) || 0),
    0
  );

  // Thêm một gói đề mới vào danh sách trộn
  const handleAddPackage = () => {
    const newPkg: ExamMixPackageItem = {
      id: `mix-${Date.now()}`,
      packageName:
        availablePackages.length > 0
          ? availablePackages[examMixPackages.length % availablePackages.length].name
          : "Bộ đề Chung Xã Ea Súp",
      mcqCount: 10,
      essayCount: 0,
    };
    onChangeExamMixPackages([...examMixPackages, newPkg]);
  };

  // Khi mở drawer hoặc khi totalSelectedQuestions thay đổi, tự động kiểm tra và đồng bộ
  useEffect(() => {
    if (totalSelectedQuestions > 0 && examMixPackages.length > 0) {
      const first = examMixPackages[0];
      if (first.packageName === "Đề thi mới tạo" || first.packageName === "Đề thi hiện tại") {
        if (first.mcqCount > totalSelectedQuestions || first.mcqCount === 0) {
          const updated = [...examMixPackages];
          updated[0] = { ...first, mcqCount: totalSelectedQuestions };
          onChangeExamMixPackages(updated);
        }
      }
    }
  }, [totalSelectedQuestions, isOpen]);

  // Cập nhật thông số từng dòng gói đề
  const handleUpdatePackage = (
    index: number,
    field: keyof ExamMixPackageItem,
    value: any
  ) => {
    let sanitizedValue = value;
    if (field === "mcqCount") {
      const num = parseInt(value, 10);
      sanitizedValue = isNaN(num) || num < 0 ? 0 : num;
      // Khống chế số câu hỏi cần sử dụng phải nhỏ hơn hoặc bằng tối đa trong tổng số trên
      if (
        (examMixPackages[index]?.packageName === "Đề thi mới tạo" || index === 0) &&
        totalSelectedQuestions > 0
      ) {
        if (sanitizedValue > totalSelectedQuestions) {
          sanitizedValue = totalSelectedQuestions;
        }
      }
    } else if (field === "essayCount") {
      const num = parseInt(value, 10);
      sanitizedValue = isNaN(num) || num < 0 ? 0 : num;
    }

    const updated = [...examMixPackages];
    updated[index] = {
      ...updated[index],
      [field]: sanitizedValue,
    };
    onChangeExamMixPackages(updated);
  };

  // Xóa một gói đề khỏi danh sách trộn
  const handleRemovePackage = (index: number) => {
    if (examMixPackages.length <= 1) {
      alert("Cần giữ lại ít nhất 1 gói đề thi!");
      return;
    }
    const updated = examMixPackages.filter((_, i) => i !== index);
    onChangeExamMixPackages(updated);
  };

  const handleApply = () => {
    if (onApplySettings) {
      onApplySettings();
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop mờ phía sau */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
      />

      {/* Drawer Panel chính (Chuẩn xác theo Ảnh 1) */}
      <div className="relative w-full max-w-[380px] sm:max-w-[410px] bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Nút đóng tròn hình (X) ở góc trên bên trái của Drawer đúng như Ảnh 1 */}
        <button
          type="button"
          onClick={onClose}
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
            {/* 1. Nút xem trước Mobile */}
            <button
              type="button"
              onClick={onToggleMobilePreview}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-blue-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Xem trước trên điện thoại di động"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* 2. Nút Khóa / Bảo mật Zero-Trust */}
            <button
              type="button"
              onClick={onOpenSecurity}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-emerald-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Khóa & Bảo mật Zero-Trust"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* 3. Nút Chia sẻ Zalo / QR */}
            <button
              type="button"
              onClick={onOpenShare}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-amber-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Chia sẻ Link Zalo & Mã QR"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* 4. Nút Thống kê & Bảng xếp hạng (Chuyển sang Bước 5) */}
            <button
              type="button"
              onClick={() => onNavigateStep && onNavigateStep(5)}
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
              onClick={() => onNavigateStep && onNavigateStep(Math.max(1, currentStep - 1))}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Quay lại bước trước"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateStep && onNavigateStep(Math.min(5, currentStep + 1))}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Tiếp tục sang bước sau"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. NỘI DUNG FORM CÀI ĐẶT ĐỀ THI (CUỘN DỌC - CHUẨN ẢNH 1) */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800">
          {/* Hộp gợi ý mũi tên lên (Ảnh 1) */}
          {!tipDismissed && (
            <div className="flex items-start space-x-2 text-xs text-slate-700 pb-3 border-b border-slate-200">
              <span className="text-base font-bold leading-none mt-0.5 select-none">↑</span>
              <p className="flex-1 leading-snug">
                Chọn nút xem trước và nhấn tham gia để thi thử ngay sau khi cài đặt xong đề thi.{" "}
                <button
                  type="button"
                  onClick={() => setTipDismissed(true)}
                  className="text-[#DC2626] font-semibold hover:underline cursor-pointer"
                >
                  Đã hiểu
                </button>
              </p>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHẦN TRỘN NHIỀU ĐỀ THI, THÊM NGAY (ẢNH 1) */}
          {/* ============================================================== */}
          <div className="space-y-2">
            <div className="text-xs text-slate-700 font-medium">
              Trộn nhiều đề thi,{" "}
              <button
                type="button"
                onClick={handleAddPackage}
                className="text-[#DC2626] font-semibold hover:underline cursor-pointer"
              >
                Thêm ngay
              </button>
            </div>

            {/* Các hàng cấu hình gói đề thi */}
            <div className="space-y-2">
              {examMixPackages.map((pkg, idx) => (
                <div key={pkg.id || idx} className="flex items-center space-x-1.5">
                  {/* Dropdown chọn gói đề */}
                  <select
                    value={pkg.packageName}
                    onChange={(e) => handleUpdatePackage(idx, "packageName", e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white outline-none focus:border-red-500 text-slate-800 truncate"
                  >
                    <option value="Đề thi mới tạo">Đề thi mới tạo</option>
                    <option value="Bộ đề Chung Xã Ea Súp">Bộ đề Chung Xã Ea Súp</option>
                    <option value="Bộ đề Cựu chiến binh">Bộ đề Cựu chiến binh</option>
                    <option value="Bộ đề Pháp luật Ea Súp 2026">Bộ đề Pháp luật Ea Súp 2026</option>
                    <option value="Bộ đề Chuyển đổi số Ea Súp">Bộ đề Chuyển đổi số Ea Súp</option>
                    {availablePackages.map((bp) => (
                      <option key={bp.id} value={bp.name}>
                        {bp.name}
                      </option>
                    ))}
                  </select>

                  {/* Ô nhập số câu trắc nghiệm (nhỏ hơn hoặc bằng tối đa tổng số câu ĐỀ THI HIỆN TẠI) */}
                  <input
                    type="number"
                    min="0"
                    max={
                      (pkg.packageName === "Đề thi mới tạo" || idx === 0) && totalSelectedQuestions > 0
                        ? totalSelectedQuestions
                        : undefined
                    }
                    value={pkg.mcqCount}
                    onChange={(e) =>
                      handleUpdatePackage(idx, "mcqCount", e.target.value)
                    }
                    className="w-13 px-1 py-2 text-xs text-center border border-slate-300 rounded-lg bg-white outline-none focus:border-red-500 font-medium text-slate-800"
                    title={
                      totalSelectedQuestions > 0
                        ? `Số câu trắc nghiệm sử dụng (Tối đa ${totalSelectedQuestions} câu từ ĐỀ THI HIỆN TẠI)`
                        : "Số câu trắc nghiệm"
                    }
                  />

                  {/* Ô nhập số câu tự luận */}
                  <input
                    type="number"
                    min="0"
                    value={pkg.essayCount}
                    onChange={(e) =>
                      handleUpdatePackage(idx, "essayCount", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-13 px-1 py-2 text-xs text-center border border-slate-300 rounded-lg bg-white outline-none focus:border-red-500 font-medium text-slate-800"
                    title="Số câu tự luận"
                  />

                  {/* Nút biểu tượng cây bút sửa */}
                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                    className="p-1 text-slate-700 hover:text-black cursor-pointer transition-colors"
                    title="Chỉnh sửa cấu hình"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Nút biểu tượng X xóa */}
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(idx)}
                    className="p-1 text-slate-700 hover:text-red-600 cursor-pointer transition-colors"
                    title="Xóa gói đề này"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Dòng tóm tắt số lượng câu */}
            <div className="space-y-1 pt-1">
              <p className="text-xs text-slate-700">
                Đề thi có <span className="text-[#DC2626] font-bold">{totalMCQ}</span> câu trắc nghiệm và{" "}
                <span className="text-[#DC2626] font-bold">{totalEssay}</span> câu tự luận.
              </p>
              {totalSelectedQuestions > 0 && (
                <p className="text-[11px] text-slate-500">
                  * Số câu hỏi sử dụng trong cuộc thi: <strong className="text-[#DC2626] font-bold">{Math.min(totalMCQ, totalSelectedQuestions)}</strong> / tối đa <strong className="text-slate-800">{totalSelectedQuestions}</strong> câu đã chọn từ &quot;ĐỀ THI HIỆN TẠI&quot;.
                </p>
              )}
            </div>
          </div>

          {/* Đường phân cách chuẩn như Ảnh 1 */}
          <div className="border-t border-slate-200 my-4" />

          {/* ============================================================== */}
          {/* CÁC TRƯỜNG THIẾT LẬP THỜI GIAN, KẾT QUẢ, LƯỢT THI, TRỘN CÂU HỎI */}
          {/* ============================================================== */}
          <div className="space-y-4">
            {/* 1. Thời gian làm bài (phút) */}
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-normal">
                Thời gian làm bài (phút) (0: Không giới hạn)
              </label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => onChangeDurationMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 font-medium"
              />
            </div>

            {/* 2. Hiển thị kết quả cho thí sinh */}
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-normal">
                Hiển thị kết quả cho thí sinh
              </label>
              <select
                value={showResultMode}
                onChange={(e: any) => onChangeShowResultMode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-red-500 text-slate-700 font-medium"
              >
                <option value="SCORE_ONLY">Chỉ cho xem điểm</option>
                <option value="SCORE_AND_ANSWERS">Cho xem điểm và đáp án</option>
                <option value="HIDDEN">Không cho xem</option>
              </select>
            </div>

            {/* 3. Số lần làm bài */}
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-normal">
                Số lần làm bài (0: Không giới hạn)
              </label>
              <input
                type="number"
                min="0"
                value={maxAttempts}
                onChange={(e) => onChangeMaxAttempts(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 font-medium"
              />
            </div>

            {/* 4. Lần làm bài tính theo */}
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-normal">
                Lần làm bài tính theo
              </label>
              <select
                value={attemptCalculation}
                onChange={(e: any) => onChangeAttemptCalculation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-red-500 text-slate-700 font-medium"
              >
                <option value="ENTIRE_CONTEST">Cả cuộc thi (mặc định)</option>
                <option value="DAILY">Mỗi ngày</option>
                <option value="WEEKLY">Mỗi tuần</option>
              </select>
            </div>

            {/* 5. Trộn câu hỏi */}
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-normal">
                Trộn câu hỏi
              </label>
              <select
                value={shuffleMode}
                onChange={(e: any) => onChangeShuffleMode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-red-500 text-slate-700 font-medium"
              >
                <option value="NONE">Không trộn</option>
                <option value="ALL">Trộn câu hỏi và đáp án</option>
                <option value="QUESTIONS_ONLY">Chỉ trộn câu hỏi</option>
                <option value="ANSWERS_ONLY">Chỉ trộn đáp án</option>
              </select>
            </div>
          </div>

          {/* Nút Áp dụng & Lưu cấu hình */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center space-x-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? "Đã lưu cài đặt!" : "Áp dụng cài đặt đề thi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
