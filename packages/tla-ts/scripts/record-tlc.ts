import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  CORPORA_DIRECTORY,
  EXPECTED_PATH,
  findModels,
  TLC_SEED,
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

const jarPath = process.env.TLA2TOOLS_JAR;
if (!jarPath || !existsSync(jarPath)) {
  console.error("Set TLA2TOOLS_JAR to the path of tla2tools.jar");
  process.exit(1);
}

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

const runTlc = (model: CorpusModel) =>
  new Promise<ExpectedResult>((resolve) => {
    const metadataDirectory = mkdtempSync(join(tmpdir(), "tla-ts-tlc-"));
    const startedAt = performance.now();
    const child = spawn(
      "java",
      [
        "-XX:+UseParallelGC",
        "-Xmx768m",
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
      { cwd: model.directory },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", (exitCode) => {
      rmSync(metadataDirectory, { recursive: true, force: true });
      const output = Buffer.concat(chunks).toString("utf8");
      const status = getStatus(exitCode, output);
      const statistics = [
        ...output.matchAll(/(\d+) states generated, (\d+) distinct states found/g),
      ].at(-1);
      const depth = /The depth of the complete state graph search is (\d+)/.exec(output);
      const violation = /(?:Invariant|property) (\S+) is violated/.exec(output);
      resolve({
        id: model.id,
        status,
        ...(violation ? { violation: violation[1] } : {}),
        ...(status === "success" && statistics
          ? { generatedStates: Number(statistics[1]), distinctStates: Number(statistics[2]) }
          : {}),
        ...(status === "success" && depth ? { depth: Number(depth[1]) } : {}),
        ...(status !== "success" && status !== "error"
          ? {
              traceLength: output.includes("is violated by the initial state")
                ? 1
                : [...output.matchAll(/^State \d+:/gm)].length,
            }
          : {}),
        tlcMilliseconds: Math.round(performance.now() - startedAt),
      });
    });
  });

const models = findModels().filter(isRecordable);
const results: ExpectedResult[] = [];
const queue = { next: 0 };

const work = async () => {
  while (queue.next < models.length) {
    const model = models[queue.next++];
    const result = await runTlc(model);
    results.push(result);
    console.log(`[${results.length}/${models.length}] ${result.status.padEnd(20)} ${model.id}`);
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, work));
results.sort((left, right) => (left.id < right.id ? -1 : 1));
writeFileSync(EXPECTED_PATH, `${JSON.stringify(results, null, 2)}\n`);
console.log(`Wrote ${results.length} TLC results to ${EXPECTED_PATH}`);
