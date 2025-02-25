import { describe, expect, it } from 'vitest'

import { resolve } from './instanceResolver'
import { InjectableService } from './service'

describe('injectable service', () => {
  @InjectableService()
  class TestInjectable {
    someMethod(): void {}
  }

  @InjectableService()
  class Test {
    constructor(public testable: TestInjectable) {}
  }

  it('dependencies injection resolution', () => {
    const testingVariable = resolve(Test)

    expect(testingVariable.testable).toBeInstanceOf(TestInjectable)
  })

  it('several instances of injectable service', () => {
    const firstInstance = new TestInjectable()
    const secondInstance = new TestInjectable()

    expect(firstInstance).toBe(secondInstance)
  })

  it('several instances of injectable service with injections', () => {
    const firstInstance = resolve(Test)
    const secondInstance = resolve(Test)

    expect(firstInstance).toBe(secondInstance)
  })
})
