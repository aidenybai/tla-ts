import type { Bound, BoundPattern, Definition, ExceptPathStep, Expression, Module } from "./ast";
import { TlaUnsupportedError } from "./errors";
import { INFIX_OPERATORS } from "./parser";

interface Precedence {
  low: number;
  high: number;
}

const PREFIX_OPERATORS = new Map([
  ["~", { text: "~", precedence: 4 }],
  ["-.", { text: "-", precedence: 12 }],
  ["DOMAIN", { text: "DOMAIN ", precedence: 9 }],
  ["SUBSET", { text: "SUBSET ", precedence: 8 }],
  ["UNION", { text: "UNION ", precedence: 8 }],
]);

const JUNCTION: Precedence = { low: 3, high: 3 };

const PRODUCT: Precedence = { low: 10, high: 13 };

const ESCAPES = new Map([
  ["\\", "\\\\"],
  ['"', '\\"'],
  ["\n", "\\n"],
  ["\t", "\\t"],
  ["\r", "\\r"],
  ["\f", "\\f"],
]);

export const formatString = (value: string) =>
  `"${value.replace(/[\\"\n\t\r\f]/g, (character) => ESCAPES.get(character) ?? character)}"`;

const concat = (...parts: (string | string[])[]) =>
  parts.reduce<string[]>(
    (lines, part) => {
      const next = typeof part === "string" ? [part] : part;
      const last = lines[lines.length - 1];
      const padding = " ".repeat(last.length);
      return [
        ...lines.slice(0, -1),
        last + next[0],
        ...next.slice(1).map((line) => padding + line),
      ];
    },
    [""],
  );

const join = (items: string[][], separator: string) =>
  items.length === 0
    ? [""]
    : concat(...items.flatMap((item, index) => (index === 0 ? [item] : [separator, item])));

const isBulletedJunction = (expression: Expression, operands: string[][]) =>
  (expression.kind === "And" || expression.kind === "Or") &&
  (operands.length === 1 ||
    expression.isBulleted === true ||
    operands.some((operand) => operand.length > 1));

const getInfix = (expression: Expression) =>
  expression.kind === "Apply" && expression.args.length === 2
    ? INFIX_OPERATORS.get(expression.operator)
    : undefined;

const getPrefix = (expression: Expression) =>
  expression.kind === "Apply" && expression.args.length === 1
    ? PREFIX_OPERATORS.get(expression.operator)
    : undefined;

const isAtomic = (expression: Expression): boolean => {
  switch (expression.kind) {
    case "Apply":
      return getInfix(expression) === undefined && getPrefix(expression) === undefined;
    case "Prime":
      return isAtomic(expression.expression);
    case "Number":
      return expression.value >= 0;
    case "Identifier":
    case "Decimal":
    case "String":
    case "OperatorReference":
    case "ExceptAt":
    case "Tuple":
    case "SetEnumeration":
    case "SetFilter":
    case "SetMap":
    case "Record":
    case "RecordSet":
    case "FunctionConstruction":
    case "FunctionSet":
    case "Except":
    case "FunctionApplication":
    case "FieldAccess":
    case "BoxAction":
    case "AngleAction":
    case "WeakFairness":
    case "StrongFairness":
      return true;
    default:
      return false;
  }
};

const printPattern = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? pattern.name : `<<${pattern.names.join(", ")}>>`;

const printBounds = (bounds: Bound[]) =>
  join(
    bounds.map((bound) => concat(`${printPattern(bound.pattern)} \\in `, print(bound.set))),
    ", ",
  );

const printPath = (step: ExceptPathStep) =>
  step.kind === "Field" ? [`.${step.name}`] : concat("[", join(step.args.map(print), ", "), "]");

const parenthesize = (lines: string[]) => concat("(", lines, ")");

const printOperand = (
  expression: Expression,
  parent: Precedence,
  isLeftOfSame = false,
): string[] => {
  const lines = print(expression);
  if (isAtomic(expression)) return lines;
  const infix = getInfix(expression);
  if (infix !== undefined && (infix.low > parent.high || isLeftOfSame)) return lines;
  const prefix = getPrefix(expression);
  if (prefix !== undefined && prefix.precedence > parent.high) return lines;
  if (expression.kind === "Product" && PRODUCT.low > parent.high) return lines;
  return parenthesize(lines);
};

