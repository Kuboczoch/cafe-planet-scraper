import type puppeteer from 'puppeteer'

import delay from '../delay'

const closeLogInButton = async (page: puppeteer.Page) => {
  try {
    // Await for the login button to appear
    await delay(5000)
    await page.click('div[aria-label="Close"]')
  } catch (e) {
    console.log('Ignored login popup')
  }
}

export default closeLogInButton
