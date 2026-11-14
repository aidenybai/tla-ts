import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");

export const TLAPM_DIRECTORY = join(PACKAGE_DIRECTORY, ".oracles/tlapm");
export const TLAPM_BINARY = join(TLAPM_DIRECTORY, "bin/tlapm");
export const TLAPM_BACKENDS = join(TLAPM_DIRECTORY, "lib/tlapm/backends/bin");
const ISABELLE_DIRECTORY = join(TLAPM_DIRECTORY, "lib/tlapm/backends/Isabelle-install");

export const TLAPM_OUTCOME_EXITS = {
  any: [0, 3, 10, 11, 12],
  proved: [0],
  failed: [10],
  incomplete: [11],
  "empty-target": [12],
  rejected: [3],
};

export const BACKEND_VERDICTS = ["unsat", "sat", "unknown"];

export const TLAPM_MODES = ["obligations", "proof", "encoding"];

const MODE_ARGUMENTS: Record<string, string[]> = {
  obligations: ["-N", "--printallobs"],
  proof: [],
  encoding: ["--debug", "tempfiles"],
};

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

export const BACKEND_EXTENSIONS: Record<string, string> = {
  ".smt": "z3",
  ".smt2": "z3",
  ".znn": "zenon",
  ".thy": "isabelle",
  ".ls4": "ls4",
};

export const getBackend = (path: string) => BACKEND_EXTENSIONS[extname(path)];

export const isSmtScript = (path: string) => extname(path) === ".smt2";

const quoteShell = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

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
const BACKTRACE_LINE =
  /^(Raised at|Raised by primitive operation at|Called from|Re-raised at) .*\n/gm;
const ZENON_COMMAND = /(\(\* BEGIN ZENON INPUT\n);; .*\n/g;
const MISSING_EXECUTABLE = /(not found in this PATH:\n).*\n/g;
// tlapm finds a backend with `type <name>` in sh. bash reports a miss on stderr and dash on stdout,
// and tlapm's next line reports it again.
const SHELL_NOT_FOUND = /^sh: .*type: \S+: not found\n/gm;
const CONFIG_DUMP = /^version == ".*"\n((?!@!!).*\S.*\n)*/gm;

interface ToolboxMessage {
  fields: Map<string, string>;
}

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

export const getTlapmStatuses = (transcript: string) =>
  transcript
    .split("\n")
    .filter((line) => /^@(status|prover|type|count): /.test(line))
    .join("\n");

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
