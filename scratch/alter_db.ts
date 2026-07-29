import { pool } from '../src/backend/db.js';

async function main() {
  const columnsToText = [
    'situacao',
    'tipo_processo',
    'status_monitoramento',
    'num_ata',
    'colegiado',
    'proc',
    'acordaos_relacionados',
    'interessados',
    'entidade',
    'unidade_tecnica',
    'assunto',
    'sumario',
    'decisao',
    'relator',
    'titulo',
    'data_sessao'
  ];

  try {
    for (const col of columnsToText) {
      console.log(`Altering column ${col} to TEXT...`);
      try {
        await pool.query(`ALTER TABLE tcu_acordaos ALTER COLUMN ${col} TYPE TEXT`);
      } catch (err: any) {
        console.log(`Could not alter ${col}:`, err.message);
      }
    }
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
