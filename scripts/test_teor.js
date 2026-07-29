import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

function limparTeor(rawTeor) {
  if (!rawTeor) return '';
  let text = String(rawTeor);
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '');
  text = text.replace(/<[^>]*>?/gm, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  return text.trim();
}

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT key, length(acordao) as len, acordao FROM tcu_acordaos WHERE length(acordao) > 0 LIMIT 1;');
    if (res.rows.length === 0) {
      console.log("Nenhum acórdão encontrado no banco.");
      return;
    }
    const raw = res.rows[0].acordao;
    const clean = limparTeor(raw);
    console.log('Key:', res.rows[0].key);
    console.log('Raw length:', raw.length);
    console.log('Clean length:', clean.length);
    console.log('First 100 chars of clean text:', clean.substring(0, 100));
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
