import React from "react";
import Link from "next/link";
import {
  Calendar,
  BarChart3,
  Phone,
  Mail,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import HeroContestCarousel from "@/components/HeroContestCarousel";
import HomeStatsCards from "@/components/HomeStatsCards";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const contests = store.getContests();
  const stats = store.getSystemStats();

  // Cuộc thi nổi bật hiển thị ở cột trái (chính là cuộc thi mới nhất do người dùng tạo)
  const featuredContest = contests[0] || null;

  // Danh sách các cuộc thi còn lại đồng bộ với danh sách do người tạo tại Ảnh 1
  const rightListContests = contests.slice(1);

  return (
    <div className="w-full bg-[#F8FAFC] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* HERO GRID 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Cột Trái: Banner đồ họa giới thiệu Thi Trực Tuyến nằm trọn vẹn trong khung, kèm 3 chỉ số thống kê gọn gàng bên dưới không che khuất hình ảnh */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white flex flex-col justify-between group">
            {/* Vùng hiển thị hình ảnh: Căn chỉnh để hình ảnh nằm lọt hoàn toàn trong khung, tỷ lệ chuẩn không cắt xén */}
            <div className="relative w-full flex-1 flex items-center justify-center p-2.5 sm:p-3 bg-gradient-to-b from-sky-50/60 via-white to-slate-50/60">
              <img
                src="/images/promo_thi_tructuyen.jpg"
                alt="THI TRỰC TUYẾN giúp bạn dễ dàng tổ chức, quản lý cuộc thi hiệu quả"
                className="w-full h-auto max-h-[380px] object-contain block rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>

            {/* 3 chỉ số thống kê thu gọn: Đồng bộ 2 chiều thời gian thực (Sắp diễn ra, Đang diễn ra, Tổng lượt thi) */}
            <div className="p-2 sm:p-2.5 bg-slate-50/90 border-t border-slate-200/70">
              <HomeStatsCards initialStats={stats} />
            </div>
          </div>

          {/* Right Banner Card: Hiệu ứng chuyển trang banner các cuộc thi có trong hệ thống (Ảnh 2) */}
          <HeroContestCarousel contests={contests} />
        </div>

        {/* 3. SECTION: CÁC CUỘC THI LỚN ĐANG DIỄN RA + TIN TỨC MỚI (Đồng bộ Ảnh 1 & Ảnh 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column: Các cuộc thi lớn đang diễn ra (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Các cuộc thi lớn đang diễn ra
              </h3>
              <Link href="/admin" className="text-xs font-semibold text-[#0284C7] hover:underline">
                Xem tất cả &gt;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Featured Left Card: Cuộc thi do người dùng tạo tại Ảnh 1 */}
              <div className="md:col-span-7 group">
                {featuredContest ? (
                  <Link href={`/thi/${featuredContest.slug}`} className="block">
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 mb-2.5">
                      {featuredContest.bannerUrl ? (
                        <img
                          src={featuredContest.bannerUrl || "/banners/banner-nong-dan-ea-sup.jpg"}
                          alt={featuredContest.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-700 to-amber-700 p-4 flex flex-col justify-between text-white">
                          <div className="text-[10px] font-bold text-red-100 uppercase tracking-wider">
                            {featuredContest.organizerName || "ỦY BAN NHÂN DÂN XÃ EA SÚP"}
                          </div>
                          <div className="my-auto text-center">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                              CUỘC THI TRỰC TUYẾN
                            </div>
                            <h4 className="text-sm font-black leading-tight text-white mt-1 drop-shadow-md line-clamp-2">
                              {featuredContest.title.toUpperCase()}
                            </h4>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-red-100 pt-1 border-t border-white/20">
                            <span>{featuredContest.durationMinutes || 15} phút/lượt</span>
                            <span className="font-bold underline">Vào thi ngay ➔</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 text-white flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-300 uppercase truncate max-w-[220px]">
                          {featuredContest.organizerName || "UBND XÃ EA SÚP"}
                        </span>
                        <span className="text-[10px] font-bold text-white bg-[#DC2626] px-2.5 py-1 rounded-full shadow-xs shrink-0">
                          Vào thi ngay ➔
                        </span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#DC2626] transition-colors leading-snug line-clamp-2">
                      {featuredContest.title}
                    </h4>
                  </Link>
                ) : (
                  <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-2">Chưa có cuộc thi nào được xuất bản.</p>
                    <Link href="/admin/tao-cuoc-thi" className="text-xs font-bold text-[#DC2626] hover:underline">
                      + Tạo cuộc thi mới ngay
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Mini List - Đồng bộ 100% với Danh sách Cuộc thi do người tạo tại Ảnh 1 */}
              <div className="md:col-span-5 space-y-3">
                {rightListContests.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center h-full min-h-[140px]">
                    <p className="text-xs text-slate-500 mb-2">Chưa có thêm cuộc thi nào khác.</p>
                    <Link
                      href="/admin/tao-cuoc-thi"
                      className="inline-flex items-center text-xs font-bold text-[#DC2626] hover:underline"
                    >
                      + Tạo cuộc thi mới ngay
                    </Link>
                  </div>
                ) : (
                  rightListContests.map((item, idx) => (
                    <Link
                      key={item.id || item.slug || idx}
                      href={`/thi/${item.slug}`}
                      className="flex items-center space-x-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group shadow-2xs"
                    >
                      {/* Ảnh review cuộc thi thay cho màu sắc đơn điệu QUIZ */}
                      <div className="w-16 h-12 sm:w-20 sm:h-13 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 shadow-2xs relative">
                        <img
                          src={item.bannerUrl || "/banners/banner-nong-dan-ea-sup.jpg"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#DC2626] transition-colors line-clamp-2 leading-snug block">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                          {item.durationMinutes || 15} phút/lượt • {item.organizerName || "UBND Xã Ea Súp"}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Tin tức mới & My Predict AI (Ảnh 1: 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
                Tin tức mới
              </h3>

              {/* Cuộc thi Ảnh/Video Card (Mới - Ảnh 3) */}
              <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 rounded-xl border border-emerald-300/80 p-4 text-center mb-4 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                    BÌNH CHỌN TRỰC TUYẾN
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 mb-2.5 line-clamp-1">
                  Cuộc thi Bình Chọn Ảnh &amp; Video 2026
                </div>
                <div className="relative rounded-lg overflow-hidden border border-emerald-200 shadow-2xs mb-2.5">
                  <img
                    src="/images/contest_stage_banner.jpg"
                    alt="Cuộc thi bình chọn ảnh video"
                    className="w-full h-28 object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-2xs py-1 px-2 text-[10px] text-white font-semibold flex items-center justify-between">
                    <span>Đếm ngược nộp bài</span>
                    <span className="text-emerald-400 font-bold">02 ngày : 23 giờ</span>
                  </div>
                </div>
                <Link
                  href="/binh-chon/cuoc-thi-binh-chon-moi"
                  className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#009E60] hover:bg-[#008552] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Tham gia bình chọn ngay &gt;&gt;
                </Link>
              </div>

              {/* Cuộc Thi AI Card (Ảnh 1) */}
              <div className="bg-gradient-to-br from-red-50/60 to-orange-50/40 rounded-xl border border-red-200/60 p-4 text-center">
                <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider mb-1">
                  Cuộc Thi AI®
                </div>
                <div className="text-xs font-semibold text-slate-800 mb-3">
                  Lựa chọn số 1 cho công tác thi trực tuyến
                </div>
                <img
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80"
                  alt="Cuộc Thi AI"
                  className="w-full h-32 object-cover rounded-lg shadow-2xs mb-3"
                />
                <Link
                  href="/admin/tao-cuoc-thi"
                  className="btn-admin-primary w-full py-2 text-xs font-bold"
                >
                  Trải nghiệm ngay
                </Link>
              </div>

              {/* Support Hotlines */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around text-slate-500 text-xs">
                <a href="tel:0888023023" className="flex items-center space-x-1 hover:text-[#DC2626]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>0888023023</span>
                </a>
                <a href="mailto:support@cuocthi.easupso.com" className="flex items-center space-x-1 hover:text-[#0284C7]">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Hỗ trợ</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
