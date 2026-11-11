import {
  isLocallyResolved,
  type Bound,
  type Definition,
  type Expression,
  type SourceLocation,
  type SourceRange,
} from "./ast";
import { formatRange } from "./errors";
import type { Environment, Scope } from "./evaluate";
import { getTlcFingerprint } from "./tlc/fingerprint";
import type { Value } from "./values";

export type CoverageKind = "init" | "next" | "invariant" | "constraint" | "implied";

interface CoverageRelation {
  kind: CoverageKind;
  label: string;
  expression: Expression;
  scope: Scope | undefined;
  node: number;
}

export interface Coverage {
  current: number;
  expressions: (Expression | undefined)[];
  ranges: (SourceRange | undefined)[];
  firstChild: number[];
  lastChild: number[];
  nextSibling: number[];
  prefixes: number[];
  isPart: boolean[];
  isPrimed: boolean[];
  isUnchanged: boolean[];
  recursive: number[];
  lets: (number[] | undefined)[];
  roots: number[];
  primary: number[];
  secondary: number[];
  covered: WeakSet<Expression>;
  values: WeakMap<object, number>;
  registers: Uint8Array;
  relations: CoverageRelation[];
}

export interface CoverageReport {
  variables: CoverageVariable[];
  relations: CoverageRelationReport[];
}

interface CoverageVariable {
  label: string;
  distinct: number;
}

interface CoverageRelationReport {
  kind: CoverageKind;
  label: string;
  distinct: number;
  generated: number;
  expressions: CoverageExpression[];
}

interface CoverageExpression {
  location: string;
  depth: number;
  count: number;
  cost: number;
}

interface Local {
  name: string;
  definition: Definition | undefined;
  scope: Local | undefined;
  parent: Local | undefined;
}

interface Resolved {
  definition: Definition;
  scope: Local | undefined;
}

const STANDARD_MODULES = new Set([
  "FiniteSets",
  "Sequences",
  "Bags",
  "Naturals",
  "Integers",
  "Reals",
  "RealTime",
  "Randomization",
  "TLC",
]);

const REGISTER_BITS = 10;
const REGISTERS = 1 << REGISTER_BITS;

export const createCoverage = (variableCount: number): Coverage => ({
  current: -1,
  expressions: [],
  ranges: [],
  firstChild: [],
  lastChild: [],
  nextSibling: [],
  prefixes: [],
  isPart: [],
  isPrimed: [],
  isUnchanged: [],
  recursive: [],
  lets: [],
  roots: [],
  primary: [],
  secondary: [],
  covered: new WeakSet(),
  values: new WeakMap(),
  registers: new Uint8Array(variableCount * REGISTERS),
  relations: [],
});

const addNode = (
  coverage: Coverage,
  expression: Expression | undefined,
  range: SourceRange | undefined,
  parent: number,
  isPart: boolean,
) => {
  const node = coverage.expressions.length;
  coverage.expressions.push(expression);
  coverage.ranges.push(range);
  coverage.firstChild.push(-1);
  coverage.lastChild.push(-1);
  coverage.nextSibling.push(-1);
  coverage.prefixes.push(-1);
  coverage.isPart.push(isPart);
  coverage.isPrimed.push(false);
  coverage.isUnchanged.push(expression?.kind === "Unchanged");
  coverage.recursive.push(-1);
  coverage.lets.push(undefined);
  coverage.roots.push(parent === -1 ? node : coverage.roots[parent]);
  coverage.primary.push(0);
  coverage.secondary.push(0);
  if (expression) coverage.covered.add(expression);
  if (parent === -1) return node;
  const last = coverage.lastChild[parent];
  if (last === -1) coverage.firstChild[parent] = node;
  if (last !== -1) coverage.nextSibling[last] = node;
  coverage.lastChild[parent] = node;
  return node;
};

