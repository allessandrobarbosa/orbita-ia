  app.post("/api/acordaos/:key/analisar-ressarcimento", async (req, res) => {
    const { key } = req.params;
    
    try {
      // 1. Fetch Acórdão from PostgreSQL
      const acResult = await pool.query('SELECT * FROM acordaos WHERE key = $1', [key]);
      if (acResult.rows.length === 0) {
        return res.status(404).json({ error: "Acórdão não encontrado no Postgres." });
      }
      const acordao = acResult.rows[0];
  
      if (!acordao.acordao || acordao.acordao.trim() === "") {
        return res.status(400).json({ error: "Este acórdão não possui o Inteiro Teor para ser analisado." });
      }
  
      // 2. Cross-reference with TCE mappings
      let tceContext = null;
      const tceMapRes = await pool.query(`
        SELECT m.*, t.numero_siafi 
        FROM tce_mappings m 
        LEFT JOIN tces t ON m.numero_ano_tce = t.numero_ano_tce 
        WHERE m.acordao_key = $1 LIMIT 1
      `, [key]);
      
      if (tceMapRes.rows.length > 0) {
        tceContext = tceMapRes.rows[0];
      }
  
      // 3. AI Extraction
      let aiResultJson;
      try {
        aiResultJson = await extractTcuDataWithAi(acordao.acordao, tceContext);
      } catch (err: any) {
        console.error("Erro no extrator IA:", err);
        return res.status(500).json({ error: err.message });
      }
  
      // 4. SIAFI Conciliation Logic
      const dossieResponsaveis = [];
      let client;
      try {
        client = await govHubPool.connect();
      } catch (err) {
        console.warn("[Aviso] Banco GovHub/SIAFI indisponível. Resultados da conciliação virão vazios.");
      }
  
      const responsaveisExtracted = aiResultJson.responsaveis || [];
      
      for (const resp of responsaveisExtracted) {
        let cleanCpf = resp.cpf ? resp.cpf.replace(/[^0-9]/g, "") : "";
        let siafiMatches = [];
        let situacao_debito = "Sem informação";
        let total_pago = 0;
        // Basic cleanup of currency formats (R$ 50.000,00 -> 50000.00)
        let rawVal = (resp.valor || "").replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
        let valor_devido = parseFloat(rawVal) || 0;
  
        if (client && (cleanCpf.length > 5 || tceContext?.numero_siafi)) {
          try {
            let queryStr = `
              SELECT siafi.*, siape.nome as nome_beneficiario 
              FROM siafi 
              LEFT JOIN siape ON siafi.cpf_beneficiario = siape.cpf 
              WHERE 1=1
            `;
            const params = [];
            
            if (cleanCpf) {
              params.push(`%${cleanCpf}%`);
              queryStr += ` AND siafi.cpf_beneficiario LIKE $${params.length}`;
            }
            
            if (tceContext?.numero_siafi) {
              params.push(`%${tceContext.numero_siafi}%`);
              if (cleanCpf) {
                 queryStr += ` OR siafi.processo_origem LIKE $${params.length}`;
              } else {
                 queryStr += ` AND siafi.processo_origem LIKE $${params.length}`;
              }
            }
  
            if (params.length > 0) {
              queryStr += ` LIMIT 5`;
              const searchRes = await client.query(queryStr, params);
              siafiMatches = searchRes.rows;
              
              if (siafiMatches.length > 0) {
                total_pago = siafiMatches.filter(s => s.confirmado).reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
                
                if (total_pago >= valor_devido && valor_devido > 0) {
                  situacao_debito = "Pago";
                } else if (total_pago > 0 && total_pago < valor_devido) {
                  situacao_debito = "Parcialmente pago";
                } else {
                  situacao_debito = "Em aberto";
                }
              }
            }
          } catch (dbErr) {
            console.error("[SIAFI/GovHub Search] erro SQL:", dbErr);
          }
        }
  
        dossieResponsaveis.push({
          ...resp,
          situacao_debito,
          total_pago,
          siafiEncontrados: siafiMatches
        });
      }
      
      if (client) client.release();
  
      // 5. Build AI Analysis Data and update Postgres
      const newAiData = acordao.ai_analysis_data ? (typeof acordao.ai_analysis_data === 'string' ? JSON.parse(acordao.ai_analysis_data) : acordao.ai_analysis_data) : {};
      
      newAiData.dossieRessarcimento = dossieResponsaveis;
      newAiData.determinacoes = aiResultJson.determinacoes || [];
      newAiData.recomendacoes = aiResultJson.recomendacoes || [];
      newAiData.ha_ressarcimento = aiResultJson.ha_ressarcimento;
  
      let status_monitoramento = acordao.status_monitoramento;
      let observacoes = acordao.observacoes || "";
      const hasPago = dossieResponsaveis.some((r:any) => r.situacao_debito === "Pago");
      if (hasPago) {
        status_monitoramento = "Cumprido";
        observacoes = "[Atualização Automática IA]: Ressarcimento integral identificado nos dados do SIAFI.";
      }
  
      await pool.query(`
        UPDATE acordaos 
        SET ai_analysis_data = $1, status_monitoramento = $2, observacoes = $3 
        WHERE key = $4
      `, [JSON.stringify(newAiData), status_monitoramento, observacoes, key]);
  
      return res.json({
        success: true,
        dossie: dossieResponsaveis,
        checklist: aiResultJson.checklist || null
      });

    } catch (error: any) {
      console.error("[AI Dossie] Erro:", error);
      return res.status(500).json({ error: "Falha na análise de inteligência artificial.", details: error.message });
    }
  });
