import { describe, expect, it } from "vite-plus/test";
import { join } from "node:path";
import {
  getContexts,
  getCorrection,
  getRecording,
  keepCorrection,
  parseTest,
  SUITE_DIRECTORY,
} from "../scripts/test-file";
import { getMessageCodes, normalizeTranscript } from "../scripts/transcript";

const SOURCE = `(*---
description: A test.
outcome: success
flags: [expression]
---*)
---- MODULE sample ----
Test == TRUE
====
`;

const RECORDED = `${SOURCE}
(*--- recorded
all:
  exit: 0
---*)
`;

const parseSample = (text: string) => {
  const test = parseTest(join(SUITE_DIRECTORY, "tlc/sample.tla"), text);
  if (!test) throw new Error("expected a test");
  return test;
};

describe("parseTest", () => {
  it("treats a file without a header as a fixture", () => {
    expect(
      parseTest(join(SUITE_DIRECTORY, "tlc/Fixture.tla"), "---- MODULE Fixture ----\n====\n"),
    ).toBeUndefined();
  });

  it("gives a recorded test the same source as an unrecorded one", () => {
    expect(parseSample(RECORDED).source).toBe(parseSample(SOURCE).source);
    expect(getRecording(parseSample(RECORDED), "next")).toEqual({ exit: 0 });
  });
});

describe("getCorrection", () => {
  const corrected = parseSample(
    RECORDED.replace("outcome: success\n", "outcome: success\ncorrect:\n  all:\n    exit: 10\n"),
  );

  it("gives a test's correct outcome next to the recording of its oracle", () => {
    expect([getCorrection(corrected, "next"), getRecording(corrected, "next")]).toEqual([
      { exit: 10 },
      { exit: 0 },
    ]);
  });

  it("keeps the correct outcome while the module stays the same", () => {
    const metadata = { description: "A test.", outcome: "success" };
    const module = "---- MODULE sample ----\nTest == TRUE\n====\n";
    expect(keepCorrection(corrected, metadata, module).correct).toEqual({ all: { exit: 10 } });
    expect(keepCorrection(corrected, metadata, module.replace("TRUE", "FALSE")).correct).toBe(
      undefined,
    );
  });
});

describe("getContexts", () => {
  it("appends each context inside the module and keeps the test's line numbers", () => {
    const contexts = getContexts(parseSample(SOURCE));
    expect(contexts.map((context) => context.name)).toEqual([
      "assume",
      "init",
      "next",
      "invariant",
      "property",
    ]);
    contexts.forEach((context) => {
      expect(context.source.split("\n")[6]).toBe("Test == TRUE");
      expect(context.source.trimEnd().endsWith("====")).toBe(true);
    });
  });

  it("keeps only the contexts a test names", () => {
    const test = parseSample(SOURCE.replace("flags:", "contexts: [next]\nflags:"));
    expect(getContexts(test).map((context) => context.name)).toEqual(["next"]);
  });
});

describe("normalizeTranscript", () => {
  const options = { directory: "/tmp/run", isStateSpaceRelevant: true };

  it("drops what differs between runs and keeps what a host must match", () => {
    const output = [
      "@!@!@STARTMSG 2262:0 @!@!@",
      "TLC2 Version 2026.11.03",
      "@!@!@ENDMSG 2262 @!@!@",
      "Parsing file /tmp/run/sample.tla",
      "printed",
      "@!@!@STARTMSG 2190:0 @!@!@",
      "Finished computing initial states: 1 distinct state generated at 2026-11-05 14:16:46.",
      "@!@!@ENDMSG 2190 @!@!@",
      "@!@!@STARTMSG 2116:1 @!@!@",
      "Temporal property neg_prop_146115 was violated in /tmp/run/sample.tla.",
      "@!@!@ENDMSG 2116 @!@!@",
    ].join("\n");
    expect(normalizeTranscript(output, options)).toBe(
      [
        "| printed",
        "2190:0 Finished computing initial states: 1 distinct state generated at <date>.",
        "2116:1 Temporal property neg_prop_<id> was violated in sample.tla.",
      ].join("\n"),
    );
  });

  it("leaves out the state counts of a harness wrapper", () => {
    const output = "@!@!@STARTMSG 2199:0 @!@!@\n1 states generated\n@!@!@ENDMSG 2199 @!@!@";
    expect(normalizeTranscript(output, { ...options, isStateSpaceRelevant: false })).toBe("");
  });
});

describe("getMessageCodes", () => {
  it("ignores printed lines and message text", () => {
    expect(getMessageCodes("| 2190:0 printed\n2190:0 a\nb\n2199:0 c")).toBe("2190 2199");
  });
});
