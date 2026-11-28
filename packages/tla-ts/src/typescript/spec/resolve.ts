import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import { isNodeModule } from "../common-js";
import { getProjectCompilerOptions } from "../program";
import { getHostSystem, type ProgramSystem } from "../system";
import { stripTypes } from "./strip-types";

// The options that a program's modules resolve by where no project holds its entry: Node's.
const NODE_OPTIONS: ts.CompilerOptions = {
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

// A module that tla-ts gives Node's ESM loader for the time of a resolution, at a path that no
// file has, whose import.meta.resolve of RESOLVE_REQUEST runs the loader's resolution of an import.
const RESOLVER_URL = "file:///tla-ts-resolve.mjs";
const RESOLVE_REQUEST = "tla-ts:resolve";

// The codes of the errors that Node's resolution throws where it finds no file for a specifier.
const RESOLUTION_ERRORS = new Set([
  "MODULE_NOT_FOUND",
  "ERR_MODULE_NOT_FOUND",
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
  "ERR_PACKAGE_IMPORT_NOT_DEFINED",
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "ERR_INVALID_MODULE_SPECIFIER",
  "ERR_INVALID_PACKAGE_CONFIG",
  "ERR_INVALID_PACKAGE_TARGET",
  "ERR_UNSUPPORTED_RESOLVE_REQUEST",
]);

// Node's module, where Node runs this process, whose resolution the code that runs takes.
const getNodeModule = () =>
  globalThis.process?.versions?.bun === undefined
    ? globalThis.process?.getBuiltinModule?.("node:module")
    : undefined;

// The URL that Node's ESM loader resolves an import of the file containingFile to: hooks, for the
// time of the resolution, give the loader the resolver module, whose import.meta.resolve takes
// the loader's own resolution from the file, with an import's conditions, and keep the error that
// it throws where it finds no file, which import.meta.resolve would leave out.
const resolveImport = (
  module: NonNullable<ReturnType<typeof getNodeModule>>,
  specifier: string,
  containingFile: string,
) => {
  const url = process.getBuiltinModule("node:url");
  const resolved: { url?: string; error?: unknown } = {};
  const hooks = module.registerHooks({
    resolve: (request, context, next) => {
      if (request === RESOLVER_URL)
        return { url: RESOLVER_URL, format: "module", shortCircuit: true };
      if (request !== RESOLVE_REQUEST) return next(request, context);
      try {
        resolved.url = next(specifier, {
          ...context,
          parentURL: url.pathToFileURL(containingFile).href,
        }).url;
      } catch (error) {
        resolved.error = error;
      }
      return { url: "data:,", shortCircuit: true };
    },
    load: (location, context, next) =>
      location === RESOLVER_URL
        ? {
            format: "module",
            source: `export const resolve = () => import.meta.resolve(${JSON.stringify(RESOLVE_REQUEST)});`,
            shortCircuit: true,
          }
        : next(location, context),
  });
  const require = module.createRequire(containingFile);
  try {
    require(RESOLVER_URL).resolve();
  } finally {
    hooks.deregister();
    delete require.cache[url.fileURLToPath(RESOLVER_URL)];
  }
  if (resolved.error !== undefined) throw resolved.error;
  return resolved.url;
};

// The file that Node loads for a specifier of the file containingFile, by require's resolution
// (Module._resolveFilename) or the ESM loader's, or undefined where Node finds no file, as for a
// built-in module, and whether Node's resolution rejects the specifier as one it finds no file
// for. An error of the resolution but Node's own for a missing file propagates.
const resolveWithNode = (
  module: NonNullable<ReturnType<typeof getNodeModule>>,
  specifier: string,
  containingFile: string,
  isRequire: boolean,
) => {
  const url = process.getBuiltinModule("node:url");
  try {
    if (isRequire) {
      const found = module.createRequire(containingFile).resolve(specifier);
      return {
        file: process.getBuiltinModule("node:path").isAbsolute(found) ? found : undefined,
        isMissing: false,
      };
    }
    const found = resolveImport(module, specifier, containingFile);
    return {
      file: found?.startsWith("file:") === true ? url.fileURLToPath(found) : undefined,
      isMissing: false,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      RESOLUTION_ERRORS.has(String(error.code))
    ) {
      return { file: undefined, isMissing: true };
    }
    throw error;
  }
};

// Whether Node, where it isn't at hand, would load the file that TypeScript resolves a specifier
// to: a relative specifier that names the file itself, which TypeScript and Node both load, but
// for a require of TypeScript, as one of an extensionless name, a .js name of a TypeScript file,
// a directory's index, or a package may load another file in Node.
const isNodeFile = (specifier: string, containingFile: string, file: string, isRequire: boolean) =>
  /^\.\.?\//.test(specifier) &&
  !(isRequire && /\.[cm]?tsx?$/.test(file)) &&
  decodeURIComponent(new URL(specifier, `file://${containingFile}`).pathname) === file;

// The conditions that Node 26 matches in a package's exports, by default, for an import and for a
// require (getDefaultConditions and getCjsConditions), besides default.
const IMPORT_CONDITIONS = new Set(["node", "import", "module-sync", "node-addons"]);
const REQUIRE_CONDITIONS = new Set(["require", "node", "node-addons", "module-sync"]);

// A specifier that names a package, and a subpath of it, which Node finds in a node_modules
// directory: a scoped or a plain name that starts with neither a dot nor @, and has no percent
// sign, backslash or colon, as a URL, a builtin's scheme, or Node's checks of a name read them.
const PACKAGE_SPECIFIER = /^((?:@[^./\\%:][^/\\%:]*\/)?[^./\\%:@#][^/\\%:]*)(\/[^\\%:]*)?$/;

// The fields of a package.json that Node 26's reader (node_modules.cc's ParsePackageJSON) keeps:
// its name, and its exports and imports where they are an object, an array or a string.
interface PackageConfig {
  name: string | undefined;
  exports: unknown;
  imports: unknown;
}

// The stop at a package.json that tla-ts can't read as Node does.
const getPackageStop = (literal: ts.StringLiteralLike, directory: string, reason: string) =>
  new TlaTypeScriptError(
    `tla-ts can't resolve ${literal.text} without Node, as ${directory}/package.json ${reason}`,
    literal,
  );

// The package.json in a directory, or undefined where there is none. Node stops at one that isn't
// JSON, or whose name or type isn't a string, and tla-ts stops there too, at one that isn't an
// object, and at exports or imports of a string that starts with [ or {, which Node parses as JSON.
const readPackage = (
  system: ProgramSystem,
  directory: string,
  literal: ts.StringLiteralLike,
): PackageConfig | undefined => {
  const text = system.readFile(`${directory}/package.json`);
  if (text === undefined) return undefined;
  const parsed = parseJson(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw getPackageStop(literal, directory, "isn't a JSON object");
  }
  const fields = new Map(Object.entries(parsed));
  if (["name", "type"].some((key) => fields.has(key) && typeof fields.get(key) !== "string")) {
    throw getPackageStop(literal, directory, "has a name or a type that isn't a string");
  }
  const getMap = (key: string) => {
    const value = fields.get(key);
    if (typeof value === "string" && /^[[{]/.test(value)) {
      throw getPackageStop(literal, directory, `has ${key} of a string that Node parses as JSON`);
    }
    return typeof value === "string" || (typeof value === "object" && value !== null)
      ? value
      : undefined;
  };
  const name = fields.get("name");
  return {
    name: typeof name === "string" ? name : undefined,
    exports: getMap("exports"),
    imports: getMap("imports"),
  };
};

// A JSON text's value, or undefined where JSON.parse rejects it.
const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

// An error that Node's resolution of a package's exports or imports throws: an invalid target
// (ERR_INVALID_PACKAGE_TARGET), which an array of targets passes over to its next, or another.
interface Failure {
  isInvalidTarget: boolean;
}
const INVALID_TARGET: Failure = { isInvalidTarget: true };
const FAILURE: Failure = { isInvalidTarget: false };

// A segment of a target or a subpath that Node's resolution rejects (deprecatedInvalidSegmentRegEx):
// . or .. or node_modules, as it is or percent-encoded, between slashes or backslashes. Node only
// warns of an empty one.
const INVALID_SEGMENT =
  /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;

// The URL that a target of a package's exports or imports resolves to, as Node's
// resolvePackageTarget and resolvePackageTargetString find it from the package.json's URL, with
// each * of a pattern's target replaced by the subpath that the key's * matched, null where each of
// the targets is null, undefined where no condition holds, or the error that Node throws. A target
// of a package's imports that names another package resolves as Node resolves that package, at
// which tla-ts stops.
const resolveTarget = (
  packageUrl: URL,
  target: unknown,
  subpath: string,
  conditions: ReadonlySet<string>,
  isImports: boolean,
  getStop: (reason: string) => TlaTypeScriptError,
): URL | Failure | null | undefined => {
  if (typeof target === "string") {
    if (!target.startsWith("./")) {
      if (
        isImports &&
        !target.startsWith("/") &&
        !target.startsWith("../") &&
        !URL.canParse(target)
      ) {
        throw getStop(`imports ${JSON.stringify(target)}, another package`);
      }
      return INVALID_TARGET;
    }
    if (INVALID_SEGMENT.test(target.slice(2))) return INVALID_TARGET;
    const resolved = new URL(target, packageUrl);
    if (!resolved.pathname.startsWith(new URL(".", packageUrl).pathname)) return INVALID_TARGET;
    if (subpath === "") return resolved;
    if (INVALID_SEGMENT.test(subpath)) return FAILURE;
    const replaced = URL.parse(resolved.href.replaceAll("*", () => subpath));
    if (replaced === null) throw getStop(`maps the subpath ${subpath} to no URL`);
    return replaced;
  }
  if (Array.isArray(target)) {
    // The first target that resolves, else the last invalid target's error, or null after a null.
    const resolveFirst = (
      index: number,
      last: Failure | null | undefined,
    ): URL | Failure | null | undefined => {
      if (index === target.length) return last;
      const found = resolveTarget(
        packageUrl,
        target[index],
        subpath,
        conditions,
        isImports,
        getStop,
      );
      return found === undefined
        ? resolveFirst(index + 1, last)
        : found === null || found === INVALID_TARGET
          ? resolveFirst(index + 1, found)
          : found;
    };
    return target.length === 0 ? null : resolveFirst(0, undefined);
  }
  if (typeof target === "object" && target !== null) {
    const keys = Object.getOwnPropertyNames(target);
    // A key that is an array index (isArrayIndex) fails as a numeric condition.
    if (
      keys.some((key) => `${Number(key)}` === key && Number(key) >= 0 && Number(key) < 2 ** 32 - 1)
    ) {
      return FAILURE;
    }
    for (const key of keys) {
      if (key !== "default" && !conditions.has(key)) continue;
      const found = resolveTarget(
        packageUrl,
        Reflect.get(target, key),
        subpath,
        conditions,
        isImports,
        getStop,
      );
      if (found !== undefined) return found;
    }
    return undefined;
  }
  return target === null ? null : INVALID_TARGET;
};

// Node's patternKeyCompare: 1 where the pattern key b matches more specifically than a, by the
// length of the part before its *, or else its whole length, and -1 where a does.
const comparePatternKeys = (a: string, b: string) => {
  const aIndex = a.indexOf("*");
  const bIndex = b.indexOf("*");
  const aBase = aIndex === -1 ? a.length : aIndex + 1;
  const bBase = bIndex === -1 ? b.length : bIndex + 1;
  return aBase !== bBase
    ? Math.sign(bBase - aBase)
    : aIndex === -1
      ? 1
      : bIndex === -1
        ? -1
        : Math.sign(b.length - a.length);
};

// The target of a package's exports or imports for a request, as Node's packageExportsResolve and
// packageImportsResolve find it: the request's own key, where it has no * and, of exports, doesn't
// end in /, or else the pattern key that matches it best, with one *, and what that * matches.
const resolveMap = (
  packageUrl: URL,
  map: object,
  request: string,
  conditions: ReadonlySet<string>,
  isImports: boolean,
  getStop: (reason: string) => TlaTypeScriptError,
) => {
  if (Object.hasOwn(map, request) && !request.includes("*") && !request.endsWith("/")) {
    return resolveTarget(packageUrl, Reflect.get(map, request), "", conditions, isImports, getStop);
  }
  const best = Object.getOwnPropertyNames(map).reduce<{ key: string; subpath: string } | undefined>(
    (found, key) => {
      const index = key.indexOf("*");
      const trailer = key.slice(index + 1);
      return index !== -1 &&
        request.startsWith(key.slice(0, index)) &&
        request.length >= key.length &&
        request.endsWith(trailer) &&
        comparePatternKeys(found?.key ?? "", key) === 1 &&
        key.lastIndexOf("*") === index
        ? { key, subpath: request.slice(index, request.length - trailer.length) }
        : found;
    },
    undefined,
  );
  return best === undefined
    ? undefined
    : resolveTarget(
        packageUrl,
        Reflect.get(map, best.key),
        best.subpath,
        conditions,
        isImports,
        getStop,
      );
};

// The file of a package's exports or imports for a request, as Node resolves it and its
// finalizeResolution, or require's finalizeEsmResolution, checks it, or undefined where Node finds
// none: where the request is no subpath that the exports export (packageExportsResolve) or import
// that the imports define (packageImportsResolve), the exports mix subpaths with conditions, a
// target is invalid, the URL has an encoded / or \, or no file is at its path. tla-ts stops at a
// package whose directory a file URL encodes, and at a URL with a query or a fragment, which Node
// loads as another module than its file's, a percent-encoded character, or a path that ends in /.
const resolvePackageMap = (
  system: ProgramSystem,
  directory: string,
  request: string,
  config: PackageConfig,
  conditions: ReadonlySet<string>,
  isImports: boolean,
  literal: ts.StringLiteralLike,
) => {
  const getStop = (reason: string) => getPackageStop(literal, directory, reason);
  const packageUrl = new URL(`file://${directory}/package.json`);
  if (packageUrl.pathname !== `${directory}/package.json`)
    throw getStop("is at a path that a URL encodes");
  // Whether the exports are the targets of the package's own subpath, rather than subpaths
  // (isConditionalExportsMainSugar): a target, or conditions, whose keys, unlike a subpath's, are
  // empty or don't start with a dot. Node fails at exports where only some keys are.
  const exports = config.exports;
  const keys =
    typeof exports === "object" && exports !== null && !Array.isArray(exports)
      ? Object.getOwnPropertyNames(exports)
      : undefined;
  const isCondition = (key: string) => key === "" || !key.startsWith(".");
  const isSugar = keys === undefined || (keys.length > 0 && isCondition(keys[0]));
  const map = isImports ? config.imports : isSugar ? { ".": exports } : exports;
  const isFailed = isImports
    ? request === "#" || request.endsWith("/")
    : keys?.some((key) => isCondition(key) !== isSugar) === true;
  const found =
    isFailed || typeof map !== "object" || map === null || Array.isArray(map)
      ? undefined
      : resolveMap(packageUrl, map, request, conditions, isImports, getStop);
  if (!(found instanceof URL)) return undefined;
  if (found.search !== "" || found.hash !== "")
    throw getStop(`maps ${request} to a URL with a query or a fragment`);
  const path = found.pathname;
  if (/%2F|%5C/i.test(path)) return undefined;
  if (path.includes("%") || path.endsWith("/"))
    throw getStop(`maps ${request} to the path ${path}`);
  return system.fileExists(path) ? system.realpath(path) : undefined;
};

// The file that Node 26 loads for a package's specifier, or one of the imports of the program's own
// package, where the program's files are a host's that Node doesn't see, as its ES modules'
// resolution (packageResolve and packageImportsResolve) and require's (Module._resolveFilename,
// trySelf and Module._findPath) find it: by the imports or the exports of the file's own package,
// where the specifier starts with # or names it, and else by the exports of the package of the
// nearest node_modules directory that holds one, which a require looks in but in a directory named
// node_modules. Node reads a package without exports by its main field and its subpaths' files,
// and a require of a # that its package doesn't import as a package's, at which tla-ts stops. A
// require that finds no file may find one in Node's global folders, which only the code that runs
// it reads.
const resolvePackage = (
  system: ProgramSystem,
  literal: ts.StringLiteralLike,
  containingFile: string,
  isRequire: boolean,
) => {
  const specifier = literal.text;
  if (isNodeModule(specifier)) return { file: undefined, isMissing: false };
  const conditions = isRequire ? REQUIRE_CONDITIONS : IMPORT_CONDITIONS;
  // The directories that hold the file, from its own to the root, which is "".
  const segments = system.resolvePath(containingFile).split("/").slice(0, -1);
  const directories = segments.map((_segment, index) =>
    segments.slice(0, segments.length - index).join("/"),
  );
  // The file's own package: the nearest package.json, which Node looks for up to a directory named
  // node_modules, and, for a require (TraverseParent), short of the root.
  const boundary = directories.findIndex((directory) => directory.endsWith("/node_modules"));
  const scope = directories
    .slice(0, boundary === -1 ? undefined : boundary)
    .find(
      (directory) =>
        (!isRequire || directory !== "") && system.fileExists(`${directory}/package.json`),
    );
  const own = scope === undefined ? undefined : readPackage(system, scope, literal);
  if (specifier.startsWith("#") && (!isRequire || own?.imports !== undefined)) {
    const file =
      scope === undefined || own === undefined
        ? undefined
        : resolvePackageMap(system, scope, specifier, own, conditions, true, literal);
    return { file, isMissing: file === undefined };
  }
  const parts = PACKAGE_SPECIFIER.exec(specifier);
  if (parts === null) {
    throw new TlaTypeScriptError(`tla-ts can't resolve ${specifier} without Node`, literal);
  }
  const name = parts[1];
  const subpath = `.${parts[2] ?? ""}`;
  const resolveIn = (directory: string, config: PackageConfig | undefined) => {
    if (config?.exports === undefined) {
      throw new TlaTypeScriptError(
        `tla-ts can't resolve ${specifier} without Node, as ${directory} has no exports`,
        literal,
      );
    }
    const file = resolvePackageMap(system, directory, subpath, config, conditions, false, literal);
    return { file, isMissing: file === undefined };
  };
  if (
    scope !== undefined &&
    own?.name !== undefined &&
    (specifier === own.name || specifier.startsWith(`${own.name}/`)) &&
    own.exports !== undefined
  ) {
    if (own.name !== name) {
      throw new TlaTypeScriptError(
        `tla-ts can't resolve ${specifier} without Node, as its own package's name is ${own.name}`,
        literal,
      );
    }
    return resolveIn(scope, own);
  }
  for (const directory of directories) {
    if (isRequire && directory.endsWith("/node_modules")) continue;
    const modules = `${directory}/node_modules`;
    const found = `${modules}/${name}`;
    // An import takes the first package's directory, and a require the first package with exports,
    // or any file at the specifier's path, which it loads by its extensions.
    if (
      system.directoryExists(found) ||
      (isRequire &&
        ["", ".js", ".json", ".node", ".ts", ".cts", ".mts"].some((extension) =>
          system.fileExists(`${modules}/${specifier}${extension}`),
        ))
    ) {
      return resolveIn(
        found,
        system.directoryExists(found) ? readPackage(system, found, literal) : undefined,
      );
    }
  }
  return { file: undefined, isMissing: !isRequire };
};

// The file that each specifier of a program loads as Node loads it, for the code that runs, and the
// file that TypeScript resolves it to, which its program reads the types of: TypeScript's under the
// project of the entry, or Node's own without one (moduleResolution nodenext), of the code rather
// than the declaration files that type it, which maps an import of a .js file to the TypeScript
// beside it, as Node doesn't. A require resolves in CommonJS's mode, and an import in an ES
// module's. Where Node isn't at hand, as in a browser or under Bun, a relative specifier loads
// TypeScript's file where Node would load it too, and else none, and is missing only where Node's
// resolution rejects it, and a package's loads the file its exports name in the files of a host
// that Node doesn't see.
export const createModuleResolver = (entry: string, system: ProgramSystem) => {
  const options: ts.CompilerOptions = {
    ...(getProjectCompilerOptions(entry, system) ?? NODE_OPTIONS),
    allowJs: true,
    resolveJsonModule: true,
    allowImportingTsExtensions: true,
    noDtsResolution: true,
  };
  const cache = ts.createModuleResolutionCache(
    system.getCurrentDirectory(),
    (name) => name,
    options,
  );
  const module = system.isHost ? getNodeModule() : undefined;
  return (literal: ts.StringLiteralLike, isRequire: boolean) => {
    const specifier = literal.text;
    const containingFile = literal.getSourceFile().fileName;
    const typeScriptFile = ts.resolveModuleName(
      specifier,
      containingFile,
      options,
      system,
      cache,
      undefined,
      isRequire ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
    ).resolvedModule?.resolvedFileName;
    const node =
      module !== undefined
        ? resolveWithNode(module, specifier, containingFile, isRequire)
        : !system.isHost && !/^(?:\.\.?(?:\/|$)|\/)/.test(specifier)
          ? resolvePackage(system, literal, containingFile, isRequire)
          : undefined;
    const file =
      node !== undefined
        ? node.file
        : typeScriptFile !== undefined &&
            isNodeFile(specifier, containingFile, typeScriptFile, isRequire)
          ? typeScriptFile
          : undefined;
    return { file, typeScriptFile, isMissing: node?.isMissing === true };
  };
};

// The type of the package.json nearest a file, which Node reads its format by, or undefined where
// that package.json names none, or none holds the file.
const getPackageType = (path: string, system: ProgramSystem): string | undefined => {
  const directory = path.slice(0, Math.max(path.lastIndexOf("/"), 1));
  const manifest = `${directory === "/" ? "" : directory}/package.json`;
  if (system.fileExists(manifest)) {
    const type: unknown = JSON.parse(system.readFile(manifest) ?? "{}").type;
    return typeof type === "string" ? type : undefined;
  }
  return directory === "/" ? undefined : getPackageType(directory, system);
};

// Whether a file's code has an ES module's syntax, as Node 26 detects it in a file whose package
// names no type: an import or an export, import.meta, or an await at its top level, in the code
// that runs once a TypeScript file's types are stripped.
const hasModuleSyntax = (path: string, text: string) => {
  const isTypeScript = /\.[cm]?ts$/.test(path);
  const code = isTypeScript
    ? stripTypes(ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS))
    : text;
  const file = ts.createSourceFile(path, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const isTopLevelAwait = (node: ts.Node): boolean =>
    !ts.isFunctionLike(node) &&
    !ts.isClassLike(node) &&
    (ts.isAwaitExpression(node) ||
      (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
      (ts.forEachChild(node, isTopLevelAwait) ?? false));
  return ts.isExternalModule(file) || isTopLevelAwait(file);
};

// The format that Node loads a file in, as TypeScript tells it by the file's extension and its
// package's type (getImpliedNodeFormatForFile under nodenext), and, where no type says, as Node
// detects it by the file's syntax. TypeScript finds the package of an absolute path only, so a
// relative one resolves first.
export const getModuleFormat = (
  path: string,
  text: string,
  system = getHostSystem(),
): "module" | "commonjs" => {
  const absolute = system.resolvePath(path);
  return ts.getImpliedNodeFormatForFile(absolute, undefined, system, NODE_OPTIONS) ===
    ts.ModuleKind.ESNext
    ? "module"
    : /\.c[jt]s$/.test(absolute) || getPackageType(absolute, system) !== undefined
      ? "commonjs"
      : hasModuleSyntax(absolute, text)
        ? "module"
        : "commonjs";
};
