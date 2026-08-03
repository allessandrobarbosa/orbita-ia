import React, { useState } from "react";
import { X, Download, FileText, Calendar, Building2, Users } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [reportType, setReportType] = useState<"dirigentes" | "afastamentos" | "tipos_afastamento" | "tcu">("tcu");
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
    } else if (reportType === "tcu") {
      const ano = anoFilter || new Date().getFullYear().toString();
      const yearStart = new Date(parseInt(ano), 0, 1);
      const yearEnd = new Date(parseInt(ano), 11, 31);

      const parseDate = (dStr: string) => {
        if (!dStr) return new Date();
        const [y, m, d] = dStr.split("T")[0].split("-").map(Number);
        return new Date(y, m - 1, d);
      };
      const fmtManual = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

      const activeInYear = (inicioStr: string, fimStr: string | null) => {
        const inicio = parseDate(inicioStr);
        const fim = fimStr ? parseDate(fimStr) : new Date(2100, 0, 1);
        return inicio <= yearEnd && fim >= yearStart;
      };

      let baseMandatos = mandatos;
      if (selectedUnidade) {
        baseMandatos = baseMandatos.filter(m => m.id_unidade.toString() === selectedUnidade);
      }
      if (anoFilter) {
        baseMandatos = baseMandatos.filter(m => activeInYear(m.data_inicio, m.data_fim));
      }

      // Group by unidade
      const unitsMap = new Map<string, any[]>();
      baseMandatos.forEach(m => {
        const u = m.sigla_unidade;
        if (!unitsMap.has(u)) unitsMap.set(u, []);
        unitsMap.get(u)!.push(m);
      });

      const sortedUnits = Array.from(unitsMap.keys()).sort();
      data = [];

      const getAto = (m: any) => {
        return (m.ato_nomeacao ? `NOMEAÇÃO: ${m.ato_nomeacao}` : "") +
          (m.ato_nomeacao && m.ato_exoneracao ? " \r\n " : "") +
          (m.ato_exoneracao ? `EXONERAÇÃO: ${m.ato_exoneracao}` : "") || "-";
      };

      for (const uSigla of sortedUnits) {
        const ms = unitsMap.get(uSigla)!;
        const titulares = ms.filter(m => !m.is_substituto).sort((a, b) => parseDate(a.data_inicio).getTime() - parseDate(b.data_inicio).getTime());
        const substitutos = ms.filter(m => m.is_substituto).sort((a, b) => parseDate(a.data_inicio).getTime() - parseDate(b.data_inicio).getTime());

        const usedSubs = new Set<string>();

        for (const tit of titulares) {
          const mInicio = parseDate(tit.data_inicio);
          let startPeriod = new Date(Math.max(mInicio.getTime(), yearStart.getTime()));
          let mFim = tit.data_fim ? parseDate(tit.data_fim) : yearEnd;
          if (!tit.data_fim) mFim = yearEnd;
          let endPeriod = new Date(Math.min(mFim.getTime(), yearEnd.getTime()));

          const meusAfastamentos = afastamentos.filter(a => {
            if (`T_${a.id_mandato}` !== tit.id_registro) return false;
            return activeInYear(a.data_inicio, a.data_fim);
          }).sort((a, b) => parseDate(a.data_inicio).getTime() - parseDate(b.data_inicio).getTime());

          let gestaoStr = "";
          let periods: string[] = [];

          if (meusAfastamentos.length === 0) {
            gestaoStr = `${fmtManual(startPeriod)} a ${fmtManual(endPeriod)}`;
          } else {
            let currentStart = new Date(startPeriod);

            for (const af of meusAfastamentos) {
              const afStart = new Date(Math.max(parseDate(af.data_inicio).getTime(), startPeriod.getTime()));
              let afEnd = af.data_fim ? parseDate(af.data_fim) : yearEnd;
              afEnd = new Date(Math.min(afEnd.getTime(), endPeriod.getTime()));

              const workEnd = new Date(afStart);
              workEnd.setDate(workEnd.getDate() - 1); // Worked until the day before afastamento

              if (currentStart <= workEnd) {
                periods.push(`${fmtManual(currentStart)} a ${fmtManual(workEnd)}`);
              }
              currentStart = new Date(afEnd);
              currentStart.setDate(currentStart.getDate() + 1); // Resume work the day after afastamento
            }
            if (currentStart <= endPeriod) {
              periods.push(`${fmtManual(currentStart)} a ${fmtManual(endPeriod)}`);
            }
            gestaoStr = periods.length > 0 ? periods.join(" \r\n ") : "---------";
          }

          data.push({
            "Unidade": tit.nome_unidade,
            "Nome": tit.nome_completo,
            "CPF": tit.cpf,
            "Natureza Responsabilidade (cargo/função exercida)": tit.nome_cargo,
            "Gestão": gestaoStr,
            "Nomeação/Designação/ Exoneração": getAto(tit),
            "Correio Eletrônico": tit.email || "-"
          });

          // NOW add Substituto rows specifically for each afastamento of THIS titular
          for (const af of meusAfastamentos) {
            if (af.id_designacao) {
              const subId = `S_${af.id_designacao}`;
              const subMandato = mandatos.find(m => m.id_registro === subId);

              if (subMandato) {
                usedSubs.add(subId);
                const afStart = new Date(Math.max(parseDate(af.data_inicio).getTime(), yearStart.getTime()));
                let afEnd = af.data_fim ? parseDate(af.data_fim) : yearEnd;
                afEnd = new Date(Math.min(afEnd.getTime(), yearEnd.getTime()));

                data.push({
                  "Unidade": subMandato.nome_unidade,
                  "Nome": subMandato.nome_completo,
                  "CPF": subMandato.cpf,
                  "Natureza Responsabilidade (cargo/função exercida)": subMandato.nome_cargo,
                  "Gestão": `${fmtManual(afStart)} a ${fmtManual(afEnd)}`,
                  "Nomeação/Designação/ Exoneração": getAto(subMandato),
                  "Correio Eletrônico": subMandato.email || "-"
                });
              }
            }
          }
        }

        // Add unused Substitutos for this Unidade at the end (those who didn't substitute anyone in the year)
        for (const sub of substitutos) {
          if (!usedSubs.has(sub.id_registro)) {
            data.push({
              "Unidade": sub.nome_unidade,
              "Nome": sub.nome_completo,
              "CPF": sub.cpf,
              "Natureza Responsabilidade (cargo/função exercida)": sub.nome_cargo,
              "Gestão": "---------",
              "Nomeação/Designação/ Exoneração": getAto(sub),
              "Correio Eletrônico": sub.email || "-"
            });
          }
        }
      }
    }
    return data;
  };

  const exportXLSX = () => {
    const data = generateData();
    if (data.length === 0) return alert("Nenhum dado encontrado para os filtros atuais.");
    const ws = XLSX.utils.json_to_sheet(data);

    // Configuração de larguras das colunas (em caracteres aprox.)
    const wscols = [
      { wch: 15 }, // Unidade
      { wch: 25 }, // Nome
      { wch: 15 }, // CPF
      { wch: 25 }, // Natureza Resp
      { wch: 25 }, // Gestão
      { wch: 35 }, // Nomeação
      { wch: 25 }  // Email
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, `Relatorio_Rol_${reportType}_${new Date().getTime()}.xlsx`);
  };

  const generatePDFDoc = () => {
    const data = generateData();
    if (data.length === 0) return null;

    const doc = new jsPDF("landscape");
    const ano = anoFilter || new Date().getFullYear().toString();

    const headers = Object.keys(data[0]);
    const body = data.map(row => Object.values(row));

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 80, overflow: 'linebreak' },
        6: { cellWidth: 35 }
      },
      margin: { top: 30, bottom: 20 },
      didDrawPage: (dataInfo) => {
        // Header
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`ROL DE RESPONSÁVEIS - RELATÓRIO DE GESTÃO DE ${ano}`, dataInfo.settings.margin.left, 20);

        // Footer
        doc.setFontSize(9);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text("Nota: Rol de Responsáveis elaborado em conformidade com a IN/TCU nº. 84/2020", dataInfo.settings.margin.left, pageHeight - 10);
      }
    });

    return doc;
  };

  const exportPDF = () => {
    const doc = generatePDFDoc();
    if (!doc) return alert("Nenhum dado encontrado para os filtros atuais.");
    const url = doc.output('bloburl');
    window.open(url, '_blank');
  };

  const exportWord = () => {
    const data = generateData();
    if (data.length === 0) return alert("Nenhum dado encontrado para os filtros atuais.");

    const ano = anoFilter || new Date().getFullYear().toString();

    let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>";
    html += "<head><meta charset='utf-8'><title>Export HTML to Word</title>";
    html += "<style>@page WordSection1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 1cm; } div.WordSection1 { page: WordSection1; }</style>";
    html += "</head><body><div class='WordSection1'>";
    html += `<h2 style='font-family: Arial, sans-serif; text-align: center;'>ROL DE RESPONSÁVEIS - RELATÓRIO DE GESTÃO DE ${ano}</h2>`;
    html += "<table border='1' style='border-collapse:collapse; width:100%; font-family: Arial, sans-serif; font-size: 11px; table-layout: fixed;'>";

    const headers = Object.keys(data[0]);
    const widths = ["10%", "15%", "10%", "15%", "15%", "25%", "10%"]; // Approx widths
    html += "<tr>" + headers.map((h, i) => `<th style='background-color:#003366; color:white; padding:8px; width:${widths[i] || 'auto'};'>` + h + "</th>").join("") + "</tr>";

    data.forEach(row => {
      html += "<tr>" + Object.values(row).map(val => "<td style='padding:8px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word;'>" + String(val).replace(/\n/g, "<br>").replace(/\r/g, "") + "</td>").join("") + "</tr>";
    });

    html += "</table>";
    html += "<p style='font-family: Arial, sans-serif; font-size: 10px; margin-top: 20px; font-weight: bold;'>Nota: Rol de Responsáveis elaborado em conformidade com a IN/TCU nº. 84/2020</p>";
    html += "</div></body></html>";

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Rol_${reportType}_${new Date().getTime()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportData = generateData();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
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
        <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">

          <div>
            <label className={lbl}>Selecione o tipo de relatório</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: "dirigentes", label: "Cadastro de Dirigentes", icon: Users },
                { id: "afastamentos", label: "Afastamentos Geral", icon: Calendar },
                { id: "tipos_afastamento", label: "Por Tipo de Afastamento", icon: FileText },
                { id: "tcu", label: "Gerar Rol RG-TCU", icon: Building2 }
              ].map(opt => {
                const Icon = opt.icon;
                const active = reportType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setReportType(opt.id as any)}
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${active ? "border-[#003366] bg-blue-50 text-[#003366]" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
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

            {(reportType === "afastamentos" || reportType === "tipos_afastamento" || reportType === "tcu") && (
              <div>
                <label className={lbl}>Filtro por Ano {reportType === 'tcu' && '(Exercício)'}</label>
                <select className={inp} value={anoFilter} onChange={e => setAnoFilter(e.target.value)}>
                  <option value="">Todos os Anos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            )}
          </div>

          {/* PREVIEW DA TABELA */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText size={16} /> Visualização Prévia dos Dados
            </h3>
            {reportData.length > 0 ? (
              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white min-h-[300px] shadow-inner">
                <table className="w-full text-left border-collapse text-sm text-slate-800">
                  <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244]">
                    <tr>
                      {Object.keys(reportData[0]).map((h, i) => (
                        <th key={h} className="p-3 font-bold text-slate-600 uppercase tracking-wider" style={{ width: [100, 150, 100, 150, 150, 250, 120][i] || 'auto' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="p-3 text-slate-700 whitespace-pre-wrap align-top break-words">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 border border-slate-200 border-dashed rounded-xl text-slate-400 bg-slate-50 flex-1 flex items-center justify-center">
                Nenhum dado encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end flex-wrap">
          <button onClick={exportWord} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer">
            <Download size={16} /> Word
          </button>
          <button onClick={exportXLSX} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-sm cursor-pointer">
            <Download size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 transition shadow-sm cursor-pointer">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
