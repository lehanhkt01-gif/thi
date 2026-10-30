// src/components/ExamSettingsContent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Pencil, Check, Settings } from "lucide-react";
import { ExamMixPackageItem } from "./ExamSettingsDrawer";

export interface ExamSettingsContentProps {
  // Tổng số câu hỏi đã chọn trong "ĐỀ THI HIỆN TẠI"
  totalSelectedQuestions?: number;
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
  examMixPackages: ExamMixPackageItem[];
  onChangeExamMixPackages: (packages: ExamMixPackageItem[]) => void;
  availablePackages?: Array<{ id: string; name: string }>;
  onApplySettings?: () => void;
  isEmbedded?: boolean;
}

export default function ExamSettingsContent({
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
  onApplySettings,
  isEmbedded = false,
}: ExamSettingsContentProps) {
  const [tipDismissed, setTipDismissed] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Lọc và chuẩn hóa danh sách các gói đề không bao giờ bị trùng lặp (Ảnh 5)
  const uniquePackages = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ id: string; name: string }> = [];

    const defaults = [
      { id: "pkg-chung", name: "Bộ đề Chung Xã Ea Súp" },
      { id: "pkg-ccb", name: "Bộ đề Cựu chiến binh" },
      { id: "pkg-phap-luat", name: "Bộ đề Pháp luật Ea Súp 2026" },
      { id: "pkg-cds", name: "Bộ đề Chuyển đổi số Ea Súp" },
    ];

    const source = [...defaults, ...availablePackages];
    for (const p of source) {
      const cleanName = (p.name || "").trim();
      const lower = cleanName.toLowerCase();
      if (!lower) continue;
      if (lower.includes("đề thi mới tạo") || lower.includes("đề thi hiện tại")) continue;
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push({ id: p.id, name: cleanName });
      }
    }
    return result;
  }, [availablePackages]);

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
    const nextPackageName =
      uniquePackages.length > 0
        ? uniquePackages[examMixPackages.length % uniquePackages.length].name
        : "Bộ đề Chung Xã Ea Súp";

    const newPkg: ExamMixPackageItem = {
      id: `mix-${Date.now()}`,
      packageName: nextPackageName,
      mcqCount: 10,
      essayCount: 0,
    };
    onChangeExamMixPackages([...examMixPackages, newPkg]);
  };

  // Khớp nối khoa học 2 chiều: Khi totalSelectedQuestions thay đổi,
  // tự động cập nhật số câu trắc nghiệm của Đề thi hiện tại nếu đang bằng 0 hoặc mặc định cũ (Ảnh 4)
  useEffect(() => {
    if (totalSelectedQuestions > 0 && examMixPackages.length > 0) {
      const first = examMixPackages[0];
      const isCurrentExam =
        first.packageName === "Đề thi mới tạo" ||
        first.packageName === "Đề thi hiện tại";

      if (isCurrentExam) {
        if (
          first.mcqCount === 0 ||
          first.mcqCount > totalSelectedQuestions ||
          (first.mcqCount === 10 && totalSelectedQuestions !== 10)
        ) {
          const updated = [...examMixPackages];
          updated[0] = {
            ...first,
            packageName: "Đề thi hiện tại",
            mcqCount: totalSelectedQuestions,
          };
          onChangeExamMixPackages(updated);
        }
      }
    }
  }, [totalSelectedQuestions]);

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
      if (
        (examMixPackages[index]?.packageName === "Đề thi mới tạo" ||
          examMixPackages[index]?.packageName === "Đề thi hiện tại" ||
          index === 0) &&
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
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 text-slate-800">
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
      {/* PHẦN TRỘN NHIỀU ĐỀ THI, THÊM NGAY (ẢNH 1, 4, 5) */}
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
              {/* Dropdown chọn gói đề - Đã deduplicate hoàn toàn (Ảnh 5) */}
              <select
                value={
                  pkg.packageName === "Đề thi mới tạo" ? "Đề thi hiện tại" : pkg.packageName
                }
                onChange={(e) => handleUpdatePackage(idx, "packageName", e.target.value)}
                className="flex-1 min-w-[155px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-none focus:border-red-500 text-slate-800 font-medium truncate"
                title={pkg.packageName}
              >
                <option value="Đề thi hiện tại">
                  Đề thi hiện tại {totalSelectedQuestions > 0 ? `(${totalSelectedQuestions} câu)` : ""}
                </option>
                {uniquePackages.map((bp) => (
                  <option key={bp.id} value={bp.name}>
                    {bp.name}
                  </option>
                ))}
              </select>

              {/* Ô nhập số câu trắc nghiệm */}
              <input
                type="number"
                min="0"
                max={
                  (pkg.packageName === "Đề thi mới tạo" ||
                    pkg.packageName === "Đề thi hiện tại" ||
                    idx === 0) &&
                  totalSelectedQuestions > 0
                    ? totalSelectedQuestions
                    : undefined
                }
                value={pkg.mcqCount}
                onChange={(e) => handleUpdatePackage(idx, "mcqCount", e.target.value)}
                className="w-12 px-1 py-1.5 text-xs text-center border border-slate-300 rounded-lg bg-white outline-none focus:border-red-500 font-bold text-slate-800"
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
                className="w-11 px-1 py-1.5 text-xs text-center border border-slate-300 rounded-lg bg-white outline-none focus:border-red-500 font-medium text-slate-700"
                title="Số câu tự luận"
              />

              {/* Nút biểu tượng cây bút sửa */}
              <button
                type="button"
                onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                className="p-1 text-slate-700 hover:text-black cursor-pointer transition-colors"
                title="Chỉnh sửa cấu hình"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {/* Nút biểu tượng X xóa */}
              <button
                type="button"
                onClick={() => handleRemovePackage(idx)}
                className="p-1 text-slate-700 hover:text-red-600 cursor-pointer transition-colors"
                title="Xóa gói đề này"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Dòng tóm tắt số lượng câu khoa học (Ảnh 4) */}
        <div className="space-y-1.5 pt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-800 font-medium">
            Đề thi có <span className="text-[#DC2626] font-bold text-sm">{totalMCQ}</span> câu trắc nghiệm và{" "}
            <span className="text-slate-700 font-bold">{totalEssay}</span> câu tự luận.
          </p>
          {totalSelectedQuestions > 0 && (
            <div className="text-[11px] space-y-0.5 leading-snug">
              {totalMCQ === totalSelectedQuestions ? (
                <p className="text-emerald-700 font-medium">
                  ✓ Thí sinh sẽ làm toàn bộ 100% (<strong className="text-[#DC2626] font-bold">{totalMCQ}</strong> / <strong className="text-slate-800 font-bold">{totalSelectedQuestions}</strong> câu) từ &quot;ĐỀ THI HIỆN TẠI&quot;.
                </p>
              ) : totalMCQ < totalSelectedQuestions ? (
                <p className="text-amber-800">
                  * Chế độ thi rút ngẫu nhiên: Mỗi thí sinh làm <strong className="text-[#DC2626] font-bold">{totalMCQ}</strong> câu / từ ngân hàng <strong className="text-slate-800 font-bold">{totalSelectedQuestions}</strong> câu đã chọn trong &quot;ĐỀ THI HIỆN TẠI&quot;.
                </p>
              ) : (
                <p className="text-slate-700">
                  * Số câu hỏi sử dụng trong cuộc thi: <strong className="text-[#DC2626] font-bold">{totalMCQ}</strong> câu (kết hợp các gói đề trộn) / ngân hàng <strong className="text-slate-800 font-bold">{totalSelectedQuestions}</strong> câu đã chọn.
                </p>
              )}
            </div>
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
            value={shuffleMode === "NONE" ? "NONE" : "AUTO"}
            onChange={(e: any) => onChangeShuffleMode(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-red-500 text-slate-700 font-medium"
          >
            <option value="NONE">Không trộn</option>
            <option value="AUTO">Trộn tự động</option>
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
  );
}
