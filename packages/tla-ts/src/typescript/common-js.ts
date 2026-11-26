import ts from "@typescript/typescript6";

// The modules that Node builds in, which a specifier names before any package does.
const NODE_MODULES = new Set([
  "_http_agent",
  "_http_client",
  "_http_common",
  "_http_incoming",
  "_http_outgoing",
  "_http_server",
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
// one from the working directory, which a host without a file system, such as a browser, takes as
// the root.
const getDirectory = (path: string) => {
  const absolute = (ts.sys?.resolvePath(path) ?? joinPath("/", path)).replaceAll("\\", "/");
  return absolute.slice(0, Math.max(absolute.lastIndexOf("/"), 1));
};

export const joinPath = (directory: string, relative: string) =>
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
  const text = ts.sys?.readFile(`${directory}/package.json`);
  const parsed: unknown = text === undefined ? undefined : JSON.parse(text);
  return isObject(parsed) ? parsed : undefined;
};

const getRealPath = (path: string) => ts.sys?.realpath?.(path) ?? path;

const isFile = (path: string) => ts.sys?.fileExists(path) === true;

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
