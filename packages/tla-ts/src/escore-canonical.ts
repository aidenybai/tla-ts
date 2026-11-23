import { defineOperator, getValue } from "./builtins";
import { TlaEvaluationError, TlaModuleError } from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import { prettyPrint } from "./pretty-print";
import {
  applyFunction,
  createFunction,
  createRecord,
  createSet,
  createSortedFunction,
  createTuple,
  formatValue,
  getSequenceElements,
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

const get = (record: Value, field: string) => applyFunction(record, field);

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

// A function with each of its values changed, which keeps its domain and its class.
const mapRange = (value: Value, change: (inner: Value, key: Value) => Value): FunctionValue => {
  const functionValue = toFiniteFunction(value);
  return setFunctionClass(
    createSortedFunction(
      functionValue.domain,
      functionValue.range.map((inner, index) => change(inner, functionValue.domain[index])),
    ),
    functionValue.functionClass,
  );
};

// [record EXCEPT !.field = change(@), ...].
const except = (record: Value, changes: Record<string, (inner: Value) => Value>) =>
  mapRange(record, (inner, key) =>
    typeof key === "string" && Object.hasOwn(changes, key) ? changes[key](inner) : inner,
  );

const heapGet = (heap: Value, index: number) => {
  const pages = getList(get(heap, "pages"));
  return getList(pages[Math.floor((index - 1) / PAGE_SIZE)])[(index - 1) % PAGE_SIZE];
};

const createHeap = (records: Value[]) =>
  createRecord([
    ["size", records.length],
    [
      "pages",
      createTuple(
        Array.from({ length: Math.ceil(records.length / PAGE_SIZE) }, (_, page) =>
          createTuple(records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)),
        ),
      ),
    ],
  ]);

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
  getList(get(element, "initializers")).forEach((inner) => maybeRef(inner, realm, refs));
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
  const values = (list: Value) => getList(list).forEach((inner) => maybeRef(inner, realm, refs));
  if (PLAIN_CLASSES.has(objectClass)) {
    if (hasField(slots, "initializers")) values(get(slots, "initializers"));
  } else if (objectClass === "function") {
    environmentRef(get(slots, "env"), realm, refs);
    maybeRef(get(slots, "home"), realm, refs);
    getList(get(slots, "fields")).forEach((element) => elementRefs(element, realm, refs));
    getList(get(slots, "privateMethods")).forEach((element) => elementRefs(element, realm, refs));
    const initializers = get(slots, "initializers");
    if (!isModelValue(initializers, "Empty")) values(initializers);
  } else if (objectClass === "bound") {
    objectRef(get(slots, "target"), realm, refs);
    maybeRef(get(slots, "this"), realm, refs);
    values(get(slots, "args"));
  } else if (objectClass === "map") {
    getList(get(slots, "mapData")).forEach((entry) => {
      if (isModelValue(entry, "Empty")) return;
      maybeRef(get(entry, "key"), realm, refs);
      maybeRef(get(entry, "value"), realm, refs);
    });
  } else if (objectClass === "set") {
    values(get(slots, "setData"));
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
    getList(get(slots, "fields")).forEach((element) => elementRefs(element, realm, refs));
    getList(get(slots, "privateMethods")).forEach((element) => elementRefs(element, realm, refs));
    const initializers = get(slots, "initializers");
    if (!isModelValue(initializers, "Empty")) values(initializers);
  } else {
    stop(`an object of class ${objectClass}`);
  }
};

// An array index's number, from the code units of its canonical decimal string.
const getIndex = (key: Value) =>
  getList(get(key, "value")).reduce<number>((total, unit) => total * 10 + Number(unit) - 48, 0);

// The descriptors of an object's properties in OwnKeysOf's order: index keys ascending, then the
// string keys and the symbol keys in the order they were added.
const getDescriptors = (object: Value) => {
  const props = toFiniteFunction(get(object, "props"));
  const buckets = props.domain
    .map((bucket, position) => ({ bucket, position }))
    .filter((entry) => entry.bucket !== NAMED_BUCKET)
    .sort((left, right) => Number(left.bucket) - Number(right.bucket));
  const indexed = buckets.flatMap((entry) => {
    const bucket = toFiniteFunction(props.range[entry.position]);
    return bucket.domain
      .map((key, position) => ({ index: getIndex(key), descriptor: bucket.range[position] }))
      .sort((left, right) => left.index - right.index)
      .map((pair) => pair.descriptor);
  });
  const keys = getList(get(object, "keys"));
  const named = props.domain.includes(NAMED_BUCKET)
    ? applyFunction(props, NAMED_BUCKET)
    : undefined;
  const byType = (type: string) =>
    keys
      .filter((key) => getString(key, "type") === type)
      .map((key) => {
        if (named === undefined) throw new TlaEvaluationError("A key has no bucket");
        return applyFunction(named, key);
      });
  return [...indexed, ...byType("string"), ...byType("symbol")];
};

