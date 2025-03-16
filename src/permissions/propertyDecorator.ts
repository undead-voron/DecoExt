import type { Permissions } from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'

export const permissionsDetailsDecorator = createDecorator<keyof Permissions.Permissions | void>('permissionsDetails')
