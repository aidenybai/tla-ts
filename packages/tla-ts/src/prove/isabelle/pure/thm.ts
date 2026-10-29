// Ported from Isabelle2025's Pure/thm.ML, the inference kernel. Copyright (c) 1986-2025
// University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Every TLA+ type variable has the empty sort, so the kernel drops the sort hypotheses and
// constraints. Proof terms and certificates are not recorded either.

import { TlaIsabelleError } from "../../../errors";
import {
  aeconv,
  betaNorm,
  emptyEnvir,
  etaContract,
  isEmptyEnvir,
  above,
  normTerm,
  type Envir,
} from "./envir";
import {
  allConst,
  assumProblems,
  countPrems,
  flattenParams,
  incrIndexes,
  liftAbs,
  liftAll,
  listAll,
  listImplies,
  mkEquals,
  mkImplies,
  stripImpConcl,
  stripImpPrems,
  stripPrems,
  stripAssumsConcl,
  stripAssumsHyp,
} from "./logic";
import { unifyTypesEnvir } from "./pattern";
import {
  emptySeq,
  flatSeq,
  itRightSeq,
  makeSeq,
  mappSeq,
  chopSeq,
  consSeq,
  mapSeq,
  type Seq,
} from "./seq";
import { normType, substType, type TyEnv } from "./type";
import {
  abstractOver,
  aconv,
  betapply,
  couldUnify,
  eqTyp,
  existsSubterm,
  fastypeOf,
  foldAterms,
  matchBvars,
  maxidxOfTerm,
  mkAbs,
  mkApp,
  mkConst,
  mkVar,
  propT,
  stripAllBody,
  stripAllVars,
  substBound,
  type Term,
  type Typ,
  type Var,
} from "./term";
import { smashUnifiers, unifiers, type Tpair } from "./unify";

declare const kernel: unique symbol;

// A theorem. Only this module builds one, so every Thm follows from the axioms by the rules here.
export interface Thm {
  readonly maxidx: number;
  readonly hyps: readonly Term[];
  readonly tpairs: readonly Tpair[];
  readonly prop: Term;
  readonly [kernel]: true;
}

const makeThm = (
  maxidx: number,
  hyps: readonly Term[],
  tpairs: readonly Tpair[],
  prop: Term,
): Thm => ({ maxidx, hyps, tpairs, prop }) as Thm;


const unionHyps = (left: readonly Term[], right: readonly Term[]) =>
  right.length === 0
    ? left
    : left.length === 0
      ? right
      : [...left, ...right.filter((hyp) => !left.some((other) => aconv(hyp, other)))];

const unionTpairs = (left: readonly Tpair[], right: readonly Tpair[]) =>
  right.length === 0
    ? left
    : [
        ...left,
        ...right.filter(
          (pair) => !left.some((other) => aconv(pair[0], other[0]) && aconv(pair[1], other[1])),
        ),
      ];

const maxidxTpairs = (tpairs: readonly Tpair[], maxidx: number) =>
  tpairs.reduce((result, pair) => maxidxOfTerm(pair[1], maxidxOfTerm(pair[0], result)), maxidx);

// An axiom or a theorem that the reference theories prove, taken on trust.
export const axiomThm = (prop: Term): Thm => makeThm(maxidxOfTerm(prop), [], [], prop);

export const nprems = (thm: Thm) => countPrems(thm.prop);
export const premsOf = (thm: Thm) => stripImpPrems(thm.prop);
export const conclOf = (thm: Thm) => stripImpConcl(thm.prop);

export const majorPremOf = (thm: Thm) => {
  const premise = premsOf(thm)[0];
  if (premise === undefined) throw new TlaIsabelleError("THM", "major_prem_of: rule with no premises");
  return stripAssumsConcl(premise);
};

export const premOf = (thm: Thm, index: number) => {
  const premise = premsOf(thm)[index - 1];
  if (premise === undefined) throw new TlaIsabelleError("THM", `No subgoal ${index}`);
  return premise;
};

export const assume = (prop: Term): Thm => {
  if (!eqTyp(fastypeOf(prop), propT)) throw new TlaIsabelleError("THM", "assume: prop");
  if (maxidxOfTerm(prop) !== -1) throw new TlaIsabelleError("THM", "assume: variables");
  return makeThm(-1, [prop], [], prop);
};

export const impliesIntr = (premise: Term, thm: Thm): Thm => {
  if (!eqTyp(fastypeOf(premise), propT))
    throw new TlaIsabelleError("THM", "implies_intr: assumptions must have type prop");
  return makeThm(
    Math.max(maxidxOfTerm(premise), thm.maxidx),
    thm.hyps.filter((hyp) => !aconv(hyp, premise)),
    thm.tpairs,
    mkImplies(premise, thm.prop),
  );
};