const objectRefs = (object: Value, realm: Realm, refs: number[]) => {
  maybeRef(get(object, "proto"), realm, refs);
  getDescriptors(object).forEach((descriptor) => {
    maybeRef(get(descriptor, "value"), realm, refs);
    maybeRef(get(descriptor, "get"), realm, refs);
    maybeRef(get(descriptor, "set"), realm, refs);
  });
  getList(get(object, "privs")).forEach((element) => elementRefs(element, realm, refs));
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

const canonicalStateOf = (state: Value, initial: Value): Value => {
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
  const changed: number[] = [];
  initialPages.forEach((page, position) => {
    if (valuesEqual(pages[position], page)) return;
    const high = Math.min((position + 1) * PAGE_SIZE, realm.objects);
    for (let id = position * PAGE_SIZE + 1; id <= high; id++) {
      if (!valuesEqual(heapGet(objs, id), heapGet(initialObjs, id))) changed.push(id);
    }
  });
  const queue: number[] = [];
  for (let environment = 1; environment <= realm.environments; environment++) {
    environmentRefs(heapGet(envs, environment), realm, queue);
  }
  changed.forEach((id) => objectRefs(heapGet(objs, id), realm, queue));
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
  const numbers = new Map<number, number>();
  const order: number[] = [];
  let objectCount = 0;
  let environmentCount = 0;
  const walk = (walked: number[]) => {
    for (let head = 0; head < walked.length; head++) {
      const node = walked[head];
      if (numbers.has(node)) continue;
      if (node > 0) {
        objectCount++;
        numbers.set(node, realm.objects + objectCount);
        objectRefs(heapGet(objs, node), realm, walked);
      } else {
        environmentCount++;
        numbers.set(node, realm.environments + environmentCount);
        environmentRefs(heapGet(envs, -node), realm, walked);
      }
      order.push(node);
    }
  };
  walk(queue);
  // A weak collection's key that the walk reached, which a step can still read the entry by, and
  // its new number.
  const getWeakKeyNumber = (key: Value) => {
    if (getString(key, "type") !== "object") stop("a weak collection keyed by a symbol");
    const id = getNumber(key, "id");
    return id <= realm.objects ? id : numbers.get(id);
  };
  // The walk again from the objects that the values of the walked WeakMaps' reached entries refer
  // to, by the walk's order of the WeakMaps and each one's keys by their new numbers, until it
  // reaches no more.
  for (;;) {
    const more: number[] = [];
    order
      .filter((node) => node > 0)
      .forEach((node) => {
        const object = heapGet(objs, node);
        if (getString(object, "class") !== "weakMap") return;
        const data = toFiniteFunction(get(get(object, "slots"), "weakMapData"));
        data.domain
          .flatMap((key, position) => {
            const number = getWeakKeyNumber(key);
            return number === undefined ? [] : [{ number, value: data.range[position] }];
          })
          .sort((left, right) => left.number - right.number)
          .forEach((entry) => maybeRef(entry.value, realm, more));
      });
    const fresh = more.filter((node) => !numbers.has(node));
    if (fresh.length === 0) break;
    walk(fresh);
  }
  const getNew = (node: number) => {
    const number = numbers.get(node);
    if (number === undefined) throw new TlaEvaluationError("A reference to a dropped node");
    return number;
  };
  const renameValue = (value: Value): Value =>
    getString(value, "type") === "object" && getNumber(value, "id") > realm.objects
      ? createRecord([
          ["type", "object"],
          ["id", getNew(getNumber(value, "id"))],
        ])
      : value;
  const renameMaybe = (value: Value) => (isAbsentOrEmpty(value) ? value : renameValue(value));
  const renameEnvironment = (environment: Value) =>
    typeof environment === "number" && environment > realm.environments
      ? getNew(-environment)
      : environment;
  const renameValues = (list: Value) => createTuple(getList(list).map(renameMaybe));
  const renameDescriptor = (descriptor: Value) =>
    except(descriptor, { value: renameMaybe, get: renameMaybe, set: renameMaybe });
  const renameElement = (element: Value) => {
    const renamed = except(element, { value: renameMaybe, get: renameMaybe, set: renameMaybe });
    return hasField(element, "init")
      ? except(renamed, { init: renameMaybe, initializers: renameValues })
      : renamed;
  };
  const renameElements = (list: Value) => createTuple(getList(list).map(renameElement));
  const renameSlots = (object: Value) => {
    const objectClass = getString(object, "class");
    const slots = get(object, "slots");
    if (PLAIN_CLASSES.has(objectClass)) {
      return except(slots, {
        initializers: renameValues,
        trace: () => createRecord([["dropped", true]]),
      });
    }
    if (VIEW_CLASSES.has(objectClass)) return except(slots, { buffer: renameMaybe });
    switch (objectClass) {
      case "function":
        return except(slots, {
          env: renameEnvironment,
          home: renameMaybe,
          fields: renameElements,
          privateMethods: renameElements,
          initializers: (inner) => (isModelValue(inner, "Empty") ? inner : renameValues(inner)),
        });
      case "bound":
        return except(slots, { target: renameValue, this: renameMaybe, args: renameValues });
      case "map":
        return except(slots, {
          mapData: (inner) =>
            createTuple(
              getList(inner)
                .filter((entry) => !isModelValue(entry, "Empty"))
                .map((entry) =>
                  createRecord([
                    ["key", renameMaybe(get(entry, "key"))],
                    ["value", renameMaybe(get(entry, "value"))],
                  ]),
                ),
            ),
        });
      case "set":
        return except(slots, {
          setData: (inner) =>
            createTuple(
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
              initializers: (inner) => (isModelValue(inner, "Empty") ? inner : renameValues(inner)),
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
  const renameObject = (object: Value) =>
    except(object, {
      proto: renameMaybe,
      props: (props) => {
        const buckets = toFiniteFunction(props);
        const kept = buckets.range.flatMap((bucket, position) =>
          toFiniteFunction(bucket).domain.length === 0
            ? []
            : [{ key: buckets.domain[position], bucket: mapRange(bucket, renameDescriptor) }],
        );
        return setFunctionClass(
          createSortedFunction(
            kept.map((entry) => entry.key),
            kept.map((entry) => entry.bucket),
          ),
          buckets.functionClass,
        );
      },
      privs: renameElements,
      slots: () => renameSlots(object),
    });
  const renameBindings = (bindings: Value) =>
    mapRange(bindings, (binding) => except(binding, { value: renameMaybe }));
  const renameEnvironmentRecord = (environment: Value) => {
    const kind = getString(environment, "kind");
    return except(
      environment,
      kind === "declarative" || kind === "catch" || kind === "module"
        ? { outer: renameEnvironment, b: renameBindings }
        : kind === "function"
          ? {
              outer: renameEnvironment,
              b: renameBindings,
              this: renameMaybe,
              fn: renameValue,
              newTarget: renameMaybe,
            }
          : kind === "object"
            ? { outer: renameEnvironment, obj: renameValue }
            : { outer: renameEnvironment, this: renameMaybe },
    );
  };
  const changedSet = new Set(changed);
  const objects = [
    ...Array.from({ length: realm.objects }, (_, index) => {
      const record = heapGet(objs, index + 1);
      return changedSet.has(index + 1) ? renameObject(record) : record;
    }),
    ...order.filter((node) => node > 0).map((node) => renameObject(heapGet(objs, node))),
  ];
  const environments = [
    ...Array.from({ length: realm.environments }, (_, index) =>
      renameEnvironmentRecord(heapGet(envs, index + 1)),
    ),
    ...order
      .filter((node) => node < 0)
      .map((node) => renameEnvironmentRecord(heapGet(envs, -node))),
  ];
  return except(state, {
    objs: () => createHeap(objects),
    envs: () => createHeap(environments),
    envsHeld: () => environments.length,
    templates: (inner) => mapRange(inner, renameValue),
    required: (inner) => mapRange(inner, (entry) => except(entry, { module: renameValue })),
    hostHandler: renameMaybe,
    hostImport: renameMaybe,
    modules: (inner) =>
      createTuple(
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
                : createRecord([
                    ["promise", renameValue(get(capability, "promise"))],
                    ["resolve", renameMaybe(get(capability, "resolve"))],
                    ["reject", renameMaybe(get(capability, "reject"))],
                  ]),
          }),
        ),
      ),
    hoisted: (inner) =>
      createSet(
        toFiniteSet(inner)
          .elements.map(getList)
          .filter((pair) => Number(pair[0]) <= realm.environments || numbers.has(-Number(pair[0])))
          .map((pair) => createTuple([renameEnvironment(pair[0]), pair[1]])),
      ),
    out: () => createTuple([]),
  });
};

export const ESCORE_CANONICAL_OPERATORS = [
  defineOperator("CanonicalStateOf", 2, (args) =>
    canonicalStateOf(getValue(args, 0, "CanonicalStateOf"), getValue(args, 1, "CanonicalStateOf")),
  ),
];
