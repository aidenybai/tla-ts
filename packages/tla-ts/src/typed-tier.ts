// Compiles a spec whose values have static types to JavaScript and searches it. It decides only a
// search that succeeds, and gives anything else back to the interpreter, which reruns it.
import {
  getChildren,
  type Bound,
  type Definition,
  type Expression,
  type OperatorDefinition,
  type SourceLocation,
} from "./ast";
import { isConstantLevel } from "./dependencies";
import { isStackOverflow, TlaError } from "./errors";
import { evaluate, findGlobalName, getDefinition, type Environment } from "./evaluate";
import { getContext } from "./search";
import { forEachInitialState, hasBranches } from "./successors";
import { OUT_DEGREE_BUCKETS } from "./tlc/summary";
import {
  advanceCombination,
  compareValues,
  isEnumerable,
  isSameValue,
  toFiniteSet,
  type FunctionValue,
  type ModelValue,
  type Value,
} from "./values";

interface IntType {
  kind: "Int";
  target: IntType | MixType | undefined;
}

interface BoolType {
  kind: "Bool";
}

// TLC fails to compare a typed model value with a string or a model value of another type, so a
// class of atoms holds at most one type of model value, and then no strings.
interface StrType {
  kind: "Str";
  target: StrType | MixType | undefined;
  modelValueTypes: Set<string>;
  hasString: boolean;
}

// Integers and untyped model values, which TLC compares only for equality. An atom is 2^32 plus its
// id, so no integer equals it.
interface MixType {
  kind: "Mix";
  target: MixType | undefined;
}

interface SeqType {
  kind: "Seq";
  element: Type;
}

// A record of several shapes starts with the position of its shape.
interface RecType {
  kind: "Rec";
  shapes: string[][];
  fields: Map<string, Type>;
  target: RecType | undefined;
}

// TLC takes a function over 1..n for a sequence, so such a function type becomes a sequence type
// when it unifies with one.
interface FnType {
  kind: "Fn";
  key: Type;
  domain: Value[];
  target: SeqType | undefined;
  range: Type;
}

interface SetType {
  kind: "Set";
  element: Type;
}

interface VarType {
  kind: "Var";
  target: Type | undefined;
}

interface LambdaType {
  kind: "Lambda";
  argument: Type;
  result: Type;
}

type Type =
  | IntType
  | BoolType
  | StrType
  | SeqType
  | RecType
  | FnType
  | SetType
  | VarType
  | LambdaType
  | MixType;

interface Compiled {
  type: Type;
  emit: () => string;
}

interface CodeBinding {
  kind: "Code";
  compiled: Compiled;
}

interface OperatorBinding {
  kind: "Operator";
  definition: OperatorDefinition;
  scope: TierScope;
}

type Binding = CodeBinding | OperatorBinding;

type TierScope = ReadonlyMap<string, Binding>;

export interface TypedCheck {
  invariants: Expression[];
  constraints: Expression[];
  init: Expression;
  next: Expression;
  isDeadlockChecked: boolean;
}

export interface TypedResult {
  generatedStates: number;
  distinctStates: number;
  depth: number;
  initialStates: { generated: number; distinct: number };
  outDegrees: number[];
}

const UNSUPPORTED = { reason: "unsupported" };
const DEOPT = { reason: "deopt" };
// A set of integers holds an integer a mask can't, so sets of integers must be arrays.
const WIDE = { reason: "wide" };

const createInt = (): IntType => ({ kind: "Int", target: undefined });
const BOOL: BoolType = { kind: "Bool" };
const createStr = (): StrType => ({
  kind: "Str",
  target: undefined,
  modelValueTypes: new Set(),
  hasString: false,
});

const checkAtoms = (type: StrType) =>
  type.modelValueTypes.size > 1 || (type.modelValueTypes.size === 1 && type.hasString)
    ? unsupported()
    : undefined;

const addAtom = (type: StrType, plains: Plains, value: Value) => {
  if (typeof value === "string") type.hasString = true;
  if (typeof value === "object" && value.kind === "ModelValue" && value.type !== undefined) {
    type.modelValueTypes.add(value.type);
  }
  checkAtoms(type);
  return getAtom(plains, value);
};
const createMix = (): MixType => ({ kind: "Mix", target: undefined });
const MAXIMUM_COMPARISONS = 8;
const ATOM_BASE = 2 ** 32;
const MAXIMUM_SUBSET_BASE = 20;
const MASK_BITS = 31;
const MAXIMUM_INTEGER = 2147483647;
const MINIMUM_INTEGER = -2147483648;
const MAXIMUM_CONSTANT_SET = 100000;

const unsupported = (): never => {
  throw UNSUPPORTED;
};

const widen = (): never => {
  throw WIDE;
};

const createVar = (): VarType => ({ kind: "Var", target: undefined });

const resolveType = (type: Type): Type => {
  if (
    type.kind === "Bool" ||
    type.kind === "Seq" ||
    type.kind === "Set" ||
    type.kind === "Lambda" ||
    type.target === undefined
  ) {
    return type;
  }
  const target = resolveType(type.target);
  if (type.kind === "Var") type.target = target;
  if (type.kind === "Rec" && target.kind === "Rec") type.target = target;
  return target;
};

const createRecord = (names: string[], fields: Type[]): RecType => ({
  kind: "Rec",
  shapes: [names],
  fields: new Map(names.map((name, index) => [name, fields[index]])),
  target: undefined,
});

const getShapeIndex = (record: RecType, names: string[]) =>
  record.shapes.findIndex(
    (shape) =>
      shape === names ||
      (shape.length === names.length && shape.every((name, index) => name === names[index])),
  );

const unify = (left: Type, right: Type): void => {
  const leftType = resolveType(left);
  const rightType = resolveType(right);
  if (leftType === rightType) return;
  if (leftType.kind === "Var") {
    leftType.target = rightType;
    return;
  }
  if (rightType.kind === "Var") {
    rightType.target = leftType;
    return;
  }
  const isLeftScalar =
    leftType.kind === "Int" || leftType.kind === "Str" || leftType.kind === "Mix";
  const isRightScalar =
    rightType.kind === "Int" || rightType.kind === "Str" || rightType.kind === "Mix";
  if (isLeftScalar && isRightScalar) {
    const mix: MixType =
      leftType.kind === "Mix" ? leftType : rightType.kind === "Mix" ? rightType : createMix();
    if (leftType.kind === "Str" && rightType.kind === "Str") {
      rightType.modelValueTypes.forEach((type) => leftType.modelValueTypes.add(type));
      leftType.hasString ||= rightType.hasString;
      checkAtoms(leftType);
    }
    if (leftType.kind === rightType.kind) {
      rightType.target = leftType;
      return;
    }
    [leftType, rightType].forEach((type) => {
      if (type.kind === "Str" && (type.hasString || type.modelValueTypes.size > 0)) unsupported();
      if (type !== mix) type.target = mix;
    });
    return;
  }
  if (leftType.kind === "Fn" && rightType.kind === "Seq") return unify(rightType, leftType);
  if (leftType.kind === "Seq" && rightType.kind === "Fn") {
    if (!rightType.domain.every((key, index) => key === index + 1)) return unsupported();
    rightType.target = leftType;
    return unify(leftType.element, rightType.range);
  }
  if (leftType.kind !== rightType.kind) return unsupported();
  if (leftType.kind === "Seq" && rightType.kind === "Seq") {
    return unify(leftType.element, rightType.element);
  }
  if (leftType.kind === "Set" && rightType.kind === "Set") {
    return unify(leftType.element, rightType.element);
  }
  if (leftType.kind === "Fn" && rightType.kind === "Fn") {
    if (!isSameDomain(leftType.domain, rightType.domain)) return unsupported();
    unify(leftType.key, rightType.key);
    return unify(leftType.range, rightType.range);
  }
  if (leftType.kind === "Rec" && rightType.kind === "Rec") {
    rightType.target = leftType;
    rightType.shapes.forEach((shape) => {
      if (getShapeIndex(leftType, shape) === -1) leftType.shapes.push(shape);
    });
    rightType.fields.forEach((field, name) => {
      const known = leftType.fields.get(name);
      if (known) unify(known, field);
      if (!known) leftType.fields.set(name, field);
    });
  }
};

// A type left open, such as the element of a set that is always empty, holds no values.
const closeType = (type: Type): Type => {
  const resolved = resolveType(type);
  if (resolved.kind === "Var") {
    const integer = createInt();
    resolved.target = integer;
    return integer;
  }
  if (resolved.kind === "Seq" || resolved.kind === "Set") closeType(resolved.element);
  if (resolved.kind === "Fn") closeType(resolved.range);
  if (resolved.kind === "Rec") resolved.fields.forEach((field) => closeType(field));
  return resolved;
};

const getFieldNames = (value: FunctionValue) => value.domain.map(String).sort();

// A field read before any shape with it is known gets its type from a later shape.
const getFieldType = (record: RecType, name: string) => {
  const known = record.fields.get(name);
  if (known) return known;
  const type: Type = createVar();
  record.fields.set(name, type);
  return type;
};

const getField = (value: FunctionValue, name: string) => value.range[value.domain.indexOf(name)];

const getIntervalBounds = (elements: Value[]) => {
  if (elements.length === 0) return undefined;
  const low = elements[0];
  if (typeof low !== "number") return undefined;
  const isInterval = elements.every((element, index) => element === low + index);
  return isInterval ? { low, high: low + elements.length - 1 } : undefined;
};

const getValueType = (value: Value, plains: Plains): Type => {
  if (typeof value === "number") return createInt();
  if (typeof value === "boolean") return BOOL;
  if (typeof value === "string" || value.kind === "ModelValue") return createStr();
  if (value.kind === "Interval") return { kind: "Set", element: createInt() };
  if (value.kind !== "Function") {
    const element: Type = createVar();
    getElements(value).forEach((inner) => unify(element, getValueType(inner, plains)));
    return { kind: "Set", element };
  }
  if (value.functionClass === "tuple" || value.domain.length === 0) {
    const element: Type = createVar();
    value.range.forEach((inner) => unify(element, getValueType(inner, plains)));
    return { kind: "Seq", element };
  }
  if (value.functionClass === "record") {
    const names = getFieldNames(value);
    return createRecord(
      names,
      names.map((name) => getValueType(getField(value, name), plains)),
    );
  }
  const range: Type = createVar();
  value.range.forEach((inner) => unify(range, getValueType(inner, plains)));
  return createFnType(value.domain, range, plains);
};

const isSameDomain = (left: Value[], right: Value[]) =>
  left === right ||
  (left.length === right.length && left.every((key, index) => isSameValue(key, right[index])));

const unifyValue = (type: Type, value: Value, plains: Plains): void => {
  const resolved = resolveType(type);
  const isMatch =
    (resolved.kind === "Int" && typeof value === "number") ||
    (resolved.kind === "Bool" && typeof value === "boolean") ||
    (resolved.kind === "Str" && typeof value === "string" && plains.ids.has(value)) ||
    (resolved.kind === "Mix" && typeof value === "number");
  if (isMatch) return;
  if (resolved.kind === "Set" && typeof value === "object" && value.kind !== "Function") {
    return getElements(value).forEach((inner) => unifyValue(resolved.element, inner, plains));
  }
  if (typeof value !== "object" || value.kind !== "Function" || value.domain.length === 0) {
    return unify(resolved, getValueType(value, plains));
  }
  if (resolved.kind === "Seq" && value.functionClass === "tuple") {
    return value.range.forEach((inner) => unifyValue(resolved.element, inner, plains));
  }
  if (resolved.kind === "Rec" && value.functionClass === "record") {
    const names = getFieldNames(value);
    if (getShapeIndex(resolved, names) === -1) return unify(resolved, getValueType(value, plains));
    return names.forEach((name) =>
      unifyValue(getFieldType(resolved, name), getField(value, name), plains),
    );
  }
  const isSameFunction =
    resolved.kind === "Fn" &&
    value.functionClass !== "tuple" &&
    value.functionClass !== "record" &&
    isSameDomain(resolved.domain, value.domain);
  if (!isSameFunction) return unify(resolved, getValueType(value, plains));
  value.range.forEach((inner) => unifyValue(resolved.range, inner, plains));
};

const createFnType = (domain: Value[], range: Type, plains: Plains): FnType => {
  const key: Type = createVar();
  domain.forEach((element) => unify(key, getValueType(element, plains)));
  return {
    kind: "Fn",
    key,
    domain,
    range,
    target: undefined,
  };
};

type Plain = number | boolean | Plain[];

interface Plains {
  ids: Map<string | ModelValue, number>;
  values: (string | ModelValue)[];
  isMaskUsed: boolean;
}

const getAtom = (plains: Plains, value: Value) => {
  if (typeof value !== "string" && (typeof value !== "object" || value.kind !== "ModelValue")) {
    return unsupported();
  }
  const known = plains.ids.get(value);
  if (known !== undefined) return known;
  // TLC's fingerprint keeps only the low byte of each character, so the interpreter merges states
  // whose strings differ above U+00FF, which distinct plains would not.
  if (typeof value === "string" && Array.from(value).some((item) => item.charCodeAt(0) > 0xff)) {
    return unsupported();
  }
  plains.ids.set(value, plains.values.push(value) - 1);
  return plains.values.length - 1;
};

