import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { createJavaScriptFile, isJavaScriptFile, resolveModule } from "./common-js";
import { rewriteJsx } from "./jsx";

const COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  allowJs: true,
  // TypeScript checks JavaScript's types only where tla-ts asks for a file's errors.
  checkJs: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  allowImportingTsExtensions: true,
  resolveJsonModule: true,
  skipLibCheck: true,
  lib: ["lib.esnext.d.ts"],
  types: [],
};

// The extensions of the files that TypeScript compiles itself, rather than declares.
const CODE_EXTENSIONS = new Set<string>([
  ts.Extension.Ts,
  ts.Extension.Tsx,
  ts.Extension.Mts,
  ts.Extension.Cts,
  ts.Extension.Json,
]);

// TypeScript reads this of any host, though only its WatchCompilerHost declares it.
interface SourceRedirectingHost {
  useSourceOfProjectReferenceRedirect: () => boolean;
}

// A specifier that only types read, which a package's declarations give where it has them, as
// import("fs") in a type, or an import or an export of only types.
const isTypeImport = (literal: ts.StringLiteralLike) => {
  const parent = literal.parent;
  const clause = ts.isImportDeclaration(parent) ? parent.importClause : undefined;
  const bindings = clause?.namedBindings;
  return (
    (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent)) ||
    (ts.isExportDeclaration(parent) && parent.isTypeOnly) ||
    (clause !== undefined &&
      (clause.isTypeOnly ||
        (clause.name === undefined &&
          bindings !== undefined &&
          ts.isNamedImports(bindings) &&
          bindings.elements.length > 0 &&
          bindings.elements.every((element) => element.isTypeOnly))))
  );
};

// The declaration of JSON's modules, which TypeScript reads where it finds no other: a JSON file's
// value, which tla-ts reads as any, as JSON.parse gives it.
const JSON_DECLARATIONS = {
  path: "/tla-ts/json.d.ts",
  text: 'declare module "*.json" { const value: any; export = value; }',
};

// The extension of a file that Node loads as JavaScript or JSON.
const getExtension = (path: string) =>
  [
    ts.Extension.Js,
    ts.Extension.Mjs,
    ts.Extension.Cjs,
    ts.Extension.Json,
    ts.Extension.Ts,
    ts.Extension.Mts,
    ts.Extension.Cts,
  ].find((extension) => path.endsWith(extension));

const createLibraryHost = (libraries: ReadonlyMap<string, string>): ts.CompilerHost => ({
  getSourceFile: (fileName, languageVersion) => {
    const text = libraries.get(fileName);
    return text === undefined ? undefined : ts.createSourceFile(fileName, text, languageVersion);
  },
  getDefaultLibFileName: (options) => ts.getDefaultLibFileName(options),
  getDefaultLibLocation: () => "",
  writeFile: () => undefined,
  getCurrentDirectory: () => "",
  getCanonicalFileName: (fileName) => fileName,
  useCaseSensitiveFileNames: () => true,
  getNewLine: () => "\n",
  fileExists: (fileName) => libraries.has(fileName),
  readFile: (fileName) => libraries.get(fileName),
});

// TypeScript's declaration files of its default library, by name, which every program shares, and,
// for a host without a file system, the texts that its files read from.
export interface Library {
  files: ReadonlyMap<string, ts.SourceFile>;
  texts: ReadonlyMap<string, string> | undefined;
}

// A program of no code that reads the default library through a host, whose files it parses.
const LIBRARY_ROOT = "/library.ts";

const parseLibrary = (
  host: ts.CompilerHost,
  texts: ReadonlyMap<string, string> | undefined,
): Library => {
  const program = ts.createProgram({
    rootNames: [LIBRARY_ROOT],
    options: COMPILER_OPTIONS,
    host: {
      ...host,
      getSourceFile: (fileName, languageVersion) =>
        fileName === LIBRARY_ROOT
          ? ts.createSourceFile(fileName, "", languageVersion)
          : host.getSourceFile(fileName, languageVersion),
      fileExists: (fileName) => fileName === LIBRARY_ROOT || host.fileExists(fileName),
    },
  });
  return {
    files: new Map(
      program
        .getSourceFiles()
        .filter((file) => file.fileName !== LIBRARY_ROOT)
        .map((file) => [file.fileName, file]),
    ),
    texts,
  };
};

