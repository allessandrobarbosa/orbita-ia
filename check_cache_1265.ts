import fs from 'fs';
import path from 'path';

async function checkCache() {
  const file = path.join("data/tcu/acordaos", "cache-acordao-completo-2026.csv");
  const content = fs.readFileSync(file, 'latin1');
  const lines = content.split('\n');
  
  let count = 0;
  for (const line of lines) {
    if (line.includes("1265") || line.includes('"1265"')) {
      // Find the first few columns to see if it's our Acórdão
      const p = line.substring(0, 100);
      console.log(`Found 1265. Line starts with: ${p}`);
      count++;
    }
  }
  console.log("Total occurrences of 1265:", count);
}

checkCache();
