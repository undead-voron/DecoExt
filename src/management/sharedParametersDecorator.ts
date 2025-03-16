import browser from 'webextension-polyfill'
import { createDecorator } from '~/buildDecoratorAndMethodWrapper'

export const { key, decorator } = createDecorator<keyof browser.Management.ExtensionInfo | void>('extensionInfo')
