import { check, formatValue, prove, TlaError, type CheckStatus } from "tla-ts";
import { getErrorResult } from "./run-error";

export type RunRequest =
  | { kind: "check"; source: string; config: string }
  | { kind: "prove"; source: string };

export interface TraceStepSummary {
  number: number;
  action: string | undefined;
  variables: [string, string][];
}

// What a check counted, which the editor shows apart from the summary.
export interface CheckStats {
  status: CheckStatus;
  distinctStates: number;
  totalStates: number;
  elapsedMs: number;
}

export interface RunResult {
  isPassed: boolean;
  title: string;
  // Only a check that finished has stats.
  stats: CheckStats | undefined;
  // The invariant or property that failed, shown next to the title.
  name: string | undefined;
  summary: string;
  // A check's counterexample, which the drawer steps through.
  trace: TraceStepSummary[];
  loopStart: number | undefined;
  // A proof's obligations, or why the run failed.
  rows: RunRow[];
}

interface RunRow {
  title: string;
  // Shown while the row is the active step, such as the goal an obligation proves.
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

const formatElapsed = (elapsedMs: number) => `${Math.round(elapsedMs).toLocaleString()} ms`;

const getElapsed = (startedAt: number) => formatElapsed(performance.now() - startedAt);

const getCheckResult = async (source: string, config: string): Promise<RunResult> => {
  const startedAt = performance.now();
  const result = await check({ source, config });
  const elapsedMs = performance.now() - startedAt;
  if (result.failure) {
    return getErrorResult("Error", result.failure.message, formatElapsed(elapsedMs));
  }
  return {
    isPassed: result.status === "success",
    title: STATUS_TITLES[result.status],
    stats: {
      status: result.status,
      distinctStates: result.distinctStates,
      totalStates: result.generatedStates,
      elapsedMs,
    },
    name: result.status === "deadlock" ? undefined : result.violation?.name,
    summary: `${result.distinctStates.toLocaleString()} states, depth ${result.depth}, ${formatElapsed(elapsedMs)}`,
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
    stats: undefined,
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
    self.postMessage(getErrorResult(error.name, error.message));
  }
};
