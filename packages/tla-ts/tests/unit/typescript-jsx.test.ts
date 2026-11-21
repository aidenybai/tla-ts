import ts from "@typescript/typescript6";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { rewriteJsx } from "../../src/typescript/jsx";
import { compileAndCheck } from "./compile-worker";

const getFixture = (name: string) => {
  const path = join(import.meta.dirname, `../fixtures/typescript/jsx/${name}`);
  return { path, source: readFileSync(path, "utf8") };
};

describe("compiles JSX as the calls that TypeScript emits for it", () => {
  // Skipped until ESCore runs JSX: its compile stops at the JSX runtime's import and at a
  // namespace's declaration.
  it.skip.each(["automatic.tsx", "classic.tsx", "imports.ts", "project/factory.tsx"])(
    "agrees with Node on %s",
    async (name) => {
      const fixture = getFixture(name);
      const checked = await compileAndCheck(fixture.source, fixture.path);
      expect(checked.error).toBeUndefined();
      expect(checked.failure).toBeUndefined();
    },
  );

  // Skipped until ESCore runs JSX, as above.
  it.skip.each([
    ["automatic.tsx", "one & two", "one &amp; two"],
    ["automatic.tsx", "jsx:li#1", "jsxs:li#1"],
    ["automatic.tsx", "createElement:a(id=rest,lang=en,key=last", "jsx:a#last(id=rest,lang=en"],
    ["classic.tsx", "b()[total |3]|text", "b()[total 3]| text"],
    ["imports.ts", "jsx:b(children=x)", "jsx:b(children=[x])"],
    ["project/factory.tsx", "group()[a(href)[text]]", "jsx:group()"],
  ])("rejects another outcome of %s than %s", async (name, expected, wrong) => {
    const fixture = getFixture(name);
    const checked = await compileAndCheck(fixture.source.replace(expected, wrong), fixture.path);
    expect(checked.failure).toContain("seen ");
    expect(checked.failure).toContain(expected);
  });

  // Skipped until ESCore runs JSX, as above, and names a spec after its file rather than Program.
  it.skip("checks the actions and invariants of a file that renders JSX", async () => {
    const fixture = getFixture("likes.tsx");
    const checked = await compileAndCheck(fixture.source, fixture.path);
    expect(checked.name).toBe("Likes");
    expect(checked.violated).toBe("showsNoNegativeCount");
  });

  // Skipped until ESCore's compile names TypeScript's syntax errors as TypeScript formats them,
  // with the file, the position, and the code.
  it.skip("stops on the syntax error that TypeScript gives JSX", async () => {
    expect((await compileAndCheck("export const view = <b>text;\n", "unclosed.tsx")).error).toMatch(
      /unclosed\.tsx\(1,22\): error TS17008: JSX element 'b' has no corresponding closing tag/,
    );
  });

  // Skipped until ESCore runs JSX, as above.
  it.skip("compiles JSX without a file system", async () => {
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

  it("keeps each line of code on its line", () => {
    const fixture = getFixture("automatic.tsx");
    const lines = fixture.source.split("\n");
    const rewritten = rewriteJsx(fixture.path, fixture.source, {}, ts.createCompilerHost({})).split(
      "\n",
    );
    expect(rewritten).toHaveLength(lines.length);
    const line = lines.findIndex((text) => text.includes("item * count"));
    expect(rewritten[line]).toContain("item * count");
    const end = lines.indexOf('].join("\\n");');
    expect(rewritten.slice(end)).toEqual(lines.slice(end));
  });
});
