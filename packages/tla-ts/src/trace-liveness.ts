import { isSameState } from "./fingerprints";
import { evaluateLive, type LiveAtoms } from "./liveness";
import { isFulfilling, type LiveExpression, type Solution } from "./tableau";
import type { Value } from "./values";

interface GraphNode {
  fingerprint: bigint;
  tableau: number;
  position: number;
  stateChecks: boolean[];
  successors: GraphNode[];
  actionChecks: boolean[][];
  stepPositions: number[];
  number: number;
}

interface TraceChecks {
  getStates: (position: number) => boolean[];
  getSteps: (position: number) => boolean[];
  getStutters: (position: number) => boolean[];
  isConsistent: (tableauNode: number, position: number) => boolean;
}

interface BehaviorGraph {
  initial: GraphNode[];
  isPartial: boolean;
}

export interface TraceLasso {
  positions: number[];
  cyclePosition: number;
  backPosition: number | undefined;
}

const MAX_FIRST = 2 ** 50;
const MAX_SECOND = 2 ** 51;

const createNode = (
  fingerprint: bigint,
  tableau: number,
  position: number,
  stateChecks: boolean[],
): GraphNode => ({
  fingerprint,
  tableau,
  position,
  stateChecks,
  successors: [],
  actionChecks: [],
  stepPositions: [],
  number: 0,
});

const addTransition = (
  source: GraphNode,
  target: GraphNode,
  actionChecks: boolean[],
  position: number,
) => {
  source.successors.push(target);
  source.actionChecks.push(actionChecks);
  source.stepPositions.push(position);
};

const getStepTo = (source: GraphNode, target: GraphNode) =>
  source.stepPositions[source.successors.indexOf(target)];

const pop = (nodes: GraphNode[]) => {
  const top = nodes[nodes.length - 1];
  nodes.length -= 1;
  return top;
};

const createGraph = (
  fingerprints: bigint[],
  solution: Solution,
  checks: TraceChecks,
  isComplete: boolean,
): BehaviorGraph => {
  const graph: BehaviorGraph = { initial: [], isPartial: false };
  const tableau = solution.tableau;
  if (!tableau) {
    const nodes = new Map<bigint, GraphNode>();
    let source = createNode(fingerprints[0], -1, 0, checks.getStates(0));
    addTransition(source, source, checks.getStutters(0), 0);
    nodes.set(fingerprints[0], source);
    graph.initial.push(source);
    for (let position = 1; position < fingerprints.length; position++) {
      const existing = nodes.get(fingerprints[position]);
      if (existing === undefined) {
        const target = createNode(fingerprints[position], -1, position, checks.getStates(position));
        addTransition(target, target, checks.getStutters(position), position);
        addTransition(source, target, checks.getSteps(position), position);
        nodes.set(fingerprints[position], target);
        source = target;
        continue;
      }
      if (!source.successors.includes(existing)) {
        addTransition(source, existing, checks.getSteps(position), position);
      }
      source = existing;
    }
    return graph;
  }
  const rows = new Map<bigint, GraphNode[]>();
  const getRow = (fingerprint: bigint) => {
    const row = rows.get(fingerprint) ?? [];
    rows.set(fingerprint, row);
    return row;
  };
  const extend = (
    sources: GraphNode[],
    targets: GraphNode[],
    row: GraphNode[],
    position: number,
    stateChecks: boolean[],
    actionChecks: boolean[],
  ) => {
    for (let index = 0; index < sources.length; index++) {
      const source = sources[index];
      const successors = tableau.nodes[source.tableau].successors;
      for (let successor = 0; successor < successors.length; successor++) {
        const tableauNode = successors[successor];
        const existing = row[tableauNode];
        if (existing === undefined) {
          if (!checks.isConsistent(tableauNode, position)) continue;
          const target = createNode(fingerprints[position], tableauNode, position, stateChecks);
          addTransition(source, target, actionChecks, position);
          targets.push(target);
          row[tableauNode] = target;
          continue;
        }
        if (!source.successors.includes(existing)) {
          addTransition(source, existing, actionChecks, position);
        }
        if (existing.position === position) continue;
        graph.isPartial = true;
        if (isComplete && !targets.includes(existing)) targets.push(existing);
      }
    }
  };
  const initialRow = getRow(fingerprints[0]);
  const initialChecks = checks.getStates(0);
  const initialStutters = checks.getStutters(0);
  for (let tableauNode = 0; tableauNode < tableau.initialCount; tableauNode++) {
    if (!checks.isConsistent(tableauNode, 0)) continue;
    const node = createNode(fingerprints[0], tableauNode, 0, initialChecks);
    graph.initial.push(node);
    initialRow[tableauNode] = node;
  }
  for (const source of graph.initial) {
    for (const tableauNode of tableau.nodes[source.tableau].successors) {
      const target = initialRow[tableauNode];
      if (!target) {
        graph.isPartial = true;
        continue;
      }
      addTransition(source, target, initialStutters, 0);
    }
  }
  let sources = [...graph.initial];
  if (isComplete) extend(sources, sources, initialRow, 0, initialChecks, initialStutters);
  for (let position = 1; position < fingerprints.length; position++) {
    const row = getRow(fingerprints[position]);
    const stateChecks = checks.getStates(position);
    const targets: GraphNode[] = [];
    extend(sources, targets, row, position, stateChecks, checks.getSteps(position));
    extend(targets, targets, row, position, stateChecks, checks.getStutters(position));
    sources = targets;
  }
  return graph;
};