export const impliesElim = (major: Thm, minor: Thm): Thm => {
  const prop = major.prop;
  if (
    prop.kind !== "App" ||
    prop.fun.kind !== "App" ||
    prop.fun.fun.kind !== "Const" ||
    prop.fun.fun.name !== "Pure.imp" ||
    !aconv(prop.fun.arg, minor.prop)
  )
    throw new TlaIsabelleError("THM", "implies_elim: major premise");
  return makeThm(
    Math.max(major.maxidx, minor.maxidx),
    unionHyps(minor.hyps, major.hyps),
    unionTpairs(minor.tpairs, major.tpairs),
    prop.arg,
  );
};

const occursIn = (variable: Term, terms: readonly Term[], tpairs: readonly Tpair[]) => {
  const occurs = (term: Term) => existsSubterm((sub) => aconv(variable, sub), term);
  return terms.some(occurs) || tpairs.some((pair) => occurs(pair[0]) || occurs(pair[1]));
};

export const forallIntr = (variable: Term, thm: Thm): Thm => {
  if (variable.kind !== "Free" && variable.kind !== "Var")
    throw new TlaIsabelleError("THM", "forall_intr: not a variable");
  if (occursIn(variable, variable.kind === "Free" ? thm.hyps : [], thm.tpairs))
    throw new TlaIsabelleError("THM", `forall_intr: variable "${variable.name}" free in assumptions`);
  return makeThm(
    Math.max(maxidxOfTerm(variable), thm.maxidx),
    thm.hyps,
    thm.tpairs,
    mkApp(
      allConst(variable.type),
      mkAbs(variable.name, variable.type, abstractOver(variable, thm.prop)),
    ),
  );
};

export const forallElim = (term: Term, thm: Thm): Thm => {
  const prop = thm.prop;
  if (
    prop.kind !== "App" ||
    prop.fun.kind !== "Const" ||
    prop.fun.name !== "Pure.all" ||
    prop.fun.type.kind !== "Type" ||
    prop.fun.type.args[0].kind !== "Type"
  )
    throw new TlaIsabelleError("THM", "forall_elim: not quantified");
  if (!eqTyp(fastypeOf(term), prop.fun.type.args[0].args[0]))
    throw new TlaIsabelleError("THM", "forall_elim: type mismatch");
  return makeThm(
    Math.max(maxidxOfTerm(term), thm.maxidx),
    thm.hyps,
    thm.tpairs,
    betapply(prop.arg, term),
  );
};

export const reflexive = (term: Term) => makeThm(maxidxOfTerm(term), [], [], mkEquals(term, term));

const destEq = (thm: Thm): [Term, Term, Term] | undefined => {
  const prop = thm.prop;
  return prop.kind === "App" &&
    prop.fun.kind === "App" &&
    prop.fun.fun.kind === "Const" &&
    prop.fun.fun.name === "Pure.eq"
    ? [prop.fun.fun, prop.fun.arg, prop.arg]
    : undefined;
};

export const symmetric = (thm: Thm): Thm => {
  const parts = destEq(thm);
  if (parts === undefined) throw new TlaIsabelleError("THM", "symmetric");
  return makeThm(thm.maxidx, thm.hyps, thm.tpairs, mkApp(mkApp(parts[0], parts[2]), parts[1]));
};

export const transitive = (first: Thm, second: Thm): Thm => {
  const left = destEq(first);
  const right = destEq(second);
  if (left === undefined || right === undefined) throw new TlaIsabelleError("THM", "transitive: premises");
  if (!aconv(left[2], right[1])) throw new TlaIsabelleError("THM", "transitive: middle term");
  return makeThm(
    Math.max(first.maxidx, second.maxidx),
    unionHyps(first.hyps, second.hyps),
    unionTpairs(first.tpairs, second.tpairs),
    mkApp(mkApp(left[0], left[1]), right[2]),
  );
};

export const betaConversion = (full: boolean, term: Term): Thm => {
  if (!full && (term.kind !== "App" || term.fun.kind !== "Abs"))
    throw new TlaIsabelleError("THM", "beta_conversion: not a redex");
  const reduced = full || term.kind !== "App" || term.fun.kind !== "Abs" ? betaNorm(term) : substBound(term.arg, term.fun.body);
  return makeThm(maxidxOfTerm(term), [], [], mkEquals(term, reduced));
};

export const etaConversion = (term: Term) =>
  makeThm(maxidxOfTerm(term), [], [], mkEquals(term, etaContract(term)));

