import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { availableParallelism } from "node:os";
import { TlaProofError } from "../errors";
import { EXIT_STATUS } from "../exit-codes";
import type { LineRange } from "../obligations/generate";
import { getAtPrefix, getLocusText } from "../obligations/expression";
import {
  formatSummary,
  getObligations,
  WHOLE_MODULE,
  type ModuleObligations,
  type PrintedObligation,
} from "../obligations";
import { format, renderDoc } from "../obligations/format";
import { printSequent } from "../obligations/printer";
import {
  encodeProofTheory,
  formatNormalized,
  proveObligations,
  type ProofAttempt,
} from "../prover/prove";
import { TLAPS_MODULE } from "../prover/tlaps-module";
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

const TLAPM_INTEGER_OPTIONS = new Set(["--toolbox", "--line", "--threads", "--nofpl"]);

// tlapm searches the current directory, then its standard library at lib/tlapm/stdlib beside
// bin/tlapm, then each -I directory, the last given first.
const getLibraryDirectories = (parsed: ParsedArgs) => [
  ".",
  ...getTlapmPaths()
    .map((path) => join(dirname(dirname(realpathSync(path))), "lib/tlapm/stdlib"))
    .filter((path) => existsSync(path))
    .slice(0, 1),
  ...parsed.options.flatMap((option) => (option.name === "-I" ? option.values : [])).toReversed(),
];

// A message of tlapm's toolbox protocol, which it writes to stderr.
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

const TLAPM_VERSION = "9ed0376";

