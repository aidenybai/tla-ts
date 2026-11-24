import type {
  Bound,
  ExceptPathStep,
  Expression,
  ModuleUnit,
  OperatorDefinition,
  SourceLocation,
  SourceRange,
} from "../../ast";
import { TlaUnsupportedError } from "../../errors";
import { tokenize } from "../../lexer";
import { INFIX_OPERATORS, parenthesizedRanges, parseModuleTokens } from "../../parser";
import { formatString } from "../../printer";
import { TokenLocation } from "../../source-location";
import { getParsedTexts } from "../../tlc/order";

// The TLA+ of a program's code as syntax trees, as the parser reads them from the text the code
// prints as: builders of the nodes, and the layout that writes them as tokens. A node's location
// holds where it goes until the layout places it: on the line of the token before it, or on a line
// of its own at an indent; in parentheses or not; and for a LET or a CASE, the indent of the line
// that its IN or each of its [] starts, where they start lines of their own.
class Placement implements SourceLocation {
  readonly line = 0;
  readonly column = 0;
  readonly id: number;
  readonly indent: number;
  readonly isParenthesized: boolean;
  readonly innerIndent: number;
  // The spaces of a line of nothing else before the node's, or -1 where it has none.
  readonly blankIndent: number;

  constructor(
    id: number,
    indent: number,
    isParenthesized: boolean,
    innerIndent: number,
    blankIndent: number,
  ) {
    this.id = id;
    this.indent = indent;
    this.isParenthesized = isParenthesized;
    this.innerIndent = innerIndent;
    this.blankIndent = blankIndent;
  }
}

// The gap before a token: none, a space, or, from 0, a line break and that many spaces.
const NO_GAP = -2;
const SPACE = -1;

const MOST_INDENT = 6;

// The indents of a placement, from SPACE or none to MOST_INDENT.
const INDENTS = MOST_INDENT + 2;

const getPlacementId = (
  indent: number,
  isParenthesized: boolean,
  innerIndent: number,
  blankIndent: number,
) =>
  (((indent + 1) * INDENTS + innerIndent + 1) * INDENTS + blankIndent + 1) * 2 +
  Number(isParenthesized);

// Every placement, by its id.
const PLACEMENTS = Array.from(
  { length: INDENTS ** 3 * 2 },
  (_, id) =>
    new Placement(
      id,
      Math.floor(id / (2 * INDENTS * INDENTS)) - 1,
      id % 2 === 1,
      (Math.floor(id / (2 * INDENTS)) % INDENTS) - 1,
      (Math.floor(id / 2) % INDENTS) - 1,
    ),
);

const INLINE = PLACEMENTS[getPlacementId(SPACE, false, SPACE, -1)];

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
  const indent = placement.indent ?? current.indent;
  const innerIndent = placement.innerIndent ?? current.innerIndent;
  const blankIndent = placement.blankIndent ?? current.blankIndent;
  if (Math.max(indent, innerIndent, blankIndent) > MOST_INDENT) {
    throw new TlaUnsupportedError(
      `tla-ts can't indent a program's code by more than ${MOST_INDENT} spaces`,
    );
  }
  const isParenthesized = placement.isParenthesized ?? current.isParenthesized;
  return {
    ...node,
    location: PLACEMENTS[getPlacementId(indent, isParenthesized, innerIndent, blankIndent)],
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

const PREFIX_WORDS = new Set(["DOMAIN", "SUBSET", "UNION", "ENABLED", "UNCHANGED"]);

// An operator applied to arguments, written between them where it's an infix operator of two, with
// the properties that the parser gives the application it reads.
export const apply = (operator: string, args: readonly Operand[]): Expression => {
  const operands = args.map(toExpression);
  if (operands.length === 2 && INFIX_OPERATORS.has(operator)) {
    return { kind: "Apply", operator, spelling: undefined, args: operands, location: INLINE };
  }
  return operands.length === 1 &&
    (operator === "-." || operator === "~" || PREFIX_WORDS.has(operator))
    ? { kind: "Apply", operator, args: operands, location: INLINE }
    : { kind: "Apply", operator, args: operands, argumentsRange: undefined, location: INLINE };
};

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
  pattern: { kind: "Name", name: variable, ranges: undefined },
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
): Expression => {
  const caseArms = arms.map((arm) => ({
    condition: toExpression(arm[0]),
    body: toExpression(arm[1]),
  }));
  return other === undefined
    ? { kind: "Case", arms: caseArms, other: undefined, location: INLINE }
    : {
        kind: "Case",
        arms: caseArms,
        other: toExpression(other),
        otherRange: undefined,
        location: INLINE,
      };
};

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
  params: params.map((param) => ({ name: param, arity: 0, location: INLINE })),
  head: undefined,
  body: toExpression(body),
  bodyRange: undefined,
  isLocal: false,
  isRecursive: false,
  location: INLINE,
});

// A definition of a program's code: its syntax tree, or, for one that a template writes, its text.
export interface CodeDefinition {
  name: string;
  arity: number;
  tree?: OperatorDefinition;
  text?: string;
}

interface GrowingPositions {
  module: string;
  lines: Int32Array;
  columns: Int32Array;
  endColumns: Int32Array;
}

const grow = (items: Int32Array) => {
  const grown = new Int32Array(items.length * 2);
  grown.set(items);
  return grown;
};

