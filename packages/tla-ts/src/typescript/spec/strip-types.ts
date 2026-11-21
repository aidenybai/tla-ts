import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";

// Node's type stripping, which runs a .ts file by replacing its types with whitespace, so that
// positions and function source texts stay those of the file: swc's strip-only mode
// (swc_ts_fast_strip's TsStrip, as amaro 1.1.11 in Node 26 builds it), ported to TypeScript's
// syntax tree, as node:module's stripTypeScriptTypes isn't in a browser.

interface Token {
  kind: ts.SyntaxKind;
  start: number;
  end: number;
  isAfterLineBreak: boolean;
}

// The characters that stripping keeps: ECMAScript's white space and line terminators.
const KEPT = /[\t\v\f\uFEFF \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\n\r\u2028\u2029]/;

const NEW_LINE = /[\n\r\u2028\u2029]/;

// The white space of a character of each length in UTF-8, as swc writes it in place of the
// character's bytes, which keeps its length in UTF-16 too.
const getBlank = (point: number) => (point < 0x80 ? " " : point < 0x800 ? "\u00A0" : "\u2002");

const getUtf8Length = (point: number) =>
  point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;

// The binary operators by swc's precedence, which a type assertion may sit between.
const PRECEDENCES = new Map([
  [ts.SyntaxKind.AsteriskAsteriskToken, 15],
  [ts.SyntaxKind.AsteriskToken, 14],
  [ts.SyntaxKind.SlashToken, 14],
  [ts.SyntaxKind.PercentToken, 14],
  [ts.SyntaxKind.PlusToken, 13],
  [ts.SyntaxKind.MinusToken, 13],
  [ts.SyntaxKind.LessThanLessThanToken, 12],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, 12],
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, 12],
  [ts.SyntaxKind.LessThanToken, 11],
  [ts.SyntaxKind.LessThanEqualsToken, 11],
  [ts.SyntaxKind.GreaterThanToken, 11],
  [ts.SyntaxKind.GreaterThanEqualsToken, 11],
  [ts.SyntaxKind.InKeyword, 11],
  [ts.SyntaxKind.InstanceOfKeyword, 11],
  [ts.SyntaxKind.EqualsEqualsToken, 10],
  [ts.SyntaxKind.ExclamationEqualsToken, 10],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, 10],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, 10],
  [ts.SyntaxKind.AmpersandToken, 9],
  [ts.SyntaxKind.CaretToken, 8],
  [ts.SyntaxKind.BarToken, 7],
  [ts.SyntaxKind.AmpersandAmpersandToken, 6],
  [ts.SyntaxKind.BarBarToken, 5],
  [ts.SyntaxKind.QuestionQuestionToken, 4],
]);

// The tokens after a removed statement at whose start, on a line of its own, ASI wouldn't end the
// statement before it.
const ASI_HAZARDS = new Set([
  ts.SyntaxKind.OpenParenToken,
  ts.SyntaxKind.OpenBracketToken,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.SlashEqualsToken,
]);

const EXPRESSION_HAZARDS = new Set([
  ts.SyntaxKind.OpenParenToken,
  ts.SyntaxKind.OpenBracketToken,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
]);

// The tokens that may follow a class member's modifier for it to be one (swc's
// ts_next_token_can_follow_modifier).
const MODIFIER_FOLLOWERS = new Set([
  ts.SyntaxKind.OpenBracketToken,
  ts.SyntaxKind.OpenBraceToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.DotDotDotToken,
  ts.SyntaxKind.PrivateIdentifier,
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NumericLiteral,
  ts.SyntaxKind.BigIntLiteral,
]);

const STRIPPED_MODIFIERS = new Set([
  ts.SyntaxKind.ReadonlyKeyword,
  ts.SyntaxKind.PublicKeyword,
  ts.SyntaxKind.ProtectedKeyword,
  ts.SyntaxKind.PrivateKeyword,
  ts.SyntaxKind.OverrideKeyword,
]);

const isWord = (kind: ts.SyntaxKind) =>
  kind === ts.SyntaxKind.Identifier ||
  (kind >= ts.SyntaxKind.FirstKeyword && kind <= ts.SyntaxKind.LastKeyword);

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);

const getModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
  ts.canHaveModifiers(node)
    ? ts.getModifiers(node)?.find((modifier) => modifier.kind === kind)
    : undefined;

