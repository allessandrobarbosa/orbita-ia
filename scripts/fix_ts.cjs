const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Remove connect-pg-simple import
content = content.replace(/import pgSession from 'connect-pg-simple';\n/, '');

// 2. Remove duplicate cguRoutes
content = content.replace(/import cguRoutes from "\.\/src\/backend\/routes\/cguRoutes\.js";\r?\nimport cguRoutes from "\.\/src\/backend\/routes\/cguRoutes\.js";/, 'import cguRoutes from "./src/backend/routes/cguRoutes.js";');

// 3. Add explicit any[] typing to mockUsers to fix Property 'allowedModules' does not exist error
content = content.replace(/let mockUsers = \[\.\.\.Seeds\.SEED_PROFILES\];/, 'let mockUsers: any[] = [...Seeds.SEED_PROFILES];');

fs.writeFileSync('server.ts', content);
console.log("Fixed typescript errors!");
