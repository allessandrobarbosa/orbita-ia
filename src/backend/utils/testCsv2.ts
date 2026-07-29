import { getInteiroTeorFromCache } from "./tcuCsvParser";

getInteiroTeorFromCache(7853, 2022).then(res => {
  console.log("Inteiro Teor length:", res ? res.length : "null");
}).catch(console.error);
