import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.js';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
});

async function test() {
  try {
    const cachePath = path.join(process.cwd(), 'data', 'tcu', 'acordaos', 'cache-acordao-completo-2023.csv');
    const alvos = [{ numAcordao: '14068', anoAcordao: '2023', colegiado: 'Primeira Câmara' }];
    
    console.log('Fetching from CSV...');
    const teoresMap = await getComplementaryDataBulk(cachePath, alvos);
    const compData = teoresMap.get('14068-PRIMEIRACAMARA');
    
    console.log('compData acordao length:', compData?.acordao?.length);
    
    if (compData) {
      console.log('Updating DB...');
      const res = await pool.query(
        `UPDATE tcu_acordaos SET acordao = $1 WHERE num_acordao = 14068 AND ano_acordao = 2023 RETURNING key, length(acordao)`,
        [compData.acordao]
      );
      console.log('DB Update result:', res.rows);
    } else {
      console.log('compData is null!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
