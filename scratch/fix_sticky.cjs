const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Move sticky top-0 z-10 from tr to thead
  content = content.replace(/<thead className="([^"]+)">\s*<tr className="([^"]*)sticky top-0 z-10([^"]*)">/g, (match, theadClasses, pre, post) => {
    if (!theadClasses.includes('sticky')) {
      theadClasses += " sticky top-0 z-10";
    }
    const newTrClasses = (pre + post).replace(/\s+/g, ' ').trim();
    return `<thead className="${theadClasses}">\n            <tr${newTrClasses ? ` className="${newTrClasses}"` : ''}>`;
  });

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    replacements.push(file);
  }
}
console.log("Fixed sticky in:", replacements.join(", "));
