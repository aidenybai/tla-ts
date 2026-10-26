import type { Bound, Definition, Expression, Module, SourceLocation } from "./ast";
import type { ConfigValue, ConstantAssignment, ModelConfig } from "./config";
import { TlaSyntaxError, TlaUnsupportedError } from "./errors";

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
  checkDeadlock?: boolean;
}

export interface Spec {
  build: () => { module: Module; config: ModelConfig };
}

const START: SourceLocation = { line: 0, column: 0 };

const IDENTIFIER = /^[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*$/;

const STANDARD_MODULES = ["Integers", "Sequences", "FiniteSets", "TLC"];

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

  cardinality() {
    return createApply("Cardinality", [this]);
  }

  at(...args: TermLike[]) {
    return new Term(() => ({
      kind: "FunctionApplication",
      function: this.build(),
      args: args.map(toExpression),
      location: START,
    }));
  }

  field(name: string) {
    return new Term(() => ({
      kind: "FieldAccess",
      record: this.build(),
      field: name,
      location: START,
    }));
  }

  except(key: TermLike, value: TermLike | ((current: Term) => TermLike)) {
    const updated =
      typeof value === "function"
        ? value(new Term(() => ({ kind: "ExceptAt", location: START })))
        : value;
    return new Term(() => ({
      kind: "Except",
      function: this.build(),
      updates: [
        { path: [{ kind: "Index", args: [toExpression(key)] }], value: toExpression(updated) },
      ],
      location: START,
    }));
  }

  domain() {
    return createApply("DOMAIN", [this]);
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

  prime() {
    return new Term(() => ({ kind: "Prime", expression: this.build(), location: START }));
  }
}

const toExpression = (value: TermLike): Expression => {
  if (value instanceof Term) return value.build();
  if (typeof value === "string") return { kind: "String", value, location: START };
  if (typeof value === "boolean")
    return { kind: "Identifier", name: value ? "TRUE" : "FALSE", location: START };
  if (!Number.isInteger(value))
    throw new TlaUnsupportedError(`The number ${value} is not an integer`);
  const number: Expression = { kind: "Number", value: Math.abs(value), location: START };
  return value < 0 ? { kind: "Apply", operator: "-.", args: [number], location: START } : number;
};

const toTerm = (value: TermLike) =>
  value instanceof Term ? value : new Term(() => toExpression(value));

const createReference = (name: string) =>
  new Term(() => ({ kind: "Identifier", name, location: START }));

const createApply = (operator: string, args: TermLike[]) =>
  args.length === 0
    ? createReference(operator)
    : new Term(() => ({ kind: "Apply", operator, args: args.map(toExpression), location: START }));

const createJunction = (kind: "And" | "Or", operands: TermLike[]) =>
  operands.length === 1
    ? toTerm(operands[0])
    : new Term(() => ({ kind, operands: operands.map(toExpression), location: START }));

const toBounds = (names: string[], set: TermLike): Bound[] => {
  const expression = toExpression(set);
  return names.map((name) => ({ pattern: { kind: "Name", name }, set: expression }));
};

const toConfigValue = (value: ConstantValue): ConfigValue => {
  if (Array.isArray(value)) return { kind: "Set", elements: value.map(toConfigValue) };
  if (typeof value === "number") return { kind: "Number", value };
  if (typeof value === "string") return { kind: "String", value };
  if (typeof value === "boolean") return { kind: "Boolean", value };
  return value;
};

const createDefinition = (name: string, params: string[], body: Expression): Definition => ({
  kind: "Operator",
  name,
  params: params.map((param) => ({ name: param, arity: 0 })),
  body,
  isLocal: false,
  isRecursive: true,
  location: START,
});

const createBuilder = () => {
  const names = new Set<string>();
  const variables: string[] = [];
  const constants: ConstantAssignment[] = [];
  const definitions: (() => Definition)[] = [];
  const definitionNames = new WeakMap<Term, string>();
  const boundCount = { value: 0 };

  const declare = (name: string) => {
    if (!IDENTIFIER.test(name))
      throw new TlaSyntaxError(`${JSON.stringify(name)} is not a TLA+ identifier`);
    if (names.has(name)) throw new TlaSyntaxError(`Multiply-defined symbol ${name}`);
    names.add(name);
  };

  // Bound names are not TLA+ identifiers, so they never capture a declared name.
  const createBoundNames = (count: number) =>
    Array.from({ length: count }, () => `_${++boundCount.value}`);

  const bind = (body: (...elements: Term[]) => TermLike) => {
    const boundNames = createBoundNames(Math.max(body.length, 1));
    return { names: boundNames, body: toTerm(body(...boundNames.map(createReference))) };
  };

  const createQuantifier =
    (kind: "Forall" | "Exists") => (set: TermLike, body: (...elements: Term[]) => TermLike) => {
      const bound = bind(body);
      return new Term(() => ({
        kind,
        bounds: toBounds(bound.names, set),
        body: bound.body.build(),
        location: START,
      }));
    };

  const defaultSubscript = createReference("vars");

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
    define: (name: string, value: TermLike) => {
      declare(name);
      definitions.push(() => createDefinition(name, [], toExpression(value)));
      const reference = createReference(name);
      definitionNames.set(reference, name);
      return reference;
    },
    operator: (name: string, body: (...params: Term[]) => TermLike) => {
      declare(name);
      definitions.push(() => {
        const params = createBoundNames(body.length);
        return createDefinition(name, params, toExpression(body(...params.map(createReference))));
      });
      return (...args: TermLike[]) => createApply(name, args);
    },
    call: (operator: string, ...args: TermLike[]) => createApply(operator, args),
    Nat: createReference("Nat"),
    Int: createReference("Int"),
    BOOLEAN: createReference("BOOLEAN"),
    STRING: createReference("STRING"),
    set: (...elements: TermLike[]) =>
      new Term(() => ({
        kind: "SetEnumeration",
        elements: elements.map(toExpression),
        location: START,
      })),
    tuple: (...elements: TermLike[]) =>
      new Term(() => ({ kind: "Tuple", elements: elements.map(toExpression), location: START })),
    record: (fields: Record<string, TermLike>) =>
      new Term(() => ({
        kind: "Record",
        fields: Object.entries(fields).map(([name, value]) => ({
          name,
          value: toExpression(value),
        })),
        location: START,
      })),
    recordSet: (fields: Record<string, TermLike>) =>
      new Term(() => ({
        kind: "RecordSet",
        fields: Object.entries(fields).map(([name, value]) => ({
          name,
          value: toExpression(value),
        })),
        location: START,
      })),
    range: (low: TermLike, high: TermLike) => createApply("..", [low, high]),
    functions: (domain: TermLike, range: TermLike) =>
      new Term(() => ({
        kind: "FunctionSet",
        domain: toExpression(domain),
        range: toExpression(range),
        location: START,
      })),
    fn: (set: TermLike, body: (...elements: Term[]) => TermLike) => {
      const bound = bind(body);
      return new Term(() => ({
        kind: "FunctionConstruction",
        bounds: toBounds(bound.names, set),
        body: bound.body.build(),
        location: START,
      }));
    },
    forall: createQuantifier("Forall"),
    exists: createQuantifier("Exists"),
    choose: (set: TermLike, predicate: (element: Term) => TermLike) => {
      const bound = bind(predicate);
      return new Term(() => ({
        kind: "Choose",
        pattern: { kind: "Name", name: bound.names[0] },
        set: toExpression(set),
        body: bound.body.build(),
        location: START,
      }));
    },
    filter: (set: TermLike, predicate: (element: Term) => TermLike) => {
      const bound = bind(predicate);
      return new Term(() => ({
        kind: "SetFilter",
        bound: toBounds(bound.names, set)[0],
        predicate: bound.body.build(),
        location: START,
      }));
    },
    map: (set: TermLike, body: (...elements: Term[]) => TermLike) => {
      const bound = bind(body);
      return new Term(() => ({
        kind: "SetMap",
        expression: bound.body.build(),
        bounds: toBounds(bound.names, set),
        location: START,
      }));
    },
    product: (...sets: TermLike[]) =>
      new Term(() => ({ kind: "Product", factors: sets.map(toExpression), location: START })),
    let: (value: TermLike, body: (name: Term) => TermLike) => {
      const name = createBoundNames(1)[0];
      const result = toTerm(body(createReference(name)));
      return new Term(() => ({
        kind: "Let",
        definitions: [{ ...createDefinition(name, [], toExpression(value)), isRecursive: false }],
        body: result.build(),
        location: START,
      }));
    },
    and: (...operands: TermLike[]) => createJunction("And", operands),
    or: (...operands: TermLike[]) => createJunction("Or", operands),
    not: (operand: TermLike) => createApply("~", [operand]),
    implies: (left: TermLike, right: TermLike) => createApply("=>", [left, right]),
    equivalent: (left: TermLike, right: TermLike) => createApply("<=>", [left, right]),
    ifThenElse: (condition: TermLike, consequent: TermLike, alternative: TermLike) =>
      new Term(() => ({
        kind: "If",
        condition: toExpression(condition),
        consequent: toExpression(consequent),
        alternative: toExpression(alternative),
        location: START,
      })),
    cases: (arms: [TermLike, TermLike][], other?: TermLike) =>
      new Term(() => ({
        kind: "Case",
        arms: arms.map(([condition, body]) => ({
          condition: toExpression(condition),
          body: toExpression(body),
        })),
        other: other === undefined ? undefined : toExpression(other),
        location: START,
      })),
    unchanged: (...terms: TermLike[]) => {
      const expression = terms.length === 1 ? toTerm(terms[0]) : tla.tuple(...terms);
      return new Term(() => ({
        kind: "Unchanged",
        expression: expression.build(),
        location: START,
      }));
    },
    enabled: (action: TermLike) =>
      new Term(() => ({ kind: "Enabled", expression: toExpression(action), location: START })),
    always: (formula: TermLike) =>
      new Term(() => ({ kind: "Always", expression: toExpression(formula), location: START })),
    eventually: (formula: TermLike) =>
      new Term(() => ({ kind: "Eventually", expression: toExpression(formula), location: START })),
    leadsTo: (left: TermLike, right: TermLike) => createApply("~>", [left, right]),
    boxAction: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      new Term(() => ({
        kind: "BoxAction",
        action: toExpression(action),
        subscript: toExpression(subscript),
        location: START,
      })),
    angleAction: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      new Term(() => ({
        kind: "AngleAction",
        action: toExpression(action),
        subscript: toExpression(subscript),
        location: START,
      })),
    weakFairness: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      new Term(() => ({
        kind: "WeakFairness",
        subscript: toExpression(subscript),
        action: toExpression(action),
        location: START,
      })),
    strongFairness: (action: TermLike, subscript: TermLike = defaultSubscript) =>
      new Term(() => ({
        kind: "StrongFairness",
        subscript: toExpression(subscript),
        action: toExpression(action),
        location: START,
      })),
  };

  const getName = (name: string, value: TermLike) => {
    if (value instanceof Term && definitionNames.get(value) === name) return name;
    tla.define(name, value);
    return name;
  };
  const getNames = (entries: Record<string, TermLike> = {}) =>
    Object.entries(entries).map(([name, value]) => getName(name, value));

  const toModel = (definition: SpecDefinition) => {
    tla.define("vars", tla.tuple(...variables.map(createReference)));
    const init = getName("Init", definition.init);
    const next = getName("Next", definition.next);
    tla.define(
      "Spec",
      tla.and(
        createReference(init),
        tla.always(tla.boxAction(createReference(next))),
        ...(definition.fairness ?? []),
      ),
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
      view: undefined,
    };
    const module: Module = {
      name: "Spec",
      extends: STANDARD_MODULES,
      constants: constants.map((constant) => ({ name: constant.name, arity: 0 })),
      variables,
      definitions: definitions.map((createLazyDefinition) => createLazyDefinition()),
      instances: [],
      assumptions: [],
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
