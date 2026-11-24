import {
  getChildren,
  getDefinitionExpressions,
  getReferencedName,
  isLocallyResolved,
  type Bound,
  type Definition,
  type Expression,
} from "./ast";
import type { Environment } from "./evaluate";
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";
import { getBoundNames } from "./resolve";

interface DefinitionNames extends Pick<
  Environment,
  | "definitions"
  | "theorems"
  | "substitutions"
  | "constants"
  | "bodyValues"
  | "variableIndex"
  | "builtins"
  | "variables"
> {}

const isLetSubstitute = (definition: Definition) => "isLetSubstitute" in definition;

const getFactExpressions = (definition: Definition, environment: DefinitionNames) =>
  environment.bodyValues.has(definition.body) ? [] : getDefinitionExpressions(definition);

export interface DefinitionFacts {
  ids: Map<Definition, number>;
  rows: Uint32Array;
  words: number;
  varyingBodies: Set<Expression>;
}

interface EffectRows {
  ids: Map<Definition, number>;
  effects: Uint32Array;
  words: number;
}

const NONCONSTANT = 1;
const IMPURE = 2;
const REPEATED_EFFECT = 4;
const STREAMED = 8;
const READS_IMPURE = 16;
const VARIABLE_LEVEL_FLAGS = 32;
const ACTION_LEVEL_FLAGS = VARIABLE_LEVEL_FLAGS | 64;
const TEMPORAL_LEVEL_FLAGS = ACTION_LEVEL_FLAGS | 128;
const RANDOM = 256;
const ABOVE_CONSTANT_BOUND = 512;
const TLC_EVAL = 1024;
const REEVALUATION_SHOWN = 2048;

const PARAMETER_REACH = 1;
const EFFECT_REACH = 2;
const OPERATOR_NAME = 4;

const ACTION_KINDS = new Set<Expression["kind"]>([
  "Prime",
  "Unchanged",
  "BoxAction",
  "AngleAction",
]);

const TEMPORAL_KINDS = new Set<Expression["kind"]>([
  "Always",
  "Eventually",
  "WeakFairness",
  "StrongFairness",
]);

const NONCONSTANT_KINDS = new Set<Expression["kind"]>([
  ...ACTION_KINDS,
  ...TEMPORAL_KINDS,
  "Enabled",
  "EnabledVariable",
]);

const TEMPORAL_OPERATORS = new Set(["~>", "-+->"]);

const NONCONSTANT_OPERATORS = new Set([...TEMPORAL_OPERATORS, "\\cdot"]);

const IMPURE_BUILTINS = new Set([
  "Print",
  "PrintT",
  "Assert",
  "JavaTime",
  "RandomElement",
  "TLCGet",
  "TLCSet",
  "JsonSerialize",
  "ndJsonSerialize",
  "JsonDeserialize",
  "ndJsonDeserialize",
  "Serialize",
]);

const STREAMED_BUILTINS = new Set(["UNION", "\\cup"]);

const RANDOM_BUILTINS = new Set(["RandomSubset", "RandomSetOfSubsets", "RandomSubsetSet"]);

interface Edge {
  callee: Definition;
  isOverridden: boolean;
  isLevelCounted: boolean;
  isBoundCounted: boolean;
  isSubstitute: boolean;
}

