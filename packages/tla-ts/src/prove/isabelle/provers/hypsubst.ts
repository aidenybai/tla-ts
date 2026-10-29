// Ported from Isabelle2025's Provers/hypsubst.ML. Copyright (c) 1986-2025 University of
// Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Substitution using an equality assumption x = t: eliminates x from the subgoal.

import { TlaIsabelleError } from "../../../errors";
import { asmRl, compIncr, revcutRl, thinRl, zeroVarIndexes } from "../pure/drule";
import { aeconv, etaContract } from "../pure/envir";
import { occs, stripAssumsConcl, stripAssumsHyp, stripParams } from "../pure/logic";
import { isBoundName } from "../pure/name";
import { emptySimpset, type SimpContext } from "../pure/raw-simplifier";
import { listOfSeq } from "../pure/seq";
import { asmLrSimpTac } from "../pure/simplifier";
import {
  determ,
  every,
  firstGoal,
  noTac,
  orElseGoal,
  repeatDetermN,
  repeatDeterm1,
  subgoal,
  thenTac,
  allTac,
  type GoalTactic,
  type Tactic,
} from "../pure/tactical";
import type { Limits } from "../pure/interrupt";
import { composeTac, ematchTac, eresolveTac, resolveTac, rotateTac } from "../pure/tactic";
import {
  abstractOver,
  binderTypes,
  bodyType,
  flagsOf,
  HAS_VAR,
  existsType,
  fastypeOf1,
  funTs,
  headOf,
  incrBoundvars,
  looseBvar1,
  maxidxOfTyp,
  mkAbs,
  mkBound,
  mkVar,
  substBounds,
  type Term,
} from "../pure/term";
import { emptyTyEnv, matchTypes, substType } from "../pure/type";
import {
  assumption,
  instantiate,
  instantiateTypes,
  liftRule,
  premOf,
  premsOf,
  rs,
  rsn,
  symmetric,
  type Thm,
} from "../pure/thm";

export interface HypsubstData {
  readonly destTrueprop: (term: Term) => Term;
  readonly destEq: (term: Term) => [Term, Term];
  readonly destImp: (term: Term) => [Term, Term];
  readonly eqReflection: Thm;
  readonly revEqReflection: Thm;
  readonly impIntr: Thm;
  readonly revMp: Thm;
  readonly subst: Thm;
  readonly sym: Thm;
  readonly thinRefl: Thm;
}

export interface HypsubstContext {
  readonly limits: Limits;
  readonly data: HypsubstData;
}

// The equality offers no variable to eliminate.
class NoMatch {}
// The subgoal has no suitable equality.
class EqVar {}

const isTermError = (error: unknown) =>
  error instanceof TlaIsabelleError && error.exception === "TERM";
const isThmError = (error: unknown) =>
  error instanceof TlaIsabelleError && error.exception === "THM";

// The simplifier turns bound variables into special free variables; any bound variable will do.
const inspectContract = (term: Term) => {
  const contracted = etaContract(term);
  return contracted.kind === "Free" && isBoundName(contracted.name) ? mkBound(0) : contracted;
};

const hasVars = (term: Term) => (flagsOf(term) & HAS_VAR) !== 0;
const hasTVars = (term: Term) => existsType((type) => maxidxOfTyp(type) >= 0, term);

// inspect_pair: true to use the equality as it is, false to reorient it first, with the variable
// to substitute.
const inspectPair = (
  isBound: boolean,
  isNoVars: boolean,
  left: Term,
  right: Term,
): [boolean, Term] => {
  if (isNoVars && (hasTVars(left) || hasTVars(right))) throw new NoMatch();
  const leftContracted = inspectContract(left);
  const rightContracted = inspectContract(right);
  if (leftContracted.kind === "Bound") {
    if (looseBvar1(right, leftContracted.index) || (isNoVars && hasVars(right)))
      throw new NoMatch();
    return [true, leftContracted];
  }
  if (rightContracted.kind === "Bound") {
    if (looseBvar1(left, rightContracted.index) || (isNoVars && hasVars(left))) throw new NoMatch();
    return [false, rightContracted];
  }
  if (leftContracted.kind === "Free") {
    if (isBound || occs(leftContracted, right) || (isNoVars && hasVars(right))) throw new NoMatch();
    return [true, leftContracted];
  }
  if (rightContracted.kind === "Free") {
    if (isBound || occs(rightContracted, left) || (isNoVars && hasVars(left))) throw new NoMatch();
    return [false, rightContracted];
  }
  throw new NoMatch();
};