export const abstractRule = (name: string, variable: Term, thm: Thm): Thm => {
  const parts = destEq(thm);
  if (parts === undefined) throw new TlaIsabelleError("THM", "abstract_rule: premise not an equality");
  if (variable.kind !== "Free" && variable.kind !== "Var")
    throw new TlaIsabelleError("THM", "abstract_rule: not a variable");
  if (occursIn(variable, variable.kind === "Free" ? thm.hyps : [], thm.tpairs))
    throw new TlaIsabelleError("THM", `abstract_rule: variable "${variable.name}" free in assumptions`);
  return makeThm(
    thm.maxidx,
    thm.hyps,
    thm.tpairs,
    mkEquals(
      mkAbs(name, variable.type, abstractOver(variable, parts[1])),
      mkAbs(name, variable.type, abstractOver(variable, parts[2])),
    ),
  );
};

export const combination = (first: Thm, second: Thm): Thm => {
  const left = destEq(first);
  const right = destEq(second);
  if (left === undefined || right === undefined) throw new TlaIsabelleError("THM", "combination: premises");
  const funType = fastypeOf(left[1]);
  if (funType.kind !== "Type" || funType.name !== "fun")
    throw new TlaIsabelleError("THM", "combination: not function type");
  if (!eqTyp(funType.args[0], fastypeOf(right[1]))) throw new TlaIsabelleError("THM", "combination: types");
  return makeThm(
    Math.max(first.maxidx, second.maxidx),
    unionHyps(first.hyps, second.hyps),
    unionTpairs(first.tpairs, second.tpairs),
    mkEquals(mkApp(left[1], right[1]), mkApp(left[2], right[2])),
  );
};

const destImp = (prop: Term): [Term, Term] | undefined =>
  prop.kind === "App" &&
  prop.fun.kind === "App" &&
  prop.fun.fun.kind === "Const" &&
  prop.fun.fun.name === "Pure.imp"
    ? [prop.fun.arg, prop.arg]
    : undefined;

export const equalIntr = (first: Thm, second: Thm): Thm => {
  const left = destImp(first.prop);
  const right = destImp(second.prop);
  if (left === undefined || right === undefined) throw new TlaIsabelleError("THM", "equal_intr: premises");
  if (!aconv(left[0], right[1]) || !aconv(left[1], right[0]))
    throw new TlaIsabelleError("THM", "equal_intr: not equal");
  return makeThm(
    Math.max(first.maxidx, second.maxidx),
    unionHyps(first.hyps, second.hyps),
    unionTpairs(first.tpairs, second.tpairs),
    mkEquals(left[0], left[1]),
  );
};

export const equalElim = (first: Thm, second: Thm): Thm => {
  const parts = destEq(first);
  if (parts === undefined) throw new TlaIsabelleError("THM", "equal_elim: major premise");
  if (!aconv(second.prop, parts[1])) throw new TlaIsabelleError("THM", "equal_elim: not equal");
  return makeThm(
    Math.max(first.maxidx, second.maxidx),
    unionHyps(first.hyps, second.hyps),
    unionTpairs(first.tpairs, second.tpairs),
    parts[2],
  );
};

export const flexflexRule = (thm: Thm): Seq<Thm> =>
  mapSeq(
    (envir: Envir) => {
      if (isEmptyEnvir(envir)) return thm;
      const tpairs = thm.tpairs
        .map((pair): Tpair => [normTerm(envir, pair[0]), normTerm(envir, pair[1])])
        .filter((pair) => !aconv(pair[0], pair[1]));
      const prop = normTerm(envir, thm.prop);
      return makeThm(maxidxTpairs(tpairs, maxidxOfTerm(prop)), thm.hyps, tpairs, prop);
    },
    smashUnifiers(thm.tpairs, emptyEnvir(thm.maxidx)),
  );

// Thm.generalize: turns the named free variables into schematic ones with the given index.
export const generalize = (frees: readonly string[], index: number, thm: Thm): Thm => {
  if (frees.length === 0) return thm;
  if (index <= thm.maxidx) throw new TlaIsabelleError("THM", "generalize: bad index");
  if (
    thm.hyps.some((hyp) =>
      existsSubterm((sub) => sub.kind === "Free" && frees.includes(sub.name), hyp),
    )
  )
    throw new TlaIsabelleError("THM", "generalize: variable free in assumptions");
  const generalizeTerm = (term: Term): Term => {
    switch (term.kind) {
      case "Free":
        return frees.includes(term.name) ? mkVar(term.name, index, term.type) : term;
      case "Abs":
        return mkAbs(term.name, term.type, generalizeTerm(term.body));
      case "App":
        return mkApp(generalizeTerm(term.fun), generalizeTerm(term.arg));
      default:
        return term;
    }
  };
  const prop = generalizeTerm(thm.prop);
  const tpairs = thm.tpairs.map((pair): Tpair => [
    generalizeTerm(pair[0]),
    generalizeTerm(pair[1]),
  ]);
  return makeThm(maxidxTpairs(tpairs, maxidxOfTerm(prop)), thm.hyps, tpairs, prop);
};

