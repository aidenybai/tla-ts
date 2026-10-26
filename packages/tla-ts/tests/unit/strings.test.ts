import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/strings");

describe("STRING matches TLC's Strings class", () => {
  it("evaluates every assumption of the STRING fixture", () => {
    const result = check({
      source: readFileSync(join(DIRECTORY, "StringSet.tla"), "utf8"),
      config: readFileSync(join(DIRECTORY, "StringSet.cfg"), "utf8"),
    });
    expect(result.status).toBe("success");
  });

  it("fails to compare STRING with another set instead of answering FALSE", () => {
    const result = check({
      source:
        "---- MODULE M ----\nVARIABLE x\nASSUME STRING # {}\nInit == x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(
      "Attempted to compare overridden value STRING with non-overridden value:\n{}",
    );
  });
});
