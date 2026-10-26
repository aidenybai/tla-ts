#!/usr/bin/env node
import { enableCompileCache } from "node:module";

enableCompileCache?.();

void import("./run-cli").then((module) => module.runCli());
