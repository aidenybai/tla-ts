import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { TlaProverError } from "../../src/errors";
import { getObligations } from "../../src/obligations";
import { encodeForBackend } from "../../src/prover/prove";
import { TLAPS_MODULE } from "../../src/prover/tlaps-module";

const FIXTURES = join(import.meta.dirname, "../fixtures/isabelle-encoder");

const SESSION = { caseErrors: 0 };

const normalize = (text: string) =>
  text
    .replace(/\(\*[\s\S]*?\*\)/g, "")
    .replace(/\btlapm_[0-9a-f]+\b/g, "tlapm")
    .replace(/\s+/g, " ")
    .trim();

const readModule = (name: string) =>
  name === "TLAPS" ? TLAPS_MODULE : readFileSync(join(FIXTURES, `${name}.tla`), "utf8");

const getObligation = (name: string, obligationId: number) => {
  const obligation = getObligations([{ file: `${name}.tla`, source: readModule(name) }], (used) =>
    used === "TLAPS" ? { file: "TLAPS.tla", source: TLAPS_MODULE } : undefined,
  )
    .flatMap((result) => result.obligations)
    .find((innerObligation) => innerObligation.id === obligationId);
  if (!obligation) throw new Error(`${name} has no obligation ${obligationId}`);
  return obligation;
};

const theories = readdirSync(FIXTURES).flatMap((file) => {
  const match = /^(.+)-(\d+)\.thy$/.exec(file);
  return match ? [{ file, name: match[1], id: Number(match[2]) }] : [];
});

describe("Isabelle theories match tlapm", () => {
  it.each(theories)("encodes $file", (theory) => {
    expect(
      normalize(encodeForBackend(getObligation(theory.name, theory.id), "isabelle", SESSION)),
    ).toBe(normalize(readFileSync(join(FIXTURES, theory.file), "utf8")));
  });

  it("fails a goal with a set of several bounds, which tlapm leaves Isabelle part of a theory for", () => {
    expect(() => encodeForBackend(getObligation("Level_test", 1), "isabelle", SESSION)).toThrow(
      TlaProverError,
    );
  });
});
