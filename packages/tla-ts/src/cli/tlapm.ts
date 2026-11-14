import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { availableParallelism } from "node:os";
import { TlaProofError, TlaProverError } from "../errors";
import { EXIT_STATUS } from "../exit-codes";
import type { LineRange } from "../obligations/generate";
import { getAtPrefix, getLocusText, type ObligationWarning } from "../obligations/expression";
import {
  formatSummary,
  getObligations,
  WHOLE_MODULE,
  type ModuleObligations,
  type PrintedObligation,
} from "../obligations";
import { format, renderDoc } from "../obligations/format";
import { printSequent, type PrinterOptions } from "../obligations/printer";
import { parseDefaultMethods, parseOcamlFloat, parseOcamlInt } from "../prover/prep/methods";
import {
  encodeProofTheory,
  formatNormalized,
  getFailureReason,
  isProvedAttempt,
  proveObligations,
  TLAPM_VERSION,
  type BackendSettings,
  type ProofAttempt,
} from "../prover/prove";
import { TLAPM_LIBRARY } from "../prover/tlapm-library";
import type { Decision } from "../prover/verdict";
import { getTlapmPaths } from "../prover/tlapm/tlapm";
import {
  getKnownResults,
  loadFingerprints,
  saveHistory,
  type FingerprintTable,
} from "../prover/tlapm/cache";
import { formatTlcDate } from "../tlc/messages";
import { TLAPM_COMMAND, USAGE, type ParsedArgs } from "./options";
import { getInputPaths } from "./shared";

interface TlapmArgument {
  name: string;
  values: ("int" | "float" | "string")[];
  doc: string;
}

const BLANK_ARGUMENT: TlapmArgument = { name: "", values: [], doc: " " };

