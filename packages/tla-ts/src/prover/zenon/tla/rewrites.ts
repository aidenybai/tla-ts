// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// Rewriting a subterm: unfolding a definition, evaluating a function application, IF, CASE or a
// formula used as a term, or replacing the subterm with an equal one from the branch.

import { TlaZenonError } from "../../../errors";
import {
  FALSE,
  isApp,
  isRelation,
  TRUE,
  type BinderExpr,
  type Expr,
  type Expressions,
  type VarExpr,
} from "../expr";
import type { Index } from "../index-table";
import type { Node } from "../node";
import { makeRule, type Rule } from "../proof";
import {
  domain,
  equal,
  fapply,
  getPairs,
  isVariable,
  makeNatural,
  member,
  type Item,
  type TlaContext,
} from "./terms";

// OCaml's int_of_string, for the numerals that tlapm writes as variables.
const parseInteger = (text: string) =>
  /^[-+]?(0[xX][0-9a-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|0[uU][0-9_]+|[0-9][0-9_]*)$/.test(text)
    ? Number(text.replace(/_/g, "").replace(/^([-+]?)0[uU]/, "$1"))
    : undefined;

const getNaturalConstant = (expression: Expr): number | undefined => {
  let accumulator = 0;
  let current = expression;
  while (isApp(current, "TLA.fapply", 2) && isVariable(current.args[0], "TLA.Succ")) {
    accumulator++;
    current = current.args[1];
  }
  if (current.kind !== "var") return undefined;
  const value = parseInteger(current.symbol);
  return value === undefined ? undefined : accumulator + value;
};

const isInOneTo = (term: Expr, maximum: number) => {
  const value = getNaturalConstant(term);
  return value !== undefined && value > 0 && value <= maximum;
};

const getCaseBranches = (
  exprs: Expressions,
  fill: (term: Expr) => Expr,
  args: Expr[],
  condition: Expr,
): Expr[][] => {
  if (args.length === 0) return [[condition]];
  if (args.length === 1) return [[condition, fill(args[0])]];
  const rest = getCaseBranches(
    exprs,
    fill,
    args.slice(2),
    exprs.eand(exprs.enot(args[0]), condition),
  );
  return [[args[0], fill(args[1])], ...rest];
};

type MakeRewrite = (rule: Rule, added: Expr[], branches: Expr[][]) => Item[];

const SET_HEADS = [
  "TLA.emptyset",
  "TLA.upair",
  "TLA.addElt",
  "TLA.set",
  "TLA.SUBSET",
  "TLA.UNION",
  "TLA.cup",
  "TLA.cap",
  "TLA.setminus",
  "TLA.subsetOf",
  "TLA.setOfAll",
  "TLA.FuncSet",
  "TLA.Product",
];

const getRewrites = (
  context: TlaContext,
  isInTerm: boolean,
  hole: VarExpr,
  frame: Expr,
  term: Expr,
  make: MakeRewrite,
): Item[] => {
  const exprs = context.exprs;
  const index = context.index;
  const lambda = exprs.elam(hole, "", frame);
  const fill = (inner: Expr) => exprs.substitute([[hole, inner]], frame);
  const makeBoolCase = (getRule: (prefix: [Expr, Expr, Expr, Expr, Expr, Expr]) => Rule) => {
    const isTrue = equal(exprs, term, TRUE);
    const whenTrue = fill(TRUE);
    const isFalse = equal(exprs, term, FALSE);
    const whenFalse = fill(FALSE);
    return make(
      getRule([fill(term), isTrue, whenTrue, isFalse, whenFalse, lambda]),
      [],
      [
        [isTrue, whenTrue],
        [isFalse, whenFalse],
      ],
    );
  };
  // Rewrites the term with the equalities on the branch whose other side has one of these heads.
  const makeEqualityRewrites = (wrapped: Expr, heads: string[], subterm: Expr) => {
    const hasGoodHead = (other: Expr) =>
      (other.kind === "app" || other.kind === "var") &&
      (heads.length === 0 || heads.includes(other.symbol));
    const rights = index.findEqualRight(subterm).filter(hasGoodHead);
    const lefts = index.findEqualLeft(subterm).filter(hasGoodHead);
    const leftToRight = rights.flatMap((other) =>
      make(
        makeRule("congruence_lr", [wrapped, subterm, other]),
        [equal(exprs, subterm, other)],
        [[exprs.apply(wrapped, other)]],
      ),
    );
    const rightToLeft = lefts.flatMap((other) =>
      make(
        makeRule("congruence_rl", [wrapped, subterm, other]),
        [equal(exprs, other, subterm)],
        [[exprs.apply(wrapped, other)]],
      ),
    );
    return [...leftToRight, ...rightToLeft];
  };
  const makeHoleRewrites = (symbol: string, heads: string[], subterm: Expr, other?: Expr) => {
    const inner = exprs.newVar();
    const wrapped = exprs.elam(
      inner,
      "",
      fill(exprs.eapp(symbol, other === undefined ? [inner] : [other, inner])),
    );
    return makeEqualityRewrites(wrapped, heads, subterm);
  };

  if (isInTerm && index.isMember(term)) {
    const replaced = fill(TRUE);
    return make(
      makeRule("trueistrue", [fill(term), term, replaced, lambda, term]),
      [term],
      [[replaced]],
    );
  }
  if (isApp(term, "$notequiv", 2)) return [];
  if (isInTerm && (term.kind === "var" || term.kind === "app")) {
    const definition = index.getDefinition(term.symbol);
    if (definition !== undefined) {
      if (term.kind === "var") {
        if (definition.params.length !== 0) return [];
        const unfolded = fill(definition.body);
        return make(
          { name: "definition", definition, args: [fill(term), unfolded] },
          [],
          [[unfolded]],
        );
      }
      if (definition.params.length !== term.args.length) return [];
      const body = exprs.substituteSecondOrder(
        definition.params.map((param, position) => [param, term.args[position]]),
        definition.body,
      );
      if (body === undefined) throw new TlaZenonError("Zenon: higher-order definition");
      const unfolded = fill(body);
      return make(
        { name: "definition", definition, args: [fill(term), unfolded] },
        [],
        [[unfolded]],
      );
    }
  }
  if (isApp(term, "TLA.fapply", 2)) {
    const fcn = term.args[0];
    const argument = term.args[1];
    if (isApp(fcn, "TLA.Fcn", 2) && fcn.args[1].kind === "lam") {
      const body = fcn.args[1];
      const outside = exprs.enot(member(exprs, argument, fcn.args[0]));
      const applied = fill(exprs.substitute([[body.args[0], argument]], body.args[1]));
      return make(
        makeRule("fapplyfcn", [fill(term), outside, applied, lambda, fcn.args[0], body, argument]),
        [],
        [[outside], [applied]],
      );
    }
    if (isApp(fcn, "TLA.except", 3)) {
      const base = fcn.args[0];
      const point = fcn.args[1];
      const value = fcn.args[2];
      const inDomain = member(exprs, argument, domain(exprs, base));
      const isPoint = equal(exprs, point, argument);
      const changed = fill(value);
      const isOther = exprs.enot(equal(exprs, point, argument));
      const unchanged = fill(fapply(exprs, base, argument));
      const outside = exprs.enot(inDomain);
      return make(
        makeRule("fapplyexcept", [
          fill(term),
          inDomain,
          isPoint,
          changed,
          inDomain,
          isOther,
          unchanged,
          outside,
          lambda,
          base,
          point,
          value,
          argument,
        ]),
        [],
        [[inDomain, isPoint, changed], [inDomain, isOther, unchanged], [outside]],
      );
    }
    if (isApp(fcn, "TLA.tuple") && isInOneTo(argument, fcn.args.length)) {
      const component = fcn.args[(getNaturalConstant(argument) ?? 0) - 1];
      const replaced = fill(component);
      return make(
        makeRule("tuple_access", [fill(term), replaced, lambda, term, component]),
        [],
        [[replaced]],
      );
    }
    if (isApp(fcn, "TLA.record")) {
      const field = getPairs(fcn.args).find((pair) => pair[0] === argument);
      if (field === undefined) return [];
      const replaced = fill(field[1]);
      return make(
        makeRule("record_access", [fill(term), replaced, lambda, term, field[1]]),
        [],
        [[replaced]],
      );
    }
  }
  if (isApp(term, "TLA.DOMAIN", 1)) {
    const fcn = term.args[0];
    if (isApp(fcn, "TLA.Fcn", 2)) {
      const replaced = fill(fcn.args[0]);
      return make(
        makeRule("domain_fcn", [fill(term), replaced, lambda, fcn.args[0], fcn.args[1]]),
        [],
        [[replaced]],
      );
    }
    if (isApp(fcn, "TLA.except", 3)) {
      const replaced = fill(domain(exprs, fcn.args[0]));
      return make(
        makeRule("domain_except", [
          fill(term),
          replaced,
          lambda,
          fcn.args[0],
          fcn.args[1],
          fcn.args[2],
        ]),
        [],
        [[replaced]],
      );
    }
    if (isApp(fcn, "TLA.record")) {
      const labels = exprs.eapp(
        "TLA.set",
        getPairs(fcn.args).map((pair) => pair[0]),
      );
      const replaced = fill(labels);
      return make(
        makeRule("record_domain", [fill(term), replaced, lambda, term, labels]),
        [],
        [[replaced]],
      );
    }
    return makeHoleRewrites("TLA.DOMAIN", ["TLA.Fcn", "TLA.except", "TLA.record"], fcn);
  }
  if (isInTerm) {
    if (term.kind === "not")
      return makeBoolCase((prefix) => makeRule("boolcase_not", [...prefix, term.args[0]]));
    if (term.kind === "and")
      return makeBoolCase((prefix) => makeRule("boolcase_and", [...prefix, ...term.args]));
    if (term.kind === "or")
      return makeBoolCase((prefix) => makeRule("boolcase_or", [...prefix, ...term.args]));
    if (term.kind === "imply")
      return makeBoolCase((prefix) => makeRule("boolcase_imply", [...prefix, ...term.args]));
    if (term.kind === "equiv")
      return makeBoolCase((prefix) => makeRule("boolcase_equiv", [...prefix, ...term.args]));
    if (isRelation(term) && term.symbol === "=")
      return makeBoolCase((prefix) =>
        makeRule("boolcase_equal", [...prefix, term.args[0], term.args[1]]),
      );
    if (term.kind === "all" || term.kind === "ex") {
      const predicate = exprs.elam(term.args[0], term.symbol, term.args[1]);
      return makeBoolCase((prefix) =>
        makeRule(term.kind === "all" ? "boolcase_all" : "boolcase_ex", [...prefix, predicate]),
      );
    }
  }
  if (isApp(term, "TLA.cond", 3)) {
    const condition = term.args[0];
    const whenTrue = term.args[1];
    const whenFalse = term.args[2];
    if (condition.kind === "true") {
      const replaced = fill(whenTrue);
      return make(
        makeRule("iftrue", [fill(term), replaced, lambda, whenTrue, whenFalse]),
        [],
        [[replaced]],
      );
    }
    if (condition.kind === "false") {
      const replaced = fill(whenFalse);
      return make(
        makeRule("iffalse", [fill(term), replaced, lambda, whenTrue, whenFalse]),
        [],
        [[replaced]],
      );
    }
    const thenBranch = fill(whenTrue);
    const negated = exprs.enot(condition);
    const elseBranch = fill(whenFalse);
    return make(
      makeRule("ifthenelse", [
        fill(term),
        condition,
        thenBranch,
        negated,
        elseBranch,
        lambda,
        condition,
        whenTrue,
        whenFalse,
      ]),
      [],
      [
        [condition, thenBranch],
        [negated, elseBranch],
      ],
    );
  }
  if (isApp(term, "TLA.CASE")) {
    const branches = getCaseBranches(exprs, fill, term.args, TRUE);
    const filled = fill(term);
    return make(makeRule("case", [filled, lambda, ...branches.flat()]), [filled], branches);
  }
  if (term.kind === "tau" && !hasExistential(exprs, index, term)) {
    const exists = exprs.eex(term.args[0], term.symbol, term.args[1]);
    return make(makeRule("cut", [exists]), [], [[exists], [exprs.enot(exists)]]);
  }
  if (isApp(term, "TLA.Len", 1)) {
    const sequence = term.args[0];
    if (isApp(sequence, "TLA.tuple")) {
      const length = makeNatural(exprs, sequence.args.length);
      const replaced = fill(length);
      return make(
        makeRule("tuple_len", [fill(term), replaced, lambda, term, length]),
        [],
        [[replaced]],
      );
    }
    return makeHoleRewrites("TLA.Len", ["TLA.tuple"], sequence);
  }
  if (isApp(term, "TLA.isASeq", 1))
    return makeHoleRewrites("TLA.isASeq", ["TLA.tuple"], term.args[0]);
  if (isApp(term, "TLA.in", 2)) {
    const set = term.args[1];
    return makeHoleRewrites("TLA.in", set.kind === "var" ? [] : SET_HEADS, set, term.args[0]);
  }
  if (isApp(term, "TLA.isAFcn", 1))
    return makeHoleRewrites(
      "TLA.isAFcn",
      ["TLA.Fcn", "TLA.except", "TLA.oneArg", "TLA.extend", "TLA.record"],
      term.args[0],
    );
  return [];
};

const hasExistential = (exprs: Expressions, index: Index, choice: BinderExpr) => {
  const body = choice.args[1];
  if (body.kind === "not")
    return (
      index.isMember(exprs.eex(choice.args[0], choice.symbol, body)) ||
      index.isMember(exprs.enot(exprs.eall(choice.args[0], choice.symbol, body.args[0])))
    );
  return index.isMember(exprs.eex(choice.args[0], choice.symbol, body));
};

// Zenon's find_rewrites: the rewrites of the outermost subterm that has some, looking through
// applications and negations.
const findRewrites = (
  context: TlaContext,
  isInTerm: boolean,
  hole: VarExpr,
  frame: Expr,
  term: Expr,
  make: MakeRewrite,
): Item[] => {
  const exprs = context.exprs;
  const local = getRewrites(context, isInTerm, hole, frame, term, make);
  if (local.length > 0) return local;
  if (isApp(term, "$notequiv", 2)) return [];
  if (term.kind === "app") {
    for (let position = 0; position < term.args.length; position++) {
      const args = [...term.args];
      args[position] = hole;
      const inner = exprs.substitute([[hole, exprs.eapp(term.symbol, args)]], frame);
      const found = findRewrites(context, true, hole, inner, term.args[position], make);
      if (found.length > 0) return found;
    }
    return [];
  }
  if (term.kind === "not")
    return findRewrites(
      context,
      false,
      hole,
      exprs.substitute([[hole, exprs.enot(hole)]], frame),
      term.args[0],
      make,
    );
  return [];
};

export const getRewriteNodes = (context: TlaContext, formula: Expr, goalness: number): Item[] => {
  const exprs = context.exprs;
  const make: MakeRewrite = (rule, added, branches) => {
    const node: Node = {
      conclusions: rule.name === "cut" ? added : [formula, ...added],
      rule,
      priority: "arity",
      goalness,
      branches,
    };
    return rule.name === "ifthenelse" ? [node, "stop"] : [node];
  };
  const hole = exprs.newVar();
  return findRewrites(context, false, hole, hole, formula, make);
};
