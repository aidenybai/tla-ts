import { TEMPORAL_LEVEL } from "../levels";
import type {
  Declaration,
  FunctionDefinition,
  Instance,
  OperatorDefinition,
  SourceLocation,
} from "../ast";
import { createLevelFields } from "./builtins";
import {
  CONSTANT_DECL_KIND,
  type Context,
  createContext,
  type ExprNode,
  type ExprOrOpArgNode,
  formatSanyLocation,
  getContextSymbol,
  getHashtableValues,
  getSymbolArity,
  type InstanceNode,
  isAbsent,
  type LevelNode,
  type ModuleNode,
  type OpDeclNode,
  type OpDefNode,
  type SanyLocation,
  type Subst,
  type SubstInNode,
  type SymbolNode,
  type ThmOrAssumpDefNode,
  VARIABLE_DECL_KIND,
} from "./nodes";
import {
  findToken,
  getExpressionSpan,
  getMatchingIndex,
  getPreComments,
  getSpanLocation,
  getTokenIndex,
  getTokenLocation,
  getTokenSource,
  isToken,
  type SourceFile,
  type TokenSpan,
} from "./source";
import {
  addSymbol,
  applyBuiltin,
  createFormalParam,
  createOpAppl,
  createOpArg,
  createOpDef,
  getLocation,
  getModule,
  getUnitLocation,
  getUnitSpan,
  isParameterFree,
  matchArguments,
  type ModuleGeneration,
  popLabels,
  pushLabelScope,
  resolveSymbol,
  resolveSynonym,
  setRecursionFields,
  withContext,
} from "./generation";
import {
  findNameOrKeyword,
  generateBounds,
  generateExpression,
  generateOperatorArgument,
  generateWithParams,
} from "./generator-expressions";

const getParams = (
  generation: ModuleGeneration,
  definition: OperatorDefinition | Instance,
  span: TokenSpan,
  isAdded: boolean,
) => {
  let cursor = span.start;
  return definition.params.map((param) => {
    const index = param.location
      ? getTokenIndex(generation.file, param.location)
      : findNameOrKeyword(generation.file, cursor, param.name);
    const paramSpan = getOperatorSpan(generation.file, index, param.arity);
    cursor = paramSpan.end + 1;
    const isPrefix = param.arity === 1 && isToken(generation.file, index + 1, "_");
    return createFormalParam(
      generation,
      isPrefix
        ? (generation.file.tokens[index].spelling ?? param.name)
        : resolveSynonym(param.name),
      param.arity,
      getSpanLocation(generation.file, paramSpan),
      isAdded,
    );
  });
};

export const getDefinitionSpan = (
  file: SourceFile,
  definition: { location: SourceLocation; isLocal?: boolean },
) => {
  const span = getUnitSpan(file, definition.location);
  return definition.isLocal &&
    !isToken(file, span.start, "LOCAL") &&
    isToken(file, span.start - 1, "LOCAL")
    ? { start: span.start - 1, end: span.end }
    : span;
};

