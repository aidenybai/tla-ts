// Ported from Isabelle2025's Pure/raw_simplifier.ML, the bottom-up rewriting of terms, and the
// goal conversions of Pure/conv.ML. Copyright (c) 1986-2025 University of Cambridge, Technische
// Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { impCong, swapPremsEq } from "./drule";
import { emptyTEnv } from "./envir";
import {
  destEquals,
  destImplies,
  implies,
  incrIndexes,
  isImplies,
  listImplies,
  mkImplies,
  stripImpConcl,
  stripImpPrems,
} from "./logic";
import { boundName } from "./name";
import { matchTermNet, type Net } from "./net";
import { firstOrderMatchPattern, matchPattern, matches, type MatchEnv } from "./pattern";
import {
  addPrems,
  congKey,
  congName,
  extractSafeRrules,
  insertRrule,
  mkProcrule,
  SIMP_DEPTH_LIMIT,
  type Procedure,
  type Rrule,
  type SimpContext,
} from "./raw-simplifier";
import { lookupTable, tableEntries } from "./table";
import { emptyTyEnv, substType } from "./type";
import {
  aconv,
  existsSubterm,
  eqTyp,
  foldAterms,
  listComb,
  maxidxOfTerm,
  mkBound,
  mkFree,
  mkVar,
  propT,
  renameAbs,
  stripComb,
  substBound,
  dummyT,
  type Term,
  type Var,
} from "./term";
import { termOrd } from "./term-ord";
import {
  abstractRule,
  assume,
  betaConversion,
  combination,
  equalElim,
  etaConversion,
  flexflexRule,
  impliesElim,
  impliesIntr,
  incrIndexesThm,
  instantiate,
  instantiateTypes,
  nprems,
  permutePrems,
  premOf,
  reflexive,
  renamedProp,
  symmetric,
  transitive,
  type Instantiation,
  type Thm,
} from "./thm";
import { checkInterrupt } from "./tactic";
import { listOfSeq, singleSeq, emptySeq, type Seq } from "./seq";
import { eqThm } from "./tactical";

export type Prover = (context: SimpContext, thm: Thm) => Thm | undefined;

const isThmError = (error: unknown) => error instanceof TlaIsabelleError && error.exception === "THM";

const lhsOf = (thm: Thm) => destEquals(thm.prop)[0];
const rhsOf = (thm: Thm) => destEquals(thm.prop)[1];

const betaEtaConversion = (term: Term) => {
  const beta = betaConversion(true, term);
  return transitive(beta, etaConversion(rhsOf(beta)));
};

// Thm.match and Thm.instantiate: instantiates rule so that pattern becomes object.
const instantiateMatch = (env: MatchEnv, rule: Thm): Thm => {
  const typed = instantiateTypes(env.tyenv, rule);
  const insts: Instantiation[] = tableEntries(env.tenv).map(([key, binding]) => ({
    variable: mkVar(key.name, key.index, substType(env.tyenv, binding.type)),
    term: binding.term,
  }));
  return instantiate(insts, typed);
};

const renameBoundvars = (pattern: Term, object: Term, thm: Thm) => {
  const renamed = renameAbs(pattern, object, thm.prop);
  return renamed === undefined ? thm : renamedProp(renamed, thm);
};

// check_conv: joins thm and next, allowing for beta and eta differences in the middle term.
const checkConv = (thm: Thm, next: Thm): Thm | undefined => {
  try {
    return transitive(thm, next);
  } catch (error) {
    if (!isThmError(error)) throw error;
  }
  try {
    const normalized = transitive(symmetric(betaEtaConversion(lhsOf(next))), next);
    try {
      return transitive(thm, normalized);
    } catch (error) {
      if (!isThmError(error)) throw error;
      return transitive(transitive(thm, betaEtaConversion(rhsOf(thm))), normalized);
    }
  } catch (error) {
    if (isThmError(error)) return undefined;
    throw error;
  }
};

const SKEL0 = mkBound(0);
const skelFun = (skel: Term) => (skel.kind === "App" ? skel.fun : SKEL0);
const skelArg = (skel: Term) => (skel.kind === "App" ? skel.arg : SKEL0);
const skelBody = (skel: Term) => (skel.kind === "Abs" ? skel.body : SKEL0);

const isWeakCong = (context: SimpContext, lhs: Term) => {
  const weak = context.simpset.weakCongs;
  if (weak.length === 0) return false;
  return existsSubterm(
    (sub) =>
      (sub.kind === "Const" && weak.some((name) => name.isConst && name.name === sub.name)) ||
      (sub.kind === "Free" && weak.some((name) => !name.isConst && name.name === sub.name)),
    lhs,
  );
};

