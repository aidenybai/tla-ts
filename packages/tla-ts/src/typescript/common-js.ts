import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import type { Expression } from "../ast";
import type { Context } from "./context";
import { useJavaScript } from "./javascript";
import { getJsonHeapObjects, parseJson } from "./json";
import { identifier, number, string } from "./tla";

// The modules that Node builds in, which a specifier names before any package does.
const NODE_MODULES = new Set([
  "_http_agent",
  "_http_client",
  "_http_common",
  "_http_incoming",
  "_http_outgoing",
  "_http_server",
  "_stream_duplex",
  "_stream_passthrough",
  "_stream_readable",
  "_stream_transform",
  "_stream_wrap",
  "_stream_writable",
  "_tls_common",
  "_tls_wrap",
  "assert",
  "assert/strict",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "dns/promises",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "inspector",
  "inspector/promises",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "readline/promises",
  "repl",
  "stream",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "timers",
  "timers/promises",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
]);

// The conditions that Node matches in a package's exports, for an import and for a require.
const IMPORT_CONDITIONS = new Set(["node", "import", "module-sync", "default"]);
const REQUIRE_CONDITIONS = new Set(["node", "require", "module-sync", "default"]);

// The directory that holds a path, which Node finds from the absolute path, as it resolves a relative
// one from the working directory.
const getDirectory = (path: string) => {
  const absolute = ts.sys.resolvePath(path).replaceAll("\\", "/");
  return absolute.slice(0, Math.max(absolute.lastIndexOf("/"), 1));
};

const joinPath = (directory: string, relative: string) =>
  `${relative.startsWith("/") ? "" : directory}/${relative}`
    .split("/")
    .reduce<string[]>(
      (segments, segment) =>
        segment === "" || segment === "."
          ? segments
          : segment === ".."
            ? segments.slice(0, -1)
            : [...segments, segment],
      [],
    )
    .reduce((path, segment) => `${path}/${segment}`, "") || "/";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readPackage = (directory: string): Record<string, unknown> | undefined => {
  const text = ts.sys.readFile(`${directory}/package.json`);
  const parsed: unknown = text === undefined ? undefined : JSON.parse(text);
  return isObject(parsed) ? parsed : undefined;
};

const getRealPath = (path: string) => ts.sys.realpath?.(path) ?? path;

const isFile = (path: string) => ts.sys.fileExists(path);

// PACKAGE_TARGET_RESOLVE of Node's resolver: a target of a package's exports, with what a pattern
// matched in place of each star.
const resolveTarget = (
  directory: string,
  target: unknown,
  match: string | undefined,
  conditions: ReadonlySet<string>,
): string | undefined => {
  if (typeof target === "string") {
    if (!target.startsWith("./")) return undefined;
    return joinPath(directory, match === undefined ? target : target.replaceAll("*", match));
  }
  if (Array.isArray(target)) {
    return target.reduce<string | undefined>(
      (found, inner) => found ?? resolveTarget(directory, inner, match, conditions),
      undefined,
    );
  }
  if (!isObject(target)) return undefined;
  return Object.entries(target).reduce<string | undefined>(
    (found, [condition, inner]) =>
      found ??
      (conditions.has(condition) ? resolveTarget(directory, inner, match, conditions) : undefined),
    undefined,
  );
};

// PATTERN_KEY_COMPARE of Node's resolver, which puts the most specific pattern first.
const comparePatterns = (left: string, right: string) => {
  const leftBase = left.indexOf("*") + 1 || left.length;
  const rightBase = right.indexOf("*") + 1 || right.length;
  return rightBase - leftBase || right.length - left.length;
};

// PACKAGE_EXPORTS_RESOLVE of Node's resolver, for a subpath that starts with a dot.
const resolveExports = (
  directory: string,
  subpath: string,
  exports: unknown,
  conditions: ReadonlySet<string>,
) => {
  const isSugar =
    typeof exports === "string" ||
    Array.isArray(exports) ||
    (isObject(exports) && Object.keys(exports).every((key) => !key.startsWith(".")));
  const map = isSugar ? { ".": exports } : exports;
  if (!isObject(map)) return undefined;
  if (Object.hasOwn(map, subpath) && !subpath.includes("*")) {
    return resolveTarget(directory, map[subpath], undefined, conditions);
  }
  const pattern = Object.keys(map)
    .filter((key) => {
      const star = key.indexOf("*");
      return (
        star !== -1 &&
        key.indexOf("*", star + 1) === -1 &&
        subpath.startsWith(key.slice(0, star)) &&
        subpath !== key.slice(0, star) &&
        subpath.length >= key.length &&
        subpath.endsWith(key.slice(star + 1))
      );
    })
    .toSorted(comparePatterns)
    .at(0);
  if (pattern === undefined) return undefined;
  const star = pattern.indexOf("*");
  return resolveTarget(
    directory,
    map[pattern],
    subpath.slice(star, subpath.length - (pattern.length - star - 1)),
    conditions,
  );
};

