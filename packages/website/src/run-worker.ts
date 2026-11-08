import { check, formatValue, prove, TlaError, type CheckStatus } from "tla-ts";

export type RunRequest =
  | { kind: "check"; source: string; config: string }
  | { kind: "prove"; source: string };

export interface TraceStepSummary {
  number: number;
  action: string | undefined;
  variables: [string, string][];
}

export interface RunResult {
  isPassed: boolean;
  title: string;
  name: string | undefined;
  summary: string;
  trace: TraceStepSummary[];
  loopStart: number | undefined;
  rows: RunRow[];
}

export interface RunRow {
  title: string;
  detail: string;
  isFailed: boolean;
}

const STATUS_TITLES: Record<CheckStatus, string> = {
  success: "No error found",
  "assumption-violation": "Assumption is false",
  "invariant-violation": "Invariant violated",
  "property-violation": "Property violated",
  "liveness-violation": "Temporal property violated",
  "postcondition-violation": "Postcondition is false",
  deadlock: "Deadlock reached",
  error: "Error",
};

const getElapsed = (startedAt: number) =>
  `${Math.round(performance.now() - startedAt).toLocaleString()} ms`;

const getCheckResult = async (source: string, config: string): Promise<RunResult> => {
  const startedAt = performance.now();
  const result = await check({ source, config });
  if (result.failure)
    return {
      isPassed: false,
      title: "Error",
      name: undefined,
      summary: getElapsed(startedAt),
      trace: [],
      loopStart: undefined,
      rows: [{ title: result.failure.message, detail: "", isFailed: true }],
    };
  return {
    isPassed: result.status === "success",
    title: STATUS_TITLES[result.status],
    name: result.status === "deadlock" ? undefined : result.violation?.name,
    summary: `${result.distinctStates.toLocaleString()} states, depth ${result.depth}, ${getElapsed(startedAt)}`,
    trace: (result.violation?.trace ?? []).map((step, index) => ({
      number: index + 1,
      // TLC labels a step "Announce(1) line 138, col 5 to …", and only the call is shown.
      action:
        step.action === undefined ? undefined : (step.label ?? step.action).split(" line ")[0],
      variables: Object.entries(step.state).map(([name, value]): [string, string] => [
        name,
        formatValue(value),
      ]),
    })),
    loopStart: result.violation?.loopStart,
    rows: [],
  };
};

const getProveResult = async (source: string): Promise<RunResult> => {
  const startedAt = performance.now();
  const result = await prove({ source });
  const count = result.obligations.length;
  const provedCount = result.obligations.filter(
    (obligation) => obligation.status === "proved" || obligation.status === "trivial",
  ).length;
  return {
    isPassed: provedCount === count,
    title:
      provedCount === count
        ? `All ${count} obligations proved`
        : `${provedCount} of ${count} obligations proved`,
    name: undefined,
    summary: getElapsed(startedAt),
    trace: [],
    loopStart: undefined,
    rows: result.obligations.map((obligation) => ({
      title: `Line ${obligation.location.split(":")[0]}, ${
        obligation.status === "proved"
          ? `proved by ${obligation.prover}`
          : obligation.status === "trivial"
            ? "trivial"
            : `${obligation.status}: ${obligation.reason}`
      }`,
      detail: obligation.text.trim(),
      isFailed: obligation.status === "failed" || obligation.status === "unsupported",
    })),
  };
};

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    self.postMessage(
      event.data.kind === "check"
        ? await getCheckResult(event.data.source, event.data.config)
        : await getProveResult(event.data.source),
    );
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    self.postMessage({
      isPassed: false,
      title: error.name,
      name: undefined,
      summary: "",
      trace: [],
      loopStart: undefined,
      rows: [{ title: error.message, detail: "", isFailed: true }],
    } satisfies RunResult);
  }
};
