"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  CheckCircle2,
} from "lucide-react";

// =========================================================================
// 1. MOTION DESIGN TOKENS (CANVA & APPLE MOTION SPECIFICATION)
// =========================================================================

// Đường cong Easing điện ảnh cao cấp (Cực êm ở điểm dừng)
const easeCanva: [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeIn: [number, number, number, number] = [0.4, 0, 1, 1];

// LỚP 1: Badge đơn vị & Số thứ tự trang (delay: 0s)
const badgeVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: 0, ease: easeCanva },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: easeIn },
  },
};

// LỚP 2: Tiêu đề cuộc thi (Heading chữ hoa trắng, blur 4px -> 0px, delay: 0.05s)
const headingVariants: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: 0.05, ease: easeCanva },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(2px)",
    transition: { duration: 0.22, ease: easeIn },
  },
};

// LỚP 3: Tên đơn vị phụ và đoạn mô tả thể lệ (delay: 0.12s, y: 12px -> 0px)
const subTextVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.12, ease: easeCanva },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: easeIn },
  },
};

// LỚP 4: Khối metadata thời gian & số lượng câu hỏi (delay: 0.18s, y: 10px -> 0px)
const metaVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.18, ease: easeCanva },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: easeIn },
  },
};

// Khối Hình ảnh bên phải: Fade-in 0.5s + Ken Burns vi mô scale 1.04 -> 1.0
const imageVariants: Variants = {
  initial: { opacity: 0, scale: 1.04 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: easeCanva },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: easeIn },
  },
};

// =========================================================================
// 2. MOCK DATA CHUẨN XÁC THEO HỆ THỐNG THỰC TẾ & HÌNH ẢNH MẪU
// =========================================================================
export interface ContestSliderItem {
  id: string;
  title: string;
  subTitle: string;
  desc: string;
  bannerUrl: string;
  slug: string;
  badgeText: string;
  duration?: number;
  qCount?: number;
  tagline?: string;
}

