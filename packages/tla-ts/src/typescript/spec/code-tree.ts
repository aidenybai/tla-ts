import type {
  Bound,
  ExceptPathStep,
  Expression,
  OperatorDefinition,
  SourceLocation,
  SourceRange,
} from "../../ast";
import { TlaUnsupportedError } from "../../errors";
import { INFIX_OPERATORS } from "../../parser";
import { formatString } from "../../printer";

// The TLA+ of a program's code as syntax trees, as the parser reads them from the text the code
// prints as: builders of the nodes, and the printer that writes them as tokens. A node's location
// holds where it goes until the layout places it: on the line of the token before it, or on a line
// of its own at an indent; in parentheses or not; and for a LET or a CASE, the indent of the line
// that its IN or each of its [] starts, where they start lines of their own.
class Placement implements SourceLocation {
  readonly line = 0;
  readonly column = 0;
  readonly indent: number;
  readonly isParenthesized: boolean;
  readonly innerIndent: number;
  // The spaces of a line of nothing else before the node's, or -1 where it has none.
  readonly blankIndent: number;

  constructor(indent: number, isParenthesized: boolean, innerIndent: number, blankIndent: number) {
    this.indent = indent;
    this.isParenthesized = isParenthesized;
    this.innerIndent = innerIndent;
    this.blankIndent = blankIndent;
  }
}

// The gap before a token: none, a space, or, from 0, a line break and that many spaces.
const NO_GAP = -2;
const SPACE = -1;

const INLINE = new Placement(SPACE, false, SPACE, -1);

const getPlacement = (location: SourceLocation) =>
  location instanceof Placement ? location : INLINE;

// A copy of a node, placed where placement says, but for what it leaves undefined, which stays as
// the node's.
const place = <Node extends { location: SourceLocation }>(
  node: Node,
  placement: {
    indent?: number;
    isParenthesized?: boolean;
    innerIndent?: number;
    blankIndent?: number;
  },
): Node => {
  const current = getPlacement(node.location);
  return {
    ...node,
    location: new Placement(
      placement.indent ?? current.indent,
      placement.isParenthesized ?? current.isParenthesized,
      placement.innerIndent ?? current.innerIndent,
      placement.blankIndent ?? current.blankIndent,
    ),
  };
};

// A node whose line comes after a line of nothing but spaces.
export const afterBlankLine = (operand: Operand, blankIndent: number) =>
  place(toExpression(operand), { blankIndent });

// A node that starts a line of its own at an indent.
export const onLine = <Node extends { location: SourceLocation }>(node: Node, indent: number) =>
  place(node, { indent });

export const parenthesized = (operand: Operand) =>
  place(toExpression(operand), { isParenthesized: true });

// A LET whose IN, or a CASE each of whose [], starts a line of its own at an indent.
export const withInnerLines = (expression: Expression, indent: number) =>
  place(expression, { innerIndent: indent });

export const ref = (text: string): Expression => ({
  kind: "Identifier",
  name: text,
  location: INLINE,
});

export const dot = (record: Operand, field: string): Expression => ({
  kind: "FieldAccess",
  record: toExpression(record),
  field,
  location: INLINE,
});

// An operand of a builder: an expression, or a name, or a path of fields of a name, as "r.s" is.
export type Operand = Expression | string;

export const toExpression = (operand: Operand): Expression => {
  if (typeof operand !== "string") return operand;
  const fields = operand.split(".");
  return fields.slice(1).reduce<Expression>((record, field) => dot(record, field), ref(fields[0]));
};

export const num = (value: number): Expression =>
  value < 0
    ? apply("-.", [num(-value)])
    : { kind: "Number", value, text: String(value), location: INLINE };

export const string = (value: string): Expression => ({
  kind: "String",
  value,
  location: INLINE,
});

// An operator applied to arguments, written between them where it's an infix operator of two.
export const apply = (operator: string, args: readonly Operand[]): Expression => ({
  kind: "Apply",
  operator,
  args: args.map(toExpression),
  location: INLINE,
});

export const tuple = (elements: readonly Operand[]): Expression => ({
  kind: "Tuple",
  elements: elements.map(toExpression),
  location: INLINE,
});

export const subscript = (value: Operand, args: readonly Operand[]): Expression => ({
  kind: "FunctionApplication",
  function: toExpression(value),
  args: args.map(toExpression),
  location: INLINE,
});

