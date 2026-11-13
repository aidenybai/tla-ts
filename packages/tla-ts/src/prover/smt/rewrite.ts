import { TlaError, TlaProverError, TlaUnsupportedError } from "../../errors";
import { normalizeApply, shiftExpr } from "../../obligations/substitution";
import type { Bound, Builtin, Expr, Hyp, Sequent } from "../../obligations/expression";
import { getNumeral } from "./axioms";
import { createContext, type Identifier } from "./context";
import { createFlattener, getDepth, removeUnprimable, UNPRIMABLE, type Entry } from "./flatten";
import {
  BOOL_SET,
  BUILTIN_SYMBOLS,
  call,
  CAST_BOOL,
  CAST_INT,
  conjoin,
  disjoin,
  FUN_APP,
  FUN_EXCEPT,
  FUN_ISAFCN,
  FUN_SET,
  getBinders,
  getVariable,
  getVariableSort,
  INT_LTEQ,
  INT_SET,
  MEM,
  NAT_SET,
  PROJ_INT,
  STR_SET,
  SUBSET_EQ,
  tla,
  TT_IDV,
} from "./format";
import { getEquality, resolveTriggers, type Polarity } from "./extensionality";
import {
  getChooseAxioms,
  getFunctionAxioms,
  getSelectSeqAxioms,
  getSetOfAxioms,
  getSetStAxioms,
} from "./instances";
import {
  BOOL,
  getSort,
  getTypeName,
  IDV,
  INT,
  isSameType,
  searchType,
  STRING,
  type Type,
} from "./types";

interface Term {
  isBool: boolean;
  text: string;
  integer?: string;
  type?: Type;
}

export interface EncodingSession {
  caseErrors: number;
}

// The options of Smtlib.preprocess that tlapm's --debug flags set.
export interface SmtEncoding {
  isArithmetic: boolean;
  rewriteLevel: number;
  isSetExtensional: boolean;
  // Type level 2, which --debug smarter_types turns on.
  isTyped: boolean;
}

export interface Mode {
  isOmitted: boolean;
  polarity: Polarity;
  at: string | undefined;
  depth: number;
}

export type Binding =
  | { kind: "constant"; symbol: string; type?: Type }
  | {
      kind: "variable";
      name: string;
      symbol: string;
      primed: string;
      type?: Type;
      primedType?: Type;
    }
  | { kind: "operator"; symbol: string; arity: number }
  | { kind: "secondOrder"; name: string; shapes: number[] }
  | { kind: "unsupported"; reason: string };

export interface Env {
  binding: Binding;
  rest: Env | undefined;
}

export interface Encoder {
  session: EncodingSession;
  encoding: SmtEncoding;
  flattener: ReturnType<typeof createFlattener>;
  anonymous: Map<string, number>;
  recordFields: Map<string, string[]>;
  setTypes: Map<string, Type>;
  context: ReturnType<typeof createContext>;
  declared: Map<string, Identifier>;
}

interface NestedContext {
  env: Env | undefined;
  mode: Mode;
  wrappers: ((body: string) => string)[];
}

const UNSUPPORTED_OPERANDS = new Set<Builtin>([
  "Prime",
  "StrongPrime",
  "Leadsto",
  "ENABLED",
  "UNCHANGED",
  "Cdot",
  "Actplus",
  "BoxTrue",
  "BoxFalse",
  "Diamond",
  "Divides",
  "Irregular",
]);

const ARITHMETIC = new Set<Builtin>(["Plus", "Minus", "Times", "Uminus"]);

const getSetType = (element: Type): Type => ({ kind: "Set", element });

const getRecordFieldType = (type: Type, field: string) =>
  type.kind === "Record" ? type.fields.find((entry) => entry.name === field)?.type : undefined;

const getFieldType = (type: Type, field: string) =>
  type.kind === "Fun" && type.domain.kind === "String"
    ? type.range
    : getRecordFieldType(type, field);

const getComponentType = (type: Type, args: Expr[]) => {
  if (args.length !== 1) return undefined;
  const arg = args[0];
  if (arg.kind === "String") return getRecordFieldType(type, arg.value);
  return arg.kind === "Num" && arg.fraction === "" && type.kind === "Product"
    ? type.items[Number(arg.integer) - 1]
    : undefined;
};

const getBuiltinType = (builtin: Builtin, types: Type[]): Type | undefined => {
  const first = types[0];
  switch (builtin) {
    case "Range":
      return getSetType(INT);
    case "Cup":
    case "Cap":
    case "Setminus":
      return first.kind === "Set" && isSameType(first, types[1]) ? first : undefined;
    case "UNION":
      return first.kind === "Set" && first.element.kind === "Set" ? first.element : undefined;
    case "SUBSET":
      return first.kind === "Set" ? getSetType(first) : undefined;
    case "DOMAIN":
      if (first.kind === "Fun") return getSetType(first.domain);
      if (first.kind === "Product") return getSetType(INT);
      return first.kind === "Record" ? getSetType(STRING) : undefined;
    default:
      return undefined;
  }
};

const toBool = (term: Term) =>
  term.isBool ? term.text : `(= ${resolveTriggers(term.text, true)} ${TT_IDV})`;

const toIdv = (term: Term) =>
  term.isBool ? `(${CAST_BOOL} ${resolveTriggers(term.text, true)})` : term.text;