const quoteShellArgument = (arg: string) =>
  /^[+,\-./0-9:=@A-Z_a-z]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`;

// The most severe first.
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

const generateObligations = (generate: () => ModuleObligations[]) => {
  try {
    return generate();
  } catch (error) {
    if (!(error instanceof TlaProofError)) throw error;
    console.error(` tlapm ending abnormally with ${error.exception}\n`);
    return undefined;
  }
};

// Toolbox.print_res_aux.
const printAttempt = (obligation: PrintedObligation, attempt: ProofAttempt) => {
  const timeLimitMs = attempt.method.timeLimitMs;
  const used =
    attempt.timeUsedMs === undefined
      ? ""
      : `; time-used: ${(attempt.timeUsedMs / 1000).toFixed(1)} (${Math.round((100 * attempt.timeUsedMs) / timeLimitMs)}%)`;
  const times =
    timeLimitMs === 0
      ? ""
      : `time-limit: ${timeLimitMs === Infinity ? "inf" : Number((timeLimitMs / 1000).toPrecision(6))}${used}`;
  const method = [attempt.method.tactic, times].filter(Boolean).join("; ");
  const isSmt = attempt.method.prover === "smt" || attempt.method.prover === "z3";
  const note =
    isSmt && attempt.reason === "false" && attempt.verdict
      ? `(* SMT failed with status = ${attempt.verdict}\n *)\n`
      : "";
  printObligationMessage(obligation, attempt.isProved ? "proved" : "failed", [
    `prover:${attempt.method.prover}`,
    ...(method === "" ? [] : [`meth:${method}`]),
    ...(attempt.reason === undefined ? [] : [`reason:${attempt.reason}`]),
    `already:${attempt.isReused}`,
    ...(attempt.isProved
      ? []
      : [
          `obl:${attempt.isReused ? "" : `\n${note}`}${formatNormalized(obligation, attempt.isReused)}`,
        ]),
  ]);
};

// Method.Fail, for an error obligation or one no method was tried on.
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
}

// Tlapm_lib.process_obs. Returns whether some obligation failed.
const proveModule = async (
  module: ModuleObligations,
  theoryPath: string,
  fingerprintsPath: string,
  settings: ProvingSettings,
) => {
  const knownResults = getKnownResults(settings.fingerprints);
  const reports = await proveObligations(module.obligations, {
    workers: settings.workers,
    results: knownResults.results,
    isFingerprinted: settings.isFingerprinted,
    isProving: settings.isProving,
    onReport: (report, obligation) => {
      if (!settings.isToolbox) return;
      if (report.obligation.status === "trivial")
        return printObligationMessage(obligation, "trivial", ["prover:tlapm", "already:false"]);
      if (obligation.kind.kind === "Error") return printFailedObligation(obligation, "user error");
      report.attempts.forEach((attempt) => printAttempt(obligation, attempt));
    },
  });
  writeFileSync(theoryPath, encodeProofTheory(module.name, reports, module.obligations));
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
        `${getAtPrefix(entry.obligation.locus)}${renderDoc(format("[ERROR]: @[<v2>Could not prove or check:@,%a@]", printSequent(entry.obligation.sequent)), 35)}`,
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

export const runTlapm = async (args: string[]) => {
  const parsed = TLAPM_COMMAND.parse(args);
  const isProcessing = !parsed.has("-N") && !parsed.has("--summary");
  const unsupported =
    parsed.unknown[0] ??
    (isProcessing && parsed.has("--printallobs") ? "--printallobs" : undefined);
  if (unsupported !== undefined) {
    console.error(`Error: tla-ts tlapm does not support the tlapm option ${unsupported}.`);
    return 1;
  }
  if (parsed.incomplete) {
    console.error(`Error: option '${parsed.incomplete.name}' needs an argument.`);
    return 1;
  }
  const nonInteger = parsed.options.find(
    (option) =>
      TLAPM_INTEGER_OPTIONS.has(option.name) &&
      option.values.some((value) => !/^-?\d+$/.test(value)),
  );
  if (nonInteger) {
    console.error(`Error: option '${nonInteger.name}' expects an integer.`);
    return 1;
  }
  if (parsed.has("--version")) {
    console.log(TLAPM_VERSION);
    return EXIT_STATUS.success;
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
  // Like tlapm, the last of --toolbox and --line wins, and a 0 means the whole module.
  const lines = parsed.options.reduce<LineRange>((range, option) => {
    const [start, end] = option.values.map(Number);
    if (option.name === "--toolbox") return { start, end: end === 0 ? Infinity : end };
    if (option.name === "--line") return start === 0 ? WHOLE_MODULE : { start, end: start };
    return range;
  }, WHOLE_MODULE);
  // tlapm also searches each module's directory. Without tlapm, TLAPS is tla-ts's copy.
  const directories = modulePaths.reduce(
    (found, path) => (found.includes(dirname(path)) ? found : [dirname(path), ...found]),
    getLibraryDirectories(parsed),
  );
  const moduleNames = new Set<string>();
  const modules = generateObligations(() => {
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
        // tlapm names a file by joining its search directory and the name, as in ./Module.tla.
        const file = directories
          .map((directory) => `${directory}/${name}.tla`)
          .find((path) => existsSync(path));
        if (file !== undefined) return { file, source: readFileSync(file, "utf8") };
        return name === "TLAPS" ? { file: "TLAPS.tla", source: TLAPS_MODULE } : undefined;
      },
      {
        lines,
        onWarning: (warning) => {
          if (warning.channel === "stdout") return console.log(warning.text);
          const isToolboxMessage =
            warning.channel === "toolbox" || warning.channel === "toolboxOnly";
          if (isToolbox && isToolboxMessage)
            return printToolboxMessage(["type:warning", `msg:${warning.text}`]);
          if (warning.channel !== "toolboxOnly") console.error(warning.text);
        },
      },
    );
  });
  if (!modules) return TLAPM_FAILURE_STATUS;
  const cacheDirectory =
    parsed.get("--cache-dir")?.[0] ?? process.env.TLAPM_CACHE_DIR ?? ".tlacache";
  const forgottenLines = parsed.get("--nofpl")?.map(Number) ?? [0, 0];
  const settings: ProvingSettings = {
    isToolbox,
    isProving: !parsed.has("--noproving"),
    workers: Math.max(1, Number(parsed.get("--threads")?.[0] ?? availableParallelism())),
    isFingerprinted: (obligation) =>
      !parsed.has("--nofp") &&
      !(
        obligation.locus &&
        obligation.locus.startLine >= forgottenLines[0] &&
        obligation.locus.endLine <= forgottenLines[1]
      ),
    fingerprints: new Map(),
  };
  const statuses: number[] = [];
  for (const [index, module] of modules.entries()) {
    // Tlapm_lib.mkdir_tlaps.
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
    // tlapm's history holds the source of each module read so far.
    saveHistory(
      fingerprintsPath,
      [...moduleNames, ...modules.slice(0, index + 1).map((innerModule) => innerModule.name)].map(
        (name) => `${name}.tla`,
      ),
    );
    const isFailed = await proveModule(
      module,
      `${directory}/${module.name}.thy`,
      fingerprintsPath,
      settings,
    );
    if (isFailed && parsed.has("--strict")) statuses.push(STRICT_EXIT_STATUS.failed);
    if (isFailed && !parsed.has("--strict") && !isToolbox) {
      console.error(UNPROVED_ENDING);
      return TLAPM_FAILURE_STATUS;
    }
  }
  return (
    Object.values(STRICT_EXIT_STATUS).find((status) => statuses.includes(status)) ??
    EXIT_STATUS.success
  );
};
