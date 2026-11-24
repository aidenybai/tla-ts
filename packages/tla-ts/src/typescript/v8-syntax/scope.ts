// V8's scopes (src/ast/scopes.cc), as far as its parser's early errors read them: the names that each
// scope declares, its declarations in order, its strictness, and its class's private names.

export const FUNCTION_KIND = {
  NormalFunction: 0,
  Module: 1,
  ModuleWithTopLevelAwait: 2,
  BaseConstructor: 3,
  DefaultBaseConstructor: 4,
  DefaultDerivedConstructor: 5,
  DerivedConstructor: 6,
  GetterFunction: 7,
  StaticGetterFunction: 8,
  SetterFunction: 9,
  StaticSetterFunction: 10,
  ArrowFunction: 11,
  AsyncArrowFunction: 12,
  AsyncFunction: 13,
  AsyncConciseMethod: 14,
  StaticAsyncConciseMethod: 15,
  AsyncConciseGeneratorMethod: 16,
  StaticAsyncConciseGeneratorMethod: 17,
  AsyncGeneratorFunction: 18,
  GeneratorFunction: 19,
  ConciseGeneratorMethod: 20,
  StaticConciseGeneratorMethod: 21,
  ConciseMethod: 22,
  StaticConciseMethod: 23,
  ClassMembersInitializerFunction: 24,
  ClassMembersInitializerFunctionPrecededByStatic: 25,
  ClassStaticInitializerFunction: 26,
  ClassStaticInitializerFunctionPrecededByMember: 27,
} as const;

const isKindInRange = (kind: number, low: number, high: number) => kind >= low && kind <= high;

const isArrowFunction = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.ArrowFunction, FUNCTION_KIND.AsyncArrowFunction);
export const isModuleKind = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.Module, FUNCTION_KIND.ModuleWithTopLevelAwait);
export const isGeneratorFunction = (kind: number) =>
  isKindInRange(
    kind,
    FUNCTION_KIND.AsyncConciseGeneratorMethod,
    FUNCTION_KIND.StaticConciseGeneratorMethod,
  );
export const isAsyncFunction = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.AsyncArrowFunction, FUNCTION_KIND.AsyncGeneratorFunction);
export const isConciseMethod = (kind: number) =>
  isKindInRange(
    kind,
    FUNCTION_KIND.AsyncConciseMethod,
    FUNCTION_KIND.StaticAsyncConciseGeneratorMethod,
  ) ||
  isKindInRange(
    kind,
    FUNCTION_KIND.ConciseGeneratorMethod,
    FUNCTION_KIND.ClassStaticInitializerFunctionPrecededByMember,
  );
export const isGetterFunction = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.GetterFunction, FUNCTION_KIND.StaticGetterFunction);
export const isSetterFunction = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.SetterFunction, FUNCTION_KIND.StaticSetterFunction);
export const isAccessorFunction = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.GetterFunction, FUNCTION_KIND.StaticSetterFunction);
export const isDerivedConstructor = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.DefaultDerivedConstructor, FUNCTION_KIND.DerivedConstructor);
export const isClassConstructor = (kind: number) =>
  isKindInRange(kind, FUNCTION_KIND.BaseConstructor, FUNCTION_KIND.DerivedConstructor);
export const isClassInitializerFunction = (kind: number) =>
  isKindInRange(
    kind,
    FUNCTION_KIND.ClassMembersInitializerFunction,
    FUNCTION_KIND.ClassStaticInitializerFunctionPrecededByMember,
  );

export const VARIABLE_MODE = {
  Let: 0,
  Const: 1,
  Using: 2,
  AwaitUsing: 3,
  Var: 4,
  PrivateMethod: 5,
  PrivateSetterOnly: 6,
  PrivateGetterOnly: 7,
  PrivateGetterAndSetter: 8,
} as const;

export const isLexicalVariableMode = (mode: number) => mode <= VARIABLE_MODE.AwaitUsing;
export const isImmutableLexicalVariableMode = (mode: number) =>
  mode >= VARIABLE_MODE.Const && mode <= VARIABLE_MODE.AwaitUsing;

export const VARIABLE_KIND = {
  Normal: 0,
  Parameter: 1,
  SloppyBlockFunction: 2,
} as const;

export const SCOPE_TYPE = {
  Class: 0,
  Eval: 1,
  Function: 2,
  Module: 3,
  Script: 4,
  Catch: 5,
  Block: 6,
  With: 7,
} as const;

interface Variable {
  name: string;
  mode: number;
  kind: number;
  isStatic: boolean;
}

interface Declaration {
  variable: Variable;
  position: number;
  // The scope that a var declaration nested in a block or a with statement is written in.
  nestedScope: Scope | undefined;
}

export interface Scope {
  type: number;
  outer: Scope | undefined;
  isDeclarationScope: boolean;
  isStrict: boolean;
  functionKind: number;
  hasThisDeclaration: boolean;
  hasSimpleParameters: boolean;
  isNonlinear: boolean;
  variables: Map<string, Variable>;
  declarations: Declaration[];
  privateNames: Map<string, Variable>;
  // The private names that the class's body reads and that no class has resolved yet, by their
  // names and positions.
  unresolvedPrivateNames: { name: string; position: number }[];
  isParsingHeritage: boolean;
  isPrivateNameLookupSkippingOuterClass: boolean;
}

