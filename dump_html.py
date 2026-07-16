import asyncio
from playwright.async_api import async_playwright
import re

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        print("Anant a wen-ware...")
        await page.goto("https://wen-ware.com/play/")
        await page.wait_for_timeout(3000)
        
        cookie_btn = page.locator("button, [role='button'], p").filter(has_text=re.compile("Consent", re.IGNORECASE)).first
        if await cookie_btn.is_visible():
            await cookie_btn.click(force=True)
            print("Clicat Cookies")
            await page.wait_for_timeout(1000)
        
        loc = page.locator("button, [role='button'], a").filter(has_text=re.compile("^(play|start|jugar)$", re.IGNORECASE)).first
        if await loc.is_visible():
            await loc.click(force=True)
            print("Clicat Play")
            
        await page.wait_for_timeout(5000)
        
        loc2 = page.locator("button, [role='button'], a").filter(has_text=re.compile("^(donde|where|ubicaci|mapa)$", re.IGNORECASE)).first
        if await loc2.is_visible():
            await loc2.click(force=True)
            print("Clicat Donde")

        await page.wait_for_timeout(1000)
        await page.mouse.click(600, 400)
        print("Clicat Mapa")
        await page.wait_for_timeout(1000)
        
        loc3 = page.locator("button, [role='button'], a").filter(has_text=re.compile("^(enviar|submit|confirm)$", re.IGNORECASE)).first
        if await loc3.is_visible():
            await loc3.click(force=True)
            print("Clicat Enviar")

        await page.wait_for_timeout(5000)
        
        html = await page.evaluate("document.documentElement.innerHTML")
        with open("wenware_dump.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("HTML guardat a wenware_dump.html")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
