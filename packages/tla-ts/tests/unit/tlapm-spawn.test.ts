import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vite-plus/test";
import { prove } from "../../src";
import { TlaProverError } from "../../src/errors";

const FIXTURES = join(import.meta.dirname, "../fixtures/prove");

const loadModule = (name: string) => {
  const path = join(FIXTURES, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

const directory = mkdtempSync(join(tmpdir(), "tla-ts-spawn-"));

const stubTlapm = (name: string, script: string, mode: number) => {
  const binaries = join(directory, name, "bin");
  const scratch = join(directory, name, "tmp");
  mkdirSync(binaries, { recursive: true });
  mkdirSync(scratch);
  writeFileSync(join(binaries, "tlapm"), script, { mode });
  vi.stubEnv("PATH", `${binaries}:/bin:/usr/bin`);
  vi.stubEnv("TMPDIR", scratch);
  return { binaries, scratch };
};

const proveWithTlapm = (onObligation?: (id: number) => void) =>
  prove({
    source: loadModule("HourClock_proof") ?? "",
    loadModule,
    backend: "tlapm",
    onObligation: (obligation) => onObligation?.(obligation.id),
  });

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe("prove with the tlapm backend", () => {
  it("reads each result as tlapm prints it, whole or in pieces", async () => {
    const paths = stubTlapm(
      "pieces",
      [
        "#!/bin/sh",
        "printf '@!!BEGIN\\n@!!type:obligation\\n@!!id:1\\n@!!status:to be proved\\n@!!END\\n\\n' >&2",
        "printf '@!!BEGIN\\n@!!type:obligation\\n@!!id:1\\n@!!status:proved\\n@!!prover:smt\\n@!!END\\n\\n@!!BEG' >&2",
        "sleep 0.2",
        "printf 'IN\\n@!!type:obligation\\n@!!id:2\\n@!!status:fai' >&2",
        "sleep 0.2",
        "printf 'led\\n@!!reason:false\\n@!!END\\n\\n@!!BEGIN\\n@!!type:obligation\\n@!!id:3\\n@!!status:trivial\\n@!!E' >&2",
        "sleep 0.2",
        "printf 'ND\\n\\n@!!BEGIN\\n@!!type:obligation\\n@!!id:4\\n@!!status:proved\\n@!!prover:zenon\\n' >&2",
      ].join("\n"),
      0o755,
    );
    const reported: number[] = [];
    const result = await proveWithTlapm((id) => reported.push(id));
    expect(reported).toEqual([1, 2, 3]);
    expect(result.obligations.slice(0, 4).map((obligation) => [obligation.id, obligation])).toEqual(
      [
        [1, expect.objectContaining({ status: "proved", prover: "smt" })],
        [2, expect.objectContaining({ status: "failed", reason: "false" })],
        [3, expect.objectContaining({ status: "trivial" })],
        [4, expect.objectContaining({ status: "unsupported", reason: "tlapm reported no result" })],
      ],
    );
    expect(readdirSync(paths.scratch)).toEqual([]);
  });

  it("cleans up and throws when tlapm can't start", async () => {
    const paths = stubTlapm("unstartable", "", 0o644);
    await expect(proveWithTlapm()).rejects.toThrow(
      new TlaProverError(`spawn ${join(paths.binaries, "tlapm")} EACCES`),
    );
    expect(readdirSync(paths.scratch)).toEqual([]);
  });
});