const collectLocalFacts = (
  expressions: Expression[],
  environment: DefinitionNames,
  words: number,
) => {
  const row = new Uint32Array(words);
  const edges: Edge[] = [];
  const getOwnLevelFlags = (node: Expression) => {
    const kind = node.kind;
    if (ACTION_KINDS.has(kind) || (kind === "Apply" && node.operator === "\\cdot")) {
      return ACTION_LEVEL_FLAGS;
    }
    if (kind === "Enabled" || kind === "EnabledVariable") return VARIABLE_LEVEL_FLAGS;
    if (
      TEMPORAL_KINDS.has(kind) ||
      (kind === "UnboundedQuantifier" && node.isTemporal === true) ||
      (kind === "Apply" && TEMPORAL_OPERATORS.has(node.operator))
    ) {
      return TEMPORAL_LEVEL_FLAGS;
    }
    return undefined;
  };
  const contexts = new Map<Expression, number>();
  const visit = (
    node: Expression,
    isLevelCounted: boolean,
    isOperatorArgument: boolean,
    substitutes: ReadonlyMap<string, Expression> | undefined,
  ) => {
    const kind = node.kind;
    if (kind === "Selection") {
      const seen = contexts.get(node.expression) ?? 0;
      const context = isLevelCounted ? (isOperatorArgument ? 1 : 2) : isOperatorArgument ? 4 : 8;
      if ((seen & context) !== 0) return;
      contexts.set(node.expression, seen | context);
    }
    // TLC's getLevelBound takes an operator argument for a constant.
    const nonconstantFlags = isOperatorArgument ? NONCONSTANT : NONCONSTANT | ABOVE_CONSTANT_BOUND;
    if (
      NONCONSTANT_KINDS.has(kind) ||
      (kind === "UnboundedQuantifier" && node.isTemporal === true) ||
      (kind === "Apply" && NONCONSTANT_OPERATORS.has(node.operator))
    ) {
      row[0] |= nonconstantFlags;
    }
    if (NONCONSTANT_KINDS.has(kind)) row[0] |= READS_IMPURE;
    const ownLevelFlags = getOwnLevelFlags(node);
    if (isLevelCounted && ownLevelFlags !== undefined) row[0] |= ownLevelFlags;
    const isInnerLevelCounted = isLevelCounted && ownLevelFlags === undefined;
    const name = getReferencedName(node);
    const isLocal = name !== undefined && isLocallyResolved(node);
    // TLC's getLevelBound takes a parameter named like a variable for that variable.
    if (isLocal && environment.variableIndex.has(name)) {
      if (!isOperatorArgument) row[0] |= ABOVE_CONSTANT_BOUND;
      if (isInnerLevelCounted) row[0] |= VARIABLE_LEVEL_FLAGS;
    }
    if (name !== undefined && !isLocal) {
      const target = environment.substitutions.get(name) ?? name;
      const definition = environment.definitions.get(target);
      const isOverridden = environment.constants.has(name);
      const variableIndex = environment.variableIndex.get(name);
      const builtin = environment.builtins.get(target);
      if (
        variableIndex !== undefined ||
        builtin?.isStateLevel ||
        (definition && environment.variableIndex.has(definition.name))
      ) {
        // TLC's getLevelBound takes an operator argument for a constant.
        row[0] |=
          kind === "Identifier" && builtin && builtin.arity > 0 ? NONCONSTANT : nonconstantFlags;
      }
      if (variableIndex !== undefined) {
        if (isInnerLevelCounted) row[0] |= VARIABLE_LEVEL_FLAGS;
        if (!isOverridden) row[1 + (variableIndex >>> 5)] |= 1 << (variableIndex & 31);
      }
      if (definition) {
        edges.push({
          callee: definition,
          isOverridden,
          isLevelCounted: isInnerLevelCounted,
          // TLC's getLevelBound reads neither an operator argument's body nor a theorem's.
          isBoundCounted: !(
            isOperatorArgument ||
            kind === "OperatorReference" ||
            (kind === "Identifier" &&
              definition.kind === "Operator" &&
              definition.params.length > 0) ||
            environment.theorems.has(target)
          ),
          // Spec#lookup gives a substituted constant or definition its substitute's OpDefNode, whose body Tool#evalAppl evaluates at each reference.
          isSubstitute: target !== name,
        });
      } else {
        const builtinName = builtin?.name ?? target;
        const isImpure = IMPURE_BUILTINS.has(builtinName) || builtin?.isStateLevel === true;
        if (isImpure) row[0] |= IMPURE | (builtinName === "Assert" ? 0 : REPEATED_EFFECT);
        if (STREAMED_BUILTINS.has(target)) row[0] |= STREAMED;
        if (builtin && RANDOM_BUILTINS.has(builtin.name)) row[0] |= RANDOM;
        if (target === "TLCEval") row[0] |= TLC_EVAL;
        if (!isOverridden && isImpure) row[0] |= READS_IMPURE;
        if (
          isInnerLevelCounted &&
          !isOverridden &&
          variableIndex === undefined &&
          builtin?.isStateLevel &&
          !builtin.isLevelConstant
        ) {
          row[0] |= builtin.isActionLevel ? ACTION_LEVEL_FLAGS : VARIABLE_LEVEL_FLAGS;
        }
      }
    }
    const substitute = isLocal ? substitutes?.get(name) : undefined;
    if (substitute) visit(substitute, isInnerLevelCounted, isOperatorArgument, substitutes);
    // TLC's SubstInNode binds a LET instance's substitute lazily, so its level counts only where the instanced definition reads it.
    if (
      kind === "Let" &&
      node.definitions.some(
        (definition) => isLetSubstitute(definition) || "standardDefinition" in definition,
      )
    ) {
      const innerSubstitutes = new Map(substitutes);
      node.definitions.forEach((definition) => {
        if (isLetSubstitute(definition)) innerSubstitutes.set(definition.name, definition.body);
      });
      node.definitions.forEach((definition) => {
        if (isLetSubstitute(definition)) return;
        // TLC's getLevelBound reads a standard operator's TLA+ definition, not the builtin a LET instance's alias forwards to.
        if ("standardDefinition" in definition) {
          visit(definition.body, isInnerLevelCounted, true, innerSubstitutes);
          getDefinitionExpressions(definition.standardDefinition).forEach((expression) =>
            visit(expression, false, isOperatorArgument, undefined),
          );
          return;
        }
        getDefinitionExpressions(definition).forEach((child) =>
          visit(child, isInnerLevelCounted, isOperatorArgument, innerSubstitutes),
        );
      });
      visit(node.body, isInnerLevelCounted, isOperatorArgument, innerSubstitutes);
      return;
    }
    getChildren(node).forEach((child) =>
      visit(child, isInnerLevelCounted, isOperatorArgument || kind === "Lambda", substitutes),
    );
  };
  expressions.forEach((expression) => visit(expression, true, false, undefined));
  return { row, edges };
};