// Model values by rank, then strings in TLC's order. In each class of atoms this is TLC's order, and
// it orders atoms that TLC fails to compare too.
const compareAtoms = (left: string | ModelValue, right: string | ModelValue) => {
  if (typeof left === "object" && left.kind === "ModelValue") {
    return typeof right === "object" && right.kind === "ModelValue" ? left.rank - right.rank : -1;
  }
  return typeof right === "string" ? compareValues(left, right) : 1;
};

// TLC fails to compare an integer with a string or a typed model value, so a class of mixed scalars
// holds neither.
const getMixedAtom = (plains: Plains, value: Value) =>
  typeof value === "object" && value.kind === "ModelValue" && value.type === undefined
    ? ATOM_BASE + getAtom(plains, value)
    : unsupported();

const isMask = (type: Type, plains: Plains) => {
  const resolved = resolveType(type);
  if (resolved.kind !== "Set") return unsupported();
  return closeType(resolved.element).kind === "Int" && plains.isMaskUsed;
};

const getElements = (value: Value) =>
  isEnumerable(value) ? toFiniteSet(value).elements : unsupported();

const toPlain = (value: Value, type: Type, plains: Plains): Plain => {
  const resolved = resolveType(type);
  if (resolved.kind === "Int") return typeof value === "number" ? value : unsupported();
  if (resolved.kind === "Bool") return typeof value === "boolean" ? value : unsupported();
  if (resolved.kind === "Str") return addAtom(resolved, plains, value);
  if (resolved.kind === "Mix")
    return typeof value === "number" ? value : getMixedAtom(plains, value);
  if (resolved.kind === "Set") {
    if (!isMask(resolved, plains)) {
      return getElements(value).map((inner) => toPlain(inner, resolved.element, plains));
    }
    return getElements(value).reduce<number>(
      (mask, element) =>
        typeof element === "number" && element >= 0 && element < MASK_BITS
          ? mask | (1 << element)
          : widen(),
      0,
    );
  }
  if (typeof value !== "object" || value.kind !== "Function") return unsupported();
  if (resolved.kind === "Seq") {
    return value.range.map((inner) => toPlain(inner, resolved.element, plains));
  }
  if (resolved.kind === "Rec") {
    const names = getFieldNames(value);
    const tag = getShapeIndex(resolved, names);
    if (tag === -1) return unsupported();
    const fields = names.map((name) =>
      toPlain(getField(value, name), getFieldType(resolved, name), plains),
    );
    return resolved.shapes.length === 1 ? fields : [tag, ...fields];
  }
  if (resolved.kind === "Fn") {
    unify(resolved, createFnType(value.domain, resolved.range, plains));
    return value.range.map((inner) => toPlain(inner, resolved.range, plains));
  }
  return unsupported();
};

interface Program {
  environment: Environment;
  plains: Plains;
  constants: Plain[];
  constantSets: Map<number, Plain[]>[];
  bitmaps: Uint8Array[];
  comparers: { names: Map<Type, string>; functions: string[] };
  indexes: Int32Array[];
  lookups: Map<number, { key: Plain; position: number }[]>[];
  variableTypes: Type[];
  names: { count: number };
  inlining: Definition[];
}

const getName = (program: Program, prefix: string) => `${prefix}${program.names.count++}`;

const addConstant = (program: Program, plain: Plain) => {
  program.constants.push(plain);
  return `K[${program.constants.length - 1}]`;
};

const compileConstant = (program: Program, value: Value): Compiled => {
  const type = getValueType(value, program.plains);
  if (type.kind === "Set" && getElements(value).length === 0) {
    return { type, emit: () => (isMask(type, program.plains) ? "0" : "H.EMPTY") };
  }
  return {
    type,
    emit: once(() => {
      const plain = toPlain(value, type, program.plains);
      return Array.isArray(plain) ? addConstant(program, plain) : String(plain);
    }),
  };
};

const once = (build: () => string) => {
  const built: string[] = [];
  return () => {
    if (built.length === 0) built.push(build());
    return built[0];
  };
};

type Comparer = (left: Plain, right: Plain) => number;

const countBits = (mask: number) => {
  let count = 0;
  for (let rest = mask; rest !== 0; rest &= rest - 1) count++;
  return count;
};

const getCompareCode = (program: Program, type: Type, left: string, right: string): string => {
  const resolved = closeType(type);
  if (resolved.kind === "Int" || resolved.kind === "Bool") return `(${left}) - (${right})`;
  if (resolved.kind === "Str") return `R[${left}] - R[${right}]`;
  if (resolved.kind === "Mix") return `H.compareMixed(R, ${left}, ${right})`;
  if (resolved.kind === "Set" && isMask(resolved, program.plains)) {
    return `H.compareMasks(${left}, ${right})`;
  }
  return `${getComparerCode(program, resolved)}(${left}, ${right})`;
};

const getComparerCode = (program: Program, type: Type): string => {
  const resolved = closeType(type);
  const known = program.comparers.names.get(resolved);
  if (known) return known;
  const name = `c${program.comparers.names.size}`;
  program.comparers.names.set(resolved, name);
  const getChain = (fields: { type: Type; position: number }[]) =>
    `${fields
      .map(
        (field) =>
          `c = ${getCompareCode(program, field.type, `l[${field.position}]`, `r[${field.position}]`)}; if (c !== 0) return c;`,
      )
      .join(" ")} return 0;`;
  const getBody = (): string => {
    if (resolved.kind === "Seq" || resolved.kind === "Set" || resolved.kind === "Fn") {
      const element = resolved.kind === "Fn" ? resolved.range : resolved.element;
      const length =
        resolved.kind === "Fn" ? "" : "if (l.length !== r.length) return l.length - r.length; ";
      return `${length}for (let i = 0; i < l.length; i++) { c = ${getCompareCode(program, element, "l[i]", "r[i]")}; if (c !== 0) return c; } return 0;`;
    }
    if (resolved.kind !== "Rec") return `return ${getCompareCode(program, resolved, "l", "r")};`;
    const offset = resolved.shapes.length === 1 ? 0 : 1;
    const orders = resolved.shapes.map((shape) =>
      shape.toSorted((left, right) => compareValues(left, right)),
    );
    const chains = resolved.shapes.map((shape, tag) =>
      getChain(
        orders[tag].map((field) => ({
          type: getFieldType(resolved, field),
          position: offset + shape.indexOf(field),
        })),
      ),
    );
    if (offset === 0) return chains[0];
    // TLC orders records of different fields by their number of fields, then by their names.
    const shapeOrder = orders.flatMap((left) =>
      orders.map((right) => {
        if (left.length !== right.length) return Math.sign(left.length - right.length);
        const index = left.findIndex((field, position) => field !== right[position]);
        return index === -1 ? 0 : Math.sign(compareValues(left[index], right[index]));
      }),
    );
    const cases = chains.map((chain, tag) => `case ${tag}: ${chain}`);
    program.comparers.functions.push(`const ${name}s = [${shapeOrder.join(", ")}];`);
    return `if (l[0] !== r[0]) return ${name}s[l[0] * ${orders.length} + r[0]]; switch (l[0]) { ${cases.join(" ")} } return 0;`;
  };
  program.comparers.functions.push(`const ${name} = (l, r) => { let c; ${getBody()} };`);
  return name;
};

// The shapes of a record whose type isn't known yet come from the values it unifies with. A value
// that isn't a record fails to unify with it.
const expectRecord = (type: Type) => {
  if (resolveType(type).kind === "Var") {
    unify(type, { kind: "Rec", shapes: [], fields: new Map(), target: undefined });
  }
  const resolved = resolveType(type);
  return resolved.kind === "Rec" ? resolved : unsupported();
};

const getFieldCountCode = (program: Program, type: Type, code: string) => {
  const record = expectRecord(type);
  if (record.shapes.length === 1) return `((${code}), ${record.shapes[0].length})`;
  const counts = Int32Array.from(record.shapes, (shape) => shape.length);
  return `D[${program.indexes.push(counts) - 1}][(${code})[0]]`;
};

const getFieldIndexCode = (program: Program, type: Type, field: string, code: string) => {
  const record = resolveType(type);
  if (record.kind !== "Rec" || record.shapes.length === 0) return unsupported();
  if (record.shapes.length === 1) return String(record.shapes[0].indexOf(field));
  const positions = Int32Array.from(record.shapes, (shape) =>
    shape.includes(field) ? shape.indexOf(field) + 1 : -1,
  );
  return `D[${program.indexes.push(positions) - 1}][${code}[0]]`;
};

const getKeys = (program: Program, type: FnType) =>
  type.domain.map((element) => toPlain(element, type.key, program.plains));

const getIndexCode = (program: Program, type: FnType, code: string) => {
  const keys = getKeys(program, type);
  if (keys.every((key) => typeof key === "number")) {
    const least = Math.min(...keys);
    if (keys.every((key, index) => key === least + index)) return `(${code}) - ${least}`;
  }
  const rows = keys.map((key) => (Array.isArray(key) ? key : [key]));
  const isBoxed = rows.every((row) => row.length === rows[0].length && row.every(Number.isInteger));
  const columns = rows[0].map((_, column) => {
    const values = rows.map((row) => Number(row[column]));
    return { low: Math.min(...values), size: Math.max(...values) - Math.min(...values) + 1 };
  });
  const strides = columns.map((_, column) =>
    columns.slice(column + 1).reduce((product, next) => product * next.size, 1),
  );
  if (!isBoxed || strides[0] * columns[0].size > MAXIMUM_BITMAP) {
    const lookup = new Map<number, { key: Plain; position: number }[]>();
    keys.forEach((key, position) => {
      const hash = hashPlain(key);
      lookup.set(hash, [...(lookup.get(hash) ?? []), { key, position }]);
    });
    return `H.position(L[${program.lookups.push(lookup) - 1}], ${code})`;
  }
  const index = new Int32Array(strides[0] * columns[0].size).fill(-1);
  rows.forEach((row, position) => {
    index[
      row.reduce<number>(
        (sum, item, column) => sum + (Number(item) - columns[column].low) * strides[column],
        0,
      )
    ] = position;
  });
  const table = `D[${program.indexes.push(index) - 1}]`;
  if (!Array.isArray(keys[0])) return `H.index(${table}, (${code}) - ${columns[0].low})`;
  const name = getName(program, "k");
  const isInBox = columns.map(
    (column, position) =>
      `${name}[${position}] >= ${column.low} && ${name}[${position}] < ${column.low + column.size}`,
  );
  const offset = columns.map(
    (column, position) => `(${name}[${position}] - ${column.low}) * ${strides[position]}`,
  );
  return `((${name}) => ${name}.length === ${columns.length} && ${isInBox.join(" && ")} ? ${table}[${offset.join(" + ")}] : -1)(${code})`;
};

const evaluateConstant = (program: Program, expression: Expression) =>
  evaluate(expression, getContext(program.environment, undefined, undefined));

const isConstantExpression = (program: Program, expression: Expression, scope: TierScope) => {
  const visit = (inner: Expression): boolean => {
    if (inner.kind === "Prime" || inner.kind === "Unchanged" || inner.kind === "ExceptAt") {
      return false;
    }
    if (inner.kind === "Identifier" || inner.kind === "Apply") {
      const name = inner.kind === "Identifier" ? inner.name : inner.operator;
      if (scope.has(name) || inner.resolution?.kind === "Local") return false;
      const global = findGlobalName(name, program.environment);
      if (global?.kind === "Variable") return false;
      if (global?.kind === "Definition") {
        if (!isConstantLevel(global.definition, program.environment)) return false;
      }
    }
    if (
      inner.kind === "Forall" ||
      inner.kind === "Exists" ||
      inner.kind === "FunctionConstruction" ||
      inner.kind === "SetMap" ||
      inner.kind === "SetFilter" ||
      inner.kind === "Choose" ||
      inner.kind === "Let" ||
      inner.kind === "Lambda"
    ) {
      return false;
    }
    return getChildren(inner).every(visit);
  };
  return visit(expression);
};

interface Frame {
  scope: TierScope;
  primed: (string | undefined)[];
}

const withBinding = (scope: TierScope, name: string, binding: Binding): TierScope =>
  new Map(scope).set(name, binding);

// TLC evaluates a LET definition where it's used, so one that would fail unused fails nothing. Its
// value is kept once computed, since no plain is undefined.
const getLazyCode = (name: string) => `(${name} ??= ${name}f())`;

interface LazyDefinition {
  name: string;
  value: Compiled;
}

const getDeclarations = (definitions: LazyDefinition[]) =>
  definitions
    .map((item) => `let ${item.name}; const ${item.name}f = () => ${item.value.emit()};`)
    .join(" ");

const isBuiltin = (program: Program, frame: Frame, operator: string, name: string) =>
  operator === name && !frame.scope.has(name) && !program.environment.definitions.has(name);

const bindCode = (scope: TierScope, name: string, type: Type, code: string) =>
  withBinding(scope, name, { kind: "Code", compiled: { type, emit: () => code } });

const inline = <Result>(program: Program, definition: Definition, compile: () => Result) => {
  if (program.inlining.includes(definition)) return unsupported();
  program.inlining.push(definition);
  const result = compile();
  program.inlining.pop();
  return result;
};

