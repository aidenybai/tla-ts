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

// The fields of the package.json in a directory, or undefined where there is none. Node stops at
// one that isn't JSON, and tla-ts at one that isn't an object.
const readPackage = (system: ProgramSystem, directory: string, literal: ts.StringLiteralLike) => {
  const text = system.readFile(`${directory}/package.json`);
  if (text === undefined) return undefined;
  const parsed = parseJson(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TlaTypeScriptError(
      `tla-ts can't resolve ${literal.text} without Node, as ${directory}/package.json isn't a JSON object`,
      literal,
    );
  }
  return new Map(Object.entries(parsed));
};

// A JSON text's value, or undefined where JSON.parse rejects it.
const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

// The file that a package's exports name for a subpath, as Node's packageExportsResolve finds it
// with resolvePackageTarget and finalizeResolution, or undefined where Node finds none. It reads
// exports of strings, nulls and conditions, by the subpath's own key, which Node reads before any
// pattern, and stops at a subpath that only a pattern could match, at arrays of fallbacks, and at
// targets whose path Node reads by its URL, which may leave the package's directory.
const resolveExports = (
  system: ProgramSystem,
  directory: string,
  subpath: string,
  exports: unknown,
  conditions: ReadonlySet<string>,
  literal: ts.StringLiteralLike,
) => {
  const getStop = (reason: string) =>
    new TlaTypeScriptError(
      `tla-ts can't resolve ${literal.text} without Node, as ${directory}/package.json ${reason}`,
      literal,
    );
  const resolveTarget = (target: unknown): string | null | undefined => {
    if (typeof target === "string") {
      const segments = target.split("/");
      if (
        segments[0] !== "." ||
        /[%\\#?]/.test(target) ||
        segments
          .slice(1)
          .some(
            (segment) =>
              ["", ".", ".."].includes(segment) || segment.toLowerCase() === "node_modules",
          )
      ) {
        throw getStop(`exports ${JSON.stringify(target)}`);
      }
      return `${directory}${target.slice(1)}`;
    }
    if (target === null) return null;
    if (typeof target !== "object" || Array.isArray(target)) {
      throw getStop("exports a target that is neither a string, null nor conditions");
    }
    const keys = Object.keys(target);
    if (keys.some((key) => /^(?:0|[1-9]\d*)$/.test(key))) {
      throw getStop("exports a numeric condition");
    }
    for (const key of keys) {
      if (key !== "default" && !conditions.has(key)) continue;
      const found = resolveTarget(Reflect.get(target, key));
      if (found !== undefined) return found;
    }
    return undefined;
  };
  if (typeof exports !== "string" && (typeof exports !== "object" || Array.isArray(exports))) {
    throw getStop("exports neither a string nor an object");
  }
  const keys = typeof exports === "string" ? [] : Object.keys(exports ?? {});
  const isSugar = keys.every((key) => key === "" || !key.startsWith("."));
  if (!isSugar && !keys.every((key) => key.startsWith("."))) {
    throw getStop("exports subpaths beside conditions");
  }
  const map = new Map(isSugar ? [[".", exports]] : Object.entries(exports ?? {}));
  const isExact = map.has(subpath) && !subpath.includes("*") && !subpath.endsWith("/");
  if (
    !isExact &&
    (subpath.includes("*") ||
      subpath.endsWith("/") ||
      [...map.keys()].some((key) => key.includes("*")))
  ) {
    throw getStop("exports patterns, which Node matches the subpath against");
  }
  const file = isExact ? resolveTarget(map.get(subpath)) : undefined;
  return file !== null && file !== undefined && system.fileExists(file)
    ? system.realpath(file)
    : undefined;
};

// The file that Node 26 loads for a package's specifier where the program's files are a host's that
// Node doesn't see, as its ES modules' resolution (packageResolve) and require's (trySelf and
// Module._findPath) find it: by the exports of the file's own package, where the specifier names
// it, and else of the package of the nearest node_modules directory that holds one, which a
// require looks in but in a directory named node_modules. Node reads a package without exports by
// its main field and its subpaths' files, at which tla-ts stops. A require that finds no file may
// find one in Node's global folders, which only the code that runs it reads.
const resolvePackage = (
  system: ProgramSystem,
  literal: ts.StringLiteralLike,
  containingFile: string,
  isRequire: boolean,
) => {
  const specifier = literal.text;
  if (isNodeModule(specifier)) return { file: undefined, isMissing: false };
  const parts = PACKAGE_SPECIFIER.exec(specifier);
  if (parts === null) {
    throw new TlaTypeScriptError(`tla-ts can't resolve ${specifier} without Node`, literal);
  }
  const name = parts[1];
  const subpath = `.${parts[2] ?? ""}`;
  const conditions = isRequire ? REQUIRE_CONDITIONS : IMPORT_CONDITIONS;
  // The directories that hold the file, from its own to the root, which is "".
  const segments = system.resolvePath(containingFile).split("/").slice(0, -1);
  const directories = segments.map((_segment, index) =>
    segments.slice(0, segments.length - index).join("/"),
  );
  const resolveIn = (directory: string, manifest: ReadonlyMap<string, unknown> | undefined) => {
    const exports = manifest?.get("exports");
    if (exports === undefined || exports === null) {
      throw new TlaTypeScriptError(
        `tla-ts can't resolve ${specifier} without Node, as ${directory} has no exports`,
        literal,
      );
    }
    const file = resolveExports(system, directory, subpath, exports, conditions, literal);
    return { file, isMissing: file === undefined };
  };
  // The file's own package: the nearest package.json, which Node looks for up to a directory named
  // node_modules.
  const boundary = directories.findIndex((directory) => directory.endsWith("/node_modules"));
  const scope = directories
    .slice(0, boundary === -1 ? undefined : boundary)
    .find((directory) => system.fileExists(`${directory}/package.json`));
  const own = scope === undefined ? undefined : readPackage(system, scope, literal);
  const ownName = own?.get("name");
  if (
    scope !== undefined &&
    typeof ownName === "string" &&
    (specifier === ownName || specifier.startsWith(`${ownName}/`)) &&
    own?.get("exports") !== undefined
  ) {
    if (ownName !== name) {
      throw new TlaTypeScriptError(
        `tla-ts can't resolve ${specifier} without Node, as its own package's name is ${ownName}`,
        literal,
      );
    }
    return resolveIn(scope, own);
  }
  for (const directory of directories) {
    if (isRequire && directory.endsWith("/node_modules")) continue;
    const modules = `${directory}/node_modules`;
    const found = `${modules}/${name}`;
    const manifest = system.directoryExists(found)
      ? readPackage(system, found, literal)
      : undefined;
    // An import takes the first package's directory, and a require the first package with exports,
    // or any file at the specifier's path, which it loads by its extensions.
    if (
      system.directoryExists(found) ||
      (isRequire &&
        ["", ".js", ".json", ".node", ".ts", ".cts", ".mts"].some((extension) =>
          system.fileExists(`${modules}/${specifier}${extension}`),
        ))
    ) {
      return resolveIn(found, manifest);
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
    const typeScriptFile = ts.resolveModuleName(
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

// The type of the package.json nearest a file, which Node reads its format by, or undefined where
// that package.json names none, or none holds the file.
const getPackageType = (path: string, system: ProgramSystem) => {
  const manifest = getPackageManifest(path, system);
  const type: unknown =
    manifest === undefined ? undefined : JSON.parse(system.readFile(manifest) ?? "{}").type;
  return typeof type === "string" ? type : undefined;
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
