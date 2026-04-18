"use client";

import { Lock } from "lucide-react";
import type { BadgeTier, UserBadge } from "@/types";

const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; border: string }> = {
  BRONZE: {
    bg: "bg-[#CD7F32]/10",
    text: "text-[#CD7F32]",
    border: "border-[#CD7F32]/40",
  },
  SILVER: {
    bg: "bg-[#C0C0C0]/10",
    text: "text-[#C0C0C0]",
    border: "border-[#C0C0C0]/40",
  },
  GOLD: {
    bg: "bg-[#FFD700]/10",
    text: "text-[#FFD700]",
    border: "border-[#FFD700]/40",
  },
  PLATINUM: {
    bg: "bg-[#E5E4E2]/10",
    text: "text-[#E5E4E2]",
    border: "border-[#E5E4E2]/40",
  },
  DIAMOND: {
    bg: "bg-[#B9F2FF]/10",
    text: "text-[#B9F2FF]",
    border: "border-[#B9F2FF]/40",
  },
};

const TIER_LABELS: Record<BadgeTier, string> = {
  BRONZE: "Đồng",
  SILVER: "Bạc",
  GOLD: "Vàng",
  PLATINUM: "Bạch kim",
  DIAMOND: "Kim cương",
};

interface BadgeCardProps {
  badge: UserBadge;
  locked?: boolean;
}

function BadgeCard({ badge, locked }: BadgeCardProps) {
  const colors = TIER_COLORS[badge.tier];
  return (
    <div
      className={`relative group rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${
        locked
          ? "opacity-40 grayscale border-gray-200 bg-gray-50"
          : `${colors.bg} ${colors.border} hover:shadow-md`
      }`}
    >
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
      )}

      {badge.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badge.iconUrl}
          alt={badge.name}
          className={`h-12 w-12 object-contain ${locked ? "" : ""}`}
        />
      ) : (
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl font-bold border ${colors.bg} ${colors.border}`}
        >
          🏅
        </div>
      )}

      <div className="text-center">
        <p className={`text-xs font-semibold ${locked ? "text-gray-400" : colors.text}`}>
          {badge.name}
        </p>
        <p className={`text-[10px] mt-0.5 ${locked ? "text-gray-300" : "text-gray-500"}`}>
          {TIER_LABELS[badge.tier]}
        </p>
      </div>

      {/* Tooltip on hover */}
      {!locked && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-gray-900 text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
          <p className="font-semibold mb-0.5">{badge.name}</p>
          <p className="text-gray-300 leading-relaxed">{badge.description}</p>
          {badge.earnedAt && (
            <p className="text-gray-400 mt-1 text-[10px]">
              Đạt được: {new Date(badge.earnedAt).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface BadgeDisplayProps {
  badges: UserBadge[];
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-sm">Chưa có huy hiệu nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
