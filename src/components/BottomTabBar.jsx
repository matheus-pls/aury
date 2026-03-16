import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Wallet, Sparkles, Target, Heart, Settings } from "lucide-react";

const TABS = [
  { name: "Início",   page: "Overview",    icon: LayoutDashboard },
  { name: "Gastos",   page: "Movements",   icon: Wallet },
  { name: "Planejar", page: "Planning",    icon: Sparkles },
  { name: "Metas",    page: "Goals",       icon: Target },
  { name: "Casal",    page: "FamilyMode",  icon: Heart },
  { name: "Config",   page: "Settings",    icon: Settings },
];

export default function BottomTabBar({ currentPageName }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-[60]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 px-1">
        {TABS.map((tab) => {
          const isActive = currentPageName === tab.page;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all select-none rounded-lg mx-0.5 ${
                isActive
                  ? "text-[#5FBDBD]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#5FBDBD] rounded-full" />
              )}
              <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-[#5FBDBD]/10" : ""}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-medium leading-tight tracking-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}