import type puppeteer from 'puppeteer'
import fs from 'fs'
import { __SCREENSHOT_DIRECTORY__ } from '../../const'

const makeAScreenshot = async (page: puppeteer.Page) => {
  try {
    fs.mkdirSync(__SCREENSHOT_DIRECTORY__)
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err
  }
  await page.screenshot({
    path: `${__SCREENSHOT_DIRECTORY__}/${new Date().getTime()}.png`,
  })
}

export default makeAScreenshot
