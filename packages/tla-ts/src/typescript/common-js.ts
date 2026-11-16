import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";

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

// The suffix of the TypeScript file that tla-ts makes for an import of a CommonJS module, which
// runs the module as the importer's import of it does.
const IMPORT_SUFFIX = ".import.ts";

// A CommonJS module's own file, which tla-ts compiles from the module's JavaScript, as allowJs is
// off and only it brings JavaScript into a program.
export const isCommonJsFile = (fileName: string) => /\.c?js$/.test(fileName);

export const isCommonJsImport = (fileName: string) =>
  fileName.endsWith(IMPORT_SUFFIX) && isCommonJsFile(fileName.slice(0, -IMPORT_SUFFIX.length));

const getDirectory = (path: string) => path.slice(0, Math.max(path.lastIndexOf("/"), 1));

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

// Where a package of a node_modules directory exports a subpath, or undefined for a package with no
// exports, which loads the subpath as a path.
const resolvePackage = (
  specifier: string,
  directory: string,
  conditions: ReadonlySet<string>,
  load: (path: string) => string | undefined,
  node: ts.Node,
) => {
  const name = getPackageName(specifier);
  const found = getNodeModuleDirectories(directory).reduce<string | undefined>(
    (resolved, modules) => {
      if (resolved !== undefined) return resolved;
      const packageDirectory = `${modules}/${name}`;
      const exports = readPackage(packageDirectory)?.exports;
      if (exports === undefined) return load(`${modules}/${specifier}`);
      const target = resolveExports(
        packageDirectory,
        `.${specifier.slice(name.length)}`,
        exports,
        conditions,
      );
      if (target === undefined || !isFile(target)) {
        throw new TlaTypeScriptError(
          `tla-ts can't load ${specifier}, which its package doesn't export`,
          node,
        );
      }
      return target;
    },
    undefined,
  );
  return found;
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

const rejectNodeModule = (specifier: string, node: ts.Node) => {
  if (specifier.startsWith("node:") || NODE_MODULES.has(specifier)) {
    throw new TlaTypeScriptError(`tla-ts can't load Node's built-in module ${specifier}`, node);
  }
};

// The file that a require of a specifier loads, as Node's require resolves it from a module.
const resolveRequire = (specifier: string, fileName: string, node: ts.Node) => {
  rejectNodeModule(specifier, node);
  if (specifier.startsWith("#")) {
    throw new TlaTypeScriptError(`tla-ts can't load a package's import ${specifier}`, node);
  }
  const directory = getDirectory(fileName);
  const found = isRelative(specifier)
    ? loadRequired(joinPath(directory, specifier))
    : resolvePackage(specifier, directory, REQUIRE_CONDITIONS, loadRequired, node);
  if (found === undefined) throw new TlaTypeScriptError(`tla-ts can't find ${specifier}`, node);
  return getRealPath(found);
};

// The format that Node loads a file in: CommonJS for a .cjs file, and for a .js file whose
// package.json doesn't make it an ES module.
const isCommonJs = (path: string): boolean => {
  if (path.endsWith(".cjs")) return true;
  if (!path.endsWith(".js")) return false;
  const getType = (directory: string): unknown => {
    const found = readPackage(directory);
    return found !== undefined || directory === "/"
      ? found?.type
      : getType(getDirectory(directory));
  };
  return getType(getDirectory(path)) !== "module";
};

const rejectFormat = (path: string, specifier: string, node: ts.Node) => {
  if (!isCommonJs(path)) {
    throw new TlaTypeScriptError(
      `tla-ts can't load ${specifier}, which isn't a CommonJS module`,
      node,
    );
  }
};

// The file that tla-ts compiles for an import of a module of a package or of JavaScript, which
// TypeScript doesn't resolve to its own code: a CommonJS module's import, or undefined where
// Node's resolver finds no file.
export const resolveImport = (specifier: ts.StringLiteralLike, fileName: string) => {
  const text = specifier.text;
  rejectNodeModule(text, specifier);
  if (text.startsWith("#")) return undefined;
  const directory = getDirectory(fileName);
  const loadExact = (path: string) => (isFile(path) ? path : undefined);
  const loadMain = (path: string) =>
    text === getPackageName(text) ? loadAsDirectory(path) : loadExact(path);
  const found = isRelative(text)
    ? loadExact(joinPath(directory, text))
    : resolvePackage(text, directory, IMPORT_CONDITIONS, loadMain, specifier);
  if (found === undefined) return undefined;
  const path = getRealPath(found);
  rejectFormat(path, text, specifier);
  return `${path}${IMPORT_SUFFIX}`;
};

// An import of a CommonJS module, which gives its exports as its default export once it runs.
export const getImportText = (fileName: string) => {
  const path = fileName.slice(0, -IMPORT_SUFFIX.length);
  return `import { $tlaLoad } from ${JSON.stringify(path)};
const $tlaExports: any = $tlaLoad();
export { $tlaExports as default };
`;
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

const findBindings = (file: ts.SourceFile) => {
  const names = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && isBindingName(node)) names.add(node.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return names;
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

// Text of the same lines as a piece of text, so that what follows it stays where it was.
const blank = (text: string) => text.replaceAll(/[^\n]/g, " ");

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

// A CommonJS module's code, which tla-ts compiles as TypeScript: a function that runs the module
// the first time a require or an import loads it, in the function that Node wraps a module's code
// in, which the module's exports object is this of. A require of a string loads the module it
// names through that module's own function. The code keeps its lines, the first after what tla-ts
// adds before it.
export const getModuleText = (fileName: string, text: string) => {
  const file = ts.createSourceFile(fileName, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const required: string[] = [];
  const isProcessDeclared = findBindings(file).has("process");
  const edits: { start: number; end: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && node.text === "require" && !isPropertyName(node)) {
      if (isBindingName(node)) {
        throw new TlaTypeScriptError(
          "tla-ts can't load the modules of a CommonJS module that declares require",
          node,
        );
      }
      const call = node.parent;
      const argument = ts.isCallExpression(call) ? call.arguments[0] : undefined;
      if (
        !ts.isCallExpression(call) ||
        call.expression !== node ||
        call.arguments.length !== 1 ||
        argument === undefined ||
        !ts.isStringLiteralLike(argument)
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't use require other than to call it with a string",
          node,
        );
      }
      if (isDeadCode(call, isProcessDeclared)) {
        edits.push({
          start: call.getStart(file),
          end: call.end,
          text: `undefined${blank(call.getText(file).slice(9))}`,
        });
        return;
      }
      const path = resolveRequire(argument.text, fileName, argument);
      rejectFormat(path, argument.text, argument);
      const position = required.includes(path) ? required.indexOf(path) : required.push(path) - 1;
      const name = `$tlaRequire${position}`;
      const original = call.getText(file);
      edits.push({
        start: call.getStart(file),
        end: call.end,
        text:
          original.length > name.length + 2
            ? `${name}(${blank(original.slice(name.length + 1, -1))})`
            : `${name}()`,
      });
    }
    if (
      ts.isIdentifier(node) &&
      node.text === "arguments" &&
      !isPropertyName(node) &&
      ts.findAncestor(
        node,
        (ancestor) => ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor),
      ) === undefined
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't read the arguments of the function that Node runs a module in",
        node,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  const body = edits
    .toSorted((left, right) => right.start - left.start)
    .reduce(
      (current, edit) => current.slice(0, edit.start) + edit.text + current.slice(edit.end),
      text.startsWith("#!") ? `//${text.slice(2)}` : text,
    );
  const imports = required
    .map(
      (path, position) =>
        `import { $tlaLoad as $tlaRequire${position} } from ${JSON.stringify(path)};`,
    )
    .join("");
  const directory = getDirectory(fileName);
  return `${imports}var $tlaModule: any; export function $tlaLoad(): any { if ($tlaModule !== undefined) return $tlaModule.exports; $tlaModule = { exports: {} }; (function (exports, require, module, __filename, __dirname) {${body}
}).call($tlaModule.exports, $tlaModule.exports, undefined, $tlaModule, ${JSON.stringify(fileName)}, ${JSON.stringify(directory)}); return $tlaModule.exports; }
`;
};

// HACK: TypeScript types JavaScript by what it infers, where Node's values may be of any kind, so
// each variable, parameter, and return of a CommonJS module's code takes type any, as a type that
// it doesn't write and that keeps its text where it was.
export const typeAsAny = (file: ts.SourceFile) => {
  const setAny = (node: ts.Node, position: number) => {
    const type = ts.setTextRange(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), {
      pos: position,
      end: position,
    });
    Object.assign(type, { parent: node });
    Object.assign(node, { type });
  };
  const visit = (node: ts.Node) => {
    if (
      (ts.isVariableDeclaration(node) &&
        node.type === undefined &&
        !(
          ts.isVariableDeclarationList(node.parent) &&
          (ts.isForInStatement(node.parent.parent) || ts.isForOfStatement(node.parent.parent))
        )) ||
      ((ts.isParameter(node) || ts.isPropertyDeclaration(node)) && node.type === undefined)
    ) {
      setAny(node, node.name.end);
    }
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isGetAccessorDeclaration(node)) &&
      node.type === undefined &&
      (ts.isArrowFunction(node) || node.asteriskToken === undefined) &&
      (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0
    ) {
      setAny(node, node.parameters.end);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return file;
};
