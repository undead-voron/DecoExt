import type { ProtocolWithReturn } from 'deco-ext'

declare module 'deco-ext' {
  export interface ProtocolMap {
    getTrackedInfo: ProtocolWithReturn<Record<never, never>, string[]>
    initCheck: void
    messageToContent: { time: number, firstTimeInited?: number }
    additionalCall: ProtocolWithReturn<Record<never, never>, { firstTimeInited?: number }>
  }
}
