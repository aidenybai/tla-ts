import { EXIT_STATUS, getExitCode } from "./exit-codes";
import type { Value } from "./values";

// How TLC reports a RuntimeException it did not expect, such as one raised while computing next
// states.
export const UNEXPECTED_EXCEPTION =
  "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: ";

// How TLC reports a Java StackOverflowError, which V8 raises as this RangeError.
export const STACK_OVERFLOW =
  "This was a Java StackOverflowError. It was probably the result\nof an incorrect recursive function definition that caused TLC to enter\nan infinite loop when trying to compute the function or its application\nto an element in its putative domain.";

export const isStackOverflow = (error: unknown) =>
  error instanceof RangeError && error.message === "Maximum call stack size exceeded";

export class TlaError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "TlaError";
  }
}

export interface SyntaxFailure {
  reason: string;
  line: number;
  column: number;
  isEnd: boolean;
}

// An error SANY reports at a location, such as "In module M" or a range in a module.
export interface SanyError {
  location: string;
  message: string;
}

// The errors SANY reports for a spec. A fatal error stops it before semantic analysis.
export interface SanyReport {
  errors: SanyError[];
  isFatal: boolean;
}

export class TlaSyntaxError extends TlaError {
  failure: SyntaxFailure | undefined;
  sany: SanyReport | undefined;

  constructor(message: string, cause?: unknown, failure?: SyntaxFailure, sany?: SanyReport) {
    super(message, cause);
    this.name = "TlaSyntaxError";
    this.failure = failure;
    this.sany = sany;
  }
}

export const createSanyError = (errors: SanyError[], isFatal = false) =>
  new TlaSyntaxError(errors.map((error) => error.message).join("\n"), undefined, undefined, {
    errors,
    isFatal,
  });

export class TlaConfigError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaConfigError";
  }
}

export class TlaEvaluationError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaEvaluationError";
  }
}

// An evaluation error that TLC raises as an EvalException from a standard module's Java code. It
// keeps the name TlaEvaluationError, and index.ts doesn't export it.
export class TlaModuleError extends TlaEvaluationError {
  exitCode: number;

  constructor(message: string, exitCode: number = EXIT_STATUS.error) {
    super(message);
    this.name = "TlaEvaluationError";
    this.exitCode = exitCode;
  }
}

// TLC reports a successor state that the next-state relation leaves incomplete as an error of its
// own, not as an exception. It keeps the name TlaEvaluationError, and index.ts doesn't export it.
export class TlaIncompleteStateError extends TlaEvaluationError {
  state: (Value | undefined)[];
  action: string | undefined;
  missing: string[];

  constructor(state: (Value | undefined)[], action: string | undefined, missing: string[]) {
    super(
      `Successor state is not completely specified by the next-state action. The following variable${missing.length > 1 ? "s are" : " is"} not defined: ${missing.join(", ")}.\n`,
    );
    this.name = "TlaEvaluationError";
    this.state = state;
    this.action = action;
    this.missing = missing;
  }
}

export interface TlapmReport {
  failure?: string;
  exception?: string;
}

export class TlaProofError extends TlaError {
  failure: string | undefined;
  exception: string;

  constructor(message: string, report: TlapmReport = {}) {
    super(message);
    this.name = "TlaProofError";
    this.failure = report.exception === undefined ? (report.failure ?? message) : undefined;
    this.exception = report.exception ?? `Failure(${JSON.stringify(this.failure)})`;
  }
}

// tlapm fails one of its own assertions, which it reports as a bug in itself. It keeps the name
// TlaProofError, and index.ts doesn't export it.
export class TlapmBugError extends TlaProofError {
  constructor(exception = "Assert_failure") {
    super("Oops, this seems to be a bug in TLAPM.", { exception });
    this.name = "TlaProofError";
  }
}

export class TlaUnsupportedError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaUnsupportedError";
  }
}

export const getErrorExitCode = (error: TlaError) =>
  getExitCode(error) ??
  (error instanceof TlaSyntaxError
    ? EXIT_STATUS.specParseError
    : error instanceof TlaConfigError
      ? EXIT_STATUS.configParseError
      : error instanceof TlaEvaluationError
        ? EXIT_STATUS.specEvaluationFailure
        : EXIT_STATUS.error);
