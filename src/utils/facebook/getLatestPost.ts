import type puppeteer from 'puppeteer'

const codeToClickFirstSeeMoreButton = `(async() => {
    [...document.querySelectorAll(
      'div[role="article"] div[role="button"]',
    )].find((element) => element.textContent === 'See more')?.click()
  })()`

const getLatestPost = async (page: puppeteer.Page) => {
  await page.evaluate(codeToClickFirstSeeMoreButton)

  const element = await page.$('div[role="article"] div[data-ad-comet-preview]')

  if (!element) {
    throw new Error('Cannot find latest article')
  }

  return element
}

export default getLatestPost
