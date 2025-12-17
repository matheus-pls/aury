import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  Target, 
  Calculator, 
  Settings,
  Menu,
  X,
  ChevronRight,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { name: "Planejamento", page: "AutoPlanning", icon: Sparkles },
    { name: "Dia a Dia", page: "DailyMode", icon: Calendar },
    { name: "Rendas", page: "Incomes", icon: Wallet },
    { name: "Gastos", page: "Expenses", icon: Receipt },
    { name: "Metas", page: "Goals", icon: Target },
    { name: "Simulação", page: "Simulation", icon: Calculator },
    { name: "Configurações", page: "Settings", icon: Settings },
  ];

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --rendy-primary: #00A8A0;
          --rendy-primary-dark: #008F88;
          --rendy-secondary: #0A1A3A;
          --rendy-secondary-light: #1A2A4A;
        }
        .bg-rendy-primary { background-color: var(--rendy-primary); }
        .bg-rendy-secondary { background-color: var(--rendy-secondary); }
        .text-rendy-primary { color: var(--rendy-primary); }
        .text-rendy-secondary { color: var(--rendy-secondary); }
        .border-rendy-primary { border-color: var(--rendy-primary); }
        .hover\\:bg-rendy-primary:hover { background-color: var(--rendy-primary); }
        .from-rendy-primary { --tw-gradient-from: var(--rendy-primary); }
        .to-rendy-secondary { --tw-gradient-to: var(--rendy-secondary); }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-rendy-secondary" />
        </button>
        <div className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69359712539a91a68b73062c/fe2ff4d83_ChatGPTImage7dedezde202512_49_24.png" 
            alt="Rendy" 
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
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50
        transition-transform duration-300 ease-out
        w-72 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69359712539a91a68b73062c/fe2ff4d83_ChatGPTImage7dedezde202512_49_24.png" 
              alt="Rendy" 
              className="h-10"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
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
                      ? 'bg-gradient-to-r from-[#00A8A0] to-[#008F88] text-white shadow-lg shadow-[#00A8A0]/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-rendy-secondary'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Organize suas finanças</p>
              <p className="text-sm font-semibold text-rendy-secondary">de forma simples e segura</p>
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
  );
}