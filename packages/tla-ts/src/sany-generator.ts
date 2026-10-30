import type {
  AssumeProve,
  Assumption,
  Fact,
  Bound,
  Definition,
  Expression,
  FunctionDefinition,
  Instance,
  Module,
  OperatorDefinition,
  OperatorParam,
  NewSymbol,
  Proof,
  ProofStep,
  Theorem,
  UseOrHide,
} from "./ast";
import { getChildren } from "./ast";
import { TlaSyntaxError, TlaUnsupportedError } from "./errors";
import { parseModule } from "./parser";
import { createBuiltins, createLevelFields } from "./sany-builtins";
import {
  CONSTANT_DECL_KIND,
  VARIABLE_DECL_KIND,
  addToContext,
  createContext,
  getContextModule,
  getContextSymbol,
  getDeclarations,
  getHashtableValues,
  type AssumeNode,
  type AssumeProveNode,
  type Context,
  type ExprNode,
  type ExprOrOpArgNode,
  type FormalParamNode,
  type InstanceNode,
  type LabelNode,
  type LetInNode,
  type LeafProofNode,
  type LevelNode,
  type ModuleNode,
  type NewSymbNode,
  type NonLeafProofNode,
  type OpApplNode,
  type OpArgNode,
  type OpDeclNode,
  type OpDefNode,
  type ProofStepNode,
  type SanyLocation,
  type Subst,
  type SubstInNode,
  type SymbolNode,
  type TheoremNode,
  type ThmOrAssumpDefNode,
  type UseOrHideNode,
} from "./sany-nodes";
import {
  createSourceFile,
  findNameTokens,
  findToken,
  getExpressionSpan,
  getMatchingIndex,
  getParenthesizedSpan,
  getPreComments,
  getRangeSpan,
  getSpanLocation,
  getTokenIndex,
  getTokenLocation,
  isToken,
  type SourceFile,
  type TokenSpan,
} from "./sany-source";
import { SANY_OPERATOR_SYNONYMS } from "./tlc-modules";

const SYNONYMS = new Map(
  SANY_OPERATOR_SYNONYMS.flatMap(([canonical, ...synonyms]) =>
    synonyms.map((synonym) => [synonym, canonical]),
  ),
);

// tla2sany.parser.Operators.resolveSynonym, applied to each part of a name like I!\cup.
const resolveSynonym = (name: string) =>
  name
    .split("!")
    .map((part) => SYNONYMS.get(part) ?? (part === "~" ? "\\lnot" : part))
    .join("!");

interface ExternalModule {
  module: ModuleNode;
  context: Context;
}

export interface SanySpecification {
  root: ModuleNode;
  modules: ModuleNode[];
}

interface SymbolTable {
  contexts: Context[];
}

const getTopContext = (table: SymbolTable) => table.contexts[table.contexts.length - 1];

const resolveSymbol = (table: SymbolTable, name: string) => {
  for (let index = table.contexts.length - 1; index >= 0; index--) {
    const symbol = getContextSymbol(table.contexts[index], name);
    if (symbol) return symbol;
  }
  return undefined;
};

// SymbolTable.addSymbol: a symbol joins the innermost context unless its name is taken.
const addSymbol = (table: SymbolTable, symbol: SymbolNode) => {
  if (resolveSymbol(table, symbol.name) === undefined) addToContext(getTopContext(table), symbol);
};

const isParameterFree = (module: ModuleNode) =>
  getDeclarations(module, CONSTANT_DECL_KIND).length === 0 &&
  getDeclarations(module, VARIABLE_DECL_KIND).length === 0;

const getLetInstances = (expression: Expression): Instance[] => [
  ...(expression.kind === "Let" ? (expression.instances ?? []) : []),
  ...getChildren(expression).flatMap(getLetInstances),
];

const getDefinitionInstances = (definition: Definition) => getLetInstances(definition.body);

// The modules a file extends and instantiates, as SANY's ParseUnit collects them.
const getDependencies = (module: Module) => {
  const innerNames = new Set<string>();
  const extendees: string[] = [];
  const instancees: string[] = [];
  const visit = (current: Module) => {
    innerNames.add(current.name);
    extendees.push(...current.extends);
    current.units.forEach((unit) => {
      if (unit.kind === "Instance") instancees.push(unit.instance.module);
      if (unit.kind === "Definition") {
        instancees.push(...getDefinitionInstances(unit.definition).map((inner) => inner.module));
      }
      if (unit.kind === "Module") visit(unit.module);
    });
  };
  visit(module);
  return [...extendees, ...instancees].filter((name) => !innerNames.has(name));
};

