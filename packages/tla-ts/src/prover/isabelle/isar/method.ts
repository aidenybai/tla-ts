// Ported from Isabelle2025's Pure/Isar/method.ML, Pure/goal.ML, Pure/Isar/local_defs.ML and the
// methods the theories tlapm writes use. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import {
  absDef,
  asmRl,
  equalsCong,
  isNormHhf,
  multiResolves,
  normHhfEq,
  reflexiveThm,
  termI,
} from "../pure/drule";
import { isEquals, listImplies, stripImpPrems, stripAssumsConcl } from "../pure/logic";
import { addSimps, congKey, emptySimpset, type Simpset } from "../pure/raw-simplifier";
import { updateTable } from "../pure/table";
import { genericRewriteGoalTac, rewriteCterm, simpleProver } from "../pure/rewriter";
import { appendSeq, emptySeq, mapsSeq, singleSeq, type Seq } from "../pure/seq";
import { fconvRule, premsConv } from "../pure/conv";
import { atomizePremsTac } from "../pure/object-logic";
import { asmFullSimpTac, normHhf } from "../pure/simplifier";
import type { Limits } from "../pure/interrupt";
import {
  assumeTac,
  eresolveTac,
  flexflexTac,
  matchTac,
  resolveTac,
  type NetPair,
} from "../pure/tactic";
import {
  allGoals,
  appendGoal,
  changedProp,
  noTac,
  orElse,
  primitive,
  primSeq,
  repeatAllNew,
  subgoal,
  thenAllNew,
  thenGoal,
  thenTac,
  type GoalTactic,
  type Tactic,
} from "../pure/tactical";
import {
  addFreeNames,
  addVars,
  funTs,
  listComb,
  mapAtyps,
  maxidxOfTerm,
  mkTVar,
  mkVar,
  stripAllBody,
  stripAllVars,
  stripComb,
  substBounds,
  aconv,
  type Term,
  type Var,
} from "../pure/term";
import {
  assume,
  bicompose,
  conclOf,
  forallIntr,
  impliesElim,
  impliesIntr,
  incrIndexesThm,
  instantiate,
  nprems,
  premsOf,
  trivial,
  type Thm,
} from "../pure/thm";
import { cleanName, variantList } from "../pure/name";
import { autoTac, clarsimpTac, forceTac, type ClasimpContext } from "../provers/clasimp";
import {
  addUnsafeDest,
  addUnsafeIntro,
  clarifyTac,
  fastTac,
  withClaset,
  type ClassicalContext,
} from "../provers/classical";
import {
  findRulesNetpair,
  proverTac,
  type ContextRule,
  type IntuitionisticContext,
} from "../tools/intuitionistic";
import { getThms, parseFactReferences } from "./attrib";
import type { IsarContext } from "./context";
import { insertTac } from "./proof";
import type { MethodText, OuterToken } from "./theory";

export interface ProofContext {
  readonly limits: Limits;
  readonly simpset: Simpset;
  readonly classical: ClassicalContext;
  readonly intuitionistic: IntuitionisticContext;
  readonly atomizeRules: readonly Thm[];
  // PredicateLogic.thy's [symmetric, defn] rules, which Local_Defs.meta_rewrite_rule uses.
  readonly defnRules: readonly Thm[];
  readonly rulifyRules: readonly Thm[];
  readonly blastDepthTac: (context: ClassicalContext, limit: number) => GoalTactic;
  readonly blastTac: (context: ClassicalContext) => GoalTactic;
  // Context_Rules' netpairs: of the rules declared with "!", without a mark and with "?".
  readonly contextRules: readonly NetPair<ContextRule>[];
}

export type Method = (facts: readonly Thm[]) => Tactic;

interface Modifier {
  readonly kind: "intro" | "dest" | "simp";
  readonly facts: readonly Thm[];
}

const syntaxError = (token: OuterToken | undefined) =>
  new TlaIsabelleError(
    "ERROR",
    `Outer syntax error at: ${token === undefined ? "end of input" : token.text}`,
  );

