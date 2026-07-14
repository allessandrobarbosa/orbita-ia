with open('server.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re
match = re.search(r'import \{[\s\S]*?getSiapeAndEmail\s*\n\}\s*from\s*\"\./src/backend/db\";', text)

if match:
    original = match.group(0)
    new_str = original.replace('getSiapeAndEmail', 'getSiapeAndEmail,\n  pool')
    text = text.replace(original, new_str)
    with open('server.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Added pool to imports')
else:
    print('Could not find the import block')
