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

// Where the tokens of a printed tree go: each with the gap before it, which gives the token's
// index; and, where the writer lays the tree out, the layout that its nodes take their positions
// from.
interface TokenWriter {
  write: (text: string, gap: number) => number;
  // Ends a line of nothing but spaces.
  writeBlankLine: (indent: number) => void;
  getCount: () => number;
  layout?: Layout;
  // The placements of the nodes that a layout placed, where the tree is laid out.
  placements?: ReadonlyMap<object, Placement>;
}

// Where a node goes: where its location says before a layout, and where the layout found it after.
const getNodePlacement = (node: { location: SourceLocation }, writer: TokenWriter) =>
  node.location instanceof Placement ? node.location : (writer.placements?.get(node) ?? INLINE);

// The positions of the tokens that a writer lays out, as the parser's table holds a module's, and
// the placement of each node laid out that a placement places, from which a copy of the node takes
// its own, where the tree holds a node in two places.
interface Layout {
  table: LaidOutTable;
  placements: Map<object, Placement>;
  // The value of each string token, by its index.
  strings: Map<number, string>;
}

// The positions of a module's tokens, in a table of the parser's shape whose arrays grow as the
// layout writes the tokens, and their texts.
interface GrowingPositions {
  module: string;
  lines: Int32Array;
  columns: Int32Array;
  endColumns: Int32Array;
}

class LaidOutTable {
  readonly positions: GrowingPositions;
  texts: string[] = [];

  constructor(module: string) {
    this.positions = {
      module,
      lines: new Int32Array(1024),
      columns: new Int32Array(1024),
      endColumns: new Int32Array(1024),
    };
  }

  add(text: string, line: number, column: number) {
    const index = this.texts.length;
    const positions = this.positions;
    if (index === positions.lines.length) {
      const grow = (items: Int32Array) => {
        const grown = new Int32Array(items.length * 2);
        grown.set(items);
        return grown;
      };
      positions.lines = grow(positions.lines);
      positions.columns = grow(positions.columns);
      positions.endColumns = grow(positions.endColumns);
    }
    positions.lines[index] = line;
    positions.columns[index] = column;
    positions.endColumns[index] = column + text.length - 1;
    this.texts.push(text);
    return index;
  }

  getRange(start: number, end: number): SourceRange {
    const positions = this.positions;
    return {
      module: positions.module,
      start: { line: positions.lines[start], column: positions.columns[start] },
      end: { line: positions.lines[end], column: positions.endColumns[end] },
    };
  }

  // A node's location at a token, whose range runs from one token to another, as the parser makes
  // it.
  getLocation(token: number, start: number, end: number) {
    const positions = this.positions;
    const location = new TokenLocation(positions.lines[token], positions.columns[token], positions);
    location.setRange(start, end);
    return location;
  }
}

// A copy of a node that the layout placed already, as the tree held it before: each node's copy
// placed where the node was, so that each place of a node the tree holds twice has a node of its
// own.
const copyPlaced = (expression: Expression, layout: Layout): Expression => {
  const copy = (item: Expression) => copyPlaced(item, layout);
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
            definitionCopy.location = layout.placements.get(definition) ?? INLINE;
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
  copied.location = layout.placements.get(expression) ?? INLINE;
  return copied;
};

// Writes an expression's tokens, the first after gap, unless the expression starts a line, and
// gives the expression laid out: itself, or its copy where the layout placed it already.
const writeExpression = (input: Expression, gap: number, writer: TokenWriter): Expression => {
  const layout = writer.layout;
  const expression =
    layout !== undefined && !(input.location instanceof Placement)
      ? copyPlaced(input, layout)
      : input;
  const placement = getNodePlacement(expression, writer);
  if (layout !== undefined && placement !== INLINE) layout.placements.set(expression, placement);
  const first = placement.indent === SPACE ? gap : placement.indent;
  if (placement.blankIndent >= 0) writer.writeBlankLine(placement.blankIndent);
  if (placement.isParenthesized) {
    const open = writer.write("(", first);
    writeTokens(expression, NO_GAP, writer);
    const close = writer.write(")", NO_GAP);
    if (layout !== undefined)
      parenthesizedRanges.set(expression, layout.table.getRange(open, close));
    return expression;
  }
  writeTokens(expression, first, writer);
  return expression;
};

// Writes expressions in order, after the first, with a separator before each of the rest.
const writeList = (items: Expression[], writer: TokenWriter, separator = ",", gap = NO_GAP) => {
  for (let position = 0; position < items.length; position++) {
    if (position > 0) writer.write(separator, separator === "," ? NO_GAP : SPACE);
    items[position] = writeExpression(items[position], position === 0 ? gap : SPACE, writer);
  }
};

