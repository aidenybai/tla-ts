import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, join } from "node:path";
import { getBackendInput, type SuiteTest, type TestContext } from "./test-file";
import {
  getBackend,
  getBackendOracleCommand,
  getBackendVerdict,
  getEncodings,
  getTlapmArguments,
  isSmtScript,
  normalizeTlapmTranscript,
  TLAPM_BINARY,
} from "./tlapm";
import { normalizeFile, normalizeTranscript } from "./transcript";
import { getValueFileText } from "./value-file";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");

export const TLC_JAR = join(PACKAGE_DIRECTORY, ".oracles/tla2tools.jar");

export const WORKERS = Number(
  process.env.CONFORMANCE_WORKERS ?? Math.min(4, availableParallelism()),
);

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

const TLA_TS_CLI = join(PACKAGE_DIRECTORY, "../tla-ts/dist/cli.js");

const TLA_TS = ["node", "--stack-size=8000", "--max-old-space-size=2048", TLA_TS_CLI];

const SETUP_COMMANDS = new Map([
  [TLC_JAR, "pnpm --filter @tla-ts/conformance fetch-tlc"],
  [TLAPM_BINARY, "pnpm --filter @tla-ts/conformance fetch-tlapm"],
  [TLA_TS_CLI, "pnpm --filter tla-ts build"],
]);

export class MissingHostFileError extends Error {
  constructor(path: string, command: string | undefined) {
    super(command ? `${path} doesn't exist. Run \`${command}\` first.` : `${path} doesn't exist.`);
    this.name = "MissingHostFileError";
  }
}

export interface Host {
  tlc?: string[];
  tlapm?: string[];
  // The oracle of a backend is that backend's own command.
  backend?: string[] | "oracle";
}

export const HOSTS = new Map<string, Host>([
  [
    "tlc",
    {
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
  ],
  ["tlapm", { tlapm: [TLAPM_BINARY], backend: "oracle" }],
  [
    "tla-ts",
    {
      tlc: TLA_TS,
      tlapm: [...TLA_TS, "tlapm"],
      backend: ["node", join(PACKAGE_DIRECTORY, ".scripts/tla-ts-backend.js")],
    },
  ],
]);

export class UnknownHostError extends Error {
  constructor(name: string) {
    super(
      `Unknown host "${name}": it names none of ${[...HOSTS.keys()].join(", ")} and no program on PATH.`,
    );
    this.name = "UnknownHostError";
  }
}

const QUOTED = /"([^"]*)"|'([^']*)'/g;
const ARGUMENT = /(?:"[^"]*"|'[^']*'|[^\s"'])+/g;

export const getHost = (name: string): Host => {
  const command = (name.match(ARGUMENT) ?? []).map((part) => part.replace(QUOTED, "$1$2"));
  const namedHost = HOSTS.get(name);
  const isProgramFound =
    command.length > 0 &&
    (isAbsolute(command[0]) ||
      (process.env.PATH ?? "")
        .split(delimiter)
        .some((directory) => existsSync(join(directory, command[0]))));
  if (!namedHost && !isProgramFound) throw new UnknownHostError(name);
  const host = namedHost ?? { tlc: command, tlapm: command, backend: command };
  const missing = [host.tlc, host.tlapm, host.backend]
    .flatMap((hostCommand) => (Array.isArray(hostCommand) ? hostCommand : []))
    .find((argument) => isAbsolute(argument) && !existsSync(argument));
  if (missing !== undefined) throw new MissingHostFileError(missing, SETUP_COMMANDS.get(missing));
  return host;
};

export const getSuiteCommand = (host: Host, test: SuiteTest) => host[test.kind];

export const CRASH_EXIT = -1;

export interface HostResult {
  exit: number;
  transcript: string;
  exceeded?: "time" | "memory";
  files?: Record<string, string | null>;
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

// Not the kill command: procps reads `kill -9 -<group>` as `kill -9 -1`, every process of the user.
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
      let exceeded: "time" | "memory" | undefined;
      const stop = (reason: "time" | "memory") => {
        exceeded ??= reason;
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
          exit: exitCode ?? (signal ? CRASH_EXIT : 0),
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8"),
          exceeded,
        });
      });
    },
  );