// Method.sections: each modifier, such as "simp add:", takes the facts up to the next one.
const parseModifiers = (isar: IsarContext, args: readonly OuterToken[]): Modifier[] => {
  const headerLength = (position: number) => {
    for (let length = 1; length <= 2; length += 1)
      if (args[position + length]?.kind === "symbol" && args[position + length].text === ":")
        return length;
    return 0;
  };
  const modifiers: Modifier[] = [];
  let position = 0;
  while (position < args.length) {
    const length = headerLength(position);
    if (length === 0) throw syntaxError(args[position]);
    const header = args
      .slice(position, position + length)
      .map((token) => token.text)
      .join(" ");
    position += length + 1;
    const start = position;
    while (position < args.length && headerLength(position) === 0) position += 1;
    const facts = getThms(isar, parseFactReferences(args.slice(start, position)));
    const kind =
      header === "intro"
        ? "intro"
        : header === "dest"
          ? "dest"
          : header === "simp" || header === "simp add" || header === "add"
            ? "simp"
            : undefined;
    if (kind === undefined)
      throw new TlaIsabelleError("ERROR", `Unsupported method modifier: ${header}`);
    modifiers.push({ kind, facts });
  }
  return modifiers;
};

const withModifiers = (context: ProofContext, modifiers: readonly Modifier[]): ClassicalContext =>
  modifiers.reduce(
    (classical, modifier) =>
      modifier.kind === "simp"
        ? classical
        : modifier.facts.reduce(
            (current, fact) =>
              withClaset(
                current,
                modifier.kind === "intro"
                  ? addUnsafeIntro(current, fact, context.atomizeRules)
                  : addUnsafeDest(current, fact, context.atomizeRules),
              ),
            classical,
          ),
    context.classical,
  );

const withSimps = (context: ProofContext, modifiers: readonly Modifier[]): Simpset => {
  const simps = modifiers.flatMap((modifier) => (modifier.kind === "simp" ? modifier.facts : []));
  return simps.length === 0
    ? context.simpset
    : addSimps({ limits: context.limits, simpset: context.simpset, bounds: 0 }, simps);
};

const getClasimp = (context: ProofContext, modifiers: readonly Modifier[]): ClasimpContext => ({
  classical: withModifiers(context, modifiers),
  simp: { limits: context.limits, simpset: withSimps(context, modifiers), bounds: 0 },
  blastDepthTac: context.blastDepthTac,
});

const insertAllTac = (context: ProofContext, facts: readonly Thm[]) =>
  allGoals((index) => insertTac(context.limits, facts, index));

const simpleMethodHead = (context: ProofContext, facts: readonly Thm[], tactic: GoalTactic) =>
  thenGoal((index) => insertTac(context.limits, facts, index), tactic)(1);

export const normHhfTac = (limits: Limits): GoalTactic => {
  const empty = { limits, simpset: emptySimpset, bounds: 0 };
  const context = { ...empty, simpset: addSimps(empty, [normHhfEq]) };
  return thenGoal(
    resolveTac(limits, [asmRl]),
    subgoal((goal, index) =>
      isNormHhf(false, goal)
        ? (state) => singleSeq(state)
        : genericRewriteGoalTac(
            { simprem: true, useprem: false, mutsimp: false },
            () => undefined,
            context,
            index,
          ),
    ),
  );
};

// Method.rule_tac: with facts, the rules first resolve against them.
const ruleTac = (limits: Limits, rules: readonly Thm[], facts: readonly Thm[]): GoalTactic =>
  thenAllNew(
    (index) => (state) =>
      facts.length === 0
        ? resolveTac(limits, rules)(index)(state)
        : mapsSeq(
            (rule) => resolveTac(limits, [rule])(index)(state),
            multiResolves(limits, facts, rules),
          ),
    normHhfTac(limits),
  );

// Classical.some_rule_tac: the rules of the context and the claset's extra rules that fit the
// goal, or the first fact as an elimination rule.
const someRuleTac = (context: ProofContext, facts: readonly Thm[]): GoalTactic =>
  thenAllNew(
    subgoal((goal, index) => {
      const [bang, plain, query] = context.contextRules.map((netpair) =>
        findRulesNetpair(false, facts, goal, netpair),
      );
      const extra = findRulesNetpair(true, facts, goal, context.classical.claset.extra);
      return (state) =>
        mapsSeq(
          (rule) => resolveTac(context.limits, [rule])(index)(state),
          multiResolves(context.limits, facts, [...bang, ...plain, ...extra, ...query]),
        );
    }),
    normHhfTac(context.limits),
  );

