// TLC orders strings and model values by when it first interned their text, and compares a
// state's variables in the order of SANY's symbol table. This reproduces both orders.
import type { Module, SourceLocation } from "./ast";
import type { ConfigValue, ModelConfig } from "./config";
import { tokenize, type Token } from "./lexer";
import { extractModule, parseModule } from "./parser";
import {
  SANY_BUILTINS,
  SANY_NODE_NAMES,
  SANY_OPERATOR_SYNONYMS,
  TLC_MODULE_SOURCES,
  TLC_RUNTIME_STRINGS,
  TLC_STARTUP_STRINGS,
} from "./tlc-modules";

type SymbolKind = "builtin" | "constant" | "variable" | "definition" | "theorem" | "module";

interface SymbolEntry {
  key: string;
  name: string;
  kind: SymbolKind;
  isLocal: boolean;
}

interface SymbolTable {
  put: (entry: SymbolEntry) => void;
  inserted: SymbolEntry[];
  enumerate: () => SymbolEntry[];
}

interface ParsedModule {
  tokens: Token[];
  start: number;
  end: number;
  getModule: () => Module;
}

type ModuleLoader = ((name: string) => string | undefined) | undefined;

interface ModuleUnit {
  location: SourceLocation;
  apply: (table: SymbolTable) => void;
}

const SEMANTIC_PRELUDE = ["LAMBDA", "$$InAssume", "nullODN", "nullOpArg", "nullLabelNode"];

const THEOREM_KEYWORDS = new Set(["THEOREM", "LEMMA", "COROLLARY", "PROPOSITION"]);

const CANONICAL_OPERATORS = new Map(
  SANY_OPERATOR_SYNONYMS.flatMap((synonyms) => synonyms.map((name) => [name, synonyms[0]])),
);

const getCanonicalName = (name: string) => CANONICAL_OPERATORS.get(name) ?? name;

const getJavaHash = (text: string) => {
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  }
  return hash;
};

// java.util.Hashtable as SANY's Context uses it: default capacity 11, load factor 0.75, new
// entries at the head of their bucket, and enumeration from the last bucket to the first.
const createSymbolTable = (): SymbolTable => {
  const table = { buckets: Array.from({ length: 11 }, (): SymbolEntry[] => []), threshold: 8 };
  const keys = new Set<string>();
  const inserted: SymbolEntry[] = [];
  const getBucket = (entry: SymbolEntry, capacity: number) =>
    (getJavaHash(entry.name) & 0x7fffffff) % capacity;
  const rehash = () => {
    const capacity = table.buckets.length * 2 + 1;
    const buckets = Array.from({ length: capacity }, (): SymbolEntry[] => []);
    for (let index = table.buckets.length - 1; index >= 0; index--) {
      for (const entry of table.buckets[index]) buckets[getBucket(entry, capacity)].unshift(entry);
    }
    table.buckets = buckets;
    table.threshold = Math.floor(capacity * 0.75);
  };
  return {
    put: (entry) => {
      if (keys.has(entry.key)) return;
      if (inserted.length >= table.threshold) rehash();
      table.buckets[getBucket(entry, table.buckets.length)].unshift(entry);
      keys.add(entry.key);
      inserted.push(entry);
    },
    inserted,
    enumerate: () => table.buckets.toReversed().flat(),
  };
};

const createEntry = (name: string, kind: SymbolKind, isLocal: boolean): SymbolEntry => ({
  key: kind === "module" ? `module ${name}` : name,
  name,
  kind,
  isLocal,
});

const isBefore = (left: SourceLocation, right: SourceLocation) =>
  left.line < right.line || (left.line === right.line && left.column < right.column);

const getDeclaredName = (tokens: Token[], start: number) => {
  const first = tokens[start];
  const second = tokens[start + 1];
  if (first.text === "_" && second.kind === "Operator") {
    return tokens[start + 2]?.text === "_"
      ? { name: getCanonicalName(second.text), end: start + 3 }
      : { name: second.text, end: start + 2 };
  }
  if (first.kind === "Operator") {
    return { name: first.text === "-" ? "-." : getCanonicalName(first.text), end: start + 2 };
  }
  if (second?.text !== "(") return { name: first.text, end: start + 1 };
  const close = tokens.findIndex((token, index) => index > start && token.text === ")");
  return { name: first.text, end: close + 1 };
};

const getDeclarations = (tokens: Token[], start: number) => {
  const names: string[] = [];
  for (let index = start; ;) {
    const declared = getDeclaredName(tokens, index);
    names.push(declared.name);
    if (tokens[declared.end]?.text !== ",") return names;
    index = declared.end + 1;
  }
};

const getLocation = (token: Token): SourceLocation => ({ line: token.line, column: token.column });

