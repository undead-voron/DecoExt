import { describe, expect, it } from 'vitest'

import { buildCronJobName } from './buildCronJobName'

describe('name builder from cron', () => {
  it('named class', () => {
    class TestClass {
      method(): void {}
    }
    const name = buildCronJobName(TestClass, 'method')
    expect(name).toBe('TestClass.method')
  })
})
