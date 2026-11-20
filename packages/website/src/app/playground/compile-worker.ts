import { TlaError } from "tla-ts";
import libraries from "virtual:typescript-libraries";
import { createLibrary } from "../../../../tla-ts/src/typescript/program";
import { getCompilation, type Compilation } from "./compilation";

export interface CompileRequest {
  source: string;
  fileName: string;
}

export interface CompileResponse {
  source: string;
  fileName: string;
  compilation?: Compilation;
  error?: string;
}

// The worker parses TypeScript's declaration files once, as it loads, for every compile it runs.
const library = createLibrary(libraries);

self.onmessage = (event: MessageEvent<CompileRequest>) => {
  try {
    self.postMessage({
      source: event.data.source,
      fileName: event.data.fileName,
      compilation: getCompilation(event.data.source, event.data.fileName, library),
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
