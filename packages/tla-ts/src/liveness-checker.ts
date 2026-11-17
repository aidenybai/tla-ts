import { TlaEvaluationError } from "./errors";
import { isExpressionImpure } from "./dependencies";
import { hasRepeatedEffects, type Environment } from "./evaluate";
import {
  evaluateOnLasso,
  getInterpretedAtoms,
  toLiveExpression,
  type LiveAtoms,
  type ScopedExpression,
  type TemporalProperty,
} from "./liveness";
import {
  createJunction,
  createUnary,
  getSolutions,
  getTermKey,
  isFulfilling,
  type LiveAction,
  type LiveEnabled,
  type LiveExpression,
  type LiveState,
  type Solution,
  type Tableau,
} from "./tableau";
import { findTraceLasso, type TraceLasso } from "./trace-liveness";
import { isSameValue, type Value } from "./values";

export interface LiveSuccessor<State = Value[]> {
  index: number;
  state: State;
}

export interface Lasso {
  prefix: number[];
  cycle: number[];
  isCycleConstrained: boolean;
}

export interface LivenessChecker {
  branches: number;
  solutions: Solution[];
  addInitialState: (index: number, state: Value[], tracing?: Environment) => void;
  addState: (
    index: number,
    state: Value[],
    successors: LiveSuccessor[],
    tracing?: Environment,
  ) => number[] | undefined;
  storeState: (pending: number, index: number) => void;
  getStateCounts: () => number[];
  findViolation: () => Lasso | undefined;
  getViolatedProperties: (path: Value[][], cycleStart: number) => string[];
}

export interface TraceViolation extends TraceLasso {
  properties: string[];
}

export interface LivenessChecks {
  solutions: Solution[];
  findTraceViolation: (trace: Value[][], fingerprints: bigint[]) => TraceViolation | undefined;
}

export interface LiveGraph<State> {
  branches: number;
  addInitialState: (index: number, state: State) => void;
  // The path to an accepting node the state reaches, if any.
  addState: (
    index: number,
    state: State,
    successors: LiveSuccessor<State>[],
    isRerun?: boolean,
  ) => number[] | undefined;
  storeState: (pending: number, index: number) => void;
  getStateCounts: () => number[];
  findViolation: () => Lasso | undefined;
}

export interface SearchGraph<State> {
  getFingerprint: (successor: LiveSuccessor<State>) => number;
  forEachActionSuccessors: (
    index: number,
    state: State,
    onSuccessors: (successors: LiveSuccessor<State>[]) => void,
  ) => void;
}

export interface LiveEvaluation<State> {
  atoms: LiveAtoms<State>;
  // Whether a check's result for a state holds for every step from it.
  isShared: boolean;
  isSame: (left: State, right: State) => boolean;
  // Evaluates the checks of a state the search found from the state at source.
  evaluateFrom: <Result>(source: number | undefined, evaluate: () => Result) => Result;
}

interface Pool<Data extends Int32Array | Uint8Array> {
  data: Data;
  length: number;
  create: (length: number) => Data;
}

// A check reads and fills the state atoms of a state in its row, which starts at offset.
type Check<State> = (
  state: State,
  row: Int8Array,
  offset: number,
  next: State | undefined,
) => boolean;

interface BehaviorChecks<State> {
  states: Check<State>[];
  actions: Check<State>[];
  // The state predicates of each tableau node, or, where its checks share results and it has only
  // state atoms and their negations, each atom's id * 2 plus 1 if it must hold.
  nodes: (Check<State>[] | Int32Array)[];
}

interface BehaviorGraph<State> {
  solution: Solution;
  checks: BehaviorChecks<State>;
  actionIds: Int32Array;
  nodeStates: number[];
  nodeTableaux: number[];
  edgeStarts: number[];
  edgeCounts: number[];
  edgeTargets: Pool<Int32Array>;
  edgeActions: Pool<Uint8Array>;
  stateResults: Pool<Uint8Array>;
  initial: number[];
  firstNodes: Pool<Int32Array>;
  lastNodes: Pool<Int32Array>;
  nextSiblings: number[];
  nodeIds: NodeTable;
  isDone: boolean[];
  stateCount: number;
  errorNode: number | undefined;
}

const containsAlways = (expression: LiveExpression): boolean => {
  switch (expression.kind) {
    case "Always":
      return true;
    case "Eventually":
    case "Not":
    case "Next":
      return containsAlways(expression.body);
    case "And":
    case "Or":
      return expression.operands.some(containsAlways);
    default:
      return false;
  }
};

const isEmptyModel = (model: Solution["models"][number]) =>
  model.eventuallyAlways.length === 0 &&
  model.infinitelyOftenStates.length === 0 &&
  model.infinitelyOftenActions.length === 0;

const isCycleConstrained = (solution: Solution) =>
  solution.promises.some((promise) => containsAlways(promise.body)) ||
  solution.models.some((model) => !isEmptyModel(model));

const isSameState = (left: Value[], right: Value[]) =>
  left.every((value, position) => isSameValue(value, right[position]));

const removeRepeats = (path: number[]) =>
  path.filter((node, position) => position === 0 || path[position - 1] !== node);

const createPool = <Data extends Int32Array | Uint8Array>(
  create: (length: number) => Data,
): Pool<Data> => ({ data: create(1024), length: 0, create });

