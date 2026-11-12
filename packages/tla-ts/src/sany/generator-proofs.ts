import type {
  AssumeProve,
  Assumption,
  Expression,
  Fact,
  NewSymbol,
  Proof,
  ProofStep,
  Theorem,
  UseOrHide,
} from "../ast";
import { TlaSyntaxError } from "../errors";
import { createLevelFields } from "./builtins";
import {
  addToContext,
  type AssumeNode,
  type AssumeProveNode,
  type Context,
  createContext,
  type DefStepNode,
  type ExprOrOpArgNode,
  type FactNode,
  type FormalParamNode,
  type InstanceNode,
  type LabelNode,
  type LeafProofNode,
  type LevelNode,
  NEW_CONSTANT_KIND,
  type NewSymbNode,
  type NonLeafProofNode,
  type OpDeclNode,
  type OpDefNode,
  type ProofStepNode,
  type SanyLocation,
  type TheoremNode,
  type ThmOrAssumpDefNode,
  type UseOrHideNode,
} from "./nodes";
import { getSelectorItems, isGeneralId } from "./selectors";
import {
  findNameTokens,
  getExpressionSpan,
  getRangeSpan,
  getSpanLocation,
  getTokenIndex,
  getTokenLocation,
  isBoxToken,
  isToken,
  type SourceFile,
  type TokenSpan,
} from "./source";
import {
  addSymbol,
  applyBuiltin,
  type AssumeProveScope,
  createFormalParam,
  createOpAppl,
  createOpDef,
  endProof,
  getLocation,
  getTopContext,
  getUnitSpan,
  type ModuleGeneration,
  popLabels,
  pushLabelScope,
  resolveModule,
  resolveName,
  resolveSynonym,
  withContext,
} from "./generation";
import { getOperandSpan, reportDefEntry } from "./generator-def-entries";
import {
  generateInstance,
  getOperatorSpan,
  processFunction,
  processModuleDefinition,
  processOperator,
} from "./generator-definitions";
import {
  findNameOrKeyword,
  generateBounds,
  generateExpression,
  generateSelector,
  generateWithParams,
} from "./generator-expressions";

const NEW_SYMBOL_KINDS = {
  Constant: { declKind: NEW_CONSTANT_KIND, level: 0 },
  Variable: { declKind: 25, level: 1 },
  State: { declKind: 26, level: 1 },
  Action: { declKind: 27, level: 2 },
  Temporal: { declKind: 28, level: 3 },
};

const getFactModules = (generation: ModuleGeneration, fact: Fact & { kind: "ModuleFact" }) => {
  const module =
    resolveModule(generation, fact.name) ??
    (fact.name === generation.currentModule.name ? generation.currentModule : undefined);
  if (module !== undefined) return [module];
  generation.addError(
    getTokenLocation(generation.file, getTokenIndex(generation.file, fact.location) + 1),
    `Module \`${fact.name}' used without being extended or instantiated.`,
  );
  return [];
};

const generateFacts = (generation: ModuleGeneration, facts: Fact[]) =>
  facts.flatMap((fact): FactNode[] => {
    if (fact.kind === "ModuleFact") return getFactModules(generation, fact);
    const items = getSelectorItems(fact);
    if (items === undefined || !isGeneralId(items)) return [generateExpression(generation, fact)];
    const node = generateSelector(generation, fact, 0, true, false);
    if (node.kind === "ThmOrAssumpDef") throw new TlaSyntaxError("Expected a fact");
    return [node];
  });

const generateDefs = (generation: ModuleGeneration, defs: Fact[]) =>
  defs.flatMap((fact): UseOrHideNode["defs"] => {
    if (fact.kind === "ModuleFact") return getFactModules(generation, fact);
    if (reportDefEntry(generation, fact)) return [];
    const symbol = generateSelector(
      generation,
      fact.kind === "OperatorReference"
        ? { kind: "Identifier", name: fact.operator, location: fact.location }
        : fact,
      -1,
      false,
      true,
    );
    const isDefinition =
      symbol.kind === "OpDef" || (symbol.kind === "ThmOrAssumpDef" && !symbol.name.startsWith("<"));
    if (!isDefinition) {
      generation.addError(
        getLocation(generation.file, fact),
        "DEF clause entry should describe a defined operator.",
      );
      return [];
    }
    return [symbol];
  });

const checkKeywordOnly = (
  generation: ModuleGeneration,
  statement: UseOrHide | Extract<Proof, { kind: "By" }>,
  location: SanyLocation,
) => {
  if (statement.isOnly || statement.facts.length + statement.defs.length > 0) return;
  generation.addError(location, "Empty BY, USE, or HIDE");
};

