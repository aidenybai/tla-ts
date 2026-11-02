// The checks of the TLA+ extension's rules for functions, after the lemmas in Zenon.thy that justify
// them.

import type { PlainRuleName } from "../proof";
import {
  and,
  app,
  domain,
  equal,
  equiv,
  expectApp,
  expectNot,
  fapply,
  imply,
  member,
  not,
  type SpecTable,
  type Term,
} from "./terms";

// ~isAFcn(f) where f is built by a function constructor closes the branch.
const getNotFunctionSpec = (formula: Term, constructor: string, arity: number) => {
  expectApp(expectApp(expectNot(formula), "TLA.isAFcn", 1)[0], constructor, arity);
  return { premises: [formula], branches: [] };
};

export const FUNCTION_RULES = {
  notisafcn_fcn: (args) => getNotFunctionSpec(args[0], "TLA.Fcn", 2),
  notisafcn_except: (args) => getNotFunctionSpec(args[0], "TLA.except", 3),
  notisafcn_onearg: (args) => getNotFunctionSpec(args[0], "TLA.oneArg", 2),
  notisafcn_extend: (args) => getNotFunctionSpec(args[0], "TLA.extend", 2),
  funequal: (args, checker) => {
    const sides = expectApp(args[0], "=", 2);
    const left = sides[0];
    const right = sides[1];
    const result = and(
      and(
        equiv(app("TLA.isAFcn", [left]), app("TLA.isAFcn", [right])),
        equal(domain(left), domain(right)),
      ),
      checker.bind("all", "", (bound) => equal(fapply(left, bound), fapply(right, bound))),
    );
    return { premises: [args[0]], branches: [[result]] };
  },
  notfunequal: (args, checker) => {
    const sides = expectApp(expectNot(args[0]), "=", 2);
    const left = sides[0];
    const right = sides[1];
    const result = not(
      and(
        and(
          and(app("TLA.isAFcn", [left]), app("TLA.isAFcn", [right])),
          equal(domain(left), domain(right)),
        ),
        checker.bind("all", "", (bound) =>
          imply(member(bound, domain(right)), equal(fapply(left, bound), fapply(right, bound))),
        ),
      ),
    );
    return { premises: [args[0]], branches: [[result]] };
  },
} satisfies Partial<SpecTable<PlainRuleName>>;
