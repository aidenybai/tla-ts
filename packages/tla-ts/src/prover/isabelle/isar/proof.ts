// Ported from Isabelle2025's Pure/Isar/proof.ML, with the parts of Pure/goal.ML and
// Pure/Isar/method.ML it uses. Copyright (c) 1986-2025 University of Cambridge, Technische
// Universitaet Muenchen, and contributors, see LICENSE.
// Goal.conjunction_tac, which METHOD runs first, is left out: a goal here is one proposition.

import { TlaIsabelleError } from "../../../errors";
import { compIncr, forallIntrVars, protectD, protectI, revcutRl } from "../pure/drule";
import { conclude } from "../pure/goal";
import type { Limits } from "../pure/interrupt";
import { isProtected, stripAssumsConcl } from "../pure/logic";
import {
  appendSeq,
  emptySeq,
  filterSeq,
  mapSeq,
  mapsSeq,
  seqHead,
  singleSeq,
  type Seq,
} from "../pure/seq";
import { normHhf } from "../pure/simplifier";
import { eresolveTac, resolveTac } from "../pure/tactic";
import { every, subgoal, thenGoal, type GoalTactic, type Tactic } from "../pure/tactical";
import { aconv, mkVar, propT, type Term } from "../pure/term";
import { bicompose, incrIndexesThm, instantiate, nprems, type Thm } from "../pure/thm";
import {
  addAssumptions,
  assumptionsOf,
  augment,
  bindTerm,
  declareTerm,
  exportThm,
  putFacts,
  readTerms,
  simultMatches,
  type IsarContext,
  type ReadMode,
} from "./context";
import { evaluate, finishTac, normHhfTac, type ProofContext } from "./method";
import type { MethodText, StatementPart } from "./theory";

// Goal.init.
export const initGoal = (prop: Term) =>
  instantiate([{ variable: mkVar("A", 0, propT), term: prop }], protectI);

export const insertTac = (limits: Limits, facts: readonly Thm[], index: number): Tactic =>
  every(facts.map((fact) => resolveTac(limits, [compIncr(forallIntrVars(fact), revcutRl)])(index)));

type Mode = "forward" | "chain" | "backward";

type AfterQed = (resultContext: IsarContext, results: readonly Thm[], state: State) => State;

interface Goal {
  readonly isGlobal: boolean;
  readonly props: readonly Term[];
  readonly using: readonly Thm[];
  readonly goal: Thm;
  readonly afterQed: AfterQed;
}

interface Node {
  readonly context: IsarContext;
  readonly facts: readonly Thm[] | undefined;
  readonly mode: Mode;
  readonly goal: Goal | undefined;
}

// The stack of blocks, innermost last.
export type State = readonly Node[];

const error = (message: string) => new TlaIsabelleError("ERROR", message);

const top = (state: State) => state[state.length - 1];

const mapTop = (state: State, map: (node: Node) => Node): State => [
  ...state.slice(0, -1),
  map(top(state)),
];

export const contextOf = (state: State) => top(state).context;

const mapContext = (state: State, map: (context: IsarContext) => IsarContext) =>
  mapTop(state, (node) => ({ ...node, context: map(node.context) }));

const openBlock = (state: State): State => [...state, top(state)];

const closeBlock = (state: State): State => {
  if (state.length <= 1) throw error("Unbalanced block parentheses");
  return state.slice(0, -1);
};

const putFactsOf = (state: State, facts: readonly Thm[] | undefined): State =>
  mapTop(state, (node) => ({
    ...node,
    facts,
    context:
      facts === undefined
        ? {
            ...node.context,
            facts: new Map([...node.context.facts].filter((entry) => entry[0] !== "this")),
          }
        : putFacts(node.context, "this", facts),
  }));

const theFacts = (state: State) => {
  const facts = top(state).facts;
  if (facts === undefined) throw error("No current facts available");
  return facts;
};

const assertMode = (state: State, modes: readonly Mode[]) => {
  if (!modes.includes(top(state).mode))
    throw error(`Illegal application of proof command in ${top(state).mode} mode`);
  return state;
};

const putMode = (state: State, mode: Mode) => mapTop(state, (node) => ({ ...node, mode }));

