#!/usr/bin/env node
import { enableCompileCache } from "node:module";
import { join } from "node:path";

const JAVA_TMPDIR_PROPERTY = "-Djava.io.tmpdir=";
const javaTmpdir = process.argv
  .find((arg) => arg.startsWith(JAVA_TMPDIR_PROPERTY))
  ?.slice(JAVA_TMPDIR_PROPERTY.length);

enableCompileCache?.(javaTmpdir && join(javaTmpdir, "node-compile-cache"));

void import("./cli/run").then((module) => module.runCli());
