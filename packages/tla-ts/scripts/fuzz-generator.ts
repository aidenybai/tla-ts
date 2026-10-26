interface IntType {
  kind: "Int";
}

interface BoolType {
  kind: "Bool";
}

interface StringType {
  kind: "String";
}

interface SetType {
  kind: "Set";
  element: FuzzType;
}

interface SequenceType {
  kind: "Sequence";
  element: FuzzType;
}

interface FunctionType {
  kind: "Function";
  domain: FuzzType;
  range: FuzzType;
}

interface Field {
  name: string;
  type: FuzzType;
}

interface RecordType {
  kind: "Record";
  fields: Field[];
}

export type FuzzType =
  | IntType
  | BoolType
  | StringType
  | SetType
  | SequenceType
  | FunctionType
  | RecordType;

export interface Term {
  type: FuzzType;
  parts: string[];
  children: Term[];
  isBinding: boolean;
}

export interface Variable {
  name: string;
  type: FuzzType;
}

export interface FuzzCase {
  kind: "expressions" | "model";
  variables: Variable[];
  assumptions: Term[];
  init: Term[];
  actions: Term[];
  invariant: Term | undefined;
  isDeadlockChecked: boolean;
}

export interface Random {
  next: () => number;
  integer: (low: number, high: number) => number;
  pick: <Item>(items: Item[]) => Item;
  chance: (probability: number) => boolean;
}

interface Generator {
  random: Random;
  names: { count: number };
}

type Builder = () => Term;

const INT: FuzzType = { kind: "Int" };
const BOOL: FuzzType = { kind: "Bool" };
const STRING: FuzzType = { kind: "String" };
const FIELD_NAMES = ["a", "b", "c"];
const STRINGS = ['"a"', '"b"', '"c"'];
const BOUND = 3;
const MAXIMUM_SIZE = 3;

export const createRandom = (seed: number): Random => {
  const state = { value: seed | 0 };
  const next = () => {
    state.value = (state.value + 0x6d2b79f5) | 0;
    const mixed = Math.imul(state.value ^ (state.value >>> 15), 1 | state.value);
    const remixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((remixed ^ (remixed >>> 14)) >>> 0) / 4294967296;
  };
  const integer = (low: number, high: number) => low + Math.floor(next() * (high - low + 1));
  return {
    next,
    integer,
    pick: (items) => items[integer(0, items.length - 1)],
    chance: (probability) => next() < probability,
  };
};

// Builds a term from a template whose terms become shrinkable children and whose strings, such as
// bound names, stay fixed text.
const createTerm =
  (type: FuzzType, isBinding = false) =>
  (strings: TemplateStringsArray, ...values: (Term | string)[]): Term => {
    const parts = [strings[0]];
    const children: Term[] = [];
    values.forEach((value, index) => {
      if (typeof value === "string") {
        parts[parts.length - 1] += value + strings[index + 1];
        return;
      }
      children.push(value);
      parts.push(strings[index + 1]);
    });
    return { type, parts, children, isBinding };
  };

const createLeaf = (type: FuzzType, text: string): Term => ({
  type,
  parts: [text],
  children: [],
  isBinding: false,
});

export const render = (term: Term): string =>
  term.parts
    .map((part, index) => part + (index < term.children.length ? render(term.children[index]) : ""))
    .join("");

export const isSameType = (left: FuzzType, right: FuzzType) =>
  JSON.stringify(left) === JSON.stringify(right);

const createName = (generator: Generator) => `v${generator.names.count++}`;

export const getSimplestTerm = (type: FuzzType): Term => {
  switch (type.kind) {
    case "Int":
      return createLeaf(type, "0");
    case "Bool":
      return createLeaf(type, "TRUE");
    case "String":
      return createLeaf(type, STRINGS[0]);
    case "Set":
      return createLeaf(type, "{}");
    case "Sequence":
      return createLeaf(type, "<<>>");
    case "Function":
      return createTerm(type)`[z \\in {} |-> ${getSimplestTerm(type.range)}]`;
    case "Record":
      return createRecord(
        type,
        type.fields.map((field) => getSimplestTerm(field.type)),
      );
  }
};

