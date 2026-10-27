// A port of tlapm's obligation printer: E_fmt with Fmtutil's minimal parenthesization, the
// operator table in Optable, and the identifier renaming in Ctx.

import { TlaProofError } from "./errors";
import {
  getHypName,
  type Bound,
  type Builtin,
  type Defn,
  type Expr,
  type Hyp,
  type Param,
  type Selector,
  type Sequent,
  type Shape,
} from "./obligation-expression";
import { format, formatDelimited, renderDoc, text, type Doc } from "./obligation-format";

export type Fixity = "Nonfix" | "Prefix" | "Postfix" | "InfixLeft" | "InfixNon" | "InfixRight";

interface Operator {
  name: string;
  low: number;
  high: number;
  fixity: Fixity;
}

const OPERATORS: [string, number, number, Fixity, string[]][] = [
  ["=>", 1, 1, "InfixNon", []],
  ["<=>", 2, 2, "InfixNon", ["\\equiv"]],
  ["/\\", 3, 3, "InfixLeft", ["\\land"]],
  ["\\/", 3, 3, "InfixLeft", ["\\lor"]],
  ["~", 4, 4, "Prefix", ["\\neg", "\\lnot"]],
  ["=", 5, 5, "InfixNon", []],
  ["#", 5, 5, "InfixNon", ["/="]],
  ["SUBSET", 8, 8, "Prefix", []],
  ["UNION", 8, 8, "Prefix", []],
  ["DOMAIN", 9, 9, "Prefix", []],
  ["\\subseteq", 5, 5, "InfixNon", []],
  ["\\in", 5, 5, "InfixNon", []],
  ["\\notin", 5, 5, "InfixNon", []],
  ["\\", 8, 8, "InfixNon", []],
  ["\\cap", 8, 8, "InfixLeft", ["\\intersect"]],
  ["\\cup", 8, 8, "InfixLeft", ["\\union"]],
  ["\\X", 10, 13, "Prefix", ["\\times"]],
  ["'", 15, 15, "Postfix", []],
  ["~>", 2, 2, "InfixNon", ["\\leadsto"]],
  ["ENABLED", 4, 15, "Prefix", []],
  ["UNCHANGED", 4, 15, "Prefix", []],
  ["\\cdot", 5, 14, "InfixLeft", []],
  ["-+->", 2, 2, "InfixNon", []],
  ["[]", 4, 15, "Prefix", []],
  ["<>", 4, 15, "Prefix", []],
  ["^", 14, 14, "InfixNon", []],
  ["/", 13, 13, "InfixNon", []],
  ["*", 13, 13, "InfixLeft", []],
  ["-.", 12, 12, "Prefix", ["-"]],
  ["-", 11, 11, "InfixLeft", []],
  ["+", 10, 10, "InfixLeft", []],
  ["^+", 15, 15, "Postfix", []],
  ["^*", 15, 15, "Postfix", []],
  ["^#", 15, 15, "Postfix", []],
  ["<", 5, 5, "InfixNon", []],
  ["=<", 5, 5, "InfixNon", ["<=", "\\leq"]],
  [">", 5, 5, "InfixNon", []],
  [">=", 5, 5, "InfixNon", ["\\geq"]],
  ["...", 9, 9, "InfixNon", []],
  ["..", 9, 9, "InfixNon", []],
  ["|", 10, 11, "InfixLeft", []],
  ["||", 10, 11, "InfixLeft", []],
  ["&&", 13, 13, "InfixLeft", []],
  ["&", 13, 13, "InfixLeft", []],
  ["$$", 9, 13, "InfixLeft", []],
  ["$", 9, 13, "InfixLeft", []],
  ["??", 9, 13, "InfixLeft", []],
  ["%%", 10, 11, "InfixLeft", []],
  ["%", 10, 11, "InfixLeft", ["\\mod"]],
  ["##", 9, 13, "InfixLeft", []],
  ["++", 10, 10, "InfixLeft", []],
  ["--", 11, 11, "InfixLeft", []],
  ["**", 13, 13, "InfixLeft", []],
  ["//", 13, 13, "InfixNon", []],
  ["^^", 14, 14, "InfixNon", []],
  ["@@", 6, 6, "InfixLeft", []],
  ["!!", 9, 13, "InfixNon", []],
  ["|-", 5, 5, "InfixNon", []],
  ["|=", 5, 5, "InfixNon", []],
  ["-|", 5, 5, "InfixNon", []],
  ["=|", 5, 5, "InfixNon", []],
  ["<:", 7, 7, "InfixNon", []],
  [":>", 7, 7, "InfixNon", []],
  [":=", 5, 5, "InfixNon", []],
  ["::=", 5, 5, "InfixNon", []],
  ["(+)", 10, 10, "InfixLeft", ["\\oplus"]],
  ["(-)", 11, 11, "InfixLeft", ["\\ominus"]],
  ["(.)", 13, 13, "InfixLeft", ["\\odot"]],
  ["(/)", 13, 13, "InfixNon", ["\\oslash"]],
  ["(\\X)", 13, 13, "InfixLeft", ["\\otimes"]],
  ["\\uplus", 9, 13, "InfixLeft", []],
  ["\\sqcap", 9, 13, "InfixLeft", []],
  ["\\sqcup", 9, 13, "InfixLeft", []],
  ["\\div", 13, 13, "InfixNon", []],
  ["\\wr", 9, 14, "InfixNon", []],
  ["\\star", 13, 13, "InfixLeft", []],
  ["\\o", 13, 13, "InfixLeft", ["\\circ"]],
  ["\\bigcirc", 13, 13, "InfixLeft", []],
  ["\\bullet", 13, 13, "InfixLeft", []],
  ["\\prec", 5, 5, "InfixNon", []],
  ["\\succ", 5, 5, "InfixNon", []],
  ["\\preceq", 5, 5, "InfixNon", []],
  ["\\succeq", 5, 5, "InfixNon", []],
  ["\\sim", 5, 5, "InfixNon", []],
  ["\\simeq", 5, 5, "InfixNon", []],
  ["\\ll", 5, 5, "InfixNon", []],
  ["\\gg", 5, 5, "InfixNon", []],
  ["\\asymp", 5, 5, "InfixNon", []],
  ["\\subset", 5, 5, "InfixNon", []],
  ["\\supset", 5, 5, "InfixNon", []],
  ["\\supseteq", 5, 5, "InfixNon", []],
  ["\\approx", 5, 5, "InfixNon", []],
  ["\\cong", 5, 5, "InfixNon", []],
  ["\\sqsubset", 5, 5, "InfixNon", []],
  ["\\sqsubseteq", 5, 5, "InfixNon", []],
  ["\\sqsupset", 5, 5, "InfixNon", []],
  ["\\sqsupseteq", 5, 5, "InfixNon", []],
  ["\\doteq", 5, 5, "InfixNon", []],
  ["\\propto", 5, 5, "InfixNon", []],
];

