import { fork } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { scheduler } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort, Worker } from "node:worker_threads";
import {
  Agent,
  ContainsArguments,
  FunctionKind,
  ManagedRealm,
  Parser,
  refineLeftHandSideExpression,
  setSurroundingAgent,
  Token,
  TV,
  wrappedParse,
} from "@engine262/engine262";
import type { ErrorObject, ParseNodesByType, ScopeInfo } from "@engine262/engine262";
import { parseConfig } from "../src/config";
import { createEnvironment } from "../src/environment";
import { evaluate, bindValue, evaluateStartupDefinitions, getDefinition } from "../src/evaluate";
import { createTlcOrder } from "../src/tlc/order";
import {
  ANY_SET,
  applyFunction,
  createRecord,
  createTuple,
  formatValue,
  getSequenceElements,
  isEnumeratedSet,
  rankString,
  setStringOrder,
} from "../src/values";
import type { LazyFunctionValue, Value } from "../src/values";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, listFiles } from "./corpora";

const ECMASCRIPT_DIRECTORY = join(import.meta.dirname, "../ecmascript");
const TEST262_DIRECTORY = join(CORPORA_DIRECTORY, "test262");
const RECORD_PATH = join(CONFORMANCE_DIRECTORY, "test262.json");
const PARSE_NODE_PATH = join(
  import.meta.dirname,
  "../node_modules/@engine262/engine262/src/parser/ParseNode.mts",
);

const getTestId = (path: string) => relative(join(TEST262_DIRECTORY, "test"), path);

interface ParseNode {
  type: string;
  [field: string]: unknown;
}

interface Metadata {
  includes: string[];
  flags: string[];
  negative: { phase: string; type: string } | undefined;
}