export const createType = (random: Random, depth: number): FuzzType => {
  const scalar = random.pick([INT, INT, BOOL, STRING]);
  if (depth === 0 || random.chance(0.5)) return scalar;
  const kind = random.pick(["Set", "Set", "Sequence", "Function", "Record"]);
  if (kind === "Set") return { kind, element: createType(random, depth - 1) };
  if (kind === "Sequence") return { kind, element: createType(random, depth - 1) };
  if (kind === "Function") {
    return { kind, domain: random.pick([INT, STRING]), range: createType(random, depth - 1) };
  }
  const names = FIELD_NAMES.slice(0, random.integer(1, FIELD_NAMES.length));
  return {
    kind: "Record",
    fields: names.map((name) => ({ name, type: createType(random, depth - 1) })),
  };
};

const createList = (terms: Term[], type: FuzzType, open: string, close: string): Term => ({
  type,
  parts:
    terms.length === 0 ? [`${open}${close}`] : [open, ...terms.slice(1).map(() => ", "), close],
  children: terms,
  isBinding: false,
});

const createRecord = (type: RecordType, values: Term[]): Term => ({
  type,
  parts: [
    `[${type.fields[0].name} |-> `,
    ...type.fields.slice(1).map((field) => `, ${field.name} |-> `),
    "]",
  ],
  children: values,
  isBinding: false,
});

// Builds a random expression of the given type from the variables in scope. Every operator that
// can fail is guarded most of the time, so most expressions evaluate, and the rest check that both
// checkers fail the same way.
export const createExpression = (
  generator: Generator,
  type: FuzzType,
  depth: number,
  scope: Variable[],
): Term => {
  const random = generator.random;
  const expression = (innerType: FuzzType, innerScope = scope) =>
    createExpression(generator, innerType, depth - 1, innerScope);
  const anyType = () => createType(random, 1);
  const inScope = scope.filter((variable) => isSameType(variable.type, type));
  const leaves: Builder[] = [
    ...inScope.map((variable) => () => createLeaf(type, variable.name)),
    () => createLiteral(generator, type, scope),
  ];
  if (depth <= 0) return random.pick(leaves)();
  const bindings: Builder[] = [
    () =>
      createTerm(type)`(IF ${expression(BOOL)} THEN ${expression(type)} ELSE ${expression(type)})`,
    () =>
      createTerm(
        type,
      )`(CASE ${expression(BOOL)} -> ${expression(type)} [] OTHER -> ${expression(type)})`,
    () => {
      const name = createName(generator);
      const valueType = anyType();
      const value = expression(valueType);
      return createTerm(
        type,
        true,
      )`(LET ${name} == ${value} IN ${expression(type, [...scope, { name, type: valueType }])})`;
    },
    () => {
      const name = createName(generator);
      const fallback = createName(generator);
      const inner = [...scope, { name, type }, { name: fallback, type }];
      return createTerm(
        type,
        true,
      )`(LET ${fallback} == ${expression(type)} IN CHOOSE ${name} \\in (${expression({ kind: "Set", element: type })} \\cup {${fallback}}) : (${expression(BOOL, inner)} \\/ ${name} = ${fallback}))`;
    },
    () => {
      const domain = random.pick([INT, STRING]);
      const name = createName(generator);
      const key = createName(generator);
      const functionType: FuzzType = { kind: "Function", domain, range: type };
      return createTerm(
        type,
        true,
      )`(LET ${name} == ${expression(functionType)} ${key} == ${expression(domain)} IN IF ${key} \\in DOMAIN ${name} THEN ${name}[${key}] ELSE ${expression(type)})`;
    },
    () => {
      const name = createName(generator);
      const index = createName(generator);
      const sequenceType: FuzzType = { kind: "Sequence", element: type };
      return createTerm(
        type,
        true,
      )`(LET ${name} == ${expression(sequenceType)} ${index} == ${expression(INT)} IN IF ${index} \\in DOMAIN ${name} THEN ${name}[${index}] ELSE ${expression(type)})`;
    },
    () => {
      const recordType: RecordType = {
        kind: "Record",
        fields: [{ name: random.pick(FIELD_NAMES), type }],
      };
      return createTerm(type)`${expression(recordType)}.${recordType.fields[0].name}`;
    },
  ];
  const failing: Builder[] = [
    () =>
      createTerm(
        type,
      )`${expression({ kind: "Function", domain: INT, range: type })}[${expression(INT)}]`,
    () => createTerm(type)`Head(${expression({ kind: "Sequence", element: type })})`,
  ];
  const specific = createSpecific(generator, type, depth, scope);
  const builders = [
    ...leaves,
    ...specific,
    ...specific,
    ...bindings,
    ...(random.chance(0.01) ? failing : []),
  ];
  return random.pick(builders)();
};