const getPackageName = (specifier: string) => {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
};

const getNodeModuleDirectories = (directory: string): string[] =>
  directory === "/"
    ? ["/node_modules"]
    : [
        ...(directory.endsWith("/node_modules") ? [] : [`${directory}/node_modules`]),
        ...getNodeModuleDirectories(getDirectory(directory)),
      ];

// The file of the first package of the node_modules directories that a subpath names: the one
// that it exports, or, for a package with no exports, the one that the subpath names as a path,
// where Node looks on in the next directory if there's none. Node finds no file where a package
// doesn't export the subpath.
const resolvePackage = (
  specifier: string,
  directories: readonly string[],
  conditions: ReadonlySet<string>,
  load: (path: string) => string | undefined,
): string | undefined => {
  const modules = directories.at(0);
  if (modules === undefined) return undefined;
  const name = getPackageName(specifier);
  const exports = readPackage(`${modules}/${name}`)?.exports;
  if (exports === undefined) {
    return (
      load(`${modules}/${specifier}`) ??
      resolvePackage(specifier, directories.slice(1), conditions, load)
    );
  }
  const target = resolveExports(
    `${modules}/${name}`,
    `.${specifier.slice(name.length)}`,
    exports,
    conditions,
  );
  return target !== undefined && isFile(target) ? target : undefined;
};

// LOAD_AS_FILE and LOAD_AS_DIRECTORY of Node's require.
const loadAsFile = (path: string) =>
  [path, `${path}.js`, `${path}.json`, `${path}.node`].find(isFile);

const loadIndex = (path: string) =>
  [`${path}/index.js`, `${path}/index.json`, `${path}/index.node`].find(isFile);

const loadAsDirectory = (path: string) => {
  const main = readPackage(path)?.main;
  const mainPath = typeof main === "string" ? joinPath(path, main) : undefined;
  return (
    (mainPath === undefined ? undefined : (loadAsFile(mainPath) ?? loadIndex(mainPath))) ??
    loadIndex(path)
  );
};

const loadRequired = (path: string) =>
  (path.endsWith("/") ? undefined : loadAsFile(path)) ?? loadAsDirectory(path);

const isRelative = (specifier: string) =>
  specifier.startsWith("./") ||
  specifier.startsWith("../") ||
  specifier.startsWith("/") ||
  specifier === "." ||
  specifier === "..";

// A specifier of a module that Node builds in.
export const isNodeModule = (specifier: string) =>
  specifier.startsWith("node:") || NODE_MODULES.has(specifier);

// The file that a require of a specifier loads, as Node's require resolves it from a module, or
// undefined where it loads none, or a module that Node builds in or a package's import.
const resolveRequire = (specifier: string, fileName: string) => {
  if (isNodeModule(specifier) || specifier.startsWith("#")) return undefined;
  const directory = getDirectory(fileName);
  const found = isRelative(specifier)
    ? loadRequired(joinPath(directory, specifier))
    : resolvePackage(
        specifier,
        getNodeModuleDirectories(directory),
        REQUIRE_CONDITIONS,
        loadRequired,
      );
  return found === undefined ? undefined : getRealPath(found);
};

// A name that a node declares, rather than one that it reads or a property's name.
const isBindingName = (node: ts.Identifier) => {
  const parent = node.parent;
  return (
    (ts.isVariableDeclaration(parent) ||
      ts.isParameter(parent) ||
      ts.isFunctionDeclaration(parent) ||
      ts.isFunctionExpression(parent) ||
      ts.isClassLike(parent) ||
      (ts.isBindingElement(parent) && parent.propertyName !== node)) &&
    parent.name === node
  );
};

