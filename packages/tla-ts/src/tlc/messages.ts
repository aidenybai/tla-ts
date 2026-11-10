import {
  getErrorExitCode,
  getUnexpectedException,
  STACK_OVERFLOW_MESSAGE,
  TlaEvaluationError,
  TlaModuleError,
  TlaSetBoundError,
  TlaStackOverflowError,
  TlaUncodedError,
  TlaWarningAsError,
  TOO_MANY_STATES_MESSAGE,
  UNEXPECTED_EVAL_EXCEPTION,
  UNEXPECTED_EXCEPTION,
} from "../errors";
import { setExitCode } from "../exit-codes";
import type { TlcVersion } from "./version";

export const MESSAGE_CODE = {
  general: 1000,
  stackOverflow: 1005,
  commandLineError: 1102,
  initialState: 2102,
  nestedExpression: 2103,
  assumptionFalse: 2104,
  assumptionEvaluationError: 2105,
  unchangedVariableChanged: 2143,
  exceptAppliedToUnknownField: 2144,
  fingerprintFailed: 2147,
  initialStateIncomplete: 2106,
  invariantViolatedInitial: 2107,
  incompleteSuccessor: 2109,
  propertyViolatedInitial: 2108,
  invariantViolatedBehavior: 2110,
  invariantEvaluationFailed: 2111,
  actionPropertyViolatedBehavior: 2112,
  actionPropertyEvaluationFailed: 2113,
  deadlockReached: 2114,
  temporalPropertyViolated: 2116,
  noInitialStates: 2118,
  errorState: 2120,
  behaviorUpToThisPoint: 2121,
  backToState: 2122,
  subscriptUndetermined: 2139,
  subscriptMissingVariable: 2140,
  constantLevelInvariant: 2149,
  javaOverrideLoaded: 2168,
  starting: 2185,
  modelChecking: 2187,
  simulating: 2188,
  finished: 2186,
  computingInit: 2189,
  initGenerated1: 2190,
  initGenerated2: 2191,
  checkingTemporal: 2192,
  success: 2193,
  searchDepth: 2194,
  stats: 2199,
  progress: 2200,
  depthFirstStats: 2204,
  depthFirstLevel: 2205,
  depthFirstProgress: 2206,
  depthFirstInitGenerated: 2208,
  simulationProgress: 2209,
  simulationStats: 2210,
  temporalBranches: 2212,
  statePrint1: 2216,
  statePrint2: 2217,
  statePrint3: 2218,
  sanyFinished: 2219,
  startingSany: 2220,
  stateLevelProperty: 2255,
  noInitialStatesInModel: 2256,
  version: 2262,
  depthFirstModelChecking: 2271,
  noSpecificationButProperty: 2257,
  fairnessTautology: 2258,
  noFairnessButProperty: 2259,
  counterExample: 2264,
  checkingTemporalEnd: 2267,
  stateGraphOutdegree: 2268,
  computingInitProgress: 2269,
  livenessSymmetry: 2279,
  livenessConstraints: 2284,
  symmetrySetTooSmall: 2300,
  javaOverrideMismatch: 2400,
  postconditionFalse: 2404,
  postconditionFailed: 2405,
  possibleUnwitnessed: 2780,
  parsingFailed: 3002,
  configFileError: 5001,
} as const;

export const MESSAGE_LEVEL = { none: 0, error: 1, warning: 3, state: 4 } as const;

type MessageLevel = (typeof MESSAGE_LEVEL)[keyof typeof MESSAGE_LEVEL];

const LEVEL_PREFIXES: Record<MessageLevel, string> = {
  0: "",
  1: "Error: ",
  3: "Warning: ",
  4: "State ",
};

export interface MessagePrinter {
  isTool: boolean;
  version: TlcVersion;
  print: (code: number, level: MessageLevel, text: string) => void;
}

