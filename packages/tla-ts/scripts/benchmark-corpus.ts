import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONFORMANCE_DIRECTORY, findModels, getTlcArgs, getToolPath, runProcess } from "./corpora";

interface ConformanceResult {
  id: string;
  verdict: string;
  expected: { status: string };
}

interface Timing {
  id: string;
  tlc: number;
  tlaTs: number;
}

const CLI_PATH = join(import.meta.dirname, "../dist/cli.js");
const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".results.json");

const jarPath = getToolPath("TLA2TOOLS_JAR", "tla2tools.jar");
if (!existsSync(CLI_PATH) || !existsSync(RESULTS_PATH)) {
  console.error("Build the package and run pnpm conformance first");
  process.exit(1);
}

const results: ConformanceResult[] = JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
const matching = new Set(
  results
    .filter((result) => result.verdict === "match" && result.expected.status !== "error")
    .map((result) => result.id),
);
const models = findModels().filter((model) => matching.has(model.id));

const time = async (command: string, args: string[], directory: string) =>
  (await runProcess(command, args, directory, false)).milliseconds;

const timings: Timing[] = [];
for (const model of models) {
  const metadataDirectory = mkdtempSync(join(tmpdir(), "tla-ts-corpus-"));
  const tlc = await time(
    "java",
    getTlcArgs({
      jarPath,
      maximumHeap: "2g",
      tlcArgs: ["-seed", "0", "-workers", "1", "-nowarning"],
      metadataDirectory,
      specArgs: ["-config", model.configPath, model.specPath],
    }),
    model.directory,
  );
  rmSync(metadataDirectory, { recursive: true, force: true });
  const tlaTs = await time(
    process.execPath,
    ["--max-old-space-size=6144", CLI_PATH, model.specPath, "-config", model.configPath],
    model.directory,
  );
  timings.push({ id: model.id, tlc, tlaTs });
  console.log(
    `[${timings.length}/${models.length}] ${(tlc / tlaTs).toFixed(2)}x  tlc ${Math.round(tlc)}ms  tla-ts ${Math.round(tlaTs)}ms  ${model.id}`,
  );
}

const totalTlc = timings.reduce((sum, timing) => sum + timing.tlc, 0);
const totalTlaTs = timings.reduce((sum, timing) => sum + timing.tlaTs, 0);
const ratios = timings
  .map((timing) => timing.tlc / timing.tlaTs)
  .sort((left, right) => left - right);
const geometricMean = Math.exp(
  ratios.reduce((sum, ratio) => sum + Math.log(ratio), 0) / ratios.length,
);
const slower = timings.filter((timing) => timing.tlaTs > timing.tlc);

console.log(`\n${timings.length} models where tla-ts matches TLC, single worker, wall time`);
console.log(
  `total: TLC ${(totalTlc / 1000).toFixed(1)}s, tla-ts ${(totalTlaTs / 1000).toFixed(1)}s (${(totalTlc / totalTlaTs).toFixed(2)}x)`,
);
console.log(
  `speedup: geometric mean ${geometricMean.toFixed(2)}x, median ${ratios[Math.floor(ratios.length / 2)].toFixed(2)}x, slowest ${ratios[0].toFixed(2)}x`,
);
console.log(`tla-ts slower than TLC on ${slower.length} models`);
slower
  .sort((left, right) => right.tlaTs / right.tlc - left.tlaTs / left.tlc)
  .slice(0, 10)
  .forEach((timing) => console.log(`  ${(timing.tlc / timing.tlaTs).toFixed(2)}x  ${timing.id}`));