const closeRows = (local: Uint32Array, words: number, edges: Int32Array[], mask: number) => {
  const count = edges.length;
  const closed = local.slice();
  const index = new Int32Array(count).fill(-1);
  const lowLink = new Int32Array(count);
  const component = new Int32Array(count).fill(-1);
  const stack: number[] = [];
  const frames: number[] = [];
  let nextIndex = 0;
  let componentCount = 0;
  const orRow = (into: number, from: number) => {
    for (let word = 0; word < words; word++) {
      const bits = closed[from * words + word];
      closed[into * words + word] |= word === 0 ? bits & mask : bits;
    }
  };
  const enter = (node: number) => {
    frames.push(node, 0);
    index[node] = lowLink[node] = nextIndex++;
    stack.push(node);
  };
  for (let root = 0; root < count; root++) {
    if (index[root] !== -1) continue;
    enter(root);
    while (frames.length > 0) {
      const node = frames[frames.length - 2];
      const position = frames[frames.length - 1];
      const nodeEdges = edges[node];
      if (position < nodeEdges.length) {
        frames[frames.length - 1] = position + 1;
        const callee = nodeEdges[position];
        if (index[callee] === -1) {
          enter(callee);
        } else if (component[callee] === -1) {
          lowLink[node] = Math.min(lowLink[node], index[callee]);
        }
        continue;
      }
      frames.length -= 2;
      if (frames.length > 0) {
        const caller = frames[frames.length - 2];
        lowLink[caller] = Math.min(lowLink[caller], lowLink[node]);
      }
      if (lowLink[node] !== index[node]) continue;
      const members: number[] = [];
      for (;;) {
        const member = stack.pop() ?? node;
        component[member] = componentCount;
        members.push(member);
        if (member === node) break;
      }
      componentCount++;
      const first = members[0];
      members.forEach((member) => {
        if (member !== first) orRow(first, member);
        edges[member].forEach((callee) => {
          if (component[callee] !== component[first]) orRow(first, callee);
        });
      });
      members.forEach((member) => {
        if (member !== first) orRow(member, first);
      });
    }
  }
  return closed;
};

