import { TlaEvaluationError } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { hasRepeatedEffects, type Environment } from "./evaluate";
import {
  evaluateLive,
  evaluateOnLasso,
  toLiveExpression,
  type ScopedExpression,
  type TemporalProperty,
} from "./liveness";
import {
  createJunction,
  createUnary,
  getSolutions,
  isFulfilling,
  type LiveExpression,
  type Solution,
  type Tableau,
} from "./tableau";
import { isSameValue, type Value } from "./values";

export interface LiveSuccessor {
  index: number;
  state: Value[];
}

export interface Lasso {
  prefix: number[];
  cycle: number[];
  // Whether the solution that the lasso violates constrains the cycle, as a liveness property does.
  // TLC warns that a stuttering counterexample to one may come from a missing fairness constraint.
  isCycleConstrained: boolean;
}

export interface LivenessChecker {
  // How many solutions of the negated properties TLC checks, which it calls branches.
  branches: number;
  addInitialState: (index: number, state: Value[]) => void;
  // With a tracing environment, the checks record their call stack as TLC's replay of a failed
  // check does.
  addState: (
    index: number,
    state: Value[],
    successors: LiveSuccessor[],
    tracing?: Environment,
  ) => number[] | undefined;
  findViolation: () => Lasso | undefined;
  getViolatedProperties: (path: Value[][], cycleStart: number) => string[];
}

export interface LiveGraph {
  getFingerprint: (index: number) => number;
  getSuccessors: (state: Value[]) => LiveSuccessor[];
}

// Numbers in a typed array that doubles as it fills, so a graph of millions of nodes takes a few
// bytes for each.
interface Pool<Data extends Int32Array | Uint8Array> {
  data: Data;
  length: number;
  create: (length: number) => Data;
}

