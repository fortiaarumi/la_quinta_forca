import asyncio
import json
import os
import re
import sys

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("ERROR: playwright no instal.lat.")
    sys.exit(1)

OUTPUT_DIR    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "historic")
GAMUTILS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "lib", "gameUtils.ts")
META_PATH     = os.path.join(OUTPUT_DIR, "_metadata.json")
TARGET_COUNT  = 200
GAME_URL      = "https://wen-ware.com/play/"

collected = {}
seen_urls = set()
latest_pano = None
capturing_pano = False
panos_allowed = 1

def slugify(text: str) -> str:
    text = text.lower().strip()
    return re.sub(r"[^a-z0-9]+", "_", text)[:50].strip("_") or "event"

def parse_year(year_str: str) -> int:
    if not year_str: return 0
    m = re.search(r"(\d+)\s*(CE|AD|BC|BCE)?", str(year_str), re.IGNORECASE)
    if not m: return 0
    val = int(m.group(1))
    era = (m.group(2) or "CE").upper()
    return -val if era in ("BC", "BCE") else val

def load_existing():
    global collected, seen_urls
    if os.path.exists(META_PATH):
        try:
            with open(META_PATH, encoding="utf-8") as f:
                data = json.load(f)
            for e in data:
                fn = e.get("filename", "")
                if fn and os.path.exists(os.path.join(OUTPUT_DIR, fn)):
                    collected[fn] = e
                    if "source_url" in e:
                        seen_urls.add(e["source_url"])
        except:
            pass