const wrapBool = (text: string): Term => ({ isBool: true, text });

const wrapIdv = (text: string, type?: Type): Term => ({ isBool: false, text, type });

const wrapInteger = (text: string): Term => ({
  isBool: false,
  text: `(${CAST_INT} ${text})`,
  integer: text,
});

const getTypedOnly = (encoder: Encoder, type: Type | undefined) =>
  encoder.encoding.isTyped ? type : undefined;

const getType = (term: Term) =>
  term.isBool ? BOOL : term.integer === undefined ? (term.type ?? IDV) : INT;

const getTyped = (symbol: string, type: Type | undefined) => {
  if (type?.kind === "Int") return wrapInteger(symbol);
  return type?.kind === "Bool" ? wrapBool(symbol) : wrapIdv(symbol, type);
};

// Type.Synthesize marks a component of a tuple or record as projected into its type, and only
// Int has a projection at type level 2. tlapm leaves a Bool component an Idv it then uses as a
// Bool, so it stays an individual here.
const project = (text: string, type: Type) => {
  if (type.kind === "Int") return { isBool: false, text, integer: `(${PROJ_INT} ${text})` };
  return wrapIdv(text, type.kind === "Bool" ? undefined : type);
};

const getElementType = (term: Term) => {
  const type = getType(term);
  return type.kind === "Set" ? type.element : undefined;
};

const getBinding = (env: Env | undefined, index: number): Binding => {
  const found = Array.from({ length: index - 1 }).reduce<Env | undefined>(
    (current) => current?.rest,
    env,
  );
  if (!found) throw new TlaUnsupportedError("a reference outside the obligation");
  return found.binding;
};

export const push = (env: Env | undefined, binding: Binding): Env => ({ binding, rest: env });

const inferType = (
  encoder: Encoder,
  expression: Expr,
  env: Env | undefined,
  mode: Mode,
  depth: number,
) => {
  const inner = Array.from({ length: depth }).reduce<Env | undefined>(
    (current) => push(current, { kind: "unsupported", reason: "a declaration without a type" }),
    env,
  );
  try {
    return getType(
      encode(
        createEncoder({ caseErrors: encoder.session.caseErrors }, encoder.encoding),
        expression,
        inner,
        mode,
      ),
    );
  } catch (error) {
    if (error instanceof TlaError) return undefined;
    throw error;
  }
};

// The type a later hypothesis gives a declaration with no domain, which the env doesn't bind yet.
// A primed variable has no index of its own, so the hypotheses name it.
export const searchDeclarationType = (
  encoder: Encoder,
  expression: Expr,
  isPositive: boolean,
  env: Env | undefined,
  mode: Mode,
  primed?: string,
) =>
  encoder.encoding.isTyped
    ? searchType(
        {
          infer: (inner, depth) =>
            inferType(encoder, inner, env, mode, primed === undefined ? depth + 1 : depth),
          isTarget: (inner, depth) =>
            primed === undefined
              ? inner.kind === "Ix" && inner.index === depth + 1
              : inner.kind === "Opaque" && inner.name === primed,
        },
        isPositive,
        expression,
      )
    : undefined;

