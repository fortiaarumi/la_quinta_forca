import os
import json
import time
import requests

API_KEY = "POSA_LA_TEVA_API_KEY_AQUI"
URL = "https://api.groq.com/openai/v1/chat/completions"

def process_batch(batch):
    prompt = """Ets un historiador expert. Tinc un llistat d'esdeveniments històrics. 
Per a cada un, has de retornar el mateix objecte però afegint:
1. `t`: el títol traduït al CATALÀ.
2. `d`: una breu descripció (1 o 2 frases) en CATALÀ explicant què va passar.
3. `lat`: la latitud exacta on va passar (float).
4. `lng`: la longitud exacta on va passar (float).
Respecta el camp `f` (filename) que et passo, és la clau. No el modifiquis.
Retorna STRICTAMENT UN ARRAY DE JSON, SENSE CAP TEXT AL VOLTANT NI MARKDOWN.

Dades:
""" + json.dumps([{"f": x["filename"], "t": x["title"]} for x in batch])
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1
    }
    
    for _ in range(3):
        try:
            resp = requests.post(URL, headers=headers, json=payload, timeout=30)
            data = resp.json()
            if "error" in data:
                print("Error de API:", data["error"])
                time.sleep(10)
                continue
                
            content = data["choices"][0]["message"]["content"]
            
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            
            parsed = json.loads(content)
            if len(parsed) == len(batch):
                return parsed
            else:
                print(f"Error de longitud: {len(parsed)} vs {len(batch)}")
        except Exception as e:
            print("Error en petició:", e)
        time.sleep(2)
    return batch

def main():
    with open("public/historic/_metadata.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Processar només els que tenen lat=0 i lng=0
    to_process = [x for x in data if x.get("lat", 0.0) == 0.0 and x.get("lng", 0.0) == 0.0]
    
    if not to_process:
        print("Tot està processat!")
        return

    print(f"Falten {len(to_process)} elements per traduir.")
    
    results_map = {}
    batch_size = 20
    for i in range(0, len(to_process), batch_size):
        batch = to_process[i:i+batch_size]
        print(f"Processant lot {i//batch_size + 1}/{len(to_process)//batch_size + 1}...")
        res = process_batch(batch)
        
        for nov in res:
            results_map[nov.get("f", nov.get("filename"))] = nov
            
    # Update data
    for i, item in enumerate(data):
        if item["filename"] in results_map:
            nov = results_map[item["filename"]]
            if "lat" in nov and nov["lat"] != 0.0:
                data[i]["title"] = nov.get("t", item["title"])
                data[i]["lat"] = float(nov.get("lat", 0.0))
                data[i]["lng"] = float(nov.get("lng", 0.0))
                data[i]["description"] = nov.get("d", "")
            
    with open("public/historic/_metadata.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("Metadades actualitzades!")
    
    # Ara reconstruïm src/lib/gameUtils.ts
    print("Generant gameUtils.ts...")
    ts_content = "export interface HistoricLocation {\n  filename: string;\n  title: string;\n  year: number;\n  lat: number;\n  lng: number;\n  description: string;\n}\n\nexport const HISTORIC_LOCATIONS: HistoricLocation[] = [\n"
    
    for item in data:
        desc = item.get('description', '').replace('"', '\\"').replace('\n', ' ')
        title = item['title'].replace('"', '\\"')
        ts_content += f"""  {{
    filename: "{item['filename']}",
    title: "{title}",
    year: {item['year']},
    lat: {item['lat']},
    lng: {item['lng']},
    description: "{desc}"
  }},
"""
    ts_content += "];\n"
    
    with open("src/lib/gameUtils.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)
        
    print("gameUtils.ts generat correctament.")

if __name__ == "__main__":
    main()
