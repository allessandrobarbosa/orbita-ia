/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Building2, Search, Phone, Mail, MapPin, AlertCircle, Edit, Save, ExternalLink, FileText, X, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { SuperintendenciaRegional, AcordaoDemand, ComunicacaoDemand, TceDemand, CguDemand } from "../types";
import SRTEDetailView from "./SRTEDetailView";

interface SrteModuleProps {
  superintendencias: SuperintendenciaRegional[];
  onUpdateSrte: (uf: string, data: Partial<SuperintendenciaRegional>) => Promise<boolean>;
  acordaos: AcordaoDemand[];
  comunicacoes: ComunicacaoDemand[];
  tces: TceDemand[];
  cguDemands?: CguDemand[];
}

// Region mapping helper
const getRegionByUF = (uf: string): string => {
  const norte = ["AC", "AP", "AM", "PA", "RO", "RR", "TO"];
  const nordeste = ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"];
  const centroOeste = ["DF", "GO", "MT", "MS"];
  const sudeste = ["ES", "MG", "RJ", "SP"];
  const sul = ["PR", "RS", "SC"];
  if (norte.includes(uf)) return "Norte";
  if (nordeste.includes(uf)) return "Nordeste";
  if (centroOeste.includes(uf)) return "Centro-Oeste";
  if (sudeste.includes(uf)) return "Sudeste";
  if (sul.includes(uf)) return "Sul";
  return "Outros";
};

// Automatic general risk calculator
const calculateRisk = (tcu: number, cgu: number): "Regular" | "Atenção" | "Crítico" => {
  if (tcu >= 3 || (tcu + cgu) >= 8) return "Crítico";
  if (tcu >= 1 || (tcu + cgu) >= 4) return "Atenção";
  return "Regular";
};
// Helper para formatar moeda (R$)
const formatCurrency = (value: string | number) => {
  if (!value) return "R$ 0,00";
  const strVal = String(value);
  const num = parseFloat(strVal.replace(/\./g, "").replace(",", "."));
  if (isNaN(num)) return `R$ ${strVal}`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

// Mapeamento de UFs para nomes de estados por extenso (usado no JSX)
const getUfStateName = (uf: string): string => {
  const ufNames: Record<string, string> = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
    DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
    MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
    PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
    SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
  };
  return ufNames[uf] || "";
};


