import asyncio
import json
import os
import re
import sys

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("ERROR: playwright no instal.lat.")
    print("  python -m pip install playwright")
    print("  python -m playwright install chromium")
    sys.exit(1)

# ── Configuracio ──────────────────────────────────────────────────────────────
OUTPUT_DIR    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "historic")
GAMUTILS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "lib", "gameUtils.ts")
TARGET_COUNT  = 55
GAME_URL      = "https://historyguesser.app/#"
MIN_IMAGE_KB  = 300   # ignorar icones i thumbnails

collected = {}   # filename -> dict
seen_urls = set()

# Esdeveniments que s'extreuen dels noms de fitxer (es milloren despres)
EVENT_TITLE_MAP = {
    "acropolis-athens": ("Acropolis d'Atenes", -447, 37.9715, 23.7267),
}


def url_to_slug(url: str) -> str:
    """Extreu el nom de fitxer de la URL i el neteja."""
    name = url.rstrip("/").split("/")[-1]
    name = re.sub(r"\?.*$", "", name)          # treu query string
    name = re.sub(r"\.[a-z]{2,4}$", "", name)  # treu extensio
    return name[:60]


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text[:50].strip("_") or "event"


def slug_to_title(slug: str) -> str:
    """Converteix 'acropolis-athens' -> 'Acropolis Athens'."""
    return slug.replace("-", " ").replace("_", " ").title()


