import type { Expression } from "./ast";
import { getErrorExitCode, isStackOverflow, TlaEvaluationError, TlaModuleError } from "./errors";
import {
  createTracingEnvironment,
  type CallStack,
  type Environment,
  type FingerprintFailure,
} from "./evaluate";
import { EXIT_STATUS, getExitCode, getMessageExitStatus } from "./exit-codes";
import { getCodedMessage, type FailureMessage } from "./tlc/messages";
import { getFingerprintError, getHeldValues, markFingerprinted, type Value } from "./values";

export interface ReplayFailure {
  callStack: Expression[];
  fingerprint: FingerprintFailure | undefined;
  replayError?: TlaEvaluationError;
}

export interface FailureOptions {
  /** What TLC was doing: "behavior-graph" is a failed next state whose call stack comes from adding the state to the behavior graph, "liveness" a failed liveness check. */
  phase?: "initial" | "next" | "behavior-graph" | "liveness";
  initialState?: Value[];
  outDegrees?: number[];
  callStack?: Expression[];
  fingerprint?: FingerprintFailure;
  replayError?: TlaEvaluationError;
  traceFailure?: FailureMessage;
}

const getInitialExitCode = (error: TlaEvaluationError) => {
  const coded = getCodedMessage(error.message);
  return coded &&
    !coded.isEvalException &&
    getMessageExitStatus(coded.code) === EXIT_STATUS.configParseError
    ? EXIT_STATUS.configParseError
    : getErrorExitCode(error);
};

const getReplayExitCode = (error: TlaEvaluationError): number => {
  const inner = error.cause;
  if (inner instanceof TlaEvaluationError) return getReplayExitCode(inner);
  return error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.specEvaluationFailure;
};

export const getFailureExitCode = (
  error: TlaEvaluationError,
  failureOptions: FailureOptions,
  is174: boolean,
) => {
  const isReplayed = failureOptions.callStack !== undefined;
  switch (failureOptions.phase) {
    case "initial":
      if (isReplayed) return EXIT_STATUS.specEvaluationFailure;
      return is174 ? EXIT_STATUS.success : getInitialExitCode(error);
    case "behavior-graph":
      return (
        getExitCode(error) ?? (error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.error)
      );
    case "liveness":
      return getErrorExitCode(error);
    default:
      if (!isReplayed) return getErrorExitCode(error);
      return failureOptions.fingerprint
        ? EXIT_STATUS.specEvaluationFailure
        : getReplayExitCode(failureOptions.replayError ?? error);
  }
};

export const getReplayFailure = (
  environment: Environment,
  replay: (tracing: Environment) => void,
): ReplayFailure | undefined => {
  const tracing = createTracingEnvironment(environment);
  const callStack = tracing.callStack;
  try {
    replay(tracing);
    return undefined;
  } catch (error) {
    if (isStackOverflow(error)) return { callStack: [], fingerprint: undefined };
    if (!(error instanceof TlaEvaluationError) || !callStack) return undefined;
    return {
      callStack: callStack.expressions,
      fingerprint: callStack.fingerprint,
      replayError: error,
    };
  }
};

const findFailedSources = (value: Value, sources: CallStack["sources"]): Expression[] => {
  if (typeof value !== "object") return [];
  const source = sources.get(value);
  const failed = getHeldValues(value).find((held) => getFingerprintError(held) !== undefined);
  return [
    ...(source ? [source] : []),
    ...(failed === undefined ? [] : findFailedSources(failed, sources)),
  ];
};

export const fingerprintReplayed = (
  state: Value[],
  fingerprintState: Value[],
  callStack: CallStack | undefined,
) => {
  for (const value of fingerprintState) {
    const error = getFingerprintError(value);
    if (!error) continue;
    const sources = callStack ? findFailedSources(value, callStack.sources) : [];
    if (callStack && sources.length > 0) {
      callStack.expressions.length = 0;
      callStack.isFrozen = true;
      callStack.fingerprint = { sources, reason: error.message };
    }
    throw error;
  }
  state.forEach(markFingerprinted);
};
