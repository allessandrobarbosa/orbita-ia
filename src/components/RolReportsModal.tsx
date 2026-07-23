import React, { useState } from "react";
import { X, Download, FileText, Calendar, Building2, Users } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// We import the types from the parent or just use any since it's props
export default function RolReportsModal({ 
  onClose, 
  mandatos = [], 
  afastamentos = [], 
  unidades = [] 
}: { 
  onClose: () => void, 
  mandatos: any[], 
  afastamentos: any[], 
  unidades: any[] 
}) {
  const [reportType, setReportType] = useState<"dirigentes" | "afastamentos" | "tipos_afastamento">("dirigentes");
  const [selectedUnidade, setSelectedUnidade] = useState("");
  const [anoFilter, setAnoFilter] = useState("");

  // Simple token styles
  const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition";
  const lbl = "block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5";

  // Gera dados tabulares baseados no tipo e filtros
  const generateData = () => {
    let data: any[] = [];
    
    if (reportType === "dirigentes") {
      let filtered = mandatos;
      if (selectedUnidade) {
        filtered = filtered.filter(m => m.id_unidade.toString() === selectedUnidade);
      }
      data = filtered.map(m => ({
        "Nome": m.nome_completo,
        "CPF": m.cpf,
        "Cargo": m.nome_cargo,
        "Unidade": m.sigla_unidade,
        "Vínculo": m.is_substituto ? "Substituto" : "Titular",
        "Início": m.data_inicio ? new Date(m.data_inicio).toLocaleDateString("pt-BR") : "-",
        "Fim": m.data_fim ? new Date(m.data_fim).toLocaleDateString("pt-BR") : "Atual",
      }));
    } else if (reportType === "afastamentos") {
      let filtered = afastamentos;
      if (anoFilter) {
        filtered = filtered.filter(a => a.data_inicio.startsWith(anoFilter));
      }
      if (selectedUnidade) {
        // Find mandato to get unidade
        const mandateMap = new Map(mandatos.map(m => [m.id_registro, m.id_unidade.toString()]));
        filtered = filtered.filter(a => mandateMap.get('T_' + a.id_mandato) === selectedUnidade);
      }
      data = filtered.map(a => {
        const m = mandatos.find(md => md.id_registro === 'T_' + a.id_mandato);
        return {
          "Dirigente": m ? m.nome_completo : "Desconhecido",
          "Unidade": m ? m.sigla_unidade : "-",
          "Motivo": a.motivo,
          "Início": new Date(a.data_inicio).toLocaleDateString("pt-BR"),
          "Fim": new Date(a.data_fim).toLocaleDateString("pt-BR"),
          "Ato Autorização": a.ato_autorizacao || "-",
        };
      });
    } else if (reportType === "tipos_afastamento") {
       // Similar to afastamentos but ordered/grouped by motivo
       let filtered = afastamentos;
       if (anoFilter) filtered = filtered.filter(a => a.data_inicio.startsWith(anoFilter));
       if (selectedUnidade) {
         const mandateMap = new Map(mandatos.map(m => [m.id_registro, m.id_unidade.toString()]));
         filtered = filtered.filter(a => mandateMap.get('T_' + a.id_mandato) === selectedUnidade);
       }
       // Sort by motivo
       filtered.sort((a, b) => (a.motivo || "").localeCompare(b.motivo || ""));
       data = filtered.map(a => {
         const m = mandatos.find(md => md.id_registro === 'T_' + a.id_mandato);
         return {
           "Tipo/Motivo": a.motivo,
           "Dirigente": m ? m.nome_completo : "Desconhecido",
           "Início": new Date(a.data_inicio).toLocaleDateString("pt-BR"),
           "Fim": new Date(a.data_fim).toLocaleDateString("pt-BR"),
         };
       });
    }
    return data;
  };

  const exportXLSX = () => {
    const data = generateData();
    if (data.length === 0) return alert("Nenhum dado encontrado para os filtros atuais.");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, `Relatorio_Rol_${reportType}_${new Date().getTime()}.xlsx`);
  };

  const exportPDF = () => {
    const data = generateData();
    if (data.length === 0) return alert("Nenhum dado encontrado para os filtros atuais.");
    
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text(`Relatório - ${reportType.toUpperCase()}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    const headers = Object.keys(data[0]);
    const body = data.map(row => Object.values(row));

    (doc as any).autoTable({
      startY: 35,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 8 }
    });

    doc.save(`Relatorio_Rol_${reportType}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#003366] flex items-center justify-center">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Exportar Relatórios</h2>
              <p className="text-xs text-slate-500 font-medium">Extração de dados do Rol de Responsáveis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div>
            <label className={lbl}>Selecione o tipo de relatório</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: "dirigentes", label: "Cadastro de Dirigentes", icon: Users },
                { id: "afastamentos", label: "Afastamentos Geral", icon: Calendar },
                { id: "tipos_afastamento", label: "Por Tipo de Afastamento", icon: FileText }
              ].map(opt => {
                const Icon = opt.icon;
                const active = reportType === opt.id;
                return (
                  <button 
                    key={opt.id}
                    onClick={() => setReportType(opt.id as any)}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      active ? "border-[#003366] bg-blue-50 text-[#003366]" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={24} className="mb-2" />
                    <span className="text-xs font-bold leading-tight">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <label className={lbl}>Filtro por Unidade</label>
              <select className={inp} value={selectedUnidade} onChange={e => setSelectedUnidade(e.target.value)}>
                <option value="">Geral (Todas as Unidades)</option>
                {unidades.map(u => (
                  <option key={u.id_unidade} value={u.id_unidade}>{u.sigla} - {u.nome}</option>
                ))}
              </select>
            </div>
            
            {(reportType === "afastamentos" || reportType === "tipos_afastamento") && (
              <div>
                <label className={lbl}>Filtro por Ano</label>
                <select className={inp} value={anoFilter} onChange={e => setAnoFilter(e.target.value)}>
                  <option value="">Todos os Anos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={exportXLSX} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-sm cursor-pointer">
            <Download size={16} /> Baixar XLSX
          </button>
          <button onClick={exportPDF} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 transition shadow-sm cursor-pointer">
            <Download size={16} /> Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