const findLasso = (
  fingerprints: bigint[],
  solution: Solution,
  initial: GraphNode[],
): TraceLasso | undefined => {
  const promises = solution.promises;
  const tableauNodes = solution.tableau?.nodes ?? [];
  const stack: GraphNode[] = [];
  let firstNumber = 1;
  let secondNumber = MAX_FIRST + 1;
  let thirdNumber = MAX_SECOND + 1;
  let startSecondNumber = secondNumber;
  let startThirdNumber = thirdNumber;
  let firstComponentNumber = secondNumber;
  let secondComponentNumber = thirdNumber;
  let model = solution.models[0];
  let lasso: TraceLasso | undefined;

  const isEventuallyAlways = (node: GraphNode, transition: number) => {
    const actionChecks = node.actionChecks[transition];
    const checks = model.eventuallyAlways;
    for (let index = 0; index < checks.length; index++) {
      if (!actionChecks[checks[index]]) return false;
    }
    return true;
  };
  const getLasso = (node: GraphNode): TraceLasso => {
    const cycle: GraphNode[] = [];
    const lowNumber = thirdNumber - 1;
    const states = model.infinitelyOftenStates;
    const actions = model.infinitelyOftenActions;
    const isStateFound = states.map(() => false);
    const isActionFound = actions.map(() => false);
    const isPromiseFound = promises.map(() => false);
    let count = states.length + actions.length + promises.length;
    let current = node;
    while (count > 0) {
      current.number = thirdNumber;
      const countBefore = count;
      search: while (true) {
        for (let index = 0; index < states.length; index++) {
          if (!isStateFound[index] && current.stateChecks[states[index]]) {
            isStateFound[index] = true;
            count--;
          }
        }
        for (let index = 0; index < promises.length; index++) {
          if (
            !isPromiseFound[index] &&
            isFulfilling(tableauNodes[current.tableau].particle, promises[index])
          ) {
            isPromiseFound[index] = true;
            count--;
          }
        }
        if (count <= 0) break;
        let inComponent: GraphNode | undefined;
        let unvisited: GraphNode | undefined;
        const countBeforeActions = count;
        for (let index = 0; index < current.successors.length; index++) {
          const target = current.successors[index];
          const targetNumber = target.number;
          if (lowNumber <= targetNumber && targetNumber <= thirdNumber) {
            inComponent = target;
            for (let action = 0; action < actions.length; action++) {
              if (!isActionFound[action] && current.actionChecks[index][actions[action]]) {
                isActionFound[action] = true;
                count--;
              }
            }
          }
          if (count < countBeforeActions) {
            cycle.push(current);
            current = target;
            thirdNumber++;
            break search;
          }
          if (lowNumber <= targetNumber && targetNumber < thirdNumber) unvisited = target;
        }
        if (count < countBefore && inComponent) {
          cycle.push(current);
          current = inComponent;
          thirdNumber++;
          break;
        }
        while (unvisited === undefined) {
          current = pop(cycle);
          for (let index = 0; index < current.successors.length; index++) {
            const target = current.successors[index];
            if (lowNumber <= target.number && target.number < thirdNumber) {
              cycle.push(current);
              unvisited = target;
              break;
            }
          }
        }
        cycle.push(current);
        current = unvisited;
        current.number = thirdNumber;
      }
    }
    thirdNumber++;
    current.number = thirdNumber;
    close: while (current !== node) {
      let isFound = false;
      for (let index = 0; index < current.successors.length; index++) {
        const target = current.successors[index];
        if (lowNumber <= target.number && target.number < thirdNumber) {
          cycle.push(current);
          if (target === node) break close;
          isFound = true;
          current = target;
          current.number = thirdNumber;
          break;
        }
      }
      if (!isFound) current = pop(cycle);
    }
    if (cycle.length === 0) cycle.push(current);
    // Deviation from TLC: LiveCheck1#printErrorTrace shows the behavior's states in order, not those of the lasso it found, which differ once the behavior revisits a state.
    const positions: number[] = [];
    for (let position = 0; position <= node.position; position++) {
      if (position === 0 || fingerprints[position] !== fingerprints[position - 1]) {
        positions.push(position);
      }
    }
    const cyclePosition = positions.length;
    for (let index = 1; index < cycle.length; index++) {
      if (cycle[index].fingerprint !== cycle[index - 1].fingerprint) {
        positions.push(getStepTo(cycle[index - 1], cycle[index]));
      }
    }
    const last = cycle[cycle.length - 1];
    // Deviation from TLC: LiveCheck1#printErrorTrace names the behavior's step after the lasso's last state as the step back, wherever it goes.
    return {
      positions,
      cyclePosition,
      backPosition: last.fingerprint === node.fingerprint ? undefined : getStepTo(last, node),
    };
  };
  const checkSubcomponent = (node: GraphNode) => {
    const states = model.infinitelyOftenStates;
    const actions = model.infinitelyOftenActions;
    const isStateFound = states.map(() => false);
    const isActionFound = actions.map(() => false);
    const isPromiseFound = promises.map(() => false);
    const pending = [node];
    node.number++;
    while (pending.length > 0) {
      const current = pop(pending);
      for (let index = 0; index < states.length; index++) {
        if (!isStateFound[index]) isStateFound[index] = current.stateChecks[states[index]];
      }
      for (let index = 0; index < current.successors.length; index++) {
        const target = current.successors[index];
        const targetNumber = target.number;
        if (targetNumber >= thirdNumber) {
          for (let action = 0; action < actions.length; action++) {
            if (!isActionFound[action]) {
              isActionFound[action] = current.actionChecks[index][actions[action]];
            }
          }
        }
        if (targetNumber === thirdNumber) {
          target.number++;
          pending.push(target);
        }
      }
      for (let index = 0; index < promises.length; index++) {
        if (isFulfilling(tableauNodes[current.tableau].particle, promises[index])) {
          isPromiseFound[index] = true;
        }
      }
    }
    thirdNumber += 2;
    if (
      lasso === undefined &&
      !isStateFound.includes(false) &&
      !isActionFound.includes(false) &&
      !isPromiseFound.includes(false)
    ) {
      lasso = getLasso(node);
    }
  };
  const canStutter = (node: GraphNode) => {
    const stutter = node.successors.indexOf(node);
    return (
      stutter !== -1 && firstComponentNumber <= node.number && isEventuallyAlways(node, stutter)
    );
  };
  const extractSubcomponent = (node: GraphNode) => {
    let popped = pop(stack);
    if (popped === node && !canStutter(node)) {
      node.number = thirdNumber++;
      return false;
    }
    popped.number = thirdNumber;
    while (popped !== node) {
      popped = pop(stack);
      popped.number = thirdNumber;
    }
    return true;
  };
  const checkSubcomponents = (node: GraphNode): number => {
    let lowlink = secondNumber++;
    node.number = lowlink;
    stack.push(node);
    for (let index = 0; index < node.successors.length; index++) {
      const target = node.successors[index];
      let targetNumber = target.number;
      if (firstComponentNumber <= targetNumber && isEventuallyAlways(node, index)) {
        if (
          targetNumber < startSecondNumber ||
          (secondComponentNumber <= targetNumber && targetNumber < startThirdNumber)
        ) {
          targetNumber = checkSubcomponents(target);
        }
        if (targetNumber < lowlink) lowlink = targetNumber;
      }
    }
    if (lowlink === node.number && extractSubcomponent(node)) checkSubcomponent(node);
    return lowlink;
  };
  const extractComponent = (node: GraphNode) => {
    let popped = pop(stack);
    if (popped === node && !node.successors.includes(node)) {
      node.number = MAX_FIRST;
      return undefined;
    }
    const nodes: GraphNode[] = [];
    firstComponentNumber = secondNumber++;
    secondComponentNumber = thirdNumber;
    popped.number = firstComponentNumber;
    nodes.push(popped);
    while (popped !== node) {
      popped = pop(stack);
      popped.number = firstComponentNumber;
      nodes.push(popped);
    }
    return nodes;
  };
  const checkComponent = (node: GraphNode) => {
    const nodes = extractComponent(node);
    if (!nodes) return;
    for (const errorModel of solution.models) {
      model = errorModel;
      startSecondNumber = secondNumber;
      startThirdNumber = thirdNumber;
      for (let index = nodes.length - 1; index >= 0; index--) {
        if (nodes[index].number < startThirdNumber) checkSubcomponents(nodes[index]);
      }
    }
  };
  const checkComponents = (node: GraphNode): number => {
    let lowlink = firstNumber++;
    node.number = lowlink;
    stack.push(node);
    for (let index = 0; index < node.successors.length; index++) {
      const target = node.successors[index];
      const targetNumber = target.number === 0 ? checkComponents(target) : target.number;
      if (targetNumber < lowlink) lowlink = targetNumber;
    }
    if (lowlink === node.number) checkComponent(node);
    return lowlink;
  };
  for (const node of initial) {
    if (node.number === 0) checkComponents(node);
    if (lasso) return lasso;
  }
  return undefined;
};