// The option list of tlapm_args.ml's init.
const TLAPM_ARGUMENTS: TlapmArgument[] = [
  BLANK_ARGUMENT,
  { name: "(basic options)", values: [], doc: " " },
  BLANK_ARGUMENT,
  { name: "--help", values: [], doc: " show this help message and exit" },
  { name: "-help", values: [], doc: " (same as --help)" },
  { name: "--version", values: [], doc: " show version number and exit" },
  { name: "--verbose", values: [], doc: " produce verbose messages" },
  { name: "-v", values: [], doc: " (same as --verbose)" },
  BLANK_ARGUMENT,
  { name: "--where", values: [], doc: " show location of standard library and exit" },
  { name: "--config", values: [], doc: " show configuration and exit" },
  { name: "--summary", values: [], doc: " show summary of theorems (implies -N and not -C)" },
  {
    name: "--strict",
    values: [],
    doc: " report incomplete proofs, empty proof targets and failed obligations as errors and exit with a non-zero status",
  },
  { name: "--timing", values: [], doc: " show runtime statistics" },
  BLANK_ARGUMENT,
  { name: "-I", values: ["string"], doc: "<dir> add <dir> to search path" },
  { name: "-d", values: ["string"], doc: "" },
  BLANK_ARGUMENT,
  { name: "-k", values: [], doc: " keep going on backend failures" },
  { name: "-N", values: [], doc: " do not run any backend verifiers" },
  { name: "-C", values: [], doc: " check proofs in Isabelle/TLA+" },
  BLANK_ARGUMENT,
  { name: "--threads", values: ["int"], doc: "<int> set number of worker threads to <int>" },
  {
    name: "--method",
    values: ["string"],
    doc: "<meth> set default method to <meth> (try --method help)",
  },
  { name: "--solver", values: ["string"], doc: "<solver> set SMT solver to <solver>" },
  { name: "--smt-logic", values: ["string"], doc: "<logic> set SMT logic to <logic>" },
  { name: "--stretch", values: ["float"], doc: "<f> multiply all timeouts by <f>" },
  { name: "--fast-isabelle", values: [], doc: "" },
  BLANK_ARGUMENT,
  { name: "(advanced options)", values: [], doc: " " },
  BLANK_ARGUMENT,
  { name: "--noflatten", values: [], doc: " do not flatten obligations" },
  { name: "--nonormal", values: [], doc: " do not normalize obligations before printing" },
  { name: "--debug", values: ["string"], doc: "{[-]<flag>} enable/disable debugging flags" },
  { name: "--paranoid", values: [], doc: "" },
  { name: "--isaprove", values: [], doc: "" },
  BLANK_ARGUMENT,
  { name: "--toolbox", values: ["int", "int"], doc: "<int><int> toolbox mode" },
  {
    name: "--toolbox-vsn",
    values: ["int"],
    doc: "<int> Toolbox protocol version, 1|2, 1 by default.",
  },
  { name: "--line", values: ["int"], doc: "<int> line to prove" },
  {
    name: "--wait",
    values: ["int"],
    doc: "<time> wait for <time> before printing obligations in progress",
  },
  {
    name: "--stdin",
    values: [],
    doc: " read the tla file from stdin instead of file system. Only applies if single tla file is provided as input.",
  },
  {
    name: "--prefer-stdlib",
    values: [],
    doc: " prefer built-in standard modules if the module search path contains files with the same names as modules in stdlib.",
  },
  {
    name: "--parser",
    values: ["string"],
    doc: " Set parser backend to use: TLAPM (default) or SANY.",
  },
  {
    name: "--module-jar",
    values: ["string"],
    doc: " Add a path to a .jar file containing additional TLA+ modules, such\n        as the community modules. Multiple .jar files can be added by using\n        this option multiple times.",
  },
  { name: "--noproving", values: [], doc: " do not prove, report fingerprinted results only" },
  BLANK_ARGUMENT,
  { name: "--printallobs", values: [], doc: " print obligations in all toolbox messages" },
  BLANK_ARGUMENT,
  { name: "--fpdir", values: ["string"], doc: "" },
  { name: "--safefp", values: [], doc: " check tlapm, zenon, Isabelle versions for fingerprints" },
  {
    name: "--nofp",
    values: [],
    doc: " do not use existing fingerprints, but overwrite any preexisting fingerprints associated with the current proof obligations, using the newly computed fingerprints and results",
  },
  {
    name: "--nofpl",
    values: ["int", "int"],
    doc: "<int><int> disable fingerprint use between given lines",
  },
  { name: "--cleanfp", values: [], doc: " erase fingerprint file before starting" },
  BLANK_ARGUMENT,
  {
    name: "--erasefp",
    values: ["string", "string"],
    doc: "<f><back> erase from file <f> all results of backend <back>",
  },
  {
    name: "--printfp",
    values: ["string"],
    doc: "<f> print the fingerprints stored in file <f> and quit",
  },
  {
    name: "--usefp",
    values: ["string"],
    doc: "<f> load fingerprints from file <f> (save as usual)",
  },
  { name: "--fpp", values: [], doc: " print the fingerprints of obligations in toolbox messages" },
  {
    name: "--cache-dir",
    values: ["string"],
    doc: '<directory> save auxiliary and temporary files under <directory>. Alternatively, this directory can be defined via the variable `TLAPM_CACHE_DIR` of the runtime environment. The command-line parameter takes precedence over the environment variable. If neither is specified, the default value is ".tlacache".',
  },
];

const getMetavariableLength = (doc: string) => /^[^ ]* */.exec(doc)?.[0].length ?? 0;

// OCaml's Arg.align and Arg.usage_string.
const getArgumentUsage = () => {
  const width = Math.max(
    ...TLAPM_ARGUMENTS.map(
      (argument) => argument.name.length + getMetavariableLength(argument.doc),
    ),
  );
  return `Usage: tla-ts tlapm <options> FILE ...\noptions are:\n${TLAPM_ARGUMENTS.filter(
    (argument) => argument.doc !== "",
  )
    .map((argument) => {
      const cut = getMetavariableLength(argument.doc);
      return `  ${argument.name} ${argument.doc.slice(0, cut)}${" ".repeat(width - argument.name.length - cut)}${argument.doc.slice(cut)}\n`;
    })
    .join("")}`;
};

