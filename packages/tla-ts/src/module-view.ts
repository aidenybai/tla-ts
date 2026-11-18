import type { Definition, Module, ModuleUnit, SourceLocation } from "./ast";
import type { Token } from "./lexer";
import { parseModule } from "./parser";
import { getParsedTexts, type PreparedModule } from "./tlc/order";

// The body of a definition that a view stands in for one whose value the prepared module carries,
// which a check never evaluates, and which fails if it did: CHOOSE from the empty set.
const STAND_IN_BODY = parseModule(
  "---- MODULE StandIn ----\nStandIn == CHOOSE value \\in {} : TRUE\n====",
).definitions[0].body;

// Characters and operators whose presence in a definition changes how TLC fingerprints strings.
const WIDE_TOKEN = /[\u0100-\uffff]|^(?:nd)?JsonDeserialize$/;

// The names that a text reads, of the definitions of a prepared module, which name each with a
// capital.
const getReadNames = (text: string) => [...(text.match(/\b[A-Z]\w*\b/g) ?? [])];

const getUnitLocation = (unit: ModuleUnit): SourceLocation => {
  switch (unit.kind) {
    case "Definition":
      return unit.definition.location;
    case "Instance":
      return unit.instance.location;
    case "Assumption":
      return unit.assumption.location;
    case "Theorem":
      return unit.theorem.location;
    case "Use":
      return unit.use.location;
    case "Module":
      return unit.module.location;
    default:
      return unit.location;
  }
};

const getUnitNames = (unit: ModuleUnit) =>
  unit.kind === "Definition"
    ? [unit.definition.name]
    : unit.kind === "Recursive"
      ? unit.declarations.map((declaration) => declaration.name)
      : [];

// The module that the units kept leave, which is what reading the module's text with every other
// line blank gives.
const getModuleView = (module: Module, isKept: (location: SourceLocation) => boolean): Module => ({
  ...module,
  modules: module.modules.filter((nested) => isKept(nested.location)),
  constants: module.constants.filter((constant) => isKept(constant.location)),
  variables: module.variables.filter((variable) => isKept(variable.location)),
  definitions: module.definitions.filter((definition) => isKept(definition.location)),
  instances: module.instances.filter((instance) => isKept(instance.location)),
  assumptions: module.assumptions.filter((assumption) => isKept(assumption.location)),
  theorems: module.theorems.filter((theorem) => isKept(theorem.location)),
  uses: module.uses.filter((use) => isKept(use.location)),
  units: module.units.filter((unit) => isKept(getUnitLocation(unit))),
});

const getNameIds = (nameIds: ReadonlyMap<string, number>, names: string[]) =>
  Int32Array.from(new Set(names.flatMap((name) => nameIds.get(name) ?? [])));

