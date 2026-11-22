#!/usr/bin/env node
import { writeSync } from "node:fs";
import { enableCompileCache } from "node:module";
import { join } from "node:path";
import { getHeapStatistics } from "node:v8";
import { isMainThread, Worker } from "node:worker_threads";
import { getErrorExitCode, TlaHeapLimitError } from "./errors";
import { CHECK_STACK_MB } from "./worker";

const JAVA_TMPDIR_PROPERTY = "-Djava.io.tmpdir=";
const javaTmpdir = process.argv
  .find((arg) => arg.startsWith(JAVA_TMPDIR_PROPERTY))
  ?.slice(JAVA_TMPDIR_PROPERTY.length);

enableCompileCache?.(javaTmpdir && join(javaTmpdir, "node-compile-cache"));

// The CLI runs on a thread of its own, whose stack holds evaluations deeper than Node's main
// thread's does, and whose heap is the one Node gives this process, and exits with the code that the
// thread leaves, or stops where the thread runs out of its heap.
if (isMainThread) {
  const heapMb = Math.floor(getHeapStatistics().heap_size_limit / 2 ** 20);
  let isOutOfHeap = false;
  new Worker(new URL(import.meta.url), {
    argv: process.argv.slice(2),
    resourceLimits: { stackSizeMb: CHECK_STACK_MB, maxOldGenerationSizeMb: heapMb },
  })
    .on("error", (error: Error & { code?: string }) => {
      if (error.code !== "ERR_WORKER_OUT_OF_MEMORY") throw error;
      isOutOfHeap = true;
      const stop = new TlaHeapLimitError(heapMb);
      console.error(`${stop.name}: ${stop.message}`);
      process.exitCode = getErrorExitCode(stop);
    })
    .on("exit", (code) => {
      if (!isOutOfHeap) process.exitCode = code;
    });
} else {
  // A worker's stdout and stderr reach the process only as the worker's event loop turns, which a
  // check holds for as long as its search runs, so the thread writes each to the process's own
  // descriptor as it prints, as TLC does, and waits out a pipe that's full.
  const getWrite =
    (descriptor: number) =>
    (chunk: string | Uint8Array, ...rest: unknown[]): boolean => {
      const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      let written = 0;
      while (written < bytes.length) {
        try {
          written += writeSync(descriptor, bytes, written);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EAGAIN") throw error;
        }
      }
      const callback = rest.find((argument) => typeof argument === "function");
      if (typeof callback === "function") callback();
      return true;
    };
  process.stdout.write = getWrite(1);
  process.stderr.write = getWrite(2);
  void import("./cli/run").then((module) => module.runCli());
}
