import { existsSync, mkdirSync, readFileSync, readSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { availableParallelism } from "node:os";
import { type CheckResult, type CheckStatus } from "./check";
import { parseConfig } from "./config";
import { TlaConfigError, TlaError, TlaEvaluationError, TlaSyntaxError } from "./errors";
import { EXIT_STATUS, getExitCode } from "./exit-codes";
import { check } from "./parallel";
import { prettyPrint } from "./pretty-print";
import { formatValue } from "./values";

const EXIT_CODES: Record<CheckStatus, number> = {
  success: 0,
  "assumption-violation": 10,
  deadlock: 11,
  "invariant-violation": 12,
  "property-violation": 12,
  "liveness-violation": 13,
  "postcondition-violation": 10,
};

export const getErrorExitCode = (error: TlaError) =>
  getExitCode(error) ??
  (error instanceof TlaSyntaxError
    ? EXIT_STATUS.specParseError
    : error instanceof TlaConfigError
      ? EXIT_STATUS.configParseError
      : error instanceof TlaEvaluationError
        ? EXIT_STATUS.specEvaluationFailure
        : EXIT_STATUS.error);

const USAGE =
  "Usage: tla-ts <Spec.tla> [-config <Spec.cfg>] [-deadlock] [-seed <num>] [-workers <count|auto>]";

const isJavaLong = (text: string) =>
  /^[+-]?\d+$/.test(text) && BigInt.asIntN(64, BigInt(text)) === BigInt(text);

const getWorkerCount = (args: string[]) => {
  const flag = args.indexOf("-workers");
  if (flag === -1) return 1;
  const value = args[flag + 1];
  return value === "auto"
    ? availableParallelism()
    : Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
};

const printResult = (result: CheckResult) => {
  if (result.violation) {
    const headline = {
      success: "",
      "assumption-violation": result.violation.message
        ? `Error: Evaluating assumption ${result.violation.name} failed.\n${result.violation.message}`
        : `Error: Assumption ${result.violation.name} is false.`,
      deadlock: "Error: Deadlock reached.",
      "invariant-violation": `Error: Invariant ${result.violation.name} is violated.`,
      "property-violation": `Error: Property ${result.violation.name} is violated.`,
      "liveness-violation": `Error: Temporal property ${result.violation.name} was violated.`,
      "postcondition-violation": `Error: ${result.violation.message ?? `Postcondition ${result.violation.name} is false.`}`,
    }[result.status];
    if (result.violation.counts) console.log(result.violation.counts);
    console.log(headline);
    if (result.violation.trace.length > 0) console.log("Error: The behavior up to this point is:");
    result.violation.trace.forEach((step, index) => {
      console.log(`State ${index + 1}: <${step.action ?? "Initial predicate"}>`);
      const entries = Object.entries(step.state);
      entries.forEach(([name, value]) =>
        console.log(
          `${entries.length === 1 ? "" : "/\\ "}${name} = ${prettyPrint(formatValue(value))}`,
        ),
      );
      console.log("");
    });
    const loopStart = result.violation.loopStart;
    if (loopStart !== undefined) {
      const isStuttering = loopStart === result.violation.trace.length - 1;
      console.log(
        isStuttering ? `State ${loopStart + 2}: Stuttering` : `Back to state ${loopStart + 1}`,
      );
    }
    const unwitnessed = result.violation.unwitnessed;
    if (unwitnessed?.counts) console.log(unwitnessed.counts);
    if (unwitnessed) console.log(`Error: ${unwitnessed.message}`);
  } else {
    console.log("Model checking completed. No error has been found.");
  }
  console.log(
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, 0 states left on queue.`,
  );
  console.log(`The depth of the complete state graph search is ${result.depth}.`);
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
  const directory = dirname(specPath);
  console.log(`Checking ${basename(specPath)} with ${basename(configPath)}`);
  const result = await check({
    workers: getWorkerCount(args),
    seed: BigInt(seed),
    source: readFileSync(specPath, "utf8"),
    config,
    onPause: () => readSync(0, Buffer.alloc(1)),
    loadModule: (name) => {
      const modulePath = join(directory, `${name}.tla`);
      return existsSync(modulePath) ? readFileSync(modulePath, "utf8") : undefined;
    },
    readFile: (path) => (existsSync(path) ? readFileSync(path, "utf8") : undefined),
    writeFile: (path, content) => {
      mkdirSync(dirname(resolve(path)), { recursive: true });
      writeFileSync(path, content);
    },
  });
  printResult(result);
  return EXIT_CODES[result.status];
};

export const runCli = async () => {
  const outcome = { code: 1 };
  try {
    outcome.code = await run(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    console.error(`${error.name}: ${error.message}`);
    outcome.code = getErrorExitCode(error);
  }
  process.exitCode = outcome.code;
};
