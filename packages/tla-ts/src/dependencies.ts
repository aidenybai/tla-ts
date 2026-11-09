import { getChildren, isLocallyResolved, type Definition, type Expression } from "./ast";
import type { Environment } from "./evaluate";
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";

// The names of a spec that the facts depend on, which are final before the environment is built.
interface DefinitionNames extends Pick<
  Environment,
  "definitions" | "substitutions" | "constants" | "variableIndex" | "builtins" | "variables"
> {}

// What TLC's evaluation needs to know about each definition of a spec: whether it is constant-level,
// which effects evaluating it has, which variables it reads and its liveness level. Each fact is
// reachability over the definitions it calls, so one pass over the spec's call graph computes them
// all, once, when the environment is created. A row of words holds a definition's facts: the first
// word holds the flags below, and the rest a bitset of the variables it reads.
export interface DefinitionFacts {
  ids: Map<Definition, number>;
  rows: Uint32Array;
  // The words of each row: one of flags, then one per 32 variables.
  words: number;
}

// The definition reads a variable, a state-level builtin, or an action or temporal operator.
const NONCONSTANT = 1;
// Evaluating the definition again can print, assert, read the clock or choose at random.
const IMPURE = 2;
// Like IMPURE, but an Assert that held holds again, so repeating it looks the same.
const REPEATED_EFFECT = 4;
// The definition builds a set with UNION or \cup, which streams until TLC caches it.
const STREAMED = 8;
// The variables the definition reads don't decide its value: it has an effect, or it is an action.
const READS_IMPURE = 16;
// The liveness level of the definition, as thresholds so that reachability is a bitwise or.
const VARIABLE_LEVEL_FLAGS = 32;
const ACTION_LEVEL_FLAGS = VARIABLE_LEVEL_FLAGS | 64;
const TEMPORAL_LEVEL_FLAGS = ACTION_LEVEL_FLAGS | 128;

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

// TLC bounds the level of every action and temporal operator above constant, whatever its operands.
const NONCONSTANT_KINDS = new Set<Expression["kind"]>([
  ...ACTION_KINDS,
  ...TEMPORAL_KINDS,
  "Enabled",
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
]);

// UNION and \cup build sets that stream the sets they combine until TLC caches them, and TLC
// builds a new one at each evaluation.
const STREAMED_BUILTINS = new Set(["UNION", "\\cup"]);

const getReferencedName = (expression: Expression) => {
  if (expression.kind === "Identifier") return expression.name;
  if (expression.kind === "Apply" || expression.kind === "OperatorReference")
    return expression.operator;
  return undefined;
};

const isImpureBuiltin = (name: string, environment: DefinitionNames) =>
  IMPURE_BUILTINS.has(name) || environment.builtins.get(name)?.isStateLevel === true;

interface Edge {
  callee: Definition;
  // The configuration replaces the name by a constant value, which TLC's level and variable
  // analyses take for a constant and its effect analysis evaluates.
  isOverridden: boolean;
  // Whether the reference is outside every action and temporal operator, where the level of the
  // callee counts. An operator such as ENABLED fixes the level of what it holds.
  isLevelCounted: boolean;
}

