import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "@typescript/typescript6";
import { describe, expect, it } from "vite-plus/test";
import { createLibrary, createProgram } from "../../src/typescript/program";
import { createMemorySystem } from "../../src/typescript/system";

// The texts of lib.esnext.d.ts and the declaration files it references, as the website bundled them
// before it bundled every one.
const getEsnextLibraries = (fileName: string, libraries: Map<string, string>) => {
  if (libraries.has(fileName)) return libraries;
  const text = readFileSync(join(dirname(ts.getDefaultLibFilePath({})), fileName), "utf8");
  libraries.set(fileName, text);
  for (const match of text.matchAll(/<reference lib="([^"]+)"/g)) {
    getEsnextLibraries(`lib.${match[1]}.d.ts`, libraries);
  }
  return libraries;
};

const SOURCE = "export const seen = new Set<number>();\n";

// A program of a page's project, whose options its tsconfig.json gives, on a host that gives the
// texts of only the declaration files that lib.esnext.d.ts reads.
const createPageProgram = (options: string) =>
  createProgram(
    SOURCE,
    "/project/seen.ts",
    createLibrary(getEsnextLibraries("lib.esnext.d.ts", new Map())),
    createMemorySystem(
      new Map([["/project/tsconfig.json", `{ "compilerOptions": ${options} }\n`]]),
      { fileName: "/project/seen.ts", source: SOURCE },
    ),
  );

// Without the declaration file that a project's target names, TypeScript's checker finds no
// global, as Set, and the model's state would lose a Set that Node keeps.
describe("read a project's declaration files from a host that gives their texts", () => {
  it("stops where the host gives no text of the target's default library", () => {
    expect(() => createPageProgram('{ "target": "ES2022" }')).toThrow(
      "tla-ts can't read the declaration file lib.es2022.full.d.ts, which the project's options name, as the host gives no text of it",
    );
  });

  it("reads Set's type in a project whose libraries the host gives", () => {
    const program = createPageProgram('{ "target": "ES2022", "lib": ["ESNext"] }');
    const statement = program.sourceFile.statements[0];
    if (!ts.isVariableStatement(statement)) throw new Error("expected seen's declaration");
    const name = statement.declarationList.declarations[0].name;
    expect(program.checker.typeToString(program.checker.getTypeAtLocation(name))).toBe(
      "Set<number>",
    );
  });
});
