import ts from "@typescript/typescript6";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { compileAndCheck } from "./compile-worker";

const getFixture = (name: string) => {
  const path = join(import.meta.dirname, `../fixtures/typescript/jsx/${name}`);
  return { path, source: readFileSync(path, "utf8") };
};

describe("compiles JSX as the calls that TypeScript emits for it", () => {
  it.each(["classic.tsx", "project/factory.tsx"])("agrees with Node on %s", async (name) => {
    const fixture = getFixture(name);
    const checked = await compileAndCheck(fixture.source, fixture.path);
    expect(checked.error).toBeUndefined();
    expect(checked.failure).toBeUndefined();
  });

  // A script's check fails with what it throws, as its Init's failure.
  it.each([
    ["classic.tsx", "b()[total |3]|text", "b()[total 3]| text"],
    ["project/factory.tsx", "group()[a(href)[text]]", "jsx:group()"],
  ])("rejects another outcome of %s than %s", async (name, expected, wrong) => {
    const fixture = getFixture(name);
    const checked = await compileAndCheck(fixture.source.replace(expected, wrong), fixture.path);
    expect(checked.failure).toContain("seen ");
    expect(checked.failure).toContain(expected);
  });

  // Skipped as Node can't load these: TypeScript writes their imports as ./runtime/jsx-runtime and
  // ./view, which Node's ES module resolution finds no file for without an extension.
  it.skip.each([
    ["automatic.tsx", "one & two", "one &amp; two"],
    ["automatic.tsx", "jsx:li#1", "jsxs:li#1"],
    ["automatic.tsx", "createElement:a(id=rest,lang=en,key=last", "jsx:a#last(id=rest,lang=en"],
    ["imports.ts", "jsx:b(children=x)", "jsx:b(children=[x])"],
  ])(
    "rejects another outcome of %s than %s, which Node can't load",
    async (name, expected, wrong) => {
      const fixture = getFixture(name);
      expect((await compileAndCheck(fixture.source, fixture.path)).error).toBeUndefined();
      const checked = await compileAndCheck(fixture.source.replace(expected, wrong), fixture.path);
      expect(checked.error).toContain(expected);
    },
  );

  // Skipped until JS.tla names a spec after its file rather than Program.
  it.skip("checks the actions and invariants of a file that renders JSX", async () => {
    const fixture = getFixture("likes.tsx");
    const checked = await compileAndCheck(fixture.source, fixture.path);
    expect(checked.name).toBe("Likes");
    expect(checked.violated).toBe("showsNoNegativeCount");
  });

  it("stops on the syntax error that TypeScript gives JSX", async () => {
    expect((await compileAndCheck("export const view = <b>text;\n", "unclosed.tsx")).error).toMatch(
      /unclosed\.tsx:1:22 JSX element 'b' has no corresponding closing tag/,
    );
  });

  it("compiles JSX without a file system", async () => {
    const directory = dirname(ts.getDefaultLibFilePath({}));
    const libraries = new Map(
      readdirSync(directory)
        .filter((fileName) => /^lib\..*\.d\.ts$/.test(fileName))
        .map((fileName) => [fileName, readFileSync(join(directory, fileName), "utf8")]),
    );
    expect(
      (await compileAndCheck(getFixture("likes.tsx").source, "likes.tsx", libraries)).violated,
    ).toBe("showsNoNegativeCount");
  });
});
