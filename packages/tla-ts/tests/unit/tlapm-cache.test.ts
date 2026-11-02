import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { readMarshaled } from "../../src/prove/tlapm/ocaml-marshal";
import { getKnownResults, loadFingerprints } from "../../src/prove/tlapm/cache";

// The fingerprints tlapm 9ed0376 wrote for tlapm-cli/Failures.tla.
const FINGERPRINTS = join(import.meta.dirname, "../fixtures/tlapm-cli/Failures.fingerprints");

const directory = mkdtempSync(join(tmpdir(), "tla-ts-fingerprints-"));

afterAll(() => rmSync(directory, { recursive: true, force: true }));

const readValues = (path: string) => {
  const bytes = readFileSync(path);
  const magic = readMarshaled(bytes, 0);
  return [magic.value, readMarshaled(bytes, magic.next).value];
};

const getProvers = (isSafe: boolean) => {
  const table = new Map();
  loadFingerprints(table, FINGERPRINTS, isSafe);
  return [...getKnownResults(table).results.values()]
    .flatMap((results) => [...results.keys()])
    .sort();
};

describe("tlapm's fingerprints file", () => {
  it("writes back what it reads, in the buckets tlapm hashes each fingerprint into", () => {
    const table = new Map();
    loadFingerprints(table, FINGERPRINTS, false);
    getKnownResults(table).save(join(directory, "fingerprints"));
    expect(readValues(join(directory, "fingerprints"))).toEqual(readValues(FINGERPRINTS));
  });

  it("reads what each prover concluded", () => {
    expect(getProvers(false)).toEqual(["isabelle", "smt", "zenon", "zenon"]);
  });

  it("trusts no Zenon or Isabelle result of other versions under --safefp", () => {
    expect(getProvers(true)).toEqual(["smt"]);
  });
});
