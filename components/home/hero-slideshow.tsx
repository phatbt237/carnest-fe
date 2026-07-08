"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface HeroSlideshowProps {
  images: string[];
}

export function HeroSlideshow({ images }: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(images.map((_, i) => i === 0));

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!images.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Images */}
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            className="object-cover object-center scale-105"
            sizes="100vw"
            onLoad={() =>
              setLoaded((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              })
            }
          />
        </div>
      ))}

      {/* Gradient overlays — keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-carnest-navy/92 via-carnest-navy/70 to-carnest-navy/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-carnest-navy/80 via-transparent to-carnest-navy/40" />

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-1.5 bg-carnest-gold"
                  : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Ảnh ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
