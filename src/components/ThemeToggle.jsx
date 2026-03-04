import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("aury-theme") === "dark";
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("aury-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("aury-theme", "light");
    }
  }, [isDark]);

  return { isDark, setIsDark };
}

export default function ThemeToggle() {
  const { isDark, setIsDark } = useTheme();

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex items-center gap-3 w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-all group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br ${isDark ? "from-indigo-500 to-violet-600" : "from-amber-400 to-orange-500"}`}>
        {isDark ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
      </div>
      <div className="text-left flex-1">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{isDark ? "Modo Escuro" : "Modo Claro"}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{isDark ? "Clique para ativar o modo claro" : "Clique para ativar o modo escuro"}</p>
      </div>
      {/* Toggle visual */}
      <div className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? "bg-indigo-500" : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}