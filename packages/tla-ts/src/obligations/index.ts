import { TlaProofError, TlaSyntaxError, type SyntaxFailure } from "../errors";
import { createAnonymizer } from "./anonymize";
import {
  getAtPrefix,
  getErrorSetting,
  getLocusPosition,
  getLocusPrefix,
  warnError,
  type Locus,
  type Warn,
  type Sequent,
} from "./expression";
import {
  createGenerator,
  type LineRange,
  type ModuleSummary,
  type TheoremSummary,
} from "./generate";
import { compareNames, flatten, getDependencies, STANDARD_MODULES, type Mule } from "./module";
import { expandInstance, normalize, type Pipeline } from "./normalize";
import { formatObligation, type PrinterOptions } from "./printer";
import type { Counter, ObligationKind } from "./proof";
import type { OldMethod } from "./pragma";
import { createSimplifier } from "./simplify";
import { createSource } from "./source";
import { tokenize } from "../lexer";
import { parseTlapmModule } from "../parser";
import type { Module } from "../ast";

interface ObligationSource {
  file: string;
  source: string;
}

export interface PrintedObligation {
  id: number;
  location: string;
  locus: Locus | undefined;
  text: string;
  kind: ObligationKind;
  sequent: Sequent;
  method?: OldMethod;
  isEnabledAxiomsSound?: boolean;
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
  onWarning?: Warn;
  printing?: PrinterOptions;
}

const MODULE_HEADER = /-{4,} *MODULE/;

const END_FAILURE = "Unexpected EOF";

const formatLocus = (locus: Locus | undefined) =>
  locus ? `${locus.startLine}:${locus.startColumn}:${locus.endLine}:${locus.endColumn}` : "";

const findTab = (source: string) => {
  const tokens = tokenize(source, true);
  const lines = source.split("\n");
  const endLine = tokens.at(-1)?.line ?? lines.length;
  const moduleEnd =
    lines.slice(0, endLine - 1).reduce((total, line) => total + line.length + 1, 0) +
    lines[endLine - 1].indexOf("====");
  const offset = source.indexOf("\t", source.search(MODULE_HEADER));
  if (offset === -1 || offset >= moduleEnd) return undefined;
  const line = source.slice(0, offset).split("\n").length;
  const column = offset - source.lastIndexOf("\n", offset - 1);
  const last = tokens.findLast(
    (token) =>
      token.kind !== "End" && (token.line < line || (token.line === line && token.column < column)),
  );
  const end: SyntaxFailure = {
    reason: END_FAILURE,
    line: last?.line ?? line,
    column: last ? last.endColumn + 1 : column,
    isEnd: true,
  };
  return { offset, line, column, end };
};

const catchSyntaxFailure = <Value>(read: () => Value): Value | SyntaxFailure => {
  try {
    return read();
  } catch (error) {
    if (!(error instanceof TlaSyntaxError) || !error.failure) throw error;
    return error.failure;
  }
};

const isSyntaxFailure = (value: unknown): value is SyntaxFailure =>
  typeof value === "object" && value !== null && "reason" in value;

const parseSource = (source: string): Module | SyntaxFailure[] => {
  const tab = catchSyntaxFailure(() => findTab(source));
  if (isSyntaxFailure(tab)) return [tab];
  const parsed = catchSyntaxFailure(() =>
    parseTlapmModule(tab ? source.slice(0, tab.offset) : source),
  );
  if (tab && (!isSyntaxFailure(parsed) || parsed.isEnd)) {
    return [
      {
        reason: "Unexpected TAB character. TLAPS does not handle TAB characters in source files.",
        line: tab.line,
        column: tab.column,
        isEnd: false,
      },
      isSyntaxFailure(parsed) && parsed.reason === END_FAILURE ? parsed : tab.end,
    ];
  }
  return isSyntaxFailure(parsed) ? [parsed] : parsed;
};

