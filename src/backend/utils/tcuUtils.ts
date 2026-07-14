import fs from "fs";
import https from "https";
import readline from "readline";
import path from "path";

// TCU API returns ISO-8859-1/Windows-1252 text that Node decodes as Unicode codepoints.
const WIN1252_MAP: Record<number, number> = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
  0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
  0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
  0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
  0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
  0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};

const REVERSE_WIN1252: Record<number, number> = {};
for (const [byteVal, uniCode] of Object.entries(WIN1252_MAP)) {
  REVERSE_WIN1252[uniCode] = parseInt(byteVal);
}

export function fixMojibake(text: string | undefined | null): string {
  if (!text) return "";
  try {
    const chars = [...text];
    const bytes: number[] = [];
    let hasMojibake = false;

    for (const ch of chars) {
      const code = ch.codePointAt(0)!;
      if (code >= 0x80 && code <= 0xFF) {
        bytes.push(code);
        hasMojibake = true;
      } else if (REVERSE_WIN1252[code] !== undefined) {
        bytes.push(REVERSE_WIN1252[code]);
        hasMojibake = true;
      } else if (code > 0xFF) {
        const enc = new TextEncoder().encode(ch);
        for (const b of enc) bytes.push(b);
      } else {
        bytes.push(code);
      }
    }

    if (!hasMojibake) return text;
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
    if (decoded && !decoded.includes("\uFFFD")) return decoded;
    return text;
  } catch {
    return text;
  }
}

export function fixDocEncoding(doc: any): any {
  if (!doc || typeof doc !== "object") return doc;
  const fixed: any = {};
  for (const [key, val] of Object.entries(doc)) {
    if (typeof val === "string") {
      fixed[key] = fixMojibake(val);
    } else {
      fixed[key] = val;
    }
  }
  return fixed;
}

export function stripHtmlToText(html: string): string {
  if (!html) return "";
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p\b[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<div\b[^>]*>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/\n\s*\n/g, "\n\n");
  text = text.replace(/[ \t]+/g, " ");
  return text.trim();
}

export function cleanHtmlText(htmlContent: string): string {
  if (!htmlContent) return "";
  let text = htmlContent;
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&[a-z]+;/gi, " ");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}

export function extractDocumentText(docHtml: string): string {
  return cleanHtmlText(docHtml);
}

export async function downloadTempCsv(url: string, tempPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tempPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(tempPath, () => {});
        return reject(new Error(`Failed to download CSV, status code: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(tempPath, () => {});
      reject(err);
    });
  });
}

export function parseCsvStream(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    let headers: string[] = [];
    let isFirstLine = true;

    const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    rl.on("line", (line) => {
      if (!line.trim()) return;

      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
      let values = line.split(regex);
      values = values.map(v => {
        if (v.startsWith('"') && v.endsWith('"')) {
          v = v.substring(1, v.length - 1).replace(/""/g, '"');
        }
        return v.trim();
      });

      if (isFirstLine) {
        headers = values.map(h => {
          let clean = h.trim();
          if (clean.charCodeAt(0) === 0xFEFF) {
            clean = clean.substring(1);
          }
          return clean;
        });
        isFirstLine = false;
      } else {
        const obj: any = {};
        headers.forEach((header, index) => {
          if (header) {
            obj[header] = values[index] !== undefined ? values[index] : "";
          }
        });
        results.push(obj);
      }
    });

    rl.on("close", () => resolve(results));
    rl.on("error", (err) => reject(err));
  });
}
