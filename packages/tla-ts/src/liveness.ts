import type { Definition, Expression } from "./ast";
import { TlaConfigError, TlaEvaluationError } from "./errors";
import {
  describeLocation,
  bindDefinitions,
  bindOperatorArguments,
  evaluate,
  expectBoolean,
  forEachBinding,
  getDefinition,
  isLocallyResolved,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  resolveOperator,
  type Context,
  type Environment,
  type Scope,
  type Thunk,
} from "./evaluate";
import { mapChildren } from "./instances";
import { isEnabled } from "./successors";
import {
  createJunction,
  createPair,
  createUnary,
  FALSE,
  getLiveLevel,
  getSolutions,
  isFulfilling,
  TRUE,
  type LiveEnabled,
  type LiveExpression,
  type Solution,
  type Tableau,
} from "./tableau";
import { isSameValue, type Value } from "./values";

export interface ScopedExpression {
  expression: Expression;
  scope: Scope | undefined;
}

export interface TemporalProperty extends ScopedExpression {
  name: string;
}

export interface LiveSuccessor {
  index: number;
  state: Value[];
}

export interface Lasso {
  name: string;
  prefix: number[];
  cycle: number[];
}

interface SafetyViolation {
  name: string;
  path: number[];
}

export interface LivenessChecker {
  addInitialState: (index: number, state: Value[]) => void;
  addState: (
    index: number,
    state: Value[],
    successors: LiveSuccessor[],
  ) => SafetyViolation | undefined;
  findViolation: () => Lasso | undefined;
}

interface Check {
  solution: Solution;
  stateResults: Uint8Array[];
  actionResults: Uint8Array[];
  consistency: Uint8Array[];
  product: BehaviorGraph | undefined;
  productNodes: Map<number, number>;
  nodesByState: Map<number, number[]>;
}

interface BehaviorGraph {
  states: number[];
  tableauNodes: number[];
  edges: number[][];
  initial: number[];
  parents: number[];
}

export const ACTION_LEVEL = 2;

export const TEMPORAL_LEVEL = 3;

const MAXIMUM_EXPANSION_DEPTH = 100;

const TEMPORAL_OPERATORS = new Set(["~>", "-+->"]);

const definitionLevels = new WeakMap<Definition, number>();

const definitionThunks = new WeakSet<Thunk>();

const getConstantContext = (environment: Environment, scope: Scope | undefined): Context => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

const createCannotHandleError = (expression: Expression) =>
  new TlaEvaluationError(
    `TLC cannot handle the temporal formula at ${describeLocation(expression)}`,
  );

export const getLevel = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  shadowed = new Set<string>(),
): number => {
  const getBindingLevel = (name: string): number | undefined => {
    const binding = lookupScope(scope, name);
    if (!binding) return undefined;
    if (binding.kind === "Value") return 0;
    if (binding.kind === "Thunk") return getLevel(binding.expression, binding.scope, environment);
    const operator = binding.operator;
    return operator.kind === "Closure" ? getLevel(operator.body, operator.scope, environment) : 0;
  };
  const getGlobalLevel = (name: string): number | undefined => {
    if (environment.variableIndex.has(name)) return 1;
    if (environment.constants.has(name)) return 0;
    const definition = getDefinition(name, environment);
    if (definition) return getDefinitionLevel(definition, environment);
    const builtin = environment.builtins.get(environment.substitutions.get(name) ?? name);
    return builtin ? (builtin.isStateLevel ? 1 : 0) : undefined;
  };
  const getNameLevel = (name: string, node: Expression) => {
    if (shadowed.has(name)) return 0;
    if (isLocallyResolved(node)) return getBindingLevel(name) ?? getGlobalLevel(name) ?? 0;
    return getGlobalLevel(name) ?? getBindingLevel(name) ?? 0;
  };
  const getChildrenLevel = (node: Expression) => {
    const level = { value: 0 };
    mapChildren(node, (child, bound) => {
      level.value = Math.max(
        level.value,
        getLevel(
          child,
          scope,
          environment,
          bound.length === 0 ? shadowed : new Set([...shadowed, ...bound]),
        ),
      );
      return child;
    });
    return level.value;
  };
  switch (expression.kind) {
    case "Prime":
    case "Unchanged":
    case "BoxAction":
    case "AngleAction":
      return ACTION_LEVEL;
    case "Enabled":
      return 1;
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      return TEMPORAL_LEVEL;
    case "UnboundedQuantifier":
      return expression.isTemporal ? TEMPORAL_LEVEL : getChildrenLevel(expression);
    case "Identifier":
      return getNameLevel(expression.name, expression);
    case "OperatorReference":
      return getNameLevel(expression.operator, expression);
    case "Apply":
      if (TEMPORAL_OPERATORS.has(expression.operator)) return TEMPORAL_LEVEL;
      if (expression.operator === "\\cdot") return ACTION_LEVEL;
      return Math.max(getNameLevel(expression.operator, expression), getChildrenLevel(expression));
    default:
      return getChildrenLevel(expression);
  }
};

