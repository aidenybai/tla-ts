// Generates the proof obligations tlapm prints for a module, in tlapm's order and layout.

import { TlaProofError } from "./errors";
import { createAnonymizer } from "./obligation-anon";
import type { Locus } from "./obligation-expression";
import { createGenerator } from "./obligation-generate";
import {
  compareNames,
  expandInstance,
  flatten,
  generate,
  getDependencies,
  normalize,
  STANDARD_MODULES,
  type Mule,
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
  location: string;
  text: string;
}

const MODULE_HEADER = /-{4,} *MODULE/;

const formatLocus = (locus: Locus | undefined) =>
  locus ? `${locus.startLine}:${locus.startColumn}:${locus.endLine}:${locus.endColumn}` : "";

// tlapm's lexer rejects a TAB anywhere from the module header through the closing ====.
const assertNoTabs = (source: string) => {
  const lines = source.split("\n");
  const endLine = tokenize(source).at(-1)?.line ?? lines.length;
  const end =
    lines.slice(0, endLine - 1).reduce((offset, line) => offset + line.length + 1, 0) +
    lines[endLine - 1].indexOf("====");
  if (source.slice(source.search(MODULE_HEADER), end).includes("\t"))
    throw new TlaProofError(
      "Unexpected TAB character. TLAPS does not handle TAB characters in source files.",
    );
};

const loadMule = (input: ObligationSource, counter: Counter, isMain: boolean): Mule => {
  const module = parseTlapmModule(input.source);
  assertNoTabs(input.source);
  return createSource(input.file, input.source, counter, isMain).convertModule(module);
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

export const getObligations = (
  main: ObligationSource,
  loadModule: (name: string) => ObligationSource | undefined,
): PrintedObligation[] => {
  const counter = { value: 0 };
  const mainModule = { ...loadMule(main, counter, true), isImportant: true };
  const modules = new Map<string, Mule>(STANDARD_MODULES);
  modules.set(mainModule.name, mainModule);
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
      const loaded = loadMule(input, counter, false);
      modules.set(name, loaded);
      queue.push(loaded);
    }
  }
  const missing = [...requested].find((name) => !found.has(name));
  if (missing !== undefined) throw new TlaProofError(`Unknown module "${missing}"`);
  const pipeline: Pipeline = {
    anonymizer: createAnonymizer(counter, (scope, definition) =>
      expandInstance(pipeline, scope, definition),
    ),
    generator: createGenerator(counter, main.file),
    salts: { value: 0 },
    latestModules: new Map(),
  };
  const order = schedule(modules).map((module) =>
    module.isStandard ? module : flatten(modules, module, new Set()),
  );
  // Instances see each module as flattened, and as normalized once its turn has come.
  const normalized = new Map(order.map((module) => [module.name, module]));
  return order.flatMap((module) => {
    if (module.isStandard) return [];
    const result = normalize(pipeline, normalized, undefined, module);
    if (!module.isImportant) return [];
    return generate(pipeline, [], result).flatMap((obligation): PrintedObligation[] => {
      if (obligation.kind.kind === "Omitted") return [];
      const text =
        obligation.kind.kind === "Error"
          ? obligation.kind.message
          : formatObligation(obligation.sequent);
      return [{ location: formatLocus(obligation.location), text }];
    });
  });
};
