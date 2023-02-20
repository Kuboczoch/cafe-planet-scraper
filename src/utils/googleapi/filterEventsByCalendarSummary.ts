import type getCalendarLunches from './getCalendarLunches'
import { calendarLunchSummary } from '../mappers/lunchToCalendarEventMapper'

type TCalendarDataItems = Awaited<
  ReturnType<typeof getCalendarLunches>
>['data']['items']

const filterEventsByCalendarSummary = (
  items: TCalendarDataItems = [],
): NonNullable<TCalendarDataItems> => {
  if (!items) {
    return []
  }
  return items.filter((_event) => {
    return _event.summary === calendarLunchSummary
  })
}

export default filterEventsByCalendarSummary
