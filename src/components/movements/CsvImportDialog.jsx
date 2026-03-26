import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function parseDate(str) {
  if (!str) return null;
  // DD/MM/YYYY
  const dmyMatch = str.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  // YYYY-MM-DD
  const isoMatch = str.trim().match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return str.trim();
  return null;
}

function parseAmount(str) {
  if (!str) return null;
  const clean = str.replace(/[^\d,.-]/g, "").replace(",", ".");
  const val = parseFloat(clean);
  return isNaN(val) ? null : Math.abs(val);
}

function parseCsv(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());

  // Try to detect columns by name
  let dateIdx = header.findIndex(h => h.includes("data") || h.includes("date"));
  let descIdx = header.findIndex(h => h.includes("descri") || h.includes("memo") || h.includes("histor") || h.includes("desc"));
  let amtIdx = header.findIndex(h => h.includes("valor") || h.includes("value") || h.includes("amount") || h.includes("debito") || h.includes("credito"));

  // Fallback: guess by position
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (amtIdx === -1) amtIdx = 2;

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/).map(c => c.replace(/^"|"$/g, "").trim());
    const date = parseDate(cols[dateIdx]);
    const description = cols[descIdx] || "";
    const amount = parseAmount(cols[amtIdx]);
    if (date && description && amount !== null) {
      rows.push({ date, description, amount });
    }
  }
  return rows;
}

export default function CsvImportDialog({ open, onClose }) {
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target.result);
      setPreview(rows);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    const today = new Date().toISOString().slice(0, 7);
    let count = 0;
    for (const row of preview) {
      await base44.entities.Expense.create({
        description: row.description,
        amount: row.amount,
        date: row.date,
        category: "essential",
        month_year: row.date.slice(0, 7) || today,
      });
      count++;
    }
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    toast.success(`${count} gastos importados com sucesso 🎉`);
    setImporting(false);
    setPreview([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  const handleClose = () => {
    setPreview([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5FBDBD]" />
            Importar Extrato CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Exporte o extrato do seu banco em formato CSV e importe aqui. A Aury vai tentar identificar descrição, valor e data automaticamente.
          </p>

          {/* Format example */}
          <div className="bg-muted rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Formato esperado:</p>
            <code className="text-xs text-[#5FBDBD]">Data, Descrição, Valor</code>
            <br />
            <code className="text-xs text-muted-foreground">25/03/2026, Uber, -45.90</code>
          </div>

          {/* File input */}
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#5FBDBD]/30 rounded-xl p-6 cursor-pointer hover:border-[#5FBDBD]/60 transition-colors">
            <Upload className="w-6 h-6 text-[#5FBDBD]" />
            <span className="text-sm font-medium text-foreground">
              {fileName || "Clique para selecionar o arquivo"}
            </span>
            <span className="text-xs text-muted-foreground">Apenas arquivos .csv</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{preview.length} transações encontradas</p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Data</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Descrição</th>
                        <th className="text-right px-3 py-2 text-muted-foreground font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 text-foreground whitespace-nowrap">{row.date}</td>
                          <td className="px-3 py-2 text-foreground truncate max-w-[180px]">{row.description}</td>
                          <td className="px-3 py-2 text-right text-red-400 font-medium">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {preview.length === 0 && fileName && (
            <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Nenhuma transação válida encontrada. Verifique o formato do arquivo.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
            <Button
              className="flex-1 text-white"
              style={{ background: "linear-gradient(135deg, #5FBDBD, #3A9A9A)" }}
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
            >
              {importing ? "Importando..." : `Importar ${preview.length > 0 ? preview.length : ""} gastos`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}