const printAtom = (expression: Expression) =>
  isAtomic(expression) && expression.kind !== "Prime"
    ? print(expression)
    : parenthesize(print(expression));

const printIf = (condition: string[], consequent: string[], alternative: string[]) => {
  const inline = `IF ${condition[0]} THEN ${consequent[0]} ELSE ${alternative[0]}`;
  return [condition, consequent, alternative].every((part) => part.length === 1) &&
    inline.length <= 80
    ? [inline]
    : [
        ...concat("IF ", condition),
        ...concat("THEN ", consequent),
        ...concat("ELSE ", alternative),
      ];
};

const print = (expression: Expression): string[] => {
  switch (expression.kind) {
    case "Number":
      return [expression.text ?? String(expression.value)];
    case "Decimal":
      return [expression.text];
    case "String":
      return [formatString(expression.value)];
    case "Identifier":
      return [expression.name];
    case "OperatorReference":
      return [expression.operator];
    case "ExceptAt":
      return ["@"];
    case "Apply": {
      const infix = getInfix(expression);
      if (infix !== undefined) {
        return concat(
          printOperand(
            expression.args[0],
            infix,
            infix.isAssociative && getInfix(expression.args[0]) === infix,
          ),
          ` ${expression.operator} `,
          printOperand(expression.args[1], infix),
        );
      }
      const prefix = getPrefix(expression);
      if (prefix !== undefined) {
        return concat(
          prefix.text,
          printOperand(expression.args[0], { low: prefix.precedence, high: prefix.precedence }),
        );
      }
      return concat(`${expression.operator}(`, join(expression.args.map(print), ", "), ")");
    }
    case "Lambda":
      return concat(`LAMBDA ${expression.params.join(", ")} : `, print(expression.body));
    case "And":
    case "Or": {
      const operands = expression.operands.map(print);
      const symbol = expression.kind === "And" ? "/\\" : "\\/";
      if (isBulletedJunction(expression, operands)) {
        return operands.flatMap((operand) => concat(`${symbol} `, operand));
      }
      return join(
        expression.operands.map((operand) => printOperand(operand, JUNCTION)),
        ` ${symbol} `,
      );
    }
    case "Prime":
      return concat(printAtom(expression.expression), "'");
    case "Unchanged":
      return concat("UNCHANGED ", printAtom(expression.expression));
    case "Enabled":
      return concat("ENABLED ", printAtom(expression.expression));
    case "Always":
      return concat("[]", printAtom(expression.expression));
    case "Eventually":
      return concat("<>", printAtom(expression.expression));
    case "If":
      return printIf(
        print(expression.condition),
        print(expression.consequent),
        print(expression.alternative),
      );
    case "Case": {
      const arms = [
        ...expression.arms.map((arm) => concat(print(arm.condition), " -> ", print(arm.body))),
        ...(expression.other === undefined ? [] : [concat("OTHER -> ", print(expression.other))]),
      ];
      return arms.flatMap((arm, index) => concat(index === 0 ? "CASE " : "  [] ", arm));
    }
    case "Let":
      if (expression.instances !== undefined && expression.instances.length > 0) {
        throw new TlaUnsupportedError("tla-ts can't print a LET that instantiates a module");
      }
      return [
        ...expression.definitions.flatMap((definition, index) =>
          concat(index === 0 ? "LET " : "    ", printDefinition(definition)),
        ),
        ...concat("IN  ", print(expression.body)),
      ];
    case "Forall":
    case "Exists":
      return concat(
        expression.kind === "Forall" ? "\\A " : "\\E ",
        printBounds(expression.bounds),
        " : ",
        print(expression.body),
      );
    case "UnboundedQuantifier":
      return concat(
        `${expression.quantifier === "Forall" ? "\\A" : "\\E"}${expression.isTemporal ? "\\E" : ""} `,
        expression.names.join(", "),
        " : ",
        print(expression.body),
      );
    case "Choose":
      return concat(
        `CHOOSE ${printPattern(expression.pattern)}`,
        expression.set === undefined ? "" : concat(" \\in ", print(expression.set)),
        " : ",
        print(expression.body),
      );
    case "SetEnumeration":
      return concat("{", join(expression.elements.map(print), ", "), "}");
    case "Tuple":
      return concat("<<", join(expression.elements.map(print), ", "), ">>");
    case "SetFilter":
      return concat("{", printBounds([expression.bound]), " : ", print(expression.predicate), "}");
    case "SetMap":
      return concat("{", print(expression.expression), " : ", printBounds(expression.bounds), "}");
    case "FunctionConstruction":
      return concat("[", printBounds(expression.bounds), " |-> ", print(expression.body), "]");
    case "FunctionSet":
      return concat("[", print(expression.domain), " -> ", print(expression.range), "]");
    case "Record":
    case "RecordSet":
      return concat(
        "[",
        join(
          expression.fields.map((field) =>
            concat(
              `${field.name} ${expression.kind === "Record" ? "|->" : ":"} `,
              print(field.value),
            ),
          ),
          ", ",
        ),
        "]",
      );
    case "Except":
      return concat(
        "[",
        print(expression.function),
        " EXCEPT ",
        join(
          expression.updates.map((update) =>
            concat("!", ...update.path.map(printPath), " = ", print(update.value)),
          ),
          ", ",
        ),
        "]",
      );
    case "FunctionApplication":
      return concat(
        printAtom(expression.function),
        "[",
        join(expression.args.map(print), ", "),
        "]",
      );
    case "FieldAccess":
      return concat(printAtom(expression.record), `.${expression.field}`);
    case "Product":
      return join(
        expression.factors.map((factor) => printOperand(factor, PRODUCT)),
        " \\X ",
      );
    case "BoxAction":
      return concat("[", print(expression.action), "]_", printAtom(expression.subscript));
    case "AngleAction":
      return concat("<<", print(expression.action), ">>_", printAtom(expression.subscript));
    case "WeakFairness":
    case "StrongFairness":
      return concat(
        expression.kind === "WeakFairness" ? "WF_" : "SF_",
        printAtom(expression.subscript),
        "(",
        print(expression.action),
        ")",
      );
    default:
      throw new TlaUnsupportedError(`tla-ts can't print a ${expression.kind} expression`);
  }
};

