import { existsSync, mkdirSync, readFileSync, readSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { availableParallelism } from "node:os";
import type { CheckResult, CheckStatus, TraceStep } from "./check";
import { parseConfig } from "./config";
import { getErrorExitCode, TlaConfigError, TlaError, TlaEvaluationError } from "./errors";
import { EXIT_STATUS } from "./exit-codes";
import { check } from "./parallel";
import { prettyPrint } from "./pretty-print";
import {
  formatProbability,
  getActualProbability,
  getOptimisticProbability,
  getOutDegreeSummary,
} from "./tlc-summary";
import { formatValue, type Value } from "./values";

const EXIT_CODES: Record<CheckStatus, number> = {
  success: EXIT_STATUS.success,
  "assumption-violation": EXIT_STATUS.assumptionViolation,
  deadlock: EXIT_STATUS.deadlock,
  "invariant-violation": EXIT_STATUS.safetyViolation,
  "property-violation": EXIT_STATUS.safetyViolation,
  "liveness-violation": EXIT_STATUS.livenessViolation,
  "postcondition-violation": EXIT_STATUS.assumptionViolation,
  error: EXIT_STATUS.error,
};

const USAGE =
  "Usage: tla-ts <Spec.tla> [-config <Spec.cfg>] [-deadlock] [-lncheck <final|default>] [-seed <num>] [-workers <count|auto>]";

const isJavaLong = (text: string) =>
  /^[+-]?\d+$/.test(text) && BigInt.asIntN(64, BigInt(text)) === BigInt(text);

const getWorkerCount = (args: string[]) => {
  const flag = args.indexOf("-workers");
  if (flag === -1) return 1;
  const value = args[flag + 1];
  return value === "auto" ? availableParallelism() : Math.max(1, Number.parseInt(value, 10) || 1);
};

const printState = (state: Record<string, Value>) => {
  const entries = Object.entries(state);
  entries.forEach(([name, value]) =>
    console.log(
      `${entries.length === 1 ? "" : "/\\ "}${name} = ${prettyPrint(formatValue(value))}`,
    ),
  );
  console.log("");
};

const printTrace = (trace: TraceStep[], heading = "Error: The behavior up to this point is:") => {
  if (trace.length > 0) console.log(heading);
  trace.forEach((step, index) => {
    console.log(`State ${index + 1}: <${step.label ?? step.action ?? "Initial predicate"}>`);
    printState(step.state);
  });
};

const printResult = (result: CheckResult) => {
  if (result.failure) {
    console.log(`Error: ${result.failure.message}`);
    if (result.failure.initialState) {
      console.log("While working on the initial state:");
      printState(result.failure.initialState);
    }
    printTrace(result.failure.trace);
  } else if (result.violation) {
    const violation = result.violation;
    const name = violation.name;
    const loopStart = violation.loopStart;
    // TLC prints a violation by an initial state without the behavior or the statistics.
    const isInitial =
      loopStart === undefined &&
      violation.trace.length === 1 &&
      (result.status === "invariant-violation" || result.status === "liveness-violation");
    const headline = {
      success: "",
      error: "",
      "assumption-violation": violation.message
        ? `Error: Evaluating assumption ${name} failed.\n${violation.message}`
        : `Error: Assumption ${name} is false.`,
      deadlock: "Error: Deadlock reached.",
      "invariant-violation": isInitial
        ? `Error: Invariant ${name} is violated by the initial state:`
        : `Error: Invariant ${name} is violated.`,
      "property-violation": `Error: Property ${name} is violated.`,
      "liveness-violation":
        loopStart !== undefined
          ? `Error: Temporal property ${name} was violated.\n`
          : isInitial
            ? `Error: Property ${name} is violated by the initial state:`
            : `Error: Action property ${name} is violated.`,
      "postcondition-violation": `Error: ${violation.message ?? `Postcondition ${name} is false.`}`,
    }[result.status];
    if (violation.counts) console.log(violation.counts);
    console.log(headline);
    if (isInitial) printState(violation.trace[0].state);
    else if (loopStart === undefined) printTrace(violation.trace);
    else {
      printTrace(violation.trace, "Error: The following behavior constitutes a counter-example:\n");
      const isStuttering = loopStart === violation.trace.length - 1;
      console.log(
        isStuttering
          ? `State ${loopStart + 2}: Stuttering`
          : `Back to state ${loopStart + 1}${violation.loopLabel ? `: <${violation.loopLabel}>\n` : ""}`,
      );
    }
    const unwitnessed = violation.unwitnessed;
    if (unwitnessed?.counts) console.log(unwitnessed.counts);
    if (unwitnessed) console.log(`Error: ${unwitnessed.message}`);
    // TLC checks assumptions before it starts the search, so it has no statistics to print.
    if (isInitial || result.status === "assumption-violation") return;
  } else {
    const optimistic = getOptimisticProbability(result.distinctStates, result.generatedStates);
    console.log("Model checking completed. No error has been found.");
    console.log("  Estimates of the probability that TLC did not check all reachable states");
    console.log("  because two distinct states had the same fingerprint:");
    console.log(`  calculated (optimistic):  val = ${formatProbability(optimistic)}`);
    if (result.fingerprintDistance !== undefined) {
      const actual = getActualProbability(result.fingerprintDistance);
      console.log(`  based on the actual fingerprints:  val = ${formatProbability(actual)}`);
    }
  }
  console.log(
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, ${result.queuedStates} states left on queue.`,
  );
  console.log(`The depth of the complete state graph search is ${result.depth}.`);
  const outDegree = result.outDegrees && getOutDegreeSummary(result.outDegrees);
  if (outDegree) console.log(outDegree);
};

const run = async (args: string[]) => {
  const specPath = args.find((arg, index) => arg.endsWith(".tla") && args[index - 1] !== "-config");
  if (!specPath) {
    console.error(USAGE);
    return 1;
  }
  if (!existsSync(specPath)) {
    console.error(`Cannot find the specification file ${specPath}`);
    return EXIT_STATUS.configParseError;
  }
  const configFlag = args.indexOf("-config");
  const configPath = configFlag === -1 ? specPath.replace(/\.tla$/, ".cfg") : args[configFlag + 1];
  if (!configPath || !existsSync(configPath)) {
    console.error(`Cannot find the configuration file ${configPath ?? ""}`);
    return EXIT_STATUS.configParseError;
  }
  const config = parseConfig(readFileSync(configPath, "utf8"));
  if (args.includes("-deadlock")) config.checkDeadlock = false;
  const seedFlag = args.indexOf("-seed");
  const seed = seedFlag === -1 ? "0" : args[seedFlag + 1];
  if (seed === undefined) {
    console.error("Error: seed required.");
    return 1;
  }
  if (!isJavaLong(seed)) {
    console.error(`Error: An integer for seed required. But encountered ${seed}`);
    return 1;
  }
  const livenessFlag = args.indexOf("-lncheck");
  const livenessCheck = livenessFlag === -1 ? "default" : args[livenessFlag + 1]?.toLowerCase();
  if (livenessCheck === undefined) {
    console.error("Error: expect a strategy such as final for -lncheck option.");
    return 1;
  }
  const directory = dirname(specPath);
  console.log(`Checking ${basename(specPath)} with ${basename(configPath)}`);
  const result = await check({
    workers: getWorkerCount(args),
    livenessCheck: ["final", "seqfinal", "off"].includes(livenessCheck) ? "final" : "default",
    seed: BigInt(seed),
    source: readFileSync(specPath, "utf8"),
    config,
    onPause: () => readSync(0, Buffer.alloc(1)),
    loadModule: (name) => {
      const modulePath = join(directory, `${name}.tla`);
      return existsSync(modulePath) ? readFileSync(modulePath, "utf8") : undefined;
    },
    loadClass: (name) => {
      const classPath = join(directory, `${name}.class`);
      return existsSync(classPath) ? readFileSync(classPath) : undefined;
    },
    readFile: (path) => (existsSync(path) ? readFileSync(path, "utf8") : undefined),
    writeFile: (path, content) => {
      mkdirSync(dirname(resolve(path)), { recursive: true });
      writeFileSync(path, content);
    },
  });
  printResult(result);
  return result.failure?.exitCode ?? EXIT_CODES[result.status];
};

// TLC prints the errors it raises itself. tla-ts names the others, such as a module SANY rejects.
const printError = (error: TlaError) => {
  if (error instanceof TlaConfigError || error instanceof TlaEvaluationError) {
    return console.log(`Error: ${error.message}`);
  }
  console.error(`${error.name}: ${error.message}`);
};

export const runCli = async () => {
  try {
    process.exitCode = await run(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    printError(error);
    process.exitCode = getErrorExitCode(error);
  }
};
