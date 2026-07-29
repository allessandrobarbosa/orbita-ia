import fs from 'fs';
import path from 'path';

const file = path.join("data/tcu/acordaos", "Acórdãos2026.csv");
const lines = fs.readFileSync(file, 'utf8').split('\n');

for (const line of lines) {
  if (line.includes("1265/2026")) {
    console.log(line);
  }
}