export const createScope = (
  type: number,
  outer: Scope | undefined,
  functionKind: number = FUNCTION_KIND.NormalFunction,
): Scope => ({
  type,
  outer,
  isDeclarationScope:
    type === SCOPE_TYPE.Function ||
    type === SCOPE_TYPE.Script ||
    type === SCOPE_TYPE.Module ||
    type === SCOPE_TYPE.Eval,
  isStrict: type === SCOPE_TYPE.Module || (outer?.isStrict ?? false),
  functionKind,
  hasThisDeclaration:
    (type === SCOPE_TYPE.Function && !isArrowFunction(functionKind)) || type === SCOPE_TYPE.Module,
  hasSimpleParameters: true,
  isNonlinear: false,
  variables: new Map(),
  declarations: [],
  privateNames: new Map(),
  unresolvedPrivateNames: [],
  isParsingHeritage: false,
  isPrivateNameLookupSkippingOuterClass:
    outer !== undefined && outer.type === SCOPE_TYPE.Class && outer.isParsingHeritage,
});

export const getDeclarationScope = (scope: Scope): Scope =>
  scope.isDeclarationScope || scope.outer === undefined ? scope : getDeclarationScope(scope.outer);

export const getClosureScope = (scope: Scope): Scope =>
  (scope.isDeclarationScope && scope.type !== SCOPE_TYPE.Block) || scope.outer === undefined
    ? scope
    : getClosureScope(scope.outer);

export const getReceiverScope = (scope: Scope): Scope =>
  (scope.isDeclarationScope && (scope.type === SCOPE_TYPE.Script || scope.hasThisDeclaration)) ||
  scope.outer === undefined
    ? scope
    : getReceiverScope(scope.outer);

// The result of declaring a name: the variable, whether it is new, and whether the declaration
// is allowed beside an earlier one of the name.
export const declareVariable = (
  scope: Scope,
  name: string,
  position: number,
  mode: number,
  kind: number,
): { variable: Variable; isAdded: boolean; isOk: boolean } => {
  if (mode === VARIABLE_MODE.Var && !scope.isDeclarationScope) {
    const result = declareVariableIn(getDeclarationScope(scope), name, mode, kind);
    getDeclarationScope(scope).declarations.push({
      variable: result.variable,
      position,
      nestedScope: scope,
    });
    return result;
  }
  const result = declareVariableIn(scope, name, mode, kind);
  scope.declarations.push({ variable: result.variable, position, nestedScope: undefined });
  return result;
};

const declareVariableIn = (scope: Scope, name: string, mode: number, kind: number) => {
  const existing = scope.variables.get(name);
  if (existing === undefined) {
    const variable = { name, mode, kind, isStatic: false };
    scope.variables.set(name, variable);
    return { variable, isAdded: true, isOk: true };
  }
  const isOk =
    !(isLexicalVariableMode(mode) || isLexicalVariableMode(existing.mode)) ||
    (existing.kind === VARIABLE_KIND.SloppyBlockFunction &&
      kind === VARIABLE_KIND.SloppyBlockFunction);
  return { variable: existing, isAdded: false, isOk };
};

// A name that a var declares where a block between it and its function declares the name
// lexically, as V8 finds it at the end of the function.
export const findConflictingVarDeclaration = (scope: Scope) =>
  scope.declarations.find((declaration) => {
    const nested = declaration.nestedScope;
    if (nested === undefined || declaration.variable.mode !== VARIABLE_MODE.Var) return false;
    for (let current: Scope | undefined = nested; current !== scope && current !== undefined;) {
      const other = current.variables.get(declaration.variable.name);
      if (current.type !== SCOPE_TYPE.Catch && other !== undefined) return true;
      current = current.outer;
    }
    return false;
  });

// A name that a scope declares that another scope declares with a mode up to the limit.
export const findVariableDeclaredIn = (scope: Scope, other: Scope, modeLimit: number) =>
  [...other.variables.keys()].find((name) => {
    const variable = scope.variables.get(name);
    return variable !== undefined && variable.mode <= modeLimit;
  });

const isComplementaryAccessorPair = (first: number, second: number) =>
  (first === VARIABLE_MODE.PrivateGetterOnly && second === VARIABLE_MODE.PrivateSetterOnly) ||
  (first === VARIABLE_MODE.PrivateSetterOnly && second === VARIABLE_MODE.PrivateGetterOnly);

// Declares a class's private name, and returns whether the class has no other of its name, but a
// getter's or a setter's of the same staticness, which the declaration completes.
export const declarePrivateName = (scope: Scope, name: string, mode: number, isStatic: boolean) => {
  const existing = scope.privateNames.get(name);
  if (existing === undefined) {
    scope.privateNames.set(name, { name, mode, kind: VARIABLE_KIND.Normal, isStatic });
    return true;
  }
  if (isComplementaryAccessorPair(existing.mode, mode) && existing.isStatic === isStatic) {
    existing.mode = VARIABLE_MODE.PrivateGetterAndSetter;
    return true;
  }
  return false;
};

// The class scopes that a private name in a scope may name, from the innermost, as V8's
// PrivateNameScopeIterator walks them.
export const getPrivateNameScopes = (start: Scope) => {
  const scopes: Scope[] = [];
  const getNext = (from: Scope) => {
    let inner = from;
    for (let scope = from.outer; scope !== undefined; scope = scope.outer) {
      if (scope.type === SCOPE_TYPE.Class && !inner.isPrivateNameLookupSkippingOuterClass) {
        return scope;
      }
      inner = scope;
    }
    return undefined;
  };
  let current: Scope | undefined =
    start.type !== SCOPE_TYPE.Class || start.isParsingHeritage ? getNext(start) : start;
  while (current !== undefined) {
    scopes.push(current);
    current = getNext(current);
  }
  return scopes;
};
