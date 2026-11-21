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

// The module of a specifier that asks Node's ESM loader to resolve from a file, whose URL follows
// it, as a module at that URL, whose import.meta.resolve takes the loader's resolution.
const RESOLVER_SCHEME = "tla-ts-resolve:";
const RESOLVER_QUERY = "?tla-ts-resolve";

// Node's module, where Node runs this process, whose resolution the code that runs takes.
const getNodeModule = () =>
  globalThis.process?.versions?.bun === undefined
    ? globalThis.process?.getBuiltinModule?.("node:module")
    : undefined;

let isResolverHooked = false;

// The file that Node loads for a specifier of the file containingFile: require's resolution
// (Module._resolveFilename), or the ESM loader's, which import.meta.resolve gives of a module at
// the file's URL, of a file that exists and isn't a directory, as the loader's finalizeResolution
// requires and import.meta.resolve leaves unchecked. Undefined where Node finds no file, as for a
// built-in module.
const resolveWithNode = (
  module: NonNullable<ReturnType<typeof getNodeModule>>,
  specifier: string,
  containingFile: string,
  isRequire: boolean,
) => {
  const url = process.getBuiltinModule("node:url");
  const fs = process.getBuiltinModule("node:fs");
  const require = module.createRequire(containingFile);
  if (isRequire) {
    try {
      const found = require.resolve(specifier);
      return found.startsWith("/") ? found : undefined;
    } catch {
      return undefined;
    }
  }
  if (!isResolverHooked) {
    module.registerHooks({
      resolve: (request, context, next) =>
        request.startsWith(RESOLVER_SCHEME)
          ? {
              url: `${request.slice(RESOLVER_SCHEME.length)}${RESOLVER_QUERY}`,
              format: "module",
              shortCircuit: true,
            }
          : next(request, context),
      load: (location, context, next) =>
        location.endsWith(RESOLVER_QUERY)
          ? {
              format: "module",
              source: "export const resolve = (specifier) => import.meta.resolve(specifier);",
              shortCircuit: true,
            }
          : next(location, context),
    });
    isResolverHooked = true;
  }
  const resolver: { resolve: (request: string) => string } = require(
    `${RESOLVER_SCHEME}${url.pathToFileURL(containingFile).href}`,
  );
  try {
    const found = resolver.resolve(specifier);
    if (!found.startsWith("file:")) return undefined;
    const path = url.fileURLToPath(found);
    return fs.statSync(path, { throwIfNoEntry: false })?.isFile() === true ? path : undefined;
  } catch {
    return undefined;
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
  const cache = ts.createModuleResolutionCache(
    ts.sys.getCurrentDirectory(),
    (name) => name,
    options,
  );
  const module = getNodeModule();
  return (specifier: string, containingFile: string, isRequire: boolean) => {
    const typeScriptFile = ts.resolveModuleName(
      specifier,
      containingFile,
      options,
      ts.sys,
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
// relative one resolves first.
export const getModuleFormat = (path: string, text: string): "module" | "commonjs" => {
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