const createLiteral = (generator: Generator, type: FuzzType, scope: Variable[]): Term => {
  const random = generator.random;
  switch (type.kind) {
    case "Int": {
      const value = random.integer(-BOUND, BOUND + 2);
      return createLeaf(type, value < 0 ? `(${value})` : String(value));
    }
    case "Bool":
      return createLeaf(type, random.pick(["TRUE", "FALSE"]));
    case "String":
      return createLeaf(type, random.pick(STRINGS));
    case "Set":
      return createList(
        Array.from({ length: random.integer(0, 3) }, () =>
          createExpression(generator, type.element, 0, scope),
        ),
        type,
        "{",
        "}",
      );
    case "Sequence":
      return createList(
        Array.from({ length: random.integer(0, 3) }, () =>
          createExpression(generator, type.element, 0, scope),
        ),
        type,
        "<<",
        ">>",
      );
    case "Function":
      return createTerm(
        type,
      )`(${createExpression(generator, type.domain, 0, scope)} :> ${createExpression(generator, type.range, 0, scope)})`;
    case "Record":
      return createRecord(
        type,
        type.fields.map((field) => createExpression(generator, field.type, 0, scope)),
      );
  }
};

const createSpecific = (
  generator: Generator,
  type: FuzzType,
  depth: number,
  scope: Variable[],
): Builder[] => {
  const random = generator.random;
  const expression = (innerType: FuzzType, innerScope = scope) =>
    createExpression(generator, innerType, depth - 1, innerScope);
  const smallExpression = (innerType: FuzzType) => createExpression(generator, innerType, 0, scope);
  const anyType = () => createType(random, 1);
  const quantified = (body: (name: string, set: Term, inner: Variable[]) => Term) => {
    const elementType = anyType();
    const name = createName(generator);
    return body(name, expression({ kind: "Set", element: elementType }), [
      ...scope,
      { name, type: elementType },
    ]);
  };
  switch (type.kind) {
    case "Int":
      return [
        () => createTerm(type)`(${expression(INT)} + ${expression(INT)})`,
        () => createTerm(type)`(${expression(INT)} - ${expression(INT)})`,
        () => createTerm(type)`(${expression(INT)} * ${expression(INT)})`,
        () => createTerm(type)`(${expression(INT)} \\div ((${expression(INT)} % 3) + 1))`,
        () => createTerm(type)`(${expression(INT)} % ((${expression(INT)} % 3) + 1))`,
        () => createTerm(type)`(${smallExpression(INT)} ^ (${smallExpression(INT)} % 3))`,
        () => createTerm(type)`(-${expression(INT)})`,
        () => createTerm(type)`Cardinality(${expression({ kind: "Set", element: anyType() })})`,
        () => createTerm(type)`Len(${expression({ kind: "Sequence", element: anyType() })})`,
        ...(random.chance(0.02)
          ? [
              () => createTerm(type)`(${expression(INT)} \\div ${expression(INT)})`,
              () => createTerm(type)`(${expression(INT)} % ${expression(INT)})`,
            ]
          : []),
      ];
    case "Bool": {
      const comparedType = anyType();
      return [
        () => createTerm(type)`(${expression(comparedType)} = ${expression(comparedType)})`,
        () => createTerm(type)`(${expression(comparedType)} # ${expression(comparedType)})`,
        () => createTerm(type)`(${expression(INT)} < ${expression(INT)})`,
        () => createTerm(type)`(${expression(INT)} <= ${expression(INT)})`,
        () => createTerm(type)`(~${expression(BOOL)})`,
        () => createTerm(type)`(${expression(BOOL)} /\\ ${expression(BOOL)})`,
        () => createTerm(type)`(${expression(BOOL)} \\/ ${expression(BOOL)})`,
        () => createTerm(type)`(${expression(BOOL)} => ${expression(BOOL)})`,
        () => createTerm(type)`(${expression(BOOL)} <=> ${expression(BOOL)})`,
        () =>
          createTerm(
            type,
          )`(${expression(comparedType)} \\in ${expression({ kind: "Set", element: comparedType })})`,
        () =>
          createTerm(
            type,
          )`(${expression(comparedType)} \\notin ${expression({ kind: "Set", element: comparedType })})`,
        () =>
          createTerm(
            type,
          )`(${expression({ kind: "Set", element: comparedType })} \\subseteq ${expression({ kind: "Set", element: comparedType })})`,
        () =>
          quantified(
            (name, set, inner) =>
              createTerm(type, true)`(\\A ${name} \\in ${set} : ${expression(BOOL, inner)})`,
          ),
        () =>
          quantified(
            (name, set, inner) =>
              createTerm(type, true)`(\\E ${name} \\in ${set} : ${expression(BOOL, inner)})`,
          ),
        () =>
          createTerm(
            type,
          )`(${expression({ kind: "Sequence", element: INT })} \\in Seq(${expression({ kind: "Set", element: INT })}))`,
        () => createTerm(type)`(${expression(INT)} \\in Nat)`,
      ];
    }
    case "String":
      return [() => createTerm(type)`ToString(${expression(anyType())})`];
    case "Set": {
      const element = type.element;
      const set = () => expression(type);
      const builders: Builder[] = [
        () => createTerm(type)`(${set()} \\cup ${set()})`,
        () => createTerm(type)`(${set()} \\cap ${set()})`,
        () => createTerm(type)`(${set()} \\ ${set()})`,
        () => {
          const name = createName(generator);
          return createTerm(
            type,
            true,
          )`{${name} \\in ${set()} : ${expression(BOOL, [...scope, { name, type: element }])}}`;
        },
        () =>
          quantified(
            (name, source, inner) =>
              createTerm(type, true)`{${expression(element, inner)} : ${name} \\in ${source}}`,
          ),
        () =>
          createTerm(type)`UNION ${expression({ kind: "Set", element: { kind: "Set", element } })}`,
      ];
      if (element.kind === "Int") {
        builders.push(() => createTerm(type)`(${expression(INT)} .. ${expression(INT)})`);
      }
      if (element.kind === "Int" || element.kind === "String") {
        builders.push(
          () =>
            createTerm(
              type,
            )`DOMAIN ${expression({ kind: "Function", domain: element, range: anyType() })}`,
        );
      }
      if (element.kind === "Set") {
        builders.push(() => createTerm(type)`(SUBSET ${smallExpression(element)})`);
      }
      if (element.kind === "Function") {
        builders.push(
          () =>
            createTerm(
              type,
            )`[${smallExpression({ kind: "Set", element: element.domain })} -> ${smallExpression({ kind: "Set", element: element.range })}]`,
        );
      }
      if (element.kind === "Record") {
        builders.push(() => ({
          type,
          parts: [
            `[${element.fields[0].name} : `,
            ...element.fields.slice(1).map((field) => `, ${field.name} : `),
            "]",
          ],
          children: element.fields.map((field) =>
            smallExpression({ kind: "Set", element: field.type }),
          ),
          isBinding: false,
        }));
      }
      return builders;
    }
    case "Sequence": {
      const sequence = () => expression(type);
      return [
        () => createTerm(type)`Append(${sequence()}, ${expression(type.element)})`,
        () => createTerm(type)`(${sequence()} \\o ${sequence()})`,
        () => {
          const name = createName(generator);
          return createTerm(
            type,
            true,
          )`(LET ${name} == ${sequence()} IN IF ${name} = <<>> THEN ${name} ELSE Tail(${name}))`;
        },
        () => {
          const name = createName(generator);
          return createTerm(
            type,
            true,
          )`[${name} \\in 1..(${smallExpression(INT)} % 4) |-> ${expression(type.element, [...scope, { name, type: INT }])}]`;
        },
        () => {
          const name = createName(generator);
          const test = createName(generator);
          return createTerm(
            type,
            true,
          )`(LET ${test}(${name}) == ${expression(BOOL, [...scope, { name, type: type.element }])} IN SelectSeq(${sequence()}, ${test}))`;
        },
        ...(random.chance(0.02)
          ? [() => createTerm(type)`SubSeq(${sequence()}, ${expression(INT)}, ${expression(INT)})`]
          : []),
      ];
    }
    case "Function": {
      const fn = () => expression(type);
      return [
        () => {
          const name = createName(generator);
          return createTerm(
            type,
            true,
          )`[${name} \\in ${expression({ kind: "Set", element: type.domain })} |-> ${expression(type.range, [...scope, { name, type: type.domain }])}]`;
        },
        () =>
          createTerm(
            type,
          )`[${fn()} EXCEPT ![${expression(type.domain)}] = ${expression(type.range)}]`,
        () => createTerm(type)`(${fn()} @@ ${fn()})`,
      ];
    }
    case "Record": {
      const field = random.pick(type.fields);
      return [
        () =>
          createRecord(
            type,
            type.fields.map((item) => expression(item.type)),
          ),
        () =>
          createTerm(
            type,
          )`[${expression(type)} EXCEPT !.${field.name} = ${expression(field.type)}]`,
      ];
    }
  }
};

