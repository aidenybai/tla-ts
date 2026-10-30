import { TlaModuleError, type TlaEvaluationError } from "./errors";
import type { TlcVersion } from "./tlc-version";

// TLC's codes for the messages it prints, from tlc2.output.EC.
export const MESSAGE_CODE = {
  general: 1000,
  commandLineError: 1102,
  initialState: 2102,
  nestedExpression: 2103,
  assumptionFalse: 2104,
  assumptionEvaluationError: 2105,
  exceptAppliedToUnknownField: 2144,
  fingerprintFailed: 2147,
  invariantViolatedInitial: 2107,
  incompleteSuccessor: 2109,
  propertyViolatedInitial: 2108,
  invariantViolatedBehavior: 2110,
  invariantEvaluationFailed: 2111,
  actionPropertyViolatedBehavior: 2112,
  actionPropertyEvaluationFailed: 2113,
  deadlockReached: 2114,
  temporalPropertyViolated: 2116,
  behaviorUpToThisPoint: 2121,
  backToState: 2122,
  constantLevelInvariant: 2149,
  javaOverrideLoaded: 2168,
  starting: 2185,
  modelChecking: 2187,
  finished: 2186,
  computingInit: 2189,
  initGenerated1: 2190,
  initGenerated2: 2191,
  checkingTemporal: 2192,
  success: 2193,
  searchDepth: 2194,
  stats: 2199,
  progress: 2200,
  temporalBranches: 2212,
  statePrint2: 2217,
  statePrint3: 2218,
  sanyFinished: 2219,
  startingSany: 2220,
  stateLevelProperty: 2255,
  version: 2262,
  noSpecificationButProperty: 2257,
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

// TLC's message levels, from tlc2.output.MP.
export const MESSAGE_LEVEL = { none: 0, error: 1, warning: 3, state: 4 } as const;

type MessageLevel = (typeof MESSAGE_LEVEL)[keyof typeof MESSAGE_LEVEL];

// Without -tool, TLC starts a message with the prefix of its level.
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

// With -tool, TLC wraps each message in markers that name its code and level, so that a program
// can read the output. Lines outside the markers, such as the output of Print, stay as they are.
// MP.printWarning prints a warning once, which -nowarning drops, and without -tool, TLC follows the
// first warning with how to drop them.
export const createMessagePrinter = (
  isTool: boolean,
  isWarningEnabled = true,
  version: TlcVersion = "master",
): MessagePrinter => {
  const warnings = new Set<string>();
  return {
    isTool,
    version,
    print: (code, level, text) => {
      const isWarning = level === MESSAGE_LEVEL.warning;
      if (isWarning && !isWarningEnabled) return;
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

// TLC 1.7.4's message for a missing initial predicate, which blames a parameterized INSTANCE as
// well.
export const MISSING_INIT_174 =
  "The configuration file did not specify the initial state predicate.\nCan also be caused by trying to run TLC on a specification from\na module imported with a parameterized INSTANCE statement.";

// The messages that TLC builds from a message code, from tlc2.output.MP, by their code and
// template, with whether TLC throws them as an EvalException rather than a TLCRuntimeException.
// TLC's -tool output wraps such a message in its own markers even inside another message.
const CODED_MESSAGES: [code: number, template: string, isEvalException: boolean][] = [
  [
    1005,
    "This was a Java StackOverflowError. It was probably the result\nof an incorrect recursive function definition that caused TLC to enter\nan infinite loop when trying to compute the function or its application\nto an element in its putative domain.",
    false,
  ],
  [2117, "Failed to recover the next state from its fingerprint.", true],
  [2123, "Failed to recover the initial state from its fingerprint.", true],
  [2132, "The first argument of Assert evaluated to FALSE; the second argument was:\n%1%", true],
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
  [2237, "The spec is trivially false because %1% is false.", false],
  [2238, "TLC cannot handle subscript %1%", false],
  [2239, "TLC cannot handle this conjunct of the spec:\n%1%", false],
  [2241, "The property %1% is not correctly defined.", false],
  [2242, "The arity of the operator %1% is inconsistent in the configuration file.", false],
  [2244, "TLC can't handle real numbers.\n%1%", false],
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

// The overflows of SetOfFcnsValue and SetOfTuplesValue, which TLC raises with a plain message that
// reads like the coded overflow of SetOfRcdsValue and SubsetValue.
const UNCODED_MESSAGE_PATTERN =
  /^Overflow when computing the number of elements in( |:\n\[(?![A-Za-z0-9_]+ : ))/;

export const getCodedMessage = (text: string): CodedMessage | undefined =>
  UNCODED_MESSAGE_PATTERN.test(text)
    ? undefined
    : getCodedMessagePatterns().find((item) => item.pattern.test(text))?.message;

// Whether TLC raises an error as an EvalException, which only a standard module's Java code throws,
// rather than as the TLCRuntimeException of every Assert.fail.
export const isEvalException = (error: TlaEvaluationError) =>
  error instanceof TlaModuleError || getCodedMessage(error.message)?.isEvalException === true;

// The messages that end with the message of the error they report, after this text.
const INNER_MESSAGE_PREFIXES = new Map([
  // "The exception was a <class>\n: "
  [1000, "\n: "],
  [2105, "failed.\n"],
  [2154, "but it produced the following error:\n"],
  [2281, " - specifically: "],
]);

// The text of a coded message with the message of the error it reports marked in -tool output, as
// TLC's message holds that error's text as TLC printed it.
export const formatInnerMessage = (code: number, text: string, isTool: boolean) => {
  const prefix = isTool ? INNER_MESSAGE_PREFIXES.get(code) : undefined;
  const index = prefix === undefined ? -1 : text.indexOf(prefix);
  if (prefix === undefined || index === -1) return text;
  const end = index + prefix.length;
  return `${text.slice(0, end)}${formatNestedMessage(text.slice(end), isTool)}`;
};

// The text of an error's message as TLC prints it inside another message.
export const formatNestedMessage = (text: string, isTool: boolean): string => {
  const code = isTool ? getCodedMessage(text)?.code : undefined;
  return code === undefined
    ? text
    : `@!@!@STARTMSG ${code}:${MESSAGE_LEVEL.none} @!@!@\n${formatInnerMessage(code, text, isTool)}\n@!@!@ENDMSG ${code} @!@!@`;
};

// TLC's convertRuntimeToHumanReadable: a duration in its two largest units.
export const formatTlcDuration = (milliseconds: number) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60_000) % 60;
  const hours = Math.floor(milliseconds / 3_600_000);
  if (milliseconds > 86_400_000) return `${Math.floor(hours / 24)}d ${pad(hours % 24)}h`;
  if (milliseconds > 3_600_000) return `${pad(hours % 24)}h ${pad(minutes)}min`;
  return milliseconds > 60_000 ? `${pad(minutes)}min ${pad(seconds)}s` : `${pad(seconds)}s`;
};

// TLC's SimpleDateFormat("yyyy-MM-dd HH:mm:ss") in the local time zone.
export const formatTlcDate = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