export interface Instantiation {
  readonly variable: Var;
  readonly term: Term;
}

const instantiateTerm = (insts: readonly Instantiation[], term: Term): Term => {
  const find = (variable: Var) =>
    insts.find(
      (inst) =>
        inst.variable.name === variable.name &&
        inst.variable.index === variable.index &&
        eqTyp(inst.variable.type, variable.type),
    )?.term;
  const subst = (current: Term): Term => {
    switch (current.kind) {
      case "Var":
        return find(current) ?? current;
      case "Abs": {
        const body = subst(current.body);
        return body === current.body ? current : mkAbs(current.name, current.type, body);
      }
      case "App": {
        const fun = subst(current.fun);
        const arg = subst(current.arg);
        return fun === current.fun && arg === current.arg ? current : mkApp(fun, arg);
      }
      default:
        return current;
    }
  };
  return subst(term);
};

// Thm.instantiate for term variables. Every instance must have the type of its variable.
export const instantiate = (insts: readonly Instantiation[], thm: Thm): Thm => {
  if (insts.length === 0) return thm;
  for (const inst of insts)
    if (!eqTyp(inst.variable.type, fastypeOf(inst.term))) throw new TlaIsabelleError("THM", "instantiate: type conflict");
  const prop = instantiateTerm(insts, thm.prop);
  const tpairs = thm.tpairs.map((pair): Tpair => [
    instantiateTerm(insts, pair[0]),
    instantiateTerm(insts, pair[1]),
  ]);
  return makeThm(maxidxTpairs(tpairs, maxidxOfTerm(prop)), thm.hyps, tpairs, prop);
};

// Thm.instantiate for type variables.
export const instantiateTypes = (tyenv: TyEnv, thm: Thm): Thm => {
  const substT = (type: Typ) => substType(tyenv, type);
  const subst = (term: Term): Term => {
    switch (term.kind) {
      case "Const":
        return mkConst(term.name, substT(term.type));
      case "Free":
        return { kind: "Free", name: term.name, type: substT(term.type) };
      case "Var":
        return mkVar(term.name, term.index, substT(term.type));
      case "Bound":
        return term;
      case "Abs":
        return mkAbs(term.name, substT(term.type), subst(term.body));
      case "App":
        return mkApp(subst(term.fun), subst(term.arg));
    }
  };
  const prop = subst(thm.prop);
  const tpairs = thm.tpairs.map((pair): Tpair => [subst(pair[0]), subst(pair[1])]);
  return makeThm(maxidxTpairs(tpairs, maxidxOfTerm(prop)), thm.hyps, tpairs, prop);
};

// Thm.renamed_prop: the same theorem with an alpha-equivalent proposition.
export const renamedProp = (prop: Term, thm: Thm): Thm => {
  if (!aconv(prop, thm.prop)) throw new TlaIsabelleError("TERM", "renamed_prop: props disagree");
  return makeThm(thm.maxidx, thm.hyps, thm.tpairs, prop);
};

export const trivial = (prop: Term): Thm => {
  if (!eqTyp(fastypeOf(prop), propT)) throw new TlaIsabelleError("THM", "trivial: the term must have type prop");
  return makeThm(maxidxOfTerm(prop), [], [], mkImplies(prop, prop));
};

interface State {
  readonly tpairs: readonly Tpair[];
  readonly before: Term[];
  readonly goal: Term;
  readonly conclusion: Term;
}

export const destState = (state: Thm, index: number): State => {
  const premises = stripImpPrems(state.prop);
  if (index < 1 || index > premises.length) throw new TlaIsabelleError("THM", `dest_state ${index}`);
  return {
    tpairs: state.tpairs,
    before: premises.slice(0, index - 1),
    goal: premises[index - 1],
    conclusion: listImplies(premises.slice(index), stripImpConcl(state.prop)),
  };
};