// The tokens of trees as a layout writes them, each after its gap: their texts, and their positions
// in a table of the parser's shape, whose text it prints. A layout that locates the trees gives
// their nodes the locations and ranges that the parser gives the nodes it reads from that text, and
// keeps the placement of each node it places at the token it locates the node at, and the value of
// each string.
class Layout {
  readonly positions: GrowingPositions;
  readonly texts: string[] = [];
  readonly isLocating: boolean;
  placements: Int32Array;
  readonly stringTokens: number[] = [];
  readonly stringValues: string[] = [];
  // The lines of nothing but spaces, and their spaces.
  readonly blankLines: number[] = [];
  readonly blankIndents: number[] = [];
  line = 1;
  column = 1;
  // The characters of the text that the tokens print as.
  length = 0;

  constructor(module: string, isLocating: boolean) {
    this.positions = {
      module,
      lines: new Int32Array(1024),
      columns: new Int32Array(1024),
      endColumns: new Int32Array(1024),
    };
    this.isLocating = isLocating;
    this.placements = new Int32Array(isLocating ? 1024 : 0);
  }

  write(text: string, gap: number) {
    const index = this.texts.length;
    const positions = this.positions;
    if (index === positions.lines.length) {
      positions.lines = grow(positions.lines);
      positions.columns = grow(positions.columns);
      positions.endColumns = grow(positions.endColumns);
      if (this.isLocating) this.placements = grow(this.placements);
    }
    if (gap === SPACE) {
      this.column += 1;
      this.length += 1;
    } else if (gap >= 0) {
      this.line += 1;
      this.column = gap + 1;
      this.length += gap + 1;
    }
    positions.lines[index] = this.line;
    positions.columns[index] = this.column;
    positions.endColumns[index] = this.column + text.length - 1;
    this.texts.push(text);
    this.column += text.length;
    this.length += text.length;
    return index;
  }

  writeBlankLine(indent: number) {
    this.line += 1;
    this.length += indent + 1;
    this.blankLines.push(this.line);
    this.blankIndents.push(indent);
  }

  getCount() {
    return this.texts.length;
  }

  getRange(start: number, end: number): SourceRange {
    const positions = this.positions;
    return {
      module: positions.module,
      start: { line: positions.lines[start], column: positions.columns[start] },
      end: { line: positions.lines[end], column: positions.endColumns[end] },
    };
  }

  getLocation(token: number, start: number, end: number) {
    const positions = this.positions;
    const location = new TokenLocation(positions.lines[token], positions.columns[token], positions);
    location.setRange(start, end);
    return location;
  }

  // Gives a node the location at a token, whose range runs from start to the last token written,
  // where the layout locates its trees, and keeps the placement of the node at the token.
  locate(node: { location: SourceLocation }, token: number, start: number) {
    if (!this.isLocating) return;
    this.placements[token] = getPlacement(node.location).id;
    node.location = this.getLocation(token, start, this.texts.length - 1);
  }

  // The placement of a node that the layout located, at the token where it located the node.
  getLocatedPlacement(location: SourceLocation) {
    const positions = this.positions;
    let low = 0;
    let high = this.texts.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      const isBefore =
        positions.lines[middle] < location.line ||
        (positions.lines[middle] === location.line && positions.columns[middle] < location.column);
      if (isBefore) low = middle + 1;
      else high = middle;
    }
    return PLACEMENTS[this.placements[low]];
  }

  // The text of the tokens from start to end, from the start of a line.
  print(start: number, end: number, line: number) {
    const positions = this.positions;
    const parts: string[] = [];
    let blank = 0;
    while (blank < this.blankLines.length && this.blankLines[blank] <= line) blank += 1;
    let previousLine = line;
    let previousEnd = 0;
    for (let index = start; index < end; index++) {
      if (positions.lines[index] > previousLine) {
        while (blank < this.blankLines.length && this.blankLines[blank] < positions.lines[index]) {
          parts.push(`\n${" ".repeat(this.blankIndents[blank])}`);
          blank += 1;
        }
        parts.push(`\n${" ".repeat(positions.columns[index] - 1)}`);
      } else if (positions.columns[index] > previousEnd + 1) parts.push(" ");
      parts.push(this.texts[index]);
      previousLine = positions.lines[index];
      previousEnd = positions.endColumns[index];
    }
    return parts.join("");
  }
}

