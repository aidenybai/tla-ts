import type { ViewTables } from "../module-view";
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

export interface SymbolTable {
  put: (entry: SymbolEntry) => void;
  inserted: SymbolEntry[];
  ownStart: number;
  enumerate: () => SymbolEntry[];
  // A table that starts as this one is, which neither changes for what the other puts.
  fork: () => SymbolTable;
}

// The context of a module as its builtins and the modules it extends first leave it, which a check
// of a group's base records for its root and its own module, so that the check of a file of the
// group whose module extends the same modules first starts from a fork of it.
interface ContextStart {
  extended: readonly string[];
  table: SymbolTable;
}

// The contexts that a group's base built, which the check of each file of the group reads: those
// of the modules that every file's spec extends, by name, and the starts of the others.
export interface SharedContexts {
  tables: ReadonlyMap<string, SymbolTable>;
  starts: ReadonlyMap<string, ContextStart>;
}

interface ParsedModule {
  getTokens: () => TokenList;
  start: number;
  end: number;
  isNested: boolean;
  // Whether the module comes as a syntax tree without tokens, from which TLC's orders read it.
  isTreeOnly: boolean;
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
  /** @internal The tables of the module's views, which the build records. */
  viewTables?: ViewTables;
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

// A table as SANY's Context's Java Hashtable holds it: each bucket's entries, the newest last, and
// its keys. A fork shares the buckets and keys it starts with, and each table that shares a bucket
// copies it before it puts into it.
const createSymbolTable = (
  start = {
    buckets: Array.from({ length: 11 }, (): SymbolEntry[] => []),
    threshold: 8,
    sharedKeys: [] as readonly ReadonlySet<string>[],
    inserted: [] as SymbolEntry[],
    isForked: false,
  },
): SymbolTable => {
  let buckets = start.buckets;
  let threshold = start.threshold;
  // Whether each bucket is this table's own, which it puts into without a copy.
  let ownBuckets = new Uint8Array(buckets.length).fill(start.isForked ? 0 : 1);
  let sharedKeys = start.sharedKeys;
  let keys = new Set<string>();
  const inserted = start.inserted;
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
    ownBuckets = new Uint8Array(capacity).fill(1);
    threshold = Math.floor(capacity * 0.75);
  };
  const table: SymbolTable = {
    put: (entry) => {
      if (keys.has(entry.key) || sharedKeys.some((shared) => shared.has(entry.key))) return;
      if (inserted.length >= threshold) rehash();
      const index = entry.hash % buckets.length;
      if (ownBuckets[index] === 0) {
        buckets[index] = buckets[index].slice();
        ownBuckets[index] = 1;
      }
      buckets[index].push(entry);
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
    fork: () => {
      if (keys.size > 0) {
        sharedKeys = [...sharedKeys, keys];
        keys = new Set();
      }
      ownBuckets.fill(0);
      return createSymbolTable({
        buckets: buckets.slice(),
        threshold,
        sharedKeys,
        inserted: inserted.slice(),
        isForked: true,
      });
    },
  };
  return table;
};

const createEntry = (name: string, kind: SymbolKind, isLocal: boolean): SymbolEntry => ({
  key: kind === "module" ? `module ${name}` : name,
  name,
  hash: getJavaHashCode(name) & 0x7fffffff,
  kind,
  isLocal,
});

// The tokens of a module as TLC's order reads them, by index: the lexer's tokens until the
// module is parsed, and after that their kinds, texts and positions in flat arrays, which hold a
// fraction of the memory that a module's millions of token objects take.
interface TokenList {
  length: number;
  getKind: (index: number) => Token["kind"] | undefined;
  getText: (index: number) => string | undefined;
  getLine: (index: number) => number;
  getColumn: (index: number) => number;
}

// The lexer's tokens from start to end, as a list.
const listTokens = (tokens: Token[], start = 0, end = tokens.length): TokenList => ({
  length: end - start,
  getKind: (index) => (index >= 0 && index < end - start ? tokens[start + index].kind : undefined),
  getText: (index) => (index >= 0 && index < end - start ? tokens[start + index].text : undefined),
  getLine: (index) => tokens[start + index].line,
  getColumn: (index) => tokens[start + index].column,
});

const TOKEN_KINDS: Token["kind"][] = [
  "Identifier",
  "Number",
  "Decimal",
  "String",
  "Operator",
  "Keyword",
  "Step",
  "Separator",
  "ModuleEnd",
  "End",
];

// The lexer's tokens in flat arrays, as a list that keeps none of the tokens' objects.
const packTokens = (tokens: Token[]): TokenList => {
  const kinds = new Uint8Array(tokens.length);
  const lines = new Int32Array(tokens.length);
  const columns = new Int32Array(tokens.length);
  const texts = tokens.map((token, index) => {
    kinds[index] = TOKEN_KINDS.indexOf(token.kind);
    lines[index] = token.line;
    columns[index] = token.column;
    return token.text;
  });
  return {
    length: tokens.length,
    getKind: (index) =>
      index >= 0 && index < texts.length ? TOKEN_KINDS[kinds[index]] : undefined,
    getText: (index) => (index >= 0 && index < texts.length ? texts[index] : undefined),
    getLine: (index) => lines[index],
    getColumn: (index) => columns[index],
  };
};

// The tokens of a list from start to end, as a list.
const sliceTokens = (tokens: TokenList, start: number, end: number): TokenList => ({
  length: end - start,
  getKind: (index) =>
    index >= 0 && index < end - start ? tokens.getKind(start + index) : undefined,
  getText: (index) =>
    index >= 0 && index < end - start ? tokens.getText(start + index) : undefined,
  getLine: (index) => tokens.getLine(start + index),
  getColumn: (index) => tokens.getColumn(start + index),
});

const getInstancedEntries = (table: SymbolTable) => {
  const entries = table.enumerate();
  return [
    ...entries.filter((entry) => entry.kind === "definition"),
    ...entries.filter((entry) => entry.kind === "theorem"),
  ];
};

const getDeclaredName = (tokens: TokenList, start: number) => {
  const first = tokens.getText(start) ?? "";
  const second = tokens.getText(start + 1);
  if (first === "_" && tokens.getKind(start + 1) === "Operator") {
    return tokens.getText(start + 2) === "_"
      ? { name: getCanonicalName(second ?? ""), end: start + 3 }
      : { name: second ?? "", end: start + 2 };
  }
  if (tokens.getKind(start) === "Operator") {
    return { name: first === "-" ? "-." : getCanonicalName(first), end: start + 2 };
  }
  if (second !== "(") return { name: first, end: start + 1 };
  let close = start + 2;
  while (close < tokens.length && tokens.getText(close) !== ")") close++;
  return { name: first, end: close + 1 };
};

// The kind of symbol that each declaring keyword declares.
const DECLARATION_KINDS = new Map<string, SymbolKind>([
  ["CONSTANT", "constant"],
  ["CONSTANTS", "constant"],
  ["VARIABLE", "variable"],
  ["VARIABLES", "variable"],
]);

const getDeclarations = (tokens: TokenList, start: number) => {
  const names: string[] = [];
  for (let index = start; ;) {
    const declared = getDeclaredName(tokens, index);
    names.push(declared.name);
    if (tokens.getText(declared.end) !== ",") return names;
    index = declared.end + 1;
  }
};

const getLocation = (tokens: TokenList, index: number) => ({
  line: tokens.getLine(index),
  column: tokens.getColumn(index),
});

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
  tokens: TokenList,
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
      const kind = tokens.getKind(index);
      const text = tokens.getText(index);
      if (kind === "ModuleEnd") return { references, end: index };
      if (kind === "Separator" && tokens.getText(index + 1) === "MODULE") {
        const name = tokens.getText(index + 2) ?? "";
        const inner = read(index, `${key}/${name}`);
        innerModules.set(name, inner.references);
        references.inner.push(inner.references);
        index = inner.end;
        continue;
      }
      if (tokens.getText(index - 1) === ".") continue;
      if (text === "EXTENDS" && tokens.getText(index - 3) === "MODULE") {
        const names = getDeclarations(tokens, index + 1);
        references.extends.push(...names);
        names.forEach((name) => allExtends.add(name));
      } else if (text === "INSTANCE" && tokens.getKind(index + 1) === "Identifier") {
        references.instances.push(tokens.getText(index + 1) ?? "");
      }
    }
    return { references, end: tokens.length };
  };
  return read(0, unit ?? "").references;
};

