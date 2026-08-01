import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, FileText, Calendar, Building2, MapPin, 
  ExternalLink, Copy, CheckCircle2, AlertCircle, Clock,
  BrainCircuit, ShieldAlert, Eye, Printer, ChevronDown, ChevronUp
} from "lucide-react";
import { jsPDF } from "jspdf";
import { CguAuditoria } from "../types";
import { CguDemand } from "../types"; // As we use monitoramentos
import CguDossieModal from "./CguDossieModal";
interface CguAuditoriaDetailProps {
  id_tarefa: string;
  onBack: () => void;
}

export default function CguAuditoriaDetail({ id_tarefa, onBack }: CguAuditoriaDetailProps) {
  const [data, setData] = useState<{ auditoria: CguAuditoria, monitoramentos: CguDemand[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatingDossier, setGeneratingDossier] = useState(false);
  const [dossierError, setDossierError] = useState("");
  const [selectedDemand, setSelectedDemand] = useState<CguDemand | null>(null);
  const [isAiExpanded, setIsAiExpanded] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/cgu/auditorias/${id_tarefa}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id_tarefa]);

  // Safe parsing for AI dossier
  const getParsedDossier = () => {
    if (!data?.auditoria?.dossie_ia) return null;
    try {
      return JSON.parse(data.auditoria.dossie_ia);
    } catch (e) {
      console.error("Failed to parse dossie_ia", e);
      return null;
    }
  };
  const parsedDossie = getParsedDossier();

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateDossier = async () => {
    if (!data?.auditoria) return;
    try {
      setGeneratingDossier(true);
      setDossierError("");
      const res = await fetch(`/api/cgu/auditorias/${data.auditoria.id_auditoria}/dossie`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.details || "Erro ao gerar dossiê");
      
      // Update local state to show the dossier
      setData(prev => prev ? { 
        ...prev, 
        auditoria: { ...prev.auditoria, dossie_ia: JSON.stringify(result.dossie) } 
      } : null);
      setIsAiExpanded(true);
    } catch (err: any) {
      setDossierError(err.message);
    } finally {
      setGeneratingDossier(false);
    }
  };

  const handleExportAIDossierPdf = () => {
    if (!data?.auditoria?.dossie_ia) return;
    const dossie = JSON.parse(data.auditoria.dossie_ia);
    
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102); // #003366
    doc.text(`Dossiê de Auditoria CGU - ${data.auditoria.id_auditoria}`, 40, 60);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    let y = 80;
    doc.setFont("helvetica", "bold");
    doc.text("Relatório:", 40, y);
    doc.setFont("helvetica", "normal");
    const relText = doc.splitTextToSize(data.auditoria.titulo_relatorio, 450);
    doc.text(relText, 100, y);
    y += relText.length * 15;
    
    doc.setFont("helvetica", "bold");
    doc.text("Unidade Auditada:", 40, y);
    doc.setFont("helvetica", "normal");
    const unText = doc.splitTextToSize(data.auditoria.nome_unidade_auditada || "", 400);
    doc.text(unText, 140, y);
    y += unText.length * 15;
    
    doc.setFont("helvetica", "bold");
    doc.text("Data de Publicação:", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.auditoria.data_publicacao ? new Date(data.auditoria.data_publicacao).toLocaleDateString('pt-BR') : '-', 150, y);
    y += 30;

    const addSection = (title: string, text: string) => {
      if (y > 750) { doc.addPage(); y = 60; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text(title, 40, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(text || "Não informado.", 515);
      doc.text(splitText, 40, y);
      y += splitText.length * 15 + 10;
    };

    addSection("Resumo Executivo", dossie.resumo);
    addSection("Escopo da Auditoria", dossie.escopo);

    if (dossie.constatacoes?.length > 0) {
      if (y > 750) { doc.addPage(); y = 60; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text("Principais Constatações (Achados)", 40, y);
      y += 20;

      dossie.constatacoes.forEach((c: any) => {
        if (y > 750) { doc.addPage(); y = 60; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        let titleLine = c.titulo;
        if (c.risco_impacto) titleLine += ` (Risco: ${c.risco_impacto})`;
        const tSplit = doc.splitTextToSize(titleLine, 515);
        doc.text(tSplit, 40, y);
        y += tSplit.length * 15 + 5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const dSplit = doc.splitTextToSize(c.descricao || "", 515);
        doc.text(dSplit, 40, y);
        y += dSplit.length * 15 + 15;
      });
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Dossiê extraído automaticamente a partir do relatório original. Análise feita com uso de Inteligência Artificial.", 40, 810);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center text-slate-500 shadow-sm animate-fade-in">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <FileText className="text-slate-300" size={48} />
          <span className="text-lg">Carregando dossiê da auditoria...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.auditoria) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center text-slate-500 shadow-sm animate-fade-in">
        <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-slate-700">Auditoria não encontrada</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors">
          Voltar para listagem
        </button>
      </div>
    );
  }

  const { auditoria, monitoramentos } = data;

  // Calculo de indicadores
  const totalRecomendacoes = monitoramentos.length;
  // This depends on how the data is structured, usually they might count unique recommendations or providencias. We will assume 1 row = 1 item
  const concluidos = monitoramentos.filter(m => m.estado?.toLowerCase().includes('concluído') || m.estado?.toLowerCase().includes('atendido')).length;
  const pendentes = monitoramentos.filter(m => m.estado?.toLowerCase().includes('pendente') || m.estado?.toLowerCase().includes('vencid')).length;
  const emAnalise = monitoramentos.filter(m => m.estado?.toLowerCase().includes('análise')).length;
  
  let situacaoGeral = "Sem Monitoramento";
  let situacaoColor = "bg-slate-100 text-slate-700";
  if (totalRecomendacoes > 0) {
    if (concluidos === totalRecomendacoes) {
      situacaoGeral = "Totalmente Atendida";
      situacaoColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    } else if (pendentes > 0) {
      situacaoGeral = "Com Pendências";
      situacaoColor = "bg-rose-100 text-rose-800 border-rose-200";
    } else {
      situacaoGeral = "Em Acompanhamento";
      situacaoColor = "bg-amber-100 text-amber-800 border-amber-200";
    }
  }

  const ultimaAtualizacao = monitoramentos.reduce((latest, current) => {
    if (!current.ultimaAtualizacao) return latest;
    // Assuming format DD/MM/YYYY or similar, fallback string compare for now
    return current.ultimaAtualizacao > latest ? current.ultimaAtualizacao : latest;
  }, "");

  return (
    <div className="bg-slate-50/50 rounded-xl space-y-6 animate-fade-in p-4 border-2 border-blue-100 mt-2 mb-6">
      
      {/* Cabeçalho da Auditoria */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1351b4]"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold tracking-wider border border-slate-200">
                ID Auditoria: {auditoria.id_auditoria}
              </span>
              <span className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold tracking-wider border border-slate-200">
                ID Tarefa: {auditoria.id_tarefa}
              </span>
              
              {auditoria.origem_cgu_url_relatorio && (
                <div className="flex items-center gap-2 ml-auto">
                  <button 
                    onClick={() => copyUrl(auditoria.origem_cgu_url_relatorio)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-bold transition-colors flex items-center gap-2 border border-slate-200 shadow-sm"
                  >
                    <Copy size={14} /> {copied ? 'COPIADO!' : 'COPIAR URL'}
                  </button>
                  <a 
                    href={`/api/cgu/pdf/view/${auditoria.origem_cgu_url_relatorio.split('/').pop()}`} target="_blank" rel="noreferrer"
                    className="px-2.5 py-1.5 bg-[#1351b4] hover:bg-blue-800 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-sm border border-[#1351b4]"
                  >
                    <ExternalLink size={14} /> VER PDF OFICIAL
                  </a>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight pr-4">
              {auditoria.titulo_relatorio}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Unidade Auditada</p>
              <p className="text-sm font-medium text-slate-800">{auditoria.sigla_unidade_auditada}</p>
              <p className="text-xs text-slate-500 line-clamp-1" title={auditoria.nome_unidade_auditada}>{auditoria.nome_unidade_auditada}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Publicação</p>
              <p className="text-sm font-medium text-slate-800">
                {auditoria.data_publicacao ? new Date(auditoria.data_publicacao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Localidade</p>
              <p className="text-sm font-medium text-slate-800">{auditoria.municipio || 'Não informado'}</p>
              <p className="text-xs text-slate-500">UF: {auditoria.uf || '-'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Serviço / Atividade</p>
              <p className="text-sm font-medium text-slate-800 line-clamp-1">{auditoria.tipo_servico || '-'}</p>
              <p className="text-xs text-slate-500 line-clamp-1">{auditoria.grupo_atividade || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Dossiê Inteligente */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="text-purple-600" size={24} />
            Análise Inteligente do Relatório
          </h2>
          <div className="flex items-center gap-3">
            {!auditoria.dossie_ia ? (
              <button
                onClick={generateDossier}
                disabled={generatingDossier}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                <BrainCircuit size={16} />
                {generatingDossier ? "Analisando PDF..." : "Extrair Dossiê via IA"}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAIDossierPdf}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 transition shadow-sm cursor-pointer"
                  title="Exportar Análise IA para PDF"
                >
                  <FileText size={16} /> PDF
                </button>
                <button
                  onClick={() => setIsAiExpanded(!isAiExpanded)}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 transition shadow-sm cursor-pointer"
                  title={isAiExpanded ? "Recolher Análise" : "Expandir Análise"}
                >
                  {isAiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {dossierError && (
          <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {dossierError}
          </div>
        )}

        {parsedDossie ? (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mb-8 transition-all duration-300">
            {isAiExpanded && (
              <>
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">Resumo Executivo</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {parsedDossie.resumo || "Não disponível"}
              </p>
            </div>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 mb-2">Escopo da Auditoria</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {parsedDossie.escopo || "Não disponível"}
              </p>
            </div>
            {parsedDossie.constatacoes?.length > 0 && (
              <div className="p-6">
                <h3 className="font-bold text-slate-800 mb-4">Principais Constatações (Achados)</h3>
                <div className="space-y-4">
                  {parsedDossie.constatacoes.map((c: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-bold text-slate-700">{c.titulo}</h4>
                        {c.risco_impacto && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                            {c.risco_impacto}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{c.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="p-6 bg-emerald-50/30">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                Recomendações Chave
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-sm">
                {(parsedDossie.recomendacoes || []).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            </>
          )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center text-slate-500 mb-8">
            <BrainCircuit size={32} className="text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Dossiê não gerado</p>
            <p className="text-sm mt-1 max-w-md">
              Clique no botão acima para que a Inteligência Artificial baixe o relatório original (PDF), leia o conteúdo e extraia as principais constatações.
            </p>
          </div>
        )}
      </div>

      {/* Dossiê de Monitoramento */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="text-[#1351b4]" size={24} /> 
          Monitoramento das Recomendações
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Situação Geral</p>
            <div className={`inline-flex items-center w-max px-3 py-1 rounded-full text-sm font-semibold border ${situacaoColor}`}>
              {situacaoGeral}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Itens Mapeados</p>
              <FileText size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{totalRecomendacoes}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Concluídos</p>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{concluidos}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Em Análise</p>
              <Clock size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700">{emAnalise}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Pendentes</p>
              <AlertCircle size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-700">{pendentes}</p>
          </div>
        </div>

        {totalRecomendacoes === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="text-slate-400" size={24} />
            </div>
            <p className="text-slate-600 font-medium">Nenhum monitoramento vinculado a esta auditoria.</p>
            <p className="text-sm text-slate-500 mt-1">
              Os registros de monitoramento podem ainda não ter sido importados do sistema e-CGU.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">Situação</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">Recomendação / Monitoramento</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">Prazo Limite</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">Atualização</th>
                    <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monitoramentos.map((m, idx) => (
                    <tr key={idx} className="hover:bg-[#1351b4]/5 transition-colors group">
                      <td className="p-4 align-top">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${
                          m.estado?.toLowerCase().includes('concluído') || m.estado?.toLowerCase().includes('atendido') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          m.estado?.toLowerCase().includes('pendente') || m.estado?.toLowerCase().includes('vencid') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {m.estado || m.situacao || 'Desconhecido'}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-sm text-slate-800 line-clamp-3 mb-1" title={m.textoMonitoramento}>
                          {m.textoMonitoramento || m.tituloTarefa}
                        </div>
                        <div className="text-xs text-slate-500">
                          Cat: {m.categoria || '-'}
                        </div>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap text-sm text-slate-700 font-medium">
                        {m.dataLimite || '-'}
                      </td>
                      <td className="p-4 align-top whitespace-nowrap text-sm text-slate-500">
                        {m.ultimaAtualizacao || '-'}
                      </td>
                      <td className="p-4 align-top text-center">
                        <button
                          onClick={() => setSelectedDemand(m)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#1351b4] bg-blue-50 border border-blue-100 hover:bg-[#1351b4] hover:text-white rounded-md transition-colors whitespace-nowrap"
                          title="Ver Dossiê da Recomendação"
                        >
                          Detalhamento
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedDemand && (
        <CguDossieModal demand={selectedDemand} onClose={() => setSelectedDemand(null)} />
      )}
    </div>
  );
}
