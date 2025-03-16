import { InjectableService, messageData, onMessage, sendMessageToBackground } from 'deco-ext'
import browser from 'webextension-polyfill'

@InjectableService()
export class ContentManager {
  wow = 10
  @onMessage({ key: 'messageToContent' })
  public async messageHandler(@messageData() data: any, @messageData('time') time: number) {
    console.log('message recieved in content from bg', { data, time })
    const additionalClassInitInfo = await sendMessageToBackground('additionalCall', {})
    const trackedInfo = await sendMessageToBackground('getTrackedInfo', {})
    console.log('tracked info', trackedInfo)

    if (additionalClassInitInfo) {
      trackedInfo.push('additionalOnMessage')
    }
    const container = document.querySelector('.events-container')
    if (document.location.href.includes('localhost') && container) {
      container.innerHTML = JSON.stringify(trackedInfo, null, 2)
    }
  }
}
