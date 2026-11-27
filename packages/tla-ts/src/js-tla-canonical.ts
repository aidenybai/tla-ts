import { defineOperator, getValue } from "./builtins";
import { TlaEvaluationError, TlaModuleError } from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import { prettyPrint } from "./pretty-print";
import { writeStateFingerprint } from "./fingerprints";
import {
  applyFunction,
  CanonicalPage,
  createChangedFunction,
  createFunction,
  createRecord,
  createSet,
  createSortedFunction,
  createTuple,
  EDGE_STARTS,
  ENTRY_CLASS_BITS,
  formatValue,
  getEntryContribution,
  getKeyPosition,
  getNumberHash,
  getPageHash,
  getPageRecord,
  getSequenceElements,
  getValueHash,
  isCanonical,
  isCanonicalPage,
  isUnfingerprintableHash,
  isWrittenSlot,
  markCanonical,
  PAGE_BITS,
  PAGE_SIZE,
  PROMISE_BITS,
  setFunctionClass,
  toFiniteFunction,
  toFiniteSet,
  type FunctionValue,
  type Value,
  valuesEqual,
  WEAK_CLASS_BITS,
  WEAK_MAP_BITS,
} from "./values";

// ESCanonical's CanonicalStateOf, which tla-ts runs natively while TLC runs the module's TLA+
// definition: the same walk, numbering, and renaming, step for step, so that both give the same
// value. JS.tla's state is a record whose objs and envs are heaps [size, pages] of pages of 256
// records, an object's props maps a bucket to a function from key to descriptor, and a JavaScript
// object value is [type |-> "object", id |-> n].
const NAMED_BUCKET = -1;
const PAGE_EDGES = -2;
const EDGE_NODES = EDGE_STARTS + PAGE_SIZE + 1;

interface Realm {
  objects: number;
  environments: number;
}

const stop = (what: string): never => {
  throw new TlaModuleError(
    `The first argument of Assert evaluated to FALSE; the second argument was:\n${prettyPrint(formatValue(`tla-ts can't keep ${what} in a model's state yet`))}`,
    EXIT_STATUS.assertViolation,
  );
};

const hasSlotBit = (edges: Int32Array, bits: number, slot: number) =>
  ((edges[bits + (slot >> 5)] >>> (slot & 31)) & 1) === 1;

const setSlotBit = (edges: Int32Array, bits: number, slot: number) => {
  edges[bits + (slot >> 5)] |= 1 << (slot & 31);
};

const findFieldIndex = (domain: Value[], field: string) => {
  for (let index = 0; index < domain.length; index++) {
    if (domain[index] === field) return index;
  }
  return -1;
};

const get = (record: Value, field: string) => {
  if (
    typeof record === "object" &&
    record.kind === "Function" &&
    record.functionClass === "record"
  ) {
    const index = findFieldIndex(record.domain, field);
    if (index !== -1) return record.range[index];
  }
  return applyFunction(record, field);
};

const getNumber = (record: Value, field: string) => {
  const value = get(record, field);
  if (typeof value !== "number") throw new TlaEvaluationError(`${field} isn't a number`);
  return value;
};

const getString = (record: Value, field: string) => {
  const value = get(record, field);
  if (typeof value !== "string") throw new TlaEvaluationError(`${field} isn't a string`);
  return value;
};

const getList = (value: Value) => {
  const elements = getSequenceElements(value);
  if (elements === undefined) throw new TlaEvaluationError("A sequence was expected");
  return elements;
};

const hasField = (record: Value, field: string) =>
  toFiniteFunction(record).domain.some((key) => key === field);

const isModelValue = (value: Value, name: string) =>
  typeof value === "object" && value.kind === "ModelValue" && value.name === name;

const isAbsentOrEmpty = (value: Value) =>
  isModelValue(value, "Absent") || isModelValue(value, "Empty");

const isPlainOf = (
  value: Value,
  functionClass: FunctionValue["functionClass"],
): value is FunctionValue =>
  typeof value === "object" &&
  value.kind === "Function" &&
  value.writtenKeys === undefined &&
  value.functionClass === functionClass;

const isEveryKept = (changed: Value[], values: Value[]) =>
  changed.length === values.length && changed.every((inner, index) => inner === values[index]);

// A function with each of its values changed, which keeps its domain and its class.
const mapRange = (value: Value, change: (inner: Value, key: Value) => Value): FunctionValue => {
  const functionValue = toFiniteFunction(value);
  let range: Value[] | undefined;
  for (let index = 0; index < functionValue.range.length; index++) {
    const changed = change(functionValue.range[index], functionValue.domain[index]);
    if (changed === functionValue.range[index]) continue;
    range ??= functionValue.range.slice();
    range[index] = changed;
  }
  return range === undefined && functionValue.writtenKeys === undefined
    ? functionValue
    : createChangedFunction(functionValue, range ?? functionValue.range.slice());
};

const toTuple = (list: Value, elements: Value[]) =>
  isPlainOf(list, "tuple") && isEveryKept(elements, list.range) ? list : createTuple(elements);

const mapTuple = (list: Value, change: (inner: Value) => Value) => {
  const elements = getList(list);
  let changed: Value[] | undefined;
  for (let index = 0; index < elements.length; index++) {
    const inner = change(elements[index]);
    if (inner === elements[index]) continue;
    changed ??= elements.slice();
    changed[index] = inner;
  }
  return changed === undefined && isPlainOf(list, "tuple")
    ? list
    : createTuple(changed ?? elements.slice());
};

const toRecord = (record: Value, fields: [string, Value][]) =>
  isPlainOf(record, "record") &&
  record.domain.length === fields.length &&
  fields.every((field) => {
    const index = findFieldIndex(record.domain, field[0]);
    return index !== -1 && record.range[index] === field[1];
  })
    ? record
    : createRecord(fields);

// [record EXCEPT !.field = change(@), ...].
const except = (record: Value, changes: Record<string, (inner: Value, record: Value) => Value>) => {
  const functionValue = toFiniteFunction(record);
  let range: Value[] | undefined;
  for (const key in changes) {
    const index = findFieldIndex(functionValue.domain, key);
    if (index === -1) continue;
    const changed = changes[key](functionValue.range[index], record);
    if (changed === functionValue.range[index]) continue;
    range ??= functionValue.range.slice();
    range[index] = changed;
  }
  return range === undefined && functionValue.writtenKeys === undefined
    ? functionValue
    : createChangedFunction(functionValue, range ?? functionValue.range.slice());
};

// The record at each index of a heap, which reads each page's records once and makes only the
// records it reads of a canonical page.
const createHeapReader = (heap: Value) => {
  const pages = getList(get(heap, "pages"));
  const pageRecords: Value[][] = [];
  return (index: number) => {
    const position = Math.floor((index - 1) / PAGE_SIZE);
    const page = pages[position];
    if (isCanonicalPage(page)) return getPageRecord(page, (index - 1) % PAGE_SIZE);
    pageRecords[position] ??= getList(page);
    return pageRecords[position][(index - 1) % PAGE_SIZE];
  };
};

// A heap of size records in pages.
const createHeap = (before: Value, size: number, pages: Value[]) =>
  toRecord(before, [
    ["size", size],
    ["pages", toTuple(get(before, "pages"), pages)],
  ]);

// The object value [type |-> "object", id |-> number] that value becomes.
const renameRef = (value: Value, number: number) => {
  if (!isPlainOf(value, "record") || value.domain.length !== 2) {
    return createRecord([
      ["type", "object"],
      ["id", number],
    ]);
  }
  const position = findFieldIndex(value.domain, "id");
  if (value.range[position] === number) return value;
  const range = value.range.slice();
  range[position] = number;
  return createChangedFunction(value, range);
};

const ID_HASH = getValueHash("id");

