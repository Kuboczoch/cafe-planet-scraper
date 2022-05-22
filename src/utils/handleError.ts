import type puppeteer from 'puppeteer'
import { __SCROLL_BY_Y_DISTANCE__ } from '../const'
import closeLogInButton from './facebook/closeLogInButton'
import makeAScreenshot from './puppeteer/makeAScreenshot'
import * as core from '@actions/core'

const handleError = async (
  browser: puppeteer.Browser,
  page: puppeteer.Page,
  errorMessage = '',
) => {
  await page.evaluate(
    `(async() => { window.scrollBy(0, ${__SCROLL_BY_Y_DISTANCE__}) })()`,
  )
  await closeLogInButton(page)
  await makeAScreenshot(page)
  await browser.close()
  core.setFailed(errorMessage)
  return 1
}

export default handleError