const readOutputFile = (directory: string, path: string) => {
  const file = join(directory, path);
  if (!existsSync(file)) return null;
  return path.endsWith(".bin")
    ? getValueFileText(readFileSync(file))
    : normalizeFile(readFileSync(file, "utf8"), directory);
};

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
  // Java TLC makes a tlc-<random> directory in java.io.tmpdir on every run and never removes it.
  const javaDirectory = join(directory, ".java");
  const isJava = basename(command[0]) === "java";
  if (isJava) mkdirSync(javaDirectory);
  const result = await spawnRun({
    command: [
      command[0],
      ...(isJava ? [`-Djava.io.tmpdir=${javaDirectory}`] : []),
      ...command
        .slice(1)
        .map((argument) =>
          argument === "-Xss2m" && test.metadata.stack ? `-Xss${test.metadata.stack}` : argument,
        ),
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
  const files = test.metadata.files;
  return {
    exit: result.exit,
    exceeded: result.exceeded,
    transcript: isExitOnly
      ? ""
      : normalizeTranscript(result.stdout, {
          directory,
          isStateSpaceRelevant: context.name === "model",
        }),
    ...(files
      ? {
          files: Object.fromEntries(files.map((path) => [path, readOutputFile(directory, path)])),
        }
      : {}),
  };
};

const runTlapm = async (command: string[], test: SuiteTest, directory: string, limits: Limits) => {
  const cacheDirectory = join(directory, ".tlacache");
  const mode = test.metadata.mode ?? "proof";
  writeFileSync(join(directory, test.fileName), test.source);
  const result = await spawnRun({
    command: [
      ...command,
      ...getTlapmArguments(mode, cacheDirectory),
      ...(test.metadata.args ?? []),
      test.fileName,
    ],
    directory,
    limits,
  });
  const transcript = normalizeTlapmTranscript(`${result.stdout}\n${result.stderr}`, directory);
  const encodings =
    mode === "encoding" && existsSync(join(cacheDirectory, `${test.moduleName}.tlaps`))
      ? getEncodings(cacheDirectory, test.moduleName)
      : "";
  return {
    exit: result.exit,
    exceeded: result.exceeded,
    transcript: encodings ? `${transcript}\n\n${encodings}` : transcript,
  };
};

const runBackend = async (
  command: string[] | "oracle",
  test: SuiteTest,
  directory: string,
  limits: Limits,
) => {
  const backend = getBackend(test.path);
  writeFileSync(join(directory, test.fileName), getBackendInput(test));
  const result = await spawnRun({
    command:
      command === "oracle"
        ? getBackendOracleCommand(backend, join(directory, test.fileName))
        : [...command, backend, test.fileName],
    directory,
    limits,
  });
  return {
    // The verdict that the oracle's transcript gives covers its exit status.
    exit: result.exceeded ? CRASH_EXIT : command === "oracle" ? 0 : result.exit,
    exceeded: result.exceeded,
    transcript:
      command !== "oracle"
        ? result.stdout.trimEnd()
        : isSmtScript(test.path)
          ? `${result.stdout}${result.stderr}`.trimEnd()
          : getBackendVerdict(backend, `${result.stdout}${result.stderr}`, result.exit),
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
  try {
    copyIncludes(test, directory);
    return test.kind === "backend" || command === "oracle"
      ? await runBackend(command, test, directory, limits)
      : test.kind === "tlc"
        ? await runTlc(command, test, context, directory, limits)
        : await runTlapm(command, test, directory, limits);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

export const createProgress = (interval: number) => {
  let nextCount = interval;
  return (count: number) => {
    if (count < nextCount) return false;
    nextCount = count - (count % interval) + interval;
    return true;
  };
};

export const runPool = async <Item>(
  items: Item[],
  concurrency: number,
  work: (item: Item) => Promise<void>,
) => {
  let nextIndex = 0;
  const runWorker = async () => {
    while (nextIndex < items.length) await work(items[nextIndex++]);
  };
  await Promise.all(Array.from({ length: concurrency }, runWorker));
};
