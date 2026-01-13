import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Wallet, Receipt, Zap } from "lucide-react";
import BackButton from "@/components/BackButton";
import AuryFlow from "@/components/overview/AuryFlow";
import Incomes from "./Incomes";
import Expenses from "./Expenses";

const TABS = [
  { id: "quick", label: "Registrar", icon: Zap },
  { id: "expenses", label: "Gastos", icon: Receipt },
  { id: "incomes", label: "Rendas", icon: Wallet }
];

export default function Movements() {
  const [activeTab, setActiveTab] = useState("quick");

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton to={createPageUrl("Overview")} className="mb-4" />
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Movimentações</h1>
        <p className="text-slate-500 mt-1">Registre rapidamente com Aury Flow</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "quick" && (
            <div className="space-y-4">
              <AuryFlow />
              <div className="bg-gradient-to-br from-[#5FBDBD]/10 to-[#1B3A52]/10 rounded-2xl p-5 border border-[#5FBDBD]/20">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong className="text-[#1B3A52]">Dica:</strong> Fale naturalmente com a Aury. 
                  "Gastei 50 no Uber", "Recebi 300 do freela" - ela entende você.
                </p>
              </div>
            </div>
          )}
          {activeTab === "incomes" && <Incomes />}
          {activeTab === "expenses" && <Expenses />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}