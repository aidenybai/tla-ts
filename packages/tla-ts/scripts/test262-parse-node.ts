import { readFileSync } from "node:fs";
import { join } from "node:path";
import { refineLeftHandSideExpression, TV } from "@engine262/engine262";
import type { ParseNodesByType } from "@engine262/engine262";
import { createRecord, createTuple, rankString } from "../src/values";
import type { Value } from "../src/values";

const PARSE_NODE_PATH = join(
  import.meta.dirname,
  "../node_modules/@engine262/engine262/src/parser/ParseNode.mts",
);

export interface ParseNode {
  type: string;
  [field: string]: unknown;
}

const getNodeFields = () => {
  const text = readFileSync(PARSE_NODE_PATH, "utf8");
  const nodeFields = new Map<string, Map<string, boolean>>();
  for (const block of text.split(/\n\s*export (?:interface|type) /).slice(1)) {
    const body = block.slice(0, block.search(/\n\s{0,4}}/) + 1);
    const types = [...body.matchAll(/^\s*(?:readonly )?type: '([^']+)'/gm)].map(
      (match) => match[1],
    );
    if (types.length !== 1) continue;
    const fields = nodeFields.get(types[0]) ?? new Map<string, boolean>();
    for (const match of body.matchAll(/^\s*(?:readonly )?([A-Za-z_]+)\??: ([^;]+);/gm)) {
      if (match[1] !== "type") fields.set(match[1], ["boolean", "true"].includes(match[2].trim()));
    }
    nodeFields.set(types[0], fields);
  }
  nodeFields.set(
    "AssignmentProperty",
    new Map(
      ["IdentifierReference", "Initializer", "PropertyName", "AssignmentElement"].map((name) => [
        name,
        false,
      ]),
    ),
  );
  return nodeFields;
};

const ENUM_FIELDS = new Set([
  "type",
  "operator",
  "MultiplicativeOperator",
  "AssignmentOperator",
  "LetOrConst",
  "production",
  "Phase",
  "subtype",
]);
const DROPPED_FIELDS = new Set([
  "location",
  "parent",
  "directives",
  "escaped",
  "arrowInfo",
  "hasTrailingComma",
  "sourceText",
]);
const SOURCE_TEXT_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "GeneratorDeclaration",
  "GeneratorExpression",
  "AsyncFunctionDeclaration",
  "AsyncFunctionExpression",
  "AsyncGeneratorDeclaration",
  "AsyncGeneratorExpression",
  "ArrowFunction",
  "AsyncArrowFunction",
  "MethodDefinition",
  "GeneratorMethod",
  "AsyncMethod",
  "AsyncGeneratorMethod",
  "ClassDeclaration",
  "ClassExpression",
]);
const DESTRUCTURING_TYPES = new Set(["ObjectLiteral", "ArrayLiteral"]);
const PARAMETER_FIELDS = new Set([
  "FormalParameters",
  "UniqueFormalParameters",
  "PropertySetParameterList",
]);
const BODY_FIELDS = new Set([
  "FunctionBody",
  "GeneratorBody",
  "AsyncBody",
  "AsyncGeneratorBody",
  "ClassStaticBlockBody",
]);
const FOR_IN_OF_TYPES = new Set(["ForInStatement", "ForOfStatement", "ForAwaitStatement"]);

export const isParseNode = (value: unknown): value is ParseNode =>
  typeof value === "object" && value !== null && typeof Reflect.get(value, "type") === "string";

const USING_TYPES = new Set(["UsingDeclaration", "AwaitUsingDeclaration"]);

const TAIL_FIELDS = new Map([
  ["FunctionBody", ["FunctionStatementList"]],
  ["ConciseBody", ["ExpressionBody"]],
  ["ExpressionBody", ["AssignmentExpression"]],
  ["Block", ["StatementList"]],
  ["IfStatement", ["Statement", "Statement_a", "Statement_b"]],
  ["DoWhileStatement", ["Statement"]],
  ["WhileStatement", ["Statement"]],
  ["ForStatement", ["Statement"]],
  ["ForInStatement", ["Statement"]],
  ["WithStatement", ["Statement"]],
  ["LabelledStatement", ["LabelledItem"]],
  ["ReturnStatement", ["Expression"]],
  ["SwitchStatement", ["CaseBlock"]],
  ["CaseBlock", ["CaseClauses", "CaseClauses_a", "DefaultClause", "CaseClauses_b"]],
  ["CaseClause", ["StatementList"]],
  ["DefaultClause", ["StatementList"]],
  ["ConditionalExpression", ["AssignmentExpression_a", "AssignmentExpression_b"]],
  ["LogicalANDExpression", ["BitwiseORExpression"]],
  ["LogicalORExpression", ["LogicalANDExpression"]],
  ["CoalesceExpression", ["BitwiseORExpression"]],
  ["ParenthesizedExpression", ["Expression"]],
]);

