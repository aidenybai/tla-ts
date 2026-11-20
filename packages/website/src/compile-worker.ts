import { compile, TlaError } from "tla-ts";
import libraries from "virtual:typescript-libraries";
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

self.onmessage = async (event: MessageEvent<CompileRequest>) => {
  try {
    const compiled = await compile({
      source: event.data.source,
      fileName: event.data.fileName,
      libraries,
    });
    self.postMessage({
      source: event.data.source,
      fileName: event.data.fileName,
      compilation: getCompilation(
        compiled.name,
        compiled.config,
        compiled.loadModule("ProgramCode") ?? "",
      ),
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
