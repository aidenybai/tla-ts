import { closeSync, openSync } from "node:fs";
import { availableParallelism } from "node:os";
import type { ModuleOperator } from "../check";

export interface TlcArguments {
  specs: string[];
  configPath: string | undefined;
  seed: bigint;
  aril: bigint;
  workers: number;
  coverage: number | undefined;
  livenessCheck: string;
  dump: string[] | undefined;
  fingerprintIndex: number;
  maxSetSize: number | undefined;
  isLazyValueExpanded: boolean;
  isViewPrinted: boolean;
  metadir: string | undefined;
  recoverDirectory: string | undefined;
  mode: "model-check" | "simulate" | "generate";
  dfidDepth: number | undefined;
  traceDepth: number;
  traceCount: bigint | undefined;
  scheduler: "random" | "rl" | "rlaction";
  isTool: boolean;
  isContinued: boolean;
  isDeadlockChecked: boolean;
  isWarningEnabled: boolean;
  isTraceSpecForced: boolean;
  isTraceSpecDisabled: boolean;
  isTraceBinaryDisabled: boolean;
  traceSpecPath: string | undefined;
  isDiffTrace: boolean;
  suppressedCodes: number[];
  errorCodes: number[];
  userFile: string | undefined;
  invariants: RuntimeInvariant[];
  moduleOperators: ModuleOperator[];
}

export interface RuntimeInvariant {
  modules: string[];
  expression: string;
}

export interface TlcArgumentsError {
  kind: "command-line" | "uncaught";
  error: string;
  isTool: boolean;
}

interface MessageCodes {
  tlc: number[];
  sany: number[];
}

const FINGERPRINT_POLYNOMIALS = 131;
const MAXIMUM_INT = 2147483647n;

const TLC_MESSAGE_CODES = [
  [-123456, -123456],
  [-1, 0],
  [1000, 1003],
  [1005, 1005],
  [1101, 1102],
  [2000, 2001],
  [2100, 2149],
  [2154, 2274],
  [2279, 2287],
  [2300, 2301],
  [2400, 2405],
  [2501, 2502],
  [2772, 2780],
  [3000, 3002],
  [3100, 3114],
  [4000, 4002],
  [5001, 5007],
  [7000, 7010],
  [20000, 20000],
];

const SANY_ERROR_CODES = [
  [4003, 4005],
  [4200, 4206],
  [4220, 4224],
  [4240, 4247],
  [4260, 4262],
  [4270, 4275],
  [4290, 4294],
  [4310, 4315],
  [4330, 4337],
  [4350, 4357],
];

const SANY_WARNING_CODES = new Map([
  [4800, "EXTENDED_MODULES_SYMBOL_UNIFICATION_AMBIGUITY"],
  [4801, "INSTANCED_MODULES_SYMBOL_UNIFICATION_AMBIGUITY"],
  [4802, "RECORD_CONSTRUCTOR_FIELD_NAME_CLASH"],
  [4803, "PLUSCAL_ALGORITHM_AND_TRANSLATION_CHANGED_SINCE_LAST_TRANSLATION"],
  [4804, "PLUSCAL_ALGORITHM_CHANGED_SINCE_LAST_TRANSLATION"],
  [4805, "PLUSCAL_TRANSLATION_CHANGED_SINCE_LAST_TRANSLATION"],
]);

interface TraceFormat {
  module: string;
  constant: string;
  operators: Pick<ModuleOperator, "kind" | "operator">[];
}

const getDumpedTrace = (module: string, operator: string, constant: string): TraceFormat => ({
  module,
  constant,
  operators: [{ kind: "postcondition", operator }],
});

