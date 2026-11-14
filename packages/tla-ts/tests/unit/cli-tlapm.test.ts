import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { readMarshaled } from "../../src/prover/tlapm/ocaml-marshal";
import { FIXTURES } from "./check-harness";
import { CLI } from "./cli-harness";

const copies: string[] = [];

afterAll(() => copies.forEach((copy) => rmSync(copy, { recursive: true, force: true })));

const copyFixtures = (directory: string) => {
  const copy = mkdtempSync(join(tmpdir(), "tla-ts-tlapm-"));
  copies.push(copy);
  cpSync(join(FIXTURES, directory), copy, { recursive: true });
  return copy;
};

const runTlapmIn = (directory: string, args: string[]) =>
  spawnSync("bun", [CLI, "tlapm", ...args], { cwd: directory, encoding: "utf8" });

const runTlapm = (directory: string, args: string[]) => runTlapmIn(copyFixtures(directory), args);

describe("tlapm -N prints obligations as tlapm does", () => {
  const readExpected = (name: string) => readFileSync(join(FIXTURES, "obligations", name), "utf8");

  it("prints each obligation with its text", () => {
    const result = runTlapm("obligations", [
      "-N",
      "--toolbox",
      "0",
      "0",
      "--printallobs",
      "Proofs.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readExpected("Proofs.toolbox"));
  });

  it("numbers omitted proofs but doesn't print them", () => {
    const result = runTlapm("obligations", ["-N", "--toolbox", "0", "0", "Omit.tla"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readExpected("Omit.toolbox"));
  });

  it("generates only the proofs within the lines", () => {
    const result = runTlapm("obligations", ["-N", "--toolbox", "6", "7", "Omit.tla"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readExpected("Omit-6-7.toolbox"));
  });

  it("warns when a module's name differs from its file's", () => {
    const result = runTlapm("obligations", [
      "-N",
      "--toolbox",
      "0",
      "0",
      "--printallobs",
      "Renamed.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readExpected("Renamed.toolbox"));
  });

  it("reports the warnings tlapm reports", () => {
    const result = runTlapm("obligations", [
      "-N",
      "--toolbox",
      "0",
      "0",
      "--printallobs",
      "Warnings.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readExpected("Warnings.toolbox"));
  });

  it("reports incomplete proofs under --strict", () => {
    const result = runTlapm("obligations", ["-N", "--strict", "Incomplete.tla"]);
    expect(result.status).toBe(11);
    expect(result.stderr).toBe(readExpected("Incomplete.strict"));
  });

  it("reports a target without obligations under --strict", () => {
    const result = runTlapm("obligations", ["-N", "--strict", "--line", "2", "Proofs.tla"]);
    expect(result.status).toBe(12);
    expect(result.stderr).toBe(readExpected("Proofs-2.strict"));
  });

  it("prints the notes tlapm prints outside toolbox mode", () => {
    const result = runTlapm("obligations", ["-N", "Notes.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readExpected("Notes.stdout"));
    expect(result.stderr).toBe(readExpected("Notes.stderr"));
  });

  it("prints tlapm's header in toolbox mode", () => {
    const result = runTlapm("obligations", ["-N", "--line", "3", "Omit.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /^\n\\\* TLAPM version b91fb6c\n\\\* launched at \d{4}-\d\d-\d\d \d\d:\d\d:\d\d with command line:\n\\\* tla-ts tlapm -N --line 3 Omit\.tla\n\n$/,
    );
  });

  it("prints nothing outside toolbox mode", () => {
    const result = runTlapm("obligations", ["-N", "Proofs.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toBe("");
  });

  it("summarizes the missing and omitted proofs of each theorem", () => {
    const result = runTlapm("obligations", ["--summary", "Incomplete.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readExpected("Incomplete.summary"));
    expect(result.stderr).toBe("");
  });

  it.each([
    "Declaration",
    "Hide",
    "Label",
    "NotFound",
    "Recursive",
    "Tab",
    "Unexpected",
    "UnknownModule",
  ])("prints the error tlapm prints for %s", (name) => {
    const result = runTlapm("obligation-errors", ["-N", `${name}.tla`]);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      readFileSync(join(FIXTURES, "obligation-errors", `${name}.stderr`), "utf8"),
    );
  });

  it("names a module it cannot find", () => {
    const result = runTlapm("obligations", ["-N", "Missing.tla"]);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      'File "<unknown>":\nError: File "Missing.tla" not found\n tlapm ending abnormally with Failure("Module.Parser.parse_file")\n\n',
    );
  });
});

const readRecording = (name: string) => readFileSync(join(FIXTURES, "tlapm-cli", name), "utf8");

describe("tlapm proves with tla-ts's provers and prints what tlapm prints", () => {
  const stripTimeUsed = (output: string) =>
    output.replaceAll(/time-used: [\d.]+ \(\d+%\)/g, "time-used: <time>");

  it("reports that every obligation is proved", () => {
    const result = runTlapm("obligations", ["Proofs.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readRecording("Proofs.stdout"));
    expect(result.stderr).toBe(readRecording("Proofs.stderr"));
  });

  it("prints the obligations it couldn't prove and ends abnormally", () => {
    const result = runTlapm("tlapm-cli", ["Failures.tla"]);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe(readRecording("Failures.stdout"));
    expect(result.stderr).toBe(readRecording("Failures.stderr"));
  });

  it("exits with --strict's status for a failed obligation", () => {
    const result = runTlapm("tlapm-cli", ["--strict", "Failures.tla"]);
    expect(result.status).toBe(10);
    expect(result.stderr).toBe(readRecording("Failures.strict"));
  });

  it("prints each prover's result in toolbox mode", () => {
    const result = runTlapm("tlapm-cli", ["--threads", "1", "--toolbox", "0", "0", "Failures.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /^\n\\\* TLAPM version b91fb6c\n\\\* launched at [\d-]+ [\d:]+ with command line:\n\\\* tla-ts tlapm --threads 1 --toolbox 0 0 Failures\.tla\n\n(Zenon error: exhausted search space without finding a proof\n){2}\(\* created new "\.tlacache\/Failures\.tlaps\/Failures\.thy" \*\)\n\(\* fingerprints written in "\.tlacache\/Failures\.tlaps\/fingerprints" \*\)\n$/,
    );
    expect(stripTimeUsed(result.stderr)).toBe(stripTimeUsed(readRecording("Failures.toolbox")));
  });

  it("prints a failure it reuses for an obligation with the same fingerprint", () => {
    const result = runTlapm("tlapm-cli", ["--threads", "1", "--toolbox", "0", "0", "Twice.tla"]);
    expect(result.status).toBe(0);
    expect(stripTimeUsed(result.stderr)).toBe(stripTimeUsed(readRecording("Twice.toolbox")));
  });

  it("rejects the tlapm options it doesn't support", () => {
    const result = runTlapm("obligations", ["-C", "Proofs.tla"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("Error: tla-ts tlapm does not support the tlapm option -C.\n");
  });

  it("reports a --debug without its flags", () => {
    const result = runTlapm("obligations", ["Proofs.tla", "--debug"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("Error: option '--debug' needs an argument.\n");
  });

  it.each(["constructor", "toString", "__proto__"])(
    "reports the unknown prover %s of a pragma",
    (prover) => {
      const directory = mkdtempSync(join(tmpdir(), "tla-ts-tlapm-"));
      copies.push(directory);
      writeFileSync(
        join(directory, "Pragma.tla"),
        `---- MODULE Pragma ----\nEXTENDS Naturals, TLAPS\nMine == TRUE (*{ by (prover:"${prover}") }*)\nTHEOREM \\A x \\in Nat : x + 0 = x\n  BY Mine\n====\n`,
      );
      const result = runTlapmIn(directory, ["--threads", "1", "--toolbox", "0", "0", "Pragma.tla"]);
      expect(result.stderr).toContain(
        `@!!type:warning\n@!!msg:File "./Pragma.tla", line 3, characters 22-27 :\nUnknown prover: ${prover}\n@!!END\n`,
      );
      expect(result.stderr).toContain("@!!prover:fail\n@!!meth:time-limit: inf\n");
    },
  );

  it.each(["constructor", "toString", "__proto__"])("reports the unknown --method %s", (method) => {
    const result = runTlapm("obligations", ["--method", method, "Proofs.tla"]);
    expect(result.stderr).toContain(`--method: unknown method "${method}"\n`);
  });
});

describe("tlapm shares its cache with tlapm", () => {
  const TLAPM = process.env.TLAPM;

  const copyWithCache = () => {
    const directory = copyFixtures("tlapm-cli");
    mkdirSync(join(directory, ".tlacache/Failures.tlaps"), { recursive: true });
    cpSync(
      join(directory, "Failures.fingerprints"),
      join(directory, ".tlacache/Failures.tlaps/fingerprints"),
    );
    return directory;
  };

  const readFingerprints = (path: string) => {
    const bytes = readFileSync(path);
    const table = readMarshaled(bytes, readMarshaled(bytes, 0).next).value;
    return JSON.stringify(table, (_key, value) =>
      /^(9ed0376|Zenon version \[268\]|Isabelle2025|tla-ts .*)$/.test(value) ||
      (value?.fields?.length === 6 && value.fields.every(Number.isInteger))
        ? "<stored>"
        : value,
    );
  };

  it("writes the theory and the fingerprints tlapm writes", () => {
    const directory = copyFixtures("tlapm-cli");
    runTlapmIn(directory, ["Failures.tla"]);
    expect(readFileSync(join(directory, ".tlacache/Failures.tlaps/Failures.thy"), "utf8")).toBe(
      readRecording("Failures.thy"),
    );
    expect(readFingerprints(join(directory, ".tlacache/Failures.tlaps/fingerprints"))).toBe(
      readFingerprints(join(directory, "Failures.fingerprints")),
    );
  });

  it("reuses what tlapm concluded", () => {
    const result = runTlapmIn(copyWithCache(), [
      "--threads",
      "1",
      "--toolbox",
      "0",
      "0",
      "Failures.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      '(* loading fingerprints in ".tlacache/Failures.tlaps/fingerprints" *)\n',
    );
    expect(result.stderr).toBe(readRecording("Failures.reused"));
  });

  it.each(["--nofp", "--cleanfp"])("proves again under %s", (option) => {
    const result = runTlapmIn(copyWithCache(), [option, "Failures.tla"]);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe(readRecording(`Failures.${option.slice(2)}`));
    expect(result.stderr).toBe(readRecording("Failures.stderr"));
  });

  it.runIf(TLAPM !== undefined)("writes fingerprints tlapm reuses", () => {
    const directory = copyFixtures("tlapm-cli");
    runTlapmIn(directory, ["Failures.tla"]);
    const result = spawnSync(
      TLAPM ?? "tlapm",
      ["--threads", "1", "--toolbox", "0", "0", "Failures.tla"],
      { cwd: directory, encoding: "utf8" },
    );
    expect(result.stderr).toBe(readRecording("Failures.reused"));
  });
});
