const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. <table> tag that has a className
  content = content.replace(/<table\s+className=(["'])(.*?)\1([^>]*)>/g, (match, quote, classes, rest) => {
    return `<table className="w-full text-left border-collapse text-sm text-slate-800"${rest}>`;
  });

  // 2. <thead className="..."> -> <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244]">
  content = content.replace(/<thead\s+className=(["'])(.*?)\1([^>]*)>/g, (match, quote, classes, rest) => {
    return `<thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244]"${rest}>`;
  });

  // 3. <tr> inside <thead> with classNames
  content = content.replace(/<tr\s+className=(["'])(.*?)\1([^>]*)>/g, (match, quote, classes, rest) => {
    if (classes.includes('uppercase') || classes.includes('text-slate-500') || classes.includes('bg-slate-50')) {
      let newClasses = classes.replace(/bg-[a-zA-Z0-9\/\[\]#-]+/g, '')
                              .replace(/text-[a-zA-Z0-9\/\[\]#-]+/g, '')
                              .replace(/uppercase|tracking-wider/g, '')
                              .replace(/border-[a-zA-Z0-9\/\[\]#-]+/g, '')
                              .replace(/\s+/g, ' ').trim();
      return `<tr className="${newClasses} border-b border-[#002244]"${rest}>`;
    }
    // For normal body rows, let's keep even:bg-slate-50 or add it
    if (classes.includes('hover:bg') && !classes.includes('even:bg')) {
       return `<tr className="${classes} even:bg-slate-50/50"${rest}>`;
    }
    return match;
  });

  // 4. <th> tags
  content = content.replace(/<th\s+className=(["'])(.*?)\1([^>]*)>/g, (match, quote, classes, rest) => {
    let newClasses = classes.replace(/text-\[.*?\]|text-[a-z0-9]+/g, '')
                            .replace(/bg-[a-zA-Z0-9\/\[\]#-]+/g, '')
                            .replace(/hover:bg-[a-zA-Z0-9\/\[\]#-]+/g, '')
                            .replace(/uppercase|tracking-wider/g, '')
                            .replace(/font-[a-zA-Z0-9]+/g, '') 
                            .replace(/p-\d+(\.\d+)?/g, '') // remove paddings
                            .replace(/\s+/g, ' ').trim();
    
    newClasses = `p-4 font-semibold hover:bg-[#002244] transition-colors ${newClasses}`.trim();
    return `<th className="${newClasses}"${rest}>`;
  });

  // 5. <td> tags
  content = content.replace(/<td\s+className=(["'])(.*?)\1([^>]*)>/g, (match, quote, classes, rest) => {
     let newClasses = classes.replace(/text-\[.*?\]/g, '')
                             .replace(/p-\d+(\.\d+)?/g, '') 
                             .replace(/\s+/g, ' ').trim();
     newClasses = `p-4 align-middle ${newClasses}`.trim();
     return `<td className="${newClasses}"${rest}>`;
  });

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    replacements.push(file);
  }
}
console.log("Updated files:", replacements.join(", "));