// Thm.lift_rule: lifts a rule over the parameters and premises of a goal of a state.
export const liftRule = (goal: Term, goalMaxidx: number, rule: Thm): Thm => {
  const increment = goalMaxidx + 1;
  const premises = stripImpPrems(rule.prop).map((premise) => liftAll(increment, goal, premise));
  return makeThm(
    rule.maxidx + increment,
    rule.hyps,
    rule.tpairs.map((pair): Tpair => [
      liftAbs(increment, goal, pair[0]),
      liftAbs(increment, goal, pair[1]),
    ]),
    listImplies(premises, liftAll(increment, goal, stripImpConcl(rule.prop))),
  );
};

export const incrIndexesThm = (increment: number, thm: Thm): Thm => {
  if (increment < 0) throw new TlaIsabelleError("THM", "negative increment");
  if (increment === 0) return thm;
  return makeThm(
    thm.maxidx + increment,
    thm.hyps,
    thm.tpairs.map((pair): Tpair => [
      incrIndexes([], increment, pair[0]),
      incrIndexes([], increment, pair[1]),
    ]),
    incrIndexes([], increment, thm.prop),
  );
};

// Thm.assumption: solves goal index by any of its assumptions, with unification.
export const assumption = (index: number, state: Thm): Seq<Thm> => {
  const parts = destState(state, index);
  const newThm = (unifier: { envir: Envir; tpairs: readonly Tpair[] }): Thm => {
    const envir = unifier.envir;
    const isEmpty = isEmptyEnvir(envir);
    const prop = listImplies(parts.before, parts.conclusion);
    return makeThm(
      envir.maxidx,
      state.hyps,
      isEmpty
        ? unifier.tpairs
        : unifier.tpairs.map((pair): Tpair => [normTerm(envir, pair[0]), normTerm(envir, pair[1])]),
      isEmpty ? prop : normTerm(envir, prop),
    );
  };
  const problems = assumProblems(-1, parts.goal);
  const conclusion = problems.abstract(problems.conclusion);
  const addprfs = (position: number): Seq<Thm> =>
    position >= problems.hyps.length
      ? emptySeq
      : makeSeq(() => {
          const hyp = problems.hyps[position];
          return mappSeq(
            newThm,
            couldUnify(hyp, problems.conclusion)
              ? unifiers(emptyEnvir(state.maxidx), [
                  [problems.abstract(hyp), conclusion],
                  ...parts.tpairs,
                ])
              : emptySeq,
            addprfs(position + 1),
          ).pull();
        });
  return addprfs(0);
};

// Thm.eq_assumption: solves goal index by an assumption equal to its conclusion up to alpha and eta.
export const eqAssumption = (index: number, state: Thm): Thm => {
  const parts = destState(state, index);
  const problems = assumProblems(-1, parts.goal);
  if (!problems.hyps.some((hyp) => aeconv(hyp, problems.conclusion)))
    throw new TlaIsabelleError("THM", "eq_assumption");
  return makeThm(
    state.maxidx,
    state.hyps,
    state.tpairs,
    listImplies(parts.before, parts.conclusion),
  );
};

export const rotateRule = (count: number, index: number, state: Thm): Thm => {
  const parts = destState(state, index);
  const params = stripAllVars(parts.goal);
  const rest = stripAllBody(parts.goal);
  const asms = stripImpPrems(rest);
  const concl = stripImpConcl(rest);
  const total = asms.length;
  const shift = count < 0 ? total + count : count;
  if (shift < 0 || shift > total) throw new TlaIsabelleError("THM", `rotate_rule ${count}`);
  const goal =
    shift === 0 || shift === total
      ? parts.goal
      : listAll(params, listImplies([...asms.slice(shift), ...asms.slice(0, shift)], concl));
  const premises = stripImpPrems(state.prop);
  return makeThm(
    state.maxidx,
    state.hyps,
    state.tpairs,
    listImplies([...parts.before, goal, ...premises.slice(index)], stripImpConcl(state.prop)),
  );
};

export const permutePrems = (fixed: number, count: number, rule: Thm): Thm => {
  const premises = stripImpPrems(rule.prop);
  const concl = stripImpConcl(rule.prop);
  if (fixed > premises.length) throw new TlaIsabelleError("THM", `permute_prems: j ${fixed}`);
  const moved = premises.slice(fixed);
  const shift = count < 0 ? moved.length + count : count;
  if (shift === 0 || shift === moved.length) return rule;
  if (shift < 0 || shift > moved.length) throw new TlaIsabelleError("THM", `permute_prems: k ${count}`);
  return makeThm(
    rule.maxidx,
    rule.hyps,
    rule.tpairs,
    listImplies(
      [...premises.slice(0, fixed), ...moved.slice(shift), ...moved.slice(0, shift)],
      concl,
    ),
  );
};

const isImpApp = (
  term: Term,
): term is Extract<Term, { kind: "App" }> & { fun: Extract<Term, { kind: "App" }> } =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.imp";

