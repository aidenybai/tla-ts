// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// Zenon's to_llproof for the TLA+ extension: each rule becomes an extension rule of the low-level
// proof, named after the lemma in Zenon.thy that justifies it.

import { TlaZenonError } from "../../../errors";
import { difference, union, type Expr, type Expressions } from "../expr";
import { connect, type Lemma, type LlProof, type LlRule } from "../llproof";
import type { MlProof, Translated } from "../mltoll";

// The lemma's name, the terms it's instantiated with, the conclusions it uses and its branches.
type LlArgs = [string, Expr[], Expr[], Expr[][]];

type Shape = (name: string, args: Expr[]) => LlArgs;

const getShapeError = (name: string) =>
  new TlaZenonError(`Zenon: the rule ${name} has too few arguments`);

const alpha: Shape = (name, args) => {
  const [conclusion, first, second, ...rest] = args;
  if (second === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [conclusion], [[first, second]]];
};

const beta: Shape = (name, args) => {
  const [conclusion, first, second, ...rest] = args;
  if (second === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [conclusion], [[first], [second]]];
};

const beta2: Shape = (name, args) => {
  const [conclusion, firstA, firstB, secondA, secondB, ...rest] = args;
  if (secondB === undefined) throw getShapeError(name);
  return [
    `zenon_${name}`,
    rest,
    [conclusion],
    [
      [firstA, firstB],
      [secondA, secondB],
    ],
  ];
};

const cut12: Shape = (name, args) => {
  const [first, secondA, secondB, ...rest] = args;
  if (secondB === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [], [[first], [secondA, secondB]]];
};

const single: Shape = (name, args) => {
  const [conclusion, hypothesis, ...rest] = args;
  if (hypothesis === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [conclusion], [[hypothesis]]];
};

const close: Shape = (name, args) => {
  const [conclusion, ...rest] = args;
  if (conclusion === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [conclusion], []];
};

const binsingle: Shape = (name, args) => {
  const [first, second, hypothesis, ...rest] = args;
  if (hypothesis === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [first, second], [[hypothesis]]];
};

const binbeta: Shape = (name, args) => {
  const [first, second, hypothesisA, hypothesisB, ...rest] = args;
  if (hypothesisB === undefined) throw getShapeError(name);
  return [`zenon_${name}`, rest, [first, second], [[hypothesisA], [hypothesisB]]];
};

// A conclusion, two terms and then the hypotheses, in one branch or one branch each.
const withTerms =
  (isSplit: boolean): Shape =>
  (name, args) => {
    const [conclusion, first, second, ...hypotheses] = args;
    if (second === undefined) throw getShapeError(name);
    return [
      `zenon_${name}`,
      [first, second],
      [conclusion],
      isSplit ? hypotheses.map((hypothesis) => [hypothesis]) : [hypotheses],
    ];
  };

// A conclusion and then the hypotheses, in one branch or one branch each.
const withoutTerms =
  (isSplit: boolean): Shape =>
  (name, args) => {
    const [conclusion, ...hypotheses] = args;
    if (conclusion === undefined) throw getShapeError(name);
    return [
      `zenon_${name}`,
      [],
      [conclusion],
      isSplit ? hypotheses.map((hypothesis) => [hypothesis]) : [hypotheses],
    ];
  };

const getCaseBranches = (args: Expr[]): Expr[][] =>
  args.length <= 1
    ? args.length === 0
      ? []
      : [args]
    : [args.slice(0, 2), ...getCaseBranches(args.slice(2))];

