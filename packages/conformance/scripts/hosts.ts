import { spawn } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { SuiteTest, TestContext } from "./test-file";
import { normalizeTranscript } from "./transcript";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");

export const TLC_JAR = join(PACKAGE_DIRECTORY, ".oracles/tla2tools.jar");

// The fixed fingerprint polynomial, seed and liveness schedule make a run with one worker
// deterministic.
const DETERMINISTIC_ARGUMENTS = [
  "-workers",
  "1",
  "-fp",
  "0",
  "-seed",
  "4",
  "-lncheck",
  "final",
  "-noGenerateSpecTE",
];

const TLA_TS = [
  "node",
  "--stack-size=8000",
  "--max-old-space-size=2048",
  join(PACKAGE_DIRECTORY, "../tla-ts/dist/cli.js"),
];

// The command a host runs for each suite.
export interface Host {
  tlc?: string[];
}

export const HOSTS: Record<string, Host> = {
  tlc: {
    tlc: [
      "java",
      "-XX:+UseSerialGC",
      "-XX:TieredStopAtLevel=1",
      "-Xmx1g",
      "-cp",
      TLC_JAR,
      "tlc2.TLC",
    ],
  },
  "tla-ts": { tlc: TLA_TS },
};

// A host given as a command runs every suite the filters select.
export const getHost = (name: string): Host => {
  const host = HOSTS[name];
  if (!host) return { tlc: name.split(" ") };
  if (host.tlc === HOSTS.tlc.tlc && !existsSync(TLC_JAR)) {
    console.error("Run `pnpm fetch-tlc` first");
    process.exit(1);
  }
  return host;
};

export const getSuiteCommand = (host: Host, test: SuiteTest) =>
  test.suite === "tlc" ? host.tlc : undefined;

export interface HostResult {
  exit: number;
  transcript: string;
}

const copyIncludes = (test: SuiteTest, directory: string) =>
  (test.metadata.includes ?? []).forEach((include) => {
    const target = join(directory, include);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(dirname(test.path), include), target, { recursive: true });
  });

interface Run {
  command: string[];
  directory: string;
  limitMilliseconds?: number;
}

// The process's exit status and everything it printed, stdout first.
const spawnRun = (run: Run) =>
  new Promise<{ exit: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(run.command[0], run.command.slice(1), {
      cwd: run.directory,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const limit = run.limitMilliseconds
      ? setTimeout(() => child.kill("SIGKILL"), run.limitMilliseconds)
      : undefined;
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("close", (exitCode, signal) => {
      clearTimeout(limit);
      resolve({
        exit: exitCode ?? (signal ? -1 : 0),
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });

const runTlc = async (
  command: string[],
  test: SuiteTest,
  context: TestContext,
  directory: string,
  limitMilliseconds?: number,
) => {
  // TLCExt!AssertError compares against the message that -tool wraps, so a test that uses it must
  // run without -tool, and only its exit status can be compared.
  const isExitOnly = test.metadata.flags?.includes("exit-only") ?? false;
  const configFile = `${test.moduleName}.cfg`;
  writeFileSync(join(directory, test.fileName), context.source);
  writeFileSync(join(directory, configFile), context.config);
  const result = await spawnRun({
    command: [
      ...command,
      ...(isExitOnly ? [] : ["-tool"]),
      ...DETERMINISTIC_ARGUMENTS,
      "-metadir",
      join(directory, ".meta"),
      ...(test.metadata.args ?? []),
      ...(test.metadata.args?.includes("-config") ? [] : ["-config", configFile]),
      test.fileName,
    ],
    directory,
    limitMilliseconds,
  });
  return {
    exit: result.exit,
    transcript: isExitOnly
      ? ""
      : normalizeTranscript(result.stdout, {
          directory,
          isStateSpaceRelevant: context.name === "model",
        }),
  };
};

// Only an importer sets a limit, to leave out models too large for the suite.
export const runTest = async (
  host: Host,
  test: SuiteTest,
  context: TestContext,
  limitMilliseconds?: number,
): Promise<HostResult> => {
  const command = getSuiteCommand(host, test);
  if (!command) throw new Error(`The host has no command for ${test.id}`);
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "conformance-")));
  copyIncludes(test, directory);
  const result = await runTlc(command, test, context, directory, limitMilliseconds);
  rmSync(directory, { recursive: true, force: true });
  return result;
};

export const runPool = async <Item>(
  items: Item[],
  concurrency: number,
  work: (item: Item) => Promise<void>,
) => {
  const queue = { next: 0 };
  const runWorker = async () => {
    while (queue.next < items.length) await work(items[queue.next++]);
  };
  await Promise.all(Array.from({ length: concurrency }, runWorker));
};