const getFree = (text: string, depth: number) =>
  [...new Set(text.match(/[^\s()]+#\d+/g))]
    .filter((variable) => getDepth(variable) < depth)
    .toSorted((left, right) => getDepth(left) - getDepth(right));

export const getUniqueName = (encoder: Encoder, name: string) => {
  const identifier = encoder.context.adjoin(name);
  encoder.context.enter(identifier);
  encoder.declared.set(identifier.name, identifier);
  return identifier.name;
};

const clearPolarity = (mode: Mode): Mode => ({ ...mode, polarity: "Neither" });

const invert = (mode: Mode): Mode => ({
  ...mode,
  polarity:
    mode.polarity === "Positive"
      ? "Negative"
      : mode.polarity === "Negative"
        ? "Positive"
        : "Neither",
});

export const encodeIdv = (encoder: Encoder, expression: Expr, env: Env | undefined, mode: Mode) =>
  toIdv(encode(encoder, expression, env, clearPolarity(mode)));

export const encodeBool = (encoder: Encoder, expression: Expr, env: Env | undefined, mode: Mode) =>
  toBool(encode(encoder, expression, env, mode));

// tlapm's Rewrite encodes each Ditto's copy of a domain, so each copy flattens again.
const encodeDomains = (encoder: Encoder, bounds: Bound[], env: Env | undefined, mode: Mode) =>
  bounds
    .reduce<(Expr | undefined)[]>((domains, bound) => {
      if (bound.domain.kind === "Ditto") return [...domains, domains.at(-1)];
      if (bound.domain.kind === "NoDomain") return [...domains, undefined];
      return [...domains, bound.domain.expression];
    }, [])
    .map((domain) =>
      domain === undefined ? undefined : encode(encoder, domain, env, clearPolarity(mode)),
    );

const getDomains = (
  encoder: Encoder,
  bounds: Bound[],
  env: Env | undefined,
  mode: Mode,
  construct: string,
) =>
  encodeDomains(encoder, bounds, env, mode).map((domain) => {
    if (domain === undefined) throw new TlaUnsupportedError(`${construct} without a domain`);
    return domain;
  });

const getSetResult = (encoder: Encoder, domains: Term[], getResult: (elements: Type[]) => Type) => {
  const elements = domains.map(getElementType);
  return encoder.encoding.isTyped && elements.every((element) => element !== undefined)
    ? getResult(elements.filter((element) => element !== undefined))
    : undefined;
};

const bindVariables = (
  names: string[],
  env: Env | undefined,
  mode: Mode,
  types: (Type | undefined)[] = [],
) => {
  const variables = names.map((name, index) =>
    getVariable(name, mode.depth + index, getSort(types[index])),
  );
  const inner = variables.reduce<Env | undefined>(
    (current, symbol, index) => push(current, { kind: "constant", symbol, type: types[index] }),
    env,
  );
  return { variables, env: inner, mode: { ...mode, depth: mode.depth + names.length } };
};

// Type.Synthesize types a variable bounded by a set of type Set(t) as a t. A Ditto has the
// previous domain, though tlapm types it without a cast in its membership, or as Set(t) itself
// when t isn't atomic, so Z3 rejects either. A variable with no domain gets the type a hypothesis
// in the rest of the quantifier gives it.
const getBoundTypes = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "Quant" }>,
  domains: (Term | undefined)[],
  env: Env | undefined,
  mode: Mode,
) =>
  expression.bounds.reduce<{ types: (Type | undefined)[]; last: Type | undefined }>(
    (state, bound, index) => {
      const domain = domains[index];
      const next = (type: Type | undefined) => ({ types: [...state.types, type], last: type });
      if (bound.domain.kind === "Domain" && domain !== undefined)
        return next(getElementType(domain));
      if (bound.domain.kind === "Ditto" && state.last !== undefined) return next(state.last);
      const rest = expression.bounds.slice(index + 1);
      const scope = rest.length === 0 ? expression.body : { ...expression, bounds: rest };
      const names = expression.bounds.slice(0, index).map((innerBound) => innerBound.name);
      const outer = bindVariables(names, env, mode, state.types);
      return next(
        searchDeclarationType(
          encoder,
          scope,
          expression.quantifier === "Forall",
          outer.env,
          outer.mode,
        ),
      );
    },
    { types: [], last: undefined },
  ).types;

const encodeQuantifier = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "Quant" }>,
  env: Env | undefined,
  mode: Mode,
) => {
  const domains = encodeDomains(encoder, expression.bounds, env, mode);
  const types = encoder.encoding.isTyped
    ? getBoundTypes(encoder, expression, domains, env, mode)
    : [];
  const bound = bindVariables(
    expression.bounds.map((innerBound) => innerBound.name),
    env,
    mode,
    types,
  );
  const body = encodeBool(encoder, expression.body, bound.env, bound.mode);
  const guards = bound.variables.flatMap((variable, index) => {
    const domain = domains[index];
    if (domain === undefined) return [];
    return [`(${MEM} ${toIdv(getTyped(variable, types[index]))} ${toIdv(domain)})`];
  });
  return expression.quantifier === "Forall"
    ? `(forall (${getBinders(bound.variables)}) ${guards.length === 0 ? body : `(=> ${conjoin(guards)} ${body})`})`
    : `(exists (${getBinders(bound.variables)}) ${conjoin([...guards, body])})`;
};

const getSorts = (count: number, free: string[]) => [
  ...Array.from({ length: count }, () => "Idv"),
  ...free.map((variable) => getVariableSort(variable) ?? "Idv"),
];

const encodeSetSt = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "SetSt" }>,
  env: Env | undefined,
  mode: Mode,
) => {
  const domain = encode(encoder, expression.domain, env, clearPolarity(mode));
  const bound = bindVariables([expression.name], env, clearPolarity(mode));
  const body = encodeBool(encoder, expression.body, bound.env, bound.mode);
  const free = getFree(body, mode.depth);
  const symbol = encoder.flattener.flatten(
    "SetSt",
    body,
    mode,
    (name) => getSetStAxioms(name, free, body, bound.variables[0]),
    getSorts(1, free),
  );
  return wrapIdv(
    call(symbol, [toIdv(domain), ...free]),
    getSetResult(encoder, [domain], (elements) => getSetType(elements[0])),
  );
};

// At type level 2 tlapm also gives a set of values the types Standardize rejects, so it encodes
// none.
const encodeSetOf = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "SetOf" }>,
  env: Env | undefined,
  mode: Mode,
) => {
  const domains = getDomains(encoder, expression.bounds, env, mode, "a set of values");
  const bound = bindVariables(
    expression.bounds.map((innerBound) => innerBound.name),
    env,
    clearPolarity(mode),
  );
  const element = encode(encoder, expression.element, bound.env, clearPolarity(bound.mode));
  const text = toIdv(element);
  const free = getFree(text, mode.depth);
  const count = domains.length;
  const symbol = encoder.flattener.flatten(
    `SetOf_${count}`,
    text,
    mode,
    (name) => getSetOfAxioms(name, free, text, bound.variables),
    getSorts(count, free),
  );
  return wrapIdv(
    call(symbol, [...domains.map(toIdv), ...free]),
    getSetResult(encoder, domains, () => getSetType(getType(element))),
  );
};

