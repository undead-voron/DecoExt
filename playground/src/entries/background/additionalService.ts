import { InjectableService, onMessage } from 'deco-ext'
import browser from 'webextension-polyfill'

@InjectableService()
export default class AdditionalService {
  firstTimeInited?: number
  async init() {
    // read timestamp when class was forst inited. If this is first init, set current time
    const { firstTimeInited = Date.now() } = await browser.storage.local.get(['additionalInit'])
    void browser.storage.local.set({ firstTimeInited })
    this.firstTimeInited = firstTimeInited
  }

  @onMessage({ key: 'additionalCall' })
  onMessage(): { firstTimeInited?: number } {
    return { firstTimeInited: this.firstTimeInited }
  }
}
