#!/usr/bin/env node
import { enableCompileCache } from "node:module";
import { join } from "node:path";

// When tla-ts runs in place of java, it keeps its temporary files where Java would.
const JAVA_TMPDIR_PROPERTY = "-Djava.io.tmpdir=";
const javaTmpdir = process.argv
  .find((arg) => arg.startsWith(JAVA_TMPDIR_PROPERTY))
  ?.slice(JAVA_TMPDIR_PROPERTY.length);

enableCompileCache?.(javaTmpdir && join(javaTmpdir, "node-compile-cache"));

void import("./run-cli").then((module) => module.runCli());