// With -tool, TLC wraps each message in markers of its code and level, and leaves lines such as
// Print's bare. A warning prints once, -nowarning drops it, and without -tool the first one
// says how to drop them.
export const createMessagePrinter = (
  isTool: boolean,
  isWarningEnabled = true,
  version: TlcVersion = "master",
  suppressedCodes: number[] = [],
  errorCodes: number[] = [],
): MessagePrinter => {
  const warnings = new Set<string>();
  return {
    isTool,
    version,
    print: (code, level, text) => {
      const isWarning = level === MESSAGE_LEVEL.warning;
      if (isWarning && errorCodes.includes(code)) {
        throw new TlaWarningAsError(code, text);
      }
      if (isWarning && !isWarningEnabled) return;
      if (level !== MESSAGE_LEVEL.error && suppressedCodes.includes(code)) return;
      const hint =
        isWarning && !isTool && warnings.size === 0
          ? "\n(Use the -nowarning option to disable this warning.)"
          : "";
      const message = isTool
        ? `@!@!@STARTMSG ${code}:${level} @!@!@\n${text}\n@!@!@ENDMSG ${code} @!@!@`
        : `${LEVEL_PREFIXES[level]}${text}${hint}`;
      if (isWarning && warnings.has(message)) return;
      if (isWarning) warnings.add(message);
      console.log(message);
    },
  };
};

// TLC 1.7.4's message for a missing initial predicate also blames a parameterized INSTANCE.
export const MISSING_INIT_174 =
  "The configuration file did not specify the initial state predicate.\nCan also be caused by trying to run TLC on a specification from\na module imported with a parameterized INSTANCE statement.";