const isAllApp = (
  term: Term,
): term is Extract<Term, { kind: "App" }> & { arg: Extract<Term, { kind: "Abs" }> } =>
  term.kind === "App" &&
  term.fun.kind === "Const" &&
  term.fun.name === "Pure.all" &&
  term.arg.kind === "Abs";

const stripApply = (apply: (term: Term) => Term, lifted: Term, term: Term): Term => {
  if (isImpApp(lifted) && isImpApp(term))
    return mkApp(mkApp(lifted.fun.fun, term.fun.arg), stripApply(apply, lifted.arg, term.arg));
  if (isAllApp(lifted) && isAllApp(term))
    return mkApp(
      lifted.fun,
      mkAbs(term.arg.name, term.arg.type, stripApply(apply, lifted.arg.body, term.arg.body)),
    );
  return apply(term);
};

const stripLifted = (lifted: Term, term: Term): Term => {
  if (isImpApp(lifted) && isImpApp(term)) return stripLifted(lifted.arg, term.arg);
  if (isAllApp(lifted) && isAllApp(term)) return stripLifted(lifted.arg.body, term.arg.body);
  return term;
};

const addVarNames = (term: Term, names: Set<string>) =>
  foldAterms(
    (atom, result: Set<string>) => (atom.kind === "Var" ? result.add(atom.name) : result),
    term,
    names,
  );

const makeDistinct = (pairs: readonly [string, string][]) => {
  const table = new Map<string, string>();
  for (const pair of pairs) if (!table.has(pair[0])) table.set(pair[0], pair[1]);
  return table;
};

// Thm.rename_bvars: renames bound variables and some unknowns of the new premises after the
// names in the disagreement pairs.
const renameBvars = (
  dpairs: readonly Tpair[],
  tpairs: readonly Tpair[],
  lifted: Term,
  premises: readonly Term[],
): ((term: Term) => Term) | undefined => {
  const pairs = dpairs.reduceRight<[string, string][]>(
    (result, pair) => matchBvars(pair[0], pair[1], result),
    [],
  );
  if (pairs.length === 0) return undefined;
  const unknowns = new Set<string>();
  for (const pair of dpairs) addVarNames(pair[0], unknowns);
  for (const pair of tpairs) {
    addVarNames(pair[0], unknowns);
    addVarNames(pair[1], unknowns);
  }
  const premiseUnknowns = new Set<string>();
  for (const premise of premises) addVarNames(stripLifted(lifted, premise), premiseUnknowns);
  const filtered = pairs.filter(
    (pair) => premiseUnknowns.has(pair[0]) && !unknowns.has(pair[0]) && !unknowns.has(pair[1]),
  );
  const distinct = filtered.filter(
    (pair, position) => filtered.findIndex((other) => other[0] === pair[0]) === position,
  );
  const unchanged = new Set(
    [...premiseUnknowns].filter((name) => !distinct.some((pair) => pair[0] === name)),
  );
  const delClashing = (
    isClash: boolean,
    xs: Set<string>,
    ys: Set<string>,
    rest: readonly [string, string][],
    kept: [string, string][],
  ): [string, string][] => {
    if (rest.length === 0) return isClash ? delClashing(false, xs, new Set(xs), kept, []) : kept;
    const [pair, ...others] = rest;
    if (ys.has(pair[1]))
      return delClashing(true, new Set(xs).add(pair[0]), new Set(ys).add(pair[0]), others, kept);
    return delClashing(isClash, xs, new Set(ys).add(pair[1]), others, [pair, ...kept]);
  };
  const vars = makeDistinct(delClashing(false, unchanged, new Set(unchanged), distinct, []));
  const bounds = makeDistinct(pairs);
  if (
    [...vars].every((pair) => pair[0] === pair[1]) &&
    [...bounds].every((pair) => pair[0] === pair[1])
  )
    return undefined;
  const rename = (term: Term): Term => {
    switch (term.kind) {
      case "Var": {
        const name = vars.get(term.name) ?? term.name;
        return name === term.name ? term : mkVar(name, term.index, term.type);
      }
      case "Abs":
        return mkAbs(bounds.get(term.name) ?? term.name, term.type, rename(term.body));
      case "App":
        return mkApp(rename(term.fun), rename(term.arg));
      default:
        return term;
    }
  };
  return rename;
};