export const MOCK_CONTEST_SLIDES: ContestSliderItem[] = [
  {
    id: "slide-hoi-nong-dan-ea-sup",
    title: "CUỘC THI TÌM HIỂU NGHỊ QUYẾT HỘI NÔNG DÂN XÃ EA SÚP",
    subTitle: "ỦY BAN NHÂN DÂN XÃ EA SÚP",
    desc: "Mỗi thí sinh được tham gia tối đa 3 lượt để tìm hiểu, bằng cách trắc nghiệm.",
    bannerUrl: "/banners/banner-nong-dan-ea-sup.jpg",
    slug: "cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup",
    badgeText: "ĐƠN VỊ: ỦY BAN NHÂN DÂN XÃ EA SÚP",
    duration: 15,
    qCount: 10,
    tagline: "VINH DANH & TRAO THƯỞNG",
  },
  {
    id: "slide-phu-nu-ea-sup",
    title: "CUỘC THI TÌM HIỂU NGHỊ QUYẾT, PHÁP LUẬT PHỤ NỮ",
    subTitle: "HỘI LIÊN HIỆP PHỤ NỮ XÃ EA SÚP",
    desc: "Mỗi thí sinh được tham gia tối đa 3 lượt để tìm hiểu, bằng cách trắc nghiệm trực tuyến.",
    bannerUrl: "/images/contest_stage_banner.jpg",
    slug: "cuoc-thi-tim-hieu-nghi-quyet-phap-luat-phu-nu",
    badgeText: "ĐƠN VỊ: HỘI PHỤ NỮ EA SÚP",
    duration: 30,
    qCount: 30,
    tagline: "VINH DANH & TRAO THƯỞNG",
  },
  {
    id: "slide-thanh-nien-ea-sup",
    title: "CUỘC THI TRẮC NGHIỆM TRỰC TUYẾN NGHỊ QUYẾT ĐẠI HỘI ĐOÀN & MTTQ",
    subTitle: "ĐOÀN TNCS HỒ CHÍ MINH XÃ EA SÚP",
    desc: "Tuổi trẻ Ea Súp khát vọng, bản lĩnh, tiên phong chuyển đổi số và phát triển cộng đồng.",
    bannerUrl: "/banner-easup.png",
    slug: "cuoc-thi-nghi-quyet-doan-mttq-ea-sup",
    badgeText: "ĐƠN VỊ: ĐOÀN THANH NIÊN EA SÚP",
    duration: 20,
    qCount: 20,
    tagline: "TIÊN PHONG CHUYỂN ĐỔI SỐ",
  },
  {
    id: "slide-ubnd-phap-luat",
    title: "CUỘC THI TRỰC TUYẾN TÌM HIỂU PHÁP LUẬT VÀ CẢI CÁCH HÀNH CHÍNH",
    subTitle: "ỦY BAN NHÂN DÂN XÃ EA SÚP",
    desc: "Nâng cao ý thức thượng tôn pháp luật và tinh thần phục vụ nhân dân tại 20 thôn buôn.",
    bannerUrl: "/banners/cuocthi-phapluat-2026.jpg",
    slug: "tim-hieu-phap-luat-ea-sup-2026",
    badgeText: "ĐƠN VỊ: ỦY BAN NHÂN DÂN XÃ",
    duration: 20,
    qCount: 25,
    tagline: "CHÍNH QUYỀN SỐ THÂN THIỆN",
  },
  {
    id: "slide-dang-bo-ea-sup",
    title: "CUỘC THI TÌM HIỂU LỊCH SỬ ĐẢNG BỘ VÀ NGHỊ QUYẾT ĐẠI HỘI ĐẢNG",
    subTitle: "BAN TUYÊN GIÁO ĐẢNG ỦY XÃ EA SÚP",
    desc: "Phát huy truyền thống vẻ vang, nâng cao bản lĩnh chính trị và khối đại đoàn kết toàn dân.",
    bannerUrl: "/images/promo_thi_tructuyen.jpg",
    slug: "tim-hieu-lich-su-dang-bo-xa-ea-sup",
    badgeText: "ĐƠN VỊ: ĐẢNG BỘ XÃ EA SÚP",
    duration: 25,
    qCount: 30,
    tagline: "VỮNG BƯỚC DƯỚI CỜ ĐẢNG",
  },
  {
    id: "slide-mttq-ea-sup",
    title: "CUỘC THI TRỰC TUYẾN PHÁT HUY SỨC MẠNH KHỐI ĐẠI ĐOÀN KẾT TOÀN DÂN",
    subTitle: "ỦY BAN MẶT TRẬN TỔ QUỐC VIỆT NAM XÃ EA SÚP",
    desc: "Thắt chặt tình đoàn kết giữa các dân tộc, tôn giáo cùng xây dựng Ea Súp giàu đẹp, văn minh.",
    bannerUrl: "/images/graduation_students_banner.jpg",
    slug: "khoi-dai-doan-ket-toan-dan-toc-ea-sup",
    badgeText: "ĐƠN VỊ: ỦY BAN MTTQ VIỆT NAM",
    duration: 15,
    qCount: 20,
    tagline: "ĐẠI ĐOÀN KẾT DÂN TỘC",
  },
];

// =========================================================================
// 3. COMPONENT CHÍNH: ContestHeroSlider
// =========================================================================
export interface ContestHeroSliderProps {
  contests?: Array<{
    id: string;
    title: string;
    slug: string;
    bannerUrl?: string;
    organizerName?: string;
    shortDesc?: string;
    durationMinutes?: number;
    questionCount?: number;
  }>;
  autoPlayInterval?: number; // Mặc định 5000ms (5 giây)
}

