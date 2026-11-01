// A port of tlapm's Backend.Fingerprints.fp_sequent: the digest of an obligation that names its
// hypotheses and bound variables by the order of their first use, so two obligations that differ
// only in names share it.

import { TlapmBugError } from "../../errors";
import {
  adjoin,
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Scope,
  type Sequent,
} from "../../obligations/expression";
import { isConstant } from "../../obligations/temporal";
import { getMd5 } from "./md5";

// builtin_to_int, whose numbers skip [], which fp_bin prints by name.
const BUILTIN_NUMBERS: Builtin[] = [
  "TRUE",
  "FALSE",
  "Implies",
  "Equiv",
  "Conj",
  "Disj",
  "Neg",
  "Eq",
  "Neq",
  "STRING",
  "BOOLEAN",
  "SUBSET",
  "UNION",
  "DOMAIN",
  "Subseteq",
  "Mem",
  "Notmem",
  "Setminus",
  "Cap",
  "Cup",
  "Prime",
  "StrongPrime",
  "Leadsto",
  "ENABLED",
  "UNCHANGED",
  "Cdot",
  "Actplus",
  "Diamond",
  "Nat",
  "Int",
  "Real",
  "Plus",
  "Minus",
  "Uminus",
  "Times",
  "Ratio",
  "Quotient",
  "Remainder",
  "Exp",
  "Infinity",
  "Lteq",
  "Lt",
  "Gteq",
  "Gt",
  "Divides",
  "Range",
  "Seq",
  "Len",
  "BSeq",
  "Cat",
  "Append",
  "Head",
  "Tail",
  "SubSeq",
  "SelectSeq",
  "OneArg",
  "Extend",
  "Print",
  "PrintT",
  "Assert",
  "JavaTime",
  "TLCGet",
  "TLCSet",
  "Permutations",
  "SortSeq",
  "RandomElement",
  "Any",
  "ToString",
  "Unprimable",
  "Irregular",
];

const BULLETS = { And: 0, Or: 1, Refs: 2 };

const QUANTIFIERS = { Forall: 0, Exists: 1 };

const MODALS = { Box: 0, Dia: 1 };

const FAIRNESS = { Weak: 0, Strong: 1 };

// What a stack entry stands for: a hypothesis not yet used, under the label its first use prints,
// one used, numbered, a bound variable not yet used, one used, a pragma, or a hidden fact.
type Ident =
  | { kind: "Hyp"; label: string }
  | { kind: "HypIndex"; index: number }
  | { kind: "Var" }
  | { kind: "VarIndex"; index: number }
  | { kind: "Pragma" }
  | { kind: "None" };

interface Entry {
  ident: Ident;
  isUsed: boolean;
}

interface Counters {
  hyp: number;
  variable: number;
}

const OCAML_ESCAPES: Record<number, string> = {
  0x22: '\\"',
  0x5c: "\\\\",
  0x0a: "\\n",
  0x09: "\\t",
  0x0d: "\\r",
  0x08: "\\b",
};

// OCaml's %S: a string literal, with each byte outside printable ASCII as a decimal escape.
const quoteString = (value: string) =>
  `"${[...new TextEncoder().encode(value)]
    .map(
      (byte) =>
        OCAML_ESCAPES[byte] ??
        (byte < 0x20 || byte > 0x7e
          ? `\\${String(byte).padStart(3, "0")}`
          : String.fromCharCode(byte)),
    )
    .join("")}"`;

const getBuiltin = (builtin: Builtin) => {
  if (builtin === "BoxTrue") return "$Box";
  if (builtin === "BoxFalse") return "$FakeBox";
  return `$${BUILTIN_NUMBERS.indexOf(builtin)}`;
};

const getFreshLabel = (hyp: Extract<Hyp, { kind: "Fresh" }>) =>
  hyp.level === "Unknown" ? "Unknown" : hyp.level.toUpperCase();

