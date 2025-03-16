import browser from 'webextension-polyfill'

export async function createCronJob(name: string, { periodInMinutes }: { periodInMinutes: number }): Promise<void> {
  // TODO: check performance. might be overkill
  const existingAlarm = await browser.alarms.get(name)
  // check if alarm already exists. we don't need to create alarm if it already exists
  if (!existingAlarm)
    browser.alarms.create(name, { periodInMinutes })
}
