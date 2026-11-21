#!/usr/bin/env node
import { enableCompileCache } from "node:module";
import { join } from "node:path";
import { isMainThread, Worker } from "node:worker_threads";
import { CHECK_STACK_MB } from "./worker";

const JAVA_TMPDIR_PROPERTY = "-Djava.io.tmpdir=";
const javaTmpdir = process.argv
  .find((arg) => arg.startsWith(JAVA_TMPDIR_PROPERTY))
  ?.slice(JAVA_TMPDIR_PROPERTY.length);

enableCompileCache?.(javaTmpdir && join(javaTmpdir, "node-compile-cache"));

// The CLI runs on a thread of its own, whose stack holds evaluations deeper than Node's main
// thread's does, and exits with the code that the thread leaves.
if (isMainThread) {
  new Worker(new URL(import.meta.url), {
    argv: process.argv.slice(2),
    resourceLimits: { stackSizeMb: CHECK_STACK_MB },
  }).on("exit", (code) => {
    process.exitCode = code;
  });
} else {
  void import("./cli/run").then((module) => module.runCli());
}