// eq_var: the number of assumptions before a substitutable equality, its orientation, and whether
// it eliminates a free variable.
const eqVar = (
  data: HypsubstData,
  isBound: boolean,
  isNoVars: boolean,
  isCheckingFrees: boolean,
  goal: Term,
) => {
  const checkFree = (
    terms: readonly Term[],
    orientation: boolean,
    variable: Term,
  ): [boolean, boolean] => {
    if (variable.kind !== "Free") return [orientation, false];
    if (!isCheckingFrees || !orientation || terms.some((term) => occs(variable, term)))
      return [orientation, true];
    throw new NoMatch();
  };
  const visit = (
    count: number,
    term: Term,
    hyps: readonly Term[],
  ): [number, [boolean, boolean]] => {
    if (
      term.kind === "App" &&
      term.fun.kind === "Const" &&
      term.fun.name === "Pure.all" &&
      term.arg.kind === "Abs"
    )
      return visit(count, term.arg.body, hyps);
    if (
      term.kind === "App" &&
      term.fun.kind === "App" &&
      term.fun.fun.kind === "Const" &&
      term.fun.fun.name === "Pure.imp"
    ) {
      const premise = term.fun.arg;
      const conclusion = term.arg;
      try {
        const [left, right] = data.destEq(data.destTrueprop(premise));
        const [orientation, variable] = inspectPair(isBound, isNoVars, left, right);
        return [count, checkFree([conclusion, ...hyps], orientation, variable)];
      } catch (error) {
        if (!isTermError(error) && !(error instanceof NoMatch)) throw error;
        return visit(count + 1, conclusion, [premise, ...hyps]);
      }
    }
    throw new EqVar();
  };
  return visit(0, goal, []);
};

const withEqVar = (build: (goal: Term, index: number) => Tactic): GoalTactic =>
  subgoal((goal, index) => {
    try {
      return build(goal, index);
    } catch (error) {
      if (error instanceof EqVar || isThmError(error)) return noTac;
      throw error;
    }
  });

// mk_eqs: the equality as a rewrite rule that eliminates its variable.
const mkEqs = (data: HypsubstData, isBound: boolean, thm: Thm): Thm[] => {
  try {
    const [left, right] = data.destEq(data.destTrueprop(thm.prop));
    return inspectPair(isBound, false, left, right)[0]
      ? [rs(thm, data.eqReflection)]
      : [symmetric(rs(thm, data.eqReflection))];
  } catch (error) {
    if (isTermError(error) || error instanceof NoMatch) return [];
    throw error;
  }
};

const genHypSubstTac = (context: HypsubstContext, isBound: boolean): GoalTactic =>
  withEqVar((goal, index) => {
    const [count, [orientation, isFree]] = eqVar(context.data, isBound, true, true, goal);
    const simpContext: SimpContext = {
      limits: context.limits,
      simpset: {
        ...emptySimpset,
        mkRews: { mk: (thm) => mkEqs(context.data, isBound, thm), mkEqTrue: () => undefined },
      },
      bounds: 0,
    };
    return every([
      rotateTac(count)(index),
      asmLrSimpTac(simpContext)(index),
      !isFree
        ? eresolveTac(context.limits, [thinRl])(index)
        : orientation
          ? eresolveTac(context.limits, [context.data.revMp])(index)
          : eresolveTac(context.limits, [rs(context.data.sym, context.data.revMp)])(index),
      rotateTac(-count)(index),
      isFree ? resolveTac(context.limits, [context.data.impIntr])(index) : allTac,
    ]);
  });

