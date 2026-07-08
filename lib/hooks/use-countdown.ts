"use client";

import { useEffect, useState } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDate: string | null): CountdownResult {
  const calculate = (): CountdownResult => {
    if (!targetDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: "00:00:00" };
    }

    const diff = new Date(targetDate).getTime() - Date.now();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: "00:00:00" };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted =
      days > 0
        ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return { days, hours, minutes, seconds, isExpired: false, formatted };
  };

  const [state, setState] = useState<CountdownResult>({
    days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, formatted: "00:00:00",
  });

  useEffect(() => {
    setState(calculate());
    const timer = setInterval(() => setState(calculate()), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  return state;
}
