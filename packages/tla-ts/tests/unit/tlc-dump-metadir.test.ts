import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";

const CLI = join(import.meta.dirname, "../../src/cli.ts");

const copies: string[] = [];

afterAll(() => copies.forEach((copy) => rmSync(copy, { recursive: true, force: true })));

const runDump = (dump: string[]) => {
  const directory = mkdtempSync(join(tmpdir(), "tla-ts-metadir-"));
  copies.push(directory);
  cpSync(join(import.meta.dirname, "../fixtures/counter"), directory, { recursive: true });
  const result = spawnSync("bun", [CLI, "Counter.tla", "-metadir", "meta", "-dump", ...dump], {
    cwd: directory,
    encoding: "utf8",
  });
  return { directory, stdout: result.stdout };
};

describe("the CLI resolves ${metadir} in -dump like TLC", () => {
  it("keeps a ${metadir} that doesn't start the file name", () => {
    const run = runDump(["sub${metadir}x"]);
    expect(existsSync(join(run.directory, "sub${metadir}x.dump"))).toBe(true);
    expect(existsSync(join(run.directory, "meta"))).toBe(false);
  });

  it("replaces every ${metadir} with the one directory of the run", () => {
    const run = runDump(["${metadir}/a${metadir}"]);
    expect(run.stdout).toMatch(
      /Error: Given file name (meta\/[\d.-]+)\/a\1\.dump for dumping states invalid\./,
    );
    expect(readdirSync(join(run.directory, "meta"))).toHaveLength(1);
  });

  it("writes a dot dump into the directory, and leaves the format alone", () => {
    const run = runDump(["dot,${metadir}", "${metadir}/graph"]);
    const names = readdirSync(join(run.directory, "meta"));
    expect(names).toHaveLength(1);
    expect(readdirSync(join(run.directory, "meta", names[0]))).toEqual(["graph.dot"]);
  });
});
