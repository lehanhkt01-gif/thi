"use client";

import React from "react";
import ContestHeroSlider, {
  ContestSliderItem,
  MOCK_CONTEST_SLIDES,
} from "./ContestHeroSlider";

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

/**
 * HeroContestCarousel (Bản nâng cấp Canva & Apple Motion Design)
 * Tích hợp Framer Motion, Staggered Cascading Animation, Ken Burns Effect
 * và Active Pill Pagination (layoutId).
 */
export default function HeroContestCarousel({ contests }: HeroContestCarouselProps) {
  return <ContestHeroSlider contests={contests} />;
}

export { ContestHeroSlider, MOCK_CONTEST_SLIDES };
export type { ContestSliderItem };
