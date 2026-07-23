/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Building2, Search, Phone, Mail, MapPin, AlertCircle, Edit, Save, ExternalLink, FileText, X } from "lucide-react";
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

// Mapeamento de UFs para nomes de estados por extenso
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

// Mapeamento de códigos regionais históricos do MTE (número do processo) por UF
const getMteCodeByUf = (uf: string): string => {
  const codes: Record<string, string> = {
    AC: "46002", AL: "46003", AM: "46004", BA: "46005", CE: "46006",
    DF: "46007", ES: "46008", GO: "46009", MA: "46017", MT: "46027",
    MS: "46028", MG: "46013", PA: "46016", PB: "46018", PR: "46011",
    PE: "46014", PI: "46023", RN: "46019", RS: "46015", RJ: "46012",
    RO: "46024", RR: "46025", SC: "46020", SP: "46010", SE: "46021",
    TO: "46026", AP: "46030"
  };
  return codes[uf] || "XXXXX";
};

// Scanner for matching acórdãos for each state
const findRelatedAcordaos = (uf: string, capital: string, list: (AcordaoDemand & { _normalizedText?: string })[]) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  
  return list.filter(ac => {
    const textToSearch = ac._normalizedText || "";
    
    // Look for patterns like "srte-sp", "srte/sp", "srt-sp", "srt/sp"
    const hasUfPattern = textToSearch.includes(`srte-${ufLower}`) || 
                         textToSearch.includes(`srte/${ufLower}`) ||
                         textToSearch.includes(`srt-${ufLower}`) ||
                         textToSearch.includes(`srt/${ufLower}`);
                         
    // Match exact MTE phrases instead of disjoint words to prevent false positives with other agencies
    const hasSuperintendencia = textToSearch.includes("superintendencia regional do trabalho") || 
                                textToSearch.includes("superintendencia do trabalho") || 
                                textToSearch.includes("gerencia regional do trabalho") ||
                                textToSearch.includes("srte");
                                
    const mentionsLocation = textToSearch.includes(capitalLower) || 
                             textToSearch.includes(`no estado d${ufLower === 'mg' || ufLower === 'go' ? 'e' : 'o'} ${ufLower}`) ||
                             textToSearch.includes(`srt-${ufLower}`) ||
                             textToSearch.includes(`srte-${ufLower}`);
                             
    return hasUfPattern || (hasSuperintendencia && mentionsLocation);
  });
};

// Scanner para associar Comunicações (Ofícios) às SRTEs
const findRelatedComunicacoes = (uf: string, capital: string, list: (ComunicacaoDemand & { _normalizedText?: string })[]) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const stateNameLower = getUfStateName(uf).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedCapital = capitalLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return list.filter(com => {
    const normalizedText = com._normalizedText || "";

    const hasUfPattern = normalizedText.includes(`srte-${ufLower}`) || 
                         normalizedText.includes(`srte/${ufLower}`) ||
                         normalizedText.includes(`srt-${ufLower}`) ||
                         normalizedText.includes(`srt/${ufLower}`);
                         
    const mentionsSuper = normalizedText.includes("superintendencia regional do trabalho") || 
                          normalizedText.includes("superintendencia do trabalho") ||
                          normalizedText.includes("gerencia regional do trabalho") ||
                          normalizedText.includes("srte");
                          
    const mentionsLocation = normalizedText.includes(normalizedCapital) || 
                              normalizedText.includes(stateNameLower) ||
                              normalizedText.includes(`no estado d${ufLower === 'mg' || ufLower === 'go' ? 'e' : 'o'} ${ufLower}`);
                              
    return hasUfPattern || (mentionsSuper && mentionsLocation);
  });
};

