import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  CORPORA_DIRECTORY,
  EXPECTED_PATH,
  findModels,
  getToolPath,
  LIBRARY_PATH,
  linkLibraryModules,
  runConcurrently,
  runProcess,
  sortById,
  TLC_SEED,
  writeResults,
  type CorpusModel,
} from "./corpora";

export interface ExpectedResult {
  id: string;
  status: string;
  violation?: string;
  generatedStates?: number;
  distinctStates?: number;
  depth?: number;
  traceLength?: number;
  tlcMilliseconds: number;
}

interface ManifestModel {
  path: string;
  runtime: string;
  mode: string;
}

const MAXIMUM_RECORDED_RUNTIME_SECONDS = 60;
const CONCURRENCY = 2;

const jarPath = getToolPath("TLA2TOOLS_JAR", "tla2tools.jar");

const getSeconds = (runtime: string) =>
  runtime.split(":").reduce((total, part) => total * 60 + Number(part), 0);

const isRecordable = (model: CorpusModel) => {
  if (!model.id.startsWith("examples/")) return true;
  const root = join(CORPORA_DIRECTORY, "examples");
  const manifestPath = join(dirname(model.specPath), "manifest.json");
  if (!existsSync(manifestPath)) return false;
  const manifest: { modules: { models: ManifestModel[] }[] } = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  );
  const entry = manifest.modules
    .flatMap((module) => module.models)
    .find((candidate) => candidate.path === relative(root, model.configPath));
  return (
    entry !== undefined &&
    entry.mode === "exhaustive search" &&
    getSeconds(entry.runtime) <= MAXIMUM_RECORDED_RUNTIME_SECONDS
  );
};

const getStatus = (exitCode: number | null, output: string) => {
  if (exitCode === null) return "killed";
  if (exitCode === 0) return "success";
  if (exitCode === 10) return "assumption-violation";
  if (exitCode === 11) return "deadlock";
  if (exitCode === 12)
    return /Invariant \S+ is violated/.test(output) ? "invariant-violation" : "property-violation";
  if (exitCode === 13) return "liveness-violation";
  return "error";
};

const getFirstTraceLength = (output: string) => {
  const numbers = [...output.matchAll(/^State (\d+):/gm)].map((match) => Number(match[1]));
  const restart = numbers.indexOf(1, 1);
  return restart === -1 ? numbers.length : restart;
};

const runTlc = async (model: CorpusModel): Promise<ExpectedResult> => {
  const metadataDirectory = mkdtempSync(join(tmpdir(), "tla-ts-tlc-"));
  const startedAt = performance.now();
  const run = await runProcess(
    "java",
    [
      "-XX:+UseParallelGC",
      "-Xmx768m",
      `-DTLA-Library=${LIBRARY_PATH}`,
      "-cp",
      jarPath,
      "tlc2.TLC",
      "-workers",
      "1",
      "-nowarning",
      "-seed",
      String(TLC_SEED),
      "-fp",
      "0",
      "-lncheck",
      "final",
      "-noGenerateSpecTE",
      "-metadir",
      metadataDirectory,
      "-config",
      model.configPath,
      model.specPath,
    ],
    model.directory,
  );
  rmSync(metadataDirectory, { recursive: true, force: true });
  const status = getStatus(run.exitCode, run.output);
  const statistics = [
    ...run.output.matchAll(/(\d+) states generated, (\d+) distinct states found/g),
  ].at(-1);
  const depth = /The depth of the complete state graph search is (\d+)/.exec(run.output);
  const violation = /(?:Invariant|property) (\S+) is violated/.exec(run.output);
  return {
    id: model.id,
    status,
    ...(violation ? { violation: violation[1] } : {}),
    ...(status === "success" && statistics
      ? { generatedStates: Number(statistics[1]), distinctStates: Number(statistics[2]) }
      : {}),
    ...(status === "success" && depth ? { depth: Number(depth[1]) } : {}),
    ...(status !== "success" && status !== "error"
      ? {
          traceLength: run.output.includes("is violated by the initial state")
            ? 1
            : getFirstTraceLength(run.output),
        }
      : {}),
    tlcMilliseconds: Math.round(performance.now() - startedAt),
  };
};

linkLibraryModules();
const models = findModels().filter(isRecordable);
const results: ExpectedResult[] = [];
await runConcurrently(models, CONCURRENCY, async (model) => {
  const result = await runTlc(model);
  results.push(result);
  console.log(`[${results.length}/${models.length}] ${result.status.padEnd(20)} ${model.id}`);
});
writeResults(EXPECTED_PATH, sortById(results));
console.log(`Wrote ${results.length} TLC results to ${EXPECTED_PATH}`);
