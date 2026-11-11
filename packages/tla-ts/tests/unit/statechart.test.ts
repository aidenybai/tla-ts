import { execFile } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import {
  getDumpPath,
  getStatechartSpecs,
  prepareStatechart,
  readExpected,
  readStatechartCalls,
} from "../../scripts/statechart-calls";

const CLI = join(import.meta.dirname, "../../dist/cli.js");

const runCli = (args: string[], cwd: string) =>
  new Promise<{ output: string; status: number }>((resolve) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      { cwd, maxBuffer: 1 << 30 },
      (error, stdout, stderr) =>
        resolve({ output: stdout + stderr, status: error ? Number(error.code) : 0 }),
    );
  });

// Corpus from pstack's statechart skill (https://github.com/michael-denyer/pstack-claude), MIT license, see tests/fixtures/statechart/LICENSE.
describe("the CLI answers pstack's statechart skill like TLC", () => {
  describe.each(getStatechartSpecs())("for %s", (spec) => {
    const statechart = prepareStatechart(spec, "/lib/tla2tools.jar");
    afterAll(() => rmSync(statechart.root, { recursive: true, force: true }));
    it.each([...readStatechartCalls(spec).entries()])("call %i", async (index, call) => {
      const args = statechart.getArgs(call);
      const result = await runCli(args, statechart.work);
      expect(statechart.normalize(result.output)).toBe(readExpected(spec, call, index, "out"));
      expect(result.status).toBe(call.status);
      const dump = readExpected(spec, call, index, "dot");
      if (dump !== undefined) {
        expect(statechart.normalize(readFileSync(getDumpPath(args) ?? "", "utf8"))).toBe(dump);
      }
    });
  });
});
