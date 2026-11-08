import { spawn, spawnSync } from "node:child_process";
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

export interface Host {
  tlc?: string[];
}

export const HOSTS: Record<string, Host> = {
  tlc: {
    tlc: [
      "java",
      "-XX:+UseSerialGC",
      "-XX:TieredStopAtLevel=1",
      "-XX:-UsePerfData",
      "-Xmx1g",
      // The recordings come from macOS arm64, whose default thread stack is 2 MB.
      "-Xss2m",
      "-cp",
      TLC_JAR,
      "tlc2.TLC",
    ],
  },
  "tla-ts": { tlc: TLA_TS },
};

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
  exceeded?: "time" | "memory";
}

export interface Limits {
  milliseconds?: number;
  memoryBytes?: number;
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
  limits: Limits;
}

// Not the kill command: procps reads `kill -9 -<group>` as `kill -9 -1`, which kills every process
// the user owns.
const killGroup = (groupId: number | undefined) => {
  if (groupId === undefined) return;
  try {
    process.kill(-groupId, "SIGKILL");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ESRCH" && code !== "EPERM") throw error;
  }
};

const getGroupMemoryBytes = (groupId: number) =>
  spawnSync("ps", ["-Ao", "pgid=,rss="], { encoding: "utf8" })
    .stdout.split("\n")
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter((fields) => fields[0] === groupId)
    .reduce((total, fields) => total + fields[1] * 1024, 0);

const spawnRun = (run: Run) =>
  new Promise<{ exit: number; stdout: string; stderr: string; exceeded?: "time" | "memory" }>(
    (resolve) => {
      const child = spawn(run.command[0], run.command.slice(1), {
        cwd: run.directory,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      });
      const groupId = child.pid;
      const state: { exceeded?: "time" | "memory" } = {};
      const stop = (reason: "time" | "memory") => {
        state.exceeded ??= reason;
        killGroup(groupId);
      };
      const timer = run.limits.milliseconds
        ? setTimeout(() => stop("time"), run.limits.milliseconds)
        : undefined;
      const memoryBytes = run.limits.memoryBytes;
      const poll = memoryBytes
        ? setInterval(() => {
            if (groupId && getGroupMemoryBytes(groupId) > memoryBytes) stop("memory");
          }, 1000)
        : undefined;
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
      child.on("exit", () => killGroup(groupId));
      child.on("close", (exitCode, signal) => {
        clearTimeout(timer);
        clearInterval(poll);
        resolve({
          exit: exitCode ?? (signal ? -1 : 0),
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8"),
          ...(state.exceeded ? { exceeded: state.exceeded } : {}),
        });
      });
    },
  );

const runTlc = async (
  command: string[],
  test: SuiteTest,
  context: TestContext,
  directory: string,
  limits: Limits,
) => {
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
    limits,
  });
  return {
    exit: result.exit,
    exceeded: result.exceeded,
    transcript: isExitOnly
      ? ""
      : normalizeTranscript(result.stdout, {
          directory,
          isStateSpaceRelevant: context.name === "model",
        }),
  };
};

export const runTest = async (
  host: Host,
  test: SuiteTest,
  context: TestContext,
  limits: Limits = {},
): Promise<HostResult> => {
  const command = getSuiteCommand(host, test);
  if (!command) throw new Error(`The host has no command for ${test.id}`);
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "conformance-")));
  copyIncludes(test, directory);
  const result = await runTlc(command, test, context, directory, limits);
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