const findGoal = (state: State): [number, IsarContext, Goal] => {
  for (let index = state.length - 1; index >= 0; index -= 1) {
    const goal = state[index].goal;
    if (goal !== undefined) return [index, state[index].context, goal];
  }
  throw error("No proof goal");
};

const mapGoal = (state: State, map: (context: IsarContext, goal: Goal) => [IsarContext, Goal]) => {
  const [index, context, goal] = findGoal(state);
  const [newContext, newGoal] = map(context, goal);
  return state.map((node, position) =>
    position === index ? { ...node, context: newContext, goal: newGoal } : node,
  );
};

const provideGoal = (state: State, thm: Thm) =>
  mapGoal(state, (context, goal) => [context, { ...goal, goal: thm }]);

const usingFacts = (state: State, using: readonly Thm[]) =>
  mapGoal(state, (context, goal) => [context, { ...goal, using }]);

export interface Runtime {
  readonly tactics: ProofContext;
}

// Proof.refine: the method applies to the goal with its facts, in the given context.
const refine = (runtime: Runtime, state: State, text: MethodText): Seq<State> => {
  const [, , goal] = findGoal(state);
  const method = evaluate(runtime.tactics, contextOf(state), text);
  return mapSeq((thm: Thm) => provideGoal(state, thm), method(goal.using)(goal.goal));
};

export const proof = (runtime: Runtime, state: State, text: MethodText | undefined): Seq<State> => {
  assertMode(state, ["backward"]);
  if (text === undefined) throw error("Unsupported default proof method");
  return mapSeq(
    (result: State) =>
      mapTop(openBlock(putMode(usingFacts(result, []), "forward")), (node) => ({
        ...node,
        goal: undefined,
      })),
    refine(runtime, state, text),
  );
};

const theResult = <Item>(seq: Seq<Item>, message: string): Item => {
  const result = seqHead(seq);
  if (result === undefined) throw error(message);
  return result;
};

// Proof.end_proof: the closing method, then the goal must have no subgoals.
const endProof = (
  runtime: Runtime,
  state: State,
  text: MethodText | undefined,
  isImmediate: boolean,
): Seq<State> => {
  assertMode(state, ["forward"]);
  const closed = usingFacts(closeBlock(state), []);
  if (top(closed).goal === undefined) throw error("No goal in this block");
  const finish: Seq<State> = text === undefined ? singleSeq(closed) : refine(runtime, closed, text);
  return filterSeq(
    (result: State) => nprems(findGoal(result)[2].goal) === 0,
    mapsSeq(
      (result: State) =>
        mapSeq(
          (thm: Thm) => provideGoal(result, thm),
          finishTac(runtime.tactics.limits, isImmediate)(findGoal(result)[2].goal),
        ),
      finish,
    ),
  );
};

// Proof.conclude_goal.
const concludeGoal = (context: IsarContext, goal: Goal): Thm => {
  if (nprems(goal.goal) !== 0) throw error("Failed to finish proof");
  const thm = conclude(goal.goal);
  if (thm.tpairs.length > 0) throw error("Unsupported flex-flex constraints in result");
  const assumptions = assumptionsOf(context);
  if (!thm.hyps.every((hyp) => assumptions.some((assumption) => aconv(hyp, assumption))))
    throw error("Undeclared hyps");
  if (!aconv(thm.prop, goal.props[0])) throw error("Proved a different theorem");
  return thm;
};

// Proof.generic_qed and its after_qed.
const genericQed = (state: State): State => {
  const [, context, goal] = findGoal(state);
  if (top(state).goal === undefined) throw error("No current goal");
  return goal.afterQed(context, [concludeGoal(context, goal)], closeBlock(state));
};

export const qed = (runtime: Runtime, state: State, text: MethodText | undefined): State =>
  genericQed(theResult(endProof(runtime, state, text, true), "Failed to finish proof"));

// Proof.terminal_proof, as by: the first initial result that the terminal method finishes.
export const terminalProof = (
  runtime: Runtime,
  state: State,
  initial: MethodText,
  terminal: MethodText | undefined,
): State =>
  genericQed(
    theResult(
      mapsSeq(
        (result: State) => endProof(runtime, result, terminal, true),
        proof(runtime, state, initial),
      ),
      "Failed to finish proof",
    ),
  );