// The hash of the object value that renameRef makes of value, less its id's entry.
const getRefBaseHash = (value: Value) => {
  const renamed = toFiniteFunction(
    isPlainOf(value, "record") && value.domain.length === 2 ? value : renameRef(value, 0),
  );
  const id = renamed.range[findFieldIndex(renamed.domain, "id")];
  return (getValueHash(renamed) - getEntryContribution(ID_HASH, getValueHash(id))) | 0;
};

// How many of its first steps a location shares with the location before, of those into holders.
const getCommonSteps = (located: number[], previousAt: number, at: number) => {
  if (previousAt === -1) return 0;
  const limit = Math.min(located[previousAt + 1], located[at + 1]) - 1;
  let common = 0;
  while (common < limit && located[previousAt + 2 + common] === located[at + 2 + common]) common++;
  return common;
};

// The source's hash, then for each of its locations in turn: its position among the edges, how many
// of the holders that the location before went into it leaves, how many holders it goes into after
// those, and the hashes of each one's key, its value and its entry; then the hashes of its key in its
// holder, its value and its entry, and the base hash of the object value there.
const createHashPlan = (source: Value, hash: number, located: number[]) => {
  let size = 1;
  for (let at = 0, previousAt = -1; at < located.length; at += 2 + located[at + 1]) {
    size += 7 + 3 * (located[at + 1] - 1 - getCommonSteps(located, previousAt, at));
    previousAt = at;
  }
  const plan = new Int32Array(size);
  plan[0] = hash;
  let planAt = 1;
  for (let at = 0, previousAt = -1; at < located.length; at += 2 + located[at + 1]) {
    const depth = located[at + 1] - 1;
    const common = getCommonSteps(located, previousAt, at);
    plan[planAt++] = located[at];
    plan[planAt++] = previousAt === -1 ? 0 : located[previousAt + 1] - 1 - common;
    plan[planAt++] = depth - common;
    let holder = toFiniteFunction(source);
    for (let level = 0; level < depth; level++) {
      const position = located[at + 2 + level] >> 1;
      const inner = holder.range[position];
      if (level >= common) {
        const keyHash = getValueHash(holder.domain[position]);
        const innerHash = getValueHash(inner);
        plan[planAt++] = keyHash;
        plan[planAt++] = innerHash;
        plan[planAt++] = getEntryContribution(keyHash, innerHash);
      }
      holder = toFiniteFunction(inner);
    }
    const position = located[at + 2 + depth] >> 1;
    const leaf = holder.range[position];
    const keyHash = getValueHash(holder.domain[position]);
    const leafHash = getValueHash(leaf);
    plan[planAt++] = keyHash;
    plan[planAt++] = leafHash;
    plan[planAt++] = getEntryContribution(keyHash, leafHash);
    plan[planAt++] = typeof leaf === "object" ? getRefBaseHash(leaf) : 0;
    previousAt = at;
  }
  return plan;
};

// The record at a slot of a canonical page: its source with the node of each of its edges at each
// of its locations, which copies only the values on the paths to the nodes that it changes.
const makeRecord = (page: CanonicalPage, slot: number): Value => {
  const source = page.sources[slot];
  const located = page.locations[slot];
  if (located === undefined) return source;
  const start = page.edges[EDGE_STARTS + slot];
  const root = toFiniteFunction(source);
  const openSources = [root];
  const openRanges = [root.range.slice()];
  const openSteps: number[] = [];
  const openKinds = [0];
  const closeLevel = (level: number) => {
    const inner = openSources[level];
    const range = openRanges[level];
    if (isEveryKept(range, inner.range)) return;
    openRanges[level - 1][openSteps[level - 1] >> 1] =
      openKinds[level] === 1 ? createTuple(range) : createChangedFunction(inner, range);
  };
  let open = 0;
  for (let at = 0; at < located.length; at += 2 + located[at + 1]) {
    const target = page.edges[start + located[at]];
    const depth = located[at + 1] - 1;
    let common = 0;
    while (common < open && common < depth && openSteps[common] === located[at + 2 + common]) {
      common++;
    }
    for (; open > common; open--) closeLevel(open);
    for (; open < depth; open++) {
      const step = located[at + 2 + open];
      const inner = toFiniteFunction(openRanges[open][step >> 1]);
      openSteps[open] = step;
      openSources[open + 1] = inner;
      openRanges[open + 1] = inner.range.slice();
      openKinds[open + 1] = located[at + 3 + open] & 1;
    }
    const range = openRanges[open];
    const position = located[at + 2 + depth] >> 1;
    range[position] = target > 0 ? renameRef(range[position], target) : -target;
  }
  for (; open > 0; open--) closeLevel(open);
  return isEveryKept(openRanges[0], root.range)
    ? source
    : markCanonical(createChangedFunction(root, openRanges[0]));
};

// The slots of a heap at its new numbers. A slot's record is the record that renaming made, or else
// undefined, where its source with its edges by their new numbers at its locations makes it. A slot
// is in place where it is the slot of the heap before at its number, as that was.
interface Slots {
  records: (Value | undefined)[];
  sources: Value[];
  plans: (Int32Array | undefined)[];
  hashes: Int32Array;
  isInPlace: Uint8Array;
  count: number;
}

const createSlots = (size: number): Slots => ({
  // eslint-disable-next-line unicorn/no-new-array
  records: new Array<Value | undefined>(size),
  // eslint-disable-next-line unicorn/no-new-array
  sources: new Array<Value>(size),
  // eslint-disable-next-line unicorn/no-new-array
  plans: new Array<Int32Array | undefined>(size),
  hashes: new Int32Array(size),
  isInPlace: new Uint8Array(size),
  count: 0,
});

const pushSlot = (
  slots: Slots,
  record: Value | undefined,
  source: Value,
  plan: Int32Array | undefined,
  hash: number,
  isInPlace: boolean,
) => {
  const at = slots.count++;
  slots.hashes[at] = hash;
  slots.isInPlace[at] = isInPlace ? 1 : 0;
  slots.records[at] = record;
  slots.sources[at] = source;
  slots.plans[at] = plan;
};

// The classes of weak collections, whose renaming keeps the entries whose keys the walk reaches.
const WEAK_CLASSES = new Set(["weakMap", "weakSet", "weakRef"]);

// Renaming makes these classes' entries anew, which substituting along a path can't give.
const ENTRY_CLASSES = new Set(["map", "set"]);

// Where the walk is in a record, and where it found each node the record refers to. A step is the
// position of the value it goes into in the range of the value that holds it, times two, plus one
// where renaming makes that holder anew as a tuple rather than as a changed function. located holds
// for each node: its position among the record's edges, its number of steps, and the steps.
interface Path {
  steps: number[];
  located: number[];
  count: number;
}

const compareSteps = (located: number[], left: number, right: number) => {
  for (let index = 0; index < Math.min(located[left + 1], located[right + 1]); index++) {
    const difference = located[left + 2 + index] - located[right + 2 + index];
    if (difference !== 0) return difference;
  }
  return located[left + 1] - located[right + 1];
};

const sortLocated = (located: number[]) => {
  let isSorted = true;
  let previous = -1;
  for (let at = 0; isSorted && at < located.length; at += 2 + located[at + 1]) {
    isSorted = previous === -1 || compareSteps(located, previous, at) <= 0;
    previous = at;
  }
  if (isSorted) return located.slice();
  const starts: number[] = [];
  for (let at = 0; at < located.length; at += 2 + located[at + 1]) starts.push(at);
  // eslint-disable-next-line unicorn/no-new-array
  const sorted = new Array<number>(located.length);
  let sortedAt = 0;
  starts
    .sort((left, right) => compareSteps(located, left, right))
    .forEach((start) => {
      for (let index = start; index < start + 2 + located[start + 1]; index++) {
        sorted[sortedAt++] = located[index];
      }
    });
  return sorted;
};

