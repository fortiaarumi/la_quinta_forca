import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        async def on_response(response):
            try:
                url = response.url
                if "supabase" in url or "rest/v1" in url or "graphql" in url or "api" in url:
                    if "image" not in response.headers.get("content-type", ""):
                        text = await response.text()
                        print(f"--- API RESPONSE: {url} ---")
                        print(text[:1000])
                        print("---------------------------\n")
            except Exception as e:
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
        
        await page.wait_for_timeout(8000)
        print("Fi del test")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
