import React from "react";
import { Crown } from "lucide-react";

export default function PremiumBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md ${className}`}>
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
}