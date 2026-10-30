// Prep.expand_enabled_cdot: the frontends a step's pragmas cite, which rewrite ENABLED and \cdot
// before any backend runs.

import { TlaUnsupportedError } from "../../errors";
import type { Sequent } from "../../obligation-expression";

export const FRONTENDS = new Set([
  "expandenabled",
  "expandcdot",
  "autouse",
  "lambdify",
  "enabledaxioms",
  "levelcomparison",
]);

export const expandEnabledCdot = (sequent: Sequent, frontends: string[]) => {
  if (frontends.length > 0)
    throw new TlaUnsupportedError(`the step is proved by ${frontends.join(", ")}`);
  return sequent;
};
