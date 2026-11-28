import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import { containsModuleSyntax } from "../early-errors";
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

// The codes of the errors of Node's ESM resolution that the files alone decide, which tla-ts gives
// as Node does.
const DETERMINED_ERRORS = new Set([
  "ERR_MODULE_NOT_FOUND",
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
  "ERR_INVALID_MODULE_SPECIFIER",
]);

// An error that Node's resolution throws for a specifier: its class, Error or TypeError, its code,
// its message, but a require's stack of the modules that required one another, its url where it
// has one, and what Node writes to stderr where the link of its entry fails with it, but its
// stack's frames, or undefined where tla-ts can't tell that, as for a require.
export interface ResolutionFailure {
  name: string;
  code: string;
  message: string;
  url: string | undefined;
  stderr: string | undefined;
}

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

// A name as a file system that ignores case and Unicode's normalization may read it.
const getFolded = (name: string) => name.normalize("NFC").toUpperCase().toLowerCase();

// Whether a file system that ignores case could find a path that this one doesn't: the nearest
// directory on the way to it that exists holds an entry by the next segment's name in another case.
const isCaseDependent = (path: string): boolean => {
  const fs = process.getBuiltinModule("node:fs");
  const nodePath = process.getBuiltinModule("node:path");
  const parent = nodePath.dirname(path);
  if (parent === path || fs.existsSync(path)) return false;
  if (!fs.existsSync(parent)) return isCaseDependent(parent);
  const name = getFolded(nodePath.basename(path));
  return (
    fs.statSync(parent).isDirectory() &&
    fs.readdirSync(parent).some((entry) => getFolded(entry) === name)
  );
};

// Whether a require of a path that finds no module might find one on a file system that ignores
// case: the path is there, as a directory whose files Node reads by their names, or the directory
// where Node looks for the path with each of its extensions holds a name that the path's starts in
// another case, or ends in another case after the path's.
const isRequireCaseDependent = (path: string) => {
  const fs = process.getBuiltinModule("node:fs");
  const nodePath = process.getBuiltinModule("node:path");
  const parent = nodePath.dirname(path);
  const base = nodePath.basename(path);
  if (fs.existsSync(path)) return true;
  if (!fs.existsSync(parent)) return isCaseDependent(parent);
  return (
    fs.statSync(parent).isDirectory() &&
    fs
      .readdirSync(parent)
      .some(
        (entry) =>
          getFolded(entry).startsWith(getFolded(base)) &&
          !(
            entry.startsWith(base) &&
            entry.slice(base.length) === entry.slice(base.length).toLowerCase()
          ),
      )
  );
};

// Whether a require's error is the one that Node's require throws where it finds no module for a
// relative or absolute specifier, of the file that requires it, which the files alone decide: an
// Error of the code MODULE_NOT_FOUND, whose message names the specifier and the file, as the
// module of the require that createRequire makes has no parent.
const isRequireNotFound = (error: Error, specifier: string, containingFile: string) =>
  /^(?:\.\.?(?:\/|$)|\/)/.test(specifier) &&
  Object.getPrototypeOf(error) === Error.prototype &&
  Reflect.ownKeys(error).map(String).join() === "stack,message,code,requireStack" &&
  error.message === `Cannot find module '${specifier}'\nRequire stack:\n- ${containingFile}` &&
  !isRequireCaseDependent(
    process.getBuiltinModule("node:path").resolve(containingFile, "..", specifier),
  );

// Whether Node's resolution of a specifier from the file containingFile, which failed, reads a path
// that a file system that ignores case might find: the URL that it names, and, for a package's
// name, the package.json of each directory that holds the file, where its own package may be, and
// the package's directory in each node_modules that Node looks in.
const isCaseDependentFailure = (specifier: string, containingFile: string, url: unknown) => {
  const nodePath = process.getBuiltinModule("node:path");
  const name = /^(?:@[^/]*\/)?[^/]*/.exec(specifier)?.[0] ?? "";
  const segments = nodePath.dirname(containingFile).split("/").slice(1);
  const directories = [
    ...segments.map(
      (_segment, index) => `/${segments.slice(0, segments.length - index).join("/")}`,
    ),
    "/",
  ];
  const isPackage = !/^(?:\.\.?(?:\/|$)|\/|[A-Za-z][A-Za-z\d+.-]*:)/.test(specifier);
  return [
    ...(typeof url === "string" && url.startsWith("file:")
      ? [process.getBuiltinModule("node:url").fileURLToPath(url)]
      : []),
    ...(isPackage
      ? directories.flatMap((directory) => [
          nodePath.join(directory, "package.json"),
          nodePath.join(directory, "node_modules", name),
        ])
      : []),
  ].some(isCaseDependent);
};

