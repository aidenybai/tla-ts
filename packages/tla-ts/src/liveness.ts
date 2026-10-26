import type { Expression, SourceLocation } from "./ast";
import { TlaUnsupportedError } from "./errors";
import {
  bindOperatorArguments,
  evaluate,
  expectBoolean,
  forEachBinding,
  getChildren,
  resolveOperator,
  type Context,
  type Environment,
  type Scope,
} from "./evaluate";
import { isEnabled } from "./successors";
import type { Value } from "./values";

export interface ScopedExpression {
  expression: Expression;
  scope: Scope | undefined;
}

export interface FairnessCondition {
  isStrong: boolean;
  step: Expression;
  scope: Scope | undefined;
}

export type LivenessProperty =
  | {
      kind: "Eventually" | "InfinitelyOften" | "EventuallyAlways";
      name: string;
      predicate: ScopedExpression;
    }
  | { kind: "LeadsTo"; name: string; left: ScopedExpression; right: ScopedExpression }
  | { kind: "EventuallyStep" | "InfinitelyOftenStep"; name: string; step: ScopedExpression };

export interface StateGraph {
  states: Value[][];
  successors: number[][];
  successorStates: Value[][][] | undefined;
  initial: number[];
  parents: number[];
}

export interface Lasso {
  prefix: number[];
  cycle: number[];
}

interface Restriction {
  isAllowedState: (index: number) => boolean;
  isAllowedEdge: (from: number, to: number) => boolean;
}

const START: SourceLocation = { line: 0, column: 0 };

const TEMPORAL_KINDS = new Set([
  "Always",
  "Eventually",
  "WeakFairness",
  "StrongFairness",
  "BoxAction",
  "AngleAction",
]);

export const isTemporal = (
  expression: Expression,
  environment: Environment,
  visited = new Set<string>(),
): boolean => {
  if (TEMPORAL_KINDS.has(expression.kind)) return true;
  if (expression.kind === "Apply" && expression.operator === "~>") return true;
  const name =
    expression.kind === "Identifier"
      ? expression.name
      : expression.kind === "Apply"
        ? expression.operator
        : undefined;
  if (name !== undefined && !visited.has(name) && !environment.constants.has(name)) {
    visited.add(name);
    const definition = environment.definitions.get(environment.substitutions.get(name) ?? name);
    if (definition && isTemporal(definition.body, environment, visited)) return true;
  }
  return getChildren(expression).some((child) => isTemporal(child, environment, visited));
};

const getConstantContext = (environment: Environment, scope: Scope | undefined): Context => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

export const expandTemporal = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
): ScopedExpression[] => {
  if (expression.kind === "And") {
    return expression.operands.flatMap((operand) => expandTemporal(operand, scope, environment));
  }
  if (expression.kind === "Identifier" && !environment.constants.has(expression.name)) {
    const definition = environment.definitions.get(
      environment.substitutions.get(expression.name) ?? expression.name,
    );
    if (definition?.kind === "Operator" && definition.params.length === 0) {
      return expandTemporal(definition.body, undefined, environment);
    }
  }
  if (expression.kind === "Apply" && isTemporal(expression, environment)) {
    const context = getConstantContext(environment, scope);
    const operator = resolveOperator(expression.operator, context);
    if (operator?.kind === "Closure") {
      return expandTemporal(
        operator.body,
        bindOperatorArguments(operator, expression.args, context),
        environment,
      );
    }
  }
  if (expression.kind === "Forall" && isTemporal(expression.body, environment)) {
    const expanded: ScopedExpression[] = [];
    forEachBinding(expression.bounds, getConstantContext(environment, scope), (boundScope) => {
      expanded.push(...expandTemporal(expression.body, boundScope, environment));
      return false;
    });
    return expanded;
  }
  return [{ expression, scope }];
};

export const resolveTemporal = (expression: Expression, environment: Environment): Expression => {
  if (expression.kind !== "Identifier" || environment.constants.has(expression.name)) {
    return expression;
  }
  const definition = environment.definitions.get(
    environment.substitutions.get(expression.name) ?? expression.name,
  );
  if (definition?.kind !== "Operator" || definition.params.length > 0) return expression;
  return resolveTemporal(definition.body, environment);
};

const createAngleAction = (action: Expression, subscript: Expression): Expression => ({
  kind: "AngleAction",
  action,
  subscript,
  location: START,
});

export const toFairnessCondition = (
  item: ScopedExpression,
  environment: Environment,
): FairnessCondition | undefined => {
  const expression = resolveTemporal(item.expression, environment);
  if (expression.kind !== "WeakFairness" && expression.kind !== "StrongFairness") return undefined;
  return {
    isStrong: expression.kind === "StrongFairness",
    step: createAngleAction(expression.action, expression.subscript),
    scope: item.scope,
  };
};

