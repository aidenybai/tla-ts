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
  getImportText,
  getModuleText,
  isCommonJsFile,
  isCommonJsImport,
  resolveImport,
  typeAsAny,
} from "./common-js";
import { rejectEarlyErrors } from "./early-errors";
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

// A declaration file's name, as types.d.ts, index.d.mts, or styles.d.css.ts.
const DECLARATION_FILE = /\.d\.(?:[^.]+\.)?[cm]?ts$/;

// TypeScript's error for an if whose branch is the empty statement, which JavaScript runs.
const EMPTY_IF_BRANCH_ERROR = 1313;

// TypeScript's own declaration files, parsed once and shared by every program, since parsing them
// takes most of a compile.
const libraryFiles = new Map<string, ts.SourceFile>();

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

// HACK: TypeScript binds every file as strict code, where a function that a block declares binds its
// name only in the block. Outside strict mode, the text gains what Annex B.3.2 and B.3.3 add: a block
// around a function that an if's branch declares, and the var that a function that a block declares
// assigns, where its function or its script declares none. The text stays on the same lines.
const declareVarFunctions = (fileName: string, text: string) => {
  const file = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.ESNext,
    true,
    isCommonJsFile(fileName) ? ts.ScriptKind.TS : undefined,
  );
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
    return scope === undefined || (name === "arguments" && !ts.isSourceFile(scope))
      ? blocks
      : [
          ...blocks,
          {
            position: ts.isSourceFile(scope) ? 0 : scope.getStart(file) + 1,
            text: `var ${name}: any;`,
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
      text,
    );
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
  moduleDetection: ts.ModuleDetectionKind.Force,
  noEmit: true,
  composite: false,
  incremental: false,
  declaration: false,
  declarationMap: false,
  emitDeclarationOnly: false,
  isolatedDeclarations: false,
});