const isAdjacent = (tokens: TokenList, left: number, right: number) =>
  right < tokens.length &&
  tokens.getLine(right) === tokens.getLine(left) &&
  tokens.getColumn(right) === tokens.getColumn(left) + (tokens.getText(left) ?? "").length;

const STRING_ESCAPES: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
  "\n": "\\n",
  "\t": "\\t",
  "\r": "\\r",
  "\f": "\\f",
};

const getTokenTexts = (tokens: TokenList) => {
  const texts: string[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const text = tokens.getText(index) ?? "";
    const isStepLabel =
      text === "<" &&
      isAdjacent(tokens, index, index + 1) &&
      /^(\d+|\*|\+)$/.test(tokens.getText(index + 1) ?? "") &&
      tokens.getText(index + 2) === ">" &&
      isAdjacent(tokens, index + 1, index + 2);
    if (isStepLabel) {
      index += isAdjacent(tokens, index + 2, index + 3) ? 3 : 2;
      continue;
    }
    const isHeader = text === "MODULE" && tokens.getKind(index - 1) === "Separator";
    if (isHeader) continue;
    texts.push(
      tokens.getKind(index) === "String"
        ? `"${text.replace(/[\\"\n\t\r\f]/g, (character) => STRING_ESCAPES[character])}"`
        : text,
    );
  }
  return texts;
};

