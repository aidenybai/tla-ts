import { TlaEvaluationError } from "./errors";
import { isExpressionImpure } from "./dependencies";
import { hasRepeatedEffects, type Environment } from "./evaluate";
import {
  evaluateOnLasso,
  getInterpretedAtoms,
  toLiveExpression,
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
  findViolation: () => Lasso | undefined;
  getViolatedProperties: (path: Value[][], cycleStart: number) => string[];
}

export interface LiveGraph<State> {
  branches: number;
  addInitialState: (index: number, state: State) => void;
  // The path to an accepting node the state reaches, if any.
  addState: (
    index: number,
    state: State,
    successors: LiveSuccessor<State>[],
  ) => number[] | undefined;
  findViolation: () => Lasso | undefined;
}

export interface SearchGraph<State> {
  getFingerprint: (successor: LiveSuccessor<State>) => number;
  getSuccessors: (index: number, state: State) => LiveSuccessor<State>[];
}

export interface LiveEvaluation<State> {
  // Whether the atom at a position of getLiveAtoms holds of a state, or, for an action, of a step.
  holds: (position: number, state: State, next: State) => boolean;
  // Whether a check's result for a state holds for every step from it.
  isShared: boolean;
  isSame: (left: State, right: State) => boolean;
  // Evaluates the checks of a state the search found from the state at source.
  evaluateFrom: <Result>(source: number | undefined, evaluate: () => Result) => Result;
}

type PoolData = Int8Array | Int32Array | Uint8Array | Uint32Array;

