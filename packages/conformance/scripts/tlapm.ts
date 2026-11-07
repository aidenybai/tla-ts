import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");

export const TLAPM_DIRECTORY = join(PACKAGE_DIRECTORY, ".oracles/tlapm");
export const TLAPM_BINARY = join(TLAPM_DIRECTORY, "bin/tlapm");
export const TLAPM_BACKENDS = join(TLAPM_DIRECTORY, "lib/tlapm/backends/bin");
const ISABELLE_DIRECTORY = join(TLAPM_DIRECTORY, "lib/tlapm/backends/Isabelle-install");

// What a test declares tlapm does, by its exit status under --strict (src/params.ml#exit_status).
// tlapm exits 3 when it ends abnormally, which covers every parse, semantic and level error.
export const TLAPM_OUTCOME_EXITS = {
  any: [0, 3, 10, 11, 12],
  proved: [0],
  failed: [10],
  incomplete: [11],
  "empty-target": [12],
  rejected: [3],
};

// A backend test declares the verdict its backend reaches.
export const BACKEND_VERDICTS = ["unsat", "sat", "unknown"];

// obligations: the obligations tlapm generates, without proving them.
// proof: each obligation's final status and the backend that closed it.
// encoding: the proof, plus the input tlapm writes for each backend.
export const TLAPM_MODES = ["obligations", "proof", "encoding"];

const MODE_ARGUMENTS: Record<string, string[]> = {
  obligations: ["-N", "--printallobs"],
  proof: [],
  encoding: ["--debug", "tempfiles"],
};

// One thread makes the order of backend calls, and so of their temporary files, deterministic.
export const getTlapmArguments = (mode: string, cacheDirectory: string) => [
  "--strict",
  "--toolbox",
  "0",
  "0",
  "--threads",
  "1",
  "--cache-dir",
  cacheDirectory,
  ...MODE_ARGUMENTS[mode],
];

// The backend a test file feeds, by the extension of the temporary file tlapm writes for it.
export const BACKEND_EXTENSIONS: Record<string, string> = {
  ".smt": "z3",
  ".smt2": "z3",
  ".znn": "zenon",
  ".thy": "isabelle",
  ".ls4": "ls4",
};

export const getBackend = (path: string) => BACKEND_EXTENSIONS[extname(path)];

// A .smt2 test is one of z3test's regressions, a whole SMT-LIB script. It runs the way z3test runs
// it (scripts/util.py#test_benchmark), and its recording is everything Z3 prints.
export const isSmtScript = (path: string) => extname(path) === ".smt2";

const quoteShell = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

// Isabelle's ML_Syntax.print_string_bytes, as src/params.ml#ml_string_bytes ports it.
const quoteMl = (text: string) =>
  `"${[...text]
    .map((character) => {
      const code = character.charCodeAt(0);
      if (character === '"') return '\\"';
      if (character === "\\") return "\\\\";
      if (character === "\t") return "\\t";
      if (character === "\n") return "\\n";
      if (code < 32) return `\\^${String.fromCharCode(code + 64)}`;
      return code < 127 ? character : `\\${String(code).padStart(3, "0")}`;
    })
    .join("")}"`;

// tlapm's command line for each backend (src/params.ml).
export const getBackendOracleCommand = (backend: string, file: string) => {
  if (isSmtScript(file)) return [join(TLAPM_BACKENDS, "z3"), "model_validate=true", file];
  if (backend === "z3")
    return [
      join(TLAPM_BACKENDS, "z3"),
      "-smt2",
      "-v:0",
      "AUTO_CONFIG=false",
      "smt.MBQI=true",
      file,
    ];
  if (backend === "zenon")
    return [join(TLAPM_BACKENDS, "zenon"), "-p0", "-x", "tla", "-oisar", "-max-time", "1d", file];
  if (backend === "ls4")
    return [
      "sh",
      "-c",
      `${quoteShell(join(TLAPM_BACKENDS, "ptl_to_trp"))} -i ${quoteShell(file)} | ${quoteShell(join(TLAPM_BACKENDS, "ls4"))}`,
    ];
  const heaps = ["Pure", "TLA+", "Options"]
    .map((heap) => quoteMl(join(ISABELLE_DIRECTORY, "heaps", heap)))
    .join(", ");
  const theory = quoteMl(file.replace(/\.thy$/, ""));
  return [
    "sh",
    "-c",
    `export ISABELLE_HOME=${quoteShell(ISABELLE_DIRECTORY)}; export ML_HOME=${quoteShell(join(ISABELLE_DIRECTORY, "poly"))}; ${quoteShell(join(ISABELLE_DIRECTORY, "poly", "poly"))} --eval ${quoteShell(`PolyML.SaveState.loadHierarchy [${heaps}]`)} --eval ${quoteShell(`(use_thy ${theory}; writeln "((TLAPS SUCCESS))")`)} </dev/null`,
  ];
};

// Reduces a backend's output to its verdict, the way tlapm reads it (src/backend/*.ml). Zenon's
// proof follows, because tlapm hands it to Isabelle.
export const getBackendVerdict = (backend: string, output: string, exit: number) => {
  if (backend === "z3") {
    const answer = output.split("\n").find((line) => BACKEND_VERDICTS.includes(line.trim()));
    return answer?.trim() ?? "unknown";
  }
  if (backend === "zenon") {
    const proof = /\(\* BEGIN-PROOF \*\)\n([\s\S]*?)\(\* END-PROOF \*\)/.exec(output);
    return exit === 0 && proof ? `unsat\n${proof[1].trimEnd()}` : "unknown";
  }
  if (backend === "ls4") {
    if (/^UNSAT/m.test(output)) return "unsat";
    return /^SAT/m.test(output) ? "sat" : "unknown";
  }
  return output.includes("((TLAPS SUCCESS))") ? "unsat" : "unknown";
};

