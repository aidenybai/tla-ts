import ts from "@typescript/typescript6";
import { isStackOverflow, TlaTypeScriptError } from "../errors";
import { isModuleFile, isStrictCode } from "./context";

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
// Code that a declare holds, as declare global does, which only types the host's values and never
// runs.
const isAmbientCode = (node: ts.Node) =>
  ts.findAncestor(
    node,
    (ancestor) =>
      ts.canHaveModifiers(ancestor) &&
      (ts.getModifiers(ancestor) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword,
      ),
  ) !== undefined;

const getVarNames = (node: ts.Node): string[] => {
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
// block. A compile gives a let that a line break follows there the semicolon that JavaScript reads
// after it, as the name let, before it parses the file.
const rejectLexicalWithBody = (node: ts.Node) => {
  if (
    !ts.isVariableStatement(node) ||
    !ts.isWithStatement(node.parent) ||
    (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
  ) {
    return;
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
const getRegularExpressionError = (node: ts.RegularExpressionLiteral) => {
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

const getNodeAt = (node: ts.Node, position: number): ts.Node =>
  ts.forEachChild(node, (child) =>
    child.getStart() <= position && position < child.getEnd()
      ? getNodeAt(child, position)
      : undefined,
  ) ?? node;

// TypeScript's error for a redeclared block-scoped variable, which it reports outside strict mode
// of code that Annex B allows, such as a function declaration that an if statement's branch is,
// beside a let of its name.
const REDECLARED_ERROR = 2451;

// TypeScript's errors for JavaScript that Node runs: a var in a catch block that redeclares the
// catch's parameter, as Annex B allows.
const NODE_ACCEPTED_ERRORS = new Set([2492]);

// The file of TypeScript's own checks of a file's JavaScript.
const GRAMMAR_PATH = "/tla-ts/grammar.js";

// Rejects the first of TypeScript's errors in a file read as plain JavaScript, past its syntax
// errors, which its parser reports: the errors of its binder and checker that it reports in
// JavaScript that it doesn't type check, which are those that ECMAScript makes early errors, but
// for those of code that Node runs. The file is a module where its
// implied format makes it one, and strict code where it says so.
const rejectGrammarErrors = (sourceFile: ts.SourceFile) => {
  const file = ts.createSourceFile(
    GRAMMAR_PATH,
    sourceFile.text,
    { languageVersion: ts.ScriptTarget.ESNext, impliedNodeFormat: sourceFile.impliedNodeFormat },
    true,
    ts.ScriptKind.JS,
  );
  const program = ts.createProgram({
    rootNames: [GRAMMAR_PATH],
    options: {
      allowJs: true,
      noLib: true,
      noResolve: true,
      types: [],
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleDetection: ts.ModuleDetectionKind.Legacy,
      alwaysStrict: false,
      ignoreDeprecations: "6.0",
    },
    // A host of the one file, which needs no file system, so that a browser checks the file too.
    host: {
      getSourceFile: (fileName) => (fileName === GRAMMAR_PATH ? file : undefined),
      fileExists: (fileName) => fileName === GRAMMAR_PATH,
      readFile: () => undefined,
      getDefaultLibFileName: () => "lib.d.ts",
      writeFile: () => {},
      getCurrentDirectory: () => "/",
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
    },
  });
  // TypeScript's checker infers the file's types to report these, which can recurse past any
  // stack on a large program, where only V8 could tell.
  const getDiagnostics = () => {
    try {
      return program.getSemanticDiagnostics(file);
    } catch (error) {
      if (!isStackOverflow(error)) throw error;
      throw new TlaTypeScriptError(
        "tla-ts can't tell whether Node rejects a file's syntax without a Node to parse it",
        sourceFile,
      );
    }
  };
  const diagnostic = getDiagnostics().find(
    (candidate) =>
      candidate.category === ts.DiagnosticCategory.Error &&
      !NODE_ACCEPTED_ERRORS.has(candidate.code) &&
      (candidate.code !== REDECLARED_ERROR ||
        isStrictCode(getNodeAt(sourceFile, candidate.start ?? 0))),
  );
  if (diagnostic !== undefined) {
    reject(
      ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
      getNodeAt(sourceFile, diagnostic.start ?? 0),
    );
  }
};

// The program that Node runs under Bun to parse a script as vm does, which prints what --check
// prints for a module: the line of the SyntaxError, then the error.
const SCRIPT_CHECK = `const vm = require("node:vm");
try {
  new vm.Script(require("node:fs").readFileSync(0, "utf8"), { filename: "[stdin]" });
} catch (error) {
  if (!(error instanceof SyntaxError)) throw error;
  console.error(error.stack.split("\\n")[0]);
  console.error("SyntaxError: " + error.message);
  process.exit(1);
}`;

// V8's parse of a file's JavaScript, as Node parses it as it loads the file, which runs nothing of
// it: the SyntaxError it throws and its line, or none where it accepts the file, or undefined where
// no Node is at hand. A module parses through Node's loader, as vm parses modules only under a
// flag. Bun's vm parses with JavaScriptCore, so under Bun a Node on the path parses the file.
const getNodeParse = (sourceFile: ts.SourceFile) => {
  const host = globalThis.process;
  const vm = host?.getBuiltinModule?.("node:vm");
  if (vm === undefined) return undefined;
  const isBun = host.versions.bun !== undefined;
  // A file of import and export declarations parses as a module, as a model's file does, which
  // its compile reads as a script.
  const isScript =
    sourceFile.impliedNodeFormat !== ts.ModuleKind.ESNext && !ts.isExternalModule(sourceFile);
  if (isScript && !isBun) {
    try {
      new vm.Script(sourceFile.text, { filename: sourceFile.fileName });
      return { error: undefined };
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      const line = /:(\d+)$/.exec(error.stack?.split("\n")[0] ?? "")?.[1];
      return { error: { message: error.message, line: Number(line ?? 1) } };
    }
  }
  const run = host
    .getBuiltinModule("node:child_process")
    .spawnSync(
      isBun ? "node" : host.execPath,
      isScript ? ["-e", SCRIPT_CHECK] : ["--input-type=module", "--check"],
      { input: sourceFile.text, encoding: "utf8" },
    );
  if (run.error !== undefined) return undefined;
  if (run.status === 0) return { error: undefined };
  const lines = run.stderr.split("\n");
  const message = lines.find((line) => line.startsWith("SyntaxError: "));
  const line = /:(\d+)$/.exec(lines.find((inner) => /:\d+$/.test(inner)) ?? "")?.[1];
  return message === undefined
    ? undefined
    : { error: { message: message.slice("SyntaxError: ".length), line: Number(line ?? 1) } };
};

// Rejects programs that JavaScript rejects as it parses, as V8 does where Node is at hand and else
// where TypeScript's parser accepts them.
export const rejectEarlyErrors = (sourceFile: ts.SourceFile) => {
  const parse = getNodeParse(sourceFile);
  if (parse === undefined) {
    rejectTypeScriptEarlyErrors(sourceFile);
    return;
  }
  if (parse.error !== undefined) {
    // V8 gives some errors line 0, as a rest element's initializer, so a line outside the file
    // places the error at its start.
    const lineStarts = sourceFile.getLineStarts();
    reject(parse.error.message, getNodeAt(sourceFile, lineStarts[parse.error.line - 1] ?? 0));
  }
  const visit = (node: ts.Node): void => {
    rejectLexicalWithBody(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
};

// Rejects what JavaScript rejects as it parses where TypeScript's parser accepts it, as tla-ts's own
// checks and TypeScript's find it.
const rejectTypeScriptEarlyErrors = (sourceFile: ts.SourceFile) => {
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
      if (duplicate !== undefined && !isSloppyDuplicate) {
        reject("Duplicate parameter name not allowed in this context", node);
      }
    }
    if (
      (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) &&
      isBodyOf(node) &&
      !isSloppyFunctionBody(node)
    ) {
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
      isAssigned(node) &&
      isStrictCode(node)
    ) {
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
  rejectGrammarErrors(sourceFile);
};
