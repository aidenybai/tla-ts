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
    // A specifier of imports, where the imports of the file's package hold a target of imports,
    // has no file of TypeScript's, which might resolve it without end (see hasImportsTarget).
    const manifest = specifier.startsWith("#")
      ? findManifest(system.resolvePath(containingFile), system)
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

// The package.json nearest a file, which TypeScript reads as the file's package, or undefined
// where none holds the file.
const findManifest = (path: string, system: ProgramSystem): string | undefined => {
  const directory = path.slice(0, Math.max(path.lastIndexOf("/"), 1));
  const manifest = `${directory === "/" ? "" : directory}/package.json`;
  return system.fileExists(manifest)
    ? manifest
    : directory === "/"
      ? undefined
      : findManifest(directory, system);
};

// The type of the package.json nearest a file, which Node reads its format by, or undefined where
// that package.json names none, or none holds the file.
const getPackageType = (path: string, system: ProgramSystem) => {
  const manifest = findManifest(path, system);
  const type: unknown =
    manifest === undefined ? undefined : JSON.parse(system.readFile(manifest) ?? "{}").type;
  return typeof type === "string" ? type : undefined;
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