def update_game_utils():
    if not os.path.exists(GAMUTILS_PATH):
        return
    entries = list(collected.values())
    if not entries:
        return

    lines = ["export const HISTORIC_LOCATIONS = ["]
    for e in entries:
        fn    = e["filename"]
        title = e.get("title", fn)
        year  = e.get("year", 0)
        lat   = e.get("lat", 0.0)
        lng   = e.get("lng", 0.0)
        lines.append(
            "  { lat: " + str(lat) + ", lng: " + str(lng) +
            ", title: " + json.dumps(title, ensure_ascii=True) +
            ", year: " + str(year) +
            ", panoUrl: '/historic/" + fn + "' },"
        )
    lines.append("];\n")
    new_block = "\n".join(lines)

    with open(GAMUTILS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    pattern = r"export const HISTORIC_LOCATIONS\s*=\s*\[[\s\S]*?\];"
    if re.search(pattern, content):
        content = re.sub(pattern, new_block, content)
    else:
        content += "\n" + new_block
    with open(GAMUTILS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("gameUtils.ts actualitzat (" + str(len(entries)) + " events)")


def save_image_from_bytes(data: bytes, filename: str) -> bool:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    try:
        with open(path, "wb") as f:
            f.write(data)
        print("   Guardat: " + filename + " (" + str(len(data) // 1024) + " KB)")
        return True
    except Exception as e:
        print("   ERROR guardant: " + str(e))
        return False


# ── Interceptor de xarxa ──────────────────────────────────────────────────────
async def on_response(response):
    """Guarda automaticament totes les imatges panoramiques capturades."""
    global seen_urls, collected

    try:
        url = response.url
        if url in seen_urls:
            return
        if response.status != 200:
            return

        # Salta els blob: URLs (son duplicats de la URL original)
        if url.startswith("blob:"):
            return

        ct = response.headers.get("content-type", "")
        is_image = "image/jpeg" in ct or "image/webp" in ct or "image/png" in ct
        if not is_image:
            if not re.search(r"\.(jpe?g|webp|png)(\?|$)", url, re.I):
                return

        body = await response.body()
        size_kb = len(body) // 1024
        if size_kb < MIN_IMAGE_KB:
            return

        seen_urls.add(url)

        # Nom de fitxer a partir de la URL
        url_slug = url_to_slug(url)
        filename = slugify(url_slug) + ".jpg"

        # Evita duplicats per nom
        if filename in collected:
            return
        if os.path.exists(os.path.join(OUTPUT_DIR, filename)):
            seen_urls.add(url)  # ja tenim aquest
            return

        print("\n[+] Nova imatge " + str(size_kb) + "KB: " + url[-70:])

        # Titol i metadades a partir de la URL
        # Ex: "acropolis-athens" -> "Acropolis Athens"
        if url_slug in EVENT_TITLE_MAP:
            title, year, lat, lng = EVENT_TITLE_MAP[url_slug]
        else:
            title = slug_to_title(url_slug)
            year  = 0
            lat   = 0.0
            lng   = 0.0

        ok = save_image_from_bytes(body, filename)
        if ok:
            collected[filename] = {
                "filename": filename,
                "title": title,
                "year": year,
                "lat": lat,
                "lng": lng,
                "source_url": url,
            }
            meta_path = os.path.join(OUTPUT_DIR, "_metadata.json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(list(collected.values()), f, ensure_ascii=False, indent=2)
            update_game_utils()
            print("Total: " + str(len(collected)) + "/" + str(TARGET_COUNT))

    except Exception as ex:
        pass  # silencia errors de xarxa puntuals


# ── Automatitzacio del joc ────────────────────────────────────────────────────
async def click_any_button(page, texts: list, timeout_ms=3000) -> bool:
    """Intenta clicar qualsevol boto de la llista (case-insensitive, per text o CSS)."""
    for text in texts:
        try:
            # Selector CSS amb text case-insensitive
            locator = page.locator(
                "button, [role='button'], a",
            ).filter(has_text=re.compile(text, re.IGNORECASE)).first
            if await locator.is_visible(timeout=timeout_ms):
                await locator.click(force=True)
                return True
        except Exception:
            pass
    return False


async def do_quick_round(page):
    """Juga un round rapid per passar al seguent i carregar una nova imatge."""
    await page.wait_for_timeout(3000)

    # Clica al mapa per deixar el pin
    try:
        map_el = page.locator(".leaflet-container").first
        bbox = await map_el.bounding_box()
        if bbox:
            cx = bbox["x"] + bbox["width"] * 0.4
            cy = bbox["y"] + bbox["height"] * 0.4
            await page.mouse.click(cx, cy)
            print("   Pin al mapa")
    except Exception:
        await page.mouse.click(750, 420)
    await page.wait_for_timeout(800)

    # Clica 'LOCK IN GUESS'
    ok = await click_any_button(page, ["LOCK IN GUESS", "Lock In Guess", "Lock In", "Guess", "Submit"])
    if ok:
        print("   Lock In fet")
        await page.wait_for_timeout(4000)
    else:
        print("   ATENCIO: no s'ha trobat Lock In Guess")
        await page.wait_for_timeout(2000)

    # Clica 'NEXT ROUND'
    ok2 = await click_any_button(page, ["Next Round", "NEXT ROUND", "Next", "Continue", "Play Again"], timeout_ms=4000)
    if ok2:
        print("   Next Round fet")
        await page.wait_for_timeout(3000)
    else:
        print("   ATENCIO: no s'ha trobat Next Round")


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Iniciant Playwright...")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page    = await context.new_page()

        # Registra l'interceptor ABANS de navegar
        page.on("response", on_response)

        print("Obrint " + GAME_URL)
        await page.goto(GAME_URL)
        await page.wait_for_timeout(6000)

        round_num     = 0
        no_new_rounds = 0

        while len(collected) < TARGET_COUNT:
            prev_count = len(collected)
            round_num += 1
            print("\nRound " + str(round_num) +
                  " | Imatges: " + str(len(collected)) + "/" + str(TARGET_COUNT))

            await do_quick_round(page)

            if len(collected) == prev_count:
                no_new_rounds += 1
                print("Cap imatge nova en aquest round (" + str(no_new_rounds) + ")")
                if no_new_rounds >= 8:
                    print("Reiniciant pagina...")
                    await page.goto(GAME_URL)
                    await page.wait_for_timeout(6000)
                    no_new_rounds = 0
            else:
                no_new_rounds = 0

        print("\nFi! " + str(len(collected)) + " imatges recollides.")
        await browser.close()

    print("Completat.")


if __name__ == "__main__":
    asyncio.run(main())