// tlapm binds the components of a function of several arguments in a LET. It builds every
// component from Ix 1, which inside the LET is the previous component, doesn't shift the body past
// the tuple, and indexes the tuple with untyped numbers that no axiom relates to the tuple's, so
// this binds each component to its typed index.
const encodeFunction = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "Fcn" }>,
  env: Env | undefined,
  mode: Mode,
) => {
  const terms = getDomains(encoder, expression.bounds, env, mode, "a function");
  const domains = terms.map(toIdv);
  const domain =
    domains.length === 1 ? domains[0] : call(tla(`Product_${domains.length}`), domains);
  const variable = getVariable(domains.length === 1 ? expression.bounds[0].name : "x", mode.depth);
  const inner = { ...clearPolarity(mode), depth: mode.depth + 1 };
  const components = bindVariables(
    domains.length === 1 ? [] : expression.bounds.map((bound) => bound.name),
    env,
    inner,
  );
  const term = encode(
    encoder,
    expression.body,
    domains.length === 1 ? push(env, { kind: "constant", symbol: variable }) : components.env,
    clearPolarity(components.mode),
  );
  const body = toIdv(term);
  const definitions = components.variables.map(
    (component, index) =>
      `(${component} (${FUN_APP} ${variable} ${getNumeral(index + 1, encoder.encoding.isArithmetic)}))`,
  );
  // Smtlib prints the definitions of a LET last first, and N_axiomatize visits them in order.
  const value =
    domains.length === 1 ? body : `(let (${definitions.toReversed().join(" ")}) ${body})`;
  const free = getFree(value, mode.depth);
  const symbol = encoder.flattener.flatten(
    "FunFcn",
    domains.length === 1 ? body : `(let (${definitions.join(" ")}) ${body})`,
    mode,
    (name, axioms) => getFunctionAxioms(name, free, value, variable, axioms),
    getSorts(1, free),
  );
  return wrapIdv(
    call(symbol, [domain, ...free]),
    getSetResult(encoder, terms, (elements) => ({
      kind: "Fun",
      domain: elements.length === 1 ? elements[0] : { kind: "Product", items: elements },
      range: getType(term),
    })),
  );
};

// At type level 2 tlapm sorts the variable of a CHOOSE over a set of type Set(Int) as an Int in
// its body but an Idv in ChooseDef, which Z3 rejects, so it stays an Idv.
const encodeChoose = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "Choose" }>,
  env: Env | undefined,
  mode: Mode,
) => {
  const bound = bindVariables([expression.name], env, clearPolarity(mode));
  const variable = bound.variables[0];
  const domain =
    expression.domain && `(${MEM} ${variable} ${encodeIdv(encoder, expression.domain, env, mode)})`;
  const predicate = encodeBool(encoder, expression.body, bound.env, bound.mode);
  const body = domain === undefined ? predicate : conjoin([domain, predicate]);
  const free = getFree(body, mode.depth);
  const symbol = encoder.flattener.flatten(
    "Choose",
    body,
    mode,
    (name) => getChooseAxioms(name, free, body, variable),
    getSorts(0, free),
  );
  return wrapIdv(call(symbol, free));
};

// Type.Synthesize compares values of the same type in their own sort only above type level 1,
// and Standardize triggers set extensionality on any equality of two sets of one type.
const encodeEquality = (
  encoder: Encoder,
  args: Expr[],
  env: Env | undefined,
  mode: Mode,
  isNegated: boolean,
) => {
  const left = encode(encoder, args[0], env, clearPolarity(mode));
  const right = encode(encoder, args[1], env, clearPolarity(mode));
  const type = getType(left);
  const polarity = encoder.encoding.isSetExtensional ? mode.polarity : undefined;
  if (!encoder.encoding.isTyped || !isSameType(type, getType(right)))
    return getEquality(toIdv(left), toIdv(right), polarity, isNegated);
  if (type.kind === "Int" || type.kind === "Bool") {
    const operands = [left, right].map((term) => term.integer ?? term.text).join(" ");
    return isNegated ? `(distinct ${operands})` : `(= ${operands})`;
  }
  if (type.kind !== "Set") return getEquality(left.text, right.text, polarity, isNegated);
  const name = `TrigEq_${getTypeName(type)}`;
  encoder.setTypes.set(name, type);
  return getEquality(left.text, right.text, polarity, isNegated, tla(name));
};

const getSelectionTest = (encoder: Encoder, test: Expr, env: Env | undefined, mode: Mode) => {
  const lambda = test.kind === "Lambda" && test.params.length === 1 ? test : undefined;
  const bound = bindVariables([lambda?.params[0].name ?? "x1"], env, clearPolarity(mode));
  const body = encodeBool(
    encoder,
    lambda?.body ?? {
      kind: "Apply",
      operator: shiftExpr(1, test),
      args: [{ kind: "Ix", index: 1 }],
    },
    bound.env,
    bound.mode,
  );
  return { body, variable: bound.variables[0] };
};