// isEvalException: whether TLC throws the message as an EvalException, not a TLCRuntimeException.
// TLC's -tool output wraps such a message in its own markers even inside another message.
const CODED_MESSAGES: [code: number, template: string, isEvalException: boolean][] = [
  [1005, STACK_OVERFLOW_MESSAGE, false],
  [
    1000,
    "In evaluating TLCExt!Trace, the state is not completely specified yet (variable%1% %2% undefined).",
    false,
  ],
  [2117, "Failed to recover the next state from its fingerprint.", true],
  [2123, "Failed to recover the initial state from its fingerprint.", true],
  [2132, "The first argument of Assert evaluated to FALSE; the second argument was:\n%1%", true],
  [2143, "The variable %1% was changed while it is specified as UNCHANGED at\n%2%", false],
  [2144, "The EXCEPT was applied to non-existing fields of the value at\n%1%", false],
  [2145, "TLCGet(%1%) was undefined.", true],
  [
    2154,
    "Attempted to apply the operator overridden by the Java method\n%1%,\nbut it produced the following error:\n%2%",
    false,
  ],
  [
    2148,
    "The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable %1% occurring in the state formula v.\n",
    false,
  ],
  [2155, "Attempted to compare %1% with the value\n%2%", true],
  [2158, "Attempted to check if the value:\n%1%\nis an element of %2%.", true],
  [
    2157,
    "Attempted to apply TransitiveClosure to a set containing\nthe following value:\n%1%",
    true,
  ],
  [2165, "Choose can only deal with numbers up to %1%", false],
  [2169, "The %1% argument of %2% should be a %3%, but instead it is:\n%4%", true],
  [2170, "Argument mismatch in operator application.", false],
  [2171, "Parsing or semantic analysis failed.%1%", false],
  [2172, TOO_MANY_STATES_MESSAGE, false],
  [2176, "Applying %1% to the following value,\nwhich is not %2%:\n%3%", true],
  [
    2177,
    "Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n%1%",
    true,
  ],
  [2178, "Overflow when computing %1%", false],
  [2179, "The second argument of \\div is 0.", true],
  [2180, "0^0 is undefined.", true],
  [2181, "Attempted to compute cardinality of the value\n%1%", true],
  [2182, "Evaluating an expression of the form %1% when s is not a %2%:\n%3%", true],
  [
    2183,
    "The %1% argument of %2% must be in the domain of its %3% argument:\n%4%\n, but instead it is\n%5%",
    true,
  ],
  [2184, "Attempted to apply %1% to the empty sequence.", true],
  [2115, "No next state actions defined to generate successor states from.", false],
  [
    2146,
    "The invariant %1% is not a state predicate (one with no primes or temporal operators).%2%",
    false,
  ],
  [2213, "TLC cannot handle the temporal formula %1%", false],
  [2214, "Temporal formulas containing actions must be of forms <>[]A or []<>A.", false],
  [2215, "TLC expected a %1% value, but did not find one. %2%", false],
  [2222, "The constant parameter %1% is not assigned a value by the configuration file.", false],
  [
    2223,
    "In the configuration file, the identifier %1% appears\non the right-hand side of a <- after already appearing on the\nleft-hand side of one.",
    false,
  ],
  [2224, "The configuration file substitutes for %1% with the undefined identifier %2%.", false],
  [
    2225,
    "The configuration file substitutes for %1% with %2% of different number of arguments.",
    false,
  ],
  [
    2226,
    "In the configuration file, the identifier %1% does not appear in the specification.",
    false,
  ],
  [2227, "The configuration file cannot specify both INIT/NEXT and SPECIFICATION fields.", false],
  [2228, "TLC requires %1% not to take any argument.", false],
  [2228, "TLC requires %1% not to take any argument, but one was given: %2%", false],
  [
    2229,
    "The %1% %2% specified in the configuration file\nis not defined in the specification.",
    false,
  ],
  [2230, "The %1% of %2% is equal to %3%", false],
  [2231, "The configuration file did not specify the initial state predicate.", false],
  [2231, MISSING_INIT_174, false],
  [2232, "The configuration file did not specify the next state predicate.", false],
  [2233, "The %1% %2% cannot be a constant.", false],
  [2234, "The operator %1% cannot take any argument.", false],
  [2235, "The operator %1% is not defined in the spec.", false],
  [2236, "The operator %1%, which equals %2%,\ncannot be used as a %3%", false],
  [2237, "The spec is trivially false because %1% is false.", false],
  [2238, "TLC cannot handle subscript %1%", false],
  [2239, "TLC cannot handle this conjunct of the spec:\n%1%", false],
  [
    2240,
    "The specification contains more than one conjunct of the form [][Next]_v,\nbut TLC can handle only specifications with one next-state relation.",
    false,
  ],
  [2241, "The property %1% is not correctly defined.", false],
  [2242, "The arity of the operator %1% is inconsistent in the configuration file.", false],
  [2244, "TLC can't handle real numbers.\n%1%", false],
  [
    2245,
    "In the configuration file, the module name %1% is not a module in the specification.",
    false,
  ],
  [2247, "In computing %1%, TLC expected a %2% expression,\nbut instead found %3%.\n%4%", false],
  [2248, "In computing %1%, TLC expected a %2% expression,\nbut didn't find one.\n%3%", false],
  [2260, "In computing ENABLED, TLC encountered a temporal formula (%1%).\n%2%", false],
  [
    2261,
    "TLC encountered a temporal formula (%1%) when evaluating a predicate or action.\n%2%",
    false,
  ],
  [2265, "TLC can't handle a number this big.\n%1%", false],
  [2266, "The %1% argument of %2% should be an %3%, but instead it is:\n%4%", true],
  [
    2272,
    "The formula %1% at %2% is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action %1% holds in *every* step of the behavior, define a temporal property: Let A be the formula at %2%; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).",
    false,
  ],
  [
    2273,
    'The formula %1% at %2% is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action %1% holds in *every* step of the behavior, define a temporal property by applying the "always" temporal operator ([]) to the formula at %2% (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).',
    false,
  ],
  [
    2274,
    'The formula %1% at %2% is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that infinitely many %1% steps occur, define a temporal property by applying the "always eventually" temporal operator combination ([]<>) to the formula at %2% (compare page 91 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).',
    false,
  ],
  [2280, "In evaluation, the identifier %1% is either undefined or not an operator.\n%2%", false],
  [2281, "The configuration file substitutes constant %1% with non-constant %2%%3%", false],
  [2283, "The argument of %1% should be a %2%, but instead it is:\n%3%", true],
  [
    5003,
    "TLC found an error in the configuration file at line %1%\nThe keyword %2% was not followed by an identifier.",
    false,
  ],
  [
    5004,
    "TLC found an error in the configuration file at line %1%\nThe keyword %2% appeared twice.",
    false,
  ],
  [
    5005,
    "TLC found an error in the configuration file at line %1%\nExpected an identifier after %2%.",
    false,
  ],
  [
    5006,
    "TLC found an error in the configuration file at line %1%\nIt was expecting %2%, but did not find it.",
    false,
  ],
  [5007, "TLC found an error in the configuration file:\n%1%", false],
  // The general message is a prefix of the others above.
  [5002, "TLC found an error in the configuration file at line %1%\n", false],
  [2250, "A state predicate was evaluated to a non-boolean value.", false],
  [2252, "Encountered an action predicate that's not a boolean.", false],
  [2253, "Temporal formula is a tautology (its negation is unsatisfiable).", false],
  [
    2301,
    "TLC does not support temporal existential, nor universal, quantification over state variables.",
    false,
  ],
];

