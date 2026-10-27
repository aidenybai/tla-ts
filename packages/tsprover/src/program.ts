import { dirname } from "node:path";
import ts from "typescript";
import { TsproverError } from "./errors";

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

const LIBRARY_DIRECTORY = dirname(ts.getDefaultLibFilePath(COMPILER_OPTIONS));

// TypeScript's own declaration files, parsed once and shared by every program, since parsing them
// takes most of a compile.
const libraryFiles = new Map<string, ts.SourceFile>();

// Type checks a model, with the files it imports, and throws its type errors.
export const createProgram = (source: string, path: string) => {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true);
  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const program = ts.createProgram({
    rootNames: [path],
    options: COMPILER_OPTIONS,
    host: {
      ...host,
      getSourceFile: (fileName, languageVersion) => {
        if (fileName === path) return sourceFile;
        const cached = libraryFiles.get(fileName);
        if (cached !== undefined) return cached;
        const file = host.getSourceFile(fileName, languageVersion);
        if (file !== undefined && fileName.startsWith(LIBRARY_DIRECTORY)) {
          libraryFiles.set(fileName, file);
        }
        return file;
      },
      fileExists: (fileName) => fileName === path || host.fileExists(fileName),
      readFile: (fileName) => (fileName === path ? source : host.readFile(fileName)),
    },
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) throw new TsproverError(ts.formatDiagnostics(diagnostics, host));
  return { sourceFile, checker: program.getTypeChecker() };
};
