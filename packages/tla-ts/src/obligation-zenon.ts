// A port of tlapm's Backend.Zenon: an obligation as the input of Zenon's TLA+ front end, a $hyp for
// each visible fact and a $goal, naming identifiers as Isabelle does. Before printing, the
// obligation goes through what Backend.Prep does to every obligation it ships to Zenon.

import { TlapmBugError, TlaProverError, TlaUnsupportedError } from "./errors";
import { createContext, getBoundName, popNames, pushName } from "./obligation-ctx";
import { normalizeSequent } from "./obligation-elab";
import {
  shiftExpr,
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Sequent,
} from "./obligation-expression";
import { format, formatDelimited, renderDoc, text, type Doc } from "./obligation-format";
import { processObligation } from "./obligation-frontend";
import { pickle } from "./obligation-pickle";
import { expandDefs, expandEnabledCdot, flatten, getFrontends } from "./obligation-prep";

const SPACE = format("@ ");

const ATOMS: Partial<Record<Builtin, string>> = {
  TRUE: "T.",
  FALSE: "F.",
  STRING: "TLA.STRING",
  BOOLEAN: "(TLA.set T. F.)",
  Nat: "arith.N",
  Int: "arith.Z",
  Real: "arith.R",
  Infinity: "arith.Infinity",
  Any: "TLA.Any",
};

const OPERATORS: Partial<Record<Builtin, [string, number]>> = {
  Implies: ["=>", 2],
  Equiv: ["<=>", 2],
  Conj: ["/\\", 2],
  Disj: ["\\/", 2],
  Neg: ["-.", 1],
  Eq: ["=", 2],
  DOMAIN: ["TLA.DOMAIN", 1],
  SUBSET: ["TLA.SUBSET", 1],
  UNION: ["TLA.UNION", 1],
  Subseteq: ["TLA.subseteq", 2],
  Mem: ["TLA.in", 2],
  Setminus: ["TLA.setminus", 2],
  Cap: ["TLA.cap", 2],
  Cup: ["TLA.cup", 2],
  Plus: ["arith.add", 2],
  Uminus: ["arith.minus", 1],
  Times: ["arith.mul", 2],
  Ratio: ["arith.div", 2],
  Quotient: ["arith.euclidiv", 2],
  Remainder: ["arith.mod", 2],
  Exp: ["arith.power", 2],
  Lteq: ["arith.le", 2],
  Lt: ["arith.lt", 2],
  Range: ["arith.intrange", 2],
  Seq: ["TLA.Seq", 1],
  Len: ["TLA.Len", 1],
  BSeq: ["TLA.BSeq", 1],
  Cat: ["TLA.concat", 2],
  Append: ["TLA.Append", 2],
  Head: ["TLA.Head", 1],
  Tail: ["TLA.Tail", 1],
  SubSeq: ["TLA.SubSeq", 3],
  SelectSeq: ["TLA.SelectSeq", 2],
  OneArg: ["TLA.oneArg", 2],
  Extend: ["TLA.extend", 2],
  Print: ["TLA.Print", 2],
  PrintT: ["TLA.PrintT", 1],
  Assert: ["TLA.Assert", 2],
  JavaTime: ["TLA.JavaTime", 0],
  TLCGet: ["TLA.TLCGet", 1],
  TLCSet: ["TLA.TLCSet", 2],
  Permutations: ["TLA.Permutations", 1],
  SortSeq: ["TLA.SortSeq", 2],
  RandomElement: ["TLA.RandomElement", 1],
  ToString: ["TLA.ToString", 1],
};

// The temporal operators Zenon has no counterpart for, by the name tlapm reports.
const TEMPORAL_OPERATORS: Partial<Record<Builtin, [string, number]>> = {
  Leadsto: ["Leadsto", 2],
  ENABLED: ["ENABLED", 1],
  Cdot: ["\\cdot", 2],
  Actplus: ["-+->", 2],
  BoxTrue: ["[]", 1],
  BoxFalse: ["[]", 1],
  Diamond: ["<>", 1],
};

const unsupported = (message: string): never => {
  throw new TlaUnsupportedError(message);
};

