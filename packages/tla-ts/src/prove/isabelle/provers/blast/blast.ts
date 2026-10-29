// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Paulson's generic tableau prover with proof reconstruction. It converts subgoal 1 to
// prototerms, Skolemizing its parameters, searches for a tableau proof with the claset's rules,
// and replays the proof with Isabelle tactics, so the kernel checks every result. Blast ignores
// the claset's wrappers and the elimination rules whose conclusion is not a formula variable.

import { TlaIsabelleError } from "../../../../errors";
import { selectGoal } from "../../pure/goal";
import { destImplies, stripParams } from "../../pure/logic";
import { makeNameContext } from "../../pure/name";
import { emptySeq, makeSeq, ofCell, type Cell, type Seq } from "../../pure/seq";
import { eqThm, orElse, thenTac, type GoalTactic, type Tactic } from "../../pure/tactical";
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
  mkBlastBound,
  mkBlastVar,
  mkGoal,
  stripBlastImpConcl,
  stripBlastImpPrems,
  type BlastTerm,
  type VarRef,
} from "./term";

export type { BlastContext, BlastData } from "./state";

// Blast's depth_limit configuration option.
const DEPTH_LIMIT = 20;

// TRANS: the subgoal has no translation, such as one applying an unknown to a non-parameter.
class Trans extends Error {}

const isTermError = (error: unknown) =>
  error instanceof TlaIsabelleError && error.exception === "TERM";

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
  // The parameters the variable is applied to.
  readonly bounds: readonly number[];
}

// Translates a subgoal, Skolemizing all its parameters.
const fromSubgoal = (state: BlastState, term: Term): BlastTerm => {
  const vars: SubgoalVar[] = [];
  const tvars = new Map<string, BlastTerm>();
  const from = (level: number, current: Term): BlastTerm => {
    const [head, args] = stripComb(current);
    const apply = (blastHead: BlastTerm) =>
      listBlastComb(
        blastHead,
        args.map((arg) => from(level, arg)),
      );
    const bounds = () =>
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
        return apply({ kind: "Free", name: head.name });
      case "Bound":
        return apply(mkBlastBound(head.index));
      case "Var": {
        const key = `${head.name}.${head.index}`;
        const known = vars.find((entry) => entry.key === key);
        if (known === undefined) {
          const entry = { key, ref: { value: undefined }, bounds: bounds() };
          vars.unshift(entry);
          return mkBlastVar(entry.ref);
        }
        const argBounds = bounds();
        if (
          known.bounds.length === argBounds.length &&
          known.bounds.every((bound, index) => bound === argBounds[index])
        )
          return mkBlastVar(known.ref);
        throw new Trans(`Discrepancy among occurrences of ?${head.name}`);
      }
      case "Abs":
        if (args.length > 0) throw new Trans("argument not in normal form");
        return { kind: "Abs", name: head.name, body: from(level + 1, head.body) };
      case "App":
        throw new Trans("strip_comb");
    }
  };
  const npars = stripParams(term).length;
  let result = from(0, discardForalls(term));
  for (let index = 0; index < npars; index += 1) {
    const args = vars.filter((entry) => !entry.bounds.includes(index)).map((entry) => entry.ref);
    result = blastSubstBound({ kind: "Skolem", name: gensym(state, "T"), args }, result);
  }
  return result;
};

interface EveryTrail {
  readonly state: Thm;
  readonly rest: Seq<Thm>;
  readonly position: number;
  readonly next: EveryTrail | undefined;
}

// EVERY, as a loop: Isabelle's EVY and evyBack call each other in tail position, so backtracking
// over a long reconstruction must not grow the stack.
const everyTac =
  (tactics: readonly Tactic[]): Tactic =>
  (start) => {
    const advance = (
      initialTrail: EveryTrail | undefined,
      initialPosition: number,
      initialState: Thm | undefined,
    ): Cell<Thm> => {
      let trail = initialTrail;
      let position = initialPosition;
      let state = initialState;
      for (;;) {
        if (state === undefined) {
          if (trail === undefined) return undefined;
          const cell = trail.rest.pull();
          if (cell === undefined) trail = trail.next;
          else if (eqThm(trail.state, cell[0])) trail = { ...trail, rest: cell[1] };
          else {
            trail = { state: cell[0], rest: cell[1], position: trail.position, next: trail.next };
            position = trail.position;
            state = cell[0];
          }
        } else if (position === tactics.length) {
          const saved = trail;
          return [state, makeSeq(() => advance(saved, 0, undefined))];
        } else {
          const cell = tactics[position](state).pull();
          if (cell === undefined) state = undefined;
          else {
            trail = { state: cell[0], rest: cell[1], position: position + 1, next: trail };
            position += 1;
            state = cell[0];
          }
        }
      }
    };
    return makeSeq(() => advance(undefined, 0, start));
  };

const initBranch = (terms: readonly BlastTerm[], lim: number): Branch => ({
  pairs: [{ safe: terms.map((term) => ({ term, md: true })), unsafe: [] }],
  lits: [],
  vars: addTermsVars(terms, []),
  lim,
});

// The tableau engine and proof reconstruction on subgoal 1, with depth limit lim.
const rawBlast =
  (context: BlastContext, lim: number): Tactic =>
  (goalState) => {
    const state = initialize(context, goalState);
    const cont: Continuation = (tactics, choices) => {
      const cell = (() => {
        try {
          return everyTac([...tactics].reverse().map((tactic) => tactic(1)))(goalState).pull();
        } catch (error) {
          if (isTermError(error)) return backtrack(choices);
          throw error;
        }
      })();
      return cell === undefined ? backtrack(choices) : ofCell(cell);
    };
    try {
      const skoprem = fromSubgoal(state, destImplies(goalState.prop)[0]);
      const trueprop = context.data.trueprop;
      return prove(
        state,
        [
          initBranch(
            [
              mkGoal(stripBlastImpConcl(trueprop, skoprem)),
              ...stripBlastImpPrems(trueprop, skoprem),
            ],
            lim,
          ),
        ],
        cont,
      );
    } catch (error) {
      if (isBacktrackTo(error, undefined) || error instanceof Trans) return emptySeq;
      throw error;
    }
  };

// Blast.depth_tac: blast with a fixed depth limit.
export const blastDepthTac =
  (context: BlastContext, limit: number): GoalTactic =>
  (index) =>
    selectGoal(
      thenTac(atomizePremsTac(context.limits, context.data.atomize)(1), rawBlast(context, limit)),
    )(index);

// Search.DEEPEN (1, lim) from depth m on goal 1.
const deepen =
  (context: BlastContext, limit: number, depth: number): Tactic =>
  (state): Seq<Thm> =>
    nprems(state) < 1 || depth > limit
      ? emptySeq
      : orElse(rawBlast(context, depth), deepen(context, limit, depth + 1))(state);

// Blast.blast_tac: iterative deepening up to the depth limit.
export const blastTac =
  (context: BlastContext): GoalTactic =>
  (index) =>
    selectGoal(
      thenTac(
        atomizePremsTac(context.limits, context.data.atomize)(1),
        deepen(context, DEPTH_LIMIT, 0),
      ),
    )(index);
