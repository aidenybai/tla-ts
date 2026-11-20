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
