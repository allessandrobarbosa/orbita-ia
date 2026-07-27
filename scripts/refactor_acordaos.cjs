const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The snippet to replace for UPDATE
const updateOld = `app.post("/api/acordaos/update", (req, res) => {
    const db = loadDatabase();
    const updated = req.body as AcordaoDemand;
    const index = db.acordaos.findIndex((x: any) => x.KEY === updated.KEY);

    if (index >= 0) {
      db.acordaos[index] = { ...db.acordaos[index], ...updated, ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR") };
      saveDatabase(db);
      res.json({ success: true, item: db.acordaos[index] });
    } else {
      res.status(404).json({ error: "Acórdão não encontrado no repositório." });
    }
  });`;

const updateNew = `app.post("/api/acordaos/update", async (req, res) => {
    const updated = req.body as AcordaoDemand;
    try {
      const result = await pool.query(
        "UPDATE acordaos SET titulo=$1, numacordao=$2, anoacordao=$3, numata=$4, colegiado=$5, datasessao=$6, situacao=$7, proc=$8, acordaosrelacionados=$9, tipoprocesso=$10, interessados=$11, entidade=$12, relator=$13, unidadetecnica=$14, assunto=$15, sumario=$16, acordao=$17, decisao=$18, status_monitoramento=$19, responsavel_interno=$20, prazo_limite=$21, observacoes=$22, ultima_atualizacao=$23 WHERE key=$24 RETURNING *",
        [updated.TITULO, updated.NUMACORDAO, updated.ANOACORDAO, updated.NUMATA, updated.COLEGIADO, updated.DATASESSAO, updated.SITUACAO, updated.PROC, updated.ACORDAOSRELACIONADOS, updated.TIPOPROCESSO, updated.INTERESSADOS, updated.ENTIDADE, updated.RELATOR, updated.UNIDADETECNICA, updated.ASSUNTO, updated.SUMARIO, updated.ACORDAO, updated.DECISAO, updated.STATUS_MONITORAMENTO, updated.RESPONSAVEL_INTERNO, updated.PRAZO_LIMITE, updated.OBSERVACOES, new Date().toLocaleString("pt-BR"), updated.KEY]
      );
      if (result.rowCount > 0) {
        res.json({ success: true, item: result.rows[0] });
      } else {
        res.status(404).json({ error: "Acórdão não encontrado no Postgres." });
      }
    } catch (e) {
      res.status(500).json({ error: "Erro" });
    }
  });`;

content = content.replace(updateOld, updateNew);

// Replace DELETE
const deleteOld = `app.delete("/api/acordaos/:key", (req, res) => {
    const db = loadDatabase();
    const key = req.params.key;
    db.acordaos = db.acordaos.filter((x: any) => x.KEY !== key);
    saveDatabase(db);
    res.json({ success: true });
  });`;

const deleteNew = `app.delete("/api/acordaos/:key", async (req, res) => {
    try {
      await pool.query("DELETE FROM acordaos WHERE key=$1", [req.params.key]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro" });
    }
  });`;

content = content.replace(deleteOld, deleteNew);

fs.writeFileSync('server.ts', content);
console.log("Replaced update and delete endpoints in server.ts");
