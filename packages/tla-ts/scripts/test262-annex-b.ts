import { FunctionKind, Token } from "@engine262/engine262";
import type { ErrorObject, Parser, ParseNodesByType, ScopeInfo } from "@engine262/engine262";
import { isParseNode, type ParseNode } from "./test262-parse-node";

// HACK: engine262's parser leaves out Annex B and the web-compat script extensions, so its methods are replaced on this parser only.
export const allowAnnexB = (parser: Parser, isPatternValid: (pattern: string) => boolean) => {
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
