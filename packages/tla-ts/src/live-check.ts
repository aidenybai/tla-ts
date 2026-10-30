import { TlaEvaluationError } from "./errors";
import { hasRepeatedEffects, type Environment } from "./evaluate";
import {
  evaluateLive,
  TAUTOLOGY_MESSAGE,
  evaluateOnLasso,
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
}

export interface LivenessChecker {
  addInitialState: (index: number, state: Value[]) => void;
  addState: (index: number, state: Value[], successors: LiveSuccessor[]) => number[] | undefined;
  findViolation: () => Lasso | undefined;
  getViolatedProperties: (path: Value[][], cycleStart: number) => string[];
}

export interface LiveGraph {
  getFingerprint: (index: number) => number;
  getSuccessors: (state: Value[]) => LiveSuccessor[];
}

// TLC's behavior graph for one solution: a node per state, or per state and tableau node.
interface Check {
  solution: Solution;
  // One id per distinct action check across the solutions.
  actionIds: Int32Array;
  nodeStates: number[];
  nodeTableaux: number[];
  // The successors a node gathers until it is written.
  pending: (number[] | undefined)[];
  // Each written node's state results, then its action results edge by edge, from the node's
  // offset in one buffer, so a node costs no objects of its own. An unwritten node has offset -1.
  offsets: number[];
  results: { bytes: Uint8Array; length: number };
  // Each written node's successor count, then its successors, from the node's edge offset.
  edgeOffsets: number[];
  edges: { ids: Int32Array; length: number };
  initial: number[];
  nodeIds: NodeTable;
  isDone: boolean[];
  errorNode: number | undefined;
}

const isSameState = (left: Value[], right: Value[]) =>
  left.every((value, position) => isSameValue(value, right[position]));

const removeRepeats = (path: number[]) =>
  path.filter((node, position) => position === 0 || path[position - 1] !== node);

// A node owns one entry in each of its check's per-node arrays.
const pushNode = (check: Check, state: number, tableauNode: number) => {
  check.nodeStates.push(state);
  check.nodeTableaux.push(tableauNode);
  check.pending.push(undefined);
  check.offsets.push(-1);
  check.edgeOffsets.push(-1);
  return check.nodeStates.length - 1;
};

// A Map holds at most 2^24 entries, so each tableau node of a state finds its node in an
// open-addressing table of (state plus one, tableau node, node) triples.
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
    if (stored === 0 || (stored === state + 1 && table.slots[slot + 1] === tableauNode))
      return slot;
  }
};

const isWritten = (check: Check, node: number) => check.offsets[node] !== -1;

const getPending = (check: Check, node: number) => (check.pending[node] ??= []);

const getSuccessors = (check: Check, node: number) => {
  const offset = check.edgeOffsets[node];
  return check.edges.ids.subarray(offset + 1, offset + 1 + check.edges.ids[offset]);
};

