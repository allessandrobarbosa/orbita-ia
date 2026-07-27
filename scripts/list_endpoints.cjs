const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.(get|post|put|delete)\(\s*["'](\/api\/[^"']+)["']/g;
let match;
const endpoints = [];

while ((match = regex.exec(content)) !== null) {
  endpoints.push(`${match[1].toUpperCase()} ${match[2]}`);
}

console.log("Remaining API endpoints in server.ts:");
console.log(endpoints.join("\n"));
