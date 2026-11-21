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

// The file that each specifier of a program loads, as TypeScript resolves it under the project of
// the entry, or as Node does without one (moduleResolution nodenext): a require in CommonJS's
// mode, and an import in an ES module's. It resolves to the code that runs, rather than the
// declaration files that type it, and maps an import of a .js file to the TypeScript beside it,
// which Node doesn't.
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
  return (specifier: string, containingFile: string, isRequire: boolean) =>
    ts.resolveModuleName(
      specifier,
      containingFile,
      options,
      ts.sys,
      cache,
      undefined,
      isRequire ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
    ).resolvedModule?.resolvedFileName;
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
// detects it by the file's syntax.
export const getModuleFormat = (path: string, text: string): "module" | "commonjs" =>
  ts.getImpliedNodeFormatForFile(path, undefined, ts.sys, NODE_OPTIONS) === ts.ModuleKind.ESNext
    ? "module"
    : /\.c[jt]s$/.test(path) || getPackageType(ts.sys.resolvePath(path)) !== undefined
      ? "commonjs"
      : hasModuleSyntax(path, text)
        ? "module"
        : "commonjs";
