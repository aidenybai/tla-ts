import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { rejectEarlyErrors } from "./early-errors";

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

// Type checks a model, with the files it imports, and throws its type errors.
export const createProgram = (
  source: string,
  path: string,
  libraries: ReadonlyMap<string, string> | undefined,
) => {
  const host =
    libraries === undefined
      ? ts.createCompilerHost(COMPILER_OPTIONS)
      : createLibraryHost(libraries);
  const libraryDirectory = host.getDefaultLibLocation?.() ?? "";
  const program = ts.createProgram({
    rootNames: [path],
    options: COMPILER_OPTIONS,
    host: {
      ...host,
      // The program's options parse the model as a module, where await can start a statement.
      getSourceFile: (fileName, languageVersion) => {
        if (fileName === path) return ts.createSourceFile(path, source, languageVersion, true);
        const cached = libraryFiles.get(fileName);
        if (cached !== undefined) return cached;
        const file = host.getSourceFile(fileName, languageVersion);
        if (file !== undefined && fileName.startsWith(libraryDirectory)) {
          libraryFiles.set(fileName, file);
        }
        return file;
      },
      fileExists: (fileName) => fileName === path || host.fileExists(fileName),
      readFile: (fileName) => (fileName === path ? source : host.readFile(fileName)),
    },
  });
  const sourceFile = program.getSourceFile(path);
  if (sourceFile === undefined) throw new TlaTypeScriptError(`Can't read ${path}`);
  const syntaxErrors = program.getSyntacticDiagnostics(sourceFile);
  if (syntaxErrors.length > 0)
    throw new TlaTypeScriptError(ts.formatDiagnostics(syntaxErrors, host));
  rejectEarlyErrors(sourceFile);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) throw new TlaTypeScriptError(ts.formatDiagnostics(diagnostics, host));
  return { sourceFile, checker: program.getTypeChecker() };
};
