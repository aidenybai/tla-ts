// Compiles a spec whose values have static types to JavaScript and searches it. It decides only a
// search that succeeds, and gives anything else back to the interpreter, which reruns it.
import {
  getChildren,
  isRecursiveConstruction,
  type ApplyExpression,
  type Bound,
  type Definition,
  type Expression,
  type FunctionConstructionExpression,
  type FunctionDefinition,
  type LetExpression,
  type OperatorDefinition,
  type SourceLocation,
} from "./ast";
import { isConstantLevel, isExpressionImpure } from "./dependencies";
import { isStackOverflow, TlaError } from "./errors";
import {
  createLiveGraph,
  getLiveAtoms,
  type Lasso,
  type LiveAtom,
  type LiveSuccessor,
} from "./liveness-checker";
import { permuteValue, type Images } from "./symmetry";
import type { Solution } from "./tableau";
import {
  evaluate,
  findGlobalName,
  getDefinition,
  getStartupValue,
  isUniformPredicate,
  type Environment,
  type Scope,
} from "./evaluate";
import { getContext } from "./search";
import { forEachInitialState, hasBranches } from "./successors";
import {
  extendFingerprint,
  FINGERPRINT_CODE,
  getFingerprintTables,
  getScalarExtension,
} from "./tlc/fingerprint";
import { OUT_DEGREE_BUCKETS } from "./tlc/summary";
import {
  compareValues,
  createFunction,
  createSet,
  createSortedFunction,
  createSortedRecord,
  createSortedSet,
  createTuple,
  getFunctionClass,
  getMaximumSetSize,
  getStreamedElements,
  isEnumerable,
  isSameValue,
  toFiniteFunction,
  toFiniteSet,
  type FunctionValue,
  type ModelValue,
  type Value,
} from "./values";

interface IntType {
  kind: "Int";
  target: IntType | MixType | undefined;
  // Whether the integers are the keys of a sequence, which a function on other keys replaces.
  isSequenceKey: boolean;
}

interface BoolType {
  kind: "Bool";
  target: BoolType | OptType | undefined;
}

// TLC fails to compare a typed model value with a string or a model value of another type, so a
// class of atoms holds at most one type of model value, and then no strings.
interface StrType {
  kind: "Str";
  target: Type | undefined;
  modelValueTypes: Set<string>;
  hasString: boolean;
  // A model value written in the spec, such as None for a missing sequence, can meet a structure.
  isStandIn: boolean;
}

// Integers and untyped model values, which TLC compares only for equality. An atom is 2^32 plus its
// id, so no integer equals it.
interface MixType {
  kind: "Mix";
  target: MixType | undefined;
}

// Booleans and untyped model values, which TLC compares only for equality. A value is a boolean or
// the id of an atom.
interface OptType {
  kind: "Opt";
  target: OptType | undefined;
}

// A tuple whose elements have types of their own, in the pass that keeps tuples apart from
// sequences. Any use but reading a position by a number makes it a sequence.
interface TupType {
  kind: "Tup";
  elements: Type[];
  target: Type | undefined;
}

interface SeqType {
  kind: "Seq";
  element: Type;
  target?: SeqType | MapType;
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
  target: SeqType | MapType | FnType | undefined;
  range: Type;
}

// A function whose domain changes, as @@ and :> build them. It is its domain, as a set, and the
// values at the domain's elements in order.
interface MapType {
  kind: "Map";
  keys: SetType;
  values: SeqType;
}

