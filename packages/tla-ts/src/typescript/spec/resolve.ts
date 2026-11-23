import ts from "@typescript/typescript6";
import { stripTypes } from "./strip-types";
import { getProjectCompilerOptions } from "../program";

// Node's paths, which only a program of files reads, so that a host without them, such as a
// browser, compiles a script without loading them.
const dirname = (path: string) => process.getBuiltinModule("node:path").dirname(path);
const join = (...paths: string[]) => process.getBuiltinModule("node:path").join(...paths);

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

// The files of a host without a file system, such as a browser: none.
const NO_FILES: ts.ModuleResolutionHost = { fileExists: () => false, readFile: () => undefined };

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
// built-in module. An error of the resolution but Node's own for a missing file propagates.
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
      return process.getBuiltinModule("node:path").isAbsolute(found) ? found : undefined;
    }
    const found = resolveImport(module, specifier, containingFile);
    return found?.startsWith("file:") === true ? url.fileURLToPath(found) : undefined;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      RESOLUTION_ERRORS.has(String(error.code))
    ) {
      return undefined;
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

// The file that each specifier of a program loads as Node loads it, for the code that runs, and the
// file that TypeScript resolves it to, which its program reads the types of: TypeScript's under the
// project of the entry, or Node's own without one (moduleResolution nodenext), of the code rather
// than the declaration files that type it, which maps an import of a .js file to the TypeScript
// beside it, as Node doesn't. A require resolves in CommonJS's mode, and an import in an ES
// module's. Where Node isn't at hand, as in a browser, a specifier loads TypeScript's file where
// Node would load it too, and else none.
export const createModuleResolver = (entry: string) => {
  const options: ts.CompilerOptions = {
    ...(getProjectCompilerOptions(entry) ?? NODE_OPTIONS),
    allowJs: true,
    resolveJsonModule: true,
    allowImportingTsExtensions: true,
    noDtsResolution: true,
  };
  const host = ts.sys ?? NO_FILES;
  const cache = ts.createModuleResolutionCache(
    ts.sys?.getCurrentDirectory() ?? "/",
    (name) => name,
    options,
  );
  const module = getNodeModule();
  return (specifier: string, containingFile: string, isRequire: boolean) => {
    const typeScriptFile = ts.resolveModuleName(
      specifier,
      containingFile,
      options,
      host,
      cache,
      undefined,
      isRequire ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
    ).resolvedModule?.resolvedFileName;
    const file =
      module !== undefined
        ? resolveWithNode(module, specifier, containingFile, isRequire)
        : typeScriptFile !== undefined &&
            isNodeFile(specifier, containingFile, typeScriptFile, isRequire)
          ? typeScriptFile
          : undefined;
    return { file, typeScriptFile };
  };
};

// The type of the package.json nearest a file, which Node reads its format by, or undefined where
// that package.json names none, or none holds the file.
const getPackageType = (path: string): string | undefined => {
  const directory = dirname(path);
  const manifest = join(directory, "package.json");
  if (ts.sys.fileExists(manifest)) {
    const type: unknown = JSON.parse(ts.sys.readFile(manifest) ?? "{}").type;
    return typeof type === "string" ? type : undefined;
  }
  return dirname(directory) === directory ? undefined : getPackageType(directory);
};

// Whether a file's code has an ES module's syntax, as Node 26 detects it in a file whose package
// names no type: an import or an export, import.meta, or an await at its top level, in the code
// that runs once a TypeScript file's types are stripped.
const hasModuleSyntax = (path: string, text: string) => {
  const isTypeScript = /\.[cm]?tsx?$/.test(path);
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
// relative one resolves first. Without a file system, as in a browser, no package names a type,
// so only the file's extension and syntax tell.
export const getModuleFormat = (path: string, text: string): "module" | "commonjs" => {
  if (ts.sys === undefined) {
    return /\.m[jt]s$/.test(path) || (!/\.c[jt]s$/.test(path) && hasModuleSyntax(path, text))
      ? "module"
      : "commonjs";
  }
  const absolute = ts.sys.resolvePath(path);
  return ts.getImpliedNodeFormatForFile(absolute, undefined, ts.sys, NODE_OPTIONS) ===
    ts.ModuleKind.ESNext
    ? "module"
    : /\.c[jt]s$/.test(absolute) || getPackageType(absolute) !== undefined
      ? "commonjs"
      : hasModuleSyntax(absolute, text)
        ? "module"
        : "commonjs";
};
