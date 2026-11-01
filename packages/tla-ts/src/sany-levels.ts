import { ACTION_LEVEL, CONSTANT_LEVEL, TEMPORAL_LEVEL, VARIABLE_LEVEL } from "./levels";
import {
  addSanyMessage,
  CONSTANT_DECL_KIND,
  VARIABLE_DECL_KIND,
  formatSanyLocation,
  getDeclarations,
  getOpDefs,
  getSymbolArity,
  getThmOrAssumpDefs,
  type ArgLevelConstraint,
  type ArgLevelParam,
  type ExprOrOpArgNode,
  type FormalParamNode,
  type InstanceNode,
  type LevelFields,
  type ModuleNode,
  type OpApplNode,
  type OpDeclNode,
  type OpDefNode,
  type ProofNode,
  type SanyLocation,
  type SanyMessage,
  type SemanticNode,
  type Subst,
  type SymbolNode,
  type ThmOrAssumpDefNode,
} from "./sany-nodes";

// A port of the levelCheck methods of SANY's semantic nodes: the levels, weights and Leibniz flags
// its XMLExporter writes, and the level errors it reports. Each check returns what SANY's returns,
// which is whether the node is free of level errors, or true for the nodes that ignore that.

type AnyDefNode = OpDefNode | ThmOrAssumpDefNode;

interface LevelCheck {
  messages: SanyMessage[];
  isTlc174: boolean;
}

const addError = (check: LevelCheck, location: SanyLocation, text: string, code?: string) =>
  addSanyMessage(check.messages, {
    location,
    text,
    isWarning: false,
    ...(code !== undefined && !check.isTlc174 && { code }),
  });

const addAll = <Item>(target: Set<Item>, source: Iterable<Item>) => {
  for (const item of source) target.add(item);
};

const getArgLevelKey = (op: SymbolNode, index: number, param: SymbolNode) =>
  `${op.id}:${index}:${param.id}`;

const addArgLevelParam = (
  target: Map<string, ArgLevelParam>,
  op: SymbolNode,
  index: number,
  param: SymbolNode,
) => {
  target.set(getArgLevelKey(op, index, param), { op, index, param });
};

const addArgLevelParams = (
  target: Map<string, ArgLevelParam>,
  source: Map<string, ArgLevelParam>,
  isIncluded: (argLevelParam: ArgLevelParam) => boolean = () => true,
) => {
  source.forEach((argLevelParam, key) => {
    if (isIncluded(argLevelParam)) target.set(key, argLevelParam);
  });
};

// SetOfLevelConstraints.put keeps the lowest bound.
const putLevelConstraint = (target: Map<SymbolNode, number>, param: SymbolNode, level: number) => {
  target.set(param, Math.min(level, target.get(param) ?? TEMPORAL_LEVEL));
};

const putLevelConstraints = (
  target: Map<SymbolNode, number>,
  source: Map<SymbolNode, number>,
  isIncluded: (param: SymbolNode) => boolean = () => true,
) => {
  source.forEach((level, param) => {
    if (isIncluded(param)) putLevelConstraint(target, param, level);
  });
};

const getArgLevelConstraintKey = (param: SymbolNode, position: number) => `${param.id}:${position}`;

// SetOfArgLevelConstraints.put keeps the highest bound.
const putArgLevelConstraint = (
  target: Map<string, ArgLevelConstraint>,
  param: SymbolNode,
  position: number,
  level: number,
) => {
  const key = getArgLevelConstraintKey(param, position);
  const old = target.get(key)?.level ?? CONSTANT_LEVEL;
  target.set(key, { param, position, level: Math.max(level, old) });
};

const putArgLevelConstraints = (
  target: Map<string, ArgLevelConstraint>,
  source: Map<string, ArgLevelConstraint>,
  isIncluded: (constraint: ArgLevelConstraint) => boolean = () => true,
) => {
  source.forEach((constraint) => {
    if (isIncluded(constraint)) {
      putArgLevelConstraint(target, constraint.param, constraint.position, constraint.level);
    }
  });
};

const shareLevels = (node: LevelFields, source: LevelFields) => {
  node.levelParams = source.levelParams;
  node.allParams = source.allParams;
  node.levelConstraints = source.levelConstraints;
  node.argLevelConstraints = source.argLevelConstraints;
  node.argLevelParams = source.argLevelParams;
};

const mergeLevels = (node: LevelFields, part: LevelFields) => {
  addAll(node.levelParams, part.levelParams);
  addAll(node.allParams, part.allParams);
  putLevelConstraints(node.levelConstraints, part.levelConstraints);
  putArgLevelConstraints(node.argLevelConstraints, part.argLevelConstraints);
  addArgLevelParams(node.argLevelParams, part.argLevelParams);
};

// ArgLevelParam.occur.
const isOccurring = (argLevelParam: ArgLevelParam, symbols: SymbolNode[]) =>
  symbols.includes(argLevelParam.op) || symbols.includes(argLevelParam.param);

const isParam = (symbol: SymbolNode): symbol is FormalParamNode | OpDeclNode =>
  symbol.kind === "OpDecl" || symbol.kind === "FormalParam";

const isLevelNode = (node: SemanticNode): node is Exclude<SemanticNode, ModuleNode> =>
  node.kind !== "Module";

const isAnyDef = (symbol: SymbolNode): symbol is AnyDefNode =>
  symbol.kind === "OpDef" || symbol.kind === "ThmOrAssumpDef";

const getIndex = (definition: AnyDefNode, index: number) =>
  definition.kind === "OpDef" && definition.arity < 0 ? 0 : index;

const getWeight = (definition: AnyDefNode, index: number) =>
  definition.kind === "OpDef" ? (definition.weights[getIndex(definition, index)] ?? 0) : 0;