// A function with an empty domain, before it shows itself to be a sequence or a sparse function.
interface EmptyType {
  kind: "Empty";
  target: SeqType | MapType | EmptyType | RecType | undefined;
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
  | TupType
  | RecType
  | FnType
  | MapType
  | EmptyType
  | SetType
  | VarType
  | LambdaType
  | MixType
  | OptType;

interface Compiled {
  type: Type;
  emit: () => string;
}

interface CodeBinding {
  kind: "Code";
  compiled: Compiled;
  // The LET definition or argument whose value in the current state the code is, which a primed
  // expression evaluates again in the next state.
  source: OperatorBinding | undefined;
  // The LET function definition the code builds lazily, with its type, the scope of its body, and
  // whether it reads the next state.
  function?: {
    definition: FunctionDefinition;
    type: LambdaType;
    getScope: () => TierScope;
    isNext: boolean;
  };
  isSelf?: boolean;
}

interface OperatorBinding {
  kind: "Operator";
  definition: OperatorDefinition;
  scope: TierScope;
}

type Binding = CodeBinding | OperatorBinding;

type TierScope = ReadonlyMap<string, Binding>;

interface TypedActionProperty {
  action: Expression;
  subscript: Expression;
}

export interface TypedCheck {
  invariants: Expression[];
  constraints: Expression[];
  // The interpreter checks the initial predicates, in the scopes of the properties they come from.
  holdsInitialPredicates: (state: Value[]) => boolean;
  actionProperties: TypedActionProperty[];
  init: Expression;
  next: Expression;
  // The scope of the LET definitions and arguments the specification's conjuncts were expanded in.
  scope: Scope | undefined;
  isDeadlockChecked: boolean;
  // Without the fingerprint distance, TLC's fingerprints of the states aren't taken.
  isFingerprinted: boolean;
  symmetry: Images[] | undefined;
  view: Expression | undefined;
  // The variables in the order TLC compares states in.
  variableOrder: number[];
  // The solutions of the temporal properties the search checks, without symmetry or a view.
  liveness: Solution[] | undefined;
  // When the interpreter looks for a violation of a temporal property: as it searches too, only at
  // the end, or never.
  livenessCheck: "default" | "final" | "off";
}

export interface TypedResult {
  generatedStates: number;
  distinctStates: number;
  queuedStates: number;
  depth: number;
  initialStates: { generated: number; distinct: number };
  outDegrees: number[];
  deadlock: TypedPath | undefined;
  // The path to the first successor that violates an invariant or an action property, which is its
  // last state.
  violation: TypedPath | undefined;
  // A behavior that violates a temporal property, found after the whole search.
  lasso: TypedLasso | undefined;
  // TLC's fingerprints of the states, in runs each below the next.
  forEachFingerprintRun: (visit: (run: BigInt64Array) => void) => void;
}

// A path from an initial state, which the interpreter rebuilds to report what ends it.
export interface TypedPath {
  length: number;
  isPathState: (position: number, state: Value[]) => boolean;
}

// A lasso of the tier's states, which the interpreter stores to report it. Each state comes after
// the state it was first found from, from an initial state.
export interface TypedLasso extends Lasso {
  states: { index: number; parent: number; isState: (state: Value[]) => boolean }[];
}

const UNSUPPORTED = { reason: "unsupported" };
const DEOPT = { reason: "deopt" };
// A set of integers holds an integer a mask can't, so sets of integers must be arrays.
const WIDE = { reason: "wide" };
// A sparse function where a sequence was typed. The search starts again with empty functions open.
const SPARSE = { reason: "sparse" };
const TUPLED = { reason: "tupled" };
// A value's type is still unknown where it is applied, and a later disjunct may reveal it, as an
// action that sends a message reveals its fields to an earlier action that reads them.
const UNKNOWN = { reason: "unknown" };

const createInt = (isSequenceKey = false): IntType => ({
  kind: "Int",
  target: undefined,
  isSequenceKey,
});
const createStr = (): StrType => ({
  kind: "Str",
  target: undefined,
  modelValueTypes: new Set(),
  hasString: false,
  isStandIn: false,
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

const createOption = (): OptType => ({ kind: "Opt", target: undefined });
// TLC finds an untyped model value unequal to and less than any record. A record type that may hold
// one has a shape whose only field, named by a string no TLA+ string can be, is the model value. A
// shape of one field orders before records of more fields, and its name before any other name.
const NULL_FIELD = "\u0000";
const MAXIMUM_COMPARISONS = 8;
const ATOM_BASE = 2 ** 32;
const MAXIMUM_SUBSET_BASE = 20;
const MAXIMUM_INSERTION_SORT = 16;
const MAXIMUM_MOVES_PER_ELEMENT = 8;
const MAXIMUM_SCANNED_KEYS = 16;
const MAXIMUM_SEQUENCES = 1 << 20;
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

const createBool = (): BoolType => ({ kind: "Bool", target: undefined });

// Whether the search compiles in its sparse pass, where a sequence that meets a sparse function
// becomes one.
const typing = { isSparse: false };

const resolveType = (type: Type): Type => {
  if (
    type.kind === "Map" ||
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

const isSequenceDomain = (type: FnType) => type.domain.every((key, index) => key === index + 1);

const createMap = (): MapType => ({
  kind: "Map",
  keys: { kind: "Set", element: createVar() },
  values: { kind: "Seq", element: createVar() },
});

// A function with an empty domain that is applied, or whose domain is read, is a sparse function.
const expectMap = (type: Type) => {
  if (resolveType(type).kind === "Empty") unify(type, createMap());
  return getMap(type);
};

// A function on a constant domain becomes sparse when it meets a sparse function, which can happen
// after its code was compiled, so the code chooses at emit.
const getMap = (type: Type) => {
  const resolved = resolveType(type);
  return resolved.kind === "Map" ? resolved : undefined;
};

const getShapeIndex = (record: RecType, names: string[]) =>
  record.shapes.findIndex(
    (shape) =>
      shape === names ||
      (shape.length === names.length && shape.every((name, index) => name === names[index])),
  );

const isStructure = (type: Type) => ["Seq", "Tup", "Empty", "Fn", "Map", "Set"].includes(type.kind);

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
  // The structure takes the stand-in's type, and the code deopts where the stand-in is taken.
  if (rightType.kind === "Str" && rightType.isStandIn && isStructure(leftType)) {
    rightType.target = leftType;
    return;
  }
  if (leftType.kind === "Str" && leftType.isStandIn && isStructure(rightType)) {
    return unify(rightType, leftType);
  }
  if (leftType.kind === "Tup" || rightType.kind === "Tup") {
    if (
      leftType.kind === "Tup" &&
      rightType.kind === "Tup" &&
      leftType.elements.length === rightType.elements.length
    ) {
      rightType.target = leftType;
      leftType.elements.forEach((element, index) => unify(element, rightType.elements[index]));
      return;
    }
    return unify(toSequence(leftType), toSequence(rightType));
  }
  if (leftType.kind === "Empty" && rightType.kind !== "Empty") return unify(rightType, leftType);
  if (rightType.kind === "Empty") {
    if (leftType.kind === "Fn") {
      const target: Type = isSequenceDomain(leftType)
        ? { kind: "Seq", element: createVar() }
        : createMap();
      rightType.target = target;
      return unify(target, leftType);
    }
    // TLC's empty function is also the record without fields.
    if (leftType.kind === "Rec") {
      if (getShapeIndex(leftType, []) === -1) leftType.shapes.push([]);
      rightType.target = leftType;
      return;
    }
    if (leftType.kind !== "Seq" && leftType.kind !== "Map" && leftType.kind !== "Empty") {
      return unsupported();
    }
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
      leftType.isStandIn &&= rightType.isStandIn;
      checkAtoms(leftType);
    }
    if (leftType.kind === "Int" && rightType.kind === "Int") {
      leftType.isSequenceKey ||= rightType.isSequenceKey;
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
  const isLeftOption =
    leftType.kind === "Bool" || leftType.kind === "Opt" || leftType.kind === "Str";
  const isRightOption =
    rightType.kind === "Bool" || rightType.kind === "Opt" || rightType.kind === "Str";
  if (
    isLeftOption &&
    isRightOption &&
    [leftType.kind, rightType.kind].some((kind) => kind === "Bool" || kind === "Opt")
  ) {
    if (leftType.kind === rightType.kind) {
      rightType.target = leftType;
      return;
    }
    const option: OptType =
      leftType.kind === "Opt" ? leftType : rightType.kind === "Opt" ? rightType : createOption();
    [leftType, rightType].forEach((type) => {
      if (type.kind === "Str" && (type.hasString || type.modelValueTypes.size > 0)) unsupported();
      if (type !== option) type.target = option;
    });
    return;
  }
  if (leftType.kind === "Str" && rightType.kind === "Rec") return unify(rightType, leftType);
  if (leftType.kind === "Rec" && rightType.kind === "Str") {
    if (rightType.hasString || rightType.modelValueTypes.size > 0) return unsupported();
    if (getShapeIndex(leftType, [NULL_FIELD]) === -1) leftType.shapes.push([NULL_FIELD]);
    if (!leftType.fields.has(NULL_FIELD)) leftType.fields.set(NULL_FIELD, createStr());
    rightType.target = leftType;
    return;
  }
  if (leftType.kind === "Fn" && rightType.kind === "Seq") return unify(rightType, leftType);
  if (leftType.kind === "Seq" && rightType.kind === "Fn") {
    // A function on another domain is a sparse function, as a sequence that meets it is.
    if (!isSequenceDomain(rightType)) {
      if (!typing.isSparse) throw SPARSE;
      const map = createMap();
      unify(map, rightType);
      return unify(leftType, map);
    }
    rightType.target = leftType;
    return unify(leftType.element, rightType.range);
  }
  if (leftType.kind === "Fn" && rightType.kind === "Map") return unify(rightType, leftType);
  if (leftType.kind === "Map" && rightType.kind === "Fn") {
    rightType.target = leftType;
    unify(leftType.keys.element, rightType.key);
    return unify(leftType.values.element, rightType.range);
  }
  const kinds = [leftType.kind, rightType.kind];
  if (leftType.kind === "Map" && rightType.kind === "Seq") return unify(rightType, leftType);
  if (leftType.kind === "Seq" && rightType.kind === "Map" && typing.isSparse) {
    leftType.target = rightType;
    unify(rightType.keys.element, createInt());
    return unify(rightType.values.element, leftType.element);
  }
  if (kinds.includes("Seq") && (kinds.includes("Map") || kinds.includes("Rec"))) throw SPARSE;
  if ([leftType, rightType].some((type) => type.kind === "Int" && type.isSequenceKey)) throw SPARSE;
  if (leftType.kind !== rightType.kind) return unsupported();
  if (leftType.kind === "Map" && rightType.kind === "Map") {
    unify(leftType.keys, rightType.keys);
    return unify(leftType.values, rightType.values);
  }
  if (leftType.kind === "Seq" && rightType.kind === "Seq") {
    rightType.target = leftType;
    return unify(leftType.element, rightType.element);
  }
  if (leftType.kind === "Set" && rightType.kind === "Set") {
    return unify(leftType.element, rightType.element);
  }
  if (leftType.kind === "Fn" && rightType.kind === "Fn") {
    // TLC's functions on 1..n are sequences, so functions on two such domains share a sequence type.
    if (!isSameDomain(leftType.domain, rightType.domain)) {
      const sequence: Type = { kind: "Seq", element: createVar() };
      unify(sequence, leftType);
      return unify(sequence, rightType);
    }
    rightType.target = leftType;
    unify(leftType.key, rightType.key);
    return unify(leftType.range, rightType.range);
  }
  if (leftType.kind === "Lambda" && rightType.kind === "Lambda") {
    unify(leftType.argument, rightType.argument);
    return unify(leftType.result, rightType.result);
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

const toSequence = (type: Type): Type => {
  if (type.kind !== "Tup") return type;
  const sequence: SeqType = { kind: "Seq", element: createVar() };
  type.target = sequence;
  type.elements.forEach((element) => unify(sequence.element, element));
  return sequence;
};

const getInnerTypes = (type: Type): Type[] => {
  switch (type.kind) {
    case "Seq":
    case "Set":
      return [type.element];
    case "Tup":
      return type.elements;
    case "Map":
      return [type.keys, type.values];
    case "Fn":
      return [type.range];
    case "Rec":
      return [...type.fields.values()];
    default:
      return [];
  }
};

// A record of several shapes can hold one of its own type in a field some shapes lack, as a message
// holds the request it answers. The code for such a record calls itself.
const isRecursive = (record: RecType) => {
  const visited = new Set<Type>();
  const isReaching = (type: Type): boolean => {
    const resolved = resolveType(type);
    if (resolved === record) return true;
    if (visited.has(resolved)) return false;
    visited.add(resolved);
    return getInnerTypes(resolved).some(isReaching);
  };
  return record.shapes.length > 1 && getInnerTypes(record).some(isReaching);
};

// A type left open, such as the element of a set that is always empty, holds no values. A type
// holds itself only through a record that can, and closing stops there.
const closeType = (type: Type, path: Type[] = []): Type => {
  const resolved = resolveType(type);
  // A function built lazily is only applied, never compared or stored.
  if (resolved.kind === "Lambda") return unsupported();
  if (resolved.kind === "Rec" && resolved.shapes.length === 0) return unsupported();
  if (resolved.kind === "Var") {
    const integer = createInt();
    resolved.target = integer;
    return integer;
  }
  if (resolved.kind === "Empty") {
    const sequence: SeqType = { kind: "Seq", element: createInt() };
    resolved.target = sequence;
    return sequence;
  }
  const index = path.indexOf(resolved);
  if (index !== -1) {
    return path.slice(index).some((inner) => inner.kind === "Rec" && inner.shapes.length > 1)
      ? resolved
      : unsupported();
  }
  path.push(resolved);
  getInnerTypes(resolved).forEach((inner) => closeType(inner, path));
  path.pop();
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

// Elements of a tuple that don't unify are kept apart in a second pass.
const unifyElements = (elements: Type[], element: Type) => {
  try {
    elements.forEach((inner) => unify(element, inner));
  } catch (error) {
    throw error === UNSUPPORTED && elements.length > 1 ? TUPLED : error;
  }
};

const getValueType = (value: Value, plains: Plains): Type => {
  if (typeof value === "number") return createInt();
  if (typeof value === "boolean") return createBool();
  if (typeof value === "string" || value.kind === "ModelValue") {
    // Marking the atom now finds an integer that meets it as the types unify.
    const type = createStr();
    addAtom(type, plains, value);
    return type;
  }
  // A lazy function from the interpreter converts here as the state's fingerprint would convert it, and the tier runs no effects.
  if (value.kind === "LazyFunction") return getValueType(toFiniteFunction(value), plains);
  if (value.kind === "Interval") return { kind: "Set", element: createInt() };
  if (value.kind !== "Function") {
    const element: Type = createVar();
    getElements(value).forEach((inner) => unify(element, getValueType(inner, plains)));
    return { kind: "Set", element };
  }
  if (value.domain.length === 0 && plains.isSparse) return { kind: "Empty", target: undefined };
  if (value.functionClass === "tuple" || value.domain.length === 0) {
    const elements = value.range.map((inner) => getValueType(inner, plains));
    if (plains.isTupled && elements.length > 0) return { kind: "Tup", elements, target: undefined };
    const element: Type = createVar();
    unifyElements(elements, element);
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
  if (typeof value === "object" && value.kind === "LazyFunction") {
    return unifyValue(type, toFiniteFunction(value), plains);
  }
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
  // Whether a function with an empty domain may be a sparse function, not only a sequence.
  isSparse: boolean;
  isTupled: boolean;
  // Whether a function whose type no use reveals in time is taken to map keys.
  isGuessed: boolean;
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
const getOptionAtom = (plains: Plains, value: Value) =>
  typeof value === "object" && value.kind === "ModelValue" && value.type === undefined
    ? getAtom(plains, value)
    : unsupported();

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

// Sizes a set of subsets, functions, records or tuples from its parts, before enumerating it.
const getSize = (value: Value): number => {
  if (typeof value !== "object") return unsupported();
  switch (value.kind) {
    case "Subset":
      return 2 ** getSize(value.base);
    case "FunctionSet":
      return getSize(value.range) ** getSize(value.domain);
    case "RecordSet":
      return value.sets.reduce((size: number, set) => size * getSize(set), 1);
    case "ProductSet":
      return value.factors.reduce((size: number, set) => size * getSize(set), 1);
    default:
      return getElements(value).length;
  }
};

const getEmptyRecordCode = (program: Program, record: RecType) =>
  record.shapes.length === 1 ? "H.EMPTY" : addConstant(program, [getShapeIndex(record, [])]);

const getEmptyMap = (map: MapType, plains: Plains) => [isMask(map.keys, plains) ? 0 : [], []];

const toPlain = (value: Value, type: Type, plains: Plains): Plain => {
  if (typeof value === "object" && value.kind === "LazyFunction") {
    return toPlain(toFiniteFunction(value), type, plains);
  }
  const resolved = resolveType(type);
  if (resolved.kind === "Int") return typeof value === "number" ? value : unsupported();
  if (resolved.kind === "Bool") return typeof value === "boolean" ? value : unsupported();
  if (resolved.kind === "Opt")
    return typeof value === "boolean" ? value : getOptionAtom(plains, value);
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
  if (resolved.kind === "Rec" && typeof value === "object" && value.kind === "ModelValue") {
    const tag = getShapeIndex(resolved, [NULL_FIELD]);
    if (tag === -1 || value.type !== undefined) return unsupported();
    const atom = getAtom(plains, value);
    return resolved.shapes.length === 1 ? [atom] : [tag, atom];
  }
  if (typeof value !== "object" || value.kind !== "Function") return unsupported();
  if (resolved.kind === "Map") {
    return [
      toPlain(createSet(value.domain), resolved.keys, plains),
      value.range.map((inner) => toPlain(inner, resolved.values.element, plains)),
    ];
  }
  if (resolved.kind === "Seq") {
    return value.range.map((inner) => toPlain(inner, resolved.element, plains));
  }
  if (resolved.kind === "Tup") {
    if (value.functionClass !== "tuple" || value.range.length !== resolved.elements.length) {
      return unsupported();
    }
    return value.range.map((inner, index) => toPlain(inner, resolved.elements[index], plains));
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

const getMaskElements = (mask: number) => {
  const elements: number[] = [];
  for (let rest = mask; rest !== 0; rest &= rest - 1) elements.push(31 - Math.clz32(rest & -rest));
  return elements;
};

const getItems = (plain: Plain) => (Array.isArray(plain) ? plain : []);

// Reads the value a plain of the type stands for.
const createValueReader = (type: Type, plains: Plains): ((plain: Plain) => Value) => {
  const resolved = resolveType(type);
  if (resolved.kind === "Int" || resolved.kind === "Bool")
    return (plain) => (Array.isArray(plain) ? unsupported() : plain);
  if (resolved.kind === "Str") return (plain) => plains.values[Number(plain)];
  if (resolved.kind === "Opt") {
    return (plain) => (typeof plain === "boolean" ? plain : plains.values[Number(plain)]);
  }
  if (resolved.kind === "Mix") {
    return (plain) => {
      const scalar = Number(plain);
      return scalar < ATOM_BASE ? scalar : plains.values[scalar - ATOM_BASE];
    };
  }
  if (resolved.kind === "Set") {
    if (isMask(resolved, plains)) return (plain) => createSortedSet(getMaskElements(Number(plain)));
    const readElement = createValueReader(resolved.element, plains);
    return (plain) => createSet(getItems(plain).map(readElement));
  }
  if (resolved.kind === "Seq") {
    const readElement = createValueReader(resolved.element, plains);
    return (plain) => createTuple(getItems(plain).map(readElement));
  }
  if (resolved.kind === "Tup") {
    const readers = resolved.elements.map((element) => createValueReader(element, plains));
    return (plain) => createTuple(getItems(plain).map((item, index) => readers[index](item)));
  }
  if (resolved.kind === "Fn") {
    const readRange = createValueReader(resolved.range, plains);
    return (plain) => createSortedFunction(resolved.domain, getItems(plain).map(readRange));
  }
  if (resolved.kind === "Map") {
    const readKey = createValueReader(resolved.keys.element, plains);
    const readValue = createValueReader(resolved.values.element, plains);
    const isMasked = isMask(resolved.keys, plains);
    return (plain) => {
      const [keys, values] = getItems(plain);
      const domain = isMasked ? getMaskElements(Number(keys)) : getItems(keys).map(readKey);
      const range = getItems(values);
      return createFunction(domain.map((key, index) => [key, readValue(range[index])]));
    };
  }
  if (resolved.kind !== "Rec") return unsupported();
  // A record can hold one of its own type, so its readers are made as it's first read.
  const getShapes = () =>
    getRecordShapes(resolved).map((shape) => ({
      ...shape,
      readers: shape.types.map((field) => createValueReader(field, plains)),
    }));
  let shapes: ReturnType<typeof getShapes> | undefined;
  const isTagged = resolved.shapes.length > 1;
  return (plain) => {
    const items = getItems(plain);
    shapes ??= getShapes();
    const shape = shapes[isTagged ? Number(items[0]) : 0];
    const fields = isTagged ? items.slice(1) : items;
    if (shape.isNull) return plains.values[Number(fields[0])];
    return createSortedRecord(
      shape.names,
      shape.order.map((field, index) => shape.readers[index](fields[field])),
    );
  };
};

// A shape lists its fields by name, but TLC orders a record's fields as it first saw the names.
const getRecordShapes = (resolved: RecType) =>
  resolved.shapes.map((names) => {
    const order = names
      .map((_value, index) => index)
      .sort((left, right) => compareValues(names[left], names[right]));
    return {
      names: order.map((index) => names[index]),
      order,
      isNull: names.length === 1 && names[0] === NULL_FIELD,
      types: order.map((index) => getFieldType(resolved, names[index])),
    };
  });

const isScalar = (value: Value) => typeof value !== "object" || value.kind === "ModelValue";

// Generates code that fingerprints a state's plains in the order given, as TLC fingerprints the
// values they stand for, into words as its low and high words. A projection fingerprints as the
// tuple it stands for. Scalars it knows, such as atoms and field names, extend by their extensions.
const createStateFingerprinter = (types: Type[], order: Projection[], plains: Plains) => {
  const atoms = Int32Array.from(plains.values.flatMap(getScalarExtension));
  const domains: Int32Array[] = [];
  const fallbacks: ((plain: Plain) => void)[] = [];
  const words = new Int32Array(2);
  const names = { count: 0 };
  const code = FINGERPRINT_CODE;
  const getAtomCode = (atom: string) =>
    `${atom} *= 3; ${code.scalar(`A[${atom}]`, `A[${atom} + 1]`, `A[${atom} + 2]`)}`;
  const getCode = (type: Type, plain: string): string => {
    const resolved = resolveType(type);
    const name = `p${names.count++}`;
    if (resolved.kind === "Int") return code.integer(plain);
    if (resolved.kind === "Bool") return code.boolean(plain);
    if (resolved.kind === "Str") return `{ let ${name} = ${plain}; ${getAtomCode(name)} }`;
    if (resolved.kind === "Opt") {
      return `{ let ${name} = ${plain}; if (typeof ${name} === "boolean") { ${code.boolean(name)} } else { ${getAtomCode(name)} } }`;
    }
    if (resolved.kind === "Mix") {
      return `{ let ${name} = ${plain}; if (${name} < ${ATOM_BASE}) { ${code.integer(name)} } else { ${name} -= ${ATOM_BASE}; ${getAtomCode(name)} } }`;
    }
    // A mask's bits are its elements, in TLC's order.
    if (resolved.kind === "Set" && isMask(resolved, plains)) {
      return `{ const ${name} = ${plain}; ${code.set(`H.count(${name})`)} for (let r${name} = ${name}; r${name} !== 0; r${name} &= r${name} - 1) { ${code.integer(`(31 - Math.clz32(r${name} & -r${name}))`)} } }`;
    }
    if (resolved.kind === "Seq") {
      return `{ const ${name} = ${plain}; ${code.function(`${name}.length`)} for (let i${name} = 0; i${name} < ${name}.length; i${name}++) { ${code.integer(`(i${name} + 1)`)} ${getCode(resolved.element, `${name}[i${name}]`)} } }`;
    }
    // Sets, and the keys of functions, are kept sorted in TLC's order.
    if (resolved.kind === "Set") {
      return `{ const ${name} = ${plain}; ${code.set(`${name}.length`)} for (let i${name} = 0; i${name} < ${name}.length; i${name}++) { ${getCode(resolved.element, `${name}[i${name}]`)} } }`;
    }
    if (resolved.kind === "Map" && isMask(resolved.keys, plains)) {
      return `{ const ${name} = ${plain}; const k${name} = ${name}[0]; const v${name} = ${name}[1]; ${code.function(`H.count(k${name})`)} for (let r${name} = k${name}, i${name} = 0; r${name} !== 0; r${name} &= r${name} - 1, i${name}++) { ${code.integer(`(31 - Math.clz32(r${name} & -r${name}))`)} ${getCode(resolved.values.element, `v${name}[i${name}]`)} } }`;
    }
    if (resolved.kind === "Map") {
      return `{ const ${name} = ${plain}; const k${name} = ${name}[0]; const v${name} = ${name}[1]; ${code.function(`k${name}.length`)} for (let i${name} = 0; i${name} < k${name}.length; i${name}++) { ${getCode(resolved.keys.element, `k${name}[i${name}]`)} ${getCode(resolved.values.element, `v${name}[i${name}]`)} } }`;
    }
    if (resolved.kind === "Tup") {
      const items = resolved.elements.map(
        (element, index) =>
          `${code.integer(String(index + 1))} ${getCode(element, `${name}[${index}]`)}`,
      );
      return `{ const ${name} = ${plain}; ${code.function(String(items.length))} ${items.join(" ")} }`;
    }
    if (resolved.kind === "Fn" && resolved.domain.every(isScalar)) {
      const domain = domains.push(Int32Array.from(resolved.domain.flatMap(getScalarExtension))) - 1;
      const index = `3 * i${name}`;
      return `{ const ${name} = ${plain}; const d${name} = D[${domain}]; ${code.function(`${name}.length`)} for (let i${name} = 0; i${name} < ${name}.length; i${name}++) { ${code.scalar(`d${name}[${index}]`, `d${name}[${index} + 1]`, `d${name}[${index} + 2]`)} ${getCode(resolved.range, `${name}[i${name}]`)} } }`;
    }
    if (resolved.kind === "Rec" && !isRecursive(resolved)) {
      const offset = resolved.shapes.length > 1 ? 1 : 0;
      const cases = getRecordShapes(resolved).map((shape) => {
        if (shape.isNull)
          return `{ let n${name} = ${name}[${offset}]; ${getAtomCode(`n${name}`)} }`;
        const fields = shape.order.map((field, index) => {
          const extension = getScalarExtension(shape.names[index]).map(String);
          return `${code.scalar(extension[0], extension[1], extension[2])} ${getCode(shape.types[index], `${name}[${field + offset}]`)}`;
        });
        return `${code.function(String(fields.length))} ${fields.join(" ")}`;
      });
      const body =
        offset === 0
          ? cases[0]
          : `switch (${name}[0]) { ${cases.map((item, tag) => `case ${tag}: ${item} break;`).join(" ")} }`;
      return `{ const ${name} = ${plain}; ${body} }`;
    }
    // Any other function is fingerprinted as the value it stands for, which sorts its domain.
    const read = createValueReader(type, plains);
    const fallback = fallbacks.push((item) => extendFingerprint(words, read(item))) - 1;
    return `W[0] = l; W[1] = h; X[${fallback}](${plain}); l = W[0]; h = W[1];`;
  };
  const getProjectionCode = (projection: Projection): string =>
    typeof projection === "number"
      ? getCode(types[projection], `s[${projection}]`)
      : `${code.function(String(projection.length))} ${projection.map((item, index) => `${code.integer(String(index + 1))} ${getProjectionCode(item)}`).join(" ")}`;
  const body = order.map(getProjectionCode).join("\n");
  const tables = getFingerprintTables();
  const fingerprint: (state: Plain[]) => void = new Function(
    "H0",
    "H1",
    "H2",
    "H3",
    "L0",
    "L1",
    "L2",
    "L3",
    "A",
    "D",
    "X",
    "W",
    "H",
    `return (s) => { let h = ${tables.initialHigh}, l = ${tables.initialLow}, m; ${body} W[0] = l; W[1] = h; };`,
  )(
    tables.H0,
    tables.H1,
    tables.H2,
    tables.H3,
    tables.L0,
    tables.L1,
    tables.L2,
    tables.L3,
    atoms,
    domains,
    fallbacks,
    words,
    HELPERS,
  );
  return { fingerprint, words };
};

interface Program {
  environment: Environment;
  plains: Plains;
  constants: Plain[];
  constantSets: Map<number, Plain[]>[];
  bitmaps: Uint8Array[];
  comparers: { names: Map<Type, string>; functions: string[] };
  // The functions permuting records that hold themselves.
  permuters: Map<Type, string>;
  indexes: Int32Array[];
  lookups: Map<number, { key: Plain; position: number }[]>[];
  variableTypes: Type[];
  names: { count: number };
  inlining: Definition[];
  recursions: Map<Definition, Recursion>;
  // The functions counting the ways the LET functions being compiled hold as actions.
  ways: Map<Definition, string>;
  isGuessing: boolean;
}

// The function a RECURSIVE operator compiles to, which its applications in its own body call.
interface Recursion {
  name: string;
  params: Type[];
  result: Type;
}

const getName = (program: Program, prefix: string) => `${prefix}${program.names.count++}`;

const addConstant = (program: Program, plain: Plain) => {
  program.constants.push(plain);
  return `K[${program.constants.length - 1}]`;
};

// TLC streams a lazy set's duplicates, and binds a bound variable again to each. Streaming comes
// first, since normalizing a lazy set caches its elements.
const hasStreamedDuplicates = (value: Value) =>
  getStreamedElements(value).length !== getElements(value).length;

const compileConstant = (program: Program, value: Value): Compiled => {
  const type = getValueType(value, program.plains);
  if (type.kind === "Str" && typeof value === "object") {
    type.isStandIn = true;
    return {
      type,
      emit: once(() =>
        isStructure(resolveType(type))
          ? "H.deopt()"
          : getPlainCode(program, toPlain(value, type, program.plains)),
      ),
    };
  }
  if (type.kind === "Set" && hasStreamedDuplicates(value)) return unsupported();
  if (type.kind === "Set" && getElements(value).length === 0) {
    return { type, emit: () => (isMask(type, program.plains) ? "0" : "H.EMPTY") };
  }
  return { type, emit: once(() => getPlainCode(program, toPlain(value, type, program.plains))) };
};

const getPlainCode = (program: Program, plain: Plain) =>
  Array.isArray(plain) ? addConstant(program, plain) : String(plain);

const getDomainCode = (program: Program, map: MapType, domain: Value[]) =>
  getPlainCode(program, toPlain(createSet(domain), map.keys, program.plains));

const once = <Built>(build: () => Built) => {
  const built: Built[] = [];
  return () => {
    if (built.length === 0) built.push(build());
    return built[0];
  };
};

type Comparer = (left: Plain, right: Plain) => number;

// The position of a key among the sorted keys of a sparse function, or -1 when it isn't one.
const findKey = (compare: Comparer, keys: Plain[], key: Plain) => {
  for (let low = 0, high = keys.length - 1; low <= high;) {
    const middle = (low + high) >>> 1;
    const comparison = compare(keys[middle], key);
    if (comparison === 0) return middle;
    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }
  return -1;
};

const findScannedKey = (compare: Comparer, keys: Plain[], key: Plain) =>
  keys.length <= MAXIMUM_SCANNED_KEYS ? keys.indexOf(key) : findKey(compare, keys, key);

const findMaskKey = (mask: number, key: number) =>
  key >= 0 && key < MASK_BITS && ((mask >>> key) & 1) !== 0
    ? countBits(mask & ((1 << key) - 1))
    : -1;

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
  if (resolved.kind === "Opt") return `H.compareOption(R, ${left}, ${right})`;
  if (resolved.kind === "Set" && isMask(resolved, program.plains)) {
    return `H.compareMasks(${left}, ${right})`;
  }
  return `${getComparerCode(program, resolved)}(${left}, ${right})`;
};

const getComparerCode = (program: Program, type: Type): string => {
  const resolved = closeType(type);
  if (resolved.kind === "Set" && isMask(resolved, program.plains)) return "H.compareMasks";
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
    // TLC orders tuples of one length by their elements.
    if (resolved.kind === "Tup") {
      return getChain(resolved.elements.map((type, position) => ({ type, position })));
    }
    // TLC orders functions by their domains, which it orders as sets, and then by their values.
    if (resolved.kind === "Map") {
      return getChain([
        { type: resolved.keys, position: 0 },
        { type: resolved.values, position: 1 },
      ]);
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
// that isn't a record or a model value fails to unify with it.
const expectRecord = (type: Type) => {
  const unresolved = resolveType(type);
  const kind = unresolved.kind;
  if (
    kind === "Var" ||
    kind === "Str" ||
    kind === "Empty" ||
    (unresolved.kind === "Int" && unresolved.isSequenceKey)
  ) {
    unify(type, { kind: "Rec", shapes: [], fields: new Map(), target: undefined });
  }
  const resolved = resolveType(type);
  return resolved.kind === "Rec" ? resolved : unsupported();
};

// A name for code in an expression, and a wrap that binds it there, unless the code only reads a
// value the expression can read again.
const getBinding = (program: Program, prefix: string, code: string) => {
  if (/^[A-Za-z_$][\w$]*(\[\d+\])*$/.test(code))
    return { name: code, wrap: (body: string) => `(${body})` };
  const name = getName(program, prefix);
  return { name, wrap: (body: string) => `((${name}) => ${body})(${code})` };
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
  const columns = rows[0].map((_value, column) => {
    const values = rows.map((row) => Number(row[column]));
    return { low: Math.min(...values), size: Math.max(...values) - Math.min(...values) + 1 };
  });
  const strides = columns.map((_value, column) =>
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
  const key = getBinding(program, "k", code);
  const isInBox = columns.map(
    (column, position) =>
      `${key.name}[${position}] >= ${column.low} && ${key.name}[${position}] < ${column.low + column.size}`,
  );
  const offset = columns.map(
    (column, position) => `(${key.name}[${position}] - ${column.low}) * ${strides[position]}`,
  );
  return key.wrap(
    `${key.name}.length === ${columns.length} && ${isInBox.join(" && ")} ? ${table}[${offset.join(" + ")}] : -1`,
  );
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
  // The code that reads each unprimed variable, which is the next state's inside a primed expression.
  variables: string[];
  // Whether the expression is primed as a whole, where TLC evaluates a LET definition or an argument
  // again in the next state.
  isNext: boolean;
}

const getVariableCodes = (program: Program) =>
  program.variableTypes.map((_value, index) => `v${index}`);

// An expression primed as a whole reads every variable in the next state, where priming again is an
// error. A variable the action hasn't assigned yet has no value there, and TLC fails on it.
const getNextFrame = (frame: Frame): Frame => ({
  scope: frame.scope,
  primed: frame.primed.map(() => undefined),
  variables: frame.primed.map((code) => code ?? "H.deopt()"),
  isNext: true,
});

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

const isBuiltin = (frame: Frame, operator: string, name: string) =>
  operator === name && !frame.scope.has(name);

const bindCode = (scope: TierScope, name: string, type: Type, code: string) =>
  withBinding(scope, name, {
    kind: "Code",
    compiled: { type, emit: () => code },
    source: undefined,
  });

const bindDefinition = (
  scope: TierScope,
  definition: OperatorDefinition,
  value: Compiled,
  name: string,
  frame: Frame,
) =>
  withBinding(scope, definition.name, {
    kind: "Code",
    compiled: { type: value.type, emit: () => getLazyCode(name) },
    source: frame.isNext ? undefined : { kind: "Operator", definition, scope },
  });

// TLC evaluates a RECURSIVE operator by applying it again, so the tier compiles its body once, into
// a function its outermost application defines.
const compileRecursion = (
  program: Program,
  definition: OperatorDefinition,
  scope: TierScope,
  frame: Frame,
): Compiled => {
  // Its applications take their arguments as values, even one bound by name to branch in an action.
  const args = definition.params.map((param) => {
    const binding = scope.get(param.name);
    if (binding?.kind === "Code") return binding.compiled;
    return binding?.kind === "Operator" && binding.definition.params.length === 0
      ? compileValue(program, binding.definition.body, { ...frame, scope: binding.scope })
      : unsupported();
  });
  const getCall = (name: string) => `${name}(${args.map((arg) => arg.emit()).join(", ")})`;
  const known = program.recursions.get(definition);
  if (known && program.inlining.includes(definition)) {
    args.forEach((arg, index) => unify(known.params[index], arg.type));
    return { type: known.result, emit: () => getCall(known.name) };
  }
  const recursion = {
    name: getName(program, "r"),
    params: args.map((arg) => arg.type),
    result: createVar(),
  };
  program.recursions.set(definition, recursion);
  const names = args.map(() => getName(program, "p"));
  const bodyScope = definition.params.reduce(
    (inner, param, index) => bindCode(inner, param.name, recursion.params[index], names[index]),
    scope,
  );
  const body = inline(program, definition, () =>
    expectType(
      compileValue(program, definition.body, { ...frame, scope: bodyScope }),
      recursion.result,
    ),
  );
  return {
    type: recursion.result,
    emit: () =>
      `((${recursion.name}) => ((${recursion.name} = (${names.join(", ")}) => (${body.emit()})), ${getCall(recursion.name)}))()`,
  };
};

// Only a recursive definition can reach itself, so another nested in its own inlining is a new use.
const inline = <Result>(program: Program, definition: Definition, compile: () => Result) => {
  const isRecursive =
    definition.isRecursive || (definition.kind === "Function" && definition.isSelfReferential);
  if (isRecursive && program.inlining.includes(definition)) return unsupported();
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
  names?: LazyDefinition[],
): TierScope =>
  definition.params.reduce<TierScope>((scope, param, index) => {
    const arg = args[index];
    if (param.arity > 0)
      return withBinding(scope, param.name, getOperatorArgument(program, arg, frame, param.arity));
    const source: OperatorBinding = {
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
    };
    // TLC passes arguments by name, so a disjunct in one branches where the body uses it as an action.
    if (isBranching(program, arg, frame.scope)) return withBinding(scope, param.name, source);
    const value = compileValue(program, arg, frame);
    const current = frame.isNext ? undefined : source;
    if (!names || arg.kind === "Identifier" || arg.kind === "Number" || arg.kind === "String") {
      return withBinding(scope, param.name, { kind: "Code", compiled: value, source: current });
    }
    // TLC evaluates an argument where the body uses it, and keeps its value, as for a LET.
    const name = getName(program, "l");
    names.push({ name, value });
    return withBinding(scope, param.name, {
      kind: "Code",
      compiled: { type: value.type, emit: () => getLazyCode(name) },
      source: current,
    });
  }, new Map());

// TLC applies an operator argument by name, in the scope of the caller.
const getOperatorArgument = (
  program: Program,
  arg: Expression,
  frame: Frame,
  arity: number,
): OperatorBinding => {
  // An operator such as \cap applies as an expression that applies it, so a builtin compiles as one.
  if (arg.kind === "OperatorReference") {
    const names = Array.from({ length: arity }, (_value, index) => `#${index}`);
    return {
      kind: "Operator",
      definition: {
        kind: "Operator",
        name: arg.operator,
        params: names.map((name) => ({ name, arity: 0 })),
        body: {
          kind: "Apply",
          operator: arg.operator,
          args: names.map((name) => ({ kind: "Identifier", name, location: arg.location })),
          location: arg.location,
        },
        isLocal: true,
        isRecursive: false,
        location: arg.location,
      },
      scope: new Map(),
    };
  }
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
  names?: LazyDefinition[],
) => {
  const binding = frame.scope.get(expression.operator);
  if (binding?.kind === "Code") return unsupported();
  if (binding) {
    const definition = binding.definition;
    const scope = new Map([
      ...binding.scope,
      ...bindArguments(program, definition, expression.args, frame, names),
    ]);
    return { definition, scope };
  }
  const definition = resolveDefinition(program, expression.operator);
  if (definition)
    return {
      definition,
      scope: bindArguments(program, definition, expression.args, frame, names),
    };
  return program.environment.definitions.has(expression.operator) &&
    !program.environment.substitutions.has(expression.operator)
    ? unsupported()
    : undefined;
};

const compileIdentifier = (program: Program, name: string, frame: Frame): Compiled => {
  const code = frame.scope.get(name);
  const binding =
    code?.kind === "Code" && frame.isNext
      ? code.function?.isNext === false
        ? unsupported()
        : (code.source ?? code)
      : code;
  if (binding?.kind === "Code") return binding.compiled;
  if (binding?.kind === "Operator") {
    if (binding.definition.params.length > 0) return unsupported();
    return inline(program, binding.definition, () =>
      compileValue(program, binding.definition.body, { ...frame, scope: binding.scope }),
    );
  }
  const global = findGlobalName(name, program.environment);
  if (global?.kind === "Variable") {
    return { type: program.variableTypes[global.index], emit: () => frame.variables[global.index] };
  }
  if (global?.kind === "Value") return compileConstant(program, global.value);
  if (global?.kind === "Definition") {
    const definition = global.definition;
    const startup = getStartupValue(definition, program.environment);
    // A function definition is the function its constructor builds.
    if (definition.kind === "Function") {
      if (startup !== undefined && getFunctionClass(startup) !== "lambda") {
        return compileConstant(program, startup);
      }
      return inline(program, definition, () =>
        compileValue(
          program,
          {
            kind: "FunctionConstruction",
            bounds: definition.bounds,
            body: definition.body,
            location: definition.location,
            isRecursive: definition.isSelfReferential,
          },
          { ...frame, scope: new Map() },
        ),
      );
    }
    if (definition.params.length > 0) return unsupported();
    if (isConstantLevel(definition, program.environment)) {
      // TLC evaluates a constant definition once, as it starts.
      return compileConstant(program, startup ?? evaluateConstant(program, definition.body));
    }
    return inline(program, definition, () =>
      compileValue(program, definition.body, { ...frame, scope: new Map() }),
    );
  }
  return unsupported();
};

// TLC fails to do arithmetic on, or order, a model value, which a class of mixed scalars may hold.
// TLC fails to evaluate a model value as a condition.
const expectBool = (compiled: Compiled): Compiled => {
  unify(compiled.type, createBool());
  return {
    type: compiled.type,
    emit: () =>
      resolveType(compiled.type).kind === "Opt" ? `H.bool(${compiled.emit()})` : compiled.emit(),
  };
};

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
    if (getSize(value) > MAXIMUM_CONSTANT_SET || hasStreamedDuplicates(value)) return unsupported();
    const elements = getElements(value);
    const element: Type = createVar();
    elements.forEach((inner) => unify(element, getValueType(inner, program.plains)));
    const getCode = once(() =>
      addConstant(
        program,
        elements.map((inner) => toPlain(inner, element, program.plains)),
      ),
    );
    return { element, header: (name) => getIndexedLoop(program, name, getCode()) };
  }
  const expansion =
    setExpression.kind === "Apply" ? getExpansion(program, setExpression, frame) : undefined;
  if (expansion) {
    return inline(program, expansion.definition, () =>
      compileBound(program, expansion.definition.body, { ...frame, scope: expansion.scope }),
    );
  }
  // TLC enumerates a set of records with its fields sorted, the last one varying fastest.
  if (setExpression.kind === "RecordSet") {
    const fields = [...setExpression.fields].sort((left, right) =>
      left.name < right.name ? -1 : 1,
    );
    const names = fields.map((field) => field.name);
    const loops = fields.map((field) => ({
      name: getName(program, "q"),
      ...compileBound(program, field.value, frame),
    }));
    const element = createRecord(
      names,
      loops.map((loop) => loop.element),
    );
    return {
      element,
      header: (name) => {
        const resolved = resolveType(element);
        if (resolved.kind !== "Rec") return unsupported();
        const shape = getShapeIndex(resolved, names);
        const values = resolved.shapes[shape].map((field) => loops[names.indexOf(field)].name);
        const record = resolved.shapes.length === 1 ? values : [shape, ...values];
        const once = getName(program, "o");
        return `${loops.map((loop) => loop.header(loop.name)).join(" ")} for (let ${name} = [${record.join(", ")}], ${once} = true; ${once}; ${once} = false)`;
      },
    };
  }
  if (setExpression.kind === "Apply" && isBuiltin(frame, setExpression.operator, "..")) {
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
  if (setExpression.kind === "Apply" && isBuiltin(frame, setExpression.operator, "SUBSET")) {
    const base = compileValue(program, setExpression.args[0], frame);
    getSetElement(base);
    return {
      element: base.type,
      header: (name) =>
        getIndexedLoop(
          program,
          name,
          `H.${isMask(base.type, program.plains) ? "subsetMasks" : "subsets"}(${base.emit()})`,
        ),
    };
  }
  const isInterval =
    setExpression.kind === "FunctionSet" &&
    setExpression.domain.kind === "Apply" &&
    isBuiltin(frame, setExpression.domain.operator, "..");
  // A domain that isn't constant, such as DOMAIN s, has sequences for functions only where it's an
  // interval 1..n.
  if (
    setExpression.kind === "FunctionSet" &&
    (isInterval || !isConstantExpression(program, setExpression.domain, frame.scope))
  ) {
    const domain = setExpression.domain;
    const getLimits = (): (() => string) => {
      if (isInterval && domain.kind === "Apply") {
        const [low, high] = domain.args.map((arg) => expectInt(compileValue(program, arg, frame)));
        return () => `${low.emit()}, ${high.emit()}`;
      }
      const set = compileValue(program, domain, frame);
      unify(getSetElement(set), createInt());
      return () =>
        `1, H.intervalEnd(${isMask(set.type, program.plains) ? `H.bits(${set.emit()})` : set.emit()})`;
    };
    const limits = getLimits();
    const range = compileValue(program, setExpression.range, frame);
    const element = getSetElement(range);
    const type: SeqType = { kind: "Seq", element };
    return {
      element: type,
      header: (name) => {
        const elements = isMask(range.type, program.plains)
          ? `H.bits(${range.emit()})`
          : range.emit();
        const sequences = `H.sequences(${elements}, ${limits()})`;
        const items = getName(program, "s");
        return getIndexedLoop(
          program,
          name,
          getMap(type)
            ? `Array.from(${sequences}, (${items}) => ${writeSequence(program, type, items)})`
            : sequences,
        );
      },
    };
  }
  if (setExpression.kind === "Apply" && setExpression.operator === "DOMAIN") {
    const target = compileValue(program, setExpression.args[0], frame);
    const keys = compileKeys(target);
    if (keys) return getSetBound(program, keys);
    const type = resolveType(target.type);
    if (type.kind === "Var") {
      guessFunction(program, type);
      return compileBound(program, setExpression, frame);
    }
    if (type.kind !== "Seq" && type.kind !== "Fn") return unsupported();
    return {
      element: type.kind === "Seq" ? createInt(true) : type.key,
      header: (name) => {
        const resolved = resolveType(type);
        if (resolved.kind === "Map") {
          return getSetHeader(
            program,
            { type: resolved.keys, emit: () => `(${target.emit()})[0]` },
            name,
          );
        }
        if (resolved.kind === "Fn") {
          return getIndexedLoop(
            program,
            name,
            `(${target.emit()}, ${addConstant(program, getKeys(program, resolved))})`,
          );
        }
        const end = getName(program, "e");
        return `for (let ${name} = 1, ${end} = (${target.emit()}).length; ${name} <= ${end}; ${name}++)`;
      },
    };
  }
  return getSetBound(program, compileValue(program, setExpression, frame));
};

// Generated code loops over an array by index, which runs faster than for-of in its large functions.
const getIndexedLoop = (program: Program, name: string, array: string) => {
  const index = getName(program, "i");
  const items = getName(program, "a");
  return `for (let ${index} = 0, ${items} = ${array}, ${name}; ${index} < ${items}.length && ((${name} = ${items}[${index}]), true); ${index}++)`;
};

const getSetHeader = (program: Program, set: Compiled, name: string) => {
  if (!isMask(set.type, program.plains)) return getIndexedLoop(program, name, set.emit());
  const mask = getName(program, "m");
  return `for (let ${mask} = ${set.emit()}, ${name} = 0; ${mask} !== 0; ${mask} >>>= 1, ${name}++) if ((${mask} & 1) !== 0)`;
};

const getSetBound = (program: Program, set: Compiled) => ({
  element: getSetElement(set),
  header: (name: string) => getSetHeader(program, set, name),
});

// The domain of a sparse function, or undefined for a value of another type.
const compileKeys = (target: Compiled): Compiled | undefined => {
  const map = expectMap(target.type);
  return map && { type: map.keys, emit: () => `(${target.emit()})[0]` };
};

// TLC binds a variable to each element it streams from a set that UNION or \cup builds, duplicates
// included, and which of those sets it streams depends on how it built them.
const rejectStreamedBound = (program: Program, set: Expression, scope: TierScope) => {
  // compileBound streams a constant set to find its duplicates.
  if (isConstantExpression(program, set, scope)) return;
  const visited = new Set<OperatorDefinition>();
  const check = (root: Expression, inner: TierScope) => {
    if (isExpressionImpure([root], program.environment, "streamed")) unsupported();
    const findLocals = (expression: Expression): void => {
      const name =
        expression.kind === "Identifier" || expression.kind === "Apply"
          ? expression.kind === "Identifier"
            ? expression.name
            : expression.operator
          : undefined;
      const binding = name === undefined ? undefined : inner.get(name);
      const local = binding?.kind === "Code" ? binding.source : binding;
      if (local && !visited.has(local.definition)) {
        visited.add(local.definition);
        check(local.definition.body, local.scope);
      }
      getChildren(expression).forEach(findLocals);
    };
    findLocals(root);
  };
  check(set, scope);
};

// TLC enumerates the bounds of an action's \E with the first varying fastest, each in the scope
// outside them.
const compileBounds = (program: Program, bounds: Bound[], frame: Frame, isFirstFastest = false) => {
  const loops: { name: string; element: Type; header: (name: string) => string }[] = [];
  const scope = bounds.reduce<TierScope>((current, bound) => {
    const loop = compileBound(
      program,
      bound.set,
      isFirstFastest ? frame : { ...frame, scope: current },
    );
    const name = getName(program, "q");
    const pattern = bound.pattern;
    if (pattern.kind === "Name") {
      loops.push({ name, element: loop.element, header: loop.header });
      return bindCode(current, pattern.name, loop.element, name);
    }
    // TLC fails to bind a tuple pattern to a value that isn't a tuple of its length.
    const element = createVar();
    unify(loop.element, { kind: "Seq", element });
    loops.push({
      name,
      element: loop.element,
      header: (loopName) =>
        `${loop.header(loopName)} if ((${readSequence(program, loop.element, loopName)}).length === ${pattern.names.length} || H.deopt())`,
    });
    return bindPattern(program, current, pattern.names, element, loop.element, name);
  }, frame.scope);
  // A later conjunct can still refine the type of a bound, so its loop is chosen at emit.
  const getHeaders = () =>
    (isFirstFastest ? loops.toReversed() : loops).map((loop) => loop.header(loop.name)).join(" ");
  return { scope, loops, getHeaders };
};

const bindPattern = (
  program: Program,
  scope: TierScope,
  names: string[],
  element: Type,
  tuple: Type,
  code: string,
) =>
  names.reduce(
    (inner, name, index) =>
      withBinding(inner, name, {
        kind: "Code",
        compiled: {
          type: element,
          emit: () => `(${readSequence(program, tuple, code)})[${index}]`,
        },
        source: undefined,
      }),
    scope,
  );

const compileQuantifier = (
  program: Program,
  expression: Expression & { kind: "Forall" | "Exists" },
  frame: Frame,
): Compiled => {
  const bounds = compileBounds(program, expression.bounds, frame);
  const body = expectBool(
    compileValue(program, expression.body, { ...frame, scope: bounds.scope }),
  );
  const isForall = expression.kind === "Forall";
  return {
    type: createBool(),
    emit: () =>
      `(() => { ${bounds.getHeaders()} { if (${isForall ? "!" : ""}(${body.emit()})) return ${!isForall}; } return ${isForall}; })()`,
  };
};

const getDefinitionBody = (program: Program, expression: Expression, frame: Frame) => {
  if (expression.kind !== "Identifier" || frame.scope.has(expression.name)) return undefined;
  const global = findGlobalName(expression.name, program.environment);
  return global?.kind === "Definition" &&
    global.definition.kind === "Operator" &&
    global.definition.params.length === 0 &&
    !program.environment.bodyValues.has(global.definition.body)
    ? global.definition.body
    : undefined;
};

const isUnion = (expression: Expression & { kind: "Apply" }, frame: Frame) =>
  expression.args.length === 2 && isBuiltin(frame, expression.operator, "\\cup");

const getApplied = (program: Program, expression: Expression, frame: Frame) =>
  expression.kind === "Apply" && !frame.scope.has(expression.operator)
    ? resolveDefinition(program, expression.operator)
    : undefined;

const isInfiniteConstant = (program: Program, expression: Expression, frame: Frame) => {
  if (!isConstantExpression(program, expression, frame.scope)) return false;
  const value = evaluateConstant(program, expression);
  return typeof value === "object" && value.kind === "InfiniteSet";
};

// Whether membership in a set is tested on its parts rather than by enumerating it.
const isStructural = (program: Program, expression: Expression, frame: Frame): boolean => {
  const body =
    getDefinitionBody(program, expression, frame) ?? getApplied(program, expression, frame)?.body;
  if (body) return isStructural(program, body, { ...frame, scope: new Map() });
  if (expression.kind === "Apply" && isUnion(expression, frame)) {
    return expression.args.some((set) => isStructural(program, set, frame));
  }
  // TLC filters an enumerated set as it builds the filter, and any other set lazily.
  if (expression.kind === "SetFilter") {
    const base = expression.bound.set;
    return (
      isStructural(program, base, frame) ||
      base.kind === "Product" ||
      isInfiniteConstant(program, base, frame)
    );
  }
  if (
    expression.kind === "Apply" &&
    expression.args.length === 2 &&
    isBuiltin(frame, expression.operator, "\\")
  ) {
    return (
      isStructural(program, expression.args[0], frame) &&
      isConstantExpression(program, expression.args[1], frame.scope)
    );
  }
  return (
    expression.kind === "RecordSet" ||
    expression.kind === "FunctionSet" ||
    (expression.kind === "Apply" &&
      (expression.operator === "SUBSET" || expression.operator === "Seq"))
  );
};

const compileMembership = (
  program: Program,
  element: Compiled,
  setExpression: Expression,
  frame: Frame,
): Compiled => {
  if (
    setExpression.kind === "FunctionSet" &&
    !isConstantExpression(program, setExpression.domain, frame.scope)
  ) {
    const domain = setExpression.domain;
    if (domain.kind !== "Apply" || !isBuiltin(frame, domain.operator, "..")) {
      return unsupported();
    }
    const [low, high] = domain.args.map((arg) => expectInt(compileValue(program, arg, frame)));
    const range: Type = createVar();
    unify(element.type, { kind: "Seq", element: range });
    const name = getName(program, "e");
    const [sequence, first, last] = ["s", "l", "h"].map((prefix) => getName(program, prefix));
    const inner = compileMembership(
      program,
      { type: range, emit: () => name },
      setExpression.range,
      frame,
    );
    // A sequence has the domain 1..Len(s), which an empty interval equals only when s is empty.
    return {
      type: createBool(),
      emit: () =>
        `((${sequence}, ${first}, ${last}) => (${last} < ${first} ? ${sequence}.length === 0 : ${first} === 1 && ${sequence}.length === ${last}) && ${sequence}.every((${name}) => ${inner.emit()}))(${readSequence(program, element.type, element.emit())}, ${low.emit()}, ${high.emit()})`,
    };
  }
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
      type: createBool(),
      emit: () => {
        const map = getMap(element.type);
        if (!map) return `${element.emit()}.every((${name}) => ${inner.emit()})`;
        const pair = getName(program, "p");
        return `((${pair}) => H.same(${pair}[0], ${getDomainCode(program, map, domain)}) && ${pair}[1].every((${name}) => ${inner.emit()}))(${element.emit()})`;
      },
    };
  }
  const body = getDefinitionBody(program, setExpression, frame);
  if (body && isStructural(program, body, { ...frame, scope: new Map() })) {
    return compileMembership(program, element, body, { ...frame, scope: new Map() });
  }
  const applied = getApplied(program, setExpression, frame);
  if (
    setExpression.kind === "Apply" &&
    applied &&
    isStructural(program, applied.body, { ...frame, scope: new Map() })
  ) {
    const expansion = getExpansion(program, setExpression, frame);
    if (expansion) {
      return inline(program, expansion.definition, () =>
        compileMembership(program, element, expansion.definition.body, {
          ...frame,
          scope: expansion.scope,
        }),
      );
    }
  }
  // TLC tests membership in a lazy {x \in S : P} as membership in S, then P of the element.
  if (
    setExpression.kind === "SetFilter" &&
    setExpression.bound.pattern.kind === "Name" &&
    isStructural(program, setExpression, frame)
  ) {
    const name = getName(program, "e");
    const isInSet = compileMembership(
      program,
      { type: element.type, emit: () => name },
      setExpression.bound.set,
      frame,
    );
    const predicate = expectBool(
      compileValue(program, setExpression.predicate, {
        ...frame,
        scope: bindCode(frame.scope, setExpression.bound.pattern.name, element.type, name),
      }),
    );
    return {
      type: createBool(),
      emit: () => `((${name}) => ${isInSet.emit()} && ${predicate.emit()})(${element.emit()})`,
    };
  }
  // TLC tests membership in a union, or in UNION of a literal of one set, in each of its sets. It
  // sorts the sets of a longer literal, which enumerates each.
  const sets =
    setExpression.kind !== "Apply"
      ? undefined
      : isUnion(setExpression, frame) &&
          (isStructural(program, setExpression, frame) ||
            setExpression.args.some((set) => isInfiniteConstant(program, set, frame)))
        ? setExpression.args
        : setExpression.args.length === 1 &&
            isBuiltin(frame, setExpression.operator, "UNION") &&
            setExpression.args[0].kind === "SetEnumeration" &&
            setExpression.args[0].elements.length < 2
          ? setExpression.args[0].elements
          : undefined;
  if (sets) {
    return compileMemberships(program, element, sets, frame, (tests) =>
      tests.length === 0 ? "false" : tests.join(" || "),
    );
  }
  // TLC tests membership in a set less another in the first set, then in the other.
  if (
    setExpression.kind === "Apply" &&
    setExpression.args.length === 2 &&
    isBuiltin(frame, setExpression.operator, "\\") &&
    (isConstantExpression(program, setExpression.args[1], frame.scope) ||
      isInfiniteConstant(program, setExpression.args[0], frame))
  ) {
    return compileMemberships(
      program,
      element,
      setExpression.args,
      frame,
      (tests) => `${tests[0]} && !${tests[1]}`,
    );
  }
  // TLC tests membership in a set of records field by field, without enumerating it.
  if (setExpression.kind === "RecordSet") {
    const fields = [...setExpression.fields].sort((left, right) =>
      left.name < right.name ? -1 : 1,
    );
    const names = fields.map((field) => field.name);
    const types = fields.map((): Type => createVar());
    unify(element.type, createRecord(names, types));
    const record = getName(program, "r");
    const getShape = () => {
      const resolved = resolveType(element.type);
      return resolved.kind === "Rec" ? resolved : unsupported();
    };
    const tests = fields.map((field, index) =>
      compileMembership(
        program,
        {
          type: types[index],
          emit: () => {
            const resolved = getShape();
            const offset = resolved.shapes.length === 1 ? 0 : 1;
            return `${record}[${resolved.shapes[getShapeIndex(resolved, names)].indexOf(field.name) + offset}]`;
          },
        },
        field.value,
        frame,
      ),
    );
    return {
      type: createBool(),
      emit: () => {
        const resolved = getShape();
        const isShape =
          resolved.shapes.length === 1
            ? []
            : [`${record}[0] === ${getShapeIndex(resolved, names)}`];
        const checks = [...isShape, ...tests.map((test) => test.emit())];
        return `((${record}) => ${checks.join(" && ")})(${element.emit()})`;
      },
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
      return {
        type: createBool(),
        emit: () =>
          `${readSequence(program, element.type, element.emit())}.every((${name}) => ${test.emit()})`,
      };
    }
    if (isBuiltin && operator === "DOMAIN") {
      const target = compileValue(program, setExpression.args[0], frame);
      const keys = compileKeys(target);
      if (keys) return compileSetMembership(program, element, keys);
      const type = resolveType(target.type);
      const name = getName(program, "e");
      if (type.kind === "Seq") {
        // A sequence's domain holds only integers, so a function whose domain holds another value
        // maps keys.
        if (!["Var", "Int", "Mix"].includes(resolveType(element.type).kind)) throw SPARSE;
        const index = expectInt(element);
        return {
          type: createBool(),
          emit: () => {
            const bound = getBinding(program, "e", index.emit());
            return bound.wrap(
              `${bound.name} >= 1 && ${bound.name} <= (${readSequence(program, target.type, target.emit())}).length`,
            );
          },
        };
      }
      // A record's domain holds strings, so a domain that holds another value may be a function's.
      const known = resolveType(element.type);
      if (type.kind === "Var" && (known.kind !== "Str" || !known.hasString)) {
        guessFunction(program, type);
        return compileMembership(program, element, setExpression, frame);
      }
      expectRecord(type);
      const atom = createStr();
      unify(element.type, atom);
      return {
        type: createBool(),
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
          const test = `${names}[${shape}].includes(${name})`;
          // TLC fails to take the domain of a model value.
          const tag = getShapeIndex(record, [NULL_FIELD]);
          const guarded = tag === -1 ? test : `${shape} === ${tag} ? H.deopt() : ${test}`;
          return `((${name}r, ${name}) => ${guarded})(${target.emit()}, ${element.emit()})`;
        },
      };
    }
    // TLC tests membership in SUBSET S as membership in S of each element.
    if (isBuiltin && operator === "SUBSET" && isStructural(program, setExpression.args[0], frame)) {
      const inner: Type = createVar();
      unify(element.type, { kind: "Set", element: inner });
      const name = getName(program, "e");
      const test = compileMembership(
        program,
        { type: inner, emit: () => name },
        setExpression.args[0],
        frame,
      );
      return {
        type: createBool(),
        emit: () =>
          isMask(element.type, program.plains)
            ? unsupported()
            : `${element.emit()}.every((${name}) => ${test.emit()})`,
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
      if (value.name !== "Nat" && value.name !== "Int") return unsupported();
      unify(element.type, createInt());
      // TLC's Int and Nat hold no untyped model value.
      return {
        type: createBool(),
        emit: () => {
          const bound = getBinding(program, "e", element.emit());
          const checks = [
            ...(resolveType(element.type).kind === "Mix" ? [`${bound.name} < ${ATOM_BASE}`] : []),
            ...(value.name === "Nat" ? [`${bound.name} >= 0`] : []),
          ];
          return bound.wrap(checks.length === 0 ? "true" : checks.join(" && "));
        },
      };
    }
    if (typeof value === "object" && value.kind === "Interval") {
      unify(element.type, createInt());
      return {
        type: createBool(),
        emit: () => {
          const bound = getBinding(program, "e", element.emit());
          return bound.wrap(`${bound.name} >= ${value.low} && ${bound.name} <= ${value.high}`);
        },
      };
    }
    if (getSize(value) > MAXIMUM_CONSTANT_SET) return unsupported();
    const elements = getElements(value);
    if (elements.length === 0) return { type: createBool(), emit: () => "false" };
    elements.forEach((inner) => unify(element.type, getValueType(inner, program.plains)));
    const bounds = getIntervalBounds(elements);
    if (bounds) {
      return {
        type: createBool(),
        emit: () => {
          const bound = getBinding(program, "e", element.emit());
          return bound.wrap(`${bound.name} >= ${bounds.low} && ${bound.name} <= ${bounds.high}`);
        },
      };
    }
    // The test of an element by the name it is read by.
    const getTest = once((): ((name: string) => string) => {
      const type = closeType(element.type);
      const plains = elements.map((inner) => toPlain(inner, type, program.plains));
      const bitmap = getRecordBitmap(type, plains);
      if (bitmap) {
        const code = `B[${program.bitmaps.push(bitmap.bits) - 1}]`;
        return (name) => {
          const fields = bitmap.fields.map((field, position) => ({
            ...field,
            code: `${name}[${position}]${field.isBool ? " ? 1 : 0" : ""}`,
          }));
          const isInRange = fields.map(
            (field) => `${field.code} >= ${field.low} && ${field.code} <= ${field.high}`,
          );
          const offset = fields.map((field) => `(${field.code} - ${field.low}) * ${field.stride}`);
          return `${isInRange.join(" && ")} && ${code}[${offset.join(" + ")}] === 1`;
        };
      }
      const isScalar = type.kind === "Int" || type.kind === "Str" || type.kind === "Mix";
      if (isScalar && plains.length <= MAXIMUM_COMPARISONS) {
        return (name) => plains.map((plain) => `${name} === ${plain}`).join(" || ");
      }
      const buckets = new Map<number, Plain[]>();
      plains.forEach((plain) => {
        const hash = hashPlain(plain);
        buckets.set(hash, [...(buckets.get(hash) ?? []), plain]);
      });
      const code = `S[${program.constantSets.push(buckets) - 1}]`;
      // A scalar is its own hash.
      return isScalar ? (name) => `${code}.has(${name})` : (name) => `H.isIn(${code}, ${name})`;
    });
    return {
      type: createBool(),
      emit: () => {
        const bound = getBinding(program, "e", element.emit());
        return bound.wrap(getTest()(bound.name));
      },
    };
  }
  return compileSetMembership(program, element, compileValue(program, setExpression, frame));
};

// TLC builds each of the sets that isn't lazy before it tests membership in any of them.
const compileMemberships = (
  program: Program,
  element: Compiled,
  sets: Expression[],
  frame: Frame,
  format: (tests: string[]) => string,
): Compiled => {
  const name = getName(program, "e");
  const named = { type: element.type, emit: () => name };
  const parts = sets.map((set) => {
    if (isStructural(program, set, frame) || isConstantExpression(program, set, frame.scope)) {
      return { test: compileMembership(program, named, set, frame), built: undefined };
    }
    const built = { name: getName(program, "s"), set: compileValue(program, set, frame) };
    const test = compileSetMembership(program, named, {
      type: built.set.type,
      emit: () => built.name,
    });
    return { test, built };
  });
  return {
    type: createBool(),
    emit: () => {
      const tests = format(parts.map((part) => part.test.emit()));
      const builtSets = parts.flatMap((part) => (part.built ? [part.built] : []));
      const parameters = [name, ...builtSets.map((built) => built.name)];
      const values = [element.emit(), ...builtSets.map((built) => built.set.emit())];
      return `((${parameters.join(", ")}) => ${tests})(${values.join(", ")})`;
    },
  };
};

const compileSetMembership = (program: Program, element: Compiled, set: Compiled): Compiled => {
  unify(set.type, { kind: "Set", element: element.type });
  return {
    type: createBool(),
    emit: () =>
      isMask(set.type, program.plains)
        ? `H.has(${set.emit()}, ${element.emit()})`
        : `H.isMember(${getComparerCode(program, element.type)}, ${set.emit()}, ${element.emit()})`,
  };
};

const compileSubset = (program: Program, left: Compiled, right: Compiled): Compiled => ({
  type: createBool(),
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

// A key of a primitive type is a number or a boolean, which equals another key exactly when it is
// the same, so a short map finds it by scanning instead of comparing it in order.
const isPrimitive = (type: Type) =>
  ["Int", "Mix", "Str", "Bool", "Opt"].includes(resolveType(type).kind);

const getLookupCode = (program: Program, map: MapType, code: string, key: string) => {
  if (isMask(map.keys, program.plains)) return `H.lookupMask(${code}, ${key})`;
  const scan = isPrimitive(map.keys.element) ? "Scanned" : "";
  return `H.lookup${scan}(${getComparerCode(program, map.keys.element)}, ${code}, ${key})`;
};

// A sequence that became a sparse function is read as its values at 1..n, and built as the function
// on 1..n.
const readSequence = (program: Program, type: Type, code: string) => {
  const map = getMap(type);
  if (!map) return code;
  return `H.toSequence${isMask(map.keys, program.plains) ? "Mask" : ""}(${code})`;
};

const writeSequence = (program: Program, type: Type, code: string) => {
  const map = getMap(type);
  if (!map) return code;
  return `H.fromSequence${isMask(map.keys, program.plains) ? "Mask" : ""}(${code})`;
};

const getFindCode = (program: Program, map: MapType, keys: string, key: string) => {
  if (isMask(map.keys, program.plains)) return `H.findMaskKey(${keys}, ${key})`;
  const scan = isPrimitive(map.keys.element) ? "Scanned" : "";
  return `H.find${scan}Key(${getComparerCode(program, map.keys.element)}, ${keys}, ${key})`;
};

const compileField = (program: Program, record: Compiled, field: string): Compiled => {
  const type = expectRecord(record.type);
  return {
    type: getFieldType(type, field),
    emit: () => {
      const code = record.emit();
      const resolved = resolveType(record.type);
      if (resolved.kind === "Rec" && resolved.shapes.length === 1) {
        const position = resolved.shapes[0].indexOf(field);
        return position === -1 ? "H.deopt()" : `(${code})[${position}]`;
      }
      const bound = getBinding(program, "r", code);
      const index = getFieldIndexCode(program, record.type, field, bound.name);
      if (resolved.kind === "Rec" && resolved.shapes.every((shape) => shape.includes(field))) {
        return bound.wrap(`${bound.name}[${index}]`);
      }
      // A shape without the field has the index -1.
      return bound.wrap(`${index} >= 0 ? ${bound.name}[${index}] : H.deopt()`);
    },
  };
};

// TLC applies a record to a string as it reads the field of that name. An empty function fails
// either way.
const getFieldName = (type: Type, args: Expression[]) => {
  const [argument] = args;
  const kind = resolveType(type).kind;
  return args.length === 1 && argument.kind === "String" && (kind === "Rec" || kind === "Empty")
    ? argument.value
    : undefined;
};

// A function whose type is still unknown waits for a later disjunct to reveal it, unless each
// waiting disjunct waits on another, or no disjunct follows. Then it's taken to map keys, which any
// function can.
const guessFunction = (program: Program, type: Type) => {
  if (!program.isGuessing) throw UNKNOWN;
  unify(type, createMap());
};

const compileApplication = (
  program: Program,
  functionCode: Compiled,
  argument: Compiled,
): Compiled => {
  const type = resolveType(functionCode.type);
  if (type.kind === "Tup") {
    toSequence(type);
    return compileApplication(program, functionCode, argument);
  }
  if (type.kind === "Lambda") {
    unify(argument.type, type.argument);
    return { type: type.result, emit: () => `(${functionCode.emit()})(${argument.emit()})` };
  }
  if (type.kind === "Fn") {
    unify(argument.type, type.key);
    return {
      type: type.range,
      emit: () => {
        const map = getMap(type);
        return map
          ? getLookupCode(program, map, functionCode.emit(), argument.emit())
          : `H.at(${functionCode.emit()}, ${getIndexCode(program, type, argument.emit())})`;
      },
    };
  }
  if (type.kind === "Seq") {
    unify(argument.type, createInt());
    return {
      type: type.element,
      emit: () => {
        const map = getMap(type);
        return map
          ? getLookupCode(program, map, functionCode.emit(), argument.emit())
          : `H.at(${functionCode.emit()}, (${argument.emit()}) - 1)`;
      },
    };
  }
  const map = expectMap(type);
  if (map) {
    unify(argument.type, map.keys.element);
    return {
      type: map.values.element,
      emit: () => getLookupCode(program, map, functionCode.emit(), argument.emit()),
    };
  }
  if (type.kind === "Var") {
    guessFunction(program, type);
    return compileApplication(program, functionCode, argument);
  }
  return unsupported();
};

// TLC applies a function definition, or an operator defined as a function construction, that
// depends on the state without building it: once it finds the argument in the domain, it goes on
// with the body there, as an action where one is expected.
const getFunctionExpansion = (
  program: Program,
  expression: Expression & { kind: "FunctionApplication" },
  frame: Frame,
) => {
  const target = expression.function;
  if (target.kind !== "Identifier" || frame.scope.has(target.name)) return undefined;
  const global = findGlobalName(target.name, program.environment);
  if (global?.kind !== "Definition") return undefined;
  const definition = global.definition;
  if (isConstantLevel(definition, program.environment)) return undefined;
  if (definition.kind === "Operator") {
    const construction = definition.body;
    const isExpanded =
      definition.params.length === 0 &&
      construction.kind === "FunctionConstruction" &&
      !isRecursiveConstruction(construction) &&
      construction.bounds.length === 1 &&
      construction.bounds[0].pattern.kind === "Name";
    return isExpanded
      ? expandFunction(program, expression, frame, definition, construction)
      : undefined;
  }
  if (definition.isSelfReferential || definition.bounds.length !== 1) return unsupported();
  return expandFunction(program, expression, frame, definition, definition);
};

const expandFunction = (
  program: Program,
  expression: Expression & { kind: "FunctionApplication" },
  frame: Frame,
  definition: Definition,
  construction: FunctionConstructionExpression | FunctionDefinition,
) => {
  const bound = construction.bounds[0];
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
    body: construction.body,
    scope: bindCode(new Map(), bound.pattern.name, argument.type, name),
    apply: (body: () => string) =>
      `((${name}) => (${isInDomain.emit()} ? ${body()} : H.deopt()))(${argument.emit()})`,
    declare: () => `const ${name} = ${argument.emit()}; if (!(${isInDomain.emit()})) H.deopt();`,
  };
};

// TLC applies a function to several arguments as to the tuple of them.
const getArgument = (args: Expression[], location: SourceLocation): Expression =>
  args.length === 1 ? args[0] : { kind: "Tuple", elements: args, location };

interface Step {
  index: string;
  isSparse: boolean;
}

const compileExcept = (
  program: Program,
  expression: Expression & { kind: "Except" },
  frame: Frame,
): Compiled => {
  const base = compileValue(program, expression.function, frame);
  const updates = expression.updates.map((update) => {
    const steps: ((container: string) => Step)[] = [];
    const leaf = update.path.reduce<Type>((type, step) => {
      const resolved = resolveType(type);
      const field = step.kind === "Field" ? step.name : getFieldName(type, step.args);
      if (field !== undefined) {
        const record = expectRecord(type);
        steps.push((container) => ({
          index: getFieldIndexCode(program, type, field, container),
          isSparse: false,
        }));
        return getFieldType(record, field);
      }
      if (step.kind === "Field") return unsupported();
      if (resolved.kind === "Var") guessFunction(program, type);
      const argument = compileValue(program, getArgument(step.args, expression.location), frame);
      const known = resolveType(type);
      if (known.kind === "Fn" || known.kind === "Map") {
        unify(argument.type, known.kind === "Fn" ? known.key : known.keys.element);
        steps.push((container) => {
          const map = getMap(type);
          if (map) {
            return {
              index: getFindCode(program, map, `${container}[0]`, argument.emit()),
              isSparse: true,
            };
          }
          return known.kind === "Fn"
            ? { index: getIndexCode(program, known, argument.emit()), isSparse: false }
            : unsupported();
        });
        return known.kind === "Fn" ? known.range : known.values.element;
      }
      unify(argument.type, createInt());
      if (known.kind === "Seq") {
        steps.push((container) => {
          const map = getMap(type);
          return map
            ? {
                index: getFindCode(program, map, `${container}[0]`, argument.emit()),
                isSparse: true,
              }
            : { index: `(${argument.emit()}) - 1`, isSparse: false };
        });
        return known.element;
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
      // Each step copies the container it changes, and a sparse function also its values.
      const statements = updates.map((update) => {
        const path = update.steps.reduce<{ code: string; target: string | undefined }>(
          (current, step) => {
            const container = current.target === undefined ? result : getName(program, "c");
            const copy =
              current.target === undefined
                ? ""
                : `const ${container} = ${current.target}.slice(); ${current.target} = ${container}; `;
            const located = step(container);
            const values = located.isSparse ? getName(program, "v") : container;
            const copyValues = located.isSparse
              ? `const ${values} = ${container}[1].slice(); ${container}[1] = ${values}; `
              : "";
            const index = getName(program, "i");
            return {
              code: `${current.code}${copy}${copyValues}const ${index} = ${located.index}; if (${index} < 0 || ${index} >= ${values}.length) H.deopt(); `,
              target: `${values}[${index}]`,
            };
          },
          { code: "", target: undefined },
        );
        return `{ ${path.code}const ${update.old} = ${path.target}; ${path.target} = ${update.value.emit()}; }`;
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
  // TLC takes an operator the model overrides with a value as that value, without its arguments.
  const global = program.environment.substitutions.has(operator)
    ? findGlobalName(operator, program.environment)
    : undefined;
  if (global?.kind === "Value") return compileConstant(program, global.value);
  if (args.length === 2 && (operator === "\\in" || operator === "\\notin")) {
    const test = compileMembership(program, compileValue(program, args[0], frame), args[1], frame);
    return operator === "\\in" ? test : { type: createBool(), emit: () => `!(${test.emit()})` };
  }
  // The size of a domain doesn't depend on whether its function is a sequence, a sparse function or
  // a record, which an empty function may not yet show.
  const [domain] = args;
  if (
    operator === "Cardinality" &&
    args.length === 1 &&
    domain.kind === "Apply" &&
    domain.operator === "DOMAIN" &&
    domain.args.length === 1
  ) {
    const target = compileValue(program, domain.args[0], frame);
    return {
      type: createInt(),
      emit: () => {
        const resolved = closeType(target.type);
        const code = target.emit();
        if (resolved.kind === "Seq") return `(${code}).length`;
        if (resolved.kind === "Fn") return `(${code}, ${resolved.domain.length})`;
        if (resolved.kind === "Map") {
          return isMask(resolved.keys, program.plains)
            ? `H.count((${code})[0])`
            : `(${code})[0].length`;
        }
        if (resolved.kind !== "Rec" || getShapeIndex(resolved, [NULL_FIELD]) !== -1) {
          return unsupported();
        }
        const sizes = resolved.shapes.map((shape) => shape.length);
        return resolved.shapes.length === 1
          ? `(${code}, ${sizes[0]})`
          : `${addConstant(program, sizes)}[(${code})[0]]`;
      },
    };
  }
  if (operator === "DOMAIN" && args.length === 1) {
    const target = compileValue(program, args[0], frame);
    const keys = compileKeys(target);
    if (keys) return keys;
    const resolved = resolveType(target.type);
    if (resolved.kind !== "Seq" && resolved.kind !== "Fn") return unsupported();
    const type: SetType = {
      kind: "Set",
      element: resolved.kind === "Fn" ? resolved.key : createInt(true),
    };
    return {
      type,
      emit: () => {
        const current = resolveType(target.type);
        if (current.kind === "Map") return `(${target.emit()})[0]`;
        if (current.kind === "Fn") {
          const domain = toPlain(createSet(current.domain), type, program.plains);
          return `(${target.emit()}, ${getPlainCode(program, domain)})`;
        }
        return `H.${isMask(type, program.plains) ? "range" : "interval"}(1, (${target.emit()}).length)`;
      },
    };
  }
  if (operator === ":>" && args.length === 2) {
    const key = compileValue(program, args[0], frame);
    const value = compileValue(program, args[1], frame);
    const type = createMap();
    unify(type.keys.element, key.type);
    unify(type.values.element, value.type);
    return {
      type,
      emit: () =>
        `[${isMask(type.keys, program.plains) ? `H.bit(${key.emit()})` : `[${key.emit()}]`}, [${value.emit()}]]`,
    };
  }
  // TLC's f @@ g takes the value of f where both are defined.
  if (operator === "@@" && args.length === 2) {
    const [left, right] = args.map((arg) => compileValue(program, arg, frame));
    const getRecords = () =>
      [left, right]
        .map((side) => resolveType(side.type))
        .filter((record): record is RecType => record.kind === "Rec" && record.shapes.length === 1);
    const records = getRecords();
    // TLC merges two records into a function from their field names, which equals the record.
    if (records.length === 2) {
      const shapes = records.map((record) => record.shapes[0]);
      const names = [...new Set(shapes.flat())].sort((leftName, rightName) =>
        leftName < rightName ? -1 : 1,
      );
      const sources = names.map((name) => {
        const side = shapes[0].includes(name) ? 0 : 1;
        return { side, position: shapes[side].indexOf(name) };
      });
      const type = createRecord(
        names,
        sources.map((source, index) => getFieldType(records[source.side], names[index])),
      );
      const sides = [getName(program, "l"), getName(program, "r")];
      return {
        type,
        emit: () => {
          const current = getRecords();
          if (
            current.length !== 2 ||
            current.some((record, index) => getShapeIndex(record, shapes[index]) !== 0)
          ) {
            return unsupported();
          }
          const record = resolveType(type);
          const tag =
            record.kind === "Rec" && record.shapes.length > 1 ? [getShapeIndex(record, names)] : [];
          const items = sources.map((source) => `${sides[source.side]}[${source.position}]`);
          return `((${sides.join(", ")}) => [${[...tag, ...items].join(", ")}])(${left.emit()}, ${right.emit()})`;
        },
      };
    }
    const type = createMap();
    [left, right].forEach((side) => unify(side.type, type));
    return {
      type,
      emit: () =>
        isMask(type.keys, program.plains)
          ? `H.combineMasks(${left.emit()}, ${right.emit()})`
          : `H.combine(${getComparerCode(program, type.keys.element)}, ${left.emit()}, ${right.emit()})`,
    };
  }
  // TLC fails when the condition of an Assert is false, and only then evaluates its message.
  if (operator === "Assert" && args.length === 2) {
    const condition = expectBool(compileValue(program, args[0], frame));
    return { type: createBool(), emit: () => `((${condition.emit()}) || H.deopt())` };
  }
  if (operator === "SelectSeq" && args.length === 2) {
    const sequence = compileValue(program, args[0], frame);
    const element: Type = createVar();
    unify(sequence.type, { kind: "Seq", element });
    const binding = getOperatorArgument(program, args[1], frame, 1);
    if (binding.definition.params.length !== 1) return unsupported();
    const name = getName(program, "e");
    const scope = bindCode(binding.scope, binding.definition.params[0].name, element, name);
    const test = inline(program, binding.definition, () =>
      expectBool(compileValue(program, binding.definition.body, { ...frame, scope })),
    );
    return {
      type: sequence.type,
      emit: () =>
        writeSequence(
          program,
          sequence.type,
          `(${readSequence(program, sequence.type, sequence.emit())}).filter((${name}) => ${test.emit()})`,
        ),
    };
  }
  if (operator === "SortSeq" && args.length === 2) {
    const sequence = compileValue(program, args[0], frame);
    const element: Type = createVar();
    unify(sequence.type, { kind: "Seq", element });
    const binding = getOperatorArgument(program, args[1], frame, 2);
    const params = binding.definition.params;
    if (params.length !== 2) return unsupported();
    const left = getName(program, "e");
    const right = getName(program, "e");
    const scope = bindCode(
      bindCode(binding.scope, params[0].name, element, left),
      params[1].name,
      element,
      right,
    );
    const isBefore = inline(program, binding.definition, () =>
      expectBool(compileValue(program, binding.definition.body, { ...frame, scope })),
    );
    return {
      type: sequence.type,
      emit: () =>
        writeSequence(
          program,
          sequence.type,
          `H.sortSeq(${readSequence(program, sequence.type, sequence.emit())}, (${left}, ${right}) => ${isBefore.emit()})`,
        ),
    };
  }
  const isSubSeq = (arg: Expression): arg is ApplyExpression =>
    arg.kind === "Apply" && arg.args.length === 3 && isBuiltin(frame, arg.operator, "SubSeq");
  // Two subsequences are equal when their elements are, which the tier compares where they are.
  if ((operator === "=" || operator === "#" || operator === "/=") && args.every(isSubSeq)) {
    const element = createVar();
    const ranges = args.map((arg) => {
      const [sequence, start, end] = arg.args.map((inner) => compileValue(program, inner, frame));
      unify(sequence.type, { kind: "Seq", element });
      const first = expectInt(start);
      const last = expectInt(end);
      return () =>
        `${readSequence(program, sequence.type, sequence.emit())}, ${first.emit()}, ${last.emit()}`;
    });
    return {
      type: createBool(),
      emit: () =>
        `${operator === "=" ? "" : "!"}H.sameSubSeqs(${ranges.map((range) => range()).join(", ")})`,
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
      emit: () =>
        writeSequence(
          program,
          sequence.type,
          `H.subSeq(${readSequence(program, sequence.type, sequence.emit())}, ${first.emit()}, ${last.emit()})`,
        ),
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
        return binary(left, right, createBool(), (leftCode, rightCode) => {
          const count = getFieldCountCode(program, right.type, rightCode);
          return `${isEqual ? "" : "!"}((${readSequence(program, left.type, leftCode)}).length !== ${count} ? false : H.deopt())`;
        });
      }
      if (leftKind === "Rec" && rightKind === "Seq") {
        return binary(
          left,
          right,
          createBool(),
          (leftCode, rightCode) =>
            `(${leftCode}, ${isEqual ? "" : "!"}((${readSequence(program, right.type, rightCode)}).length === 0 ? false : H.deopt()))`,
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
          type.kind === "Opt" ||
          (type.kind === "Set" && isMask(type, program.plains))
        );
      };
      const empty = [args[0], args[1]].findIndex(
        (arg) => arg.kind === "Tuple" && arg.elements.length === 0,
      );
      if (empty !== -1) {
        const other = values[1 - empty];
        return {
          type: createBool(),
          emit: () => {
            const resolved = closeType(other.type);
            if (resolved.kind === "Rec") {
              return `${isEqual ? "" : "!"}H.same(${other.emit()}, ${getEmptyRecordCode(program, resolved)})`;
            }
            return `(${other.emit()})${resolved.kind === "Map" ? "[1]" : ""}.length ${isEqual ? "===" : "!=="} 0`;
          },
        };
      }
      return binary(left, right, createBool(), (leftCode, rightCode) =>
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
        createBool(),
        (leftCode, rightCode) => `(${leftCode}) ${comparison} (${rightCode})`,
      );
    }
    if (operator === "=>") {
      return binary(
        expectBool(left),
        expectBool(right),
        createBool(),
        (leftCode, rightCode) => `(!(${leftCode}) || (${rightCode}))`,
      );
    }
    if (operator === "<=>" || operator === "\\equiv") {
      return binary(
        expectBool(left),
        expectBool(right),
        createBool(),
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
      return binary(left, right, left.type, (leftCode, rightCode) =>
        writeSequence(
          program,
          left.type,
          `H.append(${readSequence(program, left.type, leftCode)}, ${rightCode})`,
        ),
      );
    }
    if (operator === "\\o" || operator === "\\circ") {
      unify(left.type, { kind: "Seq", element: createVar() });
      unify(right.type, left.type);
      return binary(left, right, left.type, (leftCode, rightCode) =>
        writeSequence(
          program,
          left.type,
          `(${readSequence(program, left.type, leftCode)}).concat(${readSequence(program, right.type, rightCode)})`,
        ),
      );
    }
  }
  if (values.length === 1) {
    const [operand] = values;
    if (operator === "~" || operator === "\\lnot" || operator === "\\neg") {
      const condition = expectBool(operand);
      return { type: createBool(), emit: () => `!(${condition.emit()})` };
    }
    if (operator === "-.") {
      const integer = expectInt(operand);
      return { type: createInt(), emit: () => `H.subtract(0, ${integer.emit()})` };
    }
    const sequence: Type = createVar();
    if (operator === "Len") {
      unify(operand.type, { kind: "Seq", element: sequence });
      return {
        type: createInt(),
        emit: () => `(${readSequence(program, operand.type, operand.emit())}).length`,
      };
    }
    if (operator === "Head") {
      unify(operand.type, { kind: "Seq", element: sequence });
      return {
        type: sequence,
        emit: () => `H.at(${readSequence(program, operand.type, operand.emit())}, 0)`,
      };
    }
    if (operator === "Tail") {
      unify(operand.type, { kind: "Seq", element: sequence });
      return {
        type: operand.type,
        emit: () =>
          writeSequence(
            program,
            operand.type,
            `H.tail(${readSequence(program, operand.type, operand.emit())})`,
          ),
      };
    }
    if (operator === "UNION") {
      const set = getSetElement(operand);
      const element: Type = createVar();
      unify(set, { kind: "Set", element });
      return {
        type: set,
        emit: () =>
          isMask(set, program.plains)
            ? `(${operand.emit()}).reduce((union, mask) => union | mask, 0)`
            : `H.normalize(${getComparerCode(program, element)}, (${operand.emit()}).flat())`,
      };
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
    // Every set the tier builds is enumerated.
    if (operator === "IsFiniteSet") {
      getSetElement(operand);
      return { type: createBool(), emit: () => `(${operand.emit()}, true)` };
    }
  }
  return unsupported();
};

const compileValue = (program: Program, expression: Expression, frame: Frame): Compiled => {
  const bodyValue = program.environment.bodyValues.get(expression);
  if (bodyValue !== undefined) return compileConstant(program, bodyValue);
  switch (expression.kind) {
    case "Selection":
      return compileValue(program, expression.expression, frame);
    case "Number":
      return expression.value <= MAXIMUM_INTEGER
        ? { type: createInt(), emit: () => String(expression.value) }
        : unsupported();
    case "String":
      return compileConstant(program, expression.value);
    case "Identifier": {
      const binding = frame.scope.get(expression.name);
      if (expression.resolution?.isSelf && (binding?.kind !== "Code" || !binding.isSelf)) {
        return unsupported();
      }
      return compileIdentifier(program, expression.name, frame);
    }
    case "Apply": {
      const names: LazyDefinition[] = [];
      const expansion = getExpansion(program, expression, frame, names);
      if (!expansion) return compileBuiltin(program, expression, frame);
      const definition = expansion.definition;
      // SequencesExt's FlattenSeq returns its argument when that is empty, so one branch has the
      // type of a sequence of sequences. Either way its value is their concatenation.
      if (
        definition.name === "FlattenSeq" &&
        definition.location.range?.module === "SequencesExt" &&
        expression.args.length === 1
      ) {
        const element: Type = createVar();
        const inner: SeqType = { kind: "Seq", element };
        const sequences = expectType(compileValue(program, expression.args[0], frame), {
          kind: "Seq",
          element: inner,
        });
        const type: SeqType = { kind: "Seq", element };
        const items = getName(program, "s");
        return {
          type,
          emit: () =>
            writeSequence(
              program,
              type,
              `(${readSequence(program, sequences.type, sequences.emit())}).flatMap((${items}) => ${readSequence(program, inner, items)})`,
            ),
        };
      }
      const body =
        definition.kind === "Operator" && definition.isRecursive
          ? compileRecursion(program, definition, expansion.scope, frame)
          : inline(program, definition, () =>
              compileValue(program, definition.body, { ...frame, scope: expansion.scope }),
            );
      return names.length === 0
        ? body
        : {
            type: body.type,
            emit: () => `(() => { ${getDeclarations(names)} return ${body.emit()}; })()`,
          };
    }
    case "And":
    case "Or": {
      const operands = expression.operands.map((operand) =>
        expectBool(compileValue(program, operand, frame)),
      );
      const joiner = expression.kind === "And" ? " && " : " || ";
      return {
        type: createBool(),
        emit: () => `(${operands.map((operand) => `(${operand.emit()})`).join(joiner)})`,
      };
    }
    case "If": {
      const condition = expectBool(compileValue(program, expression.condition, frame));
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
    // TLC takes the first arm whose condition holds, then OTHER, and fails when there is neither.
    case "Case": {
      const type: Type = createVar();
      const arms = expression.arms.map((arm) => ({
        condition: expectBool(compileValue(program, arm.condition, frame)),
        body: expectType(compileValue(program, arm.body, frame), type),
      }));
      const other =
        expression.other && expectType(compileValue(program, expression.other, frame), type);
      return {
        type,
        emit: () =>
          `(${arms.map((arm) => `(${arm.condition.emit()}) ? (${arm.body.emit()}) : `).join("")}${other ? `(${other.emit()})` : "H.deopt()"})`,
      };
    }
    case "Let": {
      const bindings = bindLet(program, expression, frame);
      const body = compileValue(program, expression.body, { ...frame, scope: bindings.scope });
      return {
        type: body.type,
        emit: () => `(() => { ${getDeclarations(bindings.names)} return ${body.emit()}; })()`,
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
      const predicate = expectBool(
        compileValue(program, expression.body, { ...frame, scope: bounds.scope }),
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
      const predicate = expectBool(
        compileValue(program, expression.predicate, { ...frame, scope: bounds.scope }),
      );
      const result = getName(program, "r");
      const stop = isUniformPredicate(expression, program.environment)
        ? ` else return ${result};`
        : "";
      const type: SetType = { kind: "Set", element: loop.element };
      return {
        type,
        emit: () =>
          isMask(type, program.plains)
            ? `(() => { let ${result} = 0; ${bounds.getHeaders()} { if (${predicate.emit()}) ${result} |= H.bit(${loop.name});${stop} } return ${result}; })()`
            : `(() => { const ${result} = []; ${bounds.getHeaders()} { if (${predicate.emit()}) ${result}.push(${loop.name});${stop} } return ${result}; })()`,
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
    case "Product": {
      const loops = expression.factors.map((factor) => ({
        name: getName(program, "q"),
        ...compileBound(program, factor, frame),
      }));
      const types = loops.map((loop) => loop.element);
      const element: Type = createVar();
      if (!program.plains.isTupled) unifyElements(types, element);
      const tuple: Type = program.plains.isTupled
        ? { kind: "Tup", elements: types, target: undefined }
        : { kind: "Seq", element };
      const result = getName(program, "r");
      return {
        type: { kind: "Set", element: tuple },
        emit: () => {
          const headers = loops.map((loop) => loop.header(loop.name)).join(" ");
          const code = writeSequence(
            program,
            tuple,
            `[${loops.map((loop) => loop.name).join(", ")}]`,
          );
          return `(() => { const ${result} = []; ${headers} { ${result}.push(${code}); } return H.normalize(${getComparerCode(program, tuple)}, ${result}); })()`;
        },
      };
    }
    case "Tuple": {
      if (expression.elements.length === 0 && program.plains.isSparse) {
        const type: Type = { kind: "Empty", target: undefined };
        return {
          type,
          emit: () => {
            const resolved = closeType(type);
            if (resolved.kind === "Rec") return getEmptyRecordCode(program, resolved);
            return resolved.kind === "Map"
              ? addConstant(program, getEmptyMap(resolved, program.plains))
              : "H.EMPTY";
          },
        };
      }
      const elements = expression.elements.map((inner) => compileValue(program, inner, frame));
      const types = elements.map((inner) => inner.type);
      const element: Type = createVar();
      if (!program.plains.isTupled || elements.length === 0) unifyElements(types, element);
      const type: Type =
        program.plains.isTupled && elements.length > 0
          ? { kind: "Tup", elements: types, target: undefined }
          : { kind: "Seq", element };
      return {
        type,
        emit: () =>
          writeSequence(
            program,
            type,
            elements.length === 0
              ? "H.EMPTY"
              : `[${elements.map((inner) => inner.emit()).join(", ")}]`,
          ),
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
    case "FieldAccess":
      return compileField(
        program,
        compileValue(program, expression.record, frame),
        expression.field,
      );
    case "FunctionApplication": {
      const expansion = getFunctionExpansion(program, expression, frame);
      if (expansion) {
        const body = inline(program, expansion.definition, () =>
          compileValue(program, expansion.body, { ...frame, scope: expansion.scope }),
        );
        return { type: body.type, emit: () => expansion.apply(body.emit) };
      }
      const target = compileValue(program, expression.function, frame);
      const field = getFieldName(target.type, expression.args);
      if (field !== undefined) return compileField(program, target, field);
      const tuple = resolveType(target.type);
      // A sequence applied to a string may be <<>>, TLC's empty function, which is also a record.
      if (
        tuple.kind === "Seq" &&
        expression.args[0]?.kind === "String" &&
        !program.plains.isSparse
      ) {
        throw SPARSE;
      }
      const [position] = expression.args;
      if (
        tuple.kind === "Tup" &&
        expression.args.length === 1 &&
        position.kind === "Number" &&
        Number.isInteger(position.value) &&
        position.value >= 1 &&
        position.value <= tuple.elements.length
      ) {
        return {
          type: tuple.elements[position.value - 1],
          // A tuple that became a sequence may be shorter than the position.
          emit: () =>
            resolveType(target.type).kind === "Tup"
              ? `(${target.emit()})[${position.value - 1}]`
              : `H.at(${readSequence(program, target.type, target.emit())}, ${position.value - 1})`,
        };
      }
      return compileApplication(
        program,
        target,
        compileValue(program, getArgument(expression.args, expression.location), frame),
      );
    }
    case "FunctionConstruction": {
      if (expression.bounds.length !== 1) return unsupported();
      const bound = expression.bounds[0];
      const pattern = bound.pattern;
      if (isRecursiveConstruction(expression)) {
        return pattern.kind === "Name"
          ? compileLambda(program, createLambda(), pattern.name, bound.set, expression.body, frame)
          : unsupported();
      }
      if (!isConstantExpression(program, bound.set, frame.scope)) {
        return pattern.kind === "Name"
          ? compileSequenceConstruction(program, pattern.name, bound.set, expression.body, frame)
          : unsupported();
      }
      const domain = getElements(evaluateConstant(program, bound.set));
      if (domain.length === 0) return unsupported();
      const name = getName(program, "f");
      const range: Type = createVar();
      const type = createFnType(domain, range, program.plains);
      const element = createVar();
      if (pattern.kind === "Tuple") {
        const isTuple = (key: Value) =>
          typeof key === "object" &&
          key.kind === "Function" &&
          key.functionClass === "tuple" &&
          key.domain.length === pattern.names.length;
        if (!domain.every(isTuple)) return unsupported();
        unify(type.key, { kind: "Seq", element });
      }
      const body = expectType(
        compileValue(program, expression.body, {
          ...frame,
          scope:
            pattern.kind === "Name"
              ? bindCode(frame.scope, pattern.name, type.key, name)
              : bindPattern(program, frame.scope, pattern.names, element, type.key, name),
        }),
        range,
      );
      return {
        type,
        emit: () => {
          const values = `${addConstant(program, getKeys(program, type))}.map((${name}) => ${body.emit()})`;
          const map = getMap(type);
          return map ? `[${getDomainCode(program, map, domain)}, ${values}]` : values;
        },
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
      const binding = frame.scope.get(target.name);
      if (
        binding?.kind === "Code"
          ? binding.source !== undefined
          : binding !== undefined || global?.kind === "Definition"
      ) {
        return compileIdentifier(program, target.name, getNextFrame(frame));
      }
      if (binding || global?.kind !== "Variable") return unsupported();
      const code = frame.primed[global.index] ?? unsupported();
      return { type: program.variableTypes[global.index], emit: () => code };
    }
    case "Unchanged":
      return compileUnchanged(program, expression.expression, frame);
    // TLC computes ENABLED of a state as whether the action has a successor from it.
    case "Enabled": {
      if (frame.primed.some((code) => code !== undefined)) return unsupported();
      const step = compileStep(
        program,
        [{ expression: expression.expression, scope: frame.scope, inlining: [] }],
        frame.primed,
        true,
      );
      return { type: createBool(), emit: () => getEnabledCode(step) };
    }
    default:
      return unsupported();
  }
};

// The step breaks out of the block at the first successor emit accepts.
const getEnabledCode = (step: () => string, emit = "() => true") =>
  `(() => { const emit = ${emit}; enabled: { ${step()} return false; } return true; })()`;

const createLambda = (): LambdaType => ({
  kind: "Lambda",
  argument: createVar(),
  result: createVar(),
});

// A function TLC builds lazily applies its body to each argument it's applied to.
const compileLambda = (
  program: Program,
  type: LambdaType,
  parameter: string,
  set: Expression,
  body: Expression,
  frame: Frame,
): Compiled => {
  const argument = getName(program, "a");
  const isInDomain = compileMembership(
    program,
    { type: type.argument, emit: () => argument },
    set,
    frame,
  );
  const result = expectType(
    compileValue(program, body, {
      ...frame,
      scope: bindCode(frame.scope, parameter, type.argument, argument),
    }),
    type.result,
  );
  return {
    type,
    emit: () => `((${argument}) => (${isInDomain.emit()}) ? ${result.emit()} : H.deopt())`,
  };
};

// Binds a LET function definition to the function it builds lazily.
const bindFunction = (
  program: Program,
  definition: FunctionDefinition,
  frame: Frame,
  names: LazyDefinition[],
) => {
  const bound = definition.bounds[0];
  if (definition.bounds.length !== 1 || bound.pattern.kind !== "Name") return unsupported();
  const name = getName(program, "l");
  const type = createLambda();
  const getBinding = (isSelf: boolean): CodeBinding => ({
    kind: "Code",
    compiled: { type, emit: () => getLazyCode(name) },
    source: undefined,
    function: { definition, type, getScope: () => body, isNext: frame.isNext },
    isSelf,
  });
  const body = withBinding(frame.scope, definition.name, getBinding(true));
  names.push({
    name,
    value: compileLambda(program, type, bound.pattern.name, bound.set, definition.body, {
      ...frame,
      scope: body,
    }),
  });
  return withBinding(frame.scope, definition.name, getBinding(false));
};

// Binds the definitions of a LET, each compiled where the LET is.
const bindLet = (program: Program, expression: LetExpression, frame: Frame) => {
  const names: LazyDefinition[] = [];
  const scope = expression.definitions.reduce<TierScope>((current, definition) => {
    if (definition.kind === "Function") {
      return bindFunction(program, definition, { ...frame, scope: current }, names);
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
    return bindDefinition(current, definition, value, name, frame);
  }, frame.scope);
  return { names, scope };
};

// TLC evaluates UNCHANGED e outside an action's conjuncts as e' = e, which for a tuple evaluates
// every element and holds when each is unchanged.
const compileUnchanged = (program: Program, expression: Expression, frame: Frame): Compiled => {
  const body = getDefinitionBody(program, expression, frame);
  if (body?.kind === "Tuple" || body?.kind === "Let")
    return compileUnchanged(program, body, { ...frame, scope: new Map() });
  // INSTANCE binds a substitution as a LET around what it substitutes into.
  if (expression.kind === "Let") {
    const bindings = bindLet(program, expression, frame);
    const body = compileUnchanged(program, expression.body, { ...frame, scope: bindings.scope });
    return {
      type: createBool(),
      emit: () => `(() => { ${getDeclarations(bindings.names)} return ${body.emit()}; })()`,
    };
  }
  if (expression.kind === "Tuple") {
    const elements = expression.elements.map((element) =>
      compileUnchanged(program, element, frame),
    );
    return {
      type: createBool(),
      emit: () =>
        elements.length === 0
          ? "true"
          : `((${["1", ...elements.map((element) => `(${element.emit()})`)].join(" & ")}) === 1)`,
    };
  }
  const current = compileValue(program, expression, frame);
  const next = compileValue(program, expression, getNextFrame(frame));
  unify(current.type, next.type);
  return { type: createBool(), emit: () => `H.same(${next.emit()}, ${current.emit()})` };
};

const compileSequenceConstruction = (
  program: Program,
  name: string,
  set: Expression,
  bodyExpression: Expression,
  frame: Frame,
): Compiled => {
  const getLength = (): Compiled | undefined => {
    if (set.kind !== "Apply") return undefined;
    if (set.operator === "DOMAIN") {
      const sequence = compileValue(program, set.args[0], frame);
      if (resolveType(sequence.type).kind !== "Seq") return undefined;
      return {
        type: createInt(),
        emit: () => `(${readSequence(program, sequence.type, sequence.emit())}).length`,
      };
    }
    const [low, high] = set.args;
    if (!isBuiltin(frame, set.operator, "..") || low.kind !== "Number" || low.value !== 1) {
      return undefined;
    }
    const end = expectInt(compileValue(program, high, frame));
    return { type: createInt(), emit: () => `Math.max(0, ${end.emit()})` };
  };
  const length = getLength();
  if (!length) return compileMapConstruction(program, name, set, bodyExpression, frame);
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
  const type: SeqType = { kind: "Seq", element };
  return {
    type,
    emit: () =>
      writeSequence(
        program,
        type,
        `((${items}) => { for (let ${index} = 1; ${index} <= ${items}.length; ${index}++) ${items}[${index} - 1] = ${body.emit()}; return ${items}; })(new Array(${length.emit()}))`,
      ),
  };
};

// TLC builds a function on a set that changes as one whose domain is that set.
const compileMapConstruction = (
  program: Program,
  name: string,
  setExpression: Expression,
  bodyExpression: Expression,
  frame: Frame,
): Compiled => {
  const set = compileValue(program, setExpression, frame);
  const type = createMap();
  unify(set.type, type.keys);
  const key = getName(program, "k");
  const body = expectType(
    compileValue(program, bodyExpression, {
      ...frame,
      scope: bindCode(frame.scope, name, type.keys.element, key),
    }),
    type.values.element,
  );
  const keys = getName(program, "s");
  const values = getName(program, "v");
  const mask = getName(program, "m");
  return {
    type,
    emit: () =>
      isMask(type.keys, program.plains)
        ? `((${keys}) => { const ${values} = []; for (let ${mask} = ${keys}, ${key} = 0; ${mask} !== 0; ${mask} >>>= 1, ${key}++) if ((${mask} & 1) !== 0) ${values}.push(${body.emit()}); return [${keys}, ${values}]; })(${set.emit()})`
        : `((${keys}) => [${keys}, ${keys}.map((${key}) => ${body.emit()})])(${set.emit()})`,
  };
};

// Binds the definitions of a LET in an action, leaving those that branch or prime to expand where used.
const bindActionLet = (program: Program, expression: LetExpression, frame: Frame) => {
  const names: LazyDefinition[] = [];
  const scope = expression.definitions.reduce<TierScope>((current, definition) => {
    if (definition.kind === "Function") {
      return bindFunction(program, definition, { ...frame, scope: current }, names);
    }
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
    return bindDefinition(current, definition, value, name, frame);
  }, frame.scope);
  return { scope, names };
};

// Goes on with the rest of a step once for each way an action holds.
const repeatStep = (program: Program, ways: Compiled, tail: () => string) => () => {
  const count = getName(program, "w");
  return `for (let ${count} = ${ways.emit()}; ${count} > 0; ${count}--) { ${tail()} }`;
};

// A LET function definition applied as an action whose body branches.
const getBranchingFunction = (
  program: Program,
  expression: Expression & { kind: "FunctionApplication" },
  frame: Frame,
) => {
  const target = expression.function;
  if (target.kind !== "Identifier") return undefined;
  const binding = frame.scope.get(target.name);
  const letFunction = binding?.kind === "Code" ? binding.function : undefined;
  return letFunction && isBranching(program, letFunction.definition.body, letFunction.getScope())
    ? letFunction
    : undefined;
};

// TLC applies a function it builds lazily in an action by going on with its body there, so the
// function holds once for each way its body does, through its recursive applications too.
const compileFunctionWays = (
  program: Program,
  letFunction: NonNullable<CodeBinding["function"]>,
  expression: Expression & { kind: "FunctionApplication" },
  frame: Frame,
): Compiled => {
  const definition = letFunction.definition;
  const bound = definition.bounds[0];
  if (bound.pattern.kind !== "Name") return unsupported();
  const type = letFunction.type;
  const argument = expectType(
    compileValue(program, getArgument(expression.args, expression.location), frame),
    type.argument,
  );
  const known = program.ways.get(definition);
  if (known) return { type: createInt(), emit: () => `${known}(${argument.emit()})` };
  const name = getName(program, "c");
  const parameter = getName(program, "a");
  const scope = letFunction.getScope();
  const isInDomain = compileMembership(
    program,
    { type: type.argument, emit: () => parameter },
    bound.set,
    { ...frame, scope },
  );
  program.ways.set(definition, name);
  const body = compileWays(program, definition.body, {
    ...frame,
    scope: bindCode(scope, bound.pattern.name, type.argument, parameter),
  });
  program.ways.delete(definition);
  return {
    type: createInt(),
    emit: () =>
      `((${name}) => ((${name} = (${parameter}) => (${isInDomain.emit()} ? ${body.emit()} : H.deopt())), ${name}(${argument.emit()})))()`,
  };
};

// The number of ways an action without primes holds, as TLC branches on it.
const compileWays = (program: Program, expression: Expression, frame: Frame): Compiled => {
  if (hasPrime(expression)) return unsupported();
  const getWays = (inner: Expression, scope: TierScope) =>
    compileWays(program, inner, { ...frame, scope });
  const counted = (emit: () => string): Compiled => ({ type: createInt(), emit });
  switch (expression.kind) {
    case "Selection":
      return getWays(expression.expression, frame.scope);
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
    case "Let": {
      const bindings = bindActionLet(program, expression, frame);
      const body = getWays(expression.body, bindings.scope);
      return counted(
        () => `(() => { ${getDeclarations(bindings.names)} return ${body.emit()}; })()`,
      );
    }
    case "If": {
      const condition = expectBool(compileValue(program, expression.condition, frame));
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
        const condition = expectBool(compileValue(program, expression.args[0], frame));
        const consequent = getWays(expression.args[1], frame.scope);
        return counted(() => `(${condition.emit()} ? ${consequent.emit()} : 1)`);
      }
      break;
    }
    case "FunctionApplication": {
      const letFunction = getBranchingFunction(program, expression, frame);
      if (letFunction) return compileFunctionWays(program, letFunction, expression, frame);
      const expansion = getFunctionExpansion(program, expression, frame);
      if (!expansion) break;
      const ways = inline(program, expansion.definition, () =>
        getWays(expansion.body, expansion.scope),
      );
      return counted(() => expansion.apply(ways.emit));
    }
    case "Case":
      return unsupported();
    default:
      break;
  }
  const guard = expectBool(compileValue(program, expression, frame));
  return counted(() => `(${guard.emit()} ? 1 : 0)`);
};

interface Pending {
  expression: Expression;
  scope: TierScope;
  // The definitions this conjunct expands, which the rest of the conjunction doesn't.
  inlining: Definition[];
}

// TLC finds an action enabled where its conjuncts hold, whatever variables it leaves unassigned.
const compileStep = (
  program: Program,
  pending: Pending[],
  primed: (string | undefined)[],
  isEnabled: boolean,
): (() => string) => {
  // TLC stops looking for a step that ENABLED needs at the first one it finds. The search learns
  // whether a step leaves every value as it was from the values the step assigns.
  const getEmitCode = (codes: (string | undefined)[]) => {
    const successor = `[${codes.map((code) => code ?? "undefined").join(", ")}]`;
    if (isEnabled) return `if (emit(${successor})) break enabled;`;
    const isUnchanged = codes.flatMap((code, index) =>
      code === `v${index}`
        ? []
        : [code !== undefined && /^\w+$/.test(code) ? `${code} === v${index}` : "false"],
    );
    return `emit(${successor}, ${isUnchanged.length === 0 ? "true" : isUnchanged.join(" && ")});`;
  };
  if (pending.length === 0) {
    // TLC fails on a step that leaves a variable unassigned only where it reaches the step.
    if (!isEnabled && primed.some((code) => code === undefined)) return () => "H.deopt();";
    return () => getEmitCode(primed);
  }
  // With warnings on, TLC evaluates what is left of a step once every variable is assigned, without branching, but not under ENABLED.
  if (
    !isEnabled &&
    program.environment.runtime.isWarningEnabled &&
    primed.every((code) => code !== undefined)
  ) {
    const guards = pending.map((item) => {
      if (item.expression.kind !== "Unchanged") {
        return expectBool(
          compileValue(program, item.expression, {
            scope: item.scope,
            primed,
            variables: getVariableCodes(program),
            isNext: false,
          }),
        );
      }
      const checks = getProjectedVariables(program, item.expression.expression, item.scope).map(
        (index) => `H.same(${primed[index]}, v${index})`,
      );
      return {
        type: createBool(),
        emit: () => (checks.length === 0 ? "true" : `(${checks.join(" && ")} || H.deopt())`),
      };
    });
    return () =>
      `if (${guards.map((guard) => `(${guard.emit()})`).join(" && ")}) { ${getEmitCode(primed)} }`;
  }
  const [first, ...rest] = pending;
  const expression = first.expression;
  const frame = { scope: first.scope, primed, variables: getVariableCodes(program), isNext: false };
  const continueWith = (scope: TierScope, expressions: Expression[], inlining = first.inlining) =>
    compileStep(
      program,
      [...expressions.map((inner) => ({ expression: inner, scope, inlining })), ...rest],
      primed,
      isEnabled,
    );
  const continueInto = (definition: Definition, body: Expression, scope: TierScope) =>
    first.inlining.includes(definition)
      ? unsupported()
      : continueWith(scope, [body], [...first.inlining, definition]);
  switch (expression.kind) {
    case "Selection":
      return continueWith(first.scope, [expression.expression]);
    case "And":
      return continueWith(first.scope, expression.operands);
    case "Or": {
      const depth = program.inlining.length;
      const compileBranch = (operand: Expression) => {
        try {
          return continueWith(first.scope, [operand]);
        } catch (error) {
          if (error !== UNKNOWN) throw error;
          program.inlining.length = depth;
          return undefined;
        }
      };
      const compileBranches = (branches: ((() => string) | undefined)[]): (() => string)[] => {
        const compiled = branches.map(
          (branch, index) => branch ?? compileBranch(expression.operands[index]),
        );
        const waiting = compiled.filter((branch) => branch === undefined).length;
        if (waiting === 0) return compiled.filter((branch) => branch !== undefined);
        if (waiting === branches.filter((branch) => branch === undefined).length) {
          if (program.isGuessing) throw UNKNOWN;
          const index = compiled.indexOf(undefined);
          program.isGuessing = true;
          try {
            compiled[index] = continueWith(first.scope, [expression.operands[index]]);
          } finally {
            program.isGuessing = false;
          }
        }
        return compileBranches(compiled);
      };
      const branches = compileBranches(expression.operands.map(() => undefined));
      return () => branches.map((branch) => `{ ${branch()} }`).join(" ");
    }
    case "Exists": {
      if (program.environment.runtime.version === "1.7.4") {
        expression.bounds.forEach((bound) => rejectStreamedBound(program, bound.set, frame.scope));
      }
      const bounds = compileBounds(program, expression.bounds, frame, true);
      const body = continueWith(bounds.scope, [expression.body]);
      return () => `${bounds.getHeaders()} { ${body()} }`;
    }
    case "If": {
      const condition = expectBool(compileValue(program, expression.condition, frame));
      const consequent = continueWith(first.scope, [expression.consequent]);
      const alternative = continueWith(first.scope, [expression.alternative]);
      return () => `if (${condition.emit()}) { ${consequent()} } else { ${alternative()} }`;
    }
    case "Case": {
      const arms = expression.arms.map((arm) => ({
        condition: expectBool(compileValue(program, arm.condition, frame)),
        body: continueWith(first.scope, [arm.body]),
      }));
      const other = expression.other && continueWith(first.scope, [expression.other]);
      return () =>
        `${arms.map((arm) => `if (${arm.condition.emit()}) { ${arm.body()} } else `).join("")}{ ${other ? other() : "H.deopt();"} }`;
    }
    case "Let": {
      const bindings = bindActionLet(program, expression, frame);
      const body = continueWith(bindings.scope, [expression.body]);
      return () => `{ ${getDeclarations(bindings.names)} ${body()} }`;
    }
    case "Identifier": {
      const binding = first.scope.get(expression.name);
      if (binding?.kind === "Operator" && binding.definition.params.length === 0) {
        return continueInto(binding.definition, binding.definition.body, binding.scope);
      }
      const definition = binding ? undefined : resolveDefinition(program, expression.name);
      if (
        definition &&
        definition.params.length === 0 &&
        !isConstantLevel(definition, program.environment)
      ) {
        return continueInto(definition, definition.body, new Map());
      }
      break;
    }
    case "FunctionApplication": {
      const letFunction = getBranchingFunction(program, expression, frame);
      if (letFunction) {
        return repeatStep(
          program,
          compileFunctionWays(program, letFunction, expression, frame),
          compileStep(program, rest, primed, isEnabled),
        );
      }
      const expansion = getFunctionExpansion(program, expression, frame);
      if (!expansion) break;
      const body = continueInto(expansion.definition, expansion.body, expansion.scope);
      return () => `{ ${expansion.declare()} ${body()} }`;
    }
    case "Forall": {
      if (!isBranching(program, expression.body, frame.scope)) break;
      // TLC conjoins the body for each element, so it goes on once for each way the conjunction holds.
      return repeatStep(
        program,
        compileWays(program, expression, frame),
        compileStep(program, rest, primed, isEnabled),
      );
    }
    case "Apply": {
      const expansion = getExpansion(program, expression, frame);
      if (expansion) {
        return continueInto(expansion.definition, expansion.definition.body, expansion.scope);
      }
      const args = expression.args;
      // TLC runs the right side of A => B as an action where A holds.
      if (
        expression.operator === "=>" &&
        (hasPrime(args[1]) || isBranching(program, args[1], frame.scope))
      ) {
        const condition = expectBool(compileValue(program, args[0], frame));
        const consequent = continueWith(first.scope, [args[1]]);
        const alternative = compileStep(program, rest, primed, isEnabled);
        return () => `if (${condition.emit()}) { ${consequent()} } else { ${alternative()} }`;
      }
      if (args.length === 2 && (expression.operator === "=" || expression.operator === "\\in")) {
        const index = getPrimedVariable(program, args[0], first.scope);
        if (index !== undefined && primed[index] === undefined) {
          return compileAssignment(program, expression, index, frame, rest, isEnabled);
        }
      }
      break;
    }
    case "Unchanged": {
      const indexes = getProjectedVariables(program, expression.expression, first.scope);
      const assigned = primed.map((code, index) =>
        indexes.includes(index) && code === undefined ? `v${index}` : code,
      );
      const tail = compileStep(program, rest, assigned, isEnabled);
      const checks = indexes
        .filter((index) => primed[index] !== undefined)
        .map((index) => `H.same(${primed[index]}, v${index})`);
      return () =>
        checks.length === 0 ? tail() : `if (${checks.join(" && ")}) { ${tail()} } else H.deopt();`;
    }
    default:
      break;
  }
  const guard = expectBool(compileValue(program, expression, frame));
  const tail = compileStep(program, rest, primed, isEnabled);
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
  if (global?.kind !== "Variable") return undefined;
  // ENABLED through an INSTANCE primes the instance's variables as variables of their own.
  return global.index < program.variableTypes.length ? global.index : unsupported();
};

const compileAssignment = (
  program: Program,
  expression: Expression & { kind: "Apply" },
  index: number,
  frame: Frame,
  rest: Pending[],
  isEnabled: boolean,
): (() => string) => {
  const name = getName(program, "n");
  const assigned = frame.primed.map((code, position) => (position === index ? name : code));
  const tail = compileStep(program, rest, assigned, isEnabled);
  const type = program.variableTypes[index];
  if (expression.operator === "=") {
    const value = expectType(compileValue(program, expression.args[1], frame), type);
    return () => `{ const ${name} = ${value.emit()}; ${tail()} }`;
  }
  rejectStreamedBound(program, expression.args[1], frame.scope);
  const loop = compileBound(program, expression.args[1], frame);
  unify(loop.element, type);
  return () => `${loop.header(name)} { ${tail()} }`;
};

// The variables a tuple of variables stands for, nested as its tuples are.
type Projection = number | Projection[];

const getProjection = (program: Program, expression: Expression, scope: TierScope): Projection => {
  if (expression.kind === "Tuple") {
    return expression.elements.map((element) => getProjection(program, element, scope));
  }
  if (expression.kind !== "Identifier" || scope.has(expression.name)) return unsupported();
  const global = findGlobalName(expression.name, program.environment);
  if (global?.kind === "Variable") return global.index;
  if (
    global?.kind === "Definition" &&
    global.definition.kind === "Operator" &&
    global.definition.params.length === 0
  ) {
    return getProjection(program, global.definition.body, new Map());
  }
  return unsupported();
};

const getVariables = (projection: Projection): number[] =>
  typeof projection === "number" ? [projection] : projection.flatMap(getVariables);

const getProjectedVariables = (program: Program, expression: Expression, scope: TierScope) =>
  getVariables(getProjection(program, expression, scope));

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

// TLC's SubSeq(s, m, n) is <<>> when m > n, and fails unless m and n are positions of s otherwise.
const getSubSeqLength = (target: Plain[], start: number, end: number) => {
  if (start > end) return 0;
  return start < 1 || start > target.length || end > target.length ? deopt() : end - start + 1;
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

// The states left to expand are kept in fixed pages, so the arena grows without copying, and a page
// is reused once they are read. A state never spans two pages.
interface Arena {
  pages: Uint8Array[];
  // The size each page before the last was filled to.
  ends: number[];
  spares: Uint8Array[];
  data: Uint8Array;
  words: Int32Array;
  size: number;
  start: number;
}

const PAGE_SIZE = 1 << 24;
const FINGERPRINT_PAGE_SIZE = 1 << 10;
const EMPTY_PAGE = new Uint8Array(0);

const createArena = (): Arena => {
  const page = new Uint8Array(PAGE_SIZE);
  return {
    pages: [page],
    ends: [],
    spares: [],
    data: page,
    words: new Int32Array(page.buffer),
    size: 0,
    start: 0,
  };
};

const addPage = (arena: Arena) => {
  const length = arena.size - arena.start;
  if (length + RESERVED_BYTES > PAGE_SIZE) deopt();
  const page = arena.spares.pop() ?? new Uint8Array(PAGE_SIZE);
  page.set(arena.data.subarray(arena.start, arena.size));
  arena.ends.push(arena.start);
  arena.pages.push(page);
  arena.data = page;
  arena.words = new Int32Array(page.buffer);
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
// A scalar starts with 0 for an integer, 1 for an atom, and 2 or 3 for a boolean.
const writeValue = (bytes: Bytes, value: Value, plains: Plains): void => {
  if (typeof value === "boolean") return writeScalar(bytes, value ? 3 : 2);
  if (typeof value === "number") {
    writeScalar(bytes, 0);
    return writeScalar(bytes, value);
  }
  if (typeof value === "string" || value.kind === "ModelValue") {
    writeScalar(bytes, 1);
    return writeScalar(bytes, getAtom(plains, value));
  }
  if (value.kind === "LazyFunction") return writeValue(bytes, toFiniteFunction(value), plains);
  const items = value.kind === "Function" ? value.range : getElements(value);
  if (value.kind === "Function" && value.functionClass === "record") {
    const names = getFieldNames(value);
    writeScalar(bytes, names.length);
    names.forEach((name) => writeScalar(bytes, getAtom(plains, name)));
    return names.forEach((name) => writeValue(bytes, getField(value, name), plains));
  }
  writeScalar(bytes, items.length);
  if (value.kind === "Function") value.domain.forEach((inner) => writeValue(bytes, inner, plains));
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
  if (resolved.kind === "Bool") return readScalar(cursor) === 3;
  if (resolved.kind === "Opt") {
    const tag = readScalar(cursor);
    if (tag >= 2) return tag === 3;
    return getOptionAtom(plains, plains.values[readScalar(cursor)]);
  }
  if (resolved.kind === "Int" || resolved.kind === "Str" || resolved.kind === "Mix") {
    const isAtom = readScalar(cursor) === 1;
    const scalar = readScalar(cursor);
    if (resolved.kind === "Str") return addAtom(resolved, plains, plains.values[scalar]);
    if (resolved.kind !== "Mix" || !isAtom) return scalar;
    return getMixedAtom(plains, plains.values[scalar]);
  }
  const length = readScalar(cursor);
  const readItems = (element: Type) =>
    Array.from({ length }, () => readPlain(cursor, element, plains));
  if (resolved.kind === "Map") {
    const keys = readItems(resolved.keys.element);
    const values = readItems(resolved.values.element);
    return [
      isMask(resolved.keys, plains)
        ? keys.reduce<number>((mask, key) => mask | HELPERS.bit(Number(key)), 0)
        : keys,
      values,
    ];
  }
  if (resolved.kind === "Rec") {
    const atoms = Array.from({ length }, () => plains.values[readScalar(cursor)]);
    // A model value is written as 1 and its atom, unlike a record of one field, whose name is a
    // string.
    const [first] = atoms;
    if (length === 1 && typeof first === "object" && first.kind === "ModelValue") {
      return toPlain(first, resolved, plains);
    }
    const names = atoms.map(String);
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
  if (resolved.kind === "Fn") {
    readItems(resolved.key);
    return readItems(resolved.range);
  }
  if (resolved.kind === "Seq") {
    readItems(createInt());
    return readItems(resolved.element);
  }
  if (resolved.kind === "Tup" && length === resolved.elements.length) {
    readItems(createInt());
    return resolved.elements.map((element) => readPlain(cursor, element, plains));
  }
  return resolved.kind === "Set" ? readItems(resolved.element) : unsupported();
};

// Appends a 1 bit for each of count states and then a 0 bit.
const pushFinds = (bits: Words, count: number) => {
  const end = bits.size + count + 1;
  while (end > bits.data.length * 32) growWords(bits);
  for (let bit = bits.size; bit < end - 1; bit++) bits.data[bit >> 5] |= 1 << (bit & 31);
  bits.size = end;
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

// Where an element goes in a sorted set. Adding or removing one element searches for it, where a
// merge would compare it with every element.
const findPosition = (compare: Comparer, set: Plain[], element: Plain) => {
  let low = 0;
  for (let high = set.length; low < high;) {
    const middle = (low + high) >>> 1;
    if (compare(set[middle], element) < 0) low = middle + 1;
    else high = middle;
  }
  return low;
};

const addElement = (compare: Comparer, set: Plain[], element: Plain) => {
  const position = findPosition(compare, set, element);
  if (position < set.length && compare(set[position], element) === 0) return set;
  const result = set.slice(0, position);
  result.push(element);
  for (let index = position; index < set.length; index++) result.push(set[index]);
  return result;
};

const UNION: Kept = { isCommonKept: true, isLeftKept: true, isRightKept: true };
const INTERSECTION: Kept = { isCommonKept: true, isLeftKept: false, isRightKept: false };
const DIFFERENCE: Kept = { isCommonKept: false, isLeftKept: true, isRightKept: false };

// TLC enumerates SUBSET S by size, and subsets of one size in the order of S. With the first
// element of S as the highest bit, that is each size's selections from the largest down.
const getSelections = (count: number) => {
  if (count > MAXIMUM_SUBSET_BASE || 2 ** count > getMaximumSetSize()) deopt();
  const all = (1 << count) - 1;
  const selections = [0];
  for (let size = 1; size <= count; size++) {
    const last = (1 << size) - 1;
    let selection = last << (count - size);
    selections.push(selection);
    while (selection !== last) {
      // Gosper's hack steps the complement to the next larger set of its size.
      const rest = ~selection & all;
      const lowest = rest & -rest;
      const ripple = rest + lowest;
      selection = ~((((ripple ^ rest) >>> 2) / lowest) | ripple) & all;
      selections.push(selection);
    }
  }
  return selections;
};

const getBits = (mask: number) =>
  Array.from({ length: MASK_BITS }, (_value, bit) => bit).filter(
    (bit) => (mask & (1 << bit)) !== 0,
  );

const advanceOdometer = (positions: number[], base: number) => {
  for (let index = positions.length - 1; index >= 0; index--) {
    positions[index]++;
    if (positions[index] < base) return true;
    positions[index] = 0;
  }
  return false;
};

const mixHash = (hash: number) => {
  const mixed = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  const remixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
  return remixed ^ (remixed >>> 16);
};

// Two lanes of Murmur3's mixing, with their own constants, hash the words of a key into 64 bits.
const hashWords = (words: Int32Array, start: number, end: number, hash: Int32Array) => {
  let first = 0x811c9dc5;
  let second = 0x9747b28c;
  for (let index = start; index < end; index++) {
    const word = words[index];
    const firstWord = Math.imul(word, 0xcc9e2d51);
    first ^= Math.imul((firstWord << 15) | (firstWord >>> 17), 0x1b873593);
    first = (Math.imul((first << 13) | (first >>> 19), 5) + 0xe6546b64) | 0;
    const secondWord = Math.imul(word, 0x85ebca77);
    second ^= Math.imul((secondWord << 13) | (secondWord >>> 19), 0xc2b2ae3d);
    second = (Math.imul((second << 17) | (second >>> 15), 9) + 0x27d4eb2f) | 0;
  }
  hash[0] = mixHash(first ^ (end - start));
  hash[1] = mixHash(second ^ (end - start));
};

const HELPERS = {
  hashWords,
  EMPTY: Object.freeze([]),
  subsets: (base: Plain[]) =>
    getSelections(base.length).map((selection) => {
      const subset: Plain[] = [];
      for (let index = 0; index < base.length; index++) {
        if ((selection & (1 << (base.length - 1 - index))) !== 0) subset.push(base[index]);
      }
      return subset;
    }),
  bits: getBits,
  // When the images are every permutation of each orbit, those whose sums are smallest map the atoms
  // of each orbit, sorted by sum, onto the orbit in order, in any order of the atoms that tie. Writes
  // the indexes in A of those other than the identity to tied and returns how many there are.
  findSmallestImages: (sums: Int32Array, orbits: Orbits, tied: Int32Array) => {
    const order = orbits.order;
    const starts = orbits.starts;
    let isTied = true;
    for (let orbit = 0; orbit + 1 < starts.length; orbit++) {
      for (let index = starts[orbit]; index < starts[orbit + 1]; index++) {
        const atom = orbits.atoms[index];
        let position = index;
        for (; position > starts[orbit]; position--) {
          const previous = order[position - 1];
          if (sums[previous] < sums[atom] || (sums[previous] === sums[atom] && previous < atom)) {
            break;
          }
          order[position] = previous;
        }
        order[position] = atom;
        if (sums[atom] !== sums[orbits.atoms[starts[orbit]]]) isTied = false;
      }
    }
    // When each orbit's atoms all tie, every image does.
    if (isTied) {
      for (let image = 0; image + 1 < orbits.images.length; image++) tied[image] = image;
      orbits.first = 0;
      return orbits.images.length - 1;
    }
    let ties = 0;
    orbits.first = -1;
    do {
      const image = orbits.images[getArrangementRank(order, starts)];
      if (image === 0) orbits.first = 0;
      else tied[ties++] = image - 1;
    } while (permuteTies(sums, order, starts));
    if (orbits.first === -1) orbits.first = tied[0] + 1;
    return ties;
  },
  compareSignatures: (sums: Int32Array, left: Int32Array, right: Int32Array) => {
    for (let index = 0; index < left.length; index++) {
      const difference = sums[left[index]] - sums[right[index]];
      if (difference !== 0) return difference;
    }
    return 0;
  },
  compareBytes: (data: Uint8Array, start: number, end: number, other: Uint8Array, from: number) => {
    for (let index = start; index < end; index++) {
      const difference = data[index] - other[from + index - start];
      if (difference !== 0) return difference;
    }
    return 0;
  },
  // An image of a sorted set is mostly in order, as a permutation moves only the elements its
  // model values order. Insertion sorts it in about one comparison per element, until it has moved
  // elements more often than a general sort would compare them.
  sortImage: (set: Plain[], compare: Comparer) => {
    let moves = 0;
    for (let index = 1; index < set.length; index++) {
      if (moves > set.length * MAXIMUM_MOVES_PER_ELEMENT) return set.sort(compare);
      const element = set[index];
      let position = index;
      for (; position > 0 && compare(element, set[position - 1]) < 0; position--) {
        set[position] = set[position - 1];
      }
      set[position] = element;
      moves += index - position;
    }
    return set;
  },
  // Sorts the keys of an image in place, and its values alongside, which may be the map's own.
  sortMap: (compare: Comparer, keys: Plain[], values: Plain[]) => {
    if (keys.length > MAXIMUM_INSERTION_SORT) {
      const order = keys
        .map((_value, index) => index)
        .sort((left, right) => compare(keys[left], keys[right]));
      return [order.map((index) => keys[index]), order.map((index) => values[index])];
    }
    const sorted = values.slice();
    for (let index = 1; index < keys.length; index++) {
      const key = keys[index];
      const value = sorted[index];
      let position = index;
      for (; position > 0 && compare(key, keys[position - 1]) < 0; position--) {
        keys[position] = keys[position - 1];
        sorted[position] = sorted[position - 1];
      }
      keys[position] = key;
      sorted[position] = value;
    }
    return [keys, sorted];
  },
  sortSeq: (sequence: Plain[], isBefore: (left: Plain, right: Plain) => boolean) => {
    const sorted = sequence.slice();
    for (let index = 1; index < sorted.length; index++) {
      const element = sorted[index];
      let position = index;
      for (; position > 0 && isBefore(element, sorted[position - 1]); position--) {
        sorted[position] = sorted[position - 1];
      }
      sorted[position] = element;
    }
    return sorted;
  },
  subsetMasks: (mask: number) => {
    const bits = getBits(mask);
    return getSelections(bits.length).map((selection) => {
      let subset = 0;
      for (let index = 0; index < bits.length; index++) {
        if ((selection & (1 << (bits.length - 1 - index))) !== 0) subset |= 1 << bits[index];
      }
      return subset;
    });
  },

  // TLC enumerates [low..high -> S] varying the last argument fastest.
  intervalEnd: (elements: Plain[]) =>
    elements.every((element, index) => element === index + 1) ? elements.length : deopt(),
  sequences: (elements: Plain[], low: number, high: number) => {
    const length = Math.max(0, high - low + 1);
    if (length > 0 && low !== 1) deopt();
    if (elements.length ** length > Math.min(MAXIMUM_SEQUENCES, getMaximumSetSize())) deopt();
    const positions = Array.from({ length }, () => 0);
    const sequences: Plain[][] = [];
    if (length > 0 && elements.length === 0) return sequences;
    do sequences.push(positions.map((position) => elements[position]));
    while (advanceOdometer(positions, elements.length));
    return sequences;
  },
  same: isSame,
  deopt,
  at: (target: Plain[], position: number) =>
    position >= 0 && position < target.length ? target[position] : deopt(),
  tail: (target: Plain[]) => (target.length === 0 ? deopt() : target.slice(1)),
  subSeq: (target: Plain[], start: number, end: number) =>
    target.slice(start - 1, start - 1 + getSubSeqLength(target, start, end)),
  sameSubSeqs: (
    left: Plain[],
    leftStart: number,
    leftEnd: number,
    right: Plain[],
    rightStart: number,
    rightEnd: number,
  ) => {
    const length = getSubSeqLength(left, leftStart, leftEnd);
    if (length !== getSubSeqLength(right, rightStart, rightEnd)) return false;
    for (let index = 0; index < length; index++) {
      if (!isSame(left[leftStart - 1 + index], right[rightStart - 1 + index])) return false;
    }
    return true;
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
    high - low + 1 > getMaximumSetSize()
      ? deopt()
      : Array.from({ length: Math.max(0, high - low + 1) }, (_value, index) => low + index),
  index: (index: Int32Array, offset: number) =>
    offset >= 0 && offset < index.length ? index[offset] : -1,
  has: (mask: number, element: number) =>
    element >= 0 && element < MASK_BITS && ((mask >>> element) & 1) !== 0,
  count: countBits,
  int: (value: number) => (value < ATOM_BASE ? value : deopt()),
  bool: (value: Plain) => (typeof value === "boolean" ? value : deopt()),
  // TLC orders a model value before any other value.
  compareMixed: (ranks: Int32Array, left: number, right: number) => {
    const isLeftAtom = left >= ATOM_BASE;
    const isRightAtom = right >= ATOM_BASE;
    if (isLeftAtom && isRightAtom) return ranks[left - ATOM_BASE] - ranks[right - ATOM_BASE];
    if (isLeftAtom || isRightAtom) return isLeftAtom ? -1 : 1;
    return left - right;
  },
  // TLC orders an untyped model value before any value that isn't a model value.
  compareOption: (ranks: Int32Array, left: Plain, right: Plain) => {
    if (typeof left === "number" && typeof right === "number") return ranks[left] - ranks[right];
    if (typeof left === "number" || typeof right === "number") {
      return typeof left === "number" ? -1 : 1;
    }
    return Number(left) - Number(right);
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
    if (items.length > getMaximumSetSize()) deopt();
    if (items.length > MAXIMUM_INSERTION_SORT) {
      items.sort(compare);
      return items.filter((item, index) => index === 0 || compare(items[index - 1], item) !== 0);
    }
    let size = 0;
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      let position = size;
      let comparison = 1;
      for (; position > 0; position--) {
        comparison = compare(item, items[position - 1]);
        if (comparison >= 0) break;
      }
      if (comparison === 0) continue;
      for (let moved = size; moved > position; moved--) items[moved] = items[moved - 1];
      items[position] = item;
      size++;
    }
    items.length = size;
    return items;
  },
  findKey,
  findScannedKey,
  findMaskKey,
  // TLC takes a function for a sequence when its domain is 1..n.
  toSequence: (map: Plain[][]) =>
    map[0].every((key, index) => key === index + 1) ? map[1] : deopt(),
  toSequenceMask: (map: [number, Plain[]]) =>
    map[0] === HELPERS.range(1, map[1].length) ? map[1] : deopt(),
  fromSequence: (values: Plain[]) => [values.map((_value, index) => index + 1), values],
  fromSequenceMask: (values: Plain[]) => [HELPERS.range(1, values.length), values],
  lookupScanned: (compare: Comparer, map: Plain[][], key: Plain) => {
    const index = findScannedKey(compare, map[0], key);
    return index === -1 ? deopt() : map[1][index];
  },
  lookup: (compare: Comparer, map: Plain[][], key: Plain) => {
    const index = findKey(compare, map[0], key);
    return index === -1 ? deopt() : map[1][index];
  },
  lookupMask: (map: [number, Plain[]], key: number) => {
    const index = findMaskKey(map[0], key);
    return index === -1 ? deopt() : map[1][index];
  },
  combine: (compare: Comparer, left: Plain[][], right: Plain[][]) => {
    const keys: Plain[] = [];
    const values: Plain[] = [];
    let leftIndex = 0;
    let rightIndex = 0;
    while (leftIndex < left[0].length || rightIndex < right[0].length) {
      const comparison =
        leftIndex === left[0].length
          ? 1
          : rightIndex === right[0].length
            ? -1
            : compare(left[0][leftIndex], right[0][rightIndex]);
      if (comparison <= 0) {
        keys.push(left[0][leftIndex]);
        values.push(left[1][leftIndex++]);
        if (comparison === 0) rightIndex++;
      } else {
        keys.push(right[0][rightIndex]);
        values.push(right[1][rightIndex++]);
      }
    }
    return [keys, values];
  },
  combineMasks: (left: [number, Plain[]], right: [number, Plain[]]) => {
    const keys = left[0] | right[0];
    const values: Plain[] = [];
    for (let rest = keys; rest !== 0; rest &= rest - 1) {
      const bit = rest & -rest;
      values.push(
        (left[0] & bit) !== 0
          ? left[1][countBits(left[0] & (bit - 1))]
          : right[1][countBits(right[0] & (bit - 1))],
      );
    }
    return [keys, values];
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
  union: (compare: Comparer, left: Plain[], right: Plain[]) => {
    if (left.length + right.length > getMaximumSetSize()) deopt();
    if (right.length === 1) return addElement(compare, left, right[0]);
    return left.length === 1
      ? addElement(compare, right, left[0])
      : mergeSets(compare, left, right, UNION);
  },
  intersect: (compare: Comparer, left: Plain[], right: Plain[]) =>
    mergeSets(compare, left, right, INTERSECTION),
  difference: (compare: Comparer, left: Plain[], right: Plain[]) => {
    if (right.length !== 1) return mergeSets(compare, left, right, DIFFERENCE);
    const position = findPosition(compare, left, right[0]);
    if (position === left.length || compare(left[position], right[0]) !== 0) return left;
    const result = left.slice(0, position);
    for (let index = position + 1; index < left.length; index++) result.push(left[index]);
    return result;
  },
  position: (lookup: Map<number, { key: Plain; position: number }[]>, key: Plain) =>
    lookup.get(hashPlain(key))?.find((entry) => isSame(entry.key, key))?.position ?? -1,
  isIn: (buckets: Map<number, Plain[]>, plain: Plain) =>
    buckets.get(hashPlain(plain))?.some((item) => isSame(item, plain)) === true,
  addPage,
  varint: writeVarint,
};

const RESERVED_BYTES = 1 << 18;
// Copying the encoding of a value costs more than writing it below this many scalars.
const MAXIMUM_WRITTEN_SIZE = 16;
const INTEGER_ESCAPE = 254;
const ATOM_ESCAPE = 255;
const MAXIMUM_SCALAR_BYTES = 6;

const hasVariableSize = (type: Type): boolean => {
  const resolved = resolveType(type);
  if (resolved.kind === "Seq" || resolved.kind === "Set" || resolved.kind === "Map") return true;
  if (resolved.kind === "Rec") {
    return isRecursive(resolved) || [...resolved.fields.values()].some(hasVariableSize);
  }
  if (resolved.kind === "Tup") return resolved.elements.some(hasVariableSize);
  return resolved.kind === "Fn" && hasVariableSize(resolved.range);
};

const getFixedSize = (type: Type): number => {
  const resolved = resolveType(type);
  if (resolved.kind === "Seq" || resolved.kind === "Set") return 1;
  if (resolved.kind === "Mix" || resolved.kind === "Map") return 2;
  // A record that holds itself is written by a function that makes room for it first.
  if (resolved.kind === "Rec") return isRecursive(resolved) ? 1 : getRecordSize(resolved);
  if (resolved.kind === "Fn") return resolved.domain.length * getFixedSize(resolved.range);
  if (resolved.kind === "Tup") {
    return resolved.elements.reduce((sum, element) => sum + getFixedSize(element), 0);
  }
  return 1;
};

const getRecordSize = (record: RecType) => {
  const sizes = record.shapes.map((shape) =>
    shape.reduce((sum, name) => sum + getFixedSize(getFieldType(record, name)), 0),
  );
  return Math.max(...sizes) + (sizes.length === 1 ? 0 : 1);
};

const getParts = (type: Type): Type[] => {
  if (type.kind === "Rec") return type.shapes[0].map((name) => getFieldType(type, name));
  if (type.kind === "Fn") return type.domain.map(() => type.range);
  if (type.kind === "Map") return [type.keys, type.values];
  if (type.kind === "Tup") return type.elements;
  return unsupported();
};

interface Codec {
  plains: Plains;
  functions: string[];
  names: { count: number };
  writers: Map<Type, string>;
  readers: Map<Type, string>;
  // The functions writing the keys of collections, of values and of their images.
  keyWriters: [Map<Type, string>, Map<Type, string>];
}

const RESERVE_CODE = `if (n + ${RESERVED_BYTES} > d.length) { W.size = n; H.addPage(W); d = W.data; n = W.size; }`;

const getWriter = (codec: Codec, type: Type, code: string, isInline = false): string => {
  const resolved = resolveType(type);
  if (resolved.kind === "Rec" && !isInline && isRecursive(resolved)) {
    const known = codec.writers.get(resolved);
    if (known) return `${known}(${code});`;
    if (getRecordSize(resolved) * MAXIMUM_SCALAR_BYTES > RESERVED_BYTES) return unsupported();
    const writer = `w${codec.names.count++}`;
    codec.writers.set(resolved, writer);
    codec.functions.push(
      `const ${writer} = (x) => { ${RESERVE_CODE} ${getWriter(codec, resolved, "x", true)} };`,
    );
    return `${writer}(${code});`;
  }
  if (getFixedSize(resolved) * MAXIMUM_SCALAR_BYTES > RESERVED_BYTES) return unsupported();
  if (resolved.kind === "Bool") return `d[n++] = ${code} ? 1 : 0;`;
  // An option is 0 for FALSE, 1 for TRUE, and its atom plus 2.
  if (resolved.kind === "Opt") {
    return `t = ${code}; t = t === false ? 0 : t === true ? 1 : t + 2; if (t < 128) d[n++] = t; else n = H.varint(d, n, t);`;
  }
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
    `const ${name} = (${name}s) => { t = ${name}s.length; if (t < 128) d[n++] = t; else n = H.varint(d, n, t); for (let ${name}i = 0; ${name}i < ${name}s.length; ${name}i++) { const ${element} = ${name}s[${name}i]; ${RESERVE_CODE} ${getWriter(codec, type.element, element)} } };`,
  );
  return name;
};

const getReader = (codec: Codec, type: Type): string => {
  const resolved = resolveType(type);
  if (resolved.kind === "Bool") return "(d[i++] !== 0)";
  if (resolved.kind === "Opt")
    return "((t = (t = d[i++]) < 128 ? t : rv(t)) < 2 ? t === 1 : t - 2)";
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

// For each image, the position each key of a function's domain moves to, unless no key moves.
const getMovedPositions = (images: Images[], domain: Value[]) => {
  const positions = images.map((table) =>
    Int32Array.from(domain, (key) => {
      const image = permuteValue(key, table);
      const position = domain.findIndex((other) => isSameValue(other, image));
      return position === -1 ? unsupported() : position;
    }),
  );
  return positions.some((table) => table.some((position, index) => position !== index))
    ? positions
    : undefined;
};

// Whether a permutation can change a value of the type.
const isPermutable = (images: Images[], type: Type, visited = new Set<Type>()): boolean => {
  const resolved = resolveType(type);
  if (visited.has(resolved)) return false;
  visited.add(resolved);
  const isInner = (inner: Type) => isPermutable(images, inner, visited);
  switch (resolved.kind) {
    case "Str":
    case "Mix":
    case "Opt":
      return true;
    case "Seq":
    case "Set":
      return isInner(resolved.element);
    case "Map":
      return isInner(resolved.keys) || isInner(resolved.values);
    case "Fn":
      return getMovedPositions(images, resolved.domain) !== undefined || isInner(resolved.range);
    case "Rec":
      return resolved.shapes.some((shape) =>
        shape.some((field) => isInner(getFieldType(resolved, field))),
      );
    case "Tup":
      return resolved.elements.some(isInner);
    default:
      return false;
  }
};

// Writes the key of a value, or of its image under P where isPermuted, which a permutation can't
// reorder. A set a permutation changes is its size and the sums of the hashes of its elements, and so
// is a function with such keys, its pairs. The image needn't be built or sorted.
const getKeyWriter = (
  program: Program,
  codec: Codec,
  images: Images[],
  type: Type,
  code: string,
  isPermuted: boolean,
): string => {
  const resolved = resolveType(type);
  if (!isPermutable(images, resolved)) return getWriter(codec, resolved, code);
  const getInner = (inner: Type, innerCode: string) =>
    getKeyWriter(program, codec, images, inner, innerCode, isPermuted);
  const varint = `if (t >= 0 && t < 128) d[n++] = t; else n = H.varint(d, n, t);`;
  const getSum = (length: string, element: string) => {
    const [first, second, start, aligned] = ["h", "h", "h", "h"].map((prefix) =>
      getName(program, prefix),
    );
    const word = (sum: string) =>
      [0, 8, 16, 24].map((shift) => `d[n++] = (${sum} >>> ${shift}) & 255;`).join(" ");
    return `let ${first} = 0, ${second} = 0; for (let j = 0; j < ${length}; j++) { ${RESERVE_CODE} const ${start} = n - W.start; while ((n & 3) !== 0) d[n++] = 0; const ${aligned} = n - W.start; ${element} while ((n & 3) !== 0) d[n++] = 0; H.hashWords(W.words, (W.start + ${aligned}) >> 2, n >> 2, U); ${first} = (${first} + U[0]) | 0; ${second} = (${second} + U[1]) | 0; n = W.start + ${start}; } t = ${length}; ${varint} ${word(first)} ${word(second)}`;
  };
  const name = getName(program, "k");
  const getRecordKeyWriter = (record: RecType, recordCode = code) => {
    if (record.shapes.length === 1) {
      return `{ const ${name} = ${recordCode}; ${getParts(record)
        .map((part, index) => getInner(part, `${name}[${index}]`))
        .join(" ")} }`;
    }
    const cases = record.shapes.map((shape, tag) => {
      const fields = shape.map((field, index) =>
        getInner(getFieldType(record, field), `${name}[${index + 1}]`),
      );
      return `case ${tag}: ${fields.join(" ")} break;`;
    });
    return `{ const ${name} = ${recordCode}; d[n++] = ${name}[0]; switch (${name}[0]) { ${cases.join(" ")} } }`;
  };
  switch (resolved.kind) {
    case "Str":
      return `t = ${isPermuted ? `P[${code}]` : code}; ${varint}`;
    case "Opt":
      return `t = ${code}; t = t === false ? 0 : t === true ? 1 : ${isPermuted ? "P[t]" : "t"} + 2; ${varint}`;
    case "Mix":
      return `{ let ${name} = ${code}; ${isPermuted ? `if (${name} >= ${ATOM_BASE}) ${name} = ${ATOM_BASE} + P[${name} - ${ATOM_BASE}];` : ""} ${getWriter(codec, resolved, name)} }`;
    case "Seq":
    case "Set":
    case "Map":
    case "Rec": {
      if (resolved.kind === "Rec" && !isRecursive(resolved)) return getRecordKeyWriter(resolved);
      const known = codec.keyWriters[Number(isPermuted)].get(resolved);
      const call = (writer: string) => `${writer}(${code}${isPermuted ? ", P, G" : ""});`;
      if (known) return call(known);
      const writer = `kw${codec.names.count++}`;
      codec.keyWriters[Number(isPermuted)].set(resolved, writer);
      const body =
        resolved.kind === "Rec"
          ? `${RESERVE_CODE} ${getRecordKeyWriter(resolved, "x")}`
          : resolved.kind === "Seq"
            ? `t = x.length; ${varint} for (let j = 0; j < x.length; j++) { ${RESERVE_CODE} ${getInner(resolved.element, "x[j]")} }`
            : resolved.kind === "Set"
              ? getSum("x.length", getInner(resolved.element, "x[j]"))
              : isPermutable(images, resolved.keys)
                ? getSum(
                    "x[0].length",
                    `${getInner(resolved.keys.element, "x[0][j]")} ${getInner(resolved.values.element, "x[1][j]")}`,
                  )
                : `${getWriter(codec, resolved.keys, "x[0]")} ${getInner(resolved.values, "x[1]")}`;
      codec.functions.push(`const ${writer} = (x${isPermuted ? ", P, G" : ""}) => { ${body} };`);
      return call(writer);
    }
    case "Fn": {
      const positions = isPermuted && getMovedPositions(images, resolved.domain);
      if (!positions) {
        return `{ const ${name} = ${code}; ${resolved.domain.map((_value, index) => getInner(resolved.range, `${name}[${index}]`)).join(" ")} }`;
      }
      const base = program.indexes.length;
      program.indexes.push(
        ...positions.map((table) => {
          const sources = new Int32Array(table.length);
          table.forEach((position, index) => {
            sources[position] = index;
          });
          return sources;
        }),
      );
      const sources = getName(program, "s");
      return `{ const ${name} = ${code}; const ${sources} = D[${base} + G]; ${resolved.domain.map((_value, index) => getInner(resolved.range, `${name}[${sources}[${index}]]`)).join(" ")} }`;
    }
    case "Tup":
      return `{ const ${name} = ${code}; ${getParts(resolved)
        .map((part, index) => getInner(part, `${name}[${index}]`))
        .join(" ")} }`;
    default:
      return unsupported();
  }
};

// TLC fingerprints a state under symmetry as the smallest of its images, so every state of an orbit
// shares one. The tier keys a state by the smallest encoding of its images, which they share too.
const getPermuteCode = (
  program: Program,
  images: Images[],
  type: Type,
  code: string,
): string | undefined => {
  const resolved = resolveType(type);
  const getElementCode = (element: Type, wrap: (name: string, inner: string) => string) => {
    const name = getName(program, "p");
    const inner = getPermuteCode(program, images, element, name);
    return inner && wrap(name, inner);
  };
  switch (resolved.kind) {
    case "Tup": {
      const tuple = getBinding(program, "t", code);
      const elements = resolved.elements.map((element, index) =>
        getPermuteCode(program, images, element, `${tuple.name}[${index}]`),
      );
      if (elements.every((element) => element === undefined)) return undefined;
      const permuted = elements.map((element, index) => element ?? `${tuple.name}[${index}]`);
      return tuple.wrap(`[${permuted.join(", ")}]`);
    }
    case "Str":
      return `P[${code}]`;
    case "Mix":
      return `((p) => (p >= ${ATOM_BASE} ? ${ATOM_BASE} + P[p - ${ATOM_BASE}] : p))(${code})`;
    case "Opt":
      return `((p) => (typeof p === "number" ? P[p] : p))(${code})`;
    case "Seq":
      return getElementCode(
        resolved.element,
        (name, inner) => `(${code}).map((${name}) => ${inner})`,
      );
    case "Set":
      if (isMask(resolved, program.plains)) return undefined;
      return getElementCode(
        resolved.element,
        (name, inner) =>
          `H.sortImage((${code}).map((${name}) => ${inner}), ${getComparerCode(program, resolved.element)})`,
      );
    case "Rec": {
      if (isRecursive(resolved)) {
        if (!isPermuted(program, images, resolved)) return undefined;
        const known = program.permuters.get(resolved);
        if (known) return `${known}(${code}, P, G)`;
        const permuter = getName(program, "q");
        program.permuters.set(resolved, permuter);
        const record = getName(program, "r");
        const cases = resolved.shapes.map((shape, tag) => {
          const fields = shape.map(
            (name, index) =>
              getPermuteCode(
                program,
                images,
                getFieldType(resolved, name),
                `${record}[${index + 1}]`,
              ) ?? `${record}[${index + 1}]`,
          );
          return `case ${tag}: return [${tag}, ${fields.join(", ")}];`;
        });
        program.comparers.functions.push(
          `const ${permuter} = (${record}, P, G) => { switch (${record}[0]) { ${cases.join(" ")} } };`,
        );
        return `${permuter}(${code}, P, G)`;
      }
      const offset = resolved.shapes.length === 1 ? 0 : 1;
      const record = getBinding(program, "r", code);
      const shapes = resolved.shapes.map((shape) =>
        shape.map(
          (name, index) =>
            getPermuteCode(
              program,
              images,
              getFieldType(resolved, name),
              `${record.name}[${index + offset}]`,
            ) ?? `${record.name}[${index + offset}]`,
        ),
      );
      if (
        shapes.every((fields) =>
          fields.every((field, index) => field === `${record.name}[${index + offset}]`),
        )
      ) {
        return undefined;
      }
      if (offset === 0) return record.wrap(`[${shapes[0].join(", ")}]`);
      const cases = shapes.map(
        (fields, tag) => `${record.name}[0] === ${tag} ? [${tag}, ${fields.join(", ")}] : `,
      );
      return record.wrap(`${cases.join("")}${record.name}`);
    }
    case "Fn": {
      const positions = getMovedPositions(images, resolved.domain);
      if (!positions) {
        return getElementCode(
          resolved.range,
          (name, inner) => `(${code}).map((${name}) => ${inner})`,
        );
      }
      const base = program.indexes.length;
      program.indexes.push(...positions);
      const name = getName(program, "p");
      const permuted = getPermuteCode(program, images, resolved.range, name) ?? name;
      return `((f) => { const t = D[${base} + G]; const o = new Array(f.length); for (let j = 0; j < f.length; j++) { const ${name} = f[j]; o[t[j]] = ${permuted}; } return o; })(${code})`;
    }
    case "Map": {
      const map = getBinding(program, "m", code);
      const values = getPermuteCode(program, images, resolved.values, `${map.name}[1]`);
      const keys = getElementCode(
        resolved.keys.element,
        (name, inner) => `(${map.name}[0]).map((${name}) => ${inner})`,
      );
      if (keys === undefined) return values && map.wrap(`[${map.name}[0], ${values}]`);
      return map.wrap(
        `H.sortMap(${getComparerCode(program, resolved.keys.element)}, ${keys}, ${values ?? `${map.name}[1]`})`,
      );
    }
    default:
      return undefined;
  }
};

// Compares the image of a value with another as TLC orders them, building the image only of a set
// or a function with keys, whose images TLC sorts.
const getImageCompareCode = (
  program: Program,
  images: Images[],
  type: Type,
  code: string,
  other: string,
): string => {
  const resolved = resolveType(type);
  if (!isPermuted(program, images, resolved)) return getCompareCode(program, type, code, other);
  if (!isComparedInPlace(program, images, resolved)) {
    return getCompareCode(
      program,
      type,
      getPermuteCode(program, images, type, code) ?? code,
      other,
    );
  }
  const [value, against, index] = ["f", "r", "k"].map((prefix) => getName(program, prefix));
  const getLoop = (length: string, source: string, element: Type) =>
    `((${value}, ${against}) => { ${length} for (let ${index} = 0; ${index} < ${value}.length; ${index}++) { const c = ${getImageCompareCode(program, images, element, `${value}[${source}]`, `${against}[${index}]`)}; if (c !== 0) return c; } return 0; })(${code}, ${other})`;
  if (resolved.kind === "Seq") {
    return getLoop(
      `if (${value}.length !== ${against}.length) return ${value}.length - ${against}.length;`,
      index,
      resolved.element,
    );
  }
  if (resolved.kind === "Fn") {
    const positions = getMovedPositions(images, resolved.domain);
    if (!positions) return getLoop("", index, resolved.range);
    // The image takes the value at each position from the position the image moves there.
    const base = program.indexes.length;
    program.indexes.push(
      ...positions.map((targets) => {
        const sources = new Int32Array(targets.length);
        targets.forEach((target, source) => (sources[target] = source));
        return sources;
      }),
    );
    const sources = getName(program, "s");
    return getLoop(`const ${sources} = D[${base} + G];`, `${sources}[${index}]`, resolved.range);
  }
  const fields =
    resolved.kind === "Tup"
      ? resolved.elements.map((element, position) => ({ type: element, position }))
      : resolved.kind === "Map"
        ? [
            { type: resolved.keys, position: 0 },
            { type: resolved.values, position: 1 },
          ]
        : resolved.kind === "Rec"
          ? resolved.shapes[0]
              .toSorted((left, right) => compareValues(left, right))
              .map((name) => ({
                type: getFieldType(resolved, name),
                position: resolved.shapes[0].indexOf(name),
              }))
          : unsupported();
  const chain = fields.map(
    (field) =>
      `c = ${getImageCompareCode(program, images, field.type, `${value}[${field.position}]`, `${against}[${field.position}]`)}; if (c !== 0) return c;`,
  );
  return `((${value}, ${against}) => { let c; ${chain.join(" ")} return 0; })(${code}, ${other})`;
};

// Whether an image of a value compares as it's read, without building the image. A function whose
// domain an image keeps compares as its domain and then its values.
const isComparedInPlace = (program: Program, images: Images[], resolved: Type) =>
  resolved.kind === "Seq" ||
  resolved.kind === "Fn" ||
  resolved.kind === "Tup" ||
  (resolved.kind === "Map" && !isPermuted(program, images, resolved.keys)) ||
  (resolved.kind === "Rec" && resolved.shapes.length === 1);

// Whether an image can change a value of the type, as getPermuteCode finds.
const isPermuted = (
  program: Program,
  images: Images[],
  type: Type,
  visited = new Set<Type>(),
): boolean => {
  const resolved = resolveType(type);
  if (visited.has(resolved)) return false;
  visited.add(resolved);
  const isElementPermuted = (element: Type) => isPermuted(program, images, element, visited);
  switch (resolved.kind) {
    case "Str":
    case "Mix":
    case "Opt":
      return true;
    case "Tup":
      return resolved.elements.some(isElementPermuted);
    case "Seq":
      return isElementPermuted(resolved.element);
    case "Set":
      return !isMask(resolved, program.plains) && isElementPermuted(resolved.element);
    case "Rec":
      return [...resolved.fields.values()].some(isElementPermuted);
    case "Fn":
      return (
        getMovedPositions(images, resolved.domain) !== undefined ||
        isElementPermuted(resolved.range)
      );
    case "Map":
      return isElementPermuted(resolved.keys.element) || isElementPermuted(resolved.values);
    default:
      return false;
  }
};

// Adds to Z, for each atom in a value, a weight for where the atom is, scaled by a hash of the
// values around it that no image moves. An image moves an atom's sum to its image, so every key
// position an image can move shares one weight.
const getSignatureCode = (
  program: Program,
  sites: { count: number },
  type: Type,
  code: string,
  scale = "1",
): string | undefined => {
  const resolved = resolveType(type);
  const getWeight = () => Math.imul(++sites.count, 0x9e3779b1);
  const getLoop = (element: Type, elements: string) => {
    const name = getName(program, "e");
    const inner = getSignatureCode(program, sites, element, name, scale);
    return inner && `${getIndexedLoop(program, name, elements)} { ${inner} }`;
  };
  // No image moves an integer, a boolean or a set of integers, which is a mask.
  const getScalarCode = (scalar: Type, scalarCode: string) => {
    const resolvedScalar = resolveType(scalar);
    if (resolvedScalar.kind === "Bool") return `(${scalarCode} ? 2 : 1)`;
    return resolvedScalar.kind === "Int" ||
      (resolvedScalar.kind === "Set" && isMask(resolvedScalar, program.plains))
      ? `(${scalarCode} + 1)`
      : undefined;
  };
  switch (resolved.kind) {
    case "Str":
      return `Z[${code}] += Math.imul(${getWeight()}, ${scale});`;
    case "Mix":
      return `if (${code} >= ${ATOM_BASE}) Z[${code} - ${ATOM_BASE}] += Math.imul(${getWeight()}, ${scale});`;
    case "Opt":
      return `if (typeof ${code} === "number") Z[${code}] += Math.imul(${getWeight()}, ${scale});`;
    case "Seq":
      return getLoop(resolved.element, code);
    case "Set":
      return isMask(resolved, program.plains) ? undefined : getLoop(resolved.element, code);
    case "Rec": {
      if (isRecursive(resolved)) return unsupported();
      const record = getName(program, "r");
      const hash = getName(program, "h");
      const offset = resolved.shapes.length === 1 ? 0 : 1;
      const shapes = resolved.shapes.map((shape) => {
        const fields = shape.map((field, index) => ({
          type: getFieldType(resolved, field),
          code: `${record}[${index + offset}]`,
        }));
        const scalars = fields.flatMap((field) => getScalarCode(field.type, field.code) ?? []);
        const signatures = fields.flatMap(
          (field) =>
            getSignatureCode(
              program,
              sites,
              field.type,
              field.code,
              scalars.length === 0 ? scale : hash,
            ) ?? [],
        );
        if (signatures.length === 0) return "";
        const hashing = scalars.reduce(
          (previous, scalar) => `Math.imul(${previous} ^ ${scalar}, 16777619)`,
          scale,
        );
        return `${scalars.length === 0 ? "" : `const ${hash} = ${hashing};`} ${signatures.join(" ")}`;
      });
      if (shapes.every((shape) => shape === "")) return undefined;
      if (offset === 0) return `{ const ${record} = ${code}; ${shapes[0]} }`;
      const cases = shapes.map((shape, tag) => `case ${tag}: { ${shape} } break;`);
      return `{ const ${record} = ${code}; switch (${record}[0]) { ${cases.join(" ")} } }`;
    }
    case "Fn": {
      const functionValue = getName(program, "f");
      const weight = getWeight();
      const keys = resolved.domain.flatMap((key, position) => {
        const id =
          typeof key === "object" && key.kind === "ModelValue"
            ? program.plains.ids.get(key)
            : undefined;
        const value = getScalarCode(resolved.range, `${functionValue}[${position}]`);
        return id === undefined || value === undefined
          ? []
          : [`Z[${id}] += Math.imul(Math.imul(${weight}, ${scale}), ${value});`];
      });
      const values = getLoop(resolved.range, functionValue);
      if (keys.length === 0 && values === undefined) return undefined;
      return `{ const ${functionValue} = ${code}; ${keys.join(" ")} ${values ?? ""} }`;
    }
    case "Map": {
      const parts = [
        getSignatureCode(program, sites, resolved.keys, `(${code})[0]`, scale),
        getSignatureCode(program, sites, resolved.values, `(${code})[1]`, scale),
      ].filter((part) => part !== undefined);
      return parts.length === 0 ? undefined : parts.join(" ");
    }
    default:
      return undefined;
  }
};

interface CompiledSpec {
  next: (state: Plain[], emit: (successor: Plain[], isUnchanged: boolean) => void) => void;
  // A state predicate holds of a successor that has its parent's values of the variables it reads,
  // since it held of the parent.
  invariants: ((state: Plain[], parent?: Plain[]) => boolean)[];
  actionProperties: ((state: Plain[], next: Plain[]) => boolean)[];
  // Whether each atom of the temporal properties holds of a state, or of a step to next.
  liveAtoms: ((state: Plain[], next: Plain[]) => boolean)[];
  constraints: ((state: Plain[], parent?: Plain[]) => boolean)[];
  encode: (state: Plain[], arena: Arena) => void;
  // Reads the state at a cursor, and moves the cursor past it.
  decode: (cursor: Cursor) => Plain[];
  // Writes the encoding of the class of states a state is in, under symmetry or a view.
  writeKey: (state: Plain[], arena: Arena) => void;
  // The smallest image of a state, in the order TLC compares states in.
  represent: (state: Plain[]) => Plain[];
}

// The scope a temporal property's atom is evaluated in binds values, such as a process of \A p.
const getAtomScope = (program: Program, scope: Scope | undefined) => {
  const atomScope = new Map<string, Binding>();
  for (let current = scope; current !== undefined; current = current.parent) {
    const binding = current.binding;
    if (atomScope.has(current.name)) continue;
    if (binding.kind !== "Value" || binding.argument !== undefined) return unsupported();
    atomScope.set(current.name, {
      kind: "Code",
      compiled: compileConstant(program, binding.value),
      source: undefined,
    });
  }
  return atomScope;
};

const compileSpec = (
  program: Program,
  check: TypedCheck,
  temporalAtoms: LiveAtom[],
): CompiledSpec => {
  const unprimed = program.variableTypes.map(() => undefined);
  const next = compileStep(
    program,
    [{ expression: check.next, scope: new Map(), inlining: [] }],
    unprimed,
    false,
  );
  const compilePredicate = (expression: Expression) =>
    expectBool(
      compileValue(program, expression, {
        scope: new Map(),
        primed: unprimed,
        variables: getVariableCodes(program),
        isNext: false,
      }),
    );
  const invariants = check.invariants.map(compilePredicate);
  const constraints = check.constraints.map(compilePredicate);
  const successor = program.variableTypes.map(() => getName(program, "n"));
  // [A]_v holds when A does or v is unchanged.
  const actionProperties = check.actionProperties.map((property) => {
    const frame = {
      scope: new Map(),
      primed: successor,
      variables: getVariableCodes(program),
      isNext: false,
    };
    return {
      action: expectBool(compileValue(program, property.action, frame)),
      unchanged: compileUnchanged(program, property.subscript, frame),
    };
  });
  const liveAtoms = temporalAtoms.map((atom) => {
    const scope = getAtomScope(program, atom.scope);
    const variables = getVariableCodes(program);
    if (atom.kind === "State") {
      const holds = expectBool(
        compileValue(program, atom.expression, {
          scope,
          primed: unprimed,
          variables,
          isNext: false,
        }),
      );
      return () => holds.emit();
    }
    const frame = { scope, primed: successor, variables, isNext: false };
    if (atom.kind === "Enabled") {
      // A fairness condition's step is <<A>>_v, whose successors are those of A that change v.
      const angle = atom.step.kind === "AngleAction" ? atom.step : undefined;
      const action = angle?.action ?? atom.step;
      const step = compileStep(
        program,
        [{ expression: action, scope, inlining: [] }],
        unprimed,
        true,
      );
      // TLC fails to evaluate a subscript that reads a variable the step leaves unassigned.
      const assigned = successor.map((name) => `(${name} ?? H.deopt())`);
      const unchanged =
        angle && compileUnchanged(program, angle.subscript, { ...frame, primed: assigned });
      return () =>
        unchanged
          ? getEnabledCode(step, `([${successor.join(", ")}]) => !(${unchanged.emit()})`)
          : getEnabledCode(step);
    }
    const unchanged = atom.subscript && compileUnchanged(program, atom.subscript, frame);
    // The next-state action takes each step of the graph, so <<Next>>_v holds of a step that changes
    // v, unless evaluating Next again shows.
    const isNext =
      atom.scope === check.scope &&
      atom.expression.kind === "Identifier" &&
      check.next.kind === "Identifier" &&
      atom.expression.name === check.next.name &&
      !isExpressionImpure([check.next], program.environment, "any") &&
      !isExpressionImpure([check.next], program.environment, "replayed");
    if (unchanged && isNext) return () => `!(${unchanged.emit()})`;
    const action = expectBool(compileValue(program, atom.expression, frame));
    return () => (unchanged ? `!(${unchanged.emit()}) && (${action.emit()})` : action.emit());
  });
  program.variableTypes.forEach((type) => closeType(type));
  const parameters = program.variableTypes.map((_value, index) => `v${index}`).join(", ");
  const unpack = `const [${parameters}] = state;`;
  // A state predicate reads the state through the variables it unpacks, so it holds of a successor
  // with its parent's values of those.
  const getStatePredicate = (compiled: Compiled) => {
    const body = compiled.emit();
    const reads = new Set(
      [...body.matchAll(/\bv(\d+)\b/g)]
        .map((match) => Number(match[1]))
        .filter((index) => index < program.variableTypes.length),
    );
    const guard = /\b(state|parent)\b/.test(body)
      ? ""
      : `if (parent !== undefined${[...reads].map((index) => ` && state[${index}] === parent[${index}]`).join("")}) return true;`;
    return `(state, parent) => { ${guard} ${unpack} return ${body}; }`;
  };
  const codec: Codec = {
    plains: program.plains,
    functions: [],
    names: { count: 0 },
    writers: new Map(),
    readers: new Map(),
    keyWriters: [new Map(), new Map()],
  };
  const writers = program.variableTypes.map((type, index) => getWriter(codec, type, `v${index}`));
  const readers = program.variableTypes.map((type) => getReader(codec, type));
  // A successor keeps the values of its parent it doesn't change, so it copies their encodings from
  // the parent's, where decode marks where each variable ends.
  const stateWriters = program.variableTypes.map((type, index) => {
    const isSmall = !hasVariableSize(type) && getFixedSize(type) <= MAXIMUM_WRITTEN_SIZE;
    if (isSmall || isMaskType(codec, resolveType(type))) return writers[index];
    const from = `X[${index}]`;
    const to = `X[${index + 1}]`;
    return `if (v${index} === E[${index}]) { t = ${to} - ${from}; if (n + t + ${RESERVED_BYTES} > d.length) { W.size = n; H.addPage(W); d = W.data; n = W.size; } for (let k = ${from}; k < ${to}; k++) d[n++] = Y[k]; } else { ${writers[index]} }`;
  });
  const images = check.symmetry ?? [];
  const isSymmetricKey = images.length > 0 && !check.view;
  // Any order of the variables keys an orbit, and one that compares cheap variables a permutation
  // moves first leaves most images after a few bytes.
  const getKeyCost = (index: number) =>
    !isPermutable(images, program.variableTypes[index])
      ? Infinity
      : (hasVariableSize(program.variableTypes[index]) ? MAXIMUM_INTEGER : 0) +
        getFixedSize(program.variableTypes[index]);
  // A view that is a tuple of variables equals another exactly when those variables do.
  const keyOrder = check.view
    ? [...new Set(getProjectedVariables(program, check.view, new Map()))]
    : program.variableTypes
        .map((_value, index) => index)
        .sort((left, right) => getKeyCost(left) - getKeyCost(right));
  const getKeyWriters = (isPermuted: boolean) =>
    keyOrder.map((index) =>
      getKeyWriter(program, codec, images, program.variableTypes[index], `v${index}`, isPermuted),
    );
  const keyWriters = isSymmetricKey
    ? getKeyWriters(false)
    : keyOrder.map((index) => writers[index]);
  const sites = { count: 0 };
  const signatures = isSymmetricKey
    ? program.variableTypes.map((type, index) =>
        getSignatureCode(program, sites, type, `v${index}`),
      )
    : [];
  const imageWriters = (isSymmetricKey ? getKeyWriters(true) : []).map(
    (writer) =>
      `{ const b = n - W.start - m; ${writer} if (c === 0) { c = H.compareBytes(d, W.start + m + b, n, d, W.start + b); if (c > 0) continue images; } }`,
  );
  // TLC evaluates the view of the smallest image of a state, which it finds comparing the variables
  // in its order.
  const smallest = program.variableTypes.map(() => getName(program, "u"));
  const viewWriters = keyOrder.map((index) =>
    getWriter(codec, program.variableTypes[index], smallest[index]),
  );
  // An image is smaller from the first variable it changes for the smaller, and equal before it. The
  // variables after it note the image, and are built from it only when a comparison or the end
  // reads them. One the comparison had to build keeps that image.
  const pending = program.variableTypes.map(() => getName(program, "g"));
  const built = getName(program, "b");
  const imageComparisons = check.variableOrder.map((index) => {
    const type = program.variableTypes[index];
    const permute = getPermuteCode(program, images, type, `v${index}`);
    const build = permute
      ? `if (${pending[index]} !== -1) { const G = ${pending[index]}; const P = A[G]; ${smallest[index]} = ${permute}; ${pending[index]} = -1; }`
      : "";
    const isBuilt = permute !== undefined && !isComparedInPlace(program, images, resolveType(type));
    const comparison = isBuilt
      ? getCompareCode(program, type, `(${built} = ${permute})`, smallest[index])
      : getImageCompareCode(program, images, type, `v${index}`, smallest[index]);
    const choose = isBuilt
      ? `${smallest[index]} = ${built};`
      : permute
        ? `${pending[index]} = G;`
        : "";
    return { comparison, build, choose, note: permute ? `${pending[index]} = G;` : "" };
  });
  const smallestCode = `${smallest.map((name, index) => `${name} = v${index}; ${pending[index]} = -1;`).join(" ")}
      let ${built};
      images: for (let G = 0; G < A.length; G++) {
        const P = A[G];
        let c = 0;
        let k = -1;
        compare: { ${imageComparisons.map((item, position) => `${item.build} c = ${item.comparison}; if (c > 0) continue images; if (c < 0) { k = ${position}; ${item.choose} break compare; }`).join(" ")} }
        switch (k) { ${imageComparisons.map((_value, position) => `case ${position}: ${imageComparisons[position + 1]?.note ?? ""}`).join(" ")} }
      }
      ${imageComparisons.map((item) => item.build).join(" ")}`;
  const viewKeyCode = `${smallestCode} ${viewWriters.join(" ")}`;
  const symmetricKeyCode = `Z.fill(0);
      ${signatures.join(" ")}
      let F = 0;
      let ties = 0;
      if (M) {
        ties = H.findSmallestImages(Z, M, T);
        F = M.first;
      } else {
        for (let G = 1; G < Q.length; G++) {
          const c = H.compareSignatures(Z, Q[G], Q[F]);
          if (c < 0) { F = G; ties = 0; }
          if (c <= 0) T[ties++] = G - 1;
        }
      }
      if (F === 0) { ${keyWriters.join(" ")} }
      let m = n - W.start;
      images: for (let tie = 0; tie < ties; tie++) {
        const G = T[tie];
        const P = A[G];
        let c = m === 0 && F > 0 ? -1 : 0;
        n = W.start + m;
        if (n + ${RESERVED_BYTES} > d.length) { W.size = n; H.addPage(W); d = W.data; n = W.size; }
        ${imageWriters.join(" ")}
        if (c < 0) { d.copyWithin(W.start, W.start + m, n); m = n - W.start - m; }
      }
      n = W.start + m;`;
  // Emitting adds the comparers the code calls, so all of it is emitted before they are joined.
  const nextCode = next();
  const invariantCodes = invariants.map(getStatePredicate);
  const constraintCodes = constraints.map(getStatePredicate);
  const liveAtomCodes = liveAtoms.map(
    (atom) =>
      `(state, next) => { ${unpack} const [${successor.join(", ")}] = next; return ${atom()}; }`,
  );
  const actionPropertyCodes = actionProperties.map(
    (property) =>
      `(state, next) => { ${unpack} const [${successor.join(", ")}] = next; return (${property.action.emit()}) || (${property.unchanged.emit()}); }`,
  );
  const values = program.plains.values;
  const ranks = new Int32Array(values.length);
  values
    .map((_value, id) => id)
    .sort((left, right) => compareAtoms(values[left], values[right]))
    .forEach((id, rank) => {
      ranks[id] = rank;
    });
  const source = `let d, n, i, t, W, Y, E = [];
  const U = new Int32Array(2);
  let ${smallest.join(", ")}, ${pending.join(", ")};
  const X = new Int32Array(${program.variableTypes.length + 1});
  const T = new Int32Array(Q.length);
  const rv = (first) => { let zigzag = first & 127; let shift = 7; let byte; do { byte = d[i++]; zigzag |= (byte & 127) << shift; shift += 7; } while (byte >= 128); return (zigzag >>> 1) ^ -(zigzag & 1); };
  ${codec.functions.join("\n")}
  ${program.comparers.functions.join("\n")}
  return {
    next: (state, emit) => { ${unpack} ${nextCode} },
    invariants: [${invariantCodes.join(", ")}],
    actionProperties: [${actionPropertyCodes.join(", ")}],
    liveAtoms: [${liveAtomCodes.join(", ")}],
    constraints: [${constraintCodes.join(", ")}],
    encode: (state, arena) => {
      ${unpack}
      W = arena;
      arena.start = arena.size;
      if (arena.size + ${RESERVED_BYTES} > arena.data.length) H.addPage(arena);
      d = arena.data;
      n = arena.size;
      ${stateWriters.join(" ")}
      while ((n & 3) !== 0) d[n++] = 0;
      arena.size = n;
    },
    decode: (cursor) => {
      d = cursor.data;
      i = cursor.position;
      Y = d;
      X[0] = i;
      ${readers.map((reader, index) => `const value${index} = ${reader}; X[${index + 1}] = i;`).join(" ")}
      cursor.position = (i + 3) & ~3;
      E = [${readers.map((_value, index) => `value${index}`).join(", ")}];
      return E;
    },
    writeKey: (state, arena) => {
      ${unpack}
      W = arena;
      arena.start = arena.size;
      if (arena.size + ${RESERVED_BYTES} > arena.data.length) H.addPage(arena);
      d = arena.data;
      n = arena.size;
      ${check.view && images.length > 0 ? viewKeyCode : symmetricKeyCode}
      while ((n & 3) !== 0) d[n++] = 0;
      arena.size = n;
    },
    represent: (state) => {
      ${unpack}
      ${smallestCode}
      return [${smallest.join(", ")}];
    },
  };`;
  const atoms = images.map((table) =>
    Int32Array.from(program.plains.values, (value, id) => {
      const image = typeof value === "object" ? table.get(value.name) : undefined;
      return image === undefined ? id : (program.plains.ids.get(image) ?? unsupported());
    }),
  );
  // A key is the smallest image among those whose sums of moved atoms, in a fixed order of the
  // atoms, are smallest. Which images those are depends only on the state, so its orbit shares it.
  const moved = Int32Array.from(
    program.plains.values.flatMap((_value, id) =>
      atoms.some((table) => table[id] !== id) ? [id] : [],
    ),
  );
  const preimages = [
    moved,
    ...atoms.map((table) => moved.map((atom) => table.findIndex((image) => image === atom))),
  ];
  return new Function("K", "S", "B", "R", "D", "L", "A", "Q", "Z", "M", "H", source)(
    program.constants,
    program.constantSets,
    program.bitmaps,
    ranks,
    program.indexes,
    program.lookups,
    atoms,
    preimages,
    new Int32Array(program.plains.values.length),
    getFullOrbits(preimages),
    HELPERS,
  );
};

interface Orbits {
  // The moved atoms, each orbit's together in the order of the moved atoms.
  atoms: Int32Array;
  starts: Int32Array;
  order: Int32Array;
  // The index of the image with each rank.
  images: Int32Array;
  // After findSmallestImages, the index of an image whose sums are smallest, 0 when the identity's
  // are.
  first: number;
}

// Ranks an arrangement of each orbit's atoms by its Lehmer code, so that every permutation of the
// orbits has its own rank below the product of their factorials.
const getArrangementRank = (arrangement: Int32Array, starts: Int32Array) => {
  let rank = 0;
  for (let orbit = 0; orbit + 1 < starts.length; orbit++) {
    const end = starts[orbit + 1];
    for (let index = starts[orbit]; index < end; index++) {
      let smaller = 0;
      for (let later = index + 1; later < end; later++) {
        if (arrangement[later] < arrangement[index]) smaller++;
      }
      rank = rank * (end - index) + smaller;
    }
  }
  return rank;
};

const reverse = (values: Int32Array, start: number, end: number) => {
  for (let left = start, right = end - 1; left < right; left++, right--) {
    const value = values[left];
    values[left] = values[right];
    values[right] = value;
  }
};

// Steps the atoms of order from start to end to their next arrangement in lexicographic order, or
// back to the first after the last.
const permute = (order: Int32Array, start: number, end: number) => {
  let pivot = end - 2;
  while (pivot >= start && order[pivot] > order[pivot + 1]) pivot--;
  if (pivot < start) {
    reverse(order, start, end);
    return false;
  }
  let successor = end - 1;
  while (order[successor] < order[pivot]) successor--;
  const atom = order[pivot];
  order[pivot] = order[successor];
  order[successor] = atom;
  reverse(order, pivot + 1, end);
  return true;
};

// Steps each run of atoms that tie in sum, the last fastest, and returns false once all of their
// arrangements were visited.
const permuteTies = (sums: Int32Array, order: Int32Array, starts: Int32Array) => {
  for (let orbit = starts.length - 2; orbit >= 0; orbit--) {
    for (let end = starts[orbit + 1]; end > starts[orbit];) {
      let start = end - 1;
      while (start > starts[orbit] && sums[order[start - 1]] === sums[order[end - 1]]) start--;
      if (end - start > 1 && permute(order, start, end)) return true;
      end = start;
    }
  }
  return false;
};

// Comparing the sums under each of fewer images costs less than sorting the orbits.
const MINIMUM_SORTED_IMAGES = 24;

// The orbits of the moved atoms, when the images are every permutation of each orbit.
const getFullOrbits = (preimages: Int32Array[]): Orbits | undefined => {
  if (preimages.length < MINIMUM_SORTED_IMAGES) return undefined;
  const moved = preimages[0];
  const roots = Int32Array.from({ length: Math.max(0, ...moved) + 1 }, (_value, atom) => atom);
  const findRoot = (atom: number): number =>
    roots[atom] === atom ? atom : (roots[atom] = findRoot(roots[atom]));
  preimages.forEach((preimage) =>
    preimage.forEach((atom, position) => {
      roots[findRoot(atom)] = findRoot(moved[position]);
    }),
  );
  const orbits = [...Map.groupBy(moved.keys(), (position) => findRoot(moved[position])).values()];
  const positions = orbits.flat();
  const starts = new Int32Array(orbits.length + 1);
  orbits.forEach((orbit, index) => {
    starts[index + 1] = starts[index] + orbit.length;
  });
  const count = orbits.reduce(
    (product, orbit) =>
      orbit.reduce((factorial, _value, index) => factorial * (index + 1), product),
    1,
  );
  if (count !== preimages.length) return undefined;
  const images = new Int32Array(count).fill(-1);
  preimages.forEach((preimage, image) => {
    const arrangement = Int32Array.from(positions, (position) => preimage[position]);
    images[getArrangementRank(arrangement, starts)] = image;
  });
  if (images.includes(-1)) return undefined;
  const atoms = Int32Array.from(positions, (position) => moved[position]);
  return { atoms, starts, order: new Int32Array(atoms.length), images, first: 0 };
};

interface StateTable {
  slots: Int32Array;
  mask: number;
}

export const runTypedSearch = (
  environment: Environment,
  check: TypedCheck,
): TypedResult | undefined => {
  const run = (plains: Plains): TypedResult => {
    try {
      return search(environment, check, plains);
    } catch (error) {
      const retry = (flags: Partial<Plains>) =>
        run({ ...plains, ids: new Map(), values: [], ...flags });
      if (error === WIDE && plains.isMaskUsed) return retry({ isMaskUsed: false });
      if (error === SPARSE && !plains.isSparse) return retry({ isSparse: true });
      if (error === TUPLED && !plains.isTupled) return retry({ isTupled: true });
      if (error === UNKNOWN && !plains.isGuessed) return retry({ isGuessed: true });
      throw error;
    }
  };
  try {
    return run({
      ids: new Map(),
      values: [],
      isMaskUsed: true,
      isSparse: false,
      isTupled: false,
      isGuessed: false,
    });
  } catch (error) {
    // The interpreter reports these errors when it reruns the search.
    if (
      error === UNSUPPORTED ||
      error === UNKNOWN ||
      error === SPARSE ||
      error === TUPLED ||
      error === DEOPT ||
      error instanceof TlaError ||
      isStackOverflow(error) ||
      // Hosts such as Cloudflare Workers disallow code generation from strings.
      error instanceof EvalError
    ) {
      return undefined;
    }
    throw error;
  }
};

const search = (environment: Environment, check: TypedCheck, plains: Plains): TypedResult => {
  typing.isSparse = plains.isSparse;
  const program: Program = {
    environment,
    plains,
    constants: [],
    constantSets: [],
    bitmaps: [],
    comparers: { names: new Map(), functions: [] },
    permuters: new Map(),
    indexes: [],
    lookups: [],
    variableTypes: environment.variables.map(createVar),
    names: { count: 0 },
    inlining: [],
    recursions: new Map(),
    ways: new Map(),
    isGuessing: plains.isGuessed,
  };
  // Every variable of such a spec is assigned before TLC branches on the next-state relation.
  if (environment.variables.length === 0) return unsupported();
  // The initial states as bytes, so the interpreter's values for them need not stay alive.
  const initialBytes: Bytes = { data: new Uint8Array(1 << 16), size: 0 };
  const initialStarts = { data: new Int32Array(1 << 10), size: 0 };
  forEachInitialState(
    check.init,
    environment,
    (state) => {
      if (!check.holdsInitialPredicates(state)) deopt();
      pushWord(initialStarts, initialBytes.size);
      state.forEach((value, index) => {
        unifyValue(program.variableTypes[index], value, program.plains);
        writeValue(initialBytes, value, program.plains);
      });
      return false;
    },
    check.scope,
  );
  const images = check.symmetry ?? [];
  images.forEach((table) => table.forEach((image) => image && getAtom(program.plains, image)));
  const atoms = getLiveAtoms(check.liveness ?? []);
  const compiled = compileSpec(program, check, atoms);
  const keys = createArena();
  const reader = { page: 0, data: keys.data, position: 0 };
  // For each state expanded, a 1 bit for each new state it found and then a 0 bit, to rebuild the
  // path to a deadlock or a violation. States are expanded in the order they are found, so the 0 bits
  // before a state's 1 bit count the state it was found from.
  const isPathKept =
    check.isDeadlockChecked ||
    check.invariants.length > 0 ||
    check.actionProperties.length > 0 ||
    (check.liveness !== undefined && check.livenessCheck !== "off");
  const finds = { data: new Int32Array(isPathKept ? 1 << 11 : 0), size: 0 };
  // TLC's fingerprints of the states, as low and high words in small pages, one list of pages for
  // each top byte in signed order. Each list sorts alone, and none grows by copying.
  const fingerprints = Array.from({ length: 256 }, () => ({
    pages: new Array<Int32Array>(),
    size: 0,
  }));
  const expanding: { state: Plain[]; index: number } = { state: [], index: -1 };
  const isEncoded = images.length === 0 && check.view === undefined;
  const isImaged = images.length > 0;
  // A slot holds a 64-bit hash of a key and one more than the index of its state. Like TLC with its
  // fingerprints, the search takes a state whose hash it has seen as seen.
  const table: StateTable = { slots: new Int32Array(3 << 17), mask: (1 << 17) - 1 };
  const keyHash = new Int32Array(2);
  const statistics = { generated: 0, distinct: 0, depth: 0 };
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  const isInModel = (state: Plain[], parent?: Plain[]) =>
    compiled.constraints.every((constraint) => constraint(state, parent));
  const holdsInvariants = (state: Plain[], parent?: Plain[]) => {
    for (const invariant of compiled.invariants) if (!invariant(state, parent)) return false;
    return true;
  };
  const holdsActionProperties = (state: Plain[], next: Plain[]) => {
    for (const property of compiled.actionProperties) if (!property(state, next)) return false;
    return true;
  };
  // The successor that violates an invariant or an action property, which ends the search, with the
  // states then queued.
  const violations: { state: Plain[]; queued: number }[] = [];
  const grow = () => {
    const old = table.slots;
    table.slots = new Int32Array(old.length * 2);
    table.mask = table.mask * 2 + 1;
    for (let position = 0; position < old.length; position += 3) {
      if (old[position + 2] === 0) continue;
      let slot = old[position] & table.mask;
      while (table.slots[slot * 3 + 2] !== 0) slot = (slot + 1) & table.mask;
      table.slots.set(old.subarray(position, position + 3), slot * 3);
    }
  };
  // Finds the index of the state whose key was just written, or adds it if isAdded and returns -1.
  // Only the key of a state added stays written.
  const findState = (isAdded: boolean) => {
    hashWords(keys.words, keys.start >> 2, keys.size >> 2, keyHash);
    const low = keyHash[0];
    const high = keyHash[1];
    const slots = table.slots;
    for (let slot = low & table.mask; ; slot = (slot + 1) & table.mask) {
      const entry = slots[slot * 3 + 2];
      if (entry === 0) {
        if (!isAdded) {
          keys.size = keys.start;
          return -1;
        }
        slots[slot * 3] = low;
        slots[slot * 3 + 1] = high;
        slots[slot * 3 + 2] = statistics.distinct + 1;
        if (++statistics.distinct * 4 > (table.mask + 1) * 3) grow();
        return -1;
      }
      if (slots[slot * 3] === low && slots[slot * 3 + 1] === high) {
        keys.size = keys.start;
        return entry - 1;
      }
    }
  };
  const writeKey = (state: Plain[]) =>
    isEncoded ? compiled.encode(state, keys) : compiled.writeKey(state, keys);
  const fingerprinter = createStateFingerprinter(
    program.variableTypes,
    check.variableOrder,
    program.plains,
  );
  // TLC fingerprints the view of a state in place of the state.
  const stateFingerprinter = check.view
    ? createStateFingerprinter(
        program.variableTypes,
        [getProjection(program, check.view, new Map())],
        program.plains,
      )
    : fingerprinter;
  const addFingerprint = (state: Plain[]) => {
    stateFingerprinter.fingerprint(isImaged ? compiled.represent(state) : state);
    const high = stateFingerprinter.words[1];
    const bucket = fingerprints[(high >>> 24) ^ 128];
    const offset = bucket.size % FINGERPRINT_PAGE_SIZE;
    if (offset === 0) bucket.pages.push(new Int32Array(FINGERPRINT_PAGE_SIZE));
    const page = bucket.pages[bucket.pages.length - 1];
    page[offset] = stateFingerprinter.words[0];
    page[offset + 1] = high;
    bucket.size += 2;
  };
  // TLC's fingerprints of the states are taken a page at a time, as the page is reused or at the end.
  const addFingerprints = (data: Uint8Array, end: number) => {
    const cursor: Cursor = { data, position: 0 };
    while (cursor.position < end) addFingerprint(compiled.decode(cursor));
  };
  // Returns the index of a state in the model, or -1 for a state outside it.
  const visit = (state: Plain[], parent?: Plain[], isUnchanged = false) => {
    statistics.generated++;
    // A step that changes no value leads back to the state it starts from, which is stored already.
    if (isUnchanged) return expanding.index;
    if (!isInModel(state, parent)) return -1;
    writeKey(state);
    const found = findState(true);
    if (found !== -1) return found;
    if (!isEncoded) {
      keys.size = keys.start;
      compiled.encode(state, keys);
    }
    return statistics.distinct - 1;
  };
  const readState = () => {
    if (reader.position === keys.ends[reader.page]) {
      if (check.isFingerprinted) addFingerprints(keys.pages[reader.page], reader.position);
      keys.spares.push(keys.pages[reader.page]);
      keys.pages[reader.page] = EMPTY_PAGE;
      reader.page++;
      reader.data = keys.pages[reader.page];
      reader.position = 0;
    }
    return compiled.decode(reader);
  };
  // The states on the path to a state, given the number of states expanded.
  const getPathIndexes = (index: number, expanded: number) => {
    // A state's 1 bit comes after the one of the state it was found from, so one pass back over the
    // bits of the states expanded finds the whole path.
    const indexes = [index];
    let bit = finds.size;
    let zeros = expanded;
    let ones = finds.size - expanded;
    while (indexes[0] >= initialStates.distinct) {
      const found = indexes[0] - initialStates.distinct;
      for (;;) {
        bit--;
        if (((finds.data[bit >> 5] >>> (bit & 31)) & 1) === 0) zeros--;
        else if (--ones === found) break;
      }
      indexes.unshift(zeros);
    }
    return indexes;
  };
  // Each state on the path is the first successor of the one before it with its key, as it was found.
  const getPath = (indexes: number[]) => {
    const findFirst = (states: (emit: (state: Plain[]) => void) => void, target: number) => {
      const found: Plain[][] = [];
      states((state) => {
        if (found.length > 0 || !isInModel(state)) return;
        writeKey(state);
        if (findState(false) === target) found.push(state);
      });
      return found[0];
    };
    const path = [
      findFirst((emit) => {
        const cursor: Cursor = { data: initialBytes.data, position: 0 };
        for (let initial = 0; initial < initialStarts.size; initial++) {
          emit(program.variableTypes.map((type) => readPlain(cursor, type, program.plains)));
        }
      }, indexes[0]),
    ];
    indexes.slice(1).forEach((target) => {
      path.push(findFirst((emit) => compiled.next(path[path.length - 1], emit), target));
    });
    return path;
  };
  const holders = new Map(atoms.map((atom, position) => [atom, compiled.liveAtoms[position]]));
  const holds = (atom: LiveAtom, state: Plain[], next: Plain[]) =>
    (holders.get(atom) ?? unsupported())(state, next);
  const liveFingerprints: number[] = [];
  const live =
    check.liveness &&
    createLiveGraph<Plain[]>(
      check.liveness,
      {
        atoms: { holdsState: (atom, state) => holds(atom, state, state), holdsAction: holds },
        isShared: true,
        // Without symmetry, a state's index identifies it. With it, states of one class share it.
        isSame: isImaged ? isSame : () => true,
        evaluateFrom: (_source, evaluate) => evaluate(),
      },
      {
        getFingerprint: (successor) =>
          (liveFingerprints[successor.index] ??= (() => {
            fingerprinter.fingerprint(successor.state);
            return fingerprinter.words[0];
          })()),
        // The successors of a state the search expanded are all stored.
        forEachActionSuccessors: (_index, state, onSuccessors) => {
          const successors: LiveSuccessor<Plain[]>[] = [];
          compiled.next(state, (successor) => {
            if (!isInModel(successor)) return;
            writeKey(successor);
            const index = findState(false);
            successors.push({ index: index === -1 ? deopt() : index, state: successor });
          });
          onSuccessors(successors);
        },
      },
      environment.runtime.version !== "1.7.4",
    );
  const cursor: Cursor = { data: initialBytes.data, position: 0 };
  for (let index = 0; index < initialStarts.size; index++) {
    const state = program.variableTypes.map((type) => readPlain(cursor, type, program.plains));
    const distinct = statistics.distinct;
    const stateIndex = visit(state);
    const isNew = statistics.distinct > distinct;
    if ((isNew || stateIndex === -1) && !holdsInvariants(state)) deopt();
    if (!isNew) continue;
    statistics.depth = 1;
    live?.addInitialState(stateIndex, state);
  }
  // A path starts from an initial state.
  if (!isPathKept) {
    initialBytes.data = new Uint8Array(0);
    initialStarts.data = new Int32Array(0);
  }
  const initialStates = { generated: statistics.generated, distinct: statistics.distinct };
  const level = { depth: 1, end: statistics.distinct };
  const expansion = { successors: 0, newStates: 0 };
  const liveSuccessors: LiveSuccessor<Plain[]>[] = [];
  const liveChecks = { at: 1024 };
  const onSuccessor = (successor: Plain[], isUnchanged: boolean) => {
    if (violations.length > 0) return;
    expansion.successors++;
    const distinct = statistics.distinct;
    const index = visit(successor, expanding.state, isUnchanged);
    const isNew = statistics.distinct > distinct;
    if (isNew) {
      expansion.newStates++;
      statistics.depth = Math.max(statistics.depth, level.depth + 1);
    }
    // Like the interpreter, the search checks the invariants of a state it hasn't seen, and then the
    // action properties of the step.
    const isViolated =
      ((isNew || index === -1) && !holdsInvariants(successor, expanding.state)) ||
      !holdsActionProperties(expanding.state, successor);
    if (isViolated) violations.push({ state: successor, queued: distinct - expanding.index - 1 });
    if (live && index !== -1) liveSuccessors.push({ index, state: successor });
  };
  const isPlainState = (plain: Plain[], values: Value[]) =>
    values.every((value, variable) =>
      isSame(toPlain(value, program.variableTypes[variable], program.plains), plain[variable]),
    );
  const getTypedPath = (path: Plain[][]): TypedPath => ({
    length: path.length,
    isPathState: (position, values) => isPlainState(path[position], values),
  });
  const getResult = (
    queued: number,
    paths: Pick<TypedResult, "deadlock" | "violation" | "lasso">,
  ): TypedResult => ({
    generatedStates: statistics.generated,
    distinctStates: statistics.distinct,
    queuedStates: queued,
    depth: statistics.depth,
    initialStates,
    outDegrees,
    ...paths,
    forEachFingerprintRun: (visit) => {
      for (let page = reader.page; page < keys.pages.length; page++) {
        addFingerprints(keys.pages[page], keys.ends[page] ?? keys.size);
      }
      fingerprints.forEach((bucket) => {
        const run = new BigInt64Array(bucket.size >> 1);
        const words = new Int32Array(run.buffer);
        bucket.pages.forEach((page, index) => {
          const start = index * FINGERPRINT_PAGE_SIZE;
          words.set(page.subarray(0, Math.min(FINGERPRINT_PAGE_SIZE, bucket.size - start)), start);
        });
        bucket.pages = [];
        visit(run);
      });
    },
  });
  for (let index = 0; index < statistics.distinct; index++) {
    if (index === level.end) {
      level.depth++;
      level.end = statistics.distinct;
    }
    const state = readState();
    expanding.state = state;
    expanding.index = index;
    expansion.successors = 0;
    expansion.newStates = 0;
    liveSuccessors.length = 0;
    compiled.next(state, onSuccessor);
    // After a violation the interpreter adds the state to the behavior graph with the successors it
    // found, which the path to the violation doesn't rebuild.
    if (violations.length > 0 && live) deopt();
    if (violations.length > 0) {
      return getResult(violations[0].queued, {
        deadlock: undefined,
        violation: getTypedPath([
          ...getPath(getPathIndexes(index, expanding.index)),
          violations[0].state,
        ]),
        lasso: undefined,
      });
    }
    const isDeadlocked = expansion.successors === 0 && check.isDeadlockChecked;
    // Like TLC, the interpreter finds a violation of a temporal property early in the part of the
    // graph it checks periodically, and a violation in a part stays one as the graph grows. At a
    // deadlock it reports only a violation found as it adds the deadlocked state.
    const isPeriodic = check.livenessCheck === "default";
    if (isDeadlocked && isPeriodic && live?.findViolation()) deopt();
    if (live?.addState(index, state, liveSuccessors)) deopt();
    const isChecked = index + 1 === liveChecks.at;
    if (isChecked) liveChecks.at *= 2;
    if (isChecked && isPeriodic && !isDeadlocked && live?.findViolation()) deopt();
    if (isDeadlocked) {
      return getResult(statistics.distinct - index - 1, {
        deadlock: getTypedPath(getPath(getPathIndexes(index, expanding.index))),
        violation: undefined,
        lasso: undefined,
      });
    }
    outDegrees[Math.min(expansion.newStates, OUT_DEGREE_BUCKETS - 1)]++;
    if (isPathKept) pushFinds(finds, expansion.newStates);
  }
  const lasso = check.livenessCheck === "off" ? undefined : live?.findViolation();
  if (lasso === undefined) {
    return getResult(0, { deadlock: undefined, violation: undefined, lasso: undefined });
  }
  // With symmetry, a state stands for its class, so the cycle the tier finds may differ from the
  // interpreter's.
  if (isImaged) deopt();
  const found = new Map<number, { index: number; parent: number; state: Plain[] }>();
  [...lasso.prefix, ...lasso.cycle].forEach((target) => {
    const indexes = getPathIndexes(target, statistics.distinct);
    getPath(indexes).forEach((state, position) =>
      found.set(indexes[position], {
        index: indexes[position],
        parent: indexes[position - 1] ?? -1,
        state,
      }),
    );
  });
  return getResult(0, {
    deadlock: undefined,
    violation: undefined,
    lasso: {
      ...lasso,
      // A state comes after the one it was found from, which was found before it.
      states: [...found.values()]
        .toSorted((left, right) => left.index - right.index)
        .map((entry) => ({
          index: entry.index,
          parent: entry.parent,
          isState: (values: Value[]) => isPlainState(entry.state, values),
        })),
    },
  });
};