const pushRef = (node: number, refs: number[], path: Path) => {
  refs.push(node);
  path.located.push(path.count++, path.steps.length);
  for (let index = 0; index < path.steps.length; index++) path.located.push(path.steps[index]);
};

const objectRef = (value: Value, realm: Realm, refs: number[], path: Path) => {
  if (getString(value, "type") === "object") {
    const id = getNumber(value, "id");
    if (id > realm.objects) pushRef(id, refs, path);
  }
};

const maybeRef = (value: Value, realm: Realm, refs: number[], path: Path) => {
  if (!isAbsentOrEmpty(value)) objectRef(value, realm, refs, path);
};

const environmentRef = (environment: Value, realm: Realm, refs: number[], path: Path) => {
  if (typeof environment !== "number")
    throw new TlaEvaluationError("An environment isn't a number");
  if (environment > realm.environments) pushRef(-environment, refs, path);
};

type Refs = (value: Value, realm: Realm, refs: number[], path: Path) => void;

const fieldRefs = (
  record: Value,
  field: string,
  realm: Realm,
  refs: number[],
  path: Path,
  getRefs: Refs,
) => {
  const value = get(record, field);
  path.steps.push(findFieldIndex(toFiniteFunction(record).domain, field) * 2);
  getRefs(value, realm, refs, path);
  path.steps.pop();
};

const tupleRefs = (list: Value, realm: Realm, refs: number[], path: Path, getRefs: Refs) => {
  const elements = getList(list);
  for (let index = 0; index < elements.length; index++) {
    path.steps.push(index * 2 + 1);
    getRefs(elements[index], realm, refs, path);
    path.steps.pop();
  }
};

const valueRefs = (list: Value, realm: Realm, refs: number[], path: Path) =>
  tupleRefs(list, realm, refs, path, maybeRef);

const elementRefs = (element: Value, realm: Realm, refs: number[], path: Path) => {
  fieldRefs(element, "value", realm, refs, path, maybeRef);
  fieldRefs(element, "get", realm, refs, path, maybeRef);
  fieldRefs(element, "set", realm, refs, path, maybeRef);
  if (!hasField(element, "init")) return;
  if (
    getList(get(element, "decorators")).length > 0 ||
    !isModelValue(get(element, "extra"), "Empty")
  ) {
    stop("a decorated class element");
  }
  fieldRefs(element, "init", realm, refs, path, maybeRef);
  fieldRefs(element, "initializers", realm, refs, path, valueRefs);
};

const elementListRefs = (list: Value, realm: Realm, refs: number[], path: Path) =>
  tupleRefs(list, realm, refs, path, elementRefs);

const PLAIN_CLASSES = new Set([
  "ordinary",
  "array",
  "error",
  "boolean",
  "number",
  "string",
  "date",
  "bigint",
  "symbol",
  "namespace",
  "regexp",
  "arrayBuffer",
]);

// The classes that view an ArrayBuffer, which their slots' buffer holds.
const VIEW_CLASSES = new Set(["typedArray", "dataView"]);

// The built-in functions whose data is a value: the cell of a promise's resolving functions or
// capability, and the host's: console.createTask's function that runs a task, the getter of a
// global's value, and the traps of the proxies that stand for process.hrtime, an AsyncResource, and
// a TextEncoder, of the value each one reads, the call of performance.now, of performance, and the
// calls of a replaceable accessor's getter and setter, of the cell that holds its value.
const OBJECT_DATA_BUILTINS = new Set([
  "Promise resolveFunction",
  "Promise rejectFunction",
  "Promise capabilityExecutor",
  "Module createTask",
  "Module hostGlobal",
  "Module hrtimeGet",
  "Module asyncResourceGet",
  "Module textEncoderGet",
  "Module performanceNow",
  "Module replaceableGet",
  "Module replaceableSet",
]);

const BUILTIN_SLOTS = ["constructor", "data", "id", "initialName", "realm"];

const getDomain = (record: Value) =>
  toFiniteFunction(record)
    .domain.map((key) => String(key))
    .sort();

const isObjectDataBuiltin = (slots: Value) =>
  OBJECT_DATA_BUILTINS.has(getList(get(slots, "id")).map(String).join(" "));

// The host's AsyncResource constructor, whose data is a record of the functions run and destroy.
const isAsyncResourceBuiltin = (slots: Value) =>
  getList(get(slots, "id")).map(String).join(" ") === "Module asyncResource";

// The slots of a class's default constructor, a built-in that holds the class's elements.
const DEFAULT_CONSTRUCTOR_SLOTS = [
  ...BUILTIN_SLOTS,
  "ctorKind",
  "fields",
  "initializers",
  "privateMethods",
  "sourceText",
].sort();

const isDefaultConstructor = (slots: Value) => {
  const id = getList(get(slots, "id"));
  return id.length === 2 && id[0] === "Class" && id[1] === "default";
};

// The built-in functions whose data refers to nothing: the host's that stop, and the reads of a
// host method's name and length, whose data is a name,
// a CommonJS module's require, whose data is its file's number, and the RegExp constructor, whose
// data is the strings of its last match, as RegExp.$1 reads.
const NAMED_BUILTINS = new Set([
  "Module hostStop",
  "Module hostMethodGet",
  "Module hostQuietConstructor",
  "Module require",
  "RegExp constructor",
]);

const isNamedBuiltin = (slots: Value) =>
  NAMED_BUILTINS.has(getList(get(slots, "id")).map(String).join(" "));

const isPlainBuiltin = (slots: Value) =>
  getDomain(slots).join() === BUILTIN_SLOTS.join() &&
  (isObjectDataBuiltin(slots) ||
    isAsyncResourceBuiltin(slots) ||
    isNamedBuiltin(slots) ||
    isModelValue(get(slots, "data"), "Empty"));

const classElementRefs = (slots: Value, realm: Realm, refs: number[], path: Path) => {
  fieldRefs(slots, "fields", realm, refs, path, elementListRefs);
  fieldRefs(slots, "privateMethods", realm, refs, path, elementListRefs);
  if (!isModelValue(get(slots, "initializers"), "Empty")) {
    fieldRefs(slots, "initializers", realm, refs, path, valueRefs);
  }
};

const mapEntryRefs = (entry: Value, realm: Realm, refs: number[], path: Path) => {
  if (isModelValue(entry, "Empty")) return;
  fieldRefs(entry, "key", realm, refs, path, maybeRef);
  fieldRefs(entry, "value", realm, refs, path, maybeRef);
};

const mapDataRefs = (list: Value, realm: Realm, refs: number[], path: Path) =>
  tupleRefs(list, realm, refs, path, mapEntryRefs);

const asyncResourceRefs = (data: Value, realm: Realm, refs: number[], path: Path) => {
  fieldRefs(data, "run", realm, refs, path, objectRef);
  fieldRefs(data, "destroy", realm, refs, path, objectRef);
};

