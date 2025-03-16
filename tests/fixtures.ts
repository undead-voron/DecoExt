import path from 'node:path'
import { type BrowserContext, test as base, chromium } from '@playwright/test'

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(path.dirname('.'), 'playground', 'dist')
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await context.routeFromHAR('./tests/har/check.har', {
      update: false,
      url: /^http.*/,
    })

    // let [background] = context.backgroundPages()
    // if (!background)
    //   background = await context.waitForEvent('backgroundpage')
    // await background.routeFromHAR('./tests/har/check.har', {
    //   update: true,
    //   url: /^http.*/,
    // })

    await use(context)
    // await context.close()
  },
  extensionId: async ({ context }, use) => {
    /*
    // for manifest v2:
    let [background] = context.backgroundPages()
    if (!background)
      background = await context.waitForEvent('backgroundpage')
    */

    // for manifest v3:
    let [background] = context.serviceWorkers()
    if (!background)
      background = await context.waitForEvent('serviceworker')

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },
})
export const expect = test.expect
