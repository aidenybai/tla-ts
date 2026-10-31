import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

// HourClock comes from tlaplus/Examples. Workers load from the build, as in a package.
const DIRECTORY = join(import.meta.dirname, "../fixtures/prove");
const DIST = join(import.meta.dirname, "../../dist/index.js");

const loadPackage = (): Promise<typeof import("../../src")> => import(DIST);

const loadModule = (name: string) => {
  const path = join(DIRECTORY, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

describe("prove with workers matches one thread", () => {
  it.each([2, 3])("proves HourClock with %i workers, reporting in order", async (workers) => {
    const tlaTs = await loadPackage();
    const source = loadModule("HourClock_proof") ?? "";
    const sequential = await tlaTs.prove({ source, loadModule });
    const reported: number[] = [];
    const result = await tlaTs.prove({
      source,
      loadModule,
      workers,
      onObligation: (obligation) => reported.push(obligation.id),
    });
    expect(result).toEqual(sequential);
    expect(reported).toEqual(sequential.obligations.map((obligation) => obligation.id));
  });

  it("stops when its signal aborts", async () => {
    const tlaTs = await loadPackage();
    const controller = new AbortController();
    const proving = tlaTs.prove({
      source: loadModule("HourClock_proof") ?? "",
      loadModule,
      workers: 2,
      signal: controller.signal,
      onObligation: () => controller.abort(),
    });
    await expect(proving).rejects.toThrow(controller.signal.reason);
  });
});