const DUMPED_TRACES: Record<string, TraceFormat> = {
  json: getDumpedTrace("_JsonTrace", "_JsonTrace", "_JsonTraceFile"),
  tla: getDumpedTrace(
    "_TLAPlusCounterExample",
    "_TLAPlusCounterExample",
    "_TLAPlusCounterExampleFile",
  ),
  tlc: getDumpedTrace("_TLCTrace", "_TLCTrace", "_TLCTraceFile"),
  tlcplain: getDumpedTrace("_TLCTracePlain", "_TLCTrace", "_TLCTraceFile"),
  tlctespec: getDumpedTrace("_TLCTESpec", "_TLCTrace", "_TLCTraceFile"),
  tlcaction: getDumpedTrace("_TLCActionTrace", "_TLCTrace", "_TLCTraceFile"),
  dot: getDumpedTrace("_DotTrace", "_DotTrace", "_DotTraceFile"),
};

const getLoadedTrace = (module: string, prefix: string): TraceFormat => ({
  module,
  constant: `${prefix}InputFile`,
  operators: [
    { kind: "constraint", operator: `${prefix}Constraint` },
    { kind: "view", operator: `${prefix}View` },
  ],
});

const LOADED_TRACES: Record<string, TraceFormat> = {
  tlc: getLoadedTrace("_TLCTrace", "_TLCTrace"),
  json: getLoadedTrace("_JsonTrace", "_JsonTrace"),
};

const isInRanges = (ranges: number[][], code: number) =>
  ranges.some((range) => code >= range[0] && code <= range[1]);

const splitLikeJava = (text: string, separator: string) => {
  if (text === "") return [text];
  const parts = text.split(separator);
  while (parts.at(-1) === "") parts.pop();
  return parts;
};

const getOverlap = (suppressed: number[], errors: number[]) =>
  [...new Set(suppressed.filter((code) => errors.includes(code)))].sort(
    (left, right) => left - right,
  );

const parseJavaInteger = (text: string, bits: 32 | 64) => {
  if (!/^[+-]?\d+$/.test(text)) return undefined;
  const value = BigInt(text);
  return BigInt.asIntN(bits, value) === value ? value : undefined;
};

const parseJavaDouble = (text: string) =>
  /^[+-]?(NaN|Infinity|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?)$/.test(text.trim())
    ? Number.parseFloat(text.trim().replace(/[fFdD]$/, ""))
    : undefined;

const createDefaults = (): TlcArguments => ({
  specs: [],
  configPath: undefined,
  seed: 0n,
  aril: 0n,
  workers: 1,
  coverage: undefined,
  livenessCheck: "default",
  dump: undefined,
  fingerprintIndex: 0,
  maxSetSize: undefined,
  isLazyValueExpanded: true,
  isViewPrinted: false,
  metadir: undefined,
  recoverDirectory: undefined,
  mode: "model-check",
  dfidDepth: undefined,
  traceDepth: 100,
  traceCount: undefined,
  scheduler: "random",
  isTool: false,
  isContinued: false,
  isDeadlockChecked: true,
  isWarningEnabled: true,
  isTraceSpecForced: false,
  isTraceSpecDisabled: false,
  isTraceBinaryDisabled: false,
  traceSpecPath: undefined,
  isDiffTrace: false,
  suppressedCodes: [],
  errorCodes: [],
  userFile: undefined,
  invariants: [],
  moduleOperators: [],
});

const SWITCHES: Record<string, (parsed: TlcArguments) => void> = {
  "-modelcheck": () => {},
  "-difftrace": (parsed) => {
    parsed.isDiffTrace = true;
  },
  "-deadlock": (parsed) => {
    parsed.isDeadlockChecked = false;
  },
  "-cleanup": () => {},
  "-nowarning": (parsed) => {
    parsed.isWarningEnabled = false;
  },
  "-gzip": () => {},
  "-terse": (parsed) => {
    parsed.isLazyValueExpanded = false;
  },
  "-continue": (parsed) => {
    parsed.isContinued = true;
  },
  "-view": (parsed) => {
    parsed.isViewPrinted = true;
  },
  "-debug": () => {},
  "-tool": (parsed) => {
    parsed.isTool = true;
  },
};