// OCaml's Arg.parse_argv: the first argument it rejects, with the Arg.Bad of tlapm_args.ml's setters.
const getArgumentError = (args: string[]) => {
  for (let index = 0; index < args.length; index++) {
    const name = args[index];
    if (name === "--version") return undefined;
    if (!name.startsWith("-")) continue;
    const argument = TLAPM_ARGUMENTS.find((innerArgument) => innerArgument.name === name);
    if (!argument) return `unknown option '${name}'`;
    for (const kind of argument.values) {
      index++;
      if (index === args.length) return `option '${name}' needs an argument`;
      const value = args[index];
      if (kind === "int" && parseOcamlInt(value) === undefined)
        return `wrong argument '${value}'; option '${name}' expects an integer`;
      if (kind === "float" && parseOcamlFloat(value) === undefined)
        return `wrong argument '${value}'; option '${name}' expects a float`;
    }
    const value = args[index];
    if (name === "--threads" && (parseOcamlInt(value) ?? 0) < 0)
      return "--threads requires a positive argument";
    if (name === "--debug" && value.split(",").includes("oldsmt"))
      return "--debug oldsmt: the old SMT encoding has been removed";
    if (name === "--method") {
      try {
        parseDefaultMethods(value);
      } catch (error) {
        if (!(error instanceof TlaProverError)) throw error;
        return error.message;
      }
    }
  }
  return undefined;
};

const getLibraryDirectories = (parsed: ParsedArgs) => [
  ".",
  ...getTlapmPaths()
    .map((path) => join(dirname(dirname(realpathSync(path))), "lib/tlapm/stdlib"))
    .filter(existsSync)
    .slice(0, 1),
  ...parsed.options.flatMap((option) => (option.name === "-I" ? option.values : [])).toReversed(),
];

const printToolboxMessage = (fields: string[]) =>
  console.error(`@!!BEGIN\n${fields.map((field) => `@!!${field}\n`).join("")}@!!END\n`);

const printObligationMessage = (obligation: PrintedObligation, status: string, fields: string[]) =>
  printToolboxMessage([
    "type:obligation",
    `id:${obligation.id}`,
    `loc:${obligation.location}`,
    `status:${status}`,
    ...fields,
  ]);