const uncondSkel = (context: SimpContext, lhs: Term, rhs: Term) => (isWeakCong(context, lhs) ? SKEL0 : rhs);

const varsOf = (term: Term) =>
  foldAterms((atom, result: Var[]) => (atom.kind === "Var" ? [...result, atom] : result), term, [] as Var[]);

const condSkel = (context: SimpContext, lhs: Term, rhs: Term) => {
  const lhsVars = varsOf(lhs);
  return varsOf(rhs).every((variable) =>
    lhsVars.some((other) => other.name === variable.name && other.index === variable.index && eqTyp(other.type, variable.type)),
  )
    ? uncondSkel(context, lhs, rhs)
    : SKEL0;
};

interface Rewritten {
  readonly thm: Thm;
  readonly skel: Term;
}

const sortRrules = (rrules: readonly Rrule[]) => {
  const simple: Rrule[] = [];
  const conditional: Rrule[] = [];
  for (const rrule of rrules) {
    const prop = rrule.thm.prop;
    const isSimple = prop.kind === "App" && prop.fun.kind === "App" && prop.fun.fun.kind === "Const" && prop.fun.fun.name === "Pure.eq";
    if (isSimple) simple.unshift(rrule);
    else conditional.unshift(rrule);
  }
  return [...simple, ...conditional];
};

// rewritec: one rewrite step at the root of a term.
const rewritec = (prover: Prover, maxt: number, context: SimpContext, term: Term): Rewritten | undefined => {
  checkInterrupt(context.limits);
  const etaThm = etaConversion(term);
  const etaTerm = rhsOf(etaThm);
  const rew = (rrule: Rrule): Rewritten | undefined => {
    const [rthm, elhs] =
      maxt === -1 || !rrule.extra
        ? [rrule.thm, rrule.elhs]
        : [incrIndexesThm(maxt + 1, rrule.thm), incrementTerm(maxt + 1, rrule.elhs)];
    const env = rrule.fo
      ? firstOrderMatchPattern(elhs, etaTerm, { tyenv: emptyTyEnv, tenv: emptyTEnv })
      : matchPattern(elhs, etaTerm, { tyenv: emptyTyEnv, tenv: emptyTEnv });
    if (env === undefined) return undefined;
    const instantiated = instantiateMatch(env, renameBoundvars(rrule.lhs, etaTerm, rthm));
    const prop = instantiated.prop;
    const isUnconditional = !isImplies(prop);
    const [lhs, rhs] = destEquals(stripImpConcl(prop));
    if (rrule.perm && termOrd(rhs, lhs) >= 0) return undefined;
    if (isUnconditional) {
      const joined = checkConv(etaThm, instantiated);
      if (joined === undefined) throw new TlaIsabelleError("ERROR", "check_conv");
      const [ruleLhs, ruleRhs] = destEquals(rrule.thm.prop);
      return { thm: joined, skel: uncondSkel(context, ruleLhs, ruleRhs) };
    }
    if (context.simpset.depth > SIMP_DEPTH_LIMIT) return undefined;
    const proved = prover(context, instantiated);
    if (proved === undefined) return undefined;
    const joined = checkConv(etaThm, proved);
    if (joined === undefined) return undefined;
    const [ruleLhs, ruleRhs] = destEquals(stripImpConcl(rrule.thm.prop));
    return { thm: joined, skel: condSkel(context, ruleLhs, ruleRhs) };
  };
  const rews = (rrules: readonly Rrule[]): Rewritten | undefined => {
    for (const rrule of rrules) {
      const result = rew(rrule);
      if (result !== undefined) return result;
    }
    return undefined;
  };
  const procRews = (procs: readonly Procedure[]): Rewritten | undefined => {
    for (const proc of procs) {
      if (!matches(proc.lhs, term, emptyTyEnv, emptyTEnv)) continue;
      const raw = proc.proc(context, etaTerm);
      if (raw === undefined) continue;
      const result = rews(mkProcrule(raw));
      if (result !== undefined) return result;
    }
    return undefined;
  };
  if (etaTerm.kind === "App" && etaTerm.fun.kind === "Abs")
    return { thm: transitive(etaThm, betaConversion(false, etaTerm)), skel: SKEL0 };
  return (
    rews(sortRrules(matchTermNet(context.simpset.rules, etaTerm))) ??
    procRews(matchTermNet(context.simpset.simprocs as Net<Procedure>, etaTerm))
  );
};