// A copy of a node that the layout located already, placed where the node was, so that each place
// of a node that the tree holds twice has a node of its own.
const copyLocated = (expression: Expression, layout: Layout): Expression => {
  const copy = (item: Expression) => copyLocated(item, layout);
  const copyBounds = (bounds: readonly Bound[]) =>
    bounds.map((item) => ({ pattern: { ...item.pattern }, set: copy(item.set) }));
  const getCopy = (): Expression => {
    switch (expression.kind) {
      case "Apply":
        return apply(expression.operator, expression.args.map(copy));
      case "Tuple":
        return tuple(expression.elements.map(copy));
      case "SetEnumeration":
        return setOf(expression.elements.map(copy));
      case "If":
        return ifThen(
          copy(expression.condition),
          copy(expression.consequent),
          copy(expression.alternative),
        );
      case "Case":
        return caseOf(
          expression.arms.map((arm) => [copy(arm.condition), copy(arm.body)] as const),
          expression.other === undefined ? undefined : copy(expression.other),
        );
      case "Let":
        return letIn(
          expression.definitions.map((definition) => {
            if (definition.kind !== "Operator")
              throw new TlaUnsupportedError(
                "tla-ts can't lay out a LET of a function's definition",
              );
            const definitionCopy = defineOperator(
              definition.name,
              definition.params.map((param) => param.name),
              copy(definition.body),
            );
            definitionCopy.location = layout.getLocatedPlacement(definition.location);
            return definitionCopy;
          }),
          copy(expression.body),
        );
      case "Record":
        return recordOf(expression.fields.map((field) => [field.name, copy(field.value)] as const));
      case "Except":
        return except(
          copy(expression.function),
          expression.updates.map(
            (update) =>
              [
                update.path.map((step) =>
                  step.kind === "Field" ? pathTo(step.name) : pathTo(step.args.map(copy)),
                ),
                copy(update.value),
              ] as const,
          ),
        );
      case "FunctionApplication":
        return subscript(copy(expression.function), expression.args.map(copy));
      case "FieldAccess":
        return dot(copy(expression.record), expression.field);
      case "FunctionConstruction":
        return functionOf(copyBounds(expression.bounds), copy(expression.body));
      case "Exists":
        return exists(copyBounds(expression.bounds), copy(expression.body));
      case "Number":
        return { kind: "Number", value: expression.value, text: expression.text, location: INLINE };
      case "String":
        return string(expression.value);
      case "Identifier":
        return ref(expression.name);
      case "ExceptAt":
        return exceptAt();
      default:
        throw new TlaUnsupportedError(
          `tla-ts can't lay out a ${expression.kind} expression of code`,
        );
    }
  };
  const copied = getCopy();
  copied.location = layout.getLocatedPlacement(expression.location);
  return copied;
};

// Writes an expression's tokens, the first after gap, unless the expression starts a line, and
// gives the expression laid out: itself, or its copy where the layout located it already.
const writeExpression = (input: Expression, gap: number, layout: Layout): Expression => {
  const expression =
    layout.isLocating && !(input.location instanceof Placement)
      ? copyLocated(input, layout)
      : input;
  const placement = getPlacement(expression.location);
  const first = placement.indent === SPACE ? gap : placement.indent;
  if (placement.blankIndent >= 0) layout.writeBlankLine(placement.blankIndent);
  if (placement.isParenthesized) {
    const open = layout.write("(", first);
    writeTokens(expression, NO_GAP, layout);
    const close = layout.write(")", NO_GAP);
    if (layout.isLocating) parenthesizedRanges.set(expression, layout.getRange(open, close));
    return expression;
  }
  writeTokens(expression, first, layout);
  return expression;
};

// Writes expressions in order, with a comma before each but the first.
const writeList = (items: Expression[], layout: Layout) => {
  for (let position = 0; position < items.length; position++) {
    if (position > 0) layout.write(",", NO_GAP);
    items[position] = writeExpression(items[position], position === 0 ? NO_GAP : SPACE, layout);
  }
};

const writeBounds = (bounds: Bound[], layout: Layout, gap: number) =>
  bounds.forEach((item, position) => {
    if (position > 0) layout.write(",", NO_GAP);
    const pattern = item.pattern;
    if (pattern.kind === "Name") {
      const name = layout.write(pattern.name, position === 0 ? gap : SPACE);
      if (layout.isLocating) pattern.ranges = [layout.getRange(name, name)];
    } else {
      layout.write("<<", position === 0 ? gap : SPACE);
      const names = pattern.names.map((patternName, namePosition) => {
        if (namePosition > 0) layout.write(",", NO_GAP);
        return layout.write(patternName, namePosition === 0 ? NO_GAP : SPACE);
      });
      if (layout.isLocating) pattern.ranges = names.map((name) => layout.getRange(name, name));
      layout.write(">>", NO_GAP);
    }
    layout.write("\\in", SPACE);
    item.set = writeExpression(item.set, SPACE, layout);
  });