// OCaml's Hashtbl.find returns the most recent binding, so later aliases win over earlier names.
const OPERATOR_TABLE = new Map<string, Operator>();
for (const [name, low, high, fixity, aliases] of OPERATORS) {
  const operator = { name, low, high, fixity };
  for (const spelling of [name, ...aliases]) OPERATOR_TABLE.set(spelling, operator);
}

const getNonfix = (name: string): Operator => ({ name, low: -1, high: -1, fixity: "Nonfix" });

export const lookupOperator = (name: string) => OPERATOR_TABLE.get(name) ?? getNonfix(name);

const STANDARD_NAMES: Partial<Record<Builtin, string>> = {
  Implies: "=>",
  Equiv: "<=>",
  Conj: "/\\",
  Disj: "\\/",
  Neg: "~",
  Eq: "=",
  Neq: "#",
  SUBSET: "SUBSET",
  UNION: "UNION",
  DOMAIN: "DOMAIN",
  Subseteq: "\\subseteq",
  Mem: "\\in",
  Notmem: "\\notin",
  Setminus: "\\",
  Cap: "\\cap",
  Cup: "\\cup",
  Prime: "'",
  StrongPrime: "'",
  Leadsto: "~>",
  ENABLED: "ENABLED",
  UNCHANGED: "UNCHANGED",
  Cdot: "\\cdot",
  Actplus: "-+->",
  BoxTrue: "[]",
  BoxFalse: "[]",
  Diamond: "<>",
  Plus: "+",
  Minus: "-",
  Times: "*",
  Ratio: "/",
  Quotient: "\\div",
  Remainder: "%",
  Exp: "^",
  Lteq: "=<",
  Lt: "<",
  Gteq: ">=",
  Gt: ">",
  Range: "..",
  Cat: "\\o",
  OneArg: ":>",
  Extend: "@@",
};

