import { afterAll, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { createProgress, getHost, runTest } from "../scripts/hosts";
import {
  getContexts,
  getCorrection,
  getRecording,
  isSameFiles,
  keepCorrection,
  parseTest,
  renderTest,
  SUITE_DIRECTORY,
  writeRecordings,
} from "../scripts/test-file";
import { getMessageCodes, normalizeFile, normalizeTranscript } from "../scripts/transcript";
import { getValueFileText } from "../scripts/value-file";

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

describe("normalizeFile", () => {
  it("drops the run directory and the date a trace spec was generated on", () => {
    expect(
      normalizeFile(
        'IODeserialize("/tmp/run/te_out.bin", TRUE)\n\\* Generated on Sat Nov 21 17:09:57 PST 2026\n',
        "/tmp/run",
      ),
    ).toBe('IODeserialize("te_out.bin", TRUE)\n\\* Generated on <date>\n');
  });
});

describe("getValueFileText", () => {
  const tlcTrace = readFileSync(
    join(import.meta.dirname, "../../tla-ts/tests/fixtures/load-trace/MCDieHarder.bin"),
  );

  it("reads each value with the variable location of every string it holds", () => {
    const lines = getValueFileText(tlcTrace).split("\n");
    expect(lines[0]).toBe("values: 1");
    expect(lines[1]).toContain(
      '<<6, [contents |-> ("j1" :> 2 @@ "j2" :> 5)]>>, [name |-> "JugToJug", location |-> [beginLine |-> 62, beginColumn |-> 7, endLine |-> 63, endColumn |-> 59, module |-> "DieHarder"], context |-> [j |-> "j2", k |-> "j1"], parameters |-> <<"j", "k">>], <<7, [contents |-> ("j1" :> 3 @@ "j2" :> 4)]>>',
    );
    expect(lines.slice(2, 5)).toEqual(["strings:", '"vars" loc -1', '"contents" loc 0']);
  });

  it("counts every value the file holds", () => {
    const data = gunzipSync(tlcTrace);
    const lines = getValueFileText(gzipSync(Buffer.concat([data, data]))).split("\n");
    expect([lines[0], lines[2]]).toEqual(["values: 2", lines[1]]);
  });

  it("reports a file cut short", () => {
    expect(getValueFileText(gzipSync(gunzipSync(tlcTrace).subarray(0, 100)))).toMatch(
      /^undecodable: /,
    );
  });
});

describe("isSameFiles", () => {
  it("tells recordings apart by the text of any file, or by whether it was written", () => {
    const recording = { exit: 0, files: { "states.dot": "digraph", "te_out.bin": null } };
    const isSameAs = (files: Record<string, string | null>) =>
      isSameFiles(recording, { exit: 0, files });
    expect([
      isSameAs({ "te_out.bin": null, "states.dot": "digraph" }),
      isSameAs({ "states.dot": "digraph", "te_out.bin": "values: 1" }),
      isSameAs({ "states.dot": "digraph" }),
      isSameAs({}),
    ]).toEqual([true, false, false, false]);
    expect(isSameFiles({ exit: 0 }, { exit: 0, files: {} })).toBe(true);
  });
});

describe("writeRecordings and renderTest", () => {
  const directory = mkdtempSync(join(tmpdir(), "conformance-harness-"));
  afterAll(() => rmSync(directory, { recursive: true, force: true }));

  it("keep the blank lines that end a recording's last file", () => {
    const path = join(directory, "sample.tla");
    const test = parseTest(path, SOURCE);
    if (!test) throw new Error("expected a test");
    const files = { "states.dump": "State 1:\nx = 0\n\n" };
    writeRecordings(test, { model: { exit: 0, files } });
    expect(parseTest(path, readFileSync(path, "utf8"))?.recordings).toEqual({
      all: { exit: 0, files },
    });
  });

  it("keep the blank lines that end a header's last field", () => {
    const metadata = { description: "A test.", outcome: "success", config: "INIT Init\n\n" };
    const module = "---- MODULE sample ----\n====\n";
    expect(parseSample(renderTest(metadata, module)).metadata).toEqual(metadata);
  });
});

describe("runTest on a module that lists files", () => {
  const test = parseSample(
    "(*---\ndescription: A test.\noutcome: success\nfiles: [out.txt, missing.txt]\n---*)\n---- MODULE sample ----\n====\n",
  );

  it("records each file the run writes, and null for one it doesn't", async () => {
    const script = 'require("fs").writeFileSync("out.txt", process.cwd() + "/sample.tla")';
    const result = await runTest({ tlc: ["node", "-e", script, "--"] }, test, getContexts(test)[0]);
    expect(result.files).toEqual({ "out.txt": "sample.tla", "missing.txt": null });
  });
});

describe("getMessageCodes", () => {
  it("ignores printed lines and message text", () => {
    expect(getMessageCodes("| 2190:0 printed\n2190:0 a\nb\n2199:0 c")).toBe("2190 2199");
  });
});

describe("getHost", () => {
  it("splits a custom host command into its arguments for every suite", () => {
    const command = ["node", "--stack-size=8000", "cli.js"];
    expect(getHost("node --stack-size=8000 cli.js")).toEqual({
      tlc: command,
      tlapm: command,
      backend: command,
    });
  });

  it("keeps a quoted path with a space as one argument", () => {
    expect(getHost(`node "/my tools/cli.js" --library='/a b'  -deadlock`).tlc).toEqual([
      "node",
      "/my tools/cli.js",
      "--library=/a b",
      "-deadlock",
    ]);
  });
});

describe("runTest on the input of a backend", () => {
  const test = parseTest(
    join(SUITE_DIRECTORY, "tlapm/backends/z3/sample.smt"),
    "(*---\ndescription: A test.\noutcome: unsat\n---*)\n(check-sat)\n",
  );
  if (!test) throw new Error("expected a test");
  const runScript = (script: string) =>
    runTest({ backend: ["node", "-e", script] }, test, getContexts(test)[0]);

  it("tells the input of a backend from a module", () => {
    expect(test.kind).toBe("backend");
    expect(parseSample(SOURCE).kind).toBe("tlc");
    expect(parseTest(join(SUITE_DIRECTORY, "tlapm/proofs/sample.tla"), SOURCE)?.kind).toBe("tlapm");
  });

  it("gives the backend's name and file to a host's command", async () => {
    expect(await runScript("console.log(process.argv.slice(1).join(' '))")).toEqual({
      exit: 0,
      exceeded: undefined,
      transcript: "z3 sample.smt",
    });
  });

  it("reports the exit status of a host that throws", async () => {
    expect((await runScript("throw new Error('no verdict')")).exit).toBe(1);
  });
});

describe("createProgress", () => {
  it("reports once each time the run count passes the interval", () => {
    const isProgressDue = createProgress(500);
    expect(
      [499, 500, 501, 504, 505, 998, 1003, 1004, 2600, 2601].map((count) => isProgressDue(count)),
    ).toEqual([false, true, false, false, false, false, true, false, true, false]);
  });
});
