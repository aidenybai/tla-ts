import type { Library } from "../../tla-ts/src/typescript/program";
import { compileEscore } from "../../tla-ts/src/typescript/spec/api";
import type { EscoreRuntime } from "../../tla-ts/src/typescript/spec/prepare";
import type { Compilation } from "./compilation";

// A file compiled by specializing ESCore: the module of the program's code, which maps no regions
// back to the file.
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
    sourceMarks: [],
    outputMarks: [],
  };
};
