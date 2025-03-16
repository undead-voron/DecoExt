import { expect, test } from './fixtures'

test('has events onInstalled onTabUpdated additionalOnMessage onTabRemoved onTabCreated', async ({ page, context }) => {
  let [background] = context.serviceWorkers()
  if (!background)
    background = await context.waitForEvent('serviceworker')
  // wait for ext to add event listeners
  await new Promise(res => setTimeout(res, 250))

  const newPage = await context.newPage()
  await newPage.goto('http://localhost:3000/')
  await newPage.waitForLoadState()
  await newPage.close()

  await page.goto('http://localhost:3000/')
  await new Promise(res => setTimeout(res, 550))

  const eventsContainer = page.locator('.events-container')

  const eventsText = await eventsContainer.textContent()

  expect(eventsText).toContain('onInstalled')
  expect(eventsText).toContain('onTabUpdated')
  expect(eventsText).toContain('additionalOnMessage')
  expect(eventsText).toContain('onTabRemoved')
  expect(eventsText).toContain('onTabCreated')
  expect(eventsText).toContain('onTabActivated')
  expect(eventsText).toContain('activationDetails')
  expect(eventsText).toContain('activationDetailsProp')
  expect(eventsText).toContain('multipleParameterDecorators')
})