const getSuccessors = (integer: string) => {
  const count = Number.parseInt(integer, 10);
  return `${"(TLA.fapply TLA.Succ ".repeat(count)}0${")".repeat(count)}`;
};

// pp_print_obligation, where Unsupported in the goal fails the obligation and in a fact omits it.
const printObligation = (id: number, sequent: Sequent) => {
  const context = createContext();
  const adjoin = (name: string) => pushName(context, pickle(name));
  const bump = () => pushName(context, "");

  const delimited = (args: Expr[]) => formatDelimited(args, printExpr, SPACE);
  const nonatomic = (name: string, args: Expr[]) => format("(%s %a)", name, delimited(args));

  // A binder's name binds in the body, and what comes before prints outside it.
  const printBinder = (name: string, before: Doc, body: Expr, after: string) => {
    const bound = adjoin(name);
    const doc = format("%a((%s) %a)%s", before, bound, printExpr(body), after);
    popNames(context, 1);
    return doc;
  };

  const printInternal = (builtin: Builtin, args: Expr[]): Doc => {
    const atom = ATOMS[builtin];
    if (atom !== undefined && args.length === 0) return text(atom);
    const operator = OPERATORS[builtin];
    if (operator && operator[1] === args.length) return nonatomic(operator[0], args);
    const [first, second] = args;
    if (args.length === 2) {
      switch (builtin) {
        case "Neq":
          return format("(-. %a)", nonatomic("=", args));
        case "Notmem":
          return format("(-. %a)", nonatomic("TLA.in", args));
        case "Minus":
          return nonatomic("arith.add", [
            first,
            {
              kind: "Apply",
              operator: { kind: "Internal", builtin: "Uminus", location: second.location },
              args: [second],
              location: second.location,
            },
          ]);
        case "Gteq":
          return nonatomic("arith.le", [second, first]);
        case "Gt":
          return nonatomic("arith.lt", [second, first]);
      }
    }
    if (builtin === "Unprimable" && args.length === 1) return printExpr(first);
    const isFrontend = builtin === "Prime" || builtin === "StrongPrime" || builtin === "UNCHANGED";
    if (isFrontend && args.length === 1) throw new TlapmBugError();
    const temporal = TEMPORAL_OPERATORS[builtin];
    if (temporal && temporal[1] === args.length) {
      throw new TlaProverError(`Unsupported operator \`${temporal[0]}\`.\n`);
    }
    throw new TlaProverError("Backend.Zenon.fmt_apply");
  };

  const printApply = (operator: Expr, args: Expr[]): Doc => {
    switch (operator.kind) {
      case "Ix": {
        const name = getBoundName(context, operator.index);
        if (operator.index <= 0 || name === undefined) throw new TlapmBugError();
        return args.length === 0 ? text(name) : nonatomic(name, args);
      }
      case "Opaque": {
        const name = pickle(operator.name);
        return args.length === 0 ? text(name) : nonatomic(name, args);
      }
      case "Internal":
        return printInternal(operator.builtin, args);
      case "Lambda": {
        const names = operator.params.map((param) => format("%s ", adjoin(param.name)));
        const doc = format("((%a) %a)", names, printExpr(operator.body));
        popNames(context, operator.params.length);
        return doc;
      }
      default:
        throw new TlapmBugError();
    }
  };

  // The first bound binds around a quantifier over the others, which move under it.
  const printQuant = (quantifier: "Forall" | "Exists", bounds: Bound[], body: Expr): Doc => {
    const [bound, ...rest] = bounds;
    if (!bound) return printExpr(body);
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
    const isForall = quantifier === "Forall";
    if (bound.domain.kind === "NoDomain") {
      return printBinder(bound.name, text(isForall ? "(A. " : "(E. "), inner, ")");
    }
    if (bound.domain.kind !== "Domain") throw new TlapmBugError();
    const domain = printExpr(bound.domain.expression);
    return printBinder(
      bound.name,
      format("(%s %a ", isForall ? "TLA.bAll" : "TLA.bEx", domain),
      inner,
      ")",
    );
  };

  // SetOf and Fcn take one bound, whose domain prints outside it.
  const printOneBound = (name: string, bounds: Bound[], body: Expr, what: string) => {
    if (bounds.length !== 1) return unsupported(`${what} (multiple declared constants)`);
    const bound = bounds[0];
    if (bound.domain.kind !== "Domain") throw new TlapmBugError();
    return printBinder(
      bound.name,
      format("(%s %a ", name, printExpr(bound.domain.expression)),
      body,
      ")",
    );
  };

  // A sequent inside an expression, as an implication under quantifiers.
  const printNestedSequent = (sequent: Sequent): Doc => {
    const [hyp, ...rest] = sequent.context;
    if (!hyp) return printExpr(sequent.active);
    const printRest = () => printNestedSequent({ context: rest, active: sequent.active });
    if (hyp.kind === "Fact") {
      const fact = hyp.visibility === "Visible" ? printExpr(hyp.expression) : undefined;
      bump();
      const doc = fact ? format("(=> %a %a)", fact, printRest()) : printRest();
      popNames(context, 1);
      return doc;
    }
    if (hyp.kind === "Defn") throw new TlapmBugError();
    const domain =
      hyp.kind === "Fresh" && hyp.domain && hyp.domainVisibility === "Visible"
        ? printExpr(hyp.domain)
        : undefined;
    const name = adjoin(hyp.name);
    const doc =
      hyp.kind === "Flex"
        ? format("(A. ((%s) (A. ((%s') %a))))", name, name, printRest())
        : domain
          ? format("(TLA.bAll %a ((%s) %a))", domain, name, printRest())
          : format("(A. ((%s) %a))", name, printRest());
    popNames(context, 1);
    return doc;
  };

  const printExpr = (expression: Expr): Doc => {
    switch (expression.kind) {
      case "Ix":
      case "Internal":
      case "Opaque":
      case "Lambda":
        return printApply(expression, []);
      case "Apply":
        return printApply(expression.operator, expression.args);
      case "Sequent":
        return printNestedSequent(expression.sequent);
      case "With":
      case "Parens":
        return printExpr(expression.expression);
      case "If":
        return format(
          "(TLA.cond %a %a %a)",
          printExpr(expression.condition),
          printExpr(expression.consequent),
          printExpr(expression.alternative),
        );
      case "List":
        if (expression.bullet === "Refs" && expression.items.length === 0)
          throw new TlapmBugError();
        if (expression.bullet === "Refs" && expression.items.length === 1) {
          return printExpr(expression.items[0]);
        }
        return format(
          "(%s %a)",
          expression.bullet === "Or" ? "\\/" : "/\\",
          delimited(expression.items),
        );
      case "Quant":
        return printQuant(expression.quantifier, expression.bounds, expression.body);
      case "Tquant":
        return unsupported("\\AA or \\EE");
      case "Choose":
        return expression.domain
          ? printBinder(
              expression.name,
              format("(TLA.bChoice %a ", printExpr(expression.domain)),
              expression.body,
              ")",
            )
          : printBinder(expression.name, text("(t. "), expression.body, ")");
      case "SetSt":
        return printBinder(
          expression.name,
          format("(TLA.subsetOf %a ", printExpr(expression.domain)),
          expression.body,
          ")",
        );
      case "SetOf":
        return printOneBound("TLA.setOfAll", expression.bounds, expression.element, "Setof");
      case "Fcn":
        return printOneBound("TLA.Fcn", expression.bounds, expression.body, "Fcn");
      case "SetEnum":
        if (expression.elements.length === 0) return text("TLA.emptyset");
        return [
          text("(TLA.set"),
          expression.elements.map((element) => format(" %a", printExpr(element))),
          text(")"),
        ];
      case "FcnApp": {
        const fcn = printExpr(expression.function);
        return expression.args.length === 1
          ? format("(TLA.fapply %a %a)", fcn, printExpr(expression.args[0]))
          : format("(TLA.fapply %a (TLA.tuple %a))", fcn, delimited(expression.args));
      }
      case "Arrow":
        return format(
          "(TLA.FuncSet %a %a)",
          printExpr(expression.domain),
          printExpr(expression.range),
        );
      case "Rect":
      case "Record":
        return [
          text(expression.kind === "Rect" ? "(TLA.recordset" : "(TLA.record"),
          expression.fields.map((field) => format(' "%s" %a', field.name, printExpr(field.value))),
          text(")"),
        ];
      case "Except": {
        const spec = expression.specs[0];
        if (expression.specs.length !== 1 || spec.trail.length !== 1)
          return unsupported("complex EXCEPT");
        const point = spec.trail[0];
        const argument =
          point.kind === "Dot" ? text(`"${point.field}"`) : printExpr(point.expression);
        return format(
          "(TLA.except %a %a %a)",
          printExpr(expression.function),
          argument,
          printExpr(spec.value),
        );
      }
      case "Dot":
        return format('(TLA.fapply %a "%s")', printExpr(expression.expression), expression.field);
      case "Tuple":
        return format("(TLA.tuple %a)", delimited(expression.elements));
      case "Product":
        return expression.factors.length === 2
          ? format(
              "(TLA.prod %a %a)",
              printExpr(expression.factors[0]),
              printExpr(expression.factors[1]),
            )
          : format("(TLA.Product (TLA.tuple %a))", delimited(expression.factors));
      case "Sub":
      case "Tsub":
      case "Fair":
        return unsupported(expression.kind);
      case "Case": {
        const arms = formatDelimited(
          expression.arms,
          (arm) => format("%a %a", printExpr(arm.condition), printExpr(arm.body)),
          SPACE,
        );
        return expression.other
          ? format("(TLA.CASE %a %a)@]", arms, printExpr(expression.other))
          : format("(TLA.CASE %a )", arms);
      }
      case "String":
        return format('"%s"', expression.value);
      case "Num":
        if (expression.fraction !== "") return unsupported("Real number constants");
        return text(getSuccessors(expression.integer));
      case "Bang":
      case "Let":
      case "At":
        throw new TlapmBugError();
    }
  };

  // tlapm prints a fact to a formatter that drops its output first, to omit an unsupported one.
  const getFactDoc = (expression: Expr) => {
    const depth = context.stack.length;
    try {
      return printExpr(expression);
    } catch (error) {
      if (!(error instanceof TlaUnsupportedError)) throw error;
      popNames(context, context.stack.length - depth);
      return error;
    }
  };

  const printHyp = (hyp: Hyp): Doc => {
    switch (hyp.kind) {
      case "Fresh": {
        const domain =
          hyp.domain && hyp.domainVisibility === "Visible" ? printExpr(hyp.domain) : undefined;
        const name = adjoin(hyp.name);
        return domain ? format('$hyp "%s_in" (TLA.in %s %a)@\n', name, name, domain) : [];
      }
      case "Flex":
        adjoin(hyp.name);
        return [];
      case "Defn": {
        const name = adjoin(hyp.definition.name);
        return hyp.visibility === "Visible"
          ? format("; usable definition %s suppressed@.", name)
          : [];
      }
      case "Fact": {
        const count = String(context.stack.length);
        const fact = hyp.visibility === "Visible" ? getFactDoc(hyp.expression) : undefined;
        bump();
        if (fact instanceof TlaUnsupportedError) {
          return format("; omitted temporal assumption : %s @.", fact.message);
        }
        return fact ? format('$hyp "v\'%s" %a@\n', count, fact) : [];
      }
    }
  };

  const doc = (() => {
    try {
      return [sequent.context.map(printHyp), format("$goal %a", printExpr(sequent.active))];
    } catch (error) {
      if (!(error instanceof TlaUnsupportedError)) throw error;
      throw new TlaProverError(`Zenon: unsupported operator ${error.message}`);
    }
  })();
  return renderDoc([format(";; obligation #%s@\n", String(id)), doc]);
};

interface ZenonObligation {
  id: number;
  sequent: Sequent;
}

// The text tlapm writes to the .znn file it hands Zenon: the obligation with its definitions
// expanded, normalized, through the frontends its BY cites and the action frontend, and flattened.
export const encodeZenon = (obligation: ZenonObligation) => {
  const normalized = normalizeSequent(expandDefs(obligation.sequent));
  const expanded = expandEnabledCdot(normalized, getFrontends(obligation.sequent));
  return printObligation(obligation.id, flatten(processObligation(expanded)));
};
