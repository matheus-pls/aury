import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Wallet, Sparkles, Target, Settings } from "lucide-react";

const TABS = [
  { name: "Início",   page: "Overview",  icon: LayoutDashboard },
  { name: "Gastos",   page: "Movements", icon: Wallet },
  { name: "Planejar", page: "Planning",  icon: Sparkles },
  { name: "Metas",    page: "Goals",     icon: Target },
  { name: "Config",   page: "Settings",  icon: Settings },
];

export default function BottomTabBar({ currentPageName }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16">
        {TABS.map((tab) => {
          const isActive = currentPageName === tab.page;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all select-none ${
                isActive ? "text-[#5FBDBD]" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#5FBDBD] rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}