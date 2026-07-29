import { pool } from './src/backend/db.js';

function limparTeor(rawTeor) {
  if (!rawTeor) return '';
  let text = rawTeor;
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
  const res = await pool.query('SELECT key, acordao FROM tcu_acordaos WHERE length(acordao) > 0 LIMIT 1;');
  const raw = res.rows[0].acordao;
  const clean = limparTeor(raw);
  console.log('Raw len:', raw.length, 'Clean len:', clean.length);
  await pool.end();
}

check();