const PURITY_MASK = IMPURE | REPEATED_EFFECT | STREAMED | RANDOM | TLC_EVAL;
const EFFECT_MASK = IMPURE | RANDOM;
// TLC streams a fresh \cup or UNION as it streams the startup value.
const SHOWN_MASK = IMPURE | REPEATED_EFFECT | RANDOM | TLC_EVAL;
const READ_MASK = NONCONSTANT | READS_IMPURE;
const STARTUP_MASK = NONCONSTANT | ABOVE_CONSTANT_BOUND;

const isEvaluatedOnce = (definition: Definition, flags: number) =>
  definition.kind === "Operator" && definition.params.length === 0 && (flags & STARTUP_MASK) === 0;

export const createDefinitionFacts = (
  environment: DefinitionNames,
  assumptions: Expression[],
): DefinitionFacts => {
  const definitions = [...new Set(environment.definitions.values())];
  const ids = new Map(definitions.map((definition, id) => [definition, id]));
  const words = 1 + ((environment.variables.length + 31) >>> 5);
  const local = new Uint32Array(definitions.length * words);
  const localImpurity = new Uint32Array(definitions.length * words);
  const edges = definitions.map((definition, id) => {
    const facts = collectLocalFacts(
      getFactExpressions(definition, environment),
      environment,
      words,
    );
    local.set(facts.row, id * words);
    localImpurity[id * words] = facts.row[0] & PURITY_MASK;
    return facts.edges;
  });
  const getId = (edge: Edge) => ids.get(edge.callee) ?? -1;
  const readEdges = edges.map(
    (own) => new Int32Array(own.filter((edge) => !edge.isOverridden).map(getId)),
  );
  const reads = closeRows(local, words, readEdges, READ_MASK);
  const levelEdges = edges.map(
    (own) =>
      new Int32Array(own.filter((edge) => !edge.isOverridden && edge.isLevelCounted).map(getId)),
  );
  const levels = closeRows(local, words, levelEdges, TEMPORAL_LEVEL_FLAGS);
  const startupEdges = edges.map(
    (own) =>
      new Int32Array(own.filter((edge) => !edge.isOverridden && edge.isBoundCounted).map(getId)),
  );
  const startup = closeRows(local, words, startupEdges, ABOVE_CONSTANT_BOUND);
  const isRecomputed = (edge: Edge) => {
    const callee = getId(edge);
    return !isEvaluatedOnce(edge.callee, reads[callee * words] | startup[callee * words]);
  };
  // SpecProcessor#processConstantDefns evaluates a substitute before it stores the definitions the substitute reads, so their draws and output can show again.
  const shown =
    environment.substitutions.size > 0
      ? closeRows(localImpurity, words, readEdges, SHOWN_MASK)
      : localImpurity;
  const purity = closeRows(
    localImpurity,
    words,
    edges.map(
      (own) =>
        new Int32Array(
          own
            .filter(
              (edge) =>
                isRecomputed(edge) ||
                (edge.isSubstitute && (shown[getId(edge) * words] & SHOWN_MASK) !== 0),
            )
            .map(getId),
        ),
    ),
    PURITY_MASK,
  );
  const rows = reads.map((word, position) =>
    position % words === 0
      ? (word & READ_MASK) |
        (startup[position] & ABOVE_CONSTANT_BOUND) |
        (levels[position] & TEMPORAL_LEVEL_FLAGS) |
        (purity[position] & PURITY_MASK) |
        ((shown[position] & SHOWN_MASK) === 0 ? 0 : REEVALUATION_SHOWN)
      : word,
  );
  const effects = closeRows(localImpurity, words, readEdges, EFFECT_MASK);
  return {
    ids,
    rows,
    words,
    varyingBodies: collectVaryingBodies(definitions, assumptions, environment, {
      ids,
      effects,
      words,
    }),
  };
};