const incrementTerm = (increment: number, term: Term) => incrIndexes([], increment, term);

// congc: applies a congruence rule to a term.
const congc = (prover: (thm: Thm) => Thm | undefined, maxt: number, cong: Thm, term: Term): Thm | undefined => {
  const rthm = incrIndexesThm(maxt + 1, cong);
  const rlhs = destEquals(stripImpConcl(rthm.prop))[0];
  const env = matchPattern(rlhs, term, { tyenv: emptyTyEnv, tenv: emptyTEnv });
  if (env === undefined) throw new MatchFailure();
  const instantiated = instantiateMatch(env, renameBoundvars(rlhs, term, rthm));
  const proved = prover(instantiated);
  if (proved === undefined) return undefined;
  const joined = checkConv(betaEtaConversion(term), proved);
  if (joined === undefined) return undefined;
  const [lhs, rhs] = destEquals(joined.prop);
  return aconv(lhs, rhs) ? undefined : joined;
};

class MatchFailure extends Error {}

const transitive1 = (first: Thm | undefined, second: Thm | undefined) =>
  first === undefined ? second : second === undefined ? first : transitive(first, second);

const instantiateABC = (rule: Thm, termA: Term, termB: Term, termC: Term) =>
  instantiate(
    [
      { variable: mkVar("A", 0, propT), term: termA },
      { variable: mkVar("B", 0, propT), term: termB },
      { variable: mkVar("C", 0, propT), term: termC },
    ],
    rule,
  );

const impCongRule = (first: Thm, second: Thm) => combination(combination(reflexive(implies), first), second);

export interface RewriteMode {
  readonly simprem: boolean;
  readonly useprem: boolean;
  readonly mutsimp: boolean;
}

interface PremRules {
  readonly rules: ReturnType<typeof extractSafeRrules>;
  readonly asm: Thm | undefined;
}

