import type { SourceRange } from "./ast";
import type { Locus } from "./obligations/expression";
import { EXIT_STATUS, getExitCode, setExitCode } from "./exit-codes";
import type { PcalNode } from "./pcal/ast";
import type { Value } from "./values";

export const getUnexpectedException = (exceptionClass: string) =>
  `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a ${exceptionClass}\n: `;

export const UNEXPECTED_EXCEPTION = getUnexpectedException("java.lang.RuntimeException");

export const UNEXPECTED_EVAL_EXCEPTION = getUnexpectedException("tlc2.tool.EvalException");

// V8's RangeError for a stack overflow, which TLC raises as a Java StackOverflowError.
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
  proof?: { stop: { line: number; column: number }; exception: string };
}

export interface SanyError {
  location: string;
  message: string;
}

interface SanyReport {
  errors: SanyError[];
  warnings: SanyError[];
  isFatal: boolean;
  parseError?: string;
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

// It keeps the name TlaSyntaxError, and index.ts doesn't export it.
export class TlaSanyFatalError extends TlaSyntaxError {
  location: string | undefined;
  parseError: string | undefined;

  constructor(message: string, location: string | undefined, parseError?: string) {
    super(message);
    this.location = location;
    this.parseError = parseError;
  }
}

// TLC 1.7.4's SANY gives a missing module no location.
export class TlaMissingModuleError extends TlaSanyFatalError {
  constructor(name: string, importer: string | undefined, isLocated = true) {
    super(
      `Cannot find source file for module ${name} imported in module ${importer}.`,
      isLocated ? importer : undefined,
    );
  }
}

export const createSanyError = (
  errors: SanyError[],
  isFatal = false,
  parseError?: string,
  warnings: SanyError[] = [],
) =>
  new TlaSyntaxError(
    errors.map((error) => `${error.location}\n\n${error.message}`).join("\n\n"),
    undefined,
    undefined,
    { errors, warnings, isFatal, parseError },
  );

export const createMissingModuleError = (name: string, importer: string | undefined) =>
  createSanyError(
    [
      {
        location: `In module ${importer}`,
        message: `Cannot find source file for module ${name} imported in module ${importer}.`,
      },
    ],
    true,
  );

export const formatSanyWarnings = (warnings: SanyError[]) =>
  `*** Warnings: ${warnings.length}\n\n${warnings.map((warning) => `${warning.location}\n\n${warning.message}\n\n\n`).join("\n")}`;

export const formatRange = (range: SourceRange) =>
  `line ${range.start.line}, col ${range.start.column} to line ${range.end.line}, col ${range.end.column} of module ${range.module}`;

export const createSemanticError = (message: string, range: SourceRange) =>
  createSanyError([{ location: formatRange(range), message }]);

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

// TLC catches a StackOverflowError only at the top, unlike the exceptions of evaluation.
export class TlaStackOverflowError extends TlaEvaluationError {
  constructor() {
    super(STACK_OVERFLOW_MESSAGE);
  }
}

// TLC reports a stack overflow outside the computation of states on its own, and exits with 255.
export const createStackOverflowError = () =>
  setExitCode(new TlaStackOverflowError(), EXIT_STATUS.error);

// TLC reports the partial state, with null for each unassigned variable.
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

// It keeps the name TlaEvaluationError, and index.ts doesn't export it.
export class TlaUnassignedError extends TlaEvaluationError {
  variable: string;

  constructor(message: string, variable: string) {
    super(message);
    this.variable = variable;
  }
}

// An EvalException from a standard module's Java code. It keeps the name TlaEvaluationError, and
// index.ts doesn't export it.
export class TlaModuleError extends TlaEvaluationError {
  exitCode: number;

  constructor(message: string, exitCode: number = EXIT_STATUS.error) {
    super(message);
    this.name = "TlaEvaluationError";
    this.exitCode = exitCode;
  }
}

export class TlaNullPointerError extends TlaEvaluationError {
  constructor(message: string) {
    super(message);
    this.name = "TlaEvaluationError";
  }
}

export class TlaUnsupportedOperationError extends TlaEvaluationError {
  constructor(message: string) {
    super(message);
    this.name = "TlaEvaluationError";
  }
}

export class TlaIllegalStateError extends TlaEvaluationError {
  state: (Value | undefined)[];

