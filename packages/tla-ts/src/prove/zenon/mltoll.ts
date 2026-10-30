// Ported from Zenon's mltoll.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// Translates the proof that the search finds into a low-level proof: the derived rules expand into
// core rules, and each proof that the search reused becomes a lemma.

import { TlaZenonError } from "../../errors";
import type { Direction, Origin, Relations } from "./eqrel";
import {
  difference,
  union,
  type BinderExpr,
  type Expr,
  type Expressions,
  type VarExpr,
} from "./expr";
import { connect, type Connective, type Lemma, type LlProof, type LlRule } from "./llproof";
import type { Definition, Phrase } from "./parse";
import type { Rule } from "./proof";
import { getTlaLlProof } from "./tla/llproof";

// The search's proofs, and the rule that only the translation builds.
export type MlRule = Rule | { name: "notall" | "notallex"; args: [Expr] };

export interface MlProof {
  conclusions: Expr[];
  rule: MlRule;
  subproofs: MlProof[];
}

// A translated proof, with the hypotheses it uses that aren't conclusions of the node.
export type Translated = [LlProof, Expr[]];

export interface TranslateContext {
  exprs: Expressions;
  // Zenon's Index.get_number, which also names the formulas in the Isar output.
  getNumber: (expression: Expr) => number;
  // The proofs that the search reused, which Zenon counts in mlrefc.
  sharedProofs: ReadonlySet<MlProof>;
  relations: Relations;
}

type RelationProperty = "reflexive" | "symmetric" | "transitive";

// Zenon's Eqrel.hyp_kind: how to prove a hypothesis about a relation. A relation is also
// symmetric or transitive when it's reflexive and transitive in the symmetric sense.
type HypothesisKind =
  | { kind: "reflexive"; origin: Origin }
  | { kind: "symmetric"; origin: Origin }
  | { kind: "transitive"; origin: Origin }
  | {
      kind: "symmetric2" | "transitive2";
      relation: string;
      reflexive: Origin;
      transitiveSymmetric: Origin;
    };

const LEMMA_PREFIX = "zenon_L";
const META_PREFIX = "zenon_X";

export const isMetaName = (name: string) => name.startsWith(META_PREFIX);

const isAlphanumeric = (char: string) => /^[A-Za-z0-9]$/.test(char);