// Module.Save.parse_file warns when a module's name differs from its file's, then renames it.
const loadMule = (
  input: ObligationSource,
  counter: Counter,
  isMain: boolean,
  onWarning: Warn,
  errorPrefix: string,
): Mule => {
  if (!MODULE_HEADER.test(input.source)) throw new TlaProofError("No tokens in file");
  const parsed = parseSource(input.source);
  const proofFailure = Array.isArray(parsed) ? parsed[0].proof : undefined;
  if (Array.isArray(parsed) && proofFailure) {
    const locus = {
      file: input.file,
      startLine: parsed[0].line,
      startColumn: parsed[0].column,
      endLine: proofFailure.stop.line,
      endColumn: proofFailure.stop.column,
    };
    warnError(onWarning, locus, parsed[0].reason);
    throw new TlaProofError(parsed[0].reason, { failure: proofFailure.exception });
  }
  if (Array.isArray(parsed)) {
    parsed.forEach((failure) => {
      const text = `File ${JSON.stringify(input.file)}, line ${failure.line}, character ${failure.column}\n${failure.reason}`;
      onWarning({ text, channel: "stderr" });
      onWarning({ text: `${text}\n`, channel: "toolboxOnly" });
      onWarning(
        getErrorSetting(
          {
            file: input.file,
            startLine: failure.line,
            startColumn: failure.column,
            endLine: failure.line,
            endColumn: failure.column + 1,
          },
          `${failure.reason}\n`,
        ),
      );
    });
    const message = `Could not parse ${JSON.stringify(input.file)} successfully.`;
    onWarning({ text: `${errorPrefix}Error: ${message}`, channel: "stderr" });
    throw new TlaProofError(message, { failure: "Module.Parser.parse_file" });
  }
  const mule = createSource(input.file, input.source, counter, isMain).convertModule(parsed);
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
    const module = {
      ...loadMule(main, counter, true, onWarning, 'File "<unknown>":\n'),
      isImportant: true,
    };
    modules.set(module.name, module);
  });
  // Module.Save.complete_load: breadth first from every known module, by name.
  const queue = [...modules.values()].sort((left, right) => compareNames(left.name, right.name));
  // A missing module is fine only if some loaded module declares it as a submodule.
  const requested = new Map<string, Locus | undefined>();
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
        if (!modules.has(name) && !requested.has(name))
          requested.set(name, result.locations.get(name));
        continue;
      }
      const loaded = loadMule(
        input,
        counter,
        false,
        onWarning,
        getAtPrefix(result.locations.get(name)),
      );
      modules.set(name, loaded);
      queue.push(loaded);
    }
  }
  const missing = [...requested.keys()].filter((name) => !found.has(name)).sort(compareNames);
  missing.forEach((name) => {
    const message = `Unknown module ${JSON.stringify(name)}`;
    warnError(onWarning, requested.get(name), message);
  });
  if (missing.length > 0)
    throw new TlaProofError(`Unknown module ${JSON.stringify(missing[0])}`, {
      failure: "Module.Parser.load_module",
    });
  const pipeline: Pipeline = {
    anonymizer: createAnonymizer(
      counter,
      (scope, definition) => expandInstance(pipeline, scope, definition),
      onWarning,
    ),
    simplify: createSimplifier(counter),
    salts: { value: 0 },
    latestModules: new Map(),
    onWarning,
  };
  const order = schedule(modules).map((module) =>
    module.isStandard ? module : flatten(modules, module, new Set()),
  );
  const generateModule = createGenerator(new Set(mains.map((main) => main.file)), lines, onWarning);
  // Instances see each module as flattened, and as normalized once its turn has come.
  const normalized = new Map(order.map((module) => [module.name, module]));
  return order.flatMap((module): ModuleObligations[] => {
    if (module.isStandard) return [];
    const result = normalize(pipeline, normalized, undefined, module);
    if (!module.isImportant) return [];
    const generated = generateModule([], result);
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
          : `${formatObligation(obligation.sequent, options.printing)}\n`;
      return [
        {
          id: index + 1,
          location: formatLocus(location),
          locus: location,
          text,
          kind: obligation.kind,
          sequent: obligation.sequent,
          method: obligation.method,
          isEnabledAxiomsSound: obligation.isEnabledAxiomsSound,
        },
      ];
    });
    return [
      { name: module.name, location: module.location, obligations, summary: generated.summary },
    ];
  });
};
