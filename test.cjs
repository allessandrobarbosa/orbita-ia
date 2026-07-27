const fs = require('fs');
const path = require('path');
const files = fs.readdirSync('./data/tcu');
const file = files.find(f => f.includes('2026'));
const lines = fs.readFileSync(path.join('./data/tcu', file), 'utf8').split('\n');
console.log(lines.slice(0, 3));
