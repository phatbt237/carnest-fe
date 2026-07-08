"use client";

import { useState } from "react";
import Image from "next/image";

export function WantlistImageThumb({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className: string;
  sizes: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative shrink-0 overflow-hidden hover:opacity-90 transition-opacity ${className}`}
      >
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
