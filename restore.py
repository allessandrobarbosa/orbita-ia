with open('server.ts', 'r', encoding='utf-8') as f:
    text = f.read()

with open('scratch_ai.ts', 'r', encoding='utf-8') as f:
    new_ai = f.read()

with open('scratch_route.ts', 'r', encoding='utf-8') as f:
    new_route = f.read()

import re

# Replace the original extractTcuDataWithAi
ai_match = re.search(r'(async function extractTcuDataWithAi\(acordaoText: string\) \{.*?\n\})', text, re.DOTALL)
if ai_match:
    text = text.replace(ai_match.group(1), new_ai)
else:
    print('Failed to find original extractTcuDataWithAi')

# Replace the original analisar-ressarcimento
route_match = re.search(r'(  app\.post\("/api/acordaos/:key/analisar-ressarcimento", async \(req, res\) => \{.*?    \} catch \(error: any\) \{\n      console\.error\("\[AI Dossie\] Erro:", error\);\n      return res\.status\(500\)\.json\(\{ error: "Falha na aná.*?" \}\);\n    \}\n  \}\);)', text, re.DOTALL)
if route_match:
    text = text.replace(route_match.group(1), new_route)
else:
    print('Failed to find original analisar-ressarcimento')

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Success replacing!')