export const getParsedTexts = (tokens: Token[]) => getTokenTexts(listTokens(tokens));

const getModuleName = (tokens: TokenList) => tokens.getText(2);

// The texts of a list's string literals, in their order.
const getStrings = (tokens: TokenList) => {
  const strings: string[] = [];
  for (let index = 0; index < tokens.length; index++) {
    if (tokens.getKind(index) === "String") strings.push(tokens.getText(index) ?? "");
  }
  return strings;
};

const getRanges = (tokens: TokenList) => {
  const ranges = new Map<string, { start: number; end: number }>();
  const open: { name: string; start: number }[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const kind = tokens.getKind(index);
    if (kind === "Separator" && tokens.getText(index + 1) === "MODULE") {
      open.push({ name: tokens.getText(index + 2) ?? "", start: index });
    }
    const closed = kind === "ModuleEnd" ? open.pop() : undefined;
    if (closed && !ranges.has(closed.name)) {
      ranges.set(closed.name, { start: closed.start, end: index + 1 });
    }
  }
  return ranges;
};

const findModule = (modules: Module[], name: string): Module | undefined =>
  modules.find((module) => module.name === name) ??
  modules.map((module) => findModule(module.modules, name)).find(Boolean);

interface ModuleText {
  getTokens: () => TokenList;
  ranges: Map<string, { start: number; end: number }>;
  getModule: () => Module;
}

