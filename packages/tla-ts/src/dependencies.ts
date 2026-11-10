import { getChildren, isLocallyResolved, type Definition, type Expression } from "./ast";
import type { Environment } from "./evaluate";
import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";

interface DefinitionNames extends Pick<
  Environment,
  "definitions" | "substitutions" | "constants" | "variableIndex" | "builtins" | "variables"
> {}

export interface DefinitionFacts {
  ids: Map<Definition, number>;
  rows: Uint32Array;
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
  isOverridden: boolean;
  isLevelCounted: boolean;
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

const PURITY_MASK = IMPURE | REPEATED_EFFECT | STREAMED;
const READ_MASK = NONCONSTANT | READS_IMPURE;

const isEvaluatedOnce = (definition: Definition, flags: number) =>
  definition.kind === "Operator" && definition.params.length === 0 && (flags & NONCONSTANT) === 0;

export const createDefinitionFacts = (environment: DefinitionNames): DefinitionFacts => {
  const definitions = [...new Set(environment.definitions.values())];
  const ids = new Map(definitions.map((definition, definitionId) => [definition, definitionId]));
  const words = 1 + ((environment.variables.length + 31) >>> 5);
  const local = new Uint32Array(definitions.length * words);
  const localImpurity = new Uint32Array(definitions.length * words);
  const edges = definitions.map((definition, definitionId) => {
    const facts = collectLocalFacts(getDefinitionExpressions(definition), environment, words);
    local.set(facts.row, definitionId * words);
    localImpurity[definitionId * words] = facts.row[0] & PURITY_MASK;
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

const getRow = (definition: Definition, environment: Environment): Uint32Array => {
  const facts = environment.facts;
  const definitionId = facts.ids.get(definition);
  return definitionId === undefined
    ? getExpressionsRow(getDefinitionExpressions(definition), environment)
    : facts.rows.subarray(definitionId * facts.words, (definitionId + 1) * facts.words);
};

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

export const isConstantLevel = (definition: Definition, environment: Environment) =>
  (getRow(definition, environment)[0] & NONCONSTANT) === 0;

const EFFECT_FLAGS = { any: IMPURE, repeated: REPEATED_EFFECT, streamed: STREAMED };

export const isImpureDefinition = (
  definition: Definition,
  environment: Environment,
  effect: keyof typeof EFFECT_FLAGS = "any",
) => (getRow(definition, environment)[0] & EFFECT_FLAGS[effect]) !== 0;

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
