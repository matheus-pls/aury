import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, TrendingDown, Target, Shield, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";

const CATEGORY_LABELS = {
  fixed: "Fixos",
  essential: "Essenciais",
  superfluous: "Supérfluos",
  emergency: "Reserva",
  investment: "Investimentos"
};

const CATEGORY_COLORS = {
  fixed: "#1B3A52",
  essential: "#5FBDBD",
  superfluous: "#F59E0B",
  emergency: "#10B981",
  investment: "#6366F1"
};

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export default function MonthlyReport() {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => base44.entities.Income.filter({ is_active: true })
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses-all"],
    queryFn: () => base44.entities.Expense.list()
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const r = await base44.entities.UserSettings.list();
      return r[0] || { fixed_percentage: 50, essential_percentage: 15, superfluous_percentage: 10, emergency_percentage: 15, investment_percentage: 10 };
    }
  });

  const monthExpenses = expenses.filter(e => e.month_year === selectedMonth);
  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalSpent = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const savings = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const byCategory = Object.keys(CATEGORY_LABELS).map(cat => {
    const spent = monthExpenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
    const plannedPct = settings?.[`${cat}_percentage`] || 0;
    const planned = totalIncome * (plannedPct / 100);
    const pctOfTotal = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
    return { cat, label: CATEGORY_LABELS[cat], spent, planned, plannedPct, pctOfTotal, diff: spent - planned };
  });

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;

  const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const generateTextReport = () => {
    const lines = [
      `RESUMO FINANCEIRO MENSAL - ${selectedMonthLabel.toUpperCase()}`,
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
      ``,
      `=== VISÃO GERAL ===`,
      `Renda Total:       ${formatCurrency(totalIncome)}`,
      `Total Gasto:       ${formatCurrency(totalSpent)}`,
      `Economia:          ${formatCurrency(savings)} (${savingsRate.toFixed(1)}% da renda)`,
      ``,
      `=== GASTOS POR CATEGORIA ===`,
      ...byCategory.map(c =>
        `${c.label.padEnd(15)} Gasto: ${formatCurrency(c.spent).padEnd(14)} Planejado: ${formatCurrency(c.planned).padEnd(14)} Diferença: ${c.diff > 0 ? "+" : ""}${formatCurrency(c.diff)}`
      ),
      ``,
      `=== ANÁLISE ===`,
      savings >= 0
        ? `✓ Você economizou ${formatCurrency(savings)} neste mês (${savingsRate.toFixed(1)}% da renda).`
        : `✗ Você gastou ${formatCurrency(Math.abs(savings))} a mais do que sua renda neste mês.`,
      ...byCategory.filter(c => c.diff > 0 && c.spent > 0).map(c =>
        `! ${c.label}: ultrapassou o planejado em ${formatCurrency(c.diff)}`
      ),
      ...byCategory.filter(c => c.diff < 0 && c.planned > 0).map(c =>
        `✓ ${c.label}: ficou ${formatCurrency(Math.abs(c.diff))} abaixo do planejado`
      ),
      ``,
      `--- Relatório gerado pelo Aury ---`
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumo-${selectedMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const teal = [95, 189, 189];
    const navy = [27, 58, 82];

    // Header
    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Financeiro Mensal", 14, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(selectedMonthLabel, 14, 28);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

    let y = 50;

    // Visão Geral
    doc.setTextColor(...navy);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Visão Geral", 14, y);
    y += 8;

    const overviewItems = [
      ["Renda Total", formatCurrency(totalIncome)],
      ["Total Gasto", formatCurrency(totalSpent)],
      ["Economia", `${formatCurrency(savings)} (${savingsRate.toFixed(1)}%)`]
    ];

    doc.setFontSize(10);
    overviewItems.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(label, 14, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...navy);
      doc.text(value, 90, y);
      y += 7;
    });

    y += 6;

    // Separator
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;

    // Categoria
    doc.setTextColor(...navy);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Categoria", 14, y);
    y += 8;

    // Table header
    doc.setFillColor(240, 249, 249);
    doc.rect(14, y - 4, 182, 8, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text("Categoria", 16, y);
    doc.text("Gasto", 70, y);
    doc.text("Planejado", 105, y);
    doc.text("Diferença", 145, y);
    doc.text("% Total", 178, y);
    y += 6;

    byCategory.forEach(c => {
      if (c.spent === 0 && c.planned === 0) return;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(c.label, 16, y);
      doc.text(formatCurrency(c.spent), 70, y);
      doc.text(formatCurrency(c.planned), 105, y);
      const diffStr = (c.diff > 0 ? "+" : "") + formatCurrency(c.diff);
      doc.setTextColor(c.diff > 0 ? 220 : 16, c.diff > 0 ? 50 : 185, c.diff > 0 ? 50 : 129);
      doc.text(diffStr, 145, y);
      doc.setTextColor(80, 80, 80);
      doc.text(`${c.pctOfTotal.toFixed(1)}%`, 178, y);
      y += 7;
    });

    y += 4;
    doc.setDrawColor(...teal);
    doc.line(14, y, 196, y);
    y += 8;

    // Analysis
    doc.setTextColor(...navy);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Análise", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (savings >= 0) {
      doc.setTextColor(16, 185, 129);
      doc.text(`✓ Você economizou ${formatCurrency(savings)} neste mês (${savingsRate.toFixed(1)}% da renda).`, 14, y);
      y += 7;
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text(`✗ Você gastou ${formatCurrency(Math.abs(savings))} a mais do que sua renda.`, 14, y);
      y += 7;
    }

    byCategory.filter(c => c.diff > 0 && c.spent > 0).forEach(c => {
      doc.setTextColor(220, 100, 38);
      doc.text(`! ${c.label}: ultrapassou o planejado em ${formatCurrency(c.diff)}`, 14, y);
      y += 6;
    });

    byCategory.filter(c => c.diff < 0 && c.planned > 0).forEach(c => {
      doc.setTextColor(16, 185, 129);
      doc.text(`✓ ${c.label}: ficou ${formatCurrency(Math.abs(c.diff))} abaixo do planejado`, 14, y);
      y += 6;
    });

    // Footer
    doc.setFillColor(...teal);
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Relatório gerado pelo Aury — Seu assistente financeiro pessoal", 14, 292);

    doc.save(`resumo-financeiro-${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <BackButton to={createPageUrl("Overview")} className="mb-4" />
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A52]">Resumo Mensal</h1>
        <p className="text-slate-500 mt-1">Distribuição de gastos e comparação com o planejamento</p>
      </motion.div>

      {/* Month Selector + Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={generateTextReport} className="border-[#5FBDBD] text-[#5FBDBD] hover:bg-[#5FBDBD]/5">
            <FileText className="w-4 h-4 mr-2" />
            Exportar .txt
          </Button>
          <Button onClick={generatePDF} className="bg-gradient-to-r from-[#5FBDBD] to-[#1B3A52] text-white">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Renda Total", value: formatCurrency(totalIncome), icon: Wallet, color: "from-[#5FBDBD] to-[#4FA9A5]" },
          { label: "Total Gasto", value: formatCurrency(totalSpent), icon: TrendingDown, color: "from-[#1B3A52] to-[#0A2540]" },
          {
            label: savings >= 0 ? "Economizado" : "Déficit",
            value: formatCurrency(Math.abs(savings)),
            sub: `${savingsRate.toFixed(1)}% da renda`,
            icon: savings >= 0 ? TrendingUp : AlertCircle,
            color: savings >= 0 ? "from-emerald-500 to-green-600" : "from-rose-500 to-red-600"
          }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border border-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 bg-gradient-to-br ${item.color} rounded-xl`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-[#1B3A52]">{item.value}</p>
                  {item.sub && <p className="text-xs text-slate-400 mt-1">{item.sub}</p>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#1B3A52] text-base">Gastos vs. Planejamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {byCategory.map(c => {
              const overBudget = c.diff > 0;
              const hasData = c.spent > 0 || c.planned > 0;
              if (!hasData) return null;
              return (
                <div key={c.cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.cat] }} />
                      <span className="font-medium text-sm text-[#1B3A52]">{c.label}</span>
                      {c.planned > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${overBudget ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {overBudget ? `+${formatCurrency(c.diff)}` : `-${formatCurrency(Math.abs(c.diff))}`}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#1B3A52]">{formatCurrency(c.spent)}</span>
                      {c.planned > 0 && <span className="text-xs text-slate-400 ml-1">/ {formatCurrency(c.planned)}</span>}
                    </div>
                  </div>
                  {c.planned > 0 && (
                    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min((c.spent / c.planned) * 100, 100)}%`,
                          backgroundColor: overBudget ? "#EF4444" : CATEGORY_COLORS[c.cat]
                        }}
                      />
                      {overBudget && (
                        <div className="absolute top-0 left-0 right-0 h-full border-2 border-red-400 rounded-full" />
                      )}
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{c.pctOfTotal.toFixed(1)}% do total gasto</span>
                    {c.planned > 0 && (
                      <span className="text-xs text-slate-400">
                        {c.plannedPct}% planejado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {monthExpenses.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-sm">Nenhum gasto registrado neste mês.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights */}
      {monthExpenses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1B3A52] text-base">Análise do Mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`flex items-start gap-3 p-4 rounded-xl ${savings >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                {savings >= 0
                  ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                <p className={`text-sm ${savings >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                  {savings >= 0
                    ? `Você economizou ${formatCurrency(savings)} neste mês — ${savingsRate.toFixed(1)}% da sua renda.`
                    : `Você gastou ${formatCurrency(Math.abs(savings))} a mais do que sua renda neste mês.`}
                </p>
              </div>
              {byCategory.filter(c => c.diff > 0 && c.spent > 0).map(c => (
                <div key={c.cat} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>{c.label}:</strong> ultrapassou o planejado em {formatCurrency(c.diff)} ({((c.diff / c.planned) * 100).toFixed(0)}% acima).
                  </p>
                </div>
              ))}
              {byCategory.filter(c => c.diff < 0 && c.planned > 0).map(c => (
                <div key={c.cat} className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800">
                    <strong>{c.label}:</strong> ficou {formatCurrency(Math.abs(c.diff))} abaixo do planejado. Ótimo controle!
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}