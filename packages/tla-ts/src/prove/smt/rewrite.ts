// encode/n_rewrite.ml, type/t_synth.ml, and encode/n_standardize.ml: a TLA+ expression as an
// SMT-LIB term over the sort Idv.

import { TlaUnsupportedError } from "../../errors";
import {
  normalizeApply,
  type Bound,
  type Builtin,
  type Expr,
  type Sequent,
} from "../../obligation-expression";
import { compareStrings } from "../ocaml";
import { expandLet } from "../prep/elab";
import { createContext, type Identifier } from "./context";
import { createFlattener, getDepth, getVariable, type Entry } from "./flatten";
import {
  BOOL_SET,
  BUILTIN_SYMBOLS,
  call,
  CAP,
  CAST_BOOL,
  CAST_INT,
  conjoin,
  CUP,
  disjoin,
  FUN_APP,
  FUN_DOM,
  FUN_EXCEPT,
  FUN_ISAFCN,
  FUN_SET,
  forall,
  getNames,
  INT_LTEQ,
  INT_RANGE,
  INT_SET,
  IS_SET_OF,
  MEM,
  NAT_SET,
  replaceToken,
  SEQ,
  SET_MINUS,
  STR_SET,
  SUBSET,
  SUBSET_EQ,
  tla,
  TRIG_EQ,
  TT_IDV,
  UNION,
} from "./format";
import { getIntegers } from "./axioms";
import { axiom, getAxiomKey } from "./table";

export interface Term {
  isBool: boolean;
  text: string;
  // Type.Synthesize: the Int-sorted form of a term that is an integer before it's cast to Idv.
  integer?: string;
}

// What tlapm keeps across the obligations of one run.
export interface EncodingSession {
  caseErrors: number;
}

type Polarity = "Positive" | "Negative" | "Neither";

export interface Mode {
  isPrimed: boolean;
  polarity: Polarity;
  at: string | undefined;
  depth: number;
}

export type Binding =
  | { kind: "constant"; symbol: string }
  | { kind: "variable"; symbol: string; primed: string }
  | { kind: "operator"; symbol: string; arity: number; opaque: string | undefined }
  | { kind: "secondOrder"; name: string; shapes: number[] }
  | { kind: "unsupported"; reason: string };

export interface Env {
  binding: Binding;
  rest: Env | undefined;
}

const SET_HEADS = new Set([
  UNION,
  SUBSET,
  CUP,
  CAP,
  SET_MINUS,
  BOOL_SET,
  STR_SET,
  INT_SET,
  NAT_SET,
  INT_RANGE,
  FUN_SET,
  SEQ,
]);

