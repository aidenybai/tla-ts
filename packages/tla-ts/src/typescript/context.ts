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

// An assignment of a CommonJS file's top level to exports or module.exports, the target, or to a
// property of the target that name names, as exports.name = value assigns it.
interface CommonJsAssignment {
  name: ts.Identifier | undefined;
  target: ts.Expression;
  left: ts.Expression;
  right: ts.Expression;
}

const getCommonJsAssignments = (sourceFile: ts.SourceFile) =>
  hasModuleSyntax(sourceFile)
    ? []
    : sourceFile.statements.flatMap((statement): CommonJsAssignment[] => {
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
        const right = skipCasts(expression.right);
        if (isExports(left)) return [{ name: undefined, target: left, left, right }];
        return ts.isPropertyAccessExpression(left) &&
          ts.isIdentifier(left.name) &&
          isExports(left.expression)
          ? [{ name: left.name, target: left.expression, left, right }]
          : [];
      });

// The value that a CommonJS file's top level last gives each property of module.exports, as
// exports.name = value, module.exports.name = value, or module.exports = { name: value } gives it,
// or { name } as its shorthand, or { name() {} } as a method. An assignment to module.exports
// replaces the object, and with it the properties that earlier assignments gave, and one to
// exports or module.exports leaves exports naming an object that Node doesn't export.
const getCommonJsProperties = (sourceFile: ts.SourceFile) =>
  getCommonJsAssignments(sourceFile).reduce(
    (exported, assignment) => {
      const right = assignment.right;
      const isBinding = ts.isIdentifier(assignment.target);
      if (assignment.name !== undefined) {
        return isBinding && exported.isDetached
          ? exported
          : {
              ...exported,
              properties: new Map([
                ...exported.properties,
                [
                  assignment.name.text,
                  { left: assignment.left, identifier: assignment.name, value: right },
                ],
              ]),
            };
      }
      return {
        isDetached: true,
        properties: isBinding
          ? exported.properties
          : new Map(
              ts.isObjectLiteralExpression(right)
                ? right.properties.flatMap((property) =>
                    property.name !== undefined && ts.isIdentifier(property.name)
                      ? [
                          [
                            property.name.text,
                            { left: assignment.left, identifier: property.name, value: property },
                          ] as const,
                        ]
                      : [],
                  )
                : [],
            ),
      };
    },
    {
      isDetached: false,
      properties: new Map<
        string,
        {
          left: ts.Expression;
          identifier: ts.Identifier;
          value: ts.Expression | ts.ObjectLiteralElementLike;
        }
      >(),
    },
  ).properties;

// The local names that a CommonJS file's top level exports by name, by the names it exports them
// as, in exports.name = local, module.exports.name = local, or module.exports = { name: local },
// or { local } as its shorthand.
export const getCommonJsExports = (sourceFile: ts.SourceFile) =>
  new Map(
    [...getCommonJsProperties(sourceFile)].flatMap(([name, property]): [string, string][] => {
      const value = property.value;
      const local = ts.isShorthandPropertyAssignment(value)
        ? value.name
        : ts.isPropertyAssignment(value)
          ? skipCasts(value.initializer)
          : value;
      return ts.isIdentifier(local) ? [[name, local.text]] : [];
    }),
  );

// The plain functions that a CommonJS file's top level exports without a binding that names them,
// by the names it exports them as, which a model calls through module.exports: exports.name =
// () => {}, or module.exports = { name() {} }. Each has the node that its tags are on.
export const getCommonJsFunctions = (sourceFile: ts.SourceFile) =>
  [...getCommonJsProperties(sourceFile)].flatMap((entry) => {
    const value = entry[1].value;
    const node = ts.isMethodDeclaration(value)
      ? value
      : getFunction(ts.isPropertyAssignment(value) ? skipCasts(value.initializer) : value);
    const body = node?.body;
    return node !== undefined &&
      body !== undefined &&
      node.asteriskToken === undefined &&
      !(node.modifiers ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
      ? [
          {
            name: entry[0],
            // How the program names the property: exports.name, or module.exports.name.
            label: ts.isExpression(value)
              ? entry[1].left.getText()
              : `${entry[1].left.getText()}.${entry[0]}`,
            identifier: entry[1].identifier,
            tagged: ts.isExpression(value) ? entry[1].left.parent.parent : value,
            node,
            body,
          },
        ]
      : [];
  });

// Where a CommonJS file's top level exports a function that the model's frame can't call: a
// function that module.exports is, an accessor, an async function or a generator, or a function
// under a name that isn't an identifier.
export const findUnnamedCommonJsExport = (sourceFile: ts.SourceFile) => {
  const called = new Set<ts.Node>(
    getCommonJsFunctions(sourceFile).map((exported) => exported.node),
  );
  const isUncalled = (node: ts.Node): boolean =>
    ts.isPropertyAssignment(node)
      ? isUncalled(skipCasts(node.initializer))
      : (ts.isFunctionLike(node) || ts.isAccessor(node)) && !called.has(node);
  const whole = getCommonJsAssignments(sourceFile).findLast(
    (assignment) => assignment.name === undefined,
  );
  return (
    [...getCommonJsProperties(sourceFile).values()].find((property) => isUncalled(property.value))
      ?.left ??
    (whole !== undefined &&
    (ts.isFunctionLike(whole.right) ||
      (ts.isObjectLiteralExpression(whole.right) &&
        whole.right.properties.some(
          (property) =>
            !(property.name !== undefined && ts.isIdentifier(property.name)) &&
            isUncalled(property),
        )))
      ? whole.left
      : undefined)
  );
};

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
  getCommonJsFunctions(sourceFile).length === 0 &&
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