const getStandardForm = (builtin: Builtin): Operator => {
  if (builtin === "Divides") return { name: "?|", low: 10, high: 11, fixity: "InfixNon" };
  if (builtin === "Uminus") return { ...lookupOperator("-."), name: "-" };
  const name = STANDARD_NAMES[builtin];
  return name ? lookupOperator(name) : getNonfix(builtin);
};

interface Ident {
  rep: string;
  salt: number;
}

const getIdentName = (ident: Ident) =>
  ident.salt === 0 ? ident.rep : `${ident.rep}_${ident.salt}`;

// Ctx as a mutable stack: printing binds and unbinds names in strict nesting order.
interface Context {
  stack: Ident[];
  idents: Map<string, Ident[]>;
  defined: Map<string, number>;
}

const createContext = (): Context => ({ stack: [], idents: new Map(), defined: new Map() });

const pushName = (context: Context, rep: string) => {
  const previous = context.idents.get(rep)?.at(-1);
  let ident: Ident = previous ? { rep, salt: previous.salt + 1 } : { rep, salt: 0 };
  while (context.defined.has(getIdentName(ident))) ident = { rep, salt: ident.salt + 1 };
  context.stack.push(ident);
  const idents = context.idents.get(rep);
  if (idents) idents.push(ident);
  else context.idents.set(rep, [ident]);
  const key = getIdentName(ident);
  context.defined.set(key, (context.defined.get(key) ?? 0) + 1);
  return key;
};

const popNames = (context: Context, count: number) => {
  for (let index = 0; index < count; index++) {
    const ident = context.stack.pop();
    if (!ident) return;
    context.idents.get(ident.rep)?.pop();
    const key = getIdentName(ident);
    const remaining = (context.defined.get(key) ?? 1) - 1;
    if (remaining === 0) context.defined.delete(key);
    else context.defined.set(key, remaining);
  }
};

const withNames = <Result>(
  context: Context,
  names: string[],
  body: (idents: string[]) => Result,
) => {
  const idents = names.map((name) => pushName(context, name));
  const result = body(idents);
  popNames(context, names.length);
  return result;
};

type Assoc = "Left" | "Non" | "Right";

type Minimal =
  | { kind: "Atm"; doc: Doc }
  | { kind: "Big"; doc: Doc }
  | { kind: "Op"; name: string; doc: Doc; low: number; high: number; skeleton: Skeleton };

type Skeleton =
  | { kind: "Infix"; assoc: Assoc; left: Minimal; right: Minimal }
  | { kind: "Prefix"; operand: Minimal }
  | { kind: "Postfix"; operand: Minimal };

const isBelow = (high: number, expression: Minimal) =>
  expression.kind === "Atm" || (expression.kind === "Op" && high < expression.low);

const withParens = (doc: Doc): Doc => [format("("), doc, format(")")];

const printMinimal = (expression: Minimal): Doc => {
  if (expression.kind !== "Op") return expression.doc;
  const skeleton = expression.skeleton;
  const isUnder = (operand: Minimal) => isBelow(expression.high, operand);
  switch (skeleton.kind) {
    case "Prefix": {
      const operand = skeleton.operand;
      const isBare =
        isUnder(operand) || (operand.kind === "Op" && operand.skeleton.kind === "Prefix");
      return [
        format("@[<h>"),
        expression.doc,
        isBare ? printMinimal(operand) : withParens(printMinimal(operand)),
        format("@]"),
      ];
    }
    case "Postfix": {
      const operand = skeleton.operand;
      const isBare =
        isUnder(operand) || (operand.kind === "Op" && operand.skeleton.kind === "Postfix");
      return [
        format("@[<h>"),
        isBare ? printMinimal(operand) : withParens(printMinimal(operand)),
        expression.doc,
        format("@]"),
      ];
    }
    case "Infix": {
      const left = skeleton.left;
      const right = skeleton.right;
      const isLeftBare =
        isUnder(left) ||
        (left.kind === "Op" && left.name === expression.name && skeleton.assoc === "Left");
      const isRightBare =
        isUnder(right) ||
        (skeleton.assoc === "Right" &&
          right.kind === "Op" &&
          right.skeleton.kind === "Infix" &&
          right.skeleton.assoc === "Right");
      return [
        format("@[<b0>"),
        isLeftBare ? printMinimal(left) : withParens(printMinimal(left)),
        expression.doc,
        isRightBare ? printMinimal(right) : withParens(printMinimal(right)),
        format("@]"),
      ];
    }
  }
};