// The state constraint that keeps every variable's values small, so each model's state space
// stays finite.
const getBoundedness = (expression: string, type: FuzzType, generator: Generator): string => {
  switch (type.kind) {
    case "Int":
      return `${expression} \\in -${BOUND}..${BOUND}`;
    case "Bool":
      return "TRUE";
    case "String":
      return `${expression} \\in {${STRINGS.join(", ")}}`;
    case "Set": {
      const name = createName(generator);
      return `(Cardinality(${expression}) <= ${MAXIMUM_SIZE} /\\ \\A ${name} \\in ${expression} : ${getBoundedness(name, type.element, generator)})`;
    }
    case "Sequence": {
      const name = createName(generator);
      return `(Len(${expression}) <= ${MAXIMUM_SIZE} /\\ \\A ${name} \\in DOMAIN ${expression} : ${getBoundedness(`${expression}[${name}]`, type.element, generator)})`;
    }
    case "Function": {
      const name = createName(generator);
      return `(Cardinality(DOMAIN ${expression}) <= ${MAXIMUM_SIZE} /\\ \\A ${name} \\in DOMAIN ${expression} : ${getBoundedness(name, type.domain, generator)} /\\ ${getBoundedness(`${expression}[${name}]`, type.range, generator)})`;
    }
    case "Record":
      return `(${type.fields.map((field) => getBoundedness(`${expression}.${field.name}`, field.type, generator)).join(" /\\ ")})`;
  }
};

