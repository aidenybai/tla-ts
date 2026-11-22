import type { Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import type { Scope } from "./evaluate";
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";

interface LiveBoolean {
  kind: "Boolean";
  value: boolean;
}

export interface LiveState {
  kind: "State";
  expression: Expression;
  scope: Scope | undefined;
}

export interface LiveEnabled {
  kind: "Enabled";
  step: Expression;
  scope: Scope | undefined;
}

export interface LiveAction {
  kind: "Action";
  expression: Expression;
  subscript: Expression | undefined;
  subscriptVariables: number[] | undefined;
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

interface SolutionGroup {
  formula: LiveExpression | undefined;
  classifications: Classification[];
}

interface Triple {
  whole: LiveExpression;
  first: LiveExpression;
  second: LiveExpression;
}

const MAXIMUM_DISJUNCTS = 2147483647;

const TRUE: LiveBoolean = { kind: "Boolean", value: true };
const FALSE: LiveBoolean = { kind: "Boolean", value: false };

export const createBoolean = (value: boolean) => (value ? TRUE : FALSE);

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
      return CONSTANT_LEVEL;
    case "State":
    case "Enabled":
      return VARIABLE_LEVEL;
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
        CONSTANT_LEVEL,
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

const termKeys = new WeakMap<LiveExpression, string>();
let atomCount = 0;

export const getTermKey = (expression: LiveExpression): string => {
  const cached = termKeys.get(expression);
  if (cached !== undefined) return cached;
  const key = (() => {
    switch (expression.kind) {
      case "Boolean":
        return String(expression.value);
      case "State":
      case "Enabled":
      case "Action":
        return `#${atomCount++}`;
      case "And":
      case "Or":
        return `${expression.kind}(${expression.operands.map(getTermKey).join(",")})`;
      default:
        return `${expression.kind}(${getTermKey(expression.body)})`;
    }
  })();
  termKeys.set(expression, key);
  return key;
};

const isEqual = (left: LiveExpression, right: LiveExpression) =>
  left === right || getTermKey(left) === getTermKey(right);

const isMember = (items: LiveExpression[], expression: LiveExpression) => {
  const key = getTermKey(expression);
  return items.some((item) => item === expression || getTermKey(item) === key);
};

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
      let total = 1;
      for (const operand of expression.operands) {
        const normal = toDisjunctiveNormalForm(operand);
        if (normal.kind === "And") {
          items.push(...normal.operands);
          continue;
        }
        if (normal.kind === "Or") {
          total *= normal.operands.length;
          if (total > MAXIMUM_DISJUNCTS) {
            throw new TlaEvaluationError(
              "TLC cannot handle the temporal formula because it exceeds the maximum supported size in disjunctive normal form.",
            );
          }
        }
        items.push(normal);
      }
      if (total === 1) return { kind: "And", operands: items };
      const conjunctions = Array.from({ length: total }, (): LiveExpression[] => []);
      let groups = 1;
      let repeat = total;
      for (const item of items) {
        if (item.kind !== "Or") {
          conjunctions.forEach((conjunction) => conjunction.push(item));
          continue;
        }
        repeat /= item.operands.length;
        let position = 0;
        for (let group = 0; group < groups; group++) {
          for (const operand of item.operands) {
            for (let copy = 0; copy < repeat; copy++) {
              conjunctions[position++].push(operand);
            }
          }
        }
        groups *= item.operands.length;
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
) => {
  if (term.kind === repeated && "body" in term) {
    return { first: term.body, second: createUnary("Next", term) };
  }
  if (term.kind === junction && "operands" in term) {
    return { first: term.operands[0], second: term.operands[1] };
  }
  return undefined;
};

const getTriples = (
  closure: LiveExpression[],
  repeated: "Always" | "Eventually",
  junction: "And" | "Or",
) =>
  closure.flatMap((term): Triple[] => {
    const parts = getExpansion(term, repeated, junction);
    return parts ? [{ whole: term, first: parts.first, second: parts.second }] : [];
  });

// A particle's terms in the order they joined it, and the set of their ids as a bitset.
interface Particle {
  terms: LiveExpression[];
  bits: number[];
}

// Gives each distinct term of a tableau an id, by its key.
const createTermIds = () => {
  const ids = new Map<string, number>();
  return (term: LiveExpression) => {
    const key = getTermKey(term);
    const id = ids.get(key) ?? ids.size;
    if (id === ids.size) ids.set(key, id);
    return id;
  };
};

const hasBit = (bits: number[], id: number) => (((bits[id >>> 5] ?? 0) >>> (id & 31)) & 1) === 1;

const setBit = (bits: number[], id: number) => {
  while (bits.length <= id >>> 5) bits.push(0);
  bits[id >>> 5] |= 1 << (id & 31);
};

// The same key for particles with the same terms.
const getParticleKey = (particle: Particle) => {
  let end = particle.bits.length;
  while (end > 0 && particle.bits[end - 1] === 0) end--;
  return particle.bits.slice(0, end).join(",");
};

const unionParticles = (left: Particle[], right: Particle[]) => {
  const rightKeys = new Set(right.map(getParticleKey));
  return [...left.filter((particle) => !rightKeys.has(getParticleKey(particle))), ...right];
};

const getParticleClosure = (
  terms: LiveExpression[],
  getId: (term: LiveExpression) => number,
): Particle[] => {
  const closure = getPositiveClosure(terms);
  const getIds = (triples: Triple[]) =>
    triples.map((triple) => ({
      ...triple,
      wholeId: getId(triple.whole),
      firstId: getId(triple.first),
      secondId: getId(triple.second),
    }));
  const alphas = getIds(getTriples(closure, "Always", "And"));
  const betas = getIds(getTriples(closure, "Eventually", "Or"));
  // The expansion of each term of the closure that has one, by its id. A particle holds only terms
  // with the keys of the closure's terms.
  const alphaOf: (typeof alphas)[number][] = [];
  alphas.forEach((triple) => (alphaOf[triple.wholeId] = triple));
  const betaOf: (typeof betas)[number][] = [];
  betas.forEach((triple) => (betaOf[triple.wholeId] = triple));
  const isMember = (particle: Particle, term: LiveExpression) => hasBit(particle.bits, getId(term));
  const extend = (particle: Particle, term: LiveExpression): Particle => {
    const bits = [...particle.bits];
    setBit(bits, getId(term));
    return { terms: [...particle.terms, term], bits };
  };
  // A particle is inconsistent where it holds a state atom and its negation.
  const isLocallyConsistent = (particle: Particle) =>
    !particle.terms.some(
      (term) => term.kind === "Not" && isStateAtom(term.body) && isMember(particle, term.body),
    );

  const expandBeta = (particle: Particle): Particle[] => {
    for (const term of particle.terms) {
      const parts = betaOf[getId(term)];
      if (!parts) continue;
      if (hasBit(particle.bits, parts.firstId) || hasBit(particle.bits, parts.secondId)) continue;
      return unionParticles(
        expand(extend(particle, parts.first)),
        expand(extend(particle, parts.second)),
      );
    }
    const beta = betas.find(
      (triple) =>
        (hasBit(particle.bits, triple.firstId) || hasBit(particle.bits, triple.secondId)) &&
        !hasBit(particle.bits, triple.wholeId),
    );
    return beta ? expand(extend(particle, beta.whole)) : [particle];
  };

  const expand = (particle: Particle): Particle[] => {
    if (!isLocallyConsistent(particle)) return [];
    const expanded: Particle = { terms: [...particle.terms], bits: [...particle.bits] };
    const push = (term: LiveExpression) => {
      expanded.terms.push(term);
      setBit(expanded.bits, getId(term));
    };
    for (let index = 0; index < expanded.terms.length; index++) {
      const parts = alphaOf[getId(expanded.terms[index])];
      if (!parts) continue;
      if (!hasBit(expanded.bits, parts.firstId)) push(parts.first);
      if (!hasBit(expanded.bits, parts.secondId)) push(parts.second);
    }
    let isChanged = true;
    while (isChanged) {
      isChanged = false;
      for (const alpha of alphas) {
        const isImplied =
          hasBit(expanded.bits, alpha.firstId) &&
          hasBit(expanded.bits, alpha.secondId) &&
          !hasBit(expanded.bits, alpha.wholeId);
        if (isImplied) {
          push(alpha.whole);
          isChanged = true;
        }
      }
    }
    if (expanded.terms.length > particle.terms.length && !isLocallyConsistent(expanded)) return [];
    return expandBeta(expanded);
  };

  const initial: Particle = { terms, bits: [] };
  terms.forEach((term) => setBit(initial.bits, getId(term)));
  return expand(initial);
};

const createTableauNode = (particle: LiveExpression[]): TableauNode => ({
  particle,
  successors: [],
  // Constant terms count even for TLC 1.7.4, whose FALSE terms yield a bogus counterexample (tlaplus#604).
  statePredicates: particle.filter((term) => getLiveLevel(term) <= VARIABLE_LEVEL),
});

const createTableau = (formula: LiveExpression) => {
  const getId = createTermIds();
  const particles = getParticleClosure([formula], getId);
  const nodes = particles.map((particle) => createTableauNode(particle.terms));
  const initialCount = nodes.length;
  const indices = new Map<string, number>();
  particles.forEach((particle, index) => {
    const key = getParticleKey(particle);
    if (!indices.has(key)) indices.set(key, index);
  });
  for (let index = 0; index < nodes.length; index++) {
    const implied = nodes[index].particle.flatMap((term) =>
      term.kind === "Next" ? [term.body] : [],
    );
    for (const particle of getParticleClosure(implied, getId)) {
      const key = getParticleKey(particle);
      const existing = indices.get(key);
      if (existing === undefined) {
        indices.set(key, nodes.length);
        nodes.push(createTableauNode(particle.terms));
      }
      nodes[index].successors.push(existing ?? nodes.length - 1);
    }
  }
  return { nodes, initialCount };
};

export const isFulfilling = (particle: LiveExpression[], promise: LiveUnary) =>
  !isMember(particle, promise) || isMember(particle, promise.body);

const classify = (expression: LiveExpression, classification: Classification) => {
  if (
    expression.kind === "Eventually" &&
    expression.body.kind === "Always" &&
    getLiveLevel(expression.body.body) < TEMPORAL_LEVEL
  ) {
    classification.eventuallyAlways.push(expression.body.body);
    return;
  }
  const infinitelyOften = getInfinitelyOftenBody(expression);
  if (infinitelyOften) {
    const level = getLiveLevel(infinitelyOften);
    if (level <= VARIABLE_LEVEL) {
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
      "Temporal formulas containing actions must be of forms <>[]A or []<>A.",
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
  const groups: SolutionGroup[] = [];
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
  return groups.map((group) => {
    const binary = group.formula && makeBinary(group.formula);
    const promises: LiveUnary[] = [];
    if (binary) extractPromises(binary, promises);
    const stateChecks: LiveExpression[] = [];
    const actionChecks: LiveExpression[] = [];
    const models = group.classifications.map((classification) => ({
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
