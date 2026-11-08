import { availableParallelism } from "node:os";

// What TLC's command line asks for, as TLC.handleParameters reads it.
export interface TlcArguments {
  specs: string[];
  configPath: string | undefined;
  seed: bigint;
  aril: bigint;
  workers: number;
  livenessCheck: string;
  dump: string[] | undefined;
  fingerprintIndex: number;
  metadir: string | undefined;
  mode: "model-check" | "simulate" | "generate";
  // -dfid's initial depth, which makes TLC search depth-first.
  dfidDepth: number | undefined;
  // -depth: the length of a simulated behavior, where -1 means unbounded.
  traceDepth: number;
  // -simulate num=: how many behaviors to simulate.
  traceCount: bigint | undefined;
  isTool: boolean;
  isContinued: boolean;
  isDeadlockChecked: boolean;
  isWarningEnabled: boolean;
  // Whether TLC writes a trace exploration spec, and with it a binary trace, as -generateSpecTE,
  // -noGenerateSpecTE and -noGenerateSpecTEBin decide.
  isTraceSpecForced: boolean;
  isTraceSpecDisabled: boolean;
  isTraceBinaryDisabled: boolean;
  // -help, for which TLC prints its usage and exits.
  isUsage: boolean;
}

// TLC rejects its command line with a message, which it prints as -tool asks if -tool came first.
// An argument TLC reads past the end of the command line, or can't parse without catching the
// exception, ends TLC with that exception.
export interface TlcArgumentsError {
  error: string;
  isTool: boolean;
  isUncaught?: boolean;
}

// FP64.Polys holds 131 irreducible polynomials.
const FINGERPRINT_POLYNOMIALS = 131;
const MAXIMUM_INT = 2147483647n;

// Integer.parseInt and Long.parseLong.
const parseJavaInteger = (text: string, bits: 32 | 64) => {
  if (!/^[+-]?\d+$/.test(text)) return undefined;
  const value = BigInt(text);
  return BigInt.asIntN(bits, value) === value ? value : undefined;
};

// Double.parseDouble, without hexadecimal literals.
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
  livenessCheck: "default",
  dump: undefined,
  fingerprintIndex: 0,
  metadir: undefined,
  mode: "model-check",
  dfidDepth: undefined,
  traceDepth: 100,
  traceCount: undefined,
  isTool: false,
  isContinued: false,
  isDeadlockChecked: true,
  isWarningEnabled: true,
  isTraceSpecForced: false,
  isTraceSpecDisabled: false,
  isTraceBinaryDisabled: false,
  isUsage: false,
});

// The flags that take no value, with what each sets.
const SWITCHES: Record<string, (parsed: TlcArguments) => void> = {
  "-modelcheck": () => {},
  "-difftrace": () => {},
  "-deadlock": (parsed) => {
    parsed.isDeadlockChecked = false;
  },
  "-cleanup": () => {},
  "-nowarning": (parsed) => {
    parsed.isWarningEnabled = false;
  },
  "-gzip": () => {},
  "-terse": () => {},
  "-continue": (parsed) => {
    parsed.isContinued = true;
  },
  "-view": () => {},
  "-debug": () => {},
  "-tool": (parsed) => {
    parsed.isTool = true;
  },
};