const getSsubst = (data: HypsubstData) => zeroVarIndexes(rs(data.sym, data.subst));

const instSubstTac = (context: HypsubstContext, isLeft: boolean, rule: Thm): GoalTactic =>
  subgoal((goal, index) => (state) => {
    const data = context.data;
    const sides = (() => {
      try {
        const hyp = stripAssumsHyp(goal)[0];
        if (hyp === undefined) return undefined;
        const [left, right] = data.destEq(data.destTrueprop(hyp));
        return [etaContract(left), etaContract(right)] as const;
      } catch (error) {
        if (isTermError(error)) return undefined;
        throw error;
      }
    })();
    if (sides === undefined) return noTac(state);
    const [left, right] = sides;
    const params = stripParams(goal);
    const paramType = fastypeOf1(
      [...params].reverse().map((param) => param.type),
      left,
    );
    const conclusion = data.destTrueprop(stripAssumsConcl(goal));
    const lifted = liftRule(goal, state.maxidx, rule);
    const head = headOf(data.destTrueprop(stripAssumsConcl(lifted.prop)));
    const [v1, v2] = data.destEq(data.destTrueprop(stripAssumsConcl(premsOf(lifted)[0])));
    if (head.kind !== "Var") throw new TlaIsabelleError("TERM", "dest_Var");
    const binders = binderTypes(head.type);
    const paramTypes = binders.slice(0, -1);
    const lastType = binders[binders.length - 1];
    const absParams = (body: Term) =>
      params.reduceRight((result, param) => mkAbs(param.name, param.type, result), body);
    const chosen = isLeft ? left : right;
    const body =
      chosen.kind === "Bound"
        ? substBounds(
            [
              ...Array.from({ length: chosen.index }, (_, position) => mkBound(position + 1)),
              mkBound(0),
              ...Array.from({ length: params.length - chosen.index - 1 }, (_, position) =>
                mkBound(chosen.index + 2 + position),
              ),
            ],
            conclusion,
          )
        : abstractOver(chosen, incrBoundvars(1, conclusion));
    const motive = absParams(mkAbs("x", paramType, body));
    const tyenv = matchTypes(lastType, paramType, emptyTyEnv);
    if (tyenv === undefined) throw new TlaIsabelleError("TYPE", "Thm.match");
    const headV1 = headOf(v1);
    const headV2 = headOf(v2);
    if (headV1.kind !== "Var" || headV2.kind !== "Var")
      throw new TlaIsabelleError("TERM", "dest_Var");
    const instantiated = instantiate(
      [
        {
          variable: mkVar(
            head.name,
            head.index,
            funTs(
              [...paramTypes.map((type) => substType(tyenv, type)), paramType],
              substType(tyenv, bodyType(head.type)),
            ),
          ),
          term: motive,
        },
        {
          variable: mkVar(
            headV1.name,
            headV1.index,
            funTs(
              paramTypes.map((type) => substType(tyenv, type)),
              paramType,
            ),
          ),
          term: absParams(left),
        },
        {
          variable: mkVar(
            headV2.name,
            headV2.index,
            funTs(
              paramTypes.map((type) => substType(tyenv, type)),
              paramType,
            ),
          ),
          term: absParams(right),
        },
      ],
      instantiateTypes(tyenv, lifted),
    );
    return composeTac(
      context.limits,
      true,
      compIncr(instantiated, asmRl),
      premsOf(rule).length,
    )(index)(state);
  });