// Proof.generic_goal: a new block whose goal is the proposition.
const genericGoal = (
  state: State,
  goalContext: IsarContext,
  props: readonly Term[],
  isGlobal: boolean,
  afterQed: AfterQed,
): State => {
  if (props.length !== 1) throw error("Unsupported goal of several propositions");
  const isChaining = top(state).mode === "chain";
  assertMode(state, ["forward", "chain"]);
  const opened = putMode(openBlock(putMode(state, "forward")), "backward");
  const goalState = mapTop(opened, (node) => ({
    ...node,
    context: { ...goalContext, isBody: true },
    goal: { isGlobal, props, using: [], goal: initGoal(props[0]), afterQed },
  }));
  return putFactsOf(isChaining ? usingFacts(goalState, theFacts(state)) : goalState, undefined);
};

interface Statement {
  readonly props: readonly (readonly Term[])[];
  readonly context: IsarContext;
  readonly binds: readonly [string, number, Term][];
}

// Proof_Context.read_propp: the propositions together, then their patterns, which bind.
export const readStatement = (
  context: IsarContext,
  parts: readonly StatementPart[],
  mode: ReadMode,
): Statement => {
  const flat = parts.flatMap((part) => part.props);
  const props = readTerms(
    context,
    flat.map((propp) => ({ text: propp.text })),
    mode,
  );
  const propsContext = props.reduce(declareTerm, context);
  const binds = flat.flatMap((propp, index) =>
    propp.patterns.length === 0
      ? []
      : simultMatches(
          propsContext,
          props[index],
          readTerms(
            propsContext,
            propp.patterns.map((pattern) => ({ text: pattern })),
            "pattern",
          ),
        ),
  );
  let offset = 0;
  const grouped = parts.map((part) => {
    const group = props.slice(offset, offset + part.props.length);
    offset += part.props.length;
    return group;
  });
  return {
    props: grouped,
    context: binds.reduce((result, bind) => bindTerm(result, ...bind), propsContext),
    binds,
  };
};

const bindAll = (context: IsarContext, binds: readonly [string, number, Term][]) =>
  binds.reduce((result, bind) => bindTerm(result, ...bind), context);

// Proof.local_results: the results become named facts and the current facts.
const localResults = (
  state: State,
  parts: readonly StatementPart[],
  results: readonly (readonly Thm[])[],
): State => {
  const named = parts.reduce(
    (context, part, index) =>
      part.name === undefined ? context : putFacts(context, part.name, results[index]),
    contextOf(state),
  );
  return putFactsOf(
    mapContext(state, () => named),
    results.flat(),
  );
};

// Proof.local_goal for have and show, whose statements are propositions only.
const localGoal = (
  state: State,
  parts: readonly StatementPart[],
  afterQed: (resultContext: IsarContext, results: readonly Thm[], state: State) => State,
): State => {
  const statement = readStatement(contextOf(state), parts, "default");
  const props = statement.props.flat();
  const goalContext = props.reduce(augment, statement.context);
  return genericGoal(state, goalContext, props, false, (resultContext, results, outer) => {
    const bound = mapContext(outer, (context) => bindAll(context, statement.binds));
    const exported = results.map((result) =>
      exportThm(resultContext, contextOf(bound), false, result),
    );
    let offset = 0;
    const grouped = statement.props.map((group) => {
      const slice = exported.slice(offset, offset + group.length);
      offset += group.length;
      return slice;
    });
    return afterQed(resultContext, results, localResults(bound, parts, grouped));
  });
};

// Proof.refine_goals: the result, exported as a rule, refines some pending goal.
const finishGoalTac = (limits: Limits, count: number): GoalTactic =>
  count === 0
    ? () => (state) => singleSeq(state)
    : thenGoal(
        normHhfTac(limits),
        subgoal((goal, index) =>
          isProtected(stripAssumsConcl(goal))
            ? (state: Thm) =>
                mapsSeq(
                  finishGoalTac(limits, count - 1)(index),
                  eresolveTac(limits, [protectI])(index)(state),
                )
            : finishGoalTac(limits, count - 1)(index + 1),
        ),
      );

