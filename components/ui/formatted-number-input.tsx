"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FormattedNumberInputProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function toDisplay(num: number | undefined): string {
  if (num === undefined || num === 0 || isNaN(num)) return "";
  return num.toLocaleString("de-DE");
}

export function FormattedNumberInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  className,
  disabled,
}: FormattedNumberInputProps) {
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\./g, "").replace(/\D/g, "");
    if (digits === "") {
      setDisplay("");
      onChange?.(0);
      return;
    }
    const num = parseInt(digits, 10);
    if (isNaN(num)) return;
    if (max !== undefined && num > max) return;
    setDisplay(num.toLocaleString("de-DE"));
    onChange?.(num);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}
