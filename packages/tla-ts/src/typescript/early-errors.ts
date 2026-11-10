import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";

const reject = (message: string, node: ts.Node): never => {
  throw new TlaTypeScriptError(`SyntaxError: ${message}`, node);
};

const isLexical = (statement: ts.Statement, isFunctionBody: boolean) =>
  ts.isClassDeclaration(statement) ||
  (ts.isFunctionDeclaration(statement) && statement.body !== undefined && !isFunctionBody) ||
  (ts.isVariableStatement(statement) &&
    (statement.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0);

const getBindingNames = (name: ts.BindingName): string[] =>
  ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap((element) =>
        ts.isBindingElement(element) ? getBindingNames(element.name) : [],
      );

const getLexicalNames = (statements: readonly ts.Statement[], isFunctionBody: boolean) =>
  statements
    .filter((statement) => isLexical(statement, isFunctionBody))
    .flatMap((statement) => {
      if (ts.isVariableStatement(statement)) {
        return statement.declarationList.declarations.flatMap((declaration) =>
          getBindingNames(declaration.name),
        );
      }
      const named =
        ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement)
          ? statement.name
          : undefined;
      return named === undefined ? [] : [named.text];
    });

// The names that var declarations among statements declare, through nested blocks but not
// nested functions.
const getVarNames = (node: ts.Node): string[] => {
  if (ts.isFunctionLike(node) || ts.isClassLike(node)) return [];
  const own =
    ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.BlockScoped) === 0
      ? node.declarations.flatMap((declaration) => getBindingNames(declaration.name))
      : [];
  const nested: string[] = [];
  ts.forEachChild(node, (child) => {
    nested.push(...getVarNames(child));
  });
  return [...own, ...nested];
};

const rejectRedeclaration = (
  statements: readonly ts.Statement[],
  others: string[],
  isFunctionBody: boolean,
  node: ts.Node,
) => {
  const lexical = getLexicalNames(statements, isFunctionBody);
  const clash =
    lexical.find((name, position) => lexical.indexOf(name) !== position) ??
    [...statements.flatMap(getVarNames), ...others].find((name) => lexical.includes(name));
  if (clash !== undefined) reject(`Identifier '${clash}' has already been declared`, node);
};

// Whether a node is the target of an assignment, or part of a destructuring assignment's pattern.
const isAssigned = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (ts.isBinaryExpression(parent)) {
    const kind = parent.operatorToken.kind;
    return (
      parent.left === node &&
      kind >= ts.SyntaxKind.FirstAssignment &&
      kind <= ts.SyntaxKind.LastAssignment
    );
  }
  if (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) {
    return (
      parent.operator === ts.SyntaxKind.PlusPlusToken ||
      parent.operator === ts.SyntaxKind.MinusMinusToken
    );
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isForInStatement(parent) || ts.isForOfStatement(parent))
    return parent.initializer === node;
  return (
    (ts.isArrayLiteralExpression(parent) ||
      ts.isObjectLiteralExpression(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isShorthandPropertyAssignment(parent) ||
      ts.isSpreadElement(parent) ||
      ts.isSpreadAssignment(parent)) &&
    isAssigned(parent)
  );
};

const isBodyOf = (node: ts.Statement) => {
  const parent = node.parent;
  return (
    (ts.isIfStatement(parent) &&
      (parent.thenStatement === node || parent.elseStatement === node)) ||
    (ts.isIterationStatement(parent, false) && parent.statement === node) ||
    (ts.isLabeledStatement(parent) && parent.statement === node)
  );
};

// Rejects programs that JavaScript rejects as it parses, where TypeScript accepts them. Compiled
// TypeScript is strict mode code.
export const rejectEarlyErrors = (sourceFile: ts.SourceFile) => {
  const visit = (node: ts.Node) => {
    if (ts.isRegularExpressionLiteral(node)) {
      const text = node.text;
      const end = text.lastIndexOf("/");
      try {
        new RegExp(text.slice(1, end), text.slice(end + 1));
      } catch (error) {
        reject(String(error).replace(/^SyntaxError: /, ""), node);
      }
    }
    if (ts.isBlock(node) || ts.isCaseBlock(node)) {
      const statements = ts.isBlock(node)
        ? node.statements
        : node.clauses.flatMap((clause) => [...clause.statements]);
      const catchClause =
        ts.isBlock(node) && ts.isCatchClause(node.parent) ? node.parent : undefined;
      const parameter = catchClause?.variableDeclaration?.name;
      rejectRedeclaration(
        statements,
        parameter === undefined ? [] : getBindingNames(parameter),
        ts.isFunctionLike(node.parent),
        node,
      );
    }
    if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) && isBodyOf(node)) {
      reject("A declaration can't be the body of a statement", node);
    }
    if (
      ts.isBindingElement(node) &&
      node.propertyName !== undefined &&
      ts.isPrivateIdentifier(node.propertyName)
    ) {
      reject("Unexpected private name in a pattern", node);
    }
    if (
      ts.isStringLiteral(node) &&
      (ts.isExportSpecifier(node.parent) ||
        ts.isImportSpecifier(node.parent) ||
        ts.isNamespaceExport(node.parent)) &&
      !node.text.isWellFormed()
    ) {
      reject("A module's export names can't have lone surrogates", node);
    }
    if (ts.isMetaProperty(node) && node.name.getText() !== node.name.text) {
      reject("Keywords can't contain escapes", node.name);
    }
    if (
      ts.isIdentifier(node) &&
      (node.text === "arguments" || node.text === "eval") &&
      isAssigned(node)
    ) {
      reject(`Unexpected ${node.text} in strict mode`, node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
};