export const toLivenessProperty = (
  name: string,
  item: ScopedExpression,
  environment: Environment,
): LivenessProperty | undefined => {
  const expression = resolveTemporal(item.expression, environment);
  const scoped = (node: Expression): ScopedExpression => ({ expression: node, scope: item.scope });
  const isStatePredicate = (node: Expression) => !isTemporal(node, environment);
  if (expression.kind === "Apply" && expression.operator === "~>") {
    const [left, right] = expression.args;
    if (isStatePredicate(left) && isStatePredicate(right)) {
      return { kind: "LeadsTo", name, left: scoped(left), right: scoped(right) };
    }
    return undefined;
  }
  if (expression.kind === "Eventually") {
    const inner = resolveTemporal(expression.expression, environment);
    if (inner.kind === "AngleAction") return { kind: "EventuallyStep", name, step: scoped(inner) };
    if (inner.kind === "Always" && isStatePredicate(inner.expression)) {
      return { kind: "EventuallyAlways", name, predicate: scoped(inner.expression) };
    }
    if (isStatePredicate(inner)) return { kind: "Eventually", name, predicate: scoped(inner) };
    return undefined;
  }
  if (expression.kind === "Always") {
    const inner = resolveTemporal(expression.expression, environment);
    if (inner.kind === "Apply" && inner.operator === "~>") {
      return toLivenessProperty(name, scoped(inner), environment);
    }
    if (inner.kind !== "Eventually") return undefined;
    const target = resolveTemporal(inner.expression, environment);
    if (target.kind === "AngleAction") {
      return { kind: "InfinitelyOftenStep", name, step: scoped(target) };
    }
    if (isStatePredicate(target)) {
      return { kind: "InfinitelyOften", name, predicate: scoped(target) };
    }
  }
  return undefined;
};

const getStronglyConnectedComponents = (
  nodes: number[],
  getEdges: (node: number) => number[],
): number[][] => {
  const indexOf = new Map<number, number>();
  const lowLink = new Map<number, number>();
  const onStack = new Set<number>();
  const stack: number[] = [];
  const components: number[][] = [];
  const counter = { value: 0 };
  for (const root of nodes) {
    if (indexOf.has(root)) continue;
    const work: { node: number; edges: number[]; position: number }[] = [];
    const open = (node: number) => {
      indexOf.set(node, counter.value);
      lowLink.set(node, counter.value);
      counter.value++;
      stack.push(node);
      onStack.add(node);
      work.push({ node, edges: getEdges(node), position: 0 });
    };
    open(root);
    while (work.length > 0) {
      const frame = work[work.length - 1];
      if (frame.position < frame.edges.length) {
        const target = frame.edges[frame.position++];
        if (!indexOf.has(target)) {
          open(target);
        } else if (onStack.has(target)) {
          lowLink.set(frame.node, Math.min(lowLink.get(frame.node) ?? 0, indexOf.get(target) ?? 0));
        }
        continue;
      }
      work.pop();
      const parent = work[work.length - 1];
      if (parent) {
        lowLink.set(
          parent.node,
          Math.min(lowLink.get(parent.node) ?? 0, lowLink.get(frame.node) ?? 0),
        );
      }
      if (lowLink.get(frame.node) !== indexOf.get(frame.node)) continue;
      const component: number[] = [];
      while (true) {
        const member = stack.pop();
        if (member === undefined) break;
        onStack.delete(member);
        component.push(member);
        if (member === frame.node) break;
      }
      components.push(component);
    }
  }
  return components;
};

