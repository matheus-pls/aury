import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CATEGORY_LABELS = {
  fixed: "Fixo",
  essential: "Essencial",
  superfluous: "Supérfluo",
  emergency: "Reserva",
  investment: "Investimento",
};

export default function RecentTransactions({ expenses }) {
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm text-foreground">Últimas Transações</p>
        <Link
          to={createPageUrl("Movements")}
          className="text-xs text-[#5FBDBD] hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="space-y-3">
        {recent.map((exp) => (
          <div key={exp.id} className="flex items-center gap-3">
            <div className="p-1.5 bg-rose-500/10 rounded-lg flex-shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
              <p className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[exp.category] || exp.category} •{" "}
                {exp.date ? new Date(exp.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : ""}
              </p>
            </div>
            <p className="text-sm font-bold text-rose-400 flex-shrink-0">
              -{formatCurrency(exp.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}