const writeToPool = <Data extends Int32Array | Uint8Array>(
  pool: Pool<Data>,
  offset: number,
  values: ArrayLike<number>,
  start = 0,
  length = values.length - start,
) => {
  const end = offset + length;
  if (end > pool.data.length) {
    const data = pool.create(Math.max(2 * pool.data.length, end));
    data.set(pool.data);
    pool.data = data;
  }
  for (let position = 0; position < length; position++) {
    pool.data[offset + position] = values[start + position];
  }
  pool.length = Math.max(pool.length, end);
};

const NO_NODE = -1;

// A Map holds at most 2^24 entries, so an open-addressing table of (state plus one, tableau node, node) triples finds each node.
interface NodeTable {
  slots: Int32Array;
  size: number;
  shift: number;
}

const getNodeSlot = (table: NodeTable, state: number, tableauNode: number) => {
  const mask = table.slots.length / 3 - 1;
  const hash = Math.imul(Math.imul(state, 0x9e3779b1) ^ tableauNode, 0x85ebca6b) >>> table.shift;
  for (let index = hash; ; index = (index + 1) & mask) {
    const slot = index * 3;
    const stored = table.slots[slot];
    if (stored === 0 || (stored === state + 1 && table.slots[slot + 1] === tableauNode)) {
      return slot;
    }
  }
};

const createNodes = (length: number) => new Int32Array(length).fill(NO_NODE);

const UNWRITTEN = -1;

const isWritten = <State>(behavior: BehaviorGraph<State>, node: number) =>
  (behavior.edgeStarts[node] ?? UNWRITTEN) !== UNWRITTEN;

const getNodeSuccessors = <State>(behavior: BehaviorGraph<State>, node: number) => {
  const start = behavior.edgeStarts[node];
  return behavior.edgeTargets.data.subarray(start, start + behavior.edgeCounts[node]);
};

const getStateResult = <State>(behavior: BehaviorGraph<State>, node: number, position: number) =>
  behavior.stateResults.data[
    behavior.nodeStates[node] * behavior.solution.stateChecks.length + position
  ] === 1;

const pushNode = <State>(behavior: BehaviorGraph<State>, state: number, tableauNode: number) => {
  behavior.nodeStates.push(state);
  behavior.nodeTableaux.push(tableauNode);
  behavior.edgeStarts.push(UNWRITTEN);
  behavior.edgeCounts.push(0);
  behavior.nextSiblings.push(NO_NODE);
  return behavior.nodeStates.length - 1;
};

const getStateNodes = <State>(behavior: BehaviorGraph<State>, state: number) => {
  const nodes: number[] = [];
  for (
    let node = behavior.firstNodes.data[state] ?? NO_NODE;
    node !== NO_NODE;
    node = behavior.nextSiblings[node]
  ) {
    nodes.push(node);
  }
  return nodes;
};

const SUCCESSOR_CAPACITY = 16;

const SCC_MARKER = -42;

const UNVISITED = -1;

const MAXIMUM_LINK = Number.MAX_SAFE_INTEGER;

const getLiveFormula = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
) => {
  const fairness = temporals.map((item) =>
    toLiveExpression(item.expression, item.scope, environment),
  );
  const checks = properties.map((property) =>
    toLiveExpression(property.expression, property.scope, environment),
  );
  const negations = checks.map((check) => createUnary("Not", check));
  const violation = negations.length === 1 ? negations[0] : createJunction("Or", negations);
  const formula =
    fairness.length === 0 ? violation : createJunction("And", [...fairness, violation]);
  return { formula, checks };
};

export type LiveAtom = LiveState | LiveEnabled | LiveAction;

const getAtomExpressions = (atom: LiveAtom): ScopedExpression[] => {
  switch (atom.kind) {
    case "State":
      return [atom];
    case "Enabled":
      return [{ expression: atom.step, scope: atom.scope }];
    case "Action":
      return [atom.expression, atom.subscript].flatMap((inner) =>
        inner ? [{ expression: inner, scope: atom.scope }] : [],
      );
  }
};

const collectAtoms = (expression: LiveExpression, atoms: Set<LiveAtom>) => {
  switch (expression.kind) {
    case "Boolean":
      return;
    case "State":
    case "Enabled":
    case "Action":
      atoms.add(expression);
      return;
    case "And":
    case "Or":
      expression.operands.forEach((operand) => collectAtoms(operand, atoms));
      return;
    default:
      collectAtoms(expression.body, atoms);
  }
};

// The atoms the checks of the solutions evaluate.
export const getLiveAtoms = (solutions: Solution[]) => {
  const atoms = new Set<LiveAtom>();
  for (const solution of solutions) {
    [
      ...solution.stateChecks,
      ...solution.actionChecks,
      ...(solution.tableau?.nodes.flatMap((node) => node.statePredicates) ?? []),
    ].forEach((check) => collectAtoms(check, atoms));
  }
  return [...atoms];
};

// The expressions the checks of the solutions evaluate.
export const getLiveExpressions = (solutions: Solution[]) =>
  getLiveAtoms(solutions).flatMap((atom) =>
    getAtomExpressions(atom).map((item) => item.expression),
  );

// A check evaluated once for a state shows what TLC shows when no check repeats an effect. A
// definition TLC evaluates as it starts repeats nothing, but a scope can bind any definition.
const isSharingResults = (formula: LiveExpression, environment: Environment) => {
  const formulaAtoms = new Set<LiveAtom>();
  collectAtoms(formula, formulaAtoms);
  const checked = [...formulaAtoms].flatMap(getAtomExpressions);
  return checked.every((item) => item.scope === undefined)
    ? !isExpressionImpure(
        checked.map((item) => item.expression),
        environment,
        "repeated",
      )
    : !hasRepeatedEffects(environment);
};