const findCoverageRelation = (coverage: Coverage, kind: CoverageKind, expression: Expression) =>
  coverage.relations.find(
    (relation) => relation.kind === kind && relation.expression === expression,
  )?.node;

export const addCoverageRelation = (
  coverage: Coverage,
  kind: CoverageKind,
  label: string,
  expression: Expression,
  scope?: Scope,
) => {
  const shared = kind === "next" ? findCoverageRelation(coverage, kind, expression) : undefined;
  if (shared !== undefined) return shared;
  const node = addNode(coverage, undefined, expression.location.range, -1, false);
  coverage.relations.push({ kind, label, expression, scope, node });
  return node;
};

const isSameRange = (left: SourceRange | undefined, right: SourceRange | undefined) =>
  left !== undefined &&
  right !== undefined &&
  left.module === right.module &&
  left.startLine === right.startLine &&
  left.startColumn === right.startColumn &&
  left.endLine === right.endLine &&
  left.endColumn === right.endColumn;

export const getCoverageLabel = (
  name: string | undefined,
  expression: Expression,
  environment: Environment,
) => {
  const definition = name === undefined ? undefined : environment.definitions.get(name);
  const head = definition?.kind === "Operator" ? definition.head : undefined;
  const range = expression.location.range;
  if (!definition || !head) return `Action ${range ? formatRange(range) : "Unknown location"}`;
  if (isSameRange(definition.body.location.range, range) || !range) {
    return `${definition.name} ${formatRange(head)}`;
  }
  return `${definition.name} ${formatRange(head)} (${range.startLine} ${range.startColumn} ${range.endLine} ${range.endColumn})`;
};

const getRangeKey = (range: SourceRange) =>
  `${range.module}:${range.startLine}:${range.startColumn}:${range.endLine}:${range.endColumn}`;

const spanRanges = (first: SourceRange | undefined, last: SourceRange | undefined) =>
  first && last
    ? {
        module: first.module,
        startLine: first.startLine,
        startColumn: first.startColumn,
        endLine: last.endLine,
        endColumn: last.endColumn,
      }
    : undefined;

const getStartRange = (location: SourceLocation, last: SourceRange | undefined) =>
  last && {
    module: last.module,
    startLine: location.range?.startLine ?? location.line,
    startColumn: location.range?.startColumn ?? location.column,
    endLine: last.endLine,
    endColumn: last.endColumn,
  };

const getJavaHashCode = (text: string) =>
  Array.from({ length: text.length }, (_value, index) => text.charCodeAt(index)).reduce(
    (hash, code) => (Math.imul(hash, 31) + code) | 0,
    0,
  ) & 0x7fffffff;

const getHashtableOrder = (definitions: Definition[]) => {
  let buckets = Array.from({ length: 11 }, (): Definition[] => []);
  definitions.forEach((definition, count) => {
    if (count >= Math.floor(buckets.length * 0.75)) {
      const grown = Array.from({ length: buckets.length * 2 + 1 }, (): Definition[] => []);
      for (let index = buckets.length - 1; index >= 0; index--) {
        buckets[index].forEach((entry) =>
          grown[getJavaHashCode(entry.name) % grown.length].unshift(entry),
        );
      }
      buckets = grown;
    }
    buckets[getJavaHashCode(definition.name) % buckets.length].unshift(definition);
  });
  return buckets.toReversed().flat();
};

const getBoundSets = (bounds: Bound[]) =>
  bounds.flatMap((bound, index) =>
    index > 0 && bounds[index - 1].set === bound.set ? [] : [bound.set],
  );

const bindNames = (names: string[], locals: Local | undefined) =>
  names.reduce<Local | undefined>(
    (parent, name) => ({ name, definition: undefined, scope: undefined, parent }),
    locals,
  );

const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) =>
    bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names,
  );