interface ValueFlag {
  missing: string;
  apply: (parsed: TlcArguments, text: string) => string | undefined;
}

const applyInteger =
  (
    bits: 32 | 64,
    malformed: string,
    apply: (parsed: TlcArguments, value: bigint, text: string) => string | undefined,
  ) =>
  (parsed: TlcArguments, text: string) => {
    const value = parseJavaInteger(text, bits);
    return value === undefined
      ? `${malformed} But encountered ${text}`
      : apply(parsed, value, text);
  };

const getIntervalFlag = (
  name: string,
  missing: string,
  malformed: string,
  assign: (parsed: TlcArguments, minutes: number) => void,
): ValueFlag => ({
  missing,
  apply: applyInteger(32, malformed, (parsed, minutes) => {
    // TLC multiplies the minutes into an int of milliseconds.
    const milliseconds = BigInt.asIntN(32, minutes * 60_000n);
    if (milliseconds < 0n) return `Error: expect a nonnegative integer for -${name} option.`;
    assign(parsed, Number(milliseconds) / 60_000);
  }),
});

const VALUE_FLAGS: Record<string, ValueFlag> = {
  "-teSpecOutDir": {
    missing: "Error: expected a path for -teSpecOutDir option.",
    apply: (parsed, path) => {
      parsed.traceSpecPath = path;
    },
  },
  "-userFile": {
    missing: "Error: need to specify the full qualified file.",
    apply: (parsed, path) => {
      try {
        closeSync(openSync(path, "w"));
      } catch {
        return "Error: Failed to create user output log file.";
      }
      parsed.userFile = path;
    },
  },
  "-lncheck": {
    missing: "Error: expect a strategy such as final for -lncheck option.",
    apply: (parsed, strategy) => {
      parsed.livenessCheck = strategy.toLowerCase();
    },
  },
  "-config": {
    missing: "Error: expect a file name for -config option.",
    apply: (parsed, path) => {
      const name = path.replace(/\.cfg$/, "");
      parsed.configPath = name.endsWith(".tla") ? name : `${name}.cfg`;
    },
  },
  "-coverage": getIntervalFlag(
    "coverage",
    "Error: coverage report interval required.",
    "Error: An integer for coverage report interval required.",
    (parsed, minutes) => {
      parsed.coverage = minutes;
    },
  ),
  "-checkpoint": getIntervalFlag(
    "checkpoint",
    "Error: checkpoint interval required.",
    "Error: An integer for checkpoint interval is required.",
    () => {},
  ),
  "-depth": {
    missing: "Error: trace length required.",
    apply: applyInteger(32, "Error: An integer for trace length required.", (parsed, depth) => {
      parsed.traceDepth = Number(depth);
    }),
  },
  "-seed": {
    missing: "Error: seed required.",
    apply: applyInteger(64, "Error: An integer for seed required.", (parsed, seed) => {
      parsed.seed = seed;
    }),
  },
  "-aril": {
    missing: "Error: aril required.",
    apply: applyInteger(64, "Error: An integer for aril required.", (parsed, aril) => {
      parsed.aril = aril;
    }),
  },
  "-maxSetSize": {
    missing: "Error: maxSetSize required.",
    apply: applyInteger(32, "Error: An integer for maxSetSize required.", (parsed, bound, text) => {
      if (bound < 1n) {
        return `Error: Value in interval [0, ${MAXIMUM_INT}] for maxSetSize required. But encountered ${text}`;
      }
      parsed.maxSetSize = Number(bound);
    }),
  },
  "-recover": {
    missing: "Error: need to specify the metadata directory for recovery.",
    apply: (parsed, directory) => {
      parsed.recoverDirectory = directory;
    },
  },
  "-metadir": {
    missing: "Error: need to specify the metadata directory.",
    apply: (parsed, directory) => {
      parsed.metadir = directory;
    },
  },
  "-workers": {
    missing: "Error: expect an integer or 'auto' for -workers option.",
    apply: (parsed, text) => {
      const count =
        text.trim().toLowerCase() === "auto"
          ? BigInt(availableParallelism())
          : parseJavaInteger(text, 32);
      if (count === undefined) {
        return `Error: worker number or 'auto' required. But encountered ${text}`;
      }
      if (count < 1n) return "Error: at least one worker required.";
      parsed.workers = Number(count);
    },
  },
  "-dfid": {
    missing: "Error: expect a nonnegative integer for -dfid option.",
    apply: applyInteger(
      32,
      "Error: expect a nonnegative integer for -dfid option.",
      (parsed, depth) => {
        if (depth < 0n) return "Error: expect a nonnegative integer for -dfid option.";
        parsed.dfidDepth = Number(depth);
      },
    ),
  },
  "-fp": {
    missing: "Error: expect an integer for -fp option.",
    apply: applyInteger(32, "Error: A number for -fp is required.", (parsed, index) => {
      if (index < 0n || index >= FINGERPRINT_POLYNOMIALS) {
        return `Error: The number for -fp must be between 0 and ${FINGERPRINT_POLYNOMIALS - 1} (inclusive).`;
      }
      parsed.fingerprintIndex = Number(index);
    }),
  },
  "-fpmem": {
    missing: "Error: fpset memory size required.",
    apply: (_parsed, text) => {
      const size = parseJavaDouble(text);
      if (size === undefined || size < 0) {
        return `Error: An positive integer or a fraction for fpset memory size/percentage required. But encountered ${text}`;
      }
      if (size > 1) {
        process.stdout.write(
          "Using -fpmem with an abolute memory value has been deprecated. Please allocate memory for the TLC process via the JVM mechanisms and use -fpmem to set the fraction to be used for fingerprint storage.\n",
        );
      }
    },
  },
  "-fpbits": {
    missing: "Error: fpbits required.",
    apply: applyInteger(32, "Error: An integer for fpbits required.", (_parsed, bits, text) =>
      bits < 0n || bits > 30n
        ? `Error: Value in interval [0, 30] for fpbits required. But encountered ${text}`
        : undefined,
    ),
  },
};