const getRow = (definition: Definition, environment: Environment): Uint32Array => {
  const facts = environment.facts;
  const id = facts.ids.get(definition);
  return id === undefined
    ? getExpressionsRow(getFactExpressions(definition, environment), environment)
    : facts.rows.subarray(id * facts.words, (id + 1) * facts.words);
};

const getExpressionsRow = (expressions: Expression[], environment: Environment) => {
  const words = environment.facts.words;
  const local = collectLocalFacts(expressions, environment, words);
  const row = local.row;
  local.edges.forEach((edge) => {
    const callee = getRow(edge.callee, environment);
    if (!edge.isOverridden) {
      row[0] |= callee[0] & READ_MASK;
      if (edge.isBoundCounted) row[0] |= callee[0] & ABOVE_CONSTANT_BOUND;
      if (edge.isLevelCounted) row[0] |= callee[0] & TEMPORAL_LEVEL_FLAGS;
      for (let word = 1; word < words; word++) row[word] |= callee[word];
    }
    if (
      !isEvaluatedOnce(edge.callee, callee[0]) ||
      (edge.isSubstitute && (callee[0] & REEVALUATION_SHOWN) !== 0)
    ) {
      row[0] |= callee[0] & PURITY_MASK;
    }
  });
  return row;
};

const getOuterReach = (expressions: Expression[], scope: ReadonlyMap<string, number>) => {
  let reach = 0;
  const visit = (node: Expression) => {
    const name = getReferencedName(node);
    if (name !== undefined && (isLocallyResolved(node) || node.kind === "OperatorReference")) {
      reach |= scope.get(name) ?? 0;
    }
    getChildren(node).forEach(visit);
  };
  if (scope.size > 0) expressions.forEach(visit);
  return reach & (PARAMETER_REACH | EFFECT_REACH);
};

const bindNames = (scope: ReadonlyMap<string, number>, names: string[], reach: number) =>
  reach === 0
    ? scope
    : new Map([...scope, ...names.map((name): [string, number] => [name, reach])]);

const isParameterized = (definition: Definition) =>
  definition.kind !== "Function" && definition.params.length > 0;

const isOperatorName = (
  node: Expression,
  scope: ReadonlyMap<string, number>,
  environment: DefinitionNames,
) => {
  const name = getReferencedName(node);
  if (name === undefined || node.kind === "Apply") return false;
  if (isLocallyResolved(node) || scope.has(name)) {
    return ((scope.get(name) ?? 0) & OPERATOR_NAME) !== 0;
  }
  const target = environment.substitutions.get(name) ?? name;
  const definition = environment.definitions.get(target);
  return definition === undefined
    ? (environment.builtins.get(target)?.arity ?? 0) > 0
    : isParameterized(definition);
};