// Tactic.distinct_subgoals_tac: a subgoal that occurs again is solved by its first occurrence.
const distinctSubgoalsTac: Tactic = (state) => {
  const prems = premsOf(state);
  const distinct = prems.filter(
    (prem, index) => prems.findIndex((other) => aconv(other, prem)) === index,
  );
  if (distinct.length === prems.length) return singleSeq(state);
  const template = listImplies(prems, conclOf(state));
  const rule = impliesIntr(
    template,
    distinct.reduceRight(
      (result, prem) => impliesIntr(prem, result),
      prems.reduce((result, prem) => impliesElim(result, assume(prem)), assume(template)),
    ),
  );
  return singleSeq(impliesElim(rule, state));
};

// Class.standard_intro_classes_tac: without facts, intro_classes_tac, whose rules conclude
// OFCLASS, so they resolve with no TLA+ goal unless its conclusion is a variable.
const standardIntroClassesTac =
  (facts: readonly Thm[]): Tactic =>
  (state) => {
    if (facts.length > 0 || nprems(state) === 0) return emptySeq;
    if (premsOf(state).some((prem) => stripComb(stripAssumsConcl(prem))[0].kind === "Var"))
      throw new TlaIsabelleError("ERROR", "Unsupported intro_classes on a flexible goal");
    return distinctSubgoalsTac(state);
  };

// Proof_Context.fact_tac: a fact closes the goal by composition, lifted over its parameters.
const factTac = (limits: Limits, facts: readonly Thm[]): GoalTactic =>
  thenGoal(normHhfTac(limits), (index) =>
    facts.reduceRight<Tactic>(
      (rest, fact) => (state) =>
        appendSeq(
          primSeq((current: Thm) =>
            bicompose(
              limits,
              { flatten: true, match: false, incremented: true },
              {
                isElim: false,
                rule: liftAll(index, current, incrIndexesThm(current.maxidx + 1, fact)),
                subgoals: 0,
              },
              index,
              current,
            ),
          )(state),
          rest(state),
        ),
      noTac,
    ),
  );

// Drule.lift_all: the fact's variables become functions of the goal's parameters.
const liftAll = (index: number, state: Thm, fact: Thm): Thm => {
  const vars = stripAllVars(stripImpPrems(state.prop)[index - 1]);
  const names = variantList(
    [],
    vars.map((variable) => cleanName(variable.name)),
  );
  const params = vars.map((variable, position) =>
    mkVar(
      names[position],
      fact.maxidx + 1,
      mapAtyps(
        (atom) =>
          atom.kind === "TVar" ? mkTVar(atom.name, atom.index + fact.maxidx + 1, atom.sort) : atom,
        variable.type,
      ),
    ),
  );
  const factVars = [fact.prop, ...fact.tpairs.flat()].reduceRight<Var[]>(
    (found, term) => addVars(term, found),
    [],
  );
  return params.reduceRight(
    (result, param) => forallIntr(param, result),
    instantiate(
      factVars.map((variable) => ({
        variable,
        term: listComb(
          mkVar(
            variable.name,
            variable.index,
            funTs(
              params.map((param) => param.type),
              variable.type,
            ),
          ),
          params,
        ),
      })),
      fact,
    ),
  );
};

// Local_Defs.meta_rewrite_conv: object-level equations and implications become meta-level ones,
// and Drule.equals_cong leaves meta-level equations alone.
export const metaRewriteConv = (context: ProofContext, term: Term): Thm => {
  const empty = { limits: context.limits, simpset: emptySimpset, bounds: 0 };
  const simpset = addSimps(empty, context.defnRules);
  return rewriteCterm(
    { simprem: false, useprem: false, mutsimp: false },
    () => undefined,
    {
      ...empty,
      simpset: {
        ...simpset,
        congs: updateTable(simpset.congs, congKey({ isConst: true, name: "Pure.eq" }), equalsCong),
      },
    },
    term,
  );
};

const metaRewriteRule = (context: ProofContext, thm: Thm): Thm =>
  fconvRule((term) => metaRewriteConv(context, term), thm);

const initSimpset = (limits: Limits, rules: readonly Thm[]) => ({
  limits,
  simpset: addSimps({ limits, simpset: emptySimpset, bounds: 0 }, rules),
  bounds: 0,
});

export const rewriteRule = (limits: Limits, rules: readonly Thm[], thm: Thm): Thm =>
  rules.length === 0
    ? thm
    : fconvRule(
        (term) =>
          rewriteCterm(
            { simprem: true, useprem: false, mutsimp: false },
            simpleProver,
            initSimpset(limits, rules),
            term,
          ),
        thm,
      );