const addTailCalls = (value: unknown, tailCalls: WeakSet<object>): void => {
  if (Array.isArray(value)) {
    const usingIndex = value.findIndex((item) => isParseNode(item) && USING_TYPES.has(item.type));
    for (const item of usingIndex === -1 ? value : value.slice(0, usingIndex)) {
      addTailCalls(item, tailCalls);
    }
    return;
  }
  if (!isParseNode(value)) return;
  if (value.type === "CallExpression" || value.type === "TaggedTemplateExpression") {
    tailCalls.add(value);
  } else if (value.type === "CommaOperator" && Array.isArray(value.ExpressionList)) {
    addTailCalls(value.ExpressionList.at(-1), tailCalls);
  } else if (value.type === "TryStatement") {
    addTailCalls(
      value.Finally ?? (isParseNode(value.Catch) ? value.Catch.Block : undefined),
      tailCalls,
    );
  } else if (
    value.type !== "ForStatement" ||
    !isParseNode(value.LexicalDeclaration) ||
    !USING_TYPES.has(value.LexicalDeclaration.type)
  ) {
    for (const field of TAIL_FIELDS.get(value.type) ?? []) addTailCalls(value[field], tailCalls);
  }
};

const getIsEvalCallee = (value: unknown): boolean =>
  isParseNode(value) &&
  (value.type === "ParenthesizedExpression"
    ? getIsEvalCallee(value.Expression)
    : value.type === "IdentifierReference" && value.name === "eval");

const getMayUseArguments = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(getMayUseArguments);
  if (!isParseNode(value)) return false;
  if (value.type === "IdentifierReference") return value.name === "arguments";
  if (value.type === "CallExpression" && getIsEvalCallee(value.CallExpression)) return true;
  return Object.entries(value).some(
    ([name, child]) =>
      !DROPPED_FIELDS.has(name) &&
      !PARAMETER_FIELDS.has(name) &&
      !BODY_FIELDS.has(name) &&
      getMayUseArguments(child),
  );
};

export const getCodeUnits = (text: string) =>
  createTuple(Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)));

const getBigNat = (value: bigint) => {
  const limbs: number[] = [];
  for (let rest = value; rest > 0n; rest >>= 15n) limbs.push(Number(rest & 32767n));
  return createTuple(limbs);
};

const createNumberRecord = (
  kind: string,
  isNegative: boolean,
  integer: number,
  mantissa: bigint,
  exponent: number,
) =>
  createRecord([
    ["k", kind],
    ["neg", isNegative],
    ["i", integer],
    ["m", getBigNat(mantissa)],
    ["e", exponent],
  ]);

const getNumberRecord = (value: number) => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const bits = view.getBigUint64(0);
  const isNegative = bits >> 63n === 1n;
  const biasedExponent = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  if (biasedExponent === 0x7ff) {
    return fraction === 0n
      ? createNumberRecord("inf", isNegative, 0, 0n, 0)
      : createNumberRecord("nan", false, 0, 0n, 0);
  }
  if (Object.is(value, -0)) return createNumberRecord("nzero", true, 0, 0n, 0);
  if (Number.isInteger(value) && Math.abs(value) < 2 ** 30) {
    return createNumberRecord("int", value < 0, value, 0n, 0);
  }
  const significand = biasedExponent === 0 ? fraction : fraction | (1n << 52n);
  const binary = significand.toString(2);
  const zeros = binary.length - binary.replace(/0+$/, "").length;
  return createNumberRecord(
    "fin",
    isNegative,
    0,
    significand >> BigInt(zeros),
    Math.max(biasedExponent, 1) - 1075 + zeros,
  );
};

const isDestructuringLiteral = (
  value: unknown,
): value is ParseNodesByType["ObjectLiteral"] | ParseNodesByType["ArrayLiteral"] =>
  isParseNode(value) && DESTRUCTURING_TYPES.has(value.type);

const refineTarget = (node: unknown): unknown => {
  if (!isDestructuringLiteral(node)) return node;
  const refined: unknown = refineLeftHandSideExpression(node);
  return isParseNode(refined) ? refinePattern(refined) : refined;
};