const getDefinitionLevel = (definition: Definition, environment: Environment): number => {
  const cached = definitionLevels.get(definition);
  if (cached !== undefined) return cached;
  definitionLevels.set(definition, 0);
  const bounds = definition.kind === "Function" ? definition.bounds : [];
  const level = Math.max(
    getLevel(definition.body, undefined, environment),
    ...bounds.map((bound) => getLevel(bound.set, undefined, environment)),
  );
  definitionLevels.set(definition, level);
  return level;
};

export const expandTemporal = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  isUnrollingForall: boolean,
  expanding = new Set<Definition>(),
): ScopedExpression[] => {
  const expand = (
    child: Expression,
    childScope: Scope | undefined,
    childExpanding = expanding,
  ): ScopedExpression[] =>
    expandTemporal(child, childScope, environment, isUnrollingForall, childExpanding);
  if (expression.kind === "And") {
    return expression.operands.flatMap((operand) => expand(operand, scope));
  }
  if (expression.kind === "Label") return expand(expression.body, scope);
  if (expression.kind === "Let") {
    return expand(expression.body, bindLetDefinitions(expression, scope, environment));
  }
  if (expression.kind === "Identifier") {
    const binding = isLocallyResolved(expression) ? lookupScope(scope, expression.name) : undefined;
    if (binding?.kind === "Thunk") {
      return expand(binding.expression, binding.scope);
    }
    const definition = environment.constants.has(expression.name)
      ? undefined
      : getDefinition(expression.name, environment);
    if (
      !binding &&
      definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      getDefinitionLevel(definition, environment) > 0
    ) {
      if (expanding.has(definition)) {
        throw new TlaConfigError(`The definition of ${expression.name} refers to itself`);
      }
      return expand(definition.body, undefined, new Set([...expanding, definition]));
    }
  }
  const context = getConstantContext(environment, scope);
  if (expression.kind === "Apply" && getLevel(expression, scope, environment) === TEMPORAL_LEVEL) {
    const operator = resolveApplyOperator(expression, context);
    const definition = isLocallyResolved(expression)
      ? undefined
      : getDefinition(expression.operator, environment);
    if (operator?.kind === "Closure" && !definition?.isRecursive) {
      return expand(operator.body, bindOperatorArguments(operator, expression.args, context));
    }
  }
  const isUnrolled =
    isUnrollingForall &&
    expression.kind === "Forall" &&
    getLevel(expression.body, scope, environment) === TEMPORAL_LEVEL &&
    expression.bounds.every((bound) => getLevel(bound.set, scope, environment) === 0);
  if (expression.kind === "Forall" && isUnrolled) {
    const expanded: ScopedExpression[] = [];
    forEachBinding(expression.bounds, context, (boundScope) => {
      expanded.push(...expand(expression.body, boundScope));
      return false;
    });
    return expanded;
  }
  return [{ expression, scope }];
};

const bindLetDefinitions = (
  expression: Expression & { kind: "Let" },
  scope: Scope | undefined,
  environment: Environment,
) => {
  const bound = bindDefinitions(expression.definitions, getConstantContext(environment, scope));
  for (let current = bound; current && current !== scope; current = current.parent) {
    if (current.binding.kind === "Thunk") definitionThunks.add(current.binding);
  }
  return bound;
};