// TLC's behavior graph for one solution: a node per state, or per state and tableau node.
interface Check {
  solution: Solution;
  // One id per distinct action check across the solutions.
  actionIds: Int32Array;
  nodeStates: number[];
  nodeTableaux: number[];
  // Where a node's edges start in edgeTargets, or UNWRITTEN until TLC writes the node with its
  // successors, and how many it has.
  edgeStarts: number[];
  edgeCounts: number[];
  edgeTargets: Pool<Int32Array>;
  // The results of the action checks on each edge, and of the state checks on each state, which
  // are the same for every node of the state.
  edgeActions: Pool<Uint8Array>;
  stateResults: Pool<Uint8Array>;
  initial: number[];
  // The nodes of each state in the order the check records them, a list through nextSiblings.
  firstNodes: Pool<Int32Array>;
  lastNodes: Pool<Int32Array>;
  nextSiblings: number[];
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

// TLC's OrderOfSolution#hasEmptyPEMAndBoxFreePromises, negated.
const isCycleConstrained = (solution: Solution) =>
  solution.promises.some((promise) => containsAlways(promise.body)) ||
  solution.models.some(
    (model) =>
      model.eventuallyAlways.length > 0 ||
      model.infinitelyOftenStates.length > 0 ||
      model.infinitelyOftenActions.length > 0,
  );

const liveKeys = new WeakMap<LiveExpression, string>();

const atomCount = { value: 0 };

// Each solution builds its own junctions over shared atoms, so equal checks get equal keys.
const getLiveKey = (expression: LiveExpression): string => {
  const cached = liveKeys.get(expression);
  if (cached !== undefined) return cached;
  const key =
    expression.kind === "Boolean"
      ? String(expression.value)
      : "body" in expression
        ? `${expression.kind}(${getLiveKey(expression.body)})`
        : "operands" in expression
          ? `${expression.kind}(${expression.operands.map(getLiveKey).join(",")})`
          : `${expression.kind}#${atomCount.value++}`;
  liveKeys.set(expression, key);
  return key;
};

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

const createNodes = (length: number) => new Int32Array(length).fill(NO_NODE);

const UNWRITTEN = -1;

const isWritten = (check: Check, node: number) =>
  (check.edgeStarts[node] ?? UNWRITTEN) !== UNWRITTEN;

const getSuccessors = (check: Check, node: number) => {
  const start = check.edgeStarts[node];
  return check.edgeTargets.data.subarray(start, start + check.edgeCounts[node]);
};

const getStateResult = (check: Check, node: number, position: number) =>
  check.stateResults.data[check.nodeStates[node] * check.solution.stateChecks.length + position] ===
  1;

// A node owns one entry in each of its check's per-node arrays.
const pushNode = (check: Check, state: number, tableauNode: number) => {
  check.nodeStates.push(state);
  check.nodeTableaux.push(tableauNode);
  check.edgeStarts.push(UNWRITTEN);
  check.edgeCounts.push(0);
  check.nextSiblings.push(NO_NODE);
  return check.nodeStates.length - 1;
};

// The nodes of the state, in the order the check recorded them.
const getStateNodes = (check: Check, state: number) => {
  const nodes: number[] = [];
  for (
    let node = check.firstNodes.data[state] ?? NO_NODE;
    node !== NO_NODE;
    node = check.nextSiblings[node]
  ) {
    nodes.push(node);
  }
  return nodes;
};

const SUCCESSOR_CAPACITY = 16;

const SCC_MARKER = -42;

const UNVISITED = -1;

const MAXIMUM_LINK = Number.MAX_SAFE_INTEGER;

export const createLivenessChecker = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
  graph: LiveGraph,
): LivenessChecker | undefined => {
  if (properties.length === 0) return undefined;
  const fairness = temporals.map((item) =>
    toLiveExpression(item.expression, item.scope, environment),
  );
  const negations = properties.map((property) =>
    createUnary("Not", toLiveExpression(property.expression, property.scope, environment)),
  );
  const violation = negations.length === 1 ? negations[0] : createJunction("Or", negations);
  const formula =
    fairness.length === 0 ? violation : createJunction("And", [...fairness, violation]);
  const solutions = getSolutions(formula);
  if (solutions.length === 0) {
    throw setExitCode(
      new TlaEvaluationError("Temporal formula is a tautology (its negation is unsatisfiable)."),
      EXIT_STATUS.livenessEvaluationFailure,
    );
  }
  const actionIds = new Map<string, number>();
  const checks = solutions.map((solution): Check => ({
    solution,
    actionIds: Int32Array.from(solution.actionChecks, (predicate) => {
      const key = getLiveKey(predicate);
      const id = actionIds.get(key) ?? actionIds.size;
      actionIds.set(key, id);
      return id;
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
    isDone: [],
    errorNode: undefined,
  }));
  const capacity = { multiplier: 1 };

  // TLC evaluates every check on its own. Without side effects the order can't show, so the
  // checks of one state share their results.
  const isShared = !hasRepeatedEffects(environment);
  const evaluation = { environment };
  const shared = {
    states: new Map<Value[], Map<LiveExpression, boolean>>(),
    actions: new Map<Value[], Map<Value[], Int8Array>>(),
  };
  const getStateCache = (state: Value[]) => {
    const cache = shared.states.get(state) ?? new Map<LiveExpression, boolean>();
    shared.states.set(state, cache);
    return cache;
  };
  // TLCGet("level") reads the level of the state whose successors the checks run on.
  const evaluateFrom = <Result>(source: number | undefined, evaluate: () => Result) => {
    environment.runtime.setLivenessSource(source);
    const result = evaluate();
    environment.runtime.setLivenessSource(undefined);
    return result;
  };
  const evaluateState = (predicate: LiveExpression, state: Value[]) =>
    evaluateLive(
      predicate,
      state,
      undefined,
      evaluation.environment,
      isShared ? getStateCache(state) : new Map(),
    );
  const checkState = (check: Check, source: number, state: Value[]) =>
    evaluateFrom(source, () =>
      Uint8Array.from(check.solution.stateChecks, (predicate) =>
        evaluateState(predicate, state) ? 1 : 0,
      ),
    );
  const checkAction = (check: Check, source: number, state: Value[], successor: Value[]) =>
    evaluateFrom(source, () => {
      const predicates = check.solution.actionChecks;
      if (!isShared) {
        return Uint8Array.from(predicates, (predicate) =>
          evaluateLive(predicate, state, successor, evaluation.environment, new Map()) ? 1 : 0,
        );
      }
      const stateCache = getStateCache(state);
      const results = shared.actions.get(state) ?? new Map<Value[], Int8Array>();
      shared.actions.set(state, results);
      const known = results.get(successor) ?? new Int8Array(actionIds.size).fill(-1);
      results.set(successor, known);
      return Uint8Array.from(check.actionIds, (id, position) => {
        if (known[id] === -1) {
          known[id] = evaluateLive(
            predicates[position],
            state,
            successor,
            evaluation.environment,
            stateCache,
          )
            ? 1
            : 0;
        }
        return known[id];
      });
    });
  const isConsistent = (
    tableau: Tableau,
    node: number,
    source: number | undefined,
    state: Value[],
  ) =>
    evaluateFrom(source, () =>
      tableau.nodes[node].statePredicates.every((predicate) => evaluateState(predicate, state)),
    );
  const isAccepting = (tableau: Tableau, node: number) => {
    const tableauNode = tableau.nodes[node];
    return (
      tableauNode.particle.length === 0 &&
      tableauNode.successors.length === 1 &&
      tableauNode.successors[0] === node
    );
  };
  const hasEmptyModel = (check: Check) =>
    check.solution.models.some(
      (model) =>
        model.eventuallyAlways.length === 0 &&
        model.infinitelyOftenStates.length === 0 &&
        model.infinitelyOftenActions.length === 0,
    );

  const getNodeId = (check: Check, state: number, tableauNode: number) =>
    check.solution.tableau
      ? getStateNodes(check, state).find((node) => check.nodeTableaux[node] === tableauNode)
      : state;
  const recordNode = (check: Check, state: number, tableauNode: number) => {
    const node = pushNode(check, state, tableauNode);
    const last = check.lastNodes.data[state] ?? NO_NODE;
    if (last === NO_NODE) writeToPool(check.firstNodes, state, [node]);
    else check.nextSiblings[last] = node;
    writeToPool(check.lastNodes, state, [node]);
    return node;
  };
  const writeNode = (
    check: Check,
    node: number,
    targets: number[],
    actions: Uint8Array[],
    stateResults: Uint8Array,
  ) => {
    const start = check.edgeTargets.length;
    const actionCount = check.solution.actionChecks.length;
    writeToPool(check.edgeTargets, start, targets);
    actions.forEach((results, position) =>
      writeToPool(check.edgeActions, (start + position) * actionCount, results),
    );
    writeToPool(check.stateResults, check.nodeStates[node] * stateResults.length, stateResults);
    check.edgeStarts[node] = start;
    check.edgeCounts[node] = targets.length;
  };

  // TLC collects a state's successors and the state itself in a SetOfStates, a hash set it
  // iterates in slot order. Its capacity starts at 16 times a factor that grows with every set
  // that outgrows it.
  const getSuccessorSet = (index: number, state: Value[], successors: LiveSuccessor[]) => {
    const table = {
      slots: Array.from<LiveSuccessor | undefined>({
        length: SUCCESSOR_CAPACITY * capacity.multiplier,
      }),
      count: 0,
    };
    const insert = (slots: (LiveSuccessor | undefined)[], successor: LiveSuccessor) => {
      for (
        let slot = (graph.getFingerprint(successor.index) & 0x7fffffff) % slots.length;
        ;
        slot = (slot + 1) % slots.length
      ) {
        const entry = slots[slot];
        if (entry === undefined) {
          slots[slot] = successor;
          return true;
        }
        if (entry.index === successor.index && isSameState(entry.state, successor.state))
          return false;
      }
    };
    const put = (successor: LiveSuccessor) => {
      if (table.count >= table.slots.length >> 1) {
        const old = table.slots;
        table.slots = Array.from<LiveSuccessor | undefined>({ length: 2 * old.length + 1 });
        for (const entry of old) if (entry) insert(table.slots, entry);
      }
      if (insert(table.slots, successor)) table.count++;
    };
    successors.forEach(put);
    put({ index, state });
    if (table.slots.length > SUCCESSOR_CAPACITY * capacity.multiplier) capacity.multiplier++;
    return table.slots.filter((entry): entry is LiveSuccessor => entry !== undefined);
  };

  // TLC's TableauLiveChecker#addNextState for a node it finds after it expanded the node's state.
  const expandLate = (
    check: Check,
    tableau: Tableau,
    state: Value[],
    index: number,
    node: number,
  ) => {
    const stateResults = checkState(check, index, state);
    const tableauNode = tableau.nodes[check.nodeTableaux[node]];
    const actions: Uint8Array[] = [];
    const successors: number[] = [];
    const selfActions =
      tableauNode.successors.length > 0
        ? checkAction(check, index, state, state)
        : new Uint8Array(0);
    for (const next of tableauNode.successors) {
      if (!isConsistent(tableau, next, index, state)) continue;
      if (isAccepting(tableau, next) && check.errorNode === undefined && hasEmptyModel(check)) {
        check.errorNode = node;
        return;
      }
      const existing = getNodeId(check, index, next);
      if (existing !== undefined && successors.includes(existing)) continue;
      const target = existing ?? recordNode(check, index, next);
      successors.push(target);
      actions.push(selfActions);
      if (existing === undefined) expandLate(check, tableau, state, index, target);
    }
    for (const successor of graph.getSuccessors(state)) {
      const successorActions = checkAction(check, index, state, successor.state);
      const isDone = check.isDone[successor.index] === true;
      for (const next of tableauNode.successors) {
        if (!isConsistent(tableau, next, index, successor.state)) continue;
        const existing = getNodeId(check, successor.index, next);
        if (existing !== undefined && successors.includes(existing)) continue;
        const target = existing ?? recordNode(check, successor.index, next);
        successors.push(target);
        actions.push(successorActions);
        if (existing === undefined && isDone) {
          expandLate(check, tableau, successor.state, successor.index, target);
        }
      }
    }
    if (successors.length > 0) writeNode(check, node, successors, actions, stateResults);
  };

  const addTableauState = (
    check: Check,
    tableau: Tableau,
    set: LiveSuccessor[],
    actionResults: Uint8Array[],
    stateResults: Uint8Array,
    index: number,
  ) => {
    const consistency = tableau.nodes.map((_, node) =>
      set.map((successor) => isConsistent(tableau, node, index, successor.state)),
    );
    check.isDone[index] = true;
    // TLC expands the nodes recorded before the loop, not the ones the loop records.
    for (const node of getStateNodes(check, index)) {
      const successors: number[] = [];
      const actions: Uint8Array[] = [];
      set.forEach((successor, position) => {
        const isDone = check.isDone[successor.index] === true;
        for (const next of tableau.nodes[check.nodeTableaux[node]].successors) {
          if (!consistency[next][position]) continue;
          const existing = getNodeId(check, successor.index, next);
          if (existing !== undefined && successors.includes(existing)) continue;
          const target = existing ?? recordNode(check, successor.index, next);
          successors.push(target);
          actions.push(actionResults[position]);
          if (existing === undefined && isDone) {
            expandLate(check, tableau, successor.state, successor.index, target);
          }
        }
      });
      writeNode(check, node, successors, actions, stateResults);
    }
    if (check.errorNode === undefined) return undefined;
    return removeRepeats(
      getPath(check, check.errorNode)
        .reverse()
        .map((node) => check.nodeStates[node]),
    );
  };

  const addPlainState = (
    check: Check,
    set: LiveSuccessor[],
    actionResults: Uint8Array[],
    stateResults: Uint8Array,
    index: number,
  ) => {
    while (check.nodeStates.length <= index) pushNode(check, check.nodeStates.length, -1);
    const successors: number[] = [];
    const actions: Uint8Array[] = [];
    set.forEach((successor, position) => {
      if (isWritten(check, successor.index) && successors.includes(successor.index)) return;
      successors.push(successor.index);
      actions.push(actionResults[position]);
    });
    writeNode(check, index, successors, actions, stateResults);
    return undefined;
  };

  // The shortest path from an initial node to the node, last node first, as TLC's getPath finds it.
  const getPath = (check: Check, target: number) => {
    if (check.initial.includes(target)) return [target];
    const parents = new Map<number, number>();
    const queue: number[] = [];
    for (const node of check.initial) {
      if (!isWritten(check, node)) continue;
      queue.push(node);
      parents.set(node, -1);
    }
    for (let position = 0; position < queue.length; position++) {
      const current = queue[position];
      for (const next of getSuccessors(check, current)) {
        if (next === current && check.solution.tableau) continue;
        if (next === target) {
          const path = [target];
          for (let node = current; node !== -1; node = parents.get(node) ?? -1) path.push(node);
          return path;
        }
        if (!isWritten(check, next) || parents.has(next)) continue;
        parents.set(next, current);
        queue.push(next);
      }
    }
    throw new TlaEvaluationError(`Couldn't re-create liveness trace (path) starting at: ${target}`);
  };

  // TLC's LiveWorker#checkSccs, a Tarjan search that pushes every successor of a node at once.
  const findInModel = (check: Check, model: Solution["models"][number]): Lasso | undefined => {
    const solution = check.solution;
    const actionCount = solution.actionChecks.length;
    const getAction = (node: number, edge: number, position: number) =>
      check.edgeActions.data[(check.edgeStarts[node] + edge) * actionCount + position] === 1;
    const isAllowed = (node: number, edge: number) =>
      model.eventuallyAlways.every((position) => getAction(node, edge, position));
    const links = new Float64Array(check.nodeStates.length).fill(UNVISITED);
    const queue = check.initial.filter((node) => isWritten(check, node));
    const components: number[] = [];

    const isStuttering = (node: number) => {
      const edge = getSuccessors(check, node).indexOf(node);
      return edge !== -1 && isAllowed(node, edge);
    };
    const isFulfilled = (node: number, promise: Solution["promises"][number]) =>
      solution.tableau !== undefined &&
      isFulfilling(solution.tableau.nodes[check.nodeTableaux[node]].particle, promise);

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
        const siblings = membersByState.get(check.nodeStates[member]);
        if (siblings) siblings.push(member);
        else membersByState.set(check.nodeStates[member], [member]);
        links[member] = MAXIMUM_LINK;
        if (member === root) break;
      }
      const isStateSatisfied = model.infinitelyOftenStates.every((position) =>
        [...members].some((node) => getStateResult(check, node, position)),
      );
      const isActionSatisfied = model.infinitelyOftenActions.every((position) =>
        [...members].some((node) =>
          getSuccessors(check, node).some(
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

    // TLC's LiveWorker#printTrace: a prefix to the root, a greedy walk through the component
    // until it satisfies every check, and a breadth-first path back to the root.
    const getLasso = (
      root: number,
      members: Set<number>,
      membersByState: Map<number, number[]>,
    ) => {
      const prefix = removeRepeats(
        getPath(check, root)
          .reverse()
          .map((node) => check.nodeStates[node]),
      );
      const cycleStack: number[] = [];
      const seen = new Set<number>([root]);
      const stateDone = model.infinitelyOftenStates.map(() => false);
      const actionDone = model.infinitelyOftenActions.map(() => false);
      const promiseDone = solution.promises.map(() => false);
      const remaining = { count: stateDone.length + actionDone.length + promiseDone.length };
      const current = { node: root };
      const isMember = (node: number) => members.has(node);
      const take = (next: number) => {
        cycleStack.push(current.node);
        current.node = next;
      };
      while (remaining.count > 0) {
        const countAtStart = remaining.count;
        while (true) {
          model.infinitelyOftenStates.forEach((position, slot) => {
            if (!stateDone[slot] && getStateResult(check, current.node, position)) {
              stateDone[slot] = true;
              remaining.count--;
            }
          });
          solution.promises.forEach((promise, position) => {
            if (!promiseDone[position] && isFulfilled(current.node, promise)) {
              promiseDone[position] = true;
              remaining.count--;
            }
          });
          if (remaining.count <= 0) break;
          const step = { last: -1, unvisited: -1 };
          const countBeforeActions = remaining.count;
          const taken = getSuccessors(check, current.node).some((next, edge) => {
            if (membersByState.has(check.nodeStates[next])) {
              if (!isMember(next) || !isAllowed(current.node, edge)) return false;
              step.last = next;
              model.infinitelyOftenActions.forEach((position, slot) => {
                if (!actionDone[slot] && getAction(current.node, edge, position)) {
                  actionDone[slot] = true;
                  remaining.count--;
                }
              });
            }
            if (remaining.count < countBeforeActions) {
              take(next);
              seen.clear();
              return true;
            }
            if (isMember(next) && !seen.has(next)) step.unvisited = next;
            return false;
          });
          if (taken) break;
          if (remaining.count < countAtStart) {
            take(step.last);
            seen.clear();
            break;
          }
          while (step.unvisited === -1) {
            const previous = cycleStack.pop();
            if (previous === undefined) {
              throw new TlaEvaluationError(
                "TLC failed to build the counterexample of a liveness property",
              );
            }
            current.node = previous;
            step.unvisited =
              getSuccessors(check, previous).find((next) => isMember(next) && !seen.has(next)) ??
              -1;
          }
          take(step.unvisited);
          seen.add(step.unvisited);
        }
      }
      const postfix = getClosingPath(root, current.node, membersByState, isAllowed);
      for (let position = cycleStack.length - 1; position >= 0; position--) {
        const state = check.nodeStates[cycleStack[position]];
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

    // TLC's LiveWorker#bfsPostFix, the states from the walk's end back to the root, last first.
    const getClosingPath = (
      root: number,
      end: number,
      membersByState: Map<number, number[]>,
      isAllowedEdge: (node: number, edge: number) => boolean,
    ) => {
      if (end === root) return [];
      const start = check.nodeStates[end];
      const parents = new Map<number, number>();
      const seen = new Set<number>([start]);
      const queue: [number, number][] = [];
      for (let state = start, parent = -1, position = 0; ; position++) {
        for (const node of membersByState.get(state) ?? []) {
          for (const [edge, next] of getSuccessors(check, node).entries()) {
            if (next === node || !isAllowedEdge(node, edge)) continue;
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
            const nextState = check.nodeStates[next];
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
      const counter = { link: 0 };
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
        links[node] = counter.link;
        stack.push(lowLink, node, SCC_MARKER);
        components.push(node);
        const nextLowLink = { value: counter.link++ };
        getSuccessors(check, node).forEach((next, edge) => {
          if (!isWritten(check, next)) return;
          if (!isAllowed(node, edge)) {
            if (links[next] === UNVISITED) queue.push(next);
            return;
          }
          if (links[next] === UNVISITED) stack.push(next, UNVISITED);
          else nextLowLink.value = Math.min(nextLowLink.value, links[next]);
        });
        stack.push(nextLowLink.value);
      }
    }
    return undefined;
  };

  return {
    branches: checks.length,
    addInitialState: (index, state) => {
      shared.states.clear();
      shared.actions.clear();
      for (const check of checks) {
        const tableau = check.solution.tableau;
        if (!tableau) {
          check.initial.push(index);
          continue;
        }
        for (let node = 0; node < tableau.initialCount; node++) {
          if (!isConsistent(tableau, node, undefined, state)) continue;
          check.initial.push(getNodeId(check, index, node) ?? recordNode(check, index, node));
        }
      }
    },
    addState: (index, state, successors, tracing) => {
      evaluation.environment = tracing ?? environment;
      shared.states.clear();
      shared.actions.clear();
      try {
        const set = getSuccessorSet(index, state, successors);
        for (const check of checks) {
          const actionResults = set.map((successor) =>
            checkAction(check, index, state, successor.state),
          );
          const stateResults = checkState(check, index, state);
          const tableau = check.solution.tableau;
          const accepted = tableau
            ? addTableauState(check, tableau, set, actionResults, stateResults, index)
            : addPlainState(check, set, actionResults, stateResults, index);
          if (accepted) return accepted;
        }
        return undefined;
      } finally {
        evaluation.environment = environment;
      }
    },
    findViolation: () => {
      for (const check of checks) {
        for (const model of check.solution.models) {
          const lasso = findInModel(check, model);
          if (lasso) return lasso;
        }
      }
      return undefined;
    },
    // TLC names every property that the counterexample violates, once each.
    getViolatedProperties: (path, cycleStart) => [
      ...new Set(
        properties
          .filter(
            (_, position) =>
              !evaluateOnLasso(negations[position].body, path, cycleStart, 0, environment),
          )
          .map((property) => property.name),
      ),
    ],
  };
};
