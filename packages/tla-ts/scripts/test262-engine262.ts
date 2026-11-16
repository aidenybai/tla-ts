import { fork } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { scheduler } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort, Worker } from "node:worker_threads";
import { CONFORMANCE_DIRECTORY, listFiles } from "./corpora";
import { createRunner, getTestId, TEST262_DIRECTORY, type TestRun } from "./test262-runner";

const RECORD_PATH = join(CONFORMANCE_DIRECTORY, "test262.json");

const TESTS_PER_WORKER = 100;
const WORKER_COUNT = Math.min(4, availableParallelism());
const WORKER_HEAP_MB = 2048;
const WORKER_STACK_MB = 256;
const LOCK_DIRECTORY = join(tmpdir(), "tla-ts-test262.lock");

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const acquireLock = async () => {
  for (;;) {
    try {
      mkdirSync(LOCK_DIRECTORY);
      writeFileSync(join(LOCK_DIRECTORY, "pid"), String(process.pid));
      return;
    } catch {
      const holder = Number(
        readFileSync(join(LOCK_DIRECTORY, "pid"), { encoding: "utf8", flag: "a+" }),
      );
      if (holder && !isAlive(holder)) rmSync(LOCK_DIRECTORY, { recursive: true, force: true });
      else {
        console.error(`Waiting for test262 run ${holder || "(starting)"} to finish`);
        await scheduler.wait(5000);
      }
    }
  }
};

if (!isMainThread) {
  const run = createRunner();
  parentPort?.on("message", (path: string) => parentPort?.postMessage(run(path)));
} else if (process.send) {
  const worker = new Worker(new URL(import.meta.url), {
    resourceLimits: { stackSizeMb: WORKER_STACK_MB, maxOldGenerationSizeMb: WORKER_HEAP_MB },
  });
  worker.on("message", (run: TestRun) => process.send?.(run));
  process.on("message", (path: string) => worker.postMessage(path));
  worker.on("error", (error) => {
    console.error(`worker crashed: ${String(error).split("\n")[0]}`);
    process.exit(1);
  });
  worker.on("exit", (code) => process.exit(code));
} else {
  const args = process.argv.slice(2);
  const isRecorded = args.includes("--record");
  const isVerbose = args.includes("--verbose");
  const prefixes = args.filter((arg) => !arg.startsWith("--"));
  const paths = listFiles(join(TEST262_DIRECTORY, "test"))
    .filter((path) => path.endsWith(".js") && !path.includes("_FIXTURE"))
    .filter((path) => {
      const id = getTestId(path);
      return (
        prefixes.length === 0 ||
        prefixes.some((prefix) => id.startsWith(prefix.replace(/^test\//, "")))
      );
    })
    .sort();
  await acquireLock();
  process.on("exit", () => rmSync(LOCK_DIRECTORY, { recursive: true, force: true }));
  process.on("SIGINT", () => process.exit(130));
  process.on("SIGTERM", () => process.exit(143));
  const runs: TestRun[] = [];
  const report = (run: TestRun) => {
    runs.push(run);
    if (isVerbose || !run.isPassed)
      console.log(
        `${run.isPassed ? "PASS" : "FAIL"} ${run.id}${run.reason ? ` ${run.reason}` : ""}`,
      );
  };
  let nextIndex = 0;
  const drain = async (): Promise<void> => {
    while (nextIndex < paths.length) {
      const host = fork(fileURLToPath(import.meta.url), {
        stdio: ["ignore", "inherit", "pipe", "ipc"],
      });
      let currentPath = "";
      let exitReason = "worker exited";
      let sentCount = 0;
      const send = () => {
        if (nextIndex >= paths.length || sentCount === TESTS_PER_WORKER) return host.kill();
        sentCount++;
        currentPath = paths[nextIndex++];
        host.send(currentPath);
      };
      host.on("message", (run: TestRun) => {
        currentPath = "";
        report(run);
        send();
      });
      host.stderr?.on("data", (data: Buffer) => {
        const line = data
          .toString()
          .split("\n")
          .find((text) => /crashed|FATAL ERROR/.test(text));
        if (line) exitReason = line.trim();
      });
      send();
      await new Promise((resolve) => host.on("exit", resolve));
      if (currentPath !== "") {
        report({
          id: getTestId(currentPath),
          isPassed: false,
          reason: exitReason,
        });
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(WORKER_COUNT, Math.max(paths.length, 1)) }, drain),
  );
  const passed = runs
    .filter((run) => run.isPassed)
    .map((run) => run.id)
    .sort();
  console.log(`${passed.length} of ${runs.length} tests pass`);
  if (isRecorded) {
    writeFileSync(RECORD_PATH, `${JSON.stringify({ total: runs.length, passed }, null, 2)}\n`);
  }
}
