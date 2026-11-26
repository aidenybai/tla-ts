import type { Library } from "../../../tla-ts/src/typescript/program";
import { compileJsTla } from "../../../tla-ts/src/typescript/spec/api";
import type { JsTlaRuntime } from "../../../tla-ts/src/typescript/spec/prepare";
import type { Compilation } from "./compilation";

// A definition's text ends before the next line that starts a definition, as its own later lines
// are indented.
const DEFINITION_END = /\n(?=\S)/g;

// A file compiled by specializing JS.tla, on the files of the packages that the site passes: the
// module of the program's code, where each declaration at the top of the file marks the
// definitions it compiles to.
export const getJsTlaCompilation = (
  source: string,
  fileName: string,
  runtime: JsTlaRuntime,
  files: ReadonlyMap<string, string>,
  library?: Library,
): Compilation => {
  const compiled = compileJsTla({ source, fileName, files }, runtime, library);
  const code = compiled.loadModule("ProgramCode") ?? "";
  return {
    name: compiled.name,
    source,
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
