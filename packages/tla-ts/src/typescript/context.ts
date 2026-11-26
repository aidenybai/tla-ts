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

// Whether a file has an ES module's import or export syntax, which a CommonJS file lacks.
const hasModuleSyntax = (sourceFile: ts.SourceFile) =>
  sourceFile.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      (ts.canHaveModifiers(statement) &&
        (ts.getModifiers(statement) ?? []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )),
  );

// The assignments of a CommonJS file's top level, by what they assign to: exports, module.exports,
// or a property of either, as exports.name = value and module.exports.name = value assign it.
const getCommonJsAssignments = (sourceFile: ts.SourceFile) =>
  hasModuleSyntax(sourceFile)
    ? []
    : sourceFile.statements.flatMap((statement) => {
        const expression = ts.isExpressionStatement(statement) ? statement.expression : undefined;
        if (
          expression === undefined ||
          !ts.isBinaryExpression(expression) ||
          expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken
        ) {
          return [];
        }
        const isExports = (node: ts.Expression) =>
          (ts.isIdentifier(node) && node.text === "exports") ||
          (ts.isPropertyAccessExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === "module" &&
            node.name.text === "exports");
        const left = expression.left;
        const name = isExports(left)
          ? undefined
          : ts.isPropertyAccessExpression(left) && isExports(left.expression)
            ? left.name.text
            : null;
        return name === null ? [] : [{ name, left, right: skipCasts(expression.right) }];
      });

// The local names that a CommonJS file's top level exports by name, by the names it exports them
// as, in exports.name = local, module.exports.name = local, or module.exports = { name: local },
// or { local } as its shorthand. A file of an ES module's import or export syntax exports none
// this way.
export const getCommonJsExports = (sourceFile: ts.SourceFile) =>
  new Map(
    getCommonJsAssignments(sourceFile).flatMap((assignment): [string, string][] => {
      const right = assignment.right;
      if (assignment.name !== undefined) {
        return ts.isIdentifier(right) ? [[assignment.name, right.text]] : [];
      }
      return ts.isObjectLiteralExpression(right)
        ? right.properties.flatMap((property): [string, string][] =>
            ts.isShorthandPropertyAssignment(property)
              ? [[property.name.text, property.name.text]]
              : ts.isPropertyAssignment(property) &&
                  ts.isIdentifier(property.name) &&
                  ts.isIdentifier(skipCasts(property.initializer))
                ? [[property.name.text, skipCasts(property.initializer).getText()]]
                : [],
          )
        : [];
    }),
  );

// Where a CommonJS file's top level exports a function that no binding of the file names, which the
// model's frame can't call: exports.name = () => {}, or module.exports = { name() {} }.
export const findUnnamedCommonJsExport = (sourceFile: ts.SourceFile) =>
  getCommonJsAssignments(sourceFile).find(
    (assignment) =>
      ts.isFunctionLike(assignment.right) ||
      (assignment.name === undefined &&
        ts.isObjectLiteralExpression(assignment.right) &&
        assignment.right.properties.some(
          (property) =>
            ts.isMethodDeclaration(property) ||
            ts.isAccessor(property) ||
            (ts.isPropertyAssignment(property) &&
              ts.isFunctionLike(skipCasts(property.initializer))),
        )),
  )?.left;

// A file that exports no function, which a spec exports as an action, runs as JavaScript does
// rather than as a spec's model. A CommonJS file may export a function by name, which the model's
// frame tells.
// Whether a const's type may give it call signatures that the model's frame calls: a function
// type, a type literal with a call signature, or a named type, which the frame resolves.
const isTypedCallable = (declaration: ts.VariableDeclaration) => {
  const type = declaration.type;
  return (
    declaration.initializer !== undefined &&
    type !== undefined &&
    (ts.isFunctionTypeNode(type) ||
      ts.isTypeReferenceNode(type) ||
      (ts.isTypeLiteralNode(type) && type.members.some(ts.isCallSignatureDeclaration)))
  );
};

export const isScript = (sourceFile: ts.SourceFile) =>
  getCommonJsExports(sourceFile).size === 0 &&
  findUnnamedCommonJsExport(sourceFile) === undefined &&
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
              (declaration) =>
                getFunction(declaration)?.body !== undefined || isTypedCallable(declaration),
            )
          : getFunction(statement)?.body !== undefined)),
  );