const quoteShellArgument = (arg: string) =>
  /^[+,\-./0-9:=@A-Z_a-z]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`;

const STRICT_EXIT_STATUS = { failed: 10, incomplete: 11, emptyTarget: 12 };

const checkStrictly = (module: ModuleObligations, isTargeted: boolean, isSummary: boolean) => {
  const summary = module.summary;
  if (!isSummary) {
    summary.absent.forEach((locus) => console.error(`Missing proof at ${getLocusText(locus)}`));
    summary.omitted.forEach((locus) => console.error(`Omitted proof at ${getLocusText(locus)}`));
  }
  const isIncomplete = summary.absent.length + summary.omitted.length > 0;
  if (isIncomplete) {
    console.error(
      `${getAtPrefix(module.location)}[ERROR]: Proof incomplete in module ${JSON.stringify(module.name)}: ${summary.absent.length} missing, ${summary.omitted.length} omitted proof step(s).`,
    );
  }
  const isEmpty = isTargeted && module.obligations.length === 0;
  if (isEmpty) {
    console.error(
      `${getAtPrefix(module.location)}[ERROR]: No proof obligation found for the selected target.`,
    );
  }
  return [
    ...(isIncomplete ? [STRICT_EXIT_STATUS.incomplete] : []),
    ...(isEmpty ? [STRICT_EXIT_STATUS.emptyTarget] : []),
  ];
};

const TLAPM_FAILURE_STATUS = 3;

const TLAPM_USAGE_STATUS = 2;

const UNPROVED_ENDING = [
  ' tlapm ending abnormally with Failure("backend errors: there are unproved obligations")',
  'Raised at Stdlib.failwith in file "stdlib.ml", line 29, characters 17-33',
  'Called from Tlapm_lib.process_module in file "src/tlapm_lib.ml", lines 492-493, characters 12-37',
  'Called from Tlapm_lib.main.f in file "src/tlapm_lib.ml", line 640, characters 23-43',
  'Called from Stdlib__List.fold_left in file "list.ml", line 125, characters 24-34',
  'Called from Tlapm_lib.main in file "src/tlapm_lib.ml", line 643, characters 13-40',
  'Called from Tlapm_lib.init in file "src/tlapm_lib.ml", line 659, characters 8-59',
  "",
].join("\n");

interface ErrorSetting {
  location?: string;
  message: string;
}

const reportAbnormalEnding = (
  error: TlaProofError,
  errorSetting: ErrorSetting,
  isToolbox: boolean,
) => {
  console.error(` tlapm ending abnormally with ${error.exception}\n`);
  if (isToolbox)
    printToolboxMessage(
      errorSetting.message === ""
        ? [
            "type:error",
            "url:http://tla.msr-inria.inria.fr/bugs",
            `msg:Oops, this seems to be a bug in TLAPM.\nPlease give feedback to developers.\n\n\n ${error.exception}\n`,
          ]
        : [
            "type:warning",
            `msg:${errorSetting.location === undefined ? "" : `${errorSetting.location}\n\n`}${errorSetting.message}`,
          ],
    );
};

type Outcome<Value> = { kind: "done"; value: Value } | { kind: "aborted"; error: TlaProofError };

const getAbortedOutcome = (error: unknown): Outcome<never> => {
  if (!(error instanceof TlaProofError)) throw error;
  return { kind: "aborted", error };
};

const generateObligations = (generate: () => ModuleObligations[]): Outcome<ModuleObligations[]> => {
  try {
    return { kind: "done", value: generate() };
  } catch (error) {
    return getAbortedOutcome(error);
  }
};

const printAttempt = (
  obligation: PrintedObligation,
  attempt: ProofAttempt,
  printing: PrinterOptions,
) => {
  const timeLimitMs = attempt.method.timeLimitMs;
  const used =
    attempt.kind !== "decided"
      ? ""
      : `; time-used: ${(attempt.timeUsedMs / 1000).toFixed(1)} (${Math.round((100 * attempt.timeUsedMs) / timeLimitMs)}%)`;
  const times =
    timeLimitMs === 0
      ? ""
      : `time-limit: ${timeLimitMs === Infinity ? "inf" : Number((timeLimitMs / 1000).toPrecision(6))}${used}`;
  const method = [attempt.method.tactic, times].filter(Boolean).join("; ");
  const reason = getFailureReason(attempt);
  const isProved = isProvedAttempt(attempt);
  const isReused = attempt.kind === "reused";
  const note =
    attempt.kind === "decided"
      ? attempt.note
      : attempt.kind === "refused"
        ? `${attempt.reason}\nObligation:\n\n`
        : attempt.kind === "unavailable"
          ? `\n\\* ${attempt.warning}\n`
          : undefined;
  const shipped = attempt.kind === "unavailable" || isReused ? attempt.shipped : undefined;
  printObligationMessage(obligation, isProved ? "proved" : "failed", [
    `prover:${attempt.method.prover}`,
    ...(method === "" ? [] : [`meth:${method}`]),
    ...(reason === undefined ? [] : [`reason:${reason}`]),
    `already:${isReused}`,
    ...(isProved
      ? []
      : [
          `obl:${isReused ? "" : (note ?? "\n")}${shipped ?? formatNormalized(obligation, attempt, { ...printing, isTemporal: attempt.method.prover === "ls4" })}`,
        ]),
  ]);
};

const printWarning = (warning: ObligationWarning, isToolbox: boolean) => {
  if (warning.channel === "stdout") return console.log(warning.text);
  const isToolboxMessage = warning.channel === "toolbox" || warning.channel === "toolboxOnly";
  if (isToolbox && isToolboxMessage)
    return printToolboxMessage(["type:warning", `msg:${warning.text}`]);
  if (warning.channel !== "toolboxOnly") console.error(warning.text);
};

const printFailedObligation = (obligation: PrintedObligation, reason: string) =>
  printObligationMessage(obligation, "failed", [
    "prover:fail",
    "meth:time-limit: inf",
    `reason:${reason}`,
    "already:false",
    `obl:${obligation.text}`,
  ]);

interface ProvingSettings {
  isToolbox: boolean;
  isProving: boolean;
  workers: number;
  isFingerprinted: (obligation: PrintedObligation) => boolean;
  fingerprints: FingerprintTable;
  backends: BackendSettings;
  printing: PrinterOptions;
  isKeepingFiles: boolean;
  solver: string | undefined;
}

const SMT_PROOF_MARKERS = [/^unsat/m, /SPASS beiseite: Proof found/, /SZS status Theorem/];

const solveWith = (
  command: string,
  path: string,
  text: string,
  timeLimitMs: number,
  isKeepingFiles: boolean,
): Decision => {
  const outputPath = `${path}.out`;
  writeFileSync(path, text);
  const start = performance.now();
  spawnSync(
    "sh",
    ["-c", `file=${quoteShellArgument(path)}; ${command} >${quoteShellArgument(outputPath)}`],
    {
      stdio: ["ignore", "inherit", "inherit"],
      timeout: Number.isFinite(timeLimitMs) ? timeLimitMs : undefined,
    },
  );
  const timeUsedMs = performance.now() - start;
  const output = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";
  if (!isKeepingFiles) [path, outputPath].forEach((file) => rmSync(file, { force: true }));
  const isProved = SMT_PROOF_MARKERS.some((marker) => marker.test(output));
  return {
    verdict: isProved ? "unsat" : output.startsWith("sat") ? "sat" : "unknown",
    output,
    timeUsedMs,
  };
};

const proveModule = async (
  module: ModuleObligations,
  directory: string,
  fingerprintsPath: string,
  settings: ProvingSettings,
) => {
  const knownResults = getKnownResults(settings.fingerprints);
  const solver = settings.solver;
  const reports = await proveObligations(module.obligations, {
    ...settings.backends,
    workers: settings.workers,
    results: knownResults.results,
    isFingerprinted: settings.isFingerprinted,
    isProving: settings.isProving,
    ...(settings.isKeepingFiles && {
      onInput: (file: string, text: string) => writeFileSync(`${directory}/${file}`, text),
    }),
    ...(solver !== undefined && {
      solveSmt: async (file: string, text: string, timeLimitMs: number) =>
        solveWith(solver, `${directory}/${file}`, text, timeLimitMs, settings.isKeepingFiles),
    }),
    onReport: (report, obligation) => {
      report.attempts.forEach((attempt) => {
        if (attempt.kind === "decided" && attempt.errorOutput !== undefined)
          process.stdout.write(attempt.errorOutput);
        if (attempt.kind === "unavailable") process.stderr.write(`${attempt.warning}\n`);
      });
      report.warnings.forEach((warning) => printWarning(warning, settings.isToolbox));
      if (!settings.isToolbox) return;
      if (obligation.kind.kind === "Error") return printFailedObligation(obligation, "user error");
      report.attempts.forEach((attempt) => printAttempt(obligation, attempt, settings.printing));
      if (report.obligation.status === "trivial")
        printObligationMessage(obligation, "trivial", ["prover:tlapm", "already:false"]);
    },
  });
  const theoryPath = `${directory}/${module.name}.thy`;
  writeFileSync(
    theoryPath,
    encodeProofTheory(module.name, reports, module.obligations, settings.backends.isFlattened),
  );
  console.log(`(* created new ${JSON.stringify(theoryPath)} *)`);
  knownResults.save(fingerprintsPath);
  console.log(`(* fingerprints written in ${JSON.stringify(fingerprintsPath)} *)`);
  if (!settings.isProving) return false;
  const unproved = reports.flatMap((report, index) =>
    "reason" in report.obligation ? [{ report, obligation: module.obligations[index] }] : [],
  );
  if (settings.isToolbox) {
    unproved
      .filter(
        (entry) => entry.report.attempts.length === 0 && entry.obligation.kind.kind !== "Error",
      )
      .forEach((entry) => printFailedObligation(entry.obligation, "unexpected error"));
  }
  unproved
    .toReversed()
    .forEach((entry) =>
      console.error(
        `${getAtPrefix(entry.obligation.locus)}${renderDoc(format("[ERROR]: @[<v2>Could not prove or check:@,%a@]", printSequent(entry.obligation.sequent, settings.printing)), 35)}`,
      ),
    );
  const total = `${module.obligations.length} obligation${module.obligations.length > 1 ? "s" : ""}`;
  console.error(
    unproved.length === 0
      ? `${getAtPrefix(module.location)}[INFO]: All ${total} proved.`
      : `${getAtPrefix(module.location)}[ERROR]: ${unproved.length}/${total} failed.\nThere were backend errors processing module \`${JSON.stringify(module.name)}\`.`,
  );
  return unproved.length > 0;
};

