import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Measurement {
  milliseconds: number;
  generatedStates: number | undefined;
  distinctStates: number | undefined;
}

const BENCHMARKS_DIRECTORY = join(import.meta.dirname, "../benchmarks");
const CLI_PATH = join(import.meta.dirname, "../dist/cli.js");
const RUNS = Number(process.env.BENCHMARK_RUNS ?? 3);

const jarPath = process.env.TLA2TOOLS_JAR;
if (!jarPath || !existsSync(jarPath)) {
  console.error("Set TLA2TOOLS_JAR to the path of tla2tools.jar");
  process.exit(1);
}
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

const measure = (command: string, args: string[], cwd: string): Measurement => {
  const startedAt = performance.now();
  const result = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const milliseconds = performance.now() - startedAt;
  return { milliseconds, ...parseStatistics(`${result.stdout}${result.stderr}`) };
};

const runTlc = (directory: string, specFile: string) => {
  const metadataDirectory = mkdtempSync(join(tmpdir(), "tla-ts-bench-"));
  const measurement = measure(
    "java",
    [
      "-XX:+UseParallelGC",
      "-Xmx4g",
      "-cp",
      jarPath,
      "tlc2.TLC",
      "-workers",
      "1",
      "-nowarning",
      "-noGenerateSpecTE",
      "-metadir",
      metadataDirectory,
      specFile,
    ],
    directory,
  );
  rmSync(metadataDirectory, { recursive: true, force: true });
  return measurement;
};

const runTlaTs = (directory: string, specFile: string) =>
  measure(process.execPath, ["--max-old-space-size=6144", CLI_PATH, specFile], directory);

const getMedian = (measurements: Measurement[]) =>
  [...measurements].sort((left, right) => left.milliseconds - right.milliseconds)[
    Math.floor(measurements.length / 2)
  ];

const formatSeconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)}s`;

const rows = readdirSync(BENCHMARKS_DIRECTORY)
  .sort()
  .map((name) => {
    const directory = join(BENCHMARKS_DIRECTORY, name);
    const specFile = readdirSync(directory).find((file) => file.endsWith(".tla"));
    if (!specFile) return undefined;
    const tlc = getMedian(Array.from({ length: RUNS }, () => runTlc(directory, specFile)));
    const tlaTs = getMedian(Array.from({ length: RUNS }, () => runTlaTs(directory, specFile)));
    const isMatching =
      tlc.generatedStates === tlaTs.generatedStates && tlc.distinctStates === tlaTs.distinctStates;
    return {
      benchmark: name,
      distinct: tlc.distinctStates ?? 0,
      tlc: formatSeconds(tlc.milliseconds),
      "tla-ts": formatSeconds(tlaTs.milliseconds),
      speedup: `${(tlc.milliseconds / tlaTs.milliseconds).toFixed(2)}x`,
      counts: isMatching
        ? "match"
        : `tlc ${tlc.generatedStates}/${tlc.distinctStates}, tla-ts ${tlaTs.generatedStates}/${tlaTs.distinctStates}`,
    };
  })
  .filter((row) => row !== undefined);

console.log(`Median of ${RUNS} runs, single worker, wall time including process startup`);
console.table(rows);
