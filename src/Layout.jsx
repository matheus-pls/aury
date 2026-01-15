import React, { useState, useEffect } from "react";
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
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./components/ThemeProvider";

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
      { name: "Planejamento", page: "Planning", icon: Sparkles },
      { name: "Movimentações", page: "Movements", icon: Wallet },
      { name: "Metas", page: "Goals", icon: Target },
      { name: "Análises", page: "Analysis", icon: TrendingUp },
    ];

    if (familyGroups.length > 0) {
      baseNav.push({ name: "Família", page: "FamilyMode", icon: Heart });
    }

    baseNav.push({ name: "Configurações", page: "Settings", icon: Settings });

    setNavigation(baseNav);
  }, [familyGroups]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <ThemeProvider>
    <div className="min-h-screen bg-aury">
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-aury-surface/95 backdrop-blur-sm border-b border-aury z-40 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-accent transition-colors"
        >
          <Menu className="w-6 h-6 text-aury" />
        </button>
        <div className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
            alt="Aury" 
            className="h-8"
          />
        </div>
        <div className="w-10" />
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
        fixed top-0 left-0 h-full bg-aury-surface border-r border-aury z-50
        transition-transform duration-300 ease-out
        w-72 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-aury">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/af2c17ea1_WhatsAppImage2026-01-04at153037.jpg" 
              alt="Aury" 
              className="h-10"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-aury-muted" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-[#4ECDC4] to-[#4ECDC4]/70 text-[#0D2B3E] shadow-lg shadow-[#4ECDC4]/20' 
                      : 'text-aury-muted hover:bg-accent hover:text-aury'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#0D2B3E]' : 'text-aury-muted'}`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-aury">
            <div className="bg-aury-primary/10 rounded-2xl p-4">
              <p className="text-xs text-aury-muted mb-1">Controle. Clareza. Confiança.</p>
              <p className="text-sm font-semibold text-aury">Seu aliado financeiro</p>
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