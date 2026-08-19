import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';

async function testHeaders() {
  const url = "https://portaldatransparencia.gov.br/download-de-dados/viagens/2024";
  console.log("Fetching URL...");
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const zip = new AdmZip(Buffer.from(buf));
  
  const viagemEntry = zip.getEntries().find(e => e.entryName.toLowerCase().includes('viagem.csv'));
  if (!viagemEntry) {
    console.log("No Viagem.csv found");
    return;
  }
  
  const csvData = viagemEntry.getData().toString('latin1');
  const records = parse(csvData, {
    columns: false,
    skip_empty_lines: true,
    delimiter: ';',
    trim: true,
    to_line: 2 // Only read header and first line
  });
  
  console.log("Headers:", records[0]);
  console.log("Primeira linha:", records[1]);
}

testHeaders().catch(console.error);
