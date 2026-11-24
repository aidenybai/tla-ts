// V8's parser (src/parsing/parser-base.h, parser.cc and expression-scope.h), as Node 26's V8 14.6
// parses a script or a module, reduced to what its SyntaxErrors read: it builds no AST, only the
// shapes of expressions that its cover grammars and its early errors look at. Like V8, it keeps
// parsing after an error, past which the scanner gives only illegal tokens, so that a later check
// at an earlier position, as of a strict function's octal literals, reports its error instead.

import { TlaTypeScriptError } from "../../errors";
import { formatMessage, type MessageName } from "./messages";
import { getRegExpError } from "./regexp";
import {
  createScanner,
  getPrecedence,
  getTokenString,
  INVALID_LOCATION,
  isAnyIdentifier,
  isArrowOrAssignmentOp,
  isAutoSemicolon,
  isCallable,
  isCompareOp,
  isCountOp,
  isLineTerminator,
  isLiteral,
  isLogicalAssignmentOp,
  isMember,
  isProperty,
  isPropertyName,
  isPropertyOrCall,
  isStrictReservedWord,
  isUnaryOp,
  isUnaryOrCountOp,
  isValidIdentifier,
  type Location,
  TOKEN,
} from "./scanner";
import {
  createScope,
  declarePrivateName,
  declareVariable,
  findConflictingVarDeclaration,
  findVariableDeclaredIn,
  FUNCTION_KIND,
  getClosureScope,
  getDeclarationScope,
  getPrivateNameScopes,
  getReceiverScope,
  isAccessorFunction,
  isAsyncFunction,
  isClassConstructor,
  isClassInitializerFunction,
  isConciseMethod,
  isDerivedConstructor,
  isGeneratorFunction,
  isGetterFunction,
  isImmutableLexicalVariableMode,
  isLexicalVariableMode,
  isModuleKind,
  isSetterFunction,
  type Scope,
  SCOPE_TYPE,
  VARIABLE_KIND,
  VARIABLE_MODE,
} from "./scope";

// The kinds of expressions whose shapes V8's checks read.
const EXPRESSION = {
  Failure: 0,
  Identifier: 1,
  Property: 2,
  Call: 3,
  CallNew: 4,
  ObjectLiteral: 5,
  ArrayLiteral: 6,
  Assignment: 7,
  CompoundAssignment: 8,
  Spread: 9,
  EmptyParentheses: 10,
  NumberLiteral: 11,
  StringLiteral: 12,
  OtherLiteral: 13,
  Binary: 14,
  Nary: 15,
  ImportCall: 16,
  SuperCallReference: 17,
  SuperPropertyReference: 18,
  OptionalChain: 19,
  NewTarget: 20,
  FunctionLiteral: 21,
  ConsStringLiteral: 22,
  Other: 23,
} as const;

interface Expression {
  kind: number;
  position: number;
  isParenthesized: boolean;
  name: string;
  operator: number;
  isTaggedTemplate: boolean;
  isPrivateReference: boolean;
  // A binary operation's left operand's position, where an n-ary operation that merges it starts.
  firstPosition: number;
  // How many expressions a comma list or an async arrow function's head holds.
  arity: number;
}

const createExpression = (
  kind: number,
  position: number,
  fields: Partial<Expression> = {},
): Expression => ({
  kind,
  position,
  isParenthesized: false,
  name: "",
  operator: TOKEN.Illegal,
  isTaggedTemplate: false,
  isPrivateReference: false,
  firstPosition: -1,
  arity: 1,
  ...fields,
});

const createFailure = () => createExpression(EXPRESSION.Failure, -1);

// What a statement's parse gives: nothing after an error, an empty statement, a string literal's
// statement, which may be a directive, or another statement.
type Statement = "null" | "empty" | "string" | "other";

const EXPRESSION_SCOPE = {
  Expression: 0,
  MaybeArrowParameterDeclaration: 1,
  MaybeAsyncArrowParameterDeclaration: 2,
  ParameterDeclaration: 3,
  VarDeclaration: 4,
  LexicalDeclaration: 5,
} as const;

interface Report {
  location: Location;
  message: MessageName;
}

interface VariableProxy {
  name: string;
  position: number;
}

interface ExpressionScope {
  type: number;
  parent: ExpressionScope | undefined;
  hasPossibleParameterInScopeChain: boolean;
  hasPossibleArrowParameterInScopeChain: boolean;
  hasAsyncArrowInScopeChain: boolean;
  // The expression's error and its pattern's error, which its use as one or the other reports.
  errors: (Report | undefined)[];
  variables: VariableProxy[];
  mode: number;
  names: string[] | undefined;
  duplicateLocation: Location;
  declarationError: Report | undefined;
  hasSimpleParameterList: boolean;
}

const EXPRESSION_ERROR = 0;
const PATTERN_ERROR = 1;

const PROPERTY_KIND = {
  AutoAccessorClassField: 0,
  AccessorGetter: 1,
  AccessorSetter: 2,
  Value: 3,
  Shorthand: 4,
  Assign: 5,
  Method: 6,
  ClassField: 7,
  ShorthandOrClassField: 8,
  Spread: 9,
  NotSet: 10,
} as const;

const FUNCTION_FLAG = { Normal: 0, Generator: 1, Async: 2 } as const;

interface PropertyInfo {
  accumulationScope: AccumulationScope | undefined;
  name: string;
  isObjectLiteral: boolean;
  functionFlags: number;
  kind: number;
  isComputedName: boolean;
  isPrivate: boolean;
  isStatic: boolean;
  isRest: boolean;
}

interface AccumulationScope {
  scope: ExpressionScope | undefined;
  errors: (Report | undefined)[];
}

interface FormalParameters {
  scope: Scope;
  hasRest: boolean;
  isSimple: boolean;
  arity: number;
  duplicateLocation: Location;
  strictError: Report | undefined;
}

interface Target {
  labels: string[] | undefined;
  ownLabels: string[] | undefined;
  isIteration: boolean;
  isTargetForAnonymous: boolean;
}

interface FunctionState {
  scope: Scope;
  loopNestingDepth: number;
  targets: Target[];
}

interface ClassInfo {
  hasSeenConstructor: boolean;
  staticElementsScope: Scope | undefined;
  instanceMembersScope: Scope | undefined;
}

interface DeclarationResult {
  mode: number;
  declarations: { isIdentifierPattern: boolean }[];
  firstInitializerLocation: Location;
  bindingsLocation: Location;
}

const VAR_CONTEXT = { StatementListItem: 0, Statement: 1, ForStatement: 2 } as const;

const FUNCTION_NAME = { IsStrictReserved: 0, SkipCheck: 1, Unknown: 2 } as const;

const isEvalOrArguments = (name: string) => name === "eval" || name === "arguments";

// The kind of a function that flags make, as a plain function, a method or a static method.
// V8's Code::kMaxArguments, past which a call takes too many arguments and a function too many
// parameters.
const MAX_ARGUMENTS = 65526;

const getFunctionKind = (subKind: number, flags: number) => {
  const isGenerator = (flags & FUNCTION_FLAG.Generator) !== 0;
  const isAsync = (flags & FUNCTION_FLAG.Async) !== 0;
  const kinds = [
    [
      [FUNCTION_KIND.NormalFunction, FUNCTION_KIND.AsyncFunction],
      [FUNCTION_KIND.GeneratorFunction, FUNCTION_KIND.AsyncGeneratorFunction],
    ],
    [
      [FUNCTION_KIND.ConciseMethod, FUNCTION_KIND.AsyncConciseMethod],
      [FUNCTION_KIND.ConciseGeneratorMethod, FUNCTION_KIND.AsyncConciseGeneratorMethod],
    ],
    [
      [FUNCTION_KIND.StaticConciseMethod, FUNCTION_KIND.StaticAsyncConciseMethod],
      [FUNCTION_KIND.StaticConciseGeneratorMethod, FUNCTION_KIND.StaticAsyncConciseGeneratorMethod],
    ],
  ];
  return kinds[subKind][isGenerator ? 1 : 0][isAsync ? 1 : 0];
};

// The line, from 1, of a position in a source, as V8 counts lines, or 0 for no position.
const getLine = (source: string, position: number) => {
  if (position < 0) return 0;
  let line = 1;
  for (let index = 0; index < position && index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    if (code === 0x0d && source.charCodeAt(index + 1) === 0x0a) continue;
    if (isLineTerminator(code)) line += 1;
  }
  return line;
};

