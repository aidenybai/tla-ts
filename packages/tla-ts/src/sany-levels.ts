import {
  getOpDefs,
  getThmOrAssumpDefs,
  type ExprOrOpArgNode,
  type LevelFields,
  type ModuleNode,
  type OpApplNode,
  type OpDefNode,
  type SemanticNode,
  type SymbolNode,
  type ThmOrAssumpDefNode,
} from "./sany-nodes";

// A port of the levelCheck methods of SANY's semantic nodes, for the levels, weights and Leibniz
// flags its XMLExporter writes. It leaves out level constraints, which only produce level errors,
// and the levels of arguments of higher-order operators.

const addAll = <Item>(target: Set<Item>, source: Iterable<Item>) => {
  for (const item of source) target.add(item);
};

const isLevelNode = (node: SemanticNode): node is SemanticNode & LevelFields =>
  node.kind !== "Module";

const getWeight = (definition: OpDefNode | ThmOrAssumpDefNode, index: number) =>
  definition.kind === "OpDef" ? (definition.weights[definition.arity < 0 ? 0 : index] ?? 0) : 0;

const isLeibnizArgument = (definition: OpDefNode | ThmOrAssumpDefNode, index: number) =>
  definition.kind === "OpDef"
    ? (definition.isLeibnizArg?.[definition.arity < 0 ? 0 : index] ?? true)
    : true;

const getBoundSymbols = (node: OpApplNode) => [
  ...(node.unbounded ?? []),
  ...(node.bounded ?? []).flat(),
];

const checkApplication = (node: OpApplNode, iteration: number) => {
  if (node.levelChecked >= iteration) return;
  node.levelChecked = iteration;
  const operands = node.operands.filter(
    (operand): operand is ExprOrOpArgNode => operand !== undefined,
  );
  operands.forEach((operand) => checkLevel(operand, iteration));
  node.ranges.forEach((range) => checkLevel(range, iteration));
  const operator = node.operator;
  if (operator.kind === "OpDef" || operator.kind === "ThmOrAssumpDef") {
    checkLevel(operator, iteration);
    node.level = node.operands.reduce(
      (level, operand, index) =>
        operand !== undefined && getWeight(operator, index) === 1
          ? Math.max(level, operand.level)
          : level,
      operator.level,
    );
    node.ranges.forEach((range) => {
      node.level = Math.max(node.level, range.level);
    });
    addAll(node.levelParams, operator.levelParams);
    addAll(node.allParams, operator.allParams);
    addAll(node.nonLeibnizParams, operator.nonLeibnizParams);
    node.operands.forEach((operand, index) => {
      if (operand === undefined) return;
      if (getWeight(operator, index) === 1) addAll(node.levelParams, operand.levelParams);
      addAll(node.allParams, operand.allParams);
      addAll(node.nonLeibnizParams, operand.nonLeibnizParams);
      if (!isLeibnizArgument(operator, index)) addAll(node.nonLeibnizParams, operand.allParams);
    });
    node.ranges.forEach((range) => {
      addAll(node.levelParams, range.levelParams);
      addAll(node.allParams, range.allParams);
      addAll(node.nonLeibnizParams, range.nonLeibnizParams);
    });
    getBoundSymbols(node).forEach((symbol) => {
      node.levelParams.delete(symbol);
      node.allParams.delete(symbol);
      node.nonLeibnizParams.delete(symbol);
    });
    return;
  }
  checkLevel(operator, iteration);
  node.level = operands.reduce(
    (level, operand) => Math.max(level, operand.level),
    operator.kind === "Module" ? 0 : operator.level,
  );
  node.levelParams = new Set([operator]);
  node.allParams.add(operator);
  operands.forEach((operand) => {
    addAll(node.levelParams, operand.levelParams);
    addAll(node.allParams, operand.allParams);
    addAll(node.nonLeibnizParams, operand.nonLeibnizParams);
  });
};

const checkDefinition = (node: OpDefNode, iteration: number) => {
  if (node.levelChecked >= iteration || (!node.inRecursiveSection && node.levelChecked > 0)) return;
  node.levelChecked = iteration;
  const body = node.body;
  if (body === undefined) return;
  checkLevel(body, iteration);
  node.level = Math.max(node.level, body.level);
  const params = node.params ?? [];
  params.forEach((param, index) => {
    if (body.levelParams.has(param)) node.weights[index] = Math.max(node.weights[index], 1);
  });
  addAll(node.levelParams, body.levelParams);
  addAll(node.allParams, body.allParams);
  addAll(node.nonLeibnizParams, body.nonLeibnizParams);
  params.forEach((param, index) => {
    node.levelParams.delete(param);
    node.allParams.delete(param);
    if (node.nonLeibnizParams.has(param)) {
      node.nonLeibnizParams.delete(param);
      if (node.isLeibnizArg) node.isLeibnizArg[index] = false;
      node.isLeibniz = false;
    }
  });
};

