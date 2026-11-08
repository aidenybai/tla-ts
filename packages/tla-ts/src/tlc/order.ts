// Reproduces TLC's string order, by first interning, and its variable order, from SANY's context.
import type { Module, SourceLocation } from "../ast";
import type { ConfigValue, ModelConfig } from "../config";
import { createMissingModuleError } from "../errors";
import { tokenize, type Token } from "../lexer";
import { extractModule, parseModule, parseModuleTokens } from "../parser";
import { isBefore } from "../resolve";
import {
  SANY_BUILTINS,
  SANY_NODE_NAMES,
  SANY_OPERATOR_SYNONYMS,
  TLC_MODULE_SOURCES,
  TLC_RUNTIME_STRINGS,
  TLC_STARTUP_STRINGS,
} from "./jar-data";

type SymbolKind = "builtin" | "constant" | "variable" | "definition" | "theorem" | "module";

interface SymbolEntry {
  key: string;
  name: string;
  hash: number;
  kind: SymbolKind;
  isLocal: boolean;
}

interface SymbolTable {
  put: (entry: SymbolEntry) => void;
  inserted: SymbolEntry[];
  // Where the entries the module adds itself start, after those of the modules it extends.
  ownStart: number;
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

// java.util.Hashtable as SANY's Context uses it: capacity 11, load factor 0.75, new entries at
// the head of their bucket, and enumeration from the last bucket, each from tail to head.
const createSymbolTable = (): SymbolTable => {
  let buckets: SymbolEntry[][] = Array.from({ length: 11 }, () => []);
  let threshold = 8;
  const keys = new Set<string>();
  const inserted: SymbolEntry[] = [];
  const forEachEntry = (visit: (entry: SymbolEntry) => void) => {
    for (let index = buckets.length - 1; index >= 0; index--) {
      const bucket = buckets[index];
      for (let position = bucket.length - 1; position >= 0; position--) visit(bucket[position]);
    }
  };
  const rehash = () => {
    const capacity = buckets.length * 2 + 1;
    const rehashed: SymbolEntry[][] = Array.from({ length: capacity }, () => []);
    forEachEntry((entry) => rehashed[entry.hash % capacity].push(entry));
    buckets = rehashed;
    threshold = Math.floor(capacity * 0.75);
  };
  return {
    put: (entry) => {
      if (keys.has(entry.key)) return;
      if (inserted.length >= threshold) rehash();
      buckets[entry.hash % buckets.length].push(entry);
      keys.add(entry.key);
      inserted.push(entry);
    },
    inserted,
    ownStart: 0,
    enumerate: () => {
      const entries: SymbolEntry[] = [];
      forEachEntry((entry) => entries.push(entry));
      return entries;
    },
  };
};

const createEntry = (name: string, kind: SymbolKind, isLocal: boolean): SymbolEntry => ({
  key: kind === "module" ? `module ${name}` : name,
  name,
  hash: getJavaHash(name) & 0x7fffffff,
  kind,
  isLocal,
});

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
  let close = start + 2;
  while (close < tokens.length && tokens[close].text !== ")") close++;
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

const getLocation = (token: Token) => ({ line: token.line, column: token.column });

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

// In the order SANY's SpecObj walks them to decide which module to parse next.
const getModuleReferences = (
  tokens: Token[],
  unit: string | undefined,
  innerModules: Map<string, ModuleReferences>,
) => {
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
      } else if (tokens[index - 1]?.text === ".") {
        // A record field named EXTENDS or INSTANCE, as in r.EXTENDS or [r EXCEPT !.INSTANCE = 0].
        continue;
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

const STRING_ESCAPES: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
  "\n": "\\n",
  "\t": "\\t",
  "\r": "\\r",
  "\f": "\\f",
};

// SANY reads <1>2 and ---- MODULE as one token each, and interns a string literal with its
// quotes, its contents only during semantic analysis.
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
    if (isHeader) continue;
    texts.push(
      token.kind === "String"
        ? `"${token.text.replace(/[\\"\n\t\r\f]/g, (character) => STRING_ESCAPES[character])}"`
        : token.text,
    );
  }
  return texts;
};

// A module starts with ---- MODULE Name, so its third token is its name.
const getModuleName = (tokens: Token[]) => tokens[2]?.text;

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

interface ModuleText {
  tokens: Token[];
  ranges: Map<string, { start: number; end: number }>;
  getModule: () => Module;
}

// Read and parsed once, for every order and for the environment that evaluates it.
const readModuleText = (text: string | undefined): ModuleText => {
  const tokens = text === undefined ? [] : tokenize(text);
  const parsed = { module: undefined as Module | undefined };
  return {
    tokens,
    ranges: getRanges(tokens),
    getModule: () =>
      (parsed.module ??= text === undefined ? parseModule("") : parseModuleTokens(text, tokens)),
  };
};