interface ModuleReferences {
  key: string;
  unit: string | undefined;
  extends: string[];
  instances: string[];
  inner: ModuleReferences[];
  allExtends: Set<string>;
}

type ModuleSearch = (
  module: ModuleReferences,
  visited: Set<string>,
) => [ModuleReferences, string] | undefined;

// The modules a module extends and instantiates, with its inner modules, as SANY's SpecObj
// walks them to decide which module to parse next.
const getModuleReferences = (
  tokens: Token[],
  unit: string | undefined,
  innerModules: Map<string, ModuleReferences>,
): ModuleReferences => {
  const allExtends = new Set<string>();
  const read = (start: number, key: string): { references: ModuleReferences; end: number } => {
    const references: ModuleReferences = {
      key,
      unit,
      extends: [],
      instances: [],
      inner: [],
      allExtends,
    };
    for (let index = start + 1; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.kind === "ModuleEnd") return { references, end: index };
      if (token.kind === "Separator" && tokens[index + 1]?.text === "MODULE") {
        const name = tokens[index + 2].text;
        const inner = read(index, `${key}/${name}`);
        innerModules.set(name, inner.references);
        references.inner.push(inner.references);
        index = inner.end;
      } else if (token.text === "EXTENDS") {
        const names = getDeclarations(tokens, index + 1);
        references.extends.push(...names);
        names.forEach((name) => allExtends.add(name));
      } else if (token.text === "INSTANCE" && tokens[index + 1]?.kind === "Identifier") {
        references.instances.push(tokens[index + 1].text);
      }
    }
    return { references, end: tokens.length };
  };
  return read(0, unit ?? "").references;
};

const isAdjacent = (left: Token, right: Token | undefined) =>
  right !== undefined &&
  right.line === left.line &&
  right.column === left.column + left.text.length;

// The texts SANY interns while parsing, in order. SANY reads a proof step label such as <1>2 and
// a module header such as ---- MODULE as one token, and interns a string literal's contents only
// during semantic analysis.
const getParsedTexts = (tokens: Token[]) => {
  const texts: string[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const isStepLabel =
      token.text === "<" &&
      isAdjacent(token, tokens[index + 1]) &&
      /^(\d+|\*|\+)$/.test(tokens[index + 1].text) &&
      tokens[index + 2]?.text === ">" &&
      isAdjacent(tokens[index + 1], tokens[index + 2]);
    if (isStepLabel) {
      index += isAdjacent(tokens[index + 2], tokens[index + 3]) ? 3 : 2;
      continue;
    }
    const isHeader = token.text === "MODULE" && tokens[index - 1]?.kind === "Separator";
    if (token.kind !== "String" && !isHeader) texts.push(token.text);
  }
  return texts;
};

const getRanges = (tokens: Token[]) => {
  const ranges = new Map<string, { start: number; end: number }>();
  const open: { name: string; start: number }[] = [];
  tokens.forEach((token, index) => {
    if (token.kind === "Separator" && tokens[index + 1]?.text === "MODULE") {
      open.push({ name: tokens[index + 2].text, start: index });
    }
    const closed = token.kind === "ModuleEnd" ? open.pop() : undefined;
    if (closed && !ranges.has(closed.name)) {
      ranges.set(closed.name, { start: closed.start, end: index + 1 });
    }
  });
  return ranges;
};

const findModule = (modules: Module[], name: string): Module | undefined =>
  modules.find((module) => module.name === name) ??
  modules.map((module) => findModule(module.modules, name)).find(Boolean);

// The modules TLC reads for a spec: the root module, TLC's standard modules, the files the loader
// returns, the modules that follow the root module, and the modules nested in any of these. A
// module without a source has no tokens.
const createModuleSet = (source: string, loadModule: ModuleLoader) => {
  const files = new Map<string, ParsedModule>();
  const nestedModules = new Map<string, ParsedModule>();
  const getFile = (name: string | undefined): ParsedModule => {
    const cached = files.get(name ?? "");
    if (cached) return cached;
    const text =
      name === undefined
        ? source
        : (TLC_MODULE_SOURCES.get(name) ?? loadModule?.(name) ?? extractModule(source, name));
    const tokens = text === undefined ? [] : tokenize(text);
    const ranges = getRanges(tokens);
    const range = ranges.get(tokens[2]?.text ?? "") ?? { start: 0, end: 0 };
    const parsed = { module: undefined as Module | undefined };
    const file = {
      tokens,
      ...range,
      getModule: () => (parsed.module ??= parseModule(text ?? "")),
    };
    files.set(name ?? "", file);
    ranges.forEach((nestedRange, nestedName) => {
      if (nestedRange.start === range.start || nestedModules.has(nestedName)) return;
      nestedModules.set(nestedName, {
        tokens,
        ...nestedRange,
        getModule: () => findModule(file.getModule().modules, nestedName) ?? file.getModule(),
      });
    });
    return file;
  };
  getFile(undefined);
  return (name: string | undefined): ParsedModule =>
    (name === undefined ? undefined : nestedModules.get(name)) ?? getFile(name);
};

