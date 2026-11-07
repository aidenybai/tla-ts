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
import { getBackendInput, type SuiteTest, type TestContext } from "./test-file";
import {
  getBackend,
  getBackendOracleCommand,
  getBackendVerdict,
  getEncodings,
  getTlapmArguments,
  normalizeTlapmTranscript,
  TLAPM_BINARY,
} from "./tlapm";
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

// The command a host runs for each suite. A backend command takes the backend's name and its input
// file, and prints the verdict as getBackendVerdict reduces it.
export interface Host {
  tlc?: string[];
  tlapm?: string[];
  backend?: string[];
}

const BACKEND_ORACLE = ["oracle"];

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
  tlapm: { tlapm: [TLAPM_BINARY], backend: BACKEND_ORACLE },
  "tla-ts": {
    tlc: TLA_TS,
    tlapm: [...TLA_TS, "tlapm"],
    backend: ["node", join(PACKAGE_DIRECTORY, ".scripts/tla-ts-backend.js")],
  },
};

// A host given as a command runs every suite the filters select.
export const getHost = (name: string): Host => {
  const host = HOSTS[name];
  if (!host) {
    const command = name.split(" ");
    return { tlc: command, tlapm: command, backend: command };
  }
  const missing = [
    ...(host.tlc === HOSTS.tlc.tlc && !existsSync(TLC_JAR) ? ["`pnpm fetch-tlc`"] : []),
    ...(host.tlapm && host.tlapm === HOSTS.tlapm.tlapm && !existsSync(TLAPM_BINARY)
      ? ["`pnpm fetch-tlapm`"]
      : []),
  ];
  if (missing.length > 0) {
    console.error(`Run ${missing.join(" and ")} first`);
    process.exit(1);
  }
  return host;
};

export const getSuiteCommand = (host: Host, test: SuiteTest) =>
  test.suite === "tlapm" ? (getBackend(test.path) ? host.backend : host.tlapm) : host.tlc;

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

// tlapm writes the toolbox protocol to stderr and its log to both streams.
const runTlapm = async (command: string[], test: SuiteTest, directory: string) => {
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
  });
  const transcript = normalizeTlapmTranscript(`${result.stdout}\n${result.stderr}`, directory);
  const encodings =
    mode === "encoding" && existsSync(join(cacheDirectory, `${test.moduleName}.tlaps`))
      ? getEncodings(cacheDirectory, test.moduleName)
      : "";
  return {
    exit: result.exit,
    transcript: encodings ? `${transcript}\n\n${encodings}` : transcript,
  };
};

const runBackend = async (command: string[], test: SuiteTest, directory: string) => {
  const backend = getBackend(test.path);
  writeFileSync(join(directory, test.fileName), getBackendInput(test));
  const isOracle = command === HOSTS.tlapm.backend;
  const result = await spawnRun({
    command: isOracle
      ? getBackendOracleCommand(backend, join(directory, test.fileName))
      : [...command, backend, test.fileName],
    directory,
  });
  return {
    exit: 0,
    transcript: isOracle
      ? getBackendVerdict(backend, `${result.stdout}${result.stderr}`, result.exit)
      : result.stdout.trimEnd(),
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
  const result =
    test.suite === "tlc"
      ? await runTlc(command, test, context, directory, limitMilliseconds)
      : getBackend(test.path)
        ? await runBackend(command, test, directory)
        : await runTlapm(command, test, directory);
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