export const processOperator = (
  generation: ModuleGeneration,
  definition: OperatorDefinition,
  definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
) => {
  const span = getDefinitionSpan(generation.file, definition);
  const location = getSpanLocation(generation.file, span);
  const name = resolveSynonym(definition.name);
  const paramsSpan = { start: definition.isLocal ? span.start + 1 : span.start, end: span.end };
  const generated = withContext(generation, createContext(), () => {
    const params = getParams(generation, definition, paramsSpan, true);
    const existing = resolveSymbol(generation.contexts, name);
    if (existing?.kind === "OpDef" && existing.inRecursive && !existing.isDefined) {
      const isMatching =
        existing.params?.length === params.length && params.every((param) => param.arity === 0);
      if (existing.letInLevel !== generation.curLevel) {
        generation.addError(location, `Recursive operator ${name} defined at wrong LET/IN level.`);
      } else {
        if (!isMatching) {
          generation.addError(
            location,
            `Definition of ${existing.name} has different arity than its RECURSIVE declaration.`,
          );
        }
        existing.params = params;
      }
    } else if (existing !== undefined) {
      generation.addError(location, `Operator ${name} already defined or declared.`);
    }
    pushLabelScope(generation);
    return { params, body: generateExpression(generation, definition.body), existing };
  });
  const labels = popLabels(generation);
  const existing = generated.existing;
  const params = generated.params;
  const preComments = getPreComments(generation.file, span.start);
  if (
    existing?.kind === "OpDef" &&
    existing.inRecursive &&
    !existing.isDefined &&
    existing.letInLevel === generation.curLevel
  ) {
    existing.weights = params.map(() => 0);
    existing.maxLevels = params.map(() => TEMPORAL_LEVEL);
    existing.isLeibnizArg = params.map(() => true);
    existing.labels = labels;
    endOpDefNode(generation, existing, generated.body, location, preComments);
    generation.currentModule.definitions.push(existing);
    definitions?.push(existing);
    return;
  }
  const node = createOpDef(generation, {
    name,
    params,
    body: generated.body,
    isLocal: definition.isLocal,
    location,
    preComments,
    labels,
  });
  addSymbol(generation, node);
  setRecursionFields(generation, node);
  generation.currentModule.definitions.push(node);
  definitions?.push(node);
};

const endOpDefNode = (
  generation: ModuleGeneration,
  node: OpDefNode,
  body: ExprNode,
  location: SanyLocation,
  preComments: string[],
) => {
  node.isDefined = true;
  node.body = body;
  node.location = location;
  node.preComments = preComments;
  if (node.inRecursive) {
    generation.unresolvedCount[generation.curLevel]--;
    generation.unresolvedSum--;
  }
};

export const processFunction = (
  generation: ModuleGeneration,
  definition: FunctionDefinition,
  definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
) => {
  const span = getDefinitionSpan(generation.file, definition);
  const location = getSpanLocation(generation.file, span);
  const context = createContext();
  const nameIndex = definition.isLocal ? span.start + 1 : span.start;
  const bounds = withContext(generation, context, () =>
    generateBounds(generation, definition.bounds, nameIndex + 1),
  );
  const existing = withContext(generation, context, () =>
    resolveSymbol(generation.contexts, definition.name),
  );
  const recursionParam = withContext(generation, context, () =>
    createFormalParam(generation, definition.name, 0, location, existing === undefined),
  );
  const node = applyBuiltin(generation, "$NonRecursiveFcnSpec", [], location, {
    unbounded: [recursionParam],
    ...bounds,
  });
  const isPendingRecursive =
    existing?.kind === "OpDef" && existing.inRecursive && !existing.isDefined;
  const isRecursive = isPendingRecursive && existing.letInLevel === generation.curLevel;
  if (isRecursive) {
    if (existing.arity !== 0) {
      generation.addError(
        location,
        `Function ${existing.name} has operator arguments in its RECURSIVE declaration.`,
      );
    }
  } else if (isPendingRecursive) {
    generation.addError(
      location,
      `Recursive function ${definition.name} defined at wrong LET/IN level.`,
    );
  } else if (existing !== undefined) {
    generation.addError(
      location,
      `Function name \`${definition.name}' already defined or declared.`,
    );
  }
  const preComments = getPreComments(generation.file, span.start);
  const definitionNode =
    existing === undefined
      ? createOpDef(generation, {
          name: definition.name,
          params: [],
          body: node,
          isLocal: definition.isLocal,
          location,
          preComments,
        })
      : existing.kind === "OpDef" && (isRecursive || !isPendingRecursive)
        ? existing
        : undefined;
  if (isRecursive) {
    if (existing.arity === 0) endOpDefNode(generation, existing, node, location, preComments);
  } else if (existing === undefined && definitionNode !== undefined) {
    addSymbol(generation, definitionNode);
    setRecursionFields(generation, definitionNode);
  }
  if (definitionNode !== undefined) {
    generation.currentModule.definitions.push(definitionNode);
    definitions?.push(definitionNode);
  }
  generation.functions.unshift({ name: definition.name, node });
  pushLabelScope(generation);
  const generateBody = () => generateWithParams(generation, bounds.bounded.flat(), definition.body);
  const body =
    definitionNode === undefined ? generateBody() : withContext(generation, context, generateBody);
  const labels = popLabels(generation);
  if (definitionNode !== undefined) definitionNode.labels = labels;
  generation.functions.shift();
  node.operands = [body];
  if (node.operator.name === "$NonRecursiveFcnSpec") node.unbounded = undefined;
};