const slotRefs = (object: Value, realm: Realm, refs: number[], path: Path) => {
  const objectClass = getString(object, "class");
  const slots = get(object, "slots");
  path.steps.push(findFieldIndex(toFiniteFunction(object).domain, "slots") * 2);
  if (PLAIN_CLASSES.has(objectClass)) {
    if (hasField(slots, "initializers")) {
      fieldRefs(slots, "initializers", realm, refs, path, valueRefs);
    }
  } else if (objectClass === "function") {
    fieldRefs(slots, "env", realm, refs, path, environmentRef);
    fieldRefs(slots, "home", realm, refs, path, maybeRef);
    classElementRefs(slots, realm, refs, path);
  } else if (objectClass === "bound") {
    fieldRefs(slots, "target", realm, refs, path, objectRef);
    fieldRefs(slots, "this", realm, refs, path, maybeRef);
    fieldRefs(slots, "args", realm, refs, path, valueRefs);
  } else if (objectClass === "map") {
    fieldRefs(slots, "mapData", realm, refs, path, mapDataRefs);
  } else if (objectClass === "set") {
    fieldRefs(slots, "setData", realm, refs, path, valueRefs);
  } else if (VIEW_CLASSES.has(objectClass)) {
    fieldRefs(slots, "buffer", realm, refs, path, maybeRef);
  } else if (objectClass === "proxy") {
    fieldRefs(slots, "target", realm, refs, path, maybeRef);
    fieldRefs(slots, "handler", realm, refs, path, maybeRef);
  } else if (objectClass === "promise") {
    if (getString(slots, "state") === "pending") stop("a pending promise");
    fieldRefs(slots, "result", realm, refs, path, maybeRef);
  } else if (objectClass === "cell" && getDomain(slots).join() === "promise") {
    fieldRefs(slots, "promise", realm, refs, path, maybeRef);
  } else if (objectClass === "cell" && getDomain(slots).join() === "reject,resolve") {
    fieldRefs(slots, "resolve", realm, refs, path, maybeRef);
    fieldRefs(slots, "reject", realm, refs, path, maybeRef);
  } else if (objectClass === "cell" && getDomain(slots).join() === "value") {
    fieldRefs(slots, "value", realm, refs, path, maybeRef);
  } else if (objectClass === "weakMap" || objectClass === "weakSet" || objectClass === "weakRef") {
    // A weak collection's entries refer to objects only where the walk reaches their keys.
  } else if (objectClass === "finalizationRegistry" && getList(get(slots, "cells")).length === 0) {
    // A registry holds no cell, as the runtime stops where a program registers a target.
    fieldRefs(slots, "cleanupCallback", realm, refs, path, objectRef);
  } else if (objectClass === "builtin" && isPlainBuiltin(slots)) {
    if (isObjectDataBuiltin(slots)) fieldRefs(slots, "data", realm, refs, path, objectRef);
    if (isAsyncResourceBuiltin(slots)) {
      fieldRefs(slots, "data", realm, refs, path, asyncResourceRefs);
    }
  } else if (
    objectClass === "builtin" &&
    isDefaultConstructor(slots) &&
    getDomain(slots).join() === DEFAULT_CONSTRUCTOR_SLOTS.join()
  ) {
    classElementRefs(slots, realm, refs, path);
  } else {
    stop(`an object of class ${objectClass}`);
  }
  path.steps.pop();
};

// An array index's number, from the code units of its canonical decimal string.
const getIndex = (key: Value) =>
  getList(get(key, "value")).reduce<number>((total, unit) => total * 10 + Number(unit) - 48, 0);

const KEY_TYPES = ["string", "symbol"];

const descriptorRefs = (descriptor: Value, realm: Realm, refs: number[], path: Path) => {
  fieldRefs(descriptor, "value", realm, refs, path, maybeRef);
  fieldRefs(descriptor, "get", realm, refs, path, maybeRef);
  fieldRefs(descriptor, "set", realm, refs, path, maybeRef);
};

const positionRefs = (
  holder: FunctionValue,
  position: number,
  realm: Realm,
  refs: number[],
  path: Path,
  getRefs: Refs,
) => {
  path.steps.push(position * 2);
  getRefs(holder.range[position], realm, refs, path);
  path.steps.pop();
};

// The refs of the descriptors of an index bucket's keys, by their indexes ascending.
const bucketRefs = (value: Value, realm: Realm, refs: number[], path: Path) => {
  const bucket = toFiniteFunction(value);
  let previous = -Infinity;
  let isInOrder = true;
  for (let position = 0; position < bucket.domain.length && isInOrder; position++) {
    const keyIndex = getIndex(bucket.domain[position]);
    isInOrder = keyIndex >= previous;
    previous = keyIndex;
  }
  if (isInOrder) {
    for (let position = 0; position < bucket.range.length; position++) {
      positionRefs(bucket, position, realm, refs, path, descriptorRefs);
    }
    return;
  }
  bucket.domain
    .map((key, position) => ({ index: getIndex(key), position }))
    .sort((left, right) => left.index - right.index)
    .forEach((pair) => positionRefs(bucket, pair.position, realm, refs, path, descriptorRefs));
};

// The refs of an object's properties in OwnKeysOf's order: index keys ascending, then the string
// keys and the symbol keys in the order they were added.
const objectRefs = (object: Value, realm: Realm, refs: number[], path: Path) => {
  fieldRefs(object, "proto", realm, refs, path, maybeRef);
  const props = toFiniteFunction(get(object, "props"));
  path.steps.push(findFieldIndex(toFiniteFunction(object).domain, "props") * 2);
  let namedPosition = -1;
  let isAscending = true;
  let previousBucket = -Infinity;
  for (let position = 0; position < props.domain.length; position++) {
    const bucket = props.domain[position];
    if (bucket === NAMED_BUCKET) namedPosition = position;
    else {
      if (Number(bucket) < previousBucket) isAscending = false;
      previousBucket = Number(bucket);
    }
  }
  if (isAscending) {
    for (let position = 0; position < props.domain.length; position++) {
      if (props.domain[position] !== NAMED_BUCKET) {
        positionRefs(props, position, realm, refs, path, bucketRefs);
      }
    }
  } else {
    props.domain
      .map((bucket, position) => ({ bucket, position }))
      .filter((entry) => entry.bucket !== NAMED_BUCKET)
      .sort((left, right) => Number(left.bucket) - Number(right.bucket))
      .forEach((entry) => positionRefs(props, entry.position, realm, refs, path, bucketRefs));
  }
  const keys = getList(get(object, "keys"));
  for (const type of KEY_TYPES) {
    for (let index = 0; index < keys.length; index++) {
      if (getString(keys[index], "type") !== type) continue;
      if (namedPosition === -1) throw new TlaEvaluationError("A key has no bucket");
      const named = toFiniteFunction(props.range[namedPosition]);
      path.steps.push(namedPosition * 2);
      positionRefs(named, getKeyPosition(named, keys[index]), realm, refs, path, descriptorRefs);
      path.steps.pop();
    }
  }
  path.steps.pop();
  fieldRefs(object, "privs", realm, refs, path, elementListRefs);
  slotRefs(object, realm, refs, path);
};

// LexLess on sequences of code units: a prefix first, then by the first unit that differs.
const compareUnits = (left: Value[], right: Value[]) => {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    if (left[index] !== right[index]) return Number(left[index]) - Number(right[index]);
  }
  return left.length - right.length;
};

const bindingValueRefs = (binding: Value, realm: Realm, refs: number[], path: Path) =>
  fieldRefs(binding, "value", realm, refs, path, maybeRef);

const bindingRefs = (bindings: Value, realm: Realm, refs: number[], path: Path) => {
  const functionValue = toFiniteFunction(bindings);
  functionValue.domain
    .map((name, position) => ({ units: getList(name), position }))
    .sort((left, right) => compareUnits(left.units, right.units))
    .forEach((entry) =>
      positionRefs(functionValue, entry.position, realm, refs, path, bindingValueRefs),
    );
};

const environmentRefs = (environment: Value, realm: Realm, refs: number[], path: Path) => {
  fieldRefs(environment, "outer", realm, refs, path, environmentRef);
  const kind = getString(environment, "kind");
  if (kind === "declarative" || kind === "catch") {
    fieldRefs(environment, "b", realm, refs, path, bindingRefs);
  } else if (kind === "function") {
    fieldRefs(environment, "b", realm, refs, path, bindingRefs);
    fieldRefs(environment, "this", realm, refs, path, maybeRef);
    fieldRefs(environment, "fn", realm, refs, path, objectRef);
    fieldRefs(environment, "newTarget", realm, refs, path, maybeRef);
  } else if (kind === "object") fieldRefs(environment, "obj", realm, refs, path, objectRef);
  else if (kind === "global") fieldRefs(environment, "this", realm, refs, path, maybeRef);
  else if (kind === "module") fieldRefs(environment, "b", realm, refs, path, bindingRefs);
  else stop(`an environment of kind ${kind}`);
};