const getMaxLevel = (definition: AnyDefNode, index: number) =>
  definition.maxLevels[getIndex(definition, index)] ?? TEMPORAL_LEVEL;

const getMinMaxLevel = (definition: AnyDefNode, operand: number, position: number) =>
  definition.minMaxLevel?.[operand]?.[position] ?? CONSTANT_LEVEL;

const isLeibnizArgument = (definition: AnyDefNode, index: number) =>
  definition.kind === "OpDef"
    ? (definition.isLeibnizArg?.[getIndex(definition, index)] ?? true)
    : (definition.isLeibnizArg[index] ?? true);

const getOpLevelCond = (definition: AnyDefNode, operand: number, other: number, index: number) =>
  definition.opLevelCond?.[operand]?.[other]?.[index] ?? false;

const getBoundSymbols = (node: OpApplNode) => [
  ...(node.unbounded ?? []),
  ...(node.bounded ?? []).flat(),
];

const getSubstitute = (symbol: SymbolNode, substs: Subst[]) =>
  substs.find((subst) => subst.op === symbol)?.expr;

// Subst.paramSet and Subst.allParamSet.
const getSubstitutedParams = (param: SymbolNode, substs: Subst[], isAll: boolean) => {
  const expr = getSubstitute(param, substs);
  if (expr === undefined) return new Set([param]);
  return isAll ? expr.allParams : expr.levelParams;
};

// Subst.getSubALPSet.
const getSubstitutedArgLevelParams = (source: Map<string, ArgLevelParam>, substs: Subst[]) => {
  const result = new Map<string, ArgLevelParam>();
  source.forEach((argLevelParam, key) => {
    const expr = getSubstitute(argLevelParam.op, substs);
    if (expr === undefined) {
      result.set(key, argLevelParam);
      return;
    }
    if (expr.kind !== "OpArg" || !isParam(expr.op)) return;
    const operator = expr.op;
    getSubstitutedParams(argLevelParam.param, substs, false).forEach((param) =>
      addArgLevelParam(result, operator, argLevelParam.index, param),
    );
  });
  return result;
};

interface ConstraintSource {
  levelConstraints: Map<SymbolNode, number>;
  argLevelConstraints: Map<string, ArgLevelConstraint>;
  argLevelParams: Map<string, ArgLevelParam>;
}

// Subst.getSubLCSet.
const getSubstitutedLevelConstraints = (
  body: ConstraintSource,
  substs: Subst[],
  isConstant: boolean,
  iteration: number,
  check: LevelCheck,
) => {
  const result = new Map<SymbolNode, number>();
  body.levelConstraints.forEach((bound, param) => {
    const level =
      isConstant || param.kind !== "OpDecl"
        ? bound
        : param.declKind === CONSTANT_DECL_KIND
          ? CONSTANT_LEVEL
          : param.declKind === VARIABLE_DECL_KIND
            ? VARIABLE_LEVEL
            : bound;
    getSubstitutedParams(param, substs, false).forEach((substituted) =>
      putLevelConstraint(result, substituted, level),
    );
  });
  body.argLevelParams.forEach((argLevelParam) => {
    const expr = getSubstitute(argLevelParam.op, substs);
    if (expr?.kind !== "OpArg" || expr.op.kind !== "OpDef") return;
    checkLevel(expr.op, iteration, check);
    const level = getMaxLevel(expr.op, argLevelParam.index);
    getSubstitutedParams(argLevelParam.param, substs, false).forEach((substituted) =>
      putLevelConstraint(result, substituted, level),
    );
  });
  return result;
};

// Subst.getSubALCSet.
const getSubstitutedArgLevelConstraints = (
  body: ConstraintSource,
  substs: Subst[],
  iteration: number,
  check: LevelCheck,
) => {
  const result = new Map<string, ArgLevelConstraint>();
  body.argLevelConstraints.forEach((constraint) => {
    const expr = getSubstitute(constraint.param, substs);
    if (expr === undefined) {
      putArgLevelConstraint(result, constraint.param, constraint.position, constraint.level);
    } else if (expr.kind === "OpArg" && isParam(expr.op)) {
      putArgLevelConstraint(result, expr.op, constraint.position, constraint.level);
    }
  });
  body.argLevelParams.forEach((argLevelParam) => {
    const paramExpr = getSubstitute(argLevelParam.param, substs);
    if (paramExpr === undefined) return;
    const opExpr = getSubstitute(argLevelParam.op, substs);
    const operator =
      opExpr === undefined ? argLevelParam.op : opExpr.kind === "OpArg" ? opExpr.op : undefined;
    if (operator === undefined || !isParam(operator)) return;
    checkLevel(paramExpr, iteration, check);
    putArgLevelConstraint(result, operator, argLevelParam.index, paramExpr.level);
  });
  return result;
};

// ModuleNode.isConstant.
const isConstantModule = (module: ModuleNode, check: LevelCheck) => {
  if (getDeclarations(module, VARIABLE_DECL_KIND).length > 0) return false;
  checkModuleLevels(module, check);
  if (getOpDefs(module).some((definition) => (definition.body?.level ?? 0) !== CONSTANT_LEVEL)) {
    return false;
  }
  return module.topLevel.every((node) => node.kind !== "Theorem" || node.level === CONSTANT_LEVEL);
};

