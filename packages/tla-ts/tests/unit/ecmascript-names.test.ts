import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { describe, expect, it } from "vite-plus/test";

// HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
const REGISTER = `const { register } = require("node:module");
  register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
    next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));`;

const source = pathToFileURL(join(import.meta.dirname, "../../src")).href;
const directory = join(import.meta.dirname, "../../ecmascript");

// The status of a check of a spec that extends ESNames and reads a name's code units, on a worker
// with a browser worker's stack of half a megabyte.
const getStatus = () =>
  new Promise<string>((resolve, reject) => {
    const worker = new Worker(
      `${REGISTER}
      const { existsSync, readFileSync } = require("node:fs");
      const { join } = require("node:path");
      const { parentPort, workerData } = require("node:worker_threads");
      import(workerData.source + "/parallel.ts")
        .then((parallel) => parallel.check({
          source: '---- MODULE NameCheck ----\\nEXTENDS ESNames\\nASSUME N(" GMT") = <<32, 71, 77, 84>>\\n====',
          config: "",
          loadModule: (name) => {
            const path = join(workerData.directory, name + ".tla");
            return existsSync(path) ? readFileSync(path, "utf8") : undefined;
          },
        }))
        .then((result) => parentPort.postMessage(result.status));`,
      { eval: true, workerData: { source, directory }, resourceLimits: { stackSizeMb: 0.5 } },
    );
    worker.once("message", (status: string) => {
      void worker.terminate();
      resolve(status);
    });
    worker.once("error", reject);
  });

describe("loads ESNames", () => {
  it("reads a name's code units on a browser worker's stack of half a megabyte", async () => {
    expect(await getStatus()).toBe("success");
  });
});
