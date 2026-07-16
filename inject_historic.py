with open('historic_temp.ts', 'r', encoding='utf-8') as f:
    new_hist = f.read()

start_idx = new_hist.find('export interface HistoricLocation')
if start_idx == -1:
    start_idx = new_hist.find('export const HISTORIC_LOCATIONS')

new_content = new_hist[start_idx:]

with open('src/lib/gameUtils.ts', 'a', encoding='utf-8') as f:
    f.write('\n\n' + new_content)
    
print("Afegit a gameUtils.ts!")