export const generateUseOrHide = (generation: ModuleGeneration, use: UseOrHide): UseOrHideNode => {
  const location = getSpanLocation(generation.file, getUnitSpan(generation.file, use.location));
  checkKeywordOnly(generation, use, location);
  const facts = generateFacts(generation, use.facts);
  const defs = generateDefs(generation, use.defs);
  if (facts.length + defs.length === 0)
    generation.addError(location, "Empty USE or HIDE statement.");
  if (use.kind === "Hide") {
    facts
      .filter((fact) => fact.kind === "OpAppl" && fact.operator.kind !== "ThmOrAssumpDef")
      .forEach((fact) =>
        generation.addError(
          fact.location,
          "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
        ),
      );
  }
  return {
    ...createLevelFields(generation.getId()),
    kind: "UseOrHide",
    facts,
    defs,
    isOnly: use.isOnly,
    isHide: use.kind === "Hide",
    location,
  };
};

const generateNewSymbol = (generation: ModuleGeneration, symbol: NewSymbol): NewSymbNode => {
  const span = getUnitSpan(generation.file, symbol.location);
  const set = symbol.set && generateExpression(generation, symbol.set);
  const nameIndex = findNameOrKeyword(generation.file, span.start, symbol.name);
  const kind = NEW_SYMBOL_KINDS[symbol.level];
  const declaration: OpDeclNode = {
    ...createLevelFields(generation.getId()),
    levelChecked: 1,
    level: kind.level,
    kind: "OpDecl",
    name: resolveSynonym(symbol.name),
    arity: symbol.arity,
    declKind: kind.declKind,
    location: getSpanLocation(
      generation.file,
      getOperatorSpan(generation.file, nameIndex, symbol.arity),
    ),
    module: generation.currentModule,
  };
  addSymbol(generation, declaration);
  return {
    ...createLevelFields(generation.getId()),
    kind: "NewSymb",
    declaration,
    set,
    location: getSpanLocation(generation.file, span),
  };
};

const generateAssumeProve = (
  generation: ModuleGeneration,
  assumeProve: AssumeProve,
  depth: number,
  goal?: { isSuffices: boolean },
): AssumeProveNode => {
  const span = getUnitSpan(generation.file, assumeProve.location);
  const isBoxed = isBoxToken(generation.file, span.start - 1);
  const conclusionStart = getExpressionSpan(generation.file, assumeProve.conclusion).start;
  const proveIndex = generation.file.tokens.findLastIndex(
    (token, index) => index < conclusionStart && token.kind === "Keyword" && token.text === "PROVE",
  );
  const assumeLocation = getSpanLocation(generation.file, {
    start: isBoxed ? span.start - 1 : span.start,
    end: span.start,
  });
  if (isBoxed !== isBoxToken(generation.file, proveIndex - 1)) {
    generation.addError(
      assumeLocation,
      isBoxed
        ? "[]ASSUME matched by PROVE instead of []PROVE"
        : "ASSUME matched by []PROVE instead of PROVE",
    );
  }
  // SANY numbers the AssumeProveNode before it generates its clauses.
  const id = generation.getId();
  if (depth > 1) generation.contexts.push(createContext());
  if (isBoxed && generation.contexts.some((context) => generation.assumeContexts.has(context))) {
    generation.addError(
      assumeLocation,
      "[]ASSUME used within the scope of an ordinary ASSUME's assumptions",
    );
  }
  if (!isBoxed) generation.assumeContexts.add(getTopContext(generation.contexts));
  const scope: AssumeProveScope = {
    isDeclaredBefore: [false],
    hasGoal: goal !== undefined,
    isSuffices: goal?.isSuffices ?? false,
    isInProof: true,
  };
  generation.assumeProveState.depth = depth;
  generation.assumeProveState.isDeclared[depth] = false;
  if (depth === 1) {
    generation.assumeProveState.goal = goal && scope;
    generation.assumeProveState.goalClause = 0;
  }
  const assumptions = assumeProve.assumptions.map((assumption, index): LevelNode => {
    const isNew = assumption.kind === "NewSymbol";
    const node =
      assumption.kind === "AssumeProve"
        ? generateAssumeProve(generation, assumption, depth + 1)
        : isNew
          ? generateNewSymbol(generation, assumption)
          : generateExpression(generation, assumption);
    generation.assumeProveState.depth = depth;
    if (isNew) generation.assumeProveState.isDeclared[depth] = true;
    scope.isDeclaredBefore.push(scope.isDeclaredBefore[index] || isNew);
    if (depth === 1) generation.assumeProveState.goalClause++;
    return node;
  });
  const conclusion = generateExpression(generation, assumeProve.conclusion);
  if (depth > 1) generation.contexts.pop();
  generation.assumeProveState.depth = depth - 1;
  if (depth === 1) generation.assumeProveState.goal = undefined;
  const node: AssumeProveNode = {
    ...createLevelFields(id),
    kind: "AssumeProve",
    assumptions,
    goal: conclusion,
    isSuffices: scope.isSuffices,
    isBoxed,
    location: getSpanLocation(generation.file, {
      start: isBoxed ? span.start - 1 : span.start,
      end: span.end,
    }),
  };
  generation.assumeProveScopes.set(node, scope);
  return node;
};

