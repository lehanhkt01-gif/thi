// src/components/ShareContestModal.tsx - Modal Chia sẻ quyền quản lý & chỉnh sửa cuộc thi
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  UserPlus,
  Trash2,
  Check,
  Shield,
  Users,
  Mail,
  AlertCircle,
  Search,
  Building,
  UserCheck,
} from "lucide-react";

interface ShareContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: any;
  currentUser: any;
  usersList?: any[];
  onSuccess: (newSharedEmails: string[]) => void;
}

export default function ShareContestModal({
  isOpen,
  onClose,
  contest,
  currentUser,
  usersList = [],
  onSuccess,
}: ShareContestModalProps) {
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);
  const [inputEmail, setInputEmail] = useState("");
  const [searchUserFilter, setSearchUserFilter] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Khởi tạo danh sách sharedEmails từ contest
  useEffect(() => {
    if (contest) {
      const initial = Array.isArray(contest.sharedEmails) ? [...contest.sharedEmails] : [];
      setSharedEmails(initial);
      setInputEmail("");
      setSelectedUserEmail("");
      setSearchUserFilter("");
      setFeedback(null);
    }
  }, [contest]);

  if (!isOpen || !contest) return null;

  const creatorEmail = (contest.creatorEmail || contest.organizerEmail || "").toLowerCase().trim();
  const creatorName = contest.creatorName || contest.organizerName || "Người tạo cuộc thi";

  // Lọc danh sách tài khoản gợi ý từ usersList (chỉ lấy tài khoản đã duyệt, loại trừ chủ sở hữu và tài khoản đã thêm)
  const approvedUsers = usersList.filter((u) => {
    const e = (u.email || "").toLowerCase().trim();
    if (!e || e === creatorEmail) return false;
    if (sharedEmails.some((se) => se.toLowerCase() === e)) return false;
    if (u.status && u.status !== "APPROVED") return false;
    if (searchUserFilter) {
      const q = searchUserFilter.toLowerCase().trim();
      const matchName = (u.name || "").toLowerCase().includes(q);
      const matchEmail = e.includes(q);
      const matchOrg = (u.organizationName || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchOrg;
    }
    return true;
  });

  const handleAddEmail = (emailToAdd?: string) => {
    const target = (emailToAdd || selectedUserEmail || inputEmail).toLowerCase().trim();
    setFeedback(null);

    if (!target) {
      setFeedback({ type: "error", message: "Vui lòng nhập hoặc chọn một địa chỉ email!" });
      return;
    }

    if (!target.includes("@") || !target.includes(".")) {
      setFeedback({ type: "error", message: "Địa chỉ email không đúng định dạng hợp lệ!" });
      return;
    }

    if (target === creatorEmail) {
      setFeedback({ type: "error", message: "Email này là của chính chủ cuộc thi, không cần chia sẻ thêm!" });
      return;
    }

    if (sharedEmails.some((e) => e.toLowerCase() === target)) {
      setFeedback({ type: "error", message: "Email này đã có trong danh sách được cấp quyền!" });
      return;
    }

    setSharedEmails([...sharedEmails, target]);
    setInputEmail("");
    setSelectedUserEmail("");
    setFeedback({
      type: "success",
      message: `Đã thêm ${target}. Bấm "Lưu thay đổi" để áp dụng quyền quản lý.`,
    });
  };

  const handleRemoveEmail = (target: string) => {
    setFeedback(null);
    const updated = sharedEmails.filter((e) => e.toLowerCase() !== target.toLowerCase());
    setSharedEmails(updated);
    setFeedback({
      type: "success",
      message: `Đã xóa quyền của ${target}. Bấm "Lưu thay đổi" để cập nhật.`,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/contests/${contest.slug}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "",
          "x-user-email": currentUser?.email || "",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          sharedEmails,
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể cập nhật quyền chia sẻ!");
      }

      onSuccess(data.sharedEmails || sharedEmails);
      setFeedback({ type: "success", message: "Đã lưu và cập nhật quyền quản lý thành công!" });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Lỗi lưu quyền chia sẻ!" });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper tìm tên hiển thị từ usersList nếu có
  const getUserDisplayInfo = (email: string) => {
    const found = usersList.find((u) => (u.email || "").toLowerCase().trim() === email.toLowerCase());
    return {
      name: found?.name || null,
      org: found?.organizationName || null,
      role: found?.role || null,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-white to-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chia Sẻ Quyền Quản Lý & Chỉnh Sửa
              </h3>
              <p className="text-xs text-slate-500">
                Phân quyền đồng quản trị viên cho cuộc thi trực tuyến
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Thông tin Cuộc thi & Chủ sở hữu */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cuộc thi đang phân quyền:
            </div>
            <div className="font-bold text-slate-900 line-clamp-2">
              {contest.title}
            </div>
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Chủ sở hữu (Người tạo):</span>
                <span className="font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {creatorEmail}
                </span>
              </div>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <Shield className="w-3 h-3 mr-1 text-emerald-600" /> Toàn quyền
              </span>
            </div>
          </div>

          {/* Form Thêm Người Quản Lý Mới */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Thêm người đồng quản lý mới:
            </label>
            <div className="space-y-2">
              {/* Chọn nhanh từ danh sách tài khoản đã phê duyệt */}
              {approvedUsers.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Gợi ý tài khoản trong hệ thống ({approvedUsers.length}):</span>
                    {searchUserFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchUserFilter("")}
                        className="text-red-600 hover:underline text-[10px]"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    {approvedUsers.slice(0, 10).map((u) => (
                      <button
                        key={u.id || u.email}
                        type="button"
                        onClick={() => handleAddEmail(u.email)}
                        className="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-left transition-all cursor-pointer group shadow-2xs"
                        title={`Bấm để cấp quyền cho ${u.name || u.email}`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="font-semibold text-slate-800 text-[11px] truncate group-hover:text-indigo-700">
                            {u.name || u.email}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {u.email}
                          </div>
                        </div>
                        <UserPlus className="w-3.5 h-3.5 text-indigo-500 opacity-60 group-hover:opacity-100 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ô Nhập Trực Tiếp Email Bất Kỳ */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="Nhập địa chỉ email đồng nghiệp (ví dụ: ccb.easup@gmail.com)..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600 shadow-2xs font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddEmail()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors inline-flex items-center shadow-xs cursor-pointer shrink-0"
                  title="Thêm vào danh sách chia sẻ"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Thêm quyền
                </button>
              </div>
            </div>
          </div>

          {/* Feedback thông báo lỗi / thành công */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Danh Sách Những Người Đang Có Quyền Quản Lý */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Danh sách đồng quản lý ({sharedEmails.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Có quyền Chỉnh sửa 5 bước & Xuất Excel
              </span>
            </div>

            {sharedEmails.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
                Cuộc thi này hiện chưa chia sẻ cho ai. Chỉ người tạo ({creatorEmail}) và Quản trị viên mới có quyền chỉnh sửa.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sharedEmails.map((email, idx) => {
                  const info = getUserDisplayInfo(email);
                  return (
                    <div
                      key={email + idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-semibold text-slate-900 truncate">
                            {email}
                          </div>
                          {info.name && (
                            <div className="text-[10px] text-slate-500 truncate">
                              {info.name} {info.org ? `• ${info.org}` : ""}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          Đồng quản lý
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={`Thu hồi quyền quản lý của ${email}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ghi chú chính sách phân quyền */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-amber-700" /> Quyền hạn của người được chia sẻ:
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
              <li>Được toàn quyền chỉnh sửa thông tin, cấu hình và ngân hàng câu hỏi 5 bước.</li>
              <li>Được xem bảng xếp hạng chi tiết và tải file Excel kết quả thí sinh.</li>
              <li>Không thể xóa cuộc thi (chỉ chủ cuộc thi và Admin mới có quyền xóa).</li>
            </ul>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs transition-colors shadow-xs inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