// Standardize.is_set: the constructors whose values are sets.
const isSetTerm = (text: string) => {
  const head = /^\(?([^\s()]+)/.exec(text)?.[1] ?? "";
  return (
    SET_HEADS.has(head) ||
    /^smt__TLA____(SetEnum__\d+|SetSt__flatnd__\d+|SetOf__\d+__flatnd__\d+|Product__\d+|RecordSet__)/.test(
      head,
    )
  );
};

const sortFields = <Field extends { name: string }>(fields: Field[]) =>
  fields.toSorted((left, right) => compareStrings(left.name, right.name));

export const createEncoder = (session: EncodingSession) => {
  const flattener = createFlattener();
  const flatten = flattener.flatten;
  // The arity of each anonymous operator Coalesce introduces.
  const anonymous = new Map<string, number>();
  // The fields of each record symbol.
  const recordFields = new Map<string, string[]>();
  const context = createContext();
  // The salted name of each declared user symbol, for the printer's context.
  const declared = new Map<string, Identifier>();

  const toBool = (term: Term) => (term.isBool ? term.text : `(= ${term.text} ${TT_IDV})`);

  const toIdv = (term: Term) => (term.isBool ? `(${CAST_BOOL} ${term.text})` : term.text);

  const bool = (text: string): Term => ({ isBool: true, text });

  const idv = (text: string): Term => ({ isBool: false, text });

  const getBinding = (env: Env | undefined, index: number): Binding => {
    const found = Array.from({ length: index - 1 }).reduce<Env | undefined>(
      (current) => current?.rest,
      env,
    );
    if (!found) throw new TlaUnsupportedError("a reference outside the obligation");
    return found.binding;
  };

  const push = (env: Env | undefined, binding: Binding): Env => ({ binding, rest: env });

  // The variables bound outside depth that text uses, outermost first.
  const getFree = (text: string, depth: number) =>
    [...new Set(text.match(/[^\s()]+#\d+/g))]
      .filter((variable) => getDepth(variable) < depth)
      .toSorted((left, right) => getDepth(left) - getDepth(right));

  // Smtlib.adj: the Action frontend's name, salted while it's taken.
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

  // The domains of bounds, each in the scope outside them. A Ditto copies the last domain, and
  // tlapm's Rewrite encodes each copy, so each one flattens again.
  const encodeDomains = (bounds: Bound[], env: Env | undefined, mode: Mode) =>
    bounds
      .reduce<(Expr | undefined)[]>((domains, bound) => {
        if (bound.domain.kind === "Ditto") return [...domains, domains.at(-1)];
        if (bound.domain.kind === "NoDomain") return [...domains, undefined];
        return [...domains, bound.domain.expression];
      }, [])
      .map((domain) => (domain === undefined ? undefined : encodeIdv(domain, env, mode)));

  const getDomains = (bounds: Bound[], env: Env | undefined, mode: Mode, construct: string) =>
    encodeDomains(bounds, env, mode).map((domain) => {
      if (domain === undefined) throw new TlaUnsupportedError(`${construct} without a domain`);
      return domain;
    });

  // Coalesce names a bound variable by its kind. Visit gives a LAMBDA's parameters kind Unknown.
  const bindVariables = (
    names: string[],
    env: Env | undefined,
    mode: Mode,
    kind: "CONSTANT" | "Unknown" = "CONSTANT",
  ) => {
    const variables = names.map((name, index) =>
      getVariable(`${kind}_${name}_`, mode.depth + index),
    );
    const inner = variables.reduce<Env | undefined>(
      (current, symbol) => push(current, { kind: "constant", symbol }),
      env,
    );
    return { variables, env: inner, mode: { ...mode, depth: mode.depth + names.length } };
  };

  const binders = (variables: string[]) =>
    variables.map((variable) => `(${variable} Idv)`).join(" ");

  const encodeQuantifier = (
    expression: Extract<Expr, { kind: "Quant" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = encodeDomains(expression.bounds, env, mode);
    const bound = bindVariables(
      expression.bounds.map((innerBound) => innerBound.name),
      env,
      mode,
    );
    const body = encodeBool(expression.body, bound.env, bound.mode);
    const guards = bound.variables.flatMap((variable, index) =>
      domains[index] === undefined ? [] : [`(${MEM} ${variable} ${domains[index]})`],
    );
    return expression.quantifier === "Forall"
      ? `(forall (${binders(bound.variables)}) ${guards.length === 0 ? body : `(=> ${conjoin(guards)} ${body})`})`
      : `(exists (${binders(bound.variables)}) ${conjoin([...guards, body])})`;
  };

  const encodeSetSt = (
    expression: Extract<Expr, { kind: "SetSt" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domain = encodeIdv(expression.domain, env, mode);
    const bound = bindVariables([expression.name], env, neither(mode));
    const body = encodeBool(expression.body, bound.env, bound.mode);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "SetSt",
      body,
      mode.depth,
      (name) => {
        const set = call(name, ["a", ...free]);
        const predicate = replaceToken(body, bound.variables[0], "x");
        return [
          axiom(
            "SetStDef",
            [],
            forall([...free, "a", "x"], `(= (${MEM} x ${set}) (and (${MEM} x a) ${predicate}))`, [
              [`(${MEM} x ${set})`],
              [`(${MEM} x a)`, set],
            ]),
          ),
        ];
      },
      free.length + 1,
    );
    return idv(call(symbol, [domain, ...free]));
  };

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
    const element = encodeIdv(expression.element, bound.env, bound.mode);
    const free = getFree(element, mode.depth);
    const count = domains.length;
    const symbol = flatten(
      `SetOf_${count}`,
      element,
      mode.depth,
      (name) => {
        const sets = getNames("a", count);
        const variables = getNames("y", count);
        const value = bound.variables.reduce(
          (text, variable, index) => replaceToken(text, variable, variables[index]),
          element,
        );
        const set = call(name, [...sets, ...free]);
        const guards = variables.map((variable, index) => `(${MEM} ${variable} ${sets[index]})`);
        // N_axioms.assert_issetof names its one set a.
        const single = count === 1 ? ["a"] : sets;
        return [
          axiom(
            "SetOfIntro",
            [count],
            forall(
              [...free, ...sets, ...variables],
              `(=> ${conjoin(guards)} (${MEM} ${value} ${set}))`,
              [
                [value, set],
                [set, ...guards],
              ],
            ),
          ),
          axiom(
            "SetOfElim",
            [count],
            forall(
              [...free, ...sets, "x"],
              `(=> (${MEM} x ${set}) (exists (${binders(variables)}) ${conjoin([...guards, `(= x ${value})`])}))`,
              [[`(${MEM} x ${set})`]],
            ),
          ),
          axiom(
            "AssertIsSetOf",
            [count],
            forall([...free, ...single], `(${IS_SET_OF} ${call(name, [...single, ...free])})`, [
              [call(name, [...single, ...free])],
            ]),
          ),
        ];
      },
      count + free.length,
    );
    return idv(call(symbol, [...domains, ...free]));
  };

  // Rewrite.elim_multiarg: a function of several arguments is a function of a tuple.
  const encodeFunction = (
    expression: Extract<Expr, { kind: "Fcn" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = getDomains(expression.bounds, env, mode, "a function");
    const domain =
      domains.length === 1 ? domains[0] : call(tla(`Product_${domains.length}`), domains);
    const variable = getVariable(
      domains.length === 1 ? `CONSTANT_${expression.bounds[0].name}_` : "x",
      mode.depth,
    );
    const inner = { ...neither(mode), depth: mode.depth + 1 };
    const bodyEnv =
      domains.length === 1
        ? push(env, { kind: "constant", symbol: variable })
        : getIntegers(domains.length).reduce<Env | undefined>(
            (current, key) =>
              push(current, { kind: "constant", symbol: `(${FUN_APP} ${variable} ${key})` }),
            env,
          );
    const body = encodeIdv(expression.body, bodyEnv, inner);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "FunFcn",
      body,
      mode.depth,
      (name, axioms) => {
        const value = call(name, ["a", ...free]);
        const result = replaceToken(body, variable, "x");
        const typing = axioms.has(getAxiomKey(axiom("FunTyping", [], undefined)))
          ? [
              axiom(
                "FunTyping",
                [],
                forall(
                  [...free, "a", "b"],
                  `(=> (forall ((x Idv)) (=> (${MEM} x a) (${MEM} ${result} b))) (${MEM} ${value} (${FUN_SET} a b)))`,
                  [[value, `(${FUN_SET} a b)`]],
                ),
              ),
            ]
          : [];
        return [
          axiom(
            "FunConstrIsafcn",
            [],
            forall([...free, "a"], `(${FUN_ISAFCN} ${value})`, [[value]]),
          ),
          axiom("FunDomDef", [], forall([...free, "a"], `(= (${FUN_DOM} ${value}) a)`, [[value]])),
          axiom(
            "FunAppDef",
            [],
            forall([...free, "a", "x"], `(=> (${MEM} x a) (= (${FUN_APP} ${value} x) ${result}))`, [
              [`(${FUN_APP} ${value} x)`],
              [`(${MEM} x a)`, value],
            ]),
          ),
          ...typing,
        ];
      },
      free.length + 1,
    );
    return idv(call(symbol, [domain, ...free]));
  };

  // Elab: CHOOSE x \in S : P is CHOOSE x : x \in S /\ P.
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
      mode.depth,
      (name) => [
        axiom(
          "ChooseDef",
          [],
          forall(
            [...free, "x"],
            `(=> ${replaceToken(body, variable, "x")} ${replaceToken(body, variable, call(name, free))})`,
          ),
        ),
      ],
      free.length,
    );
    return idv(call(symbol, free));
  };

  // Standardize.set_extensionality_visitor: an equality of sets where it may need proving
  // triggers the extensionality axiom.
  const encodeEquality = (
    left: Expr,
    right: Expr,
    env: Env | undefined,
    mode: Mode,
    isNegated: boolean,
  ) => {
    const leftTerm = encode(left, env, neither(mode));
    const rightTerm = encode(right, env, neither(mode));
    // Type.Synthesize compares values of the same sort only above type level 1, so two formulas
    // are compared as values.
    const leftText = toIdv(leftTerm);
    const rightText = toIdv(rightTerm);
    const isTriggered =
      (isSetTerm(leftText) || isSetTerm(rightText)) &&
      mode.polarity !== (isNegated ? "Positive" : "Negative");
    const equality = isTriggered
      ? `(${TRIG_EQ} ${leftText} ${rightText})`
      : `(= ${leftText} ${rightText})`;
    if (!isNegated) return equality;
    return isTriggered ? `(not ${equality})` : `(distinct ${leftText} ${rightText})`;
  };

  const encodeBuiltin = (
    builtin: Builtin,
    args: Expr[],
    env: Env | undefined,
    mode: Mode,
  ): Term => {
    const idvs = () => args.map((arg) => encodeIdv(arg, env, mode));
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
        return bool(encodeEquality(args[0], args[1], env, mode, false));
      case "Neq":
        return bool(encodeEquality(args[0], args[1], env, mode, true));
      case "Mem":
        return bool(call(MEM, idvs()));
      // Rewrite.elim_notmem: a \notin S is ~(a \in S).
      case "Notmem":
        return bool(`(not ${call(MEM, idvs())})`);
      case "Subseteq":
        return bool(call(SUBSET_EQ, idvs()));
      // Rewrite.elim_compare: a < b is a <= b /\ a # b, and a > b is b < a.
      case "Lteq":
        return bool(call(INT_LTEQ, idvs()));
      case "Gteq":
        return bool(call(INT_LTEQ, idvs().toReversed()));
      case "Lt":
      case "Gt": {
        const operands = builtin === "Lt" ? idvs() : idvs().toReversed();
        return bool(`(and ${call(INT_LTEQ, operands)} (distinct ${operands.join(" ")}))`);
      }
      case "Prime":
        if (mode.isPrimed) throw new TlaUnsupportedError("a doubly primed expression");
        return encode(args[0], env, { ...mode, isPrimed: true });
      case "Unprimable":
        return encode(args[0], env, mode);
      default: {
        const symbol = BUILTIN_SYMBOLS[builtin];
        if (symbol === undefined) throw new TlaUnsupportedError(`the operator ${builtin}`);
        return idv(call(symbol, idvs()));
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
        if (args.length > 0) throw new TlaUnsupportedError("an applied constant");
        return idv(binding.symbol);
      case "variable":
        if (args.length > 0) throw new TlaUnsupportedError("an applied variable");
        return idv(mode.isPrimed ? binding.primed : binding.symbol);
      case "operator": {
        if (args.length !== binding.arity)
          throw new TlaUnsupportedError("an operator applied to the wrong number of arguments");
        const encoded = args.map((arg) => encodeIdv(arg, env, mode));
        if (!mode.isPrimed || binding.opaque === undefined)
          return idv(call(binding.symbol, encoded));
        // Coalesce: a primed hidden definition that isn't constant is an opaque operator of its
        // own, which Standardize names OPAQUE_ when it has no arguments.
        const name =
          binding.arity === 0 ? `Anon_OPAQUE_${binding.opaque}` : `Anon_${binding.opaque}`;
        anonymous.set(name, binding.arity);
        return idv(call(tla(name), encoded));
      }
      // Flatten: an application of a second-order operator, which has no axioms, is a fresh
      // operator of its first-order arguments and the bound variables its others use.
      case "secondOrder": {
        if (args.length !== binding.shapes.length)
          throw new TlaUnsupportedError("an operator applied to the wrong number of arguments");
        const operands = args.map((arg, index) => {
          if (binding.shapes[index] === 0)
            return { isFirstOrder: true, text: encodeIdv(arg, env, mode) };
          if (arg.kind !== "Lambda")
            throw new TlaUnsupportedError("an operator argument that isn't a LAMBDA");
          const bound = bindVariables(
            arg.params.map((param) => param.name),
            env,
            neither(mode),
            "Unknown",
          );
          return { isFirstOrder: false, text: encode(arg.body, bound.env, bound.mode).text };
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
          mode.depth,
          () => [],
          firstOrder.length + free.length,
          binding.name,
        );
        return idv(call(symbol, [...firstOrder, ...free]));
      }
      case "unsupported":
        throw new TlaUnsupportedError(binding.reason);
    }
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
    const isBool = other.isBool && bodies.every((body) => body.isBool);
    const isInteger =
      other.integer !== undefined && bodies.every((body) => body.integer !== undefined);
    if (isInteger) {
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
        `(ite ${encodeBool(arm.condition, env, neither(mode))} ${convert(bodies[index])} ${rest})`,
      convert(other),
    );
    return { isBool, text };
  };

  const encodeSequent = (sequent: Sequent, env: Env | undefined, mode: Mode): string => {
    const steps = sequent.context.reduce<{
      env: Env | undefined;
      mode: Mode;
      wrappers: ((body: string) => string)[];
    }>(
      (state, hyp) => {
        switch (hyp.kind) {
          case "Fresh": {
            if (hyp.shape > 0) throw new TlaUnsupportedError("a second-order ASSUME");
            if (hyp.level !== "Constant")
              throw new TlaUnsupportedError("a NEW declaration that isn't constant");
            const domain = hyp.domain && encodeIdv(hyp.domain, state.env, state.mode);
            const bound = bindVariables([hyp.name], state.env, state.mode);
            const variable = bound.variables[0];
            const guard = domain && `(${MEM} ${variable} ${domain})`;
            return {
              env: bound.env,
              mode: bound.mode,
              wrappers: [
                ...state.wrappers,
                (body: string) =>
                  `(forall ((${variable} Idv)) ${guard ? `(=> ${guard} ${body})` : body})`,
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
                ? [...state.wrappers, (body: string) => `(=> ${fact} ${body})`]
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
            return idv(BOOL_SET);
          case "STRING":
            return idv(STR_SET);
          case "Nat":
            return idv(NAT_SET);
          case "Int":
            return idv(INT_SET);
          default:
            throw new TlaUnsupportedError(`the operator ${expression.builtin}`);
        }
      case "Apply": {
        const operator = expression.operator;
        if (operator.kind === "Internal")
          return encodeBuiltin(operator.builtin, expression.args, env, mode);
        if (operator.kind === "Ix")
          return encodeReference(getBinding(env, operator.index), expression.args, env, mode);
        if (operator.kind === "Lambda")
          return encode({ ...normalizeApply(operator, expression.args) }, env, mode);
        throw new TlaUnsupportedError(`an application of ${operator.kind}`);
      }
      case "Sequent":
        return bool(encodeSequent(expression.sequent, env, mode));
      case "With":
      case "Parens":
        return encode(expression.expression, env, mode);
      case "If": {
        const condition = encodeBool(expression.condition, env, neither(mode));
        const consequent = encode(expression.consequent, env, mode);
        const alternative = encode(expression.alternative, env, mode);
        if (consequent.integer !== undefined && alternative.integer !== undefined) {
          const integer = `(ite ${condition} ${consequent.integer} ${alternative.integer})`;
          return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
        }
        return consequent.isBool && alternative.isBool
          ? bool(`(ite ${condition} ${consequent.text} ${alternative.text})`)
          : idv(`(ite ${condition} ${toIdv(consequent)} ${toIdv(alternative)})`);
      }
      case "List": {
        const items = expression.items.map((item) => encodeBool(item, env, mode));
        return bool(expression.bullet === "Or" ? disjoin(items) : conjoin(items));
      }
      case "Let":
        return encode(expandLet(expression), env, mode);
      case "Quant":
        return bool(encodeQuantifier(expression, env, mode));
      case "Choose":
        return encodeChoose(expression, env, mode);
      case "SetSt":
        return encodeSetSt(expression, env, mode);
      case "SetOf":
        return encodeSetOf(expression, env, mode);
      case "SetEnum":
        return idv(
          call(
            tla(`SetEnum_${expression.elements.length}`),
            expression.elements.map((element) => encodeIdv(element, env, mode)),
          ),
        );
      case "Product":
        return idv(
          call(
            tla(`Product_${expression.factors.length}`),
            expression.factors.map((factor) => encodeIdv(factor, env, mode)),
          ),
        );
      case "Tuple":
        return idv(
          call(
            tla(`Tuple_${expression.elements.length}`),
            expression.elements.map((element) => encodeIdv(element, env, mode)),
          ),
        );
      case "Fcn":
        return encodeFunction(expression, env, mode);
      // Rewrite.elim_multiarg: f[a, b] applies f to the tuple <<a, b>>.
      case "FcnApp": {
        const fn = encodeIdv(expression.function, env, mode);
        const args = expression.args.map((arg) => encodeIdv(arg, env, mode));
        const argument = args.length === 1 ? args[0] : call(tla(`Tuple_${args.length}`), args);
        return idv(`(${FUN_APP} ${fn} ${argument})`);
      }
      case "Arrow":
        return idv(
          call(FUN_SET, [
            encodeIdv(expression.domain, env, mode),
            encodeIdv(expression.range, env, mode),
          ]),
        );
      // Rewrite.sort_recfields: a record's fields in order.
      case "Record":
      case "Rect": {
        const fields = sortFields(expression.fields);
        const names = fields.map((field) => field.name);
        recordFields.set(`Record_${names.join("_")}`, names);
        recordFields.set(`RecordSet_${names.join("_")}`, names);
        const name = `${expression.kind === "Record" ? "Record" : "RecordSet"}_${names.join("_")}`;
        return idv(
          call(
            tla(name),
            fields.map((field) => encodeIdv(field.value, env, mode)),
          ),
        );
      }
      case "Except":
        return idv(encodeExcept(expression, env, mode));
      case "Dot":
        return idv(
          `(${FUN_APP} ${encodeIdv(expression.expression, env, mode)} ${tla(`StrLit_${expression.field}`)})`,
        );
      case "Case":
        return encodeCase(expression, env, mode);
      case "String":
        return idv(tla(`StrLit_${expression.value}`));
      case "Num":
        if (expression.fraction !== "") throw new TlaUnsupportedError("a real number");
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
        throw new TlaUnsupportedError("a temporal formula");
      default:
        throw new TlaUnsupportedError(`the expression ${expression.kind}`);
    }
  };

  // One fact or the goal, after the declarations of the symbols it flattens.
  const getEntries = (line: string): Entry[] => [...flattener.takeIntroduced(), line];

  return {
    encodeIdv,
    encodeBool,
    push,
    getEntries,
    getUniqueName,
    flattened: flattener.flattened,
    anonymous,
    recordFields,
    declared,
  };
};
