with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

ai_start = -1
ai_end = -1
for i, line in enumerate(lines):
    if line.startswith('async function extractTcuDataWithAi('):
        ai_start = i
    elif ai_start != -1 and line == '}\n':
        ai_end = i
        break

route_start = -1
route_end = -1
for i, line in enumerate(lines):
    if line.startswith('  app.post("/api/acordaos/:key/analisar-ressarcimento"'):
        route_start = i
    elif route_start != -1 and line == '  });\n':
        route_end = i
        break

if ai_start != -1 and route_start != -1:
    with open('scratch_ai.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines[ai_start:ai_end+1])
    with open('scratch_route.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines[route_start:route_end+1])
    print('Success!')
else:
    print('Failed to find', ai_start, route_start)