// The parts of OpDefNode.levelCheck and ThmOrAssumpDefNode.levelCheck that follow the body's.
const checkDefinitionBody = (node: AnyDefNode, params: FormalParamNode[], body: LevelFields) => {
  node.minMaxLevel = params.map((param) =>
    Array.from(
      { length: param.arity },
      (_, position) =>
        body.argLevelConstraints.get(getArgLevelConstraintKey(param, position))?.level ??
        CONSTANT_LEVEL,
    ),
  );
  node.opLevelCond = params.map((param) =>
    params.map((other) =>
      Array.from({ length: param.arity }, (_, index) =>
        body.argLevelParams.has(getArgLevelKey(param, index, other)),
      ),
    ),
  );
  addAll(node.levelParams, body.levelParams);
  addAll(node.allParams, body.allParams);
  addAll(node.nonLeibnizParams, body.nonLeibnizParams);
  params.forEach((param, index) => {
    node.levelParams.delete(param);
    node.allParams.delete(param);
    if (!node.nonLeibnizParams.has(param)) return;
    node.nonLeibnizParams.delete(param);
    if (node.isLeibnizArg) node.isLeibnizArg[index] = false;
    node.isLeibniz = false;
  });
  node.levelConstraints = new Map(body.levelConstraints);
  params.forEach((param) => node.levelConstraints.delete(param));
  node.argLevelConstraints = new Map(body.argLevelConstraints);
  params.forEach((param) => {
    for (let position = 0; position < param.arity; position++) {
      node.argLevelConstraints.delete(getArgLevelConstraintKey(param, position));
    }
  });
  addArgLevelParams(
    node.argLevelParams,
    body.argLevelParams,
    (argLevelParam) =>
      !params.some((param) => param === argLevelParam.op) ||
      !params.some((param) => param === argLevelParam.param),
  );
};

// The checks of OpApplNode.levelCheck that compare the levels of the arguments of a defined
// operator with the levels it allows.
const checkArguments = (
  node: OpApplNode,
  operator: AnyDefNode,
  isOperatorCorrect: boolean,
  iteration: number,
  check: LevelCheck,
) => {
  node.operands.forEach((operand, index) => {
    if (operand === undefined) return;
    if (operand.level > getMaxLevel(operator, index)) {
      if (isOperatorCorrect && checkLevel(operand, iteration, check)) {
        addError(
          check,
          node.location,
          `Level error in applying operator ${operator.name}:\nThe level of argument ${index + 1} exceeds the maximum level allowed by the operator.`,
        );
      }
      node.levelCorrect = false;
    }
    if (operand.kind !== "OpArg" || !isAnyDef(operand.op)) return;
    const argument = operand.op;
    checkLevel(argument, iteration, check);
    const arity = getSymbolArity(argument);
    for (let position = 0; position < arity; position++) {
      const minimum = getMinMaxLevel(operator, index, position);
      if (getMaxLevel(argument, position) >= minimum) continue;
      if (isOperatorCorrect && checkLevel(operand, iteration, check)) {
        addError(
          check,
          node.location,
          `Level error in applying operator ${operator.name}:\nThe permitted level of argument ${position + 1} of the operator argument ${index + 1} \nmust be at least ${minimum}.`,
        );
      }
      node.levelCorrect = false;
    }
    node.operands.forEach((other, otherIndex) => {
      for (let position = 0; position < arity; position++) {
        if (
          other === undefined ||
          !getOpLevelCond(operator, index, otherIndex, position) ||
          other.level <= getMaxLevel(argument, position)
        ) {
          continue;
        }
        if (checkLevel(operand, iteration, check) && checkLevel(other, iteration, check)) {
          addError(
            check,
            node.location,
            `Level error in applying operator ${operator.name}:\nThe level of argument ${otherIndex + 1} exceeds the maximum level allowed by the operator.`,
            "HIGHER_ORDER_OPERATOR_COPARAMETER_LEVEL_CONSTRAINTS_EXCEEDED",
          );
        }
        node.levelCorrect = false;
      }
    });
  });
  node.ranges.forEach((range, index) => {
    const isRangeCorrect = checkLevel(range, iteration, check);
    if (range.level <= ACTION_LEVEL) return;
    if (isRangeCorrect) {
      addError(
        check,
        node.location,
        `Level error in applying operator ${operator.name}:\nThe level of the range for the bounded variable ${formatSanyLocation(node.bounded?.[index]?.[0]?.location)} \nexceeds the maximum level allowed by the operator.`,
      );
    }
    node.levelCorrect = false;
  });
};