// Builds the semantic graph SANY builds for a specification and its modules, in the order SANY
// analyzes them: a module after the modules it extends and instantiates.
export const generateSanySpecification = (
  rootSource: string,
  loadModule: (name: string) => string | undefined,
): SanySpecification => {
  const counter = { value: 0 };
  const getId = () => ++counter.value;
  const builtins = createBuiltins(getId);
  const externalModules = new Map<string, ExternalModule>();
  const sources = new Map<string, { file: SourceFile; module: Module }>();

  const getSource = (name: string, text: string | undefined) => {
    const cached = sources.get(name);
    if (cached) return cached;
    if (text === undefined) throw new TlaSyntaxError(`Cannot find source file for module ${name}`);
    const module = parseModule(text);
    const entry = { file: createSourceFile(module.name, text), module };
    sources.set(name, entry);
    return entry;
  };

  const order: string[] = [];
  const visiting = new Set<string>();
  const calculateDependencies = (name: string, text: string | undefined) => {
    if (visiting.has(name)) return;
    visiting.add(name);
    const entry = getSource(name, text);
    getDependencies(entry.module).forEach((dependency) =>
      calculateDependencies(dependency, loadModule(dependency)),
    );
    if (!order.includes(name)) order.push(name);
  };
  const rootName = parseModule(rootSource).name;
  calculateDependencies(rootName, rootSource);

  const addToContextModule = (table: SymbolTable, module: ModuleNode) => {
    const context = getTopContext(table);
    if (getContextModule(context, module.name) === undefined) addToContext(context, module);
  };

  order.forEach((name) => {
    const entry = getSource(name, undefined);
    const context = createContext();
    // A module's context starts as a copy of SANY's global context of builtins, whose list of
    // symbols runs from the last builtin to the first.
    builtins.toReversed().forEach((builtin) => addToContext(context, builtin));
    const module = generateModule(entry.module, entry.file, undefined, {
      contexts: [context],
    });
    externalModules.set(name, { module, context });
  });

  function generateModule(
    ast: Module,
    file: SourceFile,
    parent: ModuleNode | undefined,
    symbolTable: SymbolTable,
  ): ModuleNode {
    const state = {
      curLevel: 0,
      unresolvedCount: [0],
      unresolvedSum: 0,
      recursiveSectionCount: 0,
    };
    const functions: { name: string; node: OpApplNode }[] = [];
    const exceptStack: OpApplNode[] = [];
    const exceptSpecStack: OpApplNode[] = [];
    const recursiveDeclarations: OpDefNode[] = [];

    const getLocation = (expression: Expression) =>
      getSpanLocation(file, getExpressionSpan(file, expression));

    const getUnitSpan = (location: { line: number; column: number; range?: unknown }) =>
      location.range
        ? getRangeSpan(file, location.range as never)
        : { start: getTokenIndex(file, location), end: getTokenIndex(file, location) };

    const currentModule: ModuleNode = {
      kind: "Module",
      id: getId(),
      name: ast.name,
      location: getSpanLocation(file, getUnitSpan(ast.location)),
      extendees: [],
      context: getTopContext(symbolTable),
      topLevel: [],
      definitions: [],
      opDefsInRecursiveSection: [],
      isLevelChecked: false,
    };
    if (parent) parent.definitions.push(currentModule);

    const resolveModule = (name: string) => {
      for (let index = symbolTable.contexts.length - 1; index >= 0; index--) {
        const module = getContextModule(symbolTable.contexts[index], name);
        if (module?.kind === "Module") return module;
      }
      return externalModules.get(name)?.module;
    };

    const getModuleContext = (name: string) => {
      const module = resolveModule(name);
      if (module === undefined) throw new TlaSyntaxError(`Could not find module ${name}`);
      return module.context;
    };

    const withContext = <Result>(context: Context, generate: () => Result) => {
      symbolTable.contexts.push(context);
      const result = generate();
      symbolTable.contexts.pop();
      return result;
    };

    const createFormalParam = (
      name: string,
      arity: number,
      location: SanyLocation | undefined,
      isAdded: boolean,
    ): FormalParamNode => {
      const param: FormalParamNode = {
        ...createLevelFields(getId()),
        kind: "FormalParam",
        name,
        arity,
        location,
      };
      if (isAdded) addSymbol(symbolTable, param);
      return param;
    };

    const createOpDef = (
      fields: Partial<OpDefNode> & Pick<OpDefNode, "name" | "location">,
    ): OpDefNode => ({
      ...createLevelFields(getId()),
      kind: "OpDef",
      defKind: "UserDefined",
      arity: fields.params?.length ?? 0,
      params: [],
      body: undefined,
      isLocal: false,
      module: currentModule,
      source: undefined,
      preComments: [],
      isDefined: true,
      inRecursive: false,
      inRecursiveSection: false,
      recursiveSection: -1,
      letInLevel: 0,
      weights: (fields.params ?? []).map(() => 0),
      isLeibnizArg: (fields.params ?? []).map(() => true),
      isLeibniz: true,
      opLevelCond: undefined,
      ...fields,
    });

    const setRecursionFields = (definition: OpDefNode) => {
      definition.letInLevel = state.curLevel;
      if (state.unresolvedSum > 0) {
        definition.recursiveSection = state.recursiveSectionCount;
        definition.inRecursiveSection = state.unresolvedCount[state.curLevel] > 0;
        currentModule.opDefsInRecursiveSection.push(definition);
      }
    };

    const createOpAppl = (
      operator: SymbolNode,
      operands: (ExprOrOpArgNode | undefined)[],
      location: SanyLocation,
      binding: Partial<Pick<OpApplNode, "unbounded" | "bounded" | "tupleOrs" | "ranges">> = {},
    ): OpApplNode => ({
      ...createLevelFields(getId()),
      kind: "OpAppl",
      operator,
      operands,
      unbounded: binding.unbounded,
      bounded: binding.bounded,
      tupleOrs: binding.tupleOrs,
      ranges: binding.ranges ?? [],
      location,
    });

    const getBuiltin = (name: string) => {
      const builtin = builtins.find((candidate) => candidate.name === name);
      if (!builtin) throw new TlaUnsupportedError(`SANY has no builtin operator ${name}`);
      return builtin;
    };

    const applyBuiltin = (
      name: string,
      operands: (ExprOrOpArgNode | undefined)[],
      location: SanyLocation,
      binding: Partial<Pick<OpApplNode, "unbounded" | "bounded" | "tupleOrs" | "ranges">> = {},
    ) => createOpAppl(getBuiltin(name), operands, location, binding);

    const createString = (value: string, location: SanyLocation): ExprNode => ({
      ...createLevelFields(getId()),
      kind: "String",
      value,
      location,
    });

    const createOpArg = (op: SymbolNode, location: SanyLocation): OpArgNode => ({
      ...createLevelFields(getId()),
      kind: "OpArg",
      op,
      location,
    });

    const resolveName = (name: string, location: SanyLocation) => {
      const symbol = resolveSymbol(symbolTable, resolveSynonym(name));
      if (symbol === undefined || symbol.kind === "Module") {
        throw new TlaSyntaxError(
          `Unknown operator: \`${name}' at line ${location.beginLine}, column ${location.beginColumn} of module ${location.file}`,
        );
      }
      return symbol;
    };

    const checkRecursion = (node: ExprNode) => {
      if (node.kind !== "OpAppl") return;
      const recursive = functions.find((entry) => entry.name === node.operator.name);
      if (recursive) recursive.node.operator = getBuiltin("$RecursiveFcnSpec");
    };

    // The bound groups of a quantifier, set filter, set map or function: tla-ts expands
    // \A x, y \in S into a bound per name that shares the set, and SANY keeps one group.
    const getBoundGroups = (bounds: Bound[]) =>
      bounds.reduce<Bound[][]>((groups, bound) => {
        const last = groups[groups.length - 1];
        const isSameGroup =
          last !== undefined &&
          last[0].set === bound.set &&
          bound.pattern.kind === "Name" &&
          last[0].pattern.kind === "Name";
        if (isSameGroup) last.push(bound);
        else groups.push([bound]);
        return groups;
      }, []);

    interface BoundSymbols {
      bounded: FormalParamNode[][];
      tupleOrs: boolean[];
      ranges: ExprNode[];
    }

    // processQuantBoundArgs: SANY generates every bounding set before it declares the symbols,
    // each named at its token between the end of the previous group and its set.
    const generateBounds = (bounds: Bound[], searchStart: number): BoundSymbols => {
      const groups = getBoundGroups(bounds);
      const ranges = groups.map((group) => generateExpression(group[0].set));
      const cursor = { value: searchStart };
      const bounded = groups.map((group) => {
        const setSpan = getExpressionSpan(file, group[0].set);
        const names = group.flatMap((bound) =>
          bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names,
        );
        const indexes = findNameTokens(file, cursor.value, setSpan.start, names);
        cursor.value = setSpan.end + 1;
        return names.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, indexes[index]), true),
        );
      });
      return {
        bounded,
        tupleOrs: groups.map((group) => group[0].pattern.kind === "Tuple"),
        ranges,
      };
    };

    const generateLambda = (expression: Expression & { kind: "Lambda" }): OpDefNode => {
      const span = getExpressionSpan(file, expression);
      const nameIndexes = findNameTokens(file, span.start, span.end, expression.params);
      return withContext(createContext(), () => {
        const params = expression.params.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, nameIndexes[index]), true),
        );
        const body = generateExpression(expression.body);
        return createOpDef({
          name: "LAMBDA",
          params,
          body,
          location: getSpanLocation(file, span),
          preComments: getPreComments(file, span.start),
        });
      });
    };

    const generateOperatorArgument = (argument: Expression): ExprOrOpArgNode => {
      const location = getLocation(argument);
      if (argument.kind === "Lambda") {
        if (argument.location.range !== undefined)
          return createOpArg(generateLambda(argument), location);
        // tla-ts desugars an operator symbol passed as an argument, such as SUBSET or -., into a
        // LAMBDA without a range.
        const name =
          argument.body.kind === "Apply"
            ? argument.body.operator
            : file.tokens[getTokenIndex(file, argument.location)].text;
        return createOpArg(resolveName(name, location), location);
      }
      if (argument.kind === "Identifier")
        return createOpArg(resolveName(argument.name, location), location);
      if (argument.kind === "OperatorReference") {
        return createOpArg(resolveName(argument.operator, location), location);
      }
      throw new TlaSyntaxError(
        `An expression appears where an operator is required at line ${location.beginLine}`,
      );
    };

    // generateExprOrOpArg: an argument is an operator where the parameter takes arguments.
    const generateArgument = (operator: SymbolNode, index: number, argument: Expression) => {
      const isDefinition =
        operator.kind === "OpDef" &&
        (operator.defKind === "UserDefined" || operator.defKind === "ModuleInstance");
      const expectedArity = isDefinition ? (operator.params?.[index]?.arity ?? 0) : 0;
      return expectedArity === 0
        ? generateExpression(argument)
        : generateOperatorArgument(argument);
    };

    const generateApplication = (name: string, args: Expression[], location: SanyLocation) => {
      const operator = resolveName(name, location);
      const node = createOpAppl(
        operator,
        args.map((argument, index) => generateArgument(operator, index, argument)),
        location,
      );
      return node;
    };

    // A /\ B /\ C nests as ((A /\ B) /\ C) in SANY; tla-ts flattens it.
    const generateJunction = (expression: Expression & { kind: "And" | "Or" }) => {
      const location = getLocation(expression);
      if (expression.isBulleted) {
        return applyBuiltin(
          expression.kind === "And" ? "$ConjList" : "$DisjList",
          expression.operands.map(generateExpression),
          location,
        );
      }
      const span = getExpressionSpan(file, expression);
      const name = expression.kind === "And" ? "\\land" : "\\lor";
      const [first, ...rest] = expression.operands;
      return rest.reduce<OpApplNode>(
        (left, operand, index) => {
          const operandSpan = getParenthesizedSpan(file, getExpressionSpan(file, operand));
          const end = index === rest.length - 1 ? span.end : operandSpan.end;
          return applyBuiltin(
            name,
            [left, generateExpression(operand)],
            getSpanLocation(file, { start: span.start, end }),
          );
        },
        generateExpression(first) as OpApplNode,
      );
    };

    const generateCase = (expression: Expression & { kind: "Case" }) => {
      const span = getExpressionSpan(file, expression);
      const arms = expression.arms.map((arm, index) => {
        const condition = getParenthesizedSpan(file, getExpressionSpan(file, arm.condition));
        const isLast = index === expression.arms.length - 1 && expression.other === undefined;
        const body = getParenthesizedSpan(file, getExpressionSpan(file, arm.body));
        const operands = [generateExpression(arm.condition), generateExpression(arm.body)];
        return applyBuiltin(
          "$Pair",
          operands,
          getSpanLocation(file, { start: condition.start, end: isLast ? span.end : body.end }),
        );
      });
      const other = expression.other;
      if (other) {
        const body = getParenthesizedSpan(file, getExpressionSpan(file, other));
        const otherIndex = findTokenBefore(body.start, "OTHER");
        arms.push(
          applyBuiltin(
            "$Pair",
            [undefined, generateExpression(other)],
            getSpanLocation(file, { start: otherIndex, end: span.end }),
          ),
        );
      }
      return applyBuiltin("$Case", arms, getSpanLocation(file, span));
    };

    const findTokenBefore = (index: number, text: string) => {
      for (let current = index; current >= 0; current--) {
        if (isToken(file, current, text)) return current;
      }
      return index;
    };

    const generateExcept = (expression: Expression & { kind: "Except" }) => {
      const span = getExpressionSpan(file, expression);
      const location = getSpanLocation(file, span);
      const operands: ExprOrOpArgNode[] = [generateExpression(expression.function)];
      const exceptNode = applyBuiltin("$Except", operands, location);
      const functionSpan = getExpressionSpan(file, expression.function);
      const cursor = { value: findToken(file, functionSpan.end + 1, span.end, "EXCEPT") + 1 };
      expression.updates.forEach((update) => {
        const bang = findToken(file, cursor.value, span.end, "!");
        const valueSpan = getParenthesizedSpan(file, getExpressionSpan(file, update.value));
        const specLocation = getSpanLocation(file, { start: bang, end: valueSpan.end });
        const pathCursor = { value: bang + 1 };
        const components = update.path.map((step): ExprNode => {
          if (step.kind === "Field") {
            const nameIndex = findNameOrKeyword(pathCursor.value, step.name);
            pathCursor.value = nameIndex + 1;
            return createString(step.name, getTokenLocation(file, nameIndex));
          }
          const open = findToken(file, pathCursor.value, span.end, "[");
          const close = getMatchingIndex(file, open);
          pathCursor.value = close + 1;
          if (step.args.length === 1) return generateExpression(step.args[0]);
          return applyBuiltin(
            "$Tuple",
            step.args.map(generateExpression),
            getSpanLocation(file, { start: open, end: close }),
          );
        });
        const sequence = applyBuiltin("$Seq", components, specLocation);
        const pair = applyBuiltin("$Pair", [sequence], specLocation);
        exceptSpecStack.push(pair);
        exceptStack.push(exceptNode);
        pair.operands.push(generateExpression(update.value));
        exceptSpecStack.pop();
        exceptStack.pop();
        operands.push(pair);
        cursor.value = valueSpan.end + 1;
      });
      return exceptNode;
    };

    const findNameOrKeyword = (start: number, name: string) => {
      for (let index = start; index < file.tokens.length; index++) {
        if (file.tokens[index].text === name && file.tokens[index].kind !== "String") return index;
      }
      return start;
    };

    const generateRecordFields = (
      operator: "$RcdConstructor" | "$SetOfRcds",
      expression: Expression & { kind: "Record" | "RecordSet" },
    ) => {
      const span = getExpressionSpan(file, expression);
      const cursor = { value: span.start + 1 };
      const pairs = expression.fields.map((field) => {
        const nameIndex = findNameOrKeyword(cursor.value, field.name);
        const valueSpan = getParenthesizedSpan(file, getExpressionSpan(file, field.value));
        cursor.value = valueSpan.end + 1;
        return applyBuiltin(
          "$Pair",
          [
            createString(field.name, getTokenLocation(file, nameIndex)),
            generateExpression(field.value),
          ],
          getSpanLocation(file, { start: nameIndex, end: valueSpan.end }),
        );
      });
      return applyBuiltin(operator, pairs, getSpanLocation(file, span));
    };

    const getTokenPosition = (index: number) => ({
      line: file.tokens[index].line,
      column: file.tokens[index].column,
    });

    // The declarations of a RECURSIVE statement, which the syntax tree of a LET leaves out:
    // names, each with (_, ...) for its arguments.
    const getRecursiveDeclarations = (start: number) => {
      const declarations: RecursiveDeclaration[] = [];
      let index = start;
      while (file.tokens[index]?.kind === "Identifier") {
        const end = isToken(file, index + 1, "(") ? getMatchingIndex(file, index + 1) : index;
        const arity = file.tokens
          .slice(index + 1, end)
          .filter((token) => token.text === "_").length;
        declarations.push({
          name: file.tokens[index].text,
          arity,
          location: {
            ...getTokenPosition(index),
            range: {
              module: file.name,
              start: getTokenPosition(index),
              end: getTokenPosition(end),
            },
          },
        });
        if (!isToken(file, end + 1, ",")) break;
        index = end + 2;
      }
      return declarations;
    };

    // The units of a LET in source order, with its RECURSIVE statements found among its tokens.
    const getLetUnits = (expression: Expression & { kind: "Let" }) => {
      const units = [
        ...expression.definitions.map((definition) => ({
          unit: { kind: "Definition", definition } satisfies LetUnit,
          span: getDefinitionSpan(definition),
        })),
        ...(expression.instances ?? []).map((instance) => ({
          unit: { kind: "Instance", instance } satisfies LetUnit,
          span: getDefinitionSpan(instance),
        })),
      ];
      const letStart = getExpressionSpan(file, expression).start;
      const bodyStart = getParenthesizedSpan(file, getExpressionSpan(file, expression.body)).start;
      const recursives: { unit: LetUnit; span: TokenSpan }[] = [];
      for (let index = letStart + 1; index < bodyStart; index++) {
        const isInUnit = units.some(
          (entry) => entry.span.start <= index && index <= entry.span.end,
        );
        if (isToken(file, index, "RECURSIVE") && !isInUnit) {
          recursives.push({
            unit: { kind: "Recursive", declarations: getRecursiveDeclarations(index + 1) },
            span: { start: index, end: index },
          });
        }
      }
      return [...units, ...recursives]
        .toSorted((first, second) => first.span.start - second.span.start)
        .map((entry) => entry.unit);
    };

    const generateLet = (expression: Expression & { kind: "Let" }): LetInNode => {
      const context = createContext();
      return withContext(context, () => {
        state.curLevel++;
        state.unresolvedCount[state.curLevel] = 0;
        const opDefs: (OpDefNode | ThmOrAssumpDefNode)[] = [];
        const instances: InstanceNode[] = [];
        getLetUnits(expression).forEach((unit) => {
          if (unit.kind === "Recursive") processRecursive(unit.declarations);
          else if (unit.kind === "Instance") {
            processModuleDefinition(unit.instance, opDefs, instances);
          } else if (unit.definition.kind === "Function") {
            processFunction(unit.definition, opDefs);
          } else {
            const definition = processOperator(unit.definition, opDefs);
            currentModule.definitions.push(definition);
          }
        });
        checkForUndefinedRecursiveOps();
        state.curLevel = Math.max(state.curLevel - 1, 0);
        const body = generateExpression(expression.body);
        return {
          ...createLevelFields(getId()),
          kind: "LetIn",
          opDefs,
          instances,
          body,
          location: getLocation(expression),
        };
      });
    };

    const generateChoose = (expression: Expression & { kind: "Choose" }) => {
      const span = getExpressionSpan(file, expression);
      const location = getSpanLocation(file, span);
      return withContext(createContext(), () => {
        const pattern = expression.pattern;
        const names = pattern.kind === "Name" ? [pattern.name] : pattern.names;
        if (expression.set === undefined) {
          const indexes = findNameTokens(file, span.start, span.end, names);
          // SANY locates the symbol of CHOOSE x : P at the CHOOSE keyword.
          const params = names.map((name, index) =>
            createFormalParam(
              name,
              0,
              getTokenLocation(file, pattern.kind === "Name" ? span.start : indexes[index]),
              true,
            ),
          );
          const body = generateExpression(expression.body);
          return applyBuiltin("$UnboundedChoose", [body], location, { unbounded: params });
        }
        const range = generateExpression(expression.set);
        const setSpan = getExpressionSpan(file, expression.set);
        const indexes = findNameTokens(file, span.start, setSpan.start, names);
        const params = names.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, indexes[index]), true),
        );
        const body = generateExpression(expression.body);
        return applyBuiltin("$BoundedChoose", [body], location, {
          bounded: [params],
          tupleOrs: [pattern.kind === "Tuple"],
          ranges: [range],
        });
      });
    };

    function generateExpression(expression: Expression): ExprNode {
      const location = getLocation(expression);
      switch (expression.kind) {
        case "Number":
          return {
            ...createLevelFields(getId()),
            kind: "Numeral",
            value: getNumeralValue(expression.text ?? String(expression.value)),
            location,
          };
        case "Decimal": {
          const [integralPart, fractionalPart] = expression.text.split(".");
          const mantissa = BigInt(integralPart + fractionalPart);
          const isLong = mantissa <= 9223372036854775807n;
          return {
            ...createLevelFields(getId()),
            kind: "Decimal",
            mantissa: isLong ? mantissa.toString() : mantissa.toString(),
            exponent: isLong ? String(-fractionalPart.length) : String(fractionalPart.length),
            integralPart,
            fractionalPart,
            location,
          };
        }
        case "String":
          return createString(expression.value, location);
        case "Identifier": {
          const node = generateApplication(expression.name, [], location);
          checkRecursion(node);
          return node;
        }
        case "Apply": {
          const node = generateApplication(expression.operator, expression.args, location);
          if (expression.operator.includes("!") || /^[A-Za-z0-9_]+$/.test(expression.operator)) {
            checkRecursion(node);
          }
          return node;
        }
        case "OperatorReference":
        case "Lambda":
          throw new TlaSyntaxError(
            `An operator appears where an expression is required at line ${location.beginLine}`,
          );
        case "And":
        case "Or":
          return generateJunction(expression);
        case "Prime":
          return applyBuiltin("'", [generateExpression(expression.expression)], location);
        case "Unchanged":
          return applyBuiltin("UNCHANGED", [generateExpression(expression.expression)], location);
        case "Enabled":
          return applyBuiltin("ENABLED", [generateExpression(expression.expression)], location);
        case "Always":
          return applyBuiltin("[]", [generateExpression(expression.expression)], location);
        case "Eventually":
          return applyBuiltin("<>", [generateExpression(expression.expression)], location);
        case "If":
          return applyBuiltin(
            "$IfThenElse",
            [
              generateExpression(expression.condition),
              generateExpression(expression.consequent),
              generateExpression(expression.alternative),
            ],
            location,
          );
        case "Case":
          return generateCase(expression);
        case "Let":
          return generateLet(expression);
        case "Forall":
        case "Exists": {
          const span = getExpressionSpan(file, expression);
          return withContext(createContext(), () => {
            const bounds = generateBounds(expression.bounds, span.start);
            const body = generateExpression(expression.body);
            return applyBuiltin(
              expression.kind === "Forall" ? "$BoundedForall" : "$BoundedExists",
              [body],
              location,
              bounds,
            );
          });
        }
        case "UnboundedQuantifier": {
          const span = getExpressionSpan(file, expression);
          const bodySpan = getExpressionSpan(file, expression.body);
          const indexes = findNameTokens(file, span.start, bodySpan.start, expression.names);
          const name = expression.isTemporal
            ? expression.quantifier === "Forall"
              ? "$TemporalForall"
              : "$TemporalExists"
            : expression.quantifier === "Forall"
              ? "$UnboundedForall"
              : "$UnboundedExists";
          return withContext(createContext(), () => {
            const params = expression.names.map((paramName, index) =>
              createFormalParam(paramName, 0, getTokenLocation(file, indexes[index]), true),
            );
            const body = generateExpression(expression.body);
            return applyBuiltin(name, [body], location, { unbounded: params });
          });
        }
        case "Choose":
          return generateChoose(expression);
        case "SetEnumeration":
          return applyBuiltin(
            "$SetEnumerate",
            expression.elements.map(generateExpression),
            location,
          );
        case "Tuple":
          return applyBuiltin("$Tuple", expression.elements.map(generateExpression), location);
        case "SetFilter": {
          const range = generateExpression(expression.bound.set);
          const span = getExpressionSpan(file, expression);
          return withContext(createContext(), () => {
            const bounds = generateBoundsWithRanges([expression.bound], span.start, [range]);
            const body = generateExpression(expression.predicate);
            return applyBuiltin("$SubsetOf", [body], location, bounds);
          });
        }
        case "SetMap": {
          const expressionSpan = getExpressionSpan(file, expression.expression);
          return withContext(createContext(), () => {
            const bounds = generateBounds(expression.bounds, expressionSpan.end + 1);
            const body = generateExpression(expression.expression);
            return applyBuiltin("$SetOfAll", [body], location, bounds);
          });
        }
        case "FunctionConstruction": {
          const span = getExpressionSpan(file, expression);
          return withContext(createContext(), () => {
            const bounds = generateBounds(expression.bounds, span.start);
            const body = generateExpression(expression.body);
            return applyBuiltin("$FcnConstructor", [body], location, bounds);
          });
        }
        case "FunctionSet":
          return applyBuiltin(
            "$SetOfFcns",
            [generateExpression(expression.domain), generateExpression(expression.range)],
            location,
          );
        case "Record":
          return generateRecordFields("$RcdConstructor", expression);
        case "RecordSet":
          return generateRecordFields("$SetOfRcds", expression);
        case "Except":
          return generateExcept(expression);
        case "ExceptAt": {
          const except = exceptStack[exceptStack.length - 1];
          const component = exceptSpecStack[exceptSpecStack.length - 1];
          if (except === undefined || component === undefined) {
            throw new TlaSyntaxError(
              `@ used where its meaning is not defined at line ${location.beginLine}`,
            );
          }
          return {
            ...createLevelFields(getId()),
            kind: "At",
            except,
            component,
            location: component.location,
          };
        }
        case "FunctionApplication": {
          const fn = generateExpression(expression.function);
          checkRecursion(fn);
          const argument =
            expression.args.length === 1
              ? generateExpression(expression.args[0])
              : applyBuiltin("$Tuple", expression.args.map(generateExpression), location);
          return applyBuiltin("$FcnApply", [fn, argument], location);
        }
        case "FieldAccess": {
          const record = generateExpression(expression.record);
          const span = getExpressionSpan(file, expression);
          return applyBuiltin(
            "$RcdSelect",
            [record, createString(expression.field, getTokenLocation(file, span.end))],
            location,
          );
        }
        case "Product":
          return applyBuiltin(
            "$CartesianProd",
            expression.factors.map(generateExpression),
            location,
          );
        case "BoxAction":
        case "AngleAction":
          return applyBuiltin(
            expression.kind === "BoxAction" ? "$SquareAct" : "$AngleAct",
            [generateExpression(expression.action), generateExpression(expression.subscript)],
            location,
          );
        case "WeakFairness":
        case "StrongFairness":
          return applyBuiltin(
            expression.kind === "WeakFairness" ? "$WF" : "$SF",
            [generateExpression(expression.subscript), generateExpression(expression.action)],
            location,
          );
        case "Label":
          return generateLabel(expression);
        case "Subexpression":
          throw new TlaUnsupportedError(
            `tla-ts does not export subexpression references to XML, at line ${location.beginLine}`,
          );
      }
    }

    const generateBoundsWithRanges = (
      bounds: Bound[],
      searchStart: number,
      ranges: ExprNode[],
    ): BoundSymbols => {
      const groups = getBoundGroups(bounds);
      const cursor = { value: searchStart };
      const bounded = groups.map((group) => {
        const setSpan = getExpressionSpan(file, group[0].set);
        const names = group.flatMap((bound) =>
          bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names,
        );
        const indexes = findNameTokens(file, cursor.value, setSpan.start, names);
        cursor.value = setSpan.end + 1;
        return names.map((name, index) =>
          createFormalParam(name, 0, getTokenLocation(file, indexes[index]), true),
        );
      });
      return {
        bounded,
        tupleOrs: groups.map((group) => group[0].pattern.kind === "Tuple"),
        ranges,
      };
    };

    const generateLabel = (expression: Expression & { kind: "Label" }): LabelNode => {
      const location = getLocation(expression);
      const body = generateExpression(expression.body);
      const params = expression.params.map((name) => {
        const symbol = resolveSymbol(symbolTable, name);
        return symbol?.kind === "FormalParam"
          ? symbol
          : createFormalParam(name, 0, location, false);
      });
      return {
        ...createLevelFields(getId()),
        kind: "Label",
        name: expression.name,
        params,
        body,
        location,
      };
    };

    // The parameters of a definition's left-hand side, located as SANY locates them: a name, or a
    // name with its underscores like Op(_, _).
    const getParams = (
      definition: OperatorDefinition | Instance,
      span: TokenSpan,
      isAdded: boolean,
    ) => {
      const cursor = { value: span.start };
      return definition.params.map((param: OperatorParam) => {
        const index = param.location
          ? getTokenIndex(file, param.location)
          : findNameOrKeyword(cursor.value, param.name);
        const span = getOperatorSpan(index, param.arity);
        cursor.value = span.end + 1;
        return createFormalParam(
          resolveSynonym(param.name),
          param.arity,
          getSpanLocation(file, span),
          isAdded,
        );
      });
    };

    // The span of a definition or instance, with the LOCAL before it.
    const getDefinitionSpan = (definition: {
      location: { line: number; column: number; range?: unknown };
      isLocal?: boolean;
    }) => {
      const span = getUnitSpan(definition.location);
      return definition.isLocal &&
        !isToken(file, span.start, "LOCAL") &&
        isToken(file, span.start - 1, "LOCAL")
        ? { start: span.start - 1, end: span.end }
        : span;
    };

    function processOperator(
      definition: OperatorDefinition,
      definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
    ): OpDefNode {
      const span = getDefinitionSpan(definition);
      const location = getSpanLocation(file, span);
      const name = resolveSynonym(definition.name);
      const paramsSpan = { start: definition.isLocal ? span.start + 1 : span.start, end: span.end };
      const { params, body } = withContext(createContext(), () => {
        const params = getParams(definition, paramsSpan, true);
        return { params, body: generateExpression(definition.body) };
      });
      const existing = resolveSymbol(symbolTable, name);
      const isRecursive =
        existing?.kind === "OpDef" &&
        existing.inRecursive &&
        !existing.isDefined &&
        existing.letInLevel === state.curLevel;
      const preComments = getPreComments(file, span.start);
      if (isRecursive && existing.kind === "OpDef") {
        existing.params = params;
        existing.arity = params.length;
        existing.weights = params.map(() => 0);
        existing.isLeibnizArg = params.map(() => true);
        endOpDefNode(existing, body, location, preComments);
        definitions?.push(existing);
        return existing;
      }
      const node = createOpDef({
        name,
        params,
        body,
        isLocal: definition.isLocal,
        location,
        preComments,
      });
      addSymbol(symbolTable, node);
      setRecursionFields(node);
      definitions?.push(node);
      return node;
    }

    const endOpDefNode = (
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
        state.unresolvedCount[state.curLevel]--;
        state.unresolvedSum--;
      }
    };

    function processFunction(
      definition: FunctionDefinition,
      definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
    ) {
      const span = getDefinitionSpan(definition);
      const location = getSpanLocation(file, span);
      const context = createContext();
      const nameIndex = definition.isLocal ? span.start + 1 : span.start;
      const bounds = withContext(context, () => generateBounds(definition.bounds, nameIndex + 1));
      const existing = resolveSymbol(symbolTable, definition.name);
      const recursionParam = withContext(context, () =>
        createFormalParam(definition.name, 0, location, existing === undefined),
      );
      const node = applyBuiltin("$NonRecursiveFcnSpec", [], location, {
        unbounded: [recursionParam],
        ...bounds,
      });
      const isRecursive =
        existing?.kind === "OpDef" &&
        existing.inRecursive &&
        !existing.isDefined &&
        existing.letInLevel === state.curLevel;
      const preComments = getPreComments(file, span.start);
      const definitionNode =
        isRecursive && existing.kind === "OpDef"
          ? existing
          : createOpDef({
              name: definition.name,
              params: [],
              body: node,
              isLocal: definition.isLocal,
              location,
              preComments,
            });
      if (isRecursive && existing.kind === "OpDef")
        endOpDefNode(existing, node, location, preComments);
      else {
        addSymbol(symbolTable, definitionNode);
        setRecursionFields(definitionNode);
      }
      currentModule.definitions.push(definitionNode);
      definitions?.push(definitionNode);
      functions.unshift({ name: definition.name, node });
      const body = withContext(context, () => generateExpression(definition.body));
      functions.shift();
      node.operands = [body];
      if (node.operator.name === "$NonRecursiveFcnSpec") node.unbounded = undefined;
    }

    const processRecursive = (
      declarations: { name: string; arity: number; location: SourceLocationLike }[],
    ) => {
      if (state.unresolvedSum === 0) state.recursiveSectionCount++;
      state.unresolvedCount[state.curLevel] += declarations.length;
      state.unresolvedSum += declarations.length;
      declarations.forEach((declaration) => {
        const span = getDeclarationSpan(declaration);
        const params = Array.from({ length: declaration.arity }, () =>
          createFormalParam("", 0, undefined, false),
        );
        const node = createOpDef({
          name: resolveSynonym(declaration.name),
          params,
          location: getSpanLocation(file, span),
          isDefined: false,
          inRecursive: true,
          inRecursiveSection: true,
          recursiveSection: state.recursiveSectionCount,
          letInLevel: state.curLevel,
        });
        addSymbol(symbolTable, node);
        recursiveDeclarations.push(node);
        currentModule.opDefsInRecursiveSection.push(node);
      });
    };

    const checkForUndefinedRecursiveOps = () => {
      if (state.unresolvedCount[state.curLevel] > 0) {
        state.unresolvedSum -= state.unresolvedCount[state.curLevel];
      }
    };

    // SubstInNode's constructor and processSubst: an implicit substitution for each declaration of
    // the instantiated module whose name the instantiating module can resolve, in the order of the
    // instantiated module's Hashtable, then the explicit WITH substitutions.
    const processSubstitutions = (
      instance: Instance,
      instanceeContext: Context,
      location: SanyLocation,
    ) => {
      const declarations = getHashtableValues(instanceeContext.table).filter(
        (symbol): symbol is OpDeclNode => symbol.kind === "OpDecl",
      );
      const substs: Subst[] = declarations.flatMap((declaration) => {
        const symbol = resolveSymbol(symbolTable, declaration.name);
        if (symbol === undefined) return [];
        const isExpression =
          declaration.declKind === VARIABLE_DECL_KIND ||
          (declaration.declKind === CONSTANT_DECL_KIND && declaration.arity === 0);
        return [
          {
            op: declaration,
            expr: isExpression ? createOpAppl(symbol, [], location) : createOpArg(symbol, location),
            isImplicit: true,
          },
        ];
      });
      instance.substitutions.forEach((substitution) => {
        const target = getContextSymbol(instanceeContext, resolveSynonym(substitution.name));
        if (target?.kind !== "OpDecl") {
          throw new TlaSyntaxError(`Illegal substitution target ${substitution.name}`);
        }
        const expr =
          target.arity === 0
            ? generateExpression(substitution.expression)
            : generateOperatorArgument(substitution.expression);
        const existing = substs.find((subst) => subst.op.name === target.name);
        if (existing) {
          existing.expr = expr;
          existing.isImplicit = false;
        } else substs.push({ op: target, expr, isImplicit: false });
      });
      return substs;
    };

    const createSubstIn = (
      kind: "SubstIn" | "APSubstIn",
      substs: Subst[],
      body: LevelNode,
      instantiatedModule: ModuleNode,
      location: SanyLocation,
    ): SubstInNode => ({
      ...createLevelFields(getId()),
      kind,
      substs,
      body,
      instantiatingModule: currentModule,
      instantiatedModule,
      location,
    });

    const getInstanceSpan = (instance: Instance) => getDefinitionSpan(instance);

    function processModuleDefinition(
      instance: Instance,
      definitions: (OpDefNode | ThmOrAssumpDefNode)[] | undefined,
      instances: InstanceNode[] | undefined,
    ) {
      const span = getInstanceSpan(instance);
      const location = getSpanLocation(file, span);
      const preComments = getPreComments(file, span.start);
      const name = instance.name ?? "";
      const parameterContext = createContext();
      const nameIndex = instance.isLocal ? span.start + 1 : span.start;
      if (instance.params.length > 0) symbolTable.contexts.push(parameterContext);
      const args = getParams(
        instance,
        { start: nameIndex, end: span.end },
        instance.params.length > 0,
      );
      const instanceeModule = resolveModule(instance.module);
      if (instanceeModule === undefined)
        throw new TlaSyntaxError(`Could not find module ${instance.module}`);
      const instanceeContext = getModuleContext(instance.module);
      const substs = processSubstitutions(instance, instanceeContext, location);
      if (instance.params.length > 0) symbolTable.contexts.pop();
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "OpDef" || symbol.isLocal) return;
        if (symbol.defKind !== "UserDefined" && symbol.defKind !== "ModuleInstance") return;
        const params = [...args, ...(symbol.params ?? [])];
        const qualifiedName = `${name}!${symbol.name}`;
        const node =
          symbol.defKind === "UserDefined"
            ? createOpDef({
                name: qualifiedName,
                params,
                body:
                  substs.length > 0 && symbol.body
                    ? createSubstIn("SubstIn", substs, symbol.body, instanceeModule, location)
                    : symbol.body,
                isLocal: instance.isLocal,
                location,
                source: symbol.source ?? symbol,
                preComments,
              })
            : createOpDef({
                defKind: "ModuleInstance",
                name: qualifiedName,
                params,
                isLocal: instance.isLocal,
                location,
                module: symbol.module,
                source: symbol.source ?? symbol,
                preComments,
              });
        addSymbol(symbolTable, node);
        if (symbol.defKind === "UserDefined") setRecursionFields(node);
        if (definitions) definitions.push(node);
        else currentModule.definitions.push(node);
      });
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "ThmOrAssumpDef" || symbol.isLocal) return;
        const node: ThmOrAssumpDefNode = {
          ...createLevelFields(getId()),
          kind: "ThmOrAssumpDef",
          name: `${name}!${symbol.name}`,
          isTheorem: symbol.isTheorem,
          body:
            substs.length > 0
              ? createSubstIn("APSubstIn", substs, symbol.body, instanceeModule, location)
              : symbol.body,
          params: [...args, ...symbol.params],
          isLocal: instance.isLocal,
          location,
          module: currentModule,
        };
        addSymbol(symbolTable, node);
        if (definitions) definitions.push(node);
        else currentModule.definitions.push(node);
      });
      const instanceNode: InstanceNode = {
        ...createLevelFields(getId()),
        kind: "Instance",
        name,
        isLocal: instance.isLocal,
        params: args,
        module: instanceeModule,
        substs,
        location,
      };
      if (instances) instances.push(instanceNode);
      else currentModule.topLevel.push(instanceNode);
      const moduleDefinition = createOpDef({
        defKind: "ModuleInstance",
        name,
        params: args,
        isLocal: instance.isLocal,
        location,
        preComments,
      });
      addSymbol(symbolTable, moduleDefinition);
      definitions?.push(moduleDefinition);
    }

    // generateInstance: an INSTANCE step of a proof is located at the step's body and adds no
    // theorem definitions or instance to the module.
    const generateInstance = (
      instance: Instance,
      isTopLevel = true,
      stepLocation: SanyLocation | undefined = undefined,
    ) => {
      const span = getInstanceSpan(instance);
      const location = stepLocation ?? getSpanLocation(file, span);
      const preComments = getPreComments(file, span.start);
      const instanceeModule = resolveModule(instance.module);
      if (instanceeModule === undefined)
        throw new TlaSyntaxError(`Could not find module ${instance.module}`);
      const instanceeContext = getModuleContext(instance.module);
      const substs = processSubstitutions(instance, instanceeContext, location);
      const isLocal = instance.isLocal;
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "OpDef" || symbol.defKind !== "UserDefined" || symbol.isLocal) return;
        const copyFrom = (module: ModuleNode | undefined, body: ExprNode | undefined) => {
          const node = createOpDef({
            name: symbol.name,
            params: symbol.params,
            body,
            isLocal,
            location,
            module,
            source: symbol.source ?? symbol,
            preComments,
          });
          addSymbol(symbolTable, node);
          return node;
        };
        const reuse = () => {
          addSymbol(symbolTable, symbol);
          return symbol;
        };
        const isOriginParameterFree = symbol.module === undefined || isParameterFree(symbol.module);
        const node = !isParameterFree(instanceeModule)
          ? isOriginParameterFree
            ? isLocal
              ? copyFrom(symbol.module, symbol.body)
              : reuse()
            : copyFrom(
                currentModule,
                symbol.body &&
                  createSubstIn("SubstIn", substs, symbol.body, instanceeModule, location),
              )
          : isLocal
            ? copyFrom(symbol.module, symbol.body)
            : reuse();
        currentModule.definitions.push(node);
        setRecursionFields(node);
      });
      // SANY reuses a theorem of a parameter-free module without adding it to the symbol table
      // when the instantiated module has parameters.
      getHashtableValues(instanceeContext.table).forEach((symbol) => {
        if (symbol.kind !== "ThmOrAssumpDef" || symbol.isLocal) return;
        const copyFrom = (module: ModuleNode, body: LevelNode) => {
          const node: ThmOrAssumpDefNode = {
            ...symbol,
            ...createLevelFields(getId()),
            body,
            isLocal,
            location,
            module,
          };
          addSymbol(symbolTable, node);
          return node;
        };
        const reuse = () => {
          addSymbol(symbolTable, symbol);
          return symbol;
        };
        const node = !isParameterFree(instanceeModule)
          ? isParameterFree(symbol.module)
            ? isLocal
              ? copyFrom(currentModule, symbol.body)
              : symbol
            : copyFrom(
                currentModule,
                createSubstIn("APSubstIn", substs, symbol.body, instanceeModule, location),
              )
          : isLocal
            ? copyFrom(symbol.module, symbol.body)
            : reuse();
        if (isTopLevel) currentModule.definitions.push(node);
      });
      const instanceNode: InstanceNode = {
        ...createLevelFields(getId()),
        kind: "Instance",
        name: undefined,
        isLocal,
        params: [],
        module: instanceeModule,
        substs,
        location,
      };
      if (isTopLevel) currentModule.topLevel.push(instanceNode);
      return instanceNode;
    };

    const resolveFactModule = (name: string) =>
      resolveModule(name) ?? (name === currentModule.name ? currentModule : undefined);

    // A fact is a module, or an expression such as the name of a theorem; a DEF names a defined
    // operator, theorem or assumption, or a module.
    const generateFacts = (facts: Fact[]) =>
      facts.map((fact) => {
        if (fact.kind !== "ModuleFact") return generateExpression(fact);
        const module = resolveFactModule(fact.name);
        if (module === undefined) {
          throw new TlaSyntaxError(
            `Module \`${fact.name}' used without being extended or instantiated.`,
          );
        }
        return module;
      });

    const generateDefs = (defs: Fact[]) =>
      defs.map((fact) => {
        if (fact.kind === "ModuleFact") {
          const module = resolveFactModule(fact.name);
          if (module === undefined) {
            throw new TlaSyntaxError(
              `Module \`${fact.name}' used without being extended or instantiated.`,
            );
          }
          return module;
        }
        const name =
          fact.kind === "Identifier"
            ? fact.name
            : fact.kind === "OperatorReference"
              ? fact.operator
              : undefined;
        const symbol =
          name === undefined ? undefined : resolveSymbol(symbolTable, resolveSynonym(name));
        if (symbol?.kind !== "OpDef" && symbol?.kind !== "ThmOrAssumpDef") {
          throw new TlaSyntaxError("DEF clause entry should describe a defined operator.");
        }
        return symbol;
      });

    const generateUseOrHide = (use: UseOrHide): UseOrHideNode => ({
      ...createLevelFields(getId()),
      kind: "UseOrHide",
      facts: generateFacts(use.facts),
      defs: generateDefs(use.defs),
      isOnly: use.isOnly,
      isHide: use.kind === "Hide",
      location: getSpanLocation(file, getUnitSpan(use.location)),
    });

    const newSymbolKinds = {
      Constant: { declKind: 24, level: 0 },
      Variable: { declKind: 25, level: 1 },
      State: { declKind: 26, level: 1 },
      Action: { declKind: 27, level: 2 },
      Temporal: { declKind: 28, level: 3 },
    };

    // generateNewSymb: the set is generated before the symbol is declared.
    const generateNewSymbol = (symbol: NewSymbol): NewSymbNode => {
      const span = getUnitSpan(symbol.location);
      const set = symbol.set && generateExpression(symbol.set);
      const nameIndex = findNameOrKeyword(span.start, symbol.name);
      const kind = newSymbolKinds[symbol.level];
      const declaration: OpDeclNode = {
        ...createLevelFields(getId()),
        levelChecked: 1,
        level: kind.level,
        kind: "OpDecl",
        name: resolveSynonym(symbol.name),
        arity: symbol.arity,
        declKind: kind.declKind,
        location: getSpanLocation(file, getOperatorSpan(nameIndex, symbol.arity)),
      };
      addSymbol(symbolTable, declaration);
      return {
        ...createLevelFields(getId()),
        kind: "NewSymb",
        declaration,
        set,
        location: getSpanLocation(file, span),
      };
    };

    // generateAssumeProve: an ASSUME/PROVE nested in another one has a context of its own.
    const generateAssumeProve = (assumeProve: AssumeProve, depth: number): AssumeProveNode => {
      if (depth > 1) symbolTable.contexts.push(createContext());
      const assumptions = assumeProve.assumptions.map((assumption): LevelNode => {
        if (assumption.kind === "AssumeProve") return generateAssumeProve(assumption, depth + 1);
        if (assumption.kind === "NewSymbol") return generateNewSymbol(assumption);
        return generateExpression(assumption);
      });
      const goal = generateExpression(assumeProve.conclusion);
      if (depth > 1) symbolTable.contexts.pop();
      return {
        ...createLevelFields(getId()),
        kind: "AssumeProve",
        assumptions,
        goal,
        isSuffices: false,
        isBoxed: false,
        location: getSpanLocation(file, getUnitSpan(assumeProve.location)),
      };
    };

    const createTheoremDefinition = (
      name: string,
      body: LevelNode,
      location: SanyLocation,
    ): ThmOrAssumpDefNode => ({
      ...createLevelFields(getId()),
      kind: "ThmOrAssumpDef",
      name,
      isTheorem: true,
      body,
      params: [],
      isLocal: false,
      location,
      module: currentModule,
    });

    const generateLeafProof = (proof: Exclude<Proof, { kind: "Steps" }>): LeafProofNode => {
      const facts = proof.kind === "By" ? generateFacts(proof.facts) : [];
      const defs = proof.kind === "By" ? generateDefs(proof.defs) : [];
      return {
        ...createLevelFields(getId()),
        kind: "LeafProof",
        facts,
        defs,
        isOmitted: proof.kind === "Omitted",
        isOnly: proof.kind === "By" && proof.isOnly,
        location: getSpanLocation(file, getUnitSpan(proof.location)),
      };
    };

    const generateStepBody = (step: ProofStep, bodySpan: TokenSpan) => {
      const body = step.body;
      const bodyLocation = getSpanLocation(file, bodySpan);
      switch (body.kind) {
        case "Have":
          return {
            node: applyBuiltin("$Have", [generateExpression(body.expression)], bodyLocation),
            isPick: false,
          };
        case "Case":
          return {
            node: applyBuiltin("$Pfcase", [generateExpression(body.expression)], bodyLocation),
            isPick: false,
          };
        case "Witness":
          return {
            node: applyBuiltin("$Witness", body.expressions.map(generateExpression), bodyLocation),
            isPick: false,
          };
        case "Qed":
          return { node: applyBuiltin("$Qed", [], bodyLocation), isPick: false };
        case "Take":
        case "Pick": {
          const isPick = body.kind === "Pick";
          const name = isPick ? "$Pick" : "$Take";
          if (isPick) symbolTable.contexts.push(createContext());
          const getOperands = () => (body.kind === "Pick" ? [generateExpression(body.body)] : []);
          if (body.bounds.length > 0) {
            const bounds = generateBounds(body.bounds, bodySpan.start);
            const operands = getOperands();
            return { node: applyBuiltin(name, operands, bodyLocation, bounds), isPick };
          }
          const indexes = findNameTokens(file, bodySpan.start, bodySpan.end + 1, body.names);
          const unbounded = body.names.map((paramName, index) =>
            createFormalParam(paramName, 0, getTokenLocation(file, indexes[index]), true),
          );
          const operands = getOperands();
          return { node: applyBuiltin(name, operands, bodyLocation, { unbounded }), isPick };
        }
      }
      return undefined;
    };

    // An expression SANY parses as N_InfixExpr: a binary operator between its operands.
    const isInfixExpression = (expression: Expression) => {
      if ((expression.kind === "And" || expression.kind === "Or") && !expression.isBulleted)
        return true;
      if (expression.kind !== "Apply" || expression.args.length !== 2) return false;
      const left = getParenthesizedSpan(file, getExpressionSpan(file, expression.args[0]));
      const start = getExpressionSpan(file, expression).start;
      return left.start === start && !isToken(file, left.end + 1, "(");
    };

    // generateProof: a proof's steps share a context, into which the step names, the symbols of
    // a TAKE or PICK, and the NEW symbols of a SUFFICES ASSUME go.
    function generateProof(proof: Proof): LeafProofNode | NonLeafProofNode {
      if (proof.kind !== "Steps") return generateLeafProof(proof);
      const proofContext = createContext();
      symbolTable.contexts.push(proofContext);
      const instances: InstanceNode[] = [];
      const sufficesContexts: Context[] = [];
      // An assertion step @ = e continues the infix assertion of the step before it, whose right
      // side the @ stands for.
      const infixStep: { previousRight: ExprOrOpArgNode | undefined } = {
        previousRight: undefined,
      };
      const steps = proof.steps.map((step): ProofStepNode => {
        const stepSpan = getUnitSpan(step.location);
        const headSpan = getRangeSpan(file, step.head);
        const bodySpan = { start: headSpan.start + 1, end: headSpan.end };
        const body = step.body;
        if (body.kind === "Define") {
          const defs = body.definitions.map((definition) => {
            const defined: (OpDefNode | ThmOrAssumpDefNode)[] = [];
            if (definition.kind === "Instance")
              processModuleDefinition(definition, defined, instances);
            else if (definition.kind === "Function") processFunction(definition, defined);
            else currentModule.definitions.push(processOperator(definition, defined));
            const last = defined[definition.kind === "Instance" ? defined.length - 1 : 0];
            if (last?.kind !== "OpDef")
              throw new TlaSyntaxError("A DEFINE step defines no operator");
            return last;
          });
          return {
            ...createLevelFields(getId()),
            kind: "DefStep",
            defs,
            location: getSpanLocation(file, bodySpan),
          };
        }
        if (body.kind === "Use" || body.kind === "Hide") {
          return { ...generateUseOrHide(body), location: getSpanLocation(file, stepSpan) };
        }
        if (body.kind === "Instance") {
          return generateInstance(body, false, getSpanLocation(file, bodySpan));
        }
        const isAssumeProve = body.kind === "Assert" && body.statement.kind === "AssumeProve";
        if (body.kind !== "Assert" || isAssumeProve) infixStep.previousRight = undefined;
        const isSuffices = body.kind === "Assert" && body.isSuffices;
        const assumeContext = createContext();
        const generateAssertion = (statement: Expression | AssumeProve): LevelNode => {
          if (statement.kind === "AssumeProve") {
            symbolTable.contexts.push(assumeContext);
            const node = generateAssumeProve(statement, 1);
            symbolTable.contexts.pop();
            return { ...node, isSuffices };
          }
          if (isSuffices) {
            const expression = generateExpression(statement);
            return applyBuiltin("$Suffices", [expression], getSpanLocation(file, bodySpan));
          }
          const previousRight = infixStep.previousRight;
          const isAtStep =
            previousRight !== undefined &&
            statement.kind === "Apply" &&
            isInfixExpression(statement) &&
            statement.args[0].kind === "ExceptAt";
          const expression =
            isAtStep && statement.kind === "Apply"
              ? createOpAppl(
                  resolveName(statement.operator, getLocation(statement)),
                  [
                    applyBuiltin("$Nop", [previousRight], getLocation(statement.args[0])),
                    generateExpression(statement.args[1]),
                  ],
                  getLocation(statement),
                )
              : generateExpression(statement);
          const right = expression.kind === "OpAppl" ? expression.operands[1] : undefined;
          infixStep.previousRight = isInfixExpression(statement) ? right : undefined;
          return expression;
        };
        const generated =
          body.kind === "Assert"
            ? { node: generateAssertion(body.statement), isPick: false }
            : generateStepBody(step, bodySpan);
        if (generated === undefined) throw new TlaSyntaxError(`Unexpected proof step ${body.kind}`);
        const pickContext = generated.isPick ? symbolTable.contexts.pop() : undefined;
        const definition =
          step.name === undefined
            ? undefined
            : createTheoremDefinition(
                step.name,
                generated.node,
                getTokenLocation(file, getTokenIndex(file, step.location)),
              );
        if (definition) addSymbol(symbolTable, definition);
        const isScoped = isAssumeProve && !isSuffices;
        if (isScoped) symbolTable.contexts.push(assumeContext);
        const stepProof = step.proof && generateProof(step.proof);
        if (isScoped) symbolTable.contexts.pop();
        if (isAssumeProve && isSuffices) {
          sufficesContexts.push(assumeContext);
          symbolTable.contexts.push(assumeContext);
        }
        pickContext?.symbols.forEach((symbol) => addSymbol(symbolTable, symbol));
        return {
          ...createLevelFields(getId()),
          kind: "Theorem",
          definition,
          body: generated.node,
          proof: stepProof,
          isSuffices,
          location: getSpanLocation(file, stepSpan),
        };
      });
      sufficesContexts.forEach(() => {
        symbolTable.contexts.pop()?.symbols.forEach((symbol) => addToContext(proofContext, symbol));
      });
      symbolTable.contexts.pop();
      return {
        ...createLevelFields(getId()),
        kind: "NonLeafProof",
        steps,
        instances,
        proofLevel: proof.level,
        location: getSpanLocation(file, getUnitSpan(proof.location)),
      };
    }

    // processTheorem: a theorem's ASSUME/PROVE has a context of its own, which its proof sees and
    // its definition does not.
    const processTheorem = (theorem: Theorem) => {
      const location = getSpanLocation(file, getUnitSpan(theorem.location));
      const statement = theorem.statement;
      const assumeContext = createContext();
      if (statement.kind === "AssumeProve") symbolTable.contexts.push(assumeContext);
      const body =
        statement.kind === "AssumeProve"
          ? generateAssumeProve(statement, 1)
          : generateExpression(statement);
      const definition =
        theorem.name === undefined
          ? undefined
          : createTheoremDefinition(theorem.name, body, location);
      if (definition) {
        if (statement.kind === "AssumeProve") symbolTable.contexts.pop();
        addSymbol(symbolTable, definition);
        currentModule.definitions.push(definition);
        if (statement.kind === "AssumeProve") symbolTable.contexts.push(assumeContext);
      }
      const proof = theorem.proof && generateProof(theorem.proof);
      if (statement.kind === "AssumeProve") symbolTable.contexts.pop();
      const node: TheoremNode = {
        ...createLevelFields(getId()),
        kind: "Theorem",
        definition,
        body,
        proof,
        isSuffices: false,
        location,
      };
      currentModule.topLevel.push(node);
    };

    const processAssumption = (assumption: Assumption) => {
      const span = getUnitSpan(assumption.location);
      const location = getSpanLocation(file, span);
      const body = generateExpression(assumption.expression);
      const definition: ThmOrAssumpDefNode | undefined =
        assumption.name === undefined
          ? undefined
          : {
              ...createLevelFields(getId()),
              kind: "ThmOrAssumpDef",
              name: assumption.name,
              isTheorem: false,
              body,
              params: [],
              isLocal: false,
              location,
              module: currentModule,
            };
      if (definition) {
        addSymbol(symbolTable, definition);
        currentModule.definitions.push(definition);
      }
      const node: AssumeNode = {
        ...createLevelFields(getId()),
        kind: "Assume",
        definition,
        body,
        location,
      };
      currentModule.topLevel.push(node);
    };

    // A declared operator or operator parameter is located with its arguments: F(_, _), _ + _,
    // -. _ or _ ^+.
    const getOperatorSpan = (start: number, arity: number) => {
      if (arity === 0) return { start, end: start };
      if (isToken(file, start, "_")) {
        return { start, end: isToken(file, start + 2, "_") ? start + 2 : start + 1 };
      }
      if (isToken(file, start + 1, "(")) return { start, end: getMatchingIndex(file, start + 1) };
      return { start, end: isToken(file, start + 1, "_") ? start + 1 : start };
    };

    const getDeclarationSpan = (declaration: { arity: number; location: SourceLocationLike }) =>
      getOperatorSpan(getUnitSpan(declaration.location).start, declaration.arity);

    const createDeclaration = (
      declaration: { name: string; arity: number; location: SourceLocationLike },
      declKind: number,
    ): OpDeclNode => {
      const span = getDeclarationSpan(declaration);
      const node: OpDeclNode = {
        ...createLevelFields(getId()),
        levelChecked: 1,
        level: declKind === VARIABLE_DECL_KIND ? 1 : 0,
        kind: "OpDecl",
        name: resolveSynonym(declaration.name),
        arity: declaration.arity,
        declKind,
        location: getSpanLocation(file, span),
      };
      if (declKind === CONSTANT_DECL_KIND) {
        node.levelParams.add(node);
        node.allParams.add(node);
      }
      addSymbol(symbolTable, node);
      return node;
    };

    // processExtendsList: the extended module's symbols join this module's context in the order
    // they joined the extended module's, apart from LOCAL ones and those already present.
    ast.extends.forEach((name) => {
      const extendee = resolveModule(name);
      if (extendee === undefined) throw new TlaSyntaxError(`Could not find module ${name}`);
      currentModule.extendees.push(extendee);
      const context = getTopContext(symbolTable);
      extendee.context.symbols.forEach((symbol) => {
        if (
          symbol.kind !== "Module" &&
          symbol.kind !== "FormalParam" &&
          symbol.kind !== "OpDecl" &&
          symbol.isLocal
        ) {
          return;
        }
        const existing =
          symbol.kind === "Module"
            ? getContextModule(context, symbol.name)
            : getContextSymbol(context, symbol.name);
        if (existing === undefined) addToContext(context, symbol);
      });
      currentModule.topLevel.push(...extendee.topLevel);
    });

    ast.units.forEach((unit) => {
      switch (unit.kind) {
        case "Variables":
          unit.declarations.forEach((declaration) =>
            createDeclaration(declaration, VARIABLE_DECL_KIND),
          );
          break;
        case "Constants":
          unit.declarations.forEach((declaration) =>
            createDeclaration(declaration, CONSTANT_DECL_KIND),
          );
          break;
        case "Recursive":
          processRecursive(unit.declarations);
          break;
        case "Definition":
          if (unit.definition.kind === "Function") processFunction(unit.definition, undefined);
          else currentModule.definitions.push(processOperator(unit.definition, undefined));
          break;
        case "Instance":
          if (unit.instance.name === undefined) generateInstance(unit.instance);
          else processModuleDefinition(unit.instance, undefined, undefined);
          break;
        case "Assumption":
          processAssumption(unit.assumption);
          break;
        case "Theorem":
          processTheorem(unit.theorem);
          break;
        case "Use":
          currentModule.topLevel.push(generateUseOrHide(unit.use));
          break;
        case "Module": {
          const innerTable = { contexts: [...symbolTable.contexts, createContext()] };
          const inner = generateModule(unit.module, file, currentModule, innerTable);
          addToContextModule(symbolTable, inner);
          break;
        }
      }
    });
    checkForUndefinedRecursiveOps();
    void recursiveDeclarations;
    return currentModule;
  }

  const modules = order.map((name) => externalModules.get(name)!.module);
  return { root: modules[modules.length - 1], modules };
};

interface SourceLocationLike {
  line: number;
  column: number;
  range?: unknown;
}

interface RecursiveDeclaration {
  name: string;
  arity: number;
  location: SourceLocationLike;
}

type LetUnit =
  | { kind: "Recursive"; declarations: RecursiveDeclaration[] }
  | { kind: "Instance"; instance: Instance }
  | { kind: "Definition"; definition: Definition };

const getNumeralValue = (text: string) => {
  const lower = text.toLowerCase();
  const radix = lower.startsWith("\\b")
    ? 2
    : lower.startsWith("\\o")
      ? 8
      : lower.startsWith("\\h")
        ? 16
        : 10;
  const digits = radix === 10 ? lower : lower.slice(2);
  return [...digits]
    .reduce((value, digit) => value * BigInt(radix) + BigInt(parseInt(digit, radix)), 0n)
    .toString();
};