const stripAssums2 = (lifted: Term, goal: Term): Tpair => {
  if (isImpApp(lifted) && isImpApp(goal)) return stripAssums2(lifted.arg, goal.arg);
  if (isAllApp(lifted) && isAllApp(goal)) {
    const [left, right] = stripAssums2(lifted.arg.body, goal.arg.body);
    return [
      mkAbs(lifted.arg.name, lifted.arg.type, left),
      mkAbs(lifted.arg.name, lifted.arg.type, right),
    ];
  }
  return [lifted, goal];
};

const normTermSkip = (envir: Envir, count: number, term: Term): Term => {
  if (count === 0) return normTerm(envir, term);
  if (isAllApp(term)) {
    const type = normType(envir.tyenv, term.arg.type);
    return mkApp(
      allConst(type),
      mkAbs(term.arg.name, type, normTermSkip(envir, count, term.arg.body)),
    );
  }
  if (isImpApp(term)) return mkImplies(term.fun.arg, normTermSkip(envir, count - 1, term.arg));
  throw new TlaIsabelleError("ERROR", "norm_term_skip: too few assumptions??");
};

const unifyVarTypes = (first: Thm, second: Thm, envir: Envir): Envir | undefined => {
  const vars = new Map<string, Typ[]>();
  const add = (term: Term) =>
    foldAterms(
      (atom, result: Map<string, Typ[]>) => {
        if (atom.kind !== "Var") return result;
        const key = `${atom.index}:${atom.name}`;
        const types = result.get(key) ?? [];
        if (!types.some((type) => eqTyp(type, atom.type))) result.set(key, [atom.type, ...types]);
        return result;
      },
      term,
      vars,
    );
  for (const thm of [first, second]) {
    for (const pair of thm.tpairs) {
      add(pair[0]);
      add(pair[1]);
    }
    add(thm.prop);
  }
  let current: Envir | undefined = envir;
  for (const types of vars.values())
    for (const type of types.slice(1))
      current = current && unifyTypesEnvir(types[0], type, current);
  return current;
};

export interface ComposeFlags {
  readonly flatten: boolean;
  readonly match: boolean;
  readonly incremented: boolean;
}

export interface ComposeRule {
  readonly isElim: boolean;
  readonly rule: Thm;
  readonly subgoals: number;
}

class Compose extends Error {}

const bicomposeAux = (
  flags: ComposeFlags,
  state: Thm,
  parts: State,
  isLifted: boolean,
  compose: ComposeRule,
): Seq<Thm> => {
  const orule = compose.rule;
  const lift = countPrems(stripAllBody(parts.goal)) + (compose.isElim ? -1 : 0);
  const addth = (
    newAs: { premises: Term[] },
    unifier: { envir: Envir; tpairs: readonly Tpair[] },
    rest: Seq<Thm>,
  ): Seq<Thm> => {
    try {
      const envir = unifier.envir;
      const normt = (term: Term) => normTerm(envir, term);
      const computed = (): [readonly Tpair[], Term[], Term] => {
        if (isEmptyEnvir(envir))
          return [unifier.tpairs, [...parts.before, ...newAs.premises], parts.conclusion];
        const tpairs = unifier.tpairs.map((pair): Tpair => [normt(pair[0]), normt(pair[1])]);
        if (above(envir, state.maxidx))
          return isLifted
            ? [
                tpairs,
                [
                  ...parts.before,
                  ...newAs.premises.map((premise) => normTermSkip(envir, lift, premise)),
                ],
                parts.conclusion,
              ]
            : [tpairs, [...parts.before, ...newAs.premises.map(normt)], parts.conclusion];
        if (flags.match) throw new Compose();
        return [tpairs, [...parts.before, ...newAs.premises].map(normt), normt(parts.conclusion)];
      };
      const [tpairs, premises, conclusion] = computed();
      return consSeq(
        makeThm(
          envir.maxidx,
          unionHyps(orule.hyps, state.hyps),
          tpairs,
          listImplies(premises, conclusion),
        ),
        rest,
      );
    } catch (error) {
      if (error instanceof Compose) return rest;
      throw error;
    }
  };
  const stripped = (() => {
    try {
      return stripPrems(compose.subgoals, [], orule.prop);
    } catch (error) {
      if (error instanceof TlaIsabelleError && error.exception === "TERM")
        throw new TlaIsabelleError("THM", "bicompose: rule");
      throw error;
    }
  })();
  const reversedAs = stripped[0];
  const conclusion = stripped[1];
  const newAs = (
    premises: readonly Term[],
    index: number,
    dpairs: readonly Tpair[],
    tpairs: readonly Tpair[],
  ) => {
    const rename = isLifted ? renameBvars(dpairs, tpairs, conclusion, premises) : undefined;
    const renamed =
      rename === undefined
        ? [...premises]
        : premises.map((premise) => stripApply(rename, conclusion, premise));
    try {
      return {
        premises: flags.flatten ? renamed.map((premise) => flattenParams(index, premise)) : renamed,
      };
    } catch (error) {
      if (error instanceof TlaIsabelleError && error.exception === "TERM")
        throw new TlaIsabelleError("THM", "bicompose: 1st premise");
      throw error;
    }
  };
  const bbi = isLifted ? stripAssums2(conclusion, parts.goal) : ([conclusion, parts.goal] as const);
  const dpairs: Tpair[] = [bbi, ...orule.tpairs, ...parts.tpairs];
  const eres = (envir: Envir, premises: readonly Term[]): Seq<Thm> => {
    if (premises.length === 0) throw new TlaIsabelleError("THM", "bicompose: no premises");
    const first = premises[0];
    const rest = premises.slice(1);
    const problems = assumProblems(lift + 1, first);
    const concl = problems.abstract(problems.conclusion);
    const tryasms = (position: number): Seq<Thm> => {
      for (let index = position; index < problems.hyps.length; index += 1) {
        const asm = problems.hyps[index];
        if (!couldUnify(asm, problems.conclusion)) continue;
        const closed = problems.abstract(asm);
        const cell = unifiers(envir, [[closed, concl], ...dpairs]).pull();
        if (cell === undefined) continue;
        const prepared = newAs(rest, index + 1, [bbi, [concl, closed]], cell[0].tpairs);
        return itRightSeq(
          (unifier, tail: Seq<Thm>) => addth(prepared, unifier, tail),
          makeSeq(() => cell),
          makeSeq(() => tryasms(index + 1).pull()),
        );
      }
      return emptySeq;
    };
    return tryasms(0);
  };
  const res = (envir: Envir): Seq<Thm> => {
    const cell = unifiers(envir, dpairs).pull();
    if (cell === undefined) return emptySeq;
    const prepared = newAs([...reversedAs].reverse(), 0, [bbi], cell[0].tpairs);
    return itRightSeq(
      (unifier, tail: Seq<Thm>) => addth(prepared, unifier, tail),
      makeSeq(() => cell),
      emptySeq,
    );
  };
  const initial = emptyEnvir(Math.max(orule.maxidx, state.maxidx));
  const envir = flags.incremented ? initial : unifyVarTypes(state, orule, initial);
  if (envir === undefined) return emptySeq;
  return compose.isElim ? eres(envir, [...reversedAs].reverse()) : res(envir);
};