const createAngleAction = (action: Expression, subscript: Expression): Expression => ({
  kind: "AngleAction",
  action,
  subscript,
  location: action.location,
});

const toLiveExpression = (
  root: Expression,
  rootScope: Scope | undefined,
  environment: Environment,
): LiveExpression => {
  const toAtom = (
    expression: Expression,
    scope: Scope | undefined,
    level: number,
  ): LiveExpression => {
    const atomLevel = level === 0 ? getLevel(expression, scope, environment) : level;
    if (atomLevel === 0) {
      const value = evaluate(expression, getConstantContext(environment, scope));
      if (typeof value !== "boolean") {
        throw new TlaEvaluationError(
          `TLC expected a boolean in the temporal formula at ${describeLocation(expression)}`,
        );
      }
      return value ? TRUE : FALSE;
    }
    if (atomLevel === 1) return { kind: "State", expression, scope };
    return { kind: "Action", expression, unchanged: undefined, scope };
  };

  const expansion = { depth: 0 };

  const expand = (
    body: Expression,
    bodyScope: Scope | undefined,
    expression: Expression,
    scope: Scope | undefined,
  ) => {
    if (expansion.depth >= MAXIMUM_EXPANSION_DEPTH) {
      throw new TlaEvaluationError(
        `TLC overflowed the stack while expanding the temporal formula at ${describeLocation(expression)}`,
      );
    }
    expansion.depth++;
    const result = convert(body, bodyScope);
    expansion.depth--;
    const level = getLiveLevel(result);
    return level > ACTION_LEVEL ? result : toAtom(expression, scope, level);
  };

  const convertCall = (
    expression: Expression & { kind: "Identifier" | "Apply" },
    scope: Scope | undefined,
  ): LiveExpression => {
    const name = expression.kind === "Identifier" ? expression.name : expression.operator;
    const context = getConstantContext(environment, scope);
    const binding =
      isLocallyResolved(expression) || getDefinition(name, environment) === undefined
        ? lookupScope(scope, name)
        : undefined;
    if (binding?.kind === "Thunk" && definitionThunks.has(binding)) {
      return expand(binding.expression, binding.scope, expression, scope);
    }
    const operator =
      binding?.kind === "Operator"
        ? binding.operator
        : binding
          ? undefined
          : isLocallyResolved(expression)
            ? resolveOperator(name, context)
            : resolveGlobalOperator(name, environment);
    if (operator?.kind !== "Closure") throw createCannotHandleError(expression);
    const args = expression.kind === "Apply" ? expression.args : [];
    return expand(operator.body, bindOperatorArguments(operator, args, context), expression, scope);
  };

  const convertQuantifier = (
    expression: Expression & { kind: "Forall" | "Exists" },
    scope: Scope | undefined,
  ) => {
    const isConstant = expression.bounds.every(
      (bound) => getLevel(bound.set, scope, environment) === 0,
    );
    if (!isConstant) throw createCannotHandleError(expression);
    const operands: LiveExpression[] = [];
    forEachBinding(expression.bounds, getConstantContext(environment, scope), (boundScope) => {
      operands.push(convert(expression.body, boundScope));
      return false;
    });
    const isForall = expression.kind === "Forall";
    if (operands.length === 0) return isForall ? TRUE : FALSE;
    const result = createJunction(isForall ? "And" : "Or", operands);
    const level = getLiveLevel(result);
    return level > ACTION_LEVEL ? result : toAtom(expression, scope, level);
  };

  const convert = (expression: Expression, scope: Scope | undefined): LiveExpression => {
    const level = getLevel(expression, scope, environment);
    if (level <= ACTION_LEVEL) return toAtom(expression, scope, level);
    switch (expression.kind) {
      case "Label":
        return convert(expression.body, scope);
      case "Let":
        return convert(expression.body, bindLetDefinitions(expression, scope, environment));
      case "Identifier":
        return convertCall(expression, scope);
      case "Apply": {
        const args = expression.args;
        if (expression.operator === "~>") {
          return createUnary(
            "Always",
            createPair(
              "Or",
              createUnary("Not", convert(args[0], scope)),
              createUnary("Eventually", convert(args[1], scope)),
            ),
          );
        }
        if (expression.operator === "~" && !isLocallyResolved(expression)) {
          return createUnary("Not", convert(args[0], scope));
        }
        if (expression.operator === "=>") {
          return createPair(
            "Or",
            createUnary("Not", convert(args[0], scope)),
            convert(args[1], scope),
          );
        }
        return convertCall(expression, scope);
      }
      case "And":
      case "Or":
        return createJunction(
          expression.kind,
          expression.operands.map((operand) => convert(operand, scope)),
        );
      case "Forall":
      case "Exists":
        return convertQuantifier(expression, scope);
      case "If": {
        if (getLevel(expression.condition, scope, environment) === 0) {
          const condition = evaluate(expression.condition, getConstantContext(environment, scope));
          if (typeof condition === "boolean") {
            return convert(condition ? expression.consequent : expression.alternative, scope);
          }
        }
        const condition = convert(expression.condition, scope);
        return createPair(
          "Or",
          createPair("And", condition, convert(expression.consequent, scope)),
          createPair("And", createUnary("Not", condition), convert(expression.alternative, scope)),
        );
      }
      case "Always":
      case "Eventually":
        return createUnary(expression.kind, convert(expression.expression, scope));
      case "WeakFairness":
      case "StrongFairness": {
        const step = createAngleAction(expression.action, expression.subscript);
        const enabled: LiveEnabled = { kind: "Enabled", step: expression.enabled ?? step, scope };
        const disabled = createUnary("Not", enabled);
        const taken: LiveExpression = {
          kind: "Action",
          expression: expression.action,
          unchanged: {
            kind: "Unchanged",
            expression: expression.subscript,
            location: step.location,
          },
          scope,
          enabled,
        };
        if (expression.kind === "WeakFairness") {
          return createUnary(
            "Always",
            createUnary("Eventually", createPair("Or", disabled, taken)),
          );
        }
        return createPair(
          "Or",
          createUnary("Eventually", createUnary("Always", disabled)),
          createUnary("Always", createUnary("Eventually", taken)),
        );
      }
      default:
        throw createCannotHandleError(expression);
    }
  };

  return convert(root, rootScope);
};

