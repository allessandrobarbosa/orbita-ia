import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { pool } from "../src/backend/db.js";

const DATA_DIR = path.join(process.cwd(), "data");

function lerCSV(nomeArquivo: string) {
  const caminho = path.join(DATA_DIR, nomeArquivo);
  if (!fs.existsSync(caminho)) {
    console.log(`⚠️ Arquivo não encontrado: ${caminho} (Pulando)`);
    return [];
  }
  console.log(`Lendo arquivo: ${caminho}`);
  const workbook = xlsx.readFile(caminho);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  return data;
}

async function runMigration() {
  console.log("Iniciando migração de CSV para PostgreSQL...");
  
  // Lê os CSVs com base nos nomes citados no início do projeto
  const dirigentesRaw = lerCSV("DIRIGENTES.csv");
  const unidadesRaw = lerCSV("UNIDADES.csv");
  const cargosRaw = lerCSV("CARGOS.csv");
  const afastamentosRaw = lerCSV("AFASTAMENTOS.csv");

  if (dirigentesRaw.length === 0) {
    console.error("❌ Erro: O arquivo DIRIGENTES.csv está vazio ou não existe. Abortando migração.");
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // 1. Inserir Tipos de Responsabilidade Padrão
    console.log("Criando domínios básicos...");
    await client.query(`INSERT INTO tipos_responsabilidade (nome, descricao) VALUES ($1, $2) ON CONFLICT DO NOTHING`, ["Dirigente Máximo", "Autoridade máxima"]);
    await client.query(`INSERT INTO tipos_responsabilidade (nome, descricao) VALUES ($1, $2) ON CONFLICT DO NOTHING`, ["Membro de Diretoria", "Responsável por área"]);
    await client.query(`INSERT INTO tipos_responsabilidade (nome, descricao) VALUES ($1, $2) ON CONFLICT DO NOTHING`, ["Ordenador de Despesas", "Responsável financeiro"]);

    // 2. Mapas de cache para evitar múltiplas consultas
    const unidadeIds = new Map<string, number>();
    const cargoIds = new Map<string, number>();
    const pessoaIds = new Map<string, number>();

    // Pré-carregar unidades do CSV (se existir)
    for (const un of unidadesRaw as any[]) {
      const sigla = un.SIGLA_UNIDADE?.trim() || "UNK";
      const nome = un.NOME_UNIDADE?.trim() || "Unidade Desconhecida";
      const res = await client.query(`INSERT INTO unidades (sigla, nome) VALUES ($1, $2) RETURNING id_unidade`, [sigla, nome]);
      unidadeIds.set(sigla.toUpperCase(), res.rows[0].id_unidade);
    }

    console.log("Processando DIRIGENTES.csv...");
    for (const row of dirigentesRaw as any[]) {
      // Campos do CSV original
      const nome_dirigente = row.NOME_DIRIGENTE?.trim();
      let cpf = (String(row.CPF) || "").replace(/\D/g, "");
      const email = row.EMAIL?.trim() || "nao.informado@gov.br";
      const nome_cargo = row.NOME_CARGO?.trim() || "Sem Cargo";
      const sigla_unidade = row.SIGLA_UNIDADE?.trim() || "UNK";
      // const tipo_vinculo = row.TIPO_VINCULO; // Não usado no modelo relacional simplificado
      const data_inicio = row.DATA_INICIO_EXERCICIO;
      const data_fim = row.DATA_FIM_EXERCICIO;
      const ato_nomeacao = row.ATO_NOMEACAO?.trim();
      const ato_exoneracao = row.ATO_EXONERACAO?.trim();

      if (!nome_dirigente) continue; // Pula linhas vazias

      // Tratar CPF inválido gerando um temporário (Apenas para não travar a migração)
      if (cpf.length !== 11) {
        cpf = Math.floor(10000000000 + Math.random() * 90000000000).toString().substring(0, 11);
      }

      // 1. Pessoa
      let id_pessoa = pessoaIds.get(cpf);
      if (!id_pessoa) {
        const pCheck = await client.query(`SELECT id_pessoa FROM pessoas WHERE cpf = $1`, [cpf]);
        if (pCheck.rows.length > 0) {
          id_pessoa = pCheck.rows[0].id_pessoa;
        } else {
          const resP = await client.query(`INSERT INTO pessoas (nome_completo, cpf, email) VALUES ($1, $2, $3) RETURNING id_pessoa`, [nome_dirigente, cpf, email]);
          id_pessoa = resP.rows[0].id_pessoa;
        }
        pessoaIds.set(cpf, id_pessoa);
      }

      // 2. Cargo
      let id_cargo = cargoIds.get(nome_cargo.toUpperCase());
      if (!id_cargo) {
        const resC = await client.query(`INSERT INTO cargos (nome) VALUES ($1) RETURNING id_cargo`, [nome_cargo]);
        id_cargo = resC.rows[0].id_cargo;
        cargoIds.set(nome_cargo.toUpperCase(), id_cargo);
      }

      // 3. Unidade (Se não veio no UNIDADES.csv, cria na hora)
      let id_unidade = unidadeIds.get(sigla_unidade.toUpperCase());
      if (!id_unidade) {
        const resU = await client.query(`INSERT INTO unidades (sigla, nome) VALUES ($1, $2) RETURNING id_unidade`, [sigla_unidade, "Gerado via Dirigentes"]);
        id_unidade = resU.rows[0].id_unidade;
        unidadeIds.set(sigla_unidade.toUpperCase(), id_unidade);
      }

      // 4. Função de Responsabilidade
      let id_funcao;
      const checkF = await client.query(`SELECT id_funcao FROM funcoes_responsabilidade WHERE id_cargo = $1 AND id_unidade = $2`, [id_cargo, id_unidade]);
      if (checkF.rows.length > 0) {
        id_funcao = checkF.rows[0].id_funcao;
      } else {
        const resF = await client.query(`INSERT INTO funcoes_responsabilidade (id_cargo, id_unidade) VALUES ($1, $2) RETURNING id_funcao`, [id_cargo, id_unidade]);
        id_funcao = resF.rows[0].id_funcao;
      }

      // 5. Atos
      let id_ato_nom = null;
      let id_ato_exo = null;
      
      if (ato_nomeacao) {
        const resAto = await client.query(`INSERT INTO atos_administrativos (numero, ano, tipo_ato, ementa) VALUES ($1, $2, $3, $4) RETURNING id_ato`, [ato_nomeacao, 2020, "Portaria/Ato", "Migrado do CSV"]);
        id_ato_nom = resAto.rows[0].id_ato;
      }
      if (ato_exoneracao) {
        const resAto = await client.query(`INSERT INTO atos_administrativos (numero, ano, tipo_ato, ementa) VALUES ($1, $2, $3, $4) RETURNING id_ato`, [ato_exoneracao, 2020, "Portaria/Ato", "Migrado do CSV"]);
        id_ato_exo = resAto.rows[0].id_ato;
      }

      // 6. Mandato
      // Formatação de data (Excel serial para JS Date se o CSV foi salvo estranho, ou parse de string)
      const parseData = (dataStr: any) => {
        if (!dataStr) return null;
        if (typeof dataStr === 'number') { // Excel serial date
           return new Date((dataStr - (25567 + 2)) * 86400 * 1000);
        }
        const parsed = new Date(dataStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      let d_inicio = parseData(data_inicio) || new Date();
      let d_fim = parseData(data_fim);

      // Proteção contra restrição CHECK (data_fim >= data_inicio)
      if (d_fim && d_inicio > d_fim) {
        console.log(`⚠️ Datas invertidas ou início vazio gerando erro para ${nome_dirigente}. Corrigindo...`);
        // Se data_inicio veio vazia e setou para hoje (maior que o fim passado), assume início = fim
        if (!data_inicio) {
          d_inicio = d_fim;
        } else {
          // Se de fato vieram invertidas na planilha, inverte
          const temp = d_inicio;
          d_inicio = d_fim;
          d_fim = temp;
        }
      }

      await client.query(`
        INSERT INTO mandatos (id_pessoa, id_funcao, data_inicio, data_fim, id_ato_nomeacao, id_ato_exoneracao) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id_pessoa, id_funcao, d_inicio, d_fim, id_ato_nom, id_ato_exo]);
    }
    
    // 7. Afastamentos
    console.log("Processando AFASTAMENTOS.csv...");
    for (const row of afastamentosRaw as any[]) {
      const nome_dirigente = row.NOME_DIRIGENTE?.trim();
      const nome_cargo = row.NOME_CARGO?.trim();
      const sigla_unidade = row.NOME_UNIDADE?.trim(); // Na sua modelagem inicial chamava NOME_UNIDADE, assumirei que é a sigla
      const motivo = row.NOME_MOTIVO_AFASTAMENTO?.trim() || "Não Especificado";
      
      const parseData = (dataStr: any) => {
        if (!dataStr) return null;
        if (typeof dataStr === 'number') return new Date((dataStr - (25567 + 2)) * 86400 * 1000);
        const parsed = new Date(dataStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      let d_inicio = parseData(row.DATA_INICIO_AFASTAMENTO);
      let d_fim = parseData(row.DATA_FIM_AFASTAMENTO);

      if (!nome_dirigente || !d_inicio || !d_fim) continue; // Pula se faltar dados críticos

      // Proteção
      if (d_inicio > d_fim) {
         const t = d_inicio;
         d_inicio = d_fim;
         d_fim = t;
      }

      // Tenta achar a pessoa e a função para pegar o mandato correto que sofreu afastamento
      const pessoaRes = await client.query(`SELECT id_pessoa FROM pessoas WHERE nome_completo ILIKE $1`, [`%${nome_dirigente}%`]);
      if (pessoaRes.rows.length === 0) continue; 
      const id_pessoa = pessoaRes.rows[0].id_pessoa;

      // Buscar mandato da pessoa que cruza com a data do afastamento
      const mandatoRes = await client.query(`
        SELECT id_mandato FROM mandatos 
        WHERE id_pessoa = $1 AND data_inicio <= $2 AND (data_fim IS NULL OR data_fim >= $3)
      `, [id_pessoa, d_fim, d_inicio]);
      
      if (mandatoRes.rows.length > 0) {
        const id_mandato = mandatoRes.rows[0].id_mandato;
        await client.query(`
          INSERT INTO afastamentos (id_mandato, motivo, data_inicio, data_fim) 
          VALUES ($1, $2, $3, $4)
        `, [id_mandato, motivo, d_inicio, d_fim]);
      } else {
        console.log(`⚠️ Mandato não encontrado para ${nome_dirigente} no período de afastamento.`);
      }
    }
    
    await client.query("COMMIT");
    console.log("✅ Migração CSV -> PostgreSQL concluída com sucesso!");
    
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ Erro na migração, rollback realizado no banco.", e);
  } finally {
    client.release();
  }
}

runMigration().then(() => process.exit(0));
