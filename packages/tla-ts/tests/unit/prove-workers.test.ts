import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

// HourClock comes from tlaplus/Examples. Workers load from the build, as in a package.
const DIRECTORY = join(import.meta.dirname, "../fixtures/prove");
const DIST = join(import.meta.dirname, "../../dist/index.js");

const tlaTs: typeof import("../../src") = await import(DIST);

const loadModule = (name: string) => {
  const path = join(DIRECTORY, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

const SOURCE = loadModule("HourClock_proof") ?? "";

describe("prove with workers matches one thread", () => {
  it.each([2, 3])("proves HourClock with %i workers, reporting in order", async (workers) => {
    const sequential = await tlaTs.prove({ source: SOURCE, loadModule });
    const reported: number[] = [];
    const result = await tlaTs.prove({
      source: SOURCE,
      loadModule,
      workers,
      onObligation: (obligation) => reported.push(obligation.id),
    });
    expect(result).toEqual(sequential);
    expect(reported).toEqual(sequential.obligations.map((obligation) => obligation.id));
  });

  it("stops when its signal aborts", async () => {
    const controller = new AbortController();
    const proving = tlaTs.prove({
      source: SOURCE,
      loadModule,
      workers: 2,
      signal: controller.signal,
      onObligation: () => controller.abort(),
    });
    await expect(proving).rejects.toThrow(controller.signal.reason);
  });
});
