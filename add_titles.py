import re

with open('src/lib/gameUtils.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_estadis = False
in_monuments = False

for line in lines:
    if 'export const ESTADIS_FUTBOL = [' in line:
        in_estadis = True
        new_lines.append(line)
        continue
    elif '];' in line and in_estadis:
        in_estadis = False
        new_lines.append(line)
        continue
        
    if 'export const MONUMENTS_CULTURALS = [' in line:
        in_monuments = True
        new_lines.append(line)
        continue
    elif '];' in line and in_monuments:
        in_monuments = False
        new_lines.append(line)
        continue

    if in_estadis or in_monuments:
        # Match `{ lat: ..., lng: ... }, // Some Title`
        m = re.search(r'(\{.*?\}),\s*//\s*(.*)', line)
        if m:
            obj_str = m.group(1)
            title = m.group(2).strip().replace('"', '\\"')
            # remove closing brace temporarily to append title
            obj_str = obj_str.replace('}', f', title: "{title}" }}')
            new_line = line[:m.start()] + obj_str + ',' + '\n'
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('src/lib/gameUtils.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("gameUtils.ts actualitzat amb els títols.")
