import fs from 'fs';
import path from 'path';

async function checkProcs() {
  const file = path.join("data/tcu/acordaos", "cache-acordao-completo-2026.csv");
  const content = fs.readFileSync(file, 'latin1');
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes("1265/2026") || line.includes('"1265"')) {
      if (line.includes("005.840") || line.includes("014.525")) {
        console.log("MATCH:", line.substring(0, 150));
      }
    }
  }
}

checkProcs();