interface CodedMessage {
  code: number;
  isEvalException: boolean;
}

const codedMessagePatterns = {
  value: undefined as { pattern: RegExp; message: CodedMessage }[] | undefined,
};

const getCodedMessagePatterns = () =>
  (codedMessagePatterns.value ??= CODED_MESSAGES.map(([code, template, isEvalException]) => ({
    pattern: new RegExp(
      `^${template
        .split(/%\d+%/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[\\s\\S]*")}$`,
    ),
    message: { code, isEvalException },
  })));

// Plain messages that read like coded ones: the overflows of SetOfFcnsValue and SetOfTuplesValue,
// SetPredValue's tuple membership, and Tool#enabled's for ~> and -+->.
const UNCODED_MESSAGE_PATTERN =
  /^Overflow when computing the number of elements in( |:\n\[(?![A-Za-z0-9_]+: ))|\nis an element of a set of \d+-tuples\.$|^In computing ENABLED, TLC encountered a temporal formula \(a (~> b|-\+-> formula)\)\./;

export const getCodedMessage = (text: string): CodedMessage | undefined =>
  UNCODED_MESSAGE_PATTERN.test(text)
    ? undefined
    : getCodedMessagePatterns().find((item) => item.pattern.test(text))?.message;

// Only a standard module's Java code throws an EvalException; Assert.fail throws the other kind.
export const isEvalException = (error: TlaEvaluationError) =>
  error instanceof TlaModuleError || getCodedMessage(error.message)?.isEvalException === true;

// The messages that end with the message of the error they report, after this text.
const INNER_MESSAGE_PREFIXES = new Map([
  // "The exception was a <class>\n: "
  [1000, "\n: "],
  [2105, "failed.\n"],
  [2154, "but it produced the following error:\n"],
  [2171, "Parsing or semantic analysis failed."],
  [2213, ":\n"],
  [2281, " - specifically: "],
  [2405, "failed.\n"],
]);

// TLC's message holds the inner error's text as TLC printed it, markers included.
export const formatInnerMessage = (code: number, text: string, isTool: boolean) => {
  const prefix = isTool ? INNER_MESSAGE_PREFIXES.get(code) : undefined;
  const index = prefix === undefined ? -1 : text.indexOf(prefix);
  if (prefix === undefined || index === -1) return text;
  const end = index + prefix.length;
  return `${text.slice(0, end)}${formatNestedMessage(text.slice(end), isTool)}`;
};

export const formatNestedMessage = (text: string, isTool: boolean): string => {
  const code = isTool ? getCodedMessage(text)?.code : undefined;
  return code === undefined
    ? text
    : `@!@!@STARTMSG ${code}:${MESSAGE_LEVEL.none} @!@!@\n${formatInnerMessage(code, text, isTool)}\n@!@!@ENDMSG ${code} @!@!@`;
};

const zeroPad = (value: number) => String(value).padStart(2, "0");

export const formatTlcDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60_000) % 60;
  const hours = Math.floor(milliseconds / 3_600_000);
  if (milliseconds > 86_400_000) return `${Math.floor(hours / 24)}d ${zeroPad(hours % 24)}h`;
  if (milliseconds > 3_600_000) return `${zeroPad(hours % 24)}h ${zeroPad(minutes)}min`;
  return milliseconds > 60_000
    ? `${zeroPad(minutes)}min ${zeroPad(seconds)}s`
    : `${zeroPad(seconds)}s`;
};

export const formatTlcDate = (date: Date) =>
  `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())} ${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}:${zeroPad(date.getSeconds())}`;