export const bicompose = (flags: ComposeFlags, compose: ComposeRule, index: number, state: Thm) =>
  bicomposeAux(flags, state, destState(state, index), false, compose);

export const couldBires = (hyps: readonly Term[], goal: Term, isElim: boolean, rule: Thm) => {
  if (!couldUnify(conclOf(rule), goal)) return false;
  if (!isElim) return true;
  const first = premsOf(rule)[0];
  return first !== undefined && hyps.some((hyp) => couldUnify(first, hyp));
};

export interface BiresRule {
  readonly isElim: boolean;
  readonly rule: Thm;
}

// Thm.biresolution: resolves goal index with each rule, the elimination rules also solving their
// first premise by an assumption.
export const biresolution = (
  match: boolean,
  rules: readonly BiresRule[],
  index: number,
  state: Thm,
): Seq<Thm> => {
  const parts = destState(state, index);
  const goal = stripAssumsConcl(parts.goal);
  const hyps = stripAssumsHyp(parts.goal);
  const res = (position: number): Seq<Seq<Thm>> => {
    for (let current = position; current < rules.length; current += 1) {
      const brule = rules[current];
      if (!couldBires(hyps, goal, brule.isElim, brule.rule)) continue;
      return makeSeq(() => [
        bicomposeAux({ flatten: true, match, incremented: true }, state, parts, true, {
          isElim: brule.isElim,
          rule: liftRule(parts.goal, state.maxidx, brule.rule),
          subgoals: nprems(brule.rule),
        }),
        res(current + 1),
      ]);
    }
    return emptySeq;
  };
  return flatSeq(res(0));
};

// Thm.RSN: resolution that must produce exactly one resolvent.
export const rsn = (rule: Thm, index: number, state: Thm): Thm => {
  const [results] = chopSeq(2, biresolution(false, [{ isElim: false, rule }], index, state));
  if (results.length === 0) throw new TlaIsabelleError("THM", `RSN: no unifiers ${index}`);
  if (results.length > 1) throw new TlaIsabelleError("THM", `RSN: multiple unifiers ${index}`);
  return results[0];
};

export const rs = (rule: Thm, state: Thm) => rsn(rule, 1, state);