// The level constraints OpApplNode.levelCheck derives for an application of a defined operator.
const constrainArguments = (
  node: OpApplNode,
  operator: AnyDefNode,
  boundSymbols: Set<SymbolNode>,
  iteration: number,
  check: LevelCheck,
) => {
  const params = operator.params ?? [];
  const getArgument = (symbol: SymbolNode) =>
    node.operands.find((_, index) => params[index] === symbol);
  putLevelConstraints(node.levelConstraints, operator.levelConstraints);
  node.operands.forEach((operand) => {
    if (operand === undefined) return;
    putLevelConstraints(
      node.levelConstraints,
      operand.levelConstraints,
      (param) => !boundSymbols.has(param),
    );
  });
  node.ranges.forEach((range) =>
    putLevelConstraints(node.levelConstraints, range.levelConstraints),
  );
  node.operands.forEach((operand, index) => {
    const level = getMaxLevel(operator, index);
    operand?.levelParams.forEach((param) =>
      putLevelConstraint(node.levelConstraints, param, level),
    );
  });
  node.operands.forEach((operand, index) => {
    if (operand?.kind !== "OpArg" || !isAnyDef(operand.op)) return;
    const argument = operand.op;
    checkLevel(argument, iteration, check);
    const arity = getSymbolArity(argument);
    node.operands.forEach((other, otherIndex) => {
      for (let position = 0; position < arity; position++) {
        if (!getOpLevelCond(operator, index, otherIndex, position)) continue;
        const level = getMaxLevel(argument, position);
        other?.levelParams.forEach((param) =>
          putLevelConstraint(node.levelConstraints, param, level),
        );
        if (!argument.isLeibniz && !isLeibnizArgument(argument, position) && other) {
          addAll(node.nonLeibnizParams, other.allParams);
        }
      }
    });
  });
  operator.argLevelParams.forEach((argLevelParam) => {
    const argument = getArgument(argLevelParam.op);
    if (argument?.kind !== "OpArg" || !isAnyDef(argument.op)) return;
    checkLevel(argument.op, iteration, check);
    putLevelConstraint(
      node.levelConstraints,
      argLevelParam.param,
      getMaxLevel(argument.op, argLevelParam.index),
    );
  });
  putArgLevelConstraints(node.argLevelConstraints, operator.argLevelConstraints);
  node.operands.forEach((operand) => {
    if (operand) putArgLevelConstraints(node.argLevelConstraints, operand.argLevelConstraints);
  });
  node.ranges.forEach((range) =>
    putArgLevelConstraints(node.argLevelConstraints, range.argLevelConstraints),
  );
  node.operands.forEach((operand, index) => {
    if (operand?.kind !== "OpArg" || !isParam(operand.op)) return;
    const argument = operand.op;
    for (let position = 0; position < argument.arity; position++) {
      putArgLevelConstraint(
        node.argLevelConstraints,
        argument,
        position,
        getMinMaxLevel(operator, index, position),
      );
    }
    node.operands.forEach((other, otherIndex) => {
      for (let position = 0; position < argument.arity; position++) {
        if (other === undefined || !getOpLevelCond(operator, index, otherIndex, position)) {
          continue;
        }
        putArgLevelConstraint(node.argLevelConstraints, argument, position, other.level);
      }
    });
  });
  operator.argLevelParams.forEach((argLevelParam) => {
    const argument = getArgument(argLevelParam.op);
    if (argument === undefined) return;
    checkLevel(argument, iteration, check);
    putArgLevelConstraint(
      node.argLevelConstraints,
      argLevelParam.op,
      argLevelParam.index,
      argument.level,
    );
  });
  node.operands.forEach((operand) => {
    if (operand === undefined) return;
    addArgLevelParams(
      node.argLevelParams,
      operand.argLevelParams,
      (argLevelParam) => !boundSymbols.has(argLevelParam.param),
    );
  });
  node.ranges.forEach((range) => addArgLevelParams(node.argLevelParams, range.argLevelParams));
  operator.argLevelParams.forEach((argLevelParam, key) => {
    const argument = getArgument(argLevelParam.op);
    if (argument === undefined) {
      const paramArgument = getArgument(argLevelParam.param);
      if (paramArgument === undefined) node.argLevelParams.set(key, argLevelParam);
      else {
        checkLevel(paramArgument, iteration, check);
        paramArgument.levelParams.forEach((param) =>
          addArgLevelParam(node.argLevelParams, argLevelParam.op, argLevelParam.index, param),
        );
      }
      return;
    }
    if (argument.kind === "OpArg" && isParam(argument.op)) {
      addArgLevelParam(node.argLevelParams, argument.op, argLevelParam.index, argLevelParam.param);
    }
  });
  node.operands.forEach((operand, index) => {
    if (operand?.kind !== "OpArg" || !isParam(operand.op)) return;
    const argument = operand.op;
    node.operands.forEach((other, otherIndex) => {
      for (let position = 0; position < argument.arity; position++) {
        if (other === undefined || !getOpLevelCond(operator, index, otherIndex, position)) {
          continue;
        }
        other.levelParams.forEach((param) =>
          addArgLevelParam(node.argLevelParams, argument, position, param),
        );
      }
    });
  });
};

// The operators OpApplNode.levelCheck rejects with both temporal and action arguments, and how its
// message names them.
const LOGICAL_OPERATOR_NAMES = new Map([
  ["\\land", "\\land"],
  ["\\lor", "\\lor"],
  ["=>", "=>"],
  ["\\equiv", "\\equiv"],
  ["$ConjList", "Conjunction list"],
  ["$DisjList", "Disjunction list"],
]);

// The checks at the end of OpApplNode.levelCheck of the temporal operators and quantifiers. TLC
// 1.7.4's SANY reports these errors but leaves the node level-correct, so an operator applied to it
// still checks its level.
const checkTemporalApplication = (node: OpApplNode, check: LevelCheck) => {
  const addTemporalError = (location: SanyLocation, text: string) => {
    addError(check, location, text);
    if (!check.isTlc174) node.levelCorrect = false;
  };
  const name = node.operator.name;
  const first = node.operands[0];
  if (
    (name === "[]" || name === "<>") &&
    first?.level === ACTION_LEVEL &&
    first.kind === "OpAppl"
  ) {
    const isBoxed = name === "[]";
    if (first.operator.name !== (isBoxed ? "$SquareAct" : "$AngleAct")) {
      addTemporalError(
        node.location,
        isBoxed
          ? "[] followed by action not of form [A]_v."
          : "<> followed by action not of form <<A>>_v.",
      );
    }
  }
  if (
    (name === "~>" || name === "-+->") &&
    (first?.level === ACTION_LEVEL || node.operands[1]?.level === ACTION_LEVEL)
  ) {
    addTemporalError(
      node.location,
      "Action used where only temporal formula or state predicate allowed.",
    );
  }
  const logicalName = LOGICAL_OPERATOR_NAMES.get(name);
  if (
    logicalName !== undefined &&
    node.operands.some((operand) => operand?.level === TEMPORAL_LEVEL) &&
    node.operands.some((operand) => operand?.level === ACTION_LEVEL)
  ) {
    addTemporalError(
      node.location,
      `${logicalName} has both temporal formula and action as arguments.`,
    );
  }
  if (node.level === TEMPORAL_LEVEL && (name === "$BoundedExists" || name === "$BoundedForall")) {
    node.ranges.forEach((range) => {
      if (range.level === ACTION_LEVEL) {
        addTemporalError(range.location, "Action-level bound of quantified temporal formula.");
      }
    });
  }
};

