import asyncio
from playwright.async_api import async_playwright
import re
import json

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        async def on_response(response):
            if "image/" not in response.headers.get("content-type", "") and "text/html" not in response.headers.get("content-type", ""):
                try:
                    text = await response.text()
                    if "lat" in text.lower() or "lng" in text.lower() or "longitude" in text.lower():
                        print("TROBAT A LA RESPOSTA:", response.url)
                        print(text[:200])
                except:
                    pass

        page.on("response", on_response)

        print("Anant a wen-ware...")
        await page.goto("https://wen-ware.com/play/")
        await page.wait_for_timeout(3000)
        
        cookie = page.locator("text=Consent")
        if await cookie.is_visible(): await cookie.click()
        
        await page.wait_for_timeout(3000)
        play = page.locator("text=Play")
        if await play.is_visible(): await play.click()
        
        await page.wait_for_timeout(5000)
        donde = page.locator("text=¿Dónde estoy?")
        if await donde.is_visible(): await donde.click()
        
        await page.wait_for_timeout(2000)
        await page.mouse.click(600, 400)
        
        await page.wait_for_timeout(1000)
        enviar = page.locator("text=Enviar")
        if await enviar.is_visible(): await enviar.click()
        
        await page.wait_for_timeout(5000)
        
        print("Fi del test")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