const writeTokens = (expression: Expression, gap: number, layout: Layout): void => {
  const start = layout.getCount();
  switch (expression.kind) {
    case "Number": {
      const token = layout.write(expression.text ?? String(expression.value), gap);
      layout.locate(expression, token, token);
      return;
    }
    case "String": {
      const token = layout.write(formatString(expression.value), gap);
      if (layout.isLocating) {
        layout.stringTokens.push(token);
        layout.stringValues.push(expression.value);
      }
      layout.locate(expression, token, token);
      return;
    }
    case "Identifier":
    case "ExceptAt": {
      const token = layout.write(expression.kind === "Identifier" ? expression.name : "@", gap);
      layout.locate(expression, token, token);
      return;
    }
    case "Apply": {
      const args = expression.args;
      if (args.length === 2 && INFIX_OPERATORS.has(expression.operator)) {
        args[0] = writeExpression(args[0], gap, layout);
        const operator = layout.write(expression.operator, SPACE);
        args[1] = writeExpression(args[1], SPACE, layout);
        layout.locate(expression, operator, start);
        return;
      }
      if (args.length === 1 && (expression.operator === "-." || expression.operator === "~")) {
        const operator = layout.write(expression.operator === "-." ? "-" : "~", gap);
        args[0] = writeExpression(args[0], NO_GAP, layout);
        layout.locate(expression, operator, operator);
        return;
      }
      if (args.length === 1 && PREFIX_WORDS.has(expression.operator)) {
        const operator = layout.write(expression.operator, gap);
        args[0] = writeExpression(args[0], SPACE, layout);
        layout.locate(expression, operator, operator);
        return;
      }
      const name = layout.write(expression.operator, gap);
      const open = layout.write("(", NO_GAP);
      writeList(args, layout);
      const close = layout.write(")", NO_GAP);
      if (layout.isLocating) expression.argumentsRange = layout.getRange(open, close);
      layout.locate(expression, name, name);
      return;
    }
    case "If": {
      const keyword = layout.write("IF", gap);
      expression.condition = writeExpression(expression.condition, SPACE, layout);
      layout.write("THEN", SPACE);
      expression.consequent = writeExpression(expression.consequent, SPACE, layout);
      layout.write("ELSE", SPACE);
      expression.alternative = writeExpression(expression.alternative, SPACE, layout);
      layout.locate(expression, keyword, keyword);
      return;
    }
    case "Case": {
      const innerIndent = getPlacement(expression.location).innerIndent;
      const keyword = layout.write("CASE", gap);
      expression.arms.forEach((arm, position) => {
        if (position > 0) layout.write("[]", innerIndent);
        arm.condition = writeExpression(arm.condition, SPACE, layout);
        layout.write("->", SPACE);
        arm.body = writeExpression(arm.body, SPACE, layout);
      });
      if (expression.other !== undefined) {
        layout.write("[]", innerIndent);
        const other = layout.write("OTHER", SPACE);
        layout.write("->", SPACE);
        expression.other = writeExpression(expression.other, SPACE, layout);
        if (layout.isLocating) {
          expression.otherRange = layout.getRange(other, layout.getCount() - 1);
        }
      }
      layout.locate(expression, keyword, keyword);
      return;
    }
    case "Let": {
      const keyword = layout.write("LET", gap);
      expression.definitions.forEach((definition) => {
        if (definition.kind !== "Operator") {
          throw new TlaUnsupportedError("tla-ts can't print a LET of a function's definition");
        }
        writeDefinition(definition, SPACE, layout);
      });
      layout.write("IN", getPlacement(expression.location).innerIndent);
      expression.body = writeExpression(expression.body, SPACE, layout);
      layout.locate(expression, keyword, keyword);
      return;
    }
    case "Tuple":
    case "SetEnumeration": {
      const isTuple = expression.kind === "Tuple";
      const open = layout.write(isTuple ? "<<" : "{", gap);
      writeList(expression.elements, layout);
      layout.write(isTuple ? ">>" : "}", NO_GAP);
      layout.locate(expression, open, open);
      return;
    }
    case "Record": {
      const open = layout.write("[", gap);
      expression.fields.forEach((field, position) => {
        if (position > 0) layout.write(",", NO_GAP);
        const name = layout.write(field.name, position === 0 ? NO_GAP : SPACE);
        layout.locate(field, name, name);
        layout.write("|->", SPACE);
        field.value = writeExpression(field.value, SPACE, layout);
      });
      layout.write("]", NO_GAP);
      layout.locate(expression, open, open);
      return;
    }
    case "Except": {
      const open = layout.write("[", gap);
      expression.function = writeExpression(expression.function, NO_GAP, layout);
      layout.write("EXCEPT", SPACE);
      expression.updates.forEach((update, position) => {
        if (position > 0) layout.write(",", NO_GAP);
        // The tokens where the update's heirs start, as the parser's ExceptSpec holds them.
        const heirStarts = [layout.write("!", SPACE)];
        update.path.forEach((step) => {
          if (step.kind === "Field") {
            heirStarts.push(layout.write(".", NO_GAP));
            layout.write(step.name, NO_GAP);
            return;
          }
          heirStarts.push(layout.write("[", NO_GAP));
          writeList(step.args, layout);
          layout.write("]", NO_GAP);
        });
        const equals = layout.write("=", SPACE);
        heirStarts.push(equals, equals + 1);
        update.value = writeExpression(update.value, SPACE, layout);
        heirStarts.push(layout.getCount());
        if (!layout.isLocating) return;
        const getHeirRange = (index: number) =>
          layout.getRange(heirStarts[index], heirStarts[index + 1] - 1);
        update.path.forEach((step, index) => {
          // SANY's Generator locates the $Tuple of component i at heir 2i + 1 of its ExceptSpec,
          // as the parser does.
          if (step.kind === "Index") {
            step.tupleRange = getHeirRange(
              2 * index + 1 < heirStarts.length - 1 ? 2 * index + 1 : index + 1,
            );
          }
        });
        update.range = layout.getRange(heirStarts[0], layout.getCount() - 1);
      });
      layout.write("]", NO_GAP);
      layout.locate(expression, open, open);
      return;
    }
    case "FunctionApplication": {
      expression.function = writeExpression(expression.function, gap, layout);
      const open = layout.write("[", NO_GAP);
      writeList(expression.args, layout);
      layout.write("]", NO_GAP);
      layout.locate(expression, open, start);
      return;
    }
    case "FieldAccess": {
      expression.record = writeExpression(expression.record, gap, layout);
      const dot = layout.write(".", NO_GAP);
      layout.write(expression.field, NO_GAP);
      layout.locate(expression, dot, start);
      return;
    }
    case "FunctionConstruction": {
      const open = layout.write("[", gap);
      writeBounds(expression.bounds, layout, NO_GAP);
      layout.write("|->", SPACE);
      expression.body = writeExpression(expression.body, SPACE, layout);
      layout.write("]", NO_GAP);
      layout.locate(expression, open, open);
      return;
    }
    case "Exists": {
      const keyword = layout.write("\\E", gap);
      writeBounds(expression.bounds, layout, SPACE);
      layout.write(":", SPACE);
      expression.body = writeExpression(expression.body, SPACE, layout);
      layout.locate(expression, keyword, keyword);
      return;
    }
    default:
      throw new TlaUnsupportedError(`tla-ts can't print a ${expression.kind} expression of code`);
  }
};