const writeBounds = (bounds: Bound[], writer: TokenWriter, gap: number) =>
  bounds.forEach((item, position) => {
    if (position > 0) writer.write(",", NO_GAP);
    const pattern = item.pattern;
    const table = writer.layout?.table;
    if (pattern.kind === "Name") {
      const name = writer.write(pattern.name, position === 0 ? gap : SPACE);
      if (table !== undefined) pattern.ranges = [table.getRange(name, name)];
    } else {
      writer.write("<<", position === 0 ? gap : SPACE);
      const ranges = pattern.names.map((patternName, namePosition) => {
        if (namePosition > 0) writer.write(",", NO_GAP);
        const name = writer.write(patternName, namePosition === 0 ? NO_GAP : SPACE);
        return table?.getRange(name, name);
      });
      if (table !== undefined) pattern.ranges = ranges.flatMap((range) => range ?? []);
      writer.write(">>", NO_GAP);
    }
    writer.write("\\in", SPACE);
    item.set = writeExpression(item.set, SPACE, writer);
  });

// Gives a node the location at a token, whose range runs from one token to another, where the
// writer lays the tree out.
const locate = (
  node: { location: SourceLocation },
  writer: TokenWriter,
  token: number,
  start: number,
  end = writer.getCount() - 1,
) => {
  if (writer.layout !== undefined)
    node.location = writer.layout.table.getLocation(token, start, end);
};

