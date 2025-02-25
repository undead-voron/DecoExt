import type { Runtime } from 'webextension-polyfill'
import { key as messageDataKey } from './messageDataParamaterDecorator'
import { key as messageSenderKey } from './messageSenderParamaterDecorator'

export function handler(arg: { data: any, sender: Runtime.MessageSender }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingMessageDataParameters: { index: number, key?: string & keyof typeof arg }[] = Reflect.getOwnMetadata(messageDataKey, constructor, propertyKey) || []
  const existingMessageSenderParameters: { index: number, key?: keyof Runtime.MessageSender }[] = Reflect.getOwnMetadata(messageSenderKey, constructor, propertyKey) || []
  if (existingMessageDataParameters.length || existingMessageSenderParameters.length) {
    const customArg = []
    for (const { index, key } of existingMessageDataParameters)
      customArg[index] = key ? arg.data[key] : arg.data
    for (const { index, key } of existingMessageSenderParameters)
      customArg[index] = key ? arg.sender[key] : arg.sender

    return customArg
  }
  else {
    return [arg]
  }
}