// Writes a definition's tokens, the first after gap, unless the definition starts a line, and lays
// it out as the parser reads it where the layout locates the trees.
const writeDefinition = (definition: OperatorDefinition, gap: number, layout: Layout) => {
  const placement = getPlacement(definition.location);
  const name = layout.write(definition.name, placement.indent === SPACE ? gap : placement.indent);
  const params = definition.params.map((param, position) => {
    layout.write(position === 0 ? "(" : ",", NO_GAP);
    return layout.write(param.name, position === 0 ? NO_GAP : SPACE);
  });
  if (params.length > 0) layout.write(")", NO_GAP);
  const head = layout.getCount() - 1;
  layout.write("==", SPACE);
  const bodyStart = layout.getCount();
  definition.body = writeExpression(definition.body, SPACE, layout);
  if (!layout.isLocating) return;
  definition.params.forEach((param, position) => {
    param.location = layout.getLocation(params[position], params[position], params[position]);
  });
  definition.head = layout.getRange(name, head);
  definition.bodyRange = layout.getRange(bodyStart, layout.getCount() - 1);
  layout.locate(definition, name, name);
};

// A definition's text, as a module holds it on lines of its own.
export const printCodeDefinition = (definition: OperatorDefinition) => {
  const layout = new Layout("", false);
  writeDefinition(definition, NO_GAP, layout);
  return layout.print(0, layout.getCount(), 1);
};

const getGapLength = (gap: number) => (gap === SPACE ? 1 : gap >= 0 ? gap + 1 : 0);

// The characters of the tokens that writeExpression writes of an expression.
const getExpressionLength = (expression: Expression, gap: number): number => {
  const placement = getPlacement(expression.location);
  const first = placement.indent === SPACE ? gap : placement.indent;
  const blank = placement.blankIndent >= 0 ? placement.blankIndent + 1 : 0;
  return placement.isParenthesized
    ? blank + getGapLength(first) + getTokensLength(expression, NO_GAP) + 2
    : blank + getTokensLength(expression, first);
};

const getListLength = (items: readonly Expression[]) => {
  let length = 0;
  for (let position = 0; position < items.length; position++) {
    length +=
      position === 0
        ? getExpressionLength(items[0], NO_GAP)
        : 1 + getExpressionLength(items[position], SPACE);
  }
  return length;
};

const getBoundsLength = (bounds: readonly Bound[], gap: number) => {
  let length = 0;
  bounds.forEach((item, position) => {
    const nameGap = getGapLength(position === 0 ? gap : SPACE);
    const pattern = item.pattern;
    length +=
      (position > 0 ? 1 : 0) +
      nameGap +
      (pattern.kind === "Name"
        ? pattern.name.length
        : 4 +
          pattern.names.reduce(
            (total, patternName, index) => total + patternName.length + (index > 0 ? 2 : 0),
            0,
          )) +
      4 +
      getExpressionLength(item.set, SPACE);
  });
  return length;
};

// The characters of the tokens that writeTokens writes of an expression.
const getTokensLength = (expression: Expression, gap: number): number => {
  switch (expression.kind) {
    case "Number":
      return getGapLength(gap) + (expression.text ?? String(expression.value)).length;
    case "String":
      return getGapLength(gap) + formatString(expression.value).length;
    case "Identifier":
      return getGapLength(gap) + expression.name.length;
    case "ExceptAt":
      return getGapLength(gap) + 1;
    case "Apply": {
      const args = expression.args;
      if (args.length === 2 && INFIX_OPERATORS.has(expression.operator)) {
        return (
          getExpressionLength(args[0], gap) +
          1 +
          expression.operator.length +
          getExpressionLength(args[1], SPACE)
        );
      }
      if (args.length === 1 && (expression.operator === "-." || expression.operator === "~")) {
        return getGapLength(gap) + 1 + getExpressionLength(args[0], NO_GAP);
      }
      if (args.length === 1 && PREFIX_WORDS.has(expression.operator)) {
        return getGapLength(gap) + expression.operator.length + getExpressionLength(args[0], SPACE);
      }
      return getGapLength(gap) + expression.operator.length + 2 + getListLength(args);
    }
    case "If":
      return (
        getGapLength(gap) +
        2 +
        getExpressionLength(expression.condition, SPACE) +
        5 +
        getExpressionLength(expression.consequent, SPACE) +
        5 +
        getExpressionLength(expression.alternative, SPACE)
      );
    case "Case": {
      const innerGap = getGapLength(getPlacement(expression.location).innerIndent);
      let length = getGapLength(gap) + 4;
      expression.arms.forEach((arm, position) => {
        length +=
          (position > 0 ? innerGap + 2 : 0) +
          getExpressionLength(arm.condition, SPACE) +
          3 +
          getExpressionLength(arm.body, SPACE);
      });
      return expression.other === undefined
        ? length
        : length + innerGap + 2 + 6 + 3 + getExpressionLength(expression.other, SPACE);
    }
    case "Let": {
      let length = getGapLength(gap) + 3;
      expression.definitions.forEach((definition) => {
        if (definition.kind !== "Operator") {
          throw new TlaUnsupportedError("tla-ts can't print a LET of a function's definition");
        }
        length += getDefinitionLength(definition, SPACE);
      });
      return (
        length +
        getGapLength(getPlacement(expression.location).innerIndent) +
        2 +
        getExpressionLength(expression.body, SPACE)
      );
    }
    case "Tuple":
      return getGapLength(gap) + 4 + getListLength(expression.elements);
    case "SetEnumeration":
      return getGapLength(gap) + 2 + getListLength(expression.elements);
    case "Record": {
      let length = getGapLength(gap) + 2;
      expression.fields.forEach((field, position) => {
        length +=
          (position > 0 ? 2 : 0) + field.name.length + 4 + getExpressionLength(field.value, SPACE);
      });
      return length;
    }
    case "Except": {
      let length = getGapLength(gap) + 1 + getExpressionLength(expression.function, NO_GAP) + 7 + 1;
      expression.updates.forEach((update, position) => {
        length += position > 0 ? 3 : 2;
        update.path.forEach((step) => {
          length += step.kind === "Field" ? 1 + step.name.length : 2 + getListLength(step.args);
        });
        length += 2 + getExpressionLength(update.value, SPACE);
      });
      return length;
    }
    case "FunctionApplication":
      return getExpressionLength(expression.function, gap) + 2 + getListLength(expression.args);
    case "FieldAccess":
      return getExpressionLength(expression.record, gap) + 1 + expression.field.length;
    case "FunctionConstruction":
      return (
        getGapLength(gap) +
        1 +
        getBoundsLength(expression.bounds, NO_GAP) +
        4 +
        getExpressionLength(expression.body, SPACE) +
        1
      );
    case "Exists":
      return (
        getGapLength(gap) +
        2 +
        getBoundsLength(expression.bounds, SPACE) +
        2 +
        getExpressionLength(expression.body, SPACE)
      );
    default:
      throw new TlaUnsupportedError(`tla-ts can't print a ${expression.kind} expression of code`);
  }
};