  constructor(state: (Value | undefined)[]) {
    super("current state is not a legal state");
    this.name = "TlaEvaluationError";
    this.state = state;
  }
}

interface TlapmReport {
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

// tlapm reports a failed assertion of its own as a bug in itself. It keeps the name
// TlaProofError, and index.ts doesn't export it.
export class TlapmBugError extends TlaProofError {
  constructor(exception = "Assert_failure") {
    super("Oops, this seems to be a bug in TLAPM.", { exception });
    this.name = "TlaProofError";
  }
}

// A backend can't take an obligation, which tlapm reports as not tried.
export class TlaProverError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaProverError";
  }
}

// tlapm reports a rejected method pragma where the pragma or the proof citing it is, and leaves
// the obligation unproved.
export class TlaMethodError extends TlaProverError {
  readonly locus: Locus | undefined;

  constructor(message: string, locus: Locus | undefined) {
    super(message);
    this.name = "TlaMethodError";
    this.locus = locus;
  }
}

// Zenon gives up on a .znn file the way the OCaml Zenon raises an exception and prints no proof.
export class TlaZenonError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaZenonError";
  }
}

// The exceptions Isabelle raises: ERROR for a rejected theory or a failed proof, TERM, TYPE and THM
// for an ill-formed term, type or theorem, and Interrupt when the time limit runs out.
type IsabelleException = "ERROR" | "TERM" | "TYPE" | "THM" | "Interrupt";

// Isabelle's tactics raise and handle these as control flow, often millions of times per proof,
// and decideIsabelle answers "unknown" for any that escape. So unlike an Error, it skips the
// stack trace.
export class TlaIsabelleError {
  readonly name = "TlaIsabelleError";
  readonly exception: IsabelleException;
  readonly message: string;

  constructor(exception: IsabelleException, message: string) {
    this.exception = exception;
    this.message = message;
  }
}

export class TlaUnsupportedError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaUnsupportedError";
  }
}

// Input outside the SMT-LIB subset tlapm emits, or a numeral too large for exact arithmetic. The
// solver answers unknown.
export class SmtUnsupportedError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "SmtUnsupportedError";
  }
}

// The time limit or the abort signal hit in the middle of a rewrite. The solver answers unknown.
export class SmtCanceledError extends TlaError {
  constructor() {
    super("the SMT solver was canceled");
    this.name = "SmtCanceledError";
  }
}

// A bug in the port rather than in the input. It keeps its name, and index.ts doesn't export it.
export class SmtInvariantError extends TlaError {
  constructor(message: string) {
    super(message);
    this.name = "SmtInvariantError";
  }
}

// A case Z3 leaves unimplemented, where Z3 exits the process. nra answers unknown instead.
// index.ts doesn't export it.
export class NlsatUnsupportedError extends TlaError {
  constructor(reason: string) {
    super(`nlsat does not implement ${reason}`);
    this.name = "NlsatUnsupportedError";
  }
}

// Grobner catches it and gives up on the round. index.ts doesn't export it.
export class PddMemoryOutError extends TlaError {
  constructor() {
    super("the pdd manager ran out of nodes");
    this.name = "PddMemoryOutError";
  }
}

interface SmtPosition {
  line: number;
  column: number;
}

export class SmtParseError extends TlaError {
  line: number;
  column: number;

  constructor(message: string, position: SmtPosition) {
    super(message);
    this.name = "SmtParseError";
    this.line = position.line;
    this.column = position.column;
  }
}

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

export class PcalError extends TlaError {
  node: PcalNode | undefined;

  constructor(message: string, node?: PcalNode) {
    super(message);
    this.name = "PcalError";
    this.node = node;
  }
}

export class PcalRuntimeError extends TlaError {
  constructor(message: string) {
    super(message);
    this.name = "PcalRuntimeError";
  }
}

// The translator throws a java.lang.Error that nothing in SANY catches.
export class PcalBugError extends TlaError {
  constructor(message: string) {
    super(
      `You have discovered a bug in pcal.trans.\nSend the following information and the\ninput file to the current maintainer(s).\n\n -- ${message}.`,
    );
    this.name = "PcalBugError";
  }
}