// The SyntaxError that V8 throws as it parses a script or a module, with its line, or undefined
// where V8 accepts it.
export const getV8SyntaxError = (source: string, isModule: boolean) => {
  const scanner = createScanner(source, isModule);
  let pendingError: { location: Location; message: string } | undefined;
  let scope: Scope = createScope(SCOPE_TYPE.Script, undefined);
  let functionState: FunctionState = { scope, loopNestingDepth: 0, targets: [] };
  let expressionScope: ExpressionScope | undefined;
  let isInAccepted = true;
  let parameters: FormalParameters | undefined;
  // What the parse of an arrow function's head leaves for its body.
  let nextArrowStrictParameterError: Report | undefined;
  let nextArrowScope: Scope | undefined;
  // The block scope of the object literal whose methods the parser reads, if any.
  let objectLiteralScope: Scope | undefined;
  // The module's exports, by their export names and local names, and its declared scope.
  const regularExports: { exportName: string; localName: string; location: Location }[] = [];
  const specialExports: { exportName: string; location: Location }[] = [];

  const hasError = () => scanner.hasParserError();
  const isStrict = () => scope.isStrict;

  const reportMessageAt = (
    location: Location,
    message: MessageName,
    ...args: (string | undefined)[]
  ) => {
    if (pendingError === undefined || location.end < pendingError.location.start) {
      pendingError = { location, message: formatMessage(message, args) };
    }
    scanner.setParserError();
  };
  const reportMessage = (message: MessageName, ...args: (string | undefined)[]) =>
    reportMessageAt(scanner.getLocation(), message, ...args);

  const reportUnexpectedTokenAt = (location: Location, token: number) => {
    switch (token) {
      case TOKEN.Eos:
        return reportMessageAt(location, "kUnexpectedEOS");
      case TOKEN.Smi:
      case TOKEN.Number:
      case TOKEN.BigInt:
        return reportMessageAt(location, "kUnexpectedTokenNumber");
      case TOKEN.String:
        return reportMessageAt(location, "kUnexpectedTokenString");
      case TOKEN.PrivateName:
      case TOKEN.Identifier:
        return reportMessageAt(location, "kUnexpectedTokenIdentifier", scanner.getCurrentLiteral());
      case TOKEN.Await:
      case TOKEN.Enum:
        return reportMessageAt(location, "kUnexpectedReserved");
      case TOKEN.Let:
      case TOKEN.Static:
      case TOKEN.Yield:
      case TOKEN.FutureStrictReservedWord:
        return reportMessageAt(
          location,
          isStrict() ? "kUnexpectedStrictReserved" : "kUnexpectedTokenIdentifier",
          getTokenString(token),
        );
      case TOKEN.TemplateSpan:
      case TOKEN.TemplateTail:
        return reportMessageAt(location, "kUnexpectedTemplateString");
      case TOKEN.EscapedStrictReservedWord:
      case TOKEN.EscapedKeyword:
        return reportMessageAt(location, "kInvalidEscapedReservedWord");
      case TOKEN.Illegal: {
        const error = scanner.getScannerError();
        return error === undefined
          ? reportMessageAt(location, "kInvalidOrUnexpectedToken")
          : reportMessageAt(error.location, error.message as MessageName);
      }
      case TOKEN.RegExpLiteral:
        return reportMessageAt(location, "kUnexpectedTokenRegExp");
      default:
        return reportMessageAt(location, "kUnexpectedToken", getTokenString(token));
    }
  };
  const reportUnexpectedToken = (token: number) =>
    reportUnexpectedTokenAt(scanner.getLocation(), token);

  const peek = () => scanner.peek();
  const next = () => scanner.next();
  const position = () => scanner.getLocation().start;
  const peekPosition = () => scanner.getPeekLocation().start;
  const endPosition = () => scanner.getLocation().end;
  const peekEndPosition = () => scanner.getPeekLocation().end;
  const consume = () => {
    next();
  };
  const check = (token: number) => {
    if (peek() !== token) return false;
    next();
    return true;
  };
  const expect = (token: number) => {
    const nextToken = next();
    if (nextToken !== token) reportUnexpectedToken(nextToken);
  };
  const isAsyncFunctionState = () => isAsyncFunction(functionState.scope.functionKind);
  const isGenerator = () => isGeneratorFunction(functionState.scope.functionKind);
  const isAwaitAllowed = () =>
    isAsyncFunctionState() || isModuleKind(functionState.scope.functionKind);
  const isAwaitAsIdentifierDisallowedFor = (kind: number) =>
    isAsyncFunction(kind) || kind === FUNCTION_KIND.ClassStaticInitializerFunction;
  const isAwaitAsIdentifierDisallowed = () =>
    isModule || isAwaitAsIdentifierDisallowedFor(functionState.scope.functionKind);

  const expectSemicolon = () => {
    const token = peek();
    if (token === TOKEN.Semicolon) {
      next();
      return;
    }
    if (scanner.hasLineTerminatorBeforeNext() || isAutoSemicolon(token)) return;
    if (scanner.getCurrentToken() === TOKEN.Await && !isAsyncFunctionState()) {
      reportMessageAt(scanner.getLocation(), "kAwaitNotInAsyncContext");
      return;
    }
    reportUnexpectedToken(next());
  };

  const peekContextualKeyword = (name: string) =>
    peek() === TOKEN.Identifier &&
    !scanner.isNextLiteralEscaped() &&
    scanner.getNextLiteral() === name;
  const peekContextualToken = (token: number) =>
    peek() === token && !scanner.isNextLiteralEscaped();
  const checkContextualKeyword = (name: string) => {
    if (!peekContextualKeyword(name)) return false;
    consume();
    return true;
  };
  const checkContextualToken = (token: number) => {
    if (!peekContextualToken(token)) return false;
    consume();
    return true;
  };
  const expectContextualKeyword = (name: string, fullName = name, at = -1) => {
    expect(TOKEN.Identifier);
    if (scanner.getCurrentLiteral() !== name) reportUnexpectedToken(scanner.getCurrentToken());
    if (scanner.isLiteralEscaped()) {
      reportMessageAt(
        { start: at === -1 ? position() : at, end: endPosition() },
        "kInvalidEscapedMetaProperty",
        fullName,
      );
    }
  };
  const expectContextualToken = (token: number) => {
    const nextToken = next();
    if (nextToken !== token) reportUnexpectedToken(nextToken);
    if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
  };
  const peekInOrOf = () => peek() === TOKEN.In || peekContextualToken(TOKEN.Of);
  // Consumes an in or an of, and returns which, or undefined for neither.
  const checkInOrOf = () => {
    if (check(TOKEN.In)) return "for-in";
    if (checkContextualToken(TOKEN.Of)) return "for-of";
    return undefined;
  };

  const checkStrictOctalLiteral = (start: number, end: number) => {
    const octal = scanner.getOctalLocation();
    if (octal.start >= 0 && start <= octal.start && octal.end <= end) {
      reportMessageAt(octal, scanner.getOctalMessage() as MessageName);
      scanner.clearOctalPosition();
    }
  };

  const checkTemplateEscapes = (shouldThrow: boolean) => {
    const error = scanner.getInvalidTemplateEscape();
    if (error === undefined) return true;
    if (shouldThrow) reportMessageAt(error.location, error.message as MessageName);
    scanner.clearInvalidTemplateEscape();
    return shouldThrow;
  };

  // Scopes.

  const newScope = (type: number) => createScope(type, scope);
  const newVarblockScope = () => {
    const result = createScope(SCOPE_TYPE.Block, scope);
    result.isDeclarationScope = true;
    return result;
  };
  const newFunctionScope = (kind: number) => createScope(SCOPE_TYPE.Function, scope, kind);
  const withScope = <T>(inner: Scope, run: () => T): T => {
    const outer = scope;
    scope = inner;
    try {
      return run();
    } finally {
      scope = outer;
    }
  };
  const withFunctionState = <T>(inner: Scope, run: () => T): T => {
    const outer = functionState;
    functionState = { scope: inner, loopNestingDepth: 0, targets: [] };
    try {
      return withScope(inner, run);
    } finally {
      functionState = outer;
    }
  };
  const withAcceptIn = <T>(isAccepted: boolean, run: () => T): T => {
    const outer = isInAccepted;
    isInAccepted = isAccepted;
    try {
      return run();
    } finally {
      isInAccepted = outer;
    }
  };
  const withoutExpressionScope = <T>(run: () => T): T => {
    const outer = expressionScope;
    expressionScope = undefined;
    try {
      return run();
    } finally {
      expressionScope = outer;
    }
  };
  const withTarget = <T>(target: Target, run: () => T): T => {
    const targets = functionState.targets;
    targets.push(target);
    try {
      return run();
    } finally {
      targets.pop();
    }
  };
  const withLoop = <T>(run: () => T): T => {
    const state = functionState;
    state.loopNestingDepth += 1;
    try {
      return run();
    } finally {
      state.loopNestingDepth -= 1;
    }
  };

  // Declares a name, reporting its redeclaration as V8 does where V8 rejects it.
  const declare = (
    name: string,
    kind: number,
    mode: number,
    target: Scope,
    start: number,
    end = -1,
  ) => {
    const result = declareVariable(target, name, start, mode, kind);
    if (!result.isOk) {
      const location = { start, end: end !== -1 ? end : start + 1 };
      if (kind === VARIABLE_KIND.Parameter) {
        reportMessageAt(location, "kParamDupe");
      } else {
        reportMessageAt(location, "kVarRedeclaration", name);
      }
    }
    return result;
  };

  const reportVarRedeclarationIn = (name: string, inner: Scope) => {
    const declaration = inner.declarations.find((candidate) => candidate.variable.name === name);
    const at = declaration?.position ?? -1;
    reportMessageAt(
      at === -1 ? INVALID_LOCATION : { start: at, end: at + name.length },
      "kVarRedeclaration",
      name,
    );
  };

  const checkConflictingVarDeclarations = (declarationScope: Scope) => {
    const declaration = findConflictingVarDeclaration(declarationScope);
    if (declaration === undefined) return;
    reportMessageAt(
      { start: declaration.position, end: declaration.position + 1 },
      "kVarRedeclaration",
      declaration.variable.name,
    );
  };

  const isUsingAllowed = () => scope.type !== SCOPE_TYPE.Script && !scope.isNonlinear;

  // Expression scopes.

  const isCertainlyDeclaration = (target: ExpressionScope) =>
    target.type >= EXPRESSION_SCOPE.ParameterDeclaration &&
    target.type <= EXPRESSION_SCOPE.LexicalDeclaration;
  const canBeExpression = (target: ExpressionScope) =>
    target.type <= EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration;
  const canBeDeclaration = (target: ExpressionScope) =>
    target.type >= EXPRESSION_SCOPE.MaybeArrowParameterDeclaration;
  const isArrowHeadParsingScope = (target: ExpressionScope) =>
    target.type === EXPRESSION_SCOPE.MaybeArrowParameterDeclaration ||
    target.type === EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration;
  const canBeParameterDeclaration = (target: ExpressionScope) =>
    target.type >= EXPRESSION_SCOPE.MaybeArrowParameterDeclaration &&
    target.type <= EXPRESSION_SCOPE.ParameterDeclaration;

  const openExpressionScope = (
    type: number,
    mode: number = VARIABLE_MODE.Var,
    names?: string[],
  ) => {
    const parent = expressionScope;
    const isParameter =
      type >= EXPRESSION_SCOPE.MaybeArrowParameterDeclaration &&
      type <= EXPRESSION_SCOPE.ParameterDeclaration;
    const isArrowParameter =
      type === EXPRESSION_SCOPE.MaybeArrowParameterDeclaration ||
      type === EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration;
    const created: ExpressionScope = {
      type,
      parent,
      hasPossibleParameterInScopeChain:
        isParameter || (parent?.hasPossibleParameterInScopeChain ?? false),
      hasPossibleArrowParameterInScopeChain:
        isArrowParameter || (parent?.hasPossibleArrowParameterInScopeChain ?? false),
      hasAsyncArrowInScopeChain:
        type === EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration ||
        (parent !== undefined && canBeExpression(parent) && parent.hasAsyncArrowInScopeChain),
      errors: [undefined, undefined],
      variables: [],
      mode,
      names,
      duplicateLocation: INVALID_LOCATION,
      declarationError: undefined,
      hasSimpleParameterList: true,
    };
    expressionScope = created;
    return created;
  };
  const closeExpressionScope = (target: ExpressionScope) => {
    expressionScope = target.parent;
  };
  const withExpressionScope = <T>(
    type: number,
    run: (target: ExpressionScope) => T,
    mode: number = VARIABLE_MODE.Var,
    names?: string[],
  ): T => {
    const target = openExpressionScope(type, mode, names);
    try {
      return run(target);
    } finally {
      closeExpressionScope(target);
    }
  };
  const getExpressionScope = () => {
    if (expressionScope === undefined) {
      throw new TlaTypeScriptError("tla-ts can't parse this file's syntax as V8 does");
    }
    return expressionScope;
  };

  const record = (
    target: ExpressionScope,
    index: number,
    location: Location,
    message: MessageName,
  ) => {
    if (target.errors[index] !== undefined) return;
    target.errors[index] = { location, message };
  };
  const validate = (target: ExpressionScope, index: number) => {
    const error = target.errors[index];
    if (error !== undefined) reportMessageAt(error.location, error.message);
  };
  const validateExpressionOf = (target: ExpressionScope) => {
    if (isArrowHeadParsingScope(target)) {
      nextArrowStrictParameterError = undefined;
      validate(target, EXPRESSION_ERROR);
      mergeVariableList(target);
      return;
    }
    validate(target, EXPRESSION_ERROR);
  };
  const validatePatternOf = (
    target: ExpressionScope,
    expression: Expression,
    begin: number,
    end: number,
  ) => {
    validate(target, PATTERN_ERROR);
    if (expression.isParenthesized) {
      reportMessageAt({ start: begin, end }, "kInvalidDestructuringTarget");
    }
  };
  const mergeVariableList = (target: ExpressionScope) => {
    const parent = target.parent;
    if (parent === undefined || !canBeExpression(parent)) return;
    parent.variables.push(...target.variables);
  };

  const recordExpressionError = (location: Location, message: MessageName) => {
    const target = getExpressionScope();
    if (canBeExpression(target)) record(target, EXPRESSION_ERROR, location, message);
  };
  const recordPatternError = (location: Location, message: MessageName) => {
    const target = getExpressionScope();
    if (isCertainlyDeclaration(target)) {
      reportMessageAt(location, message);
    } else {
      record(target, PATTERN_ERROR, location, message);
    }
  };
  const recordDeclarationError = (location: Location, message: MessageName) => {
    const target = getExpressionScope();
    if (!canBeDeclaration(target)) return;
    if (isCertainlyDeclaration(target)) {
      reportMessageAt(location, message);
    } else {
      target.declarationError = { location, message };
    }
  };
  const recordAsyncArrowParametersError = (location: Location, message: MessageName) => {
    const target = getExpressionScope();
    if (!canBeExpression(target)) return;
    for (
      let current: ExpressionScope | undefined = target;
      current !== undefined;
      current = current.parent
    ) {
      if (!target.hasAsyncArrowInScopeChain) break;
      if (current.type === EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration) {
        current.declarationError = { location, message };
      }
    }
  };
  const recordParameterInitializerError = (location: Location, message: MessageName) => {
    let current: ExpressionScope | undefined = getExpressionScope();
    while (current !== undefined && current.type !== EXPRESSION_SCOPE.ParameterDeclaration) {
      if (!current.hasPossibleParameterInScopeChain) return;
      if (canBeParameterDeclaration(current)) current.declarationError = { location, message };
      current = current.parent;
      if (current === undefined) return;
    }
    reportMessageAt(location, message);
  };
  const recordStrictModeParameterError = (location: Location, message: MessageName) => {
    const target = getExpressionScope();
    if (!canBeParameterDeclaration(target)) return;
    if (target.type === EXPRESSION_SCOPE.ParameterDeclaration) {
      if (isStrict()) {
        reportMessageAt(location, message);
      } else if (parameters !== undefined) {
        parameters.strictError = { location, message };
      }
    } else {
      nextArrowStrictParameterError = { location, message };
    }
  };
  const recordNonSimpleParameter = () => {
    const target = getExpressionScope();
    if (isArrowHeadParsingScope(target)) target.hasSimpleParameterList = false;
  };
  const validateAsPattern = (expression: Expression, begin: number, end: number) => {
    const target = getExpressionScope();
    if (!canBeExpression(target)) return;
    validatePatternOf(target, expression, begin, end);
    target.errors[EXPRESSION_ERROR] = undefined;
  };
  const validateAsExpression = () => {
    const target = getExpressionScope();
    if (!canBeExpression(target)) return;
    validate(target, EXPRESSION_ERROR);
    target.errors[PATTERN_ERROR] = undefined;
  };

  // The variable that an identifier names, which a declaration's scope declares and an
  // expression's scope tracks, as a possible arrow function's parameter.
  const newVariable = (name: string, start: number) => {
    const target = getExpressionScope();
    if (canBeExpression(target)) {
      target.variables.push({ name, position: start });
      return;
    }
    declareInExpressionScope(target, name, start);
  };
  const declareInExpressionScope = (target: ExpressionScope, name: string, start: number) => {
    if (target.type === EXPRESSION_SCOPE.ParameterDeclaration) {
      const result = declare(name, VARIABLE_KIND.Parameter, VARIABLE_MODE.Var, scope, start);
      if (target.duplicateLocation.start < 0 && !result.isAdded) {
        target.duplicateLocation = { start, end: start + name.length };
      }
      return;
    }
    const mode = target.mode;
    declare(name, VARIABLE_KIND.Normal, mode, scope, start);
    target.names?.push(name);
    if (target.type === EXPRESSION_SCOPE.LexicalDeclaration && name === "let") {
      reportMessageAt({ start, end: start + name.length }, "kLetInLexicalBinding");
    }
  };
  const declareIdentifier = (name: string, start: number) =>
    declareInExpressionScope(getExpressionScope(), name, start);

  const openAccumulationScope = (): AccumulationScope => {
    const target = getExpressionScope();
    if (!canBeExpression(target)) return { scope: undefined, errors: [undefined, undefined] };
    const accumulation = { scope: target, errors: [...target.errors] };
    target.errors = [undefined, undefined];
    return accumulation;
  };
  const accumulate = (accumulation: AccumulationScope) => {
    const target = accumulation.scope;
    if (target === undefined) return;
    for (const index of [EXPRESSION_ERROR, PATTERN_ERROR]) {
      if (accumulation.errors[index] === undefined)
        accumulation.errors[index] = target.errors[index];
      target.errors[index] = undefined;
    }
  };
  const validateAccumulatedExpression = (accumulation: AccumulationScope) => {
    const target = accumulation.scope;
    if (target === undefined) return;
    validate(target, EXPRESSION_ERROR);
    target.errors[PATTERN_ERROR] = undefined;
  };
  const closeAccumulationScope = (accumulation: AccumulationScope) => {
    const target = accumulation.scope;
    if (target === undefined) return;
    accumulate(accumulation);
    for (const index of [EXPRESSION_ERROR, PATTERN_ERROR]) {
      const error = accumulation.errors[index];
      if (error !== undefined) target.errors[index] = error;
    }
  };
  const withAccumulationScope = <T>(run: (accumulation: AccumulationScope) => T): T => {
    const accumulation = openAccumulationScope();
    try {
      return run(accumulation);
    } finally {
      closeAccumulationScope(accumulation);
    }
  };

  // Checks an arrow function's head where an arrow follows it, and returns the arrow function's
  // scope, which declares its parameters.
  const validateAndCreateArrowScope = (target: ExpressionScope) => {
    const kind =
      target.type === EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration
        ? FUNCTION_KIND.AsyncArrowFunction
        : FUNCTION_KIND.ArrowFunction;
    const result = newFunctionScope(kind);
    if (target.declarationError !== undefined) {
      reportMessageAt(target.declarationError.location, target.declarationError.message);
      return result;
    }
    validate(target, PATTERN_ERROR);
    if (!target.hasSimpleParameterList) result.hasSimpleParameters = false;
    const mode = target.hasSimpleParameterList ? VARIABLE_MODE.Var : VARIABLE_MODE.Let;
    for (const proxy of target.variables) {
      const declared = declareVariable(
        result,
        proxy.name,
        proxy.position,
        mode,
        VARIABLE_KIND.Parameter,
      );
      if (!declared.isAdded) {
        reportMessageAt(
          { start: proxy.position, end: proxy.position + proxy.name.length },
          "kParamDupe",
        );
      }
    }
    return result;
  };

  const isAssignableIdentifier = (expression: Expression) =>
    expression.kind === EXPRESSION.Identifier &&
    !(isStrict() && isEvalOrArguments(expression.name));
  const isValidReferenceExpression = (expression: Expression) =>
    isAssignableIdentifier(expression) || expression.kind === EXPRESSION.Property;
  const isPattern = (expression: Expression) =>
    expression.kind === EXPRESSION.ObjectLiteral || expression.kind === EXPRESSION.ArrayLiteral;

  const rewriteInvalidReferenceExpression = (
    expression: Expression,
    begin: number,
    end: number,
    message: MessageName,
    isEarlyError: boolean,
  ) => {
    if (expression.kind === EXPRESSION.Identifier) {
      reportMessageAt({ start: begin, end }, "kStrictEvalArguments");
      return createFailure();
    }
    if (expression.kind === EXPRESSION.Call && !expression.isTaggedTemplate && !isEarlyError) {
      recordPatternError({ start: begin, end }, "kInvalidDestructuringTarget");
      return createExpression(EXPRESSION.Property, begin);
    }
    reportMessageAt({ start: begin, end }, message);
    return createFailure();
  };

  const classifyParameter = (name: string, begin: number, end: number) => {
    if (isEvalOrArguments(name)) {
      recordStrictModeParameterError({ start: begin, end }, "kStrictEvalArguments");
    }
  };

  const classifyArrowParameter = (
    accumulation: AccumulationScope,
    at: number,
    parameter: Expression,
  ) => {
    accumulate(accumulation);
    if (
      parameter.isParenthesized ||
      !(
        parameter.kind === EXPRESSION.Identifier ||
        isPattern(parameter) ||
        parameter.kind === EXPRESSION.Assignment
      )
    ) {
      recordDeclarationError({ start: at, end: endPosition() }, "kInvalidDestructuringTarget");
    } else if (parameter.kind === EXPRESSION.Identifier) {
      classifyParameter(parameter.name, at, endPosition());
    } else {
      recordNonSimpleParameter();
    }
  };

  // Identifiers.

  const parseAndClassifyIdentifier = (token: number) => {
    const name = scanner.getCurrentLiteral();
    if (token >= TOKEN.Identifier && token <= TOKEN.Async) {
      if (
        name === "arguments" &&
        isClassInitializerFunction(getReceiverScope(scope).functionKind)
      ) {
        reportMessage("kArgumentsDisallowedInInitializerAndStaticBlock");
        return "";
      }
      return name;
    }
    if (!isValidIdentifier(token, isStrict(), isGenerator(), isAwaitAsIdentifierDisallowed())) {
      reportUnexpectedToken(token);
      return "";
    }
    if (token === TOKEN.Await) {
      recordAsyncArrowParametersError(scanner.getLocation(), "kAwaitBindingIdentifier");
      return name;
    }
    recordStrictModeParameterError(scanner.getLocation(), "kUnexpectedStrictReserved");
    return name;
  };

  const parseIdentifier = (kind = functionState.scope.functionKind) => {
    const token = next();
    if (
      !isValidIdentifier(
        token,
        isStrict(),
        isGeneratorFunction(kind),
        isModule || isAwaitAsIdentifierDisallowedFor(kind),
      )
    ) {
      reportUnexpectedToken(token);
      return "";
    }
    return scanner.getCurrentLiteral();
  };

  const parseNonRestrictedIdentifier = () => {
    const name = parseIdentifier();
    if (isStrict() && isEvalOrArguments(name)) {
      reportMessageAt(scanner.getLocation(), "kStrictEvalArguments");
    }
    return name;
  };

  const parsePropertyName = () => {
    const token = next();
    if (isPropertyName(token)) return scanner.getCurrentLiteral();
    reportUnexpectedToken(token);
    return "";
  };

  const parsePropertyOrPrivatePropertyName = () => {
    const at = position();
    const token = next();
    if (isPropertyName(token)) return createExpression(EXPRESSION.StringLiteral, at);
    if (token === TOKEN.PrivateName) {
      const name = scanner.getCurrentLiteral();
      const classes = getPrivateNameScopes(scope);
      if (classes.length === 0) {
        reportMessageAt({ start: at, end: at + 1 }, "kInvalidPrivateFieldResolution", name);
        return createFailure();
      }
      classes[0].unresolvedPrivateNames.push({ name, position: at });
      return createExpression(EXPRESSION.Other, at, { isPrivateReference: true, name });
    }
    reportUnexpectedToken(token);
    return createFailure();
  };

  // Literals.

  const parseRegExpLiteral = () => {
    const at = peekPosition();
    if (!scanner.scanRegExpPattern()) {
      next();
      reportMessage("kUnterminatedRegExp");
      return createFailure();
    }
    const pattern = scanner.getNextLiteral();
    const flags = scanner.scanRegExpFlags();
    if (flags === undefined || (flags.includes("u") && flags.includes("v"))) {
      next();
      reportMessage("kMalformedRegExpFlags");
      return createFailure();
    }
    next();
    const error = getRegExpError(pattern, flags);
    if (error !== undefined) {
      reportMessage("kMalformedRegExp", pattern, flags, error);
      return createFailure();
    }
    return createExpression(EXPRESSION.OtherLiteral, at);
  };

  const expressionFromLiteral = (token: number, at: number) => {
    if (token === TOKEN.Number || token === TOKEN.Smi) {
      return createExpression(EXPRESSION.NumberLiteral, at);
    }
    if (token === TOKEN.String) return createExpression(EXPRESSION.StringLiteral, at);
    return createExpression(EXPRESSION.OtherLiteral, at);
  };

  const parseBindingPattern = (): Expression => {
    const begin = peekPosition();
    const token = peek();
    if (isAnyIdentifier(token)) {
      const name = parseAndClassifyIdentifier(next());
      if (isStrict() && isEvalOrArguments(name)) {
        reportMessageAt(scanner.getLocation(), "kStrictEvalArguments");
        return createFailure();
      }
      newVariable(name, begin);
      return createExpression(EXPRESSION.Identifier, begin, { name });
    }
    if (token === TOKEN.LeftBracket) return parseArrayLiteral();
    if (token === TOKEN.LeftBrace) return parseObjectLiteral();
    reportUnexpectedToken(next());
    return createFailure();
  };

  const expressionFromIdentifier = (name: string, at: number) => {
    newVariable(name, at);
    return createExpression(EXPRESSION.Identifier, at, { name });
  };

  const parsePrimaryExpression = (): Expression => {
    let begin = peekPosition();
    let token = peek();
    if (isAnyIdentifier(token)) {
      consume();
      let kind: number = FUNCTION_KIND.ArrowFunction;
      if (
        token === TOKEN.Async &&
        !scanner.hasLineTerminatorBeforeNext() &&
        !scanner.isLiteralEscaped()
      ) {
        if (peek() === TOKEN.Function) return parseAsyncFunctionLiteral();
        if (isAnyIdentifier(peek()) && scanner.peekAhead() === TOKEN.Arrow) {
          token = next();
          begin = position();
          kind = FUNCTION_KIND.AsyncArrowFunction;
        }
      }
      if (peek() === TOKEN.Arrow) {
        return withExpressionScope(
          kind === FUNCTION_KIND.ArrowFunction
            ? EXPRESSION_SCOPE.MaybeArrowParameterDeclaration
            : EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration,
          (arrowHead) => {
            nextArrowStrictParameterError = undefined;
            const name = parseAndClassifyIdentifier(token);
            classifyParameter(name, begin, endPosition());
            const result = expressionFromIdentifier(name, begin);
            nextArrowScope = validateAndCreateArrowScope(arrowHead);
            return result;
          },
        );
      }
      const name = parseAndClassifyIdentifier(token);
      return expressionFromIdentifier(name, begin);
    }
    if (isLiteral(token)) return expressionFromLiteral(next(), begin);
    switch (token) {
      case TOKEN.New:
        return parseMemberWithPresentNewPrefixesExpression();
      case TOKEN.This:
        consume();
        return createExpression(EXPRESSION.Other, begin);
      case TOKEN.AssignDiv:
      case TOKEN.Div:
        return parseRegExpLiteral();
      case TOKEN.Function:
        return parseFunctionExpression();
      case TOKEN.Super:
        return parseSuperExpression();
      case TOKEN.Import:
        return parseImportExpressions();
      case TOKEN.LeftBracket:
        return parseArrayLiteral();
      case TOKEN.LeftBrace:
        return parseObjectLiteral();
      case TOKEN.LeftParen: {
        consume();
        if (check(TOKEN.RightParen)) {
          nextArrowStrictParameterError = undefined;
          if (peek() !== TOKEN.Arrow) reportUnexpectedToken(TOKEN.RightParen);
          nextArrowScope = newFunctionScope(FUNCTION_KIND.ArrowFunction);
          return createExpression(EXPRESSION.EmptyParentheses, begin, { isParenthesized: true });
        }
        return withExpressionScope(EXPRESSION_SCOPE.MaybeArrowParameterDeclaration, (arrowHead) => {
          nextArrowStrictParameterError = undefined;
          const expression = withAcceptIn(true, () => parseExpressionCoverGrammar());
          expression.isParenthesized = true;
          expect(TOKEN.RightParen);
          if (peek() === TOKEN.Arrow) {
            nextArrowScope = validateAndCreateArrowScope(arrowHead);
          } else {
            validateExpressionOf(arrowHead);
          }
          return expression;
        });
      }
      case TOKEN.Class:
        return parseClassExpression();
      case TOKEN.TemplateSpan:
      case TOKEN.TemplateTail:
        return parseTemplateLiteral(undefined, begin, false);
      default:
        break;
    }
    reportUnexpectedToken(next());
    return createFailure();
  };

  const parseExpression = () =>
    withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
      const result = withAcceptIn(true, () => parseExpressionCoverGrammar());
      validateExpressionOf(target);
      return result;
    });

  const parseConditionalChainAssignmentExpression = () =>
    withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
      const result = parseConditionalChainAssignmentExpressionCoverGrammar();
      validateExpressionOf(target);
      return result;
    });

  const parseAssignmentExpression = () =>
    withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
      const result = parseAssignmentExpressionCoverGrammar();
      validateExpressionOf(target);
      return result;
    });

  const parseExpressionCoverGrammar = (): Expression =>
    withAccumulationScope((accumulation) => {
      const list: Expression[] = [];
      let expression = createFailure();
      for (;;) {
        if (peek() === TOKEN.Ellipsis) return parseArrowParametersWithRest(list, accumulation);
        const at = peekPosition();
        expression = parseAssignmentExpressionCoverGrammar();
        classifyArrowParameter(accumulation, at, expression);
        list.push(expression);
        if (!check(TOKEN.Comma)) break;
        if (peek() === TOKEN.RightParen && scanner.peekAhead() === TOKEN.Arrow) break;
      }
      if (list.length === 1) return expression;
      return createCommaList(list);
    });

  // A comma's list of expressions, which starts at its second where it holds two, as V8 builds it.
  const createCommaList = (list: Expression[]) =>
    createExpression(EXPRESSION.Nary, list[list.length === 2 ? 1 : 0].position, {
      operator: TOKEN.Comma,
      arity: list.length,
    });

  const parseArrowParametersWithRest = (list: Expression[], accumulation: AccumulationScope) => {
    consume();
    const ellipsis = scanner.getLocation();
    const at = peekPosition();
    const pattern = parseBindingPattern();
    classifyArrowParameter(accumulation, at, pattern);
    recordNonSimpleParameter();
    if (peek() === TOKEN.Assign) {
      reportMessage("kRestDefaultInitializer");
      return createFailure();
    }
    if (peek() === TOKEN.Comma) {
      reportMessage("kParamAfterRest");
      return createFailure();
    }
    if (peek() !== TOKEN.RightParen || scanner.peekAhead() !== TOKEN.Arrow) {
      reportUnexpectedTokenAt(ellipsis, TOKEN.Ellipsis);
      return createFailure();
    }
    list.push(createExpression(EXPRESSION.Spread, ellipsis.start));
    return createCommaList(list);
  };

  const parseArrayLiteral = (): Expression => {
    const at = peekPosition();
    consume();
    return withAccumulationScope((accumulation) => {
      while (!check(TOKEN.RightBracket)) {
        let element: Expression;
        if (peek() === TOKEN.Comma) {
          element = createExpression(EXPRESSION.Other, -1);
        } else if (check(TOKEN.Ellipsis)) {
          const start = position();
          const argument = withAcceptIn(true, () =>
            parsePossibleDestructuringSubPattern(accumulation),
          );
          element = createExpression(EXPRESSION.Spread, start);
          if (argument.kind === EXPRESSION.Assignment) {
            recordPatternError({ start, end: endPosition() }, "kInvalidDestructuringTarget");
          }
          if (peek() === TOKEN.Comma) {
            recordPatternError({ start, end: endPosition() }, "kElementAfterRest");
          }
        } else {
          element = withAcceptIn(true, () => parsePossibleDestructuringSubPattern(accumulation));
        }
        if (peek() !== TOKEN.RightBracket) {
          expect(TOKEN.Comma);
          if (element.kind === EXPRESSION.Failure) return element;
        }
      }
      return createExpression(EXPRESSION.ArrayLiteral, at);
    });
  };

  const parsePropertyKindFromToken = (info: PropertyInfo, token: number) => {
    switch (token) {
      case TOKEN.Colon:
        info.kind = PROPERTY_KIND.Value;
        return true;
      case TOKEN.Comma:
        info.kind = PROPERTY_KIND.Shorthand;
        return true;
      case TOKEN.RightBrace:
        info.kind = PROPERTY_KIND.ShorthandOrClassField;
        return true;
      case TOKEN.Assign:
        info.kind = PROPERTY_KIND.Assign;
        return true;
      case TOKEN.LeftParen:
        info.kind = PROPERTY_KIND.Method;
        return true;
      case TOKEN.Mul:
      case TOKEN.Semicolon:
        info.kind = PROPERTY_KIND.ClassField;
        return true;
      default:
        return false;
    }
  };

  const parseProperty = (info: PropertyInfo): Expression => {
    if (check(TOKEN.Async)) {
      const token = peek();
      if (
        (token !== TOKEN.Mul && parsePropertyKindFromToken(info, token)) ||
        scanner.hasLineTerminatorBeforeNext()
      ) {
        info.name = scanner.getCurrentLiteral();
        return createExpression(EXPRESSION.StringLiteral, position());
      }
      if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
      info.functionFlags = FUNCTION_FLAG.Async;
      info.kind = PROPERTY_KIND.Method;
    }
    if (check(TOKEN.Mul)) {
      info.functionFlags |= FUNCTION_FLAG.Generator;
      info.kind = PROPERTY_KIND.Method;
    }
    if (info.kind === PROPERTY_KIND.NotSet && (peek() === TOKEN.Get || peek() === TOKEN.Set)) {
      const token = next();
      if (parsePropertyKindFromToken(info, peek())) {
        info.name = scanner.getCurrentLiteral();
        return createExpression(EXPRESSION.StringLiteral, position());
      }
      if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
      info.kind = token === TOKEN.Get ? PROPERTY_KIND.AccessorGetter : PROPERTY_KIND.AccessorSetter;
    }
    const at = peekPosition();
    switch (peek()) {
      case TOKEN.PrivateName:
        info.isPrivate = true;
        consume();
        if (info.kind === PROPERTY_KIND.NotSet) parsePropertyKindFromToken(info, peek());
        info.name = scanner.getCurrentLiteral();
        if (info.isObjectLiteral) {
          reportUnexpectedToken(TOKEN.PrivateName);
          info.kind = PROPERTY_KIND.NotSet;
          return createFailure();
        }
        break;
      case TOKEN.String:
      case TOKEN.Smi:
      case TOKEN.Number:
      case TOKEN.BigInt:
        consume();
        info.name = scanner.getCurrentLiteral();
        break;
      case TOKEN.LeftBracket: {
        info.name = "";
        info.isComputedName = true;
        consume();
        const expression = withAcceptIn(true, () => parseAssignmentExpression());
        expect(TOKEN.RightBracket);
        if (info.kind === PROPERTY_KIND.NotSet) parsePropertyKindFromToken(info, peek());
        return expression;
      }
      case TOKEN.Ellipsis:
        if (info.kind === PROPERTY_KIND.NotSet) {
          info.name = "";
          consume();
          return withAcceptIn(true, () => {
            const start = peekPosition();
            const expression = parsePossibleDestructuringSubPattern(info.accumulationScope);
            info.kind = PROPERTY_KIND.Spread;
            if (!isValidReferenceExpression(expression)) {
              recordDeclarationError({ start, end: endPosition() }, "kInvalidRestBindingPattern");
              recordPatternError({ start, end: endPosition() }, "kInvalidRestAssignmentPattern");
            }
            if (peek() !== TOKEN.RightBrace) {
              recordPatternError(scanner.getLocation(), "kElementAfterRest");
            }
            return expression;
          });
        }
        info.name = parsePropertyName();
        break;
      default:
        info.name = parsePropertyName();
        break;
    }
    if (info.kind === PROPERTY_KIND.NotSet) parsePropertyKindFromToken(info, peek());
    return createExpression(EXPRESSION.StringLiteral, at);
  };

  const createPropertyInfo = (
    isObjectLiteral: boolean,
    accumulationScope?: AccumulationScope,
  ): PropertyInfo => ({
    accumulationScope,
    name: "",
    isObjectLiteral,
    functionFlags: FUNCTION_FLAG.Normal,
    kind: PROPERTY_KIND.NotSet,
    isComputedName: false,
    isPrivate: false,
    isStatic: false,
    isRest: false,
  });

  const parseCurrentSymbolAsClassFieldOrMethod = (info: PropertyInfo) => {
    if (peek() === TOKEN.LeftParen) {
      info.kind = PROPERTY_KIND.Method;
      info.name = scanner.getCurrentLiteral();
      return createExpression(EXPRESSION.StringLiteral, position());
    }
    if (peek() === TOKEN.Assign || peek() === TOKEN.Semicolon || peek() === TOKEN.RightBrace) {
      info.name = scanner.getCurrentLiteral();
      return createExpression(EXPRESSION.StringLiteral, position());
    }
    return undefined;
  };

  const ensureClassInitializerScope = (classInfo: ClassInfo, isStatic: boolean) => {
    if (isStatic) {
      classInfo.staticElementsScope ??= (() => {
        const created = newFunctionScope(
          classInfo.instanceMembersScope === undefined
            ? FUNCTION_KIND.ClassStaticInitializerFunction
            : FUNCTION_KIND.ClassStaticInitializerFunctionPrecededByMember,
        );
        created.isStrict = true;
        return created;
      })();
      return classInfo.staticElementsScope;
    }
    classInfo.instanceMembersScope ??= (() => {
      const created = newFunctionScope(
        classInfo.staticElementsScope === undefined
          ? FUNCTION_KIND.ClassMembersInitializerFunction
          : FUNCTION_KIND.ClassMembersInitializerFunctionPrecededByStatic,
      );
      created.isStrict = true;
      return created;
    })();
    return classInfo.instanceMembersScope;
  };

  const checkClassMethodName = (
    name: string,
    kind: number,
    flags: number,
    isStatic: boolean,
    classInfo: ClassInfo,
  ) => {
    const isAccessor =
      kind === PROPERTY_KIND.AccessorGetter || kind === PROPERTY_KIND.AccessorSetter;
    if (name === "#constructor") {
      reportMessage("kConstructorIsPrivate");
      return;
    }
    if (isStatic) {
      if (name === "prototype") reportMessage("kStaticPrototype");
      return;
    }
    if (name !== "constructor") return;
    if (flags !== FUNCTION_FLAG.Normal || isAccessor) {
      reportMessage(
        (flags & FUNCTION_FLAG.Generator) !== 0
          ? "kConstructorIsGenerator"
          : (flags & FUNCTION_FLAG.Async) !== 0
            ? "kConstructorIsAsync"
            : "kConstructorIsAccessor",
      );
      return;
    }
    if (classInfo.hasSeenConstructor) {
      reportMessage("kDuplicateConstructor");
      return;
    }
    classInfo.hasSeenConstructor = true;
  };

  const checkClassFieldName = (name: string, isStatic: boolean) => {
    if (isStatic && name === "prototype") {
      reportMessage("kStaticPrototype");
      return;
    }
    if (name === "constructor" || name === "#constructor") reportMessage("kConstructorClassField");
  };

  const parseMemberInitializer = (classInfo: ClassInfo, isStatic: boolean) =>
    withoutExpressionScope(() => {
      const initializerScope = ensureClassInitializerScope(classInfo, isStatic);
      if (check(TOKEN.Assign)) {
        withFunctionState(initializerScope, () =>
          withAcceptIn(true, () => parseAssignmentExpression()),
        );
      }
    });

  // Parses a class element, and returns its property's kind, or undefined where it fails.
  const parseClassPropertyDefinition = (
    classInfo: ClassInfo,
    info: PropertyInfo,
    hasExtends: boolean,
  ) => {
    const nameToken = peek();
    const nameTokenPosition = peekPosition();
    let nameExpression: Expression | undefined;
    if (nameToken === TOKEN.Static) {
      consume();
      nameExpression = parseCurrentSymbolAsClassFieldOrMethod(info);
      if (nameExpression === undefined) {
        info.isStatic = true;
        nameExpression = parseProperty(info);
      }
    } else {
      nameExpression = parseProperty(info);
    }
    switch (info.kind) {
      case PROPERTY_KIND.Assign:
      case PROPERTY_KIND.AutoAccessorClassField:
      case PROPERTY_KIND.ClassField:
      case PROPERTY_KIND.ShorthandOrClassField:
      case PROPERTY_KIND.NotSet:
        if (!info.isComputedName) checkClassFieldName(info.name, info.isStatic);
        parseMemberInitializer(classInfo, info.isStatic);
        expectSemicolon();
        info.kind = PROPERTY_KIND.ClassField;
        return info.kind;
      case PROPERTY_KIND.Method: {
        if (!info.isComputedName) {
          checkClassMethodName(
            info.name,
            PROPERTY_KIND.Method,
            info.functionFlags,
            info.isStatic,
            classInfo,
          );
        }
        const isConstructor = !info.isStatic && info.name === "constructor";
        const kind = isConstructor
          ? hasExtends
            ? FUNCTION_KIND.DerivedConstructor
            : FUNCTION_KIND.BaseConstructor
          : getFunctionKind(info.isStatic ? 2 : 1, info.functionFlags);
        parseFunctionLiteral(
          info.name,
          scanner.getLocation(),
          FUNCTION_NAME.SkipCheck,
          kind,
          nameTokenPosition,
        );
        return info.kind;
      }
      case PROPERTY_KIND.AccessorGetter:
      case PROPERTY_KIND.AccessorSetter: {
        const isGet = info.kind === PROPERTY_KIND.AccessorGetter;
        if (!info.isComputedName) {
          checkClassMethodName(
            info.name,
            info.kind,
            FUNCTION_FLAG.Normal,
            info.isStatic,
            classInfo,
          );
        }
        const kind = info.isStatic
          ? isGet
            ? FUNCTION_KIND.StaticGetterFunction
            : FUNCTION_KIND.StaticSetterFunction
          : isGet
            ? FUNCTION_KIND.GetterFunction
            : FUNCTION_KIND.SetterFunction;
        parseFunctionLiteral(
          info.name,
          scanner.getLocation(),
          FUNCTION_NAME.SkipCheck,
          kind,
          nameTokenPosition,
        );
        return info.kind;
      }
      default:
        reportUnexpectedTokenAt(
          { start: nameTokenPosition, end: nameExpression.position },
          nameToken,
        );
        return undefined;
    }
  };

  const parseClassStaticBlock = (classInfo: ClassInfo) => {
    consume();
    const initializerScope = ensureClassInitializerScope(classInfo, true);
    withFunctionState(initializerScope, () =>
      withoutExpressionScope(() =>
        withAcceptIn(true, () => {
          const varblockScope = newVarblockScope();
          parseBlock(undefined, varblockScope);
          checkConflictingVarDeclarations(varblockScope);
        }),
      ),
    );
  };

  // Parses an object literal's property, and returns false where it fails.
  const parseObjectPropertyDefinition = (info: PropertyInfo, proto: { isSeen: boolean }) => {
    const nameToken = peek();
    const nextLocation = scanner.getPeekLocation();
    parseProperty(info);
    const name = info.name;
    switch (info.kind) {
      case PROPERTY_KIND.Spread:
        info.isComputedName = true;
        info.isRest = true;
        return true;
      case PROPERTY_KIND.Value: {
        if (!info.isComputedName && scanner.getCurrentLiteral() === "__proto__") {
          if (proto.isSeen) recordExpressionError(scanner.getLocation(), "kDuplicateProto");
          proto.isSeen = true;
        }
        consume();
        withAcceptIn(true, () => parsePossibleDestructuringSubPattern(info.accumulationScope));
        return true;
      }
      case PROPERTY_KIND.Assign:
      case PROPERTY_KIND.ShorthandOrClassField:
      case PROPERTY_KIND.Shorthand: {
        if (!classifyPropertyIdentifier(nameToken, info)) return false;
        const lhs = expressionFromIdentifier(name, nextLocation.start);
        if (!isAssignableIdentifier(lhs)) {
          recordPatternError(nextLocation, "kStrictEvalArguments");
        }
        if (peek() === TOKEN.Assign) {
          consume();
          withAcceptIn(true, () => parseAssignmentExpression());
          recordExpressionError(
            { start: nextLocation.start, end: endPosition() },
            "kInvalidCoverInitializedName",
          );
        }
        return true;
      }
      case PROPERTY_KIND.Method: {
        recordPatternError(
          { start: nextLocation.start, end: endPosition() },
          "kInvalidDestructuringTarget",
        );
        const kind = getFunctionKind(1, info.functionFlags);
        parseObjectLiteralMethod(name, kind, nextLocation.start);
        return true;
      }
      case PROPERTY_KIND.AccessorGetter:
      case PROPERTY_KIND.AccessorSetter: {
        const isGet = info.kind === PROPERTY_KIND.AccessorGetter;
        recordPatternError(
          { start: nextLocation.start, end: endPosition() },
          "kInvalidDestructuringTarget",
        );
        parseObjectLiteralMethod(
          name,
          isGet ? FUNCTION_KIND.GetterFunction : FUNCTION_KIND.SetterFunction,
          nextLocation.start,
        );
        return true;
      }
      default:
        reportUnexpectedToken(next());
        return false;
    }
  };

  const parseObjectLiteralMethod = (name: string, kind: number, at: number) => {
    const run = () =>
      parseFunctionLiteral(name, scanner.getLocation(), FUNCTION_NAME.SkipCheck, kind, at);
    if (objectLiteralScope === undefined) {
      run();
      return;
    }
    withScope(objectLiteralScope, run);
  };

  const classifyPropertyIdentifier = (token: number, info: PropertyInfo) => {
    if (token >= TOKEN.Identifier && token <= TOKEN.Async) {
      if (
        info.name === "arguments" &&
        isClassInitializerFunction(getReceiverScope(scope).functionKind)
      ) {
        reportMessage("kArgumentsDisallowedInInitializerAndStaticBlock");
        return false;
      }
      return true;
    }
    if (!isValidIdentifier(token, isStrict(), isGenerator(), isAwaitAsIdentifierDisallowed())) {
      reportUnexpectedToken(token);
      return false;
    }
    if (token === TOKEN.Await) {
      recordAsyncArrowParametersError(scanner.getPeekLocation(), "kAwaitBindingIdentifier");
    }
    return true;
  };

  const parseObjectLiteral = (): Expression => {
    const at = peekPosition();
    consume();
    return withAccumulationScope((accumulation) => {
      const outerObjectLiteralScope = objectLiteralScope;
      objectLiteralScope = newScope(SCOPE_TYPE.Block);
      try {
        const proto = { isSeen: false };
        let count = 0;
        let hasRestProperty = false;
        while (!check(TOKEN.RightBrace)) {
          const info = createPropertyInfo(true, accumulation);
          if (!parseObjectPropertyDefinition(info, proto)) return createFailure();
          count += 1;
          hasRestProperty ||= info.isRest;
          if (peek() !== TOKEN.RightBrace) expect(TOKEN.Comma);
        }
        if (hasRestProperty && count > MAX_ARGUMENTS) {
          recordPatternError({ start: at, end: position() }, "kTooManyArguments");
        }
        return createExpression(EXPRESSION.ObjectLiteral, at);
      } finally {
        objectLiteralScope = outerObjectLiteralScope;
      }
    });
  };

  // Parses a call's arguments, and returns how many it gives.
  const parseArguments = (isMaybeArrow: boolean) => {
    consume();
    let count = 0;
    withAccumulationScope((accumulation) => {
      while (peek() !== TOKEN.RightParen) {
        const isSpread = check(TOKEN.Ellipsis);
        const at = peekPosition();
        const argument = withAcceptIn(true, () => parseAssignmentExpressionCoverGrammar());
        if (isMaybeArrow) {
          classifyArrowParameter(accumulation, at, argument);
          if (isSpread) {
            recordNonSimpleParameter();
            if (argument.kind === EXPRESSION.Assignment) {
              recordAsyncArrowParametersError(scanner.getLocation(), "kRestDefaultInitializer");
            }
            if (peek() === TOKEN.Comma) {
              recordAsyncArrowParametersError(scanner.getPeekLocation(), "kParamAfterRest");
            }
          }
        }
        count += 1;
        if (!check(TOKEN.Comma)) break;
      }
    });
    if (count + 1 > MAX_ARGUMENTS) {
      reportMessage("kTooManyArguments");
      return count;
    }
    const location = scanner.getLocation();
    if (!check(TOKEN.RightParen)) reportMessageAt(location, "kUnterminatedArgList");
    return count;
  };

  const parseConditionalChainAssignmentExpressionCoverGrammar = () => {
    const begin = peekPosition();
    if (peek() === TOKEN.Yield && isGenerator()) return parseYieldExpression();
    const expression = parseLogicalExpression();
    const op = peek();
    if (!isArrowOrAssignmentOp(op) || peek() === TOKEN.Conditional) return expression;
    return parseAssignmentExpressionCoverGrammarContinuation(begin, expression);
  };

  const parseAssignmentExpressionCoverGrammar = (): Expression => {
    const begin = peekPosition();
    if (peek() === TOKEN.Yield && isGenerator()) return parseYieldExpression();
    const expression = parseConditionalExpression();
    if (!isArrowOrAssignmentOp(peek())) return expression;
    return parseAssignmentExpressionCoverGrammarContinuation(begin, expression);
  };

  const parseAssignmentExpressionCoverGrammarContinuation = (
    begin: number,
    leftHandSide: Expression,
  ): Expression => {
    const op = peek();
    let expression = leftHandSide;
    if (op === TOKEN.Arrow) {
      if (expression.kind !== EXPRESSION.Identifier && !expression.isParenthesized) {
        reportMessageAt(
          { start: expression.position, end: position() },
          "kMalformedArrowFunParamList",
        );
        return createFailure();
      }
      const arrowScope = nextArrowScope ?? newFunctionScope(FUNCTION_KIND.ArrowFunction);
      const formals: FormalParameters = {
        scope: arrowScope,
        hasRest: false,
        isSimple: arrowScope.hasSimpleParameters,
        arity: 0,
        duplicateLocation: INVALID_LOCATION,
        strictError: nextArrowStrictParameterError,
      };
      nextArrowScope = undefined;
      nextArrowStrictParameterError = undefined;
      if (
        expression.kind !== EXPRESSION.EmptyParentheses &&
        !hasError() &&
        expression.arity + 1 > MAX_ARGUMENTS
      ) {
        reportMessageAt({ start: begin, end: endPosition() }, "kMalformedArrowFunParamList");
      }
      return parseArrowFunctionLiteral(formals, begin);
    }
    if (isAssignableIdentifier(expression)) {
      if (expression.isParenthesized) {
        recordDeclarationError({ start: begin, end: endPosition() }, "kInvalidDestructuringTarget");
      }
    } else if (expression.kind === EXPRESSION.Property) {
      recordDeclarationError(
        { start: begin, end: endPosition() },
        "kInvalidPropertyBindingPattern",
      );
      validateAsExpression();
    } else if (isPattern(expression) && op === TOKEN.Assign) {
      if (expression.isParenthesized) {
        const location = { start: begin, end: endPosition() };
        if (isCertainlyDeclaration(getExpressionScope())) {
          reportMessageAt(location, "kInvalidDestructuringTarget");
        } else {
          reportMessageAt(location, "kInvalidLhsInAssignment");
        }
      }
      validateAsPattern(expression, begin, endPosition());
    } else {
      expression = rewriteInvalidReferenceExpression(
        expression,
        begin,
        endPosition(),
        "kInvalidLhsInAssignment",
        isLogicalAssignmentOp(op),
      );
    }
    consume();
    const opPosition = position();
    parseAssignmentExpression();
    if (op !== TOKEN.Assign) {
      recordPatternError({ start: begin, end: endPosition() }, "kInvalidDestructuringTarget");
    }
    return createExpression(
      op === TOKEN.Assign ? EXPRESSION.Assignment : EXPRESSION.CompoundAssignment,
      opPosition,
    );
  };

  const parseYieldExpression = () => {
    const at = peekPosition();
    recordParameterInitializerError(scanner.getPeekLocation(), "kYieldInParameter");
    consume();
    if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
    if (!scanner.hasLineTerminatorBeforeNext()) {
      const isDelegating = check(TOKEN.Mul);
      switch (peek()) {
        case TOKEN.Eos:
        case TOKEN.Semicolon:
        case TOKEN.RightBrace:
        case TOKEN.RightBracket:
        case TOKEN.RightParen:
        case TOKEN.Colon:
        case TOKEN.Comma:
        case TOKEN.In:
          if (!isDelegating) break;
          parseAssignmentExpressionCoverGrammar();
          break;
        default:
          parseAssignmentExpressionCoverGrammar();
          break;
      }
    }
    return createExpression(EXPRESSION.Other, at);
  };

  const parseConditionalExpression = () => {
    const at = peekPosition();
    const expression = parseLogicalExpression();
    return peek() === TOKEN.Conditional ? parseConditionalChainExpression(at) : expression;
  };

  const parseLogicalExpression = () => {
    let expression = parseBinaryExpression(6);
    if (peek() === TOKEN.And || peek() === TOKEN.Or) {
      expression = parseBinaryContinuation(expression, 4, getPrecedence(peek(), isInAccepted));
    } else if (peek() === TOKEN.Nullish) {
      expression = parseCoalesceExpression(expression);
    }
    return expression;
  };

  const parseCoalesceExpression = (start: Expression) => {
    let expression = start;
    let isFirst = true;
    while (peek() === TOKEN.Nullish) {
      consume();
      const at = peekPosition();
      parseBinaryExpression(6);
      if (isFirst) {
        expression = createExpression(EXPRESSION.Binary, at, {
          operator: TOKEN.Nullish,
          firstPosition: expression.position,
        });
        isFirst = false;
      } else {
        expression = collapseNary(expression, TOKEN.Nullish) ?? expression;
      }
    }
    return expression;
  };

  const parseConditionalChainExpression = (conditionPosition: number) => {
    let isElseFound = false;
    do {
      consume();
      withAcceptIn(true, () => parseAssignmentExpression());
      expect(TOKEN.Colon);
      parseConditionalChainAssignmentExpression();
      isElseFound = peek() !== TOKEN.Conditional;
    } while (!isElseFound);
    return createExpression(EXPRESSION.Other, conditionPosition);
  };

  // An operation that merges a binary or an n-ary operation of the same operator into an n-ary
  // one, which starts at its first operand and is never parenthesized, or undefined for another.
  const collapseNary = (left: Expression, op: number) => {
    if (op === TOKEN.Exp || !(op === TOKEN.Comma || (op >= TOKEN.Nullish && op <= TOKEN.Sub))) {
      return undefined;
    }
    if (left.kind === EXPRESSION.Binary && left.operator === op) {
      return createExpression(EXPRESSION.Nary, left.firstPosition, { operator: op });
    }
    if (left.kind === EXPRESSION.Nary && left.operator === op) {
      left.isParenthesized = false;
      return left;
    }
    return undefined;
  };

  const FOLDED_OPERATORS = new Set<number>([
    TOKEN.Add,
    TOKEN.Sub,
    TOKEN.Mul,
    TOKEN.Div,
    TOKEN.Mod,
    TOKEN.BitOr,
    TOKEN.BitAnd,
    TOKEN.BitXor,
    TOKEN.Shl,
    TOKEN.Shr,
    TOKEN.Sar,
    TOKEN.Exp,
  ]);

  // A binary operation, as V8 builds it: a comparison, a literal that it folds from two number
  // literals or two strings, or an operation that it merges into an n-ary one.
  const createBinary = (left: Expression, op: number, at: number, right: Expression) => {
    if (isCompareOp(op)) return createExpression(EXPRESSION.Other, at);
    if (
      left.kind === EXPRESSION.NumberLiteral &&
      right.kind === EXPRESSION.NumberLiteral &&
      FOLDED_OPERATORS.has(op)
    ) {
      return createExpression(EXPRESSION.NumberLiteral, at);
    }
    if (op === TOKEN.Add && right.kind === EXPRESSION.StringLiteral) {
      if (left.kind === EXPRESSION.StringLiteral) {
        return createExpression(EXPRESSION.ConsStringLiteral, left.position);
      }
      if (left.kind === EXPRESSION.ConsStringLiteral) {
        left.isParenthesized = false;
        return left;
      }
    }
    return (
      collapseNary(left, op) ??
      createExpression(EXPRESSION.Binary, at, { operator: op, firstPosition: left.position })
    );
  };

  const parseBinaryContinuation = (start: Expression, precedence: number, initial: number) => {
    let expression = start;
    let current = initial;
    do {
      while (getPrecedence(peek(), isInAccepted) === current) {
        const at = peekPosition();
        const op = next();
        const right = parseBinaryExpression(op === TOKEN.Exp ? current : current + 1);
        expression = createBinary(expression, op, at, right);
      }
      current -= 1;
    } while (current >= precedence);
    return expression;
  };

  const parseBinaryExpression = (precedence: number): Expression => {
    if (peek() === TOKEN.PrivateName) {
      const expression = parsePropertyOrPrivatePropertyName();
      const initial = getPrecedence(peek(), isInAccepted);
      if (peek() !== TOKEN.In || initial < precedence) {
        reportUnexpectedToken(TOKEN.PrivateName);
        return createFailure();
      }
      return parseBinaryContinuation(expression, precedence, initial);
    }
    const expression = parseUnaryExpression();
    const initial = getPrecedence(peek(), isInAccepted);
    if (initial >= precedence) return parseBinaryContinuation(expression, precedence, initial);
    return expression;
  };

  const parseUnaryOrPrefixExpression = (): Expression => {
    const op = next();
    const at = position();
    const expressionPosition = peekPosition();
    const expression = parseUnaryExpression();
    if (isUnaryOp(op)) {
      if (op === TOKEN.Delete) {
        if (expression.kind === EXPRESSION.Identifier && isStrict()) {
          reportMessage("kStrictDelete");
          return createFailure();
        }
        if (isPrivateReference(expression)) {
          reportMessage("kDeletePrivateField");
          return createFailure();
        }
      }
      if (peek() === TOKEN.Exp) {
        reportMessageAt(
          { start: at, end: peekEndPosition() },
          "kUnexpectedTokenUnaryExponentiation",
        );
        return createFailure();
      }
      if (expression.kind === EXPRESSION.NumberLiteral && op === TOKEN.Add) return expression;
      if (
        (expression.kind === EXPRESSION.NumberLiteral &&
          (op === TOKEN.Sub || op === TOKEN.BitNot)) ||
        (op === TOKEN.Not &&
          (expression.kind === EXPRESSION.NumberLiteral ||
            expression.kind === EXPRESSION.StringLiteral ||
            expression.kind === EXPRESSION.OtherLiteral))
      ) {
        return createExpression(
          op === TOKEN.Not ? EXPRESSION.OtherLiteral : EXPRESSION.NumberLiteral,
          at,
        );
      }
      return createExpression(EXPRESSION.Other, at);
    }
    if (!isValidReferenceExpression(expression)) {
      rewriteInvalidReferenceExpression(
        expression,
        expressionPosition,
        endPosition(),
        "kInvalidLhsInPrefixOp",
        false,
      );
    }
    return createExpression(EXPRESSION.Other, position());
  };

  const isPrivateReference = (expression: Expression) => expression.isPrivateReference;

  const parseAwaitExpression = (): Expression => {
    recordParameterInitializerError(scanner.getPeekLocation(), "kAwaitExpressionFormalParameter");
    const at = peekPosition();
    consume();
    if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
    parseUnaryExpression();
    if (peek() === TOKEN.Exp) {
      reportMessageAt({ start: at, end: peekEndPosition() }, "kUnexpectedTokenUnaryExponentiation");
      return createFailure();
    }
    return createExpression(EXPRESSION.Other, at);
  };

  const parseUnaryExpression = (): Expression => {
    const op = peek();
    if (isUnaryOrCountOp(op)) return parseUnaryOrPrefixExpression();
    if (isAwaitAllowed() && op === TOKEN.Await) return parseAwaitExpression();
    return parsePostfixExpression();
  };

  const parsePostfixExpression = () => {
    const begin = peekPosition();
    const expression = parseLeftHandSideExpression();
    if (!isCountOp(peek()) || scanner.hasLineTerminatorBeforeNext()) return expression;
    if (!isValidReferenceExpression(expression)) {
      rewriteInvalidReferenceExpression(
        expression,
        begin,
        endPosition(),
        "kInvalidLhsInPostfixOp",
        false,
      );
    }
    next();
    return createExpression(EXPRESSION.Other, position());
  };

  const parseLeftHandSideExpression = () => {
    const result = parseMemberExpression();
    if (!isPropertyOrCall(peek())) return result;
    return parseLeftHandSideContinuation(result);
  };

  const parseLeftHandSideContinuation = (start: Expression): Expression => {
    let result = start;
    if (
      peek() === TOKEN.LeftParen &&
      result.kind === EXPRESSION.Identifier &&
      scanner.getCurrentToken() === TOKEN.Async &&
      !scanner.hasLineTerminatorBeforeNext() &&
      !scanner.isLiteralEscaped()
    ) {
      const at = position();
      const arrow = withExpressionScope(
        EXPRESSION_SCOPE.MaybeAsyncArrowParameterDeclaration,
        (arrowHead) => {
          nextArrowStrictParameterError = undefined;
          const count = parseArguments(true);
          if (peek() === TOKEN.Arrow) {
            nextArrowScope = validateAndCreateArrowScope(arrowHead);
            return createExpression(
              count === 0 ? EXPRESSION.EmptyParentheses : EXPRESSION.Nary,
              at,
              {
                isParenthesized: true,
                arity: count,
              },
            );
          }
          validateExpressionOf(arrowHead);
          return undefined;
        },
      );
      if (arrow !== undefined) return arrow;
      result = createExpression(EXPRESSION.Call, at);
      if (!isPropertyOrCall(peek())) return result;
    }
    let isOptionalChaining = false;
    let isOptional = false;
    do {
      switch (peek()) {
        case TOKEN.QuestionPeriod: {
          if (isOptional) {
            reportUnexpectedToken(peek());
            return createFailure();
          }
          consume();
          isOptional = true;
          isOptionalChaining = true;
          if (isPropertyOrCall(peek())) continue;
          const at = position();
          const key = parsePropertyOrPrivatePropertyName();
          result = createExpression(EXPRESSION.Property, at, {
            isPrivateReference: key.isPrivateReference,
          });
          break;
        }
        case TOKEN.LeftBracket: {
          consume();
          const at = position();
          withAcceptIn(true, () => parseExpressionCoverGrammar());
          result = createExpression(EXPRESSION.Property, at);
          expect(TOKEN.RightBracket);
          break;
        }
        case TOKEN.Period: {
          if (isOptional) {
            reportUnexpectedToken(next());
            return createFailure();
          }
          consume();
          const at = position();
          const key = parsePropertyOrPrivatePropertyName();
          result = createExpression(EXPRESSION.Property, at, {
            isPrivateReference: key.isPrivateReference,
          });
          break;
        }
        case TOKEN.LeftParen: {
          const at = isCallable(scanner.getCurrentToken()) ? position() : peekPosition();
          parseArguments(false);
          result = createExpression(EXPRESSION.Call, at);
          break;
        }
        default:
          if (isOptionalChaining) {
            reportMessageAt(scanner.getPeekLocation(), "kOptionalChainingNoTemplate");
            return createFailure();
          }
          result = parseTemplateLiteral(result, position(), true);
          break;
      }
      isOptional = false;
    } while (isPropertyOrCall(peek()));
    if (isOptionalChaining) {
      return createExpression(EXPRESSION.OptionalChain, result.position, {
        isPrivateReference: result.isPrivateReference,
      });
    }
    return result;
  };

  const parseMemberWithPresentNewPrefixesExpression = (): Expression => {
    consume();
    const newPosition = position();
    let result: Expression;
    if (peek() === TOKEN.Import) {
      result = parseMemberExpression();
      if (result.kind === EXPRESSION.ImportCall) {
        reportMessageAt(scanner.getLocation(), "kImportCallNotNewExpression");
        return createFailure();
      }
    } else if (peek() === TOKEN.Period) {
      result = parseNewTargetExpression();
      return parseMemberExpressionContinuation(result);
    } else {
      result = parseMemberExpression();
      if (result.kind === EXPRESSION.SuperCallReference) {
        reportMessageAt(scanner.getLocation(), "kUnexpectedSuper");
        return createFailure();
      }
    }
    if (peek() === TOKEN.LeftParen) {
      parseArguments(false);
      return parseMemberExpressionContinuation(createExpression(EXPRESSION.CallNew, newPosition));
    }
    if (peek() === TOKEN.QuestionPeriod) {
      reportMessageAt(scanner.getPeekLocation(), "kOptionalChainingNoNew");
      return createFailure();
    }
    return createExpression(EXPRESSION.CallNew, newPosition);
  };

  const parseFunctionExpression = (): Expression => {
    consume();
    const functionTokenPosition = position();
    const kind = check(TOKEN.Mul) ? FUNCTION_KIND.GeneratorFunction : FUNCTION_KIND.NormalFunction;
    let name: string | undefined;
    const isStrictReservedName = isStrictReservedWord(peek());
    let nameLocation = INVALID_LOCATION;
    if (isAnyIdentifier(peek())) {
      name = parseIdentifier(kind);
      nameLocation = scanner.getLocation();
    }
    const result = parseFunctionLiteral(
      name,
      nameLocation,
      isStrictReservedName ? FUNCTION_NAME.IsStrictReserved : FUNCTION_NAME.Unknown,
      kind,
      functionTokenPosition,
    );
    return result ?? createFailure();
  };

  const parseMemberExpression = () => parseMemberExpressionContinuation(parsePrimaryExpression());

  const parseMemberExpressionContinuation = (expression: Expression) =>
    isMember(peek()) ? doParseMemberExpressionContinuation(expression) : expression;

  const parseImportExpressions = (): Expression => {
    consume();
    const at = position();
    let isSourcePhase = false;
    if (check(TOKEN.Period)) {
      if (checkContextualKeyword("source")) {
        isSourcePhase = true;
      } else {
        expectContextualKeyword("meta", "import.meta", at);
        if (!isModule) {
          reportMessageAt(scanner.getLocation(), "kImportMetaOutsideModule");
          return createFailure();
        }
        return createExpression(EXPRESSION.Other, at);
      }
    }
    if (peek() !== TOKEN.LeftParen) {
      if (!isModule) {
        reportMessageAt(scanner.getLocation(), "kImportOutsideModule");
      } else {
        reportUnexpectedToken(next());
      }
      return createFailure();
    }
    consume();
    if (peek() === TOKEN.RightParen) {
      reportMessageAt(scanner.getLocation(), "kImportMissingSpecifier");
      return createFailure();
    }
    withAcceptIn(true, () => {
      parseAssignmentExpressionCoverGrammar();
      if (!isSourcePhase && check(TOKEN.Comma)) {
        if (check(TOKEN.RightParen)) return;
        parseAssignmentExpressionCoverGrammar();
        check(TOKEN.Comma);
        expect(TOKEN.RightParen);
        return;
      }
      expect(TOKEN.RightParen);
    });
    return createExpression(EXPRESSION.ImportCall, at);
  };

  const parseSuperExpression = (): Expression => {
    consume();
    const at = position();
    const receiverScope = getReceiverScope(scope);
    const kind = receiverScope.functionKind;
    if (
      receiverScope.type === SCOPE_TYPE.Function &&
      (isConciseMethod(kind) || isAccessorFunction(kind) || isClassConstructor(kind))
    ) {
      if (isProperty(peek())) {
        if (peek() === TOKEN.Period && scanner.peekAhead() === TOKEN.PrivateName) {
          consume();
          consume();
          reportMessage("kUnexpectedPrivateField");
          return createFailure();
        }
        if (peek() === TOKEN.QuestionPeriod) {
          consume();
          reportMessage("kOptionalChainingNoSuper");
          return createFailure();
        }
        return createExpression(EXPRESSION.SuperPropertyReference, at);
      }
      if (peek() === TOKEN.LeftParen && isDerivedConstructor(kind)) {
        return createExpression(EXPRESSION.SuperCallReference, at);
      }
    }
    reportMessageAt(scanner.getLocation(), "kUnexpectedSuper");
    return createFailure();
  };

  const parseNewTargetExpression = (): Expression => {
    const at = position();
    consume();
    expectContextualKeyword("target", "new.target", at);
    if (getReceiverScope(scope).type !== SCOPE_TYPE.Function) {
      reportMessageAt(scanner.getLocation(), "kUnexpectedNewTarget");
      return createFailure();
    }
    return createExpression(EXPRESSION.NewTarget, at);
  };

  const doParseMemberExpressionContinuation = (start: Expression) => {
    let expression = start;
    do {
      switch (peek()) {
        case TOKEN.LeftBracket: {
          consume();
          const at = position();
          withAcceptIn(true, () => parseExpressionCoverGrammar());
          expression = createExpression(EXPRESSION.Property, at);
          expect(TOKEN.RightBracket);
          break;
        }
        case TOKEN.Period: {
          consume();
          const at = peekPosition();
          const key = parsePropertyOrPrivatePropertyName();
          expression = createExpression(EXPRESSION.Property, at, {
            isPrivateReference: key.isPrivateReference,
          });
          break;
        }
        default: {
          const at = scanner.getCurrentToken() === TOKEN.Identifier ? position() : peekPosition();
          expression = parseTemplateLiteral(expression, at, true);
          break;
        }
      }
    } while (isMember(peek()));
    return expression;
  };

  // Parses a function's formal parameter into the parameters.
  const parseFormalParameter = (formals: FormalParameters) => {
    const at = peekPosition();
    const pattern = parseBindingPattern();
    if (pattern.kind === EXPRESSION.Identifier) {
      classifyParameter(pattern.name, at, endPosition());
    } else {
      formals.isSimple = false;
    }
    if (check(TOKEN.Assign)) {
      formals.isSimple = false;
      if (formals.hasRest) {
        reportMessage("kRestDefaultInitializer");
        return;
      }
      withAcceptIn(true, () => parseAssignmentExpression());
    }
    formals.arity += 1;
  };

  const parseFormalParameterList = (formals: FormalParameters) => {
    const outer = parameters;
    parameters = formals;
    try {
      if (peek() !== TOKEN.RightParen) {
        for (;;) {
          formals.hasRest = check(TOKEN.Ellipsis);
          parseFormalParameter(formals);
          if (formals.hasRest) {
            formals.isSimple = false;
            if (peek() === TOKEN.Comma) {
              reportMessageAt(scanner.getPeekLocation(), "kParamAfterRest");
              return;
            }
            break;
          }
          if (!check(TOKEN.Comma)) break;
          if (peek() === TOKEN.RightParen) break;
        }
      }
      if (formals.arity + 1 > MAX_ARGUMENTS) {
        reportMessage("kTooManyParameters");
        return;
      }
      if (!formals.isSimple) formals.scope.hasSimpleParameters = false;
    } finally {
      parameters = outer;
    }
  };

  const parseVariableDeclarations = (
    varContext: number,
    result: DeclarationResult,
    names: string[] | undefined,
  ) => {
    switch (peek()) {
      case TOKEN.Var:
        result.mode = VARIABLE_MODE.Var;
        consume();
        break;
      case TOKEN.Const:
        consume();
        result.mode = VARIABLE_MODE.Const;
        break;
      case TOKEN.Let:
        consume();
        result.mode = VARIABLE_MODE.Let;
        break;
      case TOKEN.Using:
        consume();
        result.mode = VARIABLE_MODE.Using;
        break;
      default:
        consume();
        consume();
        result.mode = VARIABLE_MODE.AwaitUsing;
        break;
    }
    withExpressionScope(
      isLexicalVariableMode(result.mode)
        ? EXPRESSION_SCOPE.LexicalDeclaration
        : EXPRESSION_SCOPE.VarDeclaration,
      () => {
        const bindingsStart = peekPosition();
        do {
          const declarationPosition = peekPosition();
          let name: string | undefined;
          let isIdentifierPattern = false;
          if (isAnyIdentifier(peek())) {
            name = parseAndClassifyIdentifier(next());
            if (isStrict() && isEvalOrArguments(name)) {
              reportMessageAt(scanner.getLocation(), "kStrictEvalArguments");
              return;
            }
            isIdentifierPattern = true;
            declareIdentifier(name, declarationPosition);
          } else if (
            result.mode !== VARIABLE_MODE.Using &&
            result.mode !== VARIABLE_MODE.AwaitUsing
          ) {
            parseBindingPattern();
          } else {
            reportMessageAt(
              { start: declarationPosition, end: endPosition() },
              "kDeclarationMissingInitializer",
              "using",
            );
            return;
          }
          const variableLocation = scanner.getLocation();
          if (check(TOKEN.Assign)) {
            withAcceptIn(varContext !== VAR_CONTEXT.ForStatement, () =>
              parseAssignmentExpression(),
            );
            variableLocation.end = endPosition();
            if (result.firstInitializerLocation.start < 0) {
              result.firstInitializerLocation = variableLocation;
            }
          } else if (varContext !== VAR_CONTEXT.ForStatement || !peekInOrOf()) {
            if (isImmutableLexicalVariableMode(result.mode) || name === undefined) {
              reportMessageAt(
                { start: declarationPosition, end: endPosition() },
                "kDeclarationMissingInitializer",
                name === undefined
                  ? "destructuring"
                  : result.mode === VARIABLE_MODE.Const
                    ? "const"
                    : result.mode === VARIABLE_MODE.Using
                      ? "using"
                      : "await using",
              );
              return;
            }
          }
          result.declarations.push({ isIdentifierPattern });
        } while (check(TOKEN.Comma));
        result.bindingsLocation = { start: bindingsStart, end: endPosition() };
      },
      result.mode,
      names,
    );
  };

  const createDeclarationResult = (): DeclarationResult => ({
    mode: VARIABLE_MODE.Var,
    declarations: [],
    firstInitializerLocation: INVALID_LOCATION,
    bindingsLocation: INVALID_LOCATION,
  });

  const parseFunctionDeclaration = (): Statement => {
    consume();
    const at = position();
    if (check(TOKEN.Mul)) {
      reportMessageAt(scanner.getLocation(), "kGeneratorInSingleStatementContext");
      return "null";
    }
    return parseHoistableDeclarationAt(at, FUNCTION_FLAG.Normal, undefined, false);
  };

  const parseHoistableDeclaration = (names: string[] | undefined, isDefaultExport: boolean) => {
    consume();
    const at = position();
    const flags = check(TOKEN.Mul) ? FUNCTION_FLAG.Generator : FUNCTION_FLAG.Normal;
    return parseHoistableDeclarationAt(at, flags, names, isDefaultExport);
  };

  const parseHoistableDeclarationAt = (
    at: number,
    initialFlags: number,
    names: string[] | undefined,
    isDefaultExport: boolean,
  ): Statement => {
    let flags = initialFlags;
    if ((flags & FUNCTION_FLAG.Async) !== 0 && check(TOKEN.Mul)) flags |= FUNCTION_FLAG.Generator;
    let name: string | undefined;
    let variableName: string;
    let nameValidity: number;
    if (peek() === TOKEN.LeftParen) {
      if (!isDefaultExport) {
        reportMessage("kMissingFunctionName");
        return "null";
      }
      name = "default";
      variableName = "*default*";
      nameValidity = FUNCTION_NAME.SkipCheck;
    } else {
      const isStrictReserved = isStrictReservedWord(peek());
      name = parseIdentifier();
      nameValidity = isStrictReserved ? FUNCTION_NAME.IsStrictReserved : FUNCTION_NAME.Unknown;
      variableName = name;
    }
    const kind = getFunctionKind(0, flags);
    parseFunctionLiteral(name, scanner.getLocation(), nameValidity, kind, at);
    const mode =
      !scope.isDeclarationScope || scope.type === SCOPE_TYPE.Module
        ? VARIABLE_MODE.Let
        : VARIABLE_MODE.Var;
    const kindOfVariable =
      !isStrict() && !scope.isDeclarationScope && flags === FUNCTION_FLAG.Normal
        ? VARIABLE_KIND.SloppyBlockFunction
        : VARIABLE_KIND.Normal;
    declare(variableName, kindOfVariable, mode, scope, at);
    names?.push(variableName);
    return "other";
  };

  const parseClassDeclaration = (
    names: string[] | undefined,
    isDefaultExport: boolean,
  ): Statement => {
    const classTokenPosition = position();
    let name = "";
    const isStrictReserved = isStrictReservedWord(peek());
    let variableName: string;
    if (isDefaultExport && (peek() === TOKEN.Extends || peek() === TOKEN.LeftBrace)) {
      name = "default";
      variableName = "*default*";
    } else {
      name = parseIdentifier();
      variableName = name;
    }
    withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
      parseClassLiteral(name, scanner.getLocation(), isStrictReserved, classTokenPosition);
      validateExpressionOf(target);
    });
    declare(
      variableName,
      VARIABLE_KIND.Normal,
      VARIABLE_MODE.Let,
      scope,
      classTokenPosition,
      endPosition(),
    );
    names?.push(variableName);
    return "other";
  };

  const parseAsyncFunctionDeclaration = (names: string[] | undefined, isDefaultExport: boolean) => {
    if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
    const at = position();
    consume();
    return parseHoistableDeclarationAt(at, FUNCTION_FLAG.Async, names, isDefaultExport);
  };

  const validateFormalParameters = (formals: FormalParameters, isDuplicateAllowed: boolean) => {
    if (!isDuplicateAllowed && formals.duplicateLocation.start >= 0) {
      reportMessageAt(formals.duplicateLocation, "kParamDupe");
    }
    if (isStrict() && formals.strictError !== undefined) {
      reportMessageAt(formals.strictError.location, formals.strictError.message);
    }
  };

  const parseFunctionBody = (
    formals: FormalParameters,
    kind: number,
    isExpressionBody: boolean,
  ) => {
    const functionScope = formals.scope;
    let innerScope = functionScope;
    if (!formals.isSimple) {
      if (hasError()) return;
      innerScope = newVarblockScope();
    }
    withScope(innerScope, () => {
      if (isExpressionBody) {
        parseAssignmentExpression();
        return;
      }
      parseStatementList(TOKEN.RightBrace);
      expect(TOKEN.RightBrace);
    });
    let isDuplicateAllowed = false;
    checkConflictingVarDeclarations(innerScope);
    if (formals.isSimple) {
      isDuplicateAllowed = !functionScope.isStrict && !isConciseMethod(kind);
    } else {
      functionScope.isStrict = innerScope.isStrict;
      if (innerScope.variables.size > 0) {
        const conflict = findVariableDeclaredIn(
          innerScope,
          functionScope,
          VARIABLE_MODE.AwaitUsing,
        );
        if (conflict !== undefined) reportVarRedeclarationIn(conflict, innerScope);
      }
    }
    validateFormalParameters(formals, isDuplicateAllowed);
  };

  const checkArityRestrictions = (
    count: number,
    kind: number,
    hasRest: boolean,
    start: number,
    end: number,
  ) => {
    if (isGetterFunction(kind)) {
      if (count !== 0) reportMessageAt({ start, end }, "kBadGetterArity");
    } else if (isSetterFunction(kind)) {
      if (count !== 1) reportMessageAt({ start, end }, "kBadSetterArity");
      if (hasRest) reportMessageAt({ start, end }, "kBadSetterRestParameter");
    }
  };

  const isNextLetKeyword = () => {
    switch (scanner.peekAhead()) {
      case TOKEN.LeftBrace:
      case TOKEN.LeftBracket:
      case TOKEN.Identifier:
      case TOKEN.Static:
      case TOKEN.Let:
      case TOKEN.Yield:
      case TOKEN.Await:
      case TOKEN.Get:
      case TOKEN.Set:
      case TOKEN.Of:
      case TOKEN.Using:
      case TOKEN.Accessor:
      case TOKEN.Async:
        return true;
      case TOKEN.FutureStrictReservedWord:
      case TOKEN.EscapedStrictReservedWord:
        return !isStrict();
      default:
        return false;
    }
  };

  const isNextUsingKeyword = (isAwaitUsing: boolean) => {
    const after = isAwaitUsing ? scanner.peekAheadAhead() : scanner.peekAhead();
    switch (after) {
      case TOKEN.Identifier:
      case TOKEN.Static:
      case TOKEN.Let:
      case TOKEN.Yield:
      case TOKEN.Await:
      case TOKEN.Get:
      case TOKEN.Set:
      case TOKEN.Using:
      case TOKEN.Accessor:
      case TOKEN.Async:
        return true;
      case TOKEN.Of:
        return isAwaitUsing || scanner.peekAheadAhead() === TOKEN.Assign;
      case TOKEN.FutureStrictReservedWord:
      case TOKEN.EscapedStrictReservedWord:
        return !isStrict();
      default:
        return false;
    }
  };

  const isStartingWithUsingOrAwaitUsingKeyword = () =>
    (peek() === TOKEN.Using &&
      !scanner.hasLineTerminatorAfterNext() &&
      isNextUsingKeyword(false)) ||
    (isAwaitAllowed() &&
      peek() === TOKEN.Await &&
      !scanner.hasLineTerminatorAfterNext() &&
      scanner.peekAhead() === TOKEN.Using &&
      !scanner.hasLineTerminatorAfterNextNext() &&
      isNextUsingKeyword(true));

  const parseArrowFunctionLiteral = (formals: FormalParameters, start: number): Expression => {
    if (scanner.hasLineTerminatorBeforeNext()) {
      reportUnexpectedTokenAt(scanner.getPeekLocation(), TOKEN.Arrow);
      return createFailure();
    }
    const kind = formals.scope.functionKind;
    withFunctionState(formals.scope, () => {
      consume();
      if (peek() === TOKEN.LeftBrace) {
        consume();
        withAcceptIn(true, () =>
          withoutExpressionScope(() => parseFunctionBody(formals, kind, false)),
        );
      } else {
        withoutExpressionScope(() => parseFunctionBody(formals, kind, true));
      }
      if (isStrict()) checkStrictOctalLiteral(start, endPosition());
    });
    return createExpression(EXPRESSION.FunctionLiteral, start);
  };

  const parseClassExpression = (): Expression => {
    consume();
    const classTokenPosition = position();
    let name = "";
    let isStrictReservedName = false;
    let nameLocation = INVALID_LOCATION;
    if (isAnyIdentifier(peek())) {
      name = parseAndClassifyIdentifier(next());
      nameLocation = scanner.getLocation();
      isStrictReservedName = isStrictReservedWord(scanner.getCurrentToken());
    }
    return parseClassLiteral(name, nameLocation, isStrictReservedName, classTokenPosition);
  };

  const parseClassLiteral = (
    name: string,
    nameLocation: Location,
    isNameStrictReserved: boolean,
    classTokenPosition: number,
  ): Expression => {
    const isAnonymous = name === "";
    if (!isAnonymous) {
      if (isNameStrictReserved) {
        reportMessageAt(nameLocation, "kUnexpectedStrictReserved");
        return createFailure();
      }
      if (isEvalOrArguments(name)) {
        reportMessageAt(nameLocation, "kStrictEvalArguments");
        return createFailure();
      }
    }
    const classScope = newScope(SCOPE_TYPE.Class);
    return withScope(classScope, () => {
      classScope.isStrict = true;
      const outerObjectLiteralScope = objectLiteralScope;
      objectLiteralScope = undefined;
      try {
        const classInfo: ClassInfo = {
          hasSeenConstructor: false,
          staticElementsScope: undefined,
          instanceMembersScope: undefined,
        };
        let hasExtends = false;
        if (check(TOKEN.Extends)) {
          hasExtends = true;
          classScope.isParsingHeritage = true;
          try {
            withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
              parseLeftHandSideExpression();
              validateExpressionOf(target);
            });
          } finally {
            classScope.isParsingHeritage = false;
          }
        }
        expect(TOKEN.LeftBrace);
        parseClassLiteralBody(classInfo, hasExtends);
        checkStrictOctalLiteral(classTokenPosition, endPosition());
        const unresolvable = resolvePrivateNamesPartially(classScope);
        if (unresolvable !== undefined) {
          reportMessageAt(
            { start: unresolvable.position, end: unresolvable.position + 1 },
            "kInvalidPrivateFieldResolution",
            unresolvable.name,
          );
          return createFailure();
        }
        return createExpression(EXPRESSION.Other, classTokenPosition);
      } finally {
        objectLiteralScope = outerObjectLiteralScope;
      }
    });
  };

  const resolvePrivateNamesPartially = (classScope: Scope) => {
    const unresolved = classScope.unresolvedPrivateNames;
    if (unresolved.length === 0) return undefined;
    const outerClasses = getPrivateNameScopes(classScope).slice(1);
    const hasPrivateNames = classScope.privateNames.size > 0;
    if (!hasPrivateNames && outerClasses.length === 0) return unresolved[0];
    classScope.unresolvedPrivateNames = [];
    for (const reference of unresolved) {
      if (hasPrivateNames && classScope.privateNames.has(reference.name)) continue;
      if (outerClasses.length === 0) return reference;
      outerClasses[0].unresolvedPrivateNames.push(reference);
    }
    return undefined;
  };

  const getPrivateVariableMode = (kind: number) => {
    switch (kind) {
      case PROPERTY_KIND.Method:
        return VARIABLE_MODE.PrivateMethod;
      case PROPERTY_KIND.AccessorGetter:
        return VARIABLE_MODE.PrivateGetterOnly;
      case PROPERTY_KIND.AccessorSetter:
        return VARIABLE_MODE.PrivateSetterOnly;
      case PROPERTY_KIND.AutoAccessorClassField:
        return VARIABLE_MODE.PrivateGetterAndSetter;
      default:
        return VARIABLE_MODE.Const;
    }
  };

  const parseClassLiteralBody = (classInfo: ClassInfo, hasExtends: boolean) => {
    while (peek() !== TOKEN.RightBrace) {
      if (check(TOKEN.Semicolon)) continue;
      if (peek() === TOKEN.Static && scanner.peekAhead() === TOKEN.LeftBrace) {
        parseClassStaticBlock(classInfo);
        continue;
      }
      const info = createPropertyInfo(false);
      const kind = parseClassPropertyDefinition(classInfo, info, hasExtends);
      if (hasError()) return;
      if (info.isPrivate && kind !== undefined) {
        const isAdded = declarePrivateName(
          scope,
          info.name,
          getPrivateVariableMode(kind),
          info.isStatic,
        );
        if (!isAdded) reportMessageAt(scanner.getLocation(), "kVarRedeclaration", info.name);
      }
    }
    expect(TOKEN.RightBrace);
  };

  const parseAsyncFunctionLiteral = (): Expression => {
    if (scanner.isLiteralEscaped()) reportUnexpectedToken(TOKEN.EscapedKeyword);
    const at = position();
    consume();
    let name: string | undefined;
    const flags = check(TOKEN.Mul)
      ? FUNCTION_FLAG.Async | FUNCTION_FLAG.Generator
      : FUNCTION_FLAG.Async;
    const kind = getFunctionKind(0, flags);
    const isStrictReserved = isStrictReservedWord(peek());
    if (isAnyIdentifier(peek())) {
      name = parseIdentifier(kind);
    }
    const result = parseFunctionLiteral(
      name,
      scanner.getLocation(),
      isStrictReserved ? FUNCTION_NAME.IsStrictReserved : FUNCTION_NAME.Unknown,
      kind,
      at,
    );
    return result ?? createFailure();
  };

  const parseTemplateLiteral = (
    tag: Expression | undefined,
    start: number,
    isTagged: boolean,
  ): Expression => {
    const isIllegalEscapeForbidden = !isTagged;
    if (peek() === TOKEN.TemplateTail) {
      consume();
      checkTemplateEscapes(isIllegalEscapeForbidden);
      return createTemplateResult(tag, start, true);
    }
    consume();
    checkTemplateEscapes(isIllegalEscapeForbidden);
    let nextToken: number;
    do {
      nextToken = peek();
      const at = peekPosition();
      withAcceptIn(true, () => parseExpressionCoverGrammar());
      if (peek() !== TOKEN.RightBrace) {
        reportMessageAt({ start: at, end: peekPosition() }, "kUnterminatedTemplateExpr");
        return createFailure();
      }
      nextToken = scanner.scanTemplateContinuation();
      next();
      checkTemplateEscapes(isIllegalEscapeForbidden);
    } while (nextToken === TOKEN.TemplateSpan);
    return createTemplateResult(tag, start, false);
  };

  const createTemplateResult = (tag: Expression | undefined, start: number, isSingle: boolean) =>
    tag === undefined
      ? createExpression(isSingle ? EXPRESSION.StringLiteral : EXPRESSION.Other, start)
      : createExpression(EXPRESSION.Call, start, { isTaggedTemplate: true });

  const parsePossibleDestructuringSubPattern = (accumulation: AccumulationScope | undefined) => {
    if (accumulation !== undefined) accumulate(accumulation);
    const begin = peekPosition();
    const result = parseAssignmentExpressionCoverGrammar();
    if (isValidReferenceExpression(result)) {
      if (result.kind === EXPRESSION.Identifier) {
        if (result.isParenthesized) {
          recordDeclarationError(
            { start: begin, end: endPosition() },
            "kInvalidDestructuringTarget",
          );
        }
        classifyParameter(result.name, begin, endPosition());
      } else {
        recordDeclarationError(
          { start: begin, end: endPosition() },
          "kInvalidPropertyBindingPattern",
        );
        if (accumulation !== undefined) validateAccumulatedExpression(accumulation);
      }
    } else if (
      result.isParenthesized ||
      (!isPattern(result) && result.kind !== EXPRESSION.Assignment)
    ) {
      recordPatternError({ start: begin, end: endPosition() }, "kInvalidDestructuringTarget");
    }
    return result;
  };

  // Statements.

  const parseStatementList = (endToken: number) => {
    while (peek() === TOKEN.String) {
      const tokenLocation = scanner.getPeekLocation();
      const isUseStrict = scanner.isNextLiteralExactly("use strict");
      const statement = parseStatementListItem();
      if (statement === "null") return;
      if (statement !== "string") break;
      if (isUseStrict) {
        scope.isStrict = true;
        const closure = getClosureScope(scope);
        if (closure.type === SCOPE_TYPE.Function && !closure.hasSimpleParameters) {
          reportMessageAt(tokenLocation, "kIllegalLanguageModeDirective", "use strict");
          return;
        }
      }
    }
    while (peek() !== endToken) {
      const statement = parseStatementListItem();
      if (statement === "null") return;
    }
  };

  const parseStatementListItem = (): Statement => {
    switch (peek()) {
      case TOKEN.Function:
        return parseHoistableDeclaration(undefined, false);
      case TOKEN.Class:
        consume();
        return parseClassDeclaration(undefined, false);
      case TOKEN.Var:
      case TOKEN.Const:
        return parseVariableStatement(VAR_CONTEXT.StatementListItem, undefined);
      case TOKEN.Let:
        if (isNextLetKeyword())
          return parseVariableStatement(VAR_CONTEXT.StatementListItem, undefined);
        break;
      case TOKEN.Using:
        if (!isUsingAllowed()) break;
        if (!scanner.hasLineTerminatorAfterNext() && isAnyIdentifier(scanner.peekAhead())) {
          return parseVariableStatement(VAR_CONTEXT.StatementListItem, undefined);
        }
        break;
      case TOKEN.Await:
        if (!isAwaitAllowed()) break;
        if (!isUsingAllowed()) break;
        if (
          !scanner.hasLineTerminatorAfterNext() &&
          scanner.peekAhead() === TOKEN.Using &&
          !scanner.hasLineTerminatorAfterNextNext() &&
          isAnyIdentifier(scanner.peekAheadAhead())
        ) {
          return parseVariableStatement(VAR_CONTEXT.StatementListItem, undefined);
        }
        break;
      case TOKEN.Async:
        if (scanner.peekAhead() === TOKEN.Function && !scanner.hasLineTerminatorAfterNext()) {
          consume();
          return parseAsyncFunctionDeclaration(undefined, false);
        }
        break;
      default:
        break;
    }
    return parseStatement(undefined, undefined, true);
  };

  const parseStatement = (
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
    isLabelledFunctionAllowed = false,
  ): Statement => {
    switch (peek()) {
      case TOKEN.LeftBrace:
        return parseBlock(labels);
      case TOKEN.Semicolon:
        next();
        return "empty";
      case TOKEN.If:
        return parseIfStatement(labels);
      case TOKEN.Do:
        return parseDoWhileStatement(labels, ownLabels);
      case TOKEN.While:
        return parseWhileStatement(labels, ownLabels);
      case TOKEN.For:
        if (isAwaitAllowed() && scanner.peekAhead() === TOKEN.Await) {
          return parseForAwaitStatement(labels, ownLabels);
        }
        return parseForStatement(labels, ownLabels);
      case TOKEN.Continue:
        return parseContinueStatement();
      case TOKEN.Break:
        return parseBreakStatement(labels);
      case TOKEN.Return:
        return parseReturnStatement();
      case TOKEN.Throw:
        return parseThrowStatement();
      case TOKEN.Try:
        if (labels === undefined) return parseTryStatement();
        withTarget(
          { labels, ownLabels: undefined, isIteration: false, isTargetForAnonymous: false },
          () => parseTryStatement(),
        );
        return "other";
      case TOKEN.With:
        return parseWithStatement(labels);
      case TOKEN.Switch:
        return parseSwitchStatement(labels);
      case TOKEN.Function:
        reportMessageAt(
          scanner.getPeekLocation(),
          isStrict() ? "kStrictFunction" : "kSloppyFunction",
        );
        return "null";
      case TOKEN.Debugger:
        consume();
        expectSemicolon();
        return "other";
      case TOKEN.Var:
        return parseVariableStatement(VAR_CONTEXT.Statement, undefined);
      case TOKEN.Async:
        if (!scanner.hasLineTerminatorAfterNext() && scanner.peekAhead() === TOKEN.Function) {
          reportMessageAt(scanner.getPeekLocation(), "kAsyncFunctionInSingleStatementContext");
          return "null";
        }
        return parseExpressionOrLabelledStatement(labels, ownLabels, isLabelledFunctionAllowed);
      default:
        return parseExpressionOrLabelledStatement(labels, ownLabels, isLabelledFunctionAllowed);
    }
  };

  const parseBlock = (
    labels: string[] | undefined,
    blockScope = newScope(SCOPE_TYPE.Block),
  ): Statement =>
    withScope(blockScope, () =>
      withTarget(
        { labels, ownLabels: undefined, isIteration: false, isTargetForAnonymous: false },
        () => {
          expect(TOKEN.LeftBrace);
          while (peek() !== TOKEN.RightBrace) {
            const statement = parseStatementListItem();
            if (statement === "null") return "other";
          }
          expect(TOKEN.RightBrace);
          return "other";
        },
      ),
    );

  const parseScopedStatement = (labels: string[] | undefined): Statement => {
    if (isStrict() || peek() !== TOKEN.Function) return parseStatement(labels, undefined);
    return withScope(newScope(SCOPE_TYPE.Block), () => parseFunctionDeclaration());
  };

  const parseVariableStatement = (varContext: number, names: string[] | undefined): Statement => {
    const result = createDeclarationResult();
    parseVariableDeclarations(varContext, result, names);
    expectSemicolon();
    return "other";
  };

  const containsLabel = (labels: string[] | undefined, label: string) =>
    labels !== undefined && labels.includes(label);
  const isLabelInTargets = (label: string) =>
    functionState.targets.some((target) => containsLabel(target.labels, label));

  const parseExpressionOrLabelledStatement = (
    initialLabels: string[] | undefined,
    initialOwnLabels: string[] | undefined,
    isLabelledFunctionAllowed: boolean,
  ): Statement => {
    switch (peek()) {
      case TOKEN.Class:
        reportUnexpectedToken(next());
        return "null";
      case TOKEN.Let: {
        const afterLet = scanner.peekAhead();
        if (
          afterLet !== TOKEN.LeftBracket &&
          ((afterLet !== TOKEN.LeftBrace && afterLet !== TOKEN.Identifier) ||
            scanner.hasLineTerminatorAfterNext())
        ) {
          break;
        }
        reportMessageAt(scanner.getPeekLocation(), "kUnexpectedLexicalDeclaration");
        return "null";
      }
      default:
        break;
    }
    const isStartingWithIdentifier = isAnyIdentifier(peek());
    const isStartingWithString = peek() === TOKEN.String;
    const labelled = withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
      const expression = withAcceptIn(true, () => parseExpressionCoverGrammar());
      validateExpressionOf(target);
      if (
        peek() === TOKEN.Colon &&
        isStartingWithIdentifier &&
        expression.kind === EXPRESSION.Identifier
      ) {
        return { expression, label: target.variables[0]?.name ?? expression.name };
      }
      return { expression, label: undefined };
    });
    const label = labelled.label;
    if (label !== undefined) {
      const labels = initialLabels === undefined ? [] : [...initialLabels];
      const ownLabels = initialOwnLabels === undefined ? [] : [...initialOwnLabels];
      if (containsLabel(initialLabels, label) || isLabelInTargets(label)) {
        reportMessage("kLabelRedeclaration", label);
      } else {
        labels.push(label);
        ownLabels.push(label);
      }
      consume();
      if (peek() === TOKEN.Function && !isStrict() && isLabelledFunctionAllowed) {
        return parseFunctionDeclaration();
      }
      return parseStatement(labels, ownLabels, isLabelledFunctionAllowed);
    }
    expectSemicolon();
    if (labelled.expression.kind === EXPRESSION.Failure) return "null";
    return isStartingWithString && labelled.expression.kind === EXPRESSION.StringLiteral
      ? "string"
      : "other";
  };

  const parseIfStatement = (labels: string[] | undefined): Statement => {
    consume();
    expect(TOKEN.LeftParen);
    parseExpression();
    expect(TOKEN.RightParen);
    parseScopedStatement(labels === undefined ? undefined : [...labels]);
    if (check(TOKEN.Else)) parseScopedStatement(labels);
    return "other";
  };

  const lookupBreakTarget = (label: string | undefined) => {
    const targets = functionState.targets;
    for (let index = targets.length - 1; index >= 0; index -= 1) {
      const target = targets[index];
      if (
        (label === undefined && target.isTargetForAnonymous) ||
        (label !== undefined && containsLabel(target.labels, label))
      ) {
        return target;
      }
    }
    return undefined;
  };

  const lookupContinueTarget = (label: string | undefined) => {
    const targets = functionState.targets;
    for (let index = targets.length - 1; index >= 0; index -= 1) {
      const target = targets[index];
      if (!target.isIteration) continue;
      if (label === undefined || containsLabel(target.ownLabels, label)) return target;
    }
    return undefined;
  };

  const parseContinueStatement = (): Statement => {
    consume();
    let label: string | undefined;
    if (!scanner.hasLineTerminatorBeforeNext() && !isAutoSemicolon(peek())) {
      label = parseIdentifier();
    }
    if (lookupContinueTarget(label) === undefined) {
      const message: MessageName =
        label === undefined
          ? "kNoIterationStatement"
          : lookupBreakTarget(label) === undefined
            ? "kUnknownLabel"
            : "kIllegalContinue";
      reportMessage(message, label);
      return "null";
    }
    expectSemicolon();
    return "other";
  };

  const parseBreakStatement = (labels: string[] | undefined): Statement => {
    consume();
    let label: string | undefined;
    if (!scanner.hasLineTerminatorBeforeNext() && !isAutoSemicolon(peek())) {
      label = parseIdentifier();
    }
    if (label !== undefined && containsLabel(labels, label)) {
      expectSemicolon();
      return "empty";
    }
    if (lookupBreakTarget(label) === undefined) {
      reportMessage(label === undefined ? "kIllegalBreak" : "kUnknownLabel", label);
      return "null";
    }
    expectSemicolon();
    return "other";
  };

  const parseReturnStatement = (): Statement => {
    consume();
    const location = scanner.getLocation();
    const declarationScope = getDeclarationScope(scope);
    if (
      declarationScope.type === SCOPE_TYPE.Script ||
      declarationScope.type === SCOPE_TYPE.Eval ||
      declarationScope.type === SCOPE_TYPE.Module
    ) {
      reportMessageAt(location, "kIllegalReturn");
      return "null";
    }
    if (
      declarationScope.type === SCOPE_TYPE.Block &&
      functionState.scope.functionKind === FUNCTION_KIND.ClassStaticInitializerFunction
    ) {
      reportMessageAt(location, "kIllegalReturn");
      return "null";
    }
    if (!scanner.hasLineTerminatorBeforeNext() && !isAutoSemicolon(peek())) parseExpression();
    expectSemicolon();
    return "other";
  };

  const parseWithStatement = (labels: string[] | undefined): Statement => {
    consume();
    if (isStrict()) {
      reportMessage("kStrictWith");
      return "null";
    }
    expect(TOKEN.LeftParen);
    parseExpression();
    expect(TOKEN.RightParen);
    withScope(newScope(SCOPE_TYPE.With), () => parseStatement(labels, undefined));
    return "other";
  };

  const parseDoWhileStatement = (
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
  ): Statement =>
    withLoop(() =>
      withTarget({ labels, ownLabels, isIteration: true, isTargetForAnonymous: true }, () => {
        consume();
        parseStatement(undefined, undefined);
        expect(TOKEN.While);
        expect(TOKEN.LeftParen);
        parseExpression();
        expect(TOKEN.RightParen);
        check(TOKEN.Semicolon);
        return "other";
      }),
    );

  const parseWhileStatement = (
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
  ): Statement =>
    withLoop(() =>
      withTarget({ labels, ownLabels, isIteration: true, isTargetForAnonymous: true }, () => {
        consume();
        expect(TOKEN.LeftParen);
        parseExpression();
        expect(TOKEN.RightParen);
        parseStatement(undefined, undefined);
        return "other";
      }),
    );

  const parseThrowStatement = (): Statement => {
    consume();
    if (scanner.hasLineTerminatorBeforeNext()) {
      reportMessage("kNewlineAfterThrow");
      return "null";
    }
    parseExpression();
    expectSemicolon();
    return "other";
  };

  const parseSwitchStatement = (labels: string[] | undefined): Statement => {
    consume();
    expect(TOKEN.LeftParen);
    parseExpression();
    expect(TOKEN.RightParen);
    const casesScope = newScope(SCOPE_TYPE.Block);
    casesScope.isNonlinear = true;
    return withScope(casesScope, () =>
      withTarget(
        { labels, ownLabels: undefined, isIteration: false, isTargetForAnonymous: true },
        (): Statement => {
          let isDefaultSeen = false;
          expect(TOKEN.LeftBrace);
          while (peek() !== TOKEN.RightBrace) {
            if (check(TOKEN.Case)) {
              parseExpression();
            } else {
              expect(TOKEN.Default);
              if (isDefaultSeen) {
                reportMessage("kMultipleDefaultsInSwitch");
                return "null";
              }
              isDefaultSeen = true;
            }
            expect(TOKEN.Colon);
            while (
              peek() !== TOKEN.Case &&
              peek() !== TOKEN.Default &&
              peek() !== TOKEN.RightBrace
            ) {
              const statement = parseStatementListItem();
              if (statement === "null") return statement;
            }
          }
          expect(TOKEN.RightBrace);
          return "other";
        },
      ),
    );
  };

  const parseTryStatement = (): Statement => {
    consume();
    parseBlock(undefined);
    if (peek() !== TOKEN.Catch && peek() !== TOKEN.Finally) {
      reportMessage("kNoCatchOrFinally");
      return "null";
    }
    if (check(TOKEN.Catch)) {
      if (check(TOKEN.LeftParen)) {
        const catchScope = newScope(SCOPE_TYPE.Catch);
        const isReturned = withScope(catchScope, () =>
          withScope(newScope(SCOPE_TYPE.Block), () => {
            let catchName: string | undefined;
            if (isAnyIdentifier(peek())) {
              catchName = parseNonRestrictedIdentifier();
              if (hasError()) return true;
              catchScope.variables.set(catchName, {
                name: catchName,
                mode: VARIABLE_MODE.Var,
                kind: VARIABLE_KIND.Normal,
                isStatic: false,
              });
            } else {
              withExpressionScope(
                EXPRESSION_SCOPE.LexicalDeclaration,
                () => parseBindingPattern(),
                VARIABLE_MODE.Let,
              );
              if (hasError()) return true;
            }
            expect(TOKEN.RightParen);
            const innerScope = newScope(SCOPE_TYPE.Block);
            parseBlock(undefined, innerScope);
            const conflict =
              catchName !== undefined
                ? innerScope.variables.has(catchName)
                  ? catchName
                  : undefined
                : findVariableDeclaredIn(innerScope, scope, VARIABLE_MODE.Var);
            if (conflict !== undefined) reportVarRedeclarationIn(conflict, innerScope);
            return false;
          }),
        );
        if (isReturned) return "null";
      } else {
        parseBlock(undefined);
      }
    }
    if (check(TOKEN.Finally)) parseBlock(undefined);
    if (hasError()) return "null";
    return "other";
  };

  const parseForStatement = (
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
  ): Statement =>
    withLoop((): Statement => {
      consume();
      expect(TOKEN.LeftParen);
      const isStartingWithLet = peek() === TOKEN.Let;
      const isStartingWithUsing = isStartingWithUsingOrAwaitUsingKeyword();
      if (
        peek() === TOKEN.Const ||
        (isStartingWithLet && isNextLetKeyword()) ||
        isStartingWithUsing
      ) {
        return withScope(newScope(SCOPE_TYPE.Block), (): Statement => {
          const innerBlockScope = newScope(SCOPE_TYPE.Block);
          const result = createDeclarationResult();
          withScope(innerBlockScope, () =>
            parseVariableDeclarations(VAR_CONTEXT.ForStatement, result, []),
          );
          const mode = checkInOrOf();
          if (mode !== undefined) {
            if (isStartingWithUsing && mode === "for-in") {
              reportMessageAt(scanner.getLocation(), "kInvalidUsingInForInLoop");
            }
            return parseForEachStatementWithDeclarations(
              result,
              mode,
              labels,
              ownLabels,
              innerBlockScope,
            );
          }
          expect(TOKEN.Semicolon);
          return withScope(innerBlockScope, () =>
            withScope(newScope(SCOPE_TYPE.Block), () => parseStandardForLoop(labels, ownLabels)),
          );
        });
      }
      if (peek() === TOKEN.Var) {
        const result = createDeclarationResult();
        parseVariableDeclarations(VAR_CONTEXT.ForStatement, result, []);
        const mode = checkInOrOf();
        if (mode !== undefined) {
          return parseForEachStatementWithDeclarations(result, mode, labels, ownLabels, scope);
        }
      } else if (peek() !== TOKEN.Semicolon) {
        const nextLocation = scanner.getPeekLocation();
        const begin = nextLocation.start;
        const forEach = withExpressionScope(EXPRESSION_SCOPE.Expression, (target) =>
          withAcceptIn(false, () => {
            const expression = parseExpressionCoverGrammar();
            const isAsync =
              scanner.getCurrentToken() === TOKEN.Async && !scanner.isLiteralEscaped();
            const end = endPosition();
            const mode = checkInOrOf();
            if (mode === undefined) {
              validateExpressionOf(target);
              return { mode, isFailed: false };
            }
            if ((isStartingWithLet || isAsync) && mode === "for-of") {
              reportMessageAt(nextLocation, isStartingWithLet ? "kForOfLet" : "kForOfAsync");
              return { mode, isFailed: true };
            }
            if (isPattern(expression)) {
              validatePatternOf(target, expression, begin, end);
            } else if (expression.kind === EXPRESSION.Property) {
              validateExpressionOf(target);
            } else if (!isAssignableIdentifier(expression)) {
              rewriteInvalidReferenceExpression(expression, begin, end, "kInvalidLhsInFor", false);
            }
            return { mode, isFailed: false };
          }),
        );
        if (forEach.isFailed) return "null";
        if (forEach.mode !== undefined) {
          return parseForEachStatementWithoutDeclarations(forEach.mode, labels, ownLabels);
        }
      }
      expect(TOKEN.Semicolon);
      const result = parseStandardForLoop(labels, ownLabels);
      if (hasError()) return "null";
      return result;
    });

  const parseForEachStatementWithDeclarations = (
    result: DeclarationResult,
    mode: string,
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
    innerBlockScope: Scope,
  ): Statement => {
    if (result.declarations.length !== 1) {
      reportMessageAt(result.bindingsLocation, "kForInOfLoopMultiBindings", mode);
      return "null";
    }
    if (
      result.firstInitializerLocation.start >= 0 &&
      (isStrict() ||
        mode === "for-of" ||
        isLexicalVariableMode(result.mode) ||
        !result.declarations[0].isIdentifierPattern)
    ) {
      reportMessageAt(result.firstInitializerLocation, "kForInOfLoopInitializer", mode);
      return "null";
    }
    return withTarget({ labels, ownLabels, isIteration: true, isTargetForAnonymous: true }, () => {
      withScope(newScope(SCOPE_TYPE.Block), () => {
        if (mode === "for-of") {
          withAcceptIn(true, () => parseAssignmentExpression());
        } else {
          parseExpression();
        }
      });
      expect(TOKEN.RightParen);
      withScope(innerBlockScope, () => parseStatement(undefined, undefined));
      return "other";
    });
  };

  const parseForEachStatementWithoutDeclarations = (
    mode: string,
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
  ): Statement =>
    withTarget({ labels, ownLabels, isIteration: true, isTargetForAnonymous: true }, () => {
      if (mode === "for-of") {
        withAcceptIn(true, () => parseAssignmentExpression());
      } else {
        parseExpression();
      }
      expect(TOKEN.RightParen);
      parseStatement(undefined, undefined);
      if (hasError()) return "null";
      return "other";
    });

  const parseStandardForLoop = (
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
  ): Statement =>
    withTarget({ labels, ownLabels, isIteration: true, isTargetForAnonymous: true }, () => {
      if (peek() !== TOKEN.Semicolon) parseExpression();
      expect(TOKEN.Semicolon);
      if (peek() !== TOKEN.RightParen) parseExpression();
      expect(TOKEN.RightParen);
      parseStatement(undefined, undefined);
      return "other";
    });

  const parseForAwaitStatement = (
    labels: string[] | undefined,
    ownLabels: string[] | undefined,
  ): Statement =>
    withLoop(() =>
      withScope(newScope(SCOPE_TYPE.Block), (): Statement => {
        expect(TOKEN.For);
        expect(TOKEN.Await);
        expect(TOKEN.LeftParen);
        return withTarget(
          { labels, ownLabels, isIteration: true, isTargetForAnonymous: true },
          (): Statement => {
            const innerBlockScope = newScope(SCOPE_TYPE.Block);
            const isStartingWithLet = peek() === TOKEN.Let;
            if (
              peek() === TOKEN.Var ||
              peek() === TOKEN.Const ||
              (isStartingWithLet && isNextLetKeyword()) ||
              isStartingWithUsingOrAwaitUsingKeyword()
            ) {
              const result = createDeclarationResult();
              withScope(innerBlockScope, () =>
                parseVariableDeclarations(VAR_CONTEXT.ForStatement, result, []),
              );
              if (result.declarations.length !== 1) {
                reportMessageAt(
                  result.bindingsLocation,
                  "kForInOfLoopMultiBindings",
                  "for-await-of",
                );
                return "null";
              }
              if (result.firstInitializerLocation.start >= 0) {
                reportMessageAt(
                  result.firstInitializerLocation,
                  "kForInOfLoopInitializer",
                  "for-await-of",
                );
                return "null";
              }
            } else {
              if (isStartingWithLet) {
                reportMessageAt(scanner.getPeekLocation(), "kForOfLet");
                return "null";
              }
              const begin = peekPosition();
              withScope(innerBlockScope, () =>
                withExpressionScope(EXPRESSION_SCOPE.Expression, (target) => {
                  const lhs = parseLeftHandSideExpression();
                  const end = endPosition();
                  if (isPattern(lhs)) {
                    validatePatternOf(target, lhs, begin, end);
                  } else if (lhs.kind === EXPRESSION.Property) {
                    validateExpressionOf(target);
                  } else if (!isAssignableIdentifier(lhs)) {
                    rewriteInvalidReferenceExpression(lhs, begin, end, "kInvalidLhsInFor", false);
                  }
                }),
              );
            }
            expectContextualToken(TOKEN.Of);
            withScope(newScope(SCOPE_TYPE.Block), () =>
              withAcceptIn(true, () => parseAssignmentExpression()),
            );
            expect(TOKEN.RightParen);
            withScope(innerBlockScope, () => parseStatement(undefined, undefined));
            return "other";
          },
        );
      }),
    );

  // Functions.

  const parseFunctionLiteral = (
    functionName: string | undefined,
    nameLocation: Location,
    nameValidity: number,
    kind: number,
    functionTokenPosition: number,
  ): Expression | undefined => {
    const at = functionTokenPosition === -1 ? peekPosition() : functionTokenPosition;
    const functionScope = newFunctionScope(kind);
    if (!check(TOKEN.LeftParen)) {
      reportUnexpectedToken(next());
      return undefined;
    }
    const start = position();
    withoutExpressionScope(() =>
      withFunctionState(functionScope, () => {
        const formals: FormalParameters = {
          scope: functionScope,
          hasRest: false,
          isSimple: true,
          arity: 0,
          duplicateLocation: INVALID_LOCATION,
          strictError: undefined,
        };
        withExpressionScope(EXPRESSION_SCOPE.ParameterDeclaration, (formalsScope) => {
          parseFormalParameterList(formals);
          expect(TOKEN.RightParen);
          checkArityRestrictions(formals.arity, kind, formals.hasRest, start, endPosition());
          expect(TOKEN.LeftBrace);
          formals.duplicateLocation = formalsScope.duplicateLocation;
        });
        withAcceptIn(true, () => parseFunctionBody(formals, kind, false));
      }),
    );
    const end = endPosition();
    if (
      functionScope.isStrict &&
      functionName !== undefined &&
      nameValidity !== FUNCTION_NAME.SkipCheck
    ) {
      if (isEvalOrArguments(functionName)) {
        reportMessageAt(nameLocation, "kStrictEvalArguments");
      } else if (nameValidity === FUNCTION_NAME.IsStrictReserved) {
        reportMessageAt(nameLocation, "kUnexpectedStrictReserved");
      }
    }
    if (functionScope.isStrict) checkStrictOctalLiteral(start, end);
    return createExpression(EXPRESSION.FunctionLiteral, at);
  };

  // Modules.

  const parseModuleItem = (): Statement => {
    const token = peek();
    if (token === TOKEN.Export) return parseExportDeclaration();
    if (token === TOKEN.Import) {
      const after = scanner.peekAhead();
      if (after !== TOKEN.LeftParen && after !== TOKEN.Period) {
        parseImportDeclaration();
        return "empty";
      }
    }
    return parseStatementListItem();
  };

  const parseModuleSpecifier = () => {
    expect(TOKEN.String);
  };

  const hasLoneSurrogate = (text: string) => !text.isWellFormed();

  const parseExportSpecifierName = () => {
    const token = next();
    if (isPropertyName(token)) return scanner.getCurrentLiteral();
    if (token === TOKEN.String) {
      const name = scanner.getCurrentLiteral();
      if (!hasLoneSurrogate(name)) return name;
      reportMessage("kInvalidModuleExportName");
      return "";
    }
    reportUnexpectedToken(token);
    return "";
  };

  const declareUnboundVariable = (name: string, at: number) => {
    declare(name, VARIABLE_KIND.Normal, VARIABLE_MODE.Const, scope, at, endPosition());
  };

  const parseNamedImports = () => {
    expect(TOKEN.LeftBrace);
    while (peek() !== TOKEN.RightBrace) {
      const importName = parseExportSpecifierName();
      let localName = importName;
      if (checkContextualKeyword("as")) localName = parsePropertyName();
      if (!isValidIdentifier(scanner.getCurrentToken(), true, false, isModule)) {
        reportMessage("kUnexpectedReserved");
        return false;
      }
      if (isEvalOrArguments(localName)) {
        reportMessage("kStrictEvalArguments");
        return false;
      }
      declareUnboundVariable(localName, position());
      if (peek() === TOKEN.RightBrace) break;
      expect(TOKEN.Comma);
    }
    expect(TOKEN.RightBrace);
    return true;
  };

  const parseImportWithClause = () => {
    if (!check(TOKEN.With)) return;
    expect(TOKEN.LeftBrace);
    const keys = new Set<string>();
    while (peek() !== TOKEN.RightBrace) {
      const key = check(TOKEN.String) ? scanner.getCurrentLiteral() : parsePropertyName();
      const location = scanner.getLocation();
      expect(TOKEN.Colon);
      expect(TOKEN.String);
      location.end = scanner.getLocation().end;
      if (keys.has(key)) {
        reportMessageAt(location, "kImportAttributesDuplicateKey", key);
        break;
      }
      keys.add(key);
      if (peek() === TOKEN.RightBrace) break;
      if (!check(TOKEN.Comma)) {
        reportUnexpectedToken(next());
        break;
      }
    }
    expect(TOKEN.RightBrace);
  };

  const parseImportDeclaration = () => {
    const at = peekPosition();
    expect(TOKEN.Import);
    const token = peek();
    if (token === TOKEN.String) {
      parseModuleSpecifier();
      parseImportWithClause();
      expectSemicolon();
      return;
    }
    let hasDefaultBinding = false;
    let isSourcePhase = false;
    if (token !== TOKEN.Mul && token !== TOKEN.LeftBrace) {
      if (
        peekContextualKeyword("source") &&
        scanner.peekAhead() === TOKEN.Identifier &&
        scanner.peekAheadAhead() === TOKEN.Identifier
      ) {
        consume();
        isSourcePhase = true;
      }
      const name = parseNonRestrictedIdentifier();
      declareUnboundVariable(name, at);
      hasDefaultBinding = true;
    }
    if (!isSourcePhase && (!hasDefaultBinding || check(TOKEN.Comma))) {
      switch (peek()) {
        case TOKEN.Mul: {
          consume();
          expectContextualKeyword("as");
          const name = parseNonRestrictedIdentifier();
          declareUnboundVariable(name, at);
          break;
        }
        case TOKEN.LeftBrace:
          if (!parseNamedImports()) return;
          break;
        default:
          reportUnexpectedToken(scanner.getCurrentToken());
          return;
      }
    }
    expectContextualKeyword("from");
    parseModuleSpecifier();
    if (!isSourcePhase) parseImportWithClause();
    expectSemicolon();
  };

  const parseExportDefault = (): Statement => {
    expect(TOKEN.Default);
    const defaultLocation = scanner.getLocation();
    const localNames: string[] = [];
    let result: Statement;
    switch (peek()) {
      case TOKEN.Function:
        result = parseHoistableDeclaration(localNames, true);
        break;
      case TOKEN.Class:
        consume();
        result = parseClassDeclaration(localNames, true);
        break;
      case TOKEN.Async:
        if (scanner.peekAhead() === TOKEN.Function && !scanner.hasLineTerminatorAfterNext()) {
          consume();
          result = parseAsyncFunctionDeclaration(localNames, true);
          break;
        }
        result = parseExportDefaultExpression(localNames);
        break;
      default:
        result = parseExportDefaultExpression(localNames);
        break;
    }
    if (result !== "null") {
      regularExports.push({
        exportName: "default",
        localName: localNames[0] ?? ".default",
        location: defaultLocation,
      });
    }
    return result;
  };

  const parseExportDefaultExpression = (localNames: string[]): Statement => {
    const at = position();
    withAcceptIn(true, () => parseAssignmentExpression());
    localNames.push(".default");
    declare(".default", VARIABLE_KIND.Normal, VARIABLE_MODE.Const, scope, at, endPosition());
    expectSemicolon();
    return "other";
  };

  let namespaceExportCount = 0;

  const parseExportStar = () => {
    const at = position();
    consume();
    if (!peekContextualKeyword("as")) {
      expectContextualKeyword("from");
      parseModuleSpecifier();
      parseImportWithClause();
      expectSemicolon();
      return;
    }
    expectContextualKeyword("as");
    const exportName = parseExportSpecifierName();
    const exportNameLocation = scanner.getLocation();
    const localName = `.ns-export${namespaceExportCount}`;
    namespaceExportCount += 1;
    declareUnboundVariable(localName, at);
    expectContextualKeyword("from");
    parseModuleSpecifier();
    parseImportWithClause();
    expectSemicolon();
    regularExports.push({ exportName, localName, location: exportNameLocation });
  };

  const parseExportDeclaration = (): Statement => {
    expect(TOKEN.Export);
    const names: string[] = [];
    const location = scanner.getPeekLocation();
    let result: Statement;
    switch (peek()) {
      case TOKEN.Default:
        return parseExportDefault();
      case TOKEN.Mul:
        parseExportStar();
        return "empty";
      case TOKEN.LeftBrace: {
        let reservedLocation = INVALID_LOCATION;
        let stringLocalNameLocation = INVALID_LOCATION;
        const clause: { exportName: string; localName: string; location: Location }[] = [];
        expect(TOKEN.LeftBrace);
        for (let nameToken = peek(); nameToken !== TOKEN.RightBrace; nameToken = peek()) {
          const localName = parseExportSpecifierName();
          if (stringLocalNameLocation.start < 0 && nameToken === TOKEN.String) {
            stringLocalNameLocation = scanner.getLocation();
          } else if (
            reservedLocation.start < 0 &&
            !isValidIdentifier(nameToken, true, false, isModule)
          ) {
            reservedLocation = scanner.getLocation();
          }
          const specifierLocation = scanner.getLocation();
          let exportName = localName;
          if (checkContextualKeyword("as")) {
            exportName = parseExportSpecifierName();
            specifierLocation.end = scanner.getLocation().end;
          }
          clause.push({ exportName, localName, location: specifierLocation });
          if (peek() === TOKEN.RightBrace) break;
          if (!check(TOKEN.Comma)) {
            reportUnexpectedToken(next());
            break;
          }
        }
        expect(TOKEN.RightBrace);
        if (checkContextualKeyword("from")) {
          parseModuleSpecifier();
          parseImportWithClause();
          expectSemicolon();
          for (const entry of clause) {
            specialExports.push({ exportName: entry.exportName, location: entry.location });
          }
        } else {
          if (reservedLocation.start >= 0) {
            reportMessageAt(reservedLocation, "kUnexpectedReserved");
            return "null";
          }
          if (stringLocalNameLocation.start >= 0) {
            reportMessageAt(stringLocalNameLocation, "kModuleExportNameWithoutFromClause");
            return "null";
          }
          expectSemicolon();
          regularExports.push(...clause);
        }
        return "empty";
      }
      case TOKEN.Function:
        result = parseHoistableDeclaration(names, false);
        break;
      case TOKEN.Class:
        consume();
        result = parseClassDeclaration(names, false);
        break;
      case TOKEN.Var:
      case TOKEN.Let:
      case TOKEN.Const:
        result = parseVariableStatement(VAR_CONTEXT.StatementListItem, names);
        break;
      case TOKEN.Async:
        consume();
        if (peek() === TOKEN.Function && !scanner.hasLineTerminatorBeforeNext()) {
          result = parseAsyncFunctionDeclaration(names, false);
          break;
        }
        reportUnexpectedToken(scanner.getCurrentToken());
        return "null";
      default:
        reportUnexpectedToken(scanner.getCurrentToken());
        return "null";
    }
    location.end = scanner.getLocation().end;
    for (const name of names) {
      regularExports.push({ exportName: name, localName: name, location: { ...location } });
    }
    return result;
  };

  // Reports a module's duplicate export or an export of a name that it doesn't declare, in the
  // order of V8's maps of its exports.
  const validateModule = (moduleScope: Scope) => {
    const compare = (left: string, right: string) => {
      const length = Math.min(left.length, right.length);
      for (let index = 0; index < length; index += 1) {
        const difference = left.charCodeAt(index) - right.charCodeAt(index);
        if (difference !== 0) return difference;
      }
      return left.length - right.length;
    };
    const sorted = regularExports
      .map((entry, index) => ({ entry, index }))
      .sort(
        (left, right) =>
          compare(left.entry.localName, right.entry.localName) || left.index - right.index,
      )
      .map((item) => item.entry);
    const exportNames = new Map<string, { location: Location; exportName: string }>();
    let duplicate: { location: Location; exportName: string } | undefined;
    for (const candidate of [...sorted, ...specialExports]) {
      const seen = exportNames.get(candidate.exportName);
      if (seen === undefined) {
        exportNames.set(candidate.exportName, candidate);
        continue;
      }
      duplicate ??= seen;
      if (candidate.location.start > duplicate.location.start) duplicate = candidate;
    }
    if (duplicate !== undefined) {
      reportMessageAt(duplicate.location, "kDuplicateExport", duplicate.exportName);
      return;
    }
    for (const entry of sorted) {
      if (!moduleScope.variables.has(entry.localName)) {
        reportMessageAt(entry.location, "kModuleExportUndefined", entry.localName);
        return;
      }
    }
  };

  // The program.

  const parseProgram = () => {
    const programScope = isModule
      ? createScope(SCOPE_TYPE.Module, scope, FUNCTION_KIND.Module)
      : scope;
    withFunctionState(programScope, () => {
      const begin = scanner.getLocation().start;
      if (isModule) {
        while (peek() !== TOKEN.Eos) {
          if (parseModuleItem() === "null") break;
        }
        if (!hasError()) validateModule(programScope);
      } else {
        parseStatementList(TOKEN.Eos);
      }
      if (isStrict()) checkStrictOctalLiteral(begin, endPosition());
      checkConflictingVarDeclarations(programScope);
    });
  };

  parseProgram();
  return pendingError === undefined
    ? undefined
    : { message: pendingError.message, line: getLine(source, pendingError.location.start) };
};
