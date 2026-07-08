"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  // Detect link clicks AND intercept router.push via history.pushState
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      // Same page — no progress bar
      const currentPath = window.location.pathname + window.location.search;
      if (href === currentPath) return;
      startProgress();
    };

    // Intercept history.pushState so router.push() also triggers the bar
    const origPush = history.pushState.bind(history);
    history.pushState = function (...args) {
      origPush(...args);
      // Only show bar for actual navigation (not hash-only changes)
      const newUrl = String(args[2] ?? "");
      if (newUrl && !newUrl.startsWith("#")) {
        startProgress();
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      history.pushState = origPush;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route change complete → finish bar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { completeProgress(); }, [pathname, searchParams]);

  const startProgress = () => {
    if (activeRef.current) return; // already running
    activeRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setVisible(true);
    setWidth(8);
    let w = 8;
    const grow = () => {
      const increment = w < 30 ? 6 : w < 60 ? 2.5 : w < 80 ? 0.8 : 0.2;
      w = Math.min(w + increment, 90);
      setWidth(w);
      if (w < 90) rafRef.current = requestAnimationFrame(grow);
    };
    timerRef.current = setTimeout(() => { rafRef.current = requestAnimationFrame(grow); }, 40);
  };

  const completeProgress = () => {
    activeRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-carnest-gold transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(201,168,76,0.6)]"
      style={{ width: `${width}%` }}
    />
  );
}
