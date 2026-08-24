import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Mail, Sparkles, Copy, Check } from "lucide-react";

interface ScdpAiInsightsProps {
  viagemId: string;
  scoreRiscoIa?: string;
  justificativaIa?: string;
}

export const ScdpAiInsights: React.FC<ScdpAiInsightsProps> = ({ viagemId, scoreRiscoIa, justificativaIa }) => {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<{ score: string, justificativa: string, minuta?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/scdp/viagens/${viagemId}/analyze`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setAnalise({
          score: data.analise.scoreRisco,
          justificativa: data.analise.justificativa,
          minuta: data.analise.minutaSei
        });
      } else {
        setError(data.error || "Erro ao analisar.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = analise?.minuta || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scoreDisplay = analise?.score || scoreRiscoIa;
  const justDisplay = analise?.justificativa || justificativaIa;

  const getScoreStyles = (score?: string) => {
    if (!score) return "text-slate-400 bg-slate-100 border-slate-200";
    if (score === "Baixo") return "text-emerald-700 bg-emerald-50/80 border-emerald-200/60";
    if (score === "Médio") return "text-amber-700 bg-amber-50/80 border-amber-200/60";
    if (score === "Alto") return "text-rose-700 bg-rose-50/80 border-rose-200/60";
    return "text-slate-400 bg-slate-100 border-slate-200";
  };

  return (
    <div className="bg-slate-50/40 border border-slate-200/60 rounded-2xl p-5 shadow-3xs">
      <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
        <h4 className="text-xs font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-800" /> Análise IA e Risco (Decreto 5.992/2006)
        </h4>
        {scoreDisplay && (
          <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1.5 ${getScoreStyles(scoreDisplay)}`}>
            {scoreDisplay === "Baixo" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            Score: {scoreDisplay}
          </div>
        )}
      </div>
      
      {!scoreDisplay ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <span className="text-xs text-slate-550 leading-relaxed font-medium">
            Nenhuma auditoria por Inteligência Artificial foi executada ainda para este processo de diárias e passagens.
          </span>
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-br from-[#003366] to-blue-800 hover:from-slate-900 hover:to-slate-850 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-3xs disabled:opacity-50"
          >
            <Sparkles size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Processando Parecer..." : "Gerar Análise de Risco (Gemini)"}
          </button>
          {error && <span className="text-xs text-rose-600 mt-1 font-semibold">{error}</span>}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1.5">Parecer e Diagnóstico IA</span>
            <p className="text-xs text-slate-700 bg-white p-4 border border-slate-200 rounded-xl leading-relaxed font-medium shadow-4xs border-l-4 border-l-blue-600">
              {justDisplay}
            </p>
          </div>
          
          {(analise?.minuta || scoreDisplay === "Alto") && (
            <div className="mt-4 pt-4 border-t border-slate-250/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sugestão de Minuta (SEI) - LGPD Compliant</span>
                {analise?.minuta && (
                  <button 
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-4xs"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copiado!" : "Copiar Minuta"}
                  </button>
                )}
              </div>
              <div className="text-[10px] text-slate-700 bg-slate-100/60 p-4 rounded-xl font-mono whitespace-pre-wrap border border-slate-200 max-h-56 overflow-y-auto leading-relaxed">
                {analise?.minuta || "Nenhuma minuta gerada."}
              </div>
              <button className="mt-3 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-3xs">
                <Mail className="w-4 h-4" /> Enviar para o Servidor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
