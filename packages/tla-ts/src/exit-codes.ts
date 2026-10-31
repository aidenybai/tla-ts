import type { LivenessChecker } from "./live-check";

// TLC's exit statuses, from EC.ExitStatus.
export const EXIT_STATUS = {
  success: 0,
  assumptionViolation: 10,
  deadlock: 11,
  safetyViolation: 12,
  livenessViolation: 13,
  assertViolation: 14,
  specEvaluationFailure: 75,
  safetyEvaluationFailure: 76,
  livenessEvaluationFailure: 77,
  specParseError: 150,
  configParseError: 151,
  error: 255,
} as const;

const exitCodes = new WeakMap<Error, number>();

// The innermost site that knows TLC's exit status for an error sets it first and wins.
export const setExitCode = <Thrown>(error: Thrown, code: number) => {
  if (error instanceof Error && !exitCodes.has(error)) exitCodes.set(error, code);
  return error;
};

export const getExitCode = (error: Error) => exitCodes.get(error);

const ownExitCodes = new WeakMap<Error, number>();

// The exit status of the error code TLC gives an EvalException, which TLC uses only where it
// doesn't report the error again as a nested expression.
export const setOwnExitCode = <Thrown extends Error>(error: Thrown, code: number) => {
  ownExitCodes.set(error, code);
  return error;
};

// TLC exits with 255 when it fails to process or evaluate a liveness property.
const withErrorExitCode = <Result>(run: () => Result) => {
  try {
    return run();
  } catch (error) {
    throw setExitCode(error, EXIT_STATUS.error);
  }
};

export const withLivenessExitCode = (
  create: () => LivenessChecker | undefined,
): LivenessChecker | undefined => {
  const checker = withErrorExitCode(create);
  return (
    checker && {
      // TLC replays the initial states to report an error, but skips the liveness check of a
      // state it has already seen, so it exits with the status of the error's own code.
      addInitialState: (index, state) => {
        try {
          checker.addInitialState(index, state);
        } catch (error) {
          throw setExitCode(
            error,
            (error instanceof Error && ownExitCodes.get(error)) || EXIT_STATUS.error,
          );
        }
      },
      addState: (index, state, successors) =>
        withErrorExitCode(() => checker.addState(index, state, successors)),
      findViolation: () => withErrorExitCode(() => checker.findViolation()),
      getViolatedProperties: (path, cycleStart) =>
        withErrorExitCode(() => checker.getViolatedProperties(path, cycleStart)),
    }
  );
};
