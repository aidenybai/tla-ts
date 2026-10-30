import type { DecideOptions, Verdict } from "../../verdict";

// HACK: stands in for tla-ts's own SMT solver until the smt-solver branch lands, so every
// obligation that reaches it is unknown.
export const decideSmt = (_text: string, _options: DecideOptions): Verdict => "unknown";