export const processRecursive = (generation: ModuleGeneration, declarations: Declaration[]) => {
  if (generation.unresolvedSum === 0) generation.recursiveSectionCount++;
  generation.unresolvedCount[generation.curLevel] += declarations.length;
  generation.unresolvedSum += declarations.length;
  declarations.forEach((declaration) => {
    const span = getDeclarationSpan(generation.file, declaration);
    // The OpDeclNode buildParameter makes of the declaration to read its name and arity.
    generation.getId();
    const params = Array.from({ length: declaration.arity }, () =>
      createFormalParam(generation, "", 0, undefined, false),
    );
    const node = createOpDef(generation, {
      name: resolveSynonym(declaration.name),
      params,
      location: getSpanLocation(generation.file, span),
      isDefined: false,
      inRecursive: true,
      inRecursiveSection: true,
      recursiveSection: generation.recursiveSectionCount,
      letInLevel: generation.curLevel,
    });
    addSymbol(generation, node);
    generation.recursiveDeclarations.push(node);
    generation.currentModule.opDefsInRecursiveSection.push(node);
  });
};

export const checkForUndefinedRecursiveOps = (generation: ModuleGeneration) => {
  if (generation.unresolvedCount[generation.curLevel] === 0) return;
  generation.recursiveDeclarations
    .filter((node) => node.letInLevel === generation.curLevel && !node.isDefined)
    .forEach((node) =>
      generation.addError(
        node.location,
        `Symbol ${node.name} declared in RECURSIVE statement but not defined.`,
      ),
    );
  generation.unresolvedSum -= generation.unresolvedCount[generation.curLevel];
};

