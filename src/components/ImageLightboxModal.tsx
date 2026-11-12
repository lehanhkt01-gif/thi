"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
} from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  authorName?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({
  isOpen,
  images,
  initialIndex = 0,
  title,
  authorName,
  onClose,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Đồng bộ index khi mở modal hoặc initialIndex thay đổi
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Khóa cuộn trang nền khi mở lightbox
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.4, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.4, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    handleResetZoom();
  }, [images.length, handleResetZoom]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    handleResetZoom();
  }, [images.length, handleResetZoom]);

  // Phím tắt bàn phím
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Double click để phóng to / thu nhỏ
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  };

  // Kéo di chuyển ảnh khi đang phóng to (Pan/Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cuộn chuột để phóng to / thu nhỏ
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* HEADER: Tiêu đề, thông tin tác giả & các nút công cụ phóng to / đóng */}
      <div
        className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between text-white bg-black/40 backdrop-blur-xs z-20 border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 pr-4">
          <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
            {title || "Xem ảnh tác phẩm"}
          </h3>
          {authorName && (
            <span className="text-xs text-white/70 truncate">Tác giả: {authorName}</span>
          )}
        </div>

        {/* Thanh công cụ phóng to / thu nhỏ / reset */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <div className="hidden sm:flex items-center bg-white/10 rounded-full p-1 space-x-1 border border-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-40 transition-colors text-white cursor-pointer"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-white/90 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-40 transition-colors text-white cursor-pointer"
              title="Phóng to (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              title="Đặt lại kích thước (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <a
            href={currentImage}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="Mở ảnh gốc trong tab mới"
          >
            <Maximize2 className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-red-600/80 hover:bg-red-600 transition-colors text-white cursor-pointer ml-1"
            title="Đóng xem ảnh (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* BODY: Khung chứa ảnh hiển thị trung tâm với zoom & pan */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-6 cursor-zoom-out"
        onClick={onClose}
      >
        {/* Nút chuyển ảnh Trước / Sau nếu có nhiều ảnh */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 sm:left-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg border border-white/20"
              title="Ảnh trước (Mũi tên trái)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 sm:right-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg border border-white/20"
              title="Ảnh kế tiếp (Mũi tên phải)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Khung hiển thị hình ảnh phóng to */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={currentImage}
            alt={title || "Ảnh phóng to"}
            draggable={false}
            className="max-h-[80vh] sm:max-h-[85vh] max-w-[95vw] w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
          />
        </div>
      </div>

      {/* FOOTER: Dải thumbnail chuyển ảnh + Gợi ý thao tác */}
      <div
        className="w-full px-4 py-3 bg-black/50 backdrop-blur-xs text-center z-20 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 ? (
          <div className="flex items-center justify-center space-x-2 overflow-x-auto max-w-xl mx-auto py-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  handleResetZoom();
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "border-emerald-500 scale-105 shadow-md opacity-100"
                    : "border-white/30 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-xs font-medium">
            Cuộn chuột hoặc nhấp đúp để phóng to • Kéo để di chuyển • Bấm [X] hoặc phím Esc để đóng
          </div>
        )}
      </div>
    </div>
  );
}