// A name that isn't a variable's, such as a property's or a label.
const isPropertyName = (node: ts.Identifier) => {
  const parent = node.parent;
  return (
    ((ts.isPropertyAccessExpression(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isAccessor(parent) ||
      ts.isPropertyDeclaration(parent)) &&
      parent.name === node) ||
    (ts.isBindingElement(parent) && parent.propertyName === node) ||
    ts.isLabeledStatement(parent) ||
    ts.isBreakOrContinueStatement(parent)
  );
};

// Whether a file declares process, which process.env then doesn't read Node's.
export const isProcessDeclared = (file: ts.SourceFile) => {
  const visit = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) && node.text === "process" && isBindingName(node)) ||
    (ts.forEachChild(node, visit) ?? false);
  return visit(file);
};

// The value of an expression that only compares literals and the environment variables that
// process.env names, as Node gives the environment that tla-ts runs in, or undefined for another.
const getConstant = (
  node: ts.Expression,
  isProcessDeclared: boolean,
): { value: unknown } | undefined => {
  if (ts.isParenthesizedExpression(node)) return getConstant(node.expression, isProcessDeclared);
  if (ts.isStringLiteralLike(node)) return { value: node.text };
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true };
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false };
  if (node.kind === ts.SyntaxKind.NullKeyword) return { value: null };
  if (
    !isProcessDeclared &&
    ts.isPropertyAccessExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "env" &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "process"
  ) {
    return { value: typeof process === "undefined" ? undefined : process.env[node.name.text] };
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    const operand = getConstant(node.operand, isProcessDeclared);
    return operand === undefined ? undefined : { value: !operand.value };
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const left = getConstant(node.left, isProcessDeclared);
  const right = getConstant(node.right, isProcessDeclared);
  if (left === undefined || right === undefined) return undefined;
  const kind = node.operatorToken.kind;
  return kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    ? { value: left.value === right.value }
    : kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
      ? { value: left.value !== right.value }
      : kind === ts.SyntaxKind.AmpersandAmpersandToken
        ? { value: left.value && right.value }
        : kind === ts.SyntaxKind.BarBarToken
          ? { value: left.value || right.value }
          : undefined;
};

// Code that never runs, as a condition that only compares constants skips it, such as the branch
// of a package's index for the other NODE_ENV, whose requires load nothing.
const isDeadCode = (node: ts.Node, isProcessDeclared: boolean): boolean => {
  const parent = node.parent;
  if (parent === undefined) return false;
  const getTruth = (condition: ts.Expression) => {
    const constant = getConstant(condition, isProcessDeclared);
    return constant === undefined ? undefined : Boolean(constant.value);
  };
  const isSkipped =
    ts.isIfStatement(parent) && node !== parent.expression
      ? getTruth(parent.expression) === (node === parent.elseStatement)
      : ts.isConditionalExpression(parent) && node !== parent.condition
        ? getTruth(parent.condition) === (node === parent.whenFalse)
        : ts.isBinaryExpression(parent) &&
          node === parent.right &&
          ((parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
            getTruth(parent.left) === false) ||
            (parent.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
              getTruth(parent.left) === true));
  return isSkipped || isDeadCode(parent, isProcessDeclared);
};

// The file that an import of a specifier loads, as Node's import resolves it, or undefined where
// it loads none, or a module that Node builds in or a package's import.
const resolveImport = (specifier: string, fileName: string) => {
  if (isNodeModule(specifier) || specifier.startsWith("#")) return undefined;
  const directory = getDirectory(fileName);
  const loadExact = (path: string) => (isFile(path) ? path : undefined);
  const loadMain = (path: string) =>
    specifier === getPackageName(specifier) ? loadAsDirectory(path) : loadExact(path);
  const found = isRelative(specifier)
    ? loadExact(joinPath(directory, specifier))
    : resolvePackage(specifier, getNodeModuleDirectories(directory), IMPORT_CONDITIONS, loadMain);
  return found === undefined ? undefined : getRealPath(found);
};

export const isJavaScriptFile = (fileName: string) => /\.[cm]?js$/.test(fileName);

// A call of the require that Node passes a CommonJS module, with a string.
const isRequireCall = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === "require" &&
  node.arguments.length === 1 &&
  ts.isStringLiteralLike(node.arguments[0]);

// The file that Node loads for a module's specifier, which a require or an import names, or
// undefined for a require that never runs, where a condition that only compares constants skips
// it, such as the one of a package's index for the other NODE_ENV.
export const resolveModule = (specifier: ts.StringLiteralLike, fileName: string) => {
  const call = specifier.parent;
  if (isRequireCall(call)) {
    return isDeadCode(call, isProcessDeclared(specifier.getSourceFile()))
      ? undefined
      : resolveRequire(specifier.text, fileName);
  }
  return resolveImport(specifier.text, fileName);
};