const writeTokens = (expression: Expression, gap: number, writer: TokenWriter): void => {
  const table = writer.layout?.table;
  const start = writer.getCount();
  switch (expression.kind) {
    case "Number": {
      const token = writer.write(expression.text ?? String(expression.value), gap);
      locate(expression, writer, token, token);
      return;
    }
    case "String": {
      const token = writer.write(formatString(expression.value), gap);
      writer.layout?.strings.set(token, expression.value);
      locate(expression, writer, token, token);
      return;
    }
    case "Identifier":
    case "ExceptAt": {
      const token = writer.write(expression.kind === "Identifier" ? expression.name : "@", gap);
      locate(expression, writer, token, token);
      return;
    }
    case "Apply": {
      const args = expression.args;
      if (args.length === 2 && INFIX_OPERATORS.has(expression.operator)) {
        args[0] = writeExpression(args[0], gap, writer);
        const operator = writer.write(expression.operator, SPACE);
        args[1] = writeExpression(args[1], SPACE, writer);
        locate(expression, writer, operator, start);
        return;
      }
      if (args.length === 1 && (expression.operator === "-." || expression.operator === "~")) {
        const operator = writer.write(expression.operator === "-." ? "-" : "~", gap);
        args[0] = writeExpression(args[0], NO_GAP, writer);
        locate(expression, writer, operator, operator);
        return;
      }
      if (args.length === 1 && PREFIX_WORDS.has(expression.operator)) {
        const operator = writer.write(expression.operator, gap);
        args[0] = writeExpression(args[0], SPACE, writer);
        locate(expression, writer, operator, operator);
        return;
      }
      const name = writer.write(expression.operator, gap);
      const open = writer.write("(", NO_GAP);
      writeList(args, writer);
      const close = writer.write(")", NO_GAP);
      if (table !== undefined) expression.argumentsRange = table.getRange(open, close);
      locate(expression, writer, name, name);
      return;
    }
    case "And":
    case "Or": {
      const operands = expression.operands;
      const prefixEnds: { line: number; column: number }[] = [];
      let first = -1;
      operands.forEach((operand, position) => {
        if (position > 0) {
          const operator = writer.write(expression.kind === "And" ? "/\\" : "\\/", SPACE);
          if (first === -1) first = operator;
        }
        operands[position] = writeExpression(operand, position === 0 ? gap : SPACE, writer);
        if (position > 0 && table !== undefined) {
          prefixEnds.push(table.getRange(start, writer.getCount() - 1).end);
        }
      });
      if (table !== undefined) expression.prefixEnds = prefixEnds;
      locate(expression, writer, first, start);
      return;
    }
    case "If": {
      const keyword = writer.write("IF", gap);
      expression.condition = writeExpression(expression.condition, SPACE, writer);
      writer.write("THEN", SPACE);
      expression.consequent = writeExpression(expression.consequent, SPACE, writer);
      writer.write("ELSE", SPACE);
      expression.alternative = writeExpression(expression.alternative, SPACE, writer);
      locate(expression, writer, keyword, keyword);
      return;
    }
    case "Case": {
      const innerIndent = getNodePlacement(expression, writer).innerIndent;
      const keyword = writer.write("CASE", gap);
      expression.arms.forEach((arm, position) => {
        if (position > 0) writer.write("[]", innerIndent);
        arm.condition = writeExpression(arm.condition, SPACE, writer);
        writer.write("->", SPACE);
        arm.body = writeExpression(arm.body, SPACE, writer);
      });
      if (expression.other !== undefined) {
        writer.write("[]", innerIndent);
        const other = writer.write("OTHER", SPACE);
        writer.write("->", SPACE);
        expression.other = writeExpression(expression.other, SPACE, writer);
        if (table !== undefined)
          expression.otherRange = table.getRange(other, writer.getCount() - 1);
      }
      locate(expression, writer, keyword, keyword);
      return;
    }
    case "Let": {
      const keyword = writer.write("LET", gap);
      expression.definitions.forEach((definition) => {
        if (definition.kind !== "Operator") {
          throw new TlaUnsupportedError("tla-ts can't print a LET of a function's definition");
        }
        writeDefinition(definition, SPACE, writer);
      });
      writer.write("IN", getNodePlacement(expression, writer).innerIndent);
      expression.body = writeExpression(expression.body, SPACE, writer);
      locate(expression, writer, keyword, keyword);
      return;
    }
    case "Tuple":
    case "SetEnumeration": {
      const isTuple = expression.kind === "Tuple";
      const open = writer.write(isTuple ? "<<" : "{", gap);
      writeList(expression.elements, writer);
      writer.write(isTuple ? ">>" : "}", NO_GAP);
      locate(expression, writer, open, open);
      return;
    }
    case "Record":
    case "RecordSet": {
      const open = writer.write("[", gap);
      expression.fields.forEach((field, position) => {
        if (position > 0) writer.write(",", NO_GAP);
        const name = writer.write(field.name, position === 0 ? NO_GAP : SPACE);
        locate(field, writer, name, name);
        writer.write(expression.kind === "Record" ? "|->" : ":", SPACE);
        field.value = writeExpression(field.value, SPACE, writer);
      });
      writer.write("]", NO_GAP);
      locate(expression, writer, open, open);
      return;
    }
    case "Except": {
      const open = writer.write("[", gap);
      expression.function = writeExpression(expression.function, NO_GAP, writer);
      writer.write("EXCEPT", SPACE);
      expression.updates.forEach((update, position) => {
        if (position > 0) writer.write(",", NO_GAP);
        // The tokens where the update's heirs start, as the parser's ExceptSpec holds them.
        const heirStarts = [writer.write("!", SPACE)];
        update.path.forEach((step) => {
          if (step.kind === "Field") {
            heirStarts.push(writer.write(".", NO_GAP));
            writer.write(step.name, NO_GAP);
            return;
          }
          heirStarts.push(writer.write("[", NO_GAP));
          writeList(step.args, writer);
          writer.write("]", NO_GAP);
        });
        const equals = writer.write("=", SPACE);
        heirStarts.push(equals, equals + 1);
        update.value = writeExpression(update.value, SPACE, writer);
        heirStarts.push(writer.getCount());
        if (table === undefined) return;
        const getHeirRange = (index: number) =>
          table.getRange(heirStarts[index], heirStarts[index + 1] - 1);
        update.path.forEach((step, index) => {
          // SANY's Generator locates the $Tuple of component i at heir 2i + 1 of its ExceptSpec,
          // as the parser does.
          if (step.kind === "Index") {
            step.tupleRange = getHeirRange(
              2 * index + 1 < heirStarts.length - 1 ? 2 * index + 1 : index + 1,
            );
          }
        });
        update.range = table.getRange(heirStarts[0], writer.getCount() - 1);
      });
      writer.write("]", NO_GAP);
      locate(expression, writer, open, open);
      return;
    }
    case "FunctionApplication": {
      expression.function = writeExpression(expression.function, gap, writer);
      const open = writer.write("[", NO_GAP);
      writeList(expression.args, writer);
      writer.write("]", NO_GAP);
      locate(expression, writer, open, start);
      return;
    }
    case "FieldAccess": {
      expression.record = writeExpression(expression.record, gap, writer);
      const dot = writer.write(".", NO_GAP);
      writer.write(expression.field, NO_GAP);
      locate(expression, writer, dot, start);
      return;
    }
    case "FunctionConstruction": {
      const open = writer.write("[", gap);
      writeBounds(expression.bounds, writer, NO_GAP);
      writer.write("|->", SPACE);
      expression.body = writeExpression(expression.body, SPACE, writer);
      writer.write("]", NO_GAP);
      locate(expression, writer, open, open);
      return;
    }
    case "Forall":
    case "Exists": {
      const keyword = writer.write(expression.kind === "Forall" ? "\\A" : "\\E", gap);
      writeBounds(expression.bounds, writer, SPACE);
      writer.write(":", SPACE);
      expression.body = writeExpression(expression.body, SPACE, writer);
      locate(expression, writer, keyword, keyword);
      return;
    }
    default:
      throw new TlaUnsupportedError(`tla-ts can't print a ${expression.kind} expression of code`);
  }
};