const checkTheoremDefinition = (node: ThmOrAssumpDefNode, iteration: number) => {
  if (node.levelChecked >= iteration) return;
  node.levelChecked = iteration;
  checkLevel(node.body, iteration);
  node.level = node.body.level;
  addAll(node.levelParams, node.body.levelParams);
  addAll(node.allParams, node.body.allParams);
  addAll(node.nonLeibnizParams, node.body.nonLeibnizParams);
  node.params.forEach((param) => {
    node.levelParams.delete(param);
    node.allParams.delete(param);
    node.nonLeibnizParams.delete(param);
  });
};

// ModuleNode.levelCheck: the definitions of each recursive section are checked twice, the second
// time with the highest level and the parameters of the section's recursive operators.
export const checkModuleLevels = (module: ModuleNode, iteration = 1) => {
  if (module.isLevelChecked) return;
  module.isLevelChecked = true;
  const sections = module.opDefsInRecursiveSection;
  let first = 0;
  while (first < sections.length) {
    const section = sections[first].recursiveSection;
    let end = first;
    while (end < sections.length && sections[end].recursiveSection === section) {
      const definition = sections[end];
      if (definition.inRecursive) {
        definition.levelChecked = 1;
        definition.weights = definition.weights.map(() => 1);
      } else definition.levelChecked = 0;
      end++;
    }
    const members = sections.slice(first, end);
    const levelParams = new Set<SymbolNode>();
    const allParams = new Set<SymbolNode>();
    let maxLevel = 0;
    members.forEach((definition) => {
      if (definition.inRecursive) definition.levelChecked = 0;
      checkDefinition(definition, 1);
      if (!definition.inRecursive) return;
      maxLevel = Math.max(maxLevel, definition.level);
      addAll(levelParams, definition.levelParams);
      addAll(allParams, definition.allParams);
    });
    members.forEach((definition) => {
      if (definition.inRecursive) definition.levelChecked = 2;
      definition.level = Math.max(definition.level, maxLevel);
      addAll(definition.levelParams, levelParams);
      addAll(definition.allParams, allParams);
    });
    members.forEach((definition) => {
      if (definition.inRecursive) definition.levelChecked = 1;
      checkDefinition(definition, 2);
    });
    first = end;
  }
  module.definitions
    .filter((definition): definition is ModuleNode => definition.kind === "Module")
    .forEach((inner) => checkModuleLevels(inner, iteration));
  getOpDefs(module).forEach((definition) => checkDefinition(definition, iteration));
  getThmOrAssumpDefs(module).forEach((definition) => checkTheoremDefinition(definition, iteration));
  module.topLevel.forEach((node) => checkLevel(node, iteration));
};

// LevelNode.levelCheckSubnodes, which skips modules.
const checkSubnodes = (node: LevelFields, subnodes: SemanticNode[], iteration: number) => {
  if (node.levelChecked >= iteration) return;
  node.levelChecked = iteration;
  subnodes.forEach((subnode) => {
    if (!isLevelNode(subnode)) return;
    if (subnode.kind === "OpDef" && subnode.defKind === "ModuleInstance") return;
    checkLevel(subnode, iteration);
    node.level = Math.max(node.level, subnode.level);
    addAll(node.levelParams, subnode.levelParams);
    addAll(node.allParams, subnode.allParams);
    addAll(node.nonLeibnizParams, subnode.nonLeibnizParams);
  });
};

