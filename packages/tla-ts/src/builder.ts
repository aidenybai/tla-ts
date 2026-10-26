import type {
  Assumption,
  Bound,
  Definition,
  Expression,
  Instance,
  Module,
  OperatorParam,
  SourceLocation,
} from "./ast";
import type { ConfigValue, ConstantAssignment, ModelConfig } from "./config";
import { TlaSyntaxError, TlaUnsupportedError } from "./errors";
import { getChildren } from "./evaluate";
import { parseModule } from "./parser";
import { getStandardModule, REALS_SOURCE } from "./standard-modules";

export type TermLike = Term | number | string | boolean;

export type ConstantValue = number | string | boolean | ConfigValue | ConstantValue[];

export interface SpecDefinition {
  init: TermLike;
  next: TermLike;
  fairness?: TermLike[];
  invariants?: Record<string, TermLike>;
  properties?: Record<string, TermLike>;
  constraints?: Record<string, TermLike>;
  actionConstraints?: Record<string, TermLike>;
  symmetry?: TermLike;
  view?: TermLike;
  assumptions?: Record<string, TermLike>;
  checkDeadlock?: boolean;
}

export interface Spec {
  build: () => { module: Module; config: ModelConfig };
}

type BoundSets = TermLike | readonly TermLike[];

type Elements<Sets extends BoundSets> = Sets extends readonly TermLike[]
  ? { -readonly [Index in keyof Sets]: Term }
  : [element: Term];

type OperatorHandle = (...args: never) => Term;

type ApplyArgument = TermLike | OperatorHandle;

type Holes<Text extends string> = Text extends `${string},${infer Rest}`
  ? [TermLike, ...Holes<Rest>]
  : [TermLike];

type Param<Name> = Name extends `${string}(${infer Text})` ? (...args: Holes<Text>) => Term : Term;

type Argument<Name> = Name extends `${string}(${string})` ? Term | OperatorHandle : TermLike;

type Params<Names extends readonly string[]> = {
  -readonly [Index in keyof Names]: Param<Names[Index]>;
};

type Arguments<Names extends readonly string[]> = {
  -readonly [Index in keyof Names]: Argument<Names[Index]>;
};

type Terms<Names extends readonly string[]> = { -readonly [Index in keyof Names]: Term };

const START: SourceLocation = { line: 0, column: 0 };