// Whether TLC branches on an action, looking also into the operators the tier binds by name, which
// hasBranches skips as local.
const isBranching = (
  program: Program,
  expression: Expression,
  scope: TierScope,
  visited = new Set<Definition>(),
): boolean => {
  const visit = (inner: Expression): boolean => {
    const name =
      inner.kind === "Identifier"
        ? inner.name
        : inner.kind === "Apply"
          ? inner.operator
          : undefined;
    const binding = name === undefined ? undefined : scope.get(name);
    if (binding?.kind === "Operator" && !visited.has(binding.definition)) {
      visited.add(binding.definition);
      if (isBranching(program, binding.definition.body, binding.scope, visited)) return true;
    }
    return getChildren(inner).some(visit);
  };
  return hasBranches(expression, program.environment, new Set()) || visit(expression);
};

const bindArguments = (
  program: Program,
  definition: OperatorDefinition,
  args: Expression[],
  frame: Frame,
): TierScope =>
  definition.params.reduce<TierScope>((scope, param, index) => {
    const arg = args[index];
    if (param.arity > 0)
      return withBinding(scope, param.name, getOperatorArgument(program, arg, frame));
    // TLC passes arguments by name, so a disjunct in one branches where the body uses it as an action.
    if (isBranching(program, arg, frame.scope)) {
      return withBinding(scope, param.name, {
        kind: "Operator",
        definition: {
          kind: "Operator",
          name: param.name,
          params: [],
          body: arg,
          isLocal: true,
          isRecursive: false,
          location: arg.location,
        },
        scope: frame.scope,
      });
    }
    return withBinding(scope, param.name, {
      kind: "Code",
      compiled: compileValue(program, arg, frame),
    });
  }, new Map());

// TLC applies an operator argument by name, in the scope of the caller.
const getOperatorArgument = (program: Program, arg: Expression, frame: Frame): OperatorBinding => {
  if (arg.kind === "Lambda") {
    return {
      kind: "Operator",
      definition: {
        kind: "Operator",
        name: "LAMBDA",
        params: arg.params.map((name) => ({ name, arity: 0 })),
        body: arg.body,
        isLocal: true,
        isRecursive: false,
        location: arg.location,
      },
      scope: frame.scope,
    };
  }
  if (arg.kind !== "Identifier") return unsupported();
  const binding = frame.scope.get(arg.name);
  if (binding?.kind === "Operator") return binding;
  const definition = binding ? undefined : resolveDefinition(program, arg.name);
  return definition ? { kind: "Operator", definition, scope: new Map() } : unsupported();
};

const resolveDefinition = (program: Program, name: string) => {
  const definition = getDefinition(name, program.environment);
  return definition?.kind === "Operator" ? definition : undefined;
};

const getExpansion = (
  program: Program,
  expression: Expression & { kind: "Apply" },
  frame: Frame,
) => {
  const binding = frame.scope.get(expression.operator);
  if (binding?.kind === "Code") return unsupported();
  if (binding) {
    const definition = binding.definition;
    const scope = new Map([
      ...binding.scope,
      ...bindArguments(program, definition, expression.args, frame),
    ]);
    return { definition, scope };
  }
  const definition = resolveDefinition(program, expression.operator);
  if (definition)
    return { definition, scope: bindArguments(program, definition, expression.args, frame) };
  return program.environment.definitions.has(expression.operator) ? unsupported() : undefined;
};

const compileIdentifier = (program: Program, name: string, frame: Frame): Compiled => {
  const binding = frame.scope.get(name);
  if (binding?.kind === "Code") return binding.compiled;
  if (binding?.kind === "Operator") {
    if (binding.definition.params.length > 0) return unsupported();
    return inline(program, binding.definition, () =>
      compileValue(program, binding.definition.body, { ...frame, scope: binding.scope }),
    );
  }
  const global = findGlobalName(name, program.environment);
  if (global?.kind === "Variable") {
    return { type: program.variableTypes[global.index], emit: () => `v${global.index}` };
  }
  if (global?.kind === "Value") return compileConstant(program, global.value);
  if (global?.kind === "Definition") {
    const definition = global.definition;
    if (definition.kind !== "Operator" || definition.params.length > 0) return unsupported();
    if (isConstantLevel(definition, program.environment)) {
      return compileConstant(program, evaluateConstant(program, definition.body));
    }
    return inline(program, definition, () =>
      compileValue(program, definition.body, { ...frame, scope: new Map() }),
    );
  }
  return unsupported();
};

// TLC fails to do arithmetic on, or order, a model value, which a class of mixed scalars may hold.
const expectInt = (compiled: Compiled): Compiled => {
  unify(compiled.type, createInt());
  return {
    type: compiled.type,
    emit: () =>
      resolveType(compiled.type).kind === "Mix" ? `H.int(${compiled.emit()})` : compiled.emit(),
  };
};

const expectType = (compiled: Compiled, type: Type) => {
  unify(compiled.type, type);
  return compiled;
};

const binary = (
  left: Compiled,
  right: Compiled,
  type: Type,
  format: (left: string, right: string) => string,
): Compiled => ({ type, emit: () => format(left.emit(), right.emit()) });

const getSetElement = (compiled: Compiled) => {
  const element: Type = createVar();
  unify(compiled.type, { kind: "Set", element });
  return element;
};

const compileBound = (
  program: Program,
  setExpression: Expression,
  frame: Frame,
): { element: Type; header: (name: string) => string } => {
  if (isConstantExpression(program, setExpression, frame.scope)) {
    const value = evaluateConstant(program, setExpression);
    if (typeof value === "object" && value.kind === "Interval") {
      return {
        element: createInt(),
        header: (name) => `for (let ${name} = ${value.low}; ${name} <= ${value.high}; ${name}++)`,
      };
    }
    const elements = getElements(value);
    if (elements.length > MAXIMUM_CONSTANT_SET) return unsupported();
    const element: Type = createVar();
    elements.forEach((inner) => unify(element, getValueType(inner, program.plains)));
    const getCode = once(() =>
      addConstant(
        program,
        elements.map((inner) => toPlain(inner, element, program.plains)),
      ),
    );
    return { element, header: (name) => `for (const ${name} of ${getCode()})` };
  }
  if (setExpression.kind === "Apply" && isBuiltin(program, frame, setExpression.operator, "..")) {
    const [low, high] = setExpression.args.map((arg) =>
      expectInt(compileValue(program, arg, frame)),
    );
    return {
      element: createInt(),
      header: (name) => {
        const end = getName(program, "e");
        return `for (let ${name} = ${low.emit()}, ${end} = ${high.emit()}; ${name} <= ${end}; ${name}++)`;
      },
    };
  }
  if (
    setExpression.kind === "Apply" &&
    isBuiltin(program, frame, setExpression.operator, "SUBSET")
  ) {
    const base = compileValue(program, setExpression.args[0], frame);
    getSetElement(base);
    return {
      element: base.type,
      header: (name) =>
        `for (const ${name} of H.${isMask(base.type, program.plains) ? "subsetMasks" : "subsets"}(${base.emit()}))`,
    };
  }
  if (setExpression.kind === "Apply" && setExpression.operator === "DOMAIN") {
    const target = compileValue(program, setExpression.args[0], frame);
    const type = resolveType(target.type);
    if (type.kind !== "Seq" && type.kind !== "Fn") return unsupported();
    return {
      element: type.kind === "Seq" ? createInt() : type.key,
      header: (name) => {
        const resolved = resolveType(type);
        if (resolved.kind === "Fn") {
          return `for (const ${name} of (${target.emit()}, ${addConstant(program, getKeys(program, resolved))}))`;
        }
        const end = getName(program, "e");
        return `for (let ${name} = 1, ${end} = (${target.emit()}).length; ${name} <= ${end}; ${name}++)`;
      },
    };
  }
  const set = compileValue(program, setExpression, frame);
  const element = getSetElement(set);
  return {
    element,
    header: (name) => {
      if (!isMask(set.type, program.plains)) return `for (const ${name} of ${set.emit()})`;
      const mask = getName(program, "m");
      return `for (let ${mask} = ${set.emit()}, ${name} = 0; ${mask} !== 0; ${mask} >>>= 1, ${name}++) if ((${mask} & 1) !== 0)`;
    },
  };
};

const compileBounds = (program: Program, bounds: Bound[], frame: Frame) => {
  const loops: { name: string; element: Type; header: (name: string) => string }[] = [];
  const scope = bounds.reduce<TierScope>((current, bound) => {
    if (bound.pattern.kind !== "Name") return unsupported();
    const loop = compileBound(program, bound.set, { ...frame, scope: current });
    const name = getName(program, "q");
    loops.push({ name, element: loop.element, header: loop.header });
    return bindCode(current, bound.pattern.name, loop.element, name);
  }, frame.scope);
  // A later conjunct can still refine the type of a bound, so its loop is chosen at emit.
  const getHeaders = () => loops.map((loop) => loop.header(loop.name)).join(" ");
  return { scope, loops, getHeaders };
};

const compileQuantifier = (
  program: Program,
  expression: Expression & { kind: "Forall" | "Exists" },
  frame: Frame,
): Compiled => {
  const bounds = compileBounds(program, expression.bounds, frame);
  const body = expectType(
    compileValue(program, expression.body, { ...frame, scope: bounds.scope }),
    BOOL,
  );
  const isForall = expression.kind === "Forall";
  return {
    type: BOOL,
    emit: () =>
      `(() => { ${bounds.getHeaders()} { if (${isForall ? "!" : ""}(${body.emit()})) return ${!isForall}; } return ${isForall}; })()`,
  };
};

const compileMembership = (
  program: Program,
  element: Compiled,
  setExpression: Expression,
  frame: Frame,
): Compiled => {
  if (setExpression.kind === "FunctionSet") {
    const range: Type = createVar();
    const domain = getElements(evaluateConstant(program, setExpression.domain));
    if (domain.length === 0) return unsupported();
    unify(element.type, createFnType(domain, range, program.plains));
    const name = getName(program, "e");
    const inner = compileMembership(
      program,
      { type: range, emit: () => name },
      setExpression.range,
      frame,
    );
    return {
      type: BOOL,
      emit: () => `${element.emit()}.every((${name}) => ${inner.emit()})`,
    };
  }
  if (setExpression.kind === "Apply" && setExpression.args.length === 1) {
    const operator = setExpression.operator;
    const isBuiltin = resolveDefinition(program, operator) === undefined;
    if (isBuiltin && operator === "Seq") {
      const inner: Type = createVar();
      unify(element.type, { kind: "Seq", element: inner });
      const name = getName(program, "e");
      const test = compileMembership(
        program,
        { type: inner, emit: () => name },
        setExpression.args[0],
        frame,
      );
      return { type: BOOL, emit: () => `${element.emit()}.every((${name}) => ${test.emit()})` };
    }
    if (isBuiltin && operator === "DOMAIN") {
      const target = compileValue(program, setExpression.args[0], frame);
      const type = resolveType(target.type);
      const name = getName(program, "e");
      if (type.kind === "Seq") {
        const index = expectInt(element);
        return {
          type: BOOL,
          emit: () =>
            `((${name}) => ${name} >= 1 && ${name} <= (${target.emit()}).length)(${index.emit()})`,
        };
      }
      expectRecord(type);
      const atom = createStr();
      unify(element.type, atom);
      return {
        type: BOOL,
        emit: () => {
          const record = resolveType(type);
          if (record.kind !== "Rec") return unsupported();
          const names = addConstant(
            program,
            record.shapes.map((shape) =>
              shape.map((field) => toPlain(field, atom, program.plains)),
            ),
          );
          const shape = record.shapes.length > 1 ? `${name}r[0]` : "0";
          return `((${name}r, ${name}) => ${names}[${shape}].includes(${name}))(${target.emit()}, ${element.emit()})`;
        },
      };
    }
    if (isBuiltin && operator === "SUBSET") {
      const base = compileValue(program, setExpression.args[0], frame);
      getSetElement(base);
      unify(element.type, base.type);
      return compileSubset(program, element, base);
    }
  }
  if (isConstantExpression(program, setExpression, frame.scope)) {
    const value = evaluateConstant(program, setExpression);
    if (typeof value === "object" && value.kind === "InfiniteSet") {
      const integer = expectInt(element);
      if (value.name === "Nat") return { type: BOOL, emit: () => `(${integer.emit()}) >= 0` };
      if (value.name === "Int") return { type: BOOL, emit: () => `((${integer.emit()}), true)` };
      return unsupported();
    }
    if (typeof value === "object" && value.kind === "Interval") {
      unify(element.type, createInt());
      return {
        type: BOOL,
        emit: () => {
          const name = getName(program, "e");
          return `((${name}) => ${name} >= ${value.low} && ${name} <= ${value.high})(${element.emit()})`;
        },
      };
    }
    const elements = getElements(value);
    if (elements.length > MAXIMUM_CONSTANT_SET) return unsupported();
    if (elements.length === 0) return { type: BOOL, emit: () => "false" };
    elements.forEach((inner) => unify(element.type, getValueType(inner, program.plains)));
    const bounds = getIntervalBounds(elements);
    const name = getName(program, "e");
    if (bounds) {
      return {
        type: BOOL,
        emit: () =>
          `((${name}) => ${name} >= ${bounds.low} && ${name} <= ${bounds.high})(${element.emit()})`,
      };
    }
    const getTest = once(() => {
      const type = closeType(element.type);
      const plains = elements.map((inner) => toPlain(inner, type, program.plains));
      const bitmap = getRecordBitmap(type, plains);
      if (bitmap) {
        const fields = bitmap.fields.map((field, position) => ({
          ...field,
          code: `${name}[${position}]${field.isBool ? " ? 1 : 0" : ""}`,
        }));
        const isInRange = fields.map(
          (field) => `${field.code} >= ${field.low} && ${field.code} <= ${field.high}`,
        );
        const offset = fields.map((field) => `(${field.code} - ${field.low}) * ${field.stride}`);
        const code = `B[${program.bitmaps.push(bitmap.bits) - 1}]`;
        return `(${name}) => ${isInRange.join(" && ")} && ${code}[${offset.join(" + ")}] === 1`;
      }
      const isScalar = type.kind === "Int" || type.kind === "Str" || type.kind === "Mix";
      if (isScalar && plains.length <= MAXIMUM_COMPARISONS) {
        return `(${name}) => ${plains.map((plain) => `${name} === ${plain}`).join(" || ")}`;
      }
      const buckets = new Map<number, Plain[]>();
      plains.forEach((plain) => {
        const hash = hashPlain(plain);
        buckets.set(hash, [...(buckets.get(hash) ?? []), plain]);
      });
      const code = `S[${program.constantSets.push(buckets) - 1}]`;
      // A scalar is its own hash.
      return isScalar
        ? `(${name}) => ${code}.has(${name})`
        : `(${name}) => H.isIn(${code}, ${name})`;
    });
    return { type: BOOL, emit: () => `(${getTest()})(${element.emit()})` };
  }
  const set = compileValue(program, setExpression, frame);
  unify(set.type, { kind: "Set", element: element.type });
  return {
    type: BOOL,
    emit: () =>
      isMask(set.type, program.plains)
        ? `H.has(${set.emit()}, ${element.emit()})`
        : `H.isMember(${getComparerCode(program, element.type)}, ${set.emit()}, ${element.emit()})`,
  };
};

