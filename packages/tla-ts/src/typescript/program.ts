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

// The project of the nearest tsconfig.json, where it holds the file, as an editor finds it. A host
// without a file system, such as a browser, has none.
const getProject = (path: string) => {
  if (ts.sys?.fileExists(path) !== true) return undefined;
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
  return rewriteJsx(
    path,
    text,
    options,
    ts.sys === undefined ? createLibraryHost(new Map()) : ts.createCompilerHost(options),
  );
};

// The files that a run's programs parse, by the options they parse with and their path, which each
// program after the first reads rather than parsing and binding again, as an editor's projects
// share theirs. A run is the CLI's check of the files it's given; outside one, each program parses
// its own.
let runFiles: Map<string, ts.SourceFile> | undefined;

// The paths of a run's files, and the project of each, which the run reads as a file first needs
// its program.
let runPaths: readonly string[] | undefined;
let runProjects: Map<string, RunProject> | undefined;

// A project of a run's files: its options, where a tsconfig.json holds the files, the files, and
// their program, which the run makes as a file of the project first needs it, with the files whose
// types another of the files could change.
interface RunProject {
  project: ts.ParsedCommandLine | undefined;
  roots: string[];
  program?: { program: ts.Program; augmented: ReadonlySet<string> };
}

// Runs the programs of a run of the files at paths, each of whose models reads the one program of
// the run's files that its project holds.
export const shareParsedFiles = async <T>(paths: readonly string[], run: () => Promise<T>) => {
  runFiles = new Map();
  runPaths = [...new Set(paths.map((path) => path.replaceAll("\\", "/")))];
  try {
    return await run();
  } finally {
    runFiles = undefined;
    runPaths = undefined;
    runProjects = undefined;
  }
};

// Whether a file declares what a file that doesn't import it reads: a global, as a declaration file
// that isn't a module, a global augmentation, or a namespace that a module exports as a global
// does, a module, as an ambient module or a module augmentation does, or the files that its
// references include.
const isAugmenting = (file: ts.SourceFile) =>
  (file.isDeclarationFile && !ts.isExternalModule(file)) ||
  file.referencedFiles.length > 0 ||
  file.typeReferenceDirectives.length > 0 ||
  file.libReferenceDirectives.length > 0 ||
  file.statements.some(
    (statement) =>
      ts.isNamespaceExportDeclaration(statement) ||
      (ts.isModuleDeclaration(statement) &&
        (ts.isStringLiteral(statement.name) ||
          (statement.flags & ts.NodeFlags.GlobalAugmentation) !== 0)),
  );

// The roots of a program whose types another root's files could change: those that a file of
// another root's imports augments, which no import of their own reaches. A program of a root alone
// reads the files of its imports and those that every program reads, such as the default library
// and the project's types, which no root's imports reach.
const getAugmentedRoots = (
  program: ts.Program,
  roots: readonly string[],
  imports: ReadonlyMap<ts.SourceFile, readonly string[]>,
) => {
  const getImported = (root: string) => {
    const reached = new Set<ts.SourceFile>();
    const visit = (file: ts.SourceFile | undefined) => {
      if (file === undefined || reached.has(file)) return;
      reached.add(file);
      imports.get(file)?.forEach((name) => visit(program.getSourceFile(name)));
    };
    visit(program.getSourceFile(root));
    return reached;
  };
  const imported = roots.map(getImported);
  const augmenting = new Set(imported.flatMap((files) => [...files].filter(isAugmenting)));
  return new Set(
    roots.filter((_root, index) => [...augmenting].some((file) => !imported[index].has(file))),
  );
};