// Zenon's to_llargs, by rule name. The rules missing here take one hypothesis.
const SHAPES: Record<string, Shape> = {
  in_emptyset: (name, args) => [`zenon_${name}`, args.slice(1), args.slice(0, 1), []],
  in_nat_0: close,
  in_nat_1: close,
  in_nat_2: close,
  in_upair: beta,
  notin_upair: alpha,
  in_cup: beta,
  notin_cup: alpha,
  in_cap: alpha,
  notin_cap: beta,
  in_setminus: alpha,
  notin_setminus: beta,
  in_subsetof: alpha,
  notin_subsetof: beta,
  in_funcset: (name, args) => {
    const [conclusion, first, second, third, ...rest] = args;
    if (third === undefined) throw getShapeError(name);
    return [`zenon_${name}`, rest, [conclusion], [[first, second, third]]];
  },
  except_notin_funcset: (name, args) => {
    const [conclusion, first, second, ...rest] = args;
    if (second === undefined) throw getShapeError(name);
    return [`zenon_${name}`, rest, [conclusion], [[first], [second]]];
  },
  notin_funcset: (name, args) => {
    const [conclusion, first, second, third, ...rest] = args;
    if (third === undefined) throw getShapeError(name);
    return [`zenon_${name}`, rest, [conclusion], [[first], [second], [third]]];
  },
  trueistrue: binsingle,
  fapplyfcn: beta,
  fapplyexcept: (name, args) => {
    const [conclusion, firstA, firstB, firstC, secondA, secondB, secondC, third, ...rest] = args;
    if (third === undefined) throw getShapeError(name);
    return [
      `zenon_${name}`,
      rest,
      [conclusion],
      [[firstA, firstB, firstC], [secondA, secondB, secondC], [third]],
    ];
  },
  boolcase_not: beta2,
  boolcase_and: beta2,
  boolcase_or: beta2,
  boolcase_imply: beta2,
  boolcase_equiv: beta2,
  boolcase_equal: beta2,
  boolcase_all: beta2,
  boolcase_ex: beta2,
  notisafcn_fcn: close,
  notisafcn_except: close,
  notisafcn_onearg: close,
  notisafcn_extend: close,
  ifthenelse: beta2,
  notequalchoose: cut12,
  case: (name, args) => {
    const [conclusion, predicate, ...rest] = args;
    if (predicate === undefined) throw getShapeError(name);
    return [`zenon_${name}`, [predicate], [conclusion], getCaseBranches(rest)];
  },
  p_eq_l: binbeta,
  p_eq_r: binbeta,
  np_eq_l: binbeta,
  np_eq_r: binbeta,
  all_in: binsingle,
  notex_in: binsingle,
  cup_subseteq: alpha,
  not_cup_subseteq: beta,
  subseteq_cap: alpha,
  not_subseteq_cap: beta,
  tuple_eq_match: withoutTerms(false),
  tuple_eq_mismatch: close,
  in_product: withTerms(false),
  notin_product: withTerms(true),
  tuple_notisaseq: close,
  record_eq_match: withoutTerms(false),
  record_neq_match: withoutTerms(true),
  record_eq_mismatch: close,
  neq_record: withTerms(true),
  record_neq: withTerms(true),
  in_recordset: withTerms(false),
  notin_recordset: withTerms(true),
  record_notisafcn: close,
};

