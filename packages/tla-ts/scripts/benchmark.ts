import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getTlcArgs, getToolPath, runProcess } from "./corpora";

interface Measurement {
  milliseconds: number;
  generatedStates: number | undefined;
  distinctStates: number | undefined;
}

const BENCHMARKS_DIRECTORY = join(import.meta.dirname, "../benchmarks");
const CLI_PATH = join(import.meta.dirname, "../dist/cli.js");
const RUNS = Number(process.env.BENCHMARK_RUNS ?? 3);

const jarPath = getToolPath("TLA2TOOLS_JAR", "tla2tools.jar");
if (!existsSync(CLI_PATH)) {
  console.error("Build the package first with pnpm build");
  process.exit(1);
}

const parseStatistics = (output: string) => {
  const statistics = [
    ...output.matchAll(/(\d+) states generated, (\d+) distinct states found/g),
  ].at(-1);
  return {
    generatedStates: statistics ? Number(statistics[1]) : undefined,
    distinctStates: statistics ? Number(statistics[2]) : undefined,
  };
};

const measure = async (command: string, args: string[], cwd: string): Promise<Measurement> => {
  const run = await runProcess(command, args, cwd);
  return { milliseconds: run.milliseconds, ...parseStatistics(`${run.stdout}${run.stderr}`) };
};

const runTlc = async (directory: string, specFile: string) => {
  const metadataDirectory = mkdtempSync(join(tmpdir(), "tla-ts-bench-"));
  const measurement = await measure(
    "java",
    getTlcArgs({
      jarPath,
      maximumHeap: "4g",
      tlcArgs: ["-workers", "1", "-nowarning"],
      metadataDirectory,
      specArgs: [specFile],
    }),
    directory,
  );
  rmSync(metadataDirectory, { recursive: true, force: true });
  return measurement;
};

const runTlaTs = (directory: string, specFile: string) =>
  measure(process.execPath, ["--max-old-space-size=6144", CLI_PATH, specFile], directory);

const getMedianRun = async (run: () => Promise<Measurement>) => {
  const measurements: Measurement[] = [];
  for (let count = 0; count < RUNS; count++) measurements.push(await run());
  return measurements.sort((left, right) => left.milliseconds - right.milliseconds)[
    Math.floor(measurements.length / 2)
  ];
};

const formatSeconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)}s`;

const rows = [];
for (const name of readdirSync(BENCHMARKS_DIRECTORY).sort()) {
  const directory = join(BENCHMARKS_DIRECTORY, name);
  const specFile = readdirSync(directory).find((file) => file.endsWith(".tla"));
  if (!specFile) continue;
  const tlc = await getMedianRun(() => runTlc(directory, specFile));
  const tlaTs = await getMedianRun(() => runTlaTs(directory, specFile));
  const isMatching =
    tlc.generatedStates === tlaTs.generatedStates && tlc.distinctStates === tlaTs.distinctStates;
  rows.push({
    benchmark: name,
    distinct: tlc.distinctStates ?? 0,
    tlc: formatSeconds(tlc.milliseconds),
    "tla-ts": formatSeconds(tlaTs.milliseconds),
    speedup: `${(tlc.milliseconds / tlaTs.milliseconds).toFixed(2)}x`,
    counts: isMatching
      ? "match"
      : `tlc ${tlc.generatedStates}/${tlc.distinctStates}, tla-ts ${tlaTs.generatedStates}/${tlaTs.distinctStates}`,
  });
}

console.log(`Median of ${RUNS} runs, single worker, wall time including process startup`);
console.table(rows);