const TEMPORARY_NAME = /\btlapm_[0-9a-f]{6}\b/g;
const TIME_USED = /; time-used: [\d.]+ \(\d+%\)/g;
// When tlapm crashes, it prints an OCaml backtrace, whose line numbers depend on the OCaml that built
// it, then its configuration, which holds machine paths (src/tlapm_lib.ml#main).
const BACKTRACE_LINE =
  /^(Raised at|Raised by primitive operation at|Called from|Re-raised at) .*\n/gm;
// Isabelle's theory keeps each proof Zenon found, after the command line that ran Zenon, which names
// temporary files and holds PATH (src/backend/prep.ml#zenon_prove).
const ZENON_COMMAND = /(\(\* BEGIN ZENON INPUT\n);; .*\n/g;
// A backend that isn't installed is reported with the whole PATH (src/params.ml#get_exec).
const MISSING_EXECUTABLE = /(not found in this PATH:\n).*\n/g;
// tlapm looks for a backend with `type <name>` in sh (src/params.ml#get_exec). bash, macOS's sh,
// reports the failure on stderr, and dash, Ubuntu's, on stdout, which tlapm discards. The line
// after it reports the same failure.
const SHELL_NOT_FOUND = /^sh: .*type: \S+: not found\n/gm;
const CONFIG_DUMP = /^version == ".*"\n((?!@!!).*\S.*\n)*/gm;

interface ToolboxMessage {
  fields: Map<string, string>;
}

// tlapm frames each toolbox message in @!!BEGIN and @!!END, one @!!key:value per line. A value
// runs until the next field, so an obligation's text spans several lines.
const parseToolboxMessage = (block: string): ToolboxMessage => {
  const fields = new Map<string, string>();
  const state = { key: "" };
  block.split("\n").forEach((line) => {
    const field = /^@!!([a-z]+):(.*)$/.exec(line);
    if (field) {
      state.key = field[1];
      fields.set(field[1], field[2]);
      return;
    }
    if (state.key) fields.set(state.key, `${fields.get(state.key)}\n${line}`);
  });
  fields.forEach((value, key) => fields.set(key, value.trimEnd()));
  return { fields };
};

const formatToolboxMessage = (message: ToolboxMessage) =>
  [...message.fields.entries()].map((entry) => `@${entry[0]}: ${entry[1]}`).join("\n");

// Keeps what a proof run decides, and drops what changes between runs: the version banner, times,
// paths and the names of temporary files. Obligation messages arrive in the order their backends
// finish, so each obligation keeps its first message and its last, in order of id.
export const normalizeTlapmTranscript = (output: string, directory: string) => {
  const text = output
    .replaceAll(`/private${directory}`, "")
    .replaceAll(directory, "")
    .replace(TEMPORARY_NAME, "tlapm_<id>")
    .replace(TIME_USED, "")
    .replace(SHELL_NOT_FOUND, "")
    .replace(BACKTRACE_LINE, "")
    .replace(CONFIG_DUMP, "")
    .replace(MISSING_EXECUTABLE, "$1<PATH>\n");
  const messages: ToolboxMessage[] = [];
  const lines: string[] = [];
  const remainder = text.replace(/@!!BEGIN\n([\s\S]*?)@!!END\n?/g, (_, block: string) => {
    messages.push(parseToolboxMessage(block));
    return "\u0000";
  });
  remainder.split("\n").forEach((line) => {
    if (
      line.startsWith("\\* ") ||
      line.startsWith("(* created new") ||
      line.startsWith("(* fingerprints written")
    )
      return;
    lines.push(line.replaceAll("\u0000", ""));
  });
  const obligations = new Map<number, ToolboxMessage[]>();
  const others: ToolboxMessage[] = [];
  messages.forEach((message) => {
    const id = message.fields.get("id");
    if (message.fields.get("type") !== "obligation" || id === undefined) {
      others.push(message);
      return;
    }
    obligations.set(Number(id), [...(obligations.get(Number(id)) ?? []), message]);
  });
  const obligationText = [...obligations.entries()]
    .sort((left, right) => left[0] - right[0])
    .flatMap((entry) => {
      const first = entry[1][0];
      const last = entry[1].at(-1) ?? first;
      return first === last ? [first] : [first, last];
    })
    .map(formatToolboxMessage);
  const log = lines.filter((line) => line.trim() !== "").join("\n");
  return [...obligationText, ...others.map(formatToolboxMessage), ...(log ? [log] : [])].join(
    "\n\n",
  );
};

// The status of each obligation, the coarse part of a transcript that a verdict compares first.
export const getTlapmStatuses = (transcript: string) =>
  transcript
    .split("\n")
    .filter((line) => /^@(status|prover|type|count): /.test(line))
    .join("\n");

// The inputs tlapm wrote for its backends under --debug tempfiles. Their names are random, so they
// are ordered by backend, then by content.
export const getEncodings = (cacheDirectory: string, moduleName: string) => {
  const directory = join(cacheDirectory, `${moduleName}.tlaps`);
  const files = readdirSync(directory).filter((name) => getBackend(name) !== undefined);
  return files
    .map((name) => ({
      backend: getBackend(name),
      text: readFileSync(join(directory, name), "utf8")
        .replace(TEMPORARY_NAME, "tlapm_<id>")
        .replace(ZENON_COMMAND, "$1;; <zenon command>\n")
        .trimEnd(),
    }))
    .sort((left, right) =>
      left.backend === right.backend
        ? left.text.localeCompare(right.text)
        : left.backend.localeCompare(right.backend),
    )
    .map((encoding) => `--- ${encoding.backend}\n${encoding.text}`)
    .join("\n\n");
};
