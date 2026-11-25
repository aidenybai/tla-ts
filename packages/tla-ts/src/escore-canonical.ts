import { defineOperator, getValue } from "./builtins";
import { TlaEvaluationError, TlaModuleError } from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import { prettyPrint } from "./pretty-print";
import { writeStateFingerprint } from "./fingerprints";
import {
  applyFunction,
  createFunction,
  createRecord,
  createSet,
  createSortedFunction,
  createSortedRecord,
  createTuple,
  formatValue,
  getSequenceElements,
  getValueHash,
  isCanonical,
  markCanonical,
  setFunctionClass,
  toFiniteFunction,
  toFiniteSet,
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

const get = (record: Value, field: string) => {
  if (
    typeof record === "object" &&
    record.kind === "Function" &&
    record.functionClass === "record"
  ) {
    const index = record.domain.indexOf(field);
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
    : setFunctionClass(
        createSortedFunction(functionValue.domain, range ?? functionValue.range.slice()),
        functionValue.functionClass,
      );
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
    const index = record.domain.indexOf(field[0]);
    return index !== -1 && record.range[index] === field[1];
  })
    ? record
    : createRecord(fields);

// [record EXCEPT !.field = change(@), ...].
const except = (record: Value, changes: Record<string, (inner: Value, record: Value) => Value>) => {
  const functionValue = toFiniteFunction(record);
  let range: Value[] | undefined;
  for (const key in changes) {
    const index = functionValue.domain.indexOf(key);
    if (index === -1) continue;
    const changed = changes[key](functionValue.range[index], record);
    if (changed === functionValue.range[index]) continue;
    range ??= functionValue.range.slice();
    range[index] = changed;
  }
  return range === undefined && functionValue.writtenKeys === undefined
    ? functionValue
    : setFunctionClass(
        createSortedFunction(functionValue.domain, range ?? functionValue.range.slice()),
        functionValue.functionClass,
      );
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
// where that page holds the same records, or else a page of its own, which this one makes.
const createHeap = (records: Value[], before: Value, isIncremental: boolean) => {
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
          return isIncremental &&
            isCanonical(previous) &&
            previousRecords.length === kept.length &&
            previousRecords.every((record, index) => record === kept[index])
            ? previous
            : markCanonical(createTuple(kept));
        }),
      ),
    ],
  ]);
};

// The classes of weak collections, whose renaming keeps the entries whose keys the walk reaches.
const WEAK_CLASSES = new Set(["weakMap", "weakSet", "weakRef"]);

const objectRef = (value: Value, realm: Realm, refs: number[]) => {
  if (getString(value, "type") === "object") {
    const id = getNumber(value, "id");
    if (id > realm.objects) refs.push(id);
  }
};

const maybeRef = (value: Value, realm: Realm, refs: number[]) => {
  if (!isAbsentOrEmpty(value)) objectRef(value, realm, refs);
};

const environmentRef = (environment: Value, realm: Realm, refs: number[]) => {
  if (typeof environment !== "number")
    throw new TlaEvaluationError("An environment isn't a number");
  if (environment > realm.environments) refs.push(-environment);
};

const valueRefs = (list: Value, realm: Realm, refs: number[]) => {
  const values = getList(list);
  for (let index = 0; index < values.length; index++) maybeRef(values[index], realm, refs);
};

const elementRefs = (element: Value, realm: Realm, refs: number[]) => {
  maybeRef(get(element, "value"), realm, refs);
  maybeRef(get(element, "get"), realm, refs);
  maybeRef(get(element, "set"), realm, refs);
  if (!hasField(element, "init")) return;
  if (
    getList(get(element, "decorators")).length > 0 ||
    !isModelValue(get(element, "extra"), "Empty")
  ) {
    stop("a decorated class element");
  }
  maybeRef(get(element, "init"), realm, refs);
  valueRefs(get(element, "initializers"), realm, refs);
};

const elementListRefs = (list: Value, realm: Realm, refs: number[]) => {
  const elements = getList(list);
  for (let index = 0; index < elements.length; index++) elementRefs(elements[index], realm, refs);
};

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