// The facts an expression's own nodes establish, with the definitions it refers to.
const collectLocalFacts = (
  expressions: Expression[],
  environment: DefinitionNames,
  words: number,
) => {
  const row = new Uint32Array(words);
  const edges: Edge[] = [];
  // The level flags of a node, or undefined for a node whose level the nodes it holds decide. An
  // action or temporal operator has its own level whatever it holds, as does ENABLED, so nothing
  // below one counts towards the level, variables and callees included.
  const getOwnLevelFlags = (node: Expression) => {
    const kind = node.kind;
    if (ACTION_KINDS.has(kind) || (kind === "Apply" && node.operator === "\\cdot")) {
      return ACTION_LEVEL_FLAGS;
    }
    if (kind === "Enabled") return VARIABLE_LEVEL_FLAGS;
    if (
      TEMPORAL_KINDS.has(kind) ||
      (kind === "UnboundedQuantifier" && node.isTemporal === true) ||
      (kind === "Apply" && TEMPORAL_OPERATORS.has(node.operator))
    ) {
      return TEMPORAL_LEVEL_FLAGS;
    }
    return undefined;
  };
  const visit = (node: Expression, isLevelCounted: boolean) => {
    const kind = node.kind;
    if (
      NONCONSTANT_KINDS.has(kind) ||
      (kind === "UnboundedQuantifier" && node.isTemporal === true) ||
      (kind === "Apply" && NONCONSTANT_OPERATORS.has(node.operator))
    ) {
      row[0] |= NONCONSTANT;
    }
    if (NONCONSTANT_KINDS.has(kind)) row[0] |= READS_IMPURE;
    const ownLevelFlags = getOwnLevelFlags(node);
    if (isLevelCounted && ownLevelFlags !== undefined) row[0] |= ownLevelFlags;
    const isInnerLevelCounted = isLevelCounted && ownLevelFlags === undefined;
    const name = getReferencedName(node);
    if (name !== undefined && !isLocallyResolved(node)) {
      const target = environment.substitutions.get(name) ?? name;
      const definition = environment.definitions.get(target);
      const isOverridden = environment.constants.has(name);
      const variableIndex = environment.variableIndex.get(name);
      if (variableIndex !== undefined || environment.builtins.get(name)?.isStateLevel) {
        row[0] |= NONCONSTANT;
      }
      if (variableIndex !== undefined) {
        if (isInnerLevelCounted) row[0] |= VARIABLE_LEVEL_FLAGS;
        if (!isOverridden) row[1 + (variableIndex >>> 5)] |= 1 << (variableIndex & 31);
      }
      if (definition) {
        edges.push({ callee: definition, isOverridden, isLevelCounted: isInnerLevelCounted });
      } else {
        if (isImpureBuiltin(name, environment)) {
          row[0] |= IMPURE | (name === "Assert" ? 0 : REPEATED_EFFECT);
        }
        if (STREAMED_BUILTINS.has(name)) row[0] |= STREAMED;
        if (!isOverridden && isImpureBuiltin(target, environment)) row[0] |= READS_IMPURE;
        const builtin = environment.builtins.get(target);
        if (
          isInnerLevelCounted &&
          !isOverridden &&
          variableIndex === undefined &&
          builtin?.isStateLevel &&
          !builtin.isLevelConstant
        ) {
          row[0] |= VARIABLE_LEVEL_FLAGS;
        }
      }
    }
    getChildren(node).forEach((child) => visit(child, isInnerLevelCounted));
  };
  expressions.forEach((expression) => visit(expression, true));
  return { row, edges };
};

const getDefinitionExpressions = (definition: Definition) =>
  definition.kind === "Function"
    ? [...definition.bounds.map((bound) => bound.set), definition.body]
    : [definition.body];