// Writes a definition's tokens, the first after gap, unless the definition starts a line, and lays
// it out as the parser reads it where the writer lays the tree out.
const writeDefinition = (definition: OperatorDefinition, gap: number, writer: TokenWriter) => {
  const layout = writer.layout;
  const placement = getNodePlacement(definition, writer);
  if (layout !== undefined && placement !== INLINE) layout.placements.set(definition, placement);
  const name = writer.write(definition.name, placement.indent === SPACE ? gap : placement.indent);
  const params = definition.params.map((param, position) => {
    if (position === 0) writer.write("(", NO_GAP);
    else writer.write(",", NO_GAP);
    return writer.write(param.name, position === 0 ? NO_GAP : SPACE);
  });
  if (params.length > 0) writer.write(")", NO_GAP);
  const head = writer.getCount() - 1;
  writer.write("==", SPACE);
  const bodyStart = writer.getCount();
  definition.body = writeExpression(definition.body, SPACE, writer);
  if (layout === undefined) return;
  const table = layout.table;
  definition.params.forEach((param, position) => {
    param.location = table.getLocation(params[position], params[position], params[position]);
  });
  definition.head = table.getRange(name, head);
  definition.bodyRange = table.getRange(bodyStart, writer.getCount() - 1);
  locate(definition, writer, name, name);
};

// The text of tokens, each after its gap, of a tree that a layout placed where placements give.
const createTextWriter = (placements?: ReadonlyMap<object, Placement>) => {
  const parts: string[] = [];
  let count = 0;
  const writer: TokenWriter = {
    placements,
    writeBlankLine: (indent) => {
      parts.push(`\n${" ".repeat(indent)}`);
    },
    write: (text, gap) => {
      if (gap === SPACE) parts.push(" ");
      else if (gap >= 0) parts.push(`\n${" ".repeat(gap)}`);
      parts.push(text);
      count += 1;
      return count - 1;
    },
    getCount: () => count,
  };
  return { writer, getText: () => parts.join("") };
};

// A definition's text, as a module holds it on lines of its own, where a layout that placed it
// gives the placements.
export const printCodeDefinition = (
  definition: OperatorDefinition,
  placements?: ReadonlyMap<object, Placement>,
) => {
  const text = createTextWriter(placements);
  writeDefinition(definition, NO_GAP, text.writer);
  return text.getText();
};

// The characters of a definition's text.
export const getCodeLength = (definition: OperatorDefinition) => {
  let length = 0;
  let count = 0;
  writeDefinition(definition, NO_GAP, {
    writeBlankLine: (indent) => {
      length += indent + 1;
    },
    write: (text, gap) => {
      length += text.length + (gap === SPACE ? 1 : gap >= 0 ? gap + 1 : 0);
      count += 1;
      return count - 1;
    },
    getCount: () => count,
  });
  return length;
};

export const printCodeExpression = (expression: Expression) => {
  const text = createTextWriter();
  writeExpression(expression, NO_GAP, text.writer);
  return text.getText();
};

const CAPITALIZED = /\b[A-Z]\w*\b/g;

const NAME = /^[A-Za-z_]\w*$/;