// The type that the package.json nearest a directory gives its JavaScript files.
const getPackageType = (directory: string): unknown => {
  const found = readPackage(directory);
  return found !== undefined || directory === "/"
    ? found?.type
    : getPackageType(getDirectory(directory));
};

// Syntax that only an ES module has, which makes Node load a .js file of a package with no type as
// one.
const hasModuleSyntax = (node: ts.Node): boolean =>
  ts.isImportDeclaration(node) ||
  ts.isExportDeclaration(node) ||
  ts.isExportAssignment(node) ||
  (ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )) ||
  (ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword) ||
  ts.isAwaitExpression(node) ||
  (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasModuleSyntax) ?? false));

// A JavaScript file, which Node loads as an ES module where its extension or its package's type
// makes it one, or, for a .js file of a package with no type, its syntax, and else as CommonJS.
export const createJavaScriptFile = (
  fileName: string,
  text: string,
  languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions,
) => {
  const options = typeof languageVersion === "object" ? languageVersion : { languageVersion };
  const create = (impliedNodeFormat: ts.ResolutionMode) =>
    ts.createSourceFile(fileName, text, { ...options, impliedNodeFormat }, true);
  if (fileName.endsWith(".mjs")) return create(ts.ModuleKind.ESNext);
  if (fileName.endsWith(".cjs")) return create(ts.ModuleKind.CommonJS);
  const type = getPackageType(getDirectory(fileName));
  if (type === "module") return create(ts.ModuleKind.ESNext);
  const file = create(ts.ModuleKind.CommonJS);
  return type === undefined && hasModuleSyntax(file) ? create(ts.ModuleKind.ESNext) : file;
};

// A file that Node runs as CommonJS, in the function that it wraps a module's code in.
export const isCommonJsFile = (file: ts.SourceFile) =>
  isJavaScriptFile(file.fileName) && file.impliedNodeFormat === ts.ModuleKind.CommonJS;

// The parameters of the function that Node runs a CommonJS module's code in.
const WRAPPER_NAMES = new Set(["exports", "require", "module", "__filename", "__dirname"]);

// A name that a CommonJS module's code reads where no declaration of its own binds it, which
// names a parameter of the function that Node runs the code in. TypeScript gives such a name a
// symbol of what the module exports, if any.
export const getWrapperName = (node: ts.Identifier, checker: ts.TypeChecker) => {
  if (
    !WRAPPER_NAMES.has(node.text) ||
    isPropertyName(node) ||
    isBindingName(node) ||
    !isCommonJsFile(node.getSourceFile())
  ) {
    return undefined;
  }
  const isDeclared = (checker.getSymbolAtLocation(node)?.declarations ?? []).some(
    (declaration) =>
      (ts.isVariableDeclaration(declaration) ||
        ts.isParameter(declaration) ||
        ts.isFunctionLike(declaration) ||
        ts.isClassLike(declaration) ||
        ts.isBindingElement(declaration)) &&
      declaration.name !== undefined &&
      ts.isIdentifier(declaration.name) &&
      declaration.name.text === node.text,
  );
  return isDeclared ? undefined : node.text;
};

// The JSON file that Node loads for a module's specifier, which TypeScript doesn't read, as it
// reads only what code declares, and tla-ts reads JSON's value as any.
export const getJsonPath = (specifier: ts.Expression) => {
  const path = ts.isStringLiteralLike(specifier)
    ? resolveModule(specifier, specifier.getSourceFile().fileName)
    : undefined;
  return path?.endsWith(".json") === true ? path : undefined;
};

// The module that a require of a string loads, which TypeScript resolves as Node does, or the path
// of a JSON file, or undefined where it never runs.
export const getRequiredFile = (call: ts.CallExpression, checker: ts.TypeChecker) => {
  const declaration = checker.getSymbolAtLocation(call.arguments[0])?.valueDeclaration;
  return declaration !== undefined && ts.isSourceFile(declaration)
    ? declaration
    : getJsonPath(call.arguments[0]);
};

// A require of a string, which a CommonJS module calls where no declaration of its own binds
// require.
export const isModuleRequire = (
  node: ts.Node,
  checker: ts.TypeChecker,
): node is ts.CallExpression =>
  isRequireCall(node) &&
  ts.isIdentifier(node.expression) &&
  getWrapperName(node.expression, checker) === "require";

