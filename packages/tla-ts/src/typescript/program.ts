import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import {
  findNodes,
  getImplicitGlobals,
  getSymbol,
  getVarFunctionTarget,
  getVarScope,
  isPlain,
  isStrictCode,
  isVarFunction,
} from "./context";
import {
  createJavaScriptFile,
  isJavaScriptFile,
  resolveModule,
  typeExportsAsAny,
} from "./common-js";
import { rejectEarlyErrors } from "./early-errors";
import { typeJavaScript } from "./javascript-types";
import { createProgramNodes, withNameSymbols } from "./program-nodes";
import { rewriteNameDeletes } from "./name-deletes";
import { rewriteWithStatements } from "./with-statements";

// TypeScript checks every file as a module, so it rejects a word that only strict mode reserves, as
// yield or public, and a binding named arguments or eval, even outside strict mode.
// It also rejects a delete of a property that its type makes read-only, which outside strict mode
// gives false where the property can't be deleted.
const STRICT_MODE_ERRORS = new Set([1100, 1212, 1213, 1214, 1215, 2704]);

const getNodeAt = (node: ts.Node, position: number): ts.Node =>
  ts.forEachChild(node, (child) =>
    child.getStart() <= position && position < child.getEnd()
      ? getNodeAt(child, position)
      : undefined,
  ) ?? node;