// The tables that a module's views are made of, which hold none of the prepared module but what
// its views keep of it.
const readModule = (prepared: PreparedModule) => {
  // The lines of the module in units: the header, each top-level unit as the parser read it, and
  // the line that closes the module. A unit holds every line up to the next one, so its lines stay
  // together whatever their layout.
  const moduleLines = prepared.text.split("\n");
  // The column of each line's first token, before which a line that starts a unit holds only
  // blanks, not the end of a comment that a unit before it opened.
  const firstColumns = new Int32Array(moduleLines.length).fill(-1);
  for (let index = prepared.tokens.length - 1; index >= 0; index--) {
    firstColumns[prepared.tokens[index].line - 1] = prepared.tokens[index].column;
  }
  const isCleanStart = (line: number) =>
    moduleLines[line].slice(0, firstColumns[line] - 1).trim() === "";
  const unitStartNames = new Map<number, string[]>([[0, []]]);
  const addUnitStart = (line: number, names: string[]) => {
    const start = isCleanStart(line) ? line : Math.max(...unitStartNames.keys());
    unitStartNames.set(start, [...(unitStartNames.get(start) ?? []), ...names]);
  };
  prepared.module.units.forEach((unit) =>
    addUnitStart(getUnitLocation(unit).line - 1, getUnitNames(unit)),
  );
  addUnitStart(prepared.tokens[prepared.tokens.length - 1].line - 1, []);
  const unitStarts = [...unitStartNames.keys()].sort((left, right) => left - right);
  const moduleUnits = unitStarts.map((start, position) => {
    const lines = moduleLines.slice(start, unitStarts[position + 1]);
    return {
      lines,
      names: unitStartNames.get(start) ?? [],
      // A RECURSIVE declaration reads nothing; the definition it declares reads what it reads.
      reads: lines[0].startsWith("RECURSIVE ") ? [] : getReadNames(lines.join("\n")),
    };
  });
  // An id for each name a unit declares, and the units that declare each.
  const nameIds = new Map<string, number>();
  moduleUnits.forEach((unit) =>
    unit.names.forEach((name) => nameIds.set(name, nameIds.get(name) ?? nameIds.size)),
  );
  const nameUnits = Array.from({ length: nameIds.size }, (): number[] => []);
  moduleUnits.forEach((unit, position) =>
    unit.names.forEach((name) => nameUnits[nameIds.get(name) ?? 0].push(position)),
  );
  const unitNameIds = moduleUnits.map((unit) => getNameIds(nameIds, unit.names));
  const unitReadIds = moduleUnits.map((unit) => getNameIds(nameIds, unit.reads));
  // A unit that defines nothing, such as the header or an ASSUME, stays with what it reads.
  const rootReadIds = getNameIds(
    nameIds,
    moduleUnits.filter((unit) => unit.names.length === 0).flatMap((unit) => unit.reads),
  );
  // The unit of each line, and each unit's text, or the newlines that stand for it where a view
  // leaves it out.
  const lineUnits = new Int32Array(moduleLines.length);
  unitStarts.forEach((start, position) =>
    lineUnits.fill(position, start, start + moduleUnits[position].lines.length),
  );
  const unitTexts = moduleUnits.map((unit) => unit.lines.join("\n"));
  const unitBlanks = moduleUnits.map((unit) => "\n".repeat(unit.lines.length - 1));
  // Where each unit's tokens start in the module's tokens, which follow one another by line, and
  // where the last one ends.
  const unitTokenStarts = new Int32Array(moduleUnits.length + 1);
  for (let index = 0, unit = 0; index <= prepared.tokens.length; index++) {
    const line =
      index < prepared.tokens.length ? prepared.tokens[index].line - 1 : moduleLines.length;
    while (unit < moduleUnits.length && line >= unitStarts[unit] + moduleUnits[unit].lines.length) {
      unitTokenStarts[++unit] = index;
    }
  }
  // The texts each unit adds to TLC's order of strings, each once in the order it first comes.
  const unitTextsInOrder = moduleUnits.map((_unit, unit) => {
    const tokens = prepared.tokens.slice(unitTokenStarts[unit], unitTokenStarts[unit + 1]);
    return {
      parsed: [...new Set(getParsedTexts(tokens))],
      strings: [
        ...new Set(tokens.flatMap((token) => (token.kind === "String" ? [token.text] : []))),
      ],
    };
  });
  const values = prepared.values ?? new Map();
  const definitions = new Map(
    prepared.module.definitions.map((definition) => [definition.name, definition]),
  );
  const isStoodIn = moduleUnits.map(
    (unit, position) =>
      unit.names.length > 0 &&
      unit.names.every((name) => {
        const definition = definitions.get(name);
        return (
          definition?.kind === "Operator" &&
          definition.params.length === 0 &&
          values.has(definition)
        );
      }) &&
      !prepared.tokens
        .slice(unitTokenStarts[position], unitTokenStarts[position + 1])
        .some((token) => WIDE_TOKEN.test(token.text)),
  );
  const standIns = new Map<Definition, Definition>(
    prepared.module.definitions.flatMap((definition) =>
      definition.kind === "Operator" && isStoodIn[lineUnits[definition.location.line - 1]]
        ? [[definition, { ...definition, body: STAND_IN_BODY }]]
        : [],
    ),
  );
  const getStandIn = (definition: Definition) => standIns.get(definition) ?? definition;
  const module: Module = {
    ...prepared.module,
    definitions: prepared.module.definitions.map(getStandIn),
    units: prepared.module.units.map((unit) =>
      unit.kind === "Definition" ? { ...unit, definition: getStandIn(unit.definition) } : unit,
    ),
  };
  // A view of a module that carries values adds all of the module's texts to TLC's order of
  // strings, which its values' strings keep the order of.
  const allTexts = prepared.texts ?? {
    parsed: unitTextsInOrder.flatMap((texts) => texts.parsed),
    strings: unitTextsInOrder.flatMap((texts) => texts.strings),
  };
  const viewValues = new Map([...values].map((entry) => [getStandIn(entry[0]), entry[1]]));
  isStoodIn.forEach((isUnitStoodIn, unit) => {
    if (isUnitStoodIn) unitReadIds[unit] = new Int32Array(0);
  });
  // The tokens of each unit, which a view keeps, but for those of a definition it stands in.
  const unitTokens = moduleUnits.map((_unit, unit) =>
    isStoodIn[unit] ? [] : prepared.tokens.slice(unitTokenStarts[unit], unitTokenStarts[unit + 1]),
  );
  const hasValues = values.size > 0;
  const name = prepared.name;
  const levels = prepared.levels;
  return {
    nameIds,
    nameUnits,
    unitNameIds,
    unitReadIds,
    rootReadIds,
    lineUnits,
    unitTexts,
    unitBlanks,
    unitTextsInOrder,
    unitTokens,
    module,
    values: viewValues,
    allTexts,
    hasValues,
    name,
    levels,
  };
};