export default function SrteModule({ superintendencias, onUpdateSrte, acordaos, comunicacoes, tces, cguDemands = [] }: SrteModuleProps) {
  
  // The backend provides related item counts and IDs directly in the `superintendencias` object
  // via the vw_srte_dashboard_metrics view and srte_* linking tables.
  // Run POST /api/srte/recalcular-vinculos to populate them.

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [activeRegion, setActiveRegion] = useState("TODOS");
  const [editingUf, setEditingUf] = useState<string | null>(null);
  const [selectedSrte, setSelectedSrte] = useState<SuperintendenciaRegional | null>(null);
  
  // Modal preview states
  const [selectedAcordao, setSelectedAcordao] = useState<AcordaoDemand | null>(null);
  const [selectedTce, setSelectedTce] = useState<TceDemand | null>(null);
  const [loadingAcordaoKey, setLoadingAcordaoKey] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState<{ sr: SuperintendenciaRegional; type: 'tcu' | 'cgu' | 'comunicacoes' | 'tces' } | null>(null);

  // ── Recálculo de vínculos SRTE ────────────────────────────────────────────
  const [recalcRunning, setRecalcRunning] = useState(false);
  const [recalcStatus, setRecalcStatus] = useState<{ processedUfs: number; totalUfs: number; finishedAt: string | null; error: string | null } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRecalcular = async () => {
    if (recalcRunning) return;
    setRecalcRunning(true);
    setRecalcStatus(null);
    try {
      await fetch("/api/srte/recalcular-vinculos", { method: "POST" });
      // Inicia polling de status a cada 2s
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/srte/recalcular-vinculos/status");
          const data = await res.json();
          const s = data.status;
          setRecalcStatus({ processedUfs: s.processedUfs, totalUfs: s.totalUfs, finishedAt: s.finishedAt, error: s.error });
          if (!s.running) {
            if (pollRef.current) clearInterval(pollRef.current);
            setRecalcRunning(false);
          }
        } catch { /* ignora erros de polling */ }
      }, 2000);
    } catch (err) {
      setRecalcRunning(false);
      console.error("Erro ao iniciar recálculo:", err);
    }
  };

  // Limpa o polling ao desmontar o componente
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Edit states
  const [editSuperintendent, setEditSuperintendent] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSubstituto, setEditSubstituto] = useState("");
  const [editEmailSubstituto, setEditEmailSubstituto] = useState("");
  const [editCep, setEditCep] = useState("");

  const handleOpenEdit = (sr: SuperintendenciaRegional) => {
    setEditingUf(sr.uf);
    setEditSuperintendent(sr.superintendente);
    setEditAddress(sr.endereco);
    setEditContact(sr.contato);
    setEditEmail(sr.email);
    setEditSubstituto(sr.substituto || "");
    setEditEmailSubstituto(sr.emailSubstituto || "");
    setEditCep(sr.cep || "");
  };

  const handleViewAcordao = async (ac: AcordaoDemand) => {
    if (ac.ACORDAO && ac.ACORDAO.trim() !== "") {
      setSelectedAcordao(ac);
      return;
    }
    setLoadingAcordaoKey(ac.KEY);
    try {
      const res = await fetch(`/api/acordaos/${encodeURIComponent(ac.KEY)}/teor`);
      const data = await res.json();
      setSelectedAcordao({
        ...ac,
        ACORDAO: data.acordao || "Inteiro teor indisponível."
      });
    } catch (error) {
      console.error("Erro ao buscar teor do acórdão:", error);
      setSelectedAcordao({
        ...ac,
        ACORDAO: "Erro ao carregar o inteiro teor."
      });
    } finally {
      setLoadingAcordaoKey(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUf) return;
    
    // Locate original coordinates to preserve them
    const original = superintendencias.find(x => x.uf === editingUf);

    // Preserve current counts that are fetched from the DB
    const tcuCount = original?.demandasTCU || 0;
    const cguCount = original?.demandasCGU || 0;
    const computedStatus = calculateRisk(tcuCount, cguCount);

    const updateBody = {
      superintendente: editSuperintendent,
      endereco: editAddress,
      contato: editContact,
      email: editEmail,
      substituto: editSubstituto,
      emailSubstituto: editEmailSubstituto,
      cep: editCep,
      latitude: original?.latitude || 0,
      longitude: original?.longitude || 0,
      demandasTCU: tcuCount,
      demandasCGU: cguCount,
      demandasEtica: 0,
      statusGeral: computedStatus
    };

    const success = await onUpdateSrte(editingUf, updateBody);
    if (success) {
      setEditingUf(null);
    }
  };

  // Pass through superintendencias as they now have pre-calculated counts from the DB
  const calculatedSrtes = superintendencias;

  // Filter List
  const filteredSrtes = calculatedSrtes.filter(s => {
    const matchesSearch = 
      s.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.capital.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.superintendente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.substituto && s.substituto.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "TODOS" || s.statusGeral === statusFilter;
    const matchesRegion = activeRegion === "TODOS" || getRegionByUF(s.uf) === activeRegion;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  if (selectedSrte) {
    const currentSrState = calculatedSrtes.find(s => s.uf === selectedSrte.uf) || selectedSrte;
    return (
      <SRTEDetailView
        sr={currentSrState}
        onBack={() => setSelectedSrte(null)}
        acordaos={acordaos}
        comunicacoes={comunicacoes}
        tces={tces}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* HUD HEADER */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
                <Building2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Superintendências Regionais (SRTEs)</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Visão unificada das 26 Superintendências Estaduais do Trabalho e do Distrito Federal sob monitoramento de conformidade.</p>
              </div>
            </div>
          </div>

          {/* Botão de Recálculo de Vínculos */}
          <div className="flex items-center gap-3">
            <button
              id="btn-recalcular-vinculos"
              onClick={handleRecalcular}
              disabled={recalcRunning}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition duration-200 shadow-sm cursor-pointer ${
                recalcRunning
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[#003366] text-white hover:bg-[#0f4396]"
              }`}
              title="Recalcula os vínculos entre Acórdãos, Comunicações, TCEs e cada SRTE usando o motor de cruzamento do backend"
            >
              {recalcRunning
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Recalculando...</>
                : <><RefreshCw className="w-4 h-4" /> Recalcular Vínculos</>}
            </button>

            {recalcStatus && !recalcRunning && recalcStatus.finishedAt && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {recalcStatus.error ? `Erro: ${recalcStatus.error}` : `Concluído — ${recalcStatus.processedUfs} SRTEs vinculadas`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Banner de progresso durante recálculo */}
      {recalcRunning && recalcStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-4 h-4 text-[#1351b4] animate-spin shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold text-[#1351b4]">Motor de cruzamento em execução no servidor...</div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1.5">
              <div
                className="bg-[#1351b4] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((recalcStatus.processedUfs / recalcStatus.totalUfs) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-blue-500 mt-0.5 font-medium">
              {recalcStatus.processedUfs} / {recalcStatus.totalUfs} SRTEs processadas
            </div>
          </div>
        </div>
      )}

      {/* Filters Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        {/* Region filtering tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {["TODOS", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"].map(reg => (
            <button
              key={reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeRegion === reg 
                  ? "bg-[#1351b4] text-white shadow-2xs" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {reg === "TODOS" ? "Todos os Estados" : reg}
            </button>
          ))}
        </div>

        {/* Text search and status filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="txt-search-srte"
              type="text"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1351b4] focus:outline-hidden"
              placeholder="Pesquisar por UF, Capital, Titular ou Substituto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 w-full md:w-auto justify-end">
            <span>Classificação de Risco:</span>
            <select
              id="select-filter-srte"
              className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs text-slate-800 focus:outline-hidden"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="TODOS">Todos os Riscos</option>
              <option value="Regular">Situação Regular</option>
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSrtes.map((sr) => {
          const isEditing = editingUf === sr.uf;

          // Build precise Google Maps Search URL based on address, capital, UF, and CEP for pinpoint accuracy
          const mapsQuery = `${sr.endereco}, ${sr.capital} - ${sr.uf}, CEP: ${sr.cep || ""}, Superintendência Regional do Trabalho`;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

          return (
            <div key={sr.uf} className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition ${
              sr.statusGeral === "Crítico" ? "border-l-4 border-l-rose-600" :
              sr.statusGeral === "Atenção" ? "border-l-4 border-l-amber-500" : 
              "border-l-4 border-l-emerald-500"
            }`}>

              <div>
                {/* Header state meta */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-3">
                  <div>
                    <h3 className="font-bold text-xs font-mono text-slate-900 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[11px] flex items-center justify-center font-bold text-slate-800 border">
                        {sr.uf}
                      </span>
                      SRTE / {getUfStateName(sr.uf)} - {sr.uf}
                      <span className="text-[9px] text-slate-400 font-sans font-medium bg-slate-100 px-1.5 py-0.5 rounded ml-1">
                        {getRegionByUF(sr.uf)}
                      </span>
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    sr.statusGeral === "Crítico" ? "bg-rose-100 text-rose-800" :
                    sr.statusGeral === "Atenção" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {sr.statusGeral}
                  </span>
                </div>

                {isEditing ? (
                  /* EDIT FORMS */
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Superintendente (Titular):</label>
                      <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editSuperintendent} onChange={e => setEditSuperintendent(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Tel Titular:</label>
                        <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editContact} onChange={e => setEditContact(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">E-mail Titular:</label>
                        <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="border-t pt-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Substituto Designado:</label>
                      <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editSubstituto} onChange={e => setEditSubstituto(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">E-mail Substituto:</label>
                      <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editEmailSubstituto} onChange={e => setEditEmailSubstituto(e.target.value)} />
                    </div>

                    <div className="border-t pt-2 grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Endereço:</label>
                        <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">CEP:</label>
                        <input type="text" className="w-full border border-slate-200 p-1.5 rounded text-xs" value={editCep} onChange={e => setEditCep(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Risco Geral (Calculado):</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold inline-block mt-0.5 ${
                        calculateRisk(sr.demandasTCU, sr.demandasCGU) === "Crítico" ? "bg-rose-100 text-rose-800" :
                        calculateRisk(sr.demandasTCU, sr.demandasCGU) === "Atenção" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {calculateRisk(sr.demandasTCU, sr.demandasCGU)}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* DISPLAY CARD DATA */
                  <div className="space-y-3 text-xs">
                    {/* Staff details */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Titular (Superintendente)</span>
                        <p className="text-slate-800 font-bold">{sr.superintendente}</p>
                      </div>

                      {sr.substituto && (
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 block">Substituto Designado</span>
                          <p className="text-slate-700 font-semibold">{sr.substituto}</p>
                          {sr.emailSubstituto && (
                            <span className="text-[10px] text-slate-500">{sr.emailSubstituto}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Address block with dedicated Google Maps icon button */}
                    <div className="space-y-1.5 border-t pt-2.5">
                      <div className="text-slate-600 flex items-start justify-between gap-1.5">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium leading-tight" title={sr.endereco}>{sr.endereco}</span>
                        </div>
                        <a 
                          href={mapsUrl}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 flex items-center justify-center text-[#1351b4] transition cursor-pointer shrink-0"
                          title="Visualizar localização no Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-2 text-xs text-slate-700 font-medium ml-5">
                        {sr.cep && <span>CEP: {sr.cep}</span>}
                      </div>

                      <p className="text-slate-700 font-medium text-xs flex items-center gap-1.5 mt-1">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{sr.contato}</span>
                      </p>
                      <p className="text-slate-700 font-medium text-xs flex items-center gap-1.5 mt-1">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate text-blue-800 underline">{sr.email}</span>
                      </p>
                    </div>

                    {/* Dynamic Gauges & Details Links */}
                    <div className="border-t border-slate-100 pt-2.5 mt-2.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Demandas e Processos Vinculados</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <button
                          onClick={() => setDetailsModal({ sr, type: 'tcu' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver os Acórdãos do TCU vinculados"
                        >
                          <span className="text-slate-500 font-sans block text-[10px]">TCU (Acórdãos)</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasTCU}
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </span>
                        </button>

                        <button
                          onClick={() => setDetailsModal({ sr, type: 'cgu' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver as Recomendações da CGU vinculadas"
                        >
                          <span className="text-slate-500 font-sans block text-[10px]">CGU (Recomendações)</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasCGU}
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </span>
                        </button>

                        <button
                          onClick={() => setDetailsModal({ sr, type: 'comunicacoes' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver as Comunicações oficiais (Ofícios) vinculadas"
                        >
                          <span className="text-slate-500 block text-xs">Comunicações (Ofícios)</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasComunicacoes}
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </span>
                        </button>

                        <button
                          onClick={() => setDetailsModal({ sr, type: 'tce' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver as TCEs vinculadas"
                        >
                          <span className="text-slate-500 block text-xs">TCEs Regionais</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasTces}
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit command trigger */}
              <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-2.5 mt-3 text-xs">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingUf(null)} className="px-2.5 py-1 text-slate-600 font-bold hover:text-slate-800 cursor-pointer">
                      Cancelar
                    </button>
                    <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-800 text-white rounded-lg font-bold hover:bg-blue-900 flex items-center gap-1 cursor-pointer">
                      <Save className="w-3 h-3" /> Salvar SRT
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleOpenEdit(sr)} className="px-2.5 py-1 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium inline-flex items-center gap-1 text-[10px] cursor-pointer">
                      <Edit className="w-3 h-3" /> Atualizar Unidade
                    </button>
                    <button onClick={() => setSelectedSrte(sr)} className="px-2.5 py-1 bg-[#003366] text-white rounded-lg hover:bg-blue-900 font-medium inline-flex items-center gap-1 text-[10px] cursor-pointer">
                      <Building2 className="w-3.5 h-3.5 text-white" /> Gestão Detalhada
                    </button>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* modal block for reading related acórdão */}
      {selectedAcordao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center select-none shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-200" />
                <h3 className="font-extrabold text-sm font-display tracking-tight text-white">
                  Inteiro Teor — {selectedAcordao.TITULO}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAcordao(null)} 
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap select-text selection:bg-blue-100">
              {selectedAcordao.ACORDAO}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-2 shrink-0 select-none">
              <button 
                onClick={() => setSelectedAcordao(null)} 
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Fechar Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal block for reading related TCE details */}
      {selectedTce && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center select-none shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-200" />
                <h3 className="font-extrabold text-sm font-display tracking-tight text-white">
                  Detalhes da TCE — {selectedTce.NUMERO_ANO_TCE}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTce(null)} 
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed bg-slate-50">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Processo Administrativo / TC</h4>
                  <p className="font-mono text-sm text-slate-800 font-semibold">{selectedTce.PROCESSO_ADMINISTRATIVO}</p>
                  {selectedTce.TC && <p className="font-mono text-xs text-slate-500 mt-1">TC: {selectedTce.TC}</p>}
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Situação Atual</h4>
                  <p className="font-bold text-sm text-slate-800">{selectedTce.ESTADO_PROCESSO || selectedTce.SITUACAO_PROCESSO || "Em Curso"}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Motivação</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">Motivo da Instauração:</span>
                    <p className="text-slate-600">{selectedTce.MOTIVO_INSTAURACAO}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">Submotivo:</span>
                    <p className="text-slate-600">{selectedTce.SUBMOTIVO_INSTAURACAO}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Valores</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Débito Original:</span>
                      <span className="font-mono font-medium">{formatCurrency(selectedTce.DEBITO_ORIGINAL)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="font-bold text-slate-700">Débito Atualizado:</span>
                      <span className="font-mono font-bold text-rose-700">{formatCurrency(selectedTce.DEBITO_ATUALIZADO)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Datas e Prazos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Atualização do Débito:</span>
                      <span className="font-medium text-slate-800">{selectedTce.DATA_ATUALIZACAO_DEBITO || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="text-slate-500">Primeiro Julgamento:</span>
                      <span className="font-medium text-slate-800">{selectedTce.PRIMEIRO_JULGAMENTO || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Último Posicionamento / Parecer</h4>
                <p className="text-slate-700 leading-relaxed">{selectedTce.ULTIMO_POSICIONAMENTO || "Nenhum posicionamento registrado."}</p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-100 flex justify-end gap-2 shrink-0 select-none">
              <a 
                href="https://pesquisa.apps.tcu.gov.br/#/pesquisa/processo" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-blue-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2"
                title="Pesquisar este processo no portal do TCU"
              >
                <ExternalLink className="w-4 h-4" /> Pesquisar no TCU
              </a>
              <button 
                onClick={() => setSelectedTce(null)} 
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal block for reading related indicators details */}
      {detailsModal && (() => {
        const { sr, type } = detailsModal;
        
        let title = "";
        let contentElement = null;
        
        if (type === "tcu") {
          title = `Processos TCU Vinculados — SRTE / ${sr.capital} (${sr.uf})`;
          const matched = acordaos.filter(ac => sr.acordaoIds?.includes(ac.KEY));
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhum processo do TCU localizado para esta unidade regional.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-800">
                <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244] sticky top-0 z-10">
            <tr className="font-semibold backdrop-blur-sm border-b border-[#002244]">
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4 cursor-pointer hover: transition-colors">Processo / Acórdão</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4 cursor-pointer hover: transition-colors">Relator</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-2/5">Sumário / Objeto</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matched.map(ac => (
                    <tr key={ac.KEY} className="hover:bg-slate-50/50">
                      <td className="p-4 align-middle font-semibold text-slate-900">
                        <div className="font-mono text-[11px]">{ac.PROC}</div>
                        <div className="text-[10px] text-blue-800 font-bold mt-0.5">{ac.TITULO}</div>
                      </td>
                      <td className="p-4 align-middle text-slate-600 font-medium">{ac.RELATOR}</td>
                      <td className="p-4 align-middle text-slate-500 leading-relaxed max-w-sm truncate" title={ac.SUMARIO}>{ac.SUMARIO}</td>
                      <td className="p-4 align-middle text-right">
                        <button
                          onClick={() => handleViewAcordao(ac)}
                          disabled={loadingAcordaoKey === ac.KEY}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1351b4] font-bold hover:bg-blue-100 transition cursor-pointer text-[10px] disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5" /> {loadingAcordaoKey === ac.KEY ? "Carregando..." : "Ver Inteiro Teor"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (type === "cgu") {
          title = `Recomendações CGU Ativas — SRTE / ${sr.capital} (${sr.uf})`;
          const matched = cguDemands.filter(cgu => sr.cguIds?.includes(cgu.idTarefa));
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhuma recomendação da CGU ativa para esta unidade regional.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-800">
                <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244] sticky top-0 z-10">
            <tr className="font-semibold backdrop-blur-sm border-b border-[#002244]">
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4 cursor-pointer hover: transition-colors">Recomendação</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4 cursor-pointer hover: transition-colors">Unidade / Categoria</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-2/5">Descrição do Monitoramento</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">Prazo Limite</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matched.map(rec => (
                    <tr key={rec.idTarefa} className="hover:bg-slate-50/50">
                      <td className="p-4 align-middle font-semibold text-slate-900">
                        <div className="text-[10px] text-slate-500 mb-0.5">ID: {rec.idTarefa}</div>
                        {rec.tituloTarefa}
                      </td>
                      <td className="p-4 align-middle text-slate-600 font-mono">
                        <div>{rec.unidadeAuditada}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{rec.categoria}</div>
                      </td>
                      <td className="p-4 align-middle text-slate-500 leading-relaxed max-w-[300px] truncate" title={rec.textoMonitoramento}>
                        {rec.textoMonitoramento}
                      </td>
                      <td className="p-4 align-middle font-mono text-slate-600">{rec.dataLimite || "N/A"}</td>
                      <td className="p-4 align-middle text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                          rec.situacao.toLowerCase().includes("cumprido") ? "bg-emerald-100 text-emerald-800" :
                          rec.situacao.toLowerCase().includes("em análise") ? "bg-blue-100 text-blue-800" :
                          rec.situacao.toLowerCase().includes("atrasado") ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {rec.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (type === "comunicacoes") {
          title = `Comunicações Oficiais (Ofícios) — SRTE / ${sr.capital} (${sr.uf})`;
          const matched = comunicacoes.filter(com => sr.comunicacaoIds?.includes(com.KEY));
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhuma comunicação ou ofício localizado para esta unidade regional.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-800">
                <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244] sticky top-0 z-10">
            <tr className="font-semibold backdrop-blur-sm border-b border-[#002244]">
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4 cursor-pointer hover: transition-colors">Ofício</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/3">Destinatário / Contato</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4 cursor-pointer hover: transition-colors">Processo TCU</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">Expedição</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Resposta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matched.map(com => (
                    <tr key={com.KEY} className="hover:bg-slate-50/50">
                      <td className="p-4 align-middle font-semibold text-blue-900">{com.COMUNICACAO}</td>
                      <td className="p-4 align-middle">
                        <div className="text-slate-800 font-semibold text-[11px] truncate max-w-[200px]" title={com.DESTINATARIO}>{com.DESTINATARIO}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={com.CONTATO}>{com.CONTATO}</div>
                      </td>
                      <td className="p-4 align-middle font-mono text-slate-600">{com.PROCESSO}</td>
                      <td className="p-4 align-middle text-slate-600">{com.DATA_EXPEDICAO}</td>
                      <td className="p-4 align-middle text-right">
                        {com.DATA_RESPOSTA ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold" title={`Respondido em ${com.DATA_RESPOSTA}`}>
                            Resp. {com.DATA_RESPOSTA}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (type === "tces") {
          title = `Tomadas de Contas Especiais (TCEs) — SRTE / ${sr.capital} (${sr.uf})`;
          const matched = tces.filter(tce => sr.tceIds?.includes(tce.id));
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhuma TCE regionalizada localizada para esta unidade.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-800">
                <thead>
                  <tr className="font-semibold sticky top-0 z-10 backdrop-blur-sm border-b border-[#002244]">
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/6 cursor-pointer hover: transition-colors">Número TCE</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/4">Processo Adm. / TC</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors w-1/3">Motivo / Instauração</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Valores (Orig / Atual)</th>
                    <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matched.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-4 align-middle font-semibold text-rose-900">
                        <button 
                          onClick={() => setSelectedTce(t)}
                          className="hover:underline flex items-center gap-1.5 text-blue-800 transition cursor-pointer text-left"
                          title="Clique para ver os detalhes da TCE"
                        >
                          {t.NUMERO_ANO_TCE}
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-mono text-[10.5px] text-slate-900">{t.PROCESSO_ADMINISTRATIVO}</div>
                        {t.TC && <div className="text-[10px] font-semibold font-mono text-slate-500 mt-0.5">TC {t.TC}</div>}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="text-slate-800 font-semibold text-[11px] truncate max-w-[200px]" title={t.MOTIVO_INSTAURACAO}>{t.MOTIVO_INSTAURACAO}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={t.SUBMOTIVO_INSTAURACAO}>{t.SUBMOTIVO_INSTAURACAO}</div>
                      </td>
                      <td className="p-4 align-middle text-right font-mono">
                        <div className="text-slate-500">{formatCurrency(t.DEBITO_ORIGINAL)}</div>
                        <div className="font-bold text-slate-900 mt-0.5">{formatCurrency(t.DEBITO_ATUALIZADO)}</div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                          (t.ESTADO_PROCESSO || "").toLowerCase().includes("irregular")
                            ? "bg-rose-100 text-rose-800"
                            : (t.ESTADO_PROCESSO || "").toLowerCase().includes("encerrado")
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {t.ESTADO_PROCESSO || "Em Curso"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="bg-[#1351b4] text-white px-6 py-4 flex justify-between items-center select-none shrink-0 border-b border-blue-700">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-200" />
                  <h3 className="font-extrabold text-sm font-display tracking-tight text-white uppercase">
                    {title}
                  </h3>
                </div>
                <button 
                  onClick={() => setDetailsModal(null)} 
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh] select-text">
                {contentElement}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-2 shrink-0 select-none">
                <button 
                  onClick={() => setDetailsModal(null)} 
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Fechar Painel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