export const ifThen = (
  condition: Operand,
  consequent: Operand,
  alternative: Operand,
): Expression => ({
  kind: "If",
  condition: toExpression(condition),
  consequent: toExpression(consequent),
  alternative: toExpression(alternative),
  location: INLINE,
});

export const letIn = (definitions: OperatorDefinition[], body: Operand): Expression => ({
  kind: "Let",
  definitions,
  body: toExpression(body),
  location: INLINE,
});

export const boundIn = (variable: string, values: Operand): Bound => ({
  pattern: { kind: "Name", name: variable },
  set: toExpression(values),
});

export const functionOf = (bounds: Bound[], body: Operand): Expression => ({
  kind: "FunctionConstruction",
  bounds,
  body: toExpression(body),
  location: INLINE,
});

export const setOf = (elements: readonly Operand[]): Expression => ({
  kind: "SetEnumeration",
  elements: elements.map(toExpression),
  location: INLINE,
});

export const recordOf = (fields: readonly (readonly [string, Operand])[]): Expression => ({
  kind: "Record",
  fields: fields.map((field) => ({
    name: field[0],
    value: toExpression(field[1]),
    location: INLINE,
  })),
  location: INLINE,
});

// The range of a part of an EXCEPT, which the layout gives it.
const UNPLACED_RANGE: SourceRange = {
  module: "",
  start: { line: 0, column: 0 },
  end: { line: 0, column: 0 },
};

// A step of an EXCEPT's path: a field's name, or the arguments of an index.
export const pathTo = (step: string | readonly Operand[]): ExceptPathStep =>
  typeof step === "string"
    ? { kind: "Field", name: step }
    : { kind: "Index", args: step.map(toExpression), tupleRange: UNPLACED_RANGE };

export const except = (
  value: Operand,
  updates: readonly (readonly [readonly ExceptPathStep[], Operand])[],
): Expression => ({
  kind: "Except",
  function: toExpression(value),
  updates: updates.map((update) => ({
    path: [...update[0]],
    value: toExpression(update[1]),
    range: UNPLACED_RANGE,
  })),
  location: INLINE,
});

export const exceptAt = (): Expression => ({ kind: "ExceptAt", location: INLINE });

export const caseOf = (
  arms: readonly (readonly [Operand, Operand])[],
  other?: Operand,
): Expression => ({
  kind: "Case",
  arms: arms.map((arm) => ({ condition: toExpression(arm[0]), body: toExpression(arm[1]) })),
  other: other === undefined ? undefined : toExpression(other),
  location: INLINE,
});

export const exists = (bounds: Bound[], body: Operand): Expression => ({
  kind: "Exists",
  bounds,
  body: toExpression(body),
  location: INLINE,
});

export const defineOperator = (
  operatorName: string,
  params: readonly string[],
  body: Operand,
): OperatorDefinition => ({
  kind: "Operator",
  name: operatorName,
  params: params.map((param) => ({ name: param, arity: 0 })),
  body: toExpression(body),
  isLocal: false,
  isRecursive: false,
  location: INLINE,
});

// Where the tokens of a printed tree go: each with the gap before it.
interface TokenWriter {
  write: (text: string, gap: number) => void;
  // Ends a line of nothing but spaces.
  writeBlankLine: (indent: number) => void;
}

const PREFIX_WORDS = new Set(["DOMAIN", "SUBSET", "UNION", "ENABLED", "UNCHANGED"]);

// Writes an expression's tokens, the first after gap, unless the expression starts a line.
const writeExpression = (expression: Expression, gap: number, writer: TokenWriter): void => {
  const placement = getPlacement(expression.location);
  const start = placement.indent === SPACE ? gap : placement.indent;
  if (placement.blankIndent >= 0) writer.writeBlankLine(placement.blankIndent);
  if (placement.isParenthesized) {
    writer.write("(", start);
    writeTokens(expression, NO_GAP, writer);
    writer.write(")", NO_GAP);
    return;
  }
  writeTokens(expression, start, writer);
};

const writeList = (
  items: readonly Expression[],
  writer: TokenWriter,
  separator = ",",
  gap = NO_GAP,
) =>
  items.forEach((item, position) => {
    if (position > 0) writer.write(separator, separator === "," ? NO_GAP : SPACE);
    writeExpression(item, position === 0 ? gap : SPACE, writer);
  });

