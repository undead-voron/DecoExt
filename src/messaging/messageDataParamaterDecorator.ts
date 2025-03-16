import { createDecorator } from '~/buildDecoratorAndMethodWrapper'

const decoratorInfo = createDecorator<string | void>('messageDataMapper')

export const key = decoratorInfo.key
export const decorator = decoratorInfo.decorator
