import React from "react";
import { ThemeProvider } from "next-themes";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  Wallet, 
  Settings,
  ChevronRight,
  Sparkles,
  Crown,
  PiggyBank,
  Users,
  BarChart2,
  Lock,
  LogIn
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/lib/PremiumContext";
import { useAuth } from "@/lib/AuthContext";
import NotificationCenter from "@/components/NotificationCenter";
import NotificationGenerator from "@/components/NotificationGenerator";
import BottomTabBar from "@/components/BottomTabBar";
import { Toaster } from "@/components/ui/sonner";
import DevResetUser from "@/components/DevResetUser";

const FREE_NAV = [
  { name: "Home", page: "Home", icon: LayoutDashboard },
  { name: "Movimentações", page: "Movements", icon: Wallet },
  { name: "Planejamento", page: "NewPlanning", icon: Sparkles },
];

const PREMIUM_NAV = [
  { name: "Caixinha", page: "EmergencyFund", icon: PiggyBank },
  { name: "Modo Casal", page: "FamilyMode", icon: Users },
  { name: "Análise", page: "Analysis", icon: BarChart2 },
];

const BOTTOM_NAV = [
  { name: "Perfil", page: "NewProfile", icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const { isPremium, isPartner } = usePremium();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5FBDBD] border border-[#5FBDBD]/30 rounded-full px-3 py-1.5 hover:bg-[#5FBDBD]/10 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </button>
          )}
          <NotificationCenter />
        </div>
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
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {/* Free items */}
            <div className="space-y-1">
              {FREE_NAV.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-lg shadow-[#5FBDBD]/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
            </div>

            {/* Divider + Premium section */}
            <div className="my-4">
              <div className="flex items-center gap-2 px-2 mb-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Premium</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1">
                {PREMIUM_NAV.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  // FamilyMode tem sua própria tela de promoção — nunca bloquear na sidebar
                  const locked = !isPremium && !isPartner && item.page !== "FamilyMode";
                  return locked ? (
                    <button
                      key={item.page}
                      onClick={() => navigate(createPageUrl("Upgrade"))}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground/50 hover:bg-accent/50 hover:text-muted-foreground group"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium flex-1 text-left">{item.name}</span>
                      <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        PRO
                      </span>
                    </button>
                  ) : (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-lg shadow-[#5FBDBD]/20'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Profile at bottom of nav */}
            <div className="mt-2 space-y-1">
              {BOTTOM_NAV.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white shadow-lg shadow-[#5FBDBD]/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            {!isAuthenticated && (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#5FBDBD]/10 text-[#5FBDBD] border border-[#5FBDBD]/20 text-sm font-semibold hover:bg-[#5FBDBD]/20 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Entrar / Criar conta
              </button>
            )}
            <DevResetUser />
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