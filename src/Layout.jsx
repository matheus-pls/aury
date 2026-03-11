import React, { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Settings,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Heart,
  Lock
} from "lucide-react";
import NotificationCenter from "@/components/NotificationCenter";
import NotificationGenerator from "@/components/NotificationGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigation, setNavigation] = useState([
    { name: "Visão Geral", page: "Overview", icon: LayoutDashboard },
    { name: "Planejamento", page: "Planning", icon: Sparkles },
    { name: "Movimentações", page: "Movements", icon: Wallet },
    { name: "Metas", page: "Goals", icon: Target },
    { name: "Análises", page: "BehaviorAnalysis", icon: TrendingUp },
    { name: "Configurações", page: "Settings", icon: Settings },
  ]);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const isPremium = true; // user?.is_premium || false;

  const { data: familyGroups = [] } = useQuery({
    queryKey: ['user-family-groups', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allGroups = await base44.entities.FamilyGroup.list();
      return allGroups.filter(g => 
        g.admin_email === user.email || g.members?.includes(user.email)
      );
    },
    enabled: !!user
  });

  useEffect(() => {
    const baseNav = [
      { name: "Visão Geral", page: "Overview", icon: LayoutDashboard },
      { name: "Planejamento", page: "Planning", icon: Sparkles, premium: true },
      { name: "Movimentações", page: "Movements", icon: Wallet },
      { name: "Metas", page: "Goals", icon: Target },
      { name: "Análises", page: "Analysis", icon: TrendingUp, premium: true },
    ];

    if (isPremium) {
      baseNav.push({ name: "Modo Casal", page: "FamilyMode", icon: Heart, premium: true });
    }

    baseNav.push({ name: "Configurações", page: "Settings", icon: Settings });

    setNavigation(baseNav);
  }, [familyGroups.length, isPremium]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <NotificationGenerator />
      <style>{`
        :root {
          --aury-teal: #5FBDBD;
          --aury-teal-dark: #4FA9A5;
          --aury-teal-light: #7FCFCF;
          --aury-navy: #1B3A52;
          --aury-navy-light: #2A4A62;
          --aury-navy-deep: #0A2540;
          --aury-gradient-start: #5FBDBD;
          --aury-gradient-end: #1B3A52;
        }
        .bg-aury-teal { background-color: var(--aury-teal); }
        .bg-aury-navy { background-color: var(--aury-navy); }
        .text-aury-teal { color: var(--aury-teal); }
        .text-aury-navy { color: var(--aury-navy); }
        .border-aury-teal { border-color: var(--aury-teal); }
        .hover\\:bg-aury-teal:hover { background-color: var(--aury-teal); }
        .from-aury-teal { --tw-gradient-from: var(--aury-teal); }
        .to-aury-navy { --tw-gradient-to: var(--aury-navy); }
        .shadow-aury { box-shadow: 0 10px 30px -10px rgba(95, 189, 189, 0.3); }
        .shadow-aury-lg { box-shadow: 0 20px 50px -15px rgba(95, 189, 189, 0.4); }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-accent transition-colors"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
            alt="Aury" 
            className="h-8"
          />
        </div>
        <NotificationCenter />
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-background border-r border-border z-50
        transition-transform duration-300 ease-out
        w-72 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-border">
            <div className="relative">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
                alt="Aury" 
                className="h-10"
              />
              {isPremium && (
                <div className="absolute -top-1.5 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
                  ✨ Premium
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:block">
                <NotificationCenter />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
                >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              const isLocked = item.premium && !isPremium;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                    ${isActive 
                      ? 'bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-lg shadow-[#5FBDBD]/20' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#1B3A52]'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-medium">{item.name}</span>
                  {isLocked && (
                    <span className="ml-auto">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  )}
                  {isActive && !isLocked && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Você não precisa fazer isso sozinho</p>
              <p className="text-sm font-semibold text-[#1B3A52]">Estou aqui com você</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
    </ThemeProvider>
  );
}