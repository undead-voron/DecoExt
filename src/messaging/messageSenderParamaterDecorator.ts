import { Runtime } from 'webextension-polyfill'
import { createDecorator } from '../buildDecoratorAndMethodWrapper'

const decoratorInfo = createDecorator<keyof Runtime.MessageSender | void>('messageSenderMapper')

export const key = decoratorInfo.key
export const decorator = decoratorInfo.decorator