const slotRefs = (object: Value, realm: Realm, refs: number[]) => {
  const objectClass = getString(object, "class");
  const slots = get(object, "slots");
  if (PLAIN_CLASSES.has(objectClass)) {
    if (hasField(slots, "initializers")) valueRefs(get(slots, "initializers"), realm, refs);
  } else if (objectClass === "function") {
    environmentRef(get(slots, "env"), realm, refs);
    maybeRef(get(slots, "home"), realm, refs);
    elementListRefs(get(slots, "fields"), realm, refs);
    elementListRefs(get(slots, "privateMethods"), realm, refs);
    const initializers = get(slots, "initializers");
    if (!isModelValue(initializers, "Empty")) valueRefs(initializers, realm, refs);
  } else if (objectClass === "bound") {
    objectRef(get(slots, "target"), realm, refs);
    maybeRef(get(slots, "this"), realm, refs);
    valueRefs(get(slots, "args"), realm, refs);
  } else if (objectClass === "map") {
    getList(get(slots, "mapData")).forEach((entry) => {
      if (isModelValue(entry, "Empty")) return;
      maybeRef(get(entry, "key"), realm, refs);
      maybeRef(get(entry, "value"), realm, refs);
    });
  } else if (objectClass === "set") {
    valueRefs(get(slots, "setData"), realm, refs);
  } else if (VIEW_CLASSES.has(objectClass)) {
    maybeRef(get(slots, "buffer"), realm, refs);
  } else if (objectClass === "proxy") {
    maybeRef(get(slots, "target"), realm, refs);
    maybeRef(get(slots, "handler"), realm, refs);
  } else if (objectClass === "promise") {
    if (getString(slots, "state") === "pending") stop("a pending promise");
    maybeRef(get(slots, "result"), realm, refs);
  } else if (objectClass === "cell" && getDomain(slots).join() === "promise") {
    maybeRef(get(slots, "promise"), realm, refs);
  } else if (objectClass === "cell" && getDomain(slots).join() === "reject,resolve") {
    maybeRef(get(slots, "resolve"), realm, refs);
    maybeRef(get(slots, "reject"), realm, refs);
  } else if (objectClass === "weakMap" || objectClass === "weakSet" || objectClass === "weakRef") {
    // A weak collection's entries refer to objects only where the walk reaches their keys.
  } else if (objectClass === "finalizationRegistry" && getList(get(slots, "cells")).length === 0) {
    // A registry holds no cell, as the runtime stops where a program registers a target.
    objectRef(get(slots, "cleanupCallback"), realm, refs);
  } else if (objectClass === "builtin" && isPlainBuiltin(slots)) {
    if (isObjectDataBuiltin(slots)) objectRef(get(slots, "data"), realm, refs);
    if (isAsyncResourceBuiltin(slots)) {
      objectRef(get(get(slots, "data"), "run"), realm, refs);
      objectRef(get(get(slots, "data"), "destroy"), realm, refs);
    }
  } else if (
    objectClass === "builtin" &&
    isDefaultConstructor(slots) &&
    getDomain(slots).join() === DEFAULT_CONSTRUCTOR_SLOTS.join()
  ) {
    elementListRefs(get(slots, "fields"), realm, refs);
    elementListRefs(get(slots, "privateMethods"), realm, refs);
    const initializers = get(slots, "initializers");
    if (!isModelValue(initializers, "Empty")) valueRefs(initializers, realm, refs);
  } else {
    stop(`an object of class ${objectClass}`);
  }
};

// An array index's number, from the code units of its canonical decimal string.
const getIndex = (key: Value) =>
  getList(get(key, "value")).reduce<number>((total, unit) => total * 10 + Number(unit) - 48, 0);

const KEY_TYPES = ["string", "symbol"];

const descriptorRefs = (descriptor: Value, realm: Realm, refs: number[]) => {
  maybeRef(get(descriptor, "value"), realm, refs);
  maybeRef(get(descriptor, "get"), realm, refs);
  maybeRef(get(descriptor, "set"), realm, refs);
};

