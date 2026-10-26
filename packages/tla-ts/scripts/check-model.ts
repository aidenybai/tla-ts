import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { check, TlaError, TlaSyntaxError, TlaUnsupportedError } from "../src";
import { TLC_SEED } from "./corpora";
import type { ExpectedResult } from "./tlc";

export interface ModelOutcome {
  status: string;
  violation?: string;
  generatedStates?: number;
  distinctStates?: number;
  depth?: number;
  traceLength?: number;
  error?: string;
  prints?: string[];
  milliseconds: number;
}

interface RunOptions {
  isPrinting?: boolean;
  limitMilliseconds?: number;
}

export const checkModel = async (
  specPath: string,
  configPath: string,
  onPrint: (text: string) => void = () => {},
): Promise<ModelOutcome> => {
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
    source,
    config: readFileSync(configPath, "utf8"),
    loadModule: (name) => {
      const modulePath = join(directory, `${name}.tla`);
      return existsSync(modulePath) ? readFileSync(modulePath, "utf8") : undefined;
    },
    loadClass: (name) => {
      const classPath = join(directory, `${name}.class`);
      return existsSync(classPath) ? readFileSync(classPath) : undefined;
    },
    readFile: (path) => {
      const filePath = join(directory, path);
      return existsSync(filePath) ? readFileSync(filePath, "utf8") : undefined;
    },
    onPrint,
    seed: TLC_SEED,
  });
  const milliseconds = Math.round(performance.now() - startedAt);
  if (result.status === "success") {
    return {
      status: result.status,
      generatedStates: result.generatedStates,
      distinctStates: result.distinctStates,
      depth: result.depth,
      milliseconds,
    };
  }
  return {
    status: result.status,
    violation: result.violation?.name,
    traceLength: result.violation?.trace.length,
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

const EXIT_STATUSES: Record<string, string> = {
  "postcondition-violation": "assumption-violation",
};

const getExitStatus = (status: string) => EXIT_STATUSES[status] ?? status;

export const compareOutcome = (
  expected: ExpectedResult,
  actual: ModelOutcome,
): string | undefined => {
  if (expected.status === "error")
    return actual.status === "error" ? undefined : `expected an error, got ${actual.status}`;
  if (getExitStatus(actual.status) !== expected.status) {
    return `expected ${expected.status}, got ${actual.status}${actual.error ? ` (${actual.error})` : ""}`;
  }
  const fields = [
    "violation",
    "generatedStates",
    "distinctStates",
    "depth",
    "traceLength",
  ] as const;
  const differences = fields
    .filter((field) => !(field === "traceLength" && expected.status === "liveness-violation"))
    .filter((field) => expected[field] !== undefined && expected[field] !== actual[field])
    .map((field) => `${field}: expected ${expected[field]}, got ${actual[field]}`);
  return differences.length > 0 ? differences.join("; ") : undefined;
};

// Checks a model in a child process, so a crash or a run past the limit cannot take down the caller.
export const runModel = (specPath: string, configPath: string, options: RunOptions = {}) =>
  new Promise<ModelOutcome | undefined>((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--stack-size=8000",
        "--max-old-space-size=6144",
        import.meta.filename,
        specPath,
        configPath,
        ...(options.isPrinting ? ["--prints"] : []),
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const timer =
      options.limitMilliseconds === undefined
        ? undefined
        : setTimeout(() => child.kill("SIGKILL"), options.limitMilliseconds);
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", () => {
      clearTimeout(timer);
      const output = Buffer.concat(chunks).toString("utf8");
      resolve(output.startsWith("{") ? JSON.parse(output) : undefined);
    });
  });

if (process.argv[1] === import.meta.filename) {
  const startedAt = performance.now();
  const prints: string[] = [];
  const outcome = { value: undefined as ModelOutcome | undefined };
  try {
    outcome.value = await checkModel(process.argv[2], process.argv[3], (text) => prints.push(text));
  } catch (error) {
    outcome.value = getErrorOutcome(error, Math.round(performance.now() - startedAt));
  }
  const isPrinting = process.argv.includes("--prints");
  process.stdout.write(JSON.stringify(isPrinting ? { ...outcome.value, prints } : outcome.value));
}