export default function ContestHeroSlider({
  contests,
  autoPlayInterval = 5000,
}: ContestHeroSliderProps) {
  // Gộp danh sách cuộc thi thực tế với mock data để đảm bảo trải nghiệm phong phú
  const slides = useMemo<ContestSliderItem[]>(() => {
    if (contests && contests.length > 0) {
      const fromProps: ContestSliderItem[] = contests.map((c, idx) => ({
        id: c.id || `contest-${idx}`,
        title: c.title,
        subTitle: (c.organizerName || "ỦY BAN NHÂN DÂN XÃ EA SÚP").toUpperCase(),
        desc:
          c.shortDesc ||
          "Mỗi thí sinh được tham gia tối đa 3 lượt để tìm hiểu, bằng cách trắc nghiệm.",
        bannerUrl:
          c.bannerUrl ||
          (idx % 2 === 0
            ? "/banners/banner-nong-dan-ea-sup.jpg"
            : "/banners/cuocthi-phapluat-2026.jpg"),
        slug: c.slug,
        badgeText: c.organizerName
          ? `ĐƠN VỊ: ${c.organizerName.toUpperCase()}`
          : "ĐƠN VỊ: ỦY BAN NHÂN DÂN XÃ EA SÚP",
        duration: c.durationMinutes || 15,
        qCount: c.questionCount || 10,
        tagline: "VINH DANH & TRAO THƯỞNG",
      }));

      // Nếu ít hơn 3, kết hợp thêm từ mock slides mẫu
      if (fromProps.length < 3) {
        return [...fromProps, ...MOCK_CONTEST_SLIDES.slice(fromProps.length)];
      }
      return fromProps;
    }
    return MOCK_CONTEST_SLIDES;
  }, [contests]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 -> 100%

  // Điều hướng Next / Prev
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const handleSelect = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setProgress(0);
  };

  // Quản lý Timer và Thanh tiến trình vi mô (Pause on hover/touch)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const stepMs = 50;
    const increment = (stepMs / autoPlayInterval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [isPaused, slides.length, autoPlayInterval, handleNext]);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="lg:col-span-7 bg-[#0b2545] text-white rounded-3xl border border-sky-600/30 p-5 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-2xl select-none group/slider"
      style={{
        transform: "translate3d(0, 0, 0)",
        willChange: "transform, opacity",
      }}
    >
      {/* Dynamic Ambient Background Glow (Hiệu ứng ánh sáng nền mờ điện ảnh Apple-style) */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700" />
      <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Slide Content: AnimatePresence mode="wait" để đổi chữ & ảnh mượt mà */}
      <div className="relative z-10 min-h-[195px] flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center w-full">
          {/* CỘT TRÁI: STAGGERED CASCADING ANIMATION (CANVA STYLE) */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`slide-content-${currentSlide.id}-${currentIndex}`}
                className="space-y-2.5"
                style={{ willChange: "transform, opacity, filter" }}
              >
                {/* LỚP 1: Badge đơn vị & Số thứ tự trang (Delay: 0s) */}
                <motion.div
                  variants={badgeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex items-center gap-2"
                >
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#143862]/80 text-amber-300 border border-sky-400/25 shadow-xs backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[210px] sm:max-w-[260px]">
                      {currentSlide.badgeText}
                    </span>
                  </div>

                  {slides.length > 1 && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-sky-200/90 bg-[#143862]/80 border border-sky-400/25 px-2.5 py-1 rounded-full backdrop-blur-md">
                      {currentIndex + 1}/{slides.length}
                    </span>
                  )}
                </motion.div>

                {/* LỚP 2: Tiêu đề cuộc thi (Delay: 0.05s, Easing Canva, blur(4px) -> blur(0px)) */}
                <motion.h3
                  variants={headingVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-lg sm:text-xl md:text-[22px] lg:text-[23px] font-black text-white tracking-tight uppercase leading-snug line-clamp-2 min-h-[54px] flex items-center drop-shadow-sm"
                >
                  {currentSlide.title}
                </motion.h3>

                {/* LỚP 3: Tên đơn vị phụ và mô tả thể lệ (Delay: 0.12s, y: 12px -> 0px) */}
                <motion.div
                  variants={subTextVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-1.5"
                >
                  <div className="text-[11px] sm:text-xs font-bold text-sky-200/95 uppercase tracking-wider truncate">
                    {currentSlide.subTitle}
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-200/90 leading-relaxed line-clamp-2">
                    {currentSlide.desc}
                  </p>
                </motion.div>

                {/* LỚP 4: Khối metadata thời gian & số câu hỏi (Delay: 0.18s) */}
                {Boolean(currentSlide.duration || currentSlide.qCount) && (
                  <motion.div
                    variants={metaVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex items-center gap-4 text-xs sm:text-[13px] text-sky-200/90 pt-1"
                  >
                    {currentSlide.duration && (
                      <span className="flex items-center font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400 shrink-0" />
                        <span>{currentSlide.duration} phút</span>
                      </span>
                    )}
                    {currentSlide.qCount && (
                      <span className="flex items-center font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
                        <span>{currentSlide.qCount} câu hỏi</span>
                      </span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CỘT PHẢI: KHỐI HÌNH ẢNH (KEN BURNS VI MÔ SCALE 1.04 -> 1.0) */}
          <div className="md:col-span-5 flex justify-center">
            <Link
              href={`/thi/${currentSlide.slug}`}
              className="relative w-full max-w-[320px] md:max-w-none block rounded-2xl overflow-hidden border border-white/20 shadow-2xl group/img"
              style={{
                transform: "translate3d(0, 0, 0)",
                willChange: "transform, opacity",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`slide-img-${currentSlide.id}-${currentIndex}`}
                  variants={imageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="relative aspect-[16/10] sm:aspect-[16/9.5] w-full overflow-hidden bg-slate-900"
                >
                  <img
                    src={currentSlide.bannerUrl}
                    alt={currentSlide.title}
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover/img:scale-105"
                    onError={(e: any) => {
                      e.currentTarget.src = "/banner-easup.png";
                    }}
                  />
                  {/* Dải băng vinh danh dưới chân ảnh chuẩn nhận diện */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-4 pb-2 px-3 text-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5 drop-shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{currentSlide.tagline || "VINH DANH & TRAO THƯỞNG"}</span>
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG DƯỚI: NÚT CTA, PREV/NEXT & PAGINATION PILL */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-sky-800/60">
        {/* Nút Đỏ "THAM GIA DỰ THI NGAY" + Mũi tên điều hướng */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/thi/${currentSlide.slug}`}
            className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-md hover:shadow-red-600/30 active:scale-95 group/btn"
          >
            <span>THAM GIA DỰ THI NGAY</span>
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </motion.span>
          </Link>

          {/* 2 Nút Mũi Tên Tròn Mờ (Prev / Next) */}
          {slides.length > 1 && (
            <div className="flex items-center space-x-1.5 pl-1">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handlePrev}
                title="Cuộc thi trước"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handleNext}
                title="Cuộc thi tiếp theo"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* PHÂN TRANG: VIÊN THUỐC VÀNG ACTIVE PILL (LAYOUTID) + TIẾN TRÌNH THỜI GIAN */}
        <div className="flex items-center gap-3 sm:gap-5">
          {slides.length > 1 && (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {slides.map((_, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={`dot-container-${idx}`}
                    onClick={() => handleSelect(idx)}
                    className="relative flex items-center justify-center cursor-pointer p-0.5"
                  >
                    {isActive ? (
                      /* Viên thuốc vàng lướt mượt mà nhờ layoutId="activePill" của Framer Motion */
                      <motion.div
                        layoutId="activePill"
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 30,
                        }}
                        className="relative h-2.5 w-7 sm:w-8 rounded-full bg-amber-400 overflow-hidden shadow-xs"
                      >
                        {/* Thanh tiến trình vi mô chạy từ 0 -> 100% bên trong viên thuốc */}
                        <div
                          className="absolute inset-y-0 left-0 bg-amber-100/90 rounded-full transition-all ease-linear"
                          style={{
                            width: `${progress}%`,
                            transitionDuration: "50ms",
                          }}
                        />
                      </motion.div>
                    ) : (
                      /* Chấm tròn mờ không active */
                      <motion.div
                        whileHover={{ scale: 1.25 }}
                        className="w-2.5 h-2.5 rounded-full bg-white/30 hover:bg-white/60 transition-colors"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Dấu chấm tròn phân cách nhẹ */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/25 hidden sm:block" />

          {/* Dòng chữ nhận diện chân trang */}
          <div className="text-xs sm:text-[13px] text-sky-200 hidden sm:block tracking-wide">
            WEBSITE:{" "}
            <strong className="text-white font-mono font-bold text-xs sm:text-sm">
              cuocthi.easupso.com
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