// Type checks a model, with the files it imports, and throws their type errors. A file of a project
// on disk type checks with the project's options, and where it needs them, as in an editor, the
// globals that the project's other files declare, such as those of a types package one references.
export const createProgram = (
  source: string,
  path: string,
  libraries: ReadonlyMap<string, string> | undefined,
) => {
  const project = libraries === undefined ? getProject(path) : undefined;
  const options = project === undefined ? COMPILER_OPTIONS : getProjectOptions(project.options);
  const host =
    libraries === undefined ? ts.createCompilerHost(options) : createLibraryHost(libraries);
  const libraryDirectory = host.getDefaultLibLocation?.() ?? "";
  const getResolved = (resolvedFileName: string): ts.ResolvedModuleWithFailedLookupLocations => ({
    resolvedModule: {
      resolvedFileName,
      extension: ts.Extension.Ts,
      isExternalLibraryImport: false,
    },
  });
  // A module that TypeScript finds no code of, as a package or JavaScript, loads as Node loads it.
  // The modules that tla-ts makes for CommonJS name the files they load by path.
  const resolveModuleNameLiterals = (
    literals: readonly ts.StringLiteralLike[],
    containingFile: string,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    resolutionOptions: ts.CompilerOptions,
  ) =>
    literals.map((literal) => {
      if (isCommonJsFile(containingFile) || isCommonJsImport(containingFile)) {
        return getResolved(literal.text);
      }
      const resolved = ts.resolveModuleName(
        literal.text,
        containingFile,
        resolutionOptions,
        host,
        undefined,
        redirectedReference,
      );
      // A type's import, as import("fs") in a type or any import of a declaration file, loads
      // nothing when the code runs.
      const parent = literal.parent;
      if (
        CODE_EXTENSIONS.has(resolved.resolvedModule?.extension ?? "") ||
        DECLARATION_FILE.test(containingFile) ||
        (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent)) ||
        (ts.isImportDeclaration(parent) && parent.importClause?.isTypeOnly === true) ||
        (ts.isExportDeclaration(parent) && parent.isTypeOnly)
      ) {
        return resolved;
      }
      const imported = resolveImport(literal, containingFile);
      return imported === undefined ? resolved : getResolved(imported);
    });
  // HACK: a write outside strict mode to a name that no binding has makes a global, which the text
  // gains a var for, at its start, so that the name binds wherever it's written or read. The
  // compiler treats the var as the global, which reads throw for until a write makes it.
  const createTypeScriptProgram = (
    rootNames: string[],
    text: string,
    globals: ReadonlySet<string>,
  ) => {
    const programHost: ts.CompilerHost & SourceRedirectingHost = {
      ...host,
      // A project that references others compiles their code, as an editor does, rather than
      // the declarations that building them would write.
      useSourceOfProjectReferenceRedirect: () => true,
      // The program's options parse the model as a module, where await can start a statement.
      getSourceFile: (fileName, languageVersion) => {
        if (fileName === path) {
          return ts.createSourceFile(
            path,
            [...globals].map((name) => `var ${name}: any;`).join("") + text,
            languageVersion,
            true,
          );
        }
        if (isCommonJsImport(fileName)) {
          return ts.createSourceFile(
            fileName,
            getImportText(fileName),
            languageVersion,
            true,
            ts.ScriptKind.TS,
          );
        }
        const moduleText = isCommonJsFile(fileName) ? ts.sys.readFile(fileName) : undefined;
        if (moduleText !== undefined) {
          return typeAsAny(
            ts.createSourceFile(
              fileName,
              declareVarFunctions(fileName, getModuleText(fileName, moduleText)),
              languageVersion,
              true,
              ts.ScriptKind.TS,
            ),
          );
        }
        const cached = libraryFiles.get(fileName);
        if (cached !== undefined) return cached;
        const file = host.getSourceFile(fileName, languageVersion);
        if (file === undefined || file.isDeclarationFile) {
          if (file !== undefined && fileName.startsWith(libraryDirectory)) {
            libraryFiles.set(fileName, file);
          }
          return file;
        }
        return ts.createSourceFile(
          fileName,
          declareVarFunctions(fileName, assignParameterProperties(fileName, file.text)),
          languageVersion,
          true,
        );
      },
      fileExists: (fileName) => fileName === path || host.fileExists(fileName),
      readFile: (fileName) => (fileName === path ? source : host.readFile(fileName)),
      resolveModuleNameLiterals: libraries === undefined ? resolveModuleNameLiterals : undefined,
    };
    return ts.createProgram({
      rootNames,
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
  const firstText = declareVarFunctions(path, assignParameterProperties(path, source));
  const firstProgram = createTypeScriptProgram([path], firstText, new Set());
  const firstSourceFile = getModelSourceFile(firstProgram);
  const syntaxErrors = firstProgram.getSyntacticDiagnostics(firstSourceFile);
  if (syntaxErrors.length > 0)
    throw new TlaTypeScriptError(ts.formatDiagnostics(syntaxErrors, host));
  rejectEarlyErrors(firstSourceFile);
  const withText = rewriteWithStatements(firstSourceFile, firstProgram.getTypeChecker());
  const withProgram =
    withText === firstText ? firstProgram : createTypeScriptProgram([path], withText, new Set());
  const text = rewriteNameDeletes(getModelSourceFile(withProgram), withProgram.getTypeChecker());
  const rewrittenProgram =
    text === withText ? withProgram : createTypeScriptProgram([path], text, new Set());
  const rewrittenChecker = rewrittenProgram.getTypeChecker();
  const globals = getImplicitGlobals(getModelSourceFile(rewrittenProgram), (name) =>
    getSymbol(name, rewrittenChecker),
  );
  const modelProgram =
    globals.size === 0 ? rewrittenProgram : createTypeScriptProgram([path], text, globals);
  const getModelFiles = (program: ts.Program) =>
    modelProgram.getSourceFiles().flatMap((file) => program.getSourceFile(file.fileName) ?? []);
  // Outside strict mode, a word that only strict mode reserves, arguments, or eval names a binding,
  // and a delete of a read-only property gives false.
  const isReported = (diagnostic: ts.Diagnostic) =>
    !STRICT_MODE_ERRORS.has(diagnostic.code) ||
    diagnostic.file === undefined ||
    isStrictCode(getNodeAt(diagnostic.file, diagnostic.start ?? 0)) ||
    isGeneratorYield(getNodeAt(diagnostic.file, diagnostic.start ?? 0));
  // TypeScript checks no types of JavaScript, only its syntax.
  const getDiagnostics = (program: ts.Program) =>
    ts
      .sortAndDeduplicateDiagnostics(
        getModelFiles(program).flatMap((file) =>
          isCommonJsFile(file.fileName)
            ? program.getSyntacticDiagnostics(file)
            : ts.getPreEmitDiagnostics(program, file),
        ),
      )
      .filter((diagnostic) => isReported(diagnostic) && diagnostic.code !== EMPTY_IF_BRANCH_ERROR);
  const modelDiagnostics = getDiagnostics(modelProgram);
  // A model that type checks by itself keeps the program of its own files, which loads faster.
  const program =
    project === undefined || modelDiagnostics.length === 0
      ? modelProgram
      : createTypeScriptProgram([path, ...project.fileNames], text, globals);
  const diagnostics = program === modelProgram ? modelDiagnostics : getDiagnostics(program);
  if (diagnostics.length > 0) throw new TlaTypeScriptError(ts.formatDiagnostics(diagnostics, host));
  const sourceFile = getModelSourceFile(program);
  const checker = program.getTypeChecker();
  return {
    sourceFile,
    checker,
    files: getModelFiles(program).filter((file) => !file.isDeclarationFile),
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