// bottomc: bottom-up rewriting with the simpset of the context.
const bottomc = (mode: RewriteMode, prover: Prover, maxidx: number) => {
  const botc = (skel: Term, context: SimpContext, term: Term): Thm | undefined => {
    if (skel.kind === "Var") return undefined;
    const sub = subc(skel, context, term);
    if (sub !== undefined) {
      const step = rewritec(prover, maxidx, context, rhsOf(sub));
      if (step === undefined) return sub;
      return transitive1(transitive(sub, step.thm), botc(step.skel, context, rhsOf(step.thm)));
    }
    const step = rewritec(prover, maxidx, context, term);
    if (step === undefined) return undefined;
    return transitive1(step.thm, botc(step.skel, context, rhsOf(step.thm)));
  };
  const tryBotc = (context: SimpContext, term: Term) => botc(SKEL0, context, term) ?? reflexive(term);
  const subc = (skel: Term, context: SimpContext, term: Term): Thm | undefined => {
    if (term.kind === "Abs") {
      const variable = mkFree(boundName(context.bounds), term.type);
      const body = substBound(variable, term.body);
      const inner = botc(skelBody(skel), { ...context, bounds: context.bounds + 1 }, body);
      return inner === undefined ? undefined : abstractRule(term.name, variable, inner);
    }
    if (term.kind !== "App") return undefined;
    const head = term.fun;
    if (head.kind === "App" && head.fun.kind === "Const" && head.fun.name === "Pure.imp") return impc(term, context);
    if (head.kind === "Abs") {
      const beta = betaConversion(false, term);
      const rest = subc(SKEL0, context, rhsOf(beta));
      return rest === undefined ? beta : transitive(beta, rest);
    }
    const appc = (): Thm | undefined => {
      const funThm = botc(skelFun(skel), context, term.fun);
      const argThm = botc(skelArg(skel), context, term.arg);
      if (funThm !== undefined) return combination(funThm, argThm ?? reflexive(term.arg));
      return argThm === undefined ? undefined : combination(reflexive(term.fun), argThm);
    };
    const [headTerm, args] = stripComb(head);
    const name = congName(headTerm);
    const cong = name === undefined ? undefined : lookupTable(context.simpset.congs, congKey(name));
    if (cong === undefined) return appc();
    try {
      const thm = congc((rule) => prover(context, rule), maxidx, cong, term);
      const result = thm === undefined ? term : rhsOf(thm);
      const [left, right] = result.kind === "App" ? [result.fun, result.arg] : [term.fun, term.arg];
      const congSkel = listComb(
        headTerm,
        args.map(() => mkVar("", 0, dummyT)),
      );
      const inner = botc(congSkel, context, left);
      return inner === undefined ? thm : transitive1(thm, combination(inner, reflexive(right)));
    } catch (error) {
      if (error instanceof MatchFailure) return appc();
      throw error;
    }
  };
  const impc = (term: Term, context: SimpContext) =>
    mode.mutsimp ? mutImpc0([], term, [], context) : nonmutImpc(term, context);
  const rulesOfPrem = (prem: Term, context: SimpContext): [PremRules, SimpContext] => {
    if (maxidxOfTerm(prem) !== -1) return [{ rules: [], asm: undefined }, context];
    const asm = assume(prem);
    return [{ rules: extractSafeRrules(context, asm), asm }, context];
  };
  const addRrules = (rules: readonly PremRules[], context: SimpContext): SimpContext => {
    const simpset = rules.reduce(
      (current, prem) => prem.rules.reduce((inner, raw) => insertRrule(raw, inner), current),
      context.simpset,
    );
    return {
      ...context,
      simpset: addPrems(
        rules.flatMap((prem) => (prem.asm === undefined ? [] : [prem.asm])),
        simpset,
      ),
    };
  };
  const disch = (isReordered: boolean, prem: Term, eq: Thm): Thm => {
    const [lhs, rhs] = destEquals(eq.prop);
    const discharged = impliesElim(instantiateABC(impCong, prem, lhs, rhs), impliesIntr(prem, eq));
    if (!isReordered) return discharged;
    const [premA, concl] = destImplies(lhs);
    const [premB] = destImplies(rhs);
    return transitive(
      transitive(instantiateABC(swapPremsEq, premA, prem, concl), discharged),
      instantiateABC(swapPremsEq, prem, premB, concl),
    );
  };
  const rebuild = (
    prems: readonly Term[],
    concl: Term,
    rules: readonly PremRules[],
    context: SimpContext,
    eq: Thm | undefined,
  ): Thm | undefined => {
    if (prems.length === 0) return eq;
    const [prem, ...rest] = prems;
    const inner = addRrules([...rules.slice(1)].reverse(), context);
    const nextConcl = mkImplies(prem, eq === undefined ? concl : rhsOf(eq));
    const dprem = eq === undefined ? undefined : disch(false, prem, eq);
    const step = rewritec(prover, maxidx, inner, nextConcl);
    if (step === undefined) return rebuild(rest, nextConcl, rules.slice(1), context, dprem);
    const joined = transitive1(dprem, step.thm);
    if (joined === undefined) throw new TlaIsabelleError("ERROR", "rebuild");
    return transitive1(
      rest.reduce((current, item) => disch(false, item, current), joined),
      mutImpc0([...rest].reverse(), rhsOf(step.thm), [...rules.slice(1)].reverse(), context),
    );
  };
  const mutImpc0 = (
    prems: readonly Term[],
    concl: Term,
    rules: readonly PremRules[],
    context: SimpContext,
  ): Thm | undefined => {
    const newPrems = stripImpPrems(concl);
    let current = context;
    const newRules: PremRules[] = [];
    for (const prem of newPrems) {
      const [rule, next] = rulesOfPrem(prem, current);
      newRules.push(rule);
      current = next;
    }
    return mutImpc(
      [...prems, ...newPrems],
      stripImpConcl(concl),
      [...rules, ...newRules],
      [],
      [],
      [],
      current,
      -1,
      -1,
    );
  };
  const mutImpc = (
    prems: readonly Term[],
    concl: Term,
    rules: readonly PremRules[],
    donePrems: readonly Term[],
    doneRules: readonly PremRules[],
    eqns: readonly (Thm | undefined)[],
    context: SimpContext,
    changed: number,
    count: number,
  ): Thm | undefined => {
    if (prems.length === 0) {
      const folded = eqns.reduce<Thm | undefined>(
        (eq2, eq1, index) => transitive1(eq1, eq2 === undefined ? undefined : disch(false, donePrems[index], eq2)),
        undefined,
      );
      const rest =
        changed > 0
          ? mutImpc([...donePrems].reverse(), concl, [...doneRules].reverse(), [], [], [], context, -1, changed)
          : rebuild(
              donePrems,
              concl,
              doneRules,
              context,
              botc(SKEL0, addRrules([...doneRules].reverse(), context), concl),
            );
      return transitive1(folded, rest);
    }
    const [prem, ...otherPrems] = prems;
    const [rule, ...otherRules] = rules;
    const simplified =
      count === 0 ? undefined : botc(SKEL0, addRrules([...[...doneRules].reverse(), ...otherRules], context), prem);
    if (simplified === undefined)
      return mutImpc(
        otherPrems,
        concl,
        otherRules,
        [prem, ...donePrems],
        [rule, ...doneRules],
        [undefined, ...eqns],
        context,
        changed,
        count === 0 ? 0 : count - 1,
      );
    const newPrem = rhsOf(simplified);
    const index =
      1 +
      simplified.hyps.reduce(
        (result, hyp) => Math.max(result, otherPrems.findIndex((other) => aconv(other, hyp))),
        -1,
      );
    const [newRule, next] = rulesOfPrem(newPrem, context);
    const eqn = otherPrems
      .slice(0, index)
      .reduceRight(
        (current, item) => disch(true, item, current),
        impCongRule(simplified, reflexive(listImplies(otherPrems.slice(index), concl))),
      );
    return mutImpc(
      otherPrems,
      concl,
      otherRules,
      [newPrem, ...donePrems],
      [newRule, ...doneRules],
      [eqn, ...eqns],
      next,
      donePrems.length,
      -1,
    );
  };
  const nonmutImpc = (term: Term, context: SimpContext): Thm | undefined => {
    const [prem, conc] = destImplies(term);
    const first = mode.simprem ? botc(SKEL0, context, prem) : undefined;
    const simplifiedPrem = first === undefined ? prem : rhsOf(first);
    const inner = mode.useprem ? addRrules([rulesOfPrem(simplifiedPrem, context)[0]], context) : context;
    const second = botc(SKEL0, inner, conc);
    if (second === undefined) return first === undefined ? undefined : impCongRule(first, reflexive(conc));
    const discharged = disch(false, simplifiedPrem, second);
    return first === undefined ? discharged : transitive(impCongRule(first, reflexive(conc)), discharged);
  };
  return tryBotc;
};