export const buildCoverage = (
  coverage: Coverage,
  environment: Environment,
  primedRanges: SourceRange[],
) => {
  const primed = new Set(primedRanges.map(getRangeKey));
  const stack: number[] = [];
  const definitions: (Definition | undefined)[] = [];
  const walking: Definition[] = [];
  const letBodies = new Map<Expression, Expression>();

  const resolve = (expression: Expression, name: string, locals: Local | undefined) => {
    if (isLocallyResolved(expression)) {
      for (let local = locals; local; local = local.parent) {
        if (local.name !== name) continue;
        return local.definition && { definition: local.definition, scope: local.scope };
      }
      return undefined;
    }
    const target = environment.substitutions.get(name) ?? name;
    if (environment.variableIndex.has(target) || environment.constants.has(target)) {
      return undefined;
    }
    const definition = environment.definitions.get(target);
    const module = definition?.location.range?.module ?? definition?.body.location.range?.module;
    return definition && !STANDARD_MODULES.has(module ?? "")
      ? { definition, scope: undefined }
      : undefined;
  };

  const enter = (
    expression: Expression | undefined,
    range: SourceRange | undefined,
    walkChildren: () => void,
    isPart = false,
    definition?: Definition,
  ) => {
    const node = addNode(coverage, expression, range, stack.at(-1) ?? -1, isPart);
    coverage.isPrimed[node] = range !== undefined && primed.has(getRangeKey(range));
    const body = expression && letBodies.get(expression);
    if (body) {
      stack.forEach((outer) => {
        if (coverage.expressions[outer] === body) (coverage.lets[outer] ??= []).push(node);
      });
    }
    if (definition?.kind === "Operator" && definition.isRecursive) {
      const outer = stack.findLast((item) => definitions[item] === definition);
      if (outer !== undefined) coverage.recursive[node] = outer;
    }
    definitions[node] = definition;
    stack.push(node);
    walkChildren();
    stack.pop();
    return node;
  };

  const walkDefinition = (resolved: Resolved) => {
    const definition = resolved.definition;
    if (walking.includes(definition)) return;
    walking.push(definition);
    const names =
      definition.kind === "Function"
        ? getBoundNames(definition.bounds)
        : definition.params.map((param) => param.name);
    walk(definition.body, bindNames(names, resolved.scope));
    if (definition.kind === "Function") {
      getBoundSets(definition.bounds).forEach((set) => walk(set, resolved.scope));
    }
    walking.pop();
  };

  const hasParams = (resolved: Resolved | undefined) =>
    resolved?.definition.kind === "Operator" && resolved.definition.params.length > 0;

  const walkArgument = (
    argument: Expression,
    index: number,
    callee: Definition | undefined,
    locals: Local | undefined,
  ) => {
    if (argument.kind === "Lambda") {
      walk(argument.body, bindNames(argument.params, locals));
      return;
    }
    if (argument.kind === "Identifier") {
      const resolved = resolve(argument, argument.name, locals);
      const isOperator =
        (callee?.kind === "Operator" && (callee.params[index]?.arity ?? 0) > 0) ||
        hasParams(resolved);
      if (isOperator) {
        if (resolved) walkDefinition(resolved);
        return;
      }
    }
    walk(argument, locals);
  };

  const walkJunction = (
    expression: Expression & { kind: "And" | "Or" },
    count: number,
    range: SourceRange | undefined,
    locals: Local | undefined,
  ): number =>
    enter(
      count === expression.operands.length ? expression : undefined,
      range,
      () => {
        const operands = expression.operands;
        if (count > 2 && !expression.isBulleted) {
          const end = expression.prefixEnds?.[count - 3];
          const prefix = walkJunction(
            expression,
            count - 1,
            range && end ? { ...range, endLine: end.line, endColumn: end.column } : range,
            locals,
          );
          coverage.prefixes[stack.at(-1) ?? -1] = prefix;
          walk(operands[count - 1], locals);
          return;
        }
        operands.slice(0, count).forEach((operand) => walk(operand, locals));
      },
      count < expression.operands.length,
    );

  const walk = (expression: Expression, locals: Local | undefined): void => {
    const range = expression.location.range;
    const walkAll = (expressions: Expression[]) =>
      expressions.forEach((item) => walk(item, locals));
    switch (expression.kind) {
      case "Number":
      case "Decimal":
      case "String":
      case "ExceptAt":
      case "Bracket":
      case "Subexpression":
      case "OperatorReference":
        return;
      case "Label":
        walk(expression.body, bindNames(expression.params, locals));
        return;
      case "Lambda":
        walk(expression.body, bindNames(expression.params, locals));
        return;
      case "Let": {
        const inner = expression.definitions.reduce<Local | undefined>(
          (parent, definition) => ({ name: definition.name, definition, scope: undefined, parent }),
          locals,
        );
        for (let local = inner; local !== locals && local; local = local.parent) {
          local.scope = inner;
        }
        expression.definitions.forEach((definition) => {
          if (definition.kind === "Operator") letBodies.set(definition.body, expression.body);
        });
        getHashtableOrder(expression.definitions).forEach((definition) =>
          walkDefinition({ definition, scope: inner }),
        );
        walk(expression.body, inner);
        return;
      }
      case "Identifier": {
        const resolved = resolve(expression, expression.name, locals);
        enter(
          expression,
          range,
          () => {
            if (resolved) walkDefinition(resolved);
          },
          false,
          resolved?.definition,
        );
        return;
      }
      case "Apply": {
        const resolved = resolve(expression, expression.operator, locals);
        enter(
          expression,
          range,
          () => {
            if (resolved) walkDefinition(resolved);
            expression.args.forEach((argument, index) =>
              walkArgument(argument, index, resolved?.definition, locals),
            );
          },
          false,
          resolved?.definition,
        );
        return;
      }
      case "And":
      case "Or":
        walkJunction(expression, expression.operands.length, range, locals);
        return;
      case "Case":
        enter(expression, range, () => {
          expression.arms.forEach((arm) =>
            enter(
              undefined,
              spanRanges(arm.condition.location.range, arm.body.location.range),
              () => walkAll([arm.condition, arm.body]),
              true,
            ),
          );
          const other = expression.other;
          if (other) enter(undefined, expression.otherRange, () => walk(other, locals), true);
        });
        return;
      case "Record":
      case "RecordSet":
        enter(expression, range, () =>
          expression.fields.forEach((field) =>
            enter(
              undefined,
              getStartRange(field.location, field.value.location.range),
              () => walk(field.value, locals),
              true,
            ),
          ),
        );
        return;
      case "FunctionApplication":
        enter(expression, range, () => {
          walk(expression.function, locals);
          const args = expression.args;
          if (args.length === 1) walk(args[0], locals);
          else {
            enter(
              undefined,
              spanRanges(args[0]?.location.range, args.at(-1)?.location.range),
              () => walkAll(args),
              true,
            );
          }
        });
        return;
      case "Forall":
      case "Exists":
      case "FunctionConstruction":
        enter(expression, range, () => {
          walk(expression.body, bindNames(getBoundNames(expression.bounds), locals));
          walkAll(getBoundSets(expression.bounds));
        });
        return;
      case "SetMap":
        enter(expression, range, () => {
          walk(expression.expression, bindNames(getBoundNames(expression.bounds), locals));
          walkAll(getBoundSets(expression.bounds));
        });
        return;
      case "SetFilter":
        enter(expression, range, () => {
          walk(expression.predicate, bindNames(getBoundNames([expression.bound]), locals));
          walk(expression.bound.set, locals);
        });
        return;
      case "Choose":
        enter(expression, range, () => {
          const pattern = expression.pattern;
          walk(
            expression.body,
            bindNames(pattern.kind === "Name" ? [pattern.name] : pattern.names, locals),
          );
          if (expression.set) walk(expression.set, locals);
        });
        return;
      case "UnboundedQuantifier":
        enter(expression, range, () => walk(expression.body, bindNames(expression.names, locals)));
        return;
      case "Except":
        enter(expression, range, () => {
          walk(expression.function, locals);
          expression.updates.forEach((update) => {
            update.path.forEach((step) => {
              if (step.kind === "Index") walkAll(step.args);
            });
            walk(update.value, locals);
          });
        });
        return;
      case "Prime":
      case "Unchanged":
      case "Enabled":
      case "Always":
      case "Eventually":
        enter(expression, range, () => walk(expression.expression, locals));
        return;
      case "If":
        enter(expression, range, () =>
          walkAll([expression.condition, expression.consequent, expression.alternative]),
        );
        return;
      case "SetEnumeration":
      case "Tuple":
        enter(expression, range, () => walkAll(expression.elements));
        return;
      case "Product":
        enter(expression, range, () => walkAll(expression.factors));
        return;
      case "FunctionSet":
        enter(expression, range, () => walkAll([expression.domain, expression.range]));
        return;
      case "FieldAccess":
        enter(expression, range, () => walk(expression.record, locals));
        return;
      case "BoxAction":
      case "AngleAction":
        enter(expression, range, () => walkAll([expression.action, expression.subscript]));
        return;
      case "WeakFairness":
      case "StrongFairness":
        enter(expression, range, () => walkAll([expression.subscript, expression.action]));
    }
  };

  coverage.relations.forEach((relation) => {
    stack.push(relation.node);
    walk(relation.expression, undefined);
    stack.pop();
  });
};