const compileSubset = (program: Program, left: Compiled, right: Compiled): Compiled => ({
  type: BOOL,
  emit: () =>
    isMask(left.type, program.plains)
      ? `((${left.emit()}) & ~(${right.emit()})) === 0`
      : `H.isSubset(${getComparerCode(program, getSetElement(left))}, ${left.emit()}, ${right.emit()})`,
});

const MAXIMUM_BITMAP = 1 << 20;

const getRecordBitmap = (type: Type, plains: Plain[]) => {
  if (type.kind !== "Rec" || type.shapes.length !== 1 || plains.length === 0) return undefined;
  const isScalar = type.shapes[0].every((name) => {
    const kind = resolveType(getFieldType(type, name)).kind;
    return kind === "Int" || kind === "Str" || kind === "Bool";
  });
  if (!isScalar) return undefined;
  const rows = plains.map((plain) => (Array.isArray(plain) ? plain.map(Number) : unsupported()));
  const fields = type.shapes[0].map((name, position) => {
    const values = rows.map((row) => row[position]);
    return {
      isBool: resolveType(getFieldType(type, name)).kind === "Bool",
      low: Math.min(...values),
      high: Math.max(...values),
      stride: 1,
    };
  });
  const size = fields.reduce((product, field) => {
    field.stride = product;
    return product * (field.high - field.low + 1);
  }, 1);
  if (size > MAXIMUM_BITMAP) return undefined;
  const bits = new Uint8Array(size);
  rows.forEach((row) => {
    bits[
      row.reduce(
        (index, value, position) =>
          index + (value - fields[position].low) * fields[position].stride,
        0,
      )
    ] = 1;
  });
  return { fields, bits };
};

const hashPlain = (plain: Plain): number => {
  if (!Array.isArray(plain)) return plain === true ? 1 : plain === false ? 0 : plain;
  let hash = plain.length;
  for (const item of plain) hash = Math.imul(hash ^ hashPlain(item), 0x01000193);
  return hash;
};

const compileApplication = (
  program: Program,
  functionCode: Compiled,
  argument: Compiled,
): Compiled => {
  const type = resolveType(functionCode.type);
  if (type.kind === "Lambda") {
    unify(argument.type, type.argument);
    return { type: type.result, emit: () => `(${functionCode.emit()})(${argument.emit()})` };
  }
  if (type.kind === "Fn") {
    unify(argument.type, type.key);
    return {
      type: type.range,
      emit: () => `H.at(${functionCode.emit()}, ${getIndexCode(program, type, argument.emit())})`,
    };
  }
  if (type.kind === "Seq") {
    unify(argument.type, createInt());
    return {
      type: type.element,
      emit: () => `H.at(${functionCode.emit()}, (${argument.emit()}) - 1)`,
    };
  }
  return unsupported();
};

// TLC applies a function definition that depends on the state without building it: once it finds
// the argument in the domain, it goes on with the body there, as an action where one is expected.
const getFunctionExpansion = (
  program: Program,
  expression: Expression & { kind: "FunctionApplication" },
  frame: Frame,
) => {
  const target = expression.function;
  if (target.kind !== "Identifier" || frame.scope.has(target.name)) return undefined;
  const global = findGlobalName(target.name, program.environment);
  if (global?.kind !== "Definition" || global.definition.kind !== "Function") return undefined;
  const definition = global.definition;
  if (isConstantLevel(definition, program.environment)) return undefined;
  const bound = definition.bounds[0];
  if (definition.isSelfReferential || definition.bounds.length !== 1) return unsupported();
  if (bound.pattern.kind !== "Name") return unsupported();
  const argument = compileValue(program, getArgument(expression.args, expression.location), frame);
  const name = getName(program, "a");
  const isInDomain = compileMembership(
    program,
    { type: argument.type, emit: () => name },
    bound.set,
    { ...frame, scope: new Map() },
  );
  return {
    definition,
    scope: bindCode(new Map(), bound.pattern.name, argument.type, name),
    apply: (body: () => string) =>
      `((${name}) => (${isInDomain.emit()} ? ${body()} : H.deopt()))(${argument.emit()})`,
    declare: () => `const ${name} = ${argument.emit()}; if (!(${isInDomain.emit()})) H.deopt();`,
  };
};

// TLC applies a function to several arguments as to the tuple of them.
const getArgument = (args: Expression[], location: SourceLocation): Expression =>
  args.length === 1 ? args[0] : { kind: "Tuple", elements: args, location };

const compileExcept = (
  program: Program,
  expression: Expression & { kind: "Except" },
  frame: Frame,
): Compiled => {
  const base = compileValue(program, expression.function, frame);
  const updates = expression.updates.map((update) => {
    const steps: ((container: string) => string)[] = [];
    const leaf = update.path.reduce<Type>((type, step) => {
      const resolved = resolveType(type);
      if (step.kind === "Field") {
        if (resolved.kind !== "Rec") return unsupported();
        steps.push((container) => getFieldIndexCode(program, type, step.name, container));
        return getFieldType(resolved, step.name);
      }
      const argument = compileValue(program, getArgument(step.args, expression.location), frame);
      if (resolved.kind === "Fn") {
        unify(argument.type, resolved.key);
        steps.push(() => getIndexCode(program, resolved, argument.emit()));
        return resolved.range;
      }
      unify(argument.type, createInt());
      if (resolved.kind === "Seq") {
        steps.push(() => `(${argument.emit()}) - 1`);
        return resolved.element;
      }
      return unsupported();
    }, base.type);
    const old = getName(program, "o");
    const value = expectType(
      compileValue(program, update.value, {
        ...frame,
        scope: bindCode(frame.scope, "@", leaf, old),
      }),
      leaf,
    );
    return { steps, old, value };
  });
  return {
    type: base.type,
    emit: () => {
      const result = getName(program, "x");
      const statements = updates.map((update) => {
        const containers = update.steps.map((_, depth) =>
          depth === 0 ? result : getName(program, "c"),
        );
        const indexes = update.steps.map(() => getName(program, "i"));
        const path = update.steps.map((step, depth) => {
          const container = containers[depth];
          const index = indexes[depth];
          const copy =
            depth === 0
              ? ""
              : `const ${container} = ${containers[depth - 1]}[${indexes[depth - 1]}].slice(); ${containers[depth - 1]}[${indexes[depth - 1]}] = ${container}; `;
          return `${copy}const ${index} = ${step(container)}; if (${index} < 0 || ${index} >= ${container}.length) H.deopt();`;
        });
        const last = update.steps.length - 1;
        const target = `${containers[last]}[${indexes[last]}]`;
        return `{ ${path.join(" ")} const ${update.old} = ${target}; ${target} = ${update.value.emit()}; }`;
      });
      return `(() => { const ${result} = (${base.emit()}).slice(); ${statements.join(" ")} return ${result}; })()`;
    },
  };
};

const ARITHMETIC = new Map([
  ["+", "H.add"],
  ["-", "H.subtract"],
  ["*", "H.multiply"],
  ["%", "H.modulo"],
  ["\\div", "H.divide"],
]);

const COMPARISONS = new Map([
  ["<", "<"],
  ["<=", "<="],
  ["=<", "<="],
  ["\\leq", "<="],
  [">", ">"],
  [">=", ">="],
  ["\\geq", ">="],
]);

const SET_OPERATIONS = new Map([
  ["\\cup", { mask: "|", helper: "union" }],
  ["\\union", { mask: "|", helper: "union" }],
  ["\\cap", { mask: "&", helper: "intersect" }],
  ["\\intersect", { mask: "&", helper: "intersect" }],
  ["\\", { mask: "& ~", helper: "difference" }],
]);

const compileBuiltin = (
  program: Program,
  expression: Expression & { kind: "Apply" },
  frame: Frame,
): Compiled => {
  const operator = expression.operator;
  const args = expression.args;
  if (args.length === 2 && (operator === "\\in" || operator === "\\notin")) {
    const test = compileMembership(program, compileValue(program, args[0], frame), args[1], frame);
    return operator === "\\in" ? test : { type: BOOL, emit: () => `!(${test.emit()})` };
  }
  if (operator === "SelectSeq" && args.length === 2) {
    const sequence = compileValue(program, args[0], frame);
    const element: Type = createVar();
    unify(sequence.type, { kind: "Seq", element });
    const binding = getOperatorArgument(program, args[1], frame);
    if (binding.definition.params.length !== 1) return unsupported();
    const name = getName(program, "e");
    const scope = bindCode(binding.scope, binding.definition.params[0].name, element, name);
    const test = inline(program, binding.definition, () =>
      expectType(compileValue(program, binding.definition.body, { ...frame, scope }), BOOL),
    );
    return {
      type: sequence.type,
      emit: () => `(${sequence.emit()}).filter((${name}) => ${test.emit()})`,
    };
  }
  const values = args.map((arg) => compileValue(program, arg, frame));
  if (operator === "SubSeq" && values.length === 3) {
    const [sequence, start, end] = values;
    unify(sequence.type, { kind: "Seq", element: createVar() });
    const first = expectInt(start);
    const last = expectInt(end);
    return {
      type: sequence.type,
      emit: () => `H.subSeq(${sequence.emit()}, ${first.emit()}, ${last.emit()})`,
    };
  }
  if (values.length === 2) {
    const [left, right] = values;
    if (operator === "=" || operator === "#" || operator === "/=") {
      const isEqual = operator === "=";
      const leftKind = resolveType(left.type).kind;
      const rightKind = resolveType(right.type).kind;
      // TLC finds a tuple unequal to a record of another size and a record unequal to <<>>, and
      // fails to compare them otherwise.
      if (leftKind === "Seq" && rightKind === "Rec") {
        return binary(left, right, BOOL, (leftCode, rightCode) => {
          const count = getFieldCountCode(program, right.type, rightCode);
          return `${isEqual ? "" : "!"}((${leftCode}).length !== ${count} ? false : H.deopt())`;
        });
      }
      if (leftKind === "Rec" && rightKind === "Seq") {
        return binary(
          left,
          right,
          BOOL,
          (leftCode, rightCode) =>
            `(${leftCode}, ${isEqual ? "" : "!"}((${rightCode}).length === 0 ? false : H.deopt()))`,
        );
      }
      unify(left.type, right.type);
      const isScalar = () => {
        const type = closeType(left.type);
        return (
          type.kind === "Int" ||
          type.kind === "Bool" ||
          type.kind === "Str" ||
          type.kind === "Mix" ||
          (type.kind === "Set" && isMask(type, program.plains))
        );
      };
      const empty = [args[0], args[1]].findIndex(
        (arg) => arg.kind === "Tuple" && arg.elements.length === 0,
      );
      if (empty !== -1) {
        const other = values[1 - empty];
        return { type: BOOL, emit: () => `(${other.emit()}).length ${isEqual ? "===" : "!=="} 0` };
      }
      return binary(left, right, BOOL, (leftCode, rightCode) =>
        isScalar()
          ? `(${leftCode}) ${isEqual ? "===" : "!=="} (${rightCode})`
          : `${isEqual ? "" : "!"}H.same(${leftCode}, ${rightCode})`,
      );
    }
    const arithmetic = ARITHMETIC.get(operator);
    if (arithmetic) {
      return binary(
        expectInt(left),
        expectInt(right),
        createInt(),
        (leftCode, rightCode) => `${arithmetic}(${leftCode}, ${rightCode})`,
      );
    }
    const comparison = COMPARISONS.get(operator);
    if (comparison) {
      return binary(
        expectInt(left),
        expectInt(right),
        BOOL,
        (leftCode, rightCode) => `(${leftCode}) ${comparison} (${rightCode})`,
      );
    }
    if (operator === "=>") {
      unify(left.type, BOOL);
      unify(right.type, BOOL);
      return binary(
        left,
        right,
        BOOL,
        (leftCode, rightCode) => `(!(${leftCode}) || (${rightCode}))`,
      );
    }
    if (operator === "<=>" || operator === "\\equiv") {
      unify(left.type, BOOL);
      unify(right.type, BOOL);
      return binary(
        left,
        right,
        BOOL,
        (leftCode, rightCode) => `((${leftCode}) === (${rightCode}))`,
      );
    }
    const setOperation = SET_OPERATIONS.get(operator);
    if (setOperation) {
      const element = getSetElement(left);
      unify(right.type, left.type);
      return binary(left, right, left.type, (leftCode, rightCode) =>
        isMask(left.type, program.plains)
          ? `((${leftCode}) ${setOperation.mask} (${rightCode}))`
          : `H.${setOperation.helper}(${getComparerCode(program, element)}, ${leftCode}, ${rightCode})`,
      );
    }
    if (operator === "\\subseteq") {
      getSetElement(left);
      unify(right.type, left.type);
      return compileSubset(program, left, right);
    }
    if (operator === "..") {
      const type: SetType = { kind: "Set", element: createInt() };
      return binary(expectInt(left), expectInt(right), type, (leftCode, rightCode) =>
        isMask(type, program.plains)
          ? `H.range(${leftCode}, ${rightCode})`
          : `H.interval(${leftCode}, ${rightCode})`,
      );
    }
    if (operator === "Append") {
      unify(left.type, { kind: "Seq", element: right.type });
      return binary(
        left,
        right,
        left.type,
        (leftCode, rightCode) => `H.append(${leftCode}, ${rightCode})`,
      );
    }
    if (operator === "\\o" || operator === "\\circ") {
      unify(left.type, { kind: "Seq", element: createVar() });
      unify(right.type, left.type);
      return binary(
        left,
        right,
        left.type,
        (leftCode, rightCode) => `(${leftCode}).concat(${rightCode})`,
      );
    }
  }
  if (values.length === 1) {
    const [operand] = values;
    if (operator === "~" || operator === "\\lnot" || operator === "\\neg") {
      unify(operand.type, BOOL);
      return { type: BOOL, emit: () => `!(${operand.emit()})` };
    }
    if (operator === "-.") {
      const integer = expectInt(operand);
      return { type: createInt(), emit: () => `H.subtract(0, ${integer.emit()})` };
    }
    const sequence: Type = createVar();
    if (operator === "Len") {
      unify(operand.type, { kind: "Seq", element: sequence });
      return { type: createInt(), emit: () => `(${operand.emit()}).length` };
    }
    if (operator === "Head") {
      unify(operand.type, { kind: "Seq", element: sequence });
      return { type: sequence, emit: () => `H.at(${operand.emit()}, 0)` };
    }
    if (operator === "Tail") {
      unify(operand.type, { kind: "Seq", element: sequence });
      return { type: operand.type, emit: () => `H.tail(${operand.emit()})` };
    }
    if (operator === "Cardinality") {
      getSetElement(operand);
      return {
        type: createInt(),
        emit: () =>
          isMask(operand.type, program.plains)
            ? `H.count(${operand.emit()})`
            : `(${operand.emit()}).length`,
      };
    }
  }
  return unsupported();
};

