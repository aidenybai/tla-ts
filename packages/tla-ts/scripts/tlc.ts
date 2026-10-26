import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TLC_SEED, type CorpusModel } from "./corpora";

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

export interface TlcRun {
  result: ExpectedResult;
  output: string;
}

export const getJarPath = () => {
  const jarPath = process.env.TLA2TOOLS_JAR;
  if (!jarPath || !existsSync(jarPath)) {
    console.error("Set TLA2TOOLS_JAR to the path of tla2tools.jar");
    process.exit(1);
  }
  return jarPath;
};

const DEPTH_PREFIX = "The depth of the complete state graph search is ";

// The name of the invariant or property in TLC's "Invariant Inv is violated" line.
const getViolation = (lines: string[]) => {
  for (const line of lines) {
    const words = line.split(" ");
    const index = words.findIndex(
      (word, position) =>
        (word === "Invariant" || word === "property") &&
        words[position + 2] === "is" &&
        words[position + 3]?.startsWith("violated"),
    );
    if (index !== -1) return { name: words[index + 1], isInvariant: words[index] === "Invariant" };
  }
  return undefined;
};

const getStateNumber = (line: string) => {
  const colon = line.indexOf(":");
  const number = Number(line.slice(6, colon));
  return line.startsWith("State ") && colon > 6 && Number.isInteger(number) ? number : undefined;
};

// TLC can print a second counterexample, such as a liveness one after a deadlock, so count the
// states up to the first restart at state 1.
const getFirstTraceLength = (lines: string[]) => {
  const numbers = lines.map(getStateNumber).filter((number) => number !== undefined);
  const restart = numbers.indexOf(1, 1);
  return restart === -1 ? numbers.length : restart;
};

const getStatus = (exitCode: number | null, isInvariant: boolean) => {
  if (exitCode === null) return "killed";
  if (exitCode === 0) return "success";
  if (exitCode === 10) return "assumption-violation";
  if (exitCode === 11) return "deadlock";
  if (exitCode === 12) return isInvariant ? "invariant-violation" : "property-violation";
  if (exitCode === 13) return "liveness-violation";
  return "error";
};

export const runTlc = (model: CorpusModel, jarPath: string) =>
  new Promise<TlcRun>((resolve) => {
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
      const lines = output.split("\n");
      const violation = getViolation(lines);
      const status = getStatus(exitCode, violation?.isInvariant ?? false);
      const statistics = lines
        .findLast(
          (line) => line.includes(" states generated, ") && line[0] >= "0" && line[0] <= "9",
        )
        ?.split(" ");
      const depth = lines.find((line) => line.startsWith(DEPTH_PREFIX));
      const result: ExpectedResult = {
        id: model.id,
        status,
        ...(violation ? { violation: violation.name } : {}),
        ...(status === "success" && statistics
          ? { generatedStates: Number(statistics[0]), distinctStates: Number(statistics[3]) }
          : {}),
        ...(status === "success" && depth
          ? { depth: Number(depth.slice(DEPTH_PREFIX.length, -1)) }
          : {}),
        ...(status !== "success" && status !== "error"
          ? {
              traceLength: output.includes("is violated by the initial state")
                ? 1
                : getFirstTraceLength(lines),
            }
          : {}),
        tlcMilliseconds: Math.round(performance.now() - startedAt),
      };
      resolve({ result, output });
    });
  });
