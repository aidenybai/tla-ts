// The checks of the TLA+ extension's rules that rewrite a subterm in place: evaluating a function
// application, DOMAIN, IF, CASE, Len, or a formula used as a term. Each rule names the context of
// the subterm as a lambda, (\x. context).

import type { PlainRuleName } from "../proof";
import { getFields } from "./records";
import {
  and,
  app,
  domain,
  ensure,
  equal,
  expectApp,
  FALSE,
  fapply,
  getPairs,
  getStringText,
  instantiate,
  isApp,
  isVariable,
  makeNatural,
  member,
  not,
  TRUE,
  type Checker,
  type RuleSpec,
  type SpecTable,
  type Term,
} from "./terms";

// The term that fills the hole of a context to give a formula.
const getFilled = (lambda: Term, formula: Term) => {
  ensure(lambda.kind === "lam");
  const hole = lambda.args[0].symbol;
  const find = (context: Term, candidate: Term): Term | undefined => {
    if (context.kind === "var" && context.symbol === hole) return candidate;
    if (context.kind !== candidate.kind || context.symbol !== candidate.symbol) return undefined;
    if (context.args.length !== candidate.args.length) return undefined;
    if (context.kind !== "app" && context.kind !== "not") return undefined;
    for (let index = 0; index < context.args.length; index++) {
      const found = find(context.args[index], candidate.args[index]);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  const filled = find(lambda.args[1], formula);
  ensure(filled !== undefined);
  return filled;
};

const getRewriteSpec = (
  checker: Checker,
  formula: Term,
  lambda: Term,
  build: (filled: Term) => Term[][],
): RuleSpec => {
  const filled = getFilled(lambda, formula);
  ensure(checker.isSame(formula, instantiate(lambda, filled)));
  return { premises: [formula], branches: build(filled) };
};

const getCaseBranches = (lambda: Term, args: Term[], condition: Term): Term[][] => {
  if (args.length === 0) return [[condition]];
  if (args.length === 1) return [[condition, instantiate(lambda, args[0])]];
  return [
    [args[0], instantiate(lambda, args[1])],
    ...getCaseBranches(lambda, args.slice(2), and(not(args[0]), condition)),
  ];
};

// A formula used as a term splits into the cases where it equals TRUE and FALSE.
const getBoolCaseSpec = (
  checker: Checker,
  args: Term[],
  isKind: (operand: Term) => boolean,
): RuleSpec => {
  const operand = expectApp(args[1], "=", 2)[0];
  ensure(isKind(operand));
  const lambda = args[5];
  const filled = getFilled(lambda, args[0]);
  ensure(checker.isSame(filled, operand) && checker.isSame(args[0], instantiate(lambda, operand)));
  return {
    premises: [args[0]],
    branches: [
      [equal(operand, TRUE), instantiate(lambda, TRUE)],
      [equal(operand, FALSE), instantiate(lambda, FALSE)],
    ],
  };
};

const getNatural = (formula: Term): number => {
  let count = 0;
  let current = formula;
  while (isApp(current, "TLA.fapply", 2) && isVariable(current.args[0], "TLA.Succ")) {
    count++;
    current = current.args[1];
  }
  ensure(current.kind === "var" && /^(0|[1-9][0-9]*)$/.test(current.symbol));
  return count + Number(current.symbol);
};

export const REWRITE_RULES = {
  trueistrue: (args, checker) => {
    const lambda = args[3];
    const subterm = args[1];
    ensure(lambda.kind === "lam" && checker.isSame(args[0], instantiate(lambda, subterm)));
    return { premises: [args[0], subterm], branches: [[instantiate(lambda, TRUE)]] };
  },
  fapplyfcn: (args, checker) =>
    getRewriteSpec(checker, args[0], args[3], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const fcn = expectApp(applied[0], "TLA.Fcn", 2);
      ensure(fcn[1].kind === "lam");
      return [
        [not(member(applied[1], fcn[0]))],
        [instantiate(args[3], instantiate(fcn[1], applied[1]))],
      ];
    }),
  fapplyexcept: (args, checker) =>
    getRewriteSpec(checker, args[0], args[8], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const except = expectApp(applied[0], "TLA.except", 3);
      const argument = applied[1];
      const inDomain = member(argument, domain(except[0]));
      return [
        [inDomain, equal(except[1], argument), instantiate(args[8], except[2])],
        [
          inDomain,
          not(equal(except[1], argument)),
          instantiate(args[8], fapply(except[0], argument)),
        ],
        [not(inDomain)],
      ];
    }),
  tuple_access: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const components = expectApp(applied[0], "TLA.tuple");
      const position = getNatural(applied[1]);
      ensure(position >= 1 && position <= components.length);
      return [[instantiate(args[2], components[position - 1])]];
    }),
  record_access: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const applied = expectApp(filled, "TLA.fapply", 2);
      const label = getStringText(applied[1]);
      const field = getFields(applied[0], "TLA.record").find(
        (inner) => getStringText(inner[0]) === label,
      );
      ensure(field !== undefined);
      return [[instantiate(args[2], field[1])]];
    }),
  domain_fcn: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const fcn = expectApp(expectApp(filled, "TLA.DOMAIN", 1)[0], "TLA.Fcn", 2);
      return [[instantiate(args[2], fcn[0])]];
    }),
  domain_except: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const except = expectApp(expectApp(filled, "TLA.DOMAIN", 1)[0], "TLA.except", 3);
      return [[instantiate(args[2], domain(except[0]))]];
    }),
  record_domain: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const record = expectApp(filled, "TLA.DOMAIN", 1)[0];
      const fields = getPairs(expectApp(record, "TLA.record"));
      return [
        [
          instantiate(
            args[2],
            app(
              "TLA.set",
              fields.map((field) => field[0]),
            ),
          ),
        ],
      ];
    }),
  boolcase_not: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "not"),
  boolcase_and: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "and"),
  boolcase_or: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "or"),
  boolcase_imply: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "imply"),
  boolcase_equiv: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "equiv"),
  boolcase_equal: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => isApp(operand, "=", 2)),
  boolcase_all: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "all"),
  boolcase_ex: (args, checker) =>
    getBoolCaseSpec(checker, args, (operand) => operand.kind === "ex"),
  iftrue: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const operands = expectApp(filled, "TLA.cond", 3);
      ensure(operands[0].kind === "true");
      return [[instantiate(args[2], operands[1])]];
    }),
  iffalse: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const operands = expectApp(filled, "TLA.cond", 3);
      ensure(operands[0].kind === "false");
      return [[instantiate(args[2], operands[2])]];
    }),
  ifthenelse: (args, checker) =>
    getRewriteSpec(checker, args[0], args[5], (filled) => {
      const operands = expectApp(filled, "TLA.cond", 3);
      return [
        [operands[0], instantiate(args[5], operands[1])],
        [not(operands[0]), instantiate(args[5], operands[2])],
      ];
    }),
  case: (args, checker) =>
    getRewriteSpec(checker, args[0], args[1], (filled) =>
      getCaseBranches(args[1], expectApp(filled, "TLA.CASE"), TRUE),
    ),
  tuple_len: (args, checker) =>
    getRewriteSpec(checker, args[0], args[2], (filled) => {
      const components = expectApp(expectApp(filled, "TLA.Len", 1)[0], "TLA.tuple");
      return [[instantiate(args[2], makeNatural(components.length))]];
    }),
} satisfies Partial<SpecTable<PlainRuleName>>;
