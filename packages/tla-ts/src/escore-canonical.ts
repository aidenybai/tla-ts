import { defineOperator, getValue } from "./builtins";
import { TlaEvaluationError, TlaModuleError } from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import { prettyPrint } from "./pretty-print";
import { writeStateFingerprint } from "./fingerprints";
import {
  applyFunction,
  createCanonicalPage,
  createChangedFunction,
  createFunction,
  createRecord,
  createSet,
  createSortedFunction,
  createTuple,
  formatValue,
  getKeyPosition,
  getSequenceElements,
  getValueHash,
  isCanonical,
  isCanonicalPage,
  markCanonical,
  setFunctionClass,
  toFiniteFunction,
  toFiniteSet,
  type CanonicalPage,
  type FunctionValue,
  type Value,
  valuesEqual,
} from "./values";

// ESCanonical's CanonicalStateOf, which tla-ts runs natively while TLC runs the module's TLA+
// definition: the same walk, numbering, and renaming, step for step, so that both give the same
// value. ESCore's state is a record whose objs and envs are heaps [size, pages] of pages of 256
// records, an object's props maps a bucket to a function from key to descriptor, and a JavaScript
// object value is [type |-> "object", id |-> n].
const PAGE_SIZE = 256;
const NAMED_BUCKET = -1;
// A page's edges: the realm's sizes they were walked from, a bit for each record that is a WeakMap,
// where each record's edges start, and then each record's edges, as canonicalStateOf collects them.
const WEAK_BITS = 2;
const EDGE_STARTS = WEAK_BITS + PAGE_SIZE / 32;
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

// The record at each index of a heap, which reads each page's records once.
const createHeapReader = (heap: Value) => {
  const pages = getList(get(heap, "pages"));
  const pageRecords: Value[][] = [];
  return (index: number) => {
    const page = Math.floor((index - 1) / PAGE_SIZE);
    pageRecords[page] ??= getList(pages[page]);
    return pageRecords[page][(index - 1) % PAGE_SIZE];
  };
};

