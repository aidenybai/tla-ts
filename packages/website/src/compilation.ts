import { compile } from "../../tla-ts/src/typescript/compile";
import type { Library } from "../../tla-ts/src/typescript/program";
import { printRegions } from "../../tla-ts/src/typescript/regions";
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

interface Span {
  start: number;
  end: number;
}

const getMarks = (spans: [string, Span][]): Mark[] =>
  spans
    .map(([name, span]) => ({ name, start: span.start, end: span.end }))
    .toSorted((left, right) => left.end - left.start - (right.end - right.start));

export const getCompilation = (
  source: string,
  fileName: string,
  library?: Library,
): Compilation => {
  const compiled = compile(source, fileName, library);
  const printed = printRegions(compiled);
  return {
    name: compiled.name,
    tla: printed.text.trimEnd(),
    config: compiled.config,
    modules: Object.fromEntries(
      compiled.source.extends.flatMap((name) => {
        const text = compiled.loadModule(name);
        return text === undefined ? [] : [[name, text]];
      }),
    ),
    sourceMarks: getMarks(printed.regions.map((region) => [region.name, region.source])),
    outputMarks: getMarks(printed.regions.map((region) => [region.name, region.output])),
  };
};
