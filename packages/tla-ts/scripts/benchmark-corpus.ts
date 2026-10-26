import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONFORMANCE_DIRECTORY, findModels } from "./corpora";

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

const jarPath = process.env.TLA2TOOLS_JAR;
if (!jarPath || !existsSync(jarPath)) {
  console.error("Set TLA2TOOLS_JAR to the path of tla2tools.jar");
  process.exit(1);
}
if (!existsSync(CLI_PATH) || !existsSync(RESULTS_PATH)) {
  console.error("Build the package and run pnpm conformance first");
  process.exit(1);
}

const time = (command: string, args: string[], cwd: string) => {
  const startedAt = performance.now();
  spawnSync(command, args, { cwd, stdio: "ignore", maxBuffer: 64 * 1024 * 1024 });
  return performance.now() - startedAt;
};

const results: ConformanceResult[] = JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
const matching = new Set(
  results
    .filter((result) => result.verdict === "match" && result.expected.status !== "error")
    .map((result) => result.id),
);
const models = findModels().filter((model) => matching.has(model.id));

const timings: Timing[] = models.map((model, index) => {
  const metadataDirectory = mkdtempSync(join(tmpdir(), "tla-ts-corpus-"));
  const tlc = time(
    "java",
    [
      "-XX:+UseParallelGC",
      "-Xmx2g",
      "-cp",
      jarPath,
      "tlc2.TLC",
      "-workers",
      "1",
      "-nowarning",
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
  const tlaTs = time(
    process.execPath,
    ["--max-old-space-size=6144", CLI_PATH, model.specPath, "-config", model.configPath],
    model.directory,
  );
  console.log(
    `[${index + 1}/${models.length}] ${(tlc / tlaTs).toFixed(2)}x  tlc ${Math.round(tlc)}ms  tla-ts ${Math.round(tlaTs)}ms  ${model.id}`,
  );
  return { id: model.id, tlc, tlaTs };
});

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