// A module without a source has no tokens.
const createModuleSet = (source: string, loadModule: ModuleLoader) => {
  const files = new Map<string, ParsedModule>();
  const nestedModules = new Map<string, ParsedModule>();
  const texts = new Map<string, ModuleText>();
  const readText = (text: string | undefined) => {
    const known = text === undefined ? undefined : texts.get(text);
    if (known) return known;
    const read = readModuleText(text);
    if (text !== undefined) texts.set(text, read);
    return read;
  };
  const getFile = (name: string | undefined) => {
    const cached = files.get(name ?? "");
    if (cached) return cached;
    const text =
      name === undefined
        ? source
        : (loadModule?.(name) ?? TLC_MODULE_SOURCES.get(name) ?? extractModule(source, name));
    const { tokens, ranges, getModule } = readText(text);
    const range = ranges.get(getModuleName(tokens) ?? "") ?? { start: 0, end: 0 };
    const file = { tokens, ...range, getModule };
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
  return {
    getParsed: (name: string | undefined): ParsedModule =>
      (name === undefined ? undefined : nestedModules.get(name)) ?? getFile(name),
    parseText: (text: string) => readText(text).getModule(),
  };
};

// The root module's context is under undefined.
type ModuleSet = ReturnType<typeof createModuleSet>["getParsed"];

const createContexts = (getParsed: ModuleSet) => {
  const getUnits = (unit: ParsedModule) => {
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
    const declarationKeywords = new Set(
      module.units.flatMap((moduleUnit) =>
        moduleUnit.kind === "Constants" || moduleUnit.kind === "Variables"
          ? [`${moduleUnit.location.line}:${moduleUnit.location.column}`]
          : [],
      ),
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
      const isDeclaration = declarationKeywords.has(`${token.line}:${token.column}`);
      if (isDeclaration && (token.text === "CONSTANT" || token.text === "CONSTANTS")) {
        declare(index, "constant");
      }
      if (isDeclaration && (token.text === "VARIABLE" || token.text === "VARIABLES")) {
        declare(index, "variable");
      }
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
    return units.sort((left, right) =>
      isBefore(left.location, right.location)
        ? -1
        : isBefore(right.location, left.location)
          ? 1
          : 0,
    );
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
    table.ownStart = table.inserted.length;
    getUnits(unit).forEach((item) => item.apply(table));
    return table;
  };
  return {
    getContext,
    getOwnEntries: (name: string | undefined) => {
      const table = getContext(name);
      return table.inserted.slice(table.ownStart);
    },
  };
};

// In order: config values, TLC's startup strings, each module's tokens as SpecObj.loadSpec
// parses them, string literals in semantic analysis order, and TLCGet's names.
const getStringOrder = (getParsed: ModuleSet, config: ModelConfig): string[] => {
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
  ) => {
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
  const createSearch = (getNames: (module: ModuleReferences) => string[]) => {
    const search: ModuleSearch = (module, visited) => {
      if (visited.has(module.key)) return undefined;
      visited.add(module.key);
      const name = getNames(module).find((referenced) => !isResolved(module, referenced));
      return name === undefined ? searchReferences(module, visited, search) : [module, name];
    };
    return search;
  };
  const findExtension = createSearch((module) => module.extends);
  const findInstantiation = createSearch((module) => module.instances);
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
    // SANY stops at the first module it can't find, in the order it reads them.
    if (getParsed(name).tokens.length === 0) {
      const importer = module.unit ?? getModuleName(getParsed(undefined).tokens);
      throw createMissingModuleError(name, importer);
    }
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

export interface TlcOrder {
  getStringOrder: (config: ModelConfig) => string[];
  // The reverse of the root module's context enumeration, in which TLC compares variables and
  // checks that the configuration assigns each constant.
  getDeclarationOrder: (kind: "variable" | "constant") => string[];
  // In the order TLC computes constant definitions at startup. An INSTANCE adds those of the
  // module it instantiates in the order that module's Hashtable enumerates them.
  createDefinitionOrder: () => (name: string | undefined) => string[];
  parseModule: (source: string) => Module;
}

export const createTlcOrder = (source: string, loadModule: ModuleLoader): TlcOrder => {
  const modules = createModuleSet(source, loadModule);
  const getParsed = modules.getParsed;
  let contexts: ReturnType<typeof createContexts> | undefined;
  const getContexts = () => (contexts ??= createContexts(getParsed));
  return {
    getStringOrder: (config) => getStringOrder(getParsed, config),
    getDeclarationOrder: (kind) =>
      getContexts()
        .getContext(undefined)
        .enumerate()
        .filter((entry) => entry.kind === kind)
        .map((entry) => entry.name)
        .reverse(),
    parseModule: modules.parseText,
    createDefinitionOrder: () => {
      const { getContext, getOwnEntries } = getContexts();
      // The root module's context finds the modules nested in the files it extends or instantiates.
      getContext(undefined);
      return (name) =>
        getOwnEntries(name)
          .filter((entry) => entry.kind === "definition")
          .map((entry) => entry.name);
    },
  };
};
