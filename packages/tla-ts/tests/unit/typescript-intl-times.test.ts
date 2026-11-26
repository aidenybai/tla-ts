import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { compileToJsTla } from "../../src/typescript/spec/compile";
import { prepareRuntime } from "../../src/typescript/spec/prepare";

const getProgram = (
  date: string,
) => `const parts = new Intl.DateTimeFormat("en-US", { timeZone: "UTC" });
let threw = false;
try {
  parts.formatToParts.call(${date});
} catch {
  threw = true;
}
if (!threw) throw new Error("formatToParts read a Date");
`;

const runNode = (source: string) =>
  spawnSync(process.execPath, ["--input-type=commonjs", "-e", source], { encoding: "utf8" }).status;

// The clock moves on, so a compile that read it gives another spec.
const waitForClock = () => {
  const start = Date.now();
  while (Date.now() === start);
};

describe("compiles a Date of no arguments without reading the host's clock", () => {
  let runtime: ReturnType<typeof prepareRuntime>;
  const compile = (source: string) =>
    compileToJsTla(source, "spec.ts", runtime).loadModule("ProgramCode") ?? "";

  beforeAll(() => {
    runtime = prepareRuntime(join(import.meta.dirname, "../../ecmascript"));
  }, 600_000);

  it("gives the same spec each time it compiles a program that makes one", () => {
    const source = getProgram("new Date()");
    expect(runNode(source)).toBe(0);
    const first = compile(source);
    waitForClock();
    expect(compile(source)).toBe(first);
  }, 600_000);

  it("records the time of a Date of literal arguments", () => {
    const source = getProgram("new Date(1234567)");
    expect(runNode(source)).toBe(0);
    expect(compile(source)).toContain('StringUnits("1234567")');
    expect(compile(getProgram("new Date()"))).not.toContain('StringUnits("1234567")');
  }, 600_000);
});