const getDefinitionLength = (definition: OperatorDefinition, gap: number) => {
  const placement = getPlacement(definition.location);
  const params = definition.params;
  return (
    getGapLength(placement.indent === SPACE ? gap : placement.indent) +
    definition.name.length +
    (params.length === 0
      ? 0
      : params.reduce(
          (total, param, position) => total + param.name.length + (position > 0 ? 2 : 0),
          2,
        )) +
    3 +
    getExpressionLength(definition.body, SPACE)
  );
};

// The characters of a definition's text, as printCodeDefinition prints it.
export const getCodeLength = (definition: OperatorDefinition) =>
  getDefinitionLength(definition, NO_GAP);

export const printCodeExpression = (expression: Expression) => {
  const layout = new Layout("", false);
  writeExpression(expression, NO_GAP, layout);
  return layout.print(0, layout.getCount(), 1);
};

const CAPITALIZED = /\b[A-Z]\w*\b/g;

const NAME = /^[A-Za-z_]\w*$/;

// Walks an expression's nodes in the order of their tokens, each replaced in place, before its
// tokens, by what replace gives for it, and visits each capitalized word of the tokens, as
// \b[A-Z]\w*\b finds them in its text, and whether it's in a string: the names of definitions,
// which no other word is.
export const walkCode = (
  root: Expression,
  replace: (expression: Expression) => Expression,
  visit?: (name: string, isInString: boolean) => void,
) => {
  const visitWords = (text: string) => {
    if (visit === undefined) return;
    const first = text.charCodeAt(0);
    // A capital starts a name, a quote a string, and a backslash an operator such as \E.
    if (first >= 65 && first <= 90 && NAME.test(text)) visit(text, false);
    else if (first === 34 || first === 92 || (first >= 65 && first <= 90)) {
      for (const match of text.matchAll(CAPITALIZED)) visit(match[0], first === 34);
    }
  };
  const walkList = (items: Expression[]) => {
    for (let position = 0; position < items.length; position++) {
      items[position] = walk(items[position]);
    }
  };
  const walkBounds = (bounds: Bound[]) =>
    bounds.forEach((item) => {
      const pattern = item.pattern;
      if (pattern.kind === "Name") visitWords(pattern.name);
      else pattern.names.forEach(visitWords);
      item.set = walk(item.set);
    });
  const walk = (input: Expression): Expression => {
    const expression = replace(input);
    switch (expression.kind) {
      case "String":
        if (visit !== undefined) visitWords(formatString(expression.value));
        break;
      case "Identifier":
        visitWords(expression.name);
        break;
      case "Apply": {
        const args = expression.args;
        if (args.length === 2 && INFIX_OPERATORS.has(expression.operator)) {
          args[0] = walk(args[0]);
          visitWords(expression.operator);
          args[1] = walk(args[1]);
        } else if (
          args.length === 1 &&
          (expression.operator === "-." || expression.operator === "~")
        ) {
          args[0] = walk(args[0]);
        } else {
          visitWords(expression.operator);
          walkList(args);
        }
        break;
      }
      case "If":
        visitWords("IF");
        expression.condition = walk(expression.condition);
        visitWords("THEN");
        expression.consequent = walk(expression.consequent);
        visitWords("ELSE");
        expression.alternative = walk(expression.alternative);
        break;
      case "Case":
        visitWords("CASE");
        expression.arms.forEach((arm) => {
          arm.condition = walk(arm.condition);
          arm.body = walk(arm.body);
        });
        if (expression.other !== undefined) {
          visitWords("OTHER");
          expression.other = walk(expression.other);
        }
        break;
      case "Let":
        visitWords("LET");
        expression.definitions.forEach((definition) => {
          visitWords(definition.name);
          if (definition.kind === "Operator") {
            definition.params.forEach((param) => visitWords(param.name));
          }
          definition.body = walk(definition.body);
        });
        visitWords("IN");
        expression.body = walk(expression.body);
        break;
      case "Tuple":
      case "SetEnumeration":
        walkList(expression.elements);
        break;
      case "Record":
        expression.fields.forEach((field) => {
          visitWords(field.name);
          field.value = walk(field.value);
        });
        break;
      case "Except":
        expression.function = walk(expression.function);
        visitWords("EXCEPT");
        expression.updates.forEach((update) => {
          update.path.forEach((step) => {
            if (step.kind === "Field") visitWords(step.name);
            else walkList(step.args);
          });
          update.value = walk(update.value);
        });
        break;
      case "FunctionApplication":
        expression.function = walk(expression.function);
        walkList(expression.args);
        break;
      case "FieldAccess":
        expression.record = walk(expression.record);
        visitWords(expression.field);
        break;
      case "FunctionConstruction":
        walkBounds(expression.bounds);
        expression.body = walk(expression.body);
        break;
      case "Exists":
        visitWords("\\E");
        walkBounds(expression.bounds);
        expression.body = walk(expression.body);
        break;
    }
    return expression;
  };
  return walk(root);
};

