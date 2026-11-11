// Ported from Isabelle2025's Pure/Isar/method.ML, Pure/goal.ML, Pure/Isar/local_defs.ML and the
// methods the theories tlapm writes use. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { asmRl, isNormHhf, multiResolves, normHhfEq, reflexiveThm, termI } from "../pure/drule";
import { destEquals, isEquals, stripImpPrems, stripAssumsConcl } from "../pure/logic";
import { addSimps, emptySimpset, type Simpset } from "../pure/raw-simplifier";
import { genericRewriteGoalTac, rewriteCterm } from "../pure/rewriter";
import { appendSeq, mapsSeq, singleSeq, type Seq } from "../pure/seq";
import { fconvRule, premsConv } from "../pure/conv";
import { atomizePremsTac } from "../pure/object-logic";
import { asmFullSimpTac, normHhf } from "../pure/simplifier";
import type { Limits } from "../pure/interrupt";
import { assumeTac, eresolveTac, flexflexTac, matchTac, resolveTac } from "../pure/tactic";
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
  aconv,
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
  substBounds,
  type Term,
  type Var,
} from "../pure/term";
import {
  abstractRule,
  bicompose,
  etaConversion,
  forallIntr,
  incrIndexesThm,
  instantiate,
  nprems,
  symmetric,
  transitive,
  trivial,
  type Thm,
} from "../pure/thm";
import { cleanName, variantList } from "../pure/name";
import { autoTac, clarsimpTac, forceTac, type ClasimpContext } from "../provers/clasimp";
import {
  addUnsafeDest,
  addUnsafeIntro,
  fastTac,
  withClaset,
  type ClassicalContext,
} from "../provers/classical";
import { proverTac, type IntuitionisticContext } from "../tools/intuitionistic";
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
  readonly blastDepthTac: (context: ClassicalContext, limit: number) => GoalTactic;
  readonly blastTac: (context: ClassicalContext) => GoalTactic;
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

// Local_Defs.meta_rewrite_rule: object-level equations and implications become meta-level ones;
// Drule.equals_cong keeps meta-level equations as they are.
const metaRewriteRule = (context: ProofContext, thm: Thm): Thm => {
  if (isEquals(thm.prop)) return thm;
  const simp = {
    limits: context.limits,
    simpset: addSimps(
      { limits: context.limits, simpset: emptySimpset, bounds: 0 },
      context.defnRules,
    ),
    bounds: 0,
  };
  return fconvRule(
    (term) =>
      rewriteCterm({ simprem: false, useprem: false, mutsimp: false }, () => undefined, simp, term),
    thm,
  );
};

// Raw_Simplifier.rewrite_goals_rule.
const rewriteGoalsRule = (limits: Limits, rules: readonly Thm[], state: Thm): Thm => {
  const simp = {
    limits,
    simpset: addSimps({ limits, simpset: emptySimpset, bounds: 0 }, rules),
    bounds: 0,
  };
  return fconvRule(
    premsConv((term) =>
      rewriteCterm({ simprem: true, useprem: true, mutsimp: true }, () => undefined, simp, term),
    ),
    state,
  );
};

// Drule.abs_def: f(?x, ?y) == t becomes f == %x y. t.
const absDef = (thm: Thm): Thm => {
  const contractLhs = (current: Thm) =>
    transitive(symmetric(etaConversion(destEquals(current.prop)[0])), current);
  const contracted = contractLhs(thm);
  const varArgs = (term: Term): Term[] => {
    if (term.kind !== "App" || term.arg.kind !== "Var") return [];
    const rest = varArgs(term.fun);
    return rest.some((arg) => aconv(arg, term.arg)) ? rest : [term.arg, ...rest];
  };
  return contractLhs(
    varArgs(destEquals(contracted.prop)[0]).reduce(
      (current, arg) => abstractRule(arg.kind === "Var" ? arg.name : "", arg, current),
      contracted,
    ),
  );
};

// Local_Defs.unfold_tac.
const unfoldTac = (context: ProofContext, rules: readonly Thm[]): Tactic => {
  const metaRules = rules.map((rule) => metaRewriteRule(context, rule));
  const absRules = metaRules.map((rule) => (isEquals(rule.prop) ? absDef(rule) : rule));
  return primitive((state) =>
    rewriteGoalsRule(context.limits, absRules, rewriteGoalsRule(context.limits, metaRules, state)),
  );
};

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
      if (rules.length === 0) throw new TlaIsabelleError("ERROR", "Unsupported method: rule");
      return (facts) => ruleTac(context.limits, rules, facts)(1);
    }
    case "fact": {
      const rules = thms();
      if (rules.length === 0) throw new TlaIsabelleError("ERROR", "Unsupported method: fact");
      return (facts) => simpleMethodHead(context, facts, factTac(context.limits, rules));
    }
    case "unfold": {
      const rules = thms();
      return (facts) =>
        thenTac(insertAllTac(context, facts), changedProp(unfoldTac(context, rules)));
    }
    case "-":
      noArgs();
      return (facts) => insertAllTac(context, facts);
    default:
      throw new TlaIsabelleError("ERROR", `Undefined method: ${name}`);
  }
};

export const evaluate = (context: ProofContext, isar: IsarContext, text: MethodText): Method => {
  switch (text.kind) {
    case "source":
      return methodSource(context, isar, text.name, text.args);
    case "then": {
      const methods = text.texts.map((inner) => evaluate(context, isar, inner));
      return (facts) => (state) =>
        methods.reduce<Seq<Thm>>(
          (results, method) => mapsSeq(method(facts), results),
          singleSeq(state),
        );
    }
    case "orelse": {
      const methods = text.texts.map((inner) => evaluate(context, isar, inner));
      return (facts) =>
        methods.reduceRight<Tactic>((rest, method) => orElse(method(facts), rest), noTac);
    }
    case "try": {
      const method = evaluate(context, isar, text.texts[0]);
      return (facts) => orElse(method(facts), (state) => singleSeq(state));
    }
    case "repeat1": {
      const method = evaluate(context, isar, text.texts[0]);
      return (facts) => thenTac(method(facts), repeat(method(facts)));
    }
    default:
      throw new TlaIsabelleError("ERROR", `Unsupported method combinator: ${text.kind}`);
  }
};