const rewriteGoalsRule = (limits: Limits, rules: readonly Thm[], state: Thm): Thm =>
  fconvRule(
    premsConv((term) =>
      rewriteCterm(
        { simprem: true, useprem: true, mutsimp: true },
        simpleProver,
        initSimpset(limits, rules),
        term,
      ),
    ),
    state,
  );

// Local_Defs.gen_unfold: the rules rewrite, then again as abstractions, which unfold the constants
// they define where they are unapplied.
const genUnfold =
  (rewrite: (limits: Limits, rules: readonly Thm[], thm: Thm) => Thm) =>
  (context: ProofContext, rules: readonly Thm[], thm: Thm): Thm => {
    const metaRules = rules.map((rule) => metaRewriteRule(context, rule));
    const absRules = metaRules.map((rule) => (isEquals(rule.prop) ? absDef(rule) : rule));
    return rewrite(context.limits, absRules, rewrite(context.limits, metaRules, thm));
  };

export const unfoldRule = genUnfold(rewriteRule);
export const unfoldGoals = genUnfold(rewriteGoalsRule);

const assumeRuleTac = (limits: Limits): GoalTactic =>
  thenGoal(
    normHhfTac(limits),
    subgoal((goal, index) => {
      const params = stripAllVars(goal);
      const names = variantList(
        addFreeNames(goal, []),
        params.map((param) => param.name),
      );
      const maxidx = maxidxOfTerm(goal) + 1;
      const body = substBounds(
        params.map((param, offset) => mkVar(names[offset], maxidx, param.type)).reverse(),
        stripAllBody(goal),
      );
      const rules = stripImpPrems(body).filter(
        (prem) =>
          prem.kind === "App" &&
          ((prem.fun.kind === "App" &&
            prem.fun.fun.kind === "Const" &&
            prem.fun.fun.name === "Pure.imp") ||
            (prem.fun.kind === "Const" && prem.fun.name === "Pure.all")),
      );
      return rules.reduceRight<GoalTactic>(
        (tactic, rule) =>
          appendGoal(
            thenAllNew(eresolveTac(limits, [normHhf(limits, trivial(rule))]), assumeTac(limits)),
            tactic,
          ),
        () => noTac,
      )(index);
    }),
  );

const assmTac = (limits: Limits): GoalTactic => {
  const condRtac = (isRule: (concl: Term) => boolean, rule: Thm) =>
    subgoal((goal, index) =>
      isRule(stripAssumsConcl(goal)) ? resolveTac(limits, [rule])(index) : noTac,
    );
  return appendGoal(
    assumeTac(limits),
    appendGoal(
      assumeRuleTac(limits),
      appendGoal(
        condRtac(isEquals, reflexiveThm),
        condRtac(
          (concl) =>
            concl.kind === "App" && concl.fun.kind === "Const" && concl.fun.name === "Pure.term",
          termI,
        ),
      ),
    ),
  );
};

const allAssmTac =
  (limits: Limits) =>
  (index: number): Tactic =>
  (state) =>
    index > nprems(state)
      ? singleSeq(state)
      : orElse(
          thenTac(assmTac(limits)(index), allAssmTac(limits)(index)),
          allAssmTac(limits)(index + 1),
        )(state);

// Method.finish: qed's closing step, which assumptions finish when the proof is immediate.
export const finishTac = (limits: Limits, isImmediate: boolean): Tactic =>
  isImmediate
    ? (state) => mapsSeq(flexflexTac(limits), allAssmTac(limits)(1)(state))
    : flexflexTac(limits);

// Seq.REPEAT, depth first.
const repeat =
  (tactic: Tactic): Tactic =>
  (state) => {
    const results = tactic(state);
    const cell = results.pull();
    return cell === undefined
      ? singleSeq(state)
      : appendSeq(repeat(tactic)(cell[0]), mapsSeq(repeat(tactic), cell[1]));
  };

