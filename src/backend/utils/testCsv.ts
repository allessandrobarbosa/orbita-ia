import { getComplementaryDataBulk } from "./tcuCsvParser";

getComplementaryDataBulk(2022, new Set(["7853"])).then(res => {
  console.log("Found:", res.size);
  if (res.has("7853")) {
    console.log("Teor Length:", res.get("7853")?.acordao?.length);
    console.log("Teor snippet:", res.get("7853")?.acordao?.substring(0, 100));
  } else {
    console.log("MISSING");
  }
}).catch(console.error);