const checkApplication = (node: OpApplNode, iteration: number, check: LevelCheck) => {
  if (node.levelChecked >= iteration) return node.levelCorrect;
  node.levelChecked = iteration;
  node.levelCorrect = true;
  const operands = node.operands.filter(
    (operand): operand is ExprOrOpArgNode => operand !== undefined,
  );
  operands.forEach((operand) => {
    if (!checkLevel(operand, iteration, check)) node.levelCorrect = false;
  });
  node.ranges.forEach((range) => {
    if (!checkLevel(range, iteration, check)) node.levelCorrect = false;
  });
  const operator = node.operator;
  if (isAnyDef(operator)) {
    const isOperatorCorrect = checkLevel(operator, iteration, check);
    checkArguments(node, operator, isOperatorCorrect, iteration, check);
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
    const boundSymbols = new Set<SymbolNode>(getBoundSymbols(node));
    boundSymbols.forEach((symbol) => {
      node.levelParams.delete(symbol);
      node.allParams.delete(symbol);
      node.nonLeibnizParams.delete(symbol);
    });
    constrainArguments(node, operator, boundSymbols, iteration, check);
  } else {
    checkLevel(operator, iteration, check);
    node.level = operands.reduce(
      (level, operand) => Math.max(level, operand.level),
      operator.kind === "Module" ? 0 : operator.level,
    );
    node.levelParams = new Set([operator]);
    node.allParams.add(operator);
    operands.forEach((operand, index) => {
      addAll(node.levelParams, operand.levelParams);
      addAll(node.allParams, operand.allParams);
      addAll(node.nonLeibnizParams, operand.nonLeibnizParams);
      putLevelConstraints(node.levelConstraints, operand.levelConstraints);
      putArgLevelConstraint(node.argLevelConstraints, operator, index, operand.level);
      putArgLevelConstraints(node.argLevelConstraints, operand.argLevelConstraints);
      operand.levelParams.forEach((param) =>
        addArgLevelParam(node.argLevelParams, operator, index, param),
      );
      addArgLevelParams(node.argLevelParams, operand.argLevelParams);
    });
  }
  checkTemporalApplication(node, check);
  return node.levelCorrect;
};

const checkDefinition = (node: OpDefNode, iteration: number, check: LevelCheck) => {
  if (node.levelChecked >= iteration || (!node.inRecursiveSection && node.levelChecked > 0)) {
    return node.levelCorrect;
  }
  node.levelChecked = iteration;
  const body = node.body;
  if (body === undefined) {
    node.levelCorrect = node.step === undefined || checkLevel(node.step, iteration, check);
    return node.levelCorrect;
  }
  node.levelCorrect = checkLevel(body, iteration, check);
  node.level = Math.max(node.level, body.level);
  const params = node.params ?? [];
  params.forEach((param, index) => {
    const bound = body.levelConstraints.get(param);
    if (bound !== undefined) node.maxLevels[index] = Math.min(node.maxLevels[index], bound);
    if (body.levelParams.has(param)) node.weights[index] = Math.max(node.weights[index], 1);
  });
  checkDefinitionBody(node, params, body);
  return node.levelCorrect;
};

const checkTheoremDefinition = (node: ThmOrAssumpDefNode, iteration: number, check: LevelCheck) => {
  if (node.levelChecked >= iteration) return node.levelCorrect;
  node.levelChecked = iteration;
  node.maxLevels = node.params.map(() => TEMPORAL_LEVEL);
  // SANY allocates isLeibnizArg anew for each parameter, so only the last one starts out Leibniz.
  node.isLeibnizArg = node.params.map((_, index) => index === node.params.length - 1);
  if (node.params.length > 0) node.isLeibniz = true;
  node.levelCorrect = checkLevel(node.body, iteration, check);
  node.level = node.body.level;
  node.params.forEach((param, index) => {
    const bound = node.body.levelConstraints.get(param);
    if (bound !== undefined) node.maxLevels[index] = bound;
  });
  checkDefinitionBody(node, node.params, node.body);
  return node.levelCorrect;
};