const createTheoremDefinition = (
  generation: ModuleGeneration,
  id: number,
  name: string,
  body: LevelNode,
  location: SanyLocation,
  labels: Map<string, LabelNode>,
  isTheorem = true,
): ThmOrAssumpDefNode => ({
  ...createLevelFields(id),
  kind: "ThmOrAssumpDef",
  name,
  isTheorem,
  body,
  params: [],
  isLocal: false,
  location,
  module: generation.currentModule,
  source: undefined,
  labels,
  isLeibnizArg: [],
  isLeibniz: false,
  opLevelCond: [],
  maxLevels: [],
  minMaxLevel: [],
});

const generateLeafProof = (
  generation: ModuleGeneration,
  proof: Exclude<Proof, { kind: "Steps" }>,
): LeafProofNode => {
  const location = getSpanLocation(generation.file, getUnitSpan(generation.file, proof.location));
  if (proof.kind === "By") checkKeywordOnly(generation, proof, location);
  const facts = proof.kind === "By" ? generateFacts(generation, proof.facts) : [];
  const defs = proof.kind === "By" ? generateDefs(generation, proof.defs) : [];
  // The UseOrHideNode SANY makes of a BY proof's facts and definitions.
  if (proof.kind === "By") generation.getId();
  if (proof.kind === "By" && facts.length + defs.length === 0)
    generation.addError(location, "Empty BY");
  return {
    ...createLevelFields(generation.getId()),
    kind: "LeafProof",
    facts,
    defs,
    isOmitted: proof.kind === "Omitted",
    isOnly: proof.kind === "By" && proof.isOnly,
    location,
  };
};

const generateStepBody = (
  generation: ModuleGeneration,
  body: ProofStep["body"],
  bodySpan: TokenSpan,
) => {
  const bodyLocation = getSpanLocation(generation.file, bodySpan);
  switch (body.kind) {
    case "Have":
      return applyBuiltin(
        generation,
        "$Have",
        [generateExpression(generation, body.expression)],
        bodyLocation,
      );
    case "Case":
      return applyBuiltin(
        generation,
        "$Pfcase",
        [generateExpression(generation, body.expression)],
        bodyLocation,
      );
    case "Witness":
      return applyBuiltin(
        generation,
        "$Witness",
        body.expressions.map((witness) => generateExpression(generation, witness)),
        bodyLocation,
      );
    case "Qed":
      return applyBuiltin(generation, "$Qed", [], bodyLocation);
    case "Take":
    case "Pick": {
      const isPick = body.kind === "Pick";
      const name = isPick ? "$Pick" : "$Take";
      if (isPick) generation.contexts.push(createContext());
      const getOperands = (params: FormalParamNode[]) =>
        body.kind === "Pick" ? [generateWithParams(generation, params, body.body)] : [];
      if (body.bounds.length > 0) {
        const bounds = generateBounds(generation, body.bounds, bodySpan.start);
        const operands = getOperands(bounds.bounded.flat());
        return applyBuiltin(generation, name, operands, bodyLocation, bounds);
      }
      const indexes = findNameTokens(generation.file, bodySpan.start, bodySpan.end + 1, body.names);
      const unbounded = body.names.map((paramName, index) =>
        createFormalParam(
          generation,
          paramName,
          0,
          getTokenLocation(generation.file, indexes[index]),
          true,
        ),
      );
      const operands = getOperands(unbounded);
      return applyBuiltin(generation, name, operands, bodyLocation, { unbounded });
    }
  }
  return undefined;
};

const isInfixExpression = (file: SourceFile, expression: Expression) => {
  if ((expression.kind === "And" || expression.kind === "Or") && !expression.isBulleted)
    return true;
  if (expression.kind !== "Apply" || expression.args.length !== 2) return false;
  const left = getOperandSpan(file, expression.args[0]);
  const start = getExpressionSpan(file, expression).start;
  return left.start === start && !isToken(file, left.end + 1, "(");
};