export function checkLevel(node: SemanticNode, iteration: number): void {
  if (!isLevelNode(node)) {
    if (node.kind === "Module") checkModuleLevels(node, iteration);
    return;
  }
  switch (node.kind) {
    case "OpAppl":
      checkApplication(node, iteration);
      return;
    case "OpDef":
      checkDefinition(node, iteration);
      return;
    case "ThmOrAssumpDef":
      checkTheoremDefinition(node, iteration);
      return;
    case "FormalParam":
      if (node.levelChecked !== 0) return;
      node.levelChecked = iteration;
      node.levelParams.add(node);
      node.allParams.add(node);
      return;
    case "OpDecl":
      return;
    case "Numeral":
    case "String":
    case "Decimal":
      if (node.levelChecked < iteration) node.levelChecked = iteration;
      return;
    case "OpArg": {
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      const op = node.op;
      checkLevel(op, iteration);
      if (op.kind === "Module") return;
      node.level = op.level;
      node.levelParams = op.levelParams;
      node.allParams = op.allParams;
      return;
    }
    case "LetIn":
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      node.opDefs.forEach((definition) => {
        if (definition.kind !== "OpDef" || definition.defKind !== "ModuleInstance") {
          checkLevel(definition, iteration);
        }
      });
      checkLevel(node.body, iteration);
      node.instances.forEach((instance) => checkLevel(instance, iteration));
      node.level = node.body.level;
      node.levelParams = new Set(node.body.levelParams);
      node.allParams = new Set(node.body.allParams);
      return;
    case "Label":
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      node.params.forEach((param) => checkLevel(param, iteration));
      checkLevel(node.body, iteration);
      node.level = node.body.level;
      node.levelParams = node.body.levelParams;
      node.allParams = node.body.allParams;
      return;
    case "At": {
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      const args = node.except.operands;
      const first = args[0];
      if (first === undefined) return;
      checkLevel(first, iteration);
      node.level = first.level;
      addAll(node.levelParams, first.levelParams);
      addAll(node.allParams, first.allParams);
      for (const argument of args.slice(1)) {
        if (argument === undefined) continue;
        checkLevel(argument, iteration);
        if (argument === node.component) break;
        node.level = Math.max(node.level, argument.level);
        addAll(node.levelParams, argument.levelParams);
        addAll(node.allParams, argument.allParams);
      }
      return;
    }
    case "SubstIn":
    case "APSubstIn": {
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      const body = node.body;
      checkLevel(body, iteration);
      node.substs.forEach((subst) => checkLevel(subst.expr, iteration));
      node.level = node.substs.reduce(
        (level, subst) =>
          body.levelParams.has(subst.op) ? Math.max(level, subst.expr.level) : level,
        body.level,
      );
      body.levelParams.forEach((param) => {
        const subst = node.substs.find((candidate) => candidate.op === param);
        if (subst) addAll(node.levelParams, subst.expr.levelParams);
        else node.levelParams.add(param);
      });
      node.allParams = new Set(body.allParams);
      node.nonLeibnizParams = new Set(body.nonLeibnizParams);
      node.substs.forEach((subst) => {
        if (!node.allParams.has(subst.op)) return;
        node.allParams.delete(subst.op);
        addAll(node.allParams, subst.expr.allParams);
        addAll(node.nonLeibnizParams, subst.expr.nonLeibnizParams);
        if (node.nonLeibnizParams.has(subst.op)) {
          node.nonLeibnizParams.delete(subst.op);
          addAll(node.nonLeibnizParams, subst.expr.allParams);
        }
      });
      return;
    }
    case "Instance":
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      node.levelParams = new Set();
      checkModuleLevels(node.module, iteration);
      node.substs.forEach((subst) => checkLevel(subst.expr, iteration));
      return;
    case "Assume":
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      checkLevel(node.body, iteration);
      if (node.definition) checkLevel(node.definition, iteration);
      node.level = node.body.level;
      return;
    case "Theorem": {
      // TheoremNode declares its own levelChecked, so levelCheckSubnodes still runs on the
      // theorem's definition, or its statement when it has none, and its proof.
      if (node.levelChecked >= iteration) return;
      checkSubnodes(
        node,
        [node.definition ?? node.body, ...(node.proof ? [node.proof] : [])],
        iteration,
      );
      return;
    }
    case "LeafProof":
      checkSubnodes(node, node.facts, iteration);
      return;
    case "NonLeafProof":
      checkSubnodes(node, [...node.steps, ...node.instances], iteration);
      return;
    case "DefStep":
      checkSubnodes(node, node.defs, iteration);
      return;
    case "NewSymb":
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      node.level = node.declaration.level;
      if (node.set === undefined) return;
      checkLevel(node.set, iteration);
      node.level = Math.max(node.level, node.set.level);
      node.levelParams = node.set.levelParams;
      node.allParams = node.set.allParams;
      return;
    case "AssumeProve":
      if (node.levelChecked >= iteration) return;
      node.levelChecked = iteration;
      node.assumptions.forEach((assumption) => checkLevel(assumption, iteration));
      checkLevel(node.goal, iteration);
      node.level = node.assumptions.reduce(
        (level, assumption) => Math.max(level, assumption.level),
        node.goal.level,
      );
      [node.goal, ...node.assumptions].forEach((part) => {
        addAll(node.levelParams, part.levelParams);
        addAll(node.allParams, part.allParams);
      });
      return;
    case "UseOrHide":
      checkSubnodes(node, node.facts, iteration);
      return;
  }
}
