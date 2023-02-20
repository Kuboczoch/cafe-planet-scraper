import puppeteer from 'puppeteer'
import format from 'date-fns/format'

require('dotenv').config({ path: '.env' })

import clickCookies from './utils/facebook/clickCookies'
import getLatestPost from './utils/facebook/getLatestPost'
import menuMapper from './utils/mappers/menuMapper'
import auth from './utils/googleapi/auth'
import type { WEEK_DAYS } from './types/lunch'
import lunchToCalendarEventMapper from './utils/mappers/lunchToCalendarEventMapper'
import delay from './utils/delay'
import getCalendarLunches from './utils/googleapi/getCalendarLunches'
import filterEventsByCalendarSummary from './utils/googleapi/filterEventsByCalendarSummary'

const _initBrowser = async (): Promise<[puppeteer.Browser, puppeteer.Page]> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({
    width: 1200,
    height: 800,
  })
  return [browser, page]
}

const main = async () => {
  if (!process.env.FACEBOOK_PAGE_URL) {
    throw new Error(`Not configured 'FACEBOOK_PAGE_URL' env`)
  }
  const googleAuth = auth()
  const { data } = await getCalendarLunches(googleAuth)

  if (filterEventsByCalendarSummary(data.items).length === 5) {
    console.log('All week set! No need for more scraping!')
    return 1
  }

  // --- scraping magic

  const [browser, page] = await _initBrowser()

  await page.goto(process.env.FACEBOOK_PAGE_URL, {
    waitUntil: 'networkidle2',
  })

  await clickCookies(page)
  const element = await getLatestPost(page)
  // Get element's textContent, it will parse literally everything into one string.
  // Emoticons are ignored
  const value: string | undefined = await page.evaluate(
    (el) => el.textContent,
    element,
  )
  if (!value) {
    throw new Error('No text found in the latest article')
  }

  await browser.close()

  // ---

  // Log it in case of later debugging
  console.log('---')
  console.log('Found this post content:')
  console.log(value)
  console.log('---')

  let mappedMenu

  try {
    mappedMenu = menuMapper(value)
  } catch (e) {
    if (typeof data.items?.length === 'number' && data.items?.length > 0) {
      console.warn(`This post probably didn't contained a lunch menu :c`)
      return
    } else {
      throw new Error(`Whoosh! They forgot or the scraping didn't work`)
    }
  }

  const googleClient = await googleAuth.auth.getClient()

  let numberOfAddedLunches = 0

  for (const lunch in mappedMenu) {
    const _lunch = mappedMenu[lunch as WEEK_DAYS]
    if (_lunch) {
      // Check if exist in the calendar
      const itemInCalendar = data.items?.find((event) => {
        if (
          event.start?.dateTime?.slice(0, 10) ===
          format(_lunch.date, 'yyyy-MM-dd')
        ) {
          return event
        }
        return undefined
      })

      if (itemInCalendar) {
        continue
      }
      numberOfAddedLunches = numberOfAddedLunches + 1

      const event = lunchToCalendarEventMapper(_lunch)
      googleAuth.calendar.events.insert({
        auth: googleClient,
        calendarId: googleAuth.GOOGLE_CALENDAR_ID,
        requestBody: event,
      })
      await delay(500)
    }
  }

  if (numberOfAddedLunches > 0) {
    console.log(`Added ${numberOfAddedLunches} lunches!`)
  } else {
    console.log('All good!')
  }
  console.log('Bon Appétit!')
  return 1
}

main()
