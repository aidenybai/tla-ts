#!/usr/bin/env node
import { globSync, readFileSync } from "node:fs";
import { styleText } from "node:util";
import { Command } from "commander";
import { check, type CheckResult, TlaError, type TraceStep } from "tla-ts";
import { compile } from "./compile";
import { TsproverError } from "./errors";
import { formatJs } from "./format";

interface Options {
  workers: string;
  emit?: boolean;
}

const describeFailure = (result: CheckResult) => {
  const name = result.violation?.name;
  if (result.status === "invariant-violation") return `invariant ${name} is violated`;
  if (result.status === "property-violation" || result.status === "liveness-violation") {
    return `property ${name} is violated`;
  }
  if (result.status === "deadlock") return "reached a state where no action can run";
  if (result.status === "assumption-violation") return `assumption ${name} is false`;
  if (result.status === "postcondition-violation") return `postcondition ${name} is false`;
  return result.failure?.message ?? result.violation?.message ?? result.status;
};

// Prints every variable of the first state, then only the variables each step changes.
const printTrace = (trace: TraceStep[], loopStart: number | undefined) => {
  trace.forEach((step, index) => {
    const previous = trace[index - 1]?.state;
    const heading = index === 0 ? "Initial state" : (step.action ?? "step");
    console.log(`  ${index + 1}. ${heading}`);
    for (const entry of Object.entries(step.state)) {
      const formatted = formatJs(entry[1]);
      if (previous === undefined || formatJs(previous[entry[0]]) !== formatted) {
        console.log(`     ${entry[0]} = ${formatted}`);
      }
    }
  });
  if (loopStart === undefined) return;
  console.log(
    loopStart === trace.length - 1
      ? "  … then no action runs, forever"
      : `  … then back to state ${loopStart + 1}, forever`,
  );
};

const checkFile = async (path: string, options: Options) => {
  const spec = compile(readFileSync(path, "utf8"), path);
  if (options.emit) {
    console.log(`\\* ${path}\n${spec.source}\n\n${spec.config}\n`);
    return true;
  }
  const result = await check({
    ...spec,
    workers: Number.parseInt(options.workers, 10) || 1,
    onPrint: (text) => console.log(`  ${text}`),
  });
  if (result.status === "success") {
    const states = `${result.distinctStates} distinct ${result.distinctStates === 1 ? "state" : "states"}`;
    console.log(`${styleText("green", "✓")} ${path} ${styleText("dim", `(${states})`)}`);
    return true;
  }
  console.log(`${styleText("red", "✗")} ${path}: ${describeFailure(result)}`);
  printTrace(result.violation?.trace ?? result.failure?.trace ?? [], result.violation?.loopStart);
  return false;
};

const program = new Command()
  .name("tsprover")
  .description("Model check TypeScript models by compiling them to TLA+")
  .argument("[files...]", "models to check (default: every *.proof.ts file)")
  .option("-w, --workers <count>", "number of worker threads", "1")
  .option("--emit", "print the generated TLA+ spec and config instead of checking")
  .action(async (files: string[], options: Options) => {
    const paths =
      files.length > 0
        ? files
        : globSync("**/*.proof.ts", {
            exclude: (path) => path.split(/[\\/]/).includes("node_modules"),
          }).sort();
    if (paths.length === 0) {
      console.error("No *.proof.ts files found");
      process.exitCode = 1;
      return;
    }
    for (const path of paths) {
      // Report a model that doesn't compile or check, and move on to the next one.
      const isPassing = await checkFile(path, options).catch((error: unknown) => {
        if (!(error instanceof TsproverError) && !(error instanceof TlaError)) throw error;
        console.log(
          `${styleText("red", "✗")} ${path}\n  ${error.message.split("\n").join("\n  ")}`,
        );
        return false;
      });
      if (!isPassing) process.exitCode = 1;
    }
  });

await program.parseAsync();