interface TraceFlag {
  name: string;
  missing: string;
  formats: Record<string, TraceFormat>;
}

const TRACE_FLAGS: Record<string, TraceFlag> = {
  "-loadtrace": {
    name: "-loadTrace",
    missing: "Error: A format and a file name for loading traces required.",
    formats: LOADED_TRACES,
  },
  "-dumptrace": {
    name: "-dumpTrace",
    missing: "Error: A format and a file name for dumping traces required.",
    formats: DUMPED_TRACES,
  },
};

export const parseTlcArguments = (args: string[]): TlcArguments | TlcArgumentsError | "usage" => {
  const parsed = createDefaults();
  let argumentIndex = 0;
  const reject = (error: string): TlcArgumentsError => ({
    kind: "command-line",
    error,
    isTool: parsed.isTool,
  });
  const getMissing = (): TlcArgumentsError => ({
    kind: "uncaught",
    error: `java.lang.ArrayIndexOutOfBoundsException: Index ${args.length} out of bounds for length ${args.length}`,
    isTool: parsed.isTool,
  });
  const suppressedCodes: MessageCodes = { tlc: [], sany: [] };
  const errorCodes: MessageCodes = { tlc: [], sany: [] };
  const peek = () => args[argumentIndex];
  const take = () => args[argumentIndex++];
  while (argumentIndex < args.length) {
    const flag = take();
    if (Object.hasOwn(SWITCHES, flag)) {
      SWITCHES[flag](parsed);
      continue;
    }
    if (Object.hasOwn(VALUE_FLAGS, flag)) {
      const text = take();
      if (text === undefined) return reject(VALUE_FLAGS[flag].missing);
      const error = VALUE_FLAGS[flag].apply(parsed, text);
      if (error !== undefined) return reject(error);
      continue;
    }
    if (flag === "-simulate" || flag === "-generate") {
      parsed.mode = flag === "-generate" ? "generate" : "simulate";
      const options = peek();
      if (
        options === undefined ||
        !["stats=", "file=", "num=", "sched"].some((option) => options.includes(option))
      ) {
        continue;
      }
      argumentIndex++;
      const hasFile = options.split(",").some((option) => option.startsWith("file="));
      parsed.scheduler = options.split(",").includes("sched=rl")
        ? "rl"
        : options.split(",").includes("sched=rlaction")
          ? "rlaction"
          : "random";
      for (const option of options.split(",").filter((item) => item.startsWith("num="))) {
        const count = option.replace("num=", "");
        parsed.traceCount = parseJavaInteger(count, 64);
        if (parsed.traceCount === undefined) {
          return {
            kind: "uncaught",
            error: `java.lang.NumberFormatException: For input string: "${count}"`,
            isTool: parsed.isTool,
          };
        }
      }
      if (parsed.traceCount === undefined && hasFile) {
        return reject(
          `Error: You need to specify a 'num' argument when using the 'file' argument, for example: '"num=5,file=test.txt"'.`,
        );
      }
      continue;
    }
    if (flag === "-suppressMessages" || flag === "-messagesAsErrors") {
      const text = take();
      if (text === undefined) {
        return reject(`Error: ${flag} requires a comma-separated list of message codes.`);
      }
      const codes = flag === "-suppressMessages" ? suppressedCodes : errorCodes;
      for (const item of splitLikeJava(text, ",")) {
        const trimmed = item.replace(/^[^!-\uffff]+|[^!-\uffff]+$/g, "");
        const parsedCode = parseJavaInteger(trimmed, 32);
        if (parsedCode === undefined) return reject(`Error: For input string: "${trimmed}"`);
        const code = Number(parsedCode);
        if (isInRanges(TLC_MESSAGE_CODES, code)) {
          codes.tlc.push(code);
          continue;
        }
        if (!SANY_WARNING_CODES.has(code) && !isInRanges(SANY_ERROR_CODES, code)) {
          return reject(`Error: unknown message code: ${code}`);
        }
        if (codes === suppressedCodes && !SANY_WARNING_CODES.has(code)) {
          return reject(`Error: code ${code} is an error and cannot be suppressed.`);
        }
        codes.sany.push(code);
      }
      continue;
    }
    if (flag === "-inv") {
      const expression = take();
      if (expression === undefined) return getMissing();
      parsed.invariants.push({
        modules: [
          ...new Set([...expression.matchAll(/INSTANCE\s+(\w+)/g)].map((match) => match[1])),
        ],
        expression,
      });
      continue;
    }
    if (flag === "-invlevel") {
      const text = take();
      if (text === undefined) return getMissing();
      if (parseJavaInteger(text, 32) === undefined) {
        return reject(`Error: An integer for -invlevel required. But encountered ${text}`);
      }
      parsed.invariants.push({
        modules: ["TLC", "Naturals"],
        expression: `LET _T == INSTANCE TLC _N == INSTANCE Naturals IN _N!<(_T!TLCGet("level"), ${text})`,
      });
      continue;
    }
    if (flag === "-debugger") {
      const options = peek();
      if (
        options !== undefined &&
        ["port=", "nosuspend", "nohalt", "suspend", "halt"].some((option) =>
          options.includes(option),
        )
      ) {
        argumentIndex++;
      }
      continue;
    }
    if (flag === "-generateSpecTE") {
      parsed.isTraceSpecForced = true;
      if (peek() === "nomonolith") argumentIndex++;
      continue;
    }
    if (flag === "-noGenerateSpecTE" || flag.toLowerCase() === "-note") {
      parsed.isTraceSpecDisabled = true;
      continue;
    }
    if (flag === "-noGenerateSpecTEBin" || flag.toLowerCase() === "-notebin") {
      parsed.isTraceBinaryDisabled = true;
      continue;
    }
    if (flag === "-help" || flag === "-h") return "usage";
    if (flag === "-dump") {
      const format = peek();
      if (format?.startsWith("class,")) {
        return reject(
          `Trying to instantiate a custom IStateWriter implementation ${format.replaceAll("class,", "")}.`,
        );
      }
      const arity = format?.startsWith("dot") && argumentIndex + 1 < args.length ? 2 : 1;
      parsed.dump = args.slice(argumentIndex, argumentIndex + arity);
      argumentIndex += arity;
      if (parsed.dump.length === 0)
        return reject("Error: A file name for dumping states required.");
      continue;
    }
    if (Object.hasOwn(TRACE_FLAGS, flag.toLowerCase())) {
      const traceFlag = TRACE_FLAGS[flag.toLowerCase()];
      if (argumentIndex + 1 >= args.length) return reject(traceFlag.missing);
      const format = take();
      const path = take();
      if (!Object.hasOwn(traceFlag.formats, format.toLowerCase())) {
        return reject(`Error: Unknown format ${format} given to ${traceFlag.name}.`);
      }
      const trace = traceFlag.formats[format.toLowerCase()];
      parsed.moduleOperators.push(
        ...trace.operators.map((operator) => ({
          ...operator,
          module: trace.module,
          constants: { [trace.constant]: path },
        })),
      );
      continue;
    }
    if (flag.toLowerCase() === "-postcondition") {
      const target = take();
      if (target === undefined) return reject("Error: Module!Operator for postCondition required.");
      if (!target.includes("!")) {
        return reject(`Module!Operator for postCondition required. Encountered: ${target}`);
      }
      const parts = splitLikeJava(target, "!");
      if (parts.length !== 2) {
        return reject(
          `Module!Operator for postCondition must be of the form module!operator. Encountered: ${target}`,
        );
      }
      if (parts[0] === "") {
        return reject(`Module name for postCondition required. Encountered: ${target}`);
      }
      if (parts[0].includes(".")) {
        return reject(
          `Module name for postCondition must not contain a dot. Encountered: ${parts[0]}`,
        );
      }
      if (parts[1].includes(".")) {
        return reject(
          `Operator name for postCondition must not contain a dot. Encountered: ${parts[1]}`,
        );
      }
      parsed.moduleOperators.push({ kind: "postcondition", module: parts[0], operator: parts[1] });
      continue;
    }
    if (flag.startsWith("-")) return reject(`Error: unrecognized option: ${flag}`);
    parsed.specs.push(flag);
  }
  if (!parsed.isWarningEnabled && suppressedCodes.tlc.length + suppressedCodes.sany.length > 0) {
    return reject(
      "Error: -nowarning already suppresses all warnings, making -suppressMessages redundant. Remove -nowarning to suppress only the specified messages, or remove -suppressMessages to suppress all warnings.",
    );
  }
  const tlcOverlap = getOverlap(suppressedCodes.tlc, errorCodes.tlc);
  const overlap =
    tlcOverlap.length > 0
      ? tlcOverlap.map(String)
      : getOverlap(suppressedCodes.sany, errorCodes.sany).map(
          (code) => SANY_WARNING_CODES.get(code) ?? String(code),
        );
  if (overlap.length > 0) {
    return reject(
      `Error: The following codes were set to both -suppressMessages and -messagesAsErrors: [${overlap.join(", ")}]`,
    );
  }
  parsed.suppressedCodes = [...suppressedCodes.tlc, ...suppressedCodes.sany];
  parsed.errorCodes = [...errorCodes.tlc, ...errorCodes.sany];
  return parsed;
};
