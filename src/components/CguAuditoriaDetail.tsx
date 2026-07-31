import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, FileText, Calendar, Building2, MapPin, 
  ExternalLink, Copy, CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { CguAuditoria } from "../types";
import { CguDemand } from "../types"; // As we use monitoramentos

interface CguAuditoriaDetailProps {
  id_tarefa: string;
  onBack: () => void;
}

export default function CguAuditoriaDetail({ id_tarefa, onBack }: CguAuditoriaDetailProps) {
  const [data, setData] = useState<{ auditoria: CguAuditoria, monitoramentos: CguDemand[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/cgu/auditorias/${id_tarefa}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id_tarefa]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="bg-slate-50/50 rounded-xl space-y-6 animate-fade-in">
      
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-[#1351b4] font-medium transition-colors"
      >
        <ArrowLeft size={18} /> Voltar para Auditorias Publicadas
      </button>

      {/* Cabeçalho da Auditoria */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1351b4]"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold tracking-wider">
                ID Auditoria: {auditoria.id_auditoria}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold tracking-wider">
                ID Tarefa: {auditoria.id_tarefa}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              {auditoria.titulo_relatorio}
            </h1>
          </div>
          
          {auditoria.origem_cgu_url_relatorio && (
            <div className="flex gap-2">
              <button 
                onClick={() => copyUrl(auditoria.origem_cgu_url_relatorio)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar URL'}
              </button>
              <a 
                href={auditoria.origem_cgu_url_relatorio} target="_blank" rel="noreferrer"
                className="px-3 py-1.5 bg-[#1351b4] hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <ExternalLink size={16} /> Ver Relatório
              </a>
            </div>
          )}
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

      {/* Dossiê de Monitoramento */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="text-[#1351b4]" size={24} /> // Will use CheckCircle or Alert depending on icon import, I'll stick to what's available
          Dossiê de Monitoramento
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
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4">Situação</th>
                    <th className="p-4">Recomendação / Monitoramento</th>
                    <th className="p-4">Providência Esperada</th>
                    <th className="p-4">Prazo Limite</th>
                    <th className="p-4">Atualização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monitoramentos.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
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
                      <td className="p-4 align-top">
                        <div className="text-sm text-slate-600 line-clamp-3" title={m.providencia}>
                          {m.providencia || '-'}
                        </div>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap text-sm text-slate-700 font-medium">
                        {m.dataLimite || '-'}
                      </td>
                      <td className="p-4 align-top whitespace-nowrap text-sm text-slate-500">
                        {m.ultimaAtualizacao || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