// A browser has no file system, so it passes the texts of TypeScript's declaration files, which
// it parses once into its library.
export const createLibrary = (texts: ReadonlyMap<string, string>) =>
  parseLibrary(createLibraryHost(texts), texts);

// Where there is a file system, the compiler parses the default library from it as it loads.
const DEFAULT_LIBRARY: Library =
  ts.sys === undefined
    ? { files: new Map(), texts: undefined }
    : parseLibrary(ts.createCompilerHost(COMPILER_OPTIONS), undefined);

// A file of the program, which TypeScript parses as JavaScript where its extension is one, with the
// format that Node loads it in.
const createFile = (
  fileName: string,
  text: string,
  languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions,
) =>
  isJavaScriptFile(fileName)
    ? createJavaScriptFile(fileName, text, languageVersion)
    : ts.createSourceFile(fileName, text, languageVersion, true);

// The module that a file's literal names, for a file whose imports load as Node loads them where
// isValue: TypeScript's resolution, where TypeScript compiles the module's code itself or only
// types read it, and else the file that Node loads, as a package or JavaScript, though a package
// may give its types, which isDeclared tells. containingFile is the file's path as TypeScript
// resolves from it, which a model's own file, named as the CLI is given it, may not be.
const resolveLiteral = (
  literal: ts.StringLiteralLike,
  containingFile: string,
  containingSourceFile: ts.SourceFile,
  isValue: boolean,
  options: ts.CompilerOptions,
  host: ts.CompilerHost,
  redirectedReference: ts.ResolvedProjectReference | undefined,
): { module: ts.ResolvedModuleWithFailedLookupLocations; isDeclared: boolean } => {
  const resolved =
    isJavaScriptFile(containingFile) && isValue
      ? undefined
      : ts.resolveModuleName(
          literal.text,
          containingFile,
          options,
          host,
          undefined,
          redirectedReference,
        );
  // tla-ts reads JSON's value as any, which the declaration of JSON's modules gives.
  if (resolved?.resolvedModule?.extension === ts.Extension.Json) {
    return { module: { resolvedModule: undefined }, isDeclared: false };
  }
  if (
    resolved !== undefined &&
    (!isValue ||
      CODE_EXTENSIONS.has(resolved.resolvedModule?.extension ?? "") ||
      containingSourceFile.isDeclarationFile ||
      isTypeImport(literal))
  ) {
    return { module: resolved, isDeclared: false };
  }
  const found = resolveModule(literal, containingFile);
  const extension = found === undefined ? undefined : getExtension(found);
  if (found === undefined || extension === undefined || extension === ts.Extension.Json) {
    return { module: resolved ?? { resolvedModule: undefined }, isDeclared: false };
  }
  return {
    module: {
      resolvedModule: { resolvedFileName: found, extension, isExternalLibraryImport: false },
    },
    isDeclared: resolved?.resolvedModule !== undefined,
  };
};