const REWRITE_FLAGS = ["rwsetext", "rw", "rw+"];

const DEBUG_FLAGS = new Set([
  "tempfiles",
  "hidden",
  "alldefs",
  "rw+",
  "rw",
  "rwsetext",
  "disable_arithmetic",
  "no_smt_set_extensionality",
  "smarter_types",
]);

export const runTlapm = async (args: string[]) => {
  const parsed = TLAPM_COMMAND.parse(args);
  const isProcessing = !parsed.has("-N") && !parsed.has("--summary");
  const debugFlags = parsed.options
    .flatMap((option) =>
      option.name === "--debug" ? option.values.flatMap((value) => value.split(",")) : [],
    )
    .reduce(
      (flags, flag) =>
        flag.startsWith("-")
          ? new Set([...flags].filter((innerFlag) => innerFlag !== flag.slice(1)))
          : new Set([...flags, flag]),
      new Set<string>(),
    );
  const printing = {
    isShowingHidden: debugFlags.has("hidden"),
    isShowingAllDefinitions: debugFlags.has("alldefs"),
  };
  const rewriteFlags = REWRITE_FLAGS.filter((flag) => debugFlags.has(flag));
  const isTyped = debugFlags.has("smarter_types") && !debugFlags.has("disable_arithmetic");
  // tla-ts rewrites sets before it types expressions, though tlapm types them first.
  const unsupportedFlag =
    isTyped && rewriteFlags.length > 0
      ? `smarter_types with --debug ${rewriteFlags.at(-1)}`
      : [...debugFlags].find((flag) => !DEBUG_FLAGS.has(flag));
  const argumentError = getArgumentError(args);
  if (argumentError !== undefined) {
    console.error(`tla-ts tlapm: ${argumentError}.\n${getArgumentUsage()}`);
    return TLAPM_USAGE_STATUS;
  }
  if (parsed.has("--version")) {
    console.log(TLAPM_VERSION);
    return EXIT_STATUS.success;
  }
  const unsupported =
    parsed.unknown[0] ??
    (isProcessing && parsed.has("--printallobs") ? "--printallobs" : undefined) ??
    (unsupportedFlag === undefined ? undefined : `--debug ${unsupportedFlag}`);
  if (unsupported !== undefined) {
    console.error(`Error: tla-ts tlapm does not support the tlapm option ${unsupported}.`);
    return 1;
  }
  const files = getInputPaths(parsed.positionals).map((input) => input.path);
  const modulePaths = files.map((path) => (path.endsWith(".tla") ? path : `${path}.tla`));
  if (modulePaths.length === 0) {
    console.error(USAGE);
    return 1;
  }
  const isToolbox = parsed.has("--toolbox") || parsed.has("--line");
  if (isToolbox) {
    console.log(
      `\n\\* TLAPM version ${TLAPM_VERSION}\n\\* launched at ${formatTlcDate(new Date())} with command line:\n\\* ${["tla-ts", "tlapm", ...args].map(quoteShellArgument).join(" ")}\n`,
    );
  }
  const lines = parsed.options.reduce<LineRange>((range, option) => {
    const [start, end] = option.values.map((value) => parseOcamlInt(value) ?? 0);
    if (option.name === "--toolbox") return { start, end: end === 0 ? Infinity : end };
    if (option.name === "--line") return start === 0 ? WHOLE_MODULE : { start, end: start };
    return range;
  }, WHOLE_MODULE);
  const directories = modulePaths.reduce(
    (found, path) => (found.includes(dirname(path)) ? found : [dirname(path), ...found]),
    getLibraryDirectories(parsed),
  );
  const moduleNames = new Set<string>();
  const errorSettings: ObligationWarning[] = [];
  const generation = generateObligations(() => {
    const missingIndex = modulePaths.findIndex((path) => !existsSync(path));
    if (missingIndex !== -1) {
      const missing = files[missingIndex];
      console.error(`File "<unknown>":\nError: File ${JSON.stringify(missing)} not found`);
      throw new TlaProofError(`File ${missing} not found`, { failure: "Module.Parser.parse_file" });
    }
    return getObligations(
      modulePaths.map((path) => ({ file: `./${path}`, source: readFileSync(path, "utf8") })),
      (name) => {
        moduleNames.add(name);
        const file = directories.map((directory) => `${directory}/${name}.tla`).find(existsSync);
        if (file !== undefined) return { file, source: readFileSync(file, "utf8") };
        const source = TLAPM_LIBRARY.get(name);
        return source === undefined ? undefined : { file: `${name}.tla`, source };
      },
      {
        lines,
        printing,
        onWarning: (warning) => {
          if (warning.channel === "error") errorSettings.push(warning);
          else printWarning(warning, isToolbox);
        },
      },
    );
  });
  if (generation.kind === "aborted") {
    const lastLocus = errorSettings.at(-1)?.locus;
    // Errors.set keeps the last location and puts each message before the earlier ones.
    reportAbnormalEnding(
      generation.error,
      {
        location: lastLocus && getLocusText(lastLocus),
        message: errorSettings
          .toReversed()
          .map((setting) => `${setting.text}\n\n`)
          .join(""),
      },
      isToolbox,
    );
    return TLAPM_FAILURE_STATUS;
  }
  const modules = generation.value;
  const cacheDirectory =
    parsed.get("--cache-dir")?.[0] ?? process.env.TLAPM_CACHE_DIR ?? ".tlacache";
  const forgottenLines = parsed.get("--nofpl")?.map((value) => parseOcamlInt(value) ?? 0) ?? [0, 0];
  const methods = parsed.get("--method")?.[0];
  const settings: ProvingSettings = {
    isToolbox,
    isProving: !parsed.has("--noproving"),
    workers: Math.max(
      1,
      parseOcamlInt(parsed.get("--threads")?.[0] ?? "") ?? availableParallelism(),
    ),
    isFingerprinted: (obligation) =>
      !parsed.has("--nofp") &&
      !(
        obligation.locus &&
        obligation.locus.startLine >= forgottenLines[0] &&
        obligation.locus.endLine <= forgottenLines[1]
      ),
    fingerprints: new Map(),
    backends: {
      defaultMethods: methods === undefined ? undefined : parseDefaultMethods(methods),
      stretch: parseOcamlFloat(parsed.get("--stretch")?.[0] ?? "1") ?? 1,
      isFlattened:
        !parsed.has("--noflatten") &&
        ["yes", "true", undefined].includes(process.env.TLAPM_FLATTEN),
      smtLogic: debugFlags.has("disable_arithmetic")
        ? "UF"
        : (parsed.get("--smt-logic")?.[0] ?? "UFNIA"),
      smtEncoding: {
        isArithmetic: !debugFlags.has("disable_arithmetic"),
        rewriteLevel: REWRITE_FLAGS.findLastIndex((flag) => debugFlags.has(flag)) + 1,
        isSetExtensional: !debugFlags.has("no_smt_set_extensionality"),
        isTyped,
      },
    },
    printing,
    isKeepingFiles: debugFlags.has("tempfiles"),
    solver: parsed.get("--solver")?.[0] ?? process.env.TLAPM_SMT_SOLVER,
  };
  const statuses: number[] = [];
  for (const [index, module] of modules.entries()) {
    const directory = `${cacheDirectory}/${module.name}.tlaps`;
    const fingerprintsPath = `${directory}/fingerprints`;
    const loadedPath = parsed.get("--usefp")?.[0] ?? fingerprintsPath;
    mkdirSync(directory, { recursive: true });
    if (parsed.has("--cleanfp") && existsSync(fingerprintsPath)) {
      rmSync(fingerprintsPath);
      console.log(`(* fingerprints file ${JSON.stringify(fingerprintsPath)} removed *)`);
    }
    if (!parsed.has("--cleanfp") && existsSync(loadedPath) && module.summary.total !== 0) {
      console.log(
        parsed.has("--nofp")
          ? `(* will not use fingerprints (because of option \`--nofp\`), but will now load fingerprints from the file \`${loadedPath}\`, in order to overwrite with the new fingerprints, and then save the results at the end. *)`
          : `(* loading fingerprints in ${JSON.stringify(loadedPath)} *)`,
      );
      loadFingerprints(settings.fingerprints, loadedPath, parsed.has("--safefp"));
    }
    if (parsed.has("--summary")) console.log(formatSummary(module));
    if (isToolbox) {
      module.obligations.forEach((obligation) =>
        printObligationMessage(
          obligation,
          "to be proved",
          parsed.has("--printallobs") ? [`obl:${obligation.text}`] : [],
        ),
      );
      printToolboxMessage(["type:obligationsnumber", `count:${module.obligations.length}`]);
    }
    if (parsed.has("--strict"))
      statuses.push(
        ...checkStrictly(module, lines.start > 0 || lines.end < Infinity, parsed.has("--summary")),
      );
    if (!isProcessing) continue;
    saveHistory(
      fingerprintsPath,
      [...moduleNames, ...modules.slice(0, index + 1).map((innerModule) => innerModule.name)].map(
        (name) => `${name}.tla`,
      ),
    );
    const proving = await proveModule(module, directory, fingerprintsPath, settings).then(
      (isFailed): Outcome<boolean> => ({ kind: "done", value: isFailed }),
      getAbortedOutcome,
    );
    if (proving.kind === "aborted") {
      const error = proving.error;
      console.error(`${getAtPrefix(error.locus)}Error: ${error.message}`);
      reportAbnormalEnding(
        error,
        { location: error.locus && getLocusText(error.locus), message: error.message },
        isToolbox,
      );
      return TLAPM_FAILURE_STATUS;
    }
    if (proving.value && parsed.has("--strict")) statuses.push(STRICT_EXIT_STATUS.failed);
    if (proving.value && !parsed.has("--strict") && !isToolbox) {
      console.error(UNPROVED_ENDING);
      return TLAPM_FAILURE_STATUS;
    }
  }
  return (
    Object.values(STRICT_EXIT_STATUS).find((status) => statuses.includes(status)) ??
    EXIT_STATUS.success
  );
};