const methodSource = (
  context: ProofContext,
  isar: IsarContext,
  name: string,
  args: readonly OuterToken[],
): Method => {
  const thms = () => getThms(isar, parseFactReferences(args));
  const noArgs = () => {
    if (args.length > 0) throw syntaxError(args[0]);
  };
  switch (name) {
    case "auto": {
      const modifiers = parseModifiers(isar, args);
      return (facts) =>
        thenTac(insertAllTac(context, facts), changedProp(autoTac(getClasimp(context, modifiers))));
    }
    case "clarsimp": {
      const modifiers = parseModifiers(isar, args);
      return (facts) =>
        simpleMethodHead(context, facts, (index) =>
          changedProp(clarsimpTac(getClasimp(context, modifiers))(index)),
        );
    }
    case "force": {
      const modifiers = parseModifiers(isar, args);
      return (facts) =>
        simpleMethodHead(
          context,
          facts,
          forceTac(getClasimp(context, modifiers), context.atomizeRules),
        );
    }
    case "blast": {
      const modifiers = parseModifiers(isar, args);
      return (facts) =>
        simpleMethodHead(context, facts, context.blastTac(withModifiers(context, modifiers)));
    }
    case "fast": {
      const modifiers = parseModifiers(isar, args);
      return (facts) =>
        simpleMethodHead(
          context,
          facts,
          fastTac(withModifiers(context, modifiers), context.atomizeRules),
        );
    }
    case "clarify": {
      const modifiers = parseModifiers(isar, args);
      return (facts) =>
        simpleMethodHead(context, facts, (index) =>
          changedProp(clarifyTac(withModifiers(context, modifiers))(index)),
        );
    }
    case "simp": {
      const modifiers = parseModifiers(isar, args);
      if (modifiers.some((modifier) => modifier.kind !== "simp"))
        throw new TlaIsabelleError("ERROR", "Unsupported method modifier for simp");
      const simpset = withSimps(context, modifiers);
      return (facts) =>
        simpleMethodHead(context, facts, (index) =>
          changedProp(asmFullSimpTac({ limits: context.limits, simpset, bounds: 0 })(index)),
        );
    }
    case "iprover":
      noArgs();
      return (facts) =>
        simpleMethodHead(
          context,
          facts,
          thenGoal(
            atomizePremsTac(context.limits, context.atomizeRules),
            proverTac(context.intuitionistic),
          ),
        );
    case "intro": {
      const rules = thms();
      return (facts) =>
        simpleMethodHead(context, facts, (index) =>
          changedProp(repeatAllNew(matchTac(context.limits, rules))(index)),
        );
    }
    case "rule": {
      const rules = thms();
      return (facts) =>
        rules.length === 0
          ? someRuleTac(context, facts)(1)
          : ruleTac(context.limits, rules, facts)(1);
    }
    case "standard":
      noArgs();
      return (facts) => orElse(someRuleTac(context, facts)(1), standardIntroClassesTac(facts));
    case "fact": {
      const rules = thms();
      if (rules.length === 0) throw new TlaIsabelleError("ERROR", "Unsupported method: fact");
      return (facts) => simpleMethodHead(context, facts, factTac(context.limits, rules));
    }
    case "unfold": {
      const rules = thms();
      return (facts) =>
        thenTac(
          insertAllTac(context, facts),
          changedProp(primitive((state) => unfoldGoals(context, rules, state))),
        );
    }
    case "-":
      noArgs();
      return (facts) => insertAllTac(context, facts);
    default:
      throw new TlaIsabelleError("ERROR", `Undefined method: ${name}`);
  }
};

export const evaluate = (isar: IsarContext, text: MethodText): Method => {
  const context = isar.tactics;
  switch (text.kind) {
    case "source":
      return methodSource(context, isar, text.name, text.args);
    case "then": {
      const methods = text.texts.map((inner) => evaluate(isar, inner));
      return (facts) => (state) =>
        methods.reduce<Seq<Thm>>(
          (results, method) => mapsSeq(method(facts), results),
          singleSeq(state),
        );
    }
    case "orelse": {
      const methods = text.texts.map((inner) => evaluate(isar, inner));
      return (facts) =>
        methods.reduceRight<Tactic>((rest, method) => orElse(method(facts), rest), noTac);
    }
    case "try": {
      const method = evaluate(isar, text.texts[0]);
      return (facts) => orElse(method(facts), (state) => singleSeq(state));
    }
    case "repeat1": {
      const method = evaluate(isar, text.texts[0]);
      return (facts) => thenTac(method(facts), repeat(method(facts)));
    }
    default:
      throw new TlaIsabelleError("ERROR", `Unsupported method combinator: ${text.kind}`);
  }
};
