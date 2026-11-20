import type { Mark, Source, Token } from "./site-data";

export interface Compilation {
  name: string;
  tla: string;
  config: string;
  modules: Record<string, string>;
  sourceMarks: Mark[];
  outputMarks: Mark[];
}

// A file compiled when the site was built, so the playground can show it before its compiler
// has loaded.
export interface Precompiled {
  fileName: string;
  source: string;
  typescript: Token[][];
  compilation: Compilation;
  tla: Source;
}

// A file compiled by specializing ESCore: the module of the program's code, which maps no regions
// back to the file.
export const getCompilation = (name: string, config: string, code: string): Compilation => ({
  name,
  tla: code.trimEnd(),
  config,
  modules: { ProgramCode: code },
  sourceMarks: [],
  outputMarks: [],
});