// TLC.handleParameters: TLC reads its arguments in order and stops at the first it rejects.
export const parseTlcArguments = (args: string[]): TlcArguments | TlcArgumentsError => {
  const parsed = createDefaults();
  const cursor = { index: 0 };
  const reject = (error: string): TlcArgumentsError => ({ error, isTool: parsed.isTool });
  const getMissing = (): TlcArgumentsError => ({
    error: `java.lang.ArrayIndexOutOfBoundsException: Index ${args.length} out of bounds for length ${args.length}`,
    isTool: parsed.isTool,
    isUncaught: true,
  });
  const peek = () => args[cursor.index];
  const take = () => args[cursor.index++];
  // A flag that takes an integer: TLC names what it wants when the value is missing or isn't one.
  const readInteger = (bits: 32 | 64, missing: string, malformed: string) => {
    const text = peek();
    if (text === undefined) return reject(missing);
    const value = parseJavaInteger(text, bits);
    if (value === undefined) return reject(`${malformed} But encountered ${text}`);
    cursor.index++;
    return value;
  };
  while (cursor.index < args.length) {
    const flag = take();
    const isSwitch = Object.hasOwn(SWITCHES, flag);
    if (isSwitch) {
      SWITCHES[flag](parsed);
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
      cursor.index++;
      const hasFile = options.split(",").some((option) => option.startsWith("file="));
      for (const option of options.split(",").filter((item) => item.startsWith("num="))) {
        const count = option.replace("num=", "");
        parsed.traceCount = parseJavaInteger(count, 64);
        if (parsed.traceCount === undefined) {
          return {
            error: `java.lang.NumberFormatException: For input string: "${count}"`,
            isTool: parsed.isTool,
            isUncaught: true,
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
      if (take() === undefined) {
        return reject(`Error: ${flag} requires a comma-separated list of message codes.`);
      }
      continue;
    }
    if (flag === "-inv") {
      if (take() === undefined) return getMissing();
      continue;
    }
    if (flag === "-teSpecOutDir" || flag === "-userFile") {
      if (take() === undefined) {
        return reject(
          flag === "-userFile"
            ? "Error: need to specify the full qualified file."
            : "Error: expected a path for -teSpecOutDir option.",
        );
      }
      continue;
    }
    if (flag === "-invlevel") {
      const text = take();
      if (text === undefined) return getMissing();
      if (parseJavaInteger(text, 32) === undefined) {
        return reject(`Error: An integer for -invlevel required. But encountered ${text}`);
      }
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
        cursor.index++;
      }
      continue;
    }
    if (flag === "-generateSpecTE") {
      parsed.isTraceSpecForced = true;
      if (peek() === "nomonolith") cursor.index++;
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
    if (flag === "-help" || flag === "-h") return { ...parsed, isUsage: true };
    if (flag === "-lncheck") {
      const strategy = take();
      if (strategy === undefined) {
        return reject("Error: expect a strategy such as final for -lncheck option.");
      }
      parsed.livenessCheck = strategy.toLowerCase();
      continue;
    }
    if (flag === "-config") {
      const path = take();
      if (path === undefined) return reject("Error: expect a file name for -config option.");
      // MonolithSpecExtractor.getConfig reads a .tla file's embedded configuration.
      const name = path.replace(/\.cfg$/, "");
      parsed.configPath = name.endsWith(".tla") ? name : `${name}.cfg`;
      continue;
    }
    if (flag === "-dump") {
      const format = peek();
      // Like TLC, -dump takes a format only when it starts with dot and a file follows.
      const arity = format?.startsWith("dot") && cursor.index + 1 < args.length ? 2 : 1;
      parsed.dump = args.slice(cursor.index, cursor.index + arity);
      cursor.index += arity;
      if (parsed.dump.length === 0)
        return reject("Error: A file name for dumping states required.");
      continue;
    }
    if (flag.toLowerCase() === "-loadtrace" || flag.toLowerCase() === "-dumptrace") {
      const name = flag.toLowerCase() === "-loadtrace" ? "-loadTrace" : "-dumpTrace";
      if (cursor.index + 1 >= args.length) {
        return reject(
          name === "-loadTrace"
            ? "Error: A format and a file name for loading traces required."
            : "Error: A format and a file name for dumping traces required.",
        );
      }
      const format = take();
      const formats =
        name === "-loadTrace"
          ? ["tlc", "json"]
          : ["json", "tla", "tlc", "tlcplain", "tlctespec", "tlcaction", "dot"];
      if (!formats.includes(format.toLowerCase())) {
        return reject(`Error: Unknown format ${format} given to ${name}.`);
      }
      cursor.index++;
      continue;
    }
    if (flag.toLowerCase() === "-postcondition") {
      const target = take();
      if (target === undefined) return reject("Error: Module!Operator for postCondition required.");
      if (!target.includes("!")) {
        return reject(`Module!Operator for postCondition required. Encountered: ${target}`);
      }
      // String#split drops the empty strings at the end.
      const parts = target.split("!");
      while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
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
      continue;
    }
    if (flag === "-coverage" || flag === "-checkpoint") {
      const name = flag.slice(1);
      const minutes = readInteger(
        32,
        name === "coverage"
          ? "Error: coverage report interval required."
          : "Error: checkpoint interval required.",
        name === "coverage"
          ? "Error: An integer for coverage report interval required."
          : "Error: An integer for checkpoint interval is required.",
      );
      if (typeof minutes !== "bigint") return minutes;
      // TLC multiplies the minutes into an int of milliseconds.
      const milliseconds = BigInt.asIntN(32, minutes * 60_000n);
      if (milliseconds < 0n) {
        return reject(`Error: expect a nonnegative integer for -${name} option.`);
      }
      continue;
    }
    if (flag === "-depth") {
      const depth = readInteger(
        32,
        "Error: trace length required.",
        "Error: An integer for trace length required.",
      );
      if (typeof depth !== "bigint") return depth;
      parsed.traceDepth = Number(depth);
      continue;
    }
    if (flag === "-seed") {
      const seed = readInteger(64, "Error: seed required.", "Error: An integer for seed required.");
      if (typeof seed !== "bigint") return seed;
      parsed.seed = seed;
      continue;
    }
    if (flag === "-aril") {
      const aril = readInteger(64, "Error: aril required.", "Error: An integer for aril required.");
      if (typeof aril !== "bigint") return aril;
      parsed.aril = aril;
      continue;
    }
    if (flag === "-maxSetSize") {
      const text = peek();
      const bound = readInteger(
        32,
        "Error: maxSetSize required.",
        "Error: An integer for maxSetSize required.",
      );
      if (typeof bound !== "bigint") return bound;
      if (bound < 1n) {
        return reject(
          `Error: Value in interval [0, ${MAXIMUM_INT}] for maxSetSize required. But encountered ${text}`,
        );
      }
      continue;
    }
    if (flag === "-recover" || flag === "-metadir") {
      const directory = take();
      if (directory === undefined) {
        return reject(
          flag === "-recover"
            ? "Error: need to specify the metadata directory for recovery."
            : "Error: need to specify the metadata directory.",
        );
      }
      if (flag === "-metadir") parsed.metadir = directory;
      continue;
    }
    if (flag === "-workers") {
      const text = take();
      if (text === undefined) {
        return reject("Error: expect an integer or 'auto' for -workers option.");
      }
      const count =
        text.trim().toLowerCase() === "auto"
          ? BigInt(availableParallelism())
          : parseJavaInteger(text, 32);
      if (count === undefined) {
        return reject(`Error: worker number or 'auto' required. But encountered ${text}`);
      }
      if (count < 1n) return reject("Error: at least one worker required.");
      parsed.workers = Number(count);
      continue;
    }
    if (flag === "-dfid") {
      const text = take();
      const depth = text === undefined ? undefined : parseJavaInteger(text, 32);
      if (text !== undefined && depth === undefined) {
        return reject(
          `Error: expect a nonnegative integer for -dfid option. But encountered ${text}`,
        );
      }
      if (depth === undefined || depth < 0n) {
        return reject("Error: expect a nonnegative integer for -dfid option.");
      }
      parsed.dfidDepth = Number(depth);
      continue;
    }
    if (flag === "-fp") {
      const index = readInteger(
        32,
        "Error: expect an integer for -fp option.",
        "Error: A number for -fp is required.",
      );
      if (typeof index !== "bigint") return index;
      if (index < 0n || index >= FINGERPRINT_POLYNOMIALS) {
        return reject(
          `Error: The number for -fp must be between 0 and ${FINGERPRINT_POLYNOMIALS - 1} (inclusive).`,
        );
      }
      parsed.fingerprintIndex = Number(index);
      continue;
    }
    if (flag === "-fpmem") {
      const text = take();
      if (text === undefined) return reject("Error: fpset memory size required.");
      const size = parseJavaDouble(text);
      if (size === undefined || size < 0) {
        return reject(
          `Error: An positive integer or a fraction for fpset memory size/percentage required. But encountered ${text}`,
        );
      }
      continue;
    }
    if (flag === "-fpbits") {
      const text = peek();
      const bits = readInteger(
        32,
        "Error: fpbits required.",
        "Error: An integer for fpbits required.",
      );
      if (typeof bits !== "bigint") return bits;
      if (bits < 0n || bits > 30n) {
        return reject(
          `Error: Value in interval [0, 30] for fpbits required. But encountered ${text}`,
        );
      }
      continue;
    }
    if (flag.startsWith("-")) return reject(`Error: unrecognized option: ${flag}`);
    parsed.specs.push(flag);
  }
  return parsed;
};