const encodeBuiltin = (
  encoder: Encoder,
  builtin: Builtin,
  args: Expr[],
  env: Env | undefined,
  mode: Mode,
): Term => {
  const getTerms = () => args.map((arg) => encode(encoder, arg, env, clearPolarity(mode)));
  const encodeArgs = () => getTerms().map(toIdv);
  switch (builtin) {
    case "Conj":
      return wrapBool(conjoin(args.map((arg) => encodeBool(encoder, arg, env, mode))));
    case "Disj":
      return wrapBool(disjoin(args.map((arg) => encodeBool(encoder, arg, env, mode))));
    case "Implies":
      return wrapBool(
        `(=> ${encodeBool(encoder, args[0], env, invert(mode))} ${encodeBool(encoder, args[1], env, mode)})`,
      );
    case "Equiv":
      return wrapBool(
        `(= ${args.map((arg) => encodeBool(encoder, arg, env, clearPolarity(mode))).join(" ")})`,
      );
    case "Neg":
      return wrapBool(`(not ${encodeBool(encoder, args[0], env, invert(mode))})`);
    case "Eq":
      return wrapBool(encodeEquality(encoder, args, env, mode, false));
    case "Neq":
      return wrapBool(encodeEquality(encoder, args, env, mode, true));
    case "Mem":
      return wrapBool(call(MEM, encodeArgs()));
    case "Notmem":
      return wrapBool(`(not ${call(MEM, encodeArgs())})`);
    case "Subseteq":
      return wrapBool(call(SUBSET_EQ, encodeArgs()));
    case "Lteq":
    case "Gteq":
    case "Lt":
    case "Gt": {
      const terms = getTerms();
      const integers = terms.flatMap((term) => (term.integer === undefined ? [] : [term.integer]));
      if (encoder.encoding.isTyped && integers.length === 2)
        return wrapBool(call(tla(`TInt${builtin}`), integers));
      const order = (operands: string[]) =>
        builtin === "Lteq" || builtin === "Lt" ? operands : operands.toReversed();
      const operands = order(terms.map(toIdv));
      if (builtin === "Lteq" || builtin === "Gteq") return wrapBool(call(INT_LTEQ, operands));
      // Rewrite copies the operands before Flatten, which flattens each copy again.
      return wrapBool(
        `(and ${call(INT_LTEQ, operands)} (distinct ${order(encodeArgs()).join(" ")}))`,
      );
    }
    case "SelectSeq": {
      const test = getSelectionTest(encoder, args[1], env, mode);
      const free = getFree(test.body, mode.depth);
      const symbol = encoder.flattener.flatten(
        "SelectSeq",
        test.body,
        mode,
        (name) =>
          getSelectSeqAxioms(name, free, test.body, test.variable, encoder.encoding.isArithmetic),
        getSorts(1, free),
      );
      return wrapIdv(call(symbol, [encodeIdv(encoder, args[0], env, mode), ...free]));
    }
    case "Unprimable": {
      const term = encode(encoder, args[0], env, clearPolarity(mode));
      return { ...term, text: `(${UNPRIMABLE} ${term.text})` };
    }
    default: {
      const symbol = BUILTIN_SYMBOLS[builtin];
      if (symbol === undefined)
        throw new TlaProverError(
          UNSUPPORTED_OPERANDS.has(builtin)
            ? `Type.Synthesize: Unsupported builtin ${builtin.startsWith("Box") ? "Box" : builtin}`
            : "Type.Synthesize: Unexpected left operand",
        );
      const terms = getTerms();
      if (!encoder.encoding.isTyped) return wrapIdv(call(symbol, terms.map(toIdv)));
      const integers = terms.flatMap((term) => (term.integer === undefined ? [] : [term.integer]));
      if (ARITHMETIC.has(builtin) && integers.length === terms.length)
        return wrapInteger(call(tla(`TInt${builtin}`), integers));
      return wrapIdv(call(symbol, terms.map(toIdv)), getBuiltinType(builtin, terms.map(getType)));
    }
  }
};

const encodeReference = (
  encoder: Encoder,
  binding: Binding,
  args: Expr[],
  env: Env | undefined,
  mode: Mode,
): Term => {
  switch (binding.kind) {
    case "constant":
    case "variable":
      if (args.length > 0) throw new TlaUnsupportedError(`an applied ${binding.kind}`);
      return getTyped(binding.symbol, binding.type);
    case "operator":
      if (args.length === 0 && binding.arity > 0)
        throw new TlaProverError("Type.Synthesize: Impossible operator conversion");
      if (args.length !== binding.arity)
        throw new TlaUnsupportedError("an operator applied to the wrong number of arguments");
      return wrapIdv(
        call(
          binding.symbol,
          args.map((arg) => encodeIdv(encoder, arg, env, mode)),
        ),
      );
    case "secondOrder": {
      if (args.length !== binding.shapes.length)
        throw new TlaUnsupportedError("an operator applied to the wrong number of arguments");
      const operands = args.map((arg, index) => {
        if (binding.shapes[index] === 0)
          return { isFirstOrder: true, text: encodeIdv(encoder, arg, env, mode) };
        if (arg.kind === "Ix") {
          const argument = getBinding(env, arg.index);
          if (argument.kind !== "operator")
            throw new TlaUnsupportedError("an operator argument that isn't a LAMBDA");
          return { isFirstOrder: false, text: argument.symbol };
        }
        if (arg.kind !== "Lambda")
          throw new TlaUnsupportedError("an operator argument that isn't a LAMBDA");
        const bound = bindVariables(
          arg.params.map((param) => param.name),
          env,
          clearPolarity(mode),
        );
        return { isFirstOrder: false, text: encodeIdv(encoder, arg.body, bound.env, bound.mode) };
      });
      const firstOrder = operands.flatMap((operand) =>
        operand.isFirstOrder ? [operand.text] : [],
      );
      const higherOrder = operands.flatMap((operand) =>
        operand.isFirstOrder ? [] : [operand.text],
      );
      const free = getFree(higherOrder.join(" "), mode.depth);
      const symbol = encoder.flattener.flatten(
        "",
        higherOrder.join(" "),
        mode,
        () => [],
        getSorts(firstOrder.length, free),
        binding.name,
      );
      return wrapIdv(call(symbol, [...firstOrder, ...free]));
    }
    case "unsupported":
      throw new TlaUnsupportedError(binding.reason);
  }
};

