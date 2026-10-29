// Ported from tlapm's src/backend/isabelle.ml (BSD licensed, see LICENSE).
// An obligation as the Isabelle/TLA+ theory tlapm writes for Isabelle to prove with a tactic.

import { TlapmBugError, TlaProverError, TlaUnsupportedError } from "../../errors";
import { createContext, getBoundName, popNames, pushName } from "../../obligation-ctx";
import {
  shiftExpr,
  type Bound,
  type Builtin,
  type Expr,
  type Sequent,
} from "../../obligation-expression";
import { pickle } from "../../obligation-pickle";

const cook = (name: string) => `is${pickle(name)}`;

const ATOMS: Partial<Record<Builtin, string>> = {
  TRUE: "TRUE",
  FALSE: "FALSE",
  STRING: "STRING",
  BOOLEAN: "BOOLEAN",
  Nat: "Nat",
  Int: "Int",
  Real: cook("Real"),
  Infinity: cook("Infinity"),
  Any: "Any",
};

const UNARY: Partial<Record<Builtin, string>> = {
  Neg: "~",
  DOMAIN: "DOMAIN",
  SUBSET: "SUBSET",
  UNION: "UNION",
};

const BINARY: Partial<Record<Builtin, string>> = {
  Implies: "\\<Rightarrow>",
  Equiv: "\\<Leftrightarrow>",
  Conj: "\\<and>",
  Disj: "\\<or>",
  Eq: "=",
  Neq: "\\<noteq>",
  Subseteq: "\\<subseteq>",
  Mem: "\\<in>",
  Notmem: "\\<notin>",
  Setminus: "\\\\",
  Cap: "\\<inter>",
  Cup: "\\<union>",
  OneArg: ":>",
  Extend: "@@",
};

const NONFIX: Partial<Record<Builtin, [string, number]>> = {
  Plus: ["addint", 2],
  Minus: ["subint", 2],
  Uminus: ["minus", 1],
  Times: ["mult", 2],
  Ratio: [cook("/"), 2],
  Quotient: [cook("\\div"), 2],
  Remainder: [cook("%"), 2],
  Exp: [cook("^"), 2],
  Lteq: ["leq", 2],
  Lt: ["less", 2],
  Gteq: ["geq", 2],
  Gt: ["greater", 2],
  Range: ["intvl", 2],
  Seq: ["Seq", 1],
  Len: ["Len", 1],
  BSeq: ["BSeq", 1],
  Cat: [cook("\\circ"), 2],
  Append: ["Append", 2],
  Head: ["Head", 1],
  Tail: ["Tail", 1],
  SubSeq: ["SubSeq", 3],
  SelectSeq: ["SelectSeq", 2],
  Print: ["Print", 2],
  PrintT: ["PrintT", 1],
  Assert: ["Assert", 2],
  JavaTime: ["JavaTime", 0],
  TLCGet: ["TLCGet", 1],
  TLCSet: ["TLCSet", 2],
  Permutations: ["Permutations", 1],
  SortSeq: ["SortSeq", 2],
  RandomElement: ["RandomElement", 1],
  ToString: ["ToString", 1],
};

// The temporal operators Isabelle/TLA+ has no counterpart for, by the name tlapm reports.
const TEMPORAL: Partial<Record<Builtin, [string, number]>> = {
  Leadsto: ["Leadsto", 2],
  ENABLED: ["ENABLED", 1],
  Cdot: ["\\cdot", 2],
  Actplus: ["-+->", 2],
  BoxTrue: ["[]", 1],
  BoxFalse: ["[]", 1],
  Diamond: ["<>", 1],
};

// thy_header's tdoms_table: the operators the theory declares, with their arities.
const DECLARED: [string, number][] = [
  ["Real", 0],
  ["/", 2],
  ["\\div", 2],
  ["%", 2],
  ["..", 2],
  ["Infinity", 0],
  ["[]", 1],
  ["<>", 1],
];

const HEADER = [
  "consts",
  ...DECLARED.map(
    ([name, arity]) =>
      `  "${cook(name)}" :: ${arity === 0 ? "c" : `"[${Array(arity).fill("c").join(",")}] => c"`}`,
  ),
  "",
].join("\n");

// tlapm raises Unsupported for what Isabelle/TLA+ can't express, which omits a fact and fails the
// obligation anywhere else.
const unsupported = (message: string): never => {
  throw new TlaUnsupportedError(message);
};

const getSuccessors = (integer: string) => {
  const count = Number.parseInt(integer, 10);
  return `${"succ[".repeat(count)}0${"]".repeat(count)}`;
};

