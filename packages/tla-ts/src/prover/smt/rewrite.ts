// encode/n_rewrite.ml, type/t_synth.ml and encode/n_standardize.ml: a TLA+ expression as an SMT-LIB
// term over Idv.

import { TlaError, TlaProverError, TlaUnsupportedError } from "../../errors";
import { normalizeApply, shiftExpr } from "../../obligations/substitution";
import {
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Sequent,
} from "../../obligations/expression";
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
  // Type.Synthesize: the Int-sorted form of a term that is an integer before it's cast to Idv.
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

export const createEncoder = (session: EncodingSession, encoding: SmtEncoding) => {
  const flattener = createFlattener();
  const flatten = flattener.flatten;
  const anonymous = new Map<string, number>();
  const recordFields = new Map<string, string[]>();
  const setTypes = new Map<string, Type>();
  const context = createContext();
  const declared = new Map<string, Identifier>();

  // Standardize wraps a cast term in an application, and set_extensionality_visitor visits the
  // arguments of an application with neither polarity, so a cast triggers every set equality in it.
  const toBool = (term: Term) =>
    term.isBool ? term.text : `(= ${resolveTriggers(term.text, true)} ${TT_IDV})`;

  const toIdv = (term: Term) =>
    term.isBool ? `(${CAST_BOOL} ${resolveTriggers(term.text, true)})` : term.text;

  const bool = (text: string): Term => ({ isBool: true, text });

  const idv = (text: string, type?: Type): Term => ({ isBool: false, text, type });

  const typed = (type: Type | undefined) => (encoding.isTyped ? type : undefined);

  const integer = (text: string): Term => ({
    isBool: false,
    text: `(${CAST_INT} ${text})`,
    integer: text,
  });

  const getType = (term: Term) =>
    term.isBool ? BOOL : term.integer === undefined ? (term.type ?? IDV) : INT;

  const getTyped = (symbol: string, type: Type | undefined) => {
    if (type?.kind === "Int") return integer(symbol);
    return type?.kind === "Bool" ? bool(symbol) : idv(symbol, type);
  };

  // Type.Synthesize marks a component of a tuple or record as projected into its type, and only
  // Int has a projection at type level 2. tlapm leaves a Bool component an Idv it then uses as a
  // Bool, so it stays an individual here.
  const project = (text: string, type: Type) => {
    if (type.kind === "Int") return { isBool: false, text, integer: `(${PROJ_INT} ${text})` };
    return idv(text, type.kind === "Bool" ? undefined : type);
  };

  const getElementType = (term: Term) => {
    const type = getType(term);
    return type.kind === "Set" ? type.element : undefined;
  };

  const inferType = (expression: Expr, env: Env | undefined, mode: Mode, depth: number) => {
    const inner = Array.from({ length: depth }).reduce<Env | undefined>(
      (current) => push(current, { kind: "unsupported", reason: "a declaration without a type" }),
      env,
    );
    try {
      return getType(
        createEncoder({ caseErrors: session.caseErrors }, encoding).encode(expression, inner, mode),
      );
    } catch (error) {
      if (error instanceof TlaError) return undefined;
      throw error;
    }
  };

  // The type a later hypothesis gives a declaration with no domain, which the env doesn't bind yet.
  // A primed variable has no index of its own, so the hypotheses name it.
  const searchDeclarationType = (
    expression: Expr,
    isPositive: boolean,
    env: Env | undefined,
    mode: Mode,
    primed?: string,
  ) =>
    encoding.isTyped
      ? searchType(
          {
            infer: (inner, depth) =>
              inferType(inner, env, mode, primed === undefined ? depth + 1 : depth),
            isTarget: (inner, depth) =>
              primed === undefined
                ? inner.kind === "Ix" && inner.index === depth + 1
                : inner.kind === "Opaque" && inner.name === primed,
          },
          isPositive,
          expression,
        )
      : undefined;

  const getBinding = (env: Env | undefined, index: number): Binding => {
    const found = Array.from({ length: index - 1 }).reduce<Env | undefined>(
      (current) => current?.rest,
      env,
    );
    if (!found) throw new TlaUnsupportedError("a reference outside the obligation");
    return found.binding;
  };

  const push = (env: Env | undefined, binding: Binding): Env => ({ binding, rest: env });

  const getFree = (text: string, depth: number) =>
    [...new Set(text.match(/[^\s()]+#\d+/g))]
      .filter((variable) => getDepth(variable) < depth)
      .toSorted((left, right) => getDepth(left) - getDepth(right));

  const getUniqueName = (name: string) => {
    const identifier = context.adjoin(name);
    context.enter(identifier);
    declared.set(identifier.name, identifier);
    return identifier.name;
  };

  const neither = (mode: Mode): Mode => ({ ...mode, polarity: "Neither" });

  const invert = (mode: Mode): Mode => ({
    ...mode,
    polarity:
      mode.polarity === "Positive"
        ? "Negative"
        : mode.polarity === "Negative"
          ? "Positive"
          : "Neither",
  });

  const encodeIdv = (expression: Expr, env: Env | undefined, mode: Mode) =>
    toIdv(encode(expression, env, neither(mode)));

  const encodeBool = (expression: Expr, env: Env | undefined, mode: Mode) =>
    toBool(encode(expression, env, mode));

  // A Ditto copies the last domain, and tlapm's Rewrite encodes each copy, so each one flattens
  // again.
  const encodeDomains = (bounds: Bound[], env: Env | undefined, mode: Mode) =>
    bounds
      .reduce<(Expr | undefined)[]>((domains, bound) => {
        if (bound.domain.kind === "Ditto") return [...domains, domains.at(-1)];
        if (bound.domain.kind === "NoDomain") return [...domains, undefined];
        return [...domains, bound.domain.expression];
      }, [])
      .map((domain) => (domain === undefined ? undefined : encode(domain, env, neither(mode))));

  const getDomains = (bounds: Bound[], env: Env | undefined, mode: Mode, construct: string) =>
    encodeDomains(bounds, env, mode).map((domain) => {
      if (domain === undefined) throw new TlaUnsupportedError(`${construct} without a domain`);
      return domain;
    });

  const getSetResult = (domains: Term[], getResult: (elements: Type[]) => Type) => {
    const elements = domains.map(getElementType);
    return encoding.isTyped && elements.every((element) => element !== undefined)
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
          searchDeclarationType(scope, expression.quantifier === "Forall", outer.env, outer.mode),
        );
      },
      { types: [], last: undefined },
    ).types;

  const encodeQuantifier = (
    expression: Extract<Expr, { kind: "Quant" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = encodeDomains(expression.bounds, env, mode);
    const types = encoding.isTyped ? getBoundTypes(expression, domains, env, mode) : [];
    const bound = bindVariables(
      expression.bounds.map((innerBound) => innerBound.name),
      env,
      mode,
      types,
    );
    const body = encodeBool(expression.body, bound.env, bound.mode);
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
    expression: Extract<Expr, { kind: "SetSt" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domain = encode(expression.domain, env, neither(mode));
    const bound = bindVariables([expression.name], env, neither(mode));
    const body = encodeBool(expression.body, bound.env, bound.mode);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "SetSt",
      body,
      mode,
      (name) => getSetStAxioms(name, free, body, bound.variables[0]),
      getSorts(1, free),
    );
    return idv(
      call(symbol, [toIdv(domain), ...free]),
      getSetResult([domain], (elements) => getSetType(elements[0])),
    );
  };

  // At type level 2 tlapm also gives a set of values the types Standardize rejects, so it encodes
  // none.
  const encodeSetOf = (
    expression: Extract<Expr, { kind: "SetOf" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = getDomains(expression.bounds, env, mode, "a set of values");
    const bound = bindVariables(
      expression.bounds.map((innerBound) => innerBound.name),
      env,
      neither(mode),
    );
    const element = encode(expression.element, bound.env, neither(bound.mode));
    const text = toIdv(element);
    const free = getFree(text, mode.depth);
    const count = domains.length;
    const symbol = flatten(
      `SetOf_${count}`,
      text,
      mode,
      (name) => getSetOfAxioms(name, free, text, bound.variables),
      getSorts(count, free),
    );
    return idv(
      call(symbol, [...domains.map(toIdv), ...free]),
      getSetResult(domains, () => getSetType(getType(element))),
    );
  };

  // Rewrite.elim_multiarg: a function of several arguments is a function of a tuple, whose
  // components a LET binds. tlapm builds every component from Ix 1, which inside the LET is the
  // previous component, doesn't shift the body past the tuple, and indexes the tuple with
  // untyped numbers that no axiom relates to the tuple's, so this binds each component to its
  // typed index.
  const encodeFunction = (
    expression: Extract<Expr, { kind: "Fcn" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const terms = getDomains(expression.bounds, env, mode, "a function");
    const domains = terms.map(toIdv);
    const domain =
      domains.length === 1 ? domains[0] : call(tla(`Product_${domains.length}`), domains);
    const variable = getVariable(
      domains.length === 1 ? expression.bounds[0].name : "x",
      mode.depth,
    );
    const inner = { ...neither(mode), depth: mode.depth + 1 };
    const components = bindVariables(
      domains.length === 1 ? [] : expression.bounds.map((bound) => bound.name),
      env,
      inner,
    );
    const term = encode(
      expression.body,
      domains.length === 1 ? push(env, { kind: "constant", symbol: variable }) : components.env,
      neither(components.mode),
    );
    const body = toIdv(term);
    const definitions = components.variables.map(
      (component, index) =>
        `(${component} (${FUN_APP} ${variable} ${getNumeral(index + 1, encoding.isArithmetic)}))`,
    );
    // Smtlib prints the definitions of a LET last first, and N_axiomatize visits them in order.
    const value =
      domains.length === 1 ? body : `(let (${definitions.toReversed().join(" ")}) ${body})`;
    const free = getFree(value, mode.depth);
    const symbol = flatten(
      "FunFcn",
      domains.length === 1 ? body : `(let (${definitions.join(" ")}) ${body})`,
      mode,
      (name, axioms) => getFunctionAxioms(name, free, value, variable, axioms),
      getSorts(1, free),
    );
    return idv(
      call(symbol, [domain, ...free]),
      getSetResult(terms, (elements) => ({
        kind: "Fun",
        domain: elements.length === 1 ? elements[0] : { kind: "Product", items: elements },
        range: getType(term),
      })),
    );
  };

  // At type level 2 tlapm sorts the variable of a CHOOSE over a set of type Set(Int) as an Int in
  // its body but an Idv in ChooseDef, which Z3 rejects, so it stays an Idv.
  const encodeChoose = (
    expression: Extract<Expr, { kind: "Choose" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const bound = bindVariables([expression.name], env, neither(mode));
    const variable = bound.variables[0];
    const domain =
      expression.domain && `(${MEM} ${variable} ${encodeIdv(expression.domain, env, mode)})`;
    const predicate = encodeBool(expression.body, bound.env, bound.mode);
    const body = domain === undefined ? predicate : conjoin([domain, predicate]);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "Choose",
      body,
      mode,
      (name) => getChooseAxioms(name, free, body, variable),
      getSorts(0, free),
    );
    return idv(call(symbol, free));
  };

  // Type.Synthesize compares values of the same type in their own sort only above type level 1,
  // and Standardize triggers set extensionality on any equality of two sets of one type.
  const encodeEquality = (args: Expr[], env: Env | undefined, mode: Mode, isNegated: boolean) => {
    const left = encode(args[0], env, neither(mode));
    const right = encode(args[1], env, neither(mode));
    const type = getType(left);
    const polarity = encoding.isSetExtensional ? mode.polarity : undefined;
    if (!encoding.isTyped || !isSameType(type, getType(right)))
      return getEquality(toIdv(left), toIdv(right), polarity, isNegated);
    if (type.kind === "Int" || type.kind === "Bool") {
      const operands = [left, right].map((term) => term.integer ?? term.text).join(" ");
      return isNegated ? `(distinct ${operands})` : `(= ${operands})`;
    }
    if (type.kind !== "Set") return getEquality(left.text, right.text, polarity, isNegated);
    const name = `TrigEq_${getTypeName(type)}`;
    setTypes.set(name, type);
    return getEquality(left.text, right.text, polarity, isNegated, tla(name));
  };

  // Type.Synthesize: SelectSeq's test becomes the predicate LAMBDA x1 : Test(x1), its body the
  // text Flatten compares.
  const getSelectionTest = (test: Expr, env: Env | undefined, mode: Mode) => {
    const lambda = test.kind === "Lambda" && test.params.length === 1 ? test : undefined;
    const bound = bindVariables([lambda?.params[0].name ?? "x1"], env, neither(mode));
    const body = encodeBool(
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
    builtin: Builtin,
    args: Expr[],
    env: Env | undefined,
    mode: Mode,
  ): Term => {
    const getTerms = () => args.map((arg) => encode(arg, env, neither(mode)));
    const idvs = () => getTerms().map(toIdv);
    switch (builtin) {
      case "Conj":
        return bool(conjoin(args.map((arg) => encodeBool(arg, env, mode))));
      case "Disj":
        return bool(disjoin(args.map((arg) => encodeBool(arg, env, mode))));
      case "Implies":
        return bool(
          `(=> ${encodeBool(args[0], env, invert(mode))} ${encodeBool(args[1], env, mode)})`,
        );
      case "Equiv":
        return bool(`(= ${args.map((arg) => encodeBool(arg, env, neither(mode))).join(" ")})`);
      case "Neg":
        return bool(`(not ${encodeBool(args[0], env, invert(mode))})`);
      case "Eq":
        return bool(encodeEquality(args, env, mode, false));
      case "Neq":
        return bool(encodeEquality(args, env, mode, true));
      case "Mem":
        return bool(call(MEM, idvs()));
      case "Notmem":
        return bool(`(not ${call(MEM, idvs())})`);
      case "Subseteq":
        return bool(call(SUBSET_EQ, idvs()));
      // Rewrite.elim_compare, which leaves the comparisons of two integers at type level 2: a < b
      // is a <= b /\ a # b, and a > b is b < a.
      case "Lteq":
      case "Gteq":
      case "Lt":
      case "Gt": {
        const terms = getTerms();
        const integers = terms.flatMap((term) =>
          term.integer === undefined ? [] : [term.integer],
        );
        if (encoding.isTyped && integers.length === 2)
          return bool(call(tla(`TInt${builtin}`), integers));
        const order = (operands: string[]) =>
          builtin === "Lteq" || builtin === "Lt" ? operands : operands.toReversed();
        const operands = order(terms.map(toIdv));
        if (builtin === "Lteq" || builtin === "Gteq") return bool(call(INT_LTEQ, operands));
        // Rewrite copies the operands before Flatten, which flattens each copy again.
        return bool(`(and ${call(INT_LTEQ, operands)} (distinct ${order(idvs()).join(" ")}))`);
      }
      case "SelectSeq": {
        const test = getSelectionTest(args[1], env, mode);
        const free = getFree(test.body, mode.depth);
        const symbol = flatten(
          "SelectSeq",
          test.body,
          mode,
          (name) => getSelectSeqAxioms(name, free, test.body, test.variable, encoding.isArithmetic),
          getSorts(1, free),
        );
        return idv(call(symbol, [encodeIdv(args[0], env, mode), ...free]));
      }
      case "Unprimable": {
        const term = encode(args[0], env, neither(mode));
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
        if (!encoding.isTyped) return idv(call(symbol, terms.map(toIdv)));
        const integers = terms.flatMap((term) =>
          term.integer === undefined ? [] : [term.integer],
        );
        if (ARITHMETIC.has(builtin) && integers.length === terms.length)
          return integer(call(tla(`TInt${builtin}`), integers));
        return idv(call(symbol, terms.map(toIdv)), getBuiltinType(builtin, terms.map(getType)));
      }
    }
  };

  const encodeReference = (
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
        return idv(
          call(
            binding.symbol,
            args.map((arg) => encodeIdv(arg, env, mode)),
          ),
        );
      case "secondOrder": {
        if (args.length !== binding.shapes.length)
          throw new TlaUnsupportedError("an operator applied to the wrong number of arguments");
        const operands = args.map((arg, index) => {
          if (binding.shapes[index] === 0)
            return { isFirstOrder: true, text: encodeIdv(arg, env, mode) };
          // An operator's name as the argument stands for the operator, which compare_expr
          // matches by name.
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
            neither(mode),
          );
          return { isFirstOrder: false, text: encodeIdv(arg.body, bound.env, bound.mode) };
        });
        const firstOrder = operands.flatMap((operand) =>
          operand.isFirstOrder ? [operand.text] : [],
        );
        const higherOrder = operands.flatMap((operand) =>
          operand.isFirstOrder ? [] : [operand.text],
        );
        const free = getFree(higherOrder.join(" "), mode.depth);
        const symbol = flatten(
          "",
          higherOrder.join(" "),
          mode,
          () => [],
          getSorts(firstOrder.length, free),
          binding.name,
        );
        return idv(call(symbol, [...firstOrder, ...free]));
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

  // Standardize: an opaque name the Action frontend introduces is an anonymous operator, named
  // OPAQUE_ when it has no arguments.
  const encodeOpaque = (name: string, args: Expr[], env: Env | undefined, mode: Mode): Term => {
    // Rewrite.simplify_sets writes IsAFcn for the functions in a set of functions.
    if (name === "IsAFcn" && args.length === 1)
      return bool(`(${FUN_ISAFCN} ${encodeIdv(args[0], env, mode)})`);
    if (args.length === 0 && name.endsWith("#prime"))
      return getPrimed(env, name.slice(0, -"#prime".length));
    const anonymousName = args.length === 0 ? `Anon_OPAQUE_${name}` : `Anon_${name}`;
    anonymous.set(anonymousName, args.length);
    return idv(
      call(
        tla(anonymousName),
        args.map((arg) => encodeIdv(arg, env, mode)),
      ),
    );
  };

  const encodeExcept = (
    expression: Extract<Expr, { kind: "Except" }>,
    env: Env | undefined,
    mode: Mode,
  ) =>
    expression.specs.reduce(
      (base, spec) => {
        // Elab.desugar: @ is the value at the whole trail.
        const update = (value: string, trail: typeof spec.trail): string => {
          if (trail.length === 0) return encodeIdv(spec.value, env, { ...mode, at: value });
          const point = trail[0];
          const encodeKey = () =>
            point.kind === "Dot"
              ? tla(`StrLit_${point.field}`)
              : encodeIdv(point.expression, env, mode);
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
      encodeIdv(expression.function, env, mode),
    );

  // Standardize names each CASE with no OTHER by a count that tlapm never resets.
  const getCaseError = () => {
    session.caseErrors++;
    const name = `Anon_incomplete_case_error_${session.caseErrors}`;
    anonymous.set(name, 0);
    return tla(name);
  };

  const encodeCase = (
    expression: Extract<Expr, { kind: "Case" }>,
    env: Env | undefined,
    mode: Mode,
  ): Term => {
    const bodies = expression.arms.map((arm) => encode(arm.body, env, mode));
    // Standardize: a CASE with no OTHER ends in an unknown value.
    const other: Term = expression.other
      ? encode(expression.other, env, mode)
      : idv(getCaseError());
    const type = getType(other);
    const isUniform = bodies.every((body) => isSameType(getType(body), type));
    const isBool = isUniform && type.kind === "Bool";
    if (isUniform && type.kind === "Int") {
      const integer = expression.arms.reduceRight(
        (rest, arm, index) =>
          `(ite ${encodeBool(arm.condition, env, neither(mode))} ${bodies[index].integer} ${rest})`,
        other.integer ?? "",
      );
      return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
    }
    const convert = (term: Term) => (isBool ? term.text : toIdv(term));
    const text = expression.arms.reduceRight(
      (rest, arm, index) =>
        `(ite ${encodeBool(arm.condition, env, mode)} ${convert(bodies[index])} ${rest})`,
      convert(other),
    );
    return { isBool, text, type: isUniform ? other.type : undefined };
  };

  // Type.Synthesize types a NEW constant by its visible domain, or else by a hypothesis in the rest
  // of the sequent. The guard is its membership in the domain the encoding asserts.
  const declareConstant = (
    hyp: Extract<Hyp, { kind: "Fresh" }>,
    guarded: Expr | undefined,
    rest: Sequent,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domain = guarded && encode(guarded, env, neither(mode));
    const type =
      domain !== undefined && hyp.domainVisibility === "Visible"
        ? getElementType(domain)
        : searchDeclarationType({ kind: "Sequent", sequent: rest }, true, env, mode);
    return {
      type,
      getGuard: (symbol: string) =>
        domain && `(${MEM} ${toIdv(getTyped(symbol, type))} ${toIdv(domain)})`,
    };
  };

  const encodeSequent = (sequent: Sequent, env: Env | undefined, mode: Mode): string => {
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
            const declared = declareConstant(hyp, hyp.domain, rest, state.env, state.mode);
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
                ? encodeBool(hyp.expression, state.env, invert(state.mode))
                : undefined;
            return {
              env: push(state.env, { kind: "unsupported", reason: "a reference to a fact" }),
              mode: state.mode,
              wrappers: fact
                ? [...state.wrappers, (body) => `(=> ${fact} ${body})`]
                : state.wrappers,
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
      encodeBool(sequent.active, steps.env, steps.mode),
    );
  };

  const encode = (expression: Expr, env: Env | undefined, mode: Mode): Term => {
    switch (expression.kind) {
      case "Ix":
        return encodeReference(getBinding(env, expression.index), [], env, mode);
      case "Internal":
        switch (expression.builtin) {
          case "TRUE":
            return bool("true");
          case "FALSE":
            return bool("false");
          case "BOOLEAN":
            return idv(BOOL_SET, typed(getSetType(BOOL)));
          case "STRING":
            return idv(STR_SET, typed(getSetType(STRING)));
          case "Nat":
            return idv(NAT_SET, typed(getSetType(INT)));
          case "Int":
            return idv(INT_SET, typed(getSetType(INT)));
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
          return encodeBuiltin(operator.builtin, expression.args, env, mode);
        if (operator.kind === "Ix")
          return encodeReference(getBinding(env, operator.index), expression.args, env, mode);
        if (operator.kind === "Opaque")
          return encodeOpaque(operator.name, expression.args, env, mode);
        if (operator.kind === "Lambda")
          return encode(normalizeApply(operator, expression.args), env, mode);
        throw new TlaUnsupportedError(`an application of ${operator.kind}`);
      }
      case "Sequent":
        return bool(encodeSequent(expression.sequent, env, mode));
      case "With":
      case "Parens":
        return encode(expression.expression, env, mode);
      case "If": {
        const condition = encodeBool(expression.condition, env, mode);
        const consequent = encode(expression.consequent, env, mode);
        const alternative = encode(expression.alternative, env, mode);
        if (consequent.integer !== undefined && alternative.integer !== undefined) {
          const integer = `(ite ${resolveTriggers(condition, true)} ${consequent.integer} ${alternative.integer})`;
          return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
        }
        if (consequent.isBool && alternative.isBool)
          return bool(`(ite ${condition} ${consequent.text} ${alternative.text})`);
        return idv(
          `(ite ${condition} ${toIdv(consequent)} ${toIdv(alternative)})`,
          isSameType(getType(consequent), getType(alternative)) ? consequent.type : undefined,
        );
      }
      case "List": {
        const items = expression.items.map((item) => encodeBool(item, env, mode));
        return bool(expression.bullet === "Or" ? disjoin(items) : conjoin(items));
      }
      case "Opaque":
        return encodeOpaque(expression.name, [], env, mode);
      case "Quant":
        return bool(encodeQuantifier(expression, env, mode));
      case "Choose":
        return encodeChoose(expression, env, mode);
      case "SetSt":
        return encodeSetSt(expression, env, mode);
      case "SetOf":
        return encodeSetOf(expression, env, mode);
      case "SetEnum": {
        const elements = expression.elements.map((element) => encode(element, env, neither(mode)));
        const types = elements.map(getType);
        return idv(
          call(tla(`SetEnum_${elements.length}`), elements.map(toIdv)),
          typed(
            types.every((type) => isSameType(type, types[0] ?? IDV))
              ? getSetType(types[0] ?? IDV)
              : undefined,
          ),
        );
      }
      case "Product": {
        const factors = expression.factors.map((factor) => encode(factor, env, neither(mode)));
        return idv(
          call(tla(`Product_${factors.length}`), factors.map(toIdv)),
          getSetResult(factors, (items) => getSetType({ kind: "Product", items })),
        );
      }
      case "Tuple": {
        const elements = expression.elements.map((element) => encode(element, env, neither(mode)));
        return idv(
          call(tla(`Tuple_${elements.length}`), elements.map(toIdv)),
          typed({ kind: "Product", items: elements.map(getType) }),
        );
      }
      case "Fcn":
        return encodeFunction(expression, env, mode);
      // Rewrite.elim_multiarg: f[a, b] applies f to the tuple <<a, b>>.
      case "FcnApp": {
        const encodedFunction = encode(expression.function, env, neither(mode));
        const args = expression.args.map((arg) => encodeIdv(arg, env, mode));
        const argument = args.length === 1 ? args[0] : call(tla(`Tuple_${args.length}`), args);
        const text = `(${FUN_APP} ${toIdv(encodedFunction)} ${argument})`;
        const component = typed(getComponentType(getType(encodedFunction), expression.args));
        return component === undefined ? idv(text) : project(text, component);
      }
      case "Arrow": {
        const sets = [expression.domain, expression.range].map((set) =>
          encode(set, env, neither(mode)),
        );
        return idv(
          call(FUN_SET, sets.map(toIdv)),
          getSetResult(sets, (elements) =>
            getSetType({ kind: "Fun", domain: elements[0], range: elements[1] }),
          ),
        );
      }
      case "Record":
      case "Rect": {
        const names = expression.fields.map((field) => field.name);
        const suffix = names.join("_");
        recordFields.set(`Record_${suffix}`, names);
        recordFields.set(`RecordSet_${suffix}`, names);
        const values = expression.fields.map((field) => encode(field.value, env, neither(mode)));
        // Type.Synthesize types a set of records only at type level 3.
        const type: Type = {
          kind: "Record",
          fields: names.map((name, index) => ({ name, type: getType(values[index]) })),
        };
        return idv(
          call(
            tla(`${expression.kind === "Record" ? "Record" : "RecordSet"}_${suffix}`),
            values.map(toIdv),
          ),
          expression.kind === "Record" ? typed(type) : undefined,
        );
      }
      case "Except":
        return idv(encodeExcept(expression, env, mode));
      case "Dot": {
        const record = encode(expression.expression, env, neither(mode));
        const text = `(${FUN_APP} ${toIdv(record)} ${tla(`StrLit_${expression.field}`)})`;
        const component = typed(getFieldType(getType(record), expression.field));
        return component === undefined ? idv(text) : project(text, component);
      }
      case "Case":
        return encodeCase(expression, env, mode);
      case "String":
        return idv(tla(`StrLit_${expression.value}`), typed(STRING));
      case "Num":
        if (expression.fraction !== "") throw new TlaUnsupportedError("a real number");
        // Type.Synthesize gives a number no type when arithmetic is off.
        if (!encoding.isArithmetic) return idv(tla(`IntLit_${BigInt(expression.integer)}`));
        return {
          isBool: false,
          text: `(${CAST_INT} ${BigInt(expression.integer)})`,
          integer: String(BigInt(expression.integer)),
        };
      case "At":
        if (mode.at === undefined) throw new TlaUnsupportedError("@ outside EXCEPT");
        return idv(mode.at);
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

  const getEntries = (line: string): Entry[] => [
    ...flattener.takeIntroduced(),
    removeUnprimable(resolveTriggers(line, false)),
  ];

  return {
    encode,
    encodeIdv,
    encodeBool,
    declareConstant,
    searchDeclarationType,
    push,
    getEntries,
    getUniqueName,
    flattened: flattener.flattened,
    anonymous,
    recordFields,
    setTypes,
    declared,
  };
};