// Each capitalized word of an expression's text, as \b[A-Z]\w*\b finds them in it, in order, and
// whether it's in a string: the names of definitions, which no other word is.
export const forEachCodeName = (
  expression: Expression,
  visit: (name: string, isInString: boolean) => void,
) => {
  let count = 0;
  writeExpression(expression, NO_GAP, {
    writeBlankLine: () => undefined,
    write: (text) => {
      const first = text.charCodeAt(0);
      // A capital starts a name, a quote a string, and a backslash an operator such as \E.
      if (first >= 65 && first <= 90 && NAME.test(text)) visit(text, false);
      else if (first === 34 || first === 92 || (first >= 65 && first <= 90)) {
        for (const match of text.matchAll(CAPITALIZED)) visit(match[0], first === 34);
      }
      count += 1;
      return count - 1;
    },
    getCount: () => count,
  });
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

// The children of an expression, in the order its text has them, each replaced in place by what
// replace gives for it.
export const replaceCodeChildren = (
  expression: Expression,
  replace: (child: Expression) => Expression,
): void => {
  const replaceAll = (items: Expression[]) => {
    for (let position = 0; position < items.length; position++) {
      items[position] = replace(items[position]);
    }
  };
  const replaceBounds = (bounds: Bound[]) =>
    bounds.forEach((item) => {
      item.set = replace(item.set);
    });
  switch (expression.kind) {
    case "Apply":
      replaceAll(expression.args);
      return;
    case "And":
    case "Or":
      replaceAll(expression.operands);
      return;
    case "Tuple":
    case "SetEnumeration":
      replaceAll(expression.elements);
      return;
    case "If":
      expression.condition = replace(expression.condition);
      expression.consequent = replace(expression.consequent);
      expression.alternative = replace(expression.alternative);
      return;
    case "Case":
      expression.arms.forEach((arm) => {
        arm.condition = replace(arm.condition);
        arm.body = replace(arm.body);
      });
      if (expression.other !== undefined) expression.other = replace(expression.other);
      return;
    case "Let":
      expression.definitions.forEach((definition) => {
        definition.body = replace(definition.body);
      });
      expression.body = replace(expression.body);
      return;
    case "Record":
    case "RecordSet":
      expression.fields.forEach((field) => {
        field.value = replace(field.value);
      });
      return;
    case "Except":
      expression.function = replace(expression.function);
      expression.updates.forEach((update) => {
        update.path.forEach((step) => {
          if (step.kind === "Index") replaceAll(step.args);
        });
        update.value = replace(update.value);
      });
      return;
    case "FunctionApplication":
      expression.function = replace(expression.function);
      replaceAll(expression.args);
      return;
    case "FieldAccess":
      expression.record = replace(expression.record);
      return;
    case "FunctionConstruction":
    case "Forall":
    case "Exists":
      replaceBounds(expression.bounds);
      expression.body = replace(expression.body);
      return;
    case "SetMap":
      expression.expression = replace(expression.expression);
      replaceBounds(expression.bounds);
      return;
    case "SetFilter":
      expression.bound.set = replace(expression.bound.set);
      expression.predicate = replace(expression.predicate);
      return;
    case "Choose":
      if (expression.set !== undefined) expression.set = replace(expression.set);
      expression.body = replace(expression.body);
      return;
    case "Lambda":
      expression.body = replace(expression.body);
      return;
    default:
      return;
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
// nodes, and the text parsed where it is, with the lines of the trees blank; and the texts that its
// tokens add to TLC's order of strings.
export const layOutModule = (name: string, parts: readonly (string | OperatorDefinition)[]) => {
  const table = new LaidOutTable(name);
  const layout: Layout = { table, placements: new Map(), strings: new Map() };
  let line = 1;
  let column = 1;
  const writer: TokenWriter = {
    writeBlankLine: () => {
      line += 1;
    },
    write: (text, gap) => {
      if (gap === SPACE) column += 1;
      else if (gap >= 0) {
        line += 1;
        column = gap + 1;
      }
      const index = table.add(text, line, column);
      column += text.length;
      return index;
    },
    getCount: () => table.texts.length,
    layout,
  };
  // The text's lines, with each tree's blank, and where each tree's tokens start and end.
  const lines: string[] = [];
  const trees: { definition: OperatorDefinition; start: number; end: number }[] = [];
  for (const part of parts) {
    if (typeof part === "string") {
      for (const partLine of part.split("\n")) lines.push(partLine);
      continue;
    }
    line = lines.length + 1;
    column = 1;
    const start = table.texts.length;
    writeDefinition(part, NO_GAP, writer);
    trees.push({ definition: part, start, end: table.texts.length });
    for (let blank = lines.length + 1; blank <= line; blank++) lines.push("");
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
  const parsed: string[] = [];
  const strings: string[] = [];
  let position = 0;
  const addTokens = (end: number) => {
    const slice = tokens.slice(position, end);
    position = end;
    for (const parsedText of getParsedTexts(slice)) parsed.push(parsedText);
    for (const token of slice) if (token.kind === "String") strings.push(token.text);
  };
  for (const tree of trees) {
    const treeLine = table.positions.lines[tree.start];
    let end = position;
    while (end < tokens.length && tokens[end].line < treeLine) end++;
    addTokens(end);
    for (let index = tree.start; index < tree.end; index++) {
      parsed.push(table.texts[index]);
      const value = layout.strings.get(index);
      if (value !== undefined) strings.push(value);
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
    texts: { parsed: [...new Set(parsed)], strings: [...new Set(strings)] },
    placements: layout.placements,
  };
};
