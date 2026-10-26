import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { CORPORA_DIRECTORY, EXPECTED_PATH, findModels, type CorpusModel } from "./corpora";
import { getJarPath, runTlc, type ExpectedResult } from "./tlc";

interface ManifestModel {
  path: string;
  runtime: string;
  mode: string;
}

const MAXIMUM_RECORDED_RUNTIME_SECONDS = 60;
const CONCURRENCY = 2;

const jarPath = getJarPath();

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

const models = findModels().filter(isRecordable);
const results: ExpectedResult[] = [];
const queue = { next: 0 };

const work = async () => {
  while (queue.next < models.length) {
    const model = models[queue.next++];
    const { result } = await runTlc(model, jarPath);
    results.push(result);
    console.log(`[${results.length}/${models.length}] ${result.status.padEnd(20)} ${model.id}`);
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, work));
results.sort((left, right) => (left.id < right.id ? -1 : 1));
writeFileSync(EXPECTED_PATH, `${JSON.stringify(results, null, 2)}\n`);
console.log(`Wrote ${results.length} TLC results to ${EXPECTED_PATH}`);
