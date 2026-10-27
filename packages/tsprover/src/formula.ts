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

// Whether an expression has no operator outside brackets, quotes, and tuples, so that it can be
// an operand without parentheses.
const isAtomic = (expression: string) => {
  if (expression === "" || /^[~-]/.test(expression) || expression.includes("\n")) return false;
  let depth = 0;
  let isQuoted = false;
  for (let index = 0; index < expression.length; index++) {
    const character = expression[index];
    if (isQuoted) {
      if (character === "\\") index++;
      if (character === '"') isQuoted = false;
      continue;
    }
    if (character === '"') isQuoted = true;
    else if (expression.startsWith("<<", index)) {
      depth++;
      index++;
    } else if (expression.startsWith(">>", index) && depth > 0) {
      depth--;
      index++;
    } else if (OPENING.has(character)) depth++;
    else if (CLOSING.has(character)) depth--;
    else if (character === " " && depth === 0) return false;
  }
  return true;
};

// Parenthesizes an operand unless it is a single term.
export const wrap = (expression: string) => (isAtomic(expression) ? expression : `(${expression})`);

export const indent = (expression: string, prefix: string) =>
  expression.split("\n").join(`\n${prefix}`);
