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
  ChevronRight,
  Sparkles,
  TrendingUp,
  Heart,
  Lock
} from "lucide-react";
import NotificationCenter from "@/components/NotificationCenter";
import NotificationGenerator from "@/components/NotificationGenerator";
import BottomTabBar from "@/components/BottomTabBar";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children, currentPageName }) {
  const [navigation, setNavigation] = useState([
    { name: "Home", page: "Home", icon: LayoutDashboard },
    { name: "Movimentações", page: "Movements", icon: Wallet },
    { name: "Planejamento", page: "NewPlanning", icon: Sparkles },
    { name: "Perfil", page: "NewProfile", icon: Settings },
  ]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const isPremium = true;

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
      { name: "Home", page: "Home", icon: LayoutDashboard },
      { name: "Movimentações", page: "Movements", icon: Wallet },
      { name: "Planejamento", page: "NewPlanning", icon: Sparkles },
      { name: "Perfil", page: "NewProfile", icon: Settings },
    ];
    setNavigation(baseNav);
  }, [familyGroups.length, isPremium]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <NotificationGenerator />
      <style>{`
        .dark {
          --background: 220 15% 7%;
          --foreground: 0 0% 95%;
          --card: 220 13% 11%;
          --card-foreground: 0 0% 95%;
          --popover: 220 13% 11%;
          --popover-foreground: 0 0% 95%;
          --primary: 0 0% 95%;
          --primary-foreground: 0 0% 9%;
          --secondary: 220 10% 17%;
          --secondary-foreground: 0 0% 95%;
          --muted: 220 10% 17%;
          --muted-foreground: 0 0% 58%;
          --accent: 220 10% 20%;
          --accent-foreground: 0 0% 95%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 0 0% 98%;
          --border: 220 10% 20%;
          --input: 220 10% 17%;
          --ring: 180 40% 55%;
        }
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
      <header
        className="lg:hidden fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 flex items-end justify-between px-4 pb-2 shadow-sm"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          height: "calc(4rem + env(safe-area-inset-top))"
        }}
      >
        <div className="flex-1" />
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/9721f298e_aury_sem_fundo_1.png"
          alt="Aury"
          className="h-10 absolute left-1/2 -translate-x-1/2 bottom-2"
        />
        <NotificationCenter />
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full bg-background border-r border-border z-50 w-72">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-24 flex items-center justify-between px-6 border-b border-border">
            <div className="relative">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6935a6219ca262b0cf97d9fa/9721f298e_aury_sem_fundo_1.png"
                alt="Aury"
                className="h-24"
              />
              {isPremium && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
                  ✨ Premium
                </div>
              )}
            </div>
            <NotificationCenter />
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
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
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
          <div className="p-4 border-t border-border">
            <div className="bg-muted rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Você não precisa fazer isso sozinho</p>
              <p className="text-sm font-semibold text-foreground">Estou aqui com você</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="lg:pl-72 min-h-screen lg:pt-0 lg:pb-0"
        style={{
          paddingTop: "calc(4rem + env(safe-area-inset-top))",
          paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))"
        }}
      >
        <div className="p-4 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar - Mobile only */}
      <BottomTabBar currentPageName={currentPageName} />
    </div>
    </ThemeProvider>
  );
}