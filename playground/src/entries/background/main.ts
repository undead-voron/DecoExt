import {
  InjectableService,
  Module,
  activatedTabDetails,
  createdTabDetails,
  iconClickedDetails,
  menusClickedDetails,
  menusClickedTab,
  onIconClicked,
  onInstalled,
  onMenusClicked,
  onMessage,
  onTabActivated,
  onTabCreated,
  onTabRemoved,
  onTabUpdated,
  removedTabDetails,
  sendMessageToContent,
  tabUpdatedTab,
} from 'deco-ext'
import browser, { Tabs } from 'webextension-polyfill'
// you can import service without any name and it will be processed by js.
// if you import with name you need to pass it into Module decorator
import './additionalService'

@InjectableService()
class Main {
  eventsStore: string[] = []
  firstTimeInited?: number
  tabIdCounter: number = 0
  async init() {
    // read timestamp when class was forst inited. If this is first init, set current time
    const { firstTimeInited = Date.now(), mainEventsStore = [] } = await browser.storage.local.get(['additionalInit', 'mainEventsStore'])
    void browser.storage.local.set({ firstTimeInited })
    this.firstTimeInited = firstTimeInited
    this.eventsStore = mainEventsStore
  }

  saveEvent(event: string) {
    if (!this.eventsStore.includes(event))
      this.eventsStore.push(event)
    browser.storage.local.set({ mainEventsStore: this.eventsStore })
  }

  // this method is for playwright testing.
  // just track that parameter decorator will work on all tab related events and that several decorators can be applied to the same method/parameter
  @onTabUpdated()
  @onTabCreated()
  @onTabActivated()
  @onTabRemoved()
  someOtherMethod(
    @removedTabDetails('tabId') @activatedTabDetails('tabId') @createdTabDetails('id') @tabUpdatedTab('id') tabId: number,
  ): void {
    if (typeof tabId === 'number') {
      this.tabIdCounter++
    }
    if (this.tabIdCounter >= 10) {
      this.saveEvent('multipleParameterDecorators')
    }
  }

  @onMessage({ key: 'initCheck' })
  async initCheck({ sender }: { sender: browser.Runtime.MessageSender }) {
    console.log('message initCheck recieved', sender)
    try {
      await sendMessageToContent('messageToContent', {
        time: Date.now(),
        firstTimeInited: this.firstTimeInited,
      }, { tabId: sender.tab!.id! })
    }
    catch (e) {
      console.log('error sending message', e)
    }
  }

  @onMessage({ key: 'getTrackedInfo' })
  getTrackedInfo() {
    return this.eventsStore
  }

  @onInstalled()
  onInstalled() {
    console.log('extension installed')
    this.saveEvent('onInstalled')
    browser.contextMenus.create({ id: 'analyzeProduct', title: 'Check Context', contexts: ['selection'] })
  }

  @onTabActivated()
  onActivatedCheck(@activatedTabDetails() activationDetails: browser.Tabs.OnActivatedActiveInfoType, @activatedTabDetails('tabId') id: number) {
    console.log('check activation details', activationDetails, id)
    if ('tabId' in activationDetails)
      this.saveEvent('activationDetails')
    if (typeof id === 'number') {
      this.saveEvent('activationDetailsProp')
    }
  }

  @onTabActivated()
  onActivated() {
    this.saveEvent('onTabActivated')
  }

  @onTabCreated()
  onTabCreated() {
    this.saveEvent('onTabCreated')
  }

  @onTabRemoved()
  onTabRemoved() {
    this.saveEvent('onTabRemoved')
  }

  @onTabUpdated()
  async onTabUpdated({ details: { status }, tabId }: any) {
    this.saveEvent('onTabUpdated')
    try {
      // wait for content script to load
      await new Promise(res => setTimeout(res, 250))
      await sendMessageToContent('messageToContent', { time: Date.now(), firstTimeInited: this.firstTimeInited }, { tabId })
      // await browser.tabs.sendMessage(tabId, { name: 'messageToContent', data: { time: Date.now(), firstTimeInited: this.firstTimeInited || null } })
    }
    catch (e) {
      console.log('error sending message', e)
    }
  }

  @onIconClicked()
  onIconClicked(@iconClickedDetails() tab: Tabs.Tab, @iconClickedDetails('id') tabId: number) {
    console.log('tab', tab, 'tabId', tabId)
  }

  @onMenusClicked()
  onMenuClicked({ info, tab }: { info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab }) {
    console.log('onMenusClicked', { info, tab })
  }

  @onMenusClicked()
  onMenuClickedCheck(
    @menusClickedDetails() info: browser.Menus.OnClickData,
    @menusClickedDetails('menuItemId') menuItemId: browser.Menus.OnClickData['menuItemId'],
    @menusClickedTab() tab: browser.Tabs.Tab,
    @menusClickedTab('id') tabId: browser.Tabs.Tab['id'],
  ) {
    console.log('onMenusClicked', { info, menuItemId, tab, tabId })
  }
}

@Module({
  imports: [Main],
})
class App { }

// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
globalThis.app = new App()

console.log('app', globalThis.app)