const getPrimed = (env: Env | undefined, name: string): Term => {
  if (!env) throw new TlaUnsupportedError(`a primed declaration that isn't a variable`);
  const binding = env.binding;
  return binding.kind === "variable" && binding.name === name
    ? getTyped(binding.primed, binding.primedType)
    : getPrimed(env.rest, name);
};

const encodeOpaque = (
  encoder: Encoder,
  name: string,
  args: Expr[],
  env: Env | undefined,
  mode: Mode,
): Term => {
  // Rewrite.simplify_sets writes IsAFcn for the functions in a set of functions.
  if (name === "IsAFcn" && args.length === 1)
    return wrapBool(`(${FUN_ISAFCN} ${encodeIdv(encoder, args[0], env, mode)})`);
  if (args.length === 0 && name.endsWith("#prime"))
    return getPrimed(env, name.slice(0, -"#prime".length));
  const anonymousName = args.length === 0 ? `Anon_OPAQUE_${name}` : `Anon_${name}`;
  encoder.anonymous.set(anonymousName, args.length);
  return wrapIdv(
    call(
      tla(anonymousName),
      args.map((arg) => encodeIdv(encoder, arg, env, mode)),
    ),
  );
};

const encodeExcept = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "Except" }>,
  env: Env | undefined,
  mode: Mode,
) =>
  expression.specs.reduce(
    (base, spec) => {
      const update = (value: string, trail: typeof spec.trail): string => {
        if (trail.length === 0) return encodeIdv(encoder, spec.value, env, { ...mode, at: value });
        const point = trail[0];
        const encodeKey = () =>
          point.kind === "Dot"
            ? tla(`StrLit_${point.field}`)
            : encodeIdv(encoder, point.expression, env, mode);
        const key = encodeKey();
        // Elab.desugar repeats the key in the value it updates, and Flatten counts both.
        const inner = update(
          `(${FUN_APP} ${value} ${trail.length > 1 ? encodeKey() : key})`,
          trail.slice(1),
        );
        return `(${FUN_EXCEPT} ${value} ${key} ${inner})`;
      };
      return update(base, spec.trail);
    },
    encodeIdv(encoder, expression.function, env, mode),
  );

const getCaseError = (encoder: Encoder) => {
  encoder.session.caseErrors++;
  const name = `Anon_incomplete_case_error_${encoder.session.caseErrors}`;
  encoder.anonymous.set(name, 0);
  return tla(name);
};

const encodeCase = (
  encoder: Encoder,
  expression: Extract<Expr, { kind: "Case" }>,
  env: Env | undefined,
  mode: Mode,
): Term => {
  const bodies = expression.arms.map((arm) => encode(encoder, arm.body, env, mode));
  const other: Term = expression.other
    ? encode(encoder, expression.other, env, mode)
    : wrapIdv(getCaseError(encoder));
  const type = getType(other);
  const isUniform = bodies.every((body) => isSameType(getType(body), type));
  const isBool = isUniform && type.kind === "Bool";
  if (isUniform && type.kind === "Int") {
    const integer = expression.arms.reduceRight(
      (rest, arm, index) =>
        `(ite ${encodeBool(encoder, arm.condition, env, clearPolarity(mode))} ${bodies[index].integer} ${rest})`,
      other.integer ?? "",
    );
    return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
  }
  const convert = (term: Term) => (isBool ? term.text : toIdv(term));
  const text = expression.arms.reduceRight(
    (rest, arm, index) =>
      `(ite ${encodeBool(encoder, arm.condition, env, mode)} ${convert(bodies[index])} ${rest})`,
    convert(other),
  );
  return { isBool, text, type: isUniform ? other.type : undefined };
};

// Type.Synthesize types a NEW constant by its visible domain, or else by a hypothesis in the rest
// of the sequent. The guard is its membership in the domain the encoding asserts.
export const declareConstant = (
  encoder: Encoder,
  hyp: Extract<Hyp, { kind: "Fresh" }>,
  guarded: Expr | undefined,
  rest: Sequent,
  env: Env | undefined,
  mode: Mode,
) => {
  const domain = guarded && encode(encoder, guarded, env, clearPolarity(mode));
  const type =
    domain !== undefined && hyp.domainVisibility === "Visible"
      ? getElementType(domain)
      : searchDeclarationType(encoder, { kind: "Sequent", sequent: rest }, true, env, mode);
  return {
    type,
    getGuard: (symbol: string) =>
      domain && `(${MEM} ${toIdv(getTyped(symbol, type))} ${toIdv(domain)})`,
  };
};