const evaluateLive = (
  expression: LiveExpression,
  state: Value[],
  next: Value[] | undefined,
  environment: Environment,
  stateCache: Map<LiveExpression, boolean>,
): boolean => {
  const recurse = (operand: LiveExpression) =>
    evaluateLive(operand, state, next, environment, stateCache);
  switch (expression.kind) {
    case "Boolean":
      return expression.value;
    case "State":
    case "Enabled": {
      const cached = stateCache.get(expression);
      if (cached !== undefined) return cached;
      const context = { environment, scope: expression.scope, state, next: undefined };
      const result =
        expression.kind === "State"
          ? expectBoolean(evaluate(expression.expression, context), "a temporal property predicate")
          : isEnabled(expression.step, context);
      stateCache.set(expression, result);
      return result;
    }
    case "Action": {
      if (expression.enabled && stateCache.get(expression.enabled) === false) return false;
      const context = { environment, scope: expression.scope, state, next };
      if (
        expression.unchanged &&
        expectBoolean(evaluate(expression.unchanged, context), "a subscript")
      )
        return false;
      return expectBoolean(evaluate(expression.expression, context), "an action predicate");
    }
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every(recurse);
    case "Or":
      return expression.operands.some(recurse);
    case "Next":
      return evaluateLive(expression.body, next ?? state, undefined, environment, new Map());
    case "Always":
    case "Eventually":
      throw new TlaEvaluationError("TLC cannot evaluate a temporal formula in a single step");
  }
};

