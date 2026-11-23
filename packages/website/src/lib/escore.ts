import type { Library } from "../../../tla-ts/src/typescript/program";
import { compileEscore } from "../../../tla-ts/src/typescript/spec/api";
import type { EscoreRuntime } from "../../../tla-ts/src/typescript/spec/prepare";
import type { Compilation } from "./compilation";

// A definition's text ends before the next line that starts a definition, as its own later lines
// are indented.
const DEFINITION_END = /\n(?=\S)/g;

// A file compiled by specializing ESCore: the module of the program's code, where each declaration
// at the top of the file marks the definitions it compiles to.
export const getEscoreCompilation = (
  source: string,
  fileName: string,
  runtime: EscoreRuntime,
  library?: Library,
): Compilation => {
  const compiled = compileEscore({ source, fileName }, runtime, library);
  const code = compiled.loadModule("ProgramCode") ?? "";
  return {
    name: compiled.name,
    tla: code.trimEnd(),
    config: compiled.config,
    modules: { ProgramCode: code },
    sourceMarks: compiled.regions.map((region) => ({
      name: region.name,
      start: region.start,
      end: region.end,
    })),
    outputMarks: compiled.regions.flatMap((region) =>
      region.definitions.flatMap((definition) => {
        // The compiler leaves a definition out of the module where nothing reads it.
        const start = code.search(new RegExp(`^${definition}\\b`, "m"));
        if (start === -1) return [];
        DEFINITION_END.lastIndex = start;
        return [{ name: region.name, start, end: DEFINITION_END.exec(code)?.index ?? code.length }];
      }),
    ),
  };
};
