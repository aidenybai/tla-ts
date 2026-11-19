import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { isModuleFile, isStrictCode } from "./context";

const reject = (message: string, node: ts.Node): never => {
  throw new TlaTypeScriptError(`SyntaxError: ${message}`, node);
};

const isLexical = (statement: ts.Statement, isFunctionBody: boolean) =>
  ts.isClassDeclaration(statement) ||
  (ts.isFunctionDeclaration(statement) && statement.body !== undefined && !isFunctionBody) ||
  (ts.isVariableStatement(statement) &&
    (statement.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0);

export const getBindingNames = (name: ts.BindingName): string[] =>
  ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap((element) =>
        ts.isBindingElement(element) ? getBindingNames(element.name) : [],
      );

export const getLexicalNames = (statements: readonly ts.Statement[], isFunctionBody: boolean) =>
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
// Code that a declare holds, as declare global does, which only types the host's values and never
// runs.
export const isAmbientCode = (node: ts.Node) =>
  ts.findAncestor(
    node,
    (ancestor) =>
      ts.canHaveModifiers(ancestor) &&
      (ts.getModifiers(ancestor) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword,
      ),
  ) !== undefined;

export const getVarNames = (node: ts.Node): string[] => {
  if (ts.isFunctionLike(node) || ts.isClassLike(node) || isAmbientCode(node)) return [];
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

// A function declaration that is neither a generator nor async.
const isPlainFunction = (node: ts.Node): node is ts.FunctionDeclaration =>
  ts.isFunctionDeclaration(node) &&
  node.asteriskToken === undefined &&
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0;

// Outside strict mode, a block can declare a name twice where only plain functions declare it.
const rejectRedeclaration = (
  statements: readonly ts.Statement[],
  others: string[],
  isFunctionBody: boolean,
  node: ts.Node,
) => {
  const lexical = getLexicalNames(statements, isFunctionBody);
  const duplicates = lexical.filter((name, position) => lexical.indexOf(name) !== position);
  const isFunctionsOnly = (name: string) =>
    !isStrictCode(node) &&
    statements
      .filter((statement) => getLexicalNames([statement], isFunctionBody).includes(name))
      .every(isPlainFunction);
  const clash =
    duplicates.find((name) => !isFunctionsOnly(name)) ??
    [...statements.flatMap(getVarNames), ...others].find((name) => lexical.includes(name));
  if (clash !== undefined) reject(`Identifier '${clash}' has already been declared`, node);
  if (duplicates.length > 0) {
    throw new TlaTypeScriptError(
      "tla-ts can't run a block that declares a function twice outside strict mode",
      node,
    );
  }
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
    ((ts.isLabeledStatement(parent) || ts.isWithStatement(parent)) && parent.statement === node)
  );
};

// A let or a const that is a with statement's body, which the statement's rewrite would put in a
// block. Where a line break follows a let, other than before a bracket, JavaScript reads the let
// as a name, where TypeScript reads a declaration.
const rejectLexicalWithBody = (node: ts.Node) => {
  if (
    !ts.isVariableStatement(node) ||
    !ts.isWithStatement(node.parent) ||
    (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
  ) {
    return;
  }
  const name = node.declarationList.declarations.at(0)?.name;
  if (
    (node.declarationList.flags & ts.NodeFlags.Let) !== 0 &&
    name !== undefined &&
    !ts.isArrayBindingPattern(name) &&
    node
      .getSourceFile()
      .text.slice(node.declarationList.getStart() + "let".length, name.getStart())
      .includes("\n")
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a let that a line break follows as a name",
      node,
    );
  }
  reject("A declaration can't be the body of a statement", node);
};

// Outside strict mode, a plain function declaration can be an if statement's branch, or a labelled
// statement's item where the labels aren't a loop's, an if statement's, or a with statement's body.
const isSloppyFunctionBody = (node: ts.Statement) => {
  if (!isPlainFunction(node) || isStrictCode(node)) return false;
  if (ts.isIfStatement(node.parent)) return true;
  const labelled = ts.findAncestor(
    node.parent,
    (ancestor) => !ts.isLabeledStatement(ancestor.parent),
  );
  return (
    labelled !== undefined &&
    ts.isLabeledStatement(labelled) &&
    !isBodyOf(labelled) &&
    !ts.isWithStatement(labelled.parent)
  );
};

// The SyntaxError of a regular expression literal that JavaScript rejects, as Node reads its
// grammar, or undefined where JavaScript accepts it.
export const getRegularExpressionError = (node: ts.RegularExpressionLiteral) => {
  const text = node.text;
  const end = text.lastIndexOf("/");
  try {
    new RegExp(text.slice(1, end), text.slice(end + 1));
    return undefined;
  } catch (error) {
    return String(error).replace(/^SyntaxError: /, "");
  }
};

// Whether a name is a property's or a module's export, which any word may be, rather than a
// binding's or a reference's.
const isPropertyName = (node: ts.Identifier) => {
  const parent = node.parent;
  return (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    ((ts.isPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isAccessor(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodSignature(parent)) &&
      parent.name === node) ||
    ((ts.isBindingElement(parent) || ts.isImportSpecifier(parent)) &&
      parent.propertyName === node) ||
    (ts.isExportSpecifier(parent) && parent.name === node && parent.propertyName !== undefined)
  );
};

// Rejects programs that JavaScript rejects as it parses, where TypeScript accepts them, and stops at
// those that it accepts only outside strict mode, where tla-ts doesn't follow them.
export const rejectEarlyErrors = (sourceFile: ts.SourceFile) => {
  // A module's imports and top-level functions are lexical declarations too, which no other
  // declaration repeats.
  if (isModuleFile(sourceFile)) {
    const imported = sourceFile.statements.flatMap((statement) => {
      const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
      if (clause === undefined || clause.isTypeOnly) return [];
      const bindings = clause.namedBindings;
      return [
        ...(clause.name === undefined ? [] : [clause.name.text]),
        ...(bindings === undefined
          ? []
          : ts.isNamespaceImport(bindings)
            ? [bindings.name.text]
            : bindings.elements
                .filter((element) => !element.isTypeOnly)
                .map((element) => element.name.text)),
      ];
    });
    const lexical = [...imported, ...getLexicalNames(sourceFile.statements, false)];
    const vars = sourceFile.statements
      .filter((statement) => !ts.isModuleDeclaration(statement))
      .flatMap(getVarNames);
    const clash = lexical.find(
      (name, position) => lexical.indexOf(name) !== position || vars.includes(name),
    );
    if (clash !== undefined) reject(`Identifier '${clash}' has already been declared`, sourceFile);
  }
  const visit = (node: ts.Node) => {
    if (ts.isRegularExpressionLiteral(node)) {
      const error = getRegularExpressionError(node);
      if (error !== undefined) reject(error, node);
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
    if (ts.isFunctionLike(node) && "body" in node && node.body !== undefined) {
      const parameters = node.parameters.filter(
        (parameter) => !(ts.isIdentifier(parameter.name) && parameter.name.text === "this"),
      );
      const names = parameters.flatMap((parameter) => getBindingNames(parameter.name));
      const duplicate = names.find((name, position) => names.indexOf(name) !== position);
      // Outside strict mode, a plain function with simple parameters can name a parameter twice.
      const isSloppyDuplicate =
        (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
        !isStrictCode(node) &&
        parameters.every(
          (parameter) =>
            ts.isIdentifier(parameter.name) &&
            parameter.initializer === undefined &&
            parameter.dotDotDotToken === undefined,
        );
      if (duplicate !== undefined && isSloppyDuplicate) {
        throw new TlaTypeScriptError(
          "tla-ts can't run a function that names a parameter twice outside strict mode",
          node,
        );
      }
      if (duplicate !== undefined)
        reject("Duplicate parameter name not allowed in this context", node);
    }
    if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) && isBodyOf(node)) {
      if (isSloppyFunctionBody(node)) {
        throw new TlaTypeScriptError(
          "tla-ts can't run a function declaration that is a statement's body outside strict mode",
          node,
        );
      }
      reject("A declaration can't be the body of a statement", node);
    }
    rejectLexicalWithBody(node);
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
    // A private name that a read or an in names is one that a class body around it declares.
    if (
      ts.isPrivateIdentifier(node) &&
      ((ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) ||
        (ts.isBinaryExpression(node.parent) && node.parent.left === node)) &&
      ts.findAncestor(
        node,
        (ancestor) =>
          ts.isClassLike(ancestor) &&
          node.pos >= ancestor.members.pos &&
          node.end <= ancestor.members.end &&
          ancestor.members.some(
            (member) =>
              member.name !== undefined &&
              ts.isPrivateIdentifier(member.name) &&
              member.name.text === node.text,
          ),
      ) === undefined
    ) {
      reject(`Private field '${node.text}' must be declared in an enclosing class`, node);
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      node.expression.kind === ts.SyntaxKind.SuperKeyword &&
      ts.isPrivateIdentifier(node.name)
    ) {
      reject("Unexpected private name after super", node.name);
    }
    // A class field's initializer and a static block read no arguments, outside the functions that
    // they hold that aren't arrows.
    if (ts.isIdentifier(node) && node.text === "arguments" && !isPropertyName(node)) {
      const owner = ts.findAncestor(
        node.parent,
        (ancestor) =>
          (ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor)) ||
          (ts.isPropertyDeclaration(ancestor) && ancestor.initializer !== undefined) ||
          ts.isClassStaticBlockDeclaration(ancestor),
      );
      if (
        owner !== undefined &&
        (ts.isClassStaticBlockDeclaration(owner) ||
          (ts.isPropertyDeclaration(owner) &&
            owner.initializer !== undefined &&
            node.pos >= owner.initializer.pos))
      ) {
        reject(
          "'arguments' is not allowed in class field initializer or static initialization block",
          node,
        );
      }
    }
    // An import binds no name that strict code reserves.
    if (
      ts.isIdentifier(node) &&
      (node.text === "arguments" || node.text === "eval") &&
      (ts.isImportClause(node.parent) ||
        ts.isNamespaceImport(node.parent) ||
        (ts.isImportSpecifier(node.parent) && node.parent.name === node))
    ) {
      reject(`Unexpected ${node.text} in strict mode`, node);
    }
    // An import's attributes name each key once.
    if (ts.isImportAttributes(node)) {
      const keys = node.elements.map((element) => element.name.text);
      if (new Set(keys).size !== keys.length) reject("Import attribute has duplicate key", node);
    }
    // A module reserves await, which TypeScript reads as a name inside a function that isn't
    // async, as in an arrow's parameters.
    if (
      ts.isIdentifier(node) &&
      node.text === "await" &&
      isModuleFile(sourceFile) &&
      !isPropertyName(node)
    ) {
      reject("Unexpected reserved word", node);
    }
    if (ts.isMetaProperty(node) && node.name.getText() !== node.name.text) {
      reject("Keywords can't contain escapes", node.name);
    }
    if (
      ts.isIdentifier(node) &&
      (node.text === "arguments" || node.text === "eval") &&
      isAssigned(node)
    ) {
      if (!isStrictCode(node)) {
        throw new TlaTypeScriptError(`tla-ts can't write ${node.text} outside strict mode`, node);
      }
      reject(`Unexpected ${node.text} in strict mode`, node);
    }
    // TypeScript reports an import call that an operator such as -= or ++ assigns only as an operand
    // of another type than a number.
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      isAssigned(
        ts.findAncestor(node, (ancestor) => !ts.isParenthesizedExpression(ancestor.parent)) ?? node,
      )
    ) {
      reject("Invalid left-hand side in assignment", node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
};
