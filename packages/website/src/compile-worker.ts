import { TlaError } from "tla-ts";
import libraries from "virtual:typescript-libraries";
import { compile } from "../../tla-ts/src/typescript/compile";
import type { StateVariable } from "../../tla-ts/src/typescript/emit";
import { type PrintedRegion, printRegions } from "../../tla-ts/src/typescript/regions";

export interface CompileRequest {
  source: string;
  fileName: string;
}

// A compiled spec as the text of its module, which a worker can post.
export interface PrintedSpec {
  name: string;
  source: string;
  config: string;
  regions: PrintedRegion[];
  variables: StateVariable[];
}

export type CompileResponse =
  | { kind: "compiled"; spec: PrintedSpec }
  | { kind: "failed"; message: string };

self.onmessage = (event: MessageEvent<CompileRequest>) => {
  try {
    const compiled = compile(event.data.source, event.data.fileName, libraries);
    const printed = printRegions(compiled);
    self.postMessage({
      kind: "compiled",
      spec: {
        name: compiled.name,
        source: printed.text,
        config: compiled.config,
        regions: printed.regions,
        variables: compiled.variables,
      },
    } satisfies CompileResponse);
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    self.postMessage({ kind: "failed", message: error.message } satisfies CompileResponse);
  }
};
