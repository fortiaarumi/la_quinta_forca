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
""" + json.dumps([{"f": x["f"], "t": x["t"]} for x in batch])
    
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
    return batch # Si falla, retorna original

def main():
    with open("all_metadata.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    results = []
    batch_size = 20
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        print(f"Processant lot {i//batch_size + 1}/{len(data)//batch_size + 1}...")
        res = process_batch(batch)
        
        # Mergejar amb les dades originals per no perdre l'any
        for orig, nov in zip(batch, res):
            results.append({
                "filename": orig["f"],
                "title": nov.get("t", orig["t"]),
                "year": orig["y"],
                "lat": float(nov.get("lat", 0.0)),
                "lng": float(nov.get("lng", 0.0)),
                "description": nov.get("d", "")
            })
            
    with open("public/historic/_metadata.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print("Metadades actualitzades a public/historic/_metadata.json!")
    
    # Ara reconstruïm src/lib/gameUtils.ts
    print("Generant gameUtils.ts...")
    ts_content = "export interface HistoricLocation {\n  filename: string;\n  title: string;\n  year: number;\n  lat: number;\n  lng: number;\n  description: string;\n}\n\nexport const HISTORIC_LOCATIONS: HistoricLocation[] = [\n"
    
    for item in results:
        desc = item['description'].replace('"', '\\"').replace('\n', ' ')
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