def save_metadata_and_utils():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(list(collected.values()), f, ensure_ascii=False, indent=2)

    if not os.path.exists(GAMUTILS_PATH): return
    entries = list(collected.values())
    lines = ["export const HISTORIC_LOCATIONS = ["]
    for e in entries:
        fn    = e["filename"]
        title = e.get("title", fn)
        year  = e.get("year", 0)
        lat   = e.get("lat", 0.0)
        lng   = e.get("lng", 0.0)
        desc  = e.get("description", "")
        lines.append(
            f"  {{ lat: {lat}, lng: {lng}, title: {json.dumps(title)}, year: {year}, description: {json.dumps(desc)}, panoUrl: '/historic/{fn}' }},"
        )
    lines.append("];\n")
    new_block = "\n".join(lines)

    with open(GAMUTILS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    start = content.find("export const HISTORIC_LOCATIONS")
    if start != -1:
        end = content.find("];", start)
        if end != -1:
            content = content[:start] + new_block + content[end + 2:]
        else:
            content += "\n" + new_block
    else:
        content += "\n" + new_block

    with open(GAMUTILS_PATH, "w", encoding="utf-8") as f:
        f.write(content)

async def intercept_route(route):
    global panos_allowed
    url = route.request.url
    # Interceptem les imatges de la ronda
    if "asset" in url.lower() and "roundid=" in url.lower():
        if panos_allowed > 0:
            panos_allowed -= 1
            await route.continue_()
        else:
            # Avortem la precàrrega de la ronda 2, ronda 3, etc.
            await route.abort()
    else:
        await route.continue_()

async def on_response(response):
    global latest_pano
    if not capturing_pano: return
    try:
        url = response.url
        if url in seen_urls or url.startswith("blob:"): return
        if response.status != 200: return
        ct = response.headers.get("content-type", "")
        if "image/" not in ct and not re.search(r"\.(webp|jpe?g|png)(\?|$)", url, re.I): return
        
        if "tile" in url.lower() or "openfreemap" in url.lower() or "wikipedia" in url.lower(): return
        
        body = await response.body()
        size_kb = len(body) // 1024
        if size_kb > 250:
            # Ens quedem NOMÉS amb la PRIMERA imatge grossa (que és la de la ronda 1), ignorant les precàrregues posteriors
            if latest_pano is None:
                print(f"   [Xarxa] Panoràmica detectada: {size_kb}KB")
                latest_pano = {"data": body, "url": url, "ct": ct, "size": size_kb}
    except:
        pass

async def click_btn(page, texts):
    for t in texts:
        try:
            loc = page.locator("button, [role='button'], a").filter(has_text=re.compile(f"^{t}$", re.IGNORECASE)).first
            if await loc.is_visible(timeout=1000):
                await loc.click(force=True)
                return True
            loc_loose = page.locator("button, [role='button'], a").filter(has_text=re.compile(t, re.IGNORECASE)).first
            if await loc_loose.is_visible(timeout=500):
                await loc_loose.click(force=True)
                return True
        except:
            pass
    return False

async def extract_results(page):
    data = await page.evaluate(r"""() => {
        let title = null;
        for (const el of document.querySelectorAll('h1, h2, h3, h4, [class*="title"], [class*="name"]')) {
            const t = (el.innerText || '').trim();
            if (t.length > 3 && t.length < 150 && !t.match(/Puntuaci|Error|Ronda|WenWare|siguiente|cuand|distanci|score|setting|ajuste|now playing|play/i)) {
                title = t; break;
            }
        }
        const text = document.body.innerText;
        let yearStr = null;
        const ym = text.match(/(\d{1,4})\s*(CE|AD|BC|BCE)/i);
        if (ym) yearStr = ym[0];

        // Deixem la descripció buida expressament per evitar capturar el Changelog de la web
        let desc = "";

        let lat = 0, lng = 0;
        const html = document.documentElement.innerHTML;
        // Busquem les coordenades amb una expressió súper permissiva
        // Wenware a vegades ho posa com {"lat": 41.3, "lng": 2.1} o {latitude: ..., longitude: ...}
        const latMatch = html.match(/(?:lat|latitude)["\s:=]+([-\d.]+)/i);
        const lngMatch = html.match(/(?:lng|lon|longitude)["\s:=]+([-\d.]+)/i);
        
        if (latMatch && lngMatch) { 
            lat = parseFloat(latMatch[1]); 
            lng = parseFloat(lngMatch[1]); 
        }

        return { title, yearStr, desc, lat, lng };
    }""")
    return data or {}

async def main():
    global latest_pano
    load_existing()
    print(f"Iniciant scraper... Ja tenim: {len(collected)} imatges.")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        await page.route("**/*", intercept_route)
        page.on("response", on_response)

        await page.goto(GAME_URL)

        print("\n" + "="*50)
        print(" TENS 15 SEGONS PER ACCEPTAR COOKIES I NO FER RES MÉS")
        print(" L'SCRIPT JA CLICARÀ PLAY I FARÀ TOTA LA RESTA")
        print("="*50 + "\n")
        for i in range(15, 0, -1):
            print(f" Iniciant automàticament en {i} segons... ", end="\r")
            await page.wait_for_timeout(1000)
        print("\n -> COMENÇA L'AUTOMATITZACIÓ!\n")

        while len(collected) < TARGET_COUNT:
            global capturing_pano
            global panos_allowed
            print(f"\n--- Nova Partida (Round 1) | Total: {len(collected)}/{TARGET_COUNT} ---")
            
            # 0. Obrim l'aixeta ABANS de carregar la pàgina (WenWare precarga la panoràmica)
            latest_pano = None
            capturing_pano = True
            panos_allowed = 1
            
            # Recarreguem la pàgina per forçar que comenci una nova partida des del principi (MOLT més ràpid i fiable)
            await page.goto(GAME_URL)
            await page.wait_for_timeout(2000)
            
            # Cliquem Play / Start de la pantalla d'inici
            await click_btn(page, ["play", "start", "jugar"])
            
            # 1. Esperem a que carregui i pillem la imatge
            await page.wait_for_timeout(8000)
            
            # Tanquem l'aixeta abans de fer res més per assegurar-nos que no atrapa res de la pantalla de resultats
            capturing_pano = False

            # 2. Clic ¿Donde?
            await click_btn(page, ["donde", "where", "ubicaci", "mapa"])
            await page.wait_for_timeout(1000)

            # 3. Clic al mig del mapa EXACTE
            print("   Posant el pin al mapa...")
            try:
                map_el = page.locator(".leaflet-container").first
                await map_el.click(force=True)
            except Exception as e:
                print(f"   Error buscant mapa: {e}. Provo clic manual.")
                await page.mouse.click(800, 400)
                await page.mouse.click(800, 500)
            await page.wait_for_timeout(1000)

            # 4. Confirmar el tir (forçat per JavaScript perquè no falli si queda tallat a sota)
            print("   Clicant Enviar/Confirmar...")
            await page.evaluate("""() => {
                for (const el of document.querySelectorAll('button, a, [role="button"]')) {
                    if (el.innerText && el.innerText.match(/confirmar|confirm|enviar|lock|guess|ok|submit/i)) {
                        el.click();
                        break;
                    }
                }
            }""")
            
            # 5. Resultats animats (esperem 5s a que aparegui tota la info de WenWare)
            await page.wait_for_timeout(5000)
            result = await extract_results(page)

            # 6. Guardem les dades i la imatge
            if latest_pano:
                pano = latest_pano
                ext = ".webp" if "webp" in pano["ct"] else ".jpg"
                title_raw = result.get("title") or f"event_{len(collected)+1}"
                
                # Si el títol extret és "Scoreboard" es que alguna cosa ha anat malament o som a la pantalla final
                if "score" in title_raw.lower() or "wenware" in title_raw.lower():
                    title_raw = f"unknown_event_{len(collected)+1}"

                slug = slugify(title_raw)
                fn = slug + ext
                c = 1
                while fn in collected or os.path.exists(os.path.join(OUTPUT_DIR, fn)):
                    fn = f"{slug}_{c}{ext}"
                    c += 1

                print(f"   Dades extretes: {title_raw} ({result.get('yearStr')})")
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                with open(os.path.join(OUTPUT_DIR, fn), "wb") as f:
                    f.write(pano["data"])
                seen_urls.add(pano["url"])
                
                collected[fn] = {
                    "filename": fn,
                    "title": title_raw,
                    "year": parse_year(result.get("yearStr")),
                    "lat": result.get("lat") or 0.0,
                    "lng": result.get("lng") or 0.0,
                    "description": result.get("desc") or "",
                }
                save_metadata_and_utils()
                print(f"   -> GUARDAT CORRECTAMENT: {fn}")
            else:
                print("   Cap imatge capturada en aquesta ronda.")

            # Deixem uns segons de respir abans de forçar la següent partida
            await page.wait_for_timeout(4000)

        print("\nFi! Totes les imatges recollides.")
        try:
            await browser.close()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(main())