const getViolatedProperties = (
  properties: TemporalProperty[],
  checks: LiveExpression[],
  path: Value[][],
  cycleStart: number,
  environment: Environment,
) => [
  ...new Set(
    properties
      .filter(
        (_property, position) =>
          !evaluateOnLasso(checks[position], path, cycleStart, 0, environment),
      )
      .map((property) => property.name),
  ),
];

export const createLivenessChecks = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
): LivenessChecks | undefined => {
  if (properties.length === 0) return undefined;
  const live = getLiveFormula(properties, temporals, environment);
  const solutions = getSolutions(live.formula);
  const atoms = getInterpretedAtoms(environment);
  const isShared = isSharingResults(live.formula, environment);
  return {
    solutions,
    findTraceViolation: (trace, fingerprints) => {
      const lasso = findTraceLasso(trace, fingerprints, solutions, atoms, isShared);
      return (
        lasso && {
          ...lasso,
          properties: getViolatedProperties(
            properties,
            live.checks,
            lasso.positions.map((position) => trace[position]),
            lasso.cyclePosition - 1,
            environment,
          ),
        }
      );
    },
  };
};

export const createLivenessChecker = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
  search: SearchGraph<Value[]>,
): LivenessChecker | undefined => {
  if (properties.length === 0) return undefined;
  const live = getLiveFormula(properties, temporals, environment);
  const isShared = isSharingResults(live.formula, environment);
  const solutions = getSolutions(live.formula);
  const tracing = { environment, atoms: getInterpretedAtoms(environment) };
  const graph = createLiveGraph(
    solutions,
    {
      atoms: {
        holdsState: (atom, state) => tracing.atoms.holdsState(atom, state),
        holdsAction: (atom, state, next) => tracing.atoms.holdsAction(atom, state, next),
      },
      isShared,
      isSame: isSameState,
      evaluateFrom: (source, evaluate) => {
        environment.runtime.setLivenessSource(source);
        try {
          return evaluate();
        } finally {
          environment.runtime.setLivenessSource(undefined);
        }
      },
    },
    search,
    environment.runtime.version !== "1.7.4",
  );
  const traceWith = <Result>(replay: Environment | undefined, run: () => Result) => {
    if (replay === undefined) return run();
    tracing.atoms = getInterpretedAtoms(replay);
    try {
      return run();
    } finally {
      tracing.atoms = getInterpretedAtoms(environment);
    }
  };
  return {
    branches: graph.branches,
    solutions,
    addInitialState: (index, state, replay) =>
      traceWith(replay, () => graph.addInitialState(index, state)),
    addState: (index, state, successors, replay) =>
      traceWith(replay, () => graph.addState(index, state, successors, replay !== undefined)),
    storeState: graph.storeState,
    getStateCounts: graph.getStateCounts,
    findViolation: graph.findViolation,
    getViolatedProperties: (path, cycleStart) =>
      getViolatedProperties(properties, live.checks, path, cycleStart, environment),
  };
};