const atom = (doc: Doc): Minimal => ({ kind: "Atm", doc });

const big = (doc: Doc): Minimal => ({ kind: "Big", doc });

const isLetter = (character: string) =>
  (character >= "A" && character <= "Z") || (character >= "a" && character <= "z");

const isWith = (expression: Expr): boolean => {
  if (expression.kind === "Lambda") return isWith(expression.body);
  if (expression.kind === "Sequent") return isWith(expression.sequent.active);
  return expression.kind === "With";
};

const isElided = (hyp: Hyp) => {
  if (hyp.kind === "Defn") {
    const definition = hyp.definition;
    const hasWith = definition.kind === "Operator" && isWith(definition.body);
    return hyp.visibility === "Hidden" || hasWith || hyp.whereDefined !== "User";
  }
  if (hyp.kind === "Fact") return hyp.visibility === "Hidden" || isWith(hyp.expression);
  return false;
};

const printShape = (shape: Shape): Doc =>
  shape === 0
    ? []
    : format(
        "@[<hov1>(%a)@]",
        formatDelimited(
          Array.from({ length: shape }, () => "_"),
          text,
        ),
      );

const printParam = (param: Param): Doc => format("%s%a", param.name, printShape(param.shape));

const LEVEL_NAMES = {
  Constant: "CONSTANT",
  State: "STATE",
  Action: "ACTION",
  Temporal: "TEMPORAL",
  Unknown: "UNKNOWN",
};