// thy_temp: the theory tlapm writes for Isabelle to prove obligation id, after Backend.Prep has
// shipped it, with the tactic of the method that selects Isabelle.
export const encodeIsabelle = (
  id: number,
  sequent: Sequent,
  tactic: string,
  theoryName: string,
): string => {
  const context = createContext();
  const adjoin = (name: string) => pushName(context, pickle(name));
  const bump = () => pushName(context, "");
  const state = { isAssumed: false };

  // A binder's name binds in what prints inside it.
  const withBound = (name: string, print: (bound: string) => string) => {
    const doc = print(adjoin(name));
    popNames(context, 1);
    return doc;
  };

  // pp_print_expr: every expression, apart from the obligation's sequent, prints in parentheses.
  const printExpr = (expression: Expr) => `(${formatExpr(expression)})`;
  const delimited = (args: Expr[]) => args.map(printExpr).join(", ");
  const nonfix = (name: string, args: Expr[]) => `(${name} (${delimited(args)}))`;

  const printInternal = (builtin: Builtin, args: Expr[]): string => {
    const atom = ATOMS[builtin];
    if (atom !== undefined && args.length === 0) return atom;
    const unary = UNARY[builtin];
    if (unary !== undefined && args.length === 1) return `(${unary} ${printExpr(args[0])})`;
    const binary = BINARY[builtin];
    if (binary !== undefined && args.length === 2)
      return `(${printExpr(args[0])} ${binary} ${printExpr(args[1])})`;
    const operator = NONFIX[builtin];
    if (operator && operator[1] === args.length) return nonfix(operator[0], args);
    if (builtin === "Unprimable" && args.length === 1) return printExpr(args[0]);
    // tlapm prints an irregular expression as the hash of its TLA+ text, but never makes one.
    if (builtin === "Irregular" && args.length === 1) return unsupported("Irregular");
    const isFrontend = builtin === "Prime" || builtin === "StrongPrime" || builtin === "UNCHANGED";
    if (isFrontend && args.length === 1) throw new TlapmBugError();
    const temporal = TEMPORAL[builtin];
    if (temporal && temporal[1] === args.length)
      throw new TlaProverError(`Unsupported operator \`${temporal[0]}\`.\n`);
    throw new TlaProverError("Backend.Isabelle.pp_apply");
  };

  const printApply = (operator: Expr, args: Expr[]): string => {
    switch (operator.kind) {
      case "Ix": {
        const name = getBoundName(context, operator.index);
        if (operator.index <= 0 || name === undefined) throw new TlapmBugError();
        return args.length === 0 ? name : `(${name} (${delimited(args)}))`;
      }
      case "Opaque": {
        const name = pickle(operator.name);
        return args.length === 0 ? `(${name} :: c)` : `(${name} (${delimited(args)}) :: c)`;
      }
      case "Internal":
        return printInternal(operator.builtin, args);
      // tlapm prints a lambda without the arguments it's applied to.
      case "Lambda": {
        const names = operator.params.map((param) => `${adjoin(param.name)} `).join("");
        const doc = `\\<lambda> ${names}. ${printExpr(operator.body)}`;
        popNames(context, operator.params.length);
        return doc;
      }
      default:
        throw new TlapmBugError();
    }
  };

  // The first bound binds around a quantifier over the others, which move under it.
  const printQuant = (quantifier: "Forall" | "Exists", bounds: Bound[], body: Expr): string => {
    const [bound, ...rest] = bounds;
    if (!bound) return formatExpr(body);
    const undittoed =
      rest[0]?.domain.kind === "Ditto"
        ? [{ ...rest[0], domain: bound.domain }, ...rest.slice(1)]
        : rest;
    const inner: Expr =
      undittoed.length === 0
        ? body
        : {
            kind: "Quant",
            quantifier,
            bounds: undittoed.map((other) =>
              other.domain.kind === "Domain"
                ? {
                    ...other,
                    domain: { kind: "Domain", expression: shiftExpr(1, other.domain.expression) },
                  }
                : other,
            ),
            body,
            location: body.location,
          };
    const symbol = quantifier === "Forall" ? "\\<forall>" : "\\<exists>";
    if (bound.domain.kind === "NoDomain")
      return withBound(bound.name, (name) => `${symbol}${name} : ${printExpr(inner)}`);
    if (bound.domain.kind !== "Domain") throw new TlapmBugError();
    const domain = printExpr(bound.domain.expression);
    return withBound(
      bound.name,
      (name) => `${symbol} ${name} \\<in> ${domain} : ${printExpr(inner)}`,
    );
  };

  // pp_print_sequent_inner: a sequent inside an expression, as a meta-level implication.
  const printNestedSequent = (sequent: Sequent): string => {
    const [hyp, ...rest] = sequent.context;
    if (!hyp) return printExpr(sequent.active);
    const printRest = () => printNestedSequent({ context: rest, active: sequent.active });
    switch (hyp.kind) {
      case "Flex":
        return withBound(hyp.name, (name) => `(\\<And> ${name} ${name}'.${printRest()})`);
      case "Fresh": {
        if (hyp.domain && hyp.domainVisibility === "Visible") {
          const domain = printExpr(hyp.domain);
          return withBound(
            hyp.name,
            (name) =>
              `(\\<And> ${name} :: c. ${name} \\<in> ${domain} \\<Longrightarrow> ${printRest()})`,
          );
        }
        const shape = `${"c => ".repeat(hyp.shape)}c`;
        return withBound(hyp.name, (name) => `(\\<And> ${name} :: ${shape}. ${printRest()})`);
      }
      case "Fact": {
        const fact = hyp.visibility === "Visible" ? printExpr(hyp.expression) : undefined;
        bump();
        const doc = fact ? `(${fact} \\<Longrightarrow> ${printRest()})` : printRest();
        popNames(context, 1);
        return doc;
      }
      case "Defn":
        return unsupported("Inner definition");
    }
  };

  const formatExpr = (expression: Expr): string => {
    switch (expression.kind) {
      case "Ix":
      case "Internal":
      case "Opaque":
      case "Lambda":
        return printApply(expression, []);
      case "Apply":
        return printApply(expression.operator, expression.args);
      case "Bang":
        throw new TlaProverError("Backend.Isabelle.module");
      case "Sequent":
        return printNestedSequent(expression.sequent);
      case "With":
      case "Parens":
        return formatExpr(expression.expression);
      case "Let":
        return unsupported("LET");
      case "List":
        if (expression.bullet === "Refs" && expression.items.length === 0) return "TRUE";
        if (expression.bullet === "Refs" && expression.items.length === 1)
          return formatExpr(expression.items[0]);
        return expression.items.map(printExpr).join(expression.bullet === "Or" ? " | " : " & ");
      case "If":
        return `cond(${printExpr(expression.condition)}, ${printExpr(expression.consequent)}, ${printExpr(expression.alternative)})`;
      case "Quant":
        return printQuant(expression.quantifier, expression.bounds, expression.body);
      case "Tquant":
        return unsupported(expression.quantifier === "Forall" ? "\\\\AA" : "\\\\EE");
      case "Choose": {
        const body = expression.body;
        if (!expression.domain)
          return withBound(expression.name, (name) => `Choice(%${name}. ${printExpr(body)})`);
        const domain = printExpr(expression.domain);
        return withBound(
          expression.name,
          (name) => `bChoice(${domain}, %${name}. ${printExpr(body)})`,
        );
      }
      case "SetSt": {
        const body = expression.body;
        const domain = printExpr(expression.domain);
        return withBound(
          expression.name,
          (name) => `subsetOf(${domain}, %${name}. ${printExpr(body)})`,
        );
      }
      case "SetOf": {
        const element = expression.element;
        const [bound] = expression.bounds;
        if (!bound) throw new TlapmBugError();
        if (expression.bounds.length !== 1 || bound.domain.kind !== "Domain")
          return unsupported("SetOf (multiple declared constants)");
        const domain = printExpr(bound.domain.expression);
        return withBound(
          bound.name,
          (name) => `setOfAll(${domain}, %${name}. ${printExpr(element)})`,
        );
      }
      case "SetEnum":
        return `{${delimited(expression.elements)}}`;
      case "Fcn": {
        const body = expression.body;
        const [bound] = expression.bounds;
        if (!bound || expression.bounds.length !== 1)
          return unsupported("function (multiple declared constants)");
        if (bound.domain.kind === "Ditto") throw new TlapmBugError();
        const domain =
          bound.domain.kind === "Domain" ? printExpr(bound.domain.expression) : undefined;
        return withBound(bound.name, (name) => {
          const printed = domain === undefined ? name : ` ${name} \\<in> ${domain} `;
          return `[${printed} \\<mapsto> ${printExpr(body)}]`;
        });
      }
      case "FcnApp": {
        const fcn = printExpr(expression.function);
        return expression.args.length === 1
          ? `fapply (${fcn}, ${printExpr(expression.args[0])})`
          : `fapply (${fcn}, <<${delimited(expression.args)}>>)`;
      }
      case "Arrow":
        return `[${printExpr(expression.domain)} \\<rightarrow> ${printExpr(expression.range)}]`;
      case "Rect":
        return `[${expression.fields.map((field) => `''${field.name}'' : ${printExpr(field.value)}`).join(", ")}]`;
      case "Record":
        return `(${expression.fields.map((field) => `(''${field.name}'' :> ${printExpr(field.value)})`).join(" @@ ")})`;
      case "Except": {
        const specs = expression.specs.map((spec) => {
          const trail = spec.trail
            .map((point) =>
              point.kind === "Dot" ? `[''${point.field}'']` : `[${printExpr(point.expression)}]`,
            )
            .join("");
          return `!${trail} = ${printExpr(spec.value)}`;
        });
        return `[${printExpr(expression.function)} EXCEPT ${specs.join(", ")}]`;
      }
      case "Dot":
        return `fapply (${printExpr(expression.expression)}, (''${expression.field}''))`;
      case "Tuple":
        return `<<${delimited(expression.elements)}>>`;
      case "Product":
        return expression.factors.length === 2
          ? `(${printExpr(expression.factors[0])} \\<times> ${printExpr(expression.factors[1])})`
          : `Product(\\<langle>${delimited(expression.factors)}\\<rangle>)`;
      case "Sub":
      case "Tsub": {
        const suffix = expression.kind === "Sub" ? "sub" : "tsub";
        const name = expression.modal === "Box" ? cook(`a'box'${suffix}`) : `a'dia'${suffix}`;
        return `${name}(${printExpr(expression.action)},${printExpr(expression.subscript)})`;
      }
      case "Fair":
        return `${cook(expression.fairness === "Weak" ? "a'wf" : "a'sf")}(${printExpr(expression.subscript)},${printExpr(expression.action)})`;
      case "Case": {
        const conditions = delimited(expression.arms.map((arm) => arm.condition));
        const bodies = delimited(expression.arms.map((arm) => arm.body));
        return expression.other
          ? `CaseOther(<<${conditions}>>,<<${bodies}>>,${printExpr(expression.other)})`
          : `Case(<<${conditions}>>,<<${bodies}>>)`;
      }
      case "String":
        return `''${expression.value}''`;
      case "Num":
        if (expression.fraction !== "") return unsupported("real constants");
        return `(${getSuccessors(expression.integer)})`;
      case "At":
        throw new TlapmBugError();
    }
  };

  // tlapm prints a fact to a formatter that drops its output first, to omit an unsupported one.
  const getFact = (expression: Expr) => {
    const depth = context.stack.length;
    try {
      return printExpr(expression);
    } catch (error) {
      if (!(error instanceof TlaUnsupportedError)) throw error;
      popNames(context, context.stack.length - depth);
      return error;
    }
  };

  // pp_print_sequent_outer: the obligation's sequent as the fixes, assumes and shows of a lemma. A
  // pragma's definition ends it, without the goal.
  const printLemma = (sequent: Sequent) => {
    const lines: string[] = [];
    for (const hyp of sequent.context) {
      switch (hyp.kind) {
        case "Flex": {
          const name = adjoin(hyp.name);
          lines.push(`fixes ${name} ${name}'`);
          break;
        }
        case "Fresh": {
          const domain =
            hyp.domain && hyp.domainVisibility === "Visible" ? printExpr(hyp.domain) : undefined;
          const name = adjoin(hyp.name);
          lines.push(`fixes ${name}`);
          if (domain === undefined) break;
          state.isAssumed = true;
          lines.push(`assumes ${name}_in : "(${name} \\<in> ${domain})"`);
          break;
        }
        case "Fact": {
          const count = context.stack.length;
          const fact = hyp.visibility === "Visible" ? getFact(hyp.expression) : undefined;
          bump();
          if (fact instanceof TlaUnsupportedError) {
            lines.push(`(* omitted temporal assumption : ${fact.message} *)`);
            break;
          }
          if (fact === undefined) break;
          state.isAssumed = true;
          lines.push(`assumes v'${count}: "${fact}"`);
          break;
        }
        case "Defn":
          if (hyp.definition.kind === "Bpragma") return lines.map((line) => `${line}\n`).join("");
          lines.push(`(* usable definition ${hyp.definition.name} suppressed *)`);
          adjoin(hyp.definition.name);
          break;
      }
    }
    return [...lines, `shows "${printExpr(sequent.active)}"`].join("\n");
  };

  const lemma = (() => {
    try {
      return printLemma(sequent);
    } catch (error) {
      if (!(error instanceof TlaUnsupportedError)) throw error;
      throw new TlaProverError(`isabelle : unsupported operator ${error.message}`);
    }
  })();
  return [
    "(* automatically generated -- do not edit manually *)",
    `theory ${theoryName} imports Constant Zenon begin`,
    HEADER,
    `lemma ob'${id}:`,
    `${lemma}(is "PROP ?ob'${id}")`,
    "proof -",
    `show "PROP ?ob'${id}"`,
    `${state.isAssumed ? "using assms " : ""}by ${tactic}`,
    "qed",
    "end",
    "",
  ].join("\n");
};
