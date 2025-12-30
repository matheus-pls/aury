import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Receipt, History } from "lucide-react";
import Incomes from "./Incomes";
import Expenses from "./Expenses";

const TABS = [
  { id: "incomes", label: "Rendas", icon: Wallet },
  { id: "expenses", label: "Gastos", icon: Receipt }
];

export default function Movements() {
  const [activeTab, setActiveTab] = useState("expenses");

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Movimentações</h1>
        <p className="text-slate-500 mt-1">Gerencie suas entradas e saídas</p>
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
          {activeTab === "incomes" && <Incomes />}
          {activeTab === "expenses" && <Expenses />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}