const findChild = (coverage: Coverage, node: number, expression: Expression): number => {
  for (let child = coverage.firstChild[node]; child !== -1; child = coverage.nextSibling[child]) {
    if (coverage.expressions[child] === expression) return child;
    if (coverage.isPart[child]) {
      const found = findChild(coverage, child, expression);
      if (found !== -1) return found;
    }
  }
  return -1;
};

export const getCoverageNode = (coverage: Coverage, node: number, expression: Expression) => {
  if (coverage.expressions[node] === expression) return node;
  const child = findChild(coverage, node, expression);
  if (child !== -1) return child;
  const recursive = coverage.recursive[node];
  const inner = recursive === -1 ? -1 : findChild(coverage, recursive, expression);
  if (inner !== -1) return inner;
  return coverage.lets[node]?.find((item) => coverage.expressions[item] === expression) ?? node;
};

export const countCoverage = (coverage: Coverage, node: number) => {
  for (let item = node; item !== -1; item = coverage.prefixes[item]) coverage.primary[item]++;
};

export const runAtCoverageNode = <Result>(
  coverage: Coverage,
  node: number,
  run: () => Result,
): Result => {
  const outer = coverage.current;
  coverage.current = node;
  try {
    return run();
  } finally {
    coverage.current = outer;
  }
};