const compileValue = (program: Program, expression: Expression, frame: Frame): Compiled => {
  switch (expression.kind) {
    case "Number":
      return expression.value <= MAXIMUM_INTEGER
        ? { type: createInt(), emit: () => String(expression.value) }
        : unsupported();
    case "String":
      return compileConstant(program, expression.value);
    case "Identifier":
      return compileIdentifier(program, expression.name, frame);
    case "Apply": {
      const expansion = getExpansion(program, expression, frame);
      if (!expansion) return compileBuiltin(program, expression, frame);
      return inline(program, expansion.definition, () =>
        compileValue(program, expansion.definition.body, { ...frame, scope: expansion.scope }),
      );
    }
    case "And":
    case "Or": {
      const operands = expression.operands.map((operand) =>
        expectType(compileValue(program, operand, frame), BOOL),
      );
      const joiner = expression.kind === "And" ? " && " : " || ";
      return {
        type: BOOL,
        emit: () => `(${operands.map((operand) => `(${operand.emit()})`).join(joiner)})`,
      };
    }
    case "If": {
      const condition = expectType(compileValue(program, expression.condition, frame), BOOL);
      const consequent = compileValue(program, expression.consequent, frame);
      const alternative = expectType(
        compileValue(program, expression.alternative, frame),
        consequent.type,
      );
      return {
        type: consequent.type,
        emit: () => `((${condition.emit()}) ? (${consequent.emit()}) : (${alternative.emit()}))`,
      };
    }
    case "Let": {
      const names: LazyDefinition[] = [];
      const scope = expression.definitions.reduce<TierScope>((current, definition) => {
        if (definition.kind === "Function") {
          const bound = definition.bounds[0];
          if (definition.bounds.length !== 1 || bound.pattern.kind !== "Name") return unsupported();
          const name = getName(program, "l");
          const argument = getName(program, "a");
          const type: LambdaType = { kind: "Lambda", argument: createVar(), result: createVar() };
          const inner = bindCode(current, definition.name, type, getLazyCode(name));
          const isInDomain = compileMembership(
            program,
            { type: type.argument, emit: () => argument },
            bound.set,
            { ...frame, scope: inner },
          );
          const body = expectType(
            compileValue(program, definition.body, {
              ...frame,
              scope: bindCode(inner, bound.pattern.name, type.argument, argument),
            }),
            type.result,
          );
          names.push({
            name,
            value: {
              type,
              emit: () => `(${argument}) => (${isInDomain.emit()}) ? ${body.emit()} : H.deopt()`,
            },
          });
          return inner;
        }
        if (definition.params.length > 0) {
          return withBinding(current, definition.name, {
            kind: "Operator",
            definition,
            scope: current,
          });
        }
        const value = compileValue(program, definition.body, { ...frame, scope: current });
        const name = getName(program, "l");
        names.push({ name, value });
        return bindCode(current, definition.name, value.type, getLazyCode(name));
      }, frame.scope);
      const body = compileValue(program, expression.body, { ...frame, scope });
      return {
        type: body.type,
        emit: () => `(() => { ${getDeclarations(names)} return ${body.emit()}; })()`,
      };
    }
    case "Forall":
    case "Exists":
      return compileQuantifier(program, expression, frame);
    case "Choose": {
      if (!expression.set) return unsupported();
      const bounds = compileBounds(
        program,
        [{ pattern: expression.pattern, set: expression.set }],
        frame,
      );
      const predicate = expectType(
        compileValue(program, expression.body, { ...frame, scope: bounds.scope }),
        BOOL,
      );
      // TLC chooses the first element, in its order, that satisfies the predicate.
      return {
        type: bounds.loops[0].element,
        emit: () =>
          `(() => { ${bounds.getHeaders()} { if (${predicate.emit()}) return ${bounds.loops[0].name}; } return H.deopt(); })()`,
      };
    }
    case "SetEnumeration": {
      const element: Type = createVar();
      const elements = expression.elements.map((inner) =>
        expectType(compileValue(program, inner, frame), element),
      );
      const type: SetType = { kind: "Set", element };
      return {
        type,
        emit: () => {
          if (isMask(type, program.plains)) {
            return elements.length === 0
              ? "0"
              : `(${elements.map((inner) => `H.bit(${inner.emit()})`).join(" | ")})`;
          }
          const items = `[${elements.map((inner) => inner.emit()).join(", ")}]`;
          return elements.length < 2
            ? items
            : `H.normalize(${getComparerCode(program, element)}, ${items})`;
        },
      };
    }
    case "SetFilter": {
      const bounds = compileBounds(program, [expression.bound], frame);
      const loop = bounds.loops[0];
      const predicate = expectType(
        compileValue(program, expression.predicate, { ...frame, scope: bounds.scope }),
        BOOL,
      );
      const result = getName(program, "r");
      const type: SetType = { kind: "Set", element: loop.element };
      return {
        type,
        emit: () =>
          isMask(type, program.plains)
            ? `(() => { let ${result} = 0; ${bounds.getHeaders()} { if (${predicate.emit()}) ${result} |= H.bit(${loop.name}); } return ${result}; })()`
            : `(() => { const ${result} = []; ${bounds.getHeaders()} { if (${predicate.emit()}) ${result}.push(${loop.name}); } return ${result}; })()`,
      };
    }
    case "SetMap": {
      const bounds = compileBounds(program, expression.bounds, frame);
      const element = compileValue(program, expression.expression, {
        ...frame,
        scope: bounds.scope,
      });
      const result = getName(program, "r");
      const type: SetType = { kind: "Set", element: element.type };
      return {
        type,
        emit: () =>
          isMask(type, program.plains)
            ? `(() => { let ${result} = 0; ${bounds.getHeaders()} { ${result} |= H.bit(${element.emit()}); } return ${result}; })()`
            : `(() => { const ${result} = []; ${bounds.getHeaders()} { ${result}.push(${element.emit()}); } return H.normalize(${getComparerCode(program, element.type)}, ${result}); })()`,
      };
    }
    case "Tuple": {
      const element: Type = createVar();
      const elements = expression.elements.map((inner) =>
        expectType(compileValue(program, inner, frame), element),
      );
      return {
        type: { kind: "Seq", element },
        emit: () =>
          elements.length === 0
            ? "H.EMPTY"
            : `[${elements.map((inner) => inner.emit()).join(", ")}]`,
      };
    }
    case "Record": {
      const fields = [...expression.fields].sort((left, right) =>
        left.name < right.name ? -1 : 1,
      );
      const values = fields.map((field) => compileValue(program, field.value, frame));
      const names = fields.map((field) => field.name);
      const type = createRecord(
        names,
        values.map((value) => value.type),
      );
      return {
        type,
        emit: () => {
          const items = values.map((value) => value.emit());
          const record = resolveType(type);
          if (record.kind !== "Rec" || record.shapes.length === 1) return `[${items.join(", ")}]`;
          return `[${[getShapeIndex(record, names), ...items].join(", ")}]`;
        },
      };
    }
    case "FieldAccess": {
      const record = compileValue(program, expression.record, frame);
      const type = expectRecord(record.type);
      return {
        type: getFieldType(type, expression.field),
        emit: () => {
          const code = record.emit();
          const resolved = resolveType(record.type);
          if (resolved.kind === "Rec" && resolved.shapes.length === 1) {
            const position = resolved.shapes[0].indexOf(expression.field);
            return position === -1 ? "H.deopt()" : `(${code})[${position}]`;
          }
          const name = getName(program, "r");
          return `((${name}) => H.at(${name}, ${getFieldIndexCode(program, record.type, expression.field, name)}))(${code})`;
        },
      };
    }
    case "FunctionApplication": {
      const expansion = getFunctionExpansion(program, expression, frame);
      if (expansion) {
        const body = inline(program, expansion.definition, () =>
          compileValue(program, expansion.definition.body, { ...frame, scope: expansion.scope }),
        );
        return { type: body.type, emit: () => expansion.apply(body.emit) };
      }
      return compileApplication(
        program,
        compileValue(program, expression.function, frame),
        compileValue(program, getArgument(expression.args, expression.location), frame),
      );
    }
    case "FunctionConstruction": {
      if (expression.bounds.length !== 1 || expression.isRecursive) return unsupported();
      const bound = expression.bounds[0];
      if (bound.pattern.kind !== "Name") return unsupported();
      if (!isConstantExpression(program, bound.set, frame.scope)) {
        return compileSequenceConstruction(
          program,
          bound.pattern.name,
          bound.set,
          expression.body,
          frame,
        );
      }
      const domain = getElements(evaluateConstant(program, bound.set));
      if (domain.length === 0) return unsupported();
      const name = getName(program, "f");
      const range: Type = createVar();
      const type = createFnType(domain, range, program.plains);
      const body = expectType(
        compileValue(program, expression.body, {
          ...frame,
          scope: bindCode(frame.scope, bound.pattern.name, type.key, name),
        }),
        range,
      );
      return {
        type,
        emit: () =>
          `${addConstant(program, getKeys(program, type))}.map((${name}) => ${body.emit()})`,
      };
    }
    case "Except":
      return compileExcept(program, expression, frame);
    case "ExceptAt":
      return compileIdentifier(program, "@", frame);
    case "Prime": {
      const target = expression.expression;
      if (target.kind !== "Identifier") return unsupported();
      const global = findGlobalName(target.name, program.environment);
      if (frame.scope.has(target.name) || global?.kind !== "Variable") return unsupported();
      const code = frame.primed[global.index] ?? unsupported();
      return { type: program.variableTypes[global.index], emit: () => code };
    }
    default:
      return unsupported();
  }
};