const KINDS = new Map<Expression["kind"], number>(
  (
    [
      "Number",
      "String",
      "Identifier",
      "ExceptAt",
      "Apply",
      "If",
      "Case",
      "Let",
      "Tuple",
      "SetEnumeration",
      "Record",
      "Except",
      "FunctionApplication",
      "FieldAccess",
      "FunctionConstruction",
      "Exists",
    ] as const
  ).map((kind, index) => [kind, index]),
);

// The shapes of definitions as runs of numbers, one after another: each node's kind, placement,
// words and counts, in the order that walkCode replaces the nodes in, which two definitions share
// where their texts after their names are the same.
export class CodeShapes {
  items = new Int32Array(1 << 16);
  length = 0;
  readonly words = new Map<string, number>();

  add(item: number) {
    if (this.length === this.items.length) this.items = grow(this.items);
    this.items[this.length] = item;
    this.length += 1;
  }

  addWord(word: string) {
    const known = this.words.get(word);
    const id = known ?? this.words.size;
    if (known === undefined) this.words.set(word, id);
    this.add(id);
  }

  addBounds(bounds: readonly Bound[]) {
    this.add(bounds.length);
    bounds.forEach((item) => {
      const pattern = item.pattern;
      if (pattern.kind === "Name") {
        this.add(-1);
        this.addWord(pattern.name);
      } else {
        this.add(pattern.names.length);
        pattern.names.forEach((patternName) => this.addWord(patternName));
      }
    });
  }

  // A definition's placement and parameters, before the nodes of its body.
  addHead(definition: OperatorDefinition) {
    this.add(getPlacement(definition.location).id);
    this.add(definition.params.length);
    definition.params.forEach((param) => this.addWord(param.name));
  }

  addNode(expression: Expression) {
    const kind = KINDS.get(expression.kind);
    if (kind === undefined) {
      throw new TlaUnsupportedError(`tla-ts can't print a ${expression.kind} expression of code`);
    }
    this.add(kind);
    this.add(getPlacement(expression.location).id);
    switch (expression.kind) {
      case "Number":
        this.addWord(expression.text ?? String(expression.value));
        return;
      case "String":
        this.addWord(expression.value);
        return;
      case "Identifier":
        this.addWord(expression.name);
        return;
      case "Apply":
        this.addWord(expression.operator);
        this.add(expression.args.length);
        return;
      case "Case":
        this.add(expression.arms.length);
        this.add(expression.other === undefined ? 0 : 1);
        return;
      case "Let":
        this.add(expression.definitions.length);
        expression.definitions.forEach((definition) => {
          this.addWord(definition.name);
          if (definition.kind === "Operator") this.addHead(definition);
        });
        return;
      case "Tuple":
      case "SetEnumeration":
        this.add(expression.elements.length);
        return;
      case "Record":
        this.add(expression.fields.length);
        expression.fields.forEach((field) => this.addWord(field.name));
        return;
      case "Except":
        this.add(expression.updates.length);
        expression.updates.forEach((update) => {
          this.add(update.path.length);
          update.path.forEach((step) => {
            if (step.kind === "Field") {
              this.add(-1);
              this.addWord(step.name);
            } else this.add(step.args.length);
          });
        });
        return;
      case "FunctionApplication":
        this.add(expression.args.length);
        return;
      case "FieldAccess":
        this.addWord(expression.field);
        return;
      case "FunctionConstruction":
      case "Exists":
        this.addBounds(expression.bounds);
        return;
      default:
        return;
    }
  }

  getHash(start: number) {
    let hash = 0x811c9dc5;
    for (let index = start; index < this.length; index++) {
      hash = Math.imul(hash ^ this.items[index], 0x01000193);
    }
    return hash;
  }

  // Whether the shape that runs from start to end is the one that runs from otherStart.
  isSame(start: number, end: number, otherStart: number, otherEnd: number) {
    if (end - start !== otherEnd - otherStart) return false;
    for (let index = 0; index < end - start; index++) {
      if (this.items[start + index] !== this.items[otherStart + index]) return false;
    }
    return true;
  }
}