const evaluateOnLasso = (
  expression: LiveExpression,
  path: Value[][],
  cycleStart: number,
  position: number,
  environment: Environment,
): boolean => {
  const getNext = (index: number) => (index + 1 < path.length ? index + 1 : cycleStart);
  const getFuture = (index: number) =>
    path.map((_, offset) => offset).filter((offset) => offset >= Math.min(index, cycleStart));
  const recurse = (operand: LiveExpression, index = position) =>
    evaluateOnLasso(operand, path, cycleStart, index, environment);
  switch (expression.kind) {
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every((operand) => recurse(operand));
    case "Or":
      return expression.operands.some((operand) => recurse(operand));
    case "Next":
      return recurse(expression.body, getNext(position));
    case "Always":
      return getFuture(position).every((index) => recurse(expression.body, index));
    case "Eventually":
      return getFuture(position).some((index) => recurse(expression.body, index));
    default:
      return evaluateLive(
        expression,
        path[position],
        path[getNext(position)],
        environment,
        new Map(),
      );
  }
};

const liveKeys = new WeakMap<LiveExpression, string>();

const atomCount = { value: 0 };

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

const getStronglyConnectedComponents = (
  nodeCount: number,
  getSuccessors: (node: number) => number[],
  visit: (component: number[], successors: (node: number) => number[]) => boolean,
) => {
  const order = new Int32Array(nodeCount).fill(-1);
  const lowLink = new Int32Array(nodeCount);
  const onStack = new Uint8Array(nodeCount);
  const stack: number[] = [];
  const counter = { value: 0 };
  const successorCache = new Map<number, number[]>();
  const getCachedSuccessors = (node: number) => {
    const cached = successorCache.get(node);
    if (cached) return cached;
    const successors = getSuccessors(node);
    successorCache.set(node, successors);
    return successors;
  };
  for (let root = 0; root < nodeCount; root++) {
    if (order[root] !== -1) continue;
    const frames: { node: number; position: number }[] = [];
    const open = (node: number) => {
      order[node] = counter.value;
      lowLink[node] = counter.value++;
      stack.push(node);
      onStack[node] = 1;
      frames.push({ node, position: 0 });
    };
    open(root);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const successors = getCachedSuccessors(frame.node);
      if (frame.position < successors.length) {
        const target = successors[frame.position++];
        if (order[target] === -1) open(target);
        else if (onStack[target])
          lowLink[frame.node] = Math.min(lowLink[frame.node], order[target]);
        continue;
      }
      frames.pop();
      const parent = frames[frames.length - 1];
      if (parent) lowLink[parent.node] = Math.min(lowLink[parent.node], lowLink[frame.node]);
      if (lowLink[frame.node] !== order[frame.node]) continue;
      const component: number[] = [];
      while (true) {
        const member = stack.pop();
        if (member === undefined) break;
        onStack[member] = 0;
        component.push(member);
        if (member === frame.node) break;
      }
      const isFound = visit(component, getCachedSuccessors);
      component.forEach((member) => successorCache.delete(member));
      if (isFound) return;
    }
  }
};

const getShortestPath = (
  from: number,
  to: number,
  members: Set<number>,
  getSuccessors: (node: number) => number[],
) => {
  if (from === to) return [from];
  const parents = new Map<number, number>([[from, -1]]);
  const queue = [from];
  for (let position = 0; position < queue.length; position++) {
    for (const target of getSuccessors(queue[position])) {
      if (parents.has(target) || !members.has(target)) continue;
      parents.set(target, queue[position]);
      if (target === to) {
        const path: number[] = [];
        for (let node = to; node !== -1; node = parents.get(node) ?? -1) path.push(node);
        return path.reverse();
      }
      queue.push(target);
    }
  }
  return [from];
};

const removeRepeats = (path: number[]) =>
  path.filter((node, position) => position === 0 || path[position - 1] !== node);