// Zenon's Ext_tla.to_llproof, for a rule of the extension and its translated subproofs.
export const getTlaLlProof = (
  translateExpr: (expression: Expr) => Expr,
  exprs: Expressions,
  proof: MlProof,
  subproofs: Translated[],
): Translated => {
  const tr = translateExpr;
  const rule = proof.rule;
  const member = (element: Expr, set: Expr) => exprs.eapp("TLA.in", [element, set]);
  const equal = (left: Expr, right: Expr) => exprs.eapp("=", [left, right]);
  const extension = (
    conclusions: Expr[],
    name: string,
    args: Expr[],
    ruleConclusions: Expr[],
    branches: Expr[][],
    nodeSubproofs: LlProof[],
  ): LlProof => ({
    conclusions: conclusions.map(tr),
    rule: {
      kind: "extension",
      name,
      args: args.map(tr),
      conclusions: ruleConclusions.map(tr),
      branches: branches.map((branch) => branch.map(tr)),
    },
    subproofs: nodeSubproofs,
  });

  // The membership in an enumerated set, one element at a time.
  const getMembership = (
    element: Expr,
    set: Expr,
    remaining: Translated[],
    conclusions: Expr[],
    isSetOf: boolean,
  ): Translated => {
    const isEmpty = isSetOf
      ? set.kind === "app" && set.symbol === "TLA.set" && set.args.length === 0
      : set.kind === "var" && set.symbol === "TLA.emptyset";
    if (isEmpty)
      return [
        extension(conclusions, "zenon_in_emptyset", [element], [member(element, set)], [], []),
        [],
      ];
    const split =
      set.kind === "app" &&
      set.symbol === (isSetOf ? "TLA.set" : "TLA.addElt") &&
      set.args.length >= (isSetOf ? 1 : 2)
        ? [set.args[0], isSetOf ? exprs.eapp("TLA.set", set.args.slice(1)) : set.args[1]]
        : undefined;
    const first = remaining[0];
    if (split === undefined || first === undefined) {
      if (!isSetOf && remaining.length === 1) return remaining[0];
      throw new TlaZenonError("Zenon: a membership proof that doesn't match its set");
    }
    const value = split[0];
    const rest = split[1];
    const conclusion = member(element, set);
    const isValue = equal(element, value);
    const isInRest = member(element, rest);
    const next = getMembership(
      element,
      rest,
      remaining.slice(1),
      [isInRest, ...conclusions],
      isSetOf,
    );
    const extras = difference(union(first[1], next[1]), conclusions);
    return [
      extension(
        [...extras.toReversed(), ...conclusions],
        "zenon_in_addElt",
        [element, value, rest],
        [conclusion],
        [[isValue], [isInRest]],
        [first[0], next[0]],
      ),
      extras,
    ];
  };

  // The non-membership in an enumerated set, one element at a time.
  const getNonMembership = (
    element: Expr,
    set: Expr,
    sub: Translated,
    conclusions: Expr[],
    isSetOf: boolean,
  ): Translated => {
    const split =
      set.kind === "app" &&
      set.symbol === (isSetOf ? "TLA.set" : "TLA.addElt") &&
      set.args.length >= (isSetOf ? 1 : 2)
        ? [set.args[0], isSetOf ? exprs.eapp("TLA.set", set.args.slice(1)) : set.args[1]]
        : undefined;
    if (split === undefined) return sub;
    const value = split[0];
    const rest = split[1];
    const conclusion = exprs.enot(member(element, set));
    const isNotValue = exprs.enot(equal(element, value));
    const isNotInRest = exprs.enot(member(element, rest));
    const next = getNonMembership(
      element,
      rest,
      sub,
      [isNotValue, isNotInRest, ...conclusions],
      isSetOf,
    );
    const extras = difference(next[1], conclusions);
    return [
      extension(
        [...extras.toReversed(), ...conclusions],
        "zenon_notin_addElt",
        [element, value, rest],
        [conclusion],
        [[isNotValue, isNotInRest]],
        [next[0]],
      ),
      extras,
    ];
  };

  switch (rule.name) {
    case "in_addElt":
    case "in_set":
      return getMembership(
        rule.args[1],
        rule.args[2],
        subproofs,
        proof.conclusions,
        rule.name === "in_set",
      );
    case "notin_addElt":
    case "notin_set": {
      if (subproofs.length !== 1)
        throw new TlaZenonError(`Zenon: ${rule.name} with ${subproofs.length} subproofs`);
      return getNonMembership(
        rule.args[1],
        rule.args[2],
        subproofs[0],
        proof.conclusions,
        rule.name === "notin_set",
      );
    }
    case "notequivdef": {
      if (subproofs.length !== 1)
        throw new TlaZenonError("Zenon: notequivdef with several subproofs");
      return subproofs[0];
    }
    default: {
      const args: Expr[] = rule.args;
      const llArgs = (SHAPES[rule.name] ?? single)(rule.name, args);
      const extras = difference(
        subproofs.reduce((accumulated: Expr[], entry) => union(accumulated, entry[1]), []),
        proof.conclusions,
      );
      return [
        extension(
          [...extras.toReversed(), ...proof.conclusions],
          llArgs[0],
          llArgs[1],
          llArgs[2],
          llArgs[3],
          subproofs.map((entry) => entry[0]),
        ),
        extras,
      ];
    }
  }
};