export const findTraceLasso = (
  trace: Value[][],
  fingerprints: bigint[],
  solutions: Solution[],
  atoms: LiveAtoms<Value[]>,
  isShared: boolean,
): TraceLasso | undefined => {
  const stateCache = new Map<LiveExpression, boolean>();
  const holds = (check: LiveExpression, position: number, next: number | undefined) => {
    stateCache.clear();
    return evaluateLive(
      check,
      trace[position],
      next === undefined ? undefined : trace[next],
      atoms,
      stateCache,
    );
  };
  const statePositions = trace.map((_state, position) => position);
  const stepPositions = trace.map((_state, position) => position);
  if (isShared) {
    const firstStates = new Map<bigint, number>();
    const firstSteps = new Map<number, number>();
    for (let position = 0; position < trace.length; position++) {
      const first = firstStates.get(fingerprints[position]) ?? position;
      firstStates.set(fingerprints[position], first);
      if (isSameState(trace[first], trace[position])) statePositions[position] = first;
      if (position === 0) continue;
      const key = statePositions[position - 1] * trace.length + statePositions[position];
      stepPositions[position] = firstSteps.get(key) ?? position;
      firstSteps.set(key, stepPositions[position]);
    }
  }
  const solutionChecks = solutions.map((solution): TraceChecks => {
    const states: boolean[][] = [];
    const steps: boolean[][] = [];
    const stutters: boolean[][] = [];
    const consistent: boolean[][] = [];
    const statePredicates = solution.tableau?.nodes.map((node) => node.statePredicates) ?? [];
    return {
      getStates: (position) => {
        const first = statePositions[position];
        return (states[first] ??= solution.stateChecks.map((check) =>
          holds(check, first, undefined),
        ));
      },
      getSteps: (position) => {
        const first = stepPositions[position];
        return (steps[first] ??= solution.actionChecks.map((check) =>
          holds(check, first - 1, first),
        ));
      },
      getStutters: (position) => {
        const first = statePositions[position];
        return (stutters[first] ??= solution.actionChecks.map((check) =>
          holds(check, first, first),
        ));
      },
      isConsistent: (tableauNode, position) => {
        const first = statePositions[position];
        const row = (consistent[first] ??= []);
        const known = isShared ? row[tableauNode] : undefined;
        if (known !== undefined) return known;
        row[tableauNode] = statePredicates[tableauNode].every((predicate) =>
          holds(predicate, first, undefined),
        );
        return row[tableauNode];
      },
    };
  });
  const partial: number[] = [];
  for (let index = 0; index < solutions.length; index++) {
    const graph = createGraph(fingerprints, solutions[index], solutionChecks[index], false);
    const lasso = findLasso(fingerprints, solutions[index], graph.initial);
    if (lasso) return lasso;
    if (graph.isPartial) partial.push(index);
  }
  // Deviation from TLC: LiveCheck1#constructBEGraph gives the initial state no stuttering step to a tableau node that isn't initial and goes on from no node a revisited state reaches, so it misses a violation past them.
  for (const index of partial) {
    const graph = createGraph(fingerprints, solutions[index], solutionChecks[index], true);
    const lasso = findLasso(fingerprints, solutions[index], graph.initial);
    if (lasso) return lasso;
  }
  return undefined;
};