const keepExpression = (expression: Expression) => expression;

// Each capitalized word of an expression's text, as walkCode visits them.
export const forEachCodeName = (
  expression: Expression,
  visit: (name: string, isInString: boolean) => void,
) => {
  walkCode(expression, keepExpression, visit);
};

// Each capitalized word of a text, as forEachCodeName gives an expression's.
export const forEachTextName = (
  text: string,
  visit: (name: string, isInString: boolean) => void,
) => {
  for (const match of text.matchAll(/"[^"\\]*(?:\\.[^"\\]*)*"|\b[A-Z]\w*\b/g)) {
    if (!match[0].startsWith('"')) visit(match[0], false);
    else for (const name of match[0].matchAll(CAPITALIZED)) visit(name[0], true);
  }
};

// Each capitalized word of a definition's body, as forEachCodeName gives them.
export const forEachBodyName = (
  definition: CodeDefinition,
  visit: (name: string, isInString: boolean) => void,
) => {
  if (definition.tree !== undefined) forEachCodeName(definition.tree.body, visit);
  else {
    const text = definition.text ?? "";
    forEachTextName(text.slice(text.indexOf("==")), visit);
  }
};

const getUnitLine = (unit: ModuleUnit) => {
  switch (unit.kind) {
    case "Definition":
      return unit.definition.location.line;
    case "Instance":
      return unit.instance.location.line;
    case "Assumption":
      return unit.assumption.location.line;
    case "Theorem":
      return unit.theorem.location.line;
    case "Use":
      return unit.use.location.line;
    case "Module":
      return unit.module.location.line;
    default:
      return unit.location.line;
  }
};

// Two lists in order of their lines, merged in order of their lines.
const mergeByLine = <Item>(
  left: readonly Item[],
  right: readonly Item[],
  getLine: (item: Item) => number,
) => {
  const merged: Item[] = [];
  let position = 0;
  for (const item of left) {
    while (position < right.length && getLine(right[position]) < getLine(item)) {
      merged.push(right[position]);
      position++;
    }
    merged.push(item);
  }
  return [...merged, ...right.slice(position)];
};

// A module of definitions as trees and parts as text, one after another, each from a line of its
// own, as the parser reads the text they print as: the trees laid out as the parser places their
// nodes, and the text parsed where it is, with the lines of the trees blank; the texts that its
// tokens add to TLC's order of strings; and its text, which prints on demand.
export const layOutModule = (name: string, parts: readonly (string | OperatorDefinition)[]) => {
  const layout = new Layout(name, true);
  // The text's lines, with each tree's blank, and where each tree's tokens start and end.
  const lines: string[] = [];
  const trees: { definition: OperatorDefinition; start: number; end: number; line: number }[] = [];
  for (const part of parts) {
    if (typeof part === "string") {
      for (const partLine of part.split("\n")) lines.push(partLine);
      continue;
    }
    layout.line = lines.length + 1;
    layout.column = 1;
    const start = layout.getCount();
    writeDefinition(part, NO_GAP, layout);
    trees.push({ definition: part, start, end: layout.getCount(), line: lines.length + 1 });
    for (let blank = lines.length + 1; blank <= layout.line; blank++) lines.push("");
  }
  const text = lines.join("\n");
  const tokens = tokenize(text);
  const module = parseModuleTokens(text, tokens);
  const recursive = new Set(
    module.units.flatMap((unit) =>
      unit.kind === "Recursive" ? unit.declarations.map((declaration) => declaration.name) : [],
    ),
  );
  trees.forEach((tree) => {
    tree.definition.isRecursive = recursive.has(tree.definition.name);
  });
  // The texts of the tokens in order: the trees' and the text's, merged by line.
  const parsed = new Set<string>();
  const strings = new Set<string>();
  let position = 0;
  let stringPosition = 0;
  const addTokens = (end: number) => {
    const slice = tokens.slice(position, end);
    position = end;
    for (const parsedText of getParsedTexts(slice)) parsed.add(parsedText);
    for (const token of slice) if (token.kind === "String") strings.add(token.text);
  };
  for (const tree of trees) {
    let end = position;
    while (end < tokens.length && tokens[end].line < tree.line) end++;
    addTokens(end);
    for (let index = tree.start; index < tree.end; index++) parsed.add(layout.texts[index]);
    while (
      stringPosition < layout.stringTokens.length &&
      layout.stringTokens[stringPosition] < tree.end
    ) {
      strings.add(layout.stringValues[stringPosition]);
      stringPosition += 1;
    }
  }
  addTokens(tokens.length);
  const definitions = trees.map((tree) => tree.definition);
  return {
    module: {
      ...module,
      definitions: mergeByLine(
        module.definitions,
        definitions,
        (definition) => definition.location.line,
      ),
      units: mergeByLine(
        module.units,
        definitions.map((definition): ModuleUnit => ({ kind: "Definition", definition })),
        getUnitLine,
      ),
    },
    texts: { parsed: [...parsed], strings: [...strings] },
    getText: () => {
      let tree = 0;
      return parts
        .map((part) => {
          if (typeof part === "string") return part;
          const laidOut = trees[tree];
          tree += 1;
          return layout.print(laidOut.start, laidOut.end, laidOut.line);
        })
        .join("\n");
    },
  };
};