interface HeadedError {
  code: number;
  headline: string;
  inner: TlaEvaluationError;
}

const headedErrors = new WeakMap<Error, HeadedError>();

export const withHeadline = (error: unknown, code: number, headline: string) => {
  if (!(error instanceof TlaEvaluationError)) return error;
  const headed = setExitCode(
    new TlaEvaluationError(`${headline}\n${error.message}`, error),
    getErrorExitCode(error),
  );
  headedErrors.set(headed, { code, headline, inner: error });
  return headed;
};

export const isHeadedError = (error: Error) => headedErrors.has(error);

const WRONG_INVOCATION_EXCEPTION = getUnexpectedException("util.WrongInvocationException");

const UNEXPECTED_HEADLINE = UNEXPECTED_EXCEPTION.slice(0, UNEXPECTED_EXCEPTION.indexOf("\n"));

// TLC 1.7.4 wraps an error in adding a successor in a RuntimeException naming its class.
const WRAPPED_EVAL_EXCEPTION = `${UNEXPECTED_EXCEPTION}tlc2.tool.EvalException: `;
const WRAPPED_RUNTIME_EXCEPTION = `${UNEXPECTED_EXCEPTION}util.Assert$TLCRuntimeException: `;

export const getWrappedException = (error: TlaEvaluationError) =>
  isEvalException(error) ? WRAPPED_EVAL_EXCEPTION : WRAPPED_RUNTIME_EXCEPTION;

// TLC reports an EvalException, or a TLCRuntimeException without its own message, as unexpected.
export const withUnexpectedException = <Result>(compute: () => Result) => {
  try {
    return compute();
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    if (isEvalException(error)) {
      throw new TlaEvaluationError(`${UNEXPECTED_EVAL_EXCEPTION}${error.message}`);
    }
    if (getCodedMessage(error.message)) throw error;
    throw new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${error.message}`);
  }
};

const UNEXPECTED_EXCEPTION_PREFIXES = [
  WRAPPED_EVAL_EXCEPTION,
  WRAPPED_RUNTIME_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  UNEXPECTED_EVAL_EXCEPTION,
];

const formatErrorMessage = (error: TlaEvaluationError, isTool: boolean): string => {
  const headed = headedErrors.get(error);
  if (headed) return `${headed.headline}\n${formatErrorMessage(headed.inner, isTool)}`;
  const message = error.message;
  if (error instanceof TlaUncodedError) return message;
  const prefix = UNEXPECTED_EXCEPTION_PREFIXES.find((start) => message.startsWith(start)) ?? "";
  return `${prefix}${formatNestedMessage(message.slice(prefix.length), isTool)}`;
};

// TLC reports an error with a headline by its message's code, and one that escapes the next
// states with an EvalException's code, or as an unexpected exception.
export interface FailureMessage {
  code: number;
  message: string;
  toolMessage: string;
}

export const getFailureMessage = (
  error: TlaEvaluationError,
  isNextState: boolean,
): FailureMessage => {
  const headed = headedErrors.get(error);
  const message = error.message;
  if (headed) {
    return {
      code: headed.code,
      message,
      toolMessage: formatErrorMessage(error, true),
    };
  }
  // TLC prints a StackOverflowError by its code in the next states, as plain text in the initial.
  if (error instanceof TlaStackOverflowError) {
    return {
      code: isNextState ? MESSAGE_CODE.stackOverflow : MESSAGE_CODE.general,
      message,
      toolMessage: message,
    };
  }
  if (isNextState && isEvalException(error)) {
    return {
      code: getCodedMessage(message)?.code ?? MESSAGE_CODE.general,
      message,
      toolMessage: message,
    };
  }
  const isUnexpected = isNextState && !message.startsWith(UNEXPECTED_HEADLINE);
  const exception =
    error instanceof TlaSetBoundError ? WRONG_INVOCATION_EXCEPTION : UNEXPECTED_EXCEPTION;
  const prefix = isUnexpected ? exception : "";
  return {
    code: MESSAGE_CODE.general,
    message: `${prefix}${message}`,
    toolMessage: `${prefix}${formatErrorMessage(error, true)}`,
  };
};