const generateProof = (
  generation: ModuleGeneration,
  proof: Proof,
): LeafProofNode | NonLeafProofNode => {
  if (proof.kind !== "Steps") return generateLeafProof(generation, proof);
  const proofContext = createContext();
  generation.contexts.push(proofContext);
  const instances: InstanceNode[] = [];
  const sufficesContexts: Context[] = [];
  let previousRight: ExprOrOpArgNode | undefined;
  const generateOtherStep = (
    body: ProofStep["body"],
    stepSpan: TokenSpan,
    bodySpan: TokenSpan,
  ): DefStepNode | UseOrHideNode | InstanceNode | undefined => {
    if (body.kind === "Define") {
      const defs = body.definitions.map((definition) => {
        const defined: (OpDefNode | ThmOrAssumpDefNode)[] = [];
        if (definition.kind === "Instance")
          processModuleDefinition(generation, definition, defined, instances);
        else if (definition.kind === "Function") processFunction(generation, definition, defined);
        else processOperator(generation, definition, defined);
        const last = defined[definition.kind === "Instance" ? defined.length - 1 : 0];
        if (last?.kind !== "OpDef") throw new TlaSyntaxError("A DEFINE step defines no operator");
        return last;
      });
      return {
        ...createLevelFields(generation.getId()),
        kind: "DefStep",
        defs,
        location: getSpanLocation(generation.file, bodySpan),
      };
    }
    if (body.kind === "Use" || body.kind === "Hide") {
      return {
        ...generateUseOrHide(generation, body),
        location: getSpanLocation(generation.file, stepSpan),
      };
    }
    if (body.kind === "Instance") {
      return generateInstance(generation, body, false, getSpanLocation(generation.file, bodySpan));
    }
    return undefined;
  };
  const steps = proof.steps.map((step): ProofStepNode => {
    const stepSpan = getUnitSpan(generation.file, step.location);
    const headSpan = getRangeSpan(generation.file, step.head);
    const bodySpan = { start: headSpan.start + 1, end: headSpan.end };
    const body = step.body;
    if (step.name !== undefined && /^<[*+]>/.test(step.token)) {
      generation.addError(
        getTokenLocation(generation.file, stepSpan.start),
        "<*> and <+> cannot be used for a named step.",
      );
    }
    if (step.name !== undefined) pushLabelScope(generation);
    const definitionId = step.name === undefined ? undefined : generation.getId();
    if (body.kind !== "Assert") previousRight = undefined;
    const otherStep = generateOtherStep(body, stepSpan, bodySpan);
    if (otherStep !== undefined) {
      if (step.name !== undefined) {
        addSymbol(
          generation,
          createOpDef(generation, {
            defKind: "NumberedProofStep",
            name: step.name,
            location: getSpanLocation(generation.file, stepSpan),
            labels: popLabels(generation),
            step: otherStep,
          }),
        );
      }
      return otherStep;
    }
    const isAssumeProve = body.kind === "Assert" && body.statement.kind === "AssumeProve";
    if (isAssumeProve) previousRight = undefined;
    const isSuffices = body.kind === "Assert" && body.isSuffices;
    const assumeContext = createContext();
    const generateAssertion = (statement: Expression | AssumeProve): LevelNode => {
      if (statement.kind === "AssumeProve") {
        const node = withContext(generation, assumeContext, () =>
          generateAssumeProve(
            generation,
            statement,
            1,
            step.name === undefined ? undefined : { isSuffices },
          ),
        );
        node.isSuffices = isSuffices;
        return node;
      }
      if (isSuffices) {
        const expression = generateExpression(generation, statement);
        return applyBuiltin(
          generation,
          "$Suffices",
          [expression],
          getSpanLocation(generation.file, bodySpan),
        );
      }
      const isAtStep =
        previousRight !== undefined &&
        statement.kind === "Apply" &&
        isInfixExpression(generation.file, statement) &&
        statement.args[0].kind === "ExceptAt";
      // SANY generates an @ step's right side before the $Nop that stands for its @.
      const atRight = isAtStep ? generateExpression(generation, statement.args[1]) : undefined;
      const expression = isAtStep
        ? createOpAppl(
            generation,
            resolveName(generation, statement.operator, getLocation(generation.file, statement)),
            [
              applyBuiltin(
                generation,
                "$Nop",
                [previousRight],
                getLocation(generation.file, statement.args[0]),
              ),
              atRight,
            ],
            getLocation(generation.file, statement),
          )
        : generateExpression(generation, statement);
      const right = expression.kind === "OpAppl" ? expression.operands[1] : undefined;
      previousRight = isInfixExpression(generation.file, statement) ? right : undefined;
      return expression;
    };
    const stepBody =
      body.kind === "Assert"
        ? generateAssertion(body.statement)
        : generateStepBody(generation, body, bodySpan);
    if (stepBody === undefined) throw new TlaSyntaxError(`Unexpected proof step ${body.kind}`);
    const pickContext = body.kind === "Pick" ? generation.contexts.pop() : undefined;
    const definition =
      step.name === undefined || definitionId === undefined
        ? undefined
        : createTheoremDefinition(
            generation,
            definitionId,
            step.name,
            stepBody,
            getTokenLocation(generation.file, getTokenIndex(generation.file, step.location)),
            popLabels(generation),
          );
    if (definition) addSymbol(generation, definition);
    const isScoped = isAssumeProve && !isSuffices;
    if (isScoped) generation.contexts.push(assumeContext);
    const stepProof = step.proof && generateProof(generation, step.proof);
    if (isScoped) generation.contexts.pop();
    endProof(generation, stepBody);
    if (isAssumeProve && isSuffices) {
      sufficesContexts.push(assumeContext);
      generation.contexts.push(assumeContext);
    }
    pickContext?.symbols.forEach((symbol) => addSymbol(generation, symbol));
    return {
      ...createLevelFields(generation.getId()),
      kind: "Theorem",
      definition,
      body: stepBody,
      proof: stepProof,
      isSuffices,
      location: getSpanLocation(generation.file, stepSpan),
    };
  });
  sufficesContexts.forEach(() => {
    generation.contexts.pop()?.symbols.forEach((symbol) => addToContext(proofContext, symbol));
  });
  generation.contexts.pop();
  return {
    ...createLevelFields(generation.getId()),
    kind: "NonLeafProof",
    steps,
    instances,
    proofLevel: proof.level,
    location: getSpanLocation(generation.file, getUnitSpan(generation.file, proof.location)),
  };
};