// ModuleNode.levelCheck: the definitions of each recursive section are checked twice, the second
// time with the highest level and the parameters of the section's recursive operators.
export const checkModuleLevels = (module: ModuleNode, check: LevelCheck) => {
  if (module.isLevelChecked) return module.levelCorrect;
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
        definition.maxLevels = definition.maxLevels.map(() => ACTION_LEVEL);
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
      checkDefinition(definition, 1, check);
      if (!definition.inRecursive) return;
      definition.maxLevels.forEach((level, index) => {
        if (level >= ACTION_LEVEL) return;
        addError(
          check,
          definition.location,
          `Argument ${index + 1} of recursive operator ${definition.name} is primed`,
        );
      });
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
      checkDefinition(definition, 2, check);
    });
    first = end;
  }
  module.levelCorrect = true;
  const recordCorrectness = (isNodeCorrect: boolean) => {
    if (!isNodeCorrect) module.levelCorrect = false;
  };
  module.definitions
    .filter((definition): definition is ModuleNode => definition.kind === "Module")
    .forEach((inner) => recordCorrectness(checkModuleLevels(inner, check)));
  const definitions = getOpDefs(module);
  definitions.forEach((definition) => recordCorrectness(checkDefinition(definition, 1, check)));
  getThmOrAssumpDefs(module).forEach((definition) =>
    recordCorrectness(checkTheoremDefinition(definition, 1, check)),
  );
  module.topLevel.forEach((node) => recordCorrectness(checkLevel(node, 1, check)));
  if (!isConstantModule(module, check)) {
    getDeclarations(module, CONSTANT_DECL_KIND).forEach((declaration) =>
      putLevelConstraint(module.levelConstraints, declaration, CONSTANT_LEVEL),
    );
  }
  definitions.forEach((definition) => {
    putLevelConstraints(module.levelConstraints, definition.levelConstraints);
    putArgLevelConstraints(module.argLevelConstraints, definition.argLevelConstraints);
    addArgLevelParams(
      module.argLevelParams,
      definition.argLevelParams,
      (argLevelParam) => !isOccurring(argLevelParam, definition.params ?? []),
    );
  });
  module.topLevel.forEach((node) => {
    putLevelConstraints(module.levelConstraints, node.levelConstraints);
    putArgLevelConstraints(module.argLevelConstraints, node.argLevelConstraints);
    addArgLevelParams(module.argLevelParams, node.argLevelParams);
  });
  return module.levelCorrect;
};

// LevelNode.levelCheckSubnodes, which skips modules.
const checkSubnodes = (
  node: LevelFields,
  subnodes: SemanticNode[],
  iteration: number,
  check: LevelCheck,
) => {
  if (node.levelChecked >= iteration) return node.levelCorrect;
  node.levelChecked = iteration;
  subnodes.forEach((subnode) => {
    if (!isLevelNode(subnode)) return;
    if (subnode.kind === "OpDef" && subnode.defKind === "ModuleInstance") return;
    node.levelCorrect = checkLevel(subnode, iteration, check) && node.levelCorrect;
    node.level = Math.max(node.level, subnode.level);
    mergeLevels(node, subnode);
    addAll(node.nonLeibnizParams, subnode.nonLeibnizParams);
  });
  return node.levelCorrect;
};

// TheoremNode.LevelCheckTemporal: the steps of the proof of a temporal theorem that must be
// constant.
const checkTemporalProof = (proof: ProofNode | undefined, check: LevelCheck) => {
  if (proof?.kind !== "NonLeafProof") return;
  proof.steps.forEach((step) => {
    if (step.kind !== "Theorem" || step.body.kind !== "OpAppl") return;
    const name = step.body.operator.name;
    if (name === "$Take" || name === "$Witness" || name === "$Have") {
      if (step.body.level !== CONSTANT_LEVEL) {
        addError(
          check,
          step.body.location,
          "Non-constant TAKE, WITNESS, or HAVE for temporal goal.",
        );
      }
    } else if (name === "$Pfcase") {
      if (step.body.level !== CONSTANT_LEVEL) {
        addError(check, step.body.location, "Non-constant CASE for temporal goal.");
      }
      checkTemporalProof(step.proof, check);
    } else if (name === "$Qed") checkTemporalProof(step.proof, check);
  });
};

// Subst.getSubLCSet, getSubALCSet and getSubALPSet for the body of an instantiation.
const constrainSubstitution = (
  node: LevelFields,
  body: ConstraintSource,
  substs: Subst[],
  isConstant: boolean,
  iteration: number,
  check: LevelCheck,
) => {
  node.levelConstraints = getSubstitutedLevelConstraints(
    body,
    substs,
    isConstant,
    iteration,
    check,
  );
  node.argLevelConstraints = getSubstitutedArgLevelConstraints(body, substs, iteration, check);
  node.argLevelParams = getSubstitutedArgLevelParams(body.argLevelParams, substs);
};