// Views of a prepared module, each with only the definitions that a text reads, directly or
// through other definitions, so that a check reads and analyzes only those. A view keeps a leaf
// that it reaches without what the leaf reads, for a spec that overrides the leaf. A definition
// whose value the prepared module carries reads nothing in a view, which keeps its line and stands
// it in for one without its body or tokens. Every other line of a view is blank, so each definition
// keeps its line. Its tokens, syntax tree, levels, and values are those of the prepared module on
// the lines kept.
export const createModuleView = (prepared: PreparedModule) => {
  const tables = readModule(prepared);
  return (text: string, leaves: readonly string[] = []): PreparedModule => {
    const isLeaf = new Uint8Array(tables.nameIds.size);
    getNameIds(tables.nameIds, [...leaves]).forEach((name) => {
      isLeaf[name] = 1;
    });
    const keptNames = new Uint8Array(tables.nameIds.size);
    const pending = [...getNameIds(tables.nameIds, getReadNames(text)), ...tables.rootReadIds];
    while (pending.length > 0) {
      const name = pending.pop() ?? 0;
      if (keptNames[name] === 1) continue;
      keptNames[name] = 1;
      if (isLeaf[name] === 1) continue;
      for (const unit of tables.nameUnits[name]) pending.push(...tables.unitReadIds[unit]);
    }
    const keptUnits = Uint8Array.from(tables.unitNameIds, (names) =>
      names.length === 0 || names.some((name) => keptNames[name] === 1) ? 1 : 0,
    );
    const isKept = (location: SourceLocation) =>
      keptUnits[tables.lineUnits[location.line - 1]] === 1;
    const tokens: Token[] = [];
    keptUnits.forEach((isUnitKept, unit) => {
      if (isUnitKept === 0) return;
      for (const token of tables.unitTokens[unit]) tokens.push(token);
    });
    return {
      name: tables.name,
      text: tables.unitTexts
        .map((unitText, unit) => (keptUnits[unit] === 1 ? unitText : tables.unitBlanks[unit]))
        .join("\n"),
      tokens,
      module: getModuleView(tables.module, isKept),
      texts: tables.hasValues
        ? tables.allTexts
        : {
            parsed: tables.unitTextsInOrder.flatMap((texts, unit) =>
              keptUnits[unit] === 1 ? texts.parsed : [],
            ),
            strings: tables.unitTextsInOrder.flatMap((texts, unit) =>
              keptUnits[unit] === 1 ? texts.strings : [],
            ),
          },
      levels: tables.levels?.filter((_levels, position) =>
        isKept(tables.module.definitions[position].location),
      ),
      values: tables.values,
    };
  };
};
