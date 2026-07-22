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
    meta_path = "public/historic/_metadata.json"
    with open(meta_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 1. Separar el que ja està traduït del que s'ha de traduir
    to_translate = []
    already_translated = []
    for item in data:
        # Si té descripció i és un string no buit, vol dir que ja està traduït
        if item.get("description", "").strip():
            already_translated.append(item)
        else:
            to_translate.append(item)
            
    results = []
    batch_size = 20
    for i in range(0, len(to_translate), batch_size):
        batch = to_translate[i:i+batch_size]
        print(f"Processant lot {i//batch_size + 1}/{len(to_translate)//batch_size + 1}...")
        
        # Adaptem el batch per al prompt: necessita 'f' (filename) i 't' (títol original a traduir)
        prompt_batch = [{"f": x["filename"], "t": x.get("t", x.get("title", ""))} for x in batch]
        res = process_batch(prompt_batch)
        
        # Mergejar amb les dades originals per no perdre l'any original
        for orig, nov in zip(batch, res):
            results.append({
                "filename": orig["filename"],
                "title": nov.get("t", orig.get("t", orig.get("title", ""))),
                "year": orig.get("year", orig.get("y", 0)),
                "lat": float(nov.get("lat", orig.get("lat", 0.0))),
                "lng": float(nov.get("lng", orig.get("lng", 0.0))),
                "description": nov.get("d", "")
            })
            
    # Combinar-ho tot
    final_data = already_translated + results
            
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
        
    print(f"Metadades actualitzades a {meta_path}! ({len(results)} traduïts)")
    
    # Ara reconstruïm src/lib/gameUtils.ts
    print("Generant gameUtils.ts...")
    
    with open("src/lib/gameUtils.ts", "r", encoding="utf-8") as f:
        old_content = f.read()
        
    start_str = "export const HISTORIC_LOCATIONS"
    start_idx = old_content.find(start_str)
    
    if start_idx != -1:
        # Trobem on s'acaba l'array existent
        end_idx = old_content.find("];", start_idx)
        if end_idx != -1:
            array_content = old_content[start_idx:end_idx]
            
            # Només afegim aquells que no existeixen ja en el text de l'array
            new_items_ts = ""
            for item in results:
                # Comprovem si el fitxer ja està mencionat al codi font existent
                if f'filename: "{item["filename"]}"' not in array_content:
                    desc = item['description'].replace('"', '\\"').replace('\n', ' ')
                    title = item['title'].replace('"', '\\"')
                    new_items_ts += f"""  {{
    filename: "{item['filename']}",
    title: "{title}",
    year: {item['year']},
    lat: {item['lat']},
    lng: {item['lng']},
    description: "{desc}"
  }},
"""
            # Inserim els nous elements abans del ]; final
            new_utils = old_content[:end_idx] + new_items_ts + old_content[end_idx:]
        else:
            new_utils = old_content # fallback si no trobem el final
    else:
        # Fallback si no trobem res (no hauria de passar)
        new_utils = old_content
        
    with open("src/lib/gameUtils.ts", "w", encoding="utf-8") as f:
        f.write(new_utils)
    print("gameUtils.ts generat correctament.")

if __name__ == "__main__":
    main()