const compileSequenceConstruction = (
  program: Program,
  name: string,
  set: Expression,
  bodyExpression: Expression,
  frame: Frame,
): Compiled => {
  const getLength = (): Compiled => {
    if (set.kind !== "Apply") return unsupported();
    if (set.operator === "DOMAIN") {
      const sequence = compileValue(program, set.args[0], frame);
      if (resolveType(sequence.type).kind !== "Seq") return unsupported();
      return { type: createInt(), emit: () => `(${sequence.emit()}).length` };
    }
    const [low, high] = set.args;
    if (
      !isBuiltin(program, frame, set.operator, "..") ||
      low.kind !== "Number" ||
      low.value !== 1
    ) {
      return unsupported();
    }
    const end = expectInt(compileValue(program, high, frame));
    return { type: createInt(), emit: () => `Math.max(0, ${end.emit()})` };
  };
  const length = getLength();
  const element: Type = createVar();
  const index = getName(program, "f");
  const body = expectType(
    compileValue(program, bodyExpression, {
      ...frame,
      scope: bindCode(frame.scope, name, createInt(), index),
    }),
    element,
  );
  const items = getName(program, "a");
  return {
    type: { kind: "Seq", element },
    emit: () =>
      `((${items}) => { for (let ${index} = 1; ${index} <= ${items}.length; ${index}++) ${items}[${index} - 1] = ${body.emit()}; return ${items}; })(new Array(${length.emit()}))`,
  };
};

// The number of ways an action without primes holds, as TLC branches on it.
const compileWays = (program: Program, expression: Expression, frame: Frame): Compiled => {
  if (hasPrime(expression)) return unsupported();
  const getWays = (inner: Expression, scope: TierScope) =>
    compileWays(program, inner, { ...frame, scope });
  const counted = (emit: () => string): Compiled => ({ type: createInt(), emit });
  switch (expression.kind) {
    case "Or": {
      const operands = expression.operands.map((operand) => getWays(operand, frame.scope));
      return counted(() => `(${operands.map((operand) => operand.emit()).join(" + ")})`);
    }
    case "And": {
      const operands = expression.operands.map((operand) => getWays(operand, frame.scope));
      const product = getName(program, "p");
      return counted(
        () =>
          `(() => { let ${product} = 1; ${operands.map((operand) => `${product} *= ${operand.emit()}; if (${product} === 0) return 0;`).join(" ")} return ${product}; })()`,
      );
    }
    case "Exists":
    case "Forall": {
      const bounds = compileBounds(program, expression.bounds, frame);
      const body = getWays(expression.body, bounds.scope);
      const total = getName(program, "t");
      const isExists = expression.kind === "Exists";
      return counted(
        () =>
          `(() => { let ${total} = ${isExists ? 0 : 1}; ${bounds.getHeaders()} { ${
            isExists
              ? `${total} += ${body.emit()};`
              : `${total} *= ${body.emit()}; if (${total} === 0) return 0;`
          } } return ${total}; })()`,
      );
    }
    case "If": {
      const condition = expectType(compileValue(program, expression.condition, frame), BOOL);
      const consequent = getWays(expression.consequent, frame.scope);
      const alternative = getWays(expression.alternative, frame.scope);
      return counted(() => `(${condition.emit()} ? ${consequent.emit()} : ${alternative.emit()})`);
    }
    case "Identifier": {
      const binding = frame.scope.get(expression.name);
      if (binding?.kind === "Operator" && binding.definition.params.length === 0) {
        const definition = binding.definition;
        return inline(program, definition, () => getWays(definition.body, binding.scope));
      }
      const definition = binding ? undefined : resolveDefinition(program, expression.name);
      if (
        definition &&
        definition.params.length === 0 &&
        !isConstantLevel(definition, program.environment)
      ) {
        return inline(program, definition, () => getWays(definition.body, new Map()));
      }
      break;
    }
    case "Apply": {
      const expansion = getExpansion(program, expression, frame);
      if (expansion) {
        return inline(program, expansion.definition, () =>
          getWays(expansion.definition.body, expansion.scope),
        );
      }
      if (expression.operator === "=>") {
        const condition = expectType(compileValue(program, expression.args[0], frame), BOOL);
        const consequent = getWays(expression.args[1], frame.scope);
        return counted(() => `(${condition.emit()} ? ${consequent.emit()} : 1)`);
      }
      break;
    }
    case "FunctionApplication": {
      const expansion = getFunctionExpansion(program, expression, frame);
      if (!expansion) break;
      const ways = inline(program, expansion.definition, () =>
        getWays(expansion.definition.body, expansion.scope),
      );
      return counted(() => expansion.apply(ways.emit));
    }
    case "Let":
    case "Case":
      return unsupported();
    default:
      break;
  }
  const guard = expectType(compileValue(program, expression, frame), BOOL);
  return counted(() => `(${guard.emit()} ? 1 : 0)`);
};

interface Pending {
  expression: Expression;
  scope: TierScope;
  // The definitions this conjunct expands, which the rest of the conjunction doesn't.
  inlining: Definition[];
}

const compileStep = (
  program: Program,
  pending: Pending[],
  primed: (string | undefined)[],
): (() => string) => {
  if (pending.length === 0) {
    if (primed.some((code) => code === undefined)) return unsupported();
    return () => `emit([${primed.join(", ")}]);`;
  }
  // With warnings on, TLC evaluates what is left once every variable is assigned, without branching.
  if (program.environment.runtime.isWarningEnabled && primed.every((code) => code !== undefined)) {
    const guards = pending.map((item) => {
      if (item.expression.kind !== "Unchanged") {
        return expectType(
          compileValue(program, item.expression, { scope: item.scope, primed }),
          BOOL,
        );
      }
      const checks = getUnchangedVariables(program, item.expression.expression, item.scope).map(
        (index) => `H.same(${primed[index]}, v${index})`,
      );
      return { type: BOOL, emit: () => (checks.length === 0 ? "true" : checks.join(" && ")) };
    });
    return () =>
      `if (${guards.map((guard) => `(${guard.emit()})`).join(" && ")}) { emit([${primed.join(", ")}]); }`;
  }
  const [first, ...rest] = pending;
  const expression = first.expression;
  const frame = { scope: first.scope, primed };
  const continueWith = (scope: TierScope, expressions: Expression[], inlining = first.inlining) =>
    compileStep(
      program,
      [...expressions.map((inner) => ({ expression: inner, scope, inlining })), ...rest],
      primed,
    );
  const continueInto = (definition: Definition, scope: TierScope) =>
    first.inlining.includes(definition)
      ? unsupported()
      : continueWith(scope, [definition.body], [...first.inlining, definition]);
  switch (expression.kind) {
    case "And":
      return continueWith(first.scope, expression.operands);
    case "Or": {
      const branches = expression.operands.map((operand) => continueWith(first.scope, [operand]));
      return () => branches.map((branch) => `{ ${branch()} }`).join(" ");
    }
    case "Exists": {
      const bounds = compileBounds(program, expression.bounds, frame);
      const body = continueWith(bounds.scope, [expression.body]);
      return () => `${bounds.getHeaders()} { ${body()} }`;
    }
    case "If": {
      const condition = expectType(compileValue(program, expression.condition, frame), BOOL);
      const consequent = continueWith(first.scope, [expression.consequent]);
      const alternative = continueWith(first.scope, [expression.alternative]);
      return () => `if (${condition.emit()}) { ${consequent()} } else { ${alternative()} }`;
    }
    case "Let": {
      const names: LazyDefinition[] = [];
      const scope = expression.definitions.reduce<TierScope>((current, definition) => {
        if (definition.kind !== "Operator") return unsupported();
        if (
          definition.params.length > 0 ||
          hasPrime(definition.body) ||
          isBranching(program, definition.body, current)
        ) {
          return withBinding(current, definition.name, {
            kind: "Operator",
            definition,
            scope: current,
          });
        }
        const value = compileValue(program, definition.body, { ...frame, scope: current });
        const name = getName(program, "l");
        names.push({ name, value });
        return bindCode(current, definition.name, value.type, getLazyCode(name));
      }, first.scope);
      const body = continueWith(scope, [expression.body]);
      return () => `{ ${getDeclarations(names)} ${body()} }`;
    }
    case "Identifier": {
      const binding = first.scope.get(expression.name);
      if (binding?.kind === "Operator" && binding.definition.params.length === 0) {
        return continueInto(binding.definition, binding.scope);
      }
      const definition = binding ? undefined : resolveDefinition(program, expression.name);
      if (
        definition &&
        definition.params.length === 0 &&
        !isConstantLevel(definition, program.environment)
      ) {
        return continueInto(definition, new Map());
      }
      break;
    }
    case "FunctionApplication": {
      const expansion = getFunctionExpansion(program, expression, frame);
      if (!expansion) break;
      const body = continueInto(expansion.definition, expansion.scope);
      return () => `{ ${expansion.declare()} ${body()} }`;
    }
    case "Forall": {
      if (!isBranching(program, expression.body, frame.scope)) break;
      // TLC conjoins the body for each element, so it goes on once for each way the conjunction holds.
      const ways = compileWays(program, expression, frame);
      const tail = compileStep(program, rest, primed);
      return () => {
        const count = getName(program, "w");
        return `for (let ${count} = ${ways.emit()}; ${count} > 0; ${count}--) { ${tail()} }`;
      };
    }
    case "Apply": {
      const expansion = getExpansion(program, expression, frame);
      if (expansion) {
        return continueInto(expansion.definition, expansion.scope);
      }
      const args = expression.args;
      // TLC runs the right side of A => B as an action where A holds.
      if (
        expression.operator === "=>" &&
        (hasPrime(args[1]) || isBranching(program, args[1], frame.scope))
      ) {
        const condition = expectType(compileValue(program, args[0], frame), BOOL);
        const consequent = continueWith(first.scope, [args[1]]);
        const alternative = compileStep(program, rest, primed);
        return () => `if (${condition.emit()}) { ${consequent()} } else { ${alternative()} }`;
      }
      if (args.length === 2 && (expression.operator === "=" || expression.operator === "\\in")) {
        const index = getPrimedVariable(program, args[0], first.scope);
        if (index !== undefined && primed[index] === undefined) {
          return compileAssignment(program, expression, index, frame, rest);
        }
      }
      break;
    }
    case "Unchanged": {
      const indexes = getUnchangedVariables(program, expression.expression, first.scope);
      const assigned = primed.map((code, index) =>
        indexes.includes(index) && code === undefined ? `v${index}` : code,
      );
      const tail = compileStep(program, rest, assigned);
      const checks = indexes
        .filter((index) => primed[index] !== undefined)
        .map((index) => `H.same(${primed[index]}, v${index})`);
      return () => (checks.length === 0 ? tail() : `if (${checks.join(" && ")}) { ${tail()} }`);
    }
    default:
      break;
  }
  const guard = expectType(compileValue(program, expression, frame), BOOL);
  const tail = compileStep(program, rest, primed);
  return () => `if (${guard.emit()}) { ${tail()} }`;
};

const hasPrime = (expression: Expression): boolean =>
  expression.kind === "Prime" ||
  expression.kind === "Unchanged" ||
  expression.kind === "Enabled" ||
  getChildren(expression).some(hasPrime);

const getPrimedVariable = (program: Program, expression: Expression, scope: TierScope) => {
  if (expression.kind !== "Prime" || expression.expression.kind !== "Identifier") return undefined;
  const name = expression.expression.name;
  if (scope.has(name)) return undefined;
  const global = findGlobalName(name, program.environment);
  return global?.kind === "Variable" ? global.index : undefined;
};

const compileAssignment = (
  program: Program,
  expression: Expression & { kind: "Apply" },
  index: number,
  frame: Frame,
  rest: Pending[],
): (() => string) => {
  const name = getName(program, "n");
  const assigned = frame.primed.map((code, position) => (position === index ? name : code));
  const tail = compileStep(program, rest, assigned);
  const type = program.variableTypes[index];
  if (expression.operator === "=") {
    const value = expectType(compileValue(program, expression.args[1], frame), type);
    return () => `{ const ${name} = ${value.emit()}; ${tail()} }`;
  }
  const loop = compileBound(program, expression.args[1], frame);
  unify(loop.element, type);
  return () => `${loop.header(name)} { ${tail()} }`;
};

const getUnchangedVariables = (
  program: Program,
  expression: Expression,
  scope: TierScope,
): number[] => {
  if (expression.kind === "Tuple") {
    return expression.elements.flatMap((element) => getUnchangedVariables(program, element, scope));
  }
  if (expression.kind !== "Identifier" || scope.has(expression.name)) return unsupported();
  const global = findGlobalName(expression.name, program.environment);
  if (global?.kind === "Variable") return [global.index];
  if (
    global?.kind === "Definition" &&
    global.definition.kind === "Operator" &&
    global.definition.params.length === 0
  ) {
    return getUnchangedVariables(program, global.definition.body, new Map());
  }
  return unsupported();
};

const deopt = (): never => {
  throw DEOPT;
};

const isSame = (left: Plain, right: Plain): boolean => {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (!isSame(left[index], right[index])) return false;
  }
  return true;
};

const checkInteger = (value: number) =>
  value > MAXIMUM_INTEGER || value < MINIMUM_INTEGER ? deopt() : value;

interface Words {
  data: Int32Array;
  size: number;
}

const growWords = (words: Words) => {
  const grown = new Int32Array(words.data.length * 2);
  grown.set(words.data);
  words.data = grown;
};

interface Bytes {
  data: Uint8Array;
  size: number;
}

const growBytes = (bytes: Bytes) => {
  const grown = new Uint8Array(bytes.data.length * 2);
  grown.set(bytes.data);
  bytes.data = grown;
};

