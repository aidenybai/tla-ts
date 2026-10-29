import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { solveSmt } from "../../src/smt/solver";

interface RecordedVerdict {
  z3: string;
  source: string;
}

const DIRECTORY = join(import.meta.dirname, "../fixtures/smt");

const verdicts: Record<string, RecordedVerdict> = JSON.parse(
  readFileSync(join(DIRECTORY, "verdicts.json"), "utf8"),
);

const solve = (name: string) =>
  solveSmt(readFileSync(join(DIRECTORY, name), "utf8"), { timeLimitMs: 5000 });

describe("solveSmt proves what Z3 proves", () => {
  for (const name of Object.keys(verdicts).filter(
    (innerName) => verdicts[innerName].z3 === "unsat",
  ))
    it(`proves ${verdicts[name].source}`, () => {
      expect(solve(name)).toBe("unsat");
    });
});

describe("solveSmt never proves what Z3 refutes", () => {
  for (const name of Object.keys(verdicts).filter((innerName) => verdicts[innerName].z3 === "sat"))
    it(`does not prove ${verdicts[name].source}`, () => {
      expect(solve(name)).not.toBe("unsat");
    });
});
