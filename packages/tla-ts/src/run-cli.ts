import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { check, type CheckResult, type CheckStatus } from "./check";
import { parseConfig } from "./config";
import { TlaError } from "./errors";
import { formatValue } from "./values";

const EXIT_CODES: Record<CheckStatus, number> = {
  success: 0,
  "assumption-violation": 10,
  deadlock: 11,
  "invariant-violation": 12,
  "property-violation": 13,
  "liveness-violation": 13,
};

const USAGE = "Usage: tla-ts <Spec.tla> [-config <Spec.cfg>] [-deadlock]";

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
    }[result.status];
    console.log(headline);
    if (result.violation.trace.length > 0) console.log("Error: The behavior up to this point is:");
    result.violation.trace.forEach((step, index) => {
      console.log(`State ${index + 1}: <${step.action ?? "Initial predicate"}>`);
      Object.entries(step.state).forEach(([name, value]) =>
        console.log(`/\\ ${name} = ${formatValue(value)}`),
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
  } else {
    console.log("Model checking completed. No error has been found.");
  }
  console.log(
    `${result.generatedStates} states generated, ${result.distinctStates} distinct states found, 0 states left on queue.`,
  );
  console.log(`The depth of the complete state graph search is ${result.depth}.`);
};

const run = (args: string[]) => {
  const specPath = args.find((arg, index) => arg.endsWith(".tla") && args[index - 1] !== "-config");
  if (!specPath) {
    console.error(USAGE);
    return 1;
  }
  const configFlag = args.indexOf("-config");
  const configPath = configFlag === -1 ? specPath.replace(/\.tla$/, ".cfg") : args[configFlag + 1];
  if (!configPath || !existsSync(configPath)) {
    console.error(`Cannot find the configuration file ${configPath ?? ""}`);
    return 1;
  }
  const config = parseConfig(readFileSync(configPath, "utf8"));
  if (args.includes("-deadlock")) config.checkDeadlock = false;
  const directory = dirname(specPath);
  console.log(`Checking ${basename(specPath)} with ${basename(configPath)}`);
  const result = check({
    source: readFileSync(specPath, "utf8"),
    config,
    loadModule: (name) => {
      const modulePath = join(directory, `${name}.tla`);
      return existsSync(modulePath) ? readFileSync(modulePath, "utf8") : undefined;
    },
  });
  printResult(result);
  return EXIT_CODES[result.status];
};

export const runCli = () => {
  const outcome = { code: 1 };
  try {
    outcome.code = run(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    console.error(`${error.name}: ${error.message}`);
  }
  process.exitCode = outcome.code;
};