// A module's text, read into its tokens, which, once the module is parsed, its list holds in flat
// arrays rather than the lexer's objects.
const readModuleText = (text: string | undefined): ModuleText => {
  let tokens = text === undefined ? [] : tokenize(text);
  let list = listTokens(tokens);
  let parsedModule: Module | undefined;
  return {
    getTokens: () => list,
    ranges: getRanges(list),
    getModule: () => {
      if (parsedModule !== undefined) return parsedModule;
      parsedModule = text === undefined ? parseModule("") : parseModuleTokens(text, tokens);
      list = packTokens(tokens);
      tokens = [];
      return parsedModule;
    },
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
        getTokens: () => listTokens([]),
        start: 0,
        end: 0,
        isNested: false,
        isTreeOnly: true,
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
          getTokens: () => listTokens(preparedModule.tokens),
          ranges: getRanges(listTokens(preparedModule.tokens)),
          getModule: () => preparedModule.module,
        }
      : readModuleText(text);
    const range = moduleText.ranges.get(getModuleName(moduleText.getTokens()) ?? "") ?? {
      start: 0,
      end: 0,
    };
    const file = {
      getTokens: moduleText.getTokens,
      ...range,
      isNested: false,
      isTreeOnly: preparedModule !== undefined && preparedModule.tokens.length === 0,
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
        getTokens: moduleText.getTokens,
        ...nestedRange,
        isNested: true,
        isTreeOnly: false,
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

// The contexts of the modules, from those that a check of a group's base built.
const createContexts = (
  getParsed: ModuleSet,
  shared: SharedContexts = { tables: new Map(), starts: new Map() },
) => {
  const getUnits = (unit: ParsedModule) => {
    const module = unit.getModule();
    const tokens = unit.getTokens();
    const units: ModuleUnit[] = [];
    const statementLocations: SourceLocation[] = [];
    const declare = (index: number, kind: SymbolKind) => {
      const names = getDeclarations(tokens, index + 1);
      units.push({
        location: getLocation(tokens, index),
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
      const tokenKind = tokens.getKind(index);
      const text = tokens.getText(index) ?? "";
      if (tokenKind === "Separator" && tokens.getText(index + 1) === "MODULE") {
        depth++;
        if (depth === 2) {
          const name = tokens.getText(index + 2) ?? "";
          units.push({
            location: getLocation(tokens, index),
            apply: (table) => table.put(createEntry(name, "module", false)),
          });
        }
        continue;
      }
      if (tokenKind === "ModuleEnd") depth--;
      if (depth !== 1 || tokenKind !== "Keyword") continue;
      const kind = DECLARATION_KINDS.get(text);
      if (
        kind !== undefined &&
        declarationKeywords.has(`${tokens.getLine(index)}:${tokens.getColumn(index)}`)
      ) {
        declare(index, kind);
      }
      if (text === "RECURSIVE") {
        const names = getDeclarations(tokens, index + 1);
        if (names.every((name) => recursiveNames.has(name))) declare(index, "definition");
      }
      const isNamedTheorem =
        THEOREM_KEYWORDS.has(text) &&
        tokens.getKind(index + 1) === "Identifier" &&
        tokens.getText(index + 2) === "==";
      if (isNamedTheorem) {
        const name = tokens.getText(index + 1) ?? "";
        statementLocations.push(getLocation(tokens, index));
        units.push({
          location: getLocation(tokens, index),
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
          const prefix = instance.name === undefined ? "" : `${instance.name}!`;
          getInstancedEntries(getContext(instance.module)).forEach((entry) => {
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
  // The number of entries that each context took from its group's start, by module name.
  const startLengths = new Map<string, number>();
  // SANY copies the builtins into a file module's context, but an inner module's context starts
  // empty, and then the contexts of the modules it extends.
  const putStart = (table: SymbolTable, unit: ParsedModule, extended: readonly string[]) => {
    if (!unit.isNested) {
      SANY_BUILTINS.toReversed().forEach((builtin) =>
        table.put(createEntry(builtin, "builtin", false)),
      );
    }
    extended.forEach((name) =>
      getContext(name).inserted.forEach((entry) => {
        if (!entry.isLocal) table.put(entry);
      }),
    );
  };
  const getContext = (name: string | undefined): SymbolTable => {
    const cached =
      contexts.get(name ?? "") ?? (name === undefined ? undefined : shared.tables.get(name));
    if (cached) return cached;
    const unit = getParsed(name);
    const extended = unit.getModule().extends;
    const start = shared.starts.get(name ?? "");
    const isStarted =
      start !== undefined &&
      !unit.isNested &&
      start.extended.every((other, index) => extended[index] === other && shared.tables.has(other));
    const table = isStarted ? start.table.fork() : createSymbolTable();
    contexts.set(name ?? "", table);
    if (isStarted) {
      startLengths.set(name ?? "", table.inserted.length);
      putStart(table, unit, extended.slice(start.extended.length));
    } else putStart(table, unit, extended);
    table.ownStart = table.inserted.length;
    getUnits(unit).forEach((item) => item.apply(table));
    return table;
  };
  return {
    getContext,
    getStartLength: (name: string | undefined) => {
      getContext(name);
      return startLengths.get(name ?? "");
    },
    // The contexts that the check of each file of a group whose base this is reads: those of the
    // modules but the root and ownModule, and the starts of those two, from their builtins and the
    // modules they extend before ownModule.
    getSharedContexts: (ownModule: string): SharedContexts => {
      getContext(undefined);
      return {
        tables: new Map([...contexts].filter((entry) => entry[0] !== "" && entry[0] !== ownModule)),
        starts: new Map(
          ["", ownModule].map((name) => {
            const unit = getParsed(name === "" ? undefined : name);
            const extended = unit.getModule().extends;
            const before = extended.includes(ownModule)
              ? extended.slice(0, extended.indexOf(ownModule))
              : extended;
            const table = createSymbolTable();
            putStart(table, unit, before);
            return [name, { extended: before, table }];
          }),
        ),
      };
    },
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
    getParsed(name).texts?.parsed ?? getTokenTexts(getUnitTokens(name));
  const getUnitStrings = (name: string | undefined) =>
    getParsed(name).texts?.strings ?? getStrings(getUnitTokens(name));
  const getUnitTokens = (name: string | undefined) => {
    const unit = getParsed(name);
    const tokens = unit.getTokens();
    return unit.start === 0 && unit.end === tokens.length
      ? tokens
      : sliceTokens(tokens, unit.start, unit.end);
  };
  const innerModules = new Map<string, ModuleReferences>();
  const unitReferences = new Map<string | undefined, ModuleReferences>();
  const getUnitReferences = (name: string | undefined) => {
    const cached = unitReferences.get(name);
    if (cached) return cached;
    const unit = getParsed(name);
    const module = unit.isTreeOnly ? unit.getModule() : undefined;
    const references = module
      ? {
          key: name ?? "",
          unit: name,
          extends: module.extends,
          instances: module.instances.map((instance) => instance.module),
          inner: [],
          allExtends: new Set(module.extends),
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
  getTokenTexts(getUnitTokens(undefined)).forEach((text, index) => {
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
    if (getParsed(name).getTokens().length === 0 && !getParsed(name).isTreeOnly) {
      const importer = module.unit ?? getModuleName(getParsed(undefined).getTokens());
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
    getTokenTexts(tokens).forEach(intern);
    getStrings(tokens).forEach(intern);
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
  // The definitions of a module's context after those it took from its group's start, or undefined
  // where it took none.
  getDefinitionsAfterStart: (module: string | undefined) => string[] | undefined;
  getInstanceDeclarations: (module: string) => string[];
  getInstanceDefinitions: (module: string) => string[];
  getInnerModuleOrder: (module: string | undefined) => string[];
  createDefinitionOrder: () => (name: string | undefined) => string[];
  // The contexts that the check of each file of a group whose base this check is reads.
  getSharedContexts: (ownModule: string) => SharedContexts;
  getModule: (name: string | undefined, source: string) => Module;
  parseFile: (source: string, name: string) => Module;
  getLoadedSource: (name: string) => string | undefined;
  getPreparedModule: (name: string) => PreparedModule | undefined;
}

// The orders of a spec's modules, with the contexts of a group's base's modules, which their own
// modules make in each spec alike.
export const createTlcOrder = (
  source: string | Module,
  loadModule: ModuleLoader,
  prepared: readonly PreparedModule[] = [],
  sharedContexts?: SharedContexts,
): TlcOrder => {
  const modules = createModuleSet(source, loadModule, prepared);
  const getParsed = modules.getParsed;
  let contexts: ReturnType<typeof createContexts> | undefined;
  const getContexts = () => (contexts ??= createContexts(getParsed, sharedContexts));
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
    getDefinitionsAfterStart: (module) => {
      const moduleContexts = getContexts();
      const length = moduleContexts.getStartLength(module);
      return length === undefined
        ? undefined
        : moduleContexts
            .getContext(module)
            .inserted.slice(length)
            .filter((entry) => entry.kind === "definition")
            .map((entry) => entry.name);
    },
    getInstanceDeclarations: (module) =>
      getContexts()
        .getContext(module)
        .enumerate()
        .filter((entry) => entry.kind === "constant" || entry.kind === "variable")
        .map((entry) => entry.name),
    getInstanceDefinitions: (module) =>
      getInstancedEntries(getContexts().getContext(module)).map((entry) => entry.name),
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
    getSharedContexts: (ownModule) => getContexts().getSharedContexts(ownModule),
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
