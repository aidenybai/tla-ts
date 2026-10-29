import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { TlaProverError } from "../../src/errors";
import { getObligations } from "../../src/obligations";
import { encodeZenon } from "../../src/obligation-zenon";

const FIXTURES = join(import.meta.dirname, "../fixtures/zenon-encoder");

// tlapm's .znn files differ from tla-ts's only in comments and line breaks.
const normalize = (text: string) => text.replace(/^;.*$/gm, "").replace(/\s+/g, " ").trim();

const obligations = getObligations(
  [{ file: "Encoder.tla", source: readFileSync(join(FIXTURES, "Encoder.tla"), "utf8") }],
  () => undefined,
)[0].obligations;

describe("Zenon obligations match tlapm", () => {
  it.each(
    obligations.filter((obligation) => existsSync(join(FIXTURES, `Encoder-${obligation.id}.znn`))),
  )("encodes obligation $id", (obligation) => {
    expect(normalize(encodeZenon(obligation))).toBe(
      normalize(readFileSync(join(FIXTURES, `Encoder-${obligation.id}.znn`), "utf8")),
    );
  });

  it("rejects a function with several bounds, which tlapm leaves Zenon an empty file for", () => {
    expect(() => encodeZenon(obligations[23])).toThrow(TlaProverError);
  });
});
