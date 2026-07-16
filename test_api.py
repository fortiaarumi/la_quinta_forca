import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        async def on_response(response):
            try:
                ct = response.headers.get("content-type", "")
                if "application/json" in ct or "text/plain" in ct:
                    text = await response.text()
                    if "lat" in text.lower() or "round" in text.lower() or "asset" in text.lower():
                        print(f"--- JSON DE {response.url} ---")
                        print(text[:500])
                        print("----------------------------\n")
            except:
                pass

        page.on("response", on_response)

        print("Anant a wen-ware...")
        await page.goto("https://wen-ware.com/play/")
        await page.wait_for_timeout(3000)
        
        try:
            btn = page.locator("button, [role='button'], p").filter(has_text="Consent").first
            if await btn.is_visible(): await btn.click(force=True)
        except: pass
        
        await page.wait_for_timeout(2000)
        try:
            play = page.locator("button, [role='button'], a").filter(has_text="Play").first
            if await play.is_visible(): await play.click(force=True)
        except: pass
        
        await page.wait_for_timeout(5000)
        print("Fi del test")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
