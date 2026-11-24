import { parentPort, resourceLimits, Worker, workerData } from "node:worker_threads";
import { getErrorExitCode, TlaHeapLimitError } from "../errors";
import { EXIT_STATUS } from "../exit-codes";
import { CHECK_STACK_MB } from "../worker";
import type { SharedProgram } from "./typescript";

// The files of a run with -shared that one worker checks: count of them, from the one at first,
// with their shared program, which the run compiled, where they have more than one TypeScript file.
export interface SharedGroup {
  first: number;
  count: number;
  program?: Exclude<SharedProgram, { kind: "oversize" }>;
}

// What a worker that checks a group reports: the output of its checks and their exit codes.
interface GroupReport {
  output: { isError: boolean; text: string }[];
  exitCodes: number[];
}

const isGroup = (value: unknown): value is SharedGroup =>
  typeof value === "object" &&
  value !== null &&
  typeof Reflect.get(value, "first") === "number" &&
  typeof Reflect.get(value, "count") === "number";

// The group that this thread checks, where it is a worker of a run with -shared.
export const getSharedGroup = (): SharedGroup | undefined => {
  const group: unknown = Reflect.get(Object(workerData), "sharedGroup");
  return isGroup(group) ? group : undefined;
};

// Checks a group of more than one file with what it writes held back, from its compile on, and
// reports it with the exit codes once every check is done, so that a group that runs out of heap
// shows nothing.
export const checkHeldBack = async (checkGroup: () => Promise<number[]>) => {
  const output: { isError: boolean; text: string }[] = [];
  const getWrite =
    (isError: boolean) =>
    (chunk: string | Uint8Array, ...rest: unknown[]): boolean => {
      output.push({
        isError,
        text: typeof chunk === "string" ? chunk : Buffer.from(chunk).toString(),
      });
      const callback = rest.find((argument) => typeof argument === "function");
      if (typeof callback === "function") callback();
      return true;
    };
  process.stdout.write = getWrite(false);
  process.stderr.write = getWrite(true);
  const exitCodes = await checkGroup();
  parentPort?.postMessage({ output, exitCodes } satisfies GroupReport);
  return exitCodes;
};

// A run's group checked in a worker whose heap is the run's, or undefined where the worker ran out
// of it. A group of one file writes as it checks, as a run of that file alone does.
const checkGroup = (argv: string[], group: SharedGroup) =>
  new Promise<GroupReport | undefined>((resolve, reject) => {
    let report: GroupReport | undefined;
    new Worker(new URL("./cli.js", import.meta.url), {
      argv,
      workerData: { sharedGroup: group },
      resourceLimits: {
        stackSizeMb: CHECK_STACK_MB,
        maxOldGenerationSizeMb: resourceLimits.maxOldGenerationSizeMb,
      },
    })
      .on("message", (message: GroupReport) => {
        report = message;
      })
      .on("error", (error: Error & { code?: string }) => {
        if (error.code === "ERR_WORKER_OUT_OF_MEMORY") resolve(undefined);
        else reject(error);
      })
      .on("exit", (code) => resolve(report ?? { output: [], exitCodes: [code] }));
  });

// The size of the code of a group's program, in characters, above which a group's check spends
// its time collecting garbage or runs out of Node's default heap of 4,192 MB. A group's heap holds
// about 550 MB before its program, and about 59 bytes for each character of the program's code
// once its base starts, so a program of 20 million characters leaves about 2.4 GB to each file's
// check.
export const SHARED_PROGRAM_BUDGET = 20_000_000;

// Checks the files of a run with -shared in consecutive groups, each in a worker of its own, which
// a group's base lives and dies with, from the program that the run compiled for it. A group starts
// with as many of the files left as the last one's program code suggests fit the budget, and one
// whose code is above it compiles again with fewer. A group that runs out of heap shows nothing and
// checks again as two halves, down to files alone, each of which shows what a run of it alone
// shows.
export const checkSharedGroups = async (
  argv: string[],
  pathCount: number,
  compileGroup: (first: number, count: number) => Promise<SharedProgram | undefined>,
) => {
  const exitCodes: number[] = [];
  const heapMb = resourceLimits.maxOldGenerationSizeMb ?? 0;
  // How many files of a group whose program's code is as long as that of size files fit the budget.
  const getFitting = (size: number, characters: number) =>
    Math.max(1, Math.floor((size * SHARED_PROGRAM_BUDGET) / characters));
  const checkFrom = async (first: number, count: number): Promise<void> => {
    if (first >= pathCount) return;
    const size = Math.min(count, pathCount - first);
    const program = await compileGroup(first, size);
    if (program?.kind === "oversize") return checkFrom(first, getFitting(size, program.characters));
    const report = await checkGroup(argv, { first, count: size, program });
    if (report === undefined && size === 1) {
      const stop = new TlaHeapLimitError(heapMb);
      console.error(`${stop.name}: ${stop.message}`);
      exitCodes.push(getErrorExitCode(stop));
      return checkFrom(first + 1, count);
    }
    if (report === undefined) {
      console.log(
        `tla-ts checks ${size} files in halves [heap-split]: their group ran out of Node's heap`,
      );
      return checkFrom(first, Math.ceil(size / 2));
    }
    report.output.forEach((item) =>
      (item.isError ? process.stderr : process.stdout).write(item.text),
    );
    exitCodes.push(...report.exitCodes);
    // The next group takes as many files as this group's code suggests fit, or, after a group
    // whose files compile alone, as many as are left.
    return checkFrom(
      first + size,
      program?.kind === "compiled" ? getFitting(size, program.characters) : pathCount,
    );
  };
  await checkFrom(0, pathCount);
  return exitCodes.find((exitCode) => exitCode !== EXIT_STATUS.success) ?? EXIT_STATUS.success;
};