const collectVaryingBodies = (
  definitions: Definition[],
  assumptions: Expression[],
  environment: DefinitionNames,
  effectRows: EffectRows,
) => {
  const varyingBodies = new Set<Expression>();
  const parameterBodies: Expression[] = [];
  let hasEffectfulValue = false;
  const words = effectRows.words;
  const isEffectfulDefinition = (id: number) =>
    (effectRows.effects[id * words] & EFFECT_MASK) !== 0;
  const hasEffect = (expressions: Expression[]) => {
    const facts = collectLocalFacts(expressions, environment, words);
    return (
      (facts.row[0] & EFFECT_MASK) !== 0 ||
      facts.edges.some(
        (edge) =>
          !edge.isOverridden && isEffectfulDefinition(effectRows.ids.get(edge.callee) ?? -1),
      )
    );
  };
  const getReach = (
    expressions: Expression[],
    scope: ReadonlyMap<string, number>,
    isEffectful: boolean,
  ) =>
    (isEffectful && hasEffect(expressions) ? EFFECT_REACH : 0) | getOuterReach(expressions, scope);
  const addValue = (
    expressions: Expression[],
    scope: ReadonlyMap<string, number>,
    isEffectful: boolean,
  ) => {
    hasEffectfulValue ||= isEffectful && (getReach(expressions, scope, true) & EFFECT_REACH) !== 0;
  };
  const addBody = (
    expressions: Expression[],
    body: Expression,
    scope: ReadonlyMap<string, number>,
    isEffectful: boolean,
  ) => {
    const reach = getOuterReach(expressions, scope);
    if ((reach & EFFECT_REACH) !== 0) varyingBodies.add(body);
    else if (reach !== 0) parameterBodies.push(body);
    addValue(expressions, scope, isEffectful);
  };
  const visitBounds = (
    bounds: Bound[],
    body: Expression,
    reach: number,
    scope: ReadonlyMap<string, number>,
    isEffectful: boolean,
  ) => {
    const sets = bounds.map((bound) => bound.set);
    sets.forEach((set) => visit(set, scope, isEffectful));
    const boundReach = reach | getReach(sets, scope, isEffectful);
    visit(body, bindNames(scope, getBoundNames(bounds), boundReach), isEffectful);
  };
  const visitDefinition = (
    definition: Definition,
    scope: ReadonlyMap<string, number>,
    isEffectful: boolean,
  ) => {
    if (definition.kind !== "Function") {
      const params = definition.params.map((param) => param.name);
      visit(definition.body, bindNames(scope, params, PARAMETER_REACH), isEffectful);
      return;
    }
    const bodyScope = new Map(scope).set(definition.name, 0);
    addBody([definition.body], definition.body, bodyScope, isEffectful);
    visitBounds(definition.bounds, definition.body, PARAMETER_REACH, scope, isEffectful);
  };
  const visit = (
    node: Expression,
    scope: ReadonlyMap<string, number>,
    isEffectful: boolean,
  ): void => {
    if (isEffectful && node.kind === "Apply") {
      node.args.forEach((arg) => {
        if (isOperatorName(arg, scope, environment)) addValue([arg], scope, true);
      });
    }
    switch (node.kind) {
      case "Lambda":
        addValue([node.body], scope, isEffectful);
        return visit(node.body, bindNames(scope, node.params, PARAMETER_REACH), isEffectful);
      case "Let": {
        const isRecursive = node.definitions.some((definition) => definition.isRecursive);
        const sharedReach = isRecursive
          ? getReach(node.definitions.flatMap(getDefinitionExpressions), scope, isEffectful)
          : 0;
        let inner: Map<string, number> | undefined;
        node.definitions.forEach((definition) => {
          const reach = isRecursive
            ? sharedReach
            : getReach(getDefinitionExpressions(definition), inner ?? scope, isEffectful);
          // Tool#getNextStates evaluates a LET definition at each use, so one that reaches an effect through another varies too.
          if ((reach & EFFECT_REACH) !== 0 && definition.kind === "Operator") {
            varyingBodies.add(definition.body);
          }
          if (reach !== 0) {
            inner ??= new Map(scope);
            inner.set(definition.name, isParameterized(definition) ? reach | OPERATOR_NAME : reach);
          }
        });
        const bodyScope = inner ?? scope;
        node.definitions.forEach((definition) =>
          visitDefinition(definition, bodyScope, isEffectful),
        );
        return visit(node.body, bodyScope, isEffectful);
      }
      case "FunctionConstruction":
        addBody([node.body], node.body, scope, isEffectful);
        return visitBounds(node.bounds, node.body, PARAMETER_REACH, scope, isEffectful);
      case "Forall":
      case "Exists":
        return visitBounds(node.bounds, node.body, 0, scope, isEffectful);
      case "SetMap":
        return visitBounds(node.bounds, node.expression, 0, scope, isEffectful);
      case "SetFilter":
        addBody([node.bound.set, node.predicate], node.predicate, scope, isEffectful);
        return visitBounds([node.bound], node.predicate, PARAMETER_REACH, scope, isEffectful);
      case "Choose":
        return node.set
          ? visitBounds(
              [{ pattern: node.pattern, set: node.set }],
              node.body,
              0,
              scope,
              isEffectful,
            )
          : visit(node.body, scope, isEffectful);
      default:
        return getChildren(node).forEach((child) => visit(child, scope, isEffectful));
    }
  };
  definitions.forEach((definition, id) => {
    if (environment.bodyValues.has(definition.body)) return;
    visitDefinition(definition, new Map(), isEffectfulDefinition(id));
  });
  assumptions.forEach((assumption) => visit(assumption, new Map(), hasEffect([assumption])));
  if (hasEffectfulValue) parameterBodies.forEach((body) => varyingBodies.add(body));
  return varyingBodies;
};