// The variables in the order TLC compares them: the reverse of the root module's context
// enumeration, as ModuleNode.getVariableDecls returns them.
export const getTlcVariableOrder = (source: string, loadModule: ModuleLoader): string[] => {
  const getParsed = createModuleSet(source, loadModule);
  const getUnits = (unit: ParsedModule): ModuleUnit[] => {
    const tokens = unit.tokens;
    const module = unit.getModule();
    const units: ModuleUnit[] = [];
    const statementLocations: SourceLocation[] = [];
    const declare = (index: number, kind: SymbolKind) => {
      const names = getDeclarations(tokens, index + 1);
      units.push({
        location: getLocation(tokens[index]),
        apply: (table) => names.forEach((name) => table.put(createEntry(name, kind, false))),
      });
    };
    const recursiveNames = new Set(
      module.definitions.filter((definition) => definition.isRecursive).map((item) => item.name),
    );
    const depth = { value: 0 };
    tokens.slice(unit.start, unit.end).forEach((_, offset) => {
      const index = unit.start + offset;
      const token = tokens[index];
      if (token.kind === "Separator" && tokens[index + 1]?.text === "MODULE") {
        depth.value++;
        if (depth.value === 2) {
          const name = tokens[index + 2].text;
          units.push({
            location: getLocation(token),
            apply: (table) => table.put(createEntry(name, "module", false)),
          });
        }
        return;
      }
      if (token.kind === "ModuleEnd") depth.value--;
      if (depth.value !== 1 || token.kind !== "Keyword") return;
      if (token.text === "CONSTANT" || token.text === "CONSTANTS") declare(index, "constant");
      if (token.text === "VARIABLE" || token.text === "VARIABLES") declare(index, "variable");
      if (token.text === "RECURSIVE") {
        const names = getDeclarations(tokens, index + 1);
        if (names.every((name) => recursiveNames.has(name))) declare(index, "definition");
      }
      const isNamedTheorem =
        THEOREM_KEYWORDS.has(token.text) &&
        tokens[index + 1]?.kind === "Identifier" &&
        tokens[index + 2]?.text === "==";
      if (isNamedTheorem) {
        statementLocations.push(getLocation(token));
        units.push({
          location: getLocation(token),
          apply: (table) => table.put(createEntry(tokens[index + 1].text, "theorem", false)),
        });
      }
    });
    module.assumptions.forEach((assumption) => {
      statementLocations.push(assumption.location);
      const name = assumption.name;
      if (name === undefined) return;
      units.push({
        location: assumption.location,
        apply: (table) => table.put(createEntry(name, "theorem", false)),
      });
    });
    const isStatement = (location: SourceLocation) =>
      statementLocations.some(
        (statement) => statement.line === location.line && statement.column === location.column,
      );
    module.definitions.forEach((definition) => {
      if (isStatement(definition.location)) return;
      const name = getCanonicalName(definition.name);
      units.push({
        location: definition.location,
        apply: (table) => table.put(createEntry(name, "definition", definition.isLocal)),
      });
    });
    module.instances.forEach((instance) => {
      units.push({
        location: instance.location,
        apply: (table) => {
          const instancee = getContext(instance.module).enumerate();
          const prefix = instance.name === undefined ? "" : `${instance.name}!`;
          const definitions = instancee.filter((entry) => entry.kind === "definition");
          const theorems = instancee.filter((entry) => entry.kind === "theorem");
          [...definitions, ...theorems].forEach((entry) => {
            if (entry.isLocal) return;
            table.put(createEntry(`${prefix}${entry.name}`, entry.kind, instance.isLocal));
          });
          if (instance.name !== undefined) {
            table.put(createEntry(instance.name, "definition", instance.isLocal));
          }
        },
      });
    });
    return units
      .map((item, index) => ({ item, index }))
      .sort((left, right) =>
        isBefore(left.item.location, right.item.location)
          ? -1
          : isBefore(right.item.location, left.item.location)
            ? 1
            : left.index - right.index,
      )
      .map((entry) => entry.item);
  };

  const contexts = new Map<string, SymbolTable>();
  const getContext = (name: string | undefined): SymbolTable => {
    const cached = contexts.get(name ?? "");
    if (cached) return cached;
    const table = createSymbolTable();
    contexts.set(name ?? "", table);
    SANY_BUILTINS.toReversed().forEach((builtin) =>
      table.put(createEntry(builtin, "builtin", false)),
    );
    const unit = getParsed(name);
    unit.getModule().extends.forEach((extended) =>
      getContext(extended).inserted.forEach((entry) => {
        if (!entry.isLocal) table.put(entry);
      }),
    );
    getUnits(unit).forEach((item) => item.apply(table));
    return table;
  };
  return getContext(undefined)
    .enumerate()
    .filter((entry) => entry.kind === "variable")
    .map((entry) => entry.name)
    .reverse();
};