const writeBounds = (bounds: readonly Bound[], writer: TokenWriter, gap: number) =>
  bounds.forEach((item, position) => {
    if (position > 0) writer.write(",", NO_GAP);
    const pattern = item.pattern;
    if (pattern.kind === "Name") writer.write(pattern.name, position === 0 ? gap : SPACE);
    else {
      writer.write("<<", position === 0 ? gap : SPACE);
      pattern.names.forEach((patternName, namePosition) => {
        if (namePosition > 0) writer.write(",", NO_GAP);
        writer.write(patternName, namePosition === 0 ? NO_GAP : SPACE);
      });
      writer.write(">>", NO_GAP);
    }
    writer.write("\\in", SPACE);
    writeExpression(item.set, SPACE, writer);
  });

const writePath = (step: ExceptPathStep, writer: TokenWriter) => {
  if (step.kind === "Field") {
    writer.write(".", NO_GAP);
    writer.write(step.name, NO_GAP);
    return;
  }
  writer.write("[", NO_GAP);
  writeList(step.args, writer);
  writer.write("]", NO_GAP);
};

const writeTokens = (expression: Expression, gap: number, writer: TokenWriter): void => {
  switch (expression.kind) {
    case "Number":
      writer.write(expression.text ?? String(expression.value), gap);
      return;
    case "String":
      writer.write(formatString(expression.value), gap);
      return;
    case "Identifier":
      writer.write(expression.name, gap);
      return;
    case "ExceptAt":
      writer.write("@", gap);
      return;
    case "Apply": {
      const args = expression.args;
      if (args.length === 2 && INFIX_OPERATORS.has(expression.operator)) {
        writeExpression(args[0], gap, writer);
        writer.write(expression.operator, SPACE);
        writeExpression(args[1], SPACE, writer);
        return;
      }
      if (args.length === 1 && (expression.operator === "-." || expression.operator === "~")) {
        writer.write(expression.operator === "-." ? "-" : "~", gap);
        writeExpression(args[0], NO_GAP, writer);
        return;
      }
      if (args.length === 1 && PREFIX_WORDS.has(expression.operator)) {
        writer.write(expression.operator, gap);
        writeExpression(args[0], SPACE, writer);
        return;
      }
      writer.write(expression.operator, gap);
      writer.write("(", NO_GAP);
      writeList(args, writer);
      writer.write(")", NO_GAP);
      return;
    }
    case "And":
    case "Or":
      writeList(expression.operands, writer, expression.kind === "And" ? "/\\" : "\\/", gap);
      return;
    case "If":
      writer.write("IF", gap);
      writeExpression(expression.condition, SPACE, writer);
      writer.write("THEN", SPACE);
      writeExpression(expression.consequent, SPACE, writer);
      writer.write("ELSE", SPACE);
      writeExpression(expression.alternative, SPACE, writer);
      return;
    case "Case": {
      const innerIndent = getPlacement(expression.location).innerIndent;
      writer.write("CASE", gap);
      expression.arms.forEach((arm, position) => {
        if (position > 0) writer.write("[]", innerIndent);
        writeExpression(arm.condition, SPACE, writer);
        writer.write("->", SPACE);
        writeExpression(arm.body, SPACE, writer);
      });
      if (expression.other !== undefined) {
        writer.write("[]", innerIndent);
        writer.write("OTHER", SPACE);
        writer.write("->", SPACE);
        writeExpression(expression.other, SPACE, writer);
      }
      return;
    }
    case "Let":
      writer.write("LET", gap);
      expression.definitions.forEach((definition) => {
        if (definition.kind !== "Operator") {
          throw new TlaUnsupportedError("tla-ts can't print a LET of a function's definition");
        }
        writeDefinition(definition, SPACE, writer);
      });
      writer.write("IN", getPlacement(expression.location).innerIndent);
      writeExpression(expression.body, SPACE, writer);
      return;
    case "Tuple":
      writer.write("<<", gap);
      writeList(expression.elements, writer);
      writer.write(">>", NO_GAP);
      return;
    case "SetEnumeration":
      writer.write("{", gap);
      writeList(expression.elements, writer);
      writer.write("}", NO_GAP);
      return;
    case "Record":
    case "RecordSet":
      writer.write("[", gap);
      expression.fields.forEach((field, position) => {
        if (position > 0) writer.write(",", NO_GAP);
        writer.write(field.name, position === 0 ? NO_GAP : SPACE);
        writer.write(expression.kind === "Record" ? "|->" : ":", SPACE);
        writeExpression(field.value, SPACE, writer);
      });
      writer.write("]", NO_GAP);
      return;
    case "Except":
      writer.write("[", gap);
      writeExpression(expression.function, NO_GAP, writer);
      writer.write("EXCEPT", SPACE);
      expression.updates.forEach((update, position) => {
        if (position > 0) writer.write(",", NO_GAP);
        writer.write("!", SPACE);
        update.path.forEach((step) => writePath(step, writer));
        writer.write("=", SPACE);
        writeExpression(update.value, SPACE, writer);
      });
      writer.write("]", NO_GAP);
      return;
    case "FunctionApplication":
      writeExpression(expression.function, gap, writer);
      writer.write("[", NO_GAP);
      writeList(expression.args, writer);
      writer.write("]", NO_GAP);
      return;
    case "FieldAccess":
      writeExpression(expression.record, gap, writer);
      writer.write(".", NO_GAP);
      writer.write(expression.field, NO_GAP);
      return;
    case "FunctionConstruction":
      writer.write("[", gap);
      writeBounds(expression.bounds, writer, NO_GAP);
      writer.write("|->", SPACE);
      writeExpression(expression.body, SPACE, writer);
      writer.write("]", NO_GAP);
      return;
    case "FunctionSet":
      writer.write("[", gap);
      writeExpression(expression.domain, NO_GAP, writer);
      writer.write("->", SPACE);
      writeExpression(expression.range, SPACE, writer);
      writer.write("]", NO_GAP);
      return;
    case "Forall":
    case "Exists":
      writer.write(expression.kind === "Forall" ? "\\A" : "\\E", gap);
      writeBounds(expression.bounds, writer, SPACE);
      writer.write(":", SPACE);
      writeExpression(expression.body, SPACE, writer);
      return;
    case "Choose":
      writer.write("CHOOSE", gap);
      if (expression.set === undefined && expression.pattern.kind === "Name") {
        writer.write(expression.pattern.name, SPACE);
      } else if (expression.set !== undefined) {
        writeBounds([{ pattern: expression.pattern, set: expression.set }], writer, SPACE);
      }
      writer.write(":", SPACE);
      writeExpression(expression.body, SPACE, writer);
      return;
    case "SetFilter":
      writer.write("{", gap);
      writeBounds([expression.bound], writer, NO_GAP);
      writer.write(":", SPACE);
      writeExpression(expression.predicate, SPACE, writer);
      writer.write("}", NO_GAP);
      return;
    case "SetMap":
      writer.write("{", gap);
      writeExpression(expression.expression, NO_GAP, writer);
      writer.write(":", SPACE);
      writeBounds(expression.bounds, writer, SPACE);
      writer.write("}", NO_GAP);
      return;
    case "Lambda":
      writer.write("LAMBDA", gap);
      expression.params.forEach((param, position) => {
        if (position > 0) writer.write(",", NO_GAP);
        writer.write(param, SPACE);
      });
      writer.write(":", SPACE);
      writeExpression(expression.body, SPACE, writer);
      return;
    default:
      throw new TlaUnsupportedError(`tla-ts can't print a ${expression.kind} expression of code`);
  }
};

