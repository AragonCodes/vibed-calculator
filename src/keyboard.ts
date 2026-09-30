import type { CalculatorState } from "./calculator.ts";

type NegativeEntryState = Pick<
  CalculatorState,
  "display" | "operator" | "waitingForRight" | "resetOnDigit" | "tokens" | "hasEntry"
>;

export function shouldStartNegativeEntry(state: NegativeEntryState): boolean {
  if (state.waitingForRight) return true;

  const isFreshCalculation =
    !state.resetOnDigit &&
    !state.hasEntry &&
    state.tokens.length === 0 &&
    state.display === "0" &&
    state.operator === null;

  return isFreshCalculation;
}