// InstanceNode.levelCheck.
const checkInstance = (node: InstanceNode, iteration: number, check: LevelCheck) => {
  if (node.levelChecked >= iteration) return node.levelCorrect;
  node.levelChecked = iteration;
  node.levelParams = new Set();
  node.levelCorrect = true;
  const module = node.module;
  if (!checkModuleLevels(module, check)) node.levelCorrect = false;
  node.substs.forEach((subst) => {
    if (!checkLevel(subst.expr, iteration, check)) node.levelCorrect = false;
  });
  const isConstant = isConstantModule(module, check);
  node.substs.forEach((subst) => {
    if (!isConstant && subst.expr.level > subst.op.level) {
      if (checkLevel(subst.expr, iteration, check)) {
        addError(
          check,
          node.location,
          `Level error in instantiating module '${module.name}':\nThe level of the expression or operator substituted for '${subst.op.name}' \nmust be at most ${subst.op.level}.`,
        );
      }
      node.levelCorrect = false;
    }
    if (
      subst.expr.kind === "OpArg" &&
      subst.expr.op.kind === "OpDef" &&
      (subst.expr.op.defKind === "UserDefined" || subst.expr.op.defKind === "BuiltIn") &&
      !subst.expr.op.isLeibniz
    ) {
      addError(
        check,
        node.location,
        `Error in instantiating module '${module.name}':\n A non-Leibniz operator substituted for '${subst.op.name}'.`,
      );
    }
  });
  node.substs.forEach((subst) => {
    const bound = module.levelConstraints.get(subst.op);
    if (bound !== undefined && subst.expr.level > bound) {
      if (checkLevel(subst.expr, iteration, check)) {
        addError(
          check,
          node.location,
          `Level error in instantiating module '${module.name}':\nThe level of the expression or operator substituted for '${subst.op.name}' \nmust be at most ${bound}.`,
        );
      }
      node.levelCorrect = false;
    }
    if (subst.op.arity <= 0 || subst.expr.kind !== "OpArg" || subst.expr.op.kind !== "OpDef")
      return;
    const definition = subst.expr.op;
    const isDefinitionCorrect = checkLevel(definition, iteration, check);
    for (let position = 0; position < subst.op.arity; position++) {
      const minimum = module.argLevelConstraints.get(
        getArgLevelConstraintKey(subst.op, position),
      )?.level;
      if (minimum === undefined || getMaxLevel(definition, position) >= minimum) continue;
      if (isDefinitionCorrect) {
        addError(
          check,
          node.location,
          `Level error in instantiating module '${module.name}':\nThe level of the argument ${position + 1} of the operator ${definition.name} \nmust be at least ${minimum}.`,
        );
      }
      node.levelCorrect = false;
    }
  });
  module.argLevelParams.forEach((argLevelParam) => {
    node.substs.forEach((opSubst) => {
      node.substs.forEach((paramSubst) => {
        if (argLevelParam.op !== opSubst.op || argLevelParam.param !== paramSubst.op) return;
        if (opSubst.expr.kind !== "OpArg") return;
        const operator = opSubst.expr.op;
        const isOperatorCorrect = checkLevel(operator, iteration, check);
        if (operator.kind !== "OpDef") return;
        const maximum = getMaxLevel(operator, argLevelParam.index);
        if (paramSubst.expr.level <= maximum) return;
        if (isOperatorCorrect && checkLevel(paramSubst.expr, iteration, check)) {
          addError(
            check,
            node.location,
            `Level error when instantiating module '${module.name}':\nThe level of the argument ${argLevelParam.index} of the operator ${opSubst.op.name}' \nmust be at most ${maximum}.`,
          );
        }
        node.levelCorrect = false;
      });
    });
  });
  const isOutside = (symbol: SymbolNode) => !node.params.some((param) => param === symbol);
  putLevelConstraints(
    node.levelConstraints,
    getSubstitutedLevelConstraints(module, node.substs, isConstant, iteration, check),
    isOutside,
  );
  node.substs.forEach((subst) =>
    putLevelConstraints(node.levelConstraints, subst.expr.levelConstraints, isOutside),
  );
  putArgLevelConstraints(
    node.argLevelConstraints,
    getSubstitutedArgLevelConstraints(module, node.substs, iteration, check),
    (constraint) => isOutside(constraint.param),
  );
  node.substs.forEach((subst) =>
    putArgLevelConstraints(node.argLevelConstraints, subst.expr.argLevelConstraints, (constraint) =>
      isOutside(constraint.param),
    ),
  );
  addArgLevelParams(
    node.argLevelParams,
    getSubstitutedArgLevelParams(module.argLevelParams, node.substs),
    (argLevelParam) => !isOccurring(argLevelParam, node.params),
  );
  node.substs.forEach((subst) =>
    addArgLevelParams(
      node.argLevelParams,
      subst.expr.argLevelParams,
      (argLevelParam) => !isOccurring(argLevelParam, node.params),
    ),
  );
  return node.levelCorrect;
};