// Scanner para associar TCEs às SRTEs
const findRelatedTces = (uf: string, capital: string, list: (TceDemand & { _normalizedText?: string })[]) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const stateNameLower = getUfStateName(uf).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedCapital = capitalLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mteCode = getMteCodeByUf(uf);
  
  return list.filter(tce => {
    const normalizedText = tce._normalizedText || "";

    const hasUfPattern = normalizedText.includes(`srte-${ufLower}`) || 
                         normalizedText.includes(`srte/${ufLower}`) ||
                         normalizedText.includes(`srt-${ufLower}`) ||
                         normalizedText.includes(`srt/${ufLower}`) ||
                         normalizedText.includes(` ${ufLower} `) ||
                         normalizedText.includes(`/${ufLower}`);

    const matchesMteCode = tce.PROCESSO_ADMINISTRATIVO && tce.PROCESSO_ADMINISTRATIVO.replace(/\D/g, "").startsWith(mteCode);
                         
    const mentionsSuper = normalizedText.includes("superintendencia regional do trabalho") || 
                          normalizedText.includes("superintendencia do trabalho") ||
                          normalizedText.includes("gerencia regional do trabalho") ||
                          normalizedText.includes("srte");
                          
    const mentionsLocation = normalizedText.includes(normalizedCapital) || 
                              normalizedText.includes(stateNameLower);
                              
    return hasUfPattern || matchesMteCode || (mentionsSuper && mentionsLocation);
  });
};

// Scanner para associar Demandas CGU às SRTEs
const findRelatedCguDemands = (uf: string, capital: string, list: (CguDemand & { _normalizedText?: string })[]) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const stateNameLower = getUfStateName(uf).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedCapital = capitalLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return list.filter(cgu => {
    const normalizedText = cgu._normalizedText || "";

    const hasUfPattern = normalizedText.includes(`srte-${ufLower}`) || 
                         normalizedText.includes(`srte/${ufLower}`) ||
                         normalizedText.includes(`srt-${ufLower}`) ||
                         normalizedText.includes(`srt/${ufLower}`) ||
                         normalizedText.includes(` ${ufLower} `) ||
                         normalizedText.includes(`/${ufLower}`);
                         
    const mentionsSuper = normalizedText.includes("superintendencia regional do trabalho") || 
                          normalizedText.includes("superintendencia do trabalho") ||
                          normalizedText.includes("gerencia regional do trabalho") ||
                          normalizedText.includes("srte");
                          
    const mentionsLocation = normalizedText.includes(normalizedCapital) || 
                              normalizedText.includes(stateNameLower);
                              
    return hasUfPattern || (mentionsSuper && mentionsLocation);
  });
};

