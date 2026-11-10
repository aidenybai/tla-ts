import { TlaError } from "tla-ts";
import libraries from "virtual:typescript-libraries";
import { compile } from "../../tla-ts/src/typescript/compile";
import type { CompiledSpec } from "../../tla-ts/src/typescript/emit";

export interface CompileRequest {
  source: string;
  fileName: string;
}

export type CompileResponse =
  | { kind: "compiled"; spec: CompiledSpec; elapsed: number }
  | { kind: "failed"; message: string };

self.onmessage = (event: MessageEvent<CompileRequest>) => {
  const startedAt = performance.now();
  try {
    const spec = compile(event.data.source, event.data.fileName, libraries);
    self.postMessage({
      kind: "compiled",
      spec,
      elapsed: performance.now() - startedAt,
    } satisfies CompileResponse);
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    self.postMessage({ kind: "failed", message: error.message } satisfies CompileResponse);
  }
};
