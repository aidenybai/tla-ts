import { TlaError } from "tla-ts";
import { libraries } from "./generated/typescript-libraries";
import { compile } from "../../tla-ts/src/typescript/compile";
import { createLibrary } from "../../tla-ts/src/typescript/program";
import { printRegions } from "../../tla-ts/src/typescript/regions";
import type { Mark } from "./site-data";

export interface CompileRequest {
  source: string;
  fileName: string;
}

export interface Compilation {
  name: string;
  tla: string;
  config: string;
  modules: Record<string, string>;
  sourceMarks: Mark[];
  outputMarks: Mark[];
}

export interface CompileResponse {
  source: string;
  fileName: string;
  compilation?: Compilation;
  error?: string;
}

// The worker parses TypeScript's declaration files once, as it loads, for every compile it runs.
const library = createLibrary(libraries);

const getMarks = (spans: [string, { start: number; end: number }][]): Mark[] =>
  spans
    .map(([name, span]) => ({ name, start: span.start, end: span.end }))
    .toSorted((left, right) => left.end - left.start - (right.end - right.start));

self.onmessage = (event: MessageEvent<CompileRequest>) => {
  try {
    const compiled = compile(event.data.source, event.data.fileName, library);
    const printed = printRegions(compiled);
    self.postMessage({
      source: event.data.source,
      fileName: event.data.fileName,
      compilation: {
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
      },
    } satisfies CompileResponse);
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    self.postMessage({
      source: event.data.source,
      fileName: event.data.fileName,
      error: error.message,
    } satisfies CompileResponse);
  }
};