const processSubstitutions = (
  generation: ModuleGeneration,
  instance: Instance,
  instanceeContext: Context,
  location: SanyLocation,
) => {
  // The SubstInNode processSubst creates, which only the substitutions' templates use.
  generation.getId();
  const declarations = getHashtableValues(instanceeContext.table).filter(
    (symbol): symbol is OpDeclNode => symbol.kind === "OpDecl",
  );
  const substs: Subst[] = declarations.flatMap((declaration) => {
    const symbol = resolveSymbol(generation.contexts, declaration.name);
    if (symbol === undefined) return [];
    const isExpression =
      declaration.declKind === VARIABLE_DECL_KIND ||
      (declaration.declKind === CONSTANT_DECL_KIND && declaration.arity === 0);
    if (isExpression) matchArguments(generation, symbol, [], location);
    return [
      {
        op: declaration,
        expr: isExpression
          ? createOpAppl(generation, symbol, [], location)
          : createOpArg(generation, symbol, location),
        isImplicit: true,
      },
    ];
  });
  const checkArity = (target: OpDeclNode, substitute: ExprOrOpArgNode) => {
    const arity = substitute.kind === "OpArg" ? getSymbolArity(substitute.op) : 0;
    if (arity !== target.arity) {
      generation.addError(
        substitute.location,
        `An operator must be substituted for symbol '${target.name}', and it must have arity ${target.arity}.`,
      );
    }
  };
  const span = getDefinitionSpan(generation.file, instance);
  let cursor = findToken(generation.file, span.start, span.end, "WITH") + 1;
  instance.substitutions.forEach((substitution) => {
    const targetIndex = findToken(generation.file, cursor, span.end, substitution.name);
    if (targetIndex !== -1) {
      cursor = getExpressionSpan(generation.file, substitution.expression).end + 1;
    }
    const target = getContextSymbol(instanceeContext, resolveSynonym(substitution.name));
    if (target?.kind !== "OpDecl") {
      generation.addError(
        targetIndex === -1 ? location : getTokenLocation(generation.file, targetIndex),
        `Identifier '${targetIndex === -1 ? substitution.name : getTokenSource(generation.file, targetIndex)}' is not a legal target of a substitution. \nA legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. \n(Also, check for warnings about multiple declarations of this same identifier.)`,
      );
      return;
    }
    const substitute =
      target.arity === 0
        ? generateExpression(generation, substitution.expression)
        : generateOperatorArgument(generation, substitution.expression, target);
    checkArity(target, substitute);
    const existing = substs.find((subst) => subst.op.name === target.name);
    if (existing && !existing.isImplicit) {
      generation.addError(
        getLocation(generation.file, substitution.expression),
        `Multiple substitutions for symbol '${target.name}' in substitution.`,
      );
    } else if (existing) {
      existing.expr = substitute;
      existing.isImplicit = false;
    } else substs.push({ op: target, expr: substitute, isImplicit: false });
  });
  substs
    .filter((subst) => subst.isImplicit && generation.version !== "1.7.4")
    .forEach((subst) => checkArity(subst.op, subst.expr));
  declarations
    .filter((declaration) => !substs.some((subst) => subst.op.name === declaration.name))
    .forEach((declaration) =>
      generation.addError(
        location,
        `Substitution missing for symbol ${declaration.name} declared at ${formatSanyLocation(declaration.location)} \nand instantiated in module ${generation.currentModule.name}.`,
      ),
    );
  return substs;
};

export const createSubstIn = (
  generation: ModuleGeneration,
  kind: "SubstIn" | "APSubstIn",
  substs: Subst[],
  body: LevelNode,
  instantiatedModule: ModuleNode,
  location: SanyLocation,
  instantiatingModule = generation.currentModule,
): SubstInNode => {
  if (isAbsent(body)) {
    generation.addError(
      location,
      kind === "SubstIn"
        ? "Substitution error, probably due to error \nin module being instantiated."
        : "Substitution error, probably due to error in module being instantiated.",
    );
  }
  return {
    ...createLevelFields(generation.getId()),
    kind,
    substs,
    body,
    instantiatingModule,
    instantiatedModule,
    location,
  };
};