interface TestRun {
  id: string;
  isPassed: boolean;
  reason: string;
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

const isParseNode = (value: unknown): value is ParseNode =>
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

const getCodeUnits = (text: string) =>
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

const createConverter = (none: Value) => {
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

const getMetadata = (source: string): Metadata => {
  const frontmatter = /\/\*---([\s\S]*?)---\*\//.exec(source)?.[1] ?? "";
  const getList = (key: string) => {
    const inline = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, "m").exec(frontmatter);
    if (inline)
      return inline[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const block = new RegExp(`^${key}:\\s*\\n((?:\\s+-.*\\n?)*)`, "m").exec(frontmatter);
    return block ? [...block[1].matchAll(/-\s*(\S+)/g)].map((match) => match[1]) : [];
  };
  const negative = /^negative:\s*\n\s+phase:\s*(\S+)\s*\n\s+type:\s*(\S+)/m.exec(frontmatter);
  return {
    includes: getList("includes"),
    flags: getList("flags"),
    negative: negative ? { phase: negative[1], type: negative[2] } : undefined,
  };
};

const getField = (record: Value, name: string) => applyFunction(record, name);

const decodeUnits = (value: Value) =>
  String.fromCharCode(...(getSequenceElements(value) ?? []).map(Number));

// HACK: engine262's parser leaves out Annex B and the web-compat script extensions, so its methods are replaced on this parser only.
const allowAnnexB = (parser: Parser, isPatternValid: (pattern: string) => boolean) => {
  const parseRegularExpressionLiteral = parser.parseRegularExpressionLiteral.bind(parser);
  parser.parseRegularExpressionLiteral = () => {
    const start = Reflect.get(parser, "position");
    parser.scanRegularExpressionBody();
    const body = String(Reflect.get(parser, "scannedValue"));
    parser.scanRegularExpressionFlags();
    const flags = String(Reflect.get(parser, "scannedValue"));
    if (/[uv]/.test(flags) || !isPatternValid(body)) {
      Reflect.set(parser, "position", start);
      return parseRegularExpressionLiteral();
    }
    const node = parser.startNode<ParseNodesByType["RegularExpressionLiteral"]>();
    node.RegularExpressionBody = body;
    node.RegularExpressionFlags = flags;
    const position = Number(Reflect.get(parser, "position"));
    const token = {
      endIndex: position - 1,
      line: Number(Reflect.get(parser, "line")) - 1,
      column: position - Number(Reflect.get(parser, "columnOffset")),
    };
    parser.next();
    Reflect.set(parser, "currentToken", token);
    return parser.finishNode(node, "RegularExpressionLiteral");
  };
  const skipSpace = parser.skipSpace.bind(parser);
  let isInputStart = true;
  parser.skipSpace = () => {
    skipSpace();
    const source = String(Reflect.get(parser, "source"));
    const position = Number(Reflect.get(parser, "position"));
    const isLineStart =
      isInputStart || Reflect.get(parser, "lineTerminatorBeforeNextToken") === true;
    isInputStart = false;
    if (
      source.startsWith("<!--", position) ||
      (isLineStart && source.startsWith("-->", position))
    ) {
      parser.skipLineComment();
      parser.skipSpace();
    }
  };
  const parseStatementListItem = parser.parseStatementListItem.bind(parser);
  const parseStatement = parser.parseStatement.bind(parser);
  let isListItem = false;
  parser.parseStatementListItem = () => {
    isListItem = true;
    const item = parseStatementListItem();
    isListItem = false;
    return item;
  };
  Reflect.set(parser, "parseStatement", () => {
    const isLabelledFunctionAllowed = isListItem && !parser.isStrictMode();
    isListItem = false;
    if (isLabelledFunctionAllowed && parser.test(Token.FUNCTION) && !parser.testAhead(Token.MUL))
      return parser.parseFunctionDeclaration(FunctionKind.NORMAL);
    isListItem =
      isLabelledFunctionAllowed &&
      parser.peek().type >= Token.IDENTIFIER &&
      parser.peek().type <= Token.YIELD &&
      parser.testAhead(Token.COLON);
    return parseStatement();
  });
  const parseClause = () => {
    if (parser.isStrictMode() || !parser.test(Token.FUNCTION) || parser.testAhead(Token.MUL))
      return parseStatement();
    const block = parser.startNode<ParseNodesByType["Block"]>();
    block.StatementList = parser.scope.with({ lexical: true }, () => [
      parser.parseFunctionDeclaration(FunctionKind.NORMAL),
    ]);
    return parser.finishNode(block, "Block");
  };
  parser.parseIfStatement = () => {
    const node = parser.startNode<ParseNodesByType["IfStatement"]>();
    parser.expect(Token.IF);
    parser.expect(Token.LPAREN);
    node.Expression = parser.parseExpression();
    parser.expect(Token.RPAREN);
    node.Statement_a = parseClause();
    if (parser.eat(Token.ELSE)) node.Statement_b = parseClause();
    return parser.finishNode(node, "IfStatement");
  };
  const parseFunction = parser.parseFunction.bind(parser);
  const functionNames = new WeakMap<object, Set<string>>();
  parser.parseFunction = (isExpression, kind) => {
    if (
      isExpression ||
      kind !== FunctionKind.NORMAL ||
      parser.isStrictMode() ||
      parser.testAhead(Token.MUL)
    )
      return parseFunction(isExpression, kind);
    const scope = parser.scope.lexicalScope();
    const name = String(parser.peekAhead().value);
    const names = functionNames.get(scope) ?? new Set();
    if (names.has(name) && !scope.flags.variableFunctions) scope.lexicals.delete(name);
    functionNames.set(scope, names.add(name));
    return parseFunction(isExpression, kind);
  };
  const validateAssignmentTarget = parser.validateAssignmentTarget.bind(parser);
  const isCallTarget = (node: unknown): boolean =>
    isParseNode(node) &&
    (node.type === "CallExpression" ||
      (node.type === "ParenthesizedExpression" && isCallTarget(node.Expression)));
  let isValidatingTarget = false;
  parser.validateAssignmentTarget = (node) => {
    if (
      !isValidatingTarget &&
      !parser.isStrictMode() &&
      isCallTarget(node) &&
      ![Token.ASSIGN_AND, Token.ASSIGN_OR, Token.ASSIGN_NULLISH].some((token) => parser.test(token))
    )
      return;
    isValidatingTarget = true;
    validateAssignmentTarget(node);
    isValidatingTarget = false;
  };
  const parseVariableDeclarationList = parser.parseVariableDeclarationList.bind(parser);
  parser.parseVariableDeclarationList = (firstDeclarationRequiresInit) =>
    firstDeclarationRequiresInit === false
      ? parser.scope.with({ in: false }, () => parseVariableDeclarationList(false))
      : parseVariableDeclarationList(firstDeclarationRequiresInit);
  const validateIdentifierReference = parser.validateIdentifierReference.bind(parser);
  let argumentsErrors = new Set<ErrorObject>();
  parser.validateIdentifierReference = (name, token) => {
    const errors = new Set(parser.earlyErrors);
    validateIdentifierReference(name, token);
    if (name === "arguments")
      argumentsErrors = new Set([...parser.earlyErrors].filter((error) => !errors.has(error)));
  };
  const repurpose = Reflect.get(parser, "repurpose").bind(parser);
  Reflect.set(parser, "repurpose", (node: ParseNode, type: string, update?: unknown) => {
    if (type === "LabelIdentifier" && node.name === "arguments")
      argumentsErrors.forEach((error) => parser.earlyErrors.delete(error));
    return type === "ForBinding" &&
      node.type === "VariableDeclaration" &&
      node.BindingIdentifier &&
      !parser.isStrictMode() &&
      parser.test(Token.IN)
      ? repurpose(node, type)
      : repurpose(node, type, update);
  });
  const declare = parser.scope.declare;
  const catchParameters = new Map<ScopeInfo, string>();
  Reflect.set(parser.scope, "declare", (...args: unknown[]) => {
    const node = args[0];
    if (args[1] === "lexical-allow-let" && isParseNode(node) && node.type === "BindingIdentifier")
      catchParameters.set(parser.scope.lexicalScope(), String(node.name));
    if (args[1] !== "variable") return Reflect.apply(declare, parser.scope, args);
    catchParameters.forEach((name, scope) => scope.lexicals.delete(name));
    Reflect.apply(declare, parser.scope, args);
    catchParameters.forEach((name, scope) => scope.lexicals.add(name));
  });
  return parser;
};

const createRunner = () => {
  const loadModule = (name: string) => {
    try {
      return readFileSync(join(ECMASCRIPT_DIRECTORY, `${name}.tla`), "utf8");
    } catch {
      return undefined;
    }
  };
  const config = parseConfig("CONSTANTS None = None Empty = Empty Absent = Absent");
  const source = "---- MODULE Test262 ----\nEXTENDS ESCore\n====";
  const order = createTlcOrder(source, loadModule);
  setStringOrder(order.getStringOrder(config));
  const specification = createEnvironment(config, {
    source,
    loadModule,
    order,
    print: () => {},
    files: { readFile: undefined, writeFile: undefined, makeDirectory: undefined },
  });
  const environment = specification.environment;
  evaluateStartupDefinitions(specification.startupDefinitions, environment);
  const none = environment.constants.get("None");
  if (none === undefined) throw new Error("ESCore declares no constant None");
  const convert = createConverter(none);
  const callDefinition = (name: string, args: Value[]) => {
    const definition = getDefinition(name, environment);
    if (definition?.kind !== "Operator") throw new Error(`ESCore defines no operator ${name}`);
    const scope = definition.params.reduce<ReturnType<typeof bindValue> | undefined>(
      (current, param, index) => bindValue(current, param.name, args[index]),
      undefined,
    );
    return evaluate(definition.body, { environment, scope, state: undefined, next: undefined });
  };

  const isPatternValid = (pattern: string) =>
    getField(callDefinition("ParsePattern", [getCodeUnits(pattern), false, false]), "ok") === true;

  setSurroundingAgent(new Agent({ features: ["decorators"] }));
  const realm = new ManagedRealm();
  const parse = (source: string, isModule: boolean) => {
    const pop = realm.pushTopContext();
    const result = wrappedParse({ source }, (parser: Parser): unknown =>
      isModule ? parser.parseModule() : allowAnnexB(parser, isPatternValid).parseScript(),
    );
    pop?.();
    return result;
  };

  const parses = new Map<string, Value>();
  const getParse = (request: Value): Value => {
    const goal = getField(request, "goal");
    if (goal === "module") {
      const specifier = decodeUnits(getField(request, "specifier"));
      const type = decodeUnits(getField(request, "type"));
      const path = join(decodeUnits(getField(request, "directory")), specifier);
      const createFailure = (error: string) =>
        createRecord([
          ["ok", false],
          ["error", rankString(error)],
        ]);
      if (specifier === "<module source>" && type === "")
        return createRecord([
          ["ok", true],
          ["id", getCodeUnits(specifier)],
          ["type", getCodeUnits("source")],
        ]);
      if (
        !specifier.startsWith("./") ||
        !existsSync(path) ||
        !["", "json", "text", "bytes"].includes(type)
      )
        return createFailure("TypeError");
      const id = getCodeUnits(`${path}#${type}`);
      if (type === "bytes")
        return createRecord([
          ["ok", true],
          ["id", id],
          ["type", getField(request, "type")],
          ["source", createTuple([...readFileSync(path)])],
        ]);
      const source = readFileSync(path, "utf8");
      if (type !== "")
        return createRecord([
          ["ok", true],
          ["id", id],
          ["type", getField(request, "type")],
          ["source", getCodeUnits(source)],
        ]);
      const tree = parse(source, true);
      return Array.isArray(tree)
        ? createFailure("SyntaxError")
        : createRecord([
            ["ok", true],
            ["id", id],
            ["type", getField(request, "type")],
            ["node", convert(tree)],
          ]);
    }
    if (goal === "script") {
      const script = parse(decodeUnits(getField(request, "source")), false);
      return Array.isArray(script)
        ? createRecord([["ok", false]])
        : createRecord([
            ["ok", true],
            ["node", convert(script)],
          ]);
    }
    if (goal === "eval") {
      const names = getField(request, "privateNames");
      const privateNames = isEnumeratedSet(names) ? names.elements.map(decodeUnits) : [];
      const pop = realm.pushTopContext();
      const script = wrappedParse(
        { source: decodeUnits(getField(request, "source")) },
        (parser: Parser) =>
          parser.scope.with(
            {
              strict: getField(request, "strict") === true,
              newTarget: getField(request, "newTarget") === true,
              superProperty: getField(request, "superProperty") === true,
              superCall: getField(request, "superCall") === true,
              private: privateNames.length > 0,
            },
            () => {
              for (const name of privateNames)
                parser.scope.privateScope?.names.set(name, new Set(["field"]));
              return allowAnnexB(parser, isPatternValid).parseScript();
            },
          ),
      );
      pop?.();
      return Array.isArray(script)
        ? createRecord([["ok", false]])
        : createRecord([
            ["ok", true],
            ["node", convert(script)],
            [
              "containsArguments",
              script.ScriptBody ? Boolean(ContainsArguments(script.ScriptBody)) : false,
            ],
          ]);
    }
    const isAsync = goal === "async" || goal === "asyncGenerator";
    const isGenerator = goal === "generator" || goal === "asyncGenerator";
    const prefix = `${isAsync ? "async " : ""}function${isGenerator ? "*" : ""}`;
    const parameters = decodeUnits(getField(request, "params"));
    const body = `\n${decodeUnits(getField(request, "body"))}\n`;
    const sourceText = `${prefix} anonymous(${parameters}\n) {${body}}`;
    const pop = realm.pushTopContext();
    const parsedParameters = wrappedParse(
      {
        source: `${" ".repeat(prefix.length + 10)}(${parameters}\n)`,
        decoratingSource: sourceText,
      },
      (parser: Parser) => {
        const result = parser.scope.with(
          {
            await: isAsync,
            yield: isGenerator,
            lexical: true,
            variable: true,
            variableFunctions: true,
            newTarget: true,
            return: true,
            label: "boundary",
          },
          () => ({ result: allowAnnexB(parser, isPatternValid).parseFormalParameters() }),
        );
        parser.expect(Token.EOS);
        return result;
      },
    );
    const parsedBody = wrappedParse(
      {
        source: `${" ".repeat(prefix.length + parameters.length + 12)}\n {${body}}`,
        decoratingSource: sourceText,
      },
      (parser: Parser) => {
        const result = parser.scope.with(
          { await: isAsync, yield: isGenerator, lexical: true, variable: true },
          () => allowAnnexB(parser, isPatternValid).parseFunctionBody(isAsync, isGenerator, false),
        );
        parser.expect(Token.EOS);
        return result;
      },
    );
    const expression = wrappedParse({ source: sourceText }, (parser: Parser) => {
      const result = allowAnnexB(parser, isPatternValid).parseFunctionExpression(
        isAsync ? FunctionKind.ASYNC : FunctionKind.NORMAL,
      );
      parser.expect(Token.EOS);
      return result;
    });
    pop?.();
    return Array.isArray(parsedParameters) || Array.isArray(parsedBody) || Array.isArray(expression)
      ? createRecord([["ok", false]])
      : createRecord([
          ["ok", true],
          ["node", convert(expression)],
        ]);
  };
  const parseTable: LazyFunctionValue = {
    kind: "LazyFunction",
    domain: ANY_SET,
    apply: (request) => {
      const key = formatValue(request);
      const known = parses.get(key);
      if (known !== undefined) return known;
      const parsed = getParse(request);
      parses.set(key, parsed);
      return parsed;
    },
  };

  const harnessResults = new Map<string, Value>();
  const getHarnessResult = (includes: string[]): Value => {
    const key = includes.join(",");
    const known = harnessResults.get(key);
    if (known) return known;
    const trees = includes.map((include) => {
      const tree = parse(readFileSync(join(TEST262_DIRECTORY, "harness", include), "utf8"), false);
      if (Array.isArray(tree)) throw new Error(`engine262 can't parse harness/${include}`);
      return convert(tree);
    });
    const result = callDefinition("HarnessResult", [createTuple(trees), parseTable]);
    harnessResults.set(key, result);
    return result;
  };

  const runTest = (includes: string[], name: string, args: Value[]): Value =>
    callDefinition(name, [getHarnessResult(includes), ...args, parseTable]);

  const runMode = (path: string, source: string, metadata: Metadata, isStrict: boolean) => {
    const isAsync = metadata.flags.includes("async");
    const isModule = metadata.flags.includes("module");
    const tree = parse(isStrict && !isModule ? `"use strict";\n${source}` : source, isModule);
    const negative = metadata.negative;
    if (Array.isArray(tree)) {
      return negative?.phase === "parse" && negative.type === "SyntaxError"
        ? undefined
        : `SyntaxError: ${String(tree[0]?.message ?? tree[0])}`;
    }
    if (negative?.phase === "parse") return "expected a parse error";
    const includes = metadata.flags.includes("raw")
      ? []
      : ["assert.js", "sta.js", ...(isAsync ? ["doneprintHandle.js"] : []), ...metadata.includes];
    const directory = getCodeUnits(dirname(path));
    const canSuspend = !metadata.flags.includes("CanBlockIsFalse");
    const result = isModule
      ? runTest(includes, "RunModuleFrom", [
          getCodeUnits(`./${basename(path)}`),
          directory,
          canSuspend,
        ])
      : runTest(includes, "RunFrom", [createTuple([convert(tree)]), directory, canSuspend]);
    const isOk = getField(result, "ok") === true;
    const name = decodeUnits(getField(result, "name"));
    const message = decodeUnits(getField(result, "message"));
    const out = (getSequenceElements(getField(result, "out")) ?? []).map(decodeUnits);
    if (negative) {
      return !isOk && name === negative.type
        ? undefined
        : isOk
          ? `expected ${negative.type}`
          : message;
    }
    if (!isOk) return message || "threw";
    if (isAsync) {
      return out.includes("Test262:AsyncTestComplete")
        ? undefined
        : (out.find((line) => line.startsWith("Test262:AsyncTestFailure")) ?? "never finished");
    }
    return undefined;
  };

  return (path: string): TestRun => {
    const id = getTestId(path);
    const source = readFileSync(path, "utf8");
    const metadata = getMetadata(source);
    const modes = metadata.flags.some((flag) => flag === "onlyStrict" || flag === "module")
      ? [true]
      : metadata.flags.includes("noStrict") || metadata.flags.includes("raw")
        ? [false]
        : [false, true];
    for (const isStrict of modes) {
      try {
        const reason = runMode(path, source, metadata, isStrict);
        if (reason !== undefined)
          return { id, isPassed: false, reason: `${isStrict ? "strict" : "sloppy"}: ${reason}` };
      } catch (error) {
        return {
          id,
          isPassed: false,
          reason: `engine error: ${process.env.TEST262_FULL ? String(error) : String(error).split("\n")[0]}`,
        };
      }
    }
    return { id, isPassed: true, reason: "" };
  };
};

const TESTS_PER_WORKER = 100;
const WORKER_COUNT = Math.min(4, availableParallelism());
const WORKER_HEAP_MB = 2048;
const WORKER_STACK_MB = 256;
const LOCK_DIRECTORY = join(tmpdir(), "tla-ts-test262.lock");

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const acquireLock = async () => {
  for (;;) {
    try {
      mkdirSync(LOCK_DIRECTORY);
      writeFileSync(join(LOCK_DIRECTORY, "pid"), String(process.pid));
      return;
    } catch {
      const holder = Number(
        readFileSync(join(LOCK_DIRECTORY, "pid"), { encoding: "utf8", flag: "a+" }),
      );
      if (holder && !isAlive(holder)) rmSync(LOCK_DIRECTORY, { recursive: true, force: true });
      else {
        console.error(`Waiting for test262 run ${holder || "(starting)"} to finish`);
        await scheduler.wait(5000);
      }
    }
  }
};

if (!isMainThread) {
  const run = createRunner();
  parentPort?.on("message", (path: string) => parentPort?.postMessage(run(path)));
} else if (process.send) {
  const worker = new Worker(new URL(import.meta.url), {
    resourceLimits: { stackSizeMb: WORKER_STACK_MB, maxOldGenerationSizeMb: WORKER_HEAP_MB },
  });
  worker.on("message", (run: TestRun) => process.send?.(run));
  process.on("message", (path: string) => worker.postMessage(path));
  worker.on("error", (error) => {
    console.error(`worker crashed: ${String(error).split("\n")[0]}`);
    process.exit(1);
  });
  worker.on("exit", (code) => process.exit(code));
} else {
  const args = process.argv.slice(2);
  const isRecorded = args.includes("--record");
  const isVerbose = args.includes("--verbose");
  const prefixes = args.filter((arg) => !arg.startsWith("--"));
  const paths = listFiles(join(TEST262_DIRECTORY, "test"))
    .filter((path) => path.endsWith(".js") && !path.includes("_FIXTURE"))
    .filter((path) => {
      const id = getTestId(path);
      return (
        prefixes.length === 0 ||
        prefixes.some((prefix) => id.startsWith(prefix.replace(/^test\//, "")))
      );
    })
    .sort();
  await acquireLock();
  process.on("exit", () => rmSync(LOCK_DIRECTORY, { recursive: true, force: true }));
  process.on("SIGINT", () => process.exit(130));
  process.on("SIGTERM", () => process.exit(143));
  const runs: TestRun[] = [];
  const report = (run: TestRun) => {
    runs.push(run);
    if (isVerbose || !run.isPassed)
      console.log(
        `${run.isPassed ? "PASS" : "FAIL"} ${run.id}${run.reason ? ` ${run.reason}` : ""}`,
      );
  };
  let nextIndex = 0;
  const drain = async (): Promise<void> => {
    while (nextIndex < paths.length) {
      const host = fork(fileURLToPath(import.meta.url), {
        stdio: ["ignore", "inherit", "pipe", "ipc"],
      });
      let currentPath = "";
      let exitReason = "worker exited";
      let sentCount = 0;
      const send = () => {
        if (nextIndex >= paths.length || sentCount === TESTS_PER_WORKER) return host.kill();
        sentCount++;
        currentPath = paths[nextIndex++];
        host.send(currentPath);
      };
      host.on("message", (run: TestRun) => {
        currentPath = "";
        report(run);
        send();
      });
      host.stderr?.on("data", (data: Buffer) => {
        const line = data
          .toString()
          .split("\n")
          .find((text) => /crashed|FATAL ERROR/.test(text));
        if (line) exitReason = line.trim();
      });
      send();
      await new Promise((resolve) => host.on("exit", resolve));
      if (currentPath !== "") {
        report({
          id: getTestId(currentPath),
          isPassed: false,
          reason: exitReason,
        });
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(WORKER_COUNT, Math.max(paths.length, 1)) }, drain),
  );
  const passed = runs
    .filter((run) => run.isPassed)
    .map((run) => run.id)
    .sort();
  console.log(`${passed.length} of ${runs.length} tests pass`);
  if (isRecorded) {
    writeFileSync(RECORD_PATH, `${JSON.stringify({ total: runs.length, passed }, null, 2)}\n`);
  }
}