// TypeScript's program of root files and the files they import, by the options of their project,
// whose checker gives the types of their code, and the names of the files that each file imports.
// A root's file is named as its path names it, though another file imports it, and source, where
// given, holds the text of a root's file in place of the file system's.
const createRootsProgram = (
  roots: readonly string[],
  project: ts.ParsedCommandLine | undefined,
  library: Library,
  source?: { path: string; text: string },
) => {
  const libraries = library.texts;
  const options = project === undefined ? COMPILER_OPTIONS : getProjectOptions(project.options);
  if (libraries === undefined && ts.sys === undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read TypeScript's declaration files without a file system, so a host without one passes their texts",
    );
  }
  const host =
    libraries === undefined ? ts.createCompilerHost(options) : createLibraryHost(libraries);
  const rootNames = new Map(roots.map((root) => [ts.sys?.resolvePath(root) ?? root, root]));
  const getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions,
  ) => {
    if (fileName === JSON_DECLARATIONS.path) {
      return ts.createSourceFile(fileName, JSON_DECLARATIONS.text, languageVersion);
    }
    if (fileName === source?.path) return createFile(fileName, source.text, languageVersion);
    const declared = library.files.get(fileName);
    if (declared !== undefined || /\.d\.(?:[^/]*\.)?[cm]?ts$/.test(fileName)) {
      return declared ?? host.getSourceFile(fileName, languageVersion);
    }
    const text = host.readFile(fileName);
    return text === undefined ? undefined : createFile(fileName, text, languageVersion);
  };
  const optionsKey = JSON.stringify(options);
  const imports = new Map<ts.SourceFile, string[]>();
  const programHost: ts.CompilerHost & SourceRedirectingHost = {
    ...host,
    // A project that references others compiles their code, as an editor does, rather than the
    // declarations that building them would write.
    useSourceOfProjectReferenceRedirect: () => true,
    getSourceFile: (fileName, languageVersion) => {
      const key = `${optionsKey}\n${JSON.stringify(languageVersion)}\n${fileName}`;
      const shared = runFiles?.get(key);
      if (shared !== undefined && (fileName !== source?.path || shared.text === source.text)) {
        return shared;
      }
      const file = getSourceFile(fileName, languageVersion);
      if (file !== undefined) runFiles?.set(key, file);
      return file;
    },
    fileExists: (fileName) => fileName === source?.path || host.fileExists(fileName),
    readFile: (fileName) => (fileName === source?.path ? source.text : host.readFile(fileName)),
    resolveModuleNameLiterals:
      libraries === undefined
        ? (
            literals,
            containingFile,
            redirectedReference,
            resolutionOptions,
            containingSourceFile,
          ) => {
            const resolved = literals.map((literal) => {
              const found = resolveLiteral(
                literal,
                containingFile,
                containingSourceFile,
                true,
                resolutionOptions,
                host,
                redirectedReference,
              ).module;
              const module = found.resolvedModule;
              const root =
                module === undefined
                  ? undefined
                  : rootNames.get(ts.sys.resolvePath(module.resolvedFileName));
              return root === undefined || module === undefined
                ? found
                : { ...found, resolvedModule: { ...module, resolvedFileName: root } };
            });
            imports.set(
              containingSourceFile,
              resolved.flatMap((found) => found.resolvedModule?.resolvedFileName ?? []),
            );
            return resolved;
          }
        : undefined,
  };
  const program = ts.createProgram({
    rootNames: [...roots, JSON_DECLARATIONS.path],
    // TypeScript parses JSX as it is, which only its types read.
    options: { ...options, jsx: ts.JsxEmit.Preserve, jsxImportSource: undefined },
    projectReferences: project?.projectReferences,
    host: programHost,
  });
  return { program, imports };
};

// The projects of a run's files, by path.
const getRunProjects = (paths: readonly string[]) => {
  const projects = paths.map(getProject);
  const groups = Map.groupBy(paths.keys(), (index) =>
    String(projects[index]?.options.configFilePath ?? ""),
  );
  return new Map(
    [...groups.values()].flatMap((indices) => {
      const project = {
        project: projects[indices[0]],
        roots: indices.map((index) => paths[index]),
      };
      return indices.map((index) => [paths[index], project] as const);
    }),
  );
};

// The run's program of the project of a file of the run, which the run makes once.
const getRunProgram = (path: string) => {
  if (runPaths === undefined || !runPaths.includes(path)) return undefined;
  runProjects ??= getRunProjects(runPaths);
  const project: RunProject | undefined = runProjects.get(path);
  if (project === undefined) return undefined;
  if (project.program === undefined) {
    const made = createRootsProgram(project.roots, project.project, DEFAULT_LIBRARY);
    project.program = {
      program: made.program,
      augmented: getAugmentedRoots(made.program, project.roots, made.imports),
    };
  }
  return project.program;
};

// The source file at path of a program that the run has made, of text, which a run's program
// parses as a module, with its syntax errors, or undefined where none holds it.
export const getRunSourceFile = (path: string, text: string) =>
  [...new Set(runProjects?.values())]
    .flatMap((project) => {
      const program = project.program?.program;
      const file = program?.getSourceFile(path);
      return program !== undefined && file?.fileName === path && file.text === text
        ? [{ file, errors: program.getSyntacticDiagnostics(file) }]
        : [];
    })
    .at(0);

// The source file of a file's text, as a run's program parses it, or as a file of its own.
export const parseFile = (path: string, text: string) =>
  getRunSourceFile(path, text)?.file ??
  ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true);

// TypeScript's program of a model's file and the files it imports, whose checker gives the types
// of their code, which is the run's program of the file's project in a run, unless another of the
// run's files could change its types, which isAugmented tells. A file with type errors still runs,
// as Node runs it, so nothing here rejects one.
export const createProgram = (source: string, path: string, library: Library = DEFAULT_LIBRARY) => {
  const run = library === DEFAULT_LIBRARY ? getRunProgram(path) : undefined;
  const runFile = run?.program.getSourceFile(path);
  const isAugmented = run?.augmented.has(path) === true;
  const program =
    run !== undefined && !isAugmented && runFile?.fileName === path && runFile.text === source
      ? run.program
      : createRootsProgram(
          [path],
          library.texts === undefined ? getProject(path) : undefined,
          library,
          { path, text: source },
        ).program;
  const sourceFile = program.getSourceFile(path);
  if (sourceFile === undefined) throw new TlaTypeScriptError(`Can't read ${path}`);
  return {
    sourceFile,
    checker: program.getTypeChecker(),
    options: program.getCompilerOptions(),
    isAugmented,
  };
};
