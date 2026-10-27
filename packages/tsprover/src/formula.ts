// A TLA+ expression with the structure tsprover generates for function bodies. Keeping the
// structure until rendering lets disabled paths simplify away and keeps bulleted lists aligned.
export type Formula = TextFormula | DisabledFormula | AndFormula | IfFormula | LetFormula;

interface TextFormula {
  kind: "text";
  text: string;
}

// A path through an action that assigns nothing, which TLA+ writes as FALSE.
interface DisabledFormula {
  kind: "disabled";
}

interface AndFormula {
  kind: "and";
  items: Formula[];
}

interface IfFormula {
  kind: "if";
  condition: string;
  whenTrue: Formula;
  whenFalse: Formula;
}

interface LetFormula {
  kind: "let";
  definitions: string[];
  body: Formula;
}

export const DISABLED: Formula = { kind: "disabled" };

export const text = (value: string): Formula => ({ kind: "text", text: value });

export const and = (items: Formula[]): Formula => {
  const flattened = items.flatMap((item) => (item.kind === "and" ? item.items : [item]));
  if (flattened.some((item) => item.kind === "disabled")) return DISABLED;
  const kept = flattened.filter((item) => item.kind !== "text" || item.text !== "TRUE");
  if (kept.length === 0) return text("TRUE");
  return kept.length === 1 ? kept[0] : { kind: "and", items: kept };
};

export const ifThenElse = (
  condition: string,
  whenTrue: Formula,
  whenFalse: Formula,
  negated = `~${wrap(condition)}`,
): Formula => {
  if (whenTrue.kind === "disabled" && whenFalse.kind === "disabled") return DISABLED;
  if (whenFalse.kind === "disabled") return and([text(condition), whenTrue]);
  if (whenTrue.kind === "disabled") return and([text(negated), whenFalse]);
  return { kind: "if", condition, whenTrue, whenFalse };
};

export const letIn = (definitions: string[], body: Formula): Formula => {
  if (body.kind === "disabled" || definitions.length === 0) return body;
  if (body.kind === "let") return letIn([...definitions, ...body.definitions], body.body);
  return { kind: "let", definitions, body };
};

const prefixLines = (lines: string[], first: string, rest: string) =>
  lines.map((line, index) => `${index === 0 ? first : rest}${line}`);

export const renderLines = (formula: Formula): string[] => {
  if (formula.kind === "disabled") return ["FALSE"];
  if (formula.kind === "text") return formula.text.split("\n");
  if (formula.kind === "and") {
    return formula.items.flatMap((item) => prefixLines(renderLines(item), "/\\ ", "   "));
  }
  if (formula.kind === "if") {
    return [
      ...prefixLines(formula.condition.split("\n"), "IF ", "   "),
      ...prefixLines(renderLines(formula.whenTrue), "THEN ", "     "),
      ...prefixLines(renderLines(formula.whenFalse), "ELSE ", "     "),
    ];
  }
  return [
    ...formula.definitions.flatMap((definition, index) =>
      prefixLines(definition.split("\n"), index === 0 ? "LET " : "    ", "      "),
    ),
    ...prefixLines(renderLines(formula.body), "IN  ", "    "),
  ];
};

export const render = (formula: Formula) => renderLines(formula).join("\n");

const OPENING = new Set(["(", "[", "{"]);
const CLOSING = new Set([")", "]", "}"]);

interface Scan {
  depth: number;
  isQuoted: boolean;
  isEscaped: boolean;
  isSkipped: boolean;
  surface: string;
}

// The expression without anything inside brackets, tuples, or strings, which leaves the operators
// that apply to the whole expression.
const getSurface = (expression: string) =>
  [...expression].reduce<Scan>(
    (scan, character, index) => {
      if (scan.isSkipped) return { ...scan, isSkipped: false };
      if (scan.isQuoted) {
        return {
          ...scan,
          isQuoted: scan.isEscaped || character !== '"',
          isEscaped: !scan.isEscaped && character === "\\",
        };
      }
      const pair = expression.slice(index, index + 2);
      if (pair === "<<") return { ...scan, depth: scan.depth + 1, isSkipped: true };
      if (pair === ">>" && scan.depth > 0) {
        return { ...scan, depth: scan.depth - 1, isSkipped: true };
      }
      if (character === '"') return { ...scan, isQuoted: true };
      if (OPENING.has(character)) return { ...scan, depth: scan.depth + 1 };
      if (CLOSING.has(character)) return { ...scan, depth: scan.depth - 1 };
      return scan.depth === 0 ? { ...scan, surface: scan.surface + character } : scan;
    },
    { depth: 0, isQuoted: false, isEscaped: false, isSkipped: false, surface: "" },
  ).surface;

// Whether an expression is a single term, so that it can be an operand without parentheses.
const isAtomic = (expression: string) =>
  expression !== "" &&
  !/^[~-]/.test(expression) &&
  !expression.includes("\n") &&
  !getSurface(expression).includes(" ");

// Parenthesizes an operand unless it is a single term.
export const wrap = (expression: string) => (isAtomic(expression) ? expression : `(${expression})`);

// Operators that bind no tighter than =, so that x = a = b would be ambiguous.
const LOOSE_OPERATORS = [
  " = ",
  " # ",
  " < ",
  " > ",
  " <= ",
  " >= ",
  " \\in ",
  " \\notin ",
  " \\subseteq ",
  " /\\ ",
  " \\/ ",
  " => ",
  " ~> ",
];

// Parenthesizes the value on the right of = when it is itself a comparison or a logical formula.
export const wrapEquated = (expression: string) =>
  expression.startsWith("~") ||
  LOOSE_OPERATORS.some((operator) => getSurface(expression).includes(operator))
    ? `(${expression})`
    : expression;

export const indent = (expression: string, prefix: string) =>
  expression.split("\n").join(`\n${prefix}`);
