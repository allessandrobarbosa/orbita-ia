import fs from 'fs';
import path from 'path';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

async function testNullByte() {
  const mapForYear = await getComplementaryDataBulk(2026, new Set(["1265", "4092"]));
  
  const d1 = mapForYear.get("1265");
  if (d1 && d1.acordao) {
    console.log("1265 first 10 chars:", JSON.stringify(d1.acordao.substring(0, 10)));
    console.log("Has null byte?", d1.acordao.includes('\x00'));
  } else {
    console.log("1265 NOT FOUND");
  }

  const d2 = mapForYear.get("4092");
  if (d2 && d2.acordao) {
    console.log("4092 first 10 chars:", JSON.stringify(d2.acordao.substring(0, 10)));
    console.log("Has null byte?", d2.acordao.includes('\x00'));
  } else {
    console.log("4092 NOT FOUND");
  }
}

testNullByte();