// The code of one of Node's own modules, by its id, which Node's process.binding gives, or
// undefined.
const getNodeCode = (id: string) => {
  const binding: unknown = Reflect.get(process, "binding");
  const natives: unknown = typeof binding === "function" ? binding.call(process, "natives") : {};
  const code: unknown =
    typeof natives === "object" && natives !== null ? Reflect.get(natives, id) : undefined;
  return typeof code === "string" ? code : undefined;
};

// Where Node says that code of its own module is, as it writes an uncaught exception: the module
// and the line, then the line, with a caret under the column (GetErrorSource of
// src/node_errors.cc), or undefined where Node's code has no such line.
const getNodeLocation = (id: string, number: number, column: number) => {
  const line = getNodeCode(id)?.split("\n")[number - 1];
  return line === undefined || column > line.length + 1
    ? undefined
    : `node:${id}:${number}\n${line}\n${line.slice(0, column - 1).replace(/[^\t]/g, " ")}^`;
};

// Where Node says that an error that the load of its entry rejects with was thrown, which it
// triggers as an uncaught exception from a promise (asyncRunEntryPointWithESMLoader of
// lib/internal/modules/run_main.js): where V8 says the error was made, by the first frame of its
// stack, but for an error whose stack the loader writes again to add a hint
// (decorateErrorWithCommonJSHints), of which V8 then keeps no frames, the loader's call that
// triggers it. It's undefined where either is elsewhere than in Node's code.
const getEntrySource = (error: Error) => {
  if (/\nDid you mean to import [^\n]*\?$/.test(error.message)) {
    const id = "internal/modules/run_main";
    const code = getNodeCode(id) ?? "";
    const calls = [...code.matchAll(/^( *)triggerUncaughtException\(/gm)];
    return calls.length === 1
      ? getNodeLocation(
          id,
          code.slice(0, calls[0].index).split("\n").length,
          calls[0][1].length + 1,
        )
      : undefined;
  }
  const frame = /(?:^|\()node:(internal\/[^:()]+):(\d+):(\d+)\)?$/.exec(
    /\n {4}at ([^\n]*)/.exec(error.stack ?? "")?.[1] ?? "",
  );
  return frame === null ? undefined : getNodeLocation(frame[1], Number(frame[2]), Number(frame[3]));
};

// Whether an error of Node's ESM resolution is an instance of the class that makeNodeErrorWithCode
// (lib/internal/errors.js) makes for its code, of Error or TypeError, as the host's code for
// import() makes one: its own keys are its stack, its code, its url, if any, and its message, and
// its prototype's are the class's.
const isNodeErrorShape = (error: Error) => {
  const prototype: unknown = Object.getPrototypeOf(error);
  const base: unknown = typeof prototype === "object" ? Object.getPrototypeOf(prototype) : null;
  return (
    ["stack,code,message", "stack,code,url,message"].includes(
      Reflect.ownKeys(error).map(String).join(),
    ) &&
    typeof prototype === "object" &&
    prototype !== null &&
    Reflect.ownKeys(prototype).map(String).join() === "constructor,toString,Symbol(kIsNodeError)" &&
    ((base === Error.prototype && error.name === "Error") ||
      (base === TypeError.prototype && error.name === "TypeError"))
  );
};

// An error of Node's ESM resolution as a ResolutionFailure: what Node writes of it where nothing
// catches it is where it was made, and its inspection as a fatal exception's (afterInspector of
// lib/internal/errors.js), but the lines of its stack's frames, which tla-ts doesn't write.
const getFailure = (error: Error, code: string): ResolutionFailure => {
  const util = process.getBuiltinModule("node:util");
  const source = getEntrySource(error);
  const inspected = util.inspect(error, {
    colors: false,
    customInspect: false,
    depth: Math.max(util.inspect.defaultOptions.depth ?? 2, 5),
  });
  const url: unknown = Reflect.get(error, "url");
  return {
    name: error.name,
    code,
    message: error.message,
    url: typeof url === "string" ? url : undefined,
    stderr:
      source === undefined
        ? undefined
        : `${source}\n\n${`${inspected}\n`.replace(/(?:\n {4}at [^\n]*?)+( \{)?(?=\n)/g, "$1").slice(0, -1)}`,
  };
};

// The file that Node loads for a specifier of the file containingFile, by require's resolution
// (Module._resolveFilename) or the ESM loader's, or undefined where Node finds no file, as for a
// built-in module, and whether Node's resolution rejects the specifier as one it finds no file
// for, with the error of an import's resolution that the files alone decide. An error of the
// resolution but Node's own for a missing file propagates.
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
        failure: undefined,
      };
    }
    const found = resolveImport(module, specifier, containingFile);
    return {
      file: found?.startsWith("file:") === true ? url.fileURLToPath(found) : undefined,
      isMissing: false,
      failure: undefined,
    };
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      !RESOLUTION_ERRORS.has(String(error.code))
    ) {
      throw error;
    }
    const code = String(error.code);
    return {
      file: undefined,
      isMissing: true,
      failure: isRequire
        ? isRequireNotFound(error, specifier, containingFile)
          ? {
              name: "Error",
              code,
              message: `Cannot find module '${specifier}'`,
              url: undefined,
              stderr: undefined,
            }
          : undefined
        : DETERMINED_ERRORS.has(code) &&
            isNodeErrorShape(error) &&
            !isCaseDependentFailure(specifier, containingFile, Reflect.get(error, "url"))
          ? getFailure(error, code)
          : undefined,
    };
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
// that Node doesn't see. Where Node is at hand, an import that it finds no file for has the error
// that Node's resolution throws, where the files alone decide it.
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
    // A specifier of imports, where the imports of the file's package hold a target of imports,
    // has no file of TypeScript's, which might resolve it without end (see hasImportsTarget).
    const manifest = specifier.startsWith("#")
      ? getPackageManifest(system.resolvePath(containingFile), system)
      : undefined;
    const typeScriptFile =
      manifest !== undefined &&
      hasImportsTarget(Reflect.get(Object(parseJson(system.readFile(manifest) ?? "")), "imports"))
        ? undefined
        : ts.resolveModuleName(
            specifier,
            containingFile,
            options,
            system,
            cache,
            undefined,
            isRequire ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
          ).resolvedModule?.resolvedFileName;
    const withNode =
      module === undefined
        ? undefined
        : resolveWithNode(module, specifier, containingFile, isRequire);
    const node =
      withNode ??
      (!system.isHost && !/^(?:\.\.?(?:\/|$)|\/)/.test(specifier)
        ? resolvePackage(system, literal, containingFile, isRequire)
        : undefined);
    const file =
      node !== undefined
        ? node.file
        : typeScriptFile !== undefined &&
            isNodeFile(specifier, containingFile, typeScriptFile, isRequire)
          ? typeScriptFile
          : undefined;
    return {
      file,
      typeScriptFile,
      isMissing: node?.isMissing === true,
      failure: withNode?.failure,
    };
  };
};

