import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { getTlcVersion } from "../../src/tlc-version";

const FIXTURES = join(import.meta.dirname, "../fixtures");

describe("getTlcVersion", () => {
  it("reads the version from the Git tag in a jar's manifest", () => {
    expect(getTlcVersion(join(FIXTURES, "xml-export", "tla2tools-1.7.4.jar"))).toBe("1.7.4");
  });

  it("follows the master builds without a jar to read", () => {
    expect(getTlcVersion(undefined)).toBe("master");
    expect(getTlcVersion(join(FIXTURES, "xml-export", "missing.jar"))).toBe("master");
  });
});
