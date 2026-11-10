import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { check, TlaError, TlaSyntaxError, TlaUnsupportedError } from "../src";
import { getLibraryModules, TLC_SEED } from "./corpora";

export interface ModelOutcome {
  status: string;
  violation?: string;
  generatedStates?: number;
  distinctStates?: number;
  depth?: number;
  traceLength?: number;
  error?: string;
  milliseconds: number;
}

const libraryModules = getLibraryModules();

const checkModel = async (specPath: string, configPath: string): Promise<ModelOutcome> => {
  const directory = dirname(specPath);
  const startedAt = performance.now();
  const source = readFileSync(specPath, "utf8");
  const moduleName = /-{4,}\s*MODULE\s+(\w+)/.exec(source)?.[1];
  if (moduleName !== basename(specPath, ".tla")) {
    throw new TlaSyntaxError(
      `File name ${basename(specPath, ".tla")} does not match the name ${moduleName} of the top level module it contains`,
    );
  }
  const result = await check({
    isWarningEnabled: false,
    source,
    config: readFileSync(configPath, "utf8"),
    loadModule: (name) => {
      const modulePath = join(directory, `${name}.tla`);
      const libraryPath = libraryModules.get(name);
      return existsSync(modulePath)
        ? readFileSync(modulePath, "utf8")
        : libraryPath && readFileSync(libraryPath, "utf8");
    },
    loadClass: (name) => {
      const classPath = join(directory, `${name}.class`);
      return existsSync(classPath) ? readFileSync(classPath) : undefined;
    },
    readFile: (path) => {
      const filePath = join(directory, path);
      return existsSync(filePath) ? readFileSync(filePath, "utf8") : undefined;
    },
    onPrint: () => {},
    seed: TLC_SEED,
    livenessCheck: "final",
  });
  const milliseconds = Math.round(performance.now() - startedAt);
  if (result.failure) {
    return {
      status: "error",
      error: `TlaEvaluationError: ${result.failure.message}`,
      milliseconds,
    };
  }
  if (result.status === "success") {
    return {
      status: result.status,
      generatedStates: result.generatedStates,
      distinctStates: result.distinctStates,
      depth: result.depth,
      milliseconds,
    };
  }
  const trace = result.violation?.trace;
  const isStuttering = trace !== undefined && result.violation?.loopStart === trace.length - 1;
  return {
    status: result.status,
    violation: result.violation?.name,
    traceLength: trace && trace.length + (isStuttering ? 1 : 0),
    milliseconds,
  };
};

const getErrorOutcome = (error: unknown, milliseconds: number): ModelOutcome => {
  if (!(error instanceof TlaError)) throw error;
  return {
    status: error instanceof TlaUnsupportedError ? "unsupported" : "error",
    error: `${error.name}: ${error.message}`,
    milliseconds,
  };
};

if (process.argv[1] === import.meta.filename) {
  const startedAt = performance.now();
  const outcome = await checkModel(process.argv[2], process.argv[3]).catch((error: unknown) =>
    getErrorOutcome(error, Math.round(performance.now() - startedAt)),
  );
  process.stdout.write(JSON.stringify(outcome));
}