// A growable typed array: the first length elements of data are in use.
interface Pool<Data extends PoolData> {
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

// The behavior graph of one solution, as columns by node id and by state index. A node of a tableau
// is a pair of a state and a tableau node; without a tableau, a state's index is its node.
interface BehaviorGraph<State> {
  solution: Solution;
  checks: BehaviorChecks<State>;
  actionIds: Int32Array;
  tableauSize: number;
  nodeStates: Pool<Int32Array>;
  nodeTableaux: Pool<Int32Array>;
  // The node of the same state recorded after the node, as TLC lists a state's nodes.
  nextSiblings: Pool<Int32Array>;
  // Where a node's successors start in edgeTargets, or UNWRITTEN before they are, and how many.
  edgeStarts: Pool<Int32Array>;
  edgeCounts: Pool<Int32Array>;
  edgeTargets: Pool<Int32Array>;
  edgeActions: Pool<Uint8Array>;
  stateResults: Pool<Uint8Array>;
  initial: number[];
  firstNodes: Pool<Int32Array>;
  lastNodes: Pool<Int32Array>;
  // The node of each state and tableau node, at state * tableauSize + tableau node.
  stateNodes: Pool<Int32Array>;
  // A bit for each state whose successors the graph has.
  doneStates: Pool<Uint32Array>;
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

const createPool = <Data extends PoolData>(create: (length: number) => Data): Pool<Data> => ({
  data: create(1024),
  length: 0,
  create,
});

const reservePool = <Data extends PoolData>(pool: Pool<Data>, end: number) => {
  if (end > pool.data.length) {
    const data = pool.create(Math.max(2 * pool.data.length, end));
    data.set(pool.data);
    pool.data = data;
  }
  pool.length = Math.max(pool.length, end);
};

const writeToPool = <Data extends PoolData>(
  pool: Pool<Data>,
  offset: number,
  values: ArrayLike<number>,
  start = 0,
  length = values.length - start,
) => {
  reservePool(pool, offset + length);
  for (let position = 0; position < length; position++) {
    pool.data[offset + position] = values[start + position];
  }
};

// The pool's data, grown to hold length elements, with them set to value.
const resetPool = <Data extends PoolData>(pool: Pool<Data>, length: number, value: number) => {
  reservePool(pool, length);
  pool.data.fill(value, 0, length);
  return pool.data;
};

const setInPool = <Data extends PoolData>(pool: Pool<Data>, offset: number, value: number) => {
  reservePool(pool, offset + 1);
  pool.data[offset] = value;
};

const NO_NODE = -1;

const UNWRITTEN = -1;

// The columns read NO_NODE or UNWRITTEN, both -1, past their end.
const createNodes = (length: number) => new Int32Array(length).fill(NO_NODE);

const isWritten = <State>(behavior: BehaviorGraph<State>, node: number) =>
  (behavior.edgeStarts.data[node] ?? UNWRITTEN) !== UNWRITTEN;

const isDone = <State>(behavior: BehaviorGraph<State>, state: number) =>
  (((behavior.doneStates.data[state >>> 5] ?? 0) >>> (state & 31)) & 1) === 1;

const setDone = <State>(behavior: BehaviorGraph<State>, state: number) => {
  const word = state >>> 5;
  reservePool(behavior.doneStates, word + 1);
  behavior.doneStates.data[word] |= 1 << (state & 31);
};

const getNodeSuccessors = <State>(behavior: BehaviorGraph<State>, node: number) => {
  const start = behavior.edgeStarts.data[node];
  return behavior.edgeTargets.data.subarray(start, start + behavior.edgeCounts.data[node]);
};

const getStateResult = <State>(behavior: BehaviorGraph<State>, node: number, position: number) =>
  behavior.stateResults.data[
    behavior.nodeStates.data[node] * behavior.solution.stateChecks.length + position
  ] === 1;

const pushNode = <State>(behavior: BehaviorGraph<State>, state: number, tableauNode: number) => {
  const node = behavior.nodeStates.length;
  setInPool(behavior.nodeStates, node, state);
  setInPool(behavior.nodeTableaux, node, tableauNode);
  setInPool(behavior.edgeStarts, node, UNWRITTEN);
  setInPool(behavior.edgeCounts, node, 0);
  setInPool(behavior.nextSiblings, node, NO_NODE);
  return node;
};

const SUCCESSOR_CAPACITY = 16;

const SCC_MARKER = -42;

const UNVISITED = -1;

const ROOT = -2;

const MAXIMUM_LINK = 0x7fffffff;

const getLiveFormula = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
) => {
  const fairness = temporals.map((item) =>
    toLiveExpression(item.expression, item.scope, environment),
  );
  const negations = properties.map((property) =>
    createUnary("Not", toLiveExpression(property.expression, property.scope, environment)),
  );
  const violation = negations.length === 1 ? negations[0] : createJunction("Or", negations);
  const formula =
    fairness.length === 0 ? violation : createJunction("And", [...fairness, violation]);
  return { formula, negations };
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

export const createLivenessChecker = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
  search: SearchGraph<Value[]>,
): LivenessChecker | undefined => {
  if (properties.length === 0) return undefined;
  const live = getLiveFormula(properties, temporals, environment);
  // A check evaluated once for a state shows what TLC shows when no check repeats an effect. A
  // definition TLC evaluates as it starts repeats nothing, but a scope can bind any definition.
  const formulaAtoms = new Set<LiveAtom>();
  collectAtoms(live.formula, formulaAtoms);
  const checked = [...formulaAtoms].flatMap(getAtomExpressions);
  const isShared = checked.every((item) => item.scope === undefined)
    ? !isExpressionImpure(
        checked.map((item) => item.expression),
        environment,
        "repeated",
      )
    : !hasRepeatedEffects(environment);
  const tracing = { environment, atoms: getInterpretedAtoms(environment) };
  const solutions = getSolutions(live.formula);
  const liveAtoms = getLiveAtoms(solutions);
  const graph = createLiveGraph(
    solutions,
    {
      holds: (position, state, next) => {
        const atom = liveAtoms[position];
        return atom.kind === "Action"
          ? tracing.atoms.holdsAction(atom, state, next)
          : tracing.atoms.holdsState(atom, state);
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
      traceWith(replay, () => graph.addState(index, state, successors)),
    findViolation: graph.findViolation,
    getViolatedProperties: (path, cycleStart) => [
      ...new Set(
        properties
          .filter(
            (_property, position) =>
              !evaluateOnLasso(live.negations[position].body, path, cycleStart, 0, environment),
          )
          .map((property) => property.name),
      ),
    ],
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
  const holds = evaluation.holds;
  const evaluateFrom = evaluation.evaluateFrom;
  const positions = new Map(getLiveAtoms(solutions).map((atom, position) => [atom, position]));
  const getPosition = (atom: LiveAtom) => positions.get(atom) ?? -1;
  // The state atoms by the id of their cell in a row, with the position of each.
  const stateAtoms = new Map<LiveState | LiveEnabled, number>();
  const atomPositions: number[] = [];
  const getAtomId = (atom: LiveState | LiveEnabled) => {
    const id = stateAtoms.get(atom) ?? stateAtoms.size;
    stateAtoms.set(atom, id);
    atomPositions[id] = getPosition(atom);
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
        const position = getPosition(expression);
        return (state, row, offset) => {
          if (row[offset + id] === -1) {
            row[offset + id] = holds(position, state, state) ? 1 : 0;
          }
          return row[offset + id] === 1;
        };
      }
      case "Action": {
        const enabled = expression.enabled && getAtomId(expression.enabled);
        const position = getPosition(expression);
        return (state, row, offset, next) =>
          !(enabled !== undefined && row[offset + enabled] === 0) &&
          next !== undefined &&
          holds(position, state, next);
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
    tableauSize: solution.tableau?.nodes.length ?? 0,
    nodeStates: createPool((length) => new Int32Array(length)),
    nodeTableaux: createPool((length) => new Int32Array(length)),
    nextSiblings: createPool(createNodes),
    edgeStarts: createPool(createNodes),
    edgeCounts: createPool((length) => new Int32Array(length)),
    edgeTargets: createPool((length) => new Int32Array(length)),
    edgeActions: createPool((length) => new Uint8Array(length)),
    stateResults: createPool((length) => new Uint8Array(length)),
    initial: [],
    firstNodes: createPool(createNodes),
    lastNodes: createPool(createNodes),
    stateNodes: createPool(createNodes),
    doneStates: createPool((length) => new Uint32Array(length)),
    errorNode: undefined,
  }));
  // Writes the result of each state check of a state.
  const checkState = (
    behavior: BehaviorGraph<State>,
    state: State,
    row: Int8Array,
    offset: number,
    results = new Uint8Array(behavior.checks.states.length),
  ) => {
    const checks = behavior.checks.states;
    for (let position = 0; position < checks.length; position++) {
      results[position] = runCheck(checks[position], state, row, offset) ? 1 : 0;
    }
    return results;
  };
  // Writes the result of each action check of the step to successor at resultOffset in results.
  const checkAction = (
    behavior: BehaviorGraph<State>,
    state: State,
    row: Int8Array,
    offset: number,
    successor: State,
    edges: Int8Array,
    edgeOffset: number,
    results: Uint8Array,
    resultOffset: number,
  ) => {
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
  };
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
      if (row[cell] === -1) row[cell] = holds(atomPositions[literal >> 1], state, state) ? 1 : 0;
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
    const node = behavior.stateNodes.data[state * behavior.tableauSize + tableauNode] ?? NO_NODE;
    return node === NO_NODE ? undefined : node;
  };
  const recordNode = (behavior: BehaviorGraph<State>, state: number, tableauNode: number) => {
    const node = pushNode(behavior, state, tableauNode);
    setInPool(behavior.stateNodes, state * behavior.tableauSize + tableauNode, node);
    const last = behavior.lastNodes.data[state] ?? NO_NODE;
    if (last === NO_NODE) setInPool(behavior.firstNodes, state, node);
    else behavior.nextSiblings.data[last] = node;
    setInPool(behavior.lastNodes, state, node);
    return node;
  };

  // The successors of the nodes being written, list after list, as pairs of a target node and the
  // position of its step's results. Expanding a node the list of another reaches writes the
  // expanded node's list above that list.
  const edgeStack = createPool((length) => new Int32Array(length));
  // The number of the last list that holds each node, by node id.
  const listed = createPool((length) => new Int32Array(length));
  let listCount = 0;
  const startList = () => ++listCount;
  const isListed = (target: number, list: number) => listed.data[target] === list;
  const pushEdge = (target: number, position: number, list: number) => {
    setInPool(edgeStack, edgeStack.length, target);
    setInPool(edgeStack, edgeStack.length, position);
    if (target >= 0) setInPool(listed, target, list);
  };
  // Marks the nodes of a list again after an expansion it reached wrote its own list.
  const relist = (start: number, list: number) => {
    for (let item = start; item < edgeStack.length; item += 2) {
      const target = edgeStack.data[item];
      if (target >= 0) listed.data[target] = list;
    }
  };
  // Writes the list from start as the node's successors and drops it. The action results of the
  // edge to each target are at its position in actionResults.
  const writeNode = (
    behavior: BehaviorGraph<State>,
    node: number,
    start: number,
    actionResults: Uint8Array,
    stateResults: Uint8Array,
  ) => {
    const count = (edgeStack.length - start) >> 1;
    const edgeStart = behavior.edgeTargets.length;
    const actionCount = behavior.solution.actionChecks.length;
    reservePool(behavior.edgeTargets, edgeStart + count);
    reservePool(behavior.edgeActions, (edgeStart + count) * actionCount);
    const targets = behavior.edgeTargets.data;
    const actions = behavior.edgeActions.data;
    for (let edge = 0; edge < count; edge++) {
      targets[edgeStart + edge] = edgeStack.data[start + 2 * edge];
      const from = edgeStack.data[start + 2 * edge + 1] * actionCount;
      const to = (edgeStart + edge) * actionCount;
      for (let position = 0; position < actionCount; position++) {
        actions[to + position] = actionResults[from + position];
      }
    }
    const stateCount = behavior.solution.stateChecks.length;
    writeToPool(
      behavior.stateResults,
      behavior.nodeStates.data[node] * stateCount,
      stateResults,
      0,
      stateCount,
    );
    behavior.edgeStarts.data[node] = edgeStart;
    behavior.edgeCounts.data[node] = count;
    edgeStack.length = start;
  };

  // The arrays addState fills for the state it adds, which the expansions it reaches don't use.
  const scratch = {
    rows: createPool((length) => new Int8Array(length)),
    edges: createPool((length) => new Int8Array(length)),
    actionResults: createPool((length) => new Uint8Array(length)),
    stateResults: createPool((length) => new Uint8Array(length)),
    consistency: createPool((length) => new Uint8Array(length)),
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
    const stateResults = evaluateFrom(index, () => checkState(behavior, state, row, offset));
    const tableauNode = tableau.nodes[behavior.nodeTableaux.data[node]];
    const actionCount = behavior.checks.actions.length;
    const start = edgeStack.length;
    const list = startList();
    const selfResults = new Uint8Array(actionCount);
    if (tableauNode.successors.length > 0) {
      evaluateFrom(index, () =>
        checkAction(behavior, state, row, offset, state, createEdgeRows(1), 0, selfResults, 0),
      );
    }
    for (const next of tableauNode.successors) {
      if (!isConsistent(behavior, next, index, state, row, offset)) continue;
      if (
        isAccepting(tableau, next) &&
        behavior.errorNode === undefined &&
        behavior.solution.models.some(isEmptyModel)
      ) {
        behavior.errorNode = node;
        edgeStack.length = start;
        return;
      }
      const existing = getNodeId(behavior, index, next);
      if (existing !== undefined && isListed(existing, list)) continue;
      const target = existing ?? recordNode(behavior, index, next);
      pushEdge(target, 0, list);
      if (existing !== undefined) continue;
      expandLate(behavior, tableau, state, index, target, row, offset);
      relist(start, list);
    }
    const nextStates = search.getSuccessors(index, state);
    // The results of the step to the state itself come first, then those of each successor.
    const actionResults = new Uint8Array((nextStates.length + 1) * actionCount);
    actionResults.set(selfResults);
    const edges = createEdgeRows(nextStates.length);
    nextStates.forEach((successor, position) => {
      const successorRow = createRows(1);
      evaluateFrom(index, () =>
        checkAction(
          behavior,
          state,
          row,
          offset,
          successor.state,
          edges,
          position * actionIds.size,
          actionResults,
          (position + 1) * actionCount,
        ),
      );
      const isSuccessorDone = isDone(behavior, successor.index);
      for (const next of tableauNode.successors) {
        if (!isConsistent(behavior, next, index, successor.state, successorRow, 0)) continue;
        // Deviation from TLC: TLC records the node of a successor the search never stored, which it never expands.
        if (successor.index === -1) continue;
        const existing = getNodeId(behavior, successor.index, next);
        if (existing !== undefined && isListed(existing, list)) continue;
        const target = existing ?? recordNode(behavior, successor.index, next);
        pushEdge(target, position + 1, list);
        if (existing !== undefined || !isSuccessorDone) continue;
        expandLate(behavior, tableau, successor.state, successor.index, target, successorRow, 0);
        relist(start, list);
      }
    });
    if (edgeStack.length > start) writeNode(behavior, node, start, actionResults, stateResults);
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
    const consistency = resetPool(scratch.consistency, tableau.nodes.length * set.length, 0);
    evaluateFrom(index, () => {
      for (let node = 0; node < tableau.nodes.length; node++) {
        for (let position = 0; position < set.length; position++) {
          if (holdsNode(behavior, node, set[position].state, rows, position * atomCount)) {
            consistency[node * set.length + position] = 1;
          }
        }
      }
    });
    setDone(behavior, index);
    // TLC expands the nodes recorded before the loop, not the ones the loop records.
    const last = behavior.lastNodes.data[index] ?? NO_NODE;
    for (
      let node = last === NO_NODE ? NO_NODE : behavior.firstNodes.data[index];
      node !== NO_NODE;
      node = node === last ? NO_NODE : behavior.nextSiblings.data[node]
    ) {
      const start = edgeStack.length;
      const list = startList();
      const tableauSuccessors = tableau.nodes[behavior.nodeTableaux.data[node]].successors;
      for (let position = 0; position < set.length; position++) {
        const successor = set[position];
        const isSuccessorDone = isDone(behavior, successor.index);
        for (const next of tableauSuccessors) {
          if (consistency[next * set.length + position] === 0) continue;
          const existing = getNodeId(behavior, successor.index, next);
          if (existing !== undefined && isListed(existing, list)) continue;
          const target = existing ?? recordNode(behavior, successor.index, next);
          pushEdge(target, position, list);
          if (existing !== undefined || !isSuccessorDone) continue;
          expandLate(
            behavior,
            tableau,
            successor.state,
            successor.index,
            target,
            rows,
            position * atomCount,
          );
          relist(start, list);
        }
      }
      writeNode(behavior, node, start, actionResults, stateResults);
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
    const start = edgeStack.length;
    const list = startList();
    for (let position = 0; position < set.length; position++) {
      const target = set[position].index;
      if (isWritten(behavior, target) && isListed(target, list)) continue;
      pushEdge(target, position, list);
    }
    writeNode(behavior, index, start, actionResults, stateResults);
  };

  const getPath = (behavior: BehaviorGraph<State>, target: number) => {
    if (behavior.initial.includes(target)) return [target];
    // The node each node was first reached from, or ROOT for an initial node.
    const parents = new Int32Array(behavior.nodeStates.length).fill(UNVISITED);
    const queue: number[] = [];
    for (const node of behavior.initial) {
      if (!isWritten(behavior, node)) continue;
      queue.push(node);
      parents[node] = ROOT;
    }
    for (let position = 0; position < queue.length; position++) {
      const current = queue[position];
      for (const next of getNodeSuccessors(behavior, current)) {
        if (next === current && behavior.solution.tableau) continue;
        if (next === target) {
          const path = [target];
          for (let node = current; node !== ROOT; node = parents[node]) path.push(node);
          return path;
        }
        if (!isWritten(behavior, next) || parents[next] !== UNVISITED) continue;
        parents[next] = current;
        queue.push(next);
      }
    }
    throw new TlaEvaluationError(`Couldn't re-create liveness trace (path) starting at: ${target}`);
  };

  const getStatePath = (behavior: BehaviorGraph<State>, target: number) =>
    removeRepeats(
      getPath(behavior, target)
        .reverse()
        .map((node) => behavior.nodeStates.data[node]),
    );

  const findLassoInModel = (
    behavior: BehaviorGraph<State>,
    model: Solution["models"][number],
  ): Lasso | undefined => {
    const solution = behavior.solution;
    const actionCount = solution.actionChecks.length;
    const nodeCount = behavior.nodeStates.length;
    const nodeStates = behavior.nodeStates.data;
    const getAction = (node: number, edge: number, position: number) =>
      behavior.edgeActions.data[
        (behavior.edgeStarts.data[node] + edge) * actionCount + position
      ] === 1;
    const isAllowed = (node: number, edge: number) =>
      model.eventuallyAlways.every((position) => getAction(node, edge, position));
    const links = new Int32Array(nodeCount).fill(UNVISITED);
    const queue = behavior.initial.filter((node) => isWritten(behavior, node));
    const components: number[] = [];
    // The members of the component last checked, in the order they leave the stack, each marked
    // with the component's root plus one.
    const members: number[] = [];
    const memberRoots = new Int32Array(nodeCount);
    const isMember = (node: number, root: number) => memberRoots[node] === root + 1;

    const isStuttering = (node: number) => {
      const edge = getNodeSuccessors(behavior, node).indexOf(node);
      return edge !== -1 && isAllowed(node, edge);
    };
    const isFulfilled = (node: number, promise: Solution["promises"][number]) =>
      solution.tableau !== undefined &&
      isFulfilling(solution.tableau.nodes[behavior.nodeTableaux.data[node]].particle, promise);

    const checkComponent = (root: number) => {
      const top = components.pop() ?? root;
      if (top === root && !isStuttering(top)) {
        links[top] = MAXIMUM_LINK;
        return undefined;
      }
      members.length = 0;
      for (let member = top; ; member = components.pop() ?? root) {
        members.push(member);
        memberRoots[member] = root + 1;
        links[member] = MAXIMUM_LINK;
        if (member === root) break;
      }
      const isStateSatisfied = model.infinitelyOftenStates.every((position) =>
        members.some((node) => getStateResult(behavior, node, position)),
      );
      const isActionSatisfied = model.infinitelyOftenActions.every((position) =>
        members.some((node) =>
          getNodeSuccessors(behavior, node).some(
            (next, edge) =>
              isMember(next, root) && isAllowed(node, edge) && getAction(node, edge, position),
          ),
        ),
      );
      const isPromiseSatisfied = solution.promises.every((promise) =>
        members.some((node) => isFulfilled(node, promise)),
      );
      if (!isStateSatisfied || !isActionSatisfied || !isPromiseSatisfied) return undefined;
      return getLasso(root);
    };

    const getLasso = (root: number) => {
      const stateCount = Math.max(behavior.firstNodes.length, nodeCount);
      // The members of each state, in the order of members.
      const firstMembers = new Int32Array(stateCount).fill(NO_NODE);
      const lastMembers = new Int32Array(stateCount).fill(NO_NODE);
      const nextMembers = new Int32Array(nodeCount).fill(NO_NODE);
      for (const member of members) {
        const state = nodeStates[member];
        if (lastMembers[state] === NO_NODE) firstMembers[state] = member;
        else nextMembers[lastMembers[state]] = member;
        lastMembers[state] = member;
      }
      const isMemberState = (state: number) => firstMembers[state] !== NO_NODE;
      const prefix = getStatePath(behavior, root);
      const cycleStack: number[] = [];
      // The nodes visited since the cycle last met a condition, marked with the number of
      // conditions met so far.
      const seen = new Int32Array(nodeCount).fill(-1);
      const stateDone = model.infinitelyOftenStates.map(() => false);
      const actionDone = model.infinitelyOftenActions.map(() => false);
      const promiseDone = solution.promises.map(() => false);
      const conditionCount = stateDone.length + actionDone.length + promiseDone.length;
      let remainingCount = conditionCount;
      seen[root] = 0;
      const isSeen = (node: number) => seen[node] === conditionCount - remainingCount;
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
            if (isMemberState(nodeStates[next])) {
              if (!isMember(next, root) || !isAllowed(currentNode, edge)) return false;
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
              return true;
            }
            if (isMember(next, root) && !isSeen(next)) unvisitedNext = next;
            return false;
          });
          if (isTaken) break;
          if (remainingCount < countAtStart) {
            moveTo(lastNext);
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
                (next) => isMember(next, root) && !isSeen(next),
              ) ?? -1;
          }
          moveTo(unvisitedNext);
          seen[unvisitedNext] = conditionCount - remainingCount;
        }
      }
      const postfix = getClosingPath(root, currentNode, firstMembers, nextMembers);
      for (let position = cycleStack.length - 1; position >= 0; position--) {
        const state = nodeStates[cycleStack[position]];
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

    // The states of a path through the component's members from end's state to root, last first.
    const getClosingPath = (
      root: number,
      end: number,
      firstMembers: Int32Array,
      nextMembers: Int32Array,
    ) => {
      if (end === root) return [];
      const start = nodeStates[end];
      const parents = new Int32Array(firstMembers.length).fill(-1);
      const isQueued = new Uint8Array(firstMembers.length);
      isQueued[start] = 1;
      // Pairs of a state and the state it was reached from.
      const queue: number[] = [];
      for (let state = start, parent = -1, position = 0; ; position += 2) {
        for (let node = firstMembers[state]; node !== NO_NODE; node = nextMembers[node]) {
          const successors = getNodeSuccessors(behavior, node);
          for (let edge = 0; edge < successors.length; edge++) {
            const next = successors[edge];
            if (next === node || !isAllowed(node, edge)) continue;
            if (next === root) {
              const path: number[] = [];
              for (let item = state, itemParent = parent; item !== start;) {
                path.push(item);
                item = itemParent;
                itemParent = parents[item];
              }
              path.push(start);
              return path;
            }
            const nextState = nodeStates[next];
            if (firstMembers[nextState] === NO_NODE || isQueued[nextState] === 1) continue;
            isQueued[nextState] = 1;
            queue.push(nextState, state);
          }
        }
        parents[state] = parent;
        if (position >= queue.length) {
          throw new TlaEvaluationError(
            "TLC failed to build the counterexample of a liveness property",
          );
        }
        state = queue[position];
        parent = queue[position + 1];
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
    addState: (index, state, successors) => {
      const set = getSuccessorSet(index, state, successors);
      const rows = resetPool(scratch.rows, set.length * stateAtoms.size, -1);
      // The set holds the state itself, as a successor of the same index.
      const offset = set.findIndex((successor) => successor.index === index) * stateAtoms.size;
      const edges = resetPool(scratch.edges, set.length * actionIds.size, -1);
      for (const behavior of behaviors) {
        const actionCount = behavior.checks.actions.length;
        const actionResults = resetPool(scratch.actionResults, set.length * actionCount, 0);
        const stateResults = evaluateFrom(index, () => {
          for (let position = 0; position < set.length; position++) {
            checkAction(
              behavior,
              state,
              rows,
              offset,
              set[position].state,
              edges,
              position * actionIds.size,
              actionResults,
              position * actionCount,
            );
          }
          return checkState(
            behavior,
            state,
            rows,
            offset,
            resetPool(scratch.stateResults, behavior.checks.states.length, 0),
          );
        });
        const tableau = behavior.solution.tableau;
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