const printDefinition = (definition: Definition) => {
  const head =
    definition.kind === "Function"
      ? concat(definition.name, "[", printBounds(definition.bounds), "]")
      : [
          definition.params.length === 0
            ? definition.name
            : `${definition.name}(${definition.params.map(formatParameter).join(", ")})`,
        ];
  return concat(head, " == ", print(definition.body));
};

const formatParameter = (parameter: { name: string; arity: number }) =>
  parameter.arity === 0
    ? parameter.name
    : `${parameter.name}(${Array.from({ length: parameter.arity }, () => "_").join(", ")})`;

export const printModule = (module: Module) =>
  [
    `---- MODULE ${module.name} ----`,
    ...(module.extends.length > 0 ? [`EXTENDS ${module.extends.join(", ")}`] : []),
    ...module.units.flatMap((unit) => {
      switch (unit.kind) {
        case "Constants":
          return [`CONSTANTS ${unit.declarations.map(formatParameter).join(", ")}`];
        case "Variables":
          return [`VARIABLES ${unit.declarations.map(formatParameter).join(", ")}`];
        case "Recursive":
          return [`RECURSIVE ${unit.declarations.map(formatParameter).join(", ")}`];
        case "Definition":
          return printDefinition(unit.definition);
        case "Assumption": {
          const name = unit.assumption.name;
          return concat(
            name === undefined ? "ASSUME " : `ASSUME ${name} == `,
            print(unit.assumption.expression),
          );
        }
        default:
          throw new TlaUnsupportedError(`tla-ts can't print a module's ${unit.kind}`);
      }
    }),
    "====",
  ].join("\n");
