import type { Mark, Source, Token } from "./site-data";

// The lines of a file's output that the playground's page is built with, a screen's worth: ESCore's
// code of a program runs to hundreds of lines, whose spans would make the page slow to load, so
// the rest render once the page has hydrated, and an outline holds no more.
export const BUILT_OUTPUT_LINES = 60;

// The language that a file's source is highlighted in, by its extension.
export const getSourceLanguage = (fileName: string) =>
  fileName.endsWith(".tsx") ? "tsx" : "typescript";

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
