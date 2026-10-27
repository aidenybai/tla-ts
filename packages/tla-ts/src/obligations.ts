// Generates the proof obligations tlapm prints for a module, in tlapm's order and layout.

import { TlaProofError } from "./errors";
import { createAnonymizer } from "./obligation-anon";
import {
  getLocusPosition,
  getLocusPrefix,
  type Locus,
  type ObligationWarning,
} from "./obligation-expression";
import { createGenerator, type LineRange } from "./obligation-generate";
import {
  compareNames,
  expandInstance,
  flatten,
  generate,
  getDependencies,
  normalize,
  STANDARD_MODULES,
  type ModuleSummary,
  type Mule,
  type TheoremSummary,
  type Pipeline,
} from "./obligation-module";
import { formatObligation } from "./obligation-printer";
import type { Counter } from "./obligation-proof";
import { createSource } from "./obligation-source";
import { tokenize } from "./lexer";
import { parseTlapmModule } from "./parser";

export interface ObligationSource {
  file: string;
  source: string;
}

export interface PrintedObligation {
  id: number;
  location: string;
  text: string;
}

export interface ModuleObligations {
  name: string;
  location: Locus | undefined;
  obligations: PrintedObligation[];
  summary: ModuleSummary;
}

export const WHOLE_MODULE: LineRange = { start: 0, end: Infinity };

interface ObligationOptions {
  lines?: LineRange;
  onWarning?: (warning: ObligationWarning) => void;
}

const MODULE_HEADER = /-{4,} *MODULE/;

const formatLocus = (locus: Locus | undefined) =>
  locus ? `${locus.startLine}:${locus.startColumn}:${locus.endLine}:${locus.endColumn}` : "";

// The closing ==== is on the line of the last token.
const getModuleEnd = (source: string) => {
  const lines = source.split("\n");
  const line = tokenize(source).at(-1)?.line ?? lines.length;
  return { line, column: lines[line - 1].indexOf("====") + 1, lines };
};

// tlapm's lexer rejects a TAB anywhere from the module header through the closing ====.
const assertNoTabs = (source: string) => {
  const end = getModuleEnd(source);
  const offset =
    end.lines.slice(0, end.line - 1).reduce((total, line) => total + line.length + 1, 0) +
    end.column -
    1;
  if (source.slice(source.search(MODULE_HEADER), offset).includes("\t"))
    throw new TlaProofError(
      "Unexpected TAB character. TLAPS does not handle TAB characters in source files.",
    );
};

// Module.Save.parse_file warns when a module's name differs from its file's, then renames it.
const loadMule = (
  input: ObligationSource,
  counter: Counter,
  isMain: boolean,
  onWarning: (warning: ObligationWarning) => void,
): Mule => {
  const module = parseTlapmModule(input.source);
  assertNoTabs(input.source);
  const mule = createSource(input.file, input.source, counter, isMain).convertModule(module);
  const fileName = input.file.slice(input.file.lastIndexOf("/") + 1);
  const name = fileName.replace(/\.tla$/, "");
  if (mule.name === name) return mule;
  onWarning({
    text: `${getLocusPrefix(mule.location)}Warning: module name ${JSON.stringify(mule.name)} does not match file name ${JSON.stringify(fileName)}.`,
    channel: "toolbox",
  });
  return { ...mule, name };
};

// Module.Dep.schedule: dependencies first, visiting modules and their dependencies by name.
const schedule = (modules: Map<string, Mule>) => {
  const dependencies = new Map(
    [...modules].map(([name, module]) => [name, getDependencies(module).dependencies]),
  );
  const seen = new Set<string>();
  const order: Mule[] = [];
  const visit = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    const module = modules.get(name);
    if (!module) throw new TlaProofError(`Module "${name}" not found`);
    (dependencies.get(name) ?? []).forEach(visit);
    order.push(module);
  };
  [...modules.keys()].sort(compareNames).forEach(visit);
  return order;
};

// The missing or omitted proofs of a theorem, numbered after those of the theorems before it.
const formatProofs = (kind: "missing" | "omitted", loci: Locus[], before: number) =>
  loci.length === 0
    ? []
    : [
        `    ${kind}_proofs_count = ${loci.length}`,
        ...loci.map(
          (locus, index) => `    ${kind}_proof_${before + index + 1} at ${getLocusPosition(locus)}`,
        ),
      ];

const formatTheoremSummary = (theorem: TheoremSummary, missing: number, omitted: number) => {
  const location = theorem.location;
  const start = location
    ? getLocusPosition({
        ...location,
        endLine: location.startLine,
        endColumn: location.startColumn,
      })
    : "<unknown location>";
  return [
    `  ---- incomplete proof of theorem at ${start} ----`,
    ...formatProofs("missing", theorem.absent, missing),
    ...formatProofs("omitted", theorem.omitted, omitted),
    "  ====",
  ];
};