const varsGenHypSubstTac = (context: HypsubstContext, isBound: boolean): GoalTactic =>
  withEqVar((goal, index) => {
    const count = stripAssumsHyp(goal).length - 1;
    const [position, [orientation, isFree]] = eqVar(context.data, isBound, false, true, goal);
    const ssubst = getSsubst(context.data);
    const base = isFree ? revDupElim(ssubst) : ssubst;
    const rule = orientation ? base : rs(context.data.sym, base);
    return determ(
      every([
        repeatDetermN(position, eresolveTac(context.limits, [context.data.revMp])(index)),
        rotateTac(1)(index),
        repeatDetermN(count - position, eresolveTac(context.limits, [context.data.revMp])(index)),
        instSubstTac(context, orientation, rule)(index),
        repeatDetermN(
          count,
          thenTac(resolveTac(context.limits, [context.data.impIntr])(index), rotateTac(-1)(index)),
        ),
      ]),
    );
  });

const revDupElim = (thm: Thm) => {
  const result = listOfSeq(assumption(undefined, 2, rsn(thm, 2, revcutRl)))[0];
  if (result === undefined) throw new TlaIsabelleError("THM", "rev_dup_elim");
  return result;
};

// hyp_subst_tac with hypsubst_thin off, its default: substitutes for free or bound variables and
// drops equalities on bound variables.
export const hypSubstTac =
  (context: HypsubstContext): GoalTactic =>
  (index) =>
    repeatDeterm1(
      firstGoal([
        ematchTac(context.limits, [context.data.thinRefl]),
        genHypSubstTac(context, false),
        varsGenHypSubstTac(context, false),
      ])(index),
    );

export const boundHypSubstTac =
  (context: HypsubstContext): GoalTactic =>
  (index) =>
    repeatDeterm1(
      orElseGoal(genHypSubstTac(context, true), varsGenHypSubstTac(context, true))(index),
    );

const reverseNTac = (context: HypsubstContext, count: number, index: number): Tactic =>
  count === 0
    ? allTac
    : count === 1
      ? rotateTac(-1)(index)
      : thenTac(
          repeatDetermN(
            count,
            thenTac(rotateTac(-1)(index), eresolveTac(context.limits, [context.data.revMp])(index)),
          ),
          repeatDetermN(
            count,
            thenTac(
              resolveTac(context.limits, [context.data.impIntr])(index),
              rotateTac(-1)(index),
            ),
          ),
        );

// all_imp_intr_tac: reintroduces the hypotheses, leaving the changed ones at the end.
const allImpIntrTac = (context: HypsubstContext, hyps: readonly Term[], index: number): Tactic => {
  const imptac =
    (count: number, remaining: readonly Term[]): Tactic =>
    (state) => {
      if (remaining.length === 0) return reverseNTac(context, count, index)(state);
      const [hyp] = context.data.destImp(
        context.data.destTrueprop(stripAssumsConcl(premOf(state, index))),
      );
      const isSame = aeconv(remaining[0], hyp);
      const tactic = isSame
        ? thenTac(resolveTac(context.limits, [context.data.impIntr])(index), rotateTac(-1)(index))
        : resolveTac(context.limits, [context.data.impIntr])(index);
      const cell = tactic(state).pull();
      return cell === undefined
        ? allTac(state)
        : imptac(isSame ? count : count + 1, remaining.slice(1))(cell[0]);
    };
  return imptac(0, [...hyps].reverse());
};

// blast_hyp_subst_tac: the version for blast, which moves the hypotheses the substitution changes
// to the front.
export const blastHypSubstTac = (context: HypsubstContext): GoalTactic =>
  withEqVar((goal, index) => {
    const [count, [orientation]] = eqVar(context.data, false, false, false, goal);
    const allHyps = stripAssumsHyp(goal).map(context.data.destTrueprop);
    const hyps = [...allHyps.slice(0, count), ...allHyps.slice(count + 1)];
    return determ(
      every([
        repeatDetermN(count, eresolveTac(context.limits, [context.data.revMp])(index)),
        rotateTac(1)(index),
        repeatDetermN(
          hyps.length - count,
          eresolveTac(context.limits, [context.data.revMp])(index),
        ),
        instSubstTac(
          context,
          orientation,
          orientation ? getSsubst(context.data) : context.data.subst,
        )(index),
        allImpIntrTac(context, hyps, index),
      ]),
    );
  });