export const processModuleDefinition = (
  generation: ModuleGeneration,
  instance: Instance,
  definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
  instances: InstanceNode[] | undefined,
) => {
  const span = getDefinitionSpan(generation.file, instance);
  const location = getSpanLocation(generation.file, span);
  const preComments = getPreComments(generation.file, span.start);
  const name = instance.name ?? "";
  const parameterContext = createContext();
  const nameIndex = instance.isLocal ? span.start + 1 : span.start;
  if (instance.params.length > 0) generation.contexts.push(parameterContext);
  const args = getParams(
    generation,
    instance,
    { start: nameIndex, end: span.end },
    instance.params.length > 0,
  );
  const instanceeModule = getModule(generation, instance.module);
  const instanceeContext = instanceeModule.context;
  const substs = processSubstitutions(generation, instance, instanceeContext, location);
  if (instance.params.length > 0) generation.contexts.pop();
  getHashtableValues(instanceeContext.table).forEach((symbol) => {
    if (symbol.kind !== "OpDef" || symbol.isLocal) return;
    if (symbol.defKind !== "UserDefined" && symbol.defKind !== "ModuleInstance") return;
    const params = [...args, ...(symbol.params ?? [])];
    const qualifiedName = `${name}!${symbol.name}`;
    const node =
      symbol.defKind === "UserDefined"
        ? createOpDef(generation, {
            name: qualifiedName,
            params,
            body:
              substs.length > 0 && symbol.body
                ? createSubstIn(
                    generation,
                    "SubstIn",
                    substs,
                    symbol.body,
                    instanceeModule,
                    location,
                  )
                : symbol.body,
            isLocal: instance.isLocal,
            location,
            source: symbol.source ?? symbol,
            preComments,
            labels: symbol.labels,
          })
        : createOpDef(generation, {
            defKind: "ModuleInstance",
            name: qualifiedName,
            params,
            isLocal: instance.isLocal,
            location,
            module: symbol.module,
            source: symbol.source ?? symbol,
            preComments,
          });
    addSymbol(generation, node);
    if (symbol.defKind === "UserDefined") setRecursionFields(generation, node);
    (definitions ?? generation.currentModule.definitions).push(node);
  });
  getHashtableValues(instanceeContext.table).forEach((symbol) => {
    if (symbol.kind !== "ThmOrAssumpDef" || symbol.isLocal) return;
    // SANY creates the APSubstInNode before the ThmOrAssumpDefNode that holds it.
    const body =
      substs.length > 0
        ? createSubstIn(generation, "APSubstIn", substs, symbol.body, instanceeModule, location)
        : symbol.body;
    const node: ThmOrAssumpDefNode = {
      ...createLevelFields(generation.getId()),
      kind: "ThmOrAssumpDef",
      name: `${name}!${symbol.name}`,
      isTheorem: symbol.isTheorem,
      body,
      params: [...args, ...symbol.params],
      isLocal: instance.isLocal,
      location,
      module: generation.currentModule,
      source: symbol.source ?? symbol,
      labels: symbol.labels,
      isLeibnizArg: [],
      isLeibniz: false,
      opLevelCond: [],
      maxLevels: [],
      minMaxLevel: [],
    };
    addSymbol(generation, node);
    (definitions ?? generation.currentModule.definitions).push(node);
  });
  const instanceNode: InstanceNode = {
    ...createLevelFields(generation.getId()),
    kind: "Instance",
    name,
    isLocal: instance.isLocal,
    params: args,
    module: instanceeModule,
    substs,
    location,
  };
  (instances ?? generation.currentModule.topLevel).push(instanceNode);
  const moduleDefinition = createOpDef(generation, {
    defKind: "ModuleInstance",
    name,
    params: args,
    isLocal: instance.isLocal,
    location,
    preComments,
  });
  addSymbol(generation, moduleDefinition);
  if (generation.version !== "1.7.4") definitions?.push(moduleDefinition);
};

const reuseSymbol = <Node extends SymbolNode>(generation: ModuleGeneration, symbol: Node) => {
  addSymbol(generation, symbol);
  return symbol;
};

