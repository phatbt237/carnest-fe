"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Lên đầu trang"
      className={cn(
        "fixed right-4 z-50 flex items-center justify-center",
        "h-10 w-10 rounded-full bg-gray-900 text-white shadow-lg",
        "transition-all duration-300 hover:bg-gray-700 active:scale-95",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        "bottom-20 md:bottom-6"
      )}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
