import type { Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import type { Value } from "./values";

// While TLC replays a failure, it gives each set, tuple or record it builds the expression that
// built it. A method of such a value that fails prepends that expression to the error's trace, and
// TLC reports the error as one it was unable to fingerprint.
export const valueSources: { current: WeakMap<object, Expression> | undefined } = {
  current: undefined,
};

const fingerprintTraces = new WeakMap<TlaEvaluationError, Expression[]>();

export const getFingerprintTrace = (error: unknown) =>
  error instanceof TlaEvaluationError ? fingerprintTraces.get(error) : undefined;

export const withSource = <T>(value: Value, run: () => T): T => {
  const sources = valueSources.current;
  if (!sources || typeof value !== "object") return run();
  try {
    return run();
  } catch (error) {
    const source = sources.get(value);
    if (source && error instanceof TlaEvaluationError) {
      fingerprintTraces.set(error, [source, ...(fingerprintTraces.get(error) ?? [])]);
    }
    throw error;
  }
};