const goalTac = (limits: Limits, rule: Thm): GoalTactic =>
  thenGoal(
    thenGoal(normHhfTac(limits), resolveTac(limits, [rule])),
    finishGoalTac(limits, nprems(rule)),
  );

const findGoalTac =
  (tactic: GoalTactic): Tactic =>
  (state) => {
    const find = (index: number): Seq<Thm> =>
      index > nprems(state) ? emptySeq : appendSeq(tactic(index)(state), find(index + 1));
    return find(1);
  };

const protectPrems = (thm: Thm): Thm => {
  let result = thm;
  for (let index = nprems(thm); index >= 1; index -= 1) {
    const protectedResult = seqHead(
      bicompose(
        undefined,
        { flatten: false, match: false, incremented: true },
        { isElim: false, rule: incrIndexesThm(result.maxidx + 1, protectD), subgoals: 1 },
        index,
        result,
      ),
    );
    if (protectedResult === undefined) throw error("protect_prems");
    result = protectedResult;
  }
  return result;
};

const refineGoals = (
  runtime: Runtime,
  resultContext: IsarContext,
  results: readonly Thm[],
  state: State,
): State => {
  const [, goalContext, goal] = findGoal(state);
  const limits = runtime.tactics.limits;
  const rules = results.map((result) =>
    exportThm(resultContext, goalContext, true, protectPrems(normHhf(limits, result))),
  );
  const refined = rules.reduce<Seq<Thm>>(
    (states, rule) => mapsSeq(findGoalTac(goalTac(limits, rule)), states),
    singleSeq(goal.goal),
  );
  return provideGoal(state, theResult(refined, "Failed to refine any pending goal"));
};

export const have = (state: State, parts: readonly StatementPart[]) =>
  localGoal(state, parts, (_context, _results, result) => result);

export const show = (runtime: Runtime, state: State, parts: readonly StatementPart[]) =>
  localGoal(state, parts, (resultContext, results, result) =>
    refineGoals(runtime, resultContext, results, result),
  );

// Proof.chain: the current facts feed the next goal.
export const chain = (state: State) =>
  putMode(putFactsOf(assertMode(state, ["forward"]), theFacts(state)), "chain");

export const assume = (state: State, parts: readonly StatementPart[]): State => {
  assertMode(state, ["forward"]);
  const statement = readStatement(contextOf(state), parts, "default");
  const [thms, context] = addAssumptions(
    bindAll(contextOf(state), statement.binds),
    false,
    statement.props.flat(),
  );
  let offset = 0;
  const grouped = statement.props.map((group) => {
    const slice = thms.slice(offset, offset + group.length);
    offset += group.length;
    return slice;
  });
  const named = parts.reduce(
    (current, part, index) =>
      part.name === undefined ? current : putFacts(current, part.name, grouped[index]),
    statement.props.flat().reduce(declareTerm, context),
  );
  return putFactsOf(
    mapContext(state, () => named),
    thms,
  );
};

export const next = (state: State): State =>
  putFactsOf(
    mapTop(openBlock(closeBlock(assertMode(state, ["forward"]))), (node) => ({
      ...node,
      goal: undefined,
    })),
    undefined,
  );

export const using = (state: State, facts: readonly Thm[]): State =>
  usingFacts(assertMode(state, ["backward"]), [...findGoal(state)[2].using, ...facts]);

// Proof.from_thmss and with_thmss.
export const from = (state: State, facts: readonly Thm[], isWith: boolean): State =>
  chain(
    putFactsOf(assertMode(state, ["forward"]), isWith ? [...facts, ...theFacts(state)] : facts),
  );

// Proof.theorem: the lemma's goal, whose result the after_qed stores.
export const theorem = (
  context: IsarContext,
  props: readonly Term[],
  afterQed: (resultContext: IsarContext, results: readonly Thm[]) => void,
): State =>
  genericGoal(
    [{ context, facts: undefined, mode: "forward", goal: undefined }],
    context,
    props,
    true,
    (resultContext, results, state) => {
      afterQed(resultContext, results);
      return state;
    },
  );

export const isFinished = (state: State) => state.length === 1;
