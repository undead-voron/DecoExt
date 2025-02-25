import type { JsonValue, Jsonify } from 'type-fest'

declare const ProtocolWithReturnSymbol: unique symbol

export interface ProtocolWithReturn<Data, Return> {
  data: Jsonify<Data>
  return: Jsonify<Return>
  /**
   * Type differentiator only.
   */
  [ProtocolWithReturnSymbol]: true
}
/**
 * Extendable by user.
 */
export interface ProtocolMap {

}

export type DataTypeKey = keyof ProtocolMap & string

export type GetReturnType<
  K extends DataTypeKey,
> = ProtocolMap[K] extends (...args: any[]) => infer R
  ? R
  : ProtocolMap[K] extends ProtocolWithReturn<any, infer Return>
    ? (Return | Promise<Return>)
    : void

export type GetDataType<
  K extends DataTypeKey,
  Fallback extends JsonValue | undefined = undefined,
> = K extends keyof ProtocolMap
  ? ProtocolMap[K] extends (...args: infer Args) => any
    ? Args['length'] extends 0
      ? undefined
      : Args[0]
    : ProtocolMap[K] extends ProtocolWithReturn<infer Data, any>
      ? Data
      : ProtocolMap[K]
  : Fallback