const getStateResult = (check: Check, node: number, position: number) =>
  check.results.bytes[check.offsets[node] + position] === 1;

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
    throw new TlaEvaluationError(TAUTOLOGY_MESSAGE);
  }
  const actionIds = new Map<string, number>();
  const checks = solutions.map((solution): Check => ({
    solution,
    actionIds: Int32Array.from(solution.actionChecks, (predicate) => {
      const key = getTermKey(predicate);
      const id = actionIds.get(key) ?? actionIds.size;
      actionIds.set(key, id);
      return id;
    }),
    nodeStates: [],
    nodeTableaux: [],
    pending: [],
    offsets: [],
    results: { bytes: new Uint8Array(1024), length: 0 },
    edgeOffsets: [],
    edges: { ids: new Int32Array(1024), length: 0 },
    initial: [],
    nodeIds: { slots: new Int32Array(3 << 10), size: 0, shift: 22 },
    isDone: [],
    errorNode: undefined,
  }));
  const capacity = { multiplier: 1 };

  // TLC evaluates every check on its own. Without side effects the order can't show, so the
  // checks of one state share their results.
  const isShared = !hasRepeatedEffects(environment);
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
      environment,
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
          evaluateLive(predicate, state, successor, environment, new Map()) ? 1 : 0,
        );
      }
      const stateCache = getStateCache(state);
      const results = shared.actions.get(state) ?? new Map<Value[], Int8Array>();
      shared.actions.set(state, results);
      const known = results.get(successor) ?? new Int8Array(actionIds.size).fill(-1);
      results.set(successor, known);
      return Uint8Array.from(check.actionIds, (id, position) => {
        if (known[id] === -1) {
          known[id] = evaluateLive(predicates[position], state, successor, environment, stateCache)
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

  const getNodeId = (check: Check, state: number, tableauNode: number) => {
    if (!check.solution.tableau) return state;
    const slots = check.nodeIds.slots;
    const slot = getNodeSlot(check.nodeIds, state, tableauNode);
    return slots[slot] === 0 ? undefined : slots[slot + 2];
  };
  const recordNode = (check: Check, state: number, tableauNode: number) => {
    const node = pushNode(check, state, tableauNode);
    const table = check.nodeIds;
    if (++table.size * 2 > table.slots.length / 3) {
      const old = table.slots;
      table.slots = new Int32Array(old.length * 2);
      table.shift--;
      for (let slot = 0; slot < old.length; slot += 3) {
        if (old[slot] !== 0)
          table.slots.set(
            old.subarray(slot, slot + 3),
            getNodeSlot(table, old[slot] - 1, old[slot + 1]),
          );
      }
    }
    table.slots.set([state + 1, tableauNode, node], getNodeSlot(table, state, tableauNode));
    return node;
  };
  // A state's nodes in the order they were recorded, which is the order of their ids.
  const getStateNodes = (check: Check, tableau: Tableau, state: number) =>
    tableau.nodes
      .flatMap((_, tableauNode) => getNodeId(check, state, tableauNode) ?? [])
      .sort((left, right) => left - right);
  const writeNode = (
    check: Check,
    node: number,
    actions: Uint8Array[],
    stateResults: Uint8Array,
  ) => {
    const actionCount = check.solution.actionChecks.length;
    const results = check.results;
    const offset = results.length;
    results.length += stateResults.length + actions.length * actionCount;
    if (results.length > results.bytes.length) {
      const grown = new Uint8Array(Math.max(2 * results.bytes.length, results.length));
      grown.set(results.bytes);
      results.bytes = grown;
    }
    results.bytes.set(stateResults, offset);
    actions.forEach((edge, position) =>
      results.bytes.set(edge, offset + stateResults.length + position * actionCount),
    );
    check.offsets[node] = offset;
    const successors = check.pending[node] ?? [];
    const edges = check.edges;
    const edgeOffset = edges.length;
    edges.length += successors.length + 1;
    if (edges.length > edges.ids.length) {
      const grown = new Int32Array(Math.max(2 * edges.ids.length, edges.length));
      grown.set(edges.ids);
      edges.ids = grown;
    }
    edges.ids[edgeOffset] = successors.length;
    edges.ids.set(successors, edgeOffset + 1);
    check.edgeOffsets[node] = edgeOffset;
    check.pending[node] = undefined;
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
    const successors = getPending(check, node);
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
    if (successors.length > 0) writeNode(check, node, actions, stateResults);
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
    for (const node of getStateNodes(check, tableau, index)) {
      const successors = getPending(check, node);
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
      writeNode(check, node, actions, stateResults);
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
    const successors = getPending(check, index);
    const actions: Uint8Array[] = [];
    set.forEach((successor, position) => {
      if (isWritten(check, successor.index) && successors.includes(successor.index)) return;
      successors.push(successor.index);
      actions.push(actionResults[position]);
    });
    writeNode(check, index, actions, stateResults);
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
    const stateCount = solution.stateChecks.length;
    const getAction = (node: number, edge: number, position: number) =>
      check.results.bytes[check.offsets[node] + stateCount + edge * actionCount + position] === 1;
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
          const successors = getSuccessors(check, current.node);
          const taken = successors.some((next, edge) => {
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
      return { prefix: prefix.slice(0, -1), cycle: [cycleState, ...postfix.reverse()] };
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
    addState: (index, state, successors) => {
      shared.states.clear();
      shared.actions.clear();
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