// The refs of the descriptors of an index bucket's keys, by their indexes ascending.
const bucketRefs = (value: Value, realm: Realm, refs: number[]) => {
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
      descriptorRefs(bucket.range[position], realm, refs);
    }
    return;
  }
  bucket.domain
    .map((key, position) => ({ index: getIndex(key), descriptor: bucket.range[position] }))
    .sort((left, right) => left.index - right.index)
    .forEach((pair) => descriptorRefs(pair.descriptor, realm, refs));
};

// The refs of an object's properties in OwnKeysOf's order: index keys ascending, then the string
// keys and the symbol keys in the order they were added.
const objectRefs = (object: Value, realm: Realm, refs: number[]) => {
  maybeRef(get(object, "proto"), realm, refs);
  const props = toFiniteFunction(get(object, "props"));
  let named: Value | undefined;
  let isAscending = true;
  let previousBucket = -Infinity;
  for (let position = 0; position < props.domain.length; position++) {
    const bucket = props.domain[position];
    if (bucket === NAMED_BUCKET) named = props.range[position];
    else {
      if (Number(bucket) < previousBucket) isAscending = false;
      previousBucket = Number(bucket);
    }
  }
  if (isAscending) {
    for (let position = 0; position < props.domain.length; position++) {
      if (props.domain[position] !== NAMED_BUCKET) bucketRefs(props.range[position], realm, refs);
    }
  } else {
    props.domain
      .map((bucket, position) => ({ bucket, position }))
      .filter((entry) => entry.bucket !== NAMED_BUCKET)
      .sort((left, right) => Number(left.bucket) - Number(right.bucket))
      .forEach((entry) => bucketRefs(props.range[entry.position], realm, refs));
  }
  const keys = getList(get(object, "keys"));
  for (const type of KEY_TYPES) {
    for (let index = 0; index < keys.length; index++) {
      if (getString(keys[index], "type") !== type) continue;
      if (named === undefined) throw new TlaEvaluationError("A key has no bucket");
      descriptorRefs(applyFunction(named, keys[index]), realm, refs);
    }
  }
  elementListRefs(get(object, "privs"), realm, refs);
  slotRefs(object, realm, refs);
};

// LexLess on sequences of code units: a prefix first, then by the first unit that differs.
const compareUnits = (left: Value[], right: Value[]) => {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    if (left[index] !== right[index]) return Number(left[index]) - Number(right[index]);
  }
  return left.length - right.length;
};

const bindingRefs = (bindings: Value, realm: Realm, refs: number[]) => {
  const functionValue = toFiniteFunction(bindings);
  functionValue.domain
    .map((name, position) => ({ units: getList(name), binding: functionValue.range[position] }))
    .sort((left, right) => compareUnits(left.units, right.units))
    .forEach((entry) => maybeRef(get(entry.binding, "value"), realm, refs));
};

const environmentRefs = (environment: Value, realm: Realm, refs: number[]) => {
  environmentRef(get(environment, "outer"), realm, refs);
  const kind = getString(environment, "kind");
  if (kind === "declarative" || kind === "catch") bindingRefs(get(environment, "b"), realm, refs);
  else if (kind === "function") {
    bindingRefs(get(environment, "b"), realm, refs);
    maybeRef(get(environment, "this"), realm, refs);
    objectRef(get(environment, "fn"), realm, refs);
    maybeRef(get(environment, "newTarget"), realm, refs);
  } else if (kind === "object") objectRef(get(environment, "obj"), realm, refs);
  else if (kind === "global") maybeRef(get(environment, "this"), realm, refs);
  else if (kind === "module") bindingRefs(get(environment, "b"), realm, refs);
  else stop(`an environment of kind ${kind}`);
};