// Whether an expression runs no code that another module could see or change what it gives:
// a literal, a name, a function, the this of a module, a require, or a property of what a
// require gives or of module or exports.
const isQuiet = (node: ts.Expression): boolean =>
  ts.isLiteralExpression(node) ||
  ts.isIdentifier(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  [
    ts.SyntaxKind.NullKeyword,
    ts.SyntaxKind.TrueKeyword,
    ts.SyntaxKind.FalseKeyword,
    ts.SyntaxKind.ThisKeyword,
  ].includes(node.kind) ||
  isRequireCall(node) ||
  (ts.isParenthesizedExpression(node) && isQuiet(node.expression)) ||
  (ts.isPropertyAccessExpression(node) &&
    (isRequireCall(node.expression) ||
      (ts.isIdentifier(node.expression) && ["module", "exports"].includes(node.expression.text))));

// Whether a statement runs no code, as one that only declares functions or names quiet values.
const isQuietStatement = (statement: ts.Statement) =>
  (ts.isFunctionDeclaration(statement) && statement.body !== undefined) ||
  ts.isEmptyStatement(statement) ||
  (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) ||
  (ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.every(
      (declaration) => declaration.initializer === undefined || isQuiet(declaration.initializer),
    ));

// A function that the code around it calls in place, as (function () { ... })() or
// (function () { ... }).call(this) does, with arguments that run no code.
const isCalledInPlace = (node: ts.FunctionExpression | ts.ArrowFunction) => {
  const wrapped = ts.findAncestor(
    node,
    (ancestor) => !ts.isParenthesizedExpression(ancestor.parent),
  );
  const parent = wrapped?.parent;
  const isCallMethod =
    parent !== undefined &&
    ts.isPropertyAccessExpression(parent) &&
    parent.expression === wrapped &&
    parent.name.text === "call";
  const call = isCallMethod ? parent.parent : parent;
  return (
    call !== undefined &&
    ts.isCallExpression(call) &&
    call.expression === (isCallMethod ? parent : wrapped) &&
    call.arguments.every(isQuiet)
  );
};

// Whether a condition only compares constants, and gives a value of a truth.
const isTruth = (node: ts.Expression, truth: boolean, isProcessDeclared: boolean) => {
  const constant = getConstant(node, isProcessDeclared);
  return constant !== undefined && Boolean(constant.value) === truth;
};

// Whether code runs whenever the code around it runs, before anything else in it that another
// module could see.
const isRunFirst = (node: ts.Node, parent: ts.Node, isProcessDeclared: boolean): boolean => {
  const isAfterQuiet = (nodes: readonly ts.Node[]) =>
    nodes.slice(0, nodes.indexOf(node)).every((inner) => ts.isExpression(inner) && isQuiet(inner));
  if (
    ts.isParenthesizedExpression(parent) ||
    ts.isExpressionStatement(parent) ||
    ts.isVariableStatement(parent) ||
    ts.isReturnStatement(parent) ||
    ts.isPrefixUnaryExpression(parent) ||
    ts.isVoidExpression(parent) ||
    (ts.isVariableDeclaration(parent) && parent.initializer === node) ||
    ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
      parent.expression === node) ||
    ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === node) ||
    (ts.isIfStatement(parent) && parent.expression === node) ||
    (ts.isConditionalExpression(parent) && parent.condition === node)
  ) {
    return true;
  }
  if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
    return isQuiet(parent.expression) && isAfterQuiet(parent.arguments ?? []);
  }
  if (ts.isArrayLiteralExpression(parent)) return isAfterQuiet(parent.elements);
  if (ts.isPropertyAssignment(parent)) {
    const literal = parent.parent;
    const properties = literal.properties.slice(0, literal.properties.indexOf(parent));
    return properties.every(
      (property) =>
        ts.isShorthandPropertyAssignment(property) ||
        (ts.isPropertyAssignment(property) &&
          !ts.isComputedPropertyName(property.name) &&
          isQuiet(property.initializer)),
    );
  }
  if (ts.isObjectLiteralExpression(parent)) return true;
  if (ts.isVariableDeclarationList(parent)) {
    return parent.declarations
      .slice(
        0,
        parent.declarations.findIndex((declaration) => declaration === node),
      )
      .every(
        (declaration) => declaration.initializer === undefined || isQuiet(declaration.initializer),
      );
  }
  if (ts.isBinaryExpression(parent)) {
    const kind = parent.operatorToken.kind;
    if (node === parent.left) return true;
    if (kind === ts.SyntaxKind.EqualsToken) {
      return (
        ts.isIdentifier(parent.left) ||
        (ts.isPropertyAccessExpression(parent.left) && isQuiet(parent.left.expression))
      );
    }
    return kind === ts.SyntaxKind.AmpersandAmpersandToken
      ? isTruth(parent.left, true, isProcessDeclared)
      : kind === ts.SyntaxKind.BarBarToken
        ? isTruth(parent.left, false, isProcessDeclared)
        : kind === ts.SyntaxKind.CommaToken && isQuiet(parent.left);
  }
  if (ts.isConditionalExpression(parent)) {
    return isTruth(parent.condition, node === parent.whenTrue, isProcessDeclared);
  }
  if (ts.isIfStatement(parent)) {
    return isTruth(parent.expression, node === parent.thenStatement, isProcessDeclared);
  }
  if (ts.isBlock(parent)) {
    return parent.statements
      .slice(
        0,
        parent.statements.findIndex((statement) => statement === node),
      )
      .every(isQuietStatement);
  }
  return (
    (ts.isFunctionExpression(parent) || ts.isArrowFunction(parent)) &&
    parent.body === node &&
    isCalledInPlace(parent)
  );
};

