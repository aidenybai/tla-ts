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

type Check<State> = (state: State, row: Int8Array, next: State | undefined) => boolean;

interface BehaviorChecks<State> {
  states: Check<State>[];
  actions: Check<State>[];
  // The state predicates of each tableau node.
  nodes: Check<State>[][];
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
) => {
  const end = offset + values.length;
  if (end > pool.data.length) {
    const data = pool.create(Math.max(2 * pool.data.length, end));
    data.set(pool.data);
    pool.data = data;
  }
  pool.data.set(values, offset);
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
  const atoms = evaluation.atoms;
  const evaluateFrom = evaluation.evaluateFrom;
  const stateAtoms = new Map<LiveExpression, number>();
  const getAtomId = (atom: LiveExpression) => {
    const id = stateAtoms.get(atom) ?? stateAtoms.size;
    stateAtoms.set(atom, id);
    return id;
  };
  // A row holds whether each state atom holds of a state: 1 or 0, or -1 before it is evaluated.
  const createRow = () => new Int8Array(stateAtoms.size).fill(-1);
  // An edge row holds the result of each action check, shared by the behaviors that check it.
  const createEdgeRow = () => new Int8Array(actionIds.size).fill(-1);
  // Unless the checks share results, each check evaluates its atoms afresh.
  const getRow = (row: Int8Array) => (isShared ? row : createRow());
  const compileCheck = (expression: LiveExpression): Check<State> => {
    switch (expression.kind) {
      case "Boolean": {
        const value = expression.value;
        return () => value;
      }
      case "State":
      case "Enabled": {
        const id = getAtomId(expression);
        return (state, row) => {
          if (row[id] === -1) row[id] = atoms.holdsState(expression, state) ? 1 : 0;
          return row[id] === 1;
        };
      }
      case "Action": {
        const enabled = expression.enabled && getAtomId(expression.enabled);
        return (state, row, next) =>
          !(enabled !== undefined && row[enabled] === 0) &&
          next !== undefined &&
          atoms.holdsAction(expression, state, next);
      }
      case "Not": {
        const body = compileCheck(expression.body);
        return (state, row, next) => !body(state, row, next);
      }
      case "And": {
        const operands = expression.operands.map(compileCheck);
        return (state, row, next) => operands.every((operand) => operand(state, row, next));
      }
      case "Or": {
        const operands = expression.operands.map(compileCheck);
        return (state, row, next) => operands.some((operand) => operand(state, row, next));
      }
      case "Next": {
        const body = compileCheck(expression.body);
        return (state, _row, next) => body(next ?? state, createRow(), undefined);
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
      nodes: solution.tableau?.nodes.map((node) => node.statePredicates.map(compileCheck)) ?? [],
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
    errorNode: undefined,
  }));
  const checkState = (
    behavior: BehaviorGraph<State>,
    source: number,
    state: State,
    row: Int8Array,
  ) =>
    evaluateFrom(source, () =>
      Uint8Array.from(behavior.checks.states, (check) =>
        check(state, getRow(row), undefined) ? 1 : 0,
      ),
    );
  const checkAction = (
    behavior: BehaviorGraph<State>,
    source: number,
    state: State,
    row: Int8Array,
    successor: State,
    edge: Int8Array,
  ) =>
    evaluateFrom(source, () => {
      const actions = behavior.checks.actions;
      if (!isShared) {
        return Uint8Array.from(actions, (check) => (check(state, createRow(), successor) ? 1 : 0));
      }
      return Uint8Array.from(behavior.actionIds, (actionId, position) => {
        if (edge[actionId] === -1)
          edge[actionId] = actions[position](state, row, successor) ? 1 : 0;
        return edge[actionId];
      });
    });
  const isConsistent = (
    behavior: BehaviorGraph<State>,
    node: number,
    source: number | undefined,
    state: State,
    row: Int8Array,
  ) =>
    evaluateFrom(source, () =>
      behavior.checks.nodes[node].every((check) => check(state, getRow(row), undefined)),
    );
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
  const recordNode = (behavior: BehaviorGraph<State>, state: number, tableauNode: number) => {
    const node = pushNode(behavior, state, tableauNode);
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
    const last = behavior.lastNodes.data[state] ?? NO_NODE;
    if (last === NO_NODE) writeToPool(behavior.firstNodes, state, [node]);
    else behavior.nextSiblings[last] = node;
    writeToPool(behavior.lastNodes, state, [node]);
    return node;
  };
  const writeNode = (
    behavior: BehaviorGraph<State>,
    node: number,
    targets: number[],
    actions: Uint8Array[],
    stateResults: Uint8Array,
  ) => {
    const start = behavior.edgeTargets.length;
    const actionCount = behavior.solution.actionChecks.length;
    writeToPool(behavior.edgeTargets, start, targets);
    actions.forEach((results, position) =>
      writeToPool(behavior.edgeActions, (start + position) * actionCount, results),
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
  const getSuccessorSet = (index: number, state: State, successors: LiveSuccessor<State>[]) => {
    let successorSlots = Array.from<LiveSuccessor<State> | undefined>({
      length: SUCCESSOR_CAPACITY * capacityMultiplier,
    });
    let successorCount = 0;
    const insertSuccessor = (
      slots: (LiveSuccessor<State> | undefined)[],
      successor: LiveSuccessor<State>,
    ) => {
      for (
        let slot = (search.getFingerprint(successor) & 0x7fffffff) % slots.length;
        ;
        slot = (slot + 1) % slots.length
      ) {
        const entry = slots[slot];
        if (entry === undefined) {
          slots[slot] = successor;
          return true;
        }
        if (entry.index === successor.index && evaluation.isSame(entry.state, successor.state))
          return false;
      }
    };
    const addSuccessor = (successor: LiveSuccessor<State>) => {
      if (successorCount >= successorSlots.length >> 1) {
        const old = successorSlots;
        successorSlots = Array.from<LiveSuccessor<State> | undefined>({
          length: 2 * old.length + 1,
        });
        for (const entry of old) if (entry) insertSuccessor(successorSlots, entry);
      }
      if (insertSuccessor(successorSlots, successor)) successorCount++;
    };
    successors.forEach(addSuccessor);
    addSuccessor({ index, state });
    if (successorSlots.length > SUCCESSOR_CAPACITY * capacityMultiplier) capacityMultiplier++;
    return successorSlots.filter((entry): entry is LiveSuccessor<State> => entry !== undefined);
  };

  const expandLate = (
    behavior: BehaviorGraph<State>,
    tableau: Tableau,
    state: State,
    index: number,
    node: number,
    row: Int8Array,
  ) => {
    const stateResults = checkState(behavior, index, state, row);
    const tableauNode = tableau.nodes[behavior.nodeTableaux[node]];
    const actions: Uint8Array[] = [];
    const successors: number[] = [];
    const selfActions =
      tableauNode.successors.length > 0
        ? checkAction(behavior, index, state, row, state, createEdgeRow())
        : new Uint8Array(0);
    for (const next of tableauNode.successors) {
      if (!isConsistent(behavior, next, index, state, row)) continue;
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
      actions.push(selfActions);
      if (existing === undefined) expandLate(behavior, tableau, state, index, target, row);
    }
    for (const successor of search.getSuccessors(index, state)) {
      const successorRow = createRow();
      const successorActions = checkAction(
        behavior,
        index,
        state,
        row,
        successor.state,
        createEdgeRow(),
      );
      const isDone = behavior.isDone[successor.index] === true;
      for (const next of tableauNode.successors) {
        if (!isConsistent(behavior, next, index, successor.state, successorRow)) continue;
        // Deviation from TLC: TLC records the node of a successor the search never stored, which it never expands.
        if (successor.index === -1) continue;
        const existing = getNodeId(behavior, successor.index, next);
        if (existing !== undefined && successors.includes(existing)) continue;
        const target = existing ?? recordNode(behavior, successor.index, next);
        successors.push(target);
        actions.push(successorActions);
        if (existing === undefined && isDone) {
          expandLate(behavior, tableau, successor.state, successor.index, target, successorRow);
        }
      }
    }
    if (successors.length > 0) writeNode(behavior, node, successors, actions, stateResults);
  };

  const addTableauState = (
    behavior: BehaviorGraph<State>,
    tableau: Tableau,
    set: LiveSuccessor<State>[],
    rows: Int8Array[],
    actionResults: Uint8Array[],
    stateResults: Uint8Array,
    index: number,
  ) => {
    const consistency = tableau.nodes.map((_tableauNode, node) =>
      set.map((successor, position) =>
        isConsistent(behavior, node, index, successor.state, rows[position]),
      ),
    );
    behavior.isDone[index] = true;
    // TLC expands the nodes recorded before the loop, not the ones the loop records.
    for (const node of getStateNodes(behavior, index)) {
      const successors: number[] = [];
      const actions: Uint8Array[] = [];
      set.forEach((successor, position) => {
        const isDone = behavior.isDone[successor.index] === true;
        for (const next of tableau.nodes[behavior.nodeTableaux[node]].successors) {
          if (!consistency[next][position]) continue;
          const existing = getNodeId(behavior, successor.index, next);
          if (existing !== undefined && successors.includes(existing)) continue;
          const target = existing ?? recordNode(behavior, successor.index, next);
          successors.push(target);
          actions.push(actionResults[position]);
          if (existing === undefined && isDone) {
            expandLate(behavior, tableau, successor.state, successor.index, target, rows[position]);
          }
        }
      });
      writeNode(behavior, node, successors, actions, stateResults);
    }
    return behavior.errorNode === undefined
      ? undefined
      : getStatePath(behavior, behavior.errorNode);
  };

  const addPlainState = (
    behavior: BehaviorGraph<State>,
    set: LiveSuccessor<State>[],
    actionResults: Uint8Array[],
    stateResults: Uint8Array,
    index: number,
  ) => {
    while (behavior.nodeStates.length <= index) pushNode(behavior, behavior.nodeStates.length, -1);
    const successors: number[] = [];
    const actions: Uint8Array[] = [];
    set.forEach((successor, position) => {
      if (isWritten(behavior, successor.index) && successors.includes(successor.index)) return;
      successors.push(successor.index);
      actions.push(actionResults[position]);
    });
    writeNode(behavior, index, successors, actions, stateResults);
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
      const row = createRow();
      for (const behavior of behaviors) {
        const tableau = behavior.solution.tableau;
        if (!tableau) {
          behavior.initial.push(index);
          continue;
        }
        for (let node = 0; node < tableau.initialCount; node++) {
          if (!isConsistent(behavior, node, undefined, state, row)) continue;
          behavior.initial.push(
            getNodeId(behavior, index, node) ?? recordNode(behavior, index, node),
          );
        }
      }
    },
    addState: (index, state, successors) => {
      const set = getSuccessorSet(index, state, successors);
      const rows = set.map(createRow);
      // The set holds the state itself, as a successor of the same index.
      const row = rows[set.findIndex((successor) => successor.index === index)];
      const edges = set.map(createEdgeRow);
      for (const behavior of behaviors) {
        const actionResults = set.map((successor, position) =>
          checkAction(behavior, index, state, row, successor.state, edges[position]),
        );
        const stateResults = checkState(behavior, index, state, row);
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
