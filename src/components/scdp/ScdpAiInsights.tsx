import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Mail } from "lucide-react";

interface ScdpAiInsightsProps {
  viagemId: string;
  scoreRiscoIa?: string;
  justificativaIa?: string;
}

export const ScdpAiInsights: React.FC<ScdpAiInsightsProps> = ({ viagemId, scoreRiscoIa, justificativaIa }) => {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<{ score: string, justificativa: string, minuta?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const scoreDisplay = analise?.score || scoreRiscoIa;
  const justDisplay = analise?.justificativa || justificativaIa;

  const getScoreColor = (score?: string) => {
    if (!score) return "text-slate-400 bg-slate-100";
    if (score === "Baixo") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score === "Médio") return "text-amber-700 bg-amber-50 border-amber-200";
    if (score === "Alto") return "text-rose-700 bg-rose-50 border-rose-200";
    return "text-slate-400 bg-slate-100";
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
      <h4 className="text-xs font-black text-[#003366] uppercase mb-3 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" /> Análise IA e Risco (Decreto 5.992/2006)
      </h4>
      
      {!scoreDisplay ? (
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs text-slate-600">Nenhuma análise IA realizada ainda para esta viagem.</span>
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="px-3 py-1.5 bg-[#003366] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
          >
            {loading ? "Analisando..." : "Gerar Análise de Risco (Gemini)"}
          </button>
          {error && <span className="text-xs text-rose-600 mt-1">{error}</span>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 w-max ${getScoreColor(scoreDisplay)}`}>
            {scoreDisplay === "Baixo" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            Score de Risco: {scoreDisplay}
          </div>
          <p className="text-xs text-slate-700 bg-white p-3 border border-slate-200 rounded-lg whitespace-pre-wrap">
            {justDisplay}
          </p>
          
          {analise?.minuta && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h5 className="text-[10px] font-black uppercase text-slate-500 mb-2">Sugestão de Minuta (SEI) - LGPD compliant</h5>
              <div className="text-[11px] text-slate-700 bg-slate-100 p-3 rounded-lg font-mono whitespace-pre-wrap border border-slate-200">
                {analise.minuta}
              </div>
              <button className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2">
                <Mail className="w-4 h-4" /> Enviar por E-mail
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