const createAction = (generator: Generator, variables: Variable[], depth: number): Term => {
  const random = generator.random;
  const assigned = variables.filter(() => random.chance(0.7));
  const guard = createExpression(generator, BOOL, depth, variables);
  const name = createName(generator);
  const witnessType = createType(random, 0);
  const isExistential = random.chance(0.3);
  const scope = isExistential ? [...variables, { name, type: witnessType }] : variables;
  const assignments = assigned.map((variable) =>
    random.chance(0.2)
      ? createTerm(
          BOOL,
        )`${variable.name}' \\in ${createExpression(generator, { kind: "Set", element: variable.type }, depth, scope)}`
      : createTerm(
          BOOL,
        )`${variable.name}' = ${createExpression(generator, variable.type, depth, scope)}`,
  );
  const unchanged = variables.filter((variable) => !assigned.includes(variable));
  const body: Term = {
    type: BOOL,
    parts: [
      "",
      ...assignments.map(() => " /\\ "),
      unchanged.length === 0
        ? ""
        : ` /\\ UNCHANGED <<${unchanged.map((variable) => variable.name).join(", ")}>>`,
    ],
    children: [guard, ...assignments],
    isBinding: false,
  };
  if (!isExistential) return body;
  return createTerm(
    BOOL,
    true,
  )`(\\E ${name} \\in ${createExpression(generator, { kind: "Set", element: witnessType }, depth, variables)} : ${body})`;
};