export const isConstantLevel = (definition: Definition, environment: Environment) =>
  (getRow(definition, environment)[0] & STARTUP_MASK) === 0;

export const isEvaluatedAtStartup = (definition: Definition, environment: Environment) =>
  (getRow(definition, environment)[0] & ABOVE_CONSTANT_BOUND) === 0;

export const isReevaluationShown = (definition: Definition, environment: Environment) =>
  (getRow(definition, environment)[0] & (REEVALUATION_SHOWN | STARTUP_MASK)) !== 0;

const EFFECT_FLAGS = {
  any: IMPURE,
  repeated: REPEATED_EFFECT,
  streamed: STREAMED,
  // What a second evaluation shows: output again, or other random draws.
  replayed: REPEATED_EFFECT | RANDOM,
  varying: EFFECT_MASK,
};

export const isExpressionImpure = (
  expressions: Expression[],
  environment: Environment,
  effect: keyof typeof EFFECT_FLAGS,
) => (getExpressionsRow(expressions, environment)[0] & EFFECT_FLAGS[effect]) !== 0;

export const hasEffectfulDefinition = (environment: Environment) => {
  const facts = environment.facts;
  for (let id = 0; id < facts.ids.size; id++) {
    if ((facts.rows[id * facts.words] & EFFECT_MASK) !== 0) return true;
  }
  return false;
};

export const isBodyVarying = (
  expressions: Expression[],
  body: Expression,
  environment: Environment,
) =>
  environment.facts.varyingBodies.has(body) ||
  isExpressionImpure(expressions, environment, "varying");

export const isImpureDefinition = (
  definition: Definition,
  environment: Environment,
  effect: keyof typeof EFFECT_FLAGS = "any",
) => (getRow(definition, environment)[0] & EFFECT_FLAGS[effect]) !== 0;

export const isDefinitionVarying = (definition: Definition, environment: Environment) =>
  environment.facts.varyingBodies.has(definition.body) ||
  isImpureDefinition(definition, environment, "varying");

export const isTlcEvalReached = (expression: Expression, environment: Environment) =>
  (getExpressionsRow([expression], environment)[0] & TLC_EVAL) !== 0;

export const getDefinitionLevel = (definition: Definition, environment: Environment) => {
  const flags = getRow(definition, environment)[0] & TEMPORAL_LEVEL_FLAGS;
  return flags === TEMPORAL_LEVEL_FLAGS
    ? TEMPORAL_LEVEL
    : flags === ACTION_LEVEL_FLAGS
      ? ACTION_LEVEL
      : flags === VARIABLE_LEVEL_FLAGS
        ? VARIABLE_LEVEL
        : CONSTANT_LEVEL;
};

const toVariables = (row: Uint32Array) => {
  const variables: number[] = [];
  for (let word = 1; word < row.length; word++) {
    for (let bits = row[word]; bits !== 0; bits &= bits - 1) {
      variables.push(((word - 1) << 5) + (31 - Math.clz32(bits & -bits)));
    }
  }
  return variables;
};

export const getReadVariables = (
  expression: Expression,
  environment: Environment,
): number[] | undefined => {
  const row = getExpressionsRow([expression], environment);
  return row[0] & READS_IMPURE ? undefined : toVariables(row);
};

export const isNonconstant = (expression: Expression, environment: Environment) =>
  (getExpressionsRow([expression], environment)[0] & NONCONSTANT) !== 0;
