// How each of tla-ts's backends decides the text tlapm would send its prover, by the prover of the
// method that selects it.

import { solveSmt } from "../smt/solver";
import { decideIsabelle } from "./isabelle/decide";
import { decidePtl } from "./ptl/decide";
import type { DecideOptions, Verdict } from "./verdict";
import { decideZenon } from "./zenon/decide";

export const DECIDERS: Record<string, (text: string, options: DecideOptions) => Verdict> = {
  smt: solveSmt,
  z3: solveSmt,
  zenon: decideZenon,
  isabelle: decideIsabelle,
  ls4: decidePtl,
};
