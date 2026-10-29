"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Radio, RefreshCw } from "lucide-react";
import { normalizeAdminText } from "@/utils/ttsNormalizer";

interface AudioPlayerAnNhienProps {
  text: string;
  label?: string;
  isCompact?: boolean;
}

export default function AudioPlayerAnNhien({
  text,
  label = "Giọng đọc An Nhiên",
  isCompact = false,
}: AudioPlayerAnNhienProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Dừng đọc khi component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Trình duyệt không hỗ trợ phát giọng đọc tự động.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Chuẩn hóa từ viết tắt hành chính trước khi đọc
    const cleanText = normalizeAdminText(text);

    window.speechSynthesis.cancel(); // Reset hàng đợi cũ
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    utterance.rate = speed;

    // Tìm giọng đọc tiếng Việt nếu có
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes("vi") || v.name.toLowerCase().includes("vietnam"));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsSynthesizing(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    synthRef.current = utterance;
    setIsSynthesizing(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setTimeout(() => {
        const cleanText = normalizeAdminText(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "vi-VN";
        utterance.rate = newSpeed;
        synthRef.current = utterance;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }, 100);
    }
  };

  if (isCompact) {
    return (
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all ${
          isPlaying
            ? "bg-red-600 text-white shadow-sm ring-2 ring-red-300"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
        title="Nghe giọng đọc An Nhiên đọc câu hỏi"
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 mr-1 animate-pulse" />
            <span>Đang đọc...</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 mr-1 text-[#DC2626]" />
            <span>Nghe câu hỏi</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center justify-center">
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-sm hover:shadow-md cursor-pointer ${
          isPlaying
            ? "bg-slate-900 hover:bg-slate-800"
            : "bg-[#DC2626] hover:bg-[#B91C1C]"
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-4 h-4 mr-1.5 fill-current" /> Tạm dừng đọc
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-1.5 fill-current" /> Nghe thể lệ
          </>
        )}
      </button>
    </div>
  );
}