// Zenon's type_to_ident.
const toIdentifier = (type: string) =>
  [...type]
    .map((char) =>
      isAlphanumeric(char) ? char : `_${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
    )
    .join("");

const getBinder = (expression: Expr, kind: BinderExpr["kind"]) => {
  if (expression.kind !== kind) throw new TlaZenonError(`Zenon: expected a ${kind} binder`);
  return expression;
};

const getSingle = (proof: MlProof) => {
  if (proof.subproofs.length !== 1) throw new TlaZenonError("Zenon: expected one subproof");
  return proof.subproofs[0];
};

// Zenon's Mlproof.make_node: the node's conclusions and those its subproofs leave open.
const makeNode = (
  conclusions: Expr[],
  rule: MlRule,
  branches: Expr[][],
  subproofs: MlProof[],
): MlProof => ({
  conclusions: union(
    conclusions,
    subproofs
      .map((subproof, position) => difference(subproof.conclusions, branches[position]))
      .reduce((accumulated, extra) => union(accumulated, extra), []),
  ),
  rule,
  subproofs,
});

const isDerived = (rule: MlRule) => {
  switch (rule.name) {
    case "close_refl":
    case "close_sym":
      return rule.relation !== "=";
    case "definition":
      return rule.definition.kind !== "real";
    case "conj_tree":
    case "disj_tree":
    case "not_all_ex":
    case "refl":
    case "p_not_p_sym":
    case "trans":
    case "trans_sym":
    case "trans_eq":
    case "trans_eq2":
    case "trans_eq_sym":
      return true;
    default:
      return !CORE_RULES.has(rule.name);
  }
};

// The rules that tr_rule translates directly: the core rules and the extension rules named "".
const CORE_RULES = new Set<string>([
  "close",
  "false",
  "not_true",
  "not_not",
  "and",
  "not_or",
  "not_impl",
  "ex",
  "all",
  "not_ex",
  "or",
  "impl",
  "not_and",
  "equiv",
  "not_equiv",
  "p_not_p",
  "not_equal",
  "cut",
  "congruence_lr",
  "congruence_rl",
  "notall",
  "notallex",
  "stringequal",
  "stringdiffll",
  "stringdifflr",
  "stringdiffrl",
  "stringdiffrr",
]);

// Zenon's Mltoll.translate: the lemmas in the order they were made, then the theorem.
export const translateProof = (
  context: TranslateContext,
  phrases: Phrase[],
  proof: MlProof,
): Lemma[] => {
  const exprs = context.exprs;
  const translatedExprs = new Map<Expr, Expr>();
  const lemmaNumbers = new Map<MlProof, number>();
  const lemmaTable = new Map<string, [Lemma, Expr[]]>();
  const lemmas: Lemma[] = [];
  const getLemmaName = (number: number) => `${LEMMA_PREFIX}${number}_`;

  const equal = (left: Expr, right: Expr) => exprs.eapp("=", [left, right]);

  // Zenon's tr_expr: metavariables become variables named after their quantifier.
  const translateExpr = (expression: Expr): Expr => {
    if (expression.metas.length === 0) return expression;
    const cached = translatedExprs.get(expression);
    if (cached !== undefined) return cached;
    const result = ((): Expr => {
      switch (expression.kind) {
        case "meta": {
          const quantified = expression.args[0];
          if (quantified.kind !== "all" && quantified.kind !== "ex")
            throw new TlaZenonError("Zenon: a metavariable without a quantifier");
          return exprs.evar(
            `${META_PREFIX}${context.getNumber(quantified)}_${toIdentifier(quantified.symbol)}`,
          );
        }
        case "app":
          return exprs.eapp(expression.symbol, expression.args.map(translateExpr));
        case "not":
          return exprs.enot(translateExpr(expression.args[0]));
        case "and":
        case "or":
        case "imply":
        case "equiv": {
          const right = translateExpr(expression.args[1]);
          return connect(exprs, expression.kind, translateExpr(expression.args[0]), right);
        }
        case "all":
        case "ex":
        case "tau":
        case "lam":
          return makeBinder(
            expression.kind,
            expression.args[0],
            expression.symbol,
            translateExpr(expression.args[1]),
          );
        default:
          return expression;
      }
    })();
    translatedExprs.set(expression, result);
    return result;
  };

  const makeBinder = (kind: BinderExpr["kind"], variable: VarExpr, type: string, body: Expr) =>
    kind === "all"
      ? exprs.eall(variable, type, body)
      : kind === "ex"
        ? exprs.eex(variable, type, body)
        : kind === "tau"
          ? exprs.etau(variable, type, body)
          : exprs.elam(variable, type, body);

  const translateRule = (rule: MlRule): LlRule => {
    const tr = translateExpr;
    switch (rule.name) {
      case "close":
        return { kind: "axiom", formula: tr(rule.args[0]) };
      case "close_refl":
        return { kind: "noteq", term: tr(rule.args[0]) };
      case "close_sym": {
        const right = tr(rule.args[1]);
        return { kind: "eqsym", left: tr(rule.args[0]), right };
      }
      case "false":
        return { kind: "false" };
      case "not_true":
        return { kind: "nottrue" };
      case "not_not":
        return { kind: "notnot", formula: tr(rule.args[0]) };
      case "and":
      case "or":
      case "impl":
      case "equiv": {
        const right = tr(rule.args[1]);
        return {
          kind: "connect",
          connective: RULE_CONNECTIVES[rule.name],
          left: tr(rule.args[0]),
          right,
        };
      }
      case "not_or":
      case "not_impl":
      case "not_and":
      case "not_equiv": {
        const right = tr(rule.args[1]);
        return {
          kind: "notconnect",
          connective: RULE_CONNECTIVES[rule.name],
          left: tr(rule.args[0]),
          right,
        };
      }
      case "ex": {
        const quantified = getBinder(rule.args[0], "ex");
        const term = tr(exprs.etau(quantified.args[0], quantified.symbol, quantified.args[1]));
        return { kind: "ex", quantified: tr(quantified), term };
      }
      case "all": {
        const term = tr(rule.args[1]);
        return { kind: "all", quantified: tr(rule.args[0]), term };
      }
      case "not_ex": {
        const negation = rule.args[0];
        if (negation.kind !== "not") throw new TlaZenonError("Zenon: not_ex without a negation");
        const term = tr(rule.args[1]);
        return { kind: "notex", quantified: tr(negation.args[0]), term };
      }
      case "p_not_p": {
        const negative = tr(rule.args[1]);
        return { kind: "pnotp", positive: tr(rule.args[0]), negative };
      }
      case "not_equal": {
        const right = tr(rule.args[1]);
        return { kind: "notequal", left: tr(rule.args[0]), right };
      }
      case "definition": {
        if (rule.definition.kind !== "real")
          throw new TlaZenonError("Zenon: a pseudo-definition in tr_rule");
        const unfolded = tr(rule.args[1]);
        return {
          kind: "definition",
          name: rule.definition.name,
          folded: tr(rule.args[0]),
          unfolded,
        };
      }
      case "cut":
        return { kind: "cut", formula: tr(rule.args[0]) };
      case "congruence_lr":
      case "congruence_rl": {
        const right = tr(rule.args[2]);
        const left = tr(rule.args[1]);
        return {
          kind: rule.name === "congruence_lr" ? "congruencelr" : "congruencerl",
          context: tr(rule.args[0]),
          left,
          right,
        };
      }
      case "notall": {
        const negation = rule.args[0];
        const quantified = getBinder(negation.kind === "not" ? negation.args[0] : negation, "all");
        const term = tr(
          exprs.etau(quantified.args[0], quantified.symbol, exprs.enot(quantified.args[1])),
        );
        return { kind: "notall", quantified: tr(quantified), term };
      }
      case "notallex": {
        const lambda = getBinder(rule.args[0], "lam");
        const variable = lambda.args[0];
        const body = lambda.args[1];
        const conclusion = exprs.enot(exprs.eall(variable, lambda.symbol, body));
        const hypothesis = exprs.eex(variable, lambda.symbol, exprs.enot(body));
        return {
          kind: "extension",
          name: "zenon_notallex",
          args: [lambda],
          conclusions: [conclusion],
          branches: [[hypothesis]],
        };
      }
      case "stringequal": {
        const first = rule.args[0];
        const second = rule.args[1];
        const conclusion = equal(exprs.eapp("$string", [first]), exprs.eapp("$string", [second]));
        return {
          kind: "extension",
          name: "zenon_stringequal",
          args: [first, second],
          conclusions: [conclusion],
          branches: [],
        };
      }
      case "stringdiffll":
      case "stringdifflr":
      case "stringdiffrl":
      case "stringdiffrr": {
        const [first, firstValue, second, secondValue] = rule.args;
        const isFirstLeft = rule.name === "stringdiffll" || rule.name === "stringdifflr";
        const isSecondLeft = rule.name === "stringdiffll" || rule.name === "stringdiffrl";
        const firstConclusion = isFirstLeft ? equal(first, firstValue) : equal(firstValue, first);
        const secondConclusion = isSecondLeft
          ? equal(second, secondValue)
          : equal(secondValue, second);
        const hypothesis = exprs.enot(equal(first, second));
        return {
          kind: "extension",
          // HACK: Zenon names the last of the four rules after the third.
          name: rule.name === "stringdiffrr" ? "zenon_stringdiffrl" : `zenon_${rule.name}`,
          args: rule.args,
          conclusions: [firstConclusion, secondConclusion],
          branches: [[hypothesis]],
        };
      }
      default:
        throw new TlaZenonError(`Zenon: the derived rule ${rule.name} in tr_rule`);
    }
  };

  // Zenon's get_params: the free taus of a lemma's conclusions, each with its type.
  const getParams = (accumulated: [string, Expr][], expression: Expr): [string, Expr][] => {
    const merge = (type: string, term: Expr): [string, Expr][] =>
      accumulated.some((param) => param[1] === term) ? accumulated : [[type, term], ...accumulated];
    switch (expression.kind) {
      case "tau":
        return merge(expression.symbol, expression);
      case "all":
      case "ex":
      case "lam":
        return getParams(accumulated, expression.args[1]);
      case "meta":
        throw new TlaZenonError("Zenon: a metavariable in a translated formula");
      default:
        return expression.args.reduce(getParams, accumulated);
    }
  };

  const getLemmaReference = (proof: MlProof): Translated => {
    const number = lemmaNumbers.get(proof);
    const entry = number === undefined ? undefined : lemmaTable.get(getLemmaName(number));
    if (entry === undefined) throw new TlaZenonError("Zenon: a lemma that was never made");
    const lemma = entry[0];
    return [
      {
        conclusions: lemma.proof.conclusions,
        rule: { kind: "lemma", name: lemma.name, args: lemma.params.map((param) => param[1]) },
        subproofs: [],
      },
      entry[1],
    ];
  };

  const makeLemma = (translated: LlProof, extras: Expr[], proof: MlProof) => {
    const number = lemmas.length + 1;
    lemmaNumbers.set(proof, number);
    const lemma = {
      name: getLemmaName(number),
      params: translated.conclusions.reduce(getParams, []),
      proof: translated,
    };
    lemmaTable.set(lemma.name, [lemma, extras]);
    lemmas.push(lemma);
  };

  const translate = (proof: MlProof): Translated => {
    if (lemmaNumbers.has(proof)) return getLemmaReference(proof);
    const result = isDerived(proof.rule)
      ? translateDerived(proof)
      : ((): Translated => {
          const subproofs = translateAll(proof.subproofs);
          const extras = difference(subproofs[1], proof.conclusions);
          return [
            {
              conclusions: [...extras.toReversed(), ...proof.conclusions].map(translateExpr),
              rule: translateRule(proof.rule),
              subproofs: subproofs[0],
            },
            extras,
          ];
        })();
    if (!isSharedProof(proof)) return result;
    makeLemma(result[0], result[1], proof);
    return getLemmaReference(proof);
  };

  const isSharedProof = (proof: MlProof) =>
    context.sharedProofs.has(proof) && !lemmaNumbers.has(proof);

  // Zenon's get_sub: the subproofs, and the union of their extras from the right.
  const translateAll = (proofs: MlProof[]): [LlProof[], Expr[]] => {
    const translated = proofs.map(translate);
    return [
      translated.map((entry) => entry[0]),
      translated.reduceRight((accumulated: Expr[], entry) => union(entry[1], accumulated), []),
    ];
  };

  // A node of recomp_conj, with the formulas it removes from its subproof's conclusions.
  const recompose = (
    conclusion: Expr,
    rule: LlRule,
    removed: Expr[],
    next: Translated,
    extra: Expr,
  ): Translated => [
    {
      conclusions: union([conclusion], difference(next[0].conclusions, removed)),
      rule,
      subproofs: [next[0]],
    },
    difference(next[1], [extra]),
  ];

  const recompConj = (sub: Translated, formula: Expr): Translated => {
    if (formula.kind === "not") return recompConjNegated(sub, formula.args[0]);
    if (formula.kind !== "and") return sub;
    const left = translateExpr(formula.args[0]);
    const right = translateExpr(formula.args[1]);
    const second = recompConj(recompConj(sub, formula.args[0]), formula.args[1]);
    return recompose(
      translateExpr(formula),
      { kind: "connect", connective: "and", left, right },
      [left, right],
      second,
      formula,
    );
  };

  const recompConjNegated = (sub: Translated, formula: Expr): Translated => {
    const conclusion = exprs.enot(translateExpr(formula));
    const negation = exprs.enot(formula);
    switch (formula.kind) {
      case "or": {
        const left = translateExpr(formula.args[0]);
        const right = translateExpr(formula.args[1]);
        const second = recompConjNegated(recompConjNegated(sub, formula.args[0]), formula.args[1]);
        return recompose(
          conclusion,
          { kind: "notconnect", connective: "or", left, right },
          [exprs.enot(left), exprs.enot(right)],
          second,
          negation,
        );
      }
      case "imply": {
        const left = translateExpr(formula.args[0]);
        const right = translateExpr(formula.args[1]);
        const second = recompConjNegated(recompConj(sub, formula.args[0]), formula.args[1]);
        return recompose(
          conclusion,
          { kind: "notconnect", connective: "imply", left, right },
          [left, exprs.enot(right)],
          second,
          negation,
        );
      }
      case "not": {
        const operand = translateExpr(formula.args[0]);
        return recompose(
          conclusion,
          { kind: "notnot", formula: operand },
          [operand],
          recompConj(sub, formula.args[0]),
          negation,
        );
      }
      default:
        return sub;
    }
  };

  // Zenon's recomp_disj: consumes the translated subproofs, one for each disjunct.
  const recompDisj = (subs: Translated[], formula: Expr): [LlProof, Expr[], Translated[]] => {
    const node = (
      conclusion: Expr,
      connectiveName: Connective,
      negated: boolean,
      left: Expr,
      right: Expr,
      first: [LlProof, Expr[], Translated[]],
      firstRemoved: Expr,
      second: [LlProof, Expr[], Translated[]],
      secondRemoved: Expr,
      extra: Expr,
    ): [LlProof, Expr[], Translated[]] => [
      {
        conclusions: union(
          [conclusion],
          union(
            difference(first[0].conclusions, [firstRemoved]),
            difference(second[0].conclusions, [secondRemoved]),
          ),
        ),
        rule: { kind: negated ? "notconnect" : "connect", connective: connectiveName, left, right },
        subproofs: [first[0], second[0]],
      },
      difference(union(first[1], second[1]), [extra]),
      second[2],
    ];
    switch (formula.kind) {
      case "or": {
        const left = translateExpr(formula.args[0]);
        const right = translateExpr(formula.args[1]);
        const first = recompDisj(subs, formula.args[0]);
        const second = recompDisj(first[2], formula.args[1]);
        return node(
          translateExpr(formula),
          "or",
          false,
          left,
          right,
          first,
          left,
          second,
          right,
          formula,
        );
      }
      case "imply": {
        const left = translateExpr(formula.args[0]);
        const right = translateExpr(formula.args[1]);
        const first = recompDisjNegated(subs, formula.args[0]);
        const second = recompDisj(first[2], formula.args[1]);
        return node(
          translateExpr(formula),
          "imply",
          false,
          left,
          right,
          first,
          exprs.enot(left),
          second,
          right,
          formula,
        );
      }
      case "not":
        return recompDisjNegated(subs, formula.args[0]);
      default:
        return takeSub(subs);
    }
  };

  const recompDisjNegated = (
    subs: Translated[],
    formula: Expr,
  ): [LlProof, Expr[], Translated[]] => {
    switch (formula.kind) {
      case "and": {
        const left = translateExpr(formula.args[0]);
        const right = translateExpr(formula.args[1]);
        const first = recompDisjNegated(subs, formula.args[0]);
        const second = recompDisjNegated(first[2], formula.args[1]);
        const negation = exprs.enot(formula);
        return [
          {
            conclusions: union(
              [exprs.enot(translateExpr(formula))],
              union(
                difference(first[0].conclusions, [exprs.enot(left)]),
                difference(second[0].conclusions, [exprs.enot(right)]),
              ),
            ),
            rule: { kind: "notconnect", connective: "and", left, right },
            subproofs: [first[0], second[0]],
          },
          difference(union(first[1], second[1]), [negation]),
          second[2],
        ];
      }
      case "not": {
        const operand = translateExpr(formula.args[0]);
        const first = recompDisj(subs, formula.args[0]);
        return [
          {
            conclusions: union(
              [exprs.enot(translateExpr(formula))],
              difference(first[0].conclusions, [operand]),
            ),
            rule: { kind: "notnot", formula: operand },
            subproofs: [first[0]],
          },
          difference(first[1], [exprs.enot(formula)]),
          first[2],
        ];
      }
      default:
        return takeSub(subs);
    }
  };

  const takeSub = (subs: Translated[]): [LlProof, Expr[], Translated[]] => {
    if (subs.length === 0) throw new TlaZenonError("Zenon: a disjunction tree without subproofs");
    return [subs[0][0], subs[0][1], subs.slice(1)];
  };

  // The constructors of Zenon's Mlproof, for the proofs that the translation builds.
  const makeClose = (formula: Expr) =>
    makeNode([formula, exprs.enot(formula)], { name: "close", args: [formula] }, [], []);
  const makeCloseRefl = (relation: string, term: Expr) =>
    makeNode(
      [exprs.enot(exprs.eapp(relation, [term, term]))],
      { name: "close_refl", relation, args: [term] },
      [],
      [],
    );
  const makeCloseSym = (relation: string, left: Expr, right: Expr) =>
    makeNode(
      [exprs.eapp(relation, [left, right]), exprs.enot(exprs.eapp(relation, [right, left]))],
      { name: "close_sym", relation, args: [left, right] },
      [],
      [],
    );
  const makeNotNot = (formula: Expr, subproof: MlProof) =>
    makeNode(
      [exprs.enot(exprs.enot(formula))],
      { name: "not_not", args: [formula] },
      [[formula]],
      [subproof],
    );
  const makeAnd = (left: Expr, right: Expr, subproof: MlProof) =>
    makeNode(
      [exprs.eand(left, right)],
      { name: "and", args: [left, right] },
      [[left, right]],
      [subproof],
    );
  const makeImply = (left: Expr, right: Expr, first: MlProof, second: MlProof) =>
    makeNode(
      [exprs.eimply(left, right)],
      { name: "impl", args: [left, right] },
      [[exprs.enot(left)], [right]],
      [first, second],
    );
  const makeNotAnd = (left: Expr, right: Expr, first: MlProof, second: MlProof) =>
    makeNode(
      [exprs.enot(exprs.eand(left, right))],
      { name: "not_and", args: [left, right] },
      [[exprs.enot(left)], [exprs.enot(right)]],
      [first, second],
    );
  const makeAll = (quantified: Expr, term: Expr, subproof: MlProof) => {
    const binder = getBinder(quantified, "all");
    const instance = exprs.substitute([[binder.args[0], term]], binder.args[1]);
    return makeNode(
      [quantified],
      { name: "all", args: [quantified, term] },
      [[instance]],
      [subproof],
    );
  };
  const makeAlls = (quantified: Expr, terms: Expr[], subproof: MlProof): MlProof => {
    if (terms.length === 0) return subproof;
    const binder = getBinder(quantified, "all");
    const instance = exprs.substitute([[binder.args[0], terms[0]]], binder.args[1]);
    return makeAll(quantified, terms[0], makeAlls(instance, terms.slice(1), subproof));
  };
  // Zenon's make_impls: the implications from `hypotheses` to `conclusion`, and their proof.
  const makeImplies = (
    hypotheses: Expr[],
    conclusion: Expr,
    proofs: MlProof[],
    conclusionProof: MlProof,
  ): [Expr, MlProof] => {
    if (hypotheses.length === 0) return [conclusion, conclusionProof];
    const rest = makeImplies(hypotheses.slice(1), conclusion, proofs.slice(1), conclusionProof);
    return [
      exprs.eimply(hypotheses[0], rest[0]),
      makeImply(hypotheses[0], rest[0], proofs[0], rest[1]),
    ];
  };
  const makePNotP = (positive: Expr, negative: Expr, subproofs: MlProof[]) => {
    if (positive.kind !== "app" || negative.kind !== "not" || negative.args[0].kind !== "app")
      throw new TlaZenonError("Zenon: make_pnp on a formula that isn't an application");
    const negativeArgs = negative.args[0].args;
    return makeNode(
      [positive, negative],
      { name: "p_not_p", args: [positive, negative] },
      positive.args.map((arg, position) => [exprs.enot(equal(arg, negativeArgs[position]))]),
      subproofs,
    );
  };
  const makeCut = (formula: Expr, first: MlProof, second: MlProof) =>
    makeNode(
      [],
      { name: "cut", args: [formula] },
      [[formula], [exprs.enot(formula)]],
      [first, second],
    );

  // Zenon's Eqrel.get_refl_hyp, get_sym_hyp and get_trans_hyp: the hypothesis that states a
  // property of a relation, which the translation proves from the hypotheses that implied it.
  const relationHypotheses = new Map<string, Expr>();
  const hypothesisKinds = new Map<Expr, HypothesisKind>();
  const getRelationHypothesis = (property: RelationProperty, relation: string) => {
    const key = `${property} ${relation}`;
    const existing = relationHypotheses.get(key);
    if (existing !== undefined) return existing;
    const info = context.relations.get(relation);
    if (relation === "=" || info === undefined)
      throw new TlaZenonError(`Zenon: no ${property} hypothesis for ${relation}`);
    const type = info.type;
    const x = exprs.evar("x");
    const y = exprs.evar("y");
    const z = exprs.evar("z");
    const hypothesis =
      property === "reflexive"
        ? exprs.eall(x, type, relate(relation, x, x))
        : property === "symmetric"
          ? exprs.eall(
              x,
              type,
              exprs.eall(y, type, exprs.eimply(relate(relation, x, y), relate(relation, y, x))),
            )
          : exprs.eall(
              x,
              type,
              exprs.eall(
                y,
                type,
                exprs.eall(
                  z,
                  type,
                  exprs.eimply(
                    relate(relation, x, y),
                    exprs.eimply(relate(relation, y, z), relate(relation, x, z)),
                  ),
                ),
              ),
            );
    relationHypotheses.set(key, hypothesis);
    const direct = info[property];
    const kind = ((): HypothesisKind | undefined => {
      if (direct !== undefined) return { kind: property, origin: direct };
      if (property === "reflexive" || info.reflexive === undefined) return undefined;
      if (info.transitiveSymmetric === undefined) return undefined;
      return {
        kind: property === "symmetric" ? "symmetric2" : "transitive2",
        relation,
        reflexive: info.reflexive,
        transitiveSymmetric: info.transitiveSymmetric,
      };
    })();
    if (kind === undefined) throw new TlaZenonError(`Zenon: ${relation} isn't ${property}`);
    hypothesisKinds.set(hypothesis, kind);
    return hypothesis;
  };

  // Zenon's inst_nall: the instance of a negated universal at its counterexample.
  const instantiateNegation = (negation: Expr): [Expr, Expr] => {
    if (negation.kind !== "not") throw new TlaZenonError("Zenon: inst_nall without a negation");
    const binder = getBinder(negation.args[0], "all");
    const body = exprs.enot(binder.args[1]);
    const witness = exprs.etau(binder.args[0], binder.symbol, body);
    return [exprs.substitute([[binder.args[0], witness]], body), witness];
  };

  // Zenon's decompose_disj: closes each literal of a disjunction with one of `forms`.
  const decomposeDisjunction = (formula: Expr, forms: Expr[]): MlProof => {
    const visit = (disjunct: Expr) => decomposeDisjunction(disjunct, forms);
    const getForm = (form: Expr) => {
      if (!forms.includes(form)) throw new TlaZenonError("Zenon: decompose_disj lacks a literal");
      return form;
    };
    switch (formula.kind) {
      case "or":
        return makeNode(
          [formula],
          { name: "or", args: [formula.args[0], formula.args[1]] },
          [[formula.args[0]], [formula.args[1]]],
          [visit(formula.args[0]), visit(formula.args[1])],
        );
      case "imply": {
        const negated = exprs.enot(formula.args[0]);
        return makeNode(
          [formula],
          { name: "impl", args: [formula.args[0], formula.args[1]] },
          [[negated], [formula.args[1]]],
          [visit(negated), visit(formula.args[1])],
        );
      }
      case "false":
        return makeNode([formula], { name: "false", args: [] }, [], []);
      case "app":
        return makeNode(
          [formula, getForm(exprs.enot(formula))],
          { name: "close", args: [formula] },
          [],
          [],
        );
      case "not": {
        const operand = formula.args[0];
        if (operand.kind === "and") {
          const left = exprs.enot(operand.args[0]);
          const right = exprs.enot(operand.args[1]);
          return makeNode(
            [formula],
            { name: "not_and", args: [operand.args[0], operand.args[1]] },
            [[left], [right]],
            [visit(left), visit(right)],
          );
        }
        if (operand.kind === "not")
          return makeNode(
            [formula],
            { name: "not_not", args: [operand.args[0]] },
            [[operand.args[0]]],
            [visit(operand.args[0])],
          );
        if (operand.kind === "true")
          return makeNode([formula], { name: "not_true", args: [] }, [], []);
        if (operand.kind === "app")
          return makeNode([getForm(operand), formula], { name: "close", args: [operand] }, [], []);
        throw new TlaZenonError("Zenon: decompose_disj on an unexpected formula");
      }
      default:
        throw new TlaZenonError("Zenon: decompose_disj on an unexpected formula");
    }
  };

  // Zenon's decompose_conj: follows `directions` to the conjunct that states a property, and
  // instantiates the quantifiers at `variables` with `witnesses`, the others with metavariables.
  const decomposeConjunction = (
    position: number,
    formula: Expr,
    directions: Direction[],
    variables: number[],
    forms: Expr[],
    witnesses: Expr[],
  ): MlProof => {
    const next = (subformula: Expr, rest: Direction[]) =>
      decomposeConjunction(position, subformula, rest, variables, forms, witnesses);
    const direction = directions[0];
    const rest = directions.slice(1);
    const instantiate = (
      quantified: Expr,
      binder: BinderExpr,
      body: (instance: Expr) => Expr,
      name: "all" | "not_ex",
    ) => {
      const isWitness = variables[0] === position;
      const term = isWitness ? witnesses[0] : exprs.emeta(binder);
      if (term === undefined) throw new TlaZenonError("Zenon: decompose_conj ran out of witnesses");
      const instance = body(exprs.substitute([[binder.args[0], term]], binder.args[1]));
      const subproof = decomposeConjunction(
        position + 1,
        instance,
        directions,
        isWitness ? variables.slice(1) : variables,
        forms,
        isWitness ? witnesses.slice(1) : witnesses,
      );
      return makeNode([quantified], { name, args: [quantified, term] }, [[instance]], [subproof]);
    };
    if (formula.kind === "and" && direction !== undefined) {
      const branch = direction === "left" ? formula.args[0] : formula.args[1];
      return makeNode(
        [formula],
        { name: "and", args: [formula.args[0], formula.args[1]] },
        [[branch]],
        [next(branch, rest)],
      );
    }
    if (formula.kind === "all") return instantiate(formula, formula, (instance) => instance, "all");
    if (formula.kind === "equiv" && direction !== undefined) {
      const left = formula.args[0];
      const right = formula.args[1];
      const rule: MlRule = { name: "equiv", args: [left, right] };
      return direction === "left"
        ? makeNode(
            [formula],
            rule,
            [[exprs.enot(left)], [right]],
            [decomposeDisjunction(exprs.enot(left), forms), decomposeDisjunction(right, forms)],
          )
        : makeNode(
            [formula],
            rule,
            [[exprs.enot(right)], [left]],
            [decomposeDisjunction(exprs.enot(right), forms), decomposeDisjunction(left, forms)],
          );
    }
    const operand = formula.kind === "not" ? formula.args[0] : undefined;
    if (operand?.kind === "or" && direction !== undefined) {
      const branch = exprs.enot(direction === "left" ? operand.args[0] : operand.args[1]);
      return makeNode(
        [formula],
        { name: "not_or", args: [operand.args[0], operand.args[1]] },
        [[branch]],
        [next(branch, rest)],
      );
    }
    if (operand?.kind === "imply" && direction !== undefined) {
      const branch = direction === "left" ? operand.args[0] : exprs.enot(operand.args[1]);
      // HACK: Zenon names the right branch of a negated implication not_or.
      const name = direction === "left" ? "not_impl" : "not_or";
      return makeNode(
        [formula],
        { name, args: [operand.args[0], operand.args[1]] },
        [[branch]],
        [next(branch, rest)],
      );
    }
    if (operand?.kind === "ex")
      return instantiate(formula, operand, (instance) => exprs.enot(instance), "not_ex");
    if (operand?.kind === "not")
      return makeNode(
        [formula],
        { name: "not_not", args: [operand.args[0]] },
        [[operand.args[0]]],
        [next(operand.args[0], directions)],
      );
    if (operand?.kind === "equiv" && direction !== undefined) {
      const left = operand.args[0];
      const right = operand.args[1];
      const rule: MlRule = { name: "not_equiv", args: [left, right] };
      // HACK: Zenon's right branch proves its second case from the negation of `right`.
      return direction === "left"
        ? makeNode(
            [formula],
            rule,
            [[right], [left]],
            [decomposeDisjunction(right, forms), decomposeDisjunction(left, forms)],
          )
        : makeNode(
            [formula],
            rule,
            [[exprs.enot(left)], [right]],
            [
              decomposeDisjunction(exprs.enot(left), forms),
              decomposeDisjunction(exprs.enot(right), forms),
            ],
          );
    }
    if (directions.length > 0 || variables.length > 0 || witnesses.length > 0)
      throw new TlaZenonError("Zenon: decompose_conj left directions or variables");
    return decomposeDisjunction(formula, forms);
  };

  // Zenon's Eqrel.get_proof: proves a relation hypothesis from the hypotheses that implied it,
  // and returns the proof with those hypotheses.
  const getRelationProof = (hypothesis: Expr): [MlProof, Expr[]] => {
    const kind = hypothesisKinds.get(hypothesis);
    if (kind === undefined)
      throw new TlaZenonError("Zenon: an extra hypothesis that isn't a relation's");
    const negation = exprs.enot(hypothesis);
    const notAll = (formula: Expr, instance: Expr, subproof: MlProof) =>
      makeNode([formula], { name: "notall", args: [formula] }, [[instance]], [subproof]);
    const decompose = (origin: Origin, forms: Expr[], witnesses: Expr[]) =>
      decomposeConjunction(
        0,
        origin.formula,
        origin.directions,
        origin.variables,
        forms,
        witnesses,
      );
    const getImplication = (formula: Expr) => {
      if (formula.kind !== "not" || formula.args[0].kind !== "imply")
        throw new TlaZenonError("Zenon: a relation hypothesis that isn't an implication");
      return formula.args[0];
    };
    const first = instantiateNegation(negation);
    if (kind.kind === "reflexive") {
      const proof = decompose(kind.origin, [first[0]], [first[1]]);
      return [notAll(negation, first[0], proof), [kind.origin.formula]];
    }
    const second = instantiateNegation(first[0]);
    if (kind.kind === "symmetric" || kind.kind === "symmetric2") {
      const implication = getImplication(second[0]);
      const premise = implication.args[0];
      const negatedConclusion = exprs.enot(implication.args[1]);
      const decomposed =
        kind.kind === "symmetric"
          ? decompose(kind.origin, [premise, negatedConclusion], [first[1], second[1]])
          : (() => {
              const reflexive = relate(kind.relation, first[1], first[1]);
              const negatedReflexive = exprs.enot(reflexive);
              const fromReflexive = decompose(kind.reflexive, [negatedReflexive], [first[1]]);
              const fromTransitive = decompose(
                kind.transitiveSymmetric,
                [reflexive, premise, negatedConclusion],
                [first[1], first[1], second[1]],
              );
              return makeCut(reflexive, fromTransitive, fromReflexive);
            })();
      const proof = notAll(
        negation,
        first[0],
        notAll(
          first[0],
          second[0],
          makeNode(
            [second[0]],
            { name: "not_impl", args: [premise, implication.args[1]] },
            [[premise, negatedConclusion]],
            [decomposed],
          ),
        ),
      );
      return [
        proof,
        kind.kind === "symmetric"
          ? [kind.origin.formula]
          : [kind.reflexive.formula, kind.transitiveSymmetric.formula],
      ];
    }
    const third = instantiateNegation(second[0]);
    const outer = getImplication(third[0]);
    const inner = outer.args[1];
    if (inner.kind !== "imply")
      throw new TlaZenonError("Zenon: a transitivity hypothesis that isn't an implication");
    const premise = outer.args[0];
    const middle = inner.args[0];
    const negatedConclusion = exprs.enot(inner.args[1]);
    const decomposed =
      kind.kind === "transitive"
        ? decompose(
            kind.origin,
            [premise, middle, negatedConclusion],
            [first[1], second[1], third[1]],
          )
        : (() => {
            const reflexive = relate(kind.relation, first[1], first[1]);
            const negatedReflexive = exprs.enot(reflexive);
            const swapped = relate(kind.relation, third[1], first[1]);
            const negatedSwapped = exprs.enot(swapped);
            const fromSwapped = decompose(
              kind.transitiveSymmetric,
              [swapped, reflexive, negatedConclusion],
              [third[1], first[1], first[1]],
            );
            const toSwapped = decompose(
              kind.transitiveSymmetric,
              [premise, middle, negatedSwapped],
              [first[1], second[1], third[1]],
            );
            const swappedCut = makeCut(swapped, fromSwapped, toSwapped);
            const fromReflexive = decompose(kind.reflexive, [negatedReflexive], [first[1]]);
            return makeCut(reflexive, swappedCut, fromReflexive);
          })();
    const proof = notAll(
      negation,
      first[0],
      notAll(
        first[0],
        second[0],
        notAll(
          second[0],
          third[0],
          makeNode(
            [third[0]],
            { name: "not_impl", args: [premise, inner] },
            [[premise, exprs.enot(inner)]],
            [
              // HACK: Zenon concludes the inner implication itself, not its negation.
              makeNode(
                [inner],
                { name: "not_impl", args: [middle, inner.args[1]] },
                [[middle, negatedConclusion]],
                [decomposed],
              ),
            ],
          ),
        ),
      ),
    );
    return [
      proof,
      kind.kind === "transitive"
        ? [kind.origin.formula]
        : [kind.reflexive.formula, kind.transitiveSymmetric.formula],
    ];
  };

  const relate = (relation: string, left: Expr, right: Expr) => exprs.eapp(relation, [left, right]);

  // Zenon's make_direct_trans: r(a, b), r(b, c) / r(a, c) / (proof).
  const makeDirectTrans = (relation: string, a: Expr, b: Expr, c: Expr, proof: MlProof) => {
    const hypothesis = getRelationHypothesis("transitive", relation);
    const ab = relate(relation, a, b);
    const bc = relate(relation, b, c);
    const implied = makeImplies(
      [ab, bc],
      relate(relation, a, c),
      [makeClose(ab), makeClose(bc)],
      proof,
    );
    return makeAlls(hypothesis, [a, b, c], implied[1]);
  };
  // Zenon's make_direct_nsym: -r(a, b) / -r(b, a) / (proof).
  const makeDirectNotSym = (relation: string, a: Expr, b: Expr, proof: MlProof) => {
    const hypothesis = getRelationHypothesis("symmetric", relation);
    const ab = relate(relation, a, b);
    const ba = relate(relation, b, a);
    return makeAlls(hypothesis, [b, a], makeImply(ba, ab, proof, makeClose(ab)));
  };
  // Zenon's make_direct_sym_neq: a != b / b != a / (proof).
  const makeSymmetricDisequality = (a: Expr, b: Expr, proof: MlProof) => {
    const reflexive = equal(b, b);
    const refuted = makeCloseRefl("=", b);
    const swapped = makePNotP(reflexive, exprs.enot(equal(a, b)), [proof, refuted]);
    return makeCut(reflexive, swapped, refuted);
  };
  // Zenon's make_direct_sym_eq: a = b / b = a / (proof).
  const makeSymmetricEquality = (a: Expr, b: Expr, proof: MlProof) => {
    const ab = equal(a, b);
    return makeCut(equal(b, a), proof, makeSymmetricDisequality(b, a, makeClose(ab)));
  };

  const expandTrans = (
    relation: string,
    a: Expr,
    b: Expr,
    c: Expr,
    d: Expr,
    first: MlProof,
    second: MlProof,
  ) => {
    const ca = equal(c, a);
    const notCa = exprs.enot(ca);
    const relatedCa = relate(relation, c, a);
    const notRelatedCa = exprs.enot(relatedCa);
    const bd = equal(b, d);
    const notRelatedCd = exprs.enot(relate(relation, c, d));
    const either = exprs.eand(notCa, notRelatedCa);
    const closeBd = makeClose(bd);
    const viaB = makeNotAnd(
      notCa,
      notRelatedCa,
      makeNotNot(ca, makeSymmetricDisequality(a, c, makeClose(ca))),
      makeNotNot(
        relatedCa,
        makeDirectTrans(
          relation,
          c,
          a,
          b,
          makePNotP(relate(relation, c, b), notRelatedCd, [makeCloseRefl("=", c), closeBd]),
        ),
      ),
    );
    const viaD = makeNotAnd(
      notCa,
      notRelatedCa,
      makeNotNot(ca, makeCloseSym("=", c, a)),
      makeNotNot(relatedCa, makeDirectTrans(relation, c, a, d, makeClose(relate(relation, c, d)))),
    );
    const fromBd = makePNotP(relate(relation, a, b), notRelatedCd, [viaB, closeBd]);
    const fromBdRelated = makeDirectTrans(
      relation,
      a,
      b,
      d,
      makePNotP(relate(relation, a, d), notRelatedCd, [viaD, makeCloseRefl("=", d)]),
    );
    const cutBd = makeCut(bd, fromBd, makeCut(relate(relation, b, d), fromBdRelated, second));
    return makeCut(either, makeAnd(notCa, notRelatedCa, first), cutBd);
  };

  const expandTransEq = (
    relation: string,
    a: Expr,
    b: Expr,
    c: Expr,
    d: Expr,
    proofs: [MlProof, MlProof, MlProof],
  ) => {
    const cd = relate(relation, c, d);
    const bd = relate(relation, b, d);
    const cb = relate(relation, c, b);
    const ca = relate(relation, c, a);
    const ad = relate(relation, a, d);
    const notCd = exprs.enot(cd);
    const closeReflC = makeCloseRefl("=", c);
    const closeAb = makeClose(equal(a, b));
    const closeReflD = makeCloseRefl("=", d);
    const toCb = makePNotP(cb, notCd, [
      closeReflC,
      makeCut(bd, makeDirectTrans(relation, c, b, d, makeClose(cd)), proofs[2]),
    ]);
    const fromCb = makePNotP(ca, exprs.enot(cb), [closeReflC, closeAb]);
    const toAd = makePNotP(ad, notCd, [makeSymmetricDisequality(a, c, proofs[0]), closeReflD]);
    const fromAd = makePNotP(bd, exprs.enot(ad), [
      makeSymmetricDisequality(b, a, closeAb),
      closeReflD,
    ]);
    return makeCut(
      ca,
      makeCut(cb, toCb, fromCb),
      makeCut(bd, makeCut(ad, toAd, fromAd), proofs[1]),
    );
  };

  const expandTransEqual = (
    a: Expr,
    b: Expr,
    c: Expr,
    d: Expr,
    first: MlProof,
    second: MlProof,
  ) => {
    const symmetric = makeSymmetricDisequality(a, c, first);
    return makePNotP(equal(a, b), exprs.enot(equal(c, d)), [symmetric, second]);
  };

  const getRelation = (formula: Expr) => {
    const atom = formula.kind === "not" ? formula.args[0] : formula;
    if (atom.kind !== "app" || atom.args.length !== 2)
      throw new TlaZenonError("Zenon: a transitivity rule on a formula that isn't a relation");
    return atom;
  };

  const getThree = (proof: MlProof): [MlProof, MlProof, MlProof] => {
    if (proof.subproofs.length !== 3) throw new TlaZenonError("Zenon: expected three subproofs");
    return [proof.subproofs[0], proof.subproofs[1], proof.subproofs[2]];
  };

  // A derived rule's expansion, with the hypotheses it relies on that no phrase may state.
  const translateWith = (expanded: MlProof, hypotheses: Expr[]): Translated => {
    const translated = translate(expanded);
    return [translated[0], union(hypotheses, translated[1])];
  };

  const translateDerived = (proof: MlProof): Translated => {
    const rule = proof.rule;
    switch (rule.name) {
      case "definition": {
        if (rule.definition.kind !== "pseudo")
          throw new TlaZenonError("Zenon: a real definition in translate_derived");
        const expanded = translatePseudoDefinition(
          proof,
          rule.definition,
          rule.args[0],
          rule.args[1],
        );
        return translateWith(expanded, [rule.definition.origin]);
      }
      case "conj_tree":
        return recompConj(translate(getSingle(proof)), rule.args[0]);
      case "disj_tree": {
        const result = recompDisj(proof.subproofs.map(translate), rule.args[0]);
        if (result[2].length > 0)
          throw new TlaZenonError("Zenon: a disjunction tree with extra subproofs");
        return [result[0], result[1]];
      }
      case "close_sym": {
        const hypothesis = getRelationHypothesis("symmetric", rule.relation);
        const [a, b] = rule.args;
        const ab = relate(rule.relation, a, b);
        const ba = relate(rule.relation, b, a);
        const implied = makeImply(ab, ba, makeClose(ab), makeClose(ba));
        return translateWith(makeAlls(hypothesis, [a, b], implied), [hypothesis]);
      }
      case "close_refl": {
        const hypothesis = getRelationHypothesis("reflexive", rule.relation);
        const a = rule.args[0];
        return translateWith(makeAll(hypothesis, a, makeClose(relate(rule.relation, a, a))), [
          hypothesis,
        ]);
      }
      case "refl": {
        const hypothesis = getRelationHypothesis("reflexive", rule.relation);
        const [a, b] = rule.args;
        const reflexive = relate(rule.relation, a, a);
        const negated = exprs.enot(relate(rule.relation, a, b));
        const closed = makePNotP(reflexive, negated, [makeCloseRefl("=", a), getSingle(proof)]);
        return translateWith(makeAll(hypothesis, a, closed), [hypothesis]);
      }
      case "p_not_p_sym": {
        const positive = getRelation(rule.args[0]);
        const negative = getRelation(rule.args[1]);
        if (rule.relation === "=") {
          const swapped = exprs.enot(equal(negative.args[1], negative.args[0]));
          const node = makePNotP(rule.args[0], swapped, [proof.subproofs[1], proof.subproofs[0]]);
          return translate(makeSymmetricDisequality(negative.args[0], negative.args[1], node));
        }
        const hypothesis = getRelationHypothesis("symmetric", rule.relation);
        const [a, b] = positive.args;
        const ba = relate(rule.relation, b, a);
        const node = makePNotP(ba, rule.args[1], [proof.subproofs[0], proof.subproofs[1]]);
        const implied = makeImply(rule.args[0], ba, makeClose(rule.args[0]), node);
        return translateWith(makeAlls(hypothesis, [a, b], implied), [hypothesis]);
      }
      case "trans":
      case "trans_sym": {
        const positive = getRelation(rule.args[0]);
        const relation = positive.symbol;
        const [a, b] = positive.args;
        const [c, d] = getRelation(rule.args[1]).args;
        const first = proof.subproofs[0];
        const second = proof.subproofs[1];
        if (relation === "=")
          return rule.name === "trans"
            ? translate(expandTransEqual(a, b, c, d, first, second))
            : translate(
                makeSymmetricDisequality(c, d, expandTransEqual(a, b, d, c, first, second)),
              );
        if (rule.name === "trans")
          return translateWith(expandTrans(relation, a, b, c, d, first, second), [
            getRelationHypothesis("transitive", relation),
          ]);
        const expanded = makeDirectNotSym(
          relation,
          c,
          d,
          expandTrans(relation, a, b, d, c, first, second),
        );
        return translateWith(expanded, [
          getRelationHypothesis("transitive", relation),
          getRelationHypothesis("symmetric", relation),
        ]);
      }
      case "trans_eq":
      case "trans_eq2":
      case "trans_eq_sym": {
        const negative = getRelation(rule.args[2]);
        const relation = negative.symbol;
        const [c, d] = negative.args;
        const a = rule.args[0];
        const b = rule.args[1];
        const proofs = getThree(proof);
        if (relation === "=" && rule.name === "trans_eq")
          return translate(expandTransEqual(a, b, c, d, proofs[0], proofs[2]));
        if (relation === "=" && rule.name === "trans_eq_sym")
          return translate(
            makeSymmetricDisequality(c, d, expandTransEqual(a, b, d, c, proofs[0], proofs[2])),
          );
        const hypothesis = getRelationHypothesis("transitive", relation);
        const expanded =
          rule.name === "trans_eq"
            ? expandTransEq(relation, a, b, c, d, proofs)
            : rule.name === "trans_eq2"
              ? makeSymmetricEquality(a, b, expandTransEq(relation, b, a, c, d, proofs))
              : makeDirectNotSym(relation, c, d, expandTransEq(relation, a, b, d, c, proofs));
        return translateWith(expanded, [hypothesis]);
      }
      case "not_all_ex": {
        const negation = rule.args[0];
        const quantified = negation.kind === "not" ? negation.args[0] : negation;
        const binder = getBinder(quantified, "all");
        const variable = binder.args[0];
        const body = binder.args[1];
        const existential = exprs.eex(variable, binder.symbol, exprs.enot(body));
        const lambda = exprs.elam(variable, binder.symbol, body);
        const witnessed = makeExistential(existential, getSingle(proof));
        return translate(
          makeNode([negation], { name: "notallex", args: [lambda] }, [[existential]], [witnessed]),
        );
      }
      default:
        return getTlaLlProof(translateExpr, exprs, proof, proof.subproofs.map(translate));
    }
  };

  // Zenon's make_ex.
  const makeExistential = (existential: Expr, subproof: MlProof) => {
    const binder = getBinder(existential, "ex");
    const witness = exprs.etau(binder.args[0], binder.symbol, binder.args[1]);
    const instance = exprs.substitute([[binder.args[0], witness]], binder.args[1]);
    return makeNode([existential], { name: "ex", args: [existential] }, [[instance]], [subproof]);
  };

  // Zenon's find_diff: the context in which two formulas differ, and the two subterms.
  const findDiff = (variable: VarExpr, left: Expr, right: Expr): [Expr, Expr, Expr] => {
    if (left === right) throw new TlaZenonError("Zenon: find_diff on equal formulas");
    if (left.kind === "app" && right.kind === "app" && left.symbol === right.symbol) {
      const position = left.args.findIndex((arg, index) => arg !== right.args[index]);
      const diff = findDiff(variable, left.args[position], right.args[position]);
      return [
        exprs.eapp(
          left.symbol,
          left.args.map((arg, index) => (index === position ? diff[0] : arg)),
        ),
        diff[1],
        diff[2],
      ];
    }
    if (left.kind === "not" && right.kind === "not") {
      const diff = findDiff(variable, left.args[0], right.args[0]);
      return [exprs.enot(diff[0]), diff[1], diff[2]];
    }
    // HACK: Zenon compares every binary connective with a conjunction here.
    if (
      (left.kind === "and" ||
        left.kind === "or" ||
        left.kind === "imply" ||
        left.kind === "equiv") &&
      right.kind === "and"
    ) {
      if (left.args[0] === right.args[0]) {
        const diff = findDiff(variable, left.args[1], right.args[1]);
        return [connect(exprs, left.kind, left.args[0], diff[0]), diff[1], diff[2]];
      }
      const diff = findDiff(variable, left.args[0], right.args[0]);
      return [connect(exprs, left.kind, diff[0], left.args[1]), diff[1], diff[2]];
    }
    if (
      left.kind === right.kind &&
      (left.kind === "all" || left.kind === "ex" || left.kind === "tau" || left.kind === "lam")
    )
      throw new TlaZenonError("Zenon: find_diff under a binder");
    return [variable, left, right];
  };

  // Zenon's translate_pseudo_def: instantiates the defining hypothesis, then rewrites with it.
  const translatePseudoDefinition = (
    proof: MlProof,
    definition: Extract<Definition, { kind: "pseudo" }>,
    folded: Expr,
    unfolded: Expr,
  ): MlProof => {
    const origin = definition.origin;
    const diffArgs = (() => {
      const diff = findDiff(exprs.newVar(), folded, unfolded);
      if (diff[1].kind === "app") return diff[1].args;
      if (diff[1].kind === "var") return [];
      throw new TlaZenonError("Zenon: a pseudo-definition of something other than a symbol");
    })();
    const universals: [Expr, Expr][] = [];
    for (let current = origin; current.kind === "all"; current = current.args[1])
      universals.push([current.args[0], current]);
    const actuals = universals.map((entry, position) => {
      const isRepeated = universals.slice(position + 1).some((later) => later[0] === entry[0]);
      const index = definition.params.indexOf(entry[0]);
      return isRepeated || index === -1 ? exprs.emeta(entry[1]) : diffArgs[index];
    });
    const build = (hypothesis: Expr, remaining: Expr[]): MlProof => {
      if (remaining.length > 0) {
        const binder = getBinder(hypothesis, "all");
        const instance = exprs.substitute([[binder.args[0], remaining[0]]], binder.args[1]);
        const sub = build(instance, remaining.slice(1));
        return makeNode(
          [hypothesis],
          { name: "all", args: [hypothesis, remaining[0]] },
          [[instance]],
          [sub],
        );
      }
      const subproof = getSingle(proof);
      if (hypothesis.kind === "equiv") {
        const isCrossed = folded.kind === "not" && unfolded.kind === "not";
        const formula = isCrossed && folded.kind === "not" ? folded.args[0] : folded;
        const negated = isCrossed ? folded : exprs.enot(folded);
        const unfoldedFormula = isCrossed && unfolded.kind === "not" ? unfolded.args[0] : unfolded;
        const unfoldedNegated = isCrossed ? unfolded : exprs.enot(unfolded);
        const closed = makeClose(formula);
        const rule: Rule = { name: "equiv", args: [hypothesis.args[0], hypothesis.args[1]] };
        return isCrossed
          ? makeNode([hypothesis], rule, [[unfoldedNegated], [formula]], [subproof, closed])
          : makeNode([hypothesis], rule, [[negated], [unfoldedFormula]], [closed, subproof]);
      }
      if (hypothesis.kind === "app" && hypothesis.symbol === "=" && hypothesis.args.length === 2) {
        if (folded === exprs.enot(hypothesis))
          return makeNode([folded, hypothesis], { name: "close", args: [hypothesis] }, [], []);
        const isDefinedOnLeft = definesSymbol(hypothesis.args[0], definition.symbol);
        if (!isDefinedOnLeft && !definesSymbol(hypothesis.args[1], definition.symbol))
          throw new TlaZenonError("Zenon: a pseudo-definition that doesn't define its symbol");
        const variable = exprs.newVar();
        const diff = findDiff(variable, folded, unfolded);
        const lambda = exprs.elam(variable, "", diff[0]);
        const a = diff[1];
        const b = diff[2];
        return isDefinedOnLeft
          ? makeNode(
              [exprs.apply(lambda, a), equal(a, b)],
              { name: "congruence_lr", args: [lambda, a, b] },
              [[exprs.apply(lambda, b)]],
              [subproof],
            )
          : makeNode(
              [exprs.apply(lambda, a), equal(b, a)],
              { name: "congruence_rl", args: [lambda, a, b] },
              [[exprs.apply(lambda, b)]],
              [subproof],
            );
      }
      throw new TlaZenonError("Zenon: a pseudo-definition of an unexpected shape");
    };
    return build(origin, actuals);
  };

  const definesSymbol = (side: Expr, symbol: string) =>
    (side.kind === "app" || side.kind === "var") && side.symbol === symbol;

  const translated = translate(proof);
  const isCharged = (formula: Expr) =>
    !phrases.some((phrase) => phrase.kind === "hyp" && phrase.formula === formula);
  // Zenon's discharge_extra: cuts each hypothesis about a relation that the phrases don't state,
  // and proves it from the hypotheses that do.
  const discharged = translated[1].filter(isCharged).reduce((current: LlProof, extra): LlProof => {
    const relationProof = getRelationProof(extra);
    const proved = translate(relationProof[0]);
    if (proved[1].length > 0) throw new TlaZenonError("Zenon: a relation proof with extras");
    const formula = translateExpr(extra);
    return {
      conclusions: union(
        relationProof[1].map(translateExpr),
        difference(current.conclusions, [formula]),
      ),
      rule: { kind: "cut", formula },
      subproofs: [current, proved[0]],
    };
  }, translated[0]);
  return [...lemmas, { name: "zenon_thm", params: [], proof: discharged }];
};

const RULE_CONNECTIVES = {
  and: "and",
  or: "or",
  impl: "imply",
  equiv: "equiv",
  not_or: "or",
  not_impl: "imply",
  not_and: "and",
  not_equiv: "equiv",
} as const;