// What a module record refers to: its environment, its namespaces, its import.meta, a synthetic
// module's value, its module source, the capability of its evaluation, and what it threw.
const moduleRefs = (module: Value, realm: Realm, refs: number[]) => {
  const environment = get(module, "env");
  if (environment !== 0) environmentRef(environment, realm, refs);
  ["namespace", "deferredNamespace", "meta", "value", "moduleSource", "error"].forEach((field) =>
    maybeRef(get(module, field), realm, refs),
  );
  const capability = get(module, "capability");
  if (isModelValue(capability, "Empty")) return;
  objectRef(get(capability, "promise"), realm, refs);
  maybeRef(get(capability, "resolve"), realm, refs);
  maybeRef(get(capability, "reject"), realm, refs);
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
  const queue: number[] = [];
  for (let environment = 1; environment <= realm.environments; environment++) {
    const start = queue.length;
    environmentRefs(getEnvironment(environment), realm, queue);
    collect(-environment, queue, start);
  }
  for (const id of changed) {
    const start = queue.length;
    objectRefs(getObject(id), realm, queue);
    collect(id, queue, start);
  }
  const templates = toFiniteFunction(get(state, "templates"));
  templates.domain
    .map((key, position) => ({ key: Number(key), value: templates.range[position] }))
    .sort((left, right) => left.key - right.key)
    .forEach((entry) => objectRef(entry.value, realm, queue));
  getList(get(state, "modules")).forEach((module) => moduleRefs(module, realm, queue));
  required.domain
    .map((file, position) => ({ file: Number(file), entry: required.range[position] }))
    .sort((left, right) => left.file - right.file)
    .forEach((pair) => objectRef(get(pair.entry, "module"), realm, queue));
  // The handler of the host's proxies and the host's import, which the state names by object.
  maybeRef(get(state, "hostHandler"), realm, queue);
  maybeRef(get(state, "hostImport"), realm, queue);
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
      const start = walked.length;
      if (node > 0) {
        objectCount++;
        objectNumbers[node] = realm.objects + objectCount;
        const object = getObject(node);
        objectRefs(object, realm, walked);
        if (getString(object, "class") === "weakMap") weakMaps.push(node);
      } else {
        environmentCount++;
        environmentNumbers[-node] = realm.environments + environmentCount;
        environmentRefs(getEnvironment(-node), realm, walked);
      }
      collect(node, walked, start);
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
        .forEach((entry) => maybeRef(entry.value, realm, more));
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
    range[value.domain.indexOf("id")] = number;
    return createSortedRecord(value.domain, range);
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
    let keys: Value[] | undefined;
    let kept: Value[] | undefined;
    for (let position = 0; position < buckets.range.length; position++) {
      const bucket = buckets.range[position];
      const isEmptied = toFiniteFunction(bucket).domain.length === 0;
      const renamed = isEmptied ? bucket : mapRange(bucket, renameDescriptor);
      if (kept === undefined && (isEmptied || renamed !== bucket)) {
        keys = buckets.domain.slice(0, position);
        kept = buckets.range.slice(0, position);
      }
      if (isEmptied || keys === undefined || kept === undefined) continue;
      keys.push(buckets.domain[position]);
      kept.push(renamed);
    }
    if (keys === undefined || kept === undefined) {
      if (buckets.writtenKeys === undefined) return buckets;
      keys = buckets.domain.slice();
      kept = buckets.range.slice();
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
  const isEveryEdgeUnmoved = (node: number) => {
    const start = node > 0 ? objectEdgeStarts[node] : environmentEdgeStarts[-node];
    if (start === -1) return false;
    for (let index = start + 1; index <= start + edges[start]; index++) {
      if (!isUnmoved(edges[index])) return false;
    }
    return true;
  };
  // A record renamed, or as it is where renaming would give it back.
  const rename = (node: number, record: Value, renameRecord: (inner: Value) => FunctionValue) =>
    isIncremental &&
    isCanonical(record) &&
    (node < 0 || !WEAK_CLASSES.has(getString(record, "class"))) &&
    isEveryEdgeUnmoved(node)
      ? record
      : markCanonical(renameRecord(record));
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
  return except(state, {
    objs: () => createHeap(objects, objs, isIncremental),
    envs: () => createHeap(environments, envs, isIncremental),
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
