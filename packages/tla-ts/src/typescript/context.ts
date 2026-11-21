import ts from "@typescript/typescript6";
import { isJavaScriptFile } from "./common-js";

const isModuleSyntax = (statement: ts.Statement) =>
  ts.isImportDeclaration(statement) ||
  ts.isImportEqualsDeclaration(statement) ||
  ts.isExportDeclaration(statement) ||
  ts.isExportAssignment(statement) ||
  (ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ));

// An await that no function encloses.
const hasTopLevelAwait = (node: ts.Node): boolean =>
  ts.isAwaitExpression(node) ||
  (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasTopLevelAwait) ?? false));

// A file that imports, exports, or awaits outside a function, which Node runs only as a module.
// Node runs another file as a script where it strips its types, and a CommonJS module's code in a
// function. A JavaScript file is a module where Node loads it as one, and a script, as a page's,
// where it runs as no module.
export const isModuleFile = (file: ts.SourceFile) =>
  isJavaScriptFile(file.fileName)
    ? file.impliedNodeFormat === ts.ModuleKind.ESNext
    : file.statements.some(isModuleSyntax) || hasTopLevelAwait(file);

// A "use strict" directive is in the string literals that start the statements, and later it is
// only an expression.
const hasStrictDirective = (statements: readonly ts.Statement[]) => {
  const isString = (statement: ts.Statement) =>
    ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
  const end = statements.findIndex((statement) => !isString(statement));
  return statements
    .slice(0, end === -1 ? statements.length : end)
    .some(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        statement.expression.getText().slice(1, -1) === "use strict",
    );
};

// Code that runs in strict mode wherever it runs: in a class, under a "use strict" directive, or in
// a module.
export const isStrictCode = (node: ts.Node): boolean =>
  ts.findAncestor(
    node,
    (ancestor) =>
      ts.isClassLike(ancestor) ||
      (ts.isFunctionLike(ancestor) &&
        "body" in ancestor &&
        ancestor.body !== undefined &&
        ts.isBlock(ancestor.body) &&
        hasStrictDirective(ancestor.body.statements)) ||
      (ts.isSourceFile(ancestor) &&
        (hasStrictDirective(ancestor.statements) || isModuleFile(ancestor))),
  ) !== undefined;

export type FunctionNode = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;

export const skipCasts = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) ||
  ts.isNonNullExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isTypeAssertionExpression(node)
    ? skipCasts(node.expression)
    : node;

// A function that is neither async nor a generator.
export const isPlain = (node: FunctionNode) =>
  node.asteriskToken === undefined &&
  !(node.modifiers ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);

const getAnyFunction = (node: ts.Node | undefined): FunctionNode | undefined =>
  node !== undefined &&
  (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node))
    ? node
    : node !== undefined && ts.isVariableDeclaration(node) && node.initializer !== undefined
      ? getAnyFunction(skipCasts(node.initializer))
      : undefined;

// The plain function that a node is, or that a variable declaration initializes.
export const getFunction = (node: ts.Node | undefined) => {
  const found = getAnyFunction(node);
  return found !== undefined && isPlain(found) ? found : undefined;
};

// A file that exports no function, which a spec exports as an action, runs as JavaScript does
// rather than as a spec's model.
export const isScript = (sourceFile: ts.SourceFile) =>
  sourceFile.statements.every(
    (statement) =>
      // An export list may name a function, which the model's frame tells.
      !(
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier === undefined &&
        !statement.isTypeOnly
      ) &&
      (!ts.canHaveModifiers(statement) ||
        !(ts.getModifiers(statement) ?? []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        ) ||
        !(ts.isVariableStatement(statement)
          ? statement.declarationList.declarations.some(
              (declaration) => getFunction(declaration)?.body !== undefined,
            )
          : getFunction(statement)?.body !== undefined)),
  );
