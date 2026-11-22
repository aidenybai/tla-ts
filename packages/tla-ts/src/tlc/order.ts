import {
  type Definition,
  type Expression,
  getChildren,
  type Module,
  type SourceLocation,
} from "../ast";
import type { ConfigValue, ModelConfig } from "../config";
import { createMissingModuleError, createSanyError, TlaSyntaxError } from "../errors";
import { getJavaHashCode } from "../java-hash";
import type { OperatorLevels } from "../levels";
import { tokenize, type Token } from "../lexer";
import { extractModule, parseModule, parseModuleTokens } from "../parser";
import { isBefore } from "../resolve";
import { SANY_STANDARD_MODULES } from "../sany/modules";
import { getSanyParseError } from "../sany/parse-error";
import {
  SANY_BUILTINS,
  SANY_NODE_NAMES,
  SANY_OPERATOR_SYNONYMS,
  TLC_MODULE_SOURCES,
  TLC_STARTUP_STRINGS,
} from "./jar-data";
import type { Value } from "../values";
import type { PreparedFacts } from "../dependencies";

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
  ownStart: number;
  enumerate: () => SymbolEntry[];
}

interface ParsedModule {
  tokens: Token[];
  start: number;
  end: number;
  isNested: boolean;
  getModule: () => Module;
  texts?: ModuleTexts;
}

// The texts that a module's tokens add to TLC's order of strings: the texts it parses and its string
// literals, in the order they come, either list free to leave out a text that came before.
export interface ModuleTexts {
  parsed: readonly string[];
  strings: readonly string[];
}

// A module of the module set read once from its file, with its text and the text the loader gave
// for it.
interface ModuleFile extends ParsedModule {
  text: string | undefined;
  loaded: string | undefined;
}

type ModuleLoader = ((name: string) => string | undefined) | undefined;

// A module that a compiler hands a check already read into its tokens and syntax tree. When SANY's
// checks accepted its names and levels, levels holds the levels they found for each of its
// definitions, so that a check links it as it is. values holds what its definitions without
// parameters evaluate to as a check starts, where every check that links it starts them alike.
export interface PreparedModule {
  name: string;
  text: string;
  tokens: Token[];
  module: Module;
  levels: readonly (OperatorLevels | undefined)[] | undefined;
  texts?: ModuleTexts;
  /** @internal */
  values?: ReadonlyMap<Definition, Value>;
  /** @internal */
  facts?: ReadonlyMap<string, PreparedFacts>;
  /** @internal Whether a LET of the module instantiates a module, as the build found. */
  hasLetInstances?: boolean;
}

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
  hash: getJavaHashCode(name) & 0x7fffffff,
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