// Every string TLC interns before model checking starts, in order: values in the config, TLC's
// startup strings, each module's tokens in the order SpecObj.loadSpec parses the modules, string
// literals in semantic analysis order, and the names TLC interns for TLCGet.
export const getTlcStringOrder = (
  source: string,
  config: ModelConfig,
  loadModule: ModuleLoader,
): string[] => {
  const getParsed = createModuleSet(source, loadModule);
  const order = new Set<string>();
  const intern = (text: string) => {
    order.add(text);
  };
  const internConfigValue = (value: ConfigValue): void => {
    if (value.kind === "ModelValue") intern(value.name);
    if (value.kind === "String") intern(value.value);
    if (value.kind === "Set") value.elements.forEach(internConfigValue);
  };
  config.constants.forEach((constant) => {
    constant.args?.forEach(internConfigValue);
    internConfigValue(constant.value);
  });
  TLC_STARTUP_STRINGS.forEach(intern);
  const getUnitTokens = (name: string | undefined) => {
    const unit = getParsed(name);
    return unit.tokens.slice(unit.start, unit.end);
  };
  const innerModules = new Map<string, ModuleReferences>();
  const unitReferences = new Map<string | undefined, ModuleReferences>();
  const getUnitReferences = (name: string | undefined) => {
    const cached = unitReferences.get(name);
    if (cached) return cached;
    const references = getModuleReferences(getUnitTokens(name), name, innerModules);
    unitReferences.set(name, references);
    return references;
  };
  const getReferenced = (name: string) => innerModules.get(name) ?? getUnitReferences(name);
  const relations = new Set<string>();
  const isResolved = (module: ModuleReferences, name: string) =>
    innerModules.has(name) || relations.has(`${module.key}>${name}`);
  const searchReferences = (
    module: ModuleReferences,
    visited: Set<string>,
    search: ModuleSearch,
  ): [ModuleReferences, string] | undefined => {
    const nested = [
      ...module.extends.map(getReferenced),
      ...module.instances.filter((name) => isResolved(module, name)).map(getReferenced),
      ...module.inner,
    ];
    for (const item of nested) {
      const found = search(item, visited);
      if (found) return found;
    }
    return undefined;
  };
  const findExtension: ModuleSearch = (module, visited) => {
    if (visited.has(module.key)) return undefined;
    visited.add(module.key);
    const name = module.extends.find((extended) => !isResolved(module, extended));
    return name === undefined ? searchReferences(module, visited, findExtension) : [module, name];
  };
  const findInstantiation: ModuleSearch = (module, visited) => {
    if (visited.has(module.key)) return undefined;
    visited.add(module.key);
    const name = module.instances.find((instanced) => !isResolved(module, instanced));
    return name === undefined
      ? searchReferences(module, visited, findInstantiation)
      : [module, name];
  };
  const parsedUnits = new Set<string | undefined>([undefined]);
  const dependencies = new Map<string | undefined, string[]>();
  getParsedTexts(getUnitTokens(undefined)).forEach((text, index) => {
    if (index === 3) SANY_NODE_NAMES.forEach(intern);
    intern(text);
  });
  const rootReferences = getUnitReferences(undefined);
  while (true) {
    const found =
      findExtension(rootReferences, new Set()) ?? findInstantiation(rootReferences, new Set());
    if (!found) break;
    const [module, name] = found;
    relations.add(`${module.key}>${name}`);
    dependencies.set(module.unit, [...(dependencies.get(module.unit) ?? []), name]);
    if (parsedUnits.has(name)) continue;
    parsedUnits.add(name);
    getParsedTexts(getUnitTokens(name)).forEach(intern);
  }
  SEMANTIC_PRELUDE.forEach(intern);
  const analyzed = new Set<string | undefined>();
  const analyze = (name: string | undefined) => {
    if (analyzed.has(name)) return;
    analyzed.add(name);
    const unitDependencies = dependencies.get(name) ?? [];
    const extendees = getUnitReferences(name).allExtends;
    [
      ...unitDependencies.filter((item) => extendees.has(item)),
      ...unitDependencies.filter((item) => !extendees.has(item)),
    ].forEach(analyze);
    getUnitTokens(name).forEach((token) => {
      if (token.kind === "String") intern(token.text);
    });
  };
  analyze(undefined);
  TLC_RUNTIME_STRINGS.forEach(intern);
  return [...order];
};
