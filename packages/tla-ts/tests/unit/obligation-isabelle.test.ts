import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { TlaProverError } from "../../src/errors";
import { getObligations } from "../../src/obligations";
import { encodeForBackend } from "../../src/prove/prove";
import { TLAPS_MODULE } from "../../src/prove/tlaps-module";

// Modules from tlapm's tests and library, and the theory tlapm wrote for each of their obligations
// that it sent to Isabelle, as <module>-<obligation>.thy.
const FIXTURES = join(import.meta.dirname, "../fixtures/isabelle-encoder");

const SESSION = { caseErrors: 0 };

// tlapm's theories differ from tla-ts's only in comments, line breaks, and the theory's name,
// which tlapm takes from a temporary file.
const normalize = (text: string) =>
  text
    .replace(/\(\*[\s\S]*?\*\)/g, "")
    .replace(/\btlapm_[0-9a-f]+\b/g, "tlapm")
    .replace(/\s+/g, " ")
    .trim();

const readModule = (name: string) =>
  name === "TLAPS" ? TLAPS_MODULE : readFileSync(join(FIXTURES, `${name}.tla`), "utf8");

const getObligation = (name: string, id: number) => {
  const obligation = getObligations([{ file: `${name}.tla`, source: readModule(name) }], (used) =>
    used === "TLAPS" ? { file: "TLAPS.tla", source: TLAPS_MODULE } : undefined,
  )
    .flatMap((result) => result.obligations)
    .find((innerObligation) => innerObligation.id === id);
  if (!obligation) throw new Error(`${name} has no obligation ${id}`);
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