export const findLivenessViolation = (
  graph: StateGraph,
  property: LivenessProperty,
  fairness: FairnessCondition[],
  environment: Environment,
): Lasso | undefined => {
  const stateHolds = (predicate: ScopedExpression, index: number) =>
    expectBoolean(
      evaluate(predicate.expression, {
        environment,
        scope: predicate.scope,
        state: graph.states[index],
        next: undefined,
      }),
      "a temporal property predicate",
    );
  const getNextStates = (from: number, to: number) => {
    const successorStates = graph.successorStates?.[from];
    if (successorStates === undefined) return from === to ? [] : [graph.states[to]];
    return successorStates.filter((_, position) => graph.successors[from][position] === to);
  };
  const stepHolds = (step: Expression, scope: Scope | undefined, from: number, to: number) =>
    getNextStates(from, to).some((next) =>
      expectBoolean(
        evaluate(step, { environment, scope, state: graph.states[from], next }),
        "a step predicate",
      ),
    );
  const stepFails = (step: Expression, scope: Scope | undefined, from: number, to: number) =>
    from === to ||
    getNextStates(from, to).some(
      (next) =>
        !expectBoolean(
          evaluate(step, { environment, scope, state: graph.states[from], next }),
          "a step predicate",
        ),
    );
  const enabledCache = fairness.map(() => new Map<number, boolean>());
  const isConditionEnabled = (conditionIndex: number, state: number) => {
    const cache = enabledCache[conditionIndex];
    const cached = cache.get(state);
    if (cached !== undefined) return cached;
    const condition = fairness[conditionIndex];
    const enabled = isEnabled(condition.step, {
      environment,
      scope: condition.scope,
      state: graph.states[state],
      next: undefined,
    });
    cache.set(state, enabled);
    return enabled;
  };

  const getRestrictedEdges = (restriction: Restriction, members: Set<number>) => (node: number) => {
    const edges = [node, ...graph.successors[node]];
    return edges.filter(
      (target, position) =>
        members.has(target) &&
        edges.indexOf(target) === position &&
        restriction.isAllowedEdge(node, target),
    );
  };

  const findStepEdge = (
    restriction: Restriction,
    component: number[],
    members: Set<number>,
    condition: FairnessCondition,
  ): [number, number] | undefined => {
    const getEdges = getRestrictedEdges(restriction, members);
    for (const from of component) {
      for (const to of getEdges(from)) {
        if (stepHolds(condition.step, condition.scope, from, to)) return [from, to];
      }
    }
    return undefined;
  };

  const getFairComponents = (restriction: Restriction, component: number[]): number[][] => {
    const members = new Set(component);
    for (let conditionIndex = 0; conditionIndex < fairness.length; conditionIndex++) {
      const condition = fairness[conditionIndex];
      if (condition.isStrong) continue;
      const isAlwaysEnabled = component.every((state) => isConditionEnabled(conditionIndex, state));
      if (isAlwaysEnabled && !findStepEdge(restriction, component, members, condition)) return [];
    }
    for (let conditionIndex = 0; conditionIndex < fairness.length; conditionIndex++) {
      const condition = fairness[conditionIndex];
      if (!condition.isStrong) continue;
      const enabledStates = component.filter((state) => isConditionEnabled(conditionIndex, state));
      if (enabledStates.length === 0) continue;
      if (findStepEdge(restriction, component, members, condition)) continue;
      const remaining = component.filter((state) => !isConditionEnabled(conditionIndex, state));
      const remainingMembers = new Set(remaining);
      return getStronglyConnectedComponents(
        remaining,
        getRestrictedEdges(restriction, remainingMembers),
      ).flatMap((subcomponent) => getFairComponents(restriction, subcomponent));
    }
    return [component];
  };

  const getReachable = (restriction: Restriction, starts: number[]) => {
    const parents = new Map<number, number>();
    const queue = starts.filter(restriction.isAllowedState);
    queue.forEach((start) => parents.set(start, -1));
    for (let position = 0; position < queue.length; position++) {
      const node = queue[position];
      for (const target of graph.successors[node]) {
        if (parents.has(target) || !restriction.isAllowedState(target)) continue;
        if (!restriction.isAllowedEdge(node, target)) continue;
        parents.set(target, node);
        queue.push(target);
      }
    }
    return { nodes: queue, parents };
  };

  const getPath = (parents: Map<number, number>, target: number) => {
    const path: number[] = [];
    for (let node = target; node !== -1; node = parents.get(node) ?? -1) path.push(node);
    return path.reverse();
  };

  const getShortestPath = (
    restriction: Restriction,
    members: Set<number>,
    from: number,
    to: number,
  ) => {
    if (from === to) return [from];
    const getEdges = getRestrictedEdges(restriction, members);
    const parents = new Map<number, number>([[from, -1]]);
    const queue = [from];
    for (let position = 0; position < queue.length; position++) {
      for (const target of getEdges(queue[position])) {
        if (parents.has(target)) continue;
        parents.set(target, queue[position]);
        if (target === to) return getPath(parents, to);
        queue.push(target);
      }
    }
    return [from];
  };

  const getCycle = (
    restriction: Restriction,
    component: number[],
    entry: number,
    required: number[],
  ) => {
    const members = new Set(component);
    const waypoints = [...required];
    fairness.forEach((condition, conditionIndex) => {
      const disabled = component.find((state) => !isConditionEnabled(conditionIndex, state));
      if (disabled !== undefined) {
        waypoints.push(disabled);
        return;
      }
      const edge = findStepEdge(restriction, component, members, condition);
      if (edge) waypoints.push(...edge);
    });
    const cycle = [entry];
    for (const waypoint of [...waypoints, entry]) {
      const last = cycle[cycle.length - 1];
      cycle.push(...getShortestPath(restriction, members, last, waypoint).slice(1));
    }
    return cycle.length > 1 && cycle[cycle.length - 1] === entry ? cycle.slice(0, -1) : cycle;
  };

  const findFairComponent = (restriction: Restriction, nodes: number[]) => {
    const members = new Set(nodes);
    return getStronglyConnectedComponents(nodes, getRestrictedEdges(restriction, members)).flatMap(
      (component) => getFairComponents(restriction, component),
    );
  };

  const everyState = () => true;
  const everyEdge = () => true;
  const allStates = graph.states.map((_, index) => index);

  const toLasso = (
    restriction: Restriction,
    prefix: number[],
    component: number[],
    required: number[] = [],
  ): Lasso => {
    const entry = prefix[prefix.length - 1];
    return {
      prefix: prefix.slice(0, -1),
      cycle: getCycle(restriction, component, entry, required),
    };
  };

  switch (property.kind) {
    case "Eventually":
    case "InfinitelyOften": {
      const restriction: Restriction = {
        isAllowedState: (index) => !stateHolds(property.predicate, index),
        isAllowedEdge: everyEdge,
      };
      const reachable =
        property.kind === "Eventually"
          ? getReachable(restriction, graph.initial)
          : { nodes: allStates.filter(restriction.isAllowedState), parents: undefined };
      const component = findFairComponent(restriction, reachable.nodes)[0];
      if (!component) return undefined;
      const entry = component[0];
      const prefix = reachable.parents
        ? getPath(reachable.parents, entry)
        : getPath(new Map(graph.parents.map((parent, index) => [index, parent])), entry);
      return toLasso(restriction, prefix, component);
    }
    case "EventuallyAlways": {
      const restriction: Restriction = { isAllowedState: everyState, isAllowedEdge: everyEdge };
      for (const component of findFairComponent(restriction, allStates)) {
        const violating = component.find((index) => !stateHolds(property.predicate, index));
        if (violating === undefined) continue;
        const prefix = getPath(
          new Map(graph.parents.map((parent, index) => [index, parent])),
          violating,
        );
        return toLasso(restriction, prefix, component, [violating]);
      }
      return undefined;
    }
    case "LeadsTo": {
      const restriction: Restriction = {
        isAllowedState: (index) => !stateHolds(property.right, index),
        isAllowedEdge: everyEdge,
      };
      const candidates = allStates.filter(restriction.isAllowedState);
      const components = findFairComponent(restriction, candidates);
      if (components.length === 0) return undefined;
      const targets = new Set(components.flat());
      const reverse = new Map<number, number[]>();
      for (const from of candidates) {
        for (const to of graph.successors[from]) {
          if (!restriction.isAllowedState(to)) continue;
          reverse.set(to, [...(reverse.get(to) ?? []), from]);
        }
      }
      const towards = new Map<number, number>();
      const queue = [...targets];
      queue.forEach((node) => towards.set(node, -1));
      for (let position = 0; position < queue.length; position++) {
        for (const source of reverse.get(queue[position]) ?? []) {
          if (towards.has(source)) continue;
          towards.set(source, queue[position]);
          queue.push(source);
        }
      }
      const trigger = allStates.find(
        (index) => towards.has(index) && stateHolds(property.left, index),
      );
      if (trigger === undefined) return undefined;
      const toComponent: number[] = [];
      for (let node = trigger; node !== -1; node = towards.get(node) ?? -1) toComponent.push(node);
      const entry = toComponent[toComponent.length - 1];
      const component = components.find((candidate) => candidate.includes(entry)) ?? [entry];
      const prefix = [
        ...getPath(new Map(graph.parents.map((parent, index) => [index, parent])), trigger).slice(
          0,
          -1,
        ),
        ...toComponent,
      ];
      return toLasso(restriction, prefix, component);
    }
    case "EventuallyStep":
    case "InfinitelyOftenStep": {
      const step = property.step;
      const restriction: Restriction = {
        isAllowedState: everyState,
        isAllowedEdge: (from, to) => stepFails(step.expression, step.scope, from, to),
      };
      const reachable =
        property.kind === "EventuallyStep"
          ? getReachable(restriction, graph.initial)
          : { nodes: allStates, parents: undefined };
      const component = findFairComponent(restriction, reachable.nodes)[0];
      if (!component) return undefined;
      const entry = component[0];
      const prefix = reachable.parents
        ? getPath(reachable.parents, entry)
        : getPath(new Map(graph.parents.map((parent, index) => [index, parent])), entry);
      return toLasso(restriction, prefix, component);
    }
  }
};

export const unsupportedTemporal = (name: string) =>
  new TlaUnsupportedError(
    `Property ${name} uses a temporal form that is not supported yet; supported forms are []P, [][A]_v, <>P, []<>P, <>[]P, P ~> Q, <><<A>>_v, and []<><<A>>_v`,
  );