const checkLevel = (node: SemanticNode, iteration: number, check: LevelCheck): boolean => {
  if (!isLevelNode(node)) return checkModuleLevels(node, check);
  switch (node.kind) {
    case "OpAppl":
      return checkApplication(node, iteration, check);
    case "OpDef":
      return checkDefinition(node, iteration, check);
    case "ThmOrAssumpDef":
      return checkTheoremDefinition(node, iteration, check);
    case "FormalParam":
      if (node.levelChecked !== 0) return true;
      node.levelChecked = iteration;
      node.levelParams.add(node);
      node.allParams.add(node);
      return true;
    case "OpDecl":
      return true;
    case "Numeral":
    case "String":
    case "Decimal":
      if (node.levelChecked < iteration) node.levelChecked = iteration;
      return true;
    case "OpArg": {
      if (node.levelChecked >= iteration) return node.levelCorrect;
      node.levelChecked = iteration;
      const operator = node.op;
      node.levelCorrect = checkLevel(operator, iteration, check);
      if (operator.kind === "Module") return node.levelCorrect;
      node.level = operator.level;
      shareLevels(node, operator);
      return node.levelCorrect;
    }
    case "LetIn": {
      if (node.levelChecked >= iteration) return node.levelCorrect;
      node.levelChecked = iteration;
      node.levelCorrect = true;
      const definitions = node.opDefs.filter(
        (definition) => definition.kind !== "OpDef" || definition.defKind !== "ModuleInstance",
      );
      definitions.forEach((definition) => {
        if (!checkLevel(definition, iteration, check)) node.levelCorrect = false;
      });
      if (!checkLevel(node.body, iteration, check)) node.levelCorrect = false;
      node.instances.forEach((instance) => {
        if (!checkLevel(instance, iteration, check)) node.levelCorrect = false;
      });
      node.level = node.body.level;
      node.levelParams = new Set(node.body.levelParams);
      node.allParams = new Set(node.body.allParams);
      putLevelConstraints(node.levelConstraints, node.body.levelConstraints);
      definitions.forEach((definition) =>
        putLevelConstraints(node.levelConstraints, definition.levelConstraints),
      );
      putArgLevelConstraints(node.argLevelConstraints, node.body.argLevelConstraints);
      definitions.forEach((definition) =>
        putArgLevelConstraints(node.argLevelConstraints, definition.argLevelConstraints),
      );
      addArgLevelParams(node.argLevelParams, node.body.argLevelParams);
      definitions.forEach((definition) => {
        const params = definition.kind === "OpDef" ? (definition.params ?? []) : [];
        addArgLevelParams(
          node.argLevelParams,
          definition.argLevelParams,
          (argLevelParam) => !isOccurring(argLevelParam, params),
        );
      });
      node.instances.forEach((instance) =>
        addArgLevelParams(node.argLevelParams, instance.argLevelParams),
      );
      return node.levelCorrect;
    }
    case "Label": {
      if (node.levelChecked >= iteration) return true;
      node.levelChecked = iteration;
      node.params.forEach((param) => checkLevel(param, iteration, check));
      const isCorrect = checkLevel(node.body, iteration, check);
      node.level = node.body.level;
      shareLevels(node, node.body);
      return isCorrect;
    }
    case "At": {
      if (node.levelChecked >= iteration) return true;
      node.levelChecked = iteration;
      const args = node.except.operands;
      const first = args[0];
      if (first === undefined) return true;
      checkLevel(first, iteration, check);
      node.level = first.level;
      const parts = [first];
      for (const argument of args.slice(1)) {
        if (argument === undefined) continue;
        checkLevel(argument, iteration, check);
        if (argument === node.component) break;
        node.level = Math.max(node.level, argument.level);
        parts.push(argument);
      }
      parts.forEach((part) => mergeLevels(node, part));
      return true;
    }
    case "SubstIn":
    case "APSubstIn": {
      if (node.levelChecked >= iteration) return node.levelCorrect;
      node.levelChecked = iteration;
      node.levelCorrect = true;
      const body = node.body;
      if (!checkLevel(body, iteration, check)) node.levelCorrect = false;
      node.substs.forEach((subst) => {
        if (!checkLevel(subst.expr, iteration, check)) node.levelCorrect = false;
      });
      node.level = node.substs.reduce(
        (level, subst) =>
          body.levelParams.has(subst.op) ? Math.max(level, subst.expr.level) : level,
        body.level,
      );
      body.levelParams.forEach((param) =>
        addAll(node.levelParams, getSubstitutedParams(param, node.substs, false)),
      );
      if (node.kind === "APSubstIn") {
        body.allParams.forEach((param) =>
          addAll(node.allParams, getSubstitutedParams(param, node.substs, true)),
        );
      } else {
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
      }
      const isConstant = isConstantModule(node.instantiatedModule, check);
      constrainSubstitution(node, body, node.substs, isConstant, iteration, check);
      return node.levelCorrect;
    }
    case "Instance":
      return checkInstance(node, iteration, check);
    case "Assume": {
      if (node.levelChecked >= iteration) return true;
      node.levelChecked = iteration;
      const isBodyCorrect = checkLevel(node.body, iteration, check);
      const isDefinitionCorrect = !node.definition || checkLevel(node.definition, iteration, check);
      // AssumeNode's getters return its expression's levels.
      node.level = node.body.level;
      shareLevels(node, node.body);
      if (node.level !== CONSTANT_LEVEL) {
        addError(
          check,
          node.location,
          `Level error: assumptions must be level 0 (Constant), \nbut this one has level ${node.level}.`,
        );
      }
      return isBodyCorrect && isDefinitionCorrect;
    }
    case "Theorem": {
      // TheoremNode declares its own levelChecked, so levelCheckSubnodes still runs on the
      // theorem's definition, or its statement when it has none, and its proof.
      if (node.levelChecked >= iteration) return true;
      const isCorrect = checkSubnodes(
        node,
        [node.definition ?? node.body, ...(node.proof ? [node.proof] : [])],
        iteration,
        check,
      );
      const body = node.body;
      if (
        body.kind === "OpAppl" &&
        body.operator.name === "$Pick" &&
        body.level === TEMPORAL_LEVEL
      ) {
        body.ranges.forEach((range) => {
          if (range.level === CONSTANT_LEVEL) return;
          addError(check, range.location, "Non-constant bound of temporal PICK.");
        });
      }
      if (body.level === TEMPORAL_LEVEL) checkTemporalProof(node.proof, check);
      return isCorrect;
    }
    case "LeafProof":
    case "UseOrHide":
      return checkSubnodes(node, node.facts, iteration, check);
    case "NonLeafProof":
      return checkSubnodes(node, [...node.steps, ...node.instances], iteration, check);
    case "DefStep":
      return checkSubnodes(node, node.defs, iteration, check);
    case "NewSymb": {
      if (node.levelChecked >= iteration) return node.levelCorrect;
      node.levelChecked = iteration;
      node.level = node.declaration.level;
      if (node.set === undefined) return node.levelCorrect;
      node.levelCorrect = checkLevel(node.set, iteration, check);
      node.level = Math.max(node.level, node.set.level);
      if (node.level === TEMPORAL_LEVEL) {
        node.levelCorrect = false;
        addError(check, node.location, "Level error:\nTemporal formula used as set.");
      }
      shareLevels(node, node.set);
      return node.levelCorrect;
    }
    case "AssumeProve": {
      if (node.levelChecked >= iteration) return node.levelCorrect;
      node.levelChecked = iteration;
      node.levelCorrect = true;
      node.assumptions.forEach((assumption) => {
        if (!checkLevel(assumption, iteration, check)) node.levelCorrect = false;
      });
      checkLevel(node.goal, iteration, check);
      node.level = node.assumptions.reduce(
        (level, assumption) => Math.max(level, assumption.level),
        node.goal.level,
      );
      [node.goal, ...node.assumptions].forEach((part) => mergeLevels(node, part));
      // LevelNode.addTemporalLevelConstraintToConstants.
      if (node.levelCorrect) {
        node.levelParams.forEach((param) => {
          if (param.kind === "OpDecl" && param.declKind === CONSTANT_DECL_KIND) {
            putLevelConstraint(node.levelConstraints, param, ACTION_LEVEL);
          }
        });
      }
      return node.levelCorrect;
    }
  }
};
