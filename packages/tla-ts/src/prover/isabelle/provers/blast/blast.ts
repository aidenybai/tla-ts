// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { isIsabelleError, TlaIsabelleError } from "../../../../errors";
import { selectGoal } from "../../pure/goal";
import { destImplies, stripParams } from "../../pure/logic";
import { makeNameContext } from "../../pure/name";
import { emptySeq, ofCell, type Seq } from "../../pure/seq";
import { every, orElse, thenTac, type GoalTactic, type Tactic } from "../../pure/tactical";
import { addFreeNames, stripComb, type Term } from "../../pure/term";
import { nprems, type Thm } from "../../pure/thm";
import { atomizePremsTac } from "../../pure/object-logic";
import { prove, type Continuation } from "./prove";
import {
  backtrack,
  gensym,
  isBacktrackTo,
  type BlastContext,
  type BlastState,
  type Branch,
} from "./state";
import {
  FALSE_NAME,
  GOAL_NAME,
  addTermsVars,
  blastSubstBound,
  fromConst,
  listBlastComb,
  mkBlastAbs,
  mkBlastBound,
  mkBlastFree,
  mkBlastSkolem,
  mkBlastVar,
  splitGoalPrems,
  type BlastTerm,
  type VarEntry,
  type VarRef,
} from "./term";

const DEPTH_LIMIT = 20;

class Trans extends Error {}

const initialize = (context: BlastContext, state: Thm): BlastState => {
  for (const name of [GOAL_NAME, FALSE_NAME])
    if (context.consts.has(name))
      throw new TlaIsabelleError("ERROR", `blast: theory contains reserved constant "${name}"`);
  return { context, names: new Map(makeNameContext(addFreeNames(state.prop, []))), trail: [] };
};

const discardForalls = (term: Term): Term =>
  term.kind === "App" &&
  term.fun.kind === "Const" &&
  term.fun.name === "Pure.all" &&
  term.arg.kind === "Abs"
    ? discardForalls(term.arg.body)
    : term;

interface SubgoalVar {
  readonly key: string;
  readonly ref: VarRef;
  readonly bounds: readonly number[];
}

const fromSubgoal = (state: BlastState, term: Term): BlastTerm => {
  const vars: SubgoalVar[] = [];
  const tvars: VarEntry[] = [];
  const convert = (level: number, current: Term): BlastTerm => {
    const [head, args] = stripComb(current);
    const apply = (blastHead: BlastTerm) =>
      listBlastComb(
        blastHead,
        args.map((arg) => convert(level, arg)),
      );
    const getBounds = () =>
      args.map((arg) => {
        if (arg.kind !== "Bound")
          throw new Trans("Function unknown's argument not a bound variable");
        if (arg.index < level) throw new Trans("Function unknown's argument not a parameter");
        return arg.index - level;
      });
    switch (head.kind) {
      case "Const":
        return apply(fromConst(state.context.consts, tvars, head.name, head.type));
      case "Free":
        return apply(mkBlastFree(head.name));
      case "Bound":
        return apply(mkBlastBound(head.index));
      case "Var": {
        const key = `${head.name}.${head.index}`;
        const known = vars.find((entry) => entry.key === key);
        if (known === undefined) {
          const entry = { key, ref: { value: undefined }, bounds: getBounds() };
          vars.unshift(entry);
          return mkBlastVar(entry.ref);
        }
        const argBounds = getBounds();
        if (
          known.bounds.length === argBounds.length &&
          known.bounds.every((bound, index) => bound === argBounds[index])
        )
          return mkBlastVar(known.ref);
        throw new Trans(`Discrepancy among occurrences of ?${head.name}`);
      }
      case "Abs":
        if (args.length > 0) throw new Trans("argument not in normal form");
        return mkBlastAbs(head.name, convert(level + 1, head.body));
      case "App":
        throw new Trans("strip_comb");
    }
  };
  const npars = stripParams(term).length;
  let result = convert(0, discardForalls(term));
  for (let index = 0; index < npars; index += 1) {
    const args = vars.filter((entry) => !entry.bounds.includes(index)).map((entry) => entry.ref);
    result = blastSubstBound(mkBlastSkolem(gensym(state, "T"), args), result);
  }
  return result;
};

const initBranch = (terms: readonly BlastTerm[], lim: number): Branch => ({
  pairs: [{ safe: terms.map((term) => ({ term, md: true })), unsafe: [] }],
  lits: [],
  vars: addTermsVars(terms, []),
  lim,
});

const rawBlast =
  (context: BlastContext, lim: number): Tactic =>
  (goalState) => {
    const state = initialize(context, goalState);
    const cont: Continuation = (tactics, choices) => {
      const cell = (() => {
        try {
          const replay: Tactic[] = [];
          for (let current = tactics; current !== undefined; current = current.tail)
            replay.push(current.head(1));
          return every(replay.reverse())(goalState).pull();
        } catch (error) {
          if (isIsabelleError(error, "TERM")) return backtrack(choices);
          throw error;
        }
      })();
      return cell === undefined ? backtrack(choices) : ofCell(cell);
    };
    try {
      const skoprem = fromSubgoal(state, destImplies(goalState.prop)[0]);
      return prove(state, [initBranch(splitGoalPrems(context.data.trueprop, skoprem), lim)], cont);
    } catch (error) {
      if (isBacktrackTo(error, undefined) || error instanceof Trans) return emptySeq;
      throw error;
    }
  };

export const blastDepthTac =
  (context: BlastContext, limit: number): GoalTactic =>
  (index) =>
    selectGoal(
      thenTac(atomizePremsTac(context.limits, context.data.atomize)(1), rawBlast(context, limit)),
    )(index);

const deepen =
  (context: BlastContext, limit: number, depth: number): Tactic =>
  (state): Seq<Thm> =>
    nprems(state) < 1 || depth > limit
      ? emptySeq
      : orElse(rawBlast(context, depth), deepen(context, limit, depth + 1))(state);

export const blastTac =
  (context: BlastContext): GoalTactic =>
  (index) =>
    selectGoal(
      thenTac(
        atomizePremsTac(context.limits, context.data.atomize)(1),
        deepen(context, DEPTH_LIMIT, 0),
      ),
    )(index);
