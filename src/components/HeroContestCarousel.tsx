"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  CheckCircle2,
} from "lucide-react";

export interface CarouselContestItem {
  id: string;
  title: string;
  slug: string;
  bannerUrl?: string;
  organizerName?: string;
  shortDesc?: string;
  durationMinutes?: number;
  questionCount?: number;
  status?: string;
}

interface HeroContestCarouselProps {
  contests: CarouselContestItem[];
}

export default function HeroContestCarousel({ contests }: HeroContestCarouselProps) {
  // Build slide items from contests with fallback to default promotional slide
  const slides = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subTitle: string;
      desc: string;
      bannerUrl: string;
      slug: string;
      badgeText: string;
      duration?: number;
      qCount?: number;
    }> = [];

    // Add all created contests with banners (mỗi cuộc thi sử dụng banner riêng của cuộc thi đó)
    if (contests && contests.length > 0) {
      contests.forEach((c) => {
        list.push({
          id: c.id,
          title: c.title,
          subTitle: (c.organizerName || "HỆ THỐNG THI TRỰC TUYẾN").toUpperCase(),
          desc:
            c.shortDesc ||
            "Hệ thống thi trắc nghiệm trực tuyến thông minh, bảo mật cao và đánh giá kết quả tức thì.",
          bannerUrl: c.bannerUrl || "/banner-easup.png",
          slug: c.slug,
          badgeText: c.organizerName ? `ĐƠN VỊ: ${c.organizerName.toUpperCase()}` : "THI.EASUPSO.COM",
          duration: c.durationMinutes || 15,
          qCount: c.questionCount || 10,
        });
      });
    }

    // Luôn có banner chính thức Cuộc thi trực tuyến Xã Ea Súp (Ảnh 2)
    list.unshift({
      id: "slide-chinh-thuc-ea-sup",
      title: "CUỘC THI TRỰC TUYẾN XÃ EA SÚP",
      subTitle: "TRI THỨC - KẾT NỐI - LAN TỎA - VÌ MỘT EA SÚP PHÁT TRIỂN",
      desc: "Cổng tổ chức và thi trắc nghiệm trực tuyến chính thức phục vụ cán bộ, hội viên và nhân dân 20 thôn, buôn xã Ea Súp.",
      bannerUrl: "/banner-easup.png",
      slug: contests?.[0]?.slug || "cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup",
      badgeText: "THI.EASUPSO.COM",
    });

    return list;
  }, [contests]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto rotate banner every 4.5 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, slides.length]);

  const handleNextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="lg:col-span-7 bg-gradient-to-br from-[#0F2847] via-[#0A4378] to-[#032952] text-white rounded-2xl border border-sky-600/40 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-xs select-none group/carousel"
    >
      {/* Dynamic ambient background glow */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-sky-400/15 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
      <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Slide Content with smooth transition */}
      <div className="relative z-10 transition-opacity duration-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center min-h-[170px]">
          {/* Text Info */}
          <div className="md:col-span-7 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="truncate max-w-[200px]">{currentSlide.badgeText}</span>
              </div>

              {slides.length > 1 && (
                <span className="text-[10px] font-bold text-sky-200/80 bg-white/10 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} / {slides.length}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase leading-tight line-clamp-2 min-h-[50px] flex items-center">
              {currentSlide.title}
            </h3>

            <div className="text-[11px] font-bold text-sky-200 uppercase tracking-wider truncate">
              {currentSlide.subTitle}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">
              {currentSlide.desc}
            </p>

            {currentSlide.duration && (
              <div className="flex items-center gap-3 text-[11px] text-sky-200/90 pt-1">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-amber-400" />
                  {currentSlide.duration} phút
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  {currentSlide.qCount} câu hỏi
                </span>
              </div>
            )}
          </div>

          {/* Banner Image with subtle zoom on hover */}
          <div className="md:col-span-5">
            <Link
              href={`/thi/${currentSlide.slug}`}
              className="relative block rounded-xl overflow-hidden border-2 border-white/20 shadow-lg group/img"
            >
              <img
                key={currentSlide.bannerUrl}
                src={currentSlide.bannerUrl}
                alt={currentSlide.title}
                className="w-full h-36 sm:h-40 object-cover object-center group-hover/img:scale-105 transition-transform duration-500 ease-out"
                onError={(e: any) => {
                  e.currentTarget.src = "/images/graduation_students_banner.jpg";
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2 text-center">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-300" />
                  Vinh Danh &amp; Trao Thưởng
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar + Slide Dots & Arrows */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-sky-800/80">
        <div className="flex items-center gap-2">
          <Link
            href={`/thi/${currentSlide.slug}`}
            className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-sm active:scale-95"
          >
            THAM GIA DỰ THI NGAY <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>

          {/* Prev/Next buttons */}
          {slides.length > 1 && (
            <div className="flex items-center space-x-1 pl-2">
              <button
                type="button"
                onClick={handlePrevSlide}
                title="Cuộc thi trước"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                title="Cuộc thi tiếp theo"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Dots & Website branding */}
        <div className="flex items-center gap-4">
          {slides.length > 1 && (
            <div className="flex items-center space-x-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-6 bg-amber-400 shadow-xs"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  title={`Chuyển đến banner ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <div className="text-xs text-sky-200 hidden sm:block">
            WEBSITE: <strong className="text-white font-mono text-sm">cuocthi.easupso.com</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
