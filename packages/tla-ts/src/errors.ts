import type ts from "@typescript/typescript6";
import type { SourceRange } from "./ast";
import type { Locus } from "./obligations/expression";
import { EXIT_STATUS, getExitCode, setExitCode } from "./exit-codes";
import type { PcalNode } from "./pcal/ast";
import type { Value } from "./values";

export const getUnexpectedException = (exceptionClass: string) =>
  `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a ${exceptionClass}\n: `;

export const UNEXPECTED_EXCEPTION = getUnexpectedException("java.lang.RuntimeException");

export const UNEXPECTED_EVAL_EXCEPTION = getUnexpectedException("tlc2.tool.EvalException");

export const isStackOverflow = (error: unknown) =>
  (error instanceof RangeError && error.message === "Maximum call stack size exceeded") ||
  (error instanceof SyntaxError && error.message.endsWith(": Stack overflow"));

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

export class TlaSanyFatalError extends TlaSyntaxError {
  location: string | undefined;
  parseError: string | undefined;

  constructor(message: string, location: string | undefined, parseError?: string) {
    super(message);
    this.location = location;
    this.parseError = parseError;
  }
}

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

export class TlaStackOverflowError extends TlaEvaluationError {
  constructor() {
    super(STACK_OVERFLOW_MESSAGE);
  }
}

export const createStackOverflowError = () =>
  setExitCode(new TlaStackOverflowError(), EXIT_STATUS.error);

export class TlaUncodedError extends TlaEvaluationError {}

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

export class TlaUnassignedError extends TlaEvaluationError {
  variable: string;

  constructor(message: string, variable: string) {
    super(message);
    this.variable = variable;
  }
}

export class TlaModuleError extends TlaEvaluationError {
  exitCode: number;

  constructor(message: string, exitCode: number = EXIT_STATUS.error) {
    super(message);
    this.exitCode = exitCode;
  }
}

export class TlaFeatureUnsupportedError extends TlaEvaluationError {
  constructor(message: string) {
    super(message);
    setExitCode(this, EXIT_STATUS.error);
  }
}

export class TlaEndOfInputError extends TlaUncodedError {
  constructor() {
    super(
      "PickSuccessor reached the end of standard input without an answer whether to extend the behavior.",
    );
  }
}

export class TlaMissingCheckpointError extends TlaEvaluationError {
  constructor(directory: string) {
    super(`The directory ${directory} holds no checkpoint to recover from.`);
    setExitCode(this, EXIT_STATUS.error);
  }
}

export class TlaAliasFormatError extends TlaEvaluationError {}

export class TlaSetBoundError extends TlaEvaluationError {}

export const TOO_MANY_STATES_MESSAGE =
  "Too many possible next states for the last state in the trace.";

export class TlaTooManyStatesError extends TlaEvaluationError {
  constructor() {
    super(TOO_MANY_STATES_MESSAGE);
  }
}

export class TlaWarningAsError extends TlaEvaluationError {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export class TlaNullPointerError extends TlaEvaluationError {}

export class TlaIllegalStateError extends TlaEvaluationError {
  state: (Value | undefined)[];

  constructor(state: (Value | undefined)[]) {
    super("current state is not a legal state");
    this.state = state;
  }
}

interface TlapmReport {
  failure?: string;
  exception?: string;
  locus?: Locus;
}

export class TlaProofError extends TlaError {
  failure: string | undefined;
  exception: string;
  locus: Locus | undefined;

  constructor(message: string, report: TlapmReport = {}) {
    super(message);
    this.locus = report.locus;
    this.name = "TlaProofError";
    this.failure = report.exception === undefined ? (report.failure ?? message) : undefined;
    this.exception = report.exception ?? `Failure(${JSON.stringify(this.failure)})`;
  }
}

export class TlapmBugError extends TlaProofError {
  constructor(exception = "Assert_failure") {
    super("Oops, this seems to be a bug in TLAPM.", { exception });
  }
}

export class TlaProverError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaProverError";
  }
}

export class TlaZenonError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaZenonError";
  }
}

type IsabelleException = "ERROR" | "TERM" | "TYPE" | "THM" | "Interrupt";

// Not an Error, so V8 captures no stack trace: Isabelle's tactics raise these millions of times per proof.
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

export class SmtUnsupportedError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "SmtUnsupportedError";
  }
}

export class SmtCanceledError extends TlaError {
  constructor() {
    super("the SMT solver was canceled");
    this.name = "SmtCanceledError";
  }
}

export class SmtInvariantError extends TlaError {
  constructor(message: string) {
    super(message);
    this.name = "SmtInvariantError";
  }
}

export class NlsatUnsupportedError extends TlaError {
  constructor(reason: string) {
    super(`nlsat does not implement ${reason}`);
    this.name = "NlsatUnsupportedError";
  }
}

export class PddMemoryOutError extends TlaError {
  constructor() {
    super("the pdd manager ran out of nodes");
    this.name = "PddMemoryOutError";
  }
}

export class SmtParseError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "SmtParseError";
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

export class PcalBugError extends TlaError {
  constructor(message: string) {
    super(
      `You have discovered a bug in pcal.trans.\nSend the following information and the\ninput file to the current maintainer(s).\n\n -- ${message}.`,
    );
    this.name = "PcalBugError";
  }
}

export class TlaTypeScriptError extends TlaError {
  constructor(message: string, node?: ts.Node) {
    const sourceFile = node?.getSourceFile();
    const position = sourceFile?.getLineAndCharacterOfPosition(node?.getStart() ?? 0);
    super(
      sourceFile === undefined || position === undefined
        ? message
        : `${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${message}`,
    );
    this.name = "TlaTypeScriptError";
  }
}