// The package.json nearest a file, or undefined where none holds the file.
const getPackageManifest = (path: string, system: ProgramSystem): string | undefined => {
  const directory = path.slice(0, Math.max(path.lastIndexOf("/"), 1));
  const manifest = `${directory === "/" ? "" : directory}/package.json`;
  if (system.fileExists(manifest)) return manifest;
  return directory === "/" ? undefined : getPackageManifest(directory, system);
};

// Whether Node warns, as it loads an ES module, that it detected the module's format by its syntax
// (warnTypelessPackageJsonFile of lib/internal/modules/esm/get_format.js), with its process's id: a
// file outside node_modules that neither its extension nor its package's type makes an ES module,
// whose nearest package.json names no type.
export const isTypelessModule = (path: string, system = getHostSystem()) => {
  const absolute = system.resolvePath(path);
  return (
    !/\.m[jt]s$/.test(absolute) &&
    !absolute.includes("/node_modules/") &&
    getPackageManifest(absolute, system) !== undefined &&
    getPackageType(absolute, system) === undefined
  );
};

// The type of the package.json nearest a file, which Node reads its format by, or undefined where
// that package.json names none, or none holds the file. Node reads no type but commonjs and module.
const getPackageType = (path: string, system: ProgramSystem) => {
  const manifest = getPackageManifest(path, system);
  const type: unknown =
    manifest === undefined ? undefined : JSON.parse(system.readFile(manifest) ?? "{}").type;
  return type === "commonjs" || type === "module" ? type : undefined;
};

// Whether a package's imports hold a target that is itself a specifier of imports, which
// TypeScript resolves by the imports again, endlessly where the targets cycle, and Node resolves
// as a package's name (resolvePackageTargetString).
const hasImportsTarget = (value: unknown): boolean =>
  typeof value === "string"
    ? value.startsWith("#")
    : typeof value === "object" && value !== null && Object.values(value).some(hasImportsTarget);

// Whether a file's code has an ES module's syntax, as Node 26 detects it in a file whose package
// names no type (see containsModuleSyntax), in the code that runs once a TypeScript file's types
// are stripped.
export const hasModuleSyntax = (path: string, text: string) =>
  containsModuleSyntax(
    path,
    /\.[cm]?ts$/.test(path)
      ? stripTypes(ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS))
      : text,
  );

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

// The package.json that Node 26 warns names no type, by its process id, where its loader of ES
// modules reads a file as an ES module by its syntax (see isTypelessModule): the nearest one to a
// .js or a .ts file that has an ES module's syntax, or undefined where Node doesn't warn.
export const getTypelessManifest = (path: string, text: string, system: ProgramSystem) => {
  const absolute = system.resolvePath(path);
  return /\.[jt]s$/.test(absolute) &&
    isTypelessModule(absolute, system) &&
    hasModuleSyntax(absolute, text)
    ? getPackageManifest(absolute, system)
    : undefined;
};
