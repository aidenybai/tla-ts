import ts from "@typescript/typescript6";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { compile } from "../../src/typescript/compile";
import { rewriteJsx } from "../../src/typescript/jsx";
import { createLibrary } from "../../src/typescript/program";

const getFixture = (name: string) => {
  const path = join(import.meta.dirname, `../fixtures/typescript/jsx/${name}`);
  return { path, source: readFileSync(path, "utf8") };
};

describe("compiles JSX as the calls that TypeScript emits for it", () => {
  it.each(["automatic.tsx", "classic.tsx", "imports.ts", "project/factory.tsx"])(
    "agrees with Node on %s",
    async (name) => {
      const fixture = getFixture(name);
      expect((await check(compile(fixture.source, fixture.path))).failure).toBeUndefined();
    },
  );

  it.each([
    ["automatic.tsx", "one & two", "one &amp; two"],
    ["automatic.tsx", "jsx:li#1", "jsxs:li#1"],
    ["automatic.tsx", "createElement:a(id=rest,lang=en,key=last", "jsx:a#last(id=rest,lang=en"],
    ["classic.tsx", "b()[total |3]|text", "b()[total 3]| text"],
    ["imports.ts", "jsx:b(children=x)", "jsx:b(children=[x])"],
    ["project/factory.tsx", "group()[a(href)[text]]", "jsx:group()"],
  ])("rejects another outcome of %s than %s", async (name, expected, wrong) => {
    const fixture = getFixture(name);
    const result = await check(compile(fixture.source.replace(expected, wrong), fixture.path));
    expect(result.failure?.message).toContain("seen ");
    expect(result.failure?.message).toContain(expected);
  });

  it("checks the actions and invariants of a file that renders JSX", async () => {
    const fixture = getFixture("likes.tsx");
    const compiled = compile(fixture.source, fixture.path);
    expect(compiled.name).toBe("Likes");
    expect((await check(compiled)).violation?.name).toBe("showsNoNegativeCount");
  });

  it("stops on the type error that TypeScript gives JSX", () => {
    const fixture = getFixture("mistyped.tsx");
    expect(() => compile(fixture.source, fixture.path)).toThrow(
      /mistyped\.tsx\(4,28\): error TS2322: Type 'number' is not assignable/,
    );
  });

  it("stops on the syntax error that TypeScript gives JSX", () => {
    expect(() => compile("export const view = <b>text;\n", "unclosed.tsx")).toThrow(
      /unclosed\.tsx\(1,22\): error TS17008: JSX element 'b' has no corresponding closing tag/,
    );
  });

  it("compiles JSX without a file system", async () => {
    const directory = dirname(ts.getDefaultLibFilePath({}));
    const library = createLibrary(
      new Map(
        readdirSync(directory)
          .filter((fileName) => /^lib\..*\.d\.ts$/.test(fileName))
          .map((fileName) => [fileName, readFileSync(join(directory, fileName), "utf8")]),
      ),
    );
    const compiled = compile(getFixture("likes.tsx").source, "likes.tsx", library);
    expect((await check(compiled)).violation?.name).toBe("showsNoNegativeCount");
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

  it("type checks the code around JSX where the file has it", () => {
    const fixture = getFixture("likes.tsx");
    expect(() =>
      compile(fixture.source.replace("!getView()", "!getView().missing"), fixture.path),
    ).toThrow(/likes\.tsx\(33,54\): error TS2339/);
  });
});