// Whether a declaration has no code once its types are gone: swc's is_ts_declare.
const isDeclare = (node: ts.Node): boolean => {
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) return true;
  if (ts.isModuleDeclaration(node)) {
    return hasModifier(node, ts.SyntaxKind.DeclareKeyword) || ts.isStringLiteral(node.name);
  }
  if (ts.isEnumDeclaration(node) || ts.isVariableStatement(node) || ts.isClassDeclaration(node)) {
    return hasModifier(node, ts.SyntaxKind.DeclareKeyword);
  }
  if (ts.isFunctionDeclaration(node)) {
    return hasModifier(node, ts.SyntaxKind.DeclareKeyword) || node.body === undefined;
  }
  return false;
};

// Whether a declaration declares only types: swc's is_uninstantiated.
const isUninstantiated = (node: ts.Node): boolean => {
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) return true;
  if (!ts.isModuleDeclaration(node) || node.body === undefined) return false;
  return ts.isModuleBlock(node.body)
    ? node.body.statements.every(isUninstantiated)
    : isUninstantiated(node.body);
};

// Strips a TypeScript file's types as Node does, or throws Node's error where it rejects syntax
// that strip-only mode can't remove.
export const stripTypes = (sourceFile: ts.SourceFile): string => {
  const text = sourceFile.text;
  const replacements: [number, number][] = [];
  const overwrites = new Map<number, string>();
  const scanner = ts.createScanner(ts.ScriptTarget.ESNext, true, ts.LanguageVariant.Standard, text);

  const fail = (message: string, node: ts.Node): never => {
    throw new TlaTypeScriptError(message, node);
  };

  // swc's parser: a getter takes no parameter but this.
  const rejectGetterParameters = (node: ts.FunctionLikeDeclaration) => {
    const extra = ts.isGetAccessor(node)
      ? node.parameters.find(
          (parameter) => !ts.isIdentifier(parameter.name) || parameter.name.text !== "this",
        )
      : undefined;
    if (extra !== undefined) fail("A `get` accessor cannot have parameters", extra);
  };

  // The first token that starts at or after a position, where position is a token's start or a
  // token's end.
  const getNextToken = (position: number): Token | undefined => {
    scanner.resetTokenState(position);
    const kind = scanner.scan();
    if (kind === ts.SyntaxKind.EndOfFileToken) return undefined;
    const isGreater = kind === ts.SyntaxKind.GreaterThanToken;
    const rescanned = isGreater ? scanner.reScanGreaterToken() : kind;
    return {
      kind: rescanned,
      start: scanner.getTokenStart(),
      end: scanner.getTokenEnd(),
      isAfterLineBreak: scanner.hasPrecedingLineBreak(),
    };
  };

  // The child token of a node of a kind, after a position.
  const getChildToken = (node: ts.Node, kind: ts.SyntaxKind, after = node.getStart()) => {
    const found = node
      .getChildren(sourceFile)
      .find((child) => child.kind === kind && child.getStart(sourceFile) >= after);
    return found === undefined ? fail(`tla-ts can't find a ${ts.SyntaxKind[kind]}`, node) : found;
  };

  // The token before a node, in the order of the file's tokens, if any.
  const getPreviousToken = (node: ts.Node): ts.Node | undefined => {
    if (ts.isSourceFile(node)) return undefined;
    const siblings = node.parent
      .getChildren(sourceFile)
      .flatMap((child) =>
        child.kind === ts.SyntaxKind.SyntaxList ? child.getChildren(sourceFile) : [child],
      )
      .filter((child) => child.kind !== ts.SyntaxKind.JSDoc && child.end > child.pos);
    const index = siblings.indexOf(node);
    if (index <= 0) return getPreviousToken(node.parent);
    const previous = siblings[index - 1];
    return previous.getChildCount(sourceFile) === 0 ? previous : previous.getLastToken(sourceFile);
  };

  const replace = (start: number, end: number) => replacements.push([start, end]);
  const replaceNode = (node: ts.Node) => replace(node.getStart(sourceFile), node.end);

  // swc's fix_asi: a statement removed from between two lines whose second would continue the
  // first, as a ( would call it, keeps them apart with a semicolon.
  const fixAsi = (node: ts.Node) => {
    const next = getNextToken(node.end);
    if (next === undefined || !next.isAfterLineBreak || !ASI_HAZARDS.has(next.kind)) return;
    const previous = getPreviousToken(node);
    if (previous === undefined) return;
    if (previous.kind === ts.SyntaxKind.SemicolonToken) {
      overwrites.set(previous.getStart(sourceFile), ";");
      return;
    }
    overwrites.set(node.getStart(sourceFile), ";");
  };

  const fixAsiInExpression = (start: number, end: number) => {
    const next = getNextToken(end);
    if (next !== undefined && next.isAfterLineBreak && EXPRESSION_HAZARDS.has(next.kind)) {
      overwrites.set(start, ";");
    }
  };

  const stripModifiers = (start: number, keyStart: number) => {
    let position = start;
    let token = getNextToken(position);
    while (token !== undefined && position < keyStart) {
      position = token.end;
      const next = getNextToken(token.end);
      if (next === undefined || next.isAfterLineBreak) return;
      if (!isWord(next.kind) && !MODIFIER_FOLLOWERS.has(next.kind)) return;
      if (token.kind !== ts.SyntaxKind.StaticKeyword) {
        if (!STRIPPED_MODIFIERS.has(token.kind)) return;
        replace(token.start, token.end);
      }
      token = next;
    }
  };

  const replaceToken = (token: ts.Node | undefined) => {
    if (token !== undefined) replaceNode(token);
  };

  // The start of a member after its decorators.
  const getMemberStart = (node: ts.Node) => {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    return decorators === undefined || decorators.length === 0
      ? node.getStart(sourceFile)
      : decorators[decorators.length - 1].end;
  };

  const hasDecorators = (node: ts.Node) =>
    ts.canHaveDecorators(node) && (ts.getDecorators(node)?.length ?? 0) > 0;

  // A type annotation, from its colon.
  const replaceAnnotation = (node: ts.Node, type: ts.TypeNode | undefined) => {
    if (type === undefined) return;
    const colon = getChildToken(node, ts.SyntaxKind.ColonToken);
    replace(colon.getStart(sourceFile), type.end);
  };

  // Type parameters or arguments, from the < to the >.
  const replaceAngles = (node: ts.Node, list: ts.NodeArray<ts.Node> | undefined) => {
    if (list === undefined) return;
    const less = getNextLess(node, list);
    const greater = getChildToken(node, ts.SyntaxKind.GreaterThanToken, list.end);
    replace(less, greater.end);
  };

  const getNextLess = (node: ts.Node, list: ts.NodeArray<ts.Node>) =>
    node
      .getChildren(sourceFile)
      .filter((child) => child.kind === ts.SyntaxKind.LessThanToken && child.end <= list.pos + 1)
      .at(-1)
      ?.getStart(sourceFile) ?? fail("tla-ts can't find a <", node);

  // swc's fix_asi_in_arrow_expr: type parameters across lines after return, yield, or throw.
  const fixArrowAsi = (node: ts.Expression | undefined) => {
    if (node === undefined || !ts.isArrowFunction(node) || node.typeParameters === undefined) {
      return;
    }
    if (hasModifier(node, ts.SyntaxKind.AsyncKeyword)) return;
    const less = getNextLess(node, node.typeParameters);
    const paren = getChildToken(node, ts.SyntaxKind.OpenParenToken).getStart(sourceFile);
    if (!NEW_LINE.test(text.slice(less, paren))) return;
    overwrites.set(paren, " ");
    overwrites.set(less, "(");
  };

  // The binary operator of an assertion chain's base expression, if it's one.
  const getBaseOperator = (node: ts.Expression): ts.SyntaxKind | undefined =>
    ts.isAsExpression(node) || ts.isSatisfiesExpression(node)
      ? getBaseOperator(node.expression)
      : ts.isBinaryExpression(node) && PRECEDENCES.has(node.operatorToken.kind)
        ? node.operatorToken.kind
        : undefined;

  const isRegrouping = (node: ts.AsExpression | ts.SatisfiesExpression) => {
    const next = getNextToken(node.end);
    const nextPrecedence = next === undefined ? undefined : PRECEDENCES.get(next.kind);
    const base = getBaseOperator(node.expression);
    if (nextPrecedence === undefined || base === undefined || next === undefined) return false;
    const basePrecedence = PRECEDENCES.get(base) ?? 0;
    if (nextPrecedence !== basePrecedence) return nextPrecedence > basePrecedence;
    return (
      base === ts.SyntaxKind.AsteriskAsteriskToken ||
      next.kind === ts.SyntaxKind.AsteriskAsteriskToken
    );
  };

  // swc's visit_params: a leading this parameter, with its comma.
  const visitParameters = (parameters: ts.NodeArray<ts.ParameterDeclaration>) => {
    const first = parameters.at(0);
    if (first !== undefined && ts.isIdentifier(first.name) && first.name.text === "this") {
      const next = getNextToken(first.end);
      replace(
        first.getStart(sourceFile),
        next?.kind === ts.SyntaxKind.CommaToken ? next.end : first.end,
      );
      parameters.slice(1).forEach(visit);
      return;
    }
    parameters.forEach(visit);
  };

  // A function-like node's parts in the order swc visits them.
  const visitFunction = (node: ts.SignatureDeclarationBase & { body?: ts.Node }) => {
    replaceAngles(node, node.typeParameters);
    visitParameters(node.parameters);
    replaceAnnotation(node, node.type);
    if (node.body !== undefined) visit(node.body);
  };

  const visitClassMember = (node: ts.ClassElement) => {
    const isPrivate = node.name !== undefined && ts.isPrivateIdentifier(node.name);
    const isStatic = hasModifier(node, ts.SyntaxKind.StaticKeyword);
    const keyStart = node.name?.getStart(sourceFile) ?? node.getStart(sourceFile);
    const accessibility =
      hasModifier(node, ts.SyntaxKind.PublicKeyword) ||
      hasModifier(node, ts.SyntaxKind.PrivateKeyword) ||
      hasModifier(node, ts.SyntaxKind.ProtectedKeyword);
    const isOverride = hasModifier(node, ts.SyntaxKind.OverrideKeyword);
    const isAbstract = hasModifier(node, ts.SyntaxKind.AbstractKeyword);
    const start = getMemberStart(node);
    const isHazardKey =
      node.name !== undefined &&
      (ts.isComputedPropertyName(node.name) ||
        (ts.isIdentifier(node.name) && ["in", "instanceof"].includes(node.name.text)));
    if (ts.isIndexSignatureDeclaration(node)) {
      replaceNode(node);
      return;
    }
    if (ts.isConstructorDeclaration(node)) {
      if (node.body === undefined) {
        replaceNode(node);
        return;
      }
      if (accessibility) {
        stripModifiers(
          node.getStart(sourceFile),
          getChildToken(node, ts.SyntaxKind.ConstructorKeyword).getStart(sourceFile),
        );
      }
      node.parameters.forEach((parameter) => {
        if (ts.getModifiers(parameter)?.length) {
          fail("TypeScript parameter property is not supported in strip-only mode", parameter);
        }
      });
      visitChildren(node);
      return;
    }
    if (ts.isMethodDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node)) {
      rejectGetterParameters(node);
      if (node.body === undefined || (!isPrivate && isAbstract)) {
        replaceNode(node);
        return;
      }
      const hasModifiers = isPrivate ? accessibility : isOverride || accessibility;
      if (hasModifiers) stripModifiers(start, keyStart);
      replaceToken(node.questionToken);
      const isGenerator = ts.isMethodDeclaration(node) && node.asteriskToken !== undefined;
      if (
        !isPrivate &&
        hasModifiers &&
        !isStatic &&
        !hasDecorators(node) &&
        (isHazardKey || isGenerator)
      ) {
        overwrites.set(start, ";");
      }
      visitDecorators(node);
      visit(node.name);
      visitFunction(node);
      return;
    }
    if (ts.isPropertyDeclaration(node)) {
      if (hasModifier(node, ts.SyntaxKind.AccessorKeyword)) {
        if (isAbstract) {
          replaceNode(node);
          return;
        }
        stripModifiers(start, keyStart);
        replaceToken(node.exclamationToken);
        visitDecorators(node);
        visit(node.name);
        replaceAnnotation(node, node.type);
        visit(node.initializer);
        return;
      }
      if (!isPrivate && (hasModifier(node, ts.SyntaxKind.DeclareKeyword) || isAbstract)) {
        replaceNode(node);
        return;
      }
      const isReadonly = hasModifier(node, ts.SyntaxKind.ReadonlyKeyword);
      const hasModifiers = isPrivate
        ? isReadonly || accessibility
        : isReadonly || isOverride || accessibility;
      if (hasModifiers) stripModifiers(start, keyStart);
      replaceToken(node.questionToken);
      replaceToken(node.exclamationToken);
      if (
        !isPrivate &&
        node.initializer === undefined &&
        node.type !== undefined &&
        ts.isIdentifier(node.name) &&
        ["get", "set", "static"].includes(node.name.text)
      ) {
        overwrites.set(getChildToken(node, ts.SyntaxKind.ColonToken).getStart(sourceFile), ";");
      }
      if (!isPrivate && !isStatic && hasModifiers && !hasDecorators(node) && isHazardKey) {
        overwrites.set(start, ";");
      }
      visitDecorators(node);
      visit(node.name);
      replaceAnnotation(node, node.type);
      visit(node.initializer);
      return;
    }
    visitChildren(node);
  };

  const visitDecorators = (node: ts.Node) => {
    if (ts.canHaveDecorators(node)) ts.getDecorators(node)?.forEach(visit);
  };

  const visitClass = (node: ts.ClassLikeDeclaration) => {
    replaceToken(getModifier(node, ts.SyntaxKind.AbstractKeyword));
    node.heritageClauses?.forEach((clause) => {
      if (clause.token === ts.SyntaxKind.ImplementsKeyword) replaceNode(clause);
    });
    visitDecorators(node);
    replaceAngles(node, node.typeParameters);
    node.heritageClauses?.forEach((clause) => {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) clause.types.forEach(visit);
    });
    node.members.forEach(visitClassMember);
  };

  // The statements that a declare-able body of an if or a loop is: a removed one keeps a ;.
  const visitBody = (node: ts.Statement) => {
    visit(node);
    if (isDeclare(node)) overwrites.set(node.getStart(sourceFile), ";");
  };

  const visitChildren = (node: ts.Node) => ts.forEachChild(node, visit);

  const visit = (node: ts.Node | undefined): void => {
    if (node === undefined) return;
    if (ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node)) return;
    switch (node.kind) {
      case ts.SyntaxKind.VariableDeclaration: {
        const declaration = node as ts.VariableDeclaration;
        replaceToken(declaration.exclamationToken);
        visit(declaration.name);
        replaceAnnotation(declaration, declaration.type);
        visit(declaration.initializer);
        return;
      }
      case ts.SyntaxKind.Parameter: {
        const parameter = node as ts.ParameterDeclaration;
        visitDecorators(parameter);
        visit(parameter.name);
        replaceToken(parameter.questionToken);
        replaceAnnotation(parameter, parameter.type);
        visit(parameter.initializer);
        return;
      }
      case ts.SyntaxKind.ArrowFunction: {
        const arrow = node as ts.ArrowFunction;
        if (arrow.typeParameters !== undefined) {
          const less = getNextLess(arrow, arrow.typeParameters);
          const greater = getChildToken(
            arrow,
            ts.SyntaxKind.GreaterThanToken,
            arrow.typeParameters.end,
          );
          replace(less, greater.end);
          if (
            hasModifier(arrow, ts.SyntaxKind.AsyncKeyword) &&
            NEW_LINE.test(text.slice(less, greater.end))
          ) {
            const paren = getNextToken(greater.end);
            if (paren !== undefined) overwrites.set(paren.start, " ");
            overwrites.set(less, "(");
          }
        }
        if (arrow.type !== undefined) {
          const colon = getChildToken(arrow, ts.SyntaxKind.ColonToken, arrow.parameters.end);
          replace(colon.getStart(sourceFile), arrow.type.end);
          const paren = getChildToken(arrow, ts.SyntaxKind.CloseParenToken, arrow.parameters.end);
          const parenStart = paren.getStart(sourceFile);
          if (NEW_LINE.test(text.slice(parenStart, arrow.equalsGreaterThanToken.getStart()))) {
            replace(parenStart, paren.end);
            const point = text.codePointAt(arrow.type.end - 1) ?? 0;
            const last =
              point >= 0xdc00 && point < 0xe000 ? arrow.type.end - 2 : arrow.type.end - 1;
            const length = getUtf8Length(text.codePointAt(last) ?? 0);
            overwrites.set(last, `)${" ".repeat(length - 1)}`);
            if (last === arrow.type.end - 2) overwrites.set(arrow.type.end - 1, "");
          }
        }
        arrow.parameters.forEach(visit);
        visit(arrow.body);
        return;
      }
      case ts.SyntaxKind.ReturnStatement:
      case ts.SyntaxKind.ThrowStatement:
      case ts.SyntaxKind.YieldExpression: {
        const argument = (node as ts.ReturnStatement | ts.ThrowStatement | ts.YieldExpression)
          .expression;
        visit(argument);
        fixArrowAsi(argument);
        return;
      }
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.ClassExpression:
        if (isDeclare(node)) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        visitClass(node as ts.ClassLikeDeclaration);
        return;
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.GetAccessor:
      case ts.SyntaxKind.SetAccessor: {
        if (isDeclare(node)) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        const fn = node as ts.FunctionLikeDeclaration;
        rejectGetterParameters(fn);
        if (ts.isGetAccessor(fn) && ts.isObjectLiteralExpression(fn.parent)) {
          const open = getChildToken(fn, ts.SyntaxKind.OpenParenToken);
          const close = getChildToken(fn, ts.SyntaxKind.CloseParenToken);
          replace(open.end, close.getStart(sourceFile));
          visit(fn.name);
          replaceAnnotation(fn, fn.type);
          visit(fn.body);
          return;
        }
        if (ts.isSetAccessor(fn) && ts.isObjectLiteralExpression(fn.parent)) {
          const first = fn.parameters.at(0);
          if (
            first !== undefined &&
            ts.isIdentifier(first.name) &&
            first.name.text === "this" &&
            fn.parameters.length > 1
          ) {
            replaceNode(first);
            const comma = getNextToken(first.end);
            if (comma !== undefined) replace(comma.start, comma.end);
            fn.parameters.slice(1).forEach(visit);
          } else {
            fn.parameters.forEach(visit);
          }
          visit(fn.name);
          replaceAnnotation(fn, fn.type);
          visit(fn.body);
          return;
        }
        visitDecorators(fn);
        visit(fn.name);
        visitFunction(fn);
        return;
      }
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration:
        replaceNode(node);
        fixAsi(node);
        return;
      case ts.SyntaxKind.VariableStatement:
        if (isDeclare(node)) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        visitChildren(node);
        return;
      case ts.SyntaxKind.EnumDeclaration:
        if (isDeclare(node)) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        fail("TypeScript enum is not supported in strip-only mode", node);
        return;
      case ts.SyntaxKind.ModuleDeclaration:
        if (isDeclare(node) || isUninstantiated(node)) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        fail("TypeScript namespace declaration is not supported in strip-only mode", node);
        return;
      case ts.SyntaxKind.ImportDeclaration: {
        const declaration = node as ts.ImportDeclaration;
        if (declaration.importClause?.phaseModifier === ts.SyntaxKind.TypeKeyword) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        const bindings = declaration.importClause?.namedBindings;
        if (bindings !== undefined && ts.isNamedImports(bindings)) {
          bindings.elements.forEach(replaceTypeSpecifier);
        }
        return;
      }
      case ts.SyntaxKind.ExportDeclaration: {
        const declaration = node as ts.ExportDeclaration;
        if (declaration.isTypeOnly) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        const clause = declaration.exportClause;
        if (clause !== undefined && ts.isNamedExports(clause)) {
          clause.elements.forEach(replaceTypeSpecifier);
        }
        return;
      }
      case ts.SyntaxKind.ExportAssignment:
        if ((node as ts.ExportAssignment).isExportEquals === true) {
          fail("TypeScript export assignment is not supported in strip-only mode", node);
        }
        visitChildren(node);
        return;
      case ts.SyntaxKind.ImportEqualsDeclaration:
        if ((node as ts.ImportEqualsDeclaration).isTypeOnly) {
          replaceNode(node);
          fixAsi(node);
          return;
        }
        fail("TypeScript import equals declaration is not supported in strip-only mode", node);
        return;
      case ts.SyntaxKind.AsExpression:
      case ts.SyntaxKind.SatisfiesExpression: {
        const assertion = node as ts.AsExpression | ts.SatisfiesExpression;
        if (isRegrouping(assertion)) {
          fail(
            "Type assertions that would change binary expression grouping are not supported in strip-only mode.",
            node,
          );
        }
        replace(assertion.expression.end, assertion.end);
        if (!ts.isConstTypeReference(assertion.type) || ts.isSatisfiesExpression(assertion)) {
          const keyword = getNextToken(assertion.expression.end);
          fixAsiInExpression(keyword?.start ?? assertion.end, assertion.end);
        }
        visit(assertion.expression);
        return;
      }
      case ts.SyntaxKind.NonNullExpression: {
        const expression = node as ts.NonNullExpression;
        replace(expression.end - 1, expression.end);
        visit(expression.expression);
        return;
      }
      case ts.SyntaxKind.TypeAssertionExpression:
        fail(
          "The angle-bracket syntax for type assertions, `<T>expr`, is not supported in type strip mode. Instead, use the 'as' syntax: `expr as T`.",
          node,
        );
        return;
      case ts.SyntaxKind.ExpressionWithTypeArguments: {
        const expression = node as ts.ExpressionWithTypeArguments;
        if (expression.typeArguments !== undefined) {
          if (ts.isHeritageClause(expression.parent)) {
            visit(expression.expression);
            replaceAngles(expression, expression.typeArguments);
            return;
          }
          replace(expression.expression.end, expression.end);
        }
        visit(expression.expression);
        return;
      }
      case ts.SyntaxKind.CallExpression:
      case ts.SyntaxKind.NewExpression: {
        const call = node as ts.CallExpression | ts.NewExpression;
        visit(call.expression);
        replaceAngles(call, call.typeArguments);
        call.arguments?.forEach(visit);
        return;
      }
      case ts.SyntaxKind.TaggedTemplateExpression: {
        const tagged = node as ts.TaggedTemplateExpression;
        visit(tagged.tag);
        replaceAngles(tagged, tagged.typeArguments);
        visit(tagged.template);
        return;
      }
      case ts.SyntaxKind.IfStatement: {
        const statement = node as ts.IfStatement;
        visit(statement.expression);
        visitBody(statement.thenStatement);
        if (statement.elseStatement !== undefined) visitBody(statement.elseStatement);
        return;
      }
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement: {
        const loop = node as ts.IterationStatement;
        ts.forEachChild(loop, (child) => (child === loop.statement ? undefined : visit(child)));
        visitBody(loop.statement);
        return;
      }
      case ts.SyntaxKind.CatchClause: {
        const clause = node as ts.CatchClause;
        visit(clause.variableDeclaration);
        visit(clause.block);
        return;
      }
      default:
        visitChildren(node);
    }
  };

  const replaceTypeSpecifier = (specifier: ts.ImportSpecifier | ts.ExportSpecifier) => {
    if (!specifier.isTypeOnly) return;
    const next = getNextToken(specifier.end);
    replace(
      specifier.getStart(sourceFile),
      next?.kind === ts.SyntaxKind.CommaToken ? next.end : specifier.end,
    );
  };

  // swc's ErrorOnTsModule: a namespace that the module keyword declares.
  const checkModules = (statements: readonly ts.Statement[]) =>
    statements.forEach((statement) => {
      if (!ts.isModuleDeclaration(statement)) return;
      const body = statement.body;
      if (body !== undefined && ts.isModuleBlock(body)) checkModules(body.statements);
      if (ts.isStringLiteral(statement.name) || statement.name.text === "global") return;
      if ((statement.flags & ts.NodeFlags.GlobalAugmentation) !== 0) return;
      const keyword = statement
        .getChildren(sourceFile)
        .find(
          (child) =>
            child.kind === ts.SyntaxKind.ModuleKeyword ||
            child.kind === ts.SyntaxKind.NamespaceKeyword,
        );
      if (keyword?.kind === ts.SyntaxKind.ModuleKeyword) {
        fail("`module` keyword is not supported. Use `namespace` instead.", statement);
      }
    });

  checkModules(sourceFile.statements);
  sourceFile.statements.forEach(visit);
  if (replacements.length === 0 && overwrites.size === 0) return text;
  const units = text.split("");
  replacements.forEach(([start, end]) => {
    for (let index = start; index < end; index += 1) {
      const point = text.codePointAt(index) ?? 0;
      if (point > 0xffff) {
        units[index] = " ";
        units[index + 1] = "\uFEFF";
        index += 1;
      } else if (!KEPT.test(text[index])) {
        units[index] = getBlank(point);
      }
    }
  });
  overwrites.forEach((value, index) => {
    units[index] = value;
  });
  return units.join("");
};