// A generator reserves yield in its parameters and its body, and a generator expression in its own
// name, outside strict mode too. A function declaration's or a method's name, and an arrow
// function's parameters, take the yield of the code around them, and an arrow function's body
// doesn't.
const isGeneratorYield = (node: ts.Node) => {
  if (!ts.isIdentifier(node) || node.text !== "yield") return false;
  const owner = ts.findAncestor(node.parent, (ancestor) =>
    ts.isArrowFunction(ancestor)
      ? node.pos >= ancestor.body.pos && "quit"
      : ts.isFunctionLike(ancestor) &&
        (ts.isFunctionExpression(ancestor) ||
          ancestor.name === undefined ||
          node.pos >= ancestor.name.end),
  );
  return owner !== undefined && "asteriskToken" in owner && owner.asteriskToken !== undefined;
};

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
export const isTypeImport = (literal: ts.StringLiteralLike) => {
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

// TypeScript's error for an if whose branch is the empty statement, which JavaScript runs.
const EMPTY_IF_BRANCH_ERROR = 1313;

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

// HACK: TypeScript checks a parameter property's assignment only in its emit, so the text gains it.
// A file's text where each constructor assigns its parameter properties, as TypeScript does once
// its base's constructor returns, after the super call that a derived class must make first. The
// text stays on the same lines.
const assignParameterProperties = (fileName: string, text: string) => {
  const file = ts.createSourceFile(fileName, text, ts.ScriptTarget.ESNext);
  const insertions: { position: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isConstructorDeclaration(node) && node.body !== undefined) {
      const names = node.parameters.flatMap((parameter) =>
        ts.isParameterPropertyDeclaration(parameter, node) && ts.isIdentifier(parameter.name)
          ? [parameter.name.text]
          : [],
      );
      const superCall = node.body.statements.find(
        (statement) =>
          ts.isExpressionStatement(statement) &&
          ts.isCallExpression(statement.expression) &&
          statement.expression.expression.kind === ts.SyntaxKind.SuperKeyword,
      );
      if (names.length > 0) {
        insertions.push({
          position: superCall?.end ?? node.body.getStart(file) + 1,
          text: names.map((name) => ` this.${name} = ${name};`).join(""),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return insertions.reduceRight(
    (current, insertion) =>
      current.slice(0, insertion.position) + insertion.text + current.slice(insertion.position),
    text,
  );
};

// A var of type any, which JavaScript writes with JSDoc.
const getAnyVar = (name: string, fileName: string) =>
  isJavaScriptFile(fileName) ? `/** @type {any} */ var ${name};` : `var ${name}: any;`;

// HACK: TypeScript binds every file as strict code, where a function that a block declares binds its
// name only in the block. Outside strict mode, the text gains what Annex B.3.2 and B.3.3 add: a block
// around a function that an if's branch declares, and the var that a function that a block declares
// assigns, where its function or its script declares none. The text stays on the same lines.
const declareVarFunctions = (file: ts.SourceFile) => {
  const insertions = findNodes(file, ts.isFunctionDeclaration).flatMap((node) => {
    const blocks =
      ts.isIfStatement(node.parent) && isPlain(node) && !isStrictCode(node)
        ? [
            { position: node.getStart(file), text: "{" },
            { position: node.end, text: "}" },
          ]
        : [];
    const name =
      isVarFunction(node) && getVarFunctionTarget(node) === undefined ? node.name.text : undefined;
    const scope = name === undefined ? undefined : getVarScope(node);
    return name === undefined ||
      scope === undefined ||
      (name === "arguments" && !ts.isSourceFile(scope))
      ? blocks
      : [
          ...blocks,
          {
            position: ts.isSourceFile(scope) ? 0 : scope.getStart(file) + 1,
            text: getAnyVar(name, file.fileName),
          },
        ];
  });
  return [
    ...new Map(
      insertions.map((insertion) => [`${insertion.position} ${insertion.text}`, insertion]),
    ).values(),
  ]
    .toSorted((left, right) => right.position - left.position)
    .reduce(
      (current, insertion) =>
        current.slice(0, insertion.position) + insertion.text + current.slice(insertion.position),
      file.text,
    );
};

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

// A file's text where it declares the vars of the functions that its blocks declare.
const declareFileVarFunctions = (fileName: string, text: string) =>
  declareVarFunctions(createFile(fileName, text, ts.ScriptTarget.ESNext));

// A file whose text declares the vars of the functions that its blocks declare.
const createVarFunctionsFile = (
  fileName: string,
  text: string,
  languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions,
) => {
  const file = createFile(fileName, text, languageVersion);
  const declared = declareVarFunctions(file);
  return declared === text ? file : createFile(fileName, declared, languageVersion);
};

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

// The file that a literal of a model's file loads as the model runs, as createProgram resolves
// it for the model at path, or undefined where none does.
export const createFileResolver = (path: string) => {
  const project = getProject(path);
  const options = project === undefined ? COMPILER_OPTIONS : getProjectOptions(project.options);
  const host = ts.createCompilerHost(options);
  return (literal: ts.StringLiteralLike) =>
    resolveLiteral(
      literal,
      literal.getSourceFile().fileName,
      literal.getSourceFile(),
      true,
      options,
      host,
      undefined,
    ).module.resolvedModule?.resolvedFileName;
};

// Type checks a model, with the files it imports, and throws their type errors. A file of a project
// on disk type checks with the project's options, and where it needs them, as in an editor, the
// globals that the project's other files declare, such as those of a types package one references.
export const createProgram = (
  source: string,
  path: string,
  library: Library = DEFAULT_LIBRARY,
  // The paths of the scripts that run before the model, which shares their global scope, as a
  // page's scripts do, where the model is a script too.
  scripts: readonly string[] = [],
) => {
  const libraries = library.texts;
  const project = libraries === undefined ? getProject(path) : undefined;
  const projectOptions =
    project === undefined ? COMPILER_OPTIONS : getProjectOptions(project.options);
  // Scripts share their global scope only where TypeScript reads them as scripts.
  const options: ts.CompilerOptions =
    scripts.length === 0
      ? projectOptions
      : { ...projectOptions, moduleDetection: ts.ModuleDetectionKind.Legacy };
  const roots = [...scripts, path];
  // A script's JavaScript runs as a page's script does, rather than as Node loads a module.
  const createModelFile = (
    fileName: string,
    text: string,
    languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions,
  ) =>
    roots.length > 1 && roots.includes(fileName) && isJavaScriptFile(fileName)
      ? ts.createSourceFile(fileName, text, languageVersion, true, ts.ScriptKind.JS)
      : createFile(fileName, text, languageVersion);
  const host =
    libraries === undefined ? ts.createCompilerHost(options) : createLibraryHost(libraries);
  // Whether a module that Node loads as JavaScript gave its types from a declaration file, which
  // type checks the code that imports it.
  let isDeclared = false;
  // A module that TypeScript finds no code of, as a package or JavaScript, and any module that
  // JavaScript names, loads as Node loads it, though a package may give its types, and TypeScript
  // reads it as code. A type's import, and any import of a declaration file, loads nothing when the
  // code runs. A program that type checks reads a package's types from its declarations instead,
  // as do the files that the model doesn't load, which only give the project's globals.
  const getModuleResolver =
    (valueFiles: ReadonlySet<string> | undefined) =>
    (
      literals: readonly ts.StringLiteralLike[],
      containingFile: string,
      redirectedReference: ts.ResolvedProjectReference | undefined,
      resolutionOptions: ts.CompilerOptions,
      containingSourceFile: ts.SourceFile,
    ) =>
      literals.map((literal) => {
        const resolution = resolveLiteral(
          literal,
          containingFile,
          containingSourceFile,
          valueFiles === undefined || valueFiles.has(containingFile),
          resolutionOptions,
          host,
          redirectedReference,
        );
        if (resolution.isDeclared) isDeclared = true;
        return resolution.module;
      });
  // HACK: a write outside strict mode to a name that no binding has makes a global, which the text
  // gains a var for, at its start, so that the name binds wherever it's written or read. The
  // compiler treats the var as the global, which reads throw for until a write makes it.
  const createTypeScriptProgram = (
    rootNames: string[],
    text: string,
    globals: ReadonlySet<string>,
    // The files whose imports load as Node loads them, every file's where undefined.
    valueFiles: ReadonlySet<string> | undefined,
    // The texts of the JavaScript files whose types tla-ts made any where they may not hold.
    typedTexts: ReadonlyMap<string, string>,
  ) => {
    const programHost: ts.CompilerHost & SourceRedirectingHost = {
      ...host,
      // A project that references others compiles their code, as an editor does, rather than
      // the declarations that building them would write.
      useSourceOfProjectReferenceRedirect: () => true,
      // The program's options parse the model as a module, where await can start a statement.
      getSourceFile: (fileName, languageVersion) => {
        if (fileName === JSON_DECLARATIONS.path) {
          return ts.createSourceFile(fileName, JSON_DECLARATIONS.text, languageVersion);
        }
        const typedText = typedTexts.get(fileName);
        if (typedText !== undefined) return createModelFile(fileName, typedText, languageVersion);
        if (fileName === path) {
          return createModelFile(
            path,
            [...globals].map((name) => getAnyVar(name, path)).join("") + text,
            languageVersion,
          );
        }
        const file = library.files.get(fileName) ?? host.getSourceFile(fileName, languageVersion);
        if (file === undefined || file.isDeclarationFile) return file;
        if (roots.includes(fileName) && isJavaScriptFile(fileName)) {
          return createModelFile(fileName, file.text, languageVersion);
        }
        return createVarFunctionsFile(
          fileName,
          assignParameterProperties(fileName, file.text),
          languageVersion,
        );
      },
      fileExists: (fileName) => fileName === path || host.fileExists(fileName),
      readFile: (fileName) => (fileName === path ? source : host.readFile(fileName)),
      resolveModuleNameLiterals:
        libraries === undefined ? getModuleResolver(valueFiles) : undefined,
    };
    return ts.createProgram({
      rootNames: [...rootNames, JSON_DECLARATIONS.path],
      options,
      projectReferences: project?.projectReferences,
      host: programHost,
    });
  };
  const getModelSourceFile = (program: ts.Program) => {
    const file = program.getSourceFile(path);
    if (file === undefined) throw new TlaTypeScriptError(`Can't read ${path}`);
    return file;
  };
  const firstText = declareFileVarFunctions(path, assignParameterProperties(path, source));
  const firstProgram = createTypeScriptProgram(roots, firstText, new Set(), undefined, new Map());
  const firstSourceFile = getModelSourceFile(firstProgram);
  const syntaxErrors = firstProgram.getSyntacticDiagnostics(firstSourceFile);
  if (syntaxErrors.length > 0)
    throw new TlaTypeScriptError(ts.formatDiagnostics(syntaxErrors, host));
  rejectEarlyErrors(firstSourceFile);
  const withText = rewriteWithStatements(firstSourceFile, firstProgram.getTypeChecker());
  const withProgram =
    withText === firstText
      ? firstProgram
      : createTypeScriptProgram(roots, withText, new Set(), undefined, new Map());
  const text = rewriteNameDeletes(getModelSourceFile(withProgram), withProgram.getTypeChecker());
  const rewrittenProgram =
    text === withText
      ? withProgram
      : createTypeScriptProgram(roots, text, new Set(), undefined, new Map());
  const rewrittenChecker = rewrittenProgram.getTypeChecker();
  const globals = getImplicitGlobals(getModelSourceFile(rewrittenProgram), (name) =>
    getSymbol(name, rewrittenChecker),
  );
  // Outside strict mode, a word that only strict mode reserves, arguments, or eval names a binding,
  // and a delete of a read-only property gives false. JavaScript runs an if whose branch is empty.
  const isReported = (diagnostic: ts.Diagnostic) =>
    diagnostic.code !== EMPTY_IF_BRANCH_ERROR &&
    (!STRICT_MODE_ERRORS.has(diagnostic.code) ||
      diagnostic.file === undefined ||
      isStrictCode(getNodeAt(diagnostic.file, diagnostic.start ?? 0)) ||
      isGeneratorYield(getNodeAt(diagnostic.file, diagnostic.start ?? 0)));
  const untypedProgram =
    globals.size === 0
      ? rewrittenProgram
      : createTypeScriptProgram(roots, text, globals, undefined, new Map());
  // The JavaScript that the model loads, its own and its packages', whose types tla-ts makes hold,
  // round by round, until TypeScript reports no error that changes them.
  const typeJavaScriptFiles = (
    program: ts.Program,
    typedTexts: ReadonlyMap<string, string>,
  ): { program: ts.Program; typedTexts: ReadonlyMap<string, string> } => {
    const texts = program
      .getSourceFiles()
      .filter((file) => isJavaScriptFile(file.fileName))
      .flatMap((file) => {
        const typed = typeJavaScript(file, program, host, isReported);
        return typed === undefined ? [] : [[file.fileName, typed] as const];
      });
    if (texts.length === 0) return { program, typedTexts };
    const next = new Map([...typedTexts, ...texts]);
    return typeJavaScriptFiles(
      createTypeScriptProgram(roots, text, globals, undefined, next),
      next,
    );
  };
  const typed = typeJavaScriptFiles(untypedProgram, new Map());
  const modelProgram = typed.program;
  const getModelFiles = (program: ts.Program) =>
    modelProgram.getSourceFiles().flatMap((file) => program.getSourceFile(file.fileName) ?? []);
  // JavaScript's type errors are those that typeJavaScriptFiles took, so only its syntax's remain.
  const getDiagnostics = (program: ts.Program) =>
    ts
      .sortAndDeduplicateDiagnostics(
        getModelFiles(program).flatMap((file) =>
          isJavaScriptFile(file.fileName)
            ? program.getSyntacticDiagnostics(file)
            : ts.getPreEmitDiagnostics(program, file),
        ),
      )
      .filter(isReported);
  // TypeScript reads the code of a package that gives its types in declarations as JavaScript,
  // whose values it doesn't type, so the TypeScript that imports it type checks against the
  // declarations, while tla-ts runs the package's JavaScript.
  const getTypedDiagnostics = (program: ts.Program, rootNames: string[]) => {
    const diagnostics = getDiagnostics(program);
    const isTypeScript = (diagnostic: ts.Diagnostic) =>
      diagnostic.file === undefined || !isJavaScriptFile(diagnostic.file.fileName);
    return diagnostics.length === 0 || !isDeclared
      ? diagnostics
      : [
          ...diagnostics.filter((diagnostic) => !isTypeScript(diagnostic)),
          ...getDiagnostics(
            createTypeScriptProgram(rootNames, text, globals, new Set(), typed.typedTexts),
          ).filter(isTypeScript),
        ];
  };
  const modelDiagnostics = getTypedDiagnostics(modelProgram, roots);
  // A model that type checks by itself keeps the program of its own files, which loads faster.
  // Where the model reads a package's types from its declarations, only the program that reads
  // them type checks it, with the project's globals, and the model's own program, whose package
  // values are any, compiles it.
  const projectRoots = [...roots, ...(project?.fileNames ?? [])];
  const isProjectChecked = project !== undefined && modelDiagnostics.length > 0;
  const program =
    !isProjectChecked || isDeclared
      ? modelProgram
      : createTypeScriptProgram(
          projectRoots,
          text,
          globals,
          new Set(modelProgram.getSourceFiles().map((file) => file.fileName)),
          typed.typedTexts,
        );
  const diagnostics = !isProjectChecked
    ? modelDiagnostics
    : program !== modelProgram
      ? getDiagnostics(program)
      : [
          ...getDiagnostics(modelProgram).filter(
            (diagnostic) =>
              diagnostic.file !== undefined && isJavaScriptFile(diagnostic.file.fileName),
          ),
          ...getDiagnostics(
            createTypeScriptProgram(projectRoots, text, globals, new Set(), typed.typedTexts),
          ).filter(
            (diagnostic) =>
              diagnostic.file === undefined || !isJavaScriptFile(diagnostic.file.fileName),
          ),
        ];
  if (diagnostics.length > 0) throw new TlaTypeScriptError(ts.formatDiagnostics(diagnostics, host));
  const sourceFile = getModelSourceFile(program);
  const files = getModelFiles(program).filter((file) => !file.isDeclarationFile);
  const nodes = createProgramNodes(program.getTypeChecker(), files);
  const checker = typeExportsAsAny(withNameSymbols(program.getTypeChecker(), nodes));
  return {
    sourceFile,
    checker,
    files,
    nodes,
    // Whether TypeScript compares a function type's parameters one way only, as its own options tell.
    isStrictFunctionTypes: options.strictFunctionTypes ?? options.strict ?? false,
    defaultLibraries: new Set(
      program.getSourceFiles().filter((file) => program.isSourceFileDefaultLibrary(file)),
    ),
    implicitGlobals: new Set(
      checker
        .getSymbolsInScope(sourceFile, ts.SymbolFlags.Variable)
        .filter(
          (symbol) =>
            globals.has(symbol.name) && symbol.valueDeclaration?.getSourceFile() === sourceFile,
        ),
    ),
  };
};