// The project of the nearest tsconfig.json, where it holds the file, as an editor finds it.
const getProject = (path: string) => {
  if (!ts.sys.fileExists(path)) return undefined;
  const file = ts.sys.resolvePath(path).replaceAll("\\", "/");
  const configPath = ts.findConfigFile(file.slice(0, file.lastIndexOf("/")), ts.sys.fileExists);
  const project =
    configPath === undefined
      ? undefined
      : ts.getParsedCommandLineOfConfigFile(
          configPath,
          {},
          { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
        );
  return project?.fileNames.includes(file) ? project : undefined;
};

// A project's options, with those that tla-ts needs: strict types, which it reads values by, every
// file a module, and no output, which a program of one root file can't build.
const getProjectOptions = (options: ts.CompilerOptions): ts.CompilerOptions => ({
  ...options,
  strict: true,
  strictNullChecks: true,
  noImplicitAny: true,
  allowJs: true,
  checkJs: true,
  moduleDetection: ts.ModuleDetectionKind.Force,
  noEmit: true,
  composite: false,
  incremental: false,
  declaration: false,
  declarationMap: false,
  emitDeclarationOnly: false,
  isolatedDeclarations: false,
  // An option that TypeScript deprecates still works as it did, and Node reads none of them.
  ignoreDeprecations: "6.0",
});

// The options of the project of the nearest tsconfig.json that holds the file at path, with those
// that tla-ts needs, or undefined where no project holds it.
export const getProjectCompilerOptions = (path: string) => {
  const project = getProject(path);
  return project === undefined ? undefined : getProjectOptions(project.options);
};

// The text of a file as tla-ts runs it: a file of JSX's with each JSX expression the call that
// TypeScript emits for it, by the options of its project, as createProgram reads it (see
// rewriteJsx), and any other file's as it is.
export const getJsxText = (path: string, text: string) => {
  if (!/\.[jt]sx$/.test(path)) return text;
  const project = getProject(path);
  const options =
    project === undefined
      ? { ...COMPILER_OPTIONS, jsx: ts.JsxEmit.ReactJSX }
      : getProjectOptions(project.options);
  return rewriteJsx(path, text, options, ts.createCompilerHost(options));
};

// TypeScript's program of a model's file and the files it imports, whose checker gives the types
// of their code. A file with type errors still runs, as Node runs it, so nothing here rejects one.
export const createProgram = (source: string, path: string, library: Library = DEFAULT_LIBRARY) => {
  const libraries = library.texts;
  const project = libraries === undefined ? getProject(path) : undefined;
  const options = project === undefined ? COMPILER_OPTIONS : getProjectOptions(project.options);
  const host =
    libraries === undefined ? ts.createCompilerHost(options) : createLibraryHost(libraries);
  const programHost: ts.CompilerHost & SourceRedirectingHost = {
    ...host,
    // A project that references others compiles their code, as an editor does, rather than the
    // declarations that building them would write.
    useSourceOfProjectReferenceRedirect: () => true,
    getSourceFile: (fileName, languageVersion) => {
      if (fileName === JSON_DECLARATIONS.path) {
        return ts.createSourceFile(fileName, JSON_DECLARATIONS.text, languageVersion);
      }
      if (fileName === path) return createFile(path, source, languageVersion);
      const file = library.files.get(fileName) ?? host.getSourceFile(fileName, languageVersion);
      return file === undefined || file.isDeclarationFile
        ? file
        : createFile(fileName, file.text, languageVersion);
    },
    fileExists: (fileName) => fileName === path || host.fileExists(fileName),
    readFile: (fileName) => (fileName === path ? source : host.readFile(fileName)),
    resolveModuleNameLiterals:
      libraries === undefined
        ? (
            literals,
            containingFile,
            redirectedReference,
            resolutionOptions,
            containingSourceFile,
          ) =>
            literals.map(
              (literal) =>
                resolveLiteral(
                  literal,
                  containingFile,
                  containingSourceFile,
                  true,
                  resolutionOptions,
                  host,
                  redirectedReference,
                ).module,
            )
        : undefined,
  };
  const program = ts.createProgram({
    rootNames: [path, JSON_DECLARATIONS.path],
    // TypeScript parses JSX as it is, which only its types read.
    options: { ...options, jsx: ts.JsxEmit.Preserve, jsxImportSource: undefined },
    projectReferences: project?.projectReferences,
    host: programHost,
  });
  const sourceFile = program.getSourceFile(path);
  if (sourceFile === undefined) throw new TlaTypeScriptError(`Can't read ${path}`);
  return { sourceFile, checker: program.getTypeChecker(), options: program.getCompilerOptions() };
};
