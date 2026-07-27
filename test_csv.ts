import fs from 'fs';
import path from 'path';
import { parseCsvStream } from './src/backend/utils/tcuUtils.js';

async function run() {
  const files = fs.readdirSync('./data/tcu');
  const file = files.find(f => f.includes('2026'));
  const res = await parseCsvStream(path.join('./data/tcu', file));
  console.log(JSON.stringify(res[0], null, 2));
}

run();
