import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to inject the mock functions right after the imports.
# Let's find "async function startServer() {"
injection = """
import * as Seeds from "./src/data/seed_db";

let mockUsers = [...Seeds.SEED_PROFILES];

function loadDatabase() {
  return { users: mockUsers };
}

function saveDatabase(data: any) {
  if (data && data.users) {
    mockUsers = data.users;
  }
}

"""

if 'function loadDatabase()' not in content:
    content = content.replace('async function startServer() {', injection + 'async function startServer() {')

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected loadDatabase and saveDatabase polyfills for auth routes.")