// Distinct states are kept in fixed pages, so the arena grows without copying. A state never spans
// two pages, and its start is the page's index times PAGE_SIZE plus its offset in the page.
interface Arena {
  pages: Uint8Array[];
  data: Uint8Array;
  size: number;
  start: number;
}

const PAGE_BITS = 24;
const PAGE_SIZE = 1 << PAGE_BITS;
const MAXIMUM_PAGES = 2 ** (31 - PAGE_BITS);

const createArena = (): Arena => {
  const page = new Uint8Array(PAGE_SIZE);
  return { pages: [page], data: page, size: 0, start: 0 };
};

const addPage = (arena: Arena) => {
  const length = arena.size - arena.start;
  if (arena.pages.length === MAXIMUM_PAGES || length + RESERVED_BYTES > PAGE_SIZE) deopt();
  const page = new Uint8Array(PAGE_SIZE);
  page.set(arena.data.subarray(arena.start, arena.size));
  arena.pages.push(page);
  arena.data = page;
  arena.start = 0;
  arena.size = length;
};

const writeVarint = (data: Uint8Array, at: number, value: number) => {
  let zigzag = ((value << 1) ^ (value >> 31)) >>> 0;
  let cursor = at;
  data[cursor++] = 128 | (zigzag & 127);
  zigzag >>>= 7;
  while (zigzag >= 128) {
    data[cursor++] = 128 | (zigzag & 127);
    zigzag >>>= 7;
  }
  data[cursor++] = zigzag;
  return cursor;
};

const writeScalar = (bytes: Bytes, scalar: number) => {
  if (bytes.size + MAXIMUM_SCALAR_BYTES > bytes.data.length) growBytes(bytes);
  if (scalar >= 0 && scalar < 128) bytes.data[bytes.size++] = scalar;
  else bytes.size = writeVarint(bytes.data, bytes.size, scalar);
};

// Initial states are kept as bytes, while their types are still open, and read back as plains once
// the types are known.
const writeValue = (bytes: Bytes, value: Value, plains: Plains): void => {
  if (typeof value === "boolean") return writeScalar(bytes, value ? 1 : 0);
  if (typeof value === "number") {
    writeScalar(bytes, 0);
    return writeScalar(bytes, value);
  }
  if (typeof value === "string" || value.kind === "ModelValue") {
    writeScalar(bytes, 1);
    return writeScalar(bytes, getAtom(plains, value));
  }
  const items = value.kind === "Function" ? value.range : getElements(value);
  if (value.kind === "Function" && value.functionClass === "record") {
    const names = getFieldNames(value);
    writeScalar(bytes, names.length);
    names.forEach((name) => writeScalar(bytes, getAtom(plains, name)));
    return names.forEach((name) => writeValue(bytes, getField(value, name), plains));
  }
  writeScalar(bytes, items.length);
  items.forEach((inner) => writeValue(bytes, inner, plains));
};

interface Cursor {
  data: Uint8Array;
  position: number;
}

const readScalar = (cursor: Cursor) => {
  const first = cursor.data[cursor.position++];
  if (first < 128) return first;
  let zigzag = first & 127;
  for (let shift = 7; ; shift += 7) {
    const byte = cursor.data[cursor.position++];
    zigzag |= (byte & 127) << shift;
    if (byte < 128) return (zigzag >>> 1) ^ -(zigzag & 1);
  }
};

const readPlain = (cursor: Cursor, type: Type, plains: Plains): Plain => {
  const resolved = resolveType(type);
  if (resolved.kind === "Bool") return readScalar(cursor) === 1;
  if (resolved.kind === "Int" || resolved.kind === "Str" || resolved.kind === "Mix") {
    const isAtom = readScalar(cursor) === 1;
    const scalar = readScalar(cursor);
    if (resolved.kind === "Str") return addAtom(resolved, plains, plains.values[scalar]);
    if (resolved.kind !== "Mix" || !isAtom) return scalar;
    return getMixedAtom(plains, plains.values[scalar]);
  }
  const length = readScalar(cursor);
  if (resolved.kind === "Rec") {
    const names: string[] = [];
    for (let index = 0; index < length; index++) {
      names.push(String(plains.values[readScalar(cursor)]));
    }
    const fields: Plain[] = resolved.shapes.length === 1 ? [] : [getShapeIndex(resolved, names)];
    for (const name of names) fields.push(readPlain(cursor, getFieldType(resolved, name), plains));
    return fields;
  }
  if (resolved.kind === "Set" && isMask(resolved, plains)) {
    let mask = 0;
    for (let index = 0; index < length; index++) {
      mask |= HELPERS.bit(Number(readPlain(cursor, resolved.element, plains)));
    }
    return mask;
  }
  const element =
    resolved.kind === "Fn"
      ? resolved.range
      : resolved.kind === "Seq" || resolved.kind === "Set"
        ? resolved.element
        : unsupported();
  const items: Plain[] = [];
  for (let index = 0; index < length; index++) items.push(readPlain(cursor, element, plains));
  return items;
};

const pushWord = (words: Words, word: number) => {
  if (words.size === words.data.length) growWords(words);
  words.data[words.size++] = word;
};

interface Kept {
  isCommonKept: boolean;
  isLeftKept: boolean;
  isRightKept: boolean;
}

const mergeSets = (compare: Comparer, left: Plain[], right: Plain[], kept: Kept) => {
  const result: Plain[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const comparison = compare(left[leftIndex], right[rightIndex]);
    if (comparison === 0) {
      if (kept.isCommonKept) result.push(left[leftIndex]);
      leftIndex++;
      rightIndex++;
      continue;
    }
    if (comparison < 0) {
      if (kept.isLeftKept) result.push(left[leftIndex]);
      leftIndex++;
      continue;
    }
    if (kept.isRightKept) result.push(right[rightIndex]);
    rightIndex++;
  }
  if (kept.isLeftKept) for (; leftIndex < left.length; leftIndex++) result.push(left[leftIndex]);
  if (kept.isRightKept)
    for (; rightIndex < right.length; rightIndex++) result.push(right[rightIndex]);
  return result;
};

const UNION: Kept = { isCommonKept: true, isLeftKept: true, isRightKept: true };
const INTERSECTION: Kept = { isCommonKept: true, isLeftKept: false, isRightKept: false };
const DIFFERENCE: Kept = { isCommonKept: false, isLeftKept: true, isRightKept: false };

// TLC enumerates SUBSET S by size, and subsets of one size in the order of S.
const getSubsets = <Subset>(count: number, toSubset: (indices: number[]) => Subset) => {
  if (count > MAXIMUM_SUBSET_BASE) deopt();
  const subsets: Subset[] = [];
  for (let size = 0; size <= count; size++) {
    const indices = Array.from({ length: size }, (_, index) => index);
    do subsets.push(toSubset(indices));
    while (advanceCombination(indices, count));
  }
  return subsets;
};

const HELPERS = {
  EMPTY: Object.freeze([]),
  subsets: (base: Plain[]) =>
    getSubsets(base.length, (indices) => indices.map((index) => base[index])),
  subsetMasks: (mask: number) => {
    const bits = Array.from({ length: MASK_BITS }, (_, bit) => bit).filter(
      (bit) => (mask & (1 << bit)) !== 0,
    );
    return getSubsets(bits.length, (indices) =>
      indices.reduce((subset, index) => subset | (1 << bits[index]), 0),
    );
  },
  same: isSame,
  deopt,
  at: (target: Plain[], position: number) =>
    position >= 0 && position < target.length ? target[position] : deopt(),
  tail: (target: Plain[]) => (target.length === 0 ? deopt() : target.slice(1)),
  subSeq: (target: Plain[], start: number, end: number) => {
    if (start > end) return [];
    return start < 1 || start > target.length || end > target.length
      ? deopt()
      : target.slice(start - 1, end);
  },
  append: (target: Plain[], element: Plain) => {
    const copy = target.slice();
    copy.push(element);
    return copy;
  },
  bit: (element: number) => (element >= 0 && element < MASK_BITS ? 1 << element : widen()),
  range: (low: number, high: number) =>
    low > high
      ? 0
      : low >= 0 && high < MASK_BITS
        ? ((2 ** (high - low + 1) - 1) << low) | 0
        : widen(),
  interval: (low: number, high: number) =>
    Array.from({ length: Math.max(0, high - low + 1) }, (_, index) => low + index),
  index: (index: Int32Array, offset: number) =>
    offset >= 0 && offset < index.length ? index[offset] : -1,
  has: (mask: number, element: number) =>
    element >= 0 && element < MASK_BITS && ((mask >>> element) & 1) !== 0,
  count: countBits,
  int: (value: number) => (value < ATOM_BASE ? value : deopt()),
  // TLC orders a model value before any other value.
  compareMixed: (ranks: Int32Array, left: number, right: number) => {
    const isLeftAtom = left >= ATOM_BASE;
    const isRightAtom = right >= ATOM_BASE;
    if (isLeftAtom && isRightAtom) return ranks[left - ATOM_BASE] - ranks[right - ATOM_BASE];
    if (isLeftAtom || isRightAtom) return isLeftAtom ? -1 : 1;
    return left - right;
  },
  compareMasks: (left: number, right: number) => {
    const sizes = countBits(left) - countBits(right);
    const difference = left ^ right;
    return sizes !== 0 || difference === 0
      ? sizes
      : (left & difference & -difference) !== 0
        ? -1
        : 1;
  },
  add: (left: number, right: number) => checkInteger(left + right),
  subtract: (left: number, right: number) => checkInteger(left - right),
  multiply: (left: number, right: number) => checkInteger(left * right),
  modulo: (left: number, right: number) => (right > 0 ? ((left % right) + right) % right : deopt()),
  // Naturals and Integers differ on -2147483648 \div -1.
  divide: (left: number, right: number) =>
    right !== 0 ? checkInteger(Math.floor(left / right)) : deopt(),
  normalize: (compare: Comparer, items: Plain[]) => {
    items.sort(compare);
    return items.filter((item, index) => index === 0 || compare(items[index - 1], item) !== 0);
  },
  isMember: (compare: Comparer, items: Plain[], item: Plain) => {
    for (let low = 0, high = items.length - 1; low <= high;) {
      const middle = (low + high) >>> 1;
      const comparison = compare(items[middle], item);
      if (comparison === 0) return true;
      if (comparison < 0) low = middle + 1;
      else high = middle - 1;
    }
    return false;
  },
  isSubset: (compare: Comparer, left: Plain[], right: Plain[]) => {
    let position = 0;
    for (const item of left) {
      while (position < right.length && compare(right[position], item) < 0) position++;
      if (position === right.length || compare(right[position], item) !== 0) return false;
      position++;
    }
    return true;
  },
  union: (compare: Comparer, left: Plain[], right: Plain[]) =>
    mergeSets(compare, left, right, UNION),
  intersect: (compare: Comparer, left: Plain[], right: Plain[]) =>
    mergeSets(compare, left, right, INTERSECTION),
  difference: (compare: Comparer, left: Plain[], right: Plain[]) =>
    mergeSets(compare, left, right, DIFFERENCE),
  position: (lookup: Map<number, { key: Plain; position: number }[]>, key: Plain) =>
    lookup.get(hashPlain(key))?.find((entry) => isSame(entry.key, key))?.position ?? -1,
  isIn: (buckets: Map<number, Plain[]>, plain: Plain) =>
    buckets.get(hashPlain(plain))?.some((item) => isSame(item, plain)) === true,
  addPage,
  varint: writeVarint,
};

const RESERVED_BYTES = 1 << 18;
const INTEGER_ESCAPE = 254;
const ATOM_ESCAPE = 255;
const MAXIMUM_SCALAR_BYTES = 6;

const getFixedSize = (type: Type): number => {
  const resolved = resolveType(type);
  if (resolved.kind === "Seq" || resolved.kind === "Set") return 1;
  if (resolved.kind === "Mix") return 2;
  if (resolved.kind === "Rec") {
    const sizes = resolved.shapes.map((shape) =>
      shape.reduce((sum, name) => sum + getFixedSize(getFieldType(resolved, name)), 0),
    );
    return Math.max(...sizes) + (sizes.length === 1 ? 0 : 1);
  }
  if (resolved.kind === "Fn") return resolved.domain.length * getFixedSize(resolved.range);
  return 1;
};

const getParts = (type: Type): Type[] => {
  if (type.kind === "Rec") return type.shapes[0].map((name) => getFieldType(type, name));
  if (type.kind === "Fn") return type.domain.map(() => type.range);
  return unsupported();
};

interface Codec {
  plains: Plains;
  functions: string[];
  names: { count: number };
  writers: Map<Type, string>;
  readers: Map<Type, string>;
}

