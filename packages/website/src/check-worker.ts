import { check, formatValue, TlaError } from "tla-ts";

export interface CheckRequest {
  spec: string;
  config: string;
}

export interface TraceStepSummary {
  action: string | undefined;
  variables: [string, string][];
}

export type CheckResponse =
  | {
      kind: "result";
      status: string;
      violation: string | undefined;
      trace: TraceStepSummary[];
      loopStart: number | undefined;
      generatedStates: number;
      distinctStates: number;
      depth: number;
      milliseconds: number;
      output: string[];
    }
  | { kind: "error"; name: string; message: string };

const respond = (response: CheckResponse) => self.postMessage(response);

self.onmessage = async (event: MessageEvent<CheckRequest>) => {
  const output: string[] = [];
  const startedAt = performance.now();
  try {
    const result = await check({
      source: event.data.spec,
      config: event.data.config,
      onPrint: (text) => output.push(text),
    });
    if (result.failure) {
      return respond({
        kind: "error",
        name: "TlaEvaluationError",
        message: result.failure.message,
      });
    }
    respond({
      kind: "result",
      status: result.status,
      violation: result.violation?.name,
      trace: (result.violation?.trace ?? []).map((step) => ({
        action: step.action,
        variables: Object.entries(step.state).map(([name, value]): [string, string] => [
          name,
          formatValue(value),
        ]),
      })),
      loopStart: result.violation?.loopStart,
      generatedStates: result.generatedStates,
      distinctStates: result.distinctStates,
      depth: result.depth,
      milliseconds: performance.now() - startedAt,
      output,
    });
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    respond({ kind: "error", name: error.name, message: error.message });
  }
};
