import { TlaError } from "tla-ts";
import libraries from "virtual:typescript-libraries";
import { createLibrary } from "../../tla-ts/src/typescript/program";
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

// The worker parses TypeScript's declaration files once, as it loads, for every compile it runs,
// and on ESCore prepares ESCore's runtime once too.
const library = createLibrary(libraries);
const escore = __TLA_TS_ESCORE__
  ? import("./escore").then(async (loaded) => ({
      runtime: await loaded.loadEscoreRuntime(),
      getCompilation: loaded.getEscoreCompilation,
    }))
  : undefined;

self.onmessage = async (event: MessageEvent<CompileRequest>) => {
  const loaded = await escore;
  try {
    self.postMessage({
      source: event.data.source,
      fileName: event.data.fileName,
      compilation:
        loaded === undefined
          ? getCompilation(event.data.source, event.data.fileName, library)
          : loaded.getCompilation(event.data.source, event.data.fileName, loaded.runtime, library),
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