// What a module record refers to: its environment, its namespaces, its import.meta, a synthetic
// module's value, its module source, the capability of its evaluation, and what it threw.
const moduleRefs = (module: Value, realm: Realm, refs: number[], path: Path) => {
  const environment = get(module, "env");
  if (environment !== 0) environmentRef(environment, realm, refs, path);
  ["namespace", "deferredNamespace", "meta", "value", "moduleSource", "error"].forEach((field) =>
    maybeRef(get(module, field), realm, refs, path),
  );
  const capability = get(module, "capability");
  if (isModelValue(capability, "Empty")) return;
  objectRef(get(capability, "promise"), realm, refs, path);
  maybeRef(get(capability, "resolve"), realm, refs, path);
  maybeRef(get(capability, "reject"), realm, refs, path);
};

const NULL = createRecord([["type", "null"]]);

// CanonicalStateOf of a state. Where isIncremental, a record that a canonicalization made stays as
// it is, rather than renamed anew, where the walk numbers each node it refers to as their numbers
// already are, which renaming gives back equal; and so does a page of such records. The
// state is then the same value, whose records and pages that a step left alone are the same
// objects as before it, whose hashes they hold.
const canonicalStateOf = (state: Value, initial: Value, isIncremental: boolean): Value => {
  const isEmptyList = (field: string) => getList(get(state, field)).length === 0;
  if (
    !isEmptyList("jobs") ||
    !isEmptyList("tasks") ||
    !valuesEqual(get(state, "callers"), NULL) ||
    getList(get(state, "realms")).length > 1 ||
    !isEmptyList("waiters") ||
    !isEmptyList("disposables")
  ) {
    stop("pending work");
  }
  // The CommonJS modules that require loaded, by file, whose module objects the walk starts from.
  const required = toFiniteFunction(get(state, "required"));
  if (required.range.some((entry) => get(entry, "loaded") !== true)) {
    stop("a module that require is loading");
  }
  const objs = get(state, "objs");
  const envs = get(state, "envs");
  const initialObjs = get(initial, "objs");
  const realm = {
    objects: getNumber(initialObjs, "size"),
    environments: getNumber(get(initial, "envs"), "size"),
  };
  const pages = getList(get(objs, "pages"));
  const initialPages = getList(get(initialObjs, "pages"));
  const getObject = createHeapReader(objs);
  const getInitialObject = createHeapReader(initialObjs);
  const getEnvironment = createHeapReader(envs);
  const environmentPages = getList(get(envs, "pages"));
  // A heap's pages that canonicalStateOf made against this realm, whose records' edges it reads.
  const getCanonicalPages = (heapPages: Value[]) =>
    heapPages.map((page) =>
      isIncremental &&
      isCanonicalPage(page) &&
      page.edges[0] === realm.objects &&
      page.edges[1] === realm.environments
        ? page
        : undefined,
    );
  const objectCanonicalPages = getCanonicalPages(pages);
  const environmentCanonicalPages = getCanonicalPages(environmentPages);
  const getSlot = (node: number) => ((node > 0 ? node : -node) - 1) & (PAGE_SIZE - 1);
  // The page of a node whose record a step didn't write since CanonicalStateOf made the page.
  const getPage = (node: number) => {
    const page = (node > 0 ? objectCanonicalPages : environmentCanonicalPages)[
      ((node > 0 ? node : -node) - 1) >> PAGE_BITS
    ];
    return page === undefined || isWrittenSlot(page, getSlot(node)) ? undefined : page;
  };
  const changed: number[] = [];
  initialPages.forEach((page, position) => {
    if (valuesEqual(pages[position], page)) return;
    const high = Math.min((position + 1) * PAGE_SIZE, realm.objects);
    for (let id = position * PAGE_SIZE + 1; id <= high; id++) {
      if (!valuesEqual(getObject(id), getInitialObject(id))) changed.push(id);
    }
  });
  // The nodes that each walked record refers to, an object by its id and an environment by its
  // number negated: from where a node's edges start, its count and then the nodes. A node whose
  // edges the walk read from its page starts at PAGE_EDGES, and they stay there.
  const edges: number[] = [];
  const objectEdgeStarts = new Int32Array(getNumber(objs, "size") + 1).fill(-1);
  const environmentEdgeStarts = new Int32Array(getNumber(envs, "size") + 1).fill(-1);
  const getEdgeArray = (start: number, page: CanonicalPage | undefined) =>
    page !== undefined && start === PAGE_EDGES ? page.edges : edges;
  const getEdgeFirst = (node: number, start: number, array: ArrayLike<number>) =>
    array === edges ? start + 1 : array[EDGE_STARTS + getSlot(node)];
  const getEdgeEnd = (node: number, start: number, array: ArrayLike<number>) =>
    array === edges ? start + 1 + edges[start] : array[EDGE_STARTS + getSlot(node) + 1];
  const startEdges = (node: number) => {
    const start = edges.length;
    if (node > 0) objectEdgeStarts[node] = start;
    else environmentEdgeStarts[-node] = start;
    edges.push(0);
    return start;
  };
  // undefined where renaming the record moved what it holds.
  const walkedLocations = new Map<number, number[] | undefined>();
  const path: Path = { steps: [], located: [], count: 0 };
  const endWalked = (node: number, start: number) => {
    edges[start] = edges.length - start - 1;
    walkedLocations.set(node, sortLocated(path.located));
    path.located.length = 0;
    path.count = 0;
  };
  // Reaches the nodes that the record refers to, and gives whether it is a WeakMap.
  const walkRecord = (node: number) => {
    const page = getPage(node);
    if (page !== undefined) {
      if (node > 0) objectEdgeStarts[node] = PAGE_EDGES;
      else environmentEdgeStarts[-node] = PAGE_EDGES;
      reachEdges(node, PAGE_EDGES, page);
      const slot = getSlot(node);
      return hasSlotBit(page.edges, WEAK_MAP_BITS, slot);
    }
    const start = startEdges(node);
    if (node < 0) {
      environmentRefs(getEnvironment(-node), realm, edges, path);
      endWalked(node, start);
      reachEdges(node, start, undefined);
      return false;
    }
    const object = getObject(node);
    objectRefs(object, realm, edges, path);
    endWalked(node, start);
    reachEdges(node, start, undefined);
    return getString(object, "class") === "weakMap";
  };
  // The breadth-first walk numbers each node where it first reaches it, from the roots and then
  // from the nodes that each node it numbered refers to.
  const objectNumbers = new Int32Array(objectEdgeStarts.length);
  const environmentNumbers = new Int32Array(environmentEdgeStarts.length);
  const isNumbered = (node: number) =>
    (node > 0 ? objectNumbers[node] : environmentNumbers[-node]) !== 0;
  const order: number[] = [];
  const weakMaps: number[] = [];
  let objectCount = 0;
  let environmentCount = 0;
  const reach = (node: number) => {
    if (isNumbered(node)) return;
    if (node > 0) {
      objectCount++;
      objectNumbers[node] = realm.objects + objectCount;
    } else {
      environmentCount++;
      environmentNumbers[-node] = realm.environments + environmentCount;
    }
    order.push(node);
  };
  const reachEdges = (node: number, start: number, page: CanonicalPage | undefined) => {
    const array = getEdgeArray(start, page);
    const end = getEdgeEnd(node, start, array);
    for (let index = getEdgeFirst(node, start, array); index < end; index++) reach(array[index]);
  };
  for (let environment = 1; environment <= realm.environments; environment++) {
    walkRecord(-environment);
  }
  for (const id of changed) {
    const start = startEdges(id);
    objectRefs(getObject(id), realm, edges, path);
    endWalked(id, start);
    reachEdges(id, start, undefined);
  }
  const roots: number[] = [];
  const rootPath: Path = { steps: [], located: [], count: 0 };
  const templates = toFiniteFunction(get(state, "templates"));
  templates.domain
    .map((key, position) => ({ key: Number(key), value: templates.range[position] }))
    .sort((left, right) => left.key - right.key)
    .forEach((entry) => objectRef(entry.value, realm, roots, rootPath));
  getList(get(state, "modules")).forEach((module) => moduleRefs(module, realm, roots, rootPath));
  required.domain
    .map((file, position) => ({ file: Number(file), entry: required.range[position] }))
    .sort((left, right) => left.file - right.file)
    .forEach((pair) => objectRef(get(pair.entry, "module"), realm, roots, rootPath));
  // The handler of the host's proxies and the host's import, which the state names by object.
  maybeRef(get(state, "hostHandler"), realm, roots, rootPath);
  maybeRef(get(state, "hostImport"), realm, roots, rootPath);
  roots.forEach(reach);
  let head = 0;
  const walk = () => {
    for (; head < order.length; head++) {
      const node = order[head];
      if (walkRecord(node)) weakMaps.push(node);
    }
  };
  walk();
  // A weak collection's key that the walk reached, which a step can still read the entry by, and
  // its new number.
  const getWeakKeyNumber = (key: Value) => {
    if (getString(key, "type") !== "object") stop("a weak collection keyed by a symbol");
    const id = getNumber(key, "id");
    return id <= realm.objects ? id : objectNumbers[id] === 0 ? undefined : objectNumbers[id];
  };
  // The walk again from the objects that the values of the walked WeakMaps' reached entries refer
  // to, by the walk's order of the WeakMaps and each one's keys by their new numbers, until it
  // reaches no more.
  for (;;) {
    const more: number[] = [];
    weakMaps.forEach((node) => {
      const data = toFiniteFunction(get(get(getObject(node), "slots"), "weakMapData"));
      data.domain
        .flatMap((key, position) => {
          const number = getWeakKeyNumber(key);
          return number === undefined ? [] : [{ number, value: data.range[position] }];
        })
        .sort((left, right) => left.number - right.number)
        .forEach((entry) => maybeRef(entry.value, realm, more, rootPath));
    });
    more.forEach(reach);
    if (head === order.length) break;
    walk();
  }
  const getNew = (node: number) => {
    const number = node > 0 ? objectNumbers[node] : environmentNumbers[-node];
    if (number === 0) throw new TlaEvaluationError("A reference to a dropped node");
    return number;
  };
  const renameValue = (value: Value): Value => {
    if (getString(value, "type") !== "object") return value;
    const id = getNumber(value, "id");
    return id <= realm.objects ? value : renameRef(value, getNew(id));
  };
  const renameMaybe = (value: Value) => (isAbsentOrEmpty(value) ? value : renameValue(value));
  const renameEnvironment = (environment: Value) =>
    typeof environment === "number" && environment > realm.environments
      ? getNew(-environment)
      : environment;
  const renameValues = (list: Value) => mapTuple(list, renameMaybe);
  const descriptorChanges = { value: renameMaybe, get: renameMaybe, set: renameMaybe };
  const renameDescriptor = (descriptor: Value) => except(descriptor, descriptorChanges);
  const initChanges = { init: renameMaybe, initializers: renameValues };
  const renameElement = (element: Value) => {
    const renamed = except(element, descriptorChanges);
    return hasField(element, "init") ? except(renamed, initChanges) : renamed;
  };
  const renameElements = (list: Value) => mapTuple(list, renameElement);
  const renameInitializers = (inner: Value) =>
    isModelValue(inner, "Empty") ? inner : renameValues(inner);
  const plainChanges = {
    initializers: renameValues,
    trace: (trace: Value) => toRecord(trace, [["dropped", true]]),
  };
  const viewChanges = { buffer: renameMaybe };
  const functionChanges = {
    env: renameEnvironment,
    home: renameMaybe,
    fields: renameElements,
    privateMethods: renameElements,
    initializers: renameInitializers,
  };
  const renameSlots = (object: Value) => {
    const objectClass = getString(object, "class");
    const slots = get(object, "slots");
    if (PLAIN_CLASSES.has(objectClass)) return except(slots, plainChanges);
    if (VIEW_CLASSES.has(objectClass)) return except(slots, viewChanges);
    switch (objectClass) {
      case "function":
        return except(slots, functionChanges);
      case "bound":
        return except(slots, { target: renameValue, this: renameMaybe, args: renameValues });
      case "map":
        return except(slots, {
          mapData: (inner) =>
            toTuple(
              inner,
              getList(inner)
                .filter((entry) => !isModelValue(entry, "Empty"))
                .map((entry) =>
                  toRecord(entry, [
                    ["key", renameMaybe(get(entry, "key"))],
                    ["value", renameMaybe(get(entry, "value"))],
                  ]),
                ),
            ),
        });
      case "set":
        return except(slots, {
          setData: (inner) =>
            toTuple(
              inner,
              getList(inner)
                .filter((entry) => !isModelValue(entry, "Empty"))
                .map(renameMaybe),
            ),
        });
      case "weakMap":
        return except(slots, {
          weakMapData: (inner) => {
            const data = toFiniteFunction(inner);
            return createFunction(
              data.domain.flatMap((key, position): [Value, Value][] =>
                getWeakKeyNumber(key) === undefined
                  ? []
                  : [[renameValue(key), renameMaybe(data.range[position])]],
              ),
            );
          },
        });
      case "weakRef":
        return except(slots, {
          weakRefTarget: (target) =>
            getWeakKeyNumber(target) === undefined
              ? stop("a WeakRef whose target nothing else reaches")
              : renameValue(target),
        });
      case "finalizationRegistry":
        return except(slots, { cleanupCallback: renameValue });
      case "weakSet":
        return except(slots, {
          weakSetData: (inner) =>
            createSet(
              toFiniteSet(inner)
                .elements.filter((key) => getWeakKeyNumber(key) !== undefined)
                .map(renameValue),
            ),
        });
      case "promise":
        return except(slots, { result: renameMaybe });
      case "cell":
        return mapRange(slots, renameMaybe);
      case "builtin":
        return isDefaultConstructor(slots) && hasField(slots, "fields")
          ? except(slots, {
              fields: renameElements,
              privateMethods: renameElements,
              initializers: renameInitializers,
            })
          : isObjectDataBuiltin(slots)
            ? except(slots, { data: renameValue })
            : isAsyncResourceBuiltin(slots)
              ? except(slots, {
                  data: (data) => except(data, { run: renameValue, destroy: renameValue }),
                })
              : slots;
      default:
        return except(slots, { target: renameMaybe, handler: renameMaybe });
    }
  };
  const renameProps = (props: Value) => {
    const buckets = toFiniteFunction(props);
    let range: Value[] | undefined;
    let isEmptied = false;
    for (let position = 0; position < buckets.range.length; position++) {
      const bucket = buckets.range[position];
      if (toFiniteFunction(bucket).domain.length === 0) {
        isEmptied = true;
        continue;
      }
      const renamed = mapRange(bucket, renameDescriptor);
      if (renamed === bucket) continue;
      range ??= buckets.range.slice();
      range[position] = renamed;
    }
    if (!isEmptied) {
      return range === undefined && buckets.writtenKeys === undefined
        ? buckets
        : createChangedFunction(buckets, range ?? buckets.range.slice());
    }
    isEveryPositionKept = false;
    const renamedBuckets = range ?? buckets.range;
    const keys: Value[] = [];
    const kept: Value[] = [];
    for (let position = 0; position < renamedBuckets.length; position++) {
      if (toFiniteFunction(renamedBuckets[position]).domain.length === 0) continue;
      keys.push(buckets.domain[position]);
      kept.push(renamedBuckets[position]);
    }
    return setFunctionClass(createSortedFunction(keys, kept), buckets.functionClass);
  };
  const objectChanges = {
    proto: renameMaybe,
    props: renameProps,
    privs: renameElements,
    slots: (_slots: Value, object: Value) => renameSlots(object),
  };
  const renameObject = (object: Value) => except(object, objectChanges);
  const bindingChanges = { value: renameMaybe };
  const renameBinding = (binding: Value) => except(binding, bindingChanges);
  const renameBindings = (bindings: Value) => mapRange(bindings, renameBinding);
  const declarativeChanges = { outer: renameEnvironment, b: renameBindings };
  const functionEnvironmentChanges = {
    outer: renameEnvironment,
    b: renameBindings,
    this: renameMaybe,
    fn: renameValue,
    newTarget: renameMaybe,
  };
  const objectEnvironmentChanges = { outer: renameEnvironment, obj: renameValue };
  const globalChanges = { outer: renameEnvironment, this: renameMaybe };
  const renameEnvironmentRecord = (environment: Value) => {
    const kind = getString(environment, "kind");
    return except(
      environment,
      kind === "declarative" || kind === "catch" || kind === "module"
        ? declarativeChanges
        : kind === "function"
          ? functionEnvironmentChanges
          : kind === "object"
            ? objectEnvironmentChanges
            : globalChanges,
    );
  };
  // The edges of the page that the rename is making, which grows to hold the most of any page, and
  // where its next edge goes.
  let pageScratch = new Int32Array(EDGE_NODES + 4 * PAGE_SIZE);
  let pageAt = EDGE_NODES;
  // Adds a node's edges by their new numbers to the page, and gives whether the walk numbers each as
  // it was.
  const pushEdges = (node: number, start: number, page: CanonicalPage | undefined) => {
    const array = getEdgeArray(start, page);
    const first = getEdgeFirst(node, start, array);
    const end = getEdgeEnd(node, start, array);
    if (pageAt + end - first > pageScratch.length) {
      const grown = new Int32Array(2 * (pageAt + end - first));
      grown.set(pageScratch);
      pageScratch = grown;
    }
    const pushed = pageScratch;
    let at = pageAt;
    let isEveryUnmoved = true;
    for (let index = first; index < end; index++) {
      const target = array[index];
      const number = getNew(target);
      if (number !== (target > 0 ? target : -target)) isEveryUnmoved = false;
      pushed[at++] = target > 0 ? number : -number;
    }
    pageAt = at;
    return isEveryUnmoved;
  };
  const getLocated = (node: number, start: number, page: CanonicalPage | undefined) =>
    page !== undefined && start === PAGE_EDGES
      ? page.locations[getSlot(node)]
      : walkedLocations.has(node)
        ? walkedLocations.get(node)
        : page?.locations[getSlot(node)];
  let levelKeys = new Int32Array(0);
  let levelBases = new Int32Array(0);
  let levelEntries = new Int32Array(0);
  let levelHashes = new Int32Array(0);
  const closeHashLevel = (level: number) => {
    if (levelHashes[level] === levelBases[level]) return;
    levelHashes[level - 1] =
      (levelHashes[level - 1] -
        levelEntries[level] +
        getEntryContribution(levelKeys[level], levelHashes[level])) |
      0;
  };
  // The hash of the record that makeRecord makes of a source with the edges by their new numbers
  // from first in renamedEdges, from the source's plan.
  const getMadeHash = (renamedEdges: Int32Array, first: number, plan: Int32Array) => {
    if (plan.length > levelHashes.length) {
      levelKeys = new Int32Array(plan.length);
      levelBases = new Int32Array(plan.length);
      levelEntries = new Int32Array(plan.length);
      levelHashes = new Int32Array(plan.length);
    }
    levelHashes[0] = plan[0];
    let open = 0;
    for (let at = 1; at < plan.length; at += 4) {
      const target = renamedEdges[first + plan[at]];
      for (let left = plan[at + 1]; left > 0; left--, open--) closeHashLevel(open);
      const entered = plan[at + 2];
      at += 3;
      for (let index = 0; index < entered; index++, at += 3) {
        open++;
        levelKeys[open] = plan[at];
        levelBases[open] = plan[at + 1];
        levelEntries[open] = plan[at + 2];
        levelHashes[open] = plan[at + 1];
      }
      const numberHash = getNumberHash(target > 0 ? target : -target);
      const next =
        target > 0 ? (plan[at + 3] + getEntryContribution(ID_HASH, numberHash)) | 0 : numberHash;
      if (next === plan[at + 1]) continue;
      levelHashes[open] =
        (levelHashes[open] - plan[at + 2] + getEntryContribution(plan[at], next)) | 0;
    }
    for (; open > 0; open--) closeHashLevel(open);
    return levelHashes[0];
  };
  // Dropping an emptied bucket moves the values after it.
  let isEveryPositionKept = true;
  const getRecord = (node: number) => (node > 0 ? getObject(node) : getEnvironment(-node));
  const keepSlot = (
    node: number,
    page: CanonicalPage | undefined,
    slots: Slots,
    isInPlace: boolean,
  ) => {
    if (page === undefined) {
      const record = getRecord(node);
      pushSlot(slots, record, record, undefined, getValueHash(record), isInPlace);
      return;
    }
    const slot = getSlot(node);
    pushSlot(
      slots,
      page.records[slot],
      page.sources[slot],
      page.plans[slot],
      page.hashes[slot],
      isInPlace,
    );
  };
  const makeLater = (
    source: Value,
    located: number[] | undefined,
    plan: Int32Array | undefined,
    slots: Slots,
  ) => {
    const hash = plan === undefined ? getValueHash(source) : plan[0];
    if (located === undefined || isUnfingerprintableHash(hash)) {
      pushSlot(slots, undefined, source, plan, hash, false);
      return;
    }
    const sourcePlan = plan ?? createHashPlan(source, hash, located);
    pushSlot(
      slots,
      undefined,
      source,
      sourcePlan,
      getMadeHash(
        pageScratch,
        pageScratch[EDGE_STARTS + (slots.count & (PAGE_SIZE - 1))],
        sourcePlan,
      ),
      false,
    );
  };
  // The slot of a node at a new number, after its edges on the page: as it is, where renaming would
  // give it back, or renamed. A canonical record's renaming waits until a reader reads it.
  const rename = (
    node: number,
    number: number,
    start: number,
    page: CanonicalPage | undefined,
    renameRecord: (inner: Value) => FunctionValue,
    slots: Slots,
  ) => {
    const isInPlace = (node > 0 ? node : -node) === number;
    const slot = getSlot(node);
    const isEveryEdgeUnmoved = pushEdges(node, start, page);
    if (page !== undefined && page.records[slot] === undefined) {
      if (isEveryEdgeUnmoved) return keepSlot(node, page, slots, isInPlace);
      return makeLater(page.sources[slot], page.locations[slot], page.plans[slot], slots);
    }
    const record = page === undefined ? getRecord(node) : getPageRecord(page, slot);
    const isCanonicalRecord = isIncremental && (page !== undefined || isCanonical(record));
    const objectClass =
      isCanonicalRecord && node > 0 && page === undefined ? getString(record, "class") : "";
    const isKept =
      isCanonicalRecord &&
      !(page === undefined
        ? WEAK_CLASSES.has(objectClass)
        : hasSlotBit(page.edges, WEAK_CLASS_BITS, slot));
    if (isKept && isEveryEdgeUnmoved) return keepSlot(node, page, slots, isInPlace);
    const isEntry =
      page === undefined
        ? ENTRY_CLASSES.has(objectClass)
        : hasSlotBit(page.edges, ENTRY_CLASS_BITS, slot);
    const located = isKept && !isEntry ? getLocated(node, start, page) : undefined;
    if (located !== undefined) {
      return page === undefined
        ? makeLater(record, located, undefined, slots)
        : makeLater(page.sources[slot], located, page.plans[slot], slots);
    }
    isEveryPositionKept = true;
    const renamed = markCanonical(renameRecord(record));
    if (!isEveryPositionKept) walkedLocations.set(node, undefined);
    pushSlot(slots, renamed, renamed, undefined, getValueHash(renamed), false);
  };
  // The node that each new number names, in each heap, where a realm's object that no step changed
  // names none.
  const objectNodes = new Int32Array(realm.objects + objectCount + 1);
  const environmentNodes = new Int32Array(realm.environments + environmentCount + 1);
  for (let environment = 1; environment <= realm.environments; environment++) {
    environmentNodes[environment] = -environment;
  }
  for (const id of changed) objectNodes[id] = id;
  for (const node of order) {
    if (node > 0) objectNodes[objectNumbers[node]] = node;
    else environmentNodes[environmentNumbers[-node]] = node;
  }
  // Renames each node of a heap at its new number a page at a time, and makes each page, which is
  // the page of the heap before where each of its slots is in place.
  const renameHeap = (
    nodes: Int32Array,
    renameRecord: (inner: Value) => FunctionValue,
    pagesBefore: Value[],
  ) => {
    const slots = createSlots(nodes.length - 1);
    return Array.from({ length: Math.ceil(slots.sources.length / PAGE_SIZE) }, (_value, page) => {
      const first = page * PAGE_SIZE;
      const count = Math.min(PAGE_SIZE, slots.sources.length - first);
      pageAt = EDGE_NODES;
      pageScratch.fill(0, 0, EDGE_STARTS);
      pageScratch[0] = realm.objects;
      pageScratch[1] = realm.environments;
      // eslint-disable-next-line unicorn/no-new-array
      const locations = new Array<number[] | undefined>(count);
      for (let slot = 0; slot < count; slot++) {
        const number = first + slot + 1;
        const node = nodes[number] === 0 ? number : nodes[number];
        const nodePage = getPage(node);
        const start = node > 0 ? objectEdgeStarts[node] : environmentEdgeStarts[-node];
        pageScratch[EDGE_STARTS + slot] = pageAt;
        if (nodes[number] === 0) keepSlot(node, nodePage, slots, true);
        else rename(node, number, start, nodePage, renameRecord, slots);
        locations[slot] = getLocated(node, start, nodePage);
        if (nodes !== objectNodes) continue;
        if (nodePage === undefined) {
          const objectClass = getString(slots.sources[first + slot], "class");
          if (objectClass === "promise") setSlotBit(pageScratch, PROMISE_BITS, slot);
          if (WEAK_CLASSES.has(objectClass)) setSlotBit(pageScratch, WEAK_CLASS_BITS, slot);
          if (ENTRY_CLASSES.has(objectClass)) setSlotBit(pageScratch, ENTRY_CLASS_BITS, slot);
          continue;
        }
        const nodeSlot = getSlot(node);
        for (let bits = PROMISE_BITS; bits < EDGE_STARTS; bits += PAGE_SIZE / 32) {
          if (hasSlotBit(nodePage.edges, bits, nodeSlot)) setSlotBit(pageScratch, bits, slot);
        }
      }
      const at = pageAt;
      const previous = pagesBefore[page];
      let isKept =
        isIncremental &&
        isCanonicalPage(previous) &&
        previous.writtenSlots === undefined &&
        previous.domain.length === count;
      for (let slot = 0; isKept && slot < count; slot++)
        isKept = slots.isInPlace[first + slot] === 1;
      if (isKept) return previous;
      for (let slot = count; slot <= PAGE_SIZE; slot++) pageScratch[EDGE_STARTS + slot] = at;
      if (nodes === objectNodes) {
        for (let index = 0; index < weakMaps.length; index++) {
          const slot = objectNumbers[weakMaps[index]] - 1 - first;
          if (slot >= 0 && slot < count) setSlotBit(pageScratch, WEAK_MAP_BITS, slot);
        }
      }
      const made = new CanonicalPage(
        pageScratch.slice(0, at),
        locations,
        slots.plans.slice(first, first + count),
        slots.sources.slice(first, first + count),
        slots.records.slice(first, first + count),
        slots.hashes.slice(first, first + count),
        0,
        makeRecord,
        undefined,
      );
      made.hash = getPageHash(made);
      return made;
    });
  };
  const madeObjectPages = renameHeap(objectNodes, renameObject, pages);
  const madeEnvironmentPages = renameHeap(
    environmentNodes,
    renameEnvironmentRecord,
    environmentPages,
  );
  return except(state, {
    objs: () => createHeap(objs, objectNodes.length - 1, madeObjectPages),
    envs: () => createHeap(envs, environmentNodes.length - 1, madeEnvironmentPages),
    envsHeld: () => environmentNodes.length - 1,
    templates: (inner) => mapRange(inner, renameValue),
    required: (inner) => mapRange(inner, (entry) => except(entry, { module: renameValue })),
    hostHandler: renameMaybe,
    hostImport: renameMaybe,
    modules: (inner) =>
      toTuple(
        inner,
        getList(inner).map((module) =>
          except(module, {
            env: (environment) =>
              environment === 0 ? environment : renameEnvironment(environment),
            namespace: renameMaybe,
            deferredNamespace: renameMaybe,
            meta: renameMaybe,
            value: renameMaybe,
            moduleSource: renameMaybe,
            error: renameMaybe,
            capability: (capability) =>
              isModelValue(capability, "Empty")
                ? capability
                : toRecord(capability, [
                    ["promise", renameValue(get(capability, "promise"))],
                    ["resolve", renameMaybe(get(capability, "resolve"))],
                    ["reject", renameMaybe(get(capability, "reject"))],
                  ]),
          }),
        ),
      ),
    hoisted: (inner) => {
      const set = toFiniteSet(inner);
      const elements = set.elements
        .filter((pair) => {
          const environment = Number(getList(pair)[0]);
          return environment <= realm.environments || isNumbered(-environment);
        })
        .map((pair) => {
          const elements = getList(pair);
          return toTuple(pair, [renameEnvironment(elements[0]), elements[1]]);
        });
      return set.writtenElements === undefined && isEveryKept(elements, set.elements)
        ? set
        : createSet(elements);
    },
    out: (inner) => toTuple(inner, []),
  });
};

