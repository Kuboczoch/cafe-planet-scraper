import puppeteer from 'puppeteer'

const initBrowser = async (): Promise<[puppeteer.Browser, puppeteer.Page]> => {
  if (!process.env.FACEBOOK_PAGE_URL) {
    throw new Error(`Not configured 'FACEBOOK_PAGE_URL' env`)
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({
    width: 1200,
    height: 800,
  })
  await page.goto(process.env.FACEBOOK_PAGE_URL, {
    waitUntil: 'networkidle2',
  })
  return [browser, page]
}

export default initBrowser