const refinePattern = (pattern: ParseNode): ParseNode => {
  const getList = (field: string) => {
    const list = pattern[field];
    return Array.isArray(list)
      ? list.map((item) => (isParseNode(item) ? refinePattern(item) : item))
      : list;
  };
  const getTarget = (field: string) => {
    const element = pattern[field];
    return isParseNode(element) ? refinePattern(element) : element;
  };
  switch (pattern.type) {
    case "ObjectAssignmentPattern":
      return {
        ...pattern,
        AssignmentPropertyList: getList("AssignmentPropertyList"),
        AssignmentRestProperty: getTarget("AssignmentRestProperty"),
      };
    case "ArrayAssignmentPattern":
      return {
        ...pattern,
        AssignmentElementList: getList("AssignmentElementList"),
        AssignmentRestElement: getTarget("AssignmentRestElement"),
      };
    case "AssignmentProperty":
      return { ...pattern, AssignmentElement: getTarget("AssignmentElement") };
    case "AssignmentElement":
    case "AssignmentRestProperty":
      return {
        ...pattern,
        DestructuringAssignmentTarget: refineTarget(pattern.DestructuringAssignmentTarget),
      };
    case "AssignmentRestElement":
      return { ...pattern, AssignmentExpression: refineTarget(pattern.AssignmentExpression) };
    default:
      return pattern;
  }
};

export const createConverter = (none: Value) => {
  const nodeFields = getNodeFields();
  let siteCount = 0;
  const argumentUses = new WeakMap<object, boolean>();
  const tailCalls = new WeakSet<object>();
  const convert = (value: unknown, field?: string): Value => {
    if (value === null || value === undefined) return none;
    if (typeof value === "boolean") return value;
    if (typeof value === "string")
      return field && ENUM_FIELDS.has(field) ? rankString(value) : getCodeUnits(value);
    if (typeof value === "number")
      return createRecord([
        ["type", "number"],
        ["value", getNumberRecord(value)],
      ]);
    if (typeof value === "bigint") {
      const magnitude = value < 0n ? -value : value;
      return createRecord([
        ["type", "bigint"],
        [
          "value",
          createRecord([
            ["neg", value < 0n],
            ["mag", getBigNat(magnitude)],
          ]),
        ],
      ]);
    }
    if (Array.isArray(value)) return createTuple(value.map((item) => convert(item)));
    if (!isParseNode(value)) throw new Error(`Unexpected parse value ${String(value)}`);
    const isAssignmentTarget =
      (value.type === "AssignmentExpression" && value.AssignmentOperator === "=") ||
      FOR_IN_OF_TYPES.has(value.type);
    const node = isAssignmentTarget
      ? { ...value, LeftHandSideExpression: refineTarget(value.LeftHandSideExpression) }
      : value;
    const bodyField = Object.keys(node).find((name) => BODY_FIELDS.has(name));
    const body = bodyField === undefined ? undefined : node[bodyField];
    if (isParseNode(body)) {
      argumentUses.set(
        body,
        Object.entries(node).some(
          ([name, child]) =>
            (PARAMETER_FIELDS.has(name) || name === bodyField) && getMayUseArguments(child),
        ),
      );
    }
    if ((node.type === "FunctionBody" || node.type === "ConciseBody") && node.strict === true) {
      addTailCalls(node, tailCalls);
    }
    const fields = new Map<string, Value>();
    for (const [name, isBoolean] of nodeFields.get(node.type) ?? []) {
      if (!DROPPED_FIELDS.has(name)) fields.set(rankString(name), isBoolean ? false : none);
    }
    for (const [name, child] of Object.entries(node)) {
      if (!DROPPED_FIELDS.has(name)) fields.set(rankString(name), convert(child, name));
    }
    if (node.type === "TemplateLiteral" && Array.isArray(node.TemplateSpanList)) {
      fields.set(
        rankString("TemplateCookedList"),
        createTuple(
          node.TemplateSpanList.map((raw: string) => {
            const cooked = TV(raw);
            return cooked === undefined ? none : getCodeUnits(cooked);
          }),
        ),
      );
      fields.set(
        rankString("TemplateRawList"),
        createTuple(
          node.TemplateSpanList.map((raw: string) => getCodeUnits(raw.replace(/\r\n?/g, "\n"))),
        ),
      );
    }
    if (node.type === "TemplateLiteral" || node.type === "FunctionDeclaration") {
      siteCount += 1;
      fields.set(rankString("site"), siteCount);
    }
    if (SOURCE_TEXT_TYPES.has(node.type)) {
      fields.set("sourceText", getCodeUnits(String(Reflect.get(value, "sourceText") ?? "")));
    }
    if (BODY_FIELDS.has(node.type)) fields.set("mayUseArguments", argumentUses.get(value) ?? true);
    if (node.type === "CallExpression" || node.type === "TaggedTemplateExpression") {
      fields.set("isTail", tailCalls.has(value));
    }
    fields.set("strict", node.strict === true);
    return createRecord([...fields]);
  };
  return convert;
};