export const costCoverage = (coverage: Coverage, value: Value, cost: number) => {
  const node = typeof value === "object" ? coverage.values.get(value) : undefined;
  if (node !== undefined) coverage.secondary[node] += cost;
};

const getLeadingZeros = (value: bigint) => {
  const high = Number(value >> 32n);
  return high === 0 ? 32 + Math.clz32(Number(value & 0xffffffffn)) : Math.clz32(high);
};

export const countCoverageVariables = (coverage: Coverage, state: Value[]) =>
  state.forEach((value, variable) => {
    const fingerprint = getTlcFingerprint([value]);
    const register = Number(fingerprint >> BigInt(64 - REGISTER_BITS));
    const rest = BigInt.asUintN(64, (fingerprint << BigInt(REGISTER_BITS)) | (1n << 9n));
    const index = variable * REGISTERS + register;
    coverage.registers[index] = Math.max(coverage.registers[index], getLeadingZeros(rest) + 1);
  });

export const getDistinctCount = (coverage: Coverage, variable: number) => {
  const registers = coverage.registers.subarray(variable * REGISTERS, (variable + 1) * REGISTERS);
  const alpha = 0.7213 / (1 + 1.079 / REGISTERS);
  const sum = registers.reduce((total, register) => total + 2 ** -register, 0);
  const estimate = (alpha * REGISTERS * REGISTERS) / sum;
  const zeros = registers.filter((register) => register === 0).length;
  if (estimate <= 2.5 * REGISTERS) {
    return Math.trunc(zeros === 0 ? estimate : REGISTERS * Math.log(REGISTERS / zeros));
  }
  return Math.trunc(
    estimate > 2 ** 64 / 30 ? -(2 ** 64) * Math.log(1 - estimate / 2 ** 64) : estimate,
  );
};

