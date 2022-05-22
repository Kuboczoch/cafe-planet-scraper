import format from 'date-fns/format'

require('dotenv').config({ path: '.env' })

import clickCookies from './utils/facebook/clickCookies'
import getLatestPost from './utils/facebook/getLatestPost'
import menuMapper from './utils/mappers/menuMapper'
import auth from './utils/googleapi/auth'
import type { TLunchMenu, WEEK_DAYS } from './types/lunch'
import lunchToCalendarEventMapper from './utils/mappers/lunchToCalendarEventMapper'
import delay from './utils/delay'
import getCalendarLunches from './utils/googleapi/getCalendarLunches'
import initBrowser from './utils/puppeteer/initBrowser'
import handleError from './utils/handleError'

const main = async () => {
  const googleAuth = auth()
  const { data } = await getCalendarLunches(googleAuth)

  // Check if there is a need for scraping
  // if (data.items?.length === 5) {
  //   console.log('All week set! No need for more scraping!')
  //   return 0
  // }

  // --- scraping magic

  const [browser, page] = await initBrowser()

  let postText: string | undefined

  try {
    await clickCookies(page)
    const element = await getLatestPost(page)
    // Get element's textContent, it will parse literally everything into one string.
    // Emoticons are ignored
    postText = await page.evaluate((el) => el.textContent, element)
  } catch (e: any) {
    return await handleError(browser, page, e)
  }

  if (!postText) {
    return await handleError(
      browser,
      page,
      'No text found in the latest article',
    )
  }

  // ---

  // Log it in case of later debugging
  console.log('---')
  console.log('Found this post content:')
  console.log(postText)
  console.log('---')

  let mappedMenu: TLunchMenu

  try {
    mappedMenu = menuMapper(postText)
  } catch (e) {
    if (typeof data.items?.length === 'number' && data.items?.length > 0) {
      return await handleError(
        browser,
        page,
        `This post probably didn't contained a lunch menu :c`,
      )
    } else {
      return await handleError(
        browser,
        page,
        `Whoosh! They forgot or the scraping didn't work`,
      )
    }
  }

  if (Object.values(mappedMenu).every((a) => a === null)) {
    return await handleError(
      browser,
      page,
      `This post probably didn't contained a lunch menu :c`,
    )
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

  await browser.close()
  return 0
}

main()