// Module.Fmt.summary, which tlapm prints to stdout for --summary. It numbers the missing and the
// omitted proofs across the theorems.
export const formatSummary = (result: ModuleObligations) => {
  const summary = result.summary;
  const theorems = summary.theorems.reduce(
    (state, theorem) =>
      theorem.absent.length + theorem.omitted.length === 0
        ? state
        : {
            lines: [...state.lines, ...formatTheoremSummary(theorem, state.missing, state.omitted)],
            missing: state.missing + theorem.absent.length,
            omitted: state.omitted + theorem.omitted.length,
          },
    { lines: new Array<string>(), missing: 0, omitted: 0 },
  );
  return [
    `---- summary of module ${JSON.stringify(result.name)} ----`,
    `  obligations_count = ${summary.total}`,
    ...(summary.absent.length > 0 ? [`  missing_proofs_count = ${summary.absent.length}`] : []),
    ...(summary.omitted.length > 0 ? [`  omitted_proofs_count = ${summary.omitted.length}`] : []),
    ...theorems.lines,
    "====",
  ].join("\n");
};

// Each main module is one file given to tlapm. They load into one context and report in schedule
// order, each numbering its obligations from 1.
export const getObligations = (
  mains: ObligationSource[],
  loadModule: (name: string) => ObligationSource | undefined,
  options: ObligationOptions = {},
): ModuleObligations[] => {
  const lines = options.lines ?? WHOLE_MODULE;
  const onWarning = options.onWarning ?? (() => {});
  const counter = { value: 0 };
  const modules = new Map<string, Mule>(STANDARD_MODULES);
  mains.forEach((main) => {
    const module = { ...loadMule(main, counter, true, onWarning), isImportant: true };
    modules.set(module.name, module);
  });
  // Module.Save.complete_load: breadth first from every known module, by name.
  const queue = [...modules.values()].sort((left, right) => compareNames(left.name, right.name));
  // A missing module is fine only if some loaded module declares it as a submodule.
  const requested = new Set<string>();
  const found = new Set<string>();
  for (let index = 0; index < queue.length; index++) {
    const result = getDependencies(queue[index]);
    result.submodules.forEach((submodule, name) => {
      found.add(name);
      if (!modules.has(name)) modules.set(name, submodule);
    });
    // A file named like a standard module replaces it, and is read again for each module citing it.
    for (const name of result.dependencies) {
      if (modules.has(name) && !STANDARD_MODULES.has(name)) continue;
      const input = loadModule(name);
      if (!input) {
        if (!modules.has(name)) requested.add(name);
        continue;
      }
      const loaded = loadMule(input, counter, false, onWarning);
      modules.set(name, loaded);
      queue.push(loaded);
    }
  }
  const missing = [...requested].find((name) => !found.has(name));
  if (missing !== undefined) throw new TlaProofError(`Unknown module "${missing}"`);
  const pipeline: Pipeline = {
    anonymizer: createAnonymizer(
      counter,
      (scope, definition) => expandInstance(pipeline, scope, definition),
      onWarning,
    ),
    generator: createGenerator(counter, new Set(mains.map((main) => main.file)), lines),
    salts: { value: 0 },
    latestModules: new Map(),
    onWarning,
  };
  const order = schedule(modules).map((module) =>
    module.isStandard ? module : flatten(modules, module, new Set()),
  );
  // Instances see each module as flattened, and as normalized once its turn has come.
  const normalized = new Map(order.map((module) => [module.name, module]));
  return order.flatMap((module): ModuleObligations[] => {
    if (module.isStandard) return [];
    const result = normalize(pipeline, normalized, undefined, module);
    if (!module.isImportant) return [];
    const generated = generate(pipeline, [], result);
    // tlapm numbers the obligations, then drops the omitted ones and those outside the lines.
    const obligations = generated.obligations.flatMap((obligation, index): PrintedObligation[] => {
      const location = obligation.location;
      if (
        obligation.kind.kind === "Omitted" ||
        (location && (location.startLine < lines.start || location.endLine > lines.end))
      )
        return [];
      const text =
        obligation.kind.kind === "Error"
          ? obligation.kind.message
          : `${formatObligation(obligation.sequent)}\n`;
      return [{ id: index + 1, location: formatLocus(location), text }];
    });
    return [
      { name: module.name, location: module.location, obligations, summary: generated.summary },
    ];
  });
};