export const createLivenessChecker = (
  properties: TemporalProperty[],
  temporals: ScopedExpression[],
  environment: Environment,
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
    throw new TlaEvaluationError("Temporal formula is a tautology (its negation is unsatisfiable)");
  }
  const checks = solutions.map((solution): Check => ({
    solution,
    stateResults: [],
    actionResults: [],
    consistency: [],
    product: solution.tableau && {
      states: [],
      tableauNodes: [],
      edges: [],
      initial: [],
      parents: [],
    },
    productNodes: new Map(),
    nodesByState: new Map(),
  }));
  const actionKeys = new Map<string, number>();
  const actionIds = checks.map((check) =>
    check.solution.actionChecks.map((predicate) => {
      const key = getLiveKey(predicate);
      const known = actionKeys.get(key);
      if (known !== undefined) return known;
      actionKeys.set(key, actionKeys.size);
      return actionKeys.size - 1;
    }),
  );
  const states: Value[][] = [];
  const targets: number[][] = [];
  const edgeStates: Value[][][] = [];
  const initial: number[] = [];

  const isConsistent = (
    predicates: LiveExpression[],
    state: Value[],
    cache: Map<LiveExpression, boolean>,
  ) =>
    predicates.every((predicate) => evaluateLive(predicate, state, undefined, environment, cache));

  const getProductNode = (
    check: Check,
    product: BehaviorGraph,
    state: number,
    tableauNode: number,
    parent: number,
  ) => {
    const key = state * (check.solution.tableau?.nodes.length ?? 1) + tableauNode;
    const existing = check.productNodes.get(key);
    if (existing !== undefined) return { node: existing, isNew: false };
    const node = product.states.length;
    check.productNodes.set(key, node);
    product.states.push(state);
    product.tableauNodes.push(tableauNode);
    product.edges.push([]);
    product.parents.push(parent);
    const siblings = check.nodesByState.get(state);
    if (siblings) siblings.push(node);
    else check.nodesByState.set(state, [node]);
    return { node, isNew: true };
  };

  const getAttribution = (path: number[], cycleStart: number) => {
    const lasso = path.map((state) => states[state]);
    return (
      properties.find(
        (_, position) =>
          !evaluateOnLasso(negations[position].body, lasso, cycleStart, 0, environment),
      ) ?? properties[0]
    ).name;
  };

  const expandProduct = (check: Check, product: BehaviorGraph, tableau: Tableau, state: number) => {
    const hasEmptyModel = check.solution.models.some(
      (model) =>
        model.eventuallyAlways.length === 0 &&
        model.infinitelyOftenStates.length === 0 &&
        model.infinitelyOftenActions.length === 0,
    );
    const nodeCount = tableau.nodes.length;
    const pending = (check.nodesByState.get(state) ?? []).map((node) => ({ node, isDone: false }));
    while (pending.length > 0) {
      const item = pending.pop();
      if (!item) break;
      const source = product.states[item.node];
      const successors = tableau.nodes[product.tableauNodes[item.node]].successors;
      const isAccepted =
        item.isDone &&
        hasEmptyModel &&
        successors.some((successor) => {
          const node = tableau.nodes[successor];
          return node.particle.length === 0 && node.successors.every((next) => next === successor);
        });
      if (isAccepted) {
        const path = removeRepeats(
          getPrefix(product, item.node).map((node) => product.states[node]),
        );
        return { name: getAttribution(path, path.length - 1), path };
      }
      const consistency = check.consistency[source];
      targets[source].forEach((target, edgeIndex) => {
        for (const successor of successors) {
          if (!consistency[edgeIndex * nodeCount + successor]) continue;
          const created = getProductNode(check, product, target, successor, item.node);
          product.edges[item.node].push(created.node, edgeIndex);
          if (created.isNew && targets[target] !== undefined) {
            pending.push({ node: created.node, isDone: true });
          }
        }
      });
    }
    return undefined;
  };

  const addInitialState = (index: number, state: Value[]) => {
    initial.push(index);
    states[index] = state;
    for (const check of checks) {
      const tableau = check.solution.tableau;
      const product = check.product;
      if (!tableau || !product) continue;
      const cache = new Map<LiveExpression, boolean>();
      for (let node = 0; node < tableau.initialCount; node++) {
        if (!isConsistent(tableau.nodes[node].statePredicates, state, cache)) continue;
        product.initial.push(getProductNode(check, product, index, node, -1).node);
      }
    }
  };

  const addState = (index: number, state: Value[], successors: LiveSuccessor[]) => {
    environment.runtime.setLivenessSource(index);
    states[index] = state;
    const edges: LiveSuccessor[] = [];
    const edgesByTarget = new Map<number, LiveSuccessor[]>();
    for (const successor of [...successors, { index, state }]) {
      const sameTarget = edgesByTarget.get(successor.index);
      const isDuplicate =
        sameTarget !== undefined &&
        (successor.index < index ||
          sameTarget.some((edge) => isSameState(edge.state, successor.state)));
      if (isDuplicate) continue;
      edges.push(successor);
      if (sameTarget) sameTarget.push(successor);
      else edgesByTarget.set(successor.index, [successor]);
    }
    targets[index] = edges.map((edge) => edge.index);
    edgeStates[index] = edges.map((edge) => edge.state);
    const stateCache = new Map<LiveExpression, boolean>();
    const successorCaches = edges.map(() => new Map<LiveExpression, boolean>());
    for (const check of checks) {
      const solution = check.solution;
      check.stateResults[index] = Uint8Array.from(solution.stateChecks, (predicate) =>
        evaluateLive(predicate, state, undefined, environment, stateCache) ? 1 : 0,
      );
      const tableau = solution.tableau;
      const product = check.product;
      if (!tableau || !product) continue;
      const nodeCount = tableau.nodes.length;
      const consistency = new Uint8Array(edges.length * nodeCount);
      edges.forEach((edge, edgeIndex) => {
        tableau.nodes.forEach((node, nodeIndex) => {
          const isTrue = isConsistent(node.statePredicates, edge.state, successorCaches[edgeIndex]);
          consistency[edgeIndex * nodeCount + nodeIndex] = isTrue ? 1 : 0;
        });
      });
      check.consistency[index] = consistency;
      const accepted = expandProduct(check, product, tableau, index);
      if (accepted) return accepted;
    }
    return undefined;
  };

  const computeActionResults = (source: number) => {
    environment.runtime.setLivenessSource(source);
    const state = states[source];
    const successors = edgeStates[source];
    const values = successors.map(() => new Int8Array(actionKeys.size).fill(-1));
    checks.forEach((check, checkIndex) => {
      const solution = check.solution;
      const ids = actionIds[checkIndex];
      const stateResults = check.stateResults[source];
      const stateCache = new Map(
        solution.stateChecks.map((predicate, position) => [
          predicate,
          stateResults[position] === 1,
        ]),
      );
      const actionCount = solution.actionChecks.length;
      const actions = new Uint8Array(successors.length * actionCount);
      successors.forEach((successor, edgeIndex) => {
        const known = values[edgeIndex];
        for (let position = 0; position < actionCount; position++) {
          const actionId = ids[position];
          if (known[actionId] === -1) {
            const predicate = solution.actionChecks[position];
            known[actionId] = evaluateLive(predicate, state, successor, environment, stateCache)
              ? 1
              : 0;
          }
          actions[edgeIndex * actionCount + position] = known[actionId];
        }
      });
      check.actionResults[source] = actions;
    });
  };

  const getActionResults = (check: Check, source: number) => {
    if (check.actionResults[source] === undefined) computeActionResults(source);
    return check.actionResults[source];
  };

  const getGraph = (check: Check): BehaviorGraph =>
    check.product ?? {
      states: states.map((_, index) => index),
      tableauNodes: states.map(() => -1),
      edges: Array.from({ length: states.length }, (_, index) =>
        (targets[index] ?? []).flatMap((target, edgeIndex) => [target, edgeIndex]),
      ),
      initial,
      parents: [],
    };

  const getPrefix = (graph: BehaviorGraph, entry: number) => {
    if (graph.parents.length > 0) {
      const path: number[] = [];
      for (let node = entry; node !== -1; node = graph.parents[node]) path.push(node);
      return path.reverse();
    }
    const parents = new Map<number, number>(graph.initial.map((node) => [node, -1]));
    const queue = [...graph.initial];
    for (let position = 0; position < queue.length && !parents.has(entry); position++) {
      const edges = graph.edges[queue[position]];
      for (let offset = 0; offset < edges.length; offset += 2) {
        if (parents.has(edges[offset])) continue;
        parents.set(edges[offset], queue[position]);
        queue.push(edges[offset]);
      }
    }
    const path: number[] = [];
    for (let node = entry; node !== -1; node = parents.get(node) ?? -1) path.push(node);
    return path.reverse();
  };

  const findInCheck = (check: Check): Lasso | undefined => {
    const solution = check.solution;
    const tableau = solution.tableau;
    const graph = getGraph(check);
    const actionCount = solution.actionChecks.length;
    const getAction = (node: number, edgeIndex: number, position: number) =>
      getActionResults(check, graph.states[node])[edgeIndex * actionCount + position] === 1;
    for (const model of solution.models) {
      const isAllowed = (node: number, edgeIndex: number) =>
        model.eventuallyAlways.every((position) => getAction(node, edgeIndex, position));
      const getSuccessors = (node: number) => {
        const edges = graph.edges[node];
        const successors: number[] = [];
        for (let offset = 0; offset < edges.length; offset += 2) {
          if (isAllowed(node, edges[offset + 1])) successors.push(edges[offset]);
        }
        return successors;
      };
      const lasso = { value: undefined as Lasso | undefined };
      getStronglyConnectedComponents(
        graph.states.length,
        getSuccessors,
        (component, successors) => {
          const members = new Set(component);
          if (component.length === 1 && !successors(component[0]).includes(component[0]))
            return false;
          const stateWitnesses = model.infinitelyOftenStates.map((position) =>
            component.find((node) => check.stateResults[graph.states[node]][position] === 1),
          );
          const actionWitnesses = model.infinitelyOftenActions.map((position) => {
            for (const node of component) {
              const edges = graph.edges[node];
              for (let offset = 0; offset < edges.length; offset += 2) {
                const isWitness =
                  members.has(edges[offset]) &&
                  isAllowed(node, edges[offset + 1]) &&
                  getAction(node, edges[offset + 1], position);
                if (isWitness) return [node, edges[offset]];
              }
            }
            return undefined;
          });
          const promiseWitnesses = solution.promises.map((promise) =>
            component.find(
              (node) =>
                tableau !== undefined &&
                isFulfilling(tableau.nodes[graph.tableauNodes[node]].particle, promise),
            ),
          );
          const isViolation =
            stateWitnesses.every((witness) => witness !== undefined) &&
            actionWitnesses.every((witness) => witness !== undefined) &&
            promiseWitnesses.every((witness) => witness !== undefined);
          if (!isViolation) return false;
          const entry = component[component.length - 1];
          const waypoints = [
            ...stateWitnesses.flatMap((witness) => (witness === undefined ? [] : [witness])),
            ...actionWitnesses.flatMap((witness) => witness ?? []),
            ...promiseWitnesses.flatMap((witness) => (witness === undefined ? [] : [witness])),
          ];
          const cycle = [entry];
          for (const waypoint of waypoints) {
            cycle.push(
              ...getShortestPath(cycle[cycle.length - 1], waypoint, members, successors).slice(1),
            );
          }
          if (cycle.length === 1 && !successors(entry).includes(entry)) {
            cycle.push(successors(entry).find((node) => members.has(node)) ?? entry);
          }
          const closing = getShortestPath(cycle[cycle.length - 1], entry, members, successors);
          cycle.push(...closing.slice(1, -1));
          const prefix = removeRepeats(getPrefix(graph, entry).map((node) => graph.states[node]));
          const cycleStates = removeRepeats(cycle.map((node) => graph.states[node]));
          if (cycleStates.length > 1 && cycleStates[cycleStates.length - 1] === cycleStates[0]) {
            cycleStates.pop();
          }
          prefix.pop();
          lasso.value = {
            name: getAttribution([...prefix, ...cycleStates], prefix.length),
            prefix,
            cycle: cycleStates,
          };
          return true;
        },
      );
      if (lasso.value) return lasso.value;
    }
    return undefined;
  };

  return {
    addInitialState,
    addState,
    findViolation: () => {
      for (const check of checks) {
        const lasso = findInCheck(check);
        if (lasso) return lasso;
      }
      return undefined;
    },
  };
};