const getWriter = (codec: Codec, type: Type, code: string): string => {
  const resolved = resolveType(type);
  if (getFixedSize(resolved) * MAXIMUM_SCALAR_BYTES > RESERVED_BYTES) return unsupported();
  if (resolved.kind === "Bool") return `d[n++] = ${code} ? 1 : 0;`;
  if (resolved.kind === "Int" || resolved.kind === "Str" || isMaskType(codec, resolved)) {
    return `t = ${code}; if (t >= 0 && t < 128) d[n++] = t; else n = H.varint(d, n, t);`;
  }
  // A byte below 64 is an integer and one from 64 to 127 is an atom. Other values follow an escape
  // byte as varints.
  if (resolved.kind === "Mix") {
    return `t = ${code}; if (t >= 0 && t < 64) d[n++] = t; else if (t >= ${ATOM_BASE} && t < ${ATOM_BASE + 64}) d[n++] = t - ${ATOM_BASE - 64}; else { if (t >= ${ATOM_BASE}) { d[n++] = ${ATOM_ESCAPE}; t -= ${ATOM_BASE}; } else d[n++] = ${INTEGER_ESCAPE}; if (t >= 0 && t < 128) d[n++] = t; else n = H.varint(d, n, t); }`;
  }
  if (resolved.kind === "Seq" || resolved.kind === "Set") {
    return `${getSequenceWriter(codec, resolved)}(${code});`;
  }
  const name = `p${codec.names.count++}`;
  if (resolved.kind === "Rec" && resolved.shapes.length > 1) {
    const cases = resolved.shapes.map((shape, tag) => {
      const fields = shape.map((field, index) =>
        getWriter(codec, getFieldType(resolved, field), `${name}[${index + 1}]`),
      );
      return `case ${tag}: ${fields.join(" ")} break;`;
    });
    return `{ const ${name} = ${code}; d[n++] = ${name}[0]; switch (${name}[0]) { ${cases.join(" ")} } }`;
  }
  const parts = getParts(resolved).map((part, index) =>
    getWriter(codec, part, `${name}[${index}]`),
  );
  return `{ const ${name} = ${code}; ${parts.join(" ")} }`;
};

const isMaskType = (codec: Codec, type: Type) => type.kind === "Set" && isMask(type, codec.plains);

const getSequenceWriter = (codec: Codec, type: SeqType | SetType) => {
  const known = codec.writers.get(type);
  if (known) return known;
  const name = `w${codec.names.count++}`;
  codec.writers.set(type, name);
  const element = `${name}e`;
  codec.functions.push(
    `const ${name} = (${name}s) => { t = ${name}s.length; if (t < 128) d[n++] = t; else n = H.varint(d, n, t); for (const ${element} of ${name}s) { if (n + ${RESERVED_BYTES} > d.length) { W.size = n; H.addPage(W); d = W.data; n = W.size; } ${getWriter(codec, type.element, element)} } };`,
  );
  return name;
};

const getReader = (codec: Codec, type: Type): string => {
  const resolved = resolveType(type);
  if (resolved.kind === "Bool") return "(d[i++] !== 0)";
  if (resolved.kind === "Int" || resolved.kind === "Str" || isMaskType(codec, resolved))
    return "((t = d[i++]) < 128 ? t : rv(t))";
  if (resolved.kind === "Mix") {
    return `((t = d[i++]) < 64 ? t : t < 128 ? t + ${ATOM_BASE - 64} : t === ${ATOM_ESCAPE} ? ${ATOM_BASE} + ((t = d[i++]) < 128 ? t : rv(t)) : ((t = d[i++]) < 128 ? t : rv(t)))`;
  }
  if (resolved.kind === "Seq" || resolved.kind === "Set") {
    const known = codec.readers.get(resolved);
    if (known) return `${known}()`;
    const name = `r${codec.names.count++}`;
    codec.readers.set(resolved, name);
    codec.functions.push(
      `const ${name} = () => { const length = (t = d[i++]) < 128 ? t : rv(t); const items = new Array(length); for (let index = 0; index < length; index++) items[index] = ${getReader(codec, resolved.element)}; return items; };`,
    );
    return `${name}()`;
  }
  if (resolved.kind === "Rec" && resolved.shapes.length > 1) {
    const known = codec.readers.get(resolved);
    if (known) return `${known}()`;
    const name = `r${codec.names.count++}`;
    codec.readers.set(resolved, name);
    const cases = resolved.shapes.map((shape, tag) => {
      const fields = shape.map((field) => getReader(codec, getFieldType(resolved, field)));
      return `case ${tag}: return [${[tag, ...fields].join(", ")}];`;
    });
    codec.functions.push(`const ${name} = () => { switch (d[i++]) { ${cases.join(" ")} } };`);
    return `${name}()`;
  }
  return `[${getParts(resolved)
    .map((part) => getReader(codec, part))
    .join(", ")}]`;
};

interface CompiledSpec {
  next: (state: Plain[], emit: (successor: Plain[]) => void) => void;
  invariants: ((state: Plain[]) => boolean)[];
  constraints: ((state: Plain[]) => boolean)[];
  encode: (state: Plain[], arena: Arena) => void;
  decode: (data: Uint8Array, start: number) => Plain[];
}

const compileSpec = (program: Program, check: TypedCheck): CompiledSpec => {
  const unprimed = program.variableTypes.map(() => undefined);
  const next = compileStep(
    program,
    [{ expression: check.next, scope: new Map(), inlining: [] }],
    unprimed,
  );
  const compilePredicate = (expression: Expression) =>
    expectType(compileValue(program, expression, { scope: new Map(), primed: unprimed }), BOOL);
  const invariants = check.invariants.map(compilePredicate);
  const constraints = check.constraints.map(compilePredicate);
  program.variableTypes.forEach(closeType);
  const parameters = program.variableTypes.map((_, index) => `v${index}`).join(", ");
  const unpack = `const [${parameters}] = state;`;
  const predicate = (compiled: Compiled) => `(state) => { ${unpack} return ${compiled.emit()}; }`;
  const codec: Codec = {
    plains: program.plains,
    functions: [],
    names: { count: 0 },
    writers: new Map(),
    readers: new Map(),
  };
  const writers = program.variableTypes.map((type, index) => getWriter(codec, type, `v${index}`));
  const readers = program.variableTypes.map((type) => getReader(codec, type));
  const nextCode = next();
  const invariantCodes = invariants.map(predicate);
  const constraintCodes = constraints.map(predicate);
  const values = program.plains.values;
  const ranks = new Int32Array(values.length);
  values
    .map((_, id) => id)
    .sort((left, right) => compareAtoms(values[left], values[right]))
    .forEach((id, rank) => {
      ranks[id] = rank;
    });
  const source = `let d, n, i, t, W;
  const rv = (first) => { let zigzag = first & 127; let shift = 7; let byte; do { byte = d[i++]; zigzag |= (byte & 127) << shift; shift += 7; } while (byte >= 128); return (zigzag >>> 1) ^ -(zigzag & 1); };
  ${codec.functions.join("\n")}
  ${program.comparers.functions.join("\n")}
  return {
    next: (state, emit) => { ${unpack} ${nextCode} },
    invariants: [${invariantCodes.join(", ")}],
    constraints: [${constraintCodes.join(", ")}],
    encode: (state, arena) => {
      ${unpack}
      W = arena;
      arena.start = arena.size;
      if (arena.size + ${RESERVED_BYTES} > arena.data.length) H.addPage(arena);
      d = arena.data;
      n = arena.size;
      ${writers.join(" ")}
      arena.size = n;
    },
    decode: (data, start) => { d = data; i = start; return [${readers.join(", ")}]; },
  };`;
  return new Function("K", "S", "B", "R", "D", "L", "H", source)(
    program.constants,
    program.constantSets,
    program.bitmaps,
    ranks,
    program.indexes,
    program.lookups,
    HELPERS,
  );
};

interface StateTable {
  slots: Int32Array;
  mask: number;
}

const hashBytes = (data: Uint8Array, start: number, end: number) => {
  let hash = 0x811c9dc5;
  for (let index = start; index < end; index++) {
    hash = Math.imul(hash ^ data[index], 0x01000193);
  }
  hash ^= hash >>> 15;
  return Math.imul(hash, 0x2c1b3c6d) ^ (hash >>> 12);
};

export const runTypedSearch = (
  environment: Environment,
  check: TypedCheck,
): TypedResult | undefined => {
  try {
    try {
      return search(environment, check, true);
    } catch (error) {
      if (error !== WIDE) throw error;
      return search(environment, check, false);
    }
  } catch (error) {
    // The interpreter reports these errors when it reruns the search.
    if (
      error === UNSUPPORTED ||
      error === DEOPT ||
      error instanceof TlaError ||
      isStackOverflow(error)
    ) {
      return undefined;
    }
    throw error;
  }
};

const search = (environment: Environment, check: TypedCheck, isMaskUsed: boolean): TypedResult => {
  const program: Program = {
    environment,
    plains: { ids: new Map(), values: [], isMaskUsed },
    constants: [],
    constantSets: [],
    bitmaps: [],
    comparers: { names: new Map(), functions: [] },
    indexes: [],
    lookups: [],
    variableTypes: environment.variables.map(createVar),
    names: { count: 0 },
    inlining: [],
  };
  // Every variable of such a spec is assigned before TLC branches on the next-state relation.
  if (environment.variables.length === 0) return unsupported();
  // The initial states as bytes, so the interpreter's values for them need not stay alive.
  const initialBytes: Bytes = { data: new Uint8Array(1 << 16), size: 0 };
  const initialStarts = { data: new Int32Array(1 << 10), size: 0 };
  forEachInitialState(check.init, environment, (state) => {
    pushWord(initialStarts, initialBytes.size);
    state.forEach((value, index) => {
      unifyValue(program.variableTypes[index], value, program.plains);
      writeValue(initialBytes, value, program.plains);
    });
    return false;
  });
  const compiled = compileSpec(program, check);
  const arena = createArena();
  const starts = { data: new Int32Array(1 << 16), size: 0 };
  const table: StateTable = { slots: new Int32Array(1 << 18), mask: (1 << 17) - 1 };
  const statistics = { generated: 0, distinct: 0, depth: 0 };
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  const isInModel = (state: Plain[]) =>
    compiled.constraints.every((constraint) => constraint(state));
  const checkInvariants = (state: Plain[]) => {
    for (const invariant of compiled.invariants) if (!invariant(state)) deopt();
  };
  const grow = () => {
    const old = table.slots;
    const slots = new Int32Array(old.length * 2);
    const mask = slots.length / 2 - 1;
    for (let position = 0; position < old.length; position += 2) {
      if (old[position + 1] === 0) continue;
      let slot = old[position] & mask;
      while (slots[slot * 2 + 1] !== 0) slot = (slot + 1) & mask;
      slots[slot * 2] = old[position];
      slots[slot * 2 + 1] = old[position + 1];
    }
    table.slots = slots;
    table.mask = mask;
  };
  const addEncoded = () => {
    const data = arena.data;
    const start = arena.start;
    const length = arena.size - start;
    const hash = hashBytes(data, start, arena.size);
    const slots = table.slots;
    for (let slot = hash & table.mask; ; slot = (slot + 1) & table.mask) {
      const entry = slots[slot * 2 + 1];
      if (entry === 0) {
        slots[slot * 2] = hash;
        slots[slot * 2 + 1] = ++statistics.distinct;
        pushWord(starts, (arena.pages.length - 1) * PAGE_SIZE + start);
        if (statistics.distinct * 8 > slots.length * 3) grow();
        return true;
      }
      if (slots[slot * 2] !== hash) continue;
      // No encoding is a prefix of another, so two states of different lengths differ before the
      // shorter one ends.
      const other = starts.data[entry - 1];
      const page = arena.pages[other >>> PAGE_BITS];
      const otherStart = other & (PAGE_SIZE - 1);
      let isSameState = true;
      for (let offset = 0; offset < length; offset++) {
        if (page[otherStart + offset] !== data[start + offset]) {
          isSameState = false;
          break;
        }
      }
      if (isSameState) {
        arena.size = start;
        return false;
      }
    }
  };
  const visit = (state: Plain[]) => {
    statistics.generated++;
    if (!isInModel(state)) {
      checkInvariants(state);
      return false;
    }
    compiled.encode(state, arena);
    const isNew = addEncoded();
    if (isNew) checkInvariants(state);
    return isNew;
  };
  const cursor: Cursor = { data: initialBytes.data, position: 0 };
  for (let index = 0; index < initialStarts.size; index++) {
    const state = program.variableTypes.map((type) => readPlain(cursor, type, program.plains));
    if (visit(state)) statistics.depth = 1;
  }
  initialBytes.data = new Uint8Array(0);
  initialStarts.data = new Int32Array(0);
  const initialStates = { generated: statistics.generated, distinct: statistics.distinct };
  const level = { depth: 1, end: statistics.distinct };
  const expansion = { successors: 0, newStates: 0 };
  const onSuccessor = (successor: Plain[]) => {
    expansion.successors++;
    if (visit(successor)) {
      expansion.newStates++;
      statistics.depth = Math.max(statistics.depth, level.depth + 1);
    }
  };
  for (let index = 0; index < statistics.distinct; index++) {
    if (index === level.end) {
      level.depth++;
      level.end = statistics.distinct;
    }
    const start = starts.data[index];
    const state = compiled.decode(arena.pages[start >>> PAGE_BITS], start & (PAGE_SIZE - 1));
    expansion.successors = 0;
    expansion.newStates = 0;
    compiled.next(state, onSuccessor);
    if (expansion.successors === 0 && check.isDeadlockChecked) deopt();
    outDegrees[Math.min(expansion.newStates, OUT_DEGREE_BUCKETS - 1)]++;
  }
  return {
    generatedStates: statistics.generated,
    distinctStates: statistics.distinct,
    depth: statistics.depth,
    initialStates,
    outDegrees,
  };
};