const encodeSequent = (
  encoder: Encoder,
  sequent: Sequent,
  env: Env | undefined,
  mode: Mode,
): string => {
  const steps = sequent.context.reduce<NestedContext>(
    (state, hyp, index) => {
      switch (hyp.kind) {
        case "Fresh": {
          if (hyp.shape > 0) {
            if (!state.mode.isOmitted) throw new TlaUnsupportedError("a second-order ASSUME");
            const variable = getVariable(hyp.name, state.mode.depth);
            return {
              env: push(state.env, { kind: "operator", symbol: variable, arity: hyp.shape }),
              mode: { ...state.mode, depth: state.mode.depth + 1 },
              wrappers: [...state.wrappers, (body) => `(forall ((${variable} Idv)) ${body})`],
            };
          }
          if (hyp.level !== "Constant")
            throw new TlaUnsupportedError("a NEW declaration that isn't constant");
          const rest = { context: sequent.context.slice(index + 1), active: sequent.active };
          const declared = declareConstant(encoder, hyp, hyp.domain, rest, state.env, state.mode);
          const bound = bindVariables([hyp.name], state.env, state.mode, [declared.type]);
          const variable = bound.variables[0];
          const guard = declared.getGuard(variable);
          return {
            env: bound.env,
            mode: bound.mode,
            wrappers: [
              ...state.wrappers,
              (body) =>
                `(forall (${getBinders([variable])}) ${guard ? `(=> ${guard} ${body})` : body})`,
            ],
          };
        }
        case "Fact": {
          const fact =
            hyp.visibility === "Visible"
              ? encodeBool(encoder, hyp.expression, state.env, invert(state.mode))
              : undefined;
          return {
            env: push(state.env, { kind: "unsupported", reason: "a reference to a fact" }),
            mode: state.mode,
            wrappers: fact ? [...state.wrappers, (body) => `(=> ${fact} ${body})`] : state.wrappers,
          };
        }
        default:
          throw new TlaUnsupportedError(`a ${hyp.kind} in a nested ASSUME`);
      }
    },
    { env, mode, wrappers: [] },
  );
  return steps.wrappers.reduceRight(
    (body, wrap) => wrap(body),
    encodeBool(encoder, sequent.active, steps.env, steps.mode),
  );
};