const IDENTIFIER = /^[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*$/;

const PARAM = /^([A-Za-z0-9_]+)(?:\((\s*_\s*(?:,\s*_\s*)*)\))?$/;

const STACK_FRAME = /(?:\(|at |@)([^()]*?):(\d+):(\d+)\)?$/;

const REALS = parseModule(REALS_SOURCE);

const STANDARD_MODULES = [
  "Naturals",
  "Integers",
  "Reals",
  "Sequences",
  "FiniteSets",
  "Bags",
  "TLC",
].map((name) => {
  const module = getStandardModule(name, () => {});
  return name === "Reals"
    ? {
        name,
        operators: REALS.definitions.map((definition) => definition.name),
        extends: REALS.extends,
      }
    : {
        name,
        operators: module?.operators.map((operator) => operator.name) ?? [],
        extends: module?.extends ?? [],
      };
});

const STANDARD_OPERATORS = new Map(
  STANDARD_MODULES.flatMap((standard) =>
    standard.operators.map((operator): [string, string] => [operator, standard.name]),
  ),
);

const boundCount = { value: 0 };

const operatorHandles = new WeakMap<OperatorHandle, string>();

const parseCallSite = (stack: string) => {
  const frames = stack.split("\n").flatMap((line) => {
    const match = STACK_FRAME.exec(line.trim());
    return match ? [{ line: Number(match[2]), column: Number(match[3]), file: match[1] }] : [];
  });
  return frames.find((frame) => frame.file !== frames[0].file) ?? START;
};

// HACK: formatting a stack costs tens of microseconds, so getters format it only when an error message reads the location
const getCallSite = (): SourceLocation => {
  const error = new Error();
  const cache: { location?: SourceLocation } = {};
  const getLocation = () => (cache.location ??= parseCallSite(error.stack ?? ""));
  return {
    get line() {
      return getLocation().line;
    },
    get column() {
      return getLocation().column;
    },
    get file() {
      return getLocation().file;
    },
  };
};

export class Term {
  constructor(readonly build: () => Expression) {}

  eq(other: TermLike) {
    return createApply("=", [this, other]);
  }

  neq(other: TermLike) {
    return createApply("#", [this, other]);
  }

  lt(other: TermLike) {
    return createApply("<", [this, other]);
  }

  le(other: TermLike) {
    return createApply("<=", [this, other]);
  }

  gt(other: TermLike) {
    return createApply(">", [this, other]);
  }

  ge(other: TermLike) {
    return createApply(">=", [this, other]);
  }

  plus(other: TermLike) {
    return createApply("+", [this, other]);
  }

  minus(other: TermLike) {
    return createApply("-", [this, other]);
  }

  times(other: TermLike) {
    return createApply("*", [this, other]);
  }

  div(other: TermLike) {
    return createApply("\\div", [this, other]);
  }

  mod(other: TermLike) {
    return createApply("%", [this, other]);
  }

  divide(other: TermLike) {
    return createApply("/", [this, other]);
  }

  power(exponent: TermLike) {
    return createApply("^", [this, exponent]);
  }

  negate() {
    return createApply("-.", [this]);
  }

  in(set: TermLike) {
    return createApply("\\in", [this, set]);
  }

  notIn(set: TermLike) {
    return createApply("\\notin", [this, set]);
  }

  subsetOf(set: TermLike) {
    return createApply("\\subseteq", [this, set]);
  }

  union(set: TermLike) {
    return createApply("\\cup", [this, set]);
  }

  intersect(set: TermLike) {
    return createApply("\\cap", [this, set]);
  }

  difference(set: TermLike) {
    return createApply("\\", [this, set]);
  }

  powerset() {
    return createApply("SUBSET", [this]);
  }

  bigUnion() {
    return createApply("UNION", [this]);
  }

  cardinality() {
    return createApply("Cardinality", [this]);
  }

  isFiniteSet() {
    return createApply("IsFiniteSet", [this]);
  }

  permutations() {
    return createApply("Permutations", [this]);
  }

  randomElement() {
    return createApply("RandomElement", [this]);
  }

  isABag() {
    return createApply("IsABag", [this]);
  }

  bagToSet() {
    return createApply("BagToSet", [this]);
  }

  setToBag() {
    return createApply("SetToBag", [this]);
  }

  bagIn(bag: TermLike) {
    return createApply("BagIn", [this, bag]);
  }

  copiesIn(bag: TermLike) {
    return createApply("CopiesIn", [this, bag]);
  }

  bagAdd(bag: TermLike) {
    return createApply("\\oplus", [this, bag]);
  }

  bagSubtract(bag: TermLike) {
    return createApply("\\ominus", [this, bag]);
  }

  isSubBagOf(bag: TermLike) {
    return createApply("\\sqsubseteq", [this, bag]);
  }

  bagUnion() {
    return createApply("BagUnion", [this]);
  }

  subBags() {
    return createApply("SubBag", [this]);
  }

  bagOfAll(map: (element: Term) => TermLike) {
    return createApply("BagOfAll", [createLambda(createBoundNames(1), map), this]);
  }

  bagCardinality() {
    return createApply("BagCardinality", [this]);
  }

  at(...args: TermLike[]) {
    return createTerm((location) => ({
      kind: "FunctionApplication",
      function: this.build(),
      args: args.map(toExpression),
      location,
    }));
  }

  field(name: string) {
    return createTerm((location) => ({
      kind: "FieldAccess",
      record: this.build(),
      field: name,
      location,
    }));
  }

  except(key: TermLike, value: TermLike | ((current: Term) => TermLike)) {
    const updated =
      typeof value === "function"
        ? value(createTerm((location) => ({ kind: "ExceptAt", location })))
        : value;
    return createTerm((location) => ({
      kind: "Except",
      function: this.build(),
      updates: [
        { path: [{ kind: "Index", args: [toExpression(key)] }], value: toExpression(updated) },
      ],
      location,
    }));
  }

  domain() {
    return createApply("DOMAIN", [this]);
  }

  mapsTo(value: TermLike) {
    return createApply(":>", [this, value]);
  }

  merge(other: TermLike) {
    return createApply("@@", [this, other]);
  }

  length() {
    return createApply("Len", [this]);
  }

  append(element: TermLike) {
    return createApply("Append", [this, element]);
  }

  concat(sequence: TermLike) {
    return createApply("\\o", [this, sequence]);
  }

  head() {
    return createApply("Head", [this]);
  }

  tail() {
    return createApply("Tail", [this]);
  }

  subSeq(from: TermLike, to: TermLike) {
    return createApply("SubSeq", [this, from, to]);
  }

  selectSeq(test: (element: Term) => TermLike) {
    return createApply("SelectSeq", [this, createLambda(createBoundNames(1), test)]);
  }

  sortSeq(precedes: (left: Term, right: Term) => TermLike) {
    return createApply("SortSeq", [this, createLambda(createBoundNames(2), precedes)]);
  }

  prime() {
    return createTerm((location) => ({ kind: "Prime", expression: this.build(), location }));
  }
}

const toExpression = (value: TermLike): Expression => {
  if (value instanceof Term) return value.build();
  if (typeof value === "string") return { kind: "String", value, location: START };
  if (typeof value === "boolean")
    return { kind: "Identifier", name: value ? "TRUE" : "FALSE", location: START };
  if (!Number.isFinite(value)) throw new TlaUnsupportedError(`The number ${value} is not finite`);
  const number: Expression = Number.isInteger(value)
    ? { kind: "Number", value: Math.abs(value), location: START }
    : { kind: "Decimal", text: String(Math.abs(value)), location: START };
  return value < 0 ? { kind: "Apply", operator: "-.", args: [number], location: START } : number;
};

const toTerm = (value: TermLike) =>
  value instanceof Term ? value : new Term(() => toExpression(value));

const createTerm = (build: (location: SourceLocation) => Expression) => {
  const location = getCallSite();
  return new Term(() => build(location));
};

const createReference = (name: string, location = getCallSite()) =>
  new Term(() => ({ kind: "Identifier", name, location }));

const toArgument = (argument: ApplyArgument, location: SourceLocation): Expression => {
  if (typeof argument !== "function") return toExpression(argument);
  const operator = operatorHandles.get(argument);
  if (operator === undefined)
    throw new TlaSyntaxError("An operator argument must come from tla.operator or tla.letOperator");
  return { kind: "OperatorReference", operator, location };
};

const createApply = (operator: string, args: ApplyArgument[]) =>
  args.length === 0
    ? createReference(operator)
    : createTerm((location) => ({
        kind: "Apply",
        operator,
        args: args.map((argument) => toArgument(argument, location)),
        location,
      }));

const createOperatorHandle = (name: string) => {
  const handle = (...args: ApplyArgument[]) => createApply(name, args);
  operatorHandles.set(handle, name);
  return handle;
};

const toOperatorParam = (spec: string): OperatorParam => {
  const match = PARAM.exec(spec);
  if (!match) throw new TlaSyntaxError(`${JSON.stringify(spec)} is not a TLA+ parameter`);
  return { name: match[1], arity: match[2] === undefined ? 0 : match[2].split(",").length };
};

const bindParams = (specs: readonly string[], location?: SourceLocation) => {
  const params = specs.map(toOperatorParam);
  return {
    params,
    references: params.map((param) =>
      param.arity === 0
        ? createReference(param.name, location)
        : (...args: ApplyArgument[]) => createApply(param.name, args),
    ),
  };
};

const createJunction = (kind: "And" | "Or", operands: TermLike[]) =>
  operands.length === 1
    ? toTerm(operands[0])
    : createTerm((location) => ({ kind, operands: operands.map(toExpression), location }));

// Bound names are not TLA+ identifiers, so they never capture a declared name.
const createBoundNames = (count: number) =>
  Array.from({ length: count }, () => `_${++boundCount.value}`);

const createLambda = (params: string[], body: (...params: Term[]) => TermLike) => {
  const result = toTerm(body(...params.map((param) => createReference(param))));
  return createTerm((location) => ({ kind: "Lambda", params, body: result.build(), location }));
};

const toSetList = (sets: BoundSets): readonly TermLike[] =>
  typeof sets === "object" && !(sets instanceof Term) ? sets : [sets];

const bindSets = <const Sets extends BoundSets>(
  sets: Sets,
  body: (...elements: Elements<Sets>) => TermLike,
  location?: SourceLocation,
) => {
  const setList = toSetList(sets);
  const names = createBoundNames(setList.length);
  const elements = names.map((name) => createReference(name, location)) as Elements<Sets>;
  return {
    body: toTerm(body(...elements)),
    getBounds: () =>
      names.map((name, index): Bound => ({
        pattern: { kind: "Name", name },
        set: toExpression(setList[index]),
      })),
  };
};

const createQuantifier = (kind: "Forall" | "Exists", bound: ReturnType<typeof bindSets>) =>
  createTerm((location) => ({
    kind,
    bounds: bound.getBounds(),
    body: bound.body.build(),
    location,
  }));

const createUnboundedQuantifier = (body: (element: Term) => TermLike) => {
  const name = createBoundNames(1)[0];
  const result = toTerm(body(createReference(name)));
  return createTerm((location) => ({
    kind: "UnboundedQuantifier",
    names: [name],
    body: result.build(),
    location,
  }));
};

const toConfigValue = (value: ConstantValue): ConfigValue => {
  if (Array.isArray(value)) return { kind: "Set", elements: value.map(toConfigValue) };
  if (typeof value === "number") return { kind: "Number", value };
  if (typeof value === "string") return { kind: "String", value };
  if (typeof value === "boolean") return { kind: "Boolean", value };
  return value;
};

const createDefinition = (
  name: string,
  params: OperatorParam[],
  body: Expression,
  location: SourceLocation,
): Definition => ({
  kind: "Operator",
  name,
  params,
  body,
  isLocal: false,
  isRecursive: true,
  location,
});

const createInstance = (
  name: string | undefined,
  params: OperatorParam[],
  module: string,
  substitutions: Record<string, TermLike>,
  location: SourceLocation,
): Instance => ({
  kind: "Instance",
  name,
  params,
  module,
  substitutions: Object.entries(substitutions).map(([target, value]) => ({
    name: target,
    expression: toExpression(value),
  })),
  isLocal: false,
  location,
});

const getStandardExtends = (expressions: Expression[], declared: Set<string>) => {
  const used = new Set<string>();
  const visit = (expression: Expression) => {
    const name =
      expression.kind === "Apply" || expression.kind === "OperatorReference"
        ? expression.operator
        : expression.kind === "Identifier"
          ? expression.name
          : undefined;
    const module =
      name === undefined || declared.has(name) ? undefined : STANDARD_OPERATORS.get(name);
    if (module !== undefined) used.add(module);
    getChildren(expression).forEach(visit);
  };
  expressions.forEach(visit);
  return STANDARD_MODULES.map((standard) => standard.name).filter((name) => used.has(name));
};

const getVisibleModules = (names: string[]): string[] =>
  names.flatMap((name) => [
    name,
    ...getVisibleModules(
      STANDARD_MODULES.find((standard) => standard.name === name)?.extends ?? [],
    ),
  ]);

const createBuilder = () => {
  const names = new Set<string>();
  const variables: string[] = [];
  const constants: ConstantAssignment[] = [];
  const definitions: (() => Definition)[] = [];
  const instances: (() => Instance)[] = [];
  const definitionNames = new WeakMap<Term, string>();

  const checkName = (name: string) => {
    if (!IDENTIFIER.test(name))
      throw new TlaSyntaxError(`${JSON.stringify(name)} is not a TLA+ identifier`);
    if (names.has(name)) throw new TlaSyntaxError(`Multiply-defined symbol ${name}`);
  };
  const declare = (name: string) => {
    checkName(name);
    names.add(name);
  };
  const checkParams = <Param extends { name: string }>(params: Param[]) => {
    const paramNames = params.map((param) => param.name);
    paramNames.forEach(checkName);
    if (new Set(paramNames).size < paramNames.length)
      throw new TlaSyntaxError(`Multiply-defined parameter in ${paramNames.join(", ")}`);
    return params;
  };

  const addDefinition = (name: string, value: TermLike, location: SourceLocation) => {
    declare(name);
    definitions.push(() => createDefinition(name, [], toExpression(value), location));
    const reference = createReference(name, location);
    definitionNames.set(reference, name);
    return reference;
  };

  const defaultSubscript = createReference("vars", START);

  const tla = {
    variable: (name: string) => {
      declare(name);
      variables.push(name);
      return createReference(name);
    },
    constant: (name: string, value: ConstantValue) => {
      declare(name);
      constants.push({ name, value: toConfigValue(value) });
      return createReference(name);
    },
    modelValue: (name: string): ConfigValue => ({ kind: "ModelValue", name }),
    define: (name: string, value: TermLike) => addDefinition(name, value, getCallSite()),
    operator: <const Names extends readonly string[]>(
      name: string,
      params: Names,
      body: (...params: Params<Names>) => TermLike,
    ) => {
      declare(name);
      const location = getCallSite();
      definitions.push(() => {
        const bound = bindParams(params, location);
        return createDefinition(
          name,
          checkParams(bound.params),
          toExpression(body(...(bound.references as Params<Names>))),
          location,
        );
      });
      return createOperatorHandle(name) as (...args: Arguments<Names>) => Term;
    },
    function: <const Sets extends BoundSets>(
      name: string,
      sets: Sets,
      body: (...elements: Elements<Sets>) => TermLike,
    ) => {
      declare(name);
      const location = getCallSite();
      definitions.push(() => {
        const bound = bindSets(sets, body, location);
        return {
          kind: "Function",
          name,
          bounds: bound.getBounds(),
          body: bound.body.build(),
          isLocal: false,
          isRecursive: true,
          location,
        };
      });
      return createReference(name, location);
    },
    lambda: <const Names extends readonly string[]>(
      params: Names,
      body: (...params: Terms<Names>) => TermLike,
    ) => {
      const references = params.map((param) => createReference(param)) as Terms<Names>;
      const result = toTerm(body(...references));
      return createTerm((location) => ({
        kind: "Lambda",
        params: checkParams(params.map((param) => ({ name: param }))).map((param) => param.name),
        body: result.build(),
        location,
      }));
    },
    instance: (name: string, module: string, substitutions: Record<string, TermLike> = {}) => {
      declare(name);
      const location = getCallSite();
      instances.push(() => createInstance(name, [], module, substitutions, location));
      return (operator: string, ...args: ApplyArgument[]) =>
        createApply(`${name}!${operator}`, args);
    },
    unnamedInstance: (module: string, substitutions: Record<string, TermLike> = {}) => {
      const location = getCallSite();
      instances.push(() => createInstance(undefined, [], module, substitutions, location));
      return (operator: string, ...args: ApplyArgument[]) => createApply(operator, args);
    },
    parameterizedInstance: <const Names extends readonly string[]>(
      name: string,
      params: Names,
      module: string,
      getSubstitutions: (...params: Params<Names>) => Record<string, TermLike>,
    ) => {
      declare(name);
      const location = getCallSite();
      instances.push(() => {
        const bound = bindParams(params, location);
        return createInstance(
          name,
          checkParams(bound.params),
          module,
          getSubstitutions(...(bound.references as Params<Names>)),
          location,
        );
      });
      return (...instanceArgs: Arguments<Names>) =>
        (operator: string, ...args: ApplyArgument[]) =>
          createApply(`${name}!${operator}`, [...instanceArgs, ...args]);
    },
    Nat: createReference("Nat"),
    Int: createReference("Int"),
    BOOLEAN: createReference("BOOLEAN"),
    STRING: createReference("STRING"),
    value: (literal: TermLike) => toTerm(literal),
    JavaTime: createReference("JavaTime"),
    EmptyBag: createReference("EmptyBag"),
    Real: createReference("Real"),
    Infinity: createReference("Infinity"),
    seq: (set: TermLike) => createApply("Seq", [set]),
    print: (output: TermLike, value: TermLike) => createApply("Print", [output, value]),
    printT: (output: TermLike) => createApply("PrintT", [output]),
    assert: (condition: TermLike, message: TermLike) => createApply("Assert", [condition, message]),
    toString: (value: TermLike) => createApply("ToString", [value]),
    tlcEval: (value: TermLike) => createApply("TLCEval", [value]),
    set: (...elements: TermLike[]) =>
      createTerm((location) => ({
        kind: "SetEnumeration",
        elements: elements.map(toExpression),
        location,
      })),
    tuple: (...elements: TermLike[]) =>
      createTerm((location) => ({
        kind: "Tuple",
        elements: elements.map(toExpression),
        location,
      })),
    record: (fields: Record<string, TermLike>) =>
      createTerm((location) => ({
        kind: "Record",
        fields: Object.entries(fields).map(([name, value]) => ({
          name,
          value: toExpression(value),
        })),
        location,
      })),
    recordSet: (fields: Record<string, TermLike>) =>
      createTerm((location) => ({
        kind: "RecordSet",
        fields: Object.entries(fields).map(([name, value]) => ({
          name,
          value: toExpression(value),
        })),
        location,
      })),
    range: (low: TermLike, high: TermLike) => createApply("..", [low, high]),
    product: (...sets: TermLike[]) =>
      createTerm((location) => ({ kind: "Product", factors: sets.map(toExpression), location })),
    functions: (domain: TermLike, range: TermLike) =>
      createTerm((location) => ({
        kind: "FunctionSet",
        domain: toExpression(domain),
        range: toExpression(range),
        location,
      })),
    fn: <const Sets extends BoundSets>(
      sets: Sets,
      body: (...elements: Elements<Sets>) => TermLike,
    ) => {
      const bound = bindSets(sets, body);
      return createTerm((location) => ({
        kind: "FunctionConstruction",
        bounds: bound.getBounds(),
        body: bound.body.build(),
        location,
      }));
    },
    forall: <const Sets extends BoundSets>(
      sets: Sets,
      body: (...elements: Elements<Sets>) => TermLike,
    ) => createQuantifier("Forall", bindSets(sets, body)),
    exists: <const Sets extends BoundSets>(
      sets: Sets,
      body: (...elements: Elements<Sets>) => TermLike,
    ) => createQuantifier("Exists", bindSets(sets, body)),
    unboundedForall: createUnboundedQuantifier,
    unboundedExists: createUnboundedQuantifier,
    choose: (set: TermLike, predicate: (element: Term) => TermLike) => {
      const bound = bindSets(set, predicate);
      return createTerm((location) => ({
        kind: "Choose",
        pattern: bound.getBounds()[0].pattern,
        set: toExpression(set),
        body: bound.body.build(),
        location,
      }));
    },
    unboundedChoose: (predicate: (element: Term) => TermLike) => {
      const name = createBoundNames(1)[0];
      const result = toTerm(predicate(createReference(name)));
      return createTerm((location) => ({
        kind: "Choose",
        pattern: { kind: "Name", name },
        set: undefined,
        body: result.build(),
        location,
      }));
    },
    filter: (set: TermLike, predicate: (element: Term) => TermLike) => {
      const bound = bindSets(set, predicate);
      return createTerm((location) => ({
        kind: "SetFilter",
        bound: bound.getBounds()[0],
        predicate: bound.body.build(),
        location,
      }));
    },
    map: <const Sets extends BoundSets>(
      sets: Sets,
      body: (...elements: Elements<Sets>) => TermLike,
    ) => {
      const bound = bindSets(sets, body);
      return createTerm((location) => ({
        kind: "SetMap",
        expression: bound.body.build(),
        bounds: bound.getBounds(),
        location,
      }));
    },
    let: (value: TermLike, body: (name: Term) => TermLike) => {
      const name = createBoundNames(1)[0];
      const result = toTerm(body(createReference(name)));
      return createTerm((location) => ({
        kind: "Let",
        definitions: [
          { ...createDefinition(name, [], toExpression(value), location), isRecursive: false },
        ],
        body: result.build(),
        location,
      }));
    },
    letOperator: <const Names extends readonly string[]>(
      params: Names,
      definition: (
        ...params: [...Params<Names>, self: (...args: Arguments<Names>) => Term]
      ) => TermLike,
      body: (operator: (...args: Arguments<Names>) => Term) => TermLike,
    ) => {
      const name = createBoundNames(1)[0];
      const operator = createOperatorHandle(name) as (...args: Arguments<Names>) => Term;
      const bound = bindParams(params);
      const definitionBody = toTerm(definition(...(bound.references as Params<Names>), operator));
      const result = toTerm(body(operator));
      return createTerm((location) => ({
        kind: "Let",
        definitions: [
          createDefinition(name, checkParams(bound.params), definitionBody.build(), location),
        ],
        body: result.build(),
        location,
      }));
    },
    and: (...operands: TermLike[]) => createJunction("And", operands),
    or: (...operands: TermLike[]) => createJunction("Or", operands),
    not: (operand: TermLike) => createApply("~", [operand]),
    implies: (left: TermLike, right: TermLike) => createApply("=>", [left, right]),
    equivalent: (left: TermLike, right: TermLike) => createApply("<=>", [left, right]),
    ifThenElse: (condition: TermLike, consequent: TermLike, alternative: TermLike) =>
      createTerm((location) => ({
        kind: "If",
        condition: toExpression(condition),
        consequent: toExpression(consequent),
        alternative: toExpression(alternative),
        location,
      })),
    cases: (arms: [TermLike, TermLike][], other?: TermLike) =>
      createTerm((location) => ({
        kind: "Case",
        arms: arms.map(([condition, body]) => ({
          condition: toExpression(condition),
          body: toExpression(body),
        })),
        other: other === undefined ? undefined : toExpression(other),
        location,
      })),
    unchanged: (...terms: TermLike[]) => {
      const expression = terms.length === 1 ? toTerm(terms[0]) : tla.tuple(...terms);
      return createTerm((location) => ({
        kind: "Unchanged",
        expression: expression.build(),
        location,
      }));
    },
    enabled: (action: TermLike) =>
      createTerm((location) => ({ kind: "Enabled", expression: toExpression(action), location })),
    always: (formula: TermLike) =>
      createTerm((location) => ({ kind: "Always", expression: toExpression(formula), location })),
    eventually: (formula: TermLike) =>
      createTerm((location) => ({
        kind: "Eventually",
        expression: toExpression(formula),
        location,
      })),
    leadsTo: (left: TermLike, right: TermLike) => createApply("~>", [left, right]),
    boxAction: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      createTerm((location) => ({
        kind: "BoxAction",
        action: toExpression(action),
        subscript: toExpression(subscript),
        location,
      })),
    angleAction: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      createTerm((location) => ({
        kind: "AngleAction",
        action: toExpression(action),
        subscript: toExpression(subscript),
        location,
      })),
    weakFairness: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      createTerm((location) => ({
        kind: "WeakFairness",
        subscript: toExpression(subscript),
        action: toExpression(action),
        location,
      })),
    strongFairness: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      createTerm((location) => ({
        kind: "StrongFairness",
        subscript: toExpression(subscript),
        action: toExpression(action),
        location,
      })),
  };

  const getName = (name: string, value: TermLike) => {
    if (value instanceof Term && definitionNames.get(value) === name) return name;
    addDefinition(name, value, START);
    return name;
  };
  const getNames = (entries: Record<string, TermLike> = {}) =>
    Object.entries(entries).map(([name, value]) => getName(name, value));

  const toModel = (definition: SpecDefinition) => {
    addDefinition(
      "vars",
      new Term(() => ({
        kind: "Tuple",
        elements: variables.map((name) => createReference(name, START).build()),
        location: START,
      })),
      START,
    );
    const init = getName("Init", definition.init);
    const next = getName("Next", definition.next);
    const fairness = definition.fairness ?? [];
    addDefinition(
      "Spec",
      new Term(() => ({
        kind: "And",
        operands: [
          createReference(init, START).build(),
          {
            kind: "Always",
            expression: {
              kind: "BoxAction",
              action: createReference(next, START).build(),
              subscript: defaultSubscript.build(),
              location: START,
            },
            location: START,
          },
          ...fairness.map(toExpression),
        ],
        location: START,
      })),
      START,
    );
    const config: ModelConfig = {
      init: undefined,
      next: undefined,
      specification: "Spec",
      invariants: getNames(definition.invariants),
      properties: getNames(definition.properties),
      constraints: getNames(definition.constraints),
      actionConstraints: getNames(definition.actionConstraints),
      constants,
      substitutions: [],
      checkDeadlock: definition.checkDeadlock ?? true,
      symmetry:
        definition.symmetry === undefined ? undefined : getName("Symmetry", definition.symmetry),
      view: definition.view === undefined ? undefined : getName("View", definition.view),
    };
    const assumptions = Object.entries(definition.assumptions ?? {}).map(
      ([name, value]): Assumption => {
        declare(name);
        return { name, expression: toExpression(value), isAxiom: false, location: START };
      },
    );
    const builtDefinitions = definitions.map((createLazyDefinition) => createLazyDefinition());
    const builtInstances = instances.map((createLazyInstance) => createLazyInstance());
    const standardExtends = getStandardExtends(
      [
        ...builtDefinitions.map((builtDefinition) => builtDefinition.body),
        ...assumptions.map((assumption) => assumption.expression),
        ...builtInstances.flatMap((builtInstance) =>
          builtInstance.substitutions.map((substitution) => substitution.expression),
        ),
      ],
      names,
    );
    const visibleModules = new Set(getVisibleModules(standardExtends));
    names.forEach((name) => {
      const module = STANDARD_OPERATORS.get(name);
      if (module !== undefined && visibleModules.has(module))
        throw new TlaSyntaxError(`Multiply-defined symbol ${name} conflicts with module ${module}`);
    });
    const module: Module = {
      name: "Spec",
      outer: undefined,
      modules: [],
      extends: standardExtends,
      constants: constants.map((constant) => ({ name: constant.name, arity: 0 })),
      variables,
      definitions: builtDefinitions,
      instances: builtInstances,
      assumptions,
    };
    return { module, config };
  };

  return { tla, toModel };
};

export type SpecBuilder = ReturnType<typeof createBuilder>["tla"];

export const defineSpec = (describe: (tla: SpecBuilder) => SpecDefinition): Spec => ({
  build: () => {
    const builder = createBuilder();
    return builder.toModel(describe(builder.tla));
  },
});