// Drule.flexflex_unique
const flexflexUnique = (thm: Thm): Thm => {
  if (thm.tpairs.length === 0) return thm;
  const results = listOfSeq(flexflexRule(thm));
  const distinct = results.filter((result, index) => results.findIndex((other) => eqThm(other, result)) === index);
  if (distinct.length === 1) return distinct[0];
  throw new TlaIsabelleError("THM", distinct.length === 0 ? "flexflex_unique: impossible constraints" : "flexflex_unique: multiple unifiers");
};

// rewrite_cterm: proves term == term' by rewriting.
export const rewriteCterm = (mode: RewriteMode, prover: Prover, context: SimpContext, term: Term): Thm => {
  const inner = { ...context, simpset: { ...context.simpset, depth: context.simpset.depth + 1 } };
  const wrapped: Prover = (current, thm) => {
    const result = prover(current, thm);
    return result === undefined ? undefined : flexflexUnique(result);
  };
  return bottomc(mode, wrapped, maxidxOfTerm(term))(inner, term);
};

// Conv.gconv_rule: rewrites goal index of a state.
export const gconvRule = (convert: (term: Term) => Thm, index: number, state: Thm): Thm => {
  if (index < 1 || index > nprems(state)) throw new TlaIsabelleError("THM", `gconv_rule ${index}`);
  const eq = convert(premOf(state, index));
  const [lhs, rhs] = destEquals(eq.prop);
  if (aconv(lhs, rhs)) return state;
  const rotated = permutePrems(0, index - 1, state);
  const rest = rotated.prop;
  if (!isImplies(rest)) throw new TlaIsabelleError("THM", "gconv_rule");
  const converted = equalElim(impCongRule(eq, reflexive(destImplies(rest)[1])), rotated);
  return permutePrems(0, 1 - index, converted);
};

// Conv.fconv_rule: rewrites a theorem's proposition.
export const fconvRule = (convert: (term: Term) => Thm, thm: Thm): Thm => {
  const eq = convert(thm.prop);
  const [lhs, rhs] = destEquals(eq.prop);
  return aconv(lhs, rhs) ? thm : equalElim(eq, thm);
};

export const genericRewriteGoalTac =
  (mode: RewriteMode, prover: Prover, context: SimpContext, index: number) =>
  (state: Thm): Seq<Thm> =>
    index > 0 && index <= nprems(state)
      ? singleSeq(gconvRule((term) => rewriteCterm(mode, prover, context, term), index, state))
      : emptySeq;
