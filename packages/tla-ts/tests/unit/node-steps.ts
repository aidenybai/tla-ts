import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// A driver that runs a model's file in Node and calls its steps in turn, each once Node's loop has
// nothing left to run, which beforeExit tells, and prints the value of each of its checks in the
// state that the module's top level leaves and after each step. An immediate that does nothing
// keeps the loop running to the next beforeExit after a step that queues nothing.
const DRIVER = `const [file, ...steps] = process.argv.slice(1);
const module = await import(file);
const checks = Object.keys(module).filter((name) => !steps.includes(name));
const results = [];
const record = () => results.push(Object.fromEntries(checks.map((name) => [name, module[name]()])));
let index = 0;
process.on("beforeExit", () => {
  if (index >= steps.length) return;
  record();
  module[steps[index++]]();
  setImmediate(() => {});
});
process.on("exit", () => {
  record();
  console.log(JSON.stringify(results));
});
`;

// The values that a model's checks have in Node, in the state its top level leaves and after each
// of the steps, as DRIVER runs them, in an environment of the variables of env.
export const runStepsInNode = (
  path: string,
  steps: string[],
  env: Record<string, string> = {},
): Record<string, boolean>[] =>
  JSON.parse(
    spawnSync(
      process.execPath,
      ["--input-type=module", "-e", DRIVER, pathToFileURL(path).href, ...steps],
      { encoding: "utf8", env: { ...process.env, ...env } },
    ).stdout,
  );
