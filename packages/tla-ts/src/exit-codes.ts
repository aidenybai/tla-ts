import type { LivenessChecker } from "./liveness";

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
const moduleExitCodes = new WeakMap<Error, number>();
const phase = { isNextState: false };

export const setNextStatePhase = (isNextState: boolean) => {
  phase.isNextState = isNextState;
};

// The innermost site that knows TLC's exit status for an error sets it first and wins.
export const setExitCode = <Thrown>(error: Thrown, code: number) => {
  if (error instanceof Error && !exitCodes.has(error)) exitCodes.set(error, code);
  return error;
};

// TLC exits with the code of an exception from a standard module's Java code only when the exception
// escapes the computation of next states. In every other phase, the phase decides the code.
export const setModuleExitCode = (error: Error, code: number) => {
  if (phase.isNextState) moduleExitCodes.set(error, code);
};

export const getExitCode = (error: Error) => exitCodes.get(error) ?? moduleExitCodes.get(error);

// TLC exits with 255 when it fails to process or evaluate a liveness property, in any phase.
export const withLivenessExitCode = (
  create: () => LivenessChecker | undefined,
): LivenessChecker | undefined => {
  try {
    const checker = create();
    return (
      checker && {
        addInitialState: (index, state) => {
          try {
            checker.addInitialState(index, state);
          } catch (error) {
            throw setExitCode(error, EXIT_STATUS.error);
          }
        },
        addState: (index, state, successors) => {
          try {
            return checker.addState(index, state, successors);
          } catch (error) {
            throw setExitCode(error, EXIT_STATUS.error);
          }
        },
        findViolation: () => {
          try {
            return checker.findViolation();
          } catch (error) {
            throw setExitCode(error, EXIT_STATUS.error);
          }
        },
      }
    );
  } catch (error) {
    throw setExitCode(error, EXIT_STATUS.error);
  }
};
