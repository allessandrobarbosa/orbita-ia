import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

async function test() {
  const result = await getComplementaryDataBulk(2023, new Set(["13905"]));
  console.log("Result size:", result.size);
  if (result.has("13905")) {
    console.log("Found 13905! Acordao length:", result.get("13905")?.acordao?.length);
    console.log("Acordao extract:", result.get("13905")?.acordao?.substring(0, 100));
  } else {
    console.log("13905 NOT FOUND!");
  }
}

test();