// The kind of symbol that each declaring keyword declares.
const DECLARATION_KINDS = new Map<string, SymbolKind>([
  ["CONSTANT", "constant"],
  ["CONSTANTS", "constant"],
  ["VARIABLE", "variable"],
  ["VARIABLES", "variable"],
]);

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
        continue;
      }
      if (tokens[index - 1]?.text === ".") continue;
      if (token.text === "EXTENDS" && tokens[index - 3]?.text === "MODULE") {
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

export const getParsedTexts = (tokens: Token[]) => {
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

const readModuleText = (text: string | undefined): ModuleText => {
  const tokens = text === undefined ? [] : tokenize(text);
  let parsedModule: Module | undefined;
  return {
    tokens,
    ranges: getRanges(tokens),
    getModule: () =>
      (parsedModule ??= text === undefined ? parseModule("") : parseModuleTokens(text, tokens)),
  };
};

// The modules TLC reads for a spec: the root module, TLC's standard modules, the files the loader
// returns, the modules that follow the root module, and the modules nested in any of these. A
// module without a source has no tokens.
const createModuleSet = (
  source: string | Module,
  loadModule: ModuleLoader,
  prepared: readonly PreparedModule[],
) => {
  const rootText = typeof source === "string" ? source : undefined;
  const files = new Map<string, ModuleFile>();
  const nestedModules = new Map<string, ParsedModule>();
  // TLC reports a file that fails to parse as SANY's parse error in the module it names.
  const parseWithSanyError = (getModule: () => Module, text: string, name: string) => {
    try {
      return getModule();
    } catch (error) {
      if (!(error instanceof TlaSyntaxError)) throw error;
      const parseError = getSanyParseError(text);
      if (parseError === undefined) throw error;
      throw createSanyError(
        [
          {
            location: `In module ${name}`,
            message: `Could not parse module ${name} from file ${name}.tla`,
          },
        ],
        true,
        parseError,
      );
    }
  };
  const getFile = (name: string | undefined) => {
    const cached = files.get(name ?? "");
    if (cached) return cached;
    if (name === undefined && typeof source !== "string") {
      const file = {
        tokens: [],
        start: 0,
        end: 0,
        isNested: false,
        getModule: () => source,
        text: undefined,
        loaded: undefined,
      };
      files.set("", file);
      return file;
    }
    const preparedModule = prepared.find((item) => item.name === name);
    const loaded = name === undefined ? undefined : (preparedModule?.text ?? loadModule?.(name));
    const text =
      name === undefined
        ? rootText
        : (loaded ??
          TLC_MODULE_SOURCES.get(name) ??
          SANY_STANDARD_MODULES.get(name) ??
          (rootText === undefined ? undefined : extractModule(rootText, name)));
    const moduleText = preparedModule
      ? {
          tokens: preparedModule.tokens,
          ranges: getRanges(preparedModule.tokens),
          getModule: () => preparedModule.module,
        }
      : readModuleText(text);
    const tokens = moduleText.tokens;
    const range = moduleText.ranges.get(getModuleName(tokens) ?? "") ?? { start: 0, end: 0 };
    const file = {
      tokens,
      ...range,
      isNested: false,
      getModule:
        preparedModule || name === undefined || text === undefined
          ? moduleText.getModule
          : () => parseWithSanyError(moduleText.getModule, text, name),
      text,
      loaded,
      texts: preparedModule?.texts,
    };
    files.set(name ?? "", file);
    moduleText.ranges.forEach((nestedRange, nestedName) => {
      if (nestedRange.start === range.start || nestedModules.has(nestedName)) return;
      nestedModules.set(nestedName, {
        tokens,
        ...nestedRange,
        isNested: true,
        getModule: () => findModule(file.getModule().modules, nestedName) ?? file.getModule(),
      });
    });
    return file;
  };
  getFile(undefined);
  return {
    getParsed: (name: string | undefined): ParsedModule =>
      (name === undefined ? undefined : nestedModules.get(name)) ?? getFile(name),
    // The module of the file read for name, or of another text for it, such as a version's
    // standard module, read apart.
    getModule: (name: string | undefined, text: string) => {
      const file = getFile(name);
      return file.text === text ? file.getModule() : readModuleText(text).getModule();
    },
    parseFile: (text: string, name: string) => {
      const file = getFile(name);
      return file.text === text
        ? file.getModule()
        : parseWithSanyError(readModuleText(text).getModule, text, name);
    },
    getLoadedSource: (name: string) => getFile(name).loaded,
  };
};

type ModuleSet = ReturnType<typeof createModuleSet>["getParsed"];

const internExpressionStrings = (expression: Expression, intern: (text: string) => void): void => {
  if (expression.kind === "String") intern(expression.value);
  getChildren(expression).forEach((child) => internExpressionStrings(child, intern));
};

const internStrings = (module: Module, intern: (text: string) => void) =>
  module.units.forEach((unit) => {
    if (unit.kind === "Definition") {
      const definition = unit.definition;
      if (definition.kind === "Function") {
        definition.bounds.forEach((bound) => internExpressionStrings(bound.set, intern));
      }
      internExpressionStrings(definition.body, intern);
    }
    if (unit.kind === "Assumption") internExpressionStrings(unit.assumption.expression, intern);
  });

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
    // A module without source text, such as one tla-ts compiles from TypeScript, declares what its
    // units declare.
    if (tokens.length === 0) {
      module.units.forEach((moduleUnit) => {
        if (
          moduleUnit.kind !== "Constants" &&
          moduleUnit.kind !== "Variables" &&
          moduleUnit.kind !== "Recursive"
        ) {
          return;
        }
        const names = moduleUnit.declarations.map((declaration) => declaration.name);
        const kind =
          moduleUnit.kind === "Constants"
            ? "constant"
            : moduleUnit.kind === "Variables"
              ? "variable"
              : "definition";
        if (kind === "definition" && !names.every((name) => recursiveNames.has(name))) return;
        units.push({
          location: moduleUnit.location,
          apply: (table) => names.forEach((name) => table.put(createEntry(name, kind, false))),
        });
      });
    }
    let depth = 0;
    for (let index = unit.start; index < unit.end; index++) {
      const token = tokens[index];
      if (token.kind === "Separator" && tokens[index + 1]?.text === "MODULE") {
        depth++;
        if (depth === 2) {
          const name = tokens[index + 2].text;
          units.push({
            location: getLocation(token),
            apply: (table) => table.put(createEntry(name, "module", false)),
          });
        }
        continue;
      }
      if (token.kind === "ModuleEnd") depth--;
      if (depth !== 1 || token.kind !== "Keyword") continue;
      const kind = DECLARATION_KINDS.get(token.text);
      if (kind !== undefined && declarationKeywords.has(`${token.line}:${token.column}`)) {
        declare(index, kind);
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
        const name = tokens[index + 1].text;
        statementLocations.push(getLocation(token));
        units.push({
          location: getLocation(token),
          apply: (table) => table.put(createEntry(name, "theorem", false)),
        });
      }
    }
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
    const unit = getParsed(name);
    // SANY copies the builtins into a file module's context, but an inner module's context starts empty.
    if (!unit.isNested) {
      SANY_BUILTINS.toReversed().forEach((builtin) =>
        table.put(createEntry(builtin, "builtin", false)),
      );
    }
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

const getStringOrder = (
  getParsed: ModuleSet,
  source: string | Module,
  config: ModelConfig,
  runtimeModules: string[],
  rootExtendees: string[],
): string[] => {
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
  // A file that is one module, as a prepared module is, is its own unit.
  const getUnitParsedTexts = (name: string | undefined) =>
    getParsed(name).texts?.parsed ?? getParsedTexts(getUnitTokens(name));
  const getUnitStrings = (name: string | undefined) =>
    getParsed(name).texts?.strings ??
    getUnitTokens(name).flatMap((token) => (token.kind === "String" ? [token.text] : []));
  const getUnitTokens = (name: string | undefined) => {
    const unit = getParsed(name);
    return unit.start === 0 && unit.end === unit.tokens.length
      ? unit.tokens
      : unit.tokens.slice(unit.start, unit.end);
  };
  const innerModules = new Map<string, ModuleReferences>();
  const unitReferences = new Map<string | undefined, ModuleReferences>();
  const getUnitReferences = (name: string | undefined) => {
    const cached = unitReferences.get(name);
    if (cached) return cached;
    const references =
      name === undefined && typeof source !== "string"
        ? {
            key: "",
            unit: undefined,
            extends: source.extends,
            instances: source.instances.map((instance) => instance.module),
            inner: [],
            allExtends: new Set(source.extends),
          }
        : getModuleReferences(getUnitTokens(name), name, innerModules);
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
  // Without source text, only string literals are interned, unlike TLC reading the text.
  if (typeof source !== "string") SANY_NODE_NAMES.forEach(intern);
  getParsed(undefined).getModule();
  getParsedTexts(getUnitTokens(undefined)).forEach((text, index) => {
    if (index === 3) SANY_NODE_NAMES.forEach(intern);
    intern(text);
  });
  const rootReferences = getUnitReferences(undefined);
  rootReferences.extends.push(...rootExtendees);
  rootExtendees.forEach((name) => rootReferences.allExtends.add(name));
  while (true) {
    const found =
      findExtension(rootReferences, new Set()) ?? findInstantiation(rootReferences, new Set());
    if (!found) break;
    const [module, name] = found;
    relations.add(`${module.key}>${name}`);
    dependencies.set(module.unit, [...(dependencies.get(module.unit) ?? []), name]);
    if (parsedUnits.has(name)) continue;
    parsedUnits.add(name);
    if (getParsed(name).tokens.length === 0) {
      const importer = module.unit ?? getModuleName(getParsed(undefined).tokens);
      throw createMissingModuleError(name, importer);
    }
    getParsed(name).getModule();
    getUnitParsedTexts(name).forEach(intern);
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
    if (name === undefined && typeof source !== "string") {
      internStrings(source, intern);
      return;
    }
    getUnitStrings(name).forEach(intern);
  };
  analyze(undefined);
  runtimeModules.forEach((name) => {
    const tokens = getUnitTokens(name);
    getParsedTexts(tokens).forEach(intern);
    tokens.forEach((token) => {
      if (token.kind === "String") intern(token.text);
    });
  });
  return [...order];
};

export const getHashtableOrder = (names: string[]) => {
  const table = createSymbolTable();
  names.forEach((name) => table.put(createEntry(name, "definition", false)));
  return table.enumerate().map((entry) => entry.name);
};

export interface TlcOrder {
  getStringOrder: (
    config: ModelConfig,
    runtimeModules: string[],
    rootExtendees: string[],
  ) => string[];
  getDeclarationOrder: (kind: "variable" | "constant", module?: string) => string[];
  getDefinitionOrder: (module: string | undefined) => string[];
  getInstanceDeclarations: (module: string) => string[];
  getInnerModuleOrder: (module: string | undefined) => string[];
  createDefinitionOrder: () => (name: string | undefined) => string[];
  getModule: (name: string | undefined, source: string) => Module;
  parseFile: (source: string, name: string) => Module;
  getLoadedSource: (name: string) => string | undefined;
  getPreparedModule: (name: string) => PreparedModule | undefined;
}

export const createTlcOrder = (
  source: string | Module,
  loadModule: ModuleLoader,
  prepared: readonly PreparedModule[] = [],
): TlcOrder => {
  const modules = createModuleSet(source, loadModule, prepared);
  const getParsed = modules.getParsed;
  let contexts: ReturnType<typeof createContexts> | undefined;
  const getContexts = () => (contexts ??= createContexts(getParsed));
  return {
    getStringOrder: (config, runtimeModules, rootExtendees) =>
      getStringOrder(getParsed, source, config, runtimeModules, rootExtendees),
    getDeclarationOrder: (kind, module) =>
      getContexts()
        .getContext(module)
        .enumerate()
        .filter((entry) => entry.kind === kind)
        .map((entry) => entry.name)
        .reverse(),
    getDefinitionOrder: (module) =>
      getContexts()
        .getContext(module)
        .inserted.filter((entry) => entry.kind === "definition")
        .map((entry) => entry.name),
    getInstanceDeclarations: (module) =>
      getContexts()
        .getContext(module)
        .enumerate()
        .filter((entry) => entry.kind === "constant" || entry.kind === "variable")
        .map((entry) => entry.name),
    // SANY's ModuleNode#getInnerModules walks the module's Context, so inherited modules come too.
    getInnerModuleOrder: (module) =>
      getContexts()
        .getContext(module)
        .enumerate()
        .filter((entry) => entry.kind === "module")
        .map((entry) => entry.name),
    getModule: modules.getModule,
    parseFile: modules.parseFile,
    getLoadedSource: modules.getLoadedSource,
    getPreparedModule: (name) => prepared.find((item) => item.name === name),
    createDefinitionOrder: () => {
      const moduleContexts = getContexts();
      moduleContexts.getContext(undefined);
      return (name) =>
        moduleContexts
          .getOwnEntries(name)
          .filter((entry) => entry.kind === "definition")
          .map((entry) => entry.name);
    },
  };
};
