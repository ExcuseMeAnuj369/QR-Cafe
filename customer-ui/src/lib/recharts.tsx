/* oxlint-disable react/only-export-components -- `export *` re-exports upstream components */
import type { ReactNode } from "react";
import {
  Tooltip as UpstreamTooltip,
  type TooltipProps as UpstreamTooltipProps,
} from "recharts-upstream";

export * from "recharts-upstream";

export type ValueType = number | string | Array<number | string>;
export type TooltipValueType = ValueType;
export type TooltipPayloadEntry = any;

type NameType = string | number;
type UpstreamProps = UpstreamTooltipProps<ValueType, NameType>;
type TooltipPayload = any;

/** recharts 2's Formatter: `value` is `TValue`, inferred from the callback the caller writes. */
export type TooltipFormatter<TValue extends ValueType = ValueType, TName extends NameType = NameType> = (
  value: TValue,
  name: TName,
  item: TooltipPayloadEntry,
  index: number,
  payload: TooltipPayload,
) => ReactNode | [ReactNode, ReactNode];

export function Tooltip<
  TValue extends ValueType = ValueType,
  TName extends NameType = NameType,
  TLabel = ReactNode,
>(
  props: Omit<UpstreamTooltipProps<TValue, TName>, "formatter" | "labelFormatter"> & {
    formatter?: TooltipFormatter<TValue, TName>;
    labelFormatter?: (label: TLabel, payload: TooltipPayload) => ReactNode;
  },
) {
  // The type parameters only narrow what the callbacks declare; recharts 2 erased them the same way.
  return <UpstreamTooltip {...(props as any)} />;
}