// Closes each row under bitwise or along the edges: a definition's facts are its own and those of
// every definition it reaches. Tarjan's algorithm lists the strongly connected components with the
// callees first, so each component ors in components that are already final.
const closeRows = (local: Uint32Array, words: number, edges: Int32Array[], mask: number) => {
  const count = edges.length;
  const closed = local.slice();
  const index = new Int32Array(count).fill(-1);
  const lowLink = new Int32Array(count);
  const component = new Int32Array(count).fill(-1);
  const stack: number[] = [];
  // The frame of a depth-first visit: the node and the edge it resumes at.
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
          // A visited node without a component is still on the stack.
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
      // The component is complete: its members share one row, which ors in their callees' rows.
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

const PURITY_MASK = IMPURE | REPEATED_EFFECT | STREAMED;
const READ_MASK = NONCONSTANT | READS_IMPURE;

// TLC evaluates a constant definition without parameters once, so only other definitions pass
// on the side effects and random choices of the builtins they call.
const isEvaluatedOnce = (definition: Definition, flags: number) =>
  definition.kind === "Operator" && definition.params.length === 0 && (flags & NONCONSTANT) === 0;

export const createDefinitionFacts = (environment: DefinitionNames): DefinitionFacts => {
  const definitions = [...new Set(environment.definitions.values())];
  const ids = new Map(definitions.map((definition, id) => [definition, id]));
  const words = 1 + ((environment.variables.length + 31) >>> 5);
  const local = new Uint32Array(definitions.length * words);
  const localImpurity = new Uint32Array(definitions.length * words);
  const edges = definitions.map((definition, id) => {
    const facts = collectLocalFacts(getDefinitionExpressions(definition), environment, words);
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
  const purityEdges = edges.map(
    (own) =>
      new Int32Array(
        own
          .map(getId)
          .filter((callee) => !isEvaluatedOnce(definitions[callee], reads[callee * words])),
      ),
  );
  const purity = closeRows(localImpurity, words, purityEdges, PURITY_MASK);
  const rows = reads.map((word, position) =>
    position % words === 0
      ? (word & READ_MASK) |
        (levels[position] & TEMPORAL_LEVEL_FLAGS) |
        (purity[position] & PURITY_MASK)
      : word,
  );
  return { ids, rows, words };
};

// The facts of a definition: from the table, or for a LET definition from its own body and the
// table's rows of the definitions it calls.
const getRow = (definition: Definition, environment: Environment): Uint32Array => {
  const facts = environment.facts;
  const id = facts.ids.get(definition);
  return id === undefined
    ? getExpressionsRow(getDefinitionExpressions(definition), environment)
    : facts.rows.subarray(id * facts.words, (id + 1) * facts.words);
};

// The facts of expressions: their own, with the rows of the definitions they call ored in.
const getExpressionsRow = (expressions: Expression[], environment: Environment) => {
  const words = environment.facts.words;
  const local = collectLocalFacts(expressions, environment, words);
  const row = local.row;
  local.edges.forEach((edge) => {
    const callee = getRow(edge.callee, environment);
    if (!edge.isOverridden) {
      row[0] |= callee[0] & READ_MASK;
      if (edge.isLevelCounted) row[0] |= callee[0] & TEMPORAL_LEVEL_FLAGS;
      for (let word = 1; word < words; word++) row[word] |= callee[word];
    }
    if (!isEvaluatedOnce(edge.callee, callee[0])) row[0] |= callee[0] & PURITY_MASK;
  });
  return row;
};

const EFFECT_FLAGS = { any: IMPURE, repeated: REPEATED_EFFECT, streamed: STREAMED };

// Whether evaluating the expressions can show, through the definitions they call.
export const isExpressionImpure = (
  expressions: Expression[],
  environment: Environment,
  effect: keyof typeof EFFECT_FLAGS = "any",
) => (getExpressionsRow(expressions, environment)[0] & EFFECT_FLAGS[effect]) !== 0;

export const isConstantLevel = (definition: Definition, environment: Environment) =>
  (getRow(definition, environment)[0] & NONCONSTANT) === 0;

export const isImpureDefinition = (
  definition: Definition,
  environment: Environment,
  effect: keyof typeof EFFECT_FLAGS = "any",
) => (getRow(definition, environment)[0] & EFFECT_FLAGS[effect]) !== 0;

// The liveness level of a definition: constant, variable, action or temporal.
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

// The variables an expression reads, through the definitions it calls, when they and its scope
// decide its value, or undefined when it has an effect or is an action.
export const getReadVariables = (
  expression: Expression,
  environment: Environment,
): number[] | undefined => {
  const row = getExpressionsRow([expression], environment);
  return row[0] & READS_IMPURE ? undefined : toVariables(row);
};

export const isNonconstant = (expression: Expression, environment: Environment) =>
  (getExpressionsRow([expression], environment)[0] & NONCONSTANT) !== 0;
