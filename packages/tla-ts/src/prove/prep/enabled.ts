import { TlapmBugError, TlaUnsupportedError } from "../../errors";
import { expandActionOperators, lambdify } from "../../obligation-action";
import { createAnonymizer } from "../../obligation-anon";
import type { Expr, Sequent } from "../../obligation-expression";
import { checkLevelChange } from "./level-comparison";

// expand_enabled_cdot: the first frontend the methods cite, in tlapm's order, transforms the
// obligation. Its soundness checks throw a TlaProverError, as tlapm then runs no backend.
export const expandEnabledCdot = (sequent: Sequent, frontends: Set<string>): Sequent => {
  const isEnabled = frontends.has("expandenabled");
  const isCdot = frontends.has("expandcdot");
  const isAutoUse = frontends.has("autouse");
  const isLambdify = frontends.has("lambdify");
  if (!isEnabled && !isCdot && !isLambdify) {
    if (frontends.has("levelcomparison")) return checkLevelChange(sequent);
    if (frontends.has("enabledaxioms")) throw new TlaUnsupportedError("the ENABLEDaxioms frontend");
    return sequent;
  }
  // Expr.Anon's anon, which only meets the names that lambdification binds.
  const anonymizer = createAnonymizer(
    { value: 0 },
    () => {
      throw new TlapmBugError();
    },
    () => {},
  );
  const expression: Expr = { kind: "Sequent", sequent };
  const result =
    isEnabled || isCdot
      ? expandActionOperators(anonymizer, () => {}, undefined, expression, {
          isEnabled,
          isCdot,
          isAutoUse,
        })
      : lambdify(anonymizer, () => {}, undefined, expression, {
          isEnabled: true,
          isCdot: true,
          isAutoUse,
        });
  if (result.kind !== "Sequent") throw new TlapmBugError();
  return result.sequent;
};
