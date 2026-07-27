const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Strip out the injected loadDatabase and saveDatabase functions
content = content.replace(/function loadDatabase\(\) \{[\s\S]*?\}/, '');
content = content.replace(/function saveDatabase\(data: any\) \{[\s\S]*?\}/, '');

// Replace all loadDatabase() calls with { users: mockUsers }
content = content.replace(/const data = loadDatabase\(\);/g, 'const data = { users: mockUsers };');
content = content.replace(/loadDatabase\(\)/g, '{ users: mockUsers }');
// Replace all saveDatabase(data) calls with mockUsers = data.users
content = content.replace(/saveDatabase\(data\);/g, 'if (data.users) mockUsers = data.users;');

fs.writeFileSync('server.ts', content);
console.log("Replaced loadDatabase calls with direct mockUsers reference.");
