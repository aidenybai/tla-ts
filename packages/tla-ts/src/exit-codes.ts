import type { LivenessChecker } from "./liveness-checker";

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

export const setExitCode = <Thrown>(error: Thrown, code: number) => {
  if (error instanceof Error && !exitCodes.has(error)) exitCodes.set(error, code);
  return error;
};

export const getExitCode = (error: Error) => exitCodes.get(error);

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
      branches: checker.branches,
      addInitialState: (index, state, tracing) =>
        withErrorExitCode(() => checker.addInitialState(index, state, tracing)),
      addState: (index, state, successors, tracing) =>
        withErrorExitCode(() => checker.addState(index, state, successors, tracing)),
      findViolation: () => withErrorExitCode(() => checker.findViolation()),
      getViolatedProperties: (path, cycleStart) =>
        withErrorExitCode(() => checker.getViolatedProperties(path, cycleStart)),
    }
  );
};