// hyps names the indices beyond the printer's own context, as the hypothesis deque does in E_fmt.
const createPrinter = (context: Context, hyps: Hyp[] = []) => {
  const printExpr = (expression: Expr): Doc => printMinimal(formatExpr(expression));

  const printLambda = (params: Param[], body: Expr) =>
    withNames(
      context,
      params.map((param) => param.name),
      () =>
        format(
          "@[<b2>LAMBDA @[<hv0>%a@] :@ %a@]",
          formatDelimited(params, printParam),
          printExpr(body),
        ),
    );

  // fmt_bounds: names bind left to right, domains print in the enclosing context, and dittos
  // share the previous domain.
  const formatBounds = <Result>(bounds: Bound[], body: (boundsDoc: Doc) => Result): Result => {
    const domains = bounds.map((bound) =>
      bound.domain.kind === "Domain" ? printExpr(bound.domain.expression) : undefined,
    );
    return withNames(
      context,
      bounds.map((bound) => bound.name),
      (names) => {
        const chunks: { names: string[]; index: number }[] = [];
        bounds.forEach((bound, index) => {
          if (index > 0 && bound.domain.kind === "Ditto") chunks.at(-1)?.names.push(names[index]);
          else chunks.push({ names: [names[index]], index });
        });
        const boundsDoc = formatDelimited(chunks, (chunk) => {
          const namesDoc = formatDelimited(chunk.names, text);
          const domain = bounds[chunk.index].domain;
          if (domain.kind === "NoDomain") return namesDoc;
          if (domain.kind === "Ditto") return format("@[<hov0>%a@ \\in ??????@]", namesDoc);
          return format("@[<hov0>%a@ \\in %a@]", namesDoc, domains[chunk.index] ?? []);
        });
        return body(boundsDoc);
      },
    );
  };

  const printSelector = (selector: Selector): Doc => {
    switch (selector.kind) {
      case "Down":
        return format(":");
      case "Left":
        return format("<<");
      case "Right":
        return format(">>");
      case "At":
        return text("@");
      case "Number":
        return text(String(selector.value));
      case "Instance":
        return format("@[<b1>(%a)@]", formatDelimited(selector.args, printExpr));
      case "Label":
        return selector.args.length === 0
          ? text(selector.label)
          : format(
              "@[<b2>%s@,@[<b1>(%a)@]@]",
              selector.label,
              formatDelimited(selector.args, printExpr),
            );
    }
  };

  const printSelectors = (selectors: Selector[]): Doc =>
    selectors.length === 0
      ? []
      : [format("!"), formatDelimited(selectors, printSelector, format("!"))];

  const getIndexName = (index: number) => {
    if (index < 0) return `#$$${Math.abs(index)}`;
    if (index === 0) return "#$0";
    if (index <= context.stack.length) {
      return getIdentName(context.stack[context.stack.length - index]);
    }
    const hyp = hyps[hyps.length - (index - context.stack.length)];
    if (hyp) return getHypName(hyp) ?? "??? FACT ???";
    return `#$${index}`;
  };

  const formatApply = (operator: Expr, args: Expr[]): Minimal => {
    if (operator.kind === "Lambda") {
      return {
        kind: "Op",
        name: " ",
        doc: format("@ "),
        low: 20,
        high: 20,
        skeleton: {
          kind: "Infix",
          assoc: "Left",
          left: big(printLambda(operator.params, operator.body)),
          right: atom(format("(%a)", formatDelimited(args, printExpr))),
        },
      };
    }
    if (operator.kind === "Bang") {
      return args.length === 0
        ? formatExpr(operator)
        : atom(
            format("@[<b2>%a@[<b1>(%a)@]@]", printExpr(operator), formatDelimited(args, printExpr)),
          );
    }
    if (operator.kind === "Internal" && args.length === 1) {
      if (operator.builtin === "BoxFalse" || operator.builtin === "Unprimable") {
        return formatExpr(args[0]);
      }
      if (operator.builtin === "Irregular") {
        return atom(format("@[<h>@<1>%s%a@<1>%s@]", "<[", printExpr(args[0]), "]>"));
      }
    }
    const top = (() => {
      switch (operator.kind) {
        case "Ix":
          return lookupOperator(getIndexName(operator.index));
        case "Opaque": {
          const found = lookupOperator(operator.name);
          return { ...found, name: `?${found.name}` };
        }
        case "Internal":
          return getStandardForm(operator.builtin);
        default:
          throw new TlaProofError("Cannot print this operator");
      }
    })();
    if (args.length === 0) return atom(text(top.name));
    if (top.fixity === "Nonfix") {
      return atom(format("@[<b2>%s@[<b1>(%a)@]@]", top.name, formatDelimited(args, printExpr)));
    }
    if (top.fixity === "Prefix" && args.length === 1) {
      return {
        kind: "Op",
        name: top.name,
        doc: isLetter(top.name[top.name.length - 1]) ? format("%s@ ", top.name) : text(top.name),
        low: top.low,
        high: top.high,
        skeleton: { kind: "Prefix", operand: formatExpr(args[0]) },
      };
    }
    if (top.fixity === "Postfix" && args.length === 1) {
      return {
        kind: "Op",
        name: top.name,
        doc: text(top.name),
        low: top.low,
        high: top.high,
        skeleton: { kind: "Postfix", operand: formatExpr(args[0]) },
      };
    }
    if (top.fixity.startsWith("Infix") && args.length === 2) {
      const assoc: Assoc =
        top.fixity === "InfixLeft" ? "Left" : top.fixity === "InfixRight" ? "Right" : "Non";
      return {
        kind: "Op",
        name: top.name,
        doc: top.name === ".." ? text(top.name) : format("@ %s ", top.name),
        low: top.low,
        high: top.high,
        skeleton: { kind: "Infix", assoc, left: formatExpr(args[0]), right: formatExpr(args[1]) },
      };
    }
    throw new TlaProofError(`Arity mismatch for operator ${top.name}`);
  };

  const formatExpr = (expression: Expr): Minimal => {
    switch (expression.kind) {
      case "Ix":
      case "Opaque":
      case "Internal":
        return formatApply(expression, []);
      case "Lambda":
        return big(printLambda(expression.params, expression.body));
      case "Bang":
        return atom([printExpr(expression.expression), printSelectors(expression.selectors)]);
      case "Apply":
        return formatApply(expression.operator, expression.args);
      case "Sequent":
        return big(printSequent(expression.sequent));
      case "With":
        return formatExpr(expression.expression);
      case "If":
        return big(
          format(
            "@[<hv2>@[<b2>IF@ %a@]@ @[<b2>THEN %a@]@ @[<b2>ELSE %a@]@]",
            printExpr(expression.condition),
            printExpr(expression.consequent),
            printExpr(expression.alternative),
          ),
        );
      case "List": {
        if (expression.bullet === "Refs" && expression.items.length === 0)
          return atom(format("TRUE"));
        if (expression.bullet === "Refs" && expression.items.length === 1) {
          return formatExpr(expression.items[0]);
        }
        const bullet = expression.bullet === "Or" ? "\\/" : "/\\";
        return big(
          format(
            "@[<v0>%a@]",
            formatDelimited(
              expression.items,
              (item) => format("@[<h>%s %a@]", bullet, printExpr(item)),
              format("@,"),
            ),
          ),
        );
      }
      case "Let": {
        const definitionsDoc = formatDelimited(
          expression.definitions,
          printDefinition,
          format("@,"),
        );
        const bodyDoc = printExpr(expression.body);
        popNames(context, expression.definitions.length);
        return big([format("@[<hv0>LET @[<v0>"), definitionsDoc, format("@]@\nIN  %a@]", bodyDoc)]);
      }
      case "Quant":
        return formatBounds(expression.bounds, (boundsDoc) =>
          big(
            format(
              "@[<b3>%s @[<b0>%a@] :@ %a@]",
              expression.quantifier === "Forall" ? "\\A" : "\\E",
              boundsDoc,
              printExpr(expression.body),
            ),
          ),
        );
      case "Tquant":
        return withNames(context, expression.names, (names) =>
          big(
            format(
              "@[<b4>%s @[<b0>%a@] : %a@]",
              expression.quantifier === "Forall" ? "\\AA" : "\\EE",
              formatDelimited(names, text),
              printExpr(expression.body),
            ),
          ),
        );
      case "Choose": {
        const domainDoc = expression.domain && printExpr(expression.domain);
        return withNames(context, [expression.name], ([name]) =>
          big(
            domainDoc
              ? format(
                  "@[<b2>CHOOSE @[<b2>%s \\in@ %a@] :@ %a@]",
                  name,
                  domainDoc,
                  printExpr(expression.body),
                )
              : format("@[<b2>CHOOSE %s :@ %a@]", name, printExpr(expression.body)),
          ),
        );
      }
      case "SetSt": {
        const domainDoc = printExpr(expression.domain);
        return withNames(context, [expression.name], ([name]) =>
          atom(
            format(
              "@[<b3>{@[<b2>%s \\in@ %a@] :@ %a}@]",
              name,
              domainDoc,
              printExpr(expression.body),
            ),
          ),
        );
      }
      case "SetOf":
        return formatBounds(expression.bounds, (boundsDoc) =>
          atom(format("@[<b3>{%a :@ %a}@]", printExpr(expression.element), boundsDoc)),
        );
      case "SetEnum":
        return atom(format("@[<h>{@[<b0>%a@]}@]", formatDelimited(expression.elements, printExpr)));
      case "Arrow":
        return atom(
          format("@[<b3>[%a ->@ %a]@]", printExpr(expression.domain), printExpr(expression.range)),
        );
      case "Fcn":
        return formatBounds(expression.bounds, (boundsDoc) =>
          atom(format("@[<b3>[%a |->@ %a]@]", boundsDoc, printExpr(expression.body))),
        );
      case "FcnApp": {
        const target = formatExpr(expression.function);
        const isAtom = target.kind === "Atm";
        return atom(
          format(
            "@[<h>%s%a%s@[<b1>[%a]@]@]",
            isAtom ? "" : "(",
            printMinimal(target),
            isAtom ? "" : ")",
            formatDelimited(expression.args, printExpr),
          ),
        );
      }
      case "Product": {
        if (expression.factors.length === 1) return formatExpr(expression.factors[0]);
        if (expression.factors.length === 0)
          throw new TlaProofError("Expr.Fmt.fmt_expr: PRODUCT []");
        return {
          kind: "Op",
          name: "\\X",
          doc: format("@ \\X "),
          low: 10,
          high: 13,
          skeleton: {
            kind: "Infix",
            assoc: "Right",
            left: formatExpr(expression.factors[0]),
            right: formatExpr({ ...expression, factors: expression.factors.slice(1) }),
          },
        };
      }
      case "Tuple":
        return atom(format("@[<b2><<%a>>@]", formatDelimited(expression.elements, printExpr)));
      case "Rect":
        return atom(
          format(
            "@[<b1>[%a]@]",
            formatDelimited(expression.fields, (field) =>
              format("@[<h>%s : %a@]", field.name, printExpr(field.value)),
            ),
          ),
        );
      case "Record":
        return atom(
          format(
            "@[<b1>[%a]@]",
            formatDelimited(expression.fields, (field) =>
              format("@[<h>%s |-> %a@]", field.name, printExpr(field.value)),
            ),
          ),
        );
      case "Except":
        return atom(
          format(
            "@[<b3>[%a EXCEPT@ @[<v0>%a@]]@]",
            printExpr(expression.function),
            formatDelimited(expression.specs, (spec) =>
              format(
                "!@[<h>%a = %a@]",
                spec.trail.map((point) =>
                  point.kind === "Dot"
                    ? format(".%s", point.field)
                    : format("[%a]", printExpr(point.expression)),
                ),
                printExpr(spec.value),
              ),
            ),
          ),
        );
      case "Dot":
        return {
          kind: "Op",
          name: ".",
          doc: format("."),
          low: 16,
          high: 16,
          skeleton: {
            kind: "Infix",
            assoc: "Left",
            left: formatExpr(expression.expression),
            right: atom(text(expression.field)),
          },
        };
      case "Sub":
      case "Tsub": {
        const isBox = expression.modal === "Box";
        const open = expression.kind === "Sub" ? (isBox ? "[" : "<<") : isBox ? "[][" : "<><<";
        return atom(
          format(
            "@[<h>%s@[<b2>%a@]%s%a@]",
            open,
            printExpr(expression.action),
            isBox ? "]_" : ">>_",
            printExpr(expression.subscript),
          ),
        );
      }
      case "Fair":
        return big(
          format(
            "@[<h>%s_%a (%a)@]",
            expression.fairness === "Weak" ? "WF" : "SF",
            withParens(printExpr(expression.subscript)),
            printExpr(expression.action),
          ),
        );
      case "Case":
        return big(
          format(
            "@[<v2>CASE %a%a@]",
            formatDelimited(
              expression.arms,
              (arm) => format("@[<b2>%a ->@ %a@]", printExpr(arm.condition), printExpr(arm.body)),
              format("@,[] "),
            ),
            expression.other
              ? format("@,[] @[<b2>OTHER ->@ %a@]", printExpr(expression.other))
              : [],
          ),
        );
      case "String":
        return atom(format('"%s"', expression.value));
      case "Num":
        return atom(
          text(
            expression.fraction === ""
              ? expression.integer
              : `${expression.integer}.${expression.fraction}`,
          ),
        );
      case "At":
        return atom(text("@"));
      case "Parens": {
        const form = expression.form;
        if (form.kind === "Syntax") return formatExpr(expression.expression);
        const names =
          form.kind === "Nlabel"
            ? form.names
            : form.indices.map((entry) =>
                entry.index >= 1 && entry.index <= context.stack.length
                  ? getIndexName(entry.index)
                  : `¶${entry.index}`,
              );
        const inner = formatExpr(expression.expression);
        if (names.length === 0) {
          return inner.kind === "Op"
            ? atom(format("%s::(%a)", form.label, printMinimal(inner)))
            : atom(format("%s::%a", form.label, printMinimal(inner)));
        }
        const namesDoc = formatDelimited(names, text);
        if (inner.kind === "Atm")
          return atom(format("%s(%a)::%a", form.label, namesDoc, printMinimal(inner)));
        if (inner.kind === "Big") {
          return atom(format("%s(%a)::(%a)", form.label, namesDoc, printMinimal(inner)));
        }
        return atom(format("(%s(%a):: %a)", form.label, namesDoc, printMinimal(inner)));
      }
    }
  };

  // pp_print_defn: returns the definition's document and binds its name for what follows.
  const printDefinition = (definition: Defn): Doc => {
    switch (definition.kind) {
      case "Operator":
      case "Bpragma": {
        const body = definition.body;
        if (body.kind === "Lambda") {
          const bodyDoc = withNames(
            context,
            body.params.map((param) => param.name),
            () => printExpr(body.body),
          );
          const name = pushName(context, definition.name);
          return format(
            "@[<b2>%s@[<b1>(%a)@] ==@ %a@]",
            name,
            formatDelimited(body.params, printParam),
            bodyDoc,
          );
        }
        const bodyDoc = printExpr(body);
        return format("@[<b2>%s ==@ %a@]", pushName(context, definition.name), bodyDoc);
      }
      case "Instance": {
        const instance = definition.instance;
        const substitutionsDoc = withNames(context, instance.args, (args) => {
          const doc = format(
            "@[<b2>INSTANCE %s%a@]",
            instance.module,
            instance.substitutions.length === 0
              ? []
              : format(
                  "@ WITH@ %a",
                  formatDelimited(instance.substitutions, (entry) =>
                    format("@[<b2>%s <- %a@]", entry.name, printExpr(entry.expression)),
                  ),
                ),
          );
          return { doc, args };
        });
        const name = pushName(context, definition.name);
        const head =
          instance.args.length === 0
            ? text(name)
            : format("%s (@[<b0>%a@])", name, formatDelimited(substitutionsDoc.args, text));
        return format("@[<b2>%a == %a@]", head, substitutionsDoc.doc);
      }
      case "Recursive": {
        const name = pushName(context, definition.name);
        return format("@[<b2>NEW CONSTANT %s%a@]", name, printShape(definition.shape));
      }
    }
  };

  // pp_print_hyp: prints the hypothesis in the context before it, then binds it.
  const printHyp = (hyp: Hyp): Doc => {
    switch (hyp.kind) {
      case "Fresh": {
        const domainDoc =
          hyp.domain && hyp.domainVisibility === "Visible" ? printExpr(hyp.domain) : undefined;
        const name = pushName(context, hyp.name);
        return [
          format("NEW %s %s%a", LEVEL_NAMES[hyp.level], name, printShape(hyp.shape)),
          domainDoc ? format(" \\in %a", domainDoc) : [],
        ];
      }
      case "Flex":
        return format("NEW VARIABLE %s", pushName(context, hyp.name));
      case "Defn":
        return printDefinition(hyp.definition);
      case "Fact": {
        const doc = format("@[<h>%a @]", printExpr(hyp.expression));
        pushName(context, "");
        return doc;
      }
    }
  };

  const printSequent = (sequent: Sequent): Doc => {
    if (sequent.context.length === 0) return printExpr(sequent.active);
    const hypDocs: Doc[] = [];
    for (const hyp of sequent.context) {
      if (isElided(hyp)) pushName(context, getHypName(hyp) ?? "");
      else hypDocs.push(printHyp(hyp));
    }
    const activeDoc = printExpr(sequent.active);
    popNames(context, sequent.context.length);
    if (hypDocs.length === 0) return activeDoc;
    return [
      format("@[<v0>ASSUME @[<v0>"),
      formatDelimited(hypDocs, (doc) => doc),
      format("@]@\nPROVE  %a@]", activeDoc),
    ];
  };

  return { printSequent, printExpr };
};

export const printExpression = (hyps: Hyp[], expression: Expr) =>
  createPrinter(createContext(), hyps).printExpr(expression);

export const formatObligation = (sequent: Sequent) => {
  const printer = createPrinter(createContext());
  return renderDoc(format("@[<b0>%a@]", printer.printSequent(sequent))).trimEnd();
};