export const generateInstance = (
  generation: ModuleGeneration,
  instance: Instance,
  isTopLevel = true,
  stepLocation?: SanyLocation,
) => {
  const span = getDefinitionSpan(generation.file, instance);
  const location = stepLocation ?? getSpanLocation(generation.file, span);
  const preComments = getPreComments(generation.file, span.start);
  const instanceeModule = getModule(generation, instance.module);
  const instanceeContext = instanceeModule.context;
  const substs = processSubstitutions(generation, instance, instanceeContext, location);
  const isLocal = instance.isLocal;
  const isInstanceeParameterFree = isParameterFree(instanceeModule);
  getHashtableValues(instanceeContext.table).forEach((symbol) => {
    if (symbol.kind !== "OpDef" || symbol.defKind !== "UserDefined" || symbol.isLocal) return;
    const copyFrom = (module: ModuleNode | undefined, body: ExprNode | undefined) => {
      const node = createOpDef(generation, {
        name: symbol.name,
        params: symbol.params,
        body,
        isLocal,
        location,
        module,
        source: symbol.source ?? symbol,
        preComments,
        labels: symbol.labels,
      });
      addSymbol(generation, node);
      return node;
    };
    const isOriginParameterFree = symbol.module === undefined || isParameterFree(symbol.module);
    const node =
      isInstanceeParameterFree || isOriginParameterFree
        ? isLocal
          ? copyFrom(symbol.module, symbol.body)
          : reuseSymbol(generation, symbol)
        : copyFrom(
            generation.currentModule,
            symbol.body &&
              createSubstIn(generation, "SubstIn", substs, symbol.body, instanceeModule, location),
          );
    generation.currentModule.definitions.push(node);
    setRecursionFields(generation, node);
  });
  getHashtableValues(instanceeContext.table).forEach((symbol) => {
    if (symbol.kind !== "ThmOrAssumpDef" || symbol.isLocal) return;
    const copyFrom = (module: ModuleNode, body: LevelNode) => {
      const node: ThmOrAssumpDefNode = {
        ...symbol,
        ...createLevelFields(generation.getId()),
        body,
        isLocal,
        location,
        module,
        source: symbol.source ?? symbol,
      };
      addSymbol(generation, node);
      return node;
    };
    const node = !isInstanceeParameterFree
      ? isParameterFree(symbol.module)
        ? isLocal
          ? copyFrom(generation.currentModule, symbol.body)
          : symbol
        : copyFrom(
            generation.currentModule,
            createSubstIn(generation, "APSubstIn", substs, symbol.body, instanceeModule, location),
          )
      : isLocal
        ? copyFrom(symbol.module, symbol.body)
        : reuseSymbol(generation, symbol);
    if (isTopLevel) generation.currentModule.definitions.push(node);
  });
  const instanceNode: InstanceNode = {
    ...createLevelFields(generation.getId()),
    kind: "Instance",
    name: undefined,
    isLocal,
    params: [],
    module: instanceeModule,
    substs,
    location,
  };
  if (isTopLevel) generation.currentModule.topLevel.push(instanceNode);
  return instanceNode;
};

export const getOperatorSpan = (file: SourceFile, start: number, arity: number) => {
  if (arity === 0) return { start, end: start };
  if (isToken(file, start, "_")) {
    return { start, end: isToken(file, start + 2, "_") ? start + 2 : start + 1 };
  }
  if (isToken(file, start + 1, "(")) return { start, end: getMatchingIndex(file, start + 1) };
  return { start, end: isToken(file, start + 1, "_") ? start + 1 : start };
};

const getDeclarationSpan = (file: SourceFile, declaration: Declaration) =>
  getOperatorSpan(file, getUnitSpan(file, declaration.location).start, declaration.arity);

export const createDeclaration = (
  generation: ModuleGeneration,
  declaration: Declaration,
  declKind: number,
): OpDeclNode => {
  const span = getDeclarationSpan(generation.file, declaration);
  if (declaration.name === "@" && declKind === VARIABLE_DECL_KIND) {
    generation.addError(
      getSpanLocation(generation.file, span),
      "Attempted to declare '@' as a variable.",
    );
  }
  const node: OpDeclNode = {
    ...createLevelFields(generation.getId()),
    levelChecked: 1,
    level: declKind === VARIABLE_DECL_KIND ? 1 : 0,
    kind: "OpDecl",
    name: resolveSynonym(declaration.name),
    arity: declaration.arity,
    declKind,
    location: getSpanLocation(generation.file, span),
    module: generation.currentModule,
  };
  if (declKind === CONSTANT_DECL_KIND) {
    node.levelParams.add(node);
    node.allParams.add(node);
  }
  addSymbol(generation, node);
  return node;
};

export const checkRecursiveSection = (
  generation: ModuleGeneration,
  location: SourceLocation,
  type: string,
) => {
  if (generation.unresolvedSum === 0) return;
  generation.addError(
    getUnitLocation(generation.file, location),
    `${type} may not appear within a recursive definition section.`,
  );
};