export const encode = (
  encoder: Encoder,
  expression: Expr,
  env: Env | undefined,
  mode: Mode,
): Term => {
  switch (expression.kind) {
    case "Ix":
      return encodeReference(encoder, getBinding(env, expression.index), [], env, mode);
    case "Internal":
      switch (expression.builtin) {
        case "TRUE":
          return wrapBool("true");
        case "FALSE":
          return wrapBool("false");
        case "BOOLEAN":
          return wrapIdv(BOOL_SET, getTypedOnly(encoder, getSetType(BOOL)));
        case "STRING":
          return wrapIdv(STR_SET, getTypedOnly(encoder, getSetType(STRING)));
        case "Nat":
          return wrapIdv(NAT_SET, getTypedOnly(encoder, getSetType(INT)));
        case "Int":
          return wrapIdv(INT_SET, getTypedOnly(encoder, getSetType(INT)));
        case "Real":
        case "Infinity":
          throw new TlaProverError(
            `Encode.Standardize: Unexpected builtin '${expression.builtin}'`,
          );
        default:
          throw new TlaProverError("Type.Synthesize: Unexpected builtin");
      }
    case "Apply": {
      const operator = expression.operator;
      if (operator.kind === "Internal")
        return encodeBuiltin(encoder, operator.builtin, expression.args, env, mode);
      if (operator.kind === "Ix")
        return encodeReference(
          encoder,
          getBinding(env, operator.index),
          expression.args,
          env,
          mode,
        );
      if (operator.kind === "Opaque")
        return encodeOpaque(encoder, operator.name, expression.args, env, mode);
      if (operator.kind === "Lambda")
        return encode(encoder, normalizeApply(operator, expression.args), env, mode);
      throw new TlaUnsupportedError(`an application of ${operator.kind}`);
    }
    case "Sequent":
      return wrapBool(encodeSequent(encoder, expression.sequent, env, mode));
    case "With":
    case "Parens":
      return encode(encoder, expression.expression, env, mode);
    case "If": {
      const condition = encodeBool(encoder, expression.condition, env, mode);
      const consequent = encode(encoder, expression.consequent, env, mode);
      const alternative = encode(encoder, expression.alternative, env, mode);
      if (consequent.integer !== undefined && alternative.integer !== undefined) {
        const integer = `(ite ${resolveTriggers(condition, true)} ${consequent.integer} ${alternative.integer})`;
        return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
      }
      if (consequent.isBool && alternative.isBool)
        return wrapBool(`(ite ${condition} ${consequent.text} ${alternative.text})`);
      return wrapIdv(
        `(ite ${condition} ${toIdv(consequent)} ${toIdv(alternative)})`,
        isSameType(getType(consequent), getType(alternative)) ? consequent.type : undefined,
      );
    }
    case "List": {
      const items = expression.items.map((item) => encodeBool(encoder, item, env, mode));
      return wrapBool(expression.bullet === "Or" ? disjoin(items) : conjoin(items));
    }
    case "Opaque":
      return encodeOpaque(encoder, expression.name, [], env, mode);
    case "Quant":
      return wrapBool(encodeQuantifier(encoder, expression, env, mode));
    case "Choose":
      return encodeChoose(encoder, expression, env, mode);
    case "SetSt":
      return encodeSetSt(encoder, expression, env, mode);
    case "SetOf":
      return encodeSetOf(encoder, expression, env, mode);
    case "SetEnum": {
      const elements = expression.elements.map((element) =>
        encode(encoder, element, env, clearPolarity(mode)),
      );
      const types = elements.map(getType);
      return wrapIdv(
        call(tla(`SetEnum_${elements.length}`), elements.map(toIdv)),
        getTypedOnly(
          encoder,
          types.every((type) => isSameType(type, types[0] ?? IDV))
            ? getSetType(types[0] ?? IDV)
            : undefined,
        ),
      );
    }
    case "Product": {
      const factors = expression.factors.map((factor) =>
        encode(encoder, factor, env, clearPolarity(mode)),
      );
      return wrapIdv(
        call(tla(`Product_${factors.length}`), factors.map(toIdv)),
        getSetResult(encoder, factors, (items) => getSetType({ kind: "Product", items })),
      );
    }
    case "Tuple": {
      const elements = expression.elements.map((element) =>
        encode(encoder, element, env, clearPolarity(mode)),
      );
      return wrapIdv(
        call(tla(`Tuple_${elements.length}`), elements.map(toIdv)),
        getTypedOnly(encoder, { kind: "Product", items: elements.map(getType) }),
      );
    }
    case "Fcn":
      return encodeFunction(encoder, expression, env, mode);
    case "FcnApp": {
      const encodedFunction = encode(encoder, expression.function, env, clearPolarity(mode));
      const args = expression.args.map((arg) => encodeIdv(encoder, arg, env, mode));
      const argument = args.length === 1 ? args[0] : call(tla(`Tuple_${args.length}`), args);
      const text = `(${FUN_APP} ${toIdv(encodedFunction)} ${argument})`;
      const component = getTypedOnly(
        encoder,
        getComponentType(getType(encodedFunction), expression.args),
      );
      return component === undefined ? wrapIdv(text) : project(text, component);
    }
    case "Arrow": {
      const sets = [expression.domain, expression.range].map((set) =>
        encode(encoder, set, env, clearPolarity(mode)),
      );
      return wrapIdv(
        call(FUN_SET, sets.map(toIdv)),
        getSetResult(encoder, sets, (elements) =>
          getSetType({ kind: "Fun", domain: elements[0], range: elements[1] }),
        ),
      );
    }
    case "Record":
    case "Rect": {
      const names = expression.fields.map((field) => field.name);
      const suffix = names.join("_");
      encoder.recordFields.set(`Record_${suffix}`, names);
      encoder.recordFields.set(`RecordSet_${suffix}`, names);
      const values = expression.fields.map((field) =>
        encode(encoder, field.value, env, clearPolarity(mode)),
      );
      // Type.Synthesize types a set of records only at type level 3.
      const type: Type = {
        kind: "Record",
        fields: names.map((name, index) => ({ name, type: getType(values[index]) })),
      };
      return wrapIdv(
        call(
          tla(`${expression.kind === "Record" ? "Record" : "RecordSet"}_${suffix}`),
          values.map(toIdv),
        ),
        expression.kind === "Record" ? getTypedOnly(encoder, type) : undefined,
      );
    }
    case "Except":
      return wrapIdv(encodeExcept(encoder, expression, env, mode));
    case "Dot": {
      const record = encode(encoder, expression.expression, env, clearPolarity(mode));
      const text = `(${FUN_APP} ${toIdv(record)} ${tla(`StrLit_${expression.field}`)})`;
      const component = getTypedOnly(encoder, getFieldType(getType(record), expression.field));
      return component === undefined ? wrapIdv(text) : project(text, component);
    }
    case "Case":
      return encodeCase(encoder, expression, env, mode);
    case "String":
      return wrapIdv(tla(`StrLit_${expression.value}`), getTypedOnly(encoder, STRING));
    case "Num":
      if (expression.fraction !== "") throw new TlaUnsupportedError("a real number");
      // Type.Synthesize gives a number no type when arithmetic is off.
      if (!encoder.encoding.isArithmetic)
        return wrapIdv(tla(`IntLit_${BigInt(expression.integer)}`));
      return {
        isBool: false,
        text: `(${CAST_INT} ${BigInt(expression.integer)})`,
        integer: String(BigInt(expression.integer)),
      };
    case "At":
      if (mode.at === undefined) throw new TlaUnsupportedError("@ outside EXCEPT");
      return wrapIdv(mode.at);
    case "Tquant":
    case "Tsub":
    case "Fair":
      throw new TlaProverError("Backend.Smtlib: Unsupported expression");
    case "Lambda":
    case "Bang":
      throw new TlaProverError(`Type.Synthesize: Unexpected ${expression.kind} constructor`);
    default:
      throw new TlaUnsupportedError(`the expression ${expression.kind}`);
  }
};

export const getEntries = (encoder: Encoder, line: string): Entry[] => [
  ...encoder.flattener.takeIntroduced(),
  removeUnprimable(resolveTriggers(line, false)),
];

export const createEncoder = (session: EncodingSession, encoding: SmtEncoding): Encoder => ({
  session,
  encoding,
  flattener: createFlattener(),
  anonymous: new Map(),
  recordFields: new Map(),
  setTypes: new Map(),
  context: createContext(),
  declared: new Map(),
});
