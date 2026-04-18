"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

function GalleryImage({ src, alt, fill = true }: { src: string; alt: string; fill?: boolean }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <Car className="h-10 w-10 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 50vw"
      priority
      onError={() => setError(true)}
    />
  );
}

export function ProductGallery({ images = [], name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const validImages = images.length > 0 ? images : [""];

  const prev = () =>
    setSelectedIndex((i) => (i - 1 + validImages.length) % validImages.length);
  const next = () =>
    setSelectedIndex((i) => (i + 1) % validImages.length);

  return (
    <div className="space-y-2.5">
      {/* Main image — 4:3 ratio, capped at 380px tall */}
      <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 group"
           style={{ aspectRatio: "4/3", maxHeight: "380px" }}>
        <GalleryImage
          src={validImages[selectedIndex]}
          alt={`${name} - ảnh ${selectedIndex + 1}`}
        />

        {validImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {validImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === selectedIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  )}
                />
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
                i === selectedIndex
                  ? "border-carnest-blue"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <ThumbnailImage src={img} alt={`${name} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThumbnailImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error || !src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <Car className="h-4 w-4 text-gray-300" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="56px"
      onError={() => setError(true)}
    />
  );
}