const writeDefinition = (definition: OperatorDefinition, gap: number, writer: TokenWriter) => {
  const placement = getPlacement(definition.location);
  writer.write(definition.name, placement.indent === SPACE ? gap : placement.indent);
  if (definition.params.length > 0) {
    writer.write("(", NO_GAP);
    definition.params.forEach((param, position) => {
      if (position > 0) writer.write(",", NO_GAP);
      writer.write(param.name, position === 0 ? NO_GAP : SPACE);
    });
    writer.write(")", NO_GAP);
  }
  writer.write("==", SPACE);
  writeExpression(definition.body, SPACE, writer);
};

// The text of tokens, each after its gap.
const createTextWriter = () => {
  const parts: string[] = [];
  const writer: TokenWriter = {
    writeBlankLine: (indent) => {
      parts.push(`\n${" ".repeat(indent)}`);
    },
    write: (text, gap) => {
      if (gap === SPACE) parts.push(" ");
      else if (gap >= 0) parts.push(`\n${" ".repeat(gap)}`);
      parts.push(text);
    },
  };
  return { writer, getText: () => parts.join("") };
};

// A definition's text, as a module holds it on lines of its own.
export const printCodeDefinition = (definition: OperatorDefinition) => {
  const text = createTextWriter();
  writeDefinition(definition, NO_GAP, text.writer);
  return text.getText();
};

export const printCodeExpression = (expression: Expression) => {
  const text = createTextWriter();
  writeExpression(expression, NO_GAP, text.writer);
  return text.getText();
};
