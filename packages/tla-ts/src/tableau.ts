import type { Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import type { Scope } from "./evaluate";
import { ACTION_LEVEL, TEMPORAL_LEVEL } from "./levels";

interface LiveBoolean {
  kind: "Boolean";
  value: boolean;
}

interface LiveState {
  kind: "State";
  expression: Expression;
  scope: Scope | undefined;
}

export interface LiveEnabled {
  kind: "Enabled";
  step: Expression;
  scope: Scope | undefined;
}

interface LiveAction {
  kind: "Action";
  expression: Expression;
  unchanged: Expression | undefined;
  scope: Scope | undefined;
  enabled?: LiveEnabled;
}

interface LiveUnary {
  kind: "Not" | "Always" | "Eventually" | "Next";
  body: LiveExpression;
}

interface LiveJunction {
  kind: "And" | "Or";
  operands: LiveExpression[];
}

export type LiveExpression =
  | LiveBoolean
  | LiveState
  | LiveEnabled
  | LiveAction
  | LiveUnary
  | LiveJunction;

interface TableauNode {
  particle: LiveExpression[];
  successors: number[];
  statePredicates: LiveExpression[];
}

export interface Tableau {
  nodes: TableauNode[];
  initialCount: number;
}

interface ErrorModel {
  eventuallyAlways: number[];
  infinitelyOftenStates: number[];
  infinitelyOftenActions: number[];
}

export interface Solution {
  tableau: Tableau | undefined;
  promises: LiveUnary[];
  stateChecks: LiveExpression[];
  actionChecks: LiveExpression[];
  models: ErrorModel[];
}

interface Classification {
  eventuallyAlways: LiveExpression[];
  infinitelyOftenStates: LiveExpression[];
  infinitelyOftenActions: LiveExpression[];
  formulas: LiveExpression[];
}

interface Triple {
  whole: LiveExpression;
  first: LiveExpression;
  second: LiveExpression;
}

const STATE_LEVEL = 1;
const MAXIMUM_DISJUNCTS = 2147483647;

export const TRUE: LiveBoolean = { kind: "Boolean", value: true };
export const FALSE: LiveBoolean = { kind: "Boolean", value: false };

const createBoolean = (value: boolean) => (value ? TRUE : FALSE);

const isAtom = (expression: LiveExpression) =>
  expression.kind === "State" || expression.kind === "Enabled" || expression.kind === "Action";

const isStateAtom = (expression: LiveExpression) =>
  expression.kind === "State" || expression.kind === "Enabled" || expression.kind === "Boolean";

export const createUnary = (kind: LiveUnary["kind"], body: LiveExpression): LiveUnary => ({
  kind,
  body,
});

export const createPair = (
  kind: LiveJunction["kind"],
  left: LiveExpression,
  right: LiveExpression,
): LiveJunction => ({ kind, operands: [left, right] });

export const createJunction = (
  kind: LiveJunction["kind"],
  operands: LiveExpression[],
): LiveJunction => ({
  kind,
  operands: operands.flatMap((operand) =>
    operand.kind === kind ? createJunction(kind, operand.operands).operands : [operand],
  ),
});

export const getLiveLevel = (expression: LiveExpression): number => {
  switch (expression.kind) {
    case "Boolean":
      return 0;
    case "State":
    case "Enabled":
      return STATE_LEVEL;
    case "Action":
    case "Next":
      return ACTION_LEVEL;
    case "Not":
      return getLiveLevel(expression.body);
    case "Always":
    case "Eventually":
      return TEMPORAL_LEVEL;
    case "And":
    case "Or":
      return expression.operands.reduce(
        (level, operand) => Math.max(level, getLiveLevel(operand)),
        0,
      );
  }
};

const containsAction = (expression: LiveExpression): boolean => {
  switch (expression.kind) {
    case "Action":
      return true;
    case "Boolean":
    case "State":
    case "Enabled":
      return false;
    case "Not":
    case "Always":
    case "Eventually":
    case "Next":
      return containsAction(expression.body);
    case "And":
    case "Or":
      return expression.operands.some(containsAction);
  }
};

const isEqual = (left: LiveExpression, right: LiveExpression): boolean => {
  if (left.kind !== right.kind) return false;
  if (left.kind === "Boolean" && right.kind === "Boolean") return left.value === right.value;
  if (isAtom(left)) return left === right;
  if ("body" in left && "body" in right) return isEqual(left.body, right.body);
  if ("operands" in left && "operands" in right) {
    return (
      left.operands.length === right.operands.length &&
      left.operands.every((operand, index) => isEqual(operand, right.operands[index]))
    );
  }
  return false;
};

const isMember = (items: LiveExpression[], expression: LiveExpression) =>
  items.some((item) => isEqual(item, expression));

const getDual = (kind: LiveJunction["kind"]) => (kind === "And" ? "Or" : "And");

const pushNegation = (expression: LiveExpression, isNegated: boolean): LiveExpression => {
  switch (expression.kind) {
    case "Boolean":
      return isNegated ? createBoolean(!expression.value) : expression;
    case "State":
    case "Enabled":
    case "Action":
    case "Next":
      return isNegated ? createUnary("Not", expression) : expression;
    case "Not":
      return pushNegation(expression.body, !isNegated);
    case "And":
    case "Or":
      return createJunction(
        isNegated ? getDual(expression.kind) : expression.kind,
        expression.operands.map((operand) => pushNegation(operand, isNegated)),
      );
    case "Always":
    case "Eventually": {
      const kind = isNegated === (expression.kind === "Always") ? "Eventually" : "Always";
      return createUnary(kind, pushNegation(expression.body, isNegated));
    }
  }
};

const negate = (expression: LiveExpression): LiveExpression => {
  switch (expression.kind) {
    case "Boolean":
      return createBoolean(!expression.value);
    case "Not":
      return expression.body;
    case "And":
    case "Or":
      return createJunction(getDual(expression.kind), expression.operands.map(negate));
    case "Always":
      return createUnary("Eventually", negate(expression.body));
    case "Eventually":
      return createUnary("Always", negate(expression.body));
    default:
      return createUnary("Not", expression);
  }
};

const simplify = (expression: LiveExpression): LiveExpression => {
  switch (expression.kind) {
    case "And":
    case "Or": {
      const absorbing = expression.kind === "Or";
      const operands: LiveExpression[] = [];
      for (const operand of expression.operands) {
        const simplified = simplify(operand);
        if (simplified.kind !== "Boolean") operands.push(simplified);
        else if (simplified.value === absorbing) return createBoolean(absorbing);
      }
      if (operands.length === 0) return createBoolean(!absorbing);
      return operands.length === 1 ? operands[0] : createJunction(expression.kind, operands);
    }
    case "Not": {
      const body = simplify(expression.body);
      return body.kind === "Boolean" ? createBoolean(!body.value) : createUnary("Not", body);
    }
    case "Always":
    case "Eventually": {
      const body = simplify(expression.body);
      return createUnary(expression.kind, body.kind === expression.kind ? body.body : body);
    }
    default:
      return expression;
  }
};

const getInfinitelyOftenBody = (expression: LiveExpression) =>
  expression.kind === "Always" && expression.body.kind === "Eventually"
    ? expression.body.body
    : undefined;

const toDisjunctiveNormalForm = (expression: LiveExpression): LiveExpression => {
  switch (expression.kind) {
    case "And": {
      const items: LiveExpression[] = [];
      const total = { value: 1 };
      for (const operand of expression.operands) {
        const normal = toDisjunctiveNormalForm(operand);
        if (normal.kind === "Or") {
          total.value *= normal.operands.length;
          if (total.value > MAXIMUM_DISJUNCTS) {
            throw new TlaEvaluationError(
              "TLC cannot handle the temporal formula because it exceeds the maximum supported size in disjunctive normal form",
            );
          }
          items.push(normal);
        } else if (normal.kind === "And") {
          items.push(...normal.operands);
        } else {
          items.push(normal);
        }
      }
      if (total.value === 1) return { kind: "And", operands: items };
      const conjunctions = Array.from({ length: total.value }, (): LiveExpression[] => []);
      const progress = { groups: 1, repeat: total.value };
      for (const item of items) {
        if (item.kind !== "Or") {
          conjunctions.forEach((conjunction) => conjunction.push(item));
          continue;
        }
        progress.repeat /= item.operands.length;
        const position = { value: 0 };
        for (let group = 0; group < progress.groups; group++) {
          for (const operand of item.operands) {
            for (let copy = 0; copy < progress.repeat; copy++) {
              conjunctions[position.value++].push(operand);
            }
          }
        }
        progress.groups *= item.operands.length;
      }
      return {
        kind: "Or",
        operands: conjunctions.map((conjunction) => createJunction("And", conjunction)),
      };
    }
    case "Or": {
      const infinitelyOften: LiveExpression[] = [];
      const disjuncts: LiveExpression[] = [];
      for (const operand of expression.operands) {
        const normal = toDisjunctiveNormalForm(operand);
        for (const item of normal.kind === "Or" ? normal.operands : [normal]) {
          const body = getInfinitelyOftenBody(item);
          if (body) infinitelyOften.push(body);
          else disjuncts.push(item);
        }
      }
      if (infinitelyOften.length > 0) {
        const body =
          infinitelyOften.length === 1 ? infinitelyOften[0] : createJunction("Or", infinitelyOften);
        disjuncts.push(createUnary("Always", createUnary("Eventually", body)));
      }
      return createJunction("Or", disjuncts);
    }
    case "Not":
      return isAtom(expression.body)
        ? expression
        : toDisjunctiveNormalForm(negate(expression.body));
    default:
      return expression;
  }
};

const flattenSingleJunctions = (expression: LiveExpression): LiveExpression => {
  switch (expression.kind) {
    case "And":
    case "Or":
      return expression.operands.length === 1
        ? flattenSingleJunctions(expression.operands[0])
        : createJunction(expression.kind, expression.operands.map(flattenSingleJunctions));
    case "Not":
      return expression.body.kind === "Not"
        ? flattenSingleJunctions(expression.body.body)
        : createUnary("Not", flattenSingleJunctions(expression.body));
    case "Always":
    case "Eventually":
    case "Next":
      return createUnary(expression.kind, flattenSingleJunctions(expression.body));
    default:
      return expression;
  }
};

const makeBinary = (expression: LiveExpression): LiveExpression => {
  switch (expression.kind) {
    case "And":
    case "Or": {
      if (expression.operands.length === 1) return makeBinary(expression.operands[0]);
      const middle = Math.floor(expression.operands.length / 2);
      return createPair(
        expression.kind,
        makeBinary(createJunction(expression.kind, expression.operands.slice(0, middle))),
        makeBinary(createJunction(expression.kind, expression.operands.slice(middle))),
      );
    }
    case "Not":
    case "Always":
    case "Eventually":
    case "Next":
      return createUnary(expression.kind, makeBinary(expression.body));
    default:
      return expression;
  }
};

const extractPromises = (expression: LiveExpression, promises: LiveUnary[]) => {
  if (expression.kind === "Eventually" && !isMember(promises, expression)) {
    promises.push(expression);
  }
  if ("body" in expression) extractPromises(expression.body, promises);
  if ("operands" in expression) {
    expression.operands.forEach((operand) => extractPromises(operand, promises));
  }
};

const isLocallyConsistent = (terms: LiveExpression[]) => {
  const positive = terms.filter(isStateAtom);
  const negative = terms.flatMap((term) =>
    term.kind === "Not" && isStateAtom(term.body) ? [term.body] : [],
  );
  return !positive.some((term) => isMember(negative, term));
};

const getPositiveClosure = (terms: LiveExpression[]) => {
  const pending = [...terms];
  const closure: LiveExpression[] = [];
  while (pending.length > 0) {
    const term = pending.pop();
    if (!term) break;
    switch (term.kind) {
      case "Not":
        pending.push(term.body);
        break;
      case "Next":
        closure.push(term);
        pending.push(term.body);
        break;
      case "Always":
      case "Eventually":
        closure.push(term, createUnary("Next", term));
        pending.push(term.body);
        break;
      case "And":
      case "Or":
        pending.push(...term.operands);
        closure.push(term);
        break;
      case "Action":
        throw new TlaEvaluationError("TLC encountered actions while constructing the tableau");
      default:
        closure.push(term);
    }
  }
  return closure;
};

const getExpansion = (
  term: LiveExpression,
  repeated: "Always" | "Eventually",
  junction: "And" | "Or",
): [LiveExpression, LiveExpression] | undefined => {
  if (term.kind === repeated && "body" in term) return [term.body, createUnary("Next", term)];
  if (term.kind === junction && "operands" in term) return [term.operands[0], term.operands[1]];
  return undefined;
};

const getTriples = (
  closure: LiveExpression[],
  repeated: "Always" | "Eventually",
  junction: "And" | "Or",
): Triple[] =>
  closure.flatMap((term): Triple[] => {
    const parts = getExpansion(term, repeated, junction);
    return parts ? [{ whole: term, first: parts[0], second: parts[1] }] : [];
  });

const isSameParticle = (left: LiveExpression[], right: LiveExpression[]) =>
  left.every((term) => isMember(right, term)) && right.every((term) => isMember(left, term));

const unionParticles = (left: LiveExpression[][], right: LiveExpression[][]) => [
  ...left.filter((particle) => !right.some((other) => isSameParticle(particle, other))),
  ...right,
];

const getParticleClosure = (terms: LiveExpression[]): LiveExpression[][] => {
  const closure = getPositiveClosure(terms);
  const alphas = getTriples(closure, "Always", "And");
  const betas = getTriples(closure, "Eventually", "Or");

  const expandBeta = (particle: LiveExpression[]): LiveExpression[][] => {
    for (const term of particle) {
      const parts = getExpansion(term, "Eventually", "Or");
      if (!parts) continue;
      const [first, second] = parts;
      if (isMember(particle, first) || isMember(particle, second)) continue;
      return unionParticles(expand([...particle, first]), expand([...particle, second]));
    }
    const beta = betas.find(
      (triple) =>
        (isMember(particle, triple.first) || isMember(particle, triple.second)) &&
        !isMember(particle, triple.whole),
    );
    return beta ? expand([...particle, beta.whole]) : [particle];
  };

  const expand = (particle: LiveExpression[]): LiveExpression[][] => {
    if (!isLocallyConsistent(particle)) return [];
    const expanded = [...particle];
    for (let index = 0; index < expanded.length; index++) {
      const parts = getExpansion(expanded[index], "Always", "And");
      if (!parts) continue;
      const [first, second] = parts;
      if (!isMember(expanded, first)) expanded.push(first);
      if (!isMember(expanded, second)) expanded.push(second);
    }
    const state = { isChanged: true };
    while (state.isChanged) {
      state.isChanged = false;
      for (const alpha of alphas) {
        const isImplied =
          isMember(expanded, alpha.first) &&
          isMember(expanded, alpha.second) &&
          !isMember(expanded, alpha.whole);
        if (isImplied) {
          expanded.push(alpha.whole);
          state.isChanged = true;
        }
      }
    }
    if (expanded.length > particle.length && !isLocallyConsistent(expanded)) return [];
    return expandBeta(expanded);
  };

  return expand(terms);
};

const createTableauNode = (particle: LiveExpression[]): TableauNode => ({
  particle,
  successors: [],
  statePredicates: particle.filter((term) => getLiveLevel(term) <= STATE_LEVEL),
});

const createTableau = (formula: LiveExpression): Tableau => {
  const nodes = getParticleClosure([formula]).map(createTableauNode);
  const initialCount = nodes.length;
  for (let index = 0; index < nodes.length; index++) {
    const implied = nodes[index].particle.flatMap((term) =>
      term.kind === "Next" ? [term.body] : [],
    );
    for (const particle of getParticleClosure(implied)) {
      const existing = nodes.findIndex((node) => isSameParticle(node.particle, particle));
      if (existing === -1) nodes.push(createTableauNode(particle));
      nodes[index].successors.push(existing === -1 ? nodes.length - 1 : existing);
    }
  }
  return { nodes, initialCount };
};

export const isFulfilling = (particle: LiveExpression[], promise: LiveUnary) =>
  !isMember(particle, promise) || isMember(particle, promise.body);

const classify = (expression: LiveExpression, classification: Classification) => {
  if (expression.kind === "Eventually" && expression.body.kind === "Always") {
    if (getLiveLevel(expression.body.body) < TEMPORAL_LEVEL) {
      classification.eventuallyAlways.push(expression.body.body);
      return;
    }
  }
  const infinitelyOften = getInfinitelyOftenBody(expression);
  if (infinitelyOften) {
    const level = getLiveLevel(infinitelyOften);
    if (level <= STATE_LEVEL) {
      classification.infinitelyOftenStates.push(infinitelyOften);
      return;
    }
    if (level === ACTION_LEVEL) {
      classification.infinitelyOftenActions.push(infinitelyOften);
      return;
    }
  }
  if (containsAction(expression)) {
    throw new TlaEvaluationError(
      "TLC cannot handle the temporal formula: actions may only appear as []<>A or <>[]A",
    );
  }
  classification.formulas.push(expression);
};

const addToBin = (bin: LiveExpression[], expression: LiveExpression) => {
  const index = bin.findIndex((item) => isEqual(item, expression));
  if (index !== -1) return index;
  bin.push(expression);
  return bin.length - 1;
};

export const getSolutions = (formula: LiveExpression): Solution[] => {
  const normal = toDisjunctiveNormalForm(simplify(pushNegation(formula, false)));
  if (normal.kind === "Boolean" && !normal.value) return [];
  const groups: { formula: LiveExpression | undefined; classifications: Classification[] }[] = [];
  for (const disjunct of normal.kind === "Or" ? normal.operands : [normal]) {
    const flattened = flattenSingleJunctions(disjunct);
    const classification: Classification = {
      eventuallyAlways: [],
      infinitelyOftenStates: [],
      infinitelyOftenActions: [],
      formulas: [],
    };
    for (const conjunct of flattened.kind === "And" ? flattened.operands : [flattened]) {
      classify(conjunct, classification);
    }
    const formulas = classification.formulas;
    const temporal =
      formulas.length === 0
        ? undefined
        : formulas.length === 1
          ? formulas[0]
          : createJunction("And", formulas);
    const group = groups.find((candidate) =>
      candidate.formula === undefined || temporal === undefined
        ? candidate.formula === temporal
        : isEqual(candidate.formula, temporal),
    );
    if (group) group.classifications.push(classification);
    else groups.push({ formula: temporal, classifications: [classification] });
  }
  return groups.map((group): Solution => {
    const binary = group.formula && makeBinary(group.formula);
    const promises: LiveUnary[] = [];
    if (binary) extractPromises(binary, promises);
    const stateChecks: LiveExpression[] = [];
    const actionChecks: LiveExpression[] = [];
    const models = group.classifications.map((classification): ErrorModel => ({
      infinitelyOftenActions: classification.infinitelyOftenActions.map((check) =>
        addToBin(actionChecks, check),
      ),
      infinitelyOftenStates: classification.infinitelyOftenStates.map((check) =>
        addToBin(stateChecks, check),
      ),
      eventuallyAlways: classification.eventuallyAlways.map((check) =>
        addToBin(actionChecks, check),
      ),
    }));
    return {
      tableau: binary && createTableau(binary),
      promises,
      stateChecks,
      actionChecks,
      models,
    };
  });
};
