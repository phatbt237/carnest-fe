"use client";

import { useCountdown } from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endTime: string;
  className?: string;
  compact?: boolean;
}

export function CountdownTimer({ endTime, className, compact }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endTime);

  if (isExpired) {
    return (
      <span className={cn("text-gray-400 font-medium", className)}>
        Đã kết thúc
      </span>
    );
  }

  if (compact) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      <span className={cn("font-mono font-bold", className)}>
        {days > 0 && `${days}d `}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const urgency =
    days === 0 && hours === 0 && minutes < 5;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {days > 0 && (
        <>
          <TimeUnit value={days} label="ngày" urgency={false} />
          <span className="text-gray-400 font-bold">:</span>
        </>
      )}
      <TimeUnit value={hours} label="giờ" urgency={urgency} />
      <span className={cn("font-bold", urgency ? "text-red-500" : "text-gray-400")}>:</span>
      <TimeUnit value={minutes} label="phút" urgency={urgency} />
      <span className={cn("font-bold", urgency ? "text-red-500" : "text-gray-400")}>:</span>
      <TimeUnit value={seconds} label="giây" urgency={urgency} />
    </div>
  );
}

function TimeUnit({ value, label, urgency }: { value: number; label: string; urgency: boolean }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div
      className={cn(
        "flex flex-col items-center min-w-[40px] rounded-md px-2 py-1",
        urgency ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-800"
      )}
    >
      <span className="text-lg font-bold font-mono leading-none">{pad(value)}</span>
      <span className="text-[9px] uppercase tracking-wide opacity-60">{label}</span>
    </div>
  );
}
