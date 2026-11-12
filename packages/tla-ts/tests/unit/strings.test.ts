import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { checkFixture } from "./check-harness";

describe("STRING matches TLC's Strings class", () => {
  it("evaluates every assumption of the STRING fixture", async () => {
    const result = await checkFixture("strings", "StringSet");
    expect(result.status).toBe("success");
  });

  it("compares Nat, Int, and Seq(S) like TLC's Java classes", async () => {
    const result = await checkFixture("strings", "OverriddenSets");
    expect(result.status).toBe("success");
  });

  it("fails to compare STRING with another set instead of answering FALSE", async () => {
    const result = await check({
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
