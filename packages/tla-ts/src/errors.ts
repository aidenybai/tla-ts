import { EXIT_STATUS, getExitCode, setModuleExitCode } from "./exit-codes";

// How TLC reports a RuntimeException it did not expect, such as one raised while computing next
// states.
export const UNEXPECTED_EXCEPTION =
  "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: ";

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
  constructor(message: string, exitCode: number = EXIT_STATUS.error) {
    super(message);
    this.name = "TlaEvaluationError";
    setModuleExitCode(this, exitCode);
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

// The SMT solver met input outside the SMT-LIB subset that tlapm emits, or a numeral too large for
// its exact arithmetic. The solver answers unknown.
export class SmtUnsupportedError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "SmtUnsupportedError";
  }
}

// The SMT solver ran past its time limit, or its signal aborted, in the middle of a rewrite. The
// solver answers unknown.
export class SmtCanceledError extends TlaError {
  constructor() {
    super("the SMT solver was canceled");
    this.name = "SmtCanceledError";
  }
}

// The SMT solver broke one of its own invariants, a bug in the port rather than in the input. It
// keeps its name, and index.ts doesn't export it.
export class SmtInvariantError extends TlaError {
  constructor(message: string) {
    super(message);
    this.name = "SmtInvariantError";
  }
}

// mem_out: the pdd manager needed a node past its limit outside an operation. Grobner catches it
// and gives up on the round. index.ts doesn't export it.
export class PddMemoryOutError extends TlaError {
  constructor() {
    super("the pdd manager ran out of nodes");
    this.name = "PddMemoryOutError";
  }
}

// The SMT-LIB input is malformed: a syntax error, an undeclared symbol, or an ill-sorted application.
export class SmtParseError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "SmtParseError";
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
