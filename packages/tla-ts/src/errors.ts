import { EXIT_STATUS, getExitCode } from "./exit-codes";
import type { PcalNode } from "./pcal-ast";
import type { Value } from "./values";

// The start of TLC's message for an exception of a Java class it didn't expect.
export const getUnexpectedException = (exceptionClass: string) =>
  `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a ${exceptionClass}\n: `;

// How TLC reports a RuntimeException it did not expect, such as one raised while computing next
// states.
export const UNEXPECTED_EXCEPTION = getUnexpectedException("java.lang.RuntimeException");

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

export class TlaSyntaxError extends TlaError {
  failure: SyntaxFailure | undefined;

  constructor(message: string, cause?: unknown, failure?: SyntaxFailure) {
    super(message, cause);
    this.name = "TlaSyntaxError";
    this.failure = failure;
  }
}

// A fatal error of SANY's parsing phase: a module SANY can't find or parse, a file whose name
// doesn't match its module's, or a circular dependency. SANY reports it in the module that imports
// or holds the failed one, or without a location, after its JavaCC parser's report of a module it
// failed to parse. It keeps the name TlaSyntaxError, and index.ts doesn't export it.
export class TlaSanyFatalError extends TlaSyntaxError {
  location: string | undefined;
  parseError: string | undefined;

  constructor(message: string, location: string | undefined, parseError?: string) {
    super(message);
    this.location = location;
    this.parseError = parseError;
  }
}

// A module that another imports and SANY can't find, which SANY reports in the importer, except
// TLC 1.7.4's SANY, which gives it no location.
export class TlaMissingModuleError extends TlaSanyFatalError {
  constructor(name: string, importer: string | undefined, isLocated = true) {
    super(
      `Cannot find source file for module ${name} imported in module ${importer}.`,
      isLocated ? importer : undefined,
    );
  }
}

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

export const STACK_OVERFLOW_MESSAGE =
  "This was a Java StackOverflowError. It was probably the result\nof an incorrect recursive function definition that caused TLC to enter\nan infinite loop when trying to compute the function or its application\nto an element in its putative domain.";

// A Java StackOverflowError, which TLC catches only at the top, unlike the exceptions of evaluation.
export class TlaStackOverflowError extends TlaEvaluationError {
  constructor() {
    super(STACK_OVERFLOW_MESSAGE);
  }
}

// A next-state action left variables of a successor state unassigned. TLC reports the partial
// state, with null for each unassigned variable.
export class TlaIncompleteSuccessorError extends TlaEvaluationError {
  state: (Value | undefined)[];
  action: string | undefined;
  variables: string[];

  constructor(
    message: string,
    state: (Value | undefined)[],
    action: string | undefined,
    variables: string[],
  ) {
    super(message);
    this.state = state;
    this.action = action;
    this.variables = variables;
  }
}

// An expression read a variable that its state doesn't assign. It keeps the name
// TlaEvaluationError, and index.ts doesn't export it.
export class TlaUnassignedError extends TlaEvaluationError {
  variable: string;

  constructor(message: string, variable: string) {
    super(message);
    this.variable = variable;
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

// An exception that TLC's Java code throws and nothing catches, with the stack trace it prints, after
// what the frames that the exception unwinds print about it.
export class TlaJavaException extends TlaUnsupportedError {
  unwound: string;

  constructor(message: string, unwound: string) {
    super(message);
    this.name = "TlaJavaException";
    this.unwound = unwound;
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

// pcal.UnrecoverableException and its subclasses: an error the PlusCal translator reports as
// "Unrecoverable error". UnrecoverablePositionedException adds the statement the error is at.
export class PcalError extends TlaError {
  node: PcalNode | undefined;

  constructor(message: string, node?: PcalNode) {
    super(message);
    this.name = "PcalError";
    this.node = node;
  }
}

// A RuntimeException the translator's Java code throws, such as an index out of bounds, which
// ParseAlgorithm.getAlgorithm turns into a parsing error.
export class PcalRuntimeError extends TlaError {
  constructor(message: string) {
    super(message);
    this.name = "PcalRuntimeError";
  }
}

// PcalDebug.ReportBug: the translator found itself in a state it considers a bug, and throws a
// java.lang.Error that nothing in SANY catches.
export class PcalBugError extends TlaError {
  constructor(message: string) {
    super(
      `You have discovered a bug in pcal.trans.\nSend the following information and the\ninput file to the current maintainer(s).\n\n -- ${message}.`,
    );
    this.name = "PcalBugError";
  }
}