export const createCase = (seed: number, depth: number): FuzzCase => {
  const random = createRandom(seed);
  const generator: Generator = { random, names: { count: 0 } };
  if (random.chance(0.5)) {
    return {
      kind: "expressions",
      variables: [],
      assumptions: Array.from({ length: 10 }, () =>
        createExpression(generator, createType(random, 2), depth, []),
      ),
      init: [],
      actions: [],
      invariant: undefined,
      isDeadlockChecked: false,
    };
  }
  const variables = Array.from({ length: random.integer(1, 3) }, (_, index) => ({
    name: `x${index}`,
    type: createType(random, 1),
  }));
  return {
    kind: "model",
    variables,
    assumptions: [],
    init: variables.map((variable) =>
      random.chance(0.3)
        ? createTerm(
            BOOL,
          )`${variable.name} \\in ${createExpression(generator, { kind: "Set", element: variable.type }, depth - 1, [])}`
        : createTerm(
            BOOL,
          )`${variable.name} = ${createExpression(generator, variable.type, depth - 1, [])}`,
    ),
    actions: Array.from({ length: random.integer(1, 3) }, () =>
      createAction(generator, variables, depth - 1),
    ),
    invariant: random.chance(0.4) ? createExpression(generator, BOOL, depth, variables) : undefined,
    isDeadlockChecked: random.chance(0.3),
  };
};

const MODULE_HEADER = "---- MODULE Fuzz ----\nEXTENDS Integers, Sequences, FiniteSets, TLC";

export const renderCase = (fuzzCase: FuzzCase) => {
  if (fuzzCase.kind === "expressions") {
    const assumptions = fuzzCase.assumptions.map(
      (assumption, index) => `ASSUME PrintT(<<"@${index}", ${render(assumption)}>>)`,
    );
    return {
      spec: `${MODULE_HEADER}\nVARIABLE fuzz\n${assumptions.join("\n")}\nInit == fuzz = 0\nNext == UNCHANGED fuzz\n====\n`,
      config: "INIT Init\nNEXT Next\n",
    };
  }
  const generator: Generator = { random: createRandom(0), names: { count: 0 } };
  const names = fuzzCase.variables.map((variable) => variable.name);
  const constraint = fuzzCase.variables
    .map((variable) => getBoundedness(variable.name, variable.type, generator))
    .join(" /\\ ");
  const actions = fuzzCase.actions.map((action, index) => `A${index} == ${render(action)}`);
  const lines = [
    MODULE_HEADER,
    `VARIABLES ${names.join(", ")}`,
    `Init == ${fuzzCase.init.map(render).join(" /\\ ")}`,
    ...actions,
    `Next == ${fuzzCase.actions.map((_, index) => `A${index}`).join(" \\/ ")}`,
    `Constraint == ${constraint}`,
    ...(fuzzCase.invariant ? [`Invariant == ${render(fuzzCase.invariant)}`] : []),
    "====",
  ];
  const config = [
    "INIT Init",
    "NEXT Next",
    "CONSTRAINT Constraint",
    ...(fuzzCase.invariant ? ["INVARIANT Invariant"] : []),
    ...(fuzzCase.isDeadlockChecked ? [] : ["CHECK_DEADLOCK FALSE"]),
  ];
  return { spec: `${lines.join("\n")}\n`, config: `${config.join("\n")}\n` };
};