export const createLiveGraph = <State>(
  solutions: Solution[],
  evaluation: LiveEvaluation<State>,
  search: SearchGraph<State>,
  isAcceptingFound: boolean,
): LiveGraph<State> => {
  const actionIds = new Map<string, number>();
  let capacityMultiplier = 1;
  const isShared = evaluation.isShared;
  const atoms = evaluation.atoms;
  const evaluateFrom = evaluation.evaluateFrom;
  const stateAtoms = new Map<LiveState | LiveEnabled, number>();
  const atomsById: (LiveState | LiveEnabled)[] = [];
  const getAtomId = (atom: LiveState | LiveEnabled) => {
    const id = stateAtoms.get(atom) ?? stateAtoms.size;
    stateAtoms.set(atom, id);
    atomsById[id] = atom;
    return id;
  };
  const getLiterals = (expression: LiveExpression): number[] | undefined => {
    if (expression.kind === "State" || expression.kind === "Enabled") {
      return [getAtomId(expression) * 2 + 1];
    }
    if (expression.kind === "Not") {
      const body = expression.body;
      return body.kind === "State" || body.kind === "Enabled" ? [getAtomId(body) * 2] : undefined;
    }
    if (expression.kind !== "And") return undefined;
    const operands = expression.operands.map(getLiterals);
    return operands.every((operand) => operand !== undefined) ? operands.flat() : undefined;
  };
  // The rows of states, one after another, hold whether each state atom holds of a state: 1 or 0,
  // or -1 before it is evaluated.
  const createRows = (count: number) => new Int8Array(count * stateAtoms.size).fill(-1);
  // The edge rows of steps hold the result of each action check, shared by the behaviors that
  // check it.
  const createEdgeRows = (count: number) => new Int8Array(count * actionIds.size).fill(-1);
  // Unless the checks share results, each check evaluates its atoms afresh.
  const runCheck = (
    check: Check<State>,
    state: State,
    row: Int8Array,
    offset: number,
    next?: State,
  ) => (isShared ? check(state, row, offset, next) : check(state, createRows(1), 0, next));
  const compileCheck = (expression: LiveExpression): Check<State> => {
    switch (expression.kind) {
      case "Boolean": {
        const value = expression.value;
        return () => value;
      }
      case "State":
      case "Enabled": {
        const id = getAtomId(expression);
        return (state, row, offset) => {
          if (row[offset + id] === -1) {
            row[offset + id] = atoms.holdsState(expression, state) ? 1 : 0;
          }
          return row[offset + id] === 1;
        };
      }
      case "Action": {
        const enabled = expression.enabled && getAtomId(expression.enabled);
        return (state, row, offset, next) =>
          !(enabled !== undefined && row[offset + enabled] === 0) &&
          next !== undefined &&
          atoms.holdsAction(expression, state, next);
      }
      case "Not": {
        const body = compileCheck(expression.body);
        return (state, row, offset, next) => !body(state, row, offset, next);
      }
      case "And": {
        const operands = expression.operands.map(compileCheck);
        return (state, row, offset, next) =>
          operands.every((operand) => operand(state, row, offset, next));
      }
      case "Or": {
        const operands = expression.operands.map(compileCheck);
        return (state, row, offset, next) =>
          operands.some((operand) => operand(state, row, offset, next));
      }
      case "Next": {
        const body = compileCheck(expression.body);
        return (state, _row, _offset, next) => body(next ?? state, createRows(1), 0, undefined);
      }
      case "Always":
      case "Eventually":
        return () => {
          throw new TlaEvaluationError("TLC cannot evaluate a temporal formula in a single step");
        };
    }
  };
  const behaviors = solutions.map((solution): BehaviorGraph<State> => ({
    solution,
    checks: {
      states: solution.stateChecks.map(compileCheck),
      actions: solution.actionChecks.map(compileCheck),
      nodes:
        solution.tableau?.nodes.map((node) => {
          const literals = isShared
            ? getLiterals({ kind: "And", operands: node.statePredicates })
            : undefined;
          return literals ? Int32Array.from(literals) : node.statePredicates.map(compileCheck);
        }) ?? [],
    },
    actionIds: Int32Array.from(solution.actionChecks, (predicate) => {
      const key = getTermKey(predicate);
      const actionId = actionIds.get(key) ?? actionIds.size;
      actionIds.set(key, actionId);
      return actionId;
    }),
    nodeStates: [],
    nodeTableaux: [],
    edgeStarts: [],
    edgeCounts: [],
    edgeTargets: createPool((length) => new Int32Array(length)),
    edgeActions: createPool((length) => new Uint8Array(length)),
    stateResults: createPool((length) => new Uint8Array(length)),
    initial: [],
    firstNodes: createPool(createNodes),
    lastNodes: createPool(createNodes),
    nextSiblings: [],
    nodeIds: { slots: new Int32Array(3 << 10), size: 0, shift: 22 },
    isDone: [],
    stateCount: 0,
    errorNode: undefined,
  }));
  const checkState = (
    behavior: BehaviorGraph<State>,
    source: number,
    state: State,
    row: Int8Array,
    offset: number,
  ) =>
    evaluateFrom(source, () => {
      const checks = behavior.checks.states;
      const results = new Uint8Array(checks.length);
      checks.forEach((check, position) => {
        results[position] = runCheck(check, state, row, offset) ? 1 : 0;
      });
      return results;
    });
  // Writes the result of each action check of the step to successor at resultOffset in results.
  const checkAction = (
    behavior: BehaviorGraph<State>,
    source: number,
    state: State,
    row: Int8Array,
    offset: number,
    successor: State,
    edges: Int8Array,
    edgeOffset: number,
    results: Uint8Array,
    resultOffset: number,
  ) =>
    evaluateFrom(source, () => {
      const actions = behavior.checks.actions;
      for (let position = 0; position < actions.length; position++) {
        if (!isShared) {
          results[resultOffset + position] = runCheck(
            actions[position],
            state,
            row,
            offset,
            successor,
          )
            ? 1
            : 0;
          continue;
        }
        const edge = edgeOffset + behavior.actionIds[position];
        if (edges[edge] === -1)
          edges[edge] = actions[position](state, row, offset, successor) ? 1 : 0;
        results[resultOffset + position] = edges[edge];
      }
    });
  const holdsNode = (
    behavior: BehaviorGraph<State>,
    node: number,
    state: State,
    row: Int8Array,
    offset: number,
  ) => {
    const checks = behavior.checks.nodes[node];
    if (!(checks instanceof Int32Array)) {
      return checks.every((check) => runCheck(check, state, row, offset));
    }
    for (let position = 0; position < checks.length; position++) {
      const literal: number = checks[position];
      const cell = offset + (literal >> 1);
      if (row[cell] === -1) row[cell] = atoms.holdsState(atomsById[literal >> 1], state) ? 1 : 0;
      if (row[cell] !== (literal & 1)) return false;
    }
    return true;
  };
  const isConsistent = (
    behavior: BehaviorGraph<State>,
    node: number,
    source: number | undefined,
    state: State,
    row: Int8Array,
    offset: number,
  ) => evaluateFrom(source, () => holdsNode(behavior, node, state, row, offset));

  const isAccepting = (tableau: Tableau, node: number) => {
    if (!isAcceptingFound) return false;
    const tableauNode = tableau.nodes[node];
    return (
      tableauNode.particle.length === 0 &&
      tableauNode.successors.length === 1 &&
      tableauNode.successors[0] === node
    );
  };

  const getNodeId = (behavior: BehaviorGraph<State>, state: number, tableauNode: number) => {
    if (!behavior.solution.tableau) return state;
    const slots = behavior.nodeIds.slots;
    const slot = getNodeSlot(behavior.nodeIds, state, tableauNode);
    return slots[slot] === 0 ? undefined : slots[slot + 2];
  };
  const linkNode = (
    behavior: BehaviorGraph<State>,
    state: number,
    tableauNode: number,
    node: number,
  ) => {
    const table = behavior.nodeIds;
    if (++table.size * 2 > table.slots.length / 3) {
      const old = table.slots;
      table.slots = new Int32Array(old.length * 2);
      table.shift--;
      for (let slot = 0; slot < old.length; slot += 3) {
        if (old[slot] !== 0) {
          table.slots.set(
            old.subarray(slot, slot + 3),
            getNodeSlot(table, old[slot] - 1, old[slot + 1]),
          );
        }
      }
    }
    table.slots.set([state + 1, tableauNode, node], getNodeSlot(table, state, tableauNode));
    if (state < 0) return node;
    const last = behavior.lastNodes.data[state] ?? NO_NODE;
    if (last === NO_NODE) writeToPool(behavior.firstNodes, state, [node]);
    else behavior.nextSiblings[last] = node;
    writeToPool(behavior.lastNodes, state, [node]);
    return node;
  };
  const hasState = (behavior: BehaviorGraph<State>, state: number) =>
    state < 0
      ? behavior.checks.nodes.some(
          (_checks, tableauNode) => getNodeId(behavior, state, tableauNode) !== undefined,
        )
      : behavior.isDone[state] === true || (behavior.firstNodes.data[state] ?? NO_NODE) !== NO_NODE;
  const recordNode = (behavior: BehaviorGraph<State>, state: number, tableauNode: number) => {
    if (!hasState(behavior, state)) behavior.stateCount++;
    return linkNode(behavior, state, tableauNode, pushNode(behavior, state, tableauNode));
  };
  // The action results of the edge to each target are at its position in actions.
  const writeNode = (
    behavior: BehaviorGraph<State>,
    node: number,
    targets: number[],
    actionResults: Uint8Array,
    actions: number[],
    stateResults: Uint8Array,
  ) => {
    const start = behavior.edgeTargets.length;
    const actionCount = behavior.solution.actionChecks.length;
    writeToPool(behavior.edgeTargets, start, targets);
    actions.forEach((position, edge) =>
      writeToPool(
        behavior.edgeActions,
        (start + edge) * actionCount,
        actionResults,
        position * actionCount,
        actionCount,
      ),
    );
    writeToPool(
      behavior.stateResults,
      behavior.nodeStates[node] * stateResults.length,
      stateResults,
    );
    behavior.edgeStarts[node] = start;
    behavior.edgeCounts[node] = targets.length;
  };

  // TLC iterates a state's successors and the state itself in the slot order of a SetOfStates, a hash set whose capacity grows with every set that outgrows it.
  // Each slot holds a candidate's position plus one, or 0 when it is empty.
  const successorSet = { slots: new Int32Array(0) };
  const getSuccessorSet = (index: number, state: State, successors: LiveSuccessor<State>[]) => {
    const candidates = [...successors, { index, state }];
    const capacity = SUCCESSOR_CAPACITY * capacityMultiplier;
    successorSet.slots =
      successorSet.slots.length === capacity
        ? successorSet.slots.fill(0)
        : new Int32Array(capacity);
    const insert = (position: number) => {
      const slots = successorSet.slots;
      const candidate = candidates[position];
      for (
        let slot = (search.getFingerprint(candidate) & 0x7fffffff) % slots.length;
        ;
        slot = (slot + 1) % slots.length
      ) {
        const entry = slots[slot];
        if (entry === 0) {
          slots[slot] = position + 1;
          return true;
        }
        const stored = candidates[entry - 1];
        if (stored.index === candidate.index && evaluation.isSame(stored.state, candidate.state))
          return false;
      }
    };
    let count = 0;
    for (let position = 0; position < candidates.length; position++) {
      if (count >= successorSet.slots.length >> 1) {
        const old = successorSet.slots;
        successorSet.slots = new Int32Array(2 * old.length + 1);
        for (const entry of old) if (entry !== 0) insert(entry - 1);
      }
      if (insert(position)) count++;
    }
    if (successorSet.slots.length > capacity) capacityMultiplier++;
    const set: LiveSuccessor<State>[] = [];
    for (const entry of successorSet.slots) if (entry !== 0) set.push(candidates[entry - 1]);
    return set;
  };

  const expandLate = (
    behavior: BehaviorGraph<State>,
    tableau: Tableau,
    state: State,
    index: number,
    node: number,
    row: Int8Array,
    offset: number,
  ) => {
    const stateResults = checkState(behavior, index, state, row, offset);
    const tableauNode = tableau.nodes[behavior.nodeTableaux[node]];
    const actionCount = behavior.checks.actions.length;
    const actions: number[] = [];
    const successors: number[] = [];
    const selfResults = new Uint8Array(actionCount);
    if (tableauNode.successors.length > 0) {
      checkAction(behavior, index, state, row, offset, state, createEdgeRows(1), 0, selfResults, 0);
    }
    for (const next of tableauNode.successors) {
      if (!isConsistent(behavior, next, index, state, row, offset)) continue;
      if (
        isAccepting(tableau, next) &&
        behavior.errorNode === undefined &&
        behavior.solution.models.some(isEmptyModel)
      ) {
        behavior.errorNode = node;
        return;
      }
      const existing = getNodeId(behavior, index, next);
      if (existing !== undefined && successors.includes(existing)) continue;
      const target = existing ?? recordNode(behavior, index, next);
      successors.push(target);
      actions.push(0);
      if (existing === undefined) expandLate(behavior, tableau, state, index, target, row, offset);
    }
    // The results of the step to the state itself come first, then those of each successor.
    const actionBatches = [selfResults];
    let stepCount = 1;
    search.forEachActionSuccessors(index, state, (nextStates) => {
      const edges = createEdgeRows(nextStates.length);
      const results = new Uint8Array(nextStates.length * actionCount);
      actionBatches.push(results);
      for (let position = 0; position < nextStates.length; position++) {
        const successor = nextStates[position];
        const successorRow = createRows(1);
        checkAction(
          behavior,
          index,
          state,
          row,
          offset,
          successor.state,
          edges,
          position * actionIds.size,
          results,
          position * actionCount,
        );
        const isDone = behavior.isDone[successor.index] === true;
        for (const next of tableauNode.successors) {
          if (!isConsistent(behavior, next, index, successor.state, successorRow, 0)) continue;
          const existing = getNodeId(behavior, successor.index, next);
          if (existing !== undefined && successors.includes(existing)) continue;
          const target = existing ?? recordNode(behavior, successor.index, next);
          successors.push(target);
          actions.push(stepCount + position);
          if (existing === undefined && isDone) {
            expandLate(
              behavior,
              tableau,
              successor.state,
              successor.index,
              target,
              successorRow,
              0,
            );
          }
        }
      }
      stepCount += nextStates.length;
    });
    if (successors.length > 0) {
      const actionResults = new Uint8Array(stepCount * actionCount);
      for (let batch = 0, resultOffset = 0; batch < actionBatches.length; batch++) {
        actionResults.set(actionBatches[batch], resultOffset);
        resultOffset += actionBatches[batch].length;
      }
      writeNode(behavior, node, successors, actionResults, actions, stateResults);
    }
  };

  const addTableauState = (
    behavior: BehaviorGraph<State>,
    tableau: Tableau,
    set: LiveSuccessor<State>[],
    rows: Int8Array,
    actionResults: Uint8Array,
    stateResults: Uint8Array,
    index: number,
  ) => {
    const atomCount = stateAtoms.size;
    // Whether each successor is consistent with each tableau node, node by node.
    const consistency = new Uint8Array(tableau.nodes.length * set.length);
    evaluateFrom(index, () => {
      for (let node = 0; node < tableau.nodes.length; node++) {
        for (let position = 0; position < set.length; position++) {
          if (holdsNode(behavior, node, set[position].state, rows, position * atomCount)) {
            consistency[node * set.length + position] = 1;
          }
        }
      }
    });
    if (!hasState(behavior, index)) behavior.stateCount++;
    behavior.isDone[index] = true;
    // TLC expands the nodes recorded before the loop, not the ones the loop records.
    for (const node of getStateNodes(behavior, index)) {
      const successors: number[] = [];
      const actions: number[] = [];
      set.forEach((successor, position) => {
        const isDone = behavior.isDone[successor.index] === true;
        for (const next of tableau.nodes[behavior.nodeTableaux[node]].successors) {
          if (consistency[next * set.length + position] === 0) continue;
          const existing = getNodeId(behavior, successor.index, next);
          if (existing !== undefined && successors.includes(existing)) continue;
          const target = existing ?? recordNode(behavior, successor.index, next);
          successors.push(target);
          actions.push(position);
          if (existing === undefined && isDone) {
            expandLate(
              behavior,
              tableau,
              successor.state,
              successor.index,
              target,
              rows,
              position * atomCount,
            );
          }
        }
      });
      writeNode(behavior, node, successors, actionResults, actions, stateResults);
    }
    return behavior.errorNode === undefined
      ? undefined
      : getStatePath(behavior, behavior.errorNode);
  };

  const addPlainState = (
    behavior: BehaviorGraph<State>,
    set: LiveSuccessor<State>[],
    actionResults: Uint8Array,
    stateResults: Uint8Array,
    index: number,
  ) => {
    while (behavior.nodeStates.length <= index) pushNode(behavior, behavior.nodeStates.length, -1);
    const successors: number[] = [];
    const actions: number[] = [];
    set.forEach((successor, position) => {
      if (isWritten(behavior, successor.index) && successors.includes(successor.index)) return;
      successors.push(successor.index);
      actions.push(position);
    });
    if (!isWritten(behavior, index)) behavior.stateCount++;
    writeNode(behavior, index, successors, actionResults, actions, stateResults);
  };

  const getPath = (behavior: BehaviorGraph<State>, target: number) => {
    if (behavior.initial.includes(target)) return [target];
    const parents = new Map<number, number>();
    const queue: number[] = [];
    for (const node of behavior.initial) {
      if (!isWritten(behavior, node)) continue;
      queue.push(node);
      parents.set(node, -1);
    }
    for (let position = 0; position < queue.length; position++) {
      const current = queue[position];
      for (const next of getNodeSuccessors(behavior, current)) {
        if (next === current && behavior.solution.tableau) continue;
        if (next === target) {
          const path = [target];
          for (let node = current; node !== -1; node = parents.get(node) ?? -1) path.push(node);
          return path;
        }
        if (!isWritten(behavior, next) || parents.has(next)) continue;
        parents.set(next, current);
        queue.push(next);
      }
    }
    throw new TlaEvaluationError(`Couldn't re-create liveness trace (path) starting at: ${target}`);
  };

  const getStatePath = (behavior: BehaviorGraph<State>, target: number) =>
    removeRepeats(
      getPath(behavior, target)
        .reverse()
        .map((node) => behavior.nodeStates[node]),
    );

  const findLassoInModel = (
    behavior: BehaviorGraph<State>,
    model: Solution["models"][number],
  ): Lasso | undefined => {
    const solution = behavior.solution;
    const actionCount = solution.actionChecks.length;
    const getAction = (node: number, edge: number, position: number) =>
      behavior.edgeActions.data[(behavior.edgeStarts[node] + edge) * actionCount + position] === 1;
    const isAllowed = (node: number, edge: number) =>
      model.eventuallyAlways.every((position) => getAction(node, edge, position));
    const links = new Float64Array(behavior.nodeStates.length).fill(UNVISITED);
    const queue = behavior.initial.filter((node) => isWritten(behavior, node));
    const components: number[] = [];

    const isStuttering = (node: number) => {
      const edge = getNodeSuccessors(behavior, node).indexOf(node);
      return edge !== -1 && isAllowed(node, edge);
    };
    const isFulfilled = (node: number, promise: Solution["promises"][number]) =>
      solution.tableau !== undefined &&
      isFulfilling(solution.tableau.nodes[behavior.nodeTableaux[node]].particle, promise);

    const checkComponent = (root: number) => {
      const top = components.pop() ?? root;
      if (top === root && !isStuttering(top)) {
        links[top] = MAXIMUM_LINK;
        return undefined;
      }
      const members = new Set<number>();
      const membersByState = new Map<number, number[]>();
      for (let member = top; ; member = components.pop() ?? root) {
        members.add(member);
        const siblings = membersByState.get(behavior.nodeStates[member]);
        if (siblings) siblings.push(member);
        else membersByState.set(behavior.nodeStates[member], [member]);
        links[member] = MAXIMUM_LINK;
        if (member === root) break;
      }
      const isStateSatisfied = model.infinitelyOftenStates.every((position) =>
        [...members].some((node) => getStateResult(behavior, node, position)),
      );
      const isActionSatisfied = model.infinitelyOftenActions.every((position) =>
        [...members].some((node) =>
          getNodeSuccessors(behavior, node).some(
            (next, edge) =>
              members.has(next) && isAllowed(node, edge) && getAction(node, edge, position),
          ),
        ),
      );
      const isPromiseSatisfied = solution.promises.every((promise) =>
        [...members].some((node) => isFulfilled(node, promise)),
      );
      if (!isStateSatisfied || !isActionSatisfied || !isPromiseSatisfied) return undefined;
      return getLasso(root, members, membersByState);
    };

    const getLasso = (
      root: number,
      members: Set<number>,
      membersByState: Map<number, number[]>,
    ) => {
      const prefix = getStatePath(behavior, root);
      const cycleStack: number[] = [];
      const seen = new Set<number>([root]);
      const stateDone = model.infinitelyOftenStates.map(() => false);
      const actionDone = model.infinitelyOftenActions.map(() => false);
      const promiseDone = solution.promises.map(() => false);
      let remainingCount = stateDone.length + actionDone.length + promiseDone.length;
      let currentNode = root;
      const moveTo = (next: number) => {
        cycleStack.push(currentNode);
        currentNode = next;
      };
      while (remainingCount > 0) {
        const countAtStart = remainingCount;
        while (true) {
          model.infinitelyOftenStates.forEach((position, slot) => {
            if (!stateDone[slot] && getStateResult(behavior, currentNode, position)) {
              stateDone[slot] = true;
              remainingCount--;
            }
          });
          solution.promises.forEach((promise, position) => {
            if (!promiseDone[position] && isFulfilled(currentNode, promise)) {
              promiseDone[position] = true;
              remainingCount--;
            }
          });
          if (remainingCount <= 0) break;
          let lastNext = -1;
          let unvisitedNext = -1;
          const countBeforeActions = remainingCount;
          const isTaken = getNodeSuccessors(behavior, currentNode).some((next, edge) => {
            if (membersByState.has(behavior.nodeStates[next])) {
              if (!members.has(next) || !isAllowed(currentNode, edge)) return false;
              lastNext = next;
              model.infinitelyOftenActions.forEach((position, slot) => {
                if (!actionDone[slot] && getAction(currentNode, edge, position)) {
                  actionDone[slot] = true;
                  remainingCount--;
                }
              });
            }
            if (remainingCount < countBeforeActions) {
              moveTo(next);
              seen.clear();
              return true;
            }
            if (members.has(next) && !seen.has(next)) unvisitedNext = next;
            return false;
          });
          if (isTaken) break;
          if (remainingCount < countAtStart) {
            moveTo(lastNext);
            seen.clear();
            break;
          }
          while (unvisitedNext === -1) {
            const previous = cycleStack.pop();
            if (previous === undefined) {
              throw new TlaEvaluationError(
                "TLC failed to build the counterexample of a liveness property",
              );
            }
            currentNode = previous;
            unvisitedNext =
              getNodeSuccessors(behavior, previous).find(
                (next) => members.has(next) && !seen.has(next),
              ) ?? -1;
          }
          moveTo(unvisitedNext);
          seen.add(unvisitedNext);
        }
      }
      const postfix = getClosingPath(root, currentNode, membersByState);
      for (let position = cycleStack.length - 1; position >= 0; position--) {
        const state = behavior.nodeStates[cycleStack[position]];
        if (postfix[postfix.length - 1] !== state) postfix.push(state);
      }
      const cycleState = prefix[prefix.length - 1];
      if (postfix[postfix.length - 1] === cycleState) postfix.pop();
      return {
        prefix: prefix.slice(0, -1),
        cycle: [cycleState, ...postfix.reverse()],
        isCycleConstrained: isCycleConstrained(solution),
      };
    };

    const getClosingPath = (root: number, end: number, membersByState: Map<number, number[]>) => {
      if (end === root) return [];
      const start = behavior.nodeStates[end];
      const parents = new Map<number, number>();
      const seen = new Set<number>([start]);
      const queue: [number, number][] = [];
      for (let state = start, parent = -1, position = 0; ; position++) {
        for (const node of membersByState.get(state) ?? []) {
          for (const [edge, next] of getNodeSuccessors(behavior, node).entries()) {
            if (next === node || !isAllowed(node, edge)) continue;
            if (next === root) {
              const path: number[] = [];
              for (let item = state, itemParent = parent; item !== start;) {
                path.push(item);
                item = itemParent;
                itemParent = parents.get(item) ?? -1;
              }
              path.push(start);
              return path;
            }
            const nextState = behavior.nodeStates[next];
            if (!membersByState.has(nextState) || seen.has(nextState)) continue;
            seen.add(nextState);
            queue.push([nextState, state]);
          }
        }
        parents.set(state, parent);
        const item = queue[position];
        if (item === undefined) {
          throw new TlaEvaluationError(
            "TLC failed to build the counterexample of a liveness property",
          );
        }
        state = item[0];
        parent = item[1];
      }
    };

    for (let position = 0; position < queue.length; position++) {
      const stack = [queue[position], UNVISITED, 0];
      let nextLink = 0;
      while (stack.length >= 3) {
        const lowLink = stack.pop() ?? 0;
        const location = stack.pop();
        const node = stack.pop() ?? 0;
        if (location === SCC_MARKER) {
          if (links[node] === lowLink) {
            const lasso = checkComponent(node);
            if (lasso) return lasso;
          }
          stack.push(Math.min(stack.pop() ?? lowLink, lowLink));
          continue;
        }
        if (links[node] !== UNVISITED) {
          stack.push(Math.min(lowLink, links[node]));
          continue;
        }
        links[node] = nextLink;
        stack.push(lowLink, node, SCC_MARKER);
        components.push(node);
        let nextLowLink = nextLink++;
        getNodeSuccessors(behavior, node).forEach((next, edge) => {
          if (!isWritten(behavior, next)) return;
          if (!isAllowed(node, edge)) {
            if (links[next] === UNVISITED) queue.push(next);
            return;
          }
          if (links[next] === UNVISITED) stack.push(next, UNVISITED);
          else nextLowLink = Math.min(nextLowLink, links[next]);
        });
        stack.push(nextLowLink);
      }
    }
    return undefined;
  };

  return {
    branches: behaviors.length,
    addInitialState: (index, state) => {
      const row = createRows(1);
      for (const behavior of behaviors) {
        const tableau = behavior.solution.tableau;
        if (!tableau) {
          behavior.initial.push(index);
          continue;
        }
        for (let node = 0; node < tableau.initialCount; node++) {
          if (!isConsistent(behavior, node, undefined, state, row, 0)) continue;
          behavior.initial.push(
            getNodeId(behavior, index, node) ?? recordNode(behavior, index, node),
          );
        }
      }
    },
    addState: (index, state, successors, isRerun) => {
      const set = getSuccessorSet(index, state, successors);
      const rows = createRows(set.length);
      // The set holds the state itself, as a successor of the same index.
      const offset = set.findIndex((successor) => successor.index === index) * stateAtoms.size;
      const edges = createEdgeRows(set.length);
      for (const behavior of behaviors) {
        const actionCount = behavior.checks.actions.length;
        const actionResults = new Uint8Array(set.length * actionCount);
        set.forEach((successor, position) =>
          checkAction(
            behavior,
            index,
            state,
            rows,
            offset,
            successor.state,
            edges,
            position * actionIds.size,
            actionResults,
            position * actionCount,
          ),
        );
        const stateResults = checkState(behavior, index, state, rows, offset);
        const tableau = behavior.solution.tableau;
        // TLC's rerun for a call stack fails an assertion, without a call stack, on a branch that has every edge of the state.
        if (
          isRerun &&
          (tableau
            ? getStateNodes(behavior, index).some((node) => behavior.edgeCounts[node] > 0)
            : set.every((successor) => isWritten(behavior, successor.index)))
        ) {
          throw new TlaEvaluationError("The behavior graph holds every edge of the state already.");
        }
        if (!tableau) {
          addPlainState(behavior, set, actionResults, stateResults, index);
          continue;
        }
        const accepted = addTableauState(
          behavior,
          tableau,
          set,
          rows,
          actionResults,
          stateResults,
          index,
        );
        if (accepted) return accepted;
      }
      return undefined;
    },
    storeState: (pending, index) => {
      for (const behavior of behaviors) {
        const tableau = behavior.solution.tableau;
        if (!tableau) continue;
        const nodes: number[] = [];
        for (let tableauNode = 0; tableauNode < tableau.nodes.length; tableauNode++) {
          const node = getNodeId(behavior, pending, tableauNode);
          if (node !== undefined) nodes.push(node);
        }
        for (const node of nodes.sort((left, right) => left - right)) {
          behavior.nodeStates[node] = index;
          linkNode(behavior, index, behavior.nodeTableaux[node], node);
        }
      }
    },
    getStateCounts: () => behaviors.map((behavior) => behavior.stateCount),
    findViolation: () => {
      for (const behavior of behaviors) {
        for (const model of behavior.solution.models) {
          const lasso = findLassoInModel(behavior, model);
          if (lasso) return lasso;
        }
      }
      return undefined;
    },
  };
};
