import { dirname, resolve } from "node:path";
import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";

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

// The project of the nearest tsconfig.json, where it holds the file, as an editor finds it.
const getProject = (path: string) => {
  if (!ts.sys.fileExists(path)) return undefined;
  const configPath = ts.findConfigFile(dirname(path), ts.sys.fileExists);
  const project =
    configPath === undefined
      ? undefined
      : ts.getParsedCommandLineOfConfigFile(
          configPath,
          {},
          { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
        );
  const file = resolve(path).replaceAll("\\", "/");
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

// Type checks a model, with the files it imports, and throws its type errors. A file of a project
// type checks with the project's options.
export const createProgram = (source: string, path: string) => {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true);
  const project = getProject(path);
  const options = project === undefined ? COMPILER_OPTIONS : getProjectOptions(project.options);
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram({
    rootNames: [path],
    options,
    projectReferences: project?.projectReferences,
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
  if (diagnostics.length > 0) throw new TlaTypeScriptError(ts.formatDiagnostics(diagnostics, host));
  return { sourceFile, checker: program.getTypeChecker() };
};