// A heap of records, whose each page is the page of the heap before that a canonicalization made,
// where that page holds the same records, or else a page of its own, which createPage makes.
const createHeap = (
  records: Value[],
  before: Value,
  isIncremental: boolean,
  createPage: (records: Value[], page: number) => CanonicalPage,
) => {
  const pagesBefore = get(before, "pages");
  const pages = getList(pagesBefore);
  return toRecord(before, [
    ["size", records.length],
    [
      "pages",
      toTuple(
        pagesBefore,
        Array.from({ length: Math.ceil(records.length / PAGE_SIZE) }, (_, page) => {
          const kept = records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          const previous = pages[page];
          const previousRecords = previous === undefined ? [] : getList(previous);
          if (
            isIncremental &&
            isCanonical(previous) &&
            previousRecords.length === kept.length &&
            previousRecords.every((record, index) => record === kept[index])
          ) {
            return previous;
          }
          return createPage(kept, page);
        }),
      ),
    ],
  ]);
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
  const starts: number[] = [];
  for (let at = 0; at < located.length; at += 2 + located[at + 1]) starts.push(at);
  if (starts.length < 2) return located.slice();
  const sorted: number[] = [];
  starts
    .sort((left, right) => compareSteps(located, left, right))
    .forEach((start) => {
      for (let index = start; index < start + 2 + located[start + 1]; index++) {
        sorted.push(located[index]);
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
// a TextEncoder, of the value each one reads, and the call of performance.now, of performance.
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
    !isEmptyList("timers") ||
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
  const getPage = (node: number) => {
    const index = (node > 0 ? node : -node) - 1;
    const page = (node > 0 ? pages : environmentPages)[Math.floor(index / PAGE_SIZE)];
    return isIncremental &&
      isCanonicalPage(page) &&
      page.edges[0] === realm.objects &&
      page.edges[1] === realm.environments
      ? page
      : undefined;
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
  // number negated: from where a node's edges start, its count and then the nodes.
  const edges: number[] = [];
  const objectEdgeStarts = new Int32Array(getNumber(objs, "size") + 1).fill(-1);
  const environmentEdgeStarts = new Int32Array(getNumber(envs, "size") + 1).fill(-1);
  const collect = (node: number, refs: number[], start: number) => {
    if (node > 0) objectEdgeStarts[node] = edges.length;
    else environmentEdgeStarts[-node] = edges.length;
    edges.push(refs.length - start);
    for (let index = start; index < refs.length; index++) edges.push(refs[index]);
  };
  // undefined where renaming the record moved what it holds.
  const walkedLocations = new Map<number, number[] | undefined>();
  const path: Path = { steps: [], located: [], count: 0 };
  const collectWalked = (node: number, refs: number[], start: number) => {
    collect(node, refs, start);
    walkedLocations.set(node, sortLocated(path.located));
    path.located.length = 0;
    path.count = 0;
  };
  // Gives whether the record is a WeakMap.
  const walkRecord = (node: number, walked: number[]) => {
    const start = walked.length;
    const page = getPage(node);
    if (page !== undefined) {
      const pageEdges = page.edges;
      const slot = ((node > 0 ? node : -node) - 1) % PAGE_SIZE;
      for (let at = pageEdges[EDGE_STARTS + slot]; at < pageEdges[EDGE_STARTS + slot + 1]; at++) {
        walked.push(pageEdges[at]);
      }
      collect(node, walked, start);
      return ((pageEdges[WEAK_BITS + (slot >> 5)] >>> (slot & 31)) & 1) === 1;
    }
    if (node < 0) {
      environmentRefs(getEnvironment(-node), realm, walked, path);
      collectWalked(node, walked, start);
      return false;
    }
    const object = getObject(node);
    objectRefs(object, realm, walked, path);
    collectWalked(node, walked, start);
    return getString(object, "class") === "weakMap";
  };
  const queue: number[] = [];
  for (let environment = 1; environment <= realm.environments; environment++) {
    walkRecord(-environment, queue);
  }
  for (const id of changed) {
    const start = queue.length;
    objectRefs(getObject(id), realm, queue, path);
    collectWalked(id, queue, start);
  }
  const rootPath: Path = { steps: [], located: [], count: 0 };
  const templates = toFiniteFunction(get(state, "templates"));
  templates.domain
    .map((key, position) => ({ key: Number(key), value: templates.range[position] }))
    .sort((left, right) => left.key - right.key)
    .forEach((entry) => objectRef(entry.value, realm, queue, rootPath));
  getList(get(state, "modules")).forEach((module) => moduleRefs(module, realm, queue, rootPath));
  required.domain
    .map((file, position) => ({ file: Number(file), entry: required.range[position] }))
    .sort((left, right) => left.file - right.file)
    .forEach((pair) => objectRef(get(pair.entry, "module"), realm, queue, rootPath));
  // The handler of the host's proxies and the host's import, which the state names by object.
  maybeRef(get(state, "hostHandler"), realm, queue, rootPath);
  maybeRef(get(state, "hostImport"), realm, queue, rootPath);
  // The breadth-first walk, whose queue grows at its end as each node it numbers adds the nodes
  // that node refers to.
  const objectNumbers = new Int32Array(objectEdgeStarts.length);
  const environmentNumbers = new Int32Array(environmentEdgeStarts.length);
  const isNumbered = (node: number) =>
    (node > 0 ? objectNumbers[node] : environmentNumbers[-node]) !== 0;
  const order: number[] = [];
  const weakMaps: number[] = [];
  let objectCount = 0;
  let environmentCount = 0;
  const walk = (walked: number[]) => {
    for (let head = 0; head < walked.length; head++) {
      const node = walked[head];
      if (isNumbered(node)) continue;
      if (node > 0) {
        objectCount++;
        objectNumbers[node] = realm.objects + objectCount;
      } else {
        environmentCount++;
        environmentNumbers[-node] = realm.environments + environmentCount;
      }
      if (walkRecord(node, walked)) weakMaps.push(node);
      order.push(node);
    }
  };
  walk(queue);
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
    const fresh = more.filter((node) => !isNumbered(node));
    if (fresh.length === 0) break;
    walk(fresh);
  }
  const getNew = (node: number) => {
    const number = node > 0 ? objectNumbers[node] : environmentNumbers[-node];
    if (number === 0) throw new TlaEvaluationError("A reference to a dropped node");
    return number;
  };
  const renameValue = (value: Value): Value => {
    if (getString(value, "type") !== "object") return value;
    const id = getNumber(value, "id");
    if (id <= realm.objects) return value;
    const number = getNew(id);
    if (!isPlainOf(value, "record") || value.domain.length !== 2) {
      return createRecord([
        ["type", "object"],
        ["id", number],
      ]);
    }
    if (number === id) return value;
    const range = value.range.slice();
    range[findFieldIndex(value.domain, "id")] = number;
    return createChangedFunction(value, range);
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
  // Whether the walk numbers a node as it was: the realm's, which it doesn't number, and each
  // other node at the number it had.
  const isUnmoved = (node: number) =>
    node > 0
      ? node <= realm.objects || objectNumbers[node] === node
      : -node <= realm.environments || environmentNumbers[-node] === -node;
  const getEdgeStart = (node: number) =>
    node === 0 ? -1 : node > 0 ? objectEdgeStarts[node] : environmentEdgeStarts[-node];
  const isEveryEdgeUnmoved = (node: number) => {
    const start = node > 0 ? objectEdgeStarts[node] : environmentEdgeStarts[-node];
    if (start === -1) return false;
    for (let index = start + 1; index <= start + edges[start]; index++) {
      if (!isUnmoved(edges[index])) return false;
    }
    return true;
  };
  const openSources: FunctionValue[] = [];
  const openRanges: Value[][] = [];
  const openSteps: number[] = [];
  const openKinds: number[] = [];
  const closeLevel = (level: number) => {
    openRanges[level - 1][openSteps[level - 1] >> 1] =
      openKinds[level] === 1
        ? createTuple(openRanges[level])
        : createChangedFunction(openSources[level], openRanges[level]);
  };
  const getLocated = (node: number) =>
    walkedLocations.has(node)
      ? walkedLocations.get(node)
      : getPage(node)?.locations[((node > 0 ? node : -node) - 1) % PAGE_SIZE];
  // Renaming a canonical record copies only the values on the paths to its moved nodes.
  const substitute = (node: number, record: Value, located: number[]) => {
    const start = getEdgeStart(node);
    const root = toFiniteFunction(record);
    openSources[0] = root;
    openRanges[0] = root.range.slice();
    let open = 0;
    for (let at = 0; at < located.length; at += 2 + located[at + 1]) {
      const target = edges[start + 1 + located[at]];
      if (isUnmoved(target)) continue;
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
      range[position] =
        target > 0 ? renameValue(range[position]) : renameEnvironment(range[position]);
    }
    for (; open > 0; open--) closeLevel(open);
    return createChangedFunction(root, openRanges[0]);
  };
  // Dropping an emptied bucket moves the values after it.
  let isEveryPositionKept = true;
  // A record renamed, or as it is where renaming would give it back.
  const rename = (node: number, record: Value, renameRecord: (inner: Value) => FunctionValue) => {
    const isKept =
      isIncremental &&
      isCanonical(record) &&
      (node < 0 || !WEAK_CLASSES.has(getString(record, "class")));
    if (isKept && isEveryEdgeUnmoved(node)) return record;
    const located =
      isKept && (node < 0 || !ENTRY_CLASSES.has(getString(record, "class")))
        ? getLocated(node)
        : undefined;
    if (located !== undefined) return markCanonical(substitute(node, record, located));
    isEveryPositionKept = true;
    const renamed = markCanonical(renameRecord(record));
    if (!isEveryPositionKept) walkedLocations.set(node, undefined);
    return renamed;
  };
  const changedSet = new Set(changed);
  const objects = [
    ...Array.from({ length: realm.objects }, (_, index) => {
      const record = getObject(index + 1);
      return changedSet.has(index + 1) ? rename(index + 1, record, renameObject) : record;
    }),
    ...order.filter((node) => node > 0).map((node) => rename(node, getObject(node), renameObject)),
  ];
  const environments = [
    ...Array.from({ length: realm.environments }, (_, index) =>
      rename(-(index + 1), getEnvironment(index + 1), renameEnvironmentRecord),
    ),
    ...order
      .filter((node) => node < 0)
      .map((node) => rename(node, getEnvironment(-node), renameEnvironmentRecord)),
  ];
  // The node that each new number names, in each heap.
  const objectNodes = new Int32Array(objects.length + 1);
  const environmentNodes = new Int32Array(environments.length + 1);
  for (let environment = 1; environment <= realm.environments; environment++) {
    environmentNodes[environment] = -environment;
  }
  for (const node of order) {
    if (node > 0) objectNodes[objectNumbers[node]] = node;
    else environmentNodes[environmentNumbers[-node]] = node;
  }
  const getPageMaker = (nodes: Int32Array) => (records: Value[], page: number) => {
    const count = records.length;
    let size = EDGE_NODES;
    for (let slot = 0; slot < count; slot++) {
      const start = getEdgeStart(nodes[page * PAGE_SIZE + slot + 1]);
      if (start !== -1) size += edges[start];
    }
    const pageEdges = new Int32Array(size);
    pageEdges[0] = realm.objects;
    pageEdges[1] = realm.environments;
    let at = EDGE_NODES;
    for (let slot = 0; slot < PAGE_SIZE; slot++) {
      pageEdges[EDGE_STARTS + slot] = at;
      const node = slot < count ? nodes[page * PAGE_SIZE + slot + 1] : 0;
      const start = getEdgeStart(node);
      if (start === -1) continue;
      for (let index = start + 1; index <= start + edges[start]; index++) {
        const target = edges[index];
        pageEdges[at++] = target > 0 ? getNew(target) : -getNew(target);
      }
      if (weakMaps.includes(node)) pageEdges[WEAK_BITS + (slot >> 5)] |= 1 << (slot & 31);
    }
    pageEdges[EDGE_STARTS + PAGE_SIZE] = at;
    return createCanonicalPage(
      records,
      pageEdges,
      Array.from({ length: count }, (_, slot) => {
        const node = nodes[page * PAGE_SIZE + slot + 1];
        return node === 0 ? undefined : getLocated(node);
      }),
    );
  };
  return except(state, {
    objs: () => createHeap(objects, objs, isIncremental, getPageMaker(objectNodes)),
    envs: () => createHeap(environments, envs, isIncremental, getPageMaker(environmentNodes)),
    envsHeld: () => environments.length,
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
// value, hash, or fingerprint, which a test sets to check the incremental form against the full one.
let isDifferential = false;

export const setCanonicalDifferential = (isEnabled: boolean) => {
  isDifferential = isEnabled;
};

const getFingerprint = (value: Value) => {
  const fingerprint = new Int32Array(2);
  writeStateFingerprint([value], fingerprint);
  return fingerprint.join();
};

export const ESCORE_CANONICAL_OPERATORS = [
  defineOperator("CanonicalStateOf", 2, (args) => {
    const state = getValue(args, 0, "CanonicalStateOf");
    const initial = getValue(args, 1, "CanonicalStateOf");
    const canonical = canonicalStateOf(state, initial, true);
    if (!isDifferential) return canonical;
    const full = canonicalStateOf(state, initial, false);
    if (
      !valuesEqual(canonical, full) ||
      getValueHash(canonical) !== getValueHash(full) ||
      getFingerprint(canonical) !== getFingerprint(full)
    ) {
      throw new TlaEvaluationError(
        "CanonicalStateOf's incremental form differs from its full form",
      );
    }
    return canonical;
  }),
];