// Zenon's Ext_tla.postprocess: the lemmas with each $notequiv written as a negated equivalence.
export const postprocessTla = (exprs: Expressions, lemmas: Lemma[]): Lemma[] => {
  const cache = new Map<Expr, Expr>();
  const pp = (expression: Expr): Expr => {
    const cached = cache.get(expression);
    if (cached !== undefined) return cached;
    const result = ((): Expr => {
      switch (expression.kind) {
        case "var":
        case "true":
        case "false":
          return expression;
        case "meta":
          throw new TlaZenonError("Zenon: a metavariable in a low-level proof");
        case "app": {
          if (expression.symbol !== "$notequiv")
            return exprs.eapp(expression.symbol, expression.args.map(pp));
          if (expression.args.length !== 2)
            throw new TlaZenonError("Zenon: $notequiv without two arguments");
          const right = pp(expression.args[1]);
          return exprs.enot(exprs.eequiv(pp(expression.args[0]), right));
        }
        case "not":
          return exprs.enot(pp(expression.args[0]));
        case "and":
        case "or":
        case "imply":
        case "equiv": {
          const right = pp(expression.args[1]);
          return connect(exprs, expression.kind, pp(expression.args[0]), right);
        }
        case "all":
          return exprs.eall(expression.args[0], expression.symbol, pp(expression.args[1]));
        case "ex":
          return exprs.eex(expression.args[0], expression.symbol, pp(expression.args[1]));
        case "tau":
          return exprs.etau(expression.args[0], expression.symbol, pp(expression.args[1]));
        case "lam":
          return exprs.elam(expression.args[0], expression.symbol, pp(expression.args[1]));
      }
    })();
    cache.set(expression, result);
    return result;
  };
  const ppRule = (rule: LlRule): LlRule => {
    switch (rule.kind) {
      case "false":
      case "nottrue":
        return rule;
      case "axiom":
      case "cut":
      case "notnot":
        return { kind: rule.kind, formula: pp(rule.formula) };
      case "noteq":
        return { kind: "noteq", term: pp(rule.term) };
      case "eqsym":
      case "notequal":
        return { kind: rule.kind, left: pp(rule.left), right: pp(rule.right) };
      case "connect":
      case "notconnect":
        return {
          kind: rule.kind,
          connective: rule.connective,
          left: pp(rule.left),
          right: pp(rule.right),
        };
      case "ex":
      case "all":
      case "notex":
      case "notall":
        return { kind: rule.kind, quantified: pp(rule.quantified), term: pp(rule.term) };
      case "pnotp":
        return { kind: "pnotp", positive: pp(rule.positive), negative: pp(rule.negative) };
      case "congruencelr":
      case "congruencerl":
        return {
          kind: rule.kind,
          context: pp(rule.context),
          left: pp(rule.left),
          right: pp(rule.right),
        };
      case "definition":
        return {
          kind: "definition",
          name: rule.name,
          folded: pp(rule.folded),
          unfolded: pp(rule.unfolded),
        };
      case "extension":
        return {
          kind: "extension",
          name: rule.name,
          args: rule.args.map(pp),
          conclusions: rule.conclusions.map(pp),
          branches: rule.branches.map((branch) => branch.map(pp)),
        };
      case "lemma":
        return { kind: "lemma", name: rule.name, args: rule.args.map(pp) };
    }
  };
  const ppTree = (tree: LlProof): LlProof => ({
    conclusions: tree.conclusions.map(pp),
    rule: ppRule(tree.rule),
    subproofs: tree.subproofs.map(ppTree),
  });
  return lemmas.map((lemma) => ({
    name: lemma.name,
    params: lemma.params.map((param): [string, Expr] => [param[0], pp(param[1])]),
    proof: ppTree(lemma.proof),
  }));
};