// Whether each CanonicalStateOf also renames every record anew and stops where the two differ in
// value, hash, fingerprint, or a page's edges, which a test sets to check the incremental form
// against the full one.
let isDifferential = false;

export const setCanonicalDifferential = (isEnabled: boolean) => {
  isDifferential = isEnabled;
};

const areSamePageEdges = (left: Value, right: Value) =>
  ["objs", "envs"].every((heap) => {
    const rightPages = getList(get(get(right, heap), "pages"));
    return getList(get(get(left, heap), "pages")).every((page, index) => {
      const rightPage = rightPages[index];
      return (
        !isCanonicalPage(page) ||
        !isCanonicalPage(rightPage) ||
        (page.edges.length === rightPage.edges.length &&
          page.edges.every((target, at) => target === rightPage.edges[at]))
      );
    });
  });

const getFingerprint = (value: Value) => {
  const fingerprint = new Int32Array(2);
  writeStateFingerprint([value], fingerprint);
  return fingerprint.join();
};

export const JS_TLA_CANONICAL_OPERATORS = [
  defineOperator("CanonicalStateOf", 2, (args) => {
    const state = getValue(args, 0, "CanonicalStateOf");
    const initial = getValue(args, 1, "CanonicalStateOf");
    const canonical = canonicalStateOf(state, initial, true);
    if (!isDifferential) return canonical;
    const full = canonicalStateOf(state, initial, false);
    if (
      !valuesEqual(canonical, full) ||
      getValueHash(canonical) !== getValueHash(full) ||
      getFingerprint(canonical) !== getFingerprint(full) ||
      !areSamePageEdges(canonical, full)
    ) {
      throw new TlaEvaluationError(
        "CanonicalStateOf's incremental form differs from its full form",
      );
    }
    return canonical;
  }),
];