interface Pair {
  primary: number;
  secondary: number;
}

const getPairHash = (pair: Pair) => {
  const hash = (Math.imul(31, 31 + pair.primary) + pair.secondary) | 0;
  return hash ^ (hash >>> 16);
};

const getFirstPair = (pairs: Pair[]) => {
  let capacity = 16;
  while (pairs.length > capacity * 0.75) capacity *= 2;
  const getBucket = (pair: Pair) => getPairHash(pair) & (capacity - 1);
  return pairs.reduce((first, pair) => (getBucket(pair) < getBucket(first) ? pair : first));
};

const addPair = (pairs: Pair[], pair: Pair) => {
  if (!pairs.some((item) => item.primary === pair.primary && item.secondary === pair.secondary)) {
    pairs.push(pair);
  }
};

const isNodePrimed = (coverage: Coverage, node: number) =>
  coverage.isPrimed[node] || coverage.isUnchanged[node];

const getChildren = (coverage: Coverage, node: number) => {
  const children: number[] = [];
  for (let child = coverage.firstChild[node]; child !== -1; child = coverage.nextSibling[child]) {
    children.push(child);
  }
  return children;
};

const getRelationCounts = (coverage: Coverage, relation: CoverageRelation) => {
  const primary = coverage.primary[relation.node];
  const secondary = coverage.secondary[relation.node];
  if (relation.kind === "init") return { distinct: primary, generated: primary + secondary };
  if (relation.kind === "next") return { distinct: secondary, generated: primary };
  if (relation.kind === "constraint") {
    return { distinct: secondary, generated: primary + secondary };
  }
  return { distinct: 0, generated: 0 };
};

