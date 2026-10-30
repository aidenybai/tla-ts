// TLC's codes for the messages it prints, from tlc2.output.EC.
export const MESSAGE_CODE = {
  general: 1000,
  initialState: 2102,
  nestedExpression: 2103,
  assumptionFalse: 2104,
  assumptionEvaluationError: 2105,
  invariantViolatedInitial: 2107,
  propertyViolatedInitial: 2108,
  invariantViolatedBehavior: 2110,
  invariantEvaluationFailed: 2111,
  actionPropertyViolatedBehavior: 2112,
  actionPropertyEvaluationFailed: 2113,
  deadlockReached: 2114,
  temporalPropertyViolated: 2116,
  behaviorUpToThisPoint: 2121,
  backToState: 2122,
  starting: 2185,
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
  counterExample: 2264,
  checkingTemporalEnd: 2267,
  stateGraphOutdegree: 2268,
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
  print: (code: number, level: MessageLevel, text: string) => void;
}

// With -tool, TLC wraps each message in markers that name its code and level, so that a program
// can read the output. Lines outside the markers, such as the output of Print, stay as they are.
export const createMessagePrinter = (isTool: boolean): MessagePrinter => ({
  isTool,
  print: (code, level, text) =>
    console.log(
      isTool
        ? `@!@!@STARTMSG ${code}:${level} @!@!@\n${text}\n@!@!@ENDMSG ${code} @!@!@`
        : `${LEVEL_PREFIXES[level]}${text}`,
    ),
});

// The messages that TLC builds from a message code, from tlc2.output.MP, by their code and
// template, with whether TLC throws them as an EvalException rather than a TLCRuntimeException.
// TLC's -tool output wraps such a message in its own markers even inside another message.
const CODED_MESSAGES: [code: number, template: string, isEvalException: boolean][] = [
  [2117, "Failed to recover the next state from its fingerprint.", true],
  [2123, "Failed to recover the initial state from its fingerprint.", true],
  [2132, "The first argument of Assert evaluated to FALSE; the second argument was:\n%1%", true],
  [2145, "TLCGet(%1%) was undefined.", true],
  [
    2154,
    "Attempted to apply the operator overridden by the Java method\n%1%,\nbut it produced the following error:\n%2%",
    false,
  ],
  [2155, "Attempted to compare %1% with the value\n%2%", true],
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

export const getCodedMessage = (text: string): CodedMessage | undefined =>
  getCodedMessagePatterns().find((item) => item.pattern.test(text))?.message;

// The text of an error's message as TLC prints it inside another message.
export const formatNestedMessage = (text: string, isTool: boolean) => {
  const code = isTool ? getCodedMessage(text)?.code : undefined;
  return code === undefined
    ? text
    : `@!@!@STARTMSG ${code}:${MESSAGE_LEVEL.none} @!@!@\n${text}\n@!@!@ENDMSG ${code} @!@!@`;
};

// TLC's SimpleDateFormat("yyyy-MM-dd HH:mm:ss") in the local time zone.
// TLC's convertRuntimeToHumanReadable: a duration in its two largest units.
export const formatTlcDuration = (milliseconds: number) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60_000) % 60;
  const hours = Math.floor(milliseconds / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${pad(hours % 24)}h`;
  if (hours > 0) return `${pad(hours)}h ${pad(minutes)}min`;
  return minutes > 0 ? `${pad(minutes)}min ${pad(seconds)}s` : `${pad(seconds)}s`;
};

export const formatTlcDate = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
