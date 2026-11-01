import {
  formatSanyLocation,
  getContextSymbol,
  type ModuleNode,
  type OpApplNode,
  type SanyMessage,
  type SemanticNode,
} from "./sany-nodes";

// A port of SANY's tla2sany.linter.Linter, which warns about a record field named like a
// definition or declaration of the module.

// SemanticNode.getChildren.
const getChildren = (node: SemanticNode): (SemanticNode | undefined)[] => {
  switch (node.kind) {
    case "OpAppl":
      return [...node.ranges, ...node.operands];
    case "OpDef":
    case "ThmOrAssumpDef":
    case "Label":
      return [node.body];
    case "LetIn":
      return [...node.opDefs, ...node.instances, node.body];
    case "SubstIn":
    case "APSubstIn":
      return [node.body, ...node.substs.map((subst) => subst.expr)];
    case "Instance":
      return node.substs.map((subst) => subst.expr);
    case "AssumeProve":
      return [...node.assumptions, node.goal];
    case "NewSymb":
      return [node.set];
    default:
      return [];
  }
};

// Operators whose values are sets of values that a record field may range over.
const SET_OPERATORS = new Map([
  ["Integers", "Int"],
  ["Naturals", "Nat"],
  // SANY compares the name of the definition with the module's, so no definition of Reals counts.
  ["Reals", "Reals"],
]);

// Linter.isBuiltFromDeclarations: whether an expression applies a declared or bound symbol, BOOLEAN
// or a standard set of numbers, directly or through the definitions it applies.
const isBuiltFromDeclarations = (node: SemanticNode | undefined) => {
  const visited = new Set<SemanticNode>();
  const visit = (current: SemanticNode | undefined): boolean => {
    if (current === undefined || visited.has(current)) return false;
    visited.add(current);
    if (current.kind === "OpAppl") {
      const operator = current.operator;
      if (operator.kind === "OpDecl" || operator.kind === "FormalParam") return true;
      if (operator.kind === "OpDef") {
        if (operator.name === "BOOLEAN") return true;
        const moduleName = operator.module?.name;
        if (moduleName !== undefined && SET_OPERATORS.get(moduleName) === operator.name)
          return true;
        if (visit(operator)) return true;
      }
    }
    return getChildren(current).some(visit);
  };
  return visit(node);
};

const getFieldPairs = (record: OpApplNode) =>
  record.operands.filter((operand): operand is OpApplNode => operand?.kind === "OpAppl");

const getFieldName = (pair: OpApplNode) => {
  const name = pair.operands[0];
  return name?.kind === "String" ? name : undefined;
};

// Records.sameDomain.
const isSameDomain = (record: OpApplNode, other: OpApplNode) => {
  if (record === other) return true;
  if (record.operands.length !== other.operands.length) return false;
  const names = new Set(getFieldPairs(other).map((pair) => getFieldName(pair)?.value));
  return getFieldPairs(record).every((pair) => names.has(getFieldName(pair)?.value));
};

// ModuleNode.getExtendedModuleSet(true).
const getExtendedModules = (module: ModuleNode, found = new Set<ModuleNode>()) => {
  module.extendees.forEach((extendee) => {
    if (found.has(extendee)) return;
    found.add(extendee);
    getExtendedModules(extendee, found);
  });
  return found;
};

// Linter.lintRecords: the warnings for the records of a module.
export const lintSanyModule = (module: ModuleNode): SanyMessage[] => {
  const allRecords = [
    ...[...getExtendedModules(module)].flatMap((extended) => extended.records),
    ...module.records,
  ];
  return module.records.flatMap((record) => {
    // Linter checks the field's value, the record's fields and the fields of every record with the
    // same domain, which includes the record itself.
    const isExempt = allRecords
      .filter((other) => isSameDomain(other, record))
      .flatMap(getFieldPairs)
      .some(isBuiltFromDeclarations);
    if (isExempt) return [];
    return getFieldPairs(record).flatMap((pair) => {
      const name = getFieldName(pair);
      const symbol = name && getContextSymbol(module.context, name.value);
      if (name === undefined || symbol === undefined) return [];
      return [
        {
          location: name.location,
          text: `The field name "${name.value}" in the record constructor is identical to the existing definition or declaration\nnamed ${name.value}, located at ${formatSanyLocation(symbol.location)}.\nThe field in the record will not take the value of the ${name.value} definition or declaration.\nIn TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.\nTherefore, DOMAIN [${name.value} |-> ...] = {"${name.value}"} holds true.`,
          isWarning: true,
        },
      ];
    });
  });
};