const getExpressions = (coverage: Coverage, root: number) => {
  const expressions: CoverageExpression[] = [];
  const subtrees = new Map<number, Pair[]>();
  const collect = (node: number): Pair[] => {
    const pairs: Pair[] = [];
    const own = { primary: coverage.primary[node], secondary: coverage.secondary[node] };
    if (own.primary > 0 || own.secondary > 0 || isNodePrimed(coverage, node)) addPair(pairs, own);
    getChildren(coverage, node).forEach((child) =>
      collect(child).forEach((pair) => addPair(pairs, pair)),
    );
    subtrees.set(node, pairs);
    return pairs;
  };
  const add = (node: number, depth: number, count: number, cost: number) => {
    const range = coverage.ranges[node];
    expressions.push({
      location: range ? formatRange(range) : "Unknown location",
      depth,
      count,
      cost,
    });
  };
  const addSelf = (node: number, depth: number) =>
    add(node, depth, coverage.primary[node], coverage.secondary[node]);
  const print = (node: number, depth: number) => {
    const children = getChildren(coverage, node);
    const collected: Pair[] = [];
    children.forEach((child) =>
      (subtrees.get(child) ?? collect(child)).forEach((pair) => addPair(collected, pair)),
    );
    const own = { primary: coverage.primary[node], secondary: coverage.secondary[node] };
    const isPrimed = isNodePrimed(coverage, node);
    const printChildren = (level: number) => children.forEach((child) => print(child, level));
    if (coverage.isUnchanged[node]) {
      const changed = collected.filter((pair) => pair.primary !== 0 || pair.secondary !== 0);
      if (changed.length === 0) addSelf(node, depth);
      else add(node, depth, Math.max(own.primary, getFirstPair(changed).primary), 0);
      return;
    }
    if (collected.length === 0) {
      if (own.primary !== 0 || isPrimed) addSelf(node, depth);
      return;
    }
    const isZero = own.primary === 0 && own.secondary === 0;
    if (collected.length === 1) {
      const consistent = collected[0];
      const isConsistentZero = consistent.primary === 0 && consistent.secondary === 0;
      if (consistent.primary < own.primary) {
        addSelf(node, depth);
        printChildren(depth + 1);
        return;
      }
      if (!isPrimed && isZero && !isConsistentZero) {
        add(node, depth, consistent.primary, consistent.secondary);
        return;
      }
      if (isZero && isConsistentZero) {
        if (isPrimed) addSelf(node, depth);
        printChildren(isPrimed ? depth + 1 : depth);
        return;
      }
      if (own.primary === consistent.primary && own.secondary === consistent.secondary) {
        addSelf(node, depth);
        return;
      }
    }
    const isPrinted = !isZero || isPrimed;
    if (isPrinted) addSelf(node, depth);
    printChildren(isPrinted ? depth + 1 : depth);
  };
  getChildren(coverage, root).forEach((child) => {
    collect(child);
    print(child, 0);
  });
  return expressions;
};

const KIND_ORDER: CoverageKind[] = ["init", "next", "invariant", "constraint", "implied"];

const compareRanges = (left: SourceRange | undefined, right: SourceRange | undefined) => {
  if (!left || !right) return left ? 1 : right ? -1 : 0;
  if (left.module !== right.module) return left.module < right.module ? -1 : 1;
  return (
    left.startLine - right.startLine ||
    left.startColumn - right.startColumn ||
    left.endLine - right.endLine ||
    left.endColumn - right.endColumn
  );
};

const getReportedRelations = (coverage: Coverage) =>
  KIND_ORDER.flatMap((kind) => {
    const relations = coverage.relations.filter((relation) => relation.kind === kind);
    if (kind !== "next") return relations;
    return relations
      .toSorted((left, right) =>
        compareRanges(left.expression.location.range, right.expression.location.range),
      )
      .filter(
        (relation, index, sorted) =>
          index === 0 ||
          compareRanges(
            sorted[index - 1].expression.location.range,
            relation.expression.location.range,
          ) !== 0,
      );
  });

export const getCoverageReport = (
  coverage: Coverage,
  environment: Environment,
  variableLocations: SourceLocation[],
  variableOrder: number[],
): CoverageReport => ({
  variables: variableOrder.map((index) => {
    const range = variableLocations[index]?.range;
    return {
      label: `${environment.variables[index]} ${range ? formatRange(range) : "Unknown location"}`,
      distinct: getDistinctCount(coverage, index),
    };
  }),
  relations: getReportedRelations(coverage).map((relation) => ({
    kind: relation.kind,
    label: relation.label,
    ...getRelationCounts(coverage, relation),
    expressions: getExpressions(coverage, relation.node),
  })),
});

export const getCoverageCounts = (
  coverage: Coverage,
  kind: CoverageKind,
  expression: Expression,
): [string, number][] | undefined => {
  const node = findCoverageRelation(coverage, kind, expression);
  if (node === undefined) return undefined;
  const primary = coverage.primary[node];
  const secondary = coverage.secondary[node];
  if (kind === "init") {
    return [
      ["generated", primary + secondary],
      ["distinct", primary],
    ];
  }
  if (kind === "next") {
    return [
      ["generated", primary],
      ["distinct", secondary],
    ];
  }
  const child = coverage.firstChild[node];
  return [["count", child === -1 ? primary : coverage.primary[child]]];
};