export default function SrteModule({ superintendencias, onUpdateSrte, acordaos, comunicacoes, tces, cguDemands = [] }: SrteModuleProps) {
  
  // Pre-normalize text for all items ONCE to avoid O(N*M) heavy string operations during render
  const normalizedAcordaos = React.useMemo(() => acordaos.map(ac => ({
    ...ac,
    _normalizedText: `${ac.TITULO || ""} ${ac.INTERESSADOS || ""} ${ac.ASSUNTO || ""} ${ac.SUMARIO || ""} ${ac.ACORDAO || ""} ${ac.DECISAO || ""}`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  })), [acordaos]);

  const normalizedComunicacoes = React.useMemo(() => comunicacoes.map(com => ({
    ...com,
    _normalizedText: `${com.DESTINATARIO || ""} ${com.CONTATO || ""} ${com.COMUNICACAO || ""}`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  })), [comunicacoes]);

  const normalizedTces = React.useMemo(() => tces.map(tce => ({
    ...tce,
    _normalizedText: `${tce.NUMERO_ANO_TCE || ""} ${tce.PROCESSO_ADMINISTRATIVO || ""} ${tce.MOTIVO_INSTAURACAO || ""} ${tce.SUBMOTIVO_INSTAURACAO || ""} ${tce.ULTIMO_POSICIONAMENTO || ""}`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  })), [tces]);
  
  const normalizedCguDemands = React.useMemo(() => cguDemands.map(cgu => ({
    ...cgu,
    _normalizedText: `${cgu.tituloTarefa || ""} ${cgu.unidadeAuditada || ""} ${cgu.textoMonitoramento || ""} ${cgu.providencia || ""}`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  })), [cguDemands]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [activeRegion, setActiveRegion] = useState("TODOS");
  const [editingUf, setEditingUf] = useState<string | null>(null);
  const [selectedSrte, setSelectedSrte] = useState<SuperintendenciaRegional | null>(null);
  
  // Modal preview states
  const [selectedAcordao, setSelectedAcordao] = useState<AcordaoDemand | null>(null);
  const [detailsModal, setDetailsModal] = useState<{ sr: SuperintendenciaRegional; type: 'tcu' | 'cgu' | 'comunicacoes' | 'tces' } | null>(null);

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

  const handleSaveEdit = async () => {
    if (!editingUf) return;
    
    // Locate original coordinates to preserve them
    const original = superintendencias.find(x => x.uf === editingUf);

    // Auto-calculate counts based on actual database lists
    const tcuCount = findRelatedAcordaos(editingUf, original?.capital || "", normalizedAcordaos).length;
    const cguCount = findRelatedCguDemands(editingUf, original?.capital || "", normalizedCguDemands).length;
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

  // Map and calculate all counts and risk status dynamically for consistency
  const calculatedSrtes = React.useMemo(() => {
    return superintendencias.map(s => {
      const tcuCount = findRelatedAcordaos(s.uf, s.capital, normalizedAcordaos).length;
      const cguCount = findRelatedCguDemands(s.uf, s.capital, normalizedCguDemands).length;
      const comCount = findRelatedComunicacoes(s.uf, s.capital, normalizedComunicacoes).length;
      const tceCount = findRelatedTces(s.uf, s.capital, normalizedTces).length;
      
      return {
        ...s,
        demandasTCU: tcuCount,
        demandasCGU: cguCount,
        demandasComunicacoes: comCount,
        demandasTces: tceCount,
        statusGeral: calculateRisk(tcuCount, cguCount)
      };
    });
  }, [superintendencias, normalizedAcordaos, normalizedComunicacoes, normalizedTces, normalizedCguDemands]);

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
        </div>
      </div>

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
          const relatedAcordaos = findRelatedAcordaos(sr.uf, sr.capital, acordaos);

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
                      
                      <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 ml-5">
                        {sr.cep && <span>CEP: {sr.cep}</span>}
                      </div>

                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sr.contato}</span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                          <span className="text-slate-500 font-sans block text-[9px]">TCU (Acórdãos)</span>
                          <span className="text-xs font-extrabold font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasTCU}
                            <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                          </span>
                        </button>

                        <button
                          onClick={() => setDetailsModal({ sr, type: 'cgu' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver as Recomendações da CGU vinculadas"
                        >
                          <span className="text-slate-500 font-sans block text-[9px]">CGU (Recomendações)</span>
                          <span className="text-xs font-extrabold font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasCGU}
                            <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                          </span>
                        </button>

                        <button
                          onClick={() => setDetailsModal({ sr, type: 'comunicacoes' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver as Comunicações oficiais (Ofícios) vinculadas"
                        >
                          <span className="text-slate-500 font-sans block text-[9px]">Comunicações (Ofícios)</span>
                          <span className="text-xs font-extrabold font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasComunicacoes}
                            <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                          </span>
                        </button>

                        <button
                          onClick={() => setDetailsModal({ sr, type: 'tces' })}
                          className="bg-slate-50 hover:bg-blue-50/50 p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-center"
                          title="Clique para ver as Tomadas de Contas Especiais vinculadas"
                        >
                          <span className="text-slate-500 font-sans block text-[9px]">TCEs Regionais</span>
                          <span className="text-xs font-extrabold font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                            {sr.demandasTces}
                            <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
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

      {/* modal block for reading related indicators details */}
      {detailsModal && (() => {
        const { sr, type } = detailsModal;
        
        let title = "";
        let contentElement = null;
        
        if (type === "tcu") {
          title = `Processos TCU Vinculados — SRTE / ${sr.capital} (${sr.uf})`;
          const matched = findRelatedAcordaos(sr.uf, sr.capital, normalizedAcordaos);
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhum processo do TCU localizado para esta unidade regional.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700 text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                    <th className="p-4 w-1/4 bg-slate-50">Processo / Acórdão</th>
                    <th className="p-4 w-1/4 bg-slate-50">Relator</th>
                    <th className="p-4 w-2/5 bg-slate-50">Sumário / Objeto</th>
                    <th className="p-4 text-right bg-slate-50">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matched.map(ac => (
                    <tr key={ac.KEY} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="font-mono text-[11px]">{ac.PROC}</div>
                        <div className="text-[10px] text-blue-800 font-bold mt-0.5">{ac.TITULO}</div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{ac.RELATOR}</td>
                      <td className="p-4 text-slate-500 leading-relaxed max-w-sm truncate" title={ac.SUMARIO}>{ac.SUMARIO}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedAcordao(ac)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1351b4] font-bold hover:bg-blue-100 transition cursor-pointer text-[10px]"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ver Inteiro Teor
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
          const matched = findRelatedCguDemands(sr.uf, sr.capital, normalizedCguDemands);
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhuma recomendação da CGU ativa para esta unidade regional.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700 text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                    <th className="p-4 w-1/4 bg-slate-50">Recomendação</th>
                    <th className="p-4 w-1/4 bg-slate-50">Unidade / Categoria</th>
                    <th className="p-4 w-2/5 bg-slate-50">Descrição do Monitoramento</th>
                    <th className="p-4 bg-slate-50">Prazo Limite</th>
                    <th className="p-4 text-right bg-slate-50">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matched.map(rec => (
                    <tr key={rec.idTarefa} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="text-[10px] text-slate-500 mb-0.5">ID: {rec.idTarefa}</div>
                        {rec.tituloTarefa}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-[11px]">
                        <div>{rec.unidadeAuditada}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{rec.categoria}</div>
                      </td>
                      <td className="p-4 text-slate-500 leading-relaxed max-w-[300px] truncate" title={rec.textoMonitoramento}>
                        {rec.textoMonitoramento}
                      </td>
                      <td className="p-4 font-mono text-slate-600">{rec.dataLimite || "N/A"}</td>
                      <td className="p-4 text-right">
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
          const matched = findRelatedComunicacoes(sr.uf, sr.capital, normalizedComunicacoes);
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhuma comunicação ou ofício localizado para esta unidade regional.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700 text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                    <th className="p-4 w-1/4 bg-slate-50">Ofício</th>
                    <th className="p-4 w-1/3 bg-slate-50">Destinatário / Contato</th>
                    <th className="p-4 w-1/4 bg-slate-50">Processo TCU</th>
                    <th className="p-4 bg-slate-50">Expedição</th>
                    <th className="p-4 text-right bg-slate-50">Resposta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matched.map(com => (
                    <tr key={com.KEY} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-blue-900">{com.COMUNICACAO}</td>
                      <td className="p-4">
                        <div className="text-slate-800 font-semibold text-[11px] truncate max-w-[200px]" title={com.DESTINATARIO}>{com.DESTINATARIO}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={com.CONTATO}>{com.CONTATO}</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600">{com.PROCESSO}</td>
                      <td className="p-4 text-slate-600">{com.DATA_EXPEDICAO}</td>
                      <td className="p-4 text-right">
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
          const matched = findRelatedTces(sr.uf, sr.capital, normalizedTces);
          contentElement = matched.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold">Nenhuma TCE regionalizada localizada para esta unidade.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3 w-1/6">Número TCE</th>
                    <th className="p-3 w-1/4">Processo Adm. / TC</th>
                    <th className="p-3 w-1/3">Motivo / Instauração</th>
                    <th className="p-3 text-right">Valores (Orig / Atual)</th>
                    <th className="p-3 text-right font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matched.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-rose-900">{t.NUMERO_ANO_TCE}</td>
                      <td className="p-4">
                        <div className="font-mono text-[10.5px] text-slate-900">{t.PROCESSO_ADMINISTRATIVO}</div>
                        {t.TC && <div className="text-[10px] font-semibold font-mono text-slate-500 mt-0.5">TC {t.TC}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800 font-semibold text-[11px] truncate max-w-[200px]" title={t.MOTIVO_INSTAURACAO}>{t.MOTIVO_INSTAURACAO}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={t.SUBMOTIVO_INSTAURACAO}>{t.SUBMOTIVO_INSTAURACAO}</div>
                      </td>
                      <td className="p-4 text-right font-mono text-[11px]">
                        <div className="text-slate-500">R$ {t.DEBITO_ORIGINAL}</div>
                        <div className="font-bold text-slate-900 mt-0.5">R$ {t.DEBITO_ATUALIZADO}</div>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                          t.SITUACAO_PROCESSO.toLowerCase().includes("condena") || t.ESTADO_PROCESSO.toLowerCase().includes("irregular")
                            ? "bg-rose-100 text-rose-800"
                            : t.SITUACAO_PROCESSO.toLowerCase().includes("arquiv")
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {t.SITUACAO_PROCESSO || t.ESTADO_PROCESSO || "Em Curso"}
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