// fp_sequent's text for an obligation, before its digest.
const getFingerprintText = (sequent: Sequent) => {
  const stack: Entry[] = [];
  const get = (index: number) => {
    const entry = stack[stack.length - index];
    if (!entry) throw new TlapmBugError();
    return entry;
  };
  const push = (ident: Ident) => stack.push({ ident, isUsed: false });
  const pop = () => {
    const entry = stack.pop();
    if (!entry) throw new TlapmBugError();
    return entry;
  };
  const pushVariables = (count: number) =>
    Array.from({ length: count }).forEach(() => push({ kind: "Var" }));
  // Stack.popn: the entries from the top down.
  const popVariables = (count: number) => Array.from({ length: count }, pop);
  const getVariableNumber = (entry: Entry) => {
    if (entry.ident.kind === "VarIndex") return entry.ident.index;
    if (entry.ident.kind === "Var") return 0;
    throw new TlapmBugError();
  };
  const getHypNumber = (entry: Entry) => {
    if (entry.ident.kind !== "HypIndex") throw new TlapmBugError();
    return entry.ident.index;
  };

  const printExpr = (counters: Counters, expression: Expr): string => {
    const print = (inner: Expr) => printExpr(counters, inner);
    const printList = (items: Expr[]) => items.map(print).join(",");
    // fp_bounds pairs each bound with an entry, and prints those with a domain.
    const printBounds = (entries: Entry[], bounds: Bound[]) =>
      bounds
        .map((bound, index) =>
          bound.domain.kind === "Domain"
            ? `${getVariableNumber(entries[index])}:${print(bound.domain.expression)},`
            : "",
        )
        .join("");
    // A binder's body comes first, then what pops off the stack after it.
    const printBound = (count: number, body: Expr) => {
      pushVariables(count);
      const text = print(body);
      return { text, entries: popVariables(count) };
    };
    const printNumbers = (entries: Entry[]) =>
      entries.map((entry) => `${getVariableNumber(entry)}.`).join("");
    switch (expression.kind) {
      case "Ix": {
        const entry = get(expression.index);
        entry.isUsed = true;
        const ident = entry.ident;
        switch (ident.kind) {
          case "None":
            return `$V(${expression.index}SHOULD_NOT_APPEAR)`;
          case "Hyp": {
            const index = counters.hyp++;
            entry.ident = { kind: "HypIndex", index };
            return `$${ident.label}(${index})`;
          }
          case "Var": {
            const index = counters.variable++;
            entry.ident = { kind: "VarIndex", index };
            return `$PRM(${index})`;
          }
          case "HypIndex":
            return `$HYP(${ident.index})`;
          case "VarIndex":
            return `$PRM(${ident.index})`;
          case "Pragma":
            return "";
        }
        throw new TlapmBugError();
      }
      case "Opaque":
        return expression.name;
      case "Internal":
        return getBuiltin(expression.builtin);
      case "Lambda": {
        const bound = printBound(expression.params.length, expression.body);
        return `$Lam(${printNumbers(bound.entries.toReversed())}${bound.text})`;
      }
      case "Sequent":
        return printSequent(expression.sequent);
      case "Apply": {
        const operator = expression.operator;
        if (operator.kind === "Ix" && get(operator.index).ident.kind === "Pragma") return "";
        return `$OpApp(${print(operator)};${printList(expression.args)})`;
      }
      case "With":
      case "Parens":
        return print(expression.expression);
      case "If":
        return `$If(${print(expression.condition)},${print(expression.consequent)},${print(expression.alternative)})`;
      case "List":
        return `$List(${BULLETS[expression.bullet]};${printList(expression.items)})`;
      case "Let": {
        const definitions = expression.definitions.map((definition) => {
          if (definition.kind !== "Operator" && definition.kind !== "Bpragma")
            throw new TlapmBugError();
          const text = `${print(definition.body)}.`;
          push({ kind: "Var" });
          return text;
        });
        const body = print(expression.body);
        popVariables(definitions.length);
        return `${definitions.join("")}${body}`;
      }
      // fp_expr pairs a quantifier's bounds with its variables from the last one down.
      case "Quant": {
        const bound = printBound(expression.bounds.length, expression.body);
        return `$Quant(${QUANTIFIERS[expression.quantifier]};${printBounds(bound.entries, expression.bounds)}.${bound.text})`;
      }
      case "Tquant": {
        const bound = printBound(expression.names.length, expression.body);
        return `$Tquant(${QUANTIFIERS[expression.quantifier]}${printNumbers(bound.entries.toReversed())}${bound.text})`;
      }
      case "Choose": {
        const bound = printBound(1, expression.body);
        const number = getVariableNumber(bound.entries[0]);
        return expression.domain
          ? `$Bch(${number}:${print(expression.domain)};${bound.text})`
          : `$Ch(${number}:${bound.text})`;
      }
      case "SetSt": {
        const bound = printBound(1, expression.body);
        return `$SSt(${getVariableNumber(bound.entries[0])}:${print(expression.domain)};${bound.text})`;
      }
      case "SetOf": {
        const bound = printBound(expression.bounds.length, expression.element);
        return `$Sof(${printBounds(bound.entries.toReversed(), expression.bounds)}.${bound.text})`;
      }
      case "Fcn": {
        const bound = printBound(expression.bounds.length, expression.body);
        return `$Fcn(${printBounds(bound.entries.toReversed(), expression.bounds)}.${bound.text})`;
      }
      case "SetEnum":
        return `$Set(${printList(expression.elements)})`;
      case "Tuple":
        return `$Tup(${printList(expression.elements)})`;
      case "Product":
        return `$Prod(${printList(expression.factors)})`;
      case "FcnApp":
        return `$FcnApp(${print(expression.function)};${printList(expression.args)})`;
      case "Arrow":
        return `$Arrow(${print(expression.domain)},${print(expression.range)})`;
      case "Rect":
      case "Record":
        return `$${expression.kind}(${expression.fields.map((field) => `(${field.name},${print(field.value)})`).join(",")})`;
      case "Except": {
        const base = print(expression.function);
        const specs = expression.specs.map((spec) => {
          const trail = spec.trail
            .map((point) =>
              point.kind === "Dot" ? `.${point.field}` : `.${print(point.expression)}`,
            )
            .join("");
          return `(${trail}=${print(spec.value)})`;
        });
        return `$Except(${base},${specs.join(",")})`;
      }
      case "Dot":
        return `$Dot(${print(expression.expression)},${expression.field})`;
      case "Sub":
      case "Tsub":
        return `$${expression.kind}(${MODALS[expression.modal]},${print(expression.action)},${print(expression.subscript)})`;
      case "Fair":
        return `$Fair(${FAIRNESS[expression.fairness]},${print(expression.subscript)},${print(expression.action)})`;
      case "Case": {
        const arms = expression.arms
          .map((arm) => `(${print(arm.condition)},${print(arm.body)})`)
          .join(",");
        return `$Case(${arms},${expression.other ? print(expression.other) : ""})`;
      }
      case "String":
        return quoteString(expression.value);
      case "Num":
        return `$Num(${expression.integer},${expression.fraction})`;
      case "At":
        return "$At";
      case "Bang":
        throw new TlapmBugError();
    }
  };

  // Each hypothesis prints after the goal and the hypotheses after it, once their uses have
  // numbered it.
  const printSequent = (inner: Sequent): string => {
    const counters = { hyp: 1, variable: 1 };
    const spin = (index: number, scope: Scope | undefined): string => {
      const hyp = inner.context[index];
      if (!hyp) return `$Goal(${printExpr(counters, inner.active)})`;
      const getRest = (ident: Ident) => {
        push(ident);
        const rest = spin(index + 1, adjoin(scope, hyp));
        return { rest, entry: pop() };
      };
      switch (hyp.kind) {
        case "Fresh": {
          if (!hyp.domain) {
            const label = getFreshLabel(hyp);
            const after = getRest({ kind: "Hyp", label });
            return after.entry.isUsed ? `${after.rest}${label}${hyp.name}` : after.rest;
          }
          const after = getRest({ kind: "Hyp", label: "CON" });
          if (hyp.domainVisibility === "Hidden") return after.rest;
          const number = after.entry.isUsed ? String(getHypNumber(after.entry)) : "_";
          return `${after.rest}$Dom(${number};${printExpr(counters, hyp.domain)})`;
        }
        case "Flex":
          return getRest({ kind: "Hyp", label: "VAR" }).rest;
        case "Defn": {
          const definition = hyp.definition;
          if (definition.kind === "Recursive") return getRest({ kind: "Hyp", label: "CON" }).rest;
          if (definition.kind === "Bpragma") return getRest({ kind: "Pragma" }).rest;
          if (definition.kind === "Instance") throw new TlapmBugError();
          const after = getRest({ kind: "Hyp", label: "HYP" });
          if (!after.entry.isUsed) return after.rest;
          const number = getHypNumber(after.entry);
          return hyp.visibility === "Hidden"
            ? `${after.rest}$Def(${number},${isConstant(scope, definition.body) ? 0 : 3})`
            : `${after.rest}$Def(${number};${printExpr(counters, definition.body)})`;
        }
        case "Fact": {
          if (hyp.visibility === "Hidden") return getRest({ kind: "None" }).rest;
          const after = getRest({ kind: "Hyp", label: "HYP" });
          return `${after.rest}$Fact(${printExpr(counters, hyp.expression)},${hyp.time.toLowerCase()})`;
        }
      }
    };
    return spin(0, undefined);
  };

  return printSequent(sequent);
};

// fingerprint: the hex digest of an obligation's fp_sequent text.
export const getFingerprint = (sequent: Sequent) => getMd5(getFingerprintText(sequent));
