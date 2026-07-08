"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Car, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images?: string[] | null;
  name: string;
}

// ─── Cloudinary URL optimizer ─────────────────────────────────────────────────
// Chèn transformation parameters vào giữa URL Cloudinary để resize + compress.
// Không ảnh hưởng đến URL từ nguồn khác.
function cdnUrl(url: string, transforms: string): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/${transforms}/`);
}

const cdn = {
  thumb: (url: string) => cdnUrl(url, "w_120,h_120,c_fill,q_auto,f_auto"),
  main:  (url: string) => cdnUrl(url, "w_900,q_auto,f_auto"),
  full:  (url: string) => cdnUrl(url, "w_1600,q_auto,f_auto"),
};

// ─── Placeholder ──────────────────────────────────────────────────────────────
function Placeholder({ size = "lg" }: { size?: "sm" | "lg" }) {
  const cls = size === "sm" ? "h-4 w-4" : "h-10 w-10";
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <Car className={cn(cls, "text-gray-300")} />
    </div>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumb({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error || !src) return <Placeholder size="sm" />;
  return (
    <Image
      src={cdn.thumb(src)}
      alt={alt}
      fill
      className="object-cover"
      sizes="56px"
      unoptimized
      onError={() => setError(true)}
    />
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  name,
  initialIndex,
  onClose,
}: {
  images: string[];
  name: string;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const pointerStartX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Preload ảnh liền kề trong lightbox để vuốt không giật
  useEffect(() => {
    const preload = (url: string) => { const img = new window.Image(); img.src = url; };
    const prevIdx = (index - 1 + images.length) % images.length;
    const nextIdx = (index + 1) % images.length;
    preload(cdn.full(images[prevIdx]));
    preload(cdn.full(images[nextIdx]));
  }, [index, images]);

  const handlePointerDown = (e: React.PointerEvent) => { pointerStartX.current = e.clientX; };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const delta = e.clientX - pointerStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    pointerStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/92" onClick={onClose}>
      <div
        className="relative w-full h-full flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Image area — padded away from edges + safe-area */}
        <div
          className="relative w-full h-full max-w-5xl mx-auto"
          style={{
            paddingLeft:  "max(24px, env(safe-area-inset-left))",
            paddingRight: "max(24px, env(safe-area-inset-right))",
            paddingTop:   "max(72px, calc(env(safe-area-inset-top) + 72px))",
            paddingBottom:"max(72px, calc(env(safe-area-inset-bottom) + 48px))",
          }}
        >
          <Image
            key={images[index]}
            src={cdn.full(images[index])}
            alt={`${name} - ảnh ${index + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
            unoptimized
          />
        </div>

        {/* Close button — larger + solid for mobile tap */}
        <button
          onClick={onClose}
          className="absolute z-20 flex items-center justify-center rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-sm transition-colors hover:bg-black/80 active:scale-95"
          style={{
            top: "max(16px, env(safe-area-inset-top, 16px))",
            right: "max(16px, env(safe-area-inset-right, 16px))",
            width: 44,
            height: 44,
          }}
        >
          <X className="h-6 w-6" />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              style={{ left: "max(8px, env(safe-area-inset-left, 8px))" }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              style={{ right: "max(8px, env(safe-area-inset-right, 8px))" }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          {images.length > 1 && (
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-1.5 bg-white/40")} />
              ))}
            </div>
          )}
          <span className="text-white/60 text-xs tabular-nums">{index + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Gallery ─────────────────────────────────────────────────────────────
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const validImages = (images ?? []).filter((u): u is string => !!u && typeof u === "string");
  const hasImages = validImages.length > 0;

  // Preload tất cả ảnh (kích thước main) ngay khi gallery mount
  // → chuyển ảnh gần như instant sau lần đầu load
  useEffect(() => {
    if (!hasImages) return;
    validImages.forEach((url) => {
      const img = new window.Image();
      img.src = cdn.main(url);
    });
  }, [validImages, hasImages]); // eslint-disable-line

  const prev = () => setSelectedIndex((i) => (i - 1 + validImages.length) % validImages.length);
  const next = () => setSelectedIndex((i) => (i + 1) % validImages.length);

  return (
    <>
      <div className="space-y-2.5">
        {/* Main image */}
        <div
          className="relative w-full rounded-xl overflow-hidden bg-gray-100 group aspect-[4/3] cursor-zoom-in"
          onClick={() => hasImages && setLightboxOpen(true)}
        >
          {hasImages ? (
            <>
              <Image
                key={validImages[selectedIndex]}
                src={cdn.main(validImages[selectedIndex])}
                alt={`${name} - ảnh ${selectedIndex + 1}`}
                fill
                className="object-contain transition-opacity duration-150"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                unoptimized
              />
              <span className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn className="h-3.5 w-3.5" />
              </span>
            </>
          ) : (
            <Placeholder />
          )}

          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1 pointer-events-none">
                {validImages.map((_, i) => (
                  <span key={i} className={cn("h-1.5 rounded-full transition-all", i === selectedIndex ? "w-4 bg-white" : "w-1.5 bg-white/60")} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {validImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "relative shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all",
                  i === selectedIndex ? "border-carnest-blue" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Thumb src={img} alt={`${name} thumbnail ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && hasImages && (
        <Lightbox
          images={validImages}
          name={name}
          initialIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
