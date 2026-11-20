import type { Library } from "../../tla-ts/src/typescript/program";
import { compileEscore } from "../../tla-ts/src/typescript/spec/api";
import {
  type EscoreHost,
  type EscoreRuntime,
  prepareHostRuntime,
} from "../../tla-ts/src/typescript/spec/prepare";
import type { Compilation } from "./compilation";

// ESCore's runtime, prepared from the host that the build recorded, the realm of the Node that
// built the site, which the page fetches beside its scripts.
export const loadEscoreRuntime = async () => {
  const response = await fetch(
    new URL(`${import.meta.env.BASE_URL}escore-host.json`, import.meta.url),
  );
  const host: EscoreHost = await response.json();
  return prepareHostRuntime(host);
};

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