export const processTheorem = (generation: ModuleGeneration, theorem: Theorem) => {
  const location = getSpanLocation(generation.file, getUnitSpan(generation.file, theorem.location));
  const statement = theorem.statement;
  const assumeContext = createContext();
  if (theorem.name !== undefined) pushLabelScope(generation);
  const definitionId = theorem.name === undefined ? undefined : generation.getId();
  if (statement.kind === "AssumeProve") generation.contexts.push(assumeContext);
  const body =
    statement.kind === "AssumeProve"
      ? generateAssumeProve(
          generation,
          statement,
          1,
          theorem.name === undefined ? undefined : { isSuffices: false },
        )
      : generateExpression(generation, statement);
  const definition =
    theorem.name === undefined || definitionId === undefined
      ? undefined
      : createTheoremDefinition(
          generation,
          definitionId,
          theorem.name,
          body,
          location,
          popLabels(generation),
        );
  if (definition) {
    if (statement.kind === "AssumeProve") generation.contexts.pop();
    addSymbol(generation, definition);
    generation.currentModule.definitions.push(definition);
    if (statement.kind === "AssumeProve") generation.contexts.push(assumeContext);
  }
  const proof = theorem.proof && generateProof(generation, theorem.proof);
  if (statement.kind === "AssumeProve") generation.contexts.pop();
  endProof(generation, body);
  const node: TheoremNode = {
    ...createLevelFields(generation.getId()),
    kind: "Theorem",
    definition,
    body,
    proof,
    isSuffices: false,
    location,
  };
  generation.currentModule.topLevel.push(node);
};

export const processAssumption = (generation: ModuleGeneration, assumption: Assumption) => {
  const span = getUnitSpan(generation.file, assumption.location);
  const location = getSpanLocation(generation.file, span);
  if (assumption.name !== undefined) pushLabelScope(generation);
  const body = generateExpression(generation, assumption.expression);
  const definition =
    assumption.name === undefined
      ? undefined
      : createTheoremDefinition(
          generation,
          generation.getId(),
          assumption.name,
          body,
          location,
          popLabels(generation),
          false,
        );
  if (definition) {
    addSymbol(generation, definition);
    generation.currentModule.definitions.push(definition);
  }
  const node: AssumeNode = {
    ...createLevelFields(generation.getId()),
    kind: "Assume",
    definition,
    body,
    location,
  };
  generation.currentModule.topLevel.push(node);
};
