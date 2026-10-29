import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { prove, type ProofObligation, TlaUnsupportedError } from "../../src";
import { getObligations } from "../../src/obligations";
import { encodeForBackend } from "../../src/prove/prove";
import { TLAPS_MODULE } from "../../src/prove/tlaps-module";

// HourClock and Simple come from tlaplus/Examples. Each .smt file is the input tlapm sent to its
// SMT solver for that obligation.
const DIRECTORY = join(import.meta.dirname, "../fixtures/prove");

const loadModule = (name: string) => {
  const path = join(DIRECTORY, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

const proveFixture = (
  name: string,
  options: { signal?: AbortSignal; backend?: "tla-ts" | "tlapm" } = {},
) => prove({ source: loadModule(name) ?? "", loadModule, ...options });

// tlapm's comments name its version and the obligation, so only the commands are compared.
const getCommands = (script: string) =>
  script
    .split("\n")
    .filter((line) => !line.startsWith(";"))
    .join(" ")
    .split(/\s+/)
    .join(" ")
    .trim();

const encodeFixture = (name: string, id: number) => {
  const obligation = getObligations(
    [{ file: `${name}.tla`, source: loadModule(name) ?? "" }],
    (moduleName) => {
      const source = loadModule(moduleName) ?? (moduleName === "TLAPS" ? TLAPS_MODULE : undefined);
      return source === undefined ? undefined : { file: `${moduleName}.tla`, source };
    },
  )
    .flatMap((result) => result.obligations)
    .find((innerObligation) => innerObligation.id === id);
  if (!obligation) throw new Error(`no obligation ${id}`);
  return encodeForBackend(obligation, "smt", { caseErrors: 0 });
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("prove follows tlapm's default method", () => {
  it("proves what tlapm proves, with the prover tlapm used", async () => {
    const result = await proveFixture("HourClock_proof");
    expect(
      result.obligations.map((obligation) => [
        obligation.id,
        obligation.status === "proved" ? obligation.prover : obligation.status,
      ]),
    ).toEqual([
      [1, "ls4"],
      [2, "trivial"],
      [3, "trivial"],
      [4, "trivial"],
      [5, "smt"],
      [6, "smt"],
    ]);
  });

  it("reports each obligation as it finishes", async () => {
    const reported: ProofObligation[] = [];
    const result = await prove({
      source: loadModule("HourClock_proof") ?? "",
      loadModule,
      onObligation: (obligation) => reported.push(obligation),
    });
    expect(reported).toEqual(result.obligations);
    expect(result.obligations).toHaveLength(6);
  });

  it("stops when its signal aborts", async () => {
    const controller = new AbortController();
    const proving = prove({
      source: loadModule("HourClock_proof") ?? "",
      loadModule,
      signal: controller.signal,
      onObligation: () => controller.abort(),
    });
    await expect(proving).rejects.toThrow(controller.signal.reason);
  });

  it("needs tlapm on the PATH for the tlapm backend", async () => {
    vi.stubEnv("PATH", "");
    await expect(proveFixture("HourClock_proof", { backend: "tlapm" })).rejects.toThrow(
      TlaUnsupportedError,
    );
  });
});

describe("SMT-LIB encoding matches tlapm", () => {
  it("encodes an action with an IF and a primed variable", () => {
    expect(getCommands(encodeFixture("HourClock_proof", 6))).toBe(
      getCommands(readFileSync(join(DIRECTORY, "HourClock_proof-6.smt"), "utf8")),
    );
  });

  it("flattens functions and shares the ones with the same body", () => {
    expect(getCommands(encodeFixture("Simple_proof", 7))).toBe(
      getCommands(readFileSync(join(DIRECTORY, "Simple_proof-7.smt"), "utf8")),
    );
  });
});
