import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const FIXTURES = join(import.meta.dirname, "fixtures/cli");

const runCli = (directory: string, args: string[] = []) =>
  spawnSync(
    process.execPath,
    ["--import", "tsx", join(import.meta.dirname, "../src/cli.ts"), ...args],
    {
      cwd: join(FIXTURES, directory),
      encoding: "utf8",
      env: {
        ...process.env,
        NO_COLOR: "1",
        TSX_TSCONFIG_PATH: join(import.meta.dirname, "../tsconfig.json"),
      },
    },
  );

describe("the CLI", () => {
  it("checks every proof file under the current directory", () => {
    const result = runCli("passing");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("✓ counter.proof.ts (4 distinct states)\n");
  });

  it("prints a counterexample in TypeScript syntax and exits with 1", () => {
    const result = runCli("failing", ["overdraft.proof.ts"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe(
      [
        "✗ overdraft.proof.ts: invariant noOverdraft is violated",
        "  1. Initial state",
        "     balances = { alice: 2, bob: 2 }",
        "  2. transfer",
        "     balances = { alice: 4, bob: 0 }",
        "  3. transfer",
        "     balances = { alice: 6, bob: -2 }",
        "",
      ].join("\n"),
    );
  });

  it("reports a model that doesn't compile and checks the rest", () => {
    const result = runCli("failing");
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(
      "✗ division.proof.ts\n  division.proof.ts:4:11 Write division as Math.floor(a / b) or Math.trunc(a / b)",
    );
    expect(result.stdout).toContain("✗ overdraft.proof.ts: invariant noOverdraft is violated");
  });

  it("prints the generated TLA+ with --emit", () => {
    const result = runCli("passing", ["--emit"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("---- MODULE Spec ----");
    expect(result.stdout).toContain("INVARIANTS isBounded");
  });
});