// Whether a node runs whenever a statement of a module's code runs, before anything else in it
// that another module could see.
const isCertain = (node: ts.Node, statement: ts.Statement, isProcessDeclared: boolean): boolean =>
  node === statement ||
  (isRunFirst(node, node.parent, isProcessDeclared) &&
    isCertain(node.parent, statement, isProcessDeclared));

// The modules that each statement of a CommonJS module's code requires, in order, as a file or the
// path of JSON: whether Node loads each as the statement starts, as nothing else of the statement
// that another module could see runs first, and whether a function that the module declares
// requires it, which may run before the statement does.
export const getRequires = (file: ts.SourceFile, checker: ts.TypeChecker) => {
  const isDeclared = isProcessDeclared(file);
  return file.statements.map((statement) => {
    const requires: {
      call: ts.CallExpression;
      file: ts.SourceFile | string;
      isCertain: boolean;
      isHoisted: boolean;
    }[] = [];
    const visit = (node: ts.Node) => {
      const required =
        isModuleRequire(node, checker) && !isDeadCode(node, isDeclared)
          ? getRequiredFile(node, checker)
          : undefined;
      if (isModuleRequire(node, checker) && required !== undefined) {
        requires.push({
          call: node,
          file: required,
          isCertain: isCertain(node, statement, isDeclared),
          isHoisted: ts.isFunctionDeclaration(statement),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(statement);
    return { statement, requires };
  });
};

// The ref that the heap gives an object from the start, after the template objects.
const getModuleRef = (position: number, context: Context) =>
  useJavaScript(
    ":>",
    [
      identifier("Ref"),
      number(
        context.generatorPrototypes.size +
          context.namespaces.size +
          2 * context.templateSites.length +
          position +
          1,
      ),
    ],
    context,
  );

// The refs of a CommonJS or a JSON module's exports object and its module object, which the heap
// holds from the start.
export const getModuleRefs = (module: ts.SourceFile | string, context: Context) => {
  const position = [...context.commonJsModules, ...context.jsonModules.keys()].indexOf(module);
  if (position === -1) {
    throw new TlaTypeScriptError("tla-ts can't load this module here", context.script?.sourceFile);
  }
  return {
    exports: getModuleRef(2 * position, context),
    module: getModuleRef(2 * position + 1, context),
  };
};

// The value that JSON.parse gives of a JSON file's text, which Node reads as the module's value.
const readJson = (path: string, node: ts.Node) => {
  const parsed = parseJson(ts.sys.readFile(path) ?? "");
  if ("error" in parsed) {
    throw new TlaTypeScriptError(`tla-ts can't load ${path}, which isn't JSON`, node);
  }
  return parsed.value;
};

// The objects of the CommonJS and JSON modules, which the heap holds from the start: each one's
// exports object, and its module object, whose exports property holds that object until the
// module's code assigns another, or a JSON module's value, and then the objects that JSON.parse
// makes of the JSON modules' values.
export const getModuleObjects = (context: Context) => {
  const modules = [...context.jsonModules].reduce<{ values: Expression[]; objects: Expression[] }>(
    (current, entry) => {
      const start =
        2 * (context.commonJsModules.length + context.jsonModules.size) + current.objects.length;
      const made = getJsonHeapObjects(
        entry[1],
        readJson(entry[0], entry[1]),
        (position) => getModuleRef(start + position - 1, context),
        context,
      );
      return {
        values: [...current.values, made.value],
        objects: [...current.objects, ...made.objects],
      };
    },
    {
      values: context.commonJsModules.map((file) => getModuleRefs(file, context).exports),
      objects: [],
    },
  );
  return [
    ...modules.values.flatMap((value) => [
      identifier("EmptyObject"),
      useJavaScript("Put", [identifier("EmptyObject"), string("exports"), value], context),
    ]),
    ...modules.objects,
  ];
};

// The CommonJS module whose exports a name that an import binds gives, through the exports of
// other modules: its default export, which Node gives as the module's exports once its code has
// run.
export const getImportedCommonJs = (node: ts.Identifier, checker: ts.TypeChecker) => {
  const find = (symbol: ts.Symbol | undefined): ts.SourceFile | string | undefined => {
    if (symbol === undefined || (symbol.flags & ts.SymbolFlags.Alias) === 0) return undefined;
    const declaration = symbol.declarations?.at(0);
    const isDefault =
      declaration !== undefined &&
      ((ts.isImportClause(declaration) && declaration.name !== undefined) ||
        (ts.isImportSpecifier(declaration) &&
          (declaration.propertyName ?? declaration.name).text === "default"));
    const statement = isDefault ? ts.findAncestor(declaration, ts.isImportDeclaration) : undefined;
    const module =
      statement === undefined
        ? undefined
        : checker.getSymbolAtLocation(statement.moduleSpecifier)?.valueDeclaration;
    if (module !== undefined && ts.isSourceFile(module) && isCommonJsFile(module)) return module;
    // TypeScript reads a JSON module through the declaration of JSON's modules.
    const json =
      statement !== undefined && module !== undefined && !ts.isSourceFile(module)
        ? getJsonPath(statement.moduleSpecifier)
        : undefined;
    return json ?? find(checker.getImmediateAliasedSymbol(symbol));
  };
  return find(checker.getSymbolAtLocation(node));
};

// Stops where a CommonJS module's code uses the function that Node runs it in in a way that tla-ts
// doesn't follow: it declares or assigns a parameter of the function, reads its arguments, or
// returns from it.
export const rejectWrapperUses = (file: ts.SourceFile, checker: ts.TypeChecker) => {
  const visit = (node: ts.Node) => {
    const isTopLevel =
      ts.findAncestor(
        node.parent,
        (ancestor) => ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor),
      ) === undefined;
    if (ts.isIdentifier(node) && WRAPPER_NAMES.has(node.text) && isBindingName(node)) {
      const owner = ts.findAncestor(node.parent, ts.isFunctionLike);
      if (owner === undefined || owner.name === node) {
        throw new TlaTypeScriptError(
          `tla-ts can't run a CommonJS module that declares ${node.text}`,
          node,
        );
      }
    }
    const name = ts.isIdentifier(node) ? getWrapperName(node, checker) : undefined;
    const parent = node.parent;
    if (
      name !== undefined &&
      ts.isBinaryExpression(parent) &&
      parent.left === node &&
      parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      throw new TlaTypeScriptError(`tla-ts can't assign ${name} in a CommonJS module`, node);
    }
    if (ts.isIdentifier(node) && node.text === "arguments" && isTopLevel && !isPropertyName(node)) {
      throw new TlaTypeScriptError(
        "tla-ts can't read the arguments of the function that Node runs a module in",
        node,
      );
    }
    if (ts.isReturnStatement(node) && ts.findAncestor(node, ts.isFunctionLike) === undefined) {
      throw new TlaTypeScriptError("tla-ts can't return from a CommonJS module's code", node);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
};

// Stops where an ES module imports a JSON file other than as Node does: its default export, which
// is the file's value, with the attribute type json.
export const rejectJsonImport = (statement: ts.Statement) => {
  const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
  const isTyped =
    ts.isImportDeclaration(statement) &&
    (statement.attributes?.elements ?? []).some(
      (attribute) =>
        attribute.name.text === "type" &&
        ts.isStringLiteral(attribute.value) &&
        attribute.value.text === "json",
    );
  if (
    clause === undefined ||
    clause.name === undefined ||
    clause.namedBindings !== undefined ||
    !isTyped
  ) {
    throw new TlaTypeScriptError(
      'tla-ts can\'t import JSON other than its default export, with { type: "json" }',
      statement,
    );
  }
};

// Stops where an ES module imports what Node doesn't give as a CommonJS module's default export,
// its exports: a name other than default, which Node finds in the module's code, or the module's
// namespace object, or where the module marks itself as an ES module, whose default TypeScript
// reads elsewhere.
export const rejectCommonJsImport = (statement: ts.Statement, file: ts.SourceFile) => {
  const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
  const bindings = clause?.namedBindings;
  const isDefaultOnly =
    clause !== undefined &&
    (bindings === undefined ||
      (ts.isNamedImports(bindings) &&
        bindings.elements.every(
          (element) => (element.propertyName ?? element.name).text === "default",
        )));
  if (!isDefaultOnly) {
    throw new TlaTypeScriptError(
      "tla-ts can't import other than the default export of a CommonJS module",
      statement,
    );
  }
  if (file.text.includes("__esModule")) {
    throw new TlaTypeScriptError(
      "tla-ts can't import the default export of a CommonJS module that marks itself as an ES module",
      statement,
    );
  }
};

// A symbol that TypeScript makes of a CommonJS module's exports: the module's, its module.exports,
// or a variable that a require initializes.
const isExportsSymbol = (symbol: ts.Symbol) =>
  (symbol.flags & ts.SymbolFlags.ModuleExports) !== 0 ||
  (symbol.declarations ?? []).some(
    (declaration) =>
      ((symbol.flags & ts.SymbolFlags.Alias) !== 0 &&
        (ts.isVariableDeclaration(declaration) || ts.isBindingElement(declaration))) ||
      (isCommonJsFile(declaration.getSourceFile()) &&
        (ts.isSourceFile(declaration) || ts.isBinaryExpression(declaration))),
  );

// HACK: TypeScript types a CommonJS module's module, exports, and what a require gives by what the
// module's code assigns, which nothing checks, as checkJs is off, and which other code may change
// as it runs. tla-ts reads them as any, which the run-time kind checks guard.
export const typeExportsAsAny = (checker: ts.TypeChecker): ts.TypeChecker => {
  const any = checker.getAnyType();
  const isExports = (symbol: ts.Symbol) =>
    isExportsSymbol(symbol) ||
    ((symbol.flags & ts.SymbolFlags.Alias) !== 0 &&
      isExportsSymbol(checker.getAliasedSymbol(symbol)));
  const isExportsNode = (node: ts.Node): boolean => {
    const file = node.getSourceFile();
    if (node.kind === ts.SyntaxKind.ThisKeyword) {
      return (
        isCommonJsFile(file) &&
        ts.findAncestor(
          node.parent,
          (ancestor) =>
            (ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor)) ||
            ts.isClassLike(ancestor),
        ) === undefined
      );
    }
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      return (
        ["module", "exports", "require"].includes(getWrapperName(node, checker) ?? "") ||
        (symbol !== undefined &&
          (isExports(symbol) ||
            ((symbol.flags & ts.SymbolFlags.Alias) !== 0 &&
              getImportedCommonJs(node, checker) !== undefined)))
      );
    }
    return (
      isModuleRequire(node, checker) ||
      (ts.isPropertyAccessExpression(node) &&
        node.name.text === "exports" &&
        ts.isIdentifier(node.expression) &&
        getWrapperName(node.expression, checker) === "module")
    );
  };
  return {
    ...checker,
    getTypeAtLocation: (node) => (isExportsNode(node) ? any : checker.getTypeAtLocation(node)),
    getTypeOfSymbol: (symbol) => (isExports(symbol) ? any : checker.getTypeOfSymbol(symbol)),
    getTypeOfSymbolAtLocation: (symbol, node) =>
      isExports(symbol) || isExportsNode(node)
        ? any
        : checker.getTypeOfSymbolAtLocation(symbol, node),
    getContextualType: (node) => {
      const parent = node.parent;
      return ts.isBinaryExpression(parent) &&
        parent.right === node &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        isExportsNode(parent.left)
        ? any
        : checker.getContextualType(node);
    },
  };
};

// Whether a JSON module's value holds a number that TLC's 32-bit integers don't, such as a fraction.
export const hasSpecialJsonNumbers = (context: Context) => {
  const isSpecial = (value: unknown): boolean =>
    typeof value === "number"
      ? !Number.isInteger(value) || Object.is(value, -0) || Math.abs(value) > 2 ** 31 - 1
      : typeof value === "object" && value !== null && Object.values(value).some(isSpecial);
  return [...context.jsonModules].some((entry) => isSpecial(readJson(entry[0], entry[1])));
};
