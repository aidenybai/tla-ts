// Ported from Z3 (src/ast/datatype_decl_plugin.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_DT_UPDATE_FIELD,
  SORT_BOOL,
  SORT_SIZE_INFINITE,
  SORT_SIZE_VERY_BIG,
} from "./ast";
import { stringHash } from "./hash";
import { RandomGen } from "./random-gen";

export interface AccessorDef {
  name: string;
  // A sort, or -1 - i for the i-th datatype of the declaration until it exists.
  range: number;
}

export interface ConstructorDef {
  name: string;
  recognizer: string;
  accessors: AccessorDef[];
}

const SIZE_OFFSET = 0;
const SIZE_PARAMETER = 1;
const SIZE_PLUS = 2;
const SIZE_TIMES = 3;
const SIZE_POWER = 4;

interface SizeTerm {
  kind: number;
  size: bigint;
  index: number;
  args: SizeTerm[];
}

export interface DatatypeDef {
  name: string;
  classId: number;
  parameters: number[];
  constructors: ConstructorDef[];
  sort: number;
  size: SizeTerm | undefined;
  isRecursive: boolean;
}

const MAX_FINITE_SIZE = 1n << 64n;

const mkSizeTerm = (kind: number, size: bigint, index: number, args: SizeTerm[]): SizeTerm => ({
  kind,
  size,
  index,
  args,
});

const mkOffset = (size: bigint) => mkSizeTerm(SIZE_OFFSET, size, 0, []);

const mkFold = (kind: number, args: SizeTerm[], empty: bigint) =>
  args.length === 0
    ? mkOffset(empty)
    : args.slice(1).reduce((left, right) => mkSizeTerm(kind, 0n, 0, [left, right]), args[0]);

const isInfiniteOrVeryBig = (size: bigint) =>
  size === SORT_SIZE_INFINITE || size === SORT_SIZE_VERY_BIG;

const toSortSize = (size: bigint) => (size >= MAX_FINITE_SIZE ? SORT_SIZE_VERY_BIG : size);

const evalSize = (term: SizeTerm, parameterSizes: bigint[]): bigint => {
  if (term.kind === SIZE_OFFSET) return term.size;
  if (term.kind === SIZE_PARAMETER) return parameterSizes[term.index];
  if (term.kind === SIZE_PLUS) {
    let sum = 0n;
    const todo = [term.args[0], term.args[1]];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (current.kind === SIZE_PLUS) {
        todo.push(current.args[0], current.args[1]);
        continue;
      }
      const size = evalSize(current, parameterSizes);
      if (isInfiniteOrVeryBig(size)) return size;
      sum += size;
    }
    return toSortSize(sum);
  }
  const first = evalSize(term.args[0], parameterSizes);
  const second = evalSize(term.args[1], parameterSizes);
  if (first === SORT_SIZE_INFINITE) return first;
  if (second === SORT_SIZE_INFINITE) return second;
  if (first === SORT_SIZE_VERY_BIG) return first;
  if (second === SORT_SIZE_VERY_BIG) return second;
  if (term.kind === SIZE_TIMES) return toSortSize(first * second);
  if (first === 1n || second === 1n) return first;
  if (first > 2n << 20n || second > 10n) return SORT_SIZE_VERY_BIG;
  return toSortSize(first ** second);
};

const getSymbolHash = (name: string) => stringHash(name, 17);

export const getDatatypeDef = (manager: AstManager, sort: number) =>
  manager.datatypeDefs.get(manager.sortNames[sort]);

const getDef = (manager: AstManager, sort: number) => {
  const def = getDatatypeDef(manager, sort);
  if (def === undefined) throw new SmtInvariantError("datatype constructors have not been created");
  return def;
};

export const mkDatatypeSort = (manager: AstManager, name: string, parameters: number[]) => {
  const sort = manager.mkDatatypeSort(name, parameters);
  const def = manager.datatypeDefs.get(name);
  if (def?.size !== undefined && def.parameters.length === parameters.length)
    manager.setSortSize(
      sort,
      evalSize(
        def.size,
        parameters.map((parameter) => manager.getSortSize(parameter)),
      ),
    );
  return sort;
};

export const substituteSort = (
  manager: AstManager,
  sort: number,
  from: readonly number[],
  to: readonly number[],
): number => {
  const index = from.indexOf(sort);
  if (index !== -1) return to[index];
  const parameters = manager.getSortParameters(sort);
  if (parameters.length === 0) return sort;
  const substituted = parameters.map((parameter) => substituteSort(manager, parameter, from, to));
  if (manager.isArraySort(sort)) return manager.mkArraySort(substituted);
  const name = manager.sortNames[sort];
  if (!manager.isDatatypeSort(sort)) return manager.mkUninterpretedSort(name, substituted);
  const result = manager.mkDatatypeSort(name, substituted);
  if (manager.getSortSize(result) === SORT_SIZE_INFINITE)
    manager.setSortSize(result, manager.getSortSize(sort));
  return result;
};

const instantiateDef = (manager: AstManager, def: DatatypeDef, sorts: readonly number[]) => {
  if (def.sort === -1) def.sort = mkDatatypeSort(manager, def.name, def.parameters);
  return sorts.length === 0 ? def.sort : substituteSort(manager, def.sort, def.parameters, sorts);
};

const getSubsorts = (manager: AstManager, sort: number, result: number[]) => {
  result.push(sort);
  for (const parameter of manager.getSortParameters(sort)) getSubsorts(manager, parameter, result);
  return result;
};

const isWellFounded = (manager: AstManager, defs: DatatypeDef[], sorts: number[]) => {
  const isWellFoundedDef = defs.map(() => false);
  let numWellFounded = 0;
  for (let isChanged = true; isChanged && numWellFounded < defs.length;) {
    isChanged = false;
    defs.forEach((def, index) => {
      if (isWellFoundedDef[index]) return;
      const hasGroundedConstructor = def.constructors.some((constructor) =>
        constructor.accessors.every((accessor) => {
          for (const subsort of getSubsorts(manager, accessor.range, [])) {
            const sortIndex = sorts.indexOf(subsort);
            if (sortIndex !== -1) {
              if (!isWellFoundedDef[sortIndex]) return false;
            } else if (manager.isDatatypeSort(subsort)) break;
          }
          return true;
        }),
      );
      if (!hasGroundedConstructor) return;
      isChanged = true;
      isWellFoundedDef[index] = true;
      numWellFounded++;
    });
  }
  return numWellFounded === defs.length;
};

const isCovariant = (manager: AstManager, defs: DatatypeDef[], sorts: number[]) =>
  defs.every((def) =>
    def.constructors.every((constructor) =>
      constructor.accessors.every((accessor) => {
        const range = accessor.range;
        if (!manager.isArraySort(range)) return true;
        const parameters = manager.getSortParameters(range);
        const subsorts: number[] = [];
        for (const domain of parameters.slice(0, -1)) getSubsorts(manager, domain, subsorts);
        const arrayRange = manager.getArrayRange(range);
        if (!manager.isDatatypeSort(arrayRange)) getSubsorts(manager, arrayRange, subsorts);
        return subsorts.every((subsort) => !sorts.includes(subsort));
      }),
    ),
  );

const isRecursiveDef = (manager: AstManager, start: DatatypeDef) => {
  const isBlack = new Map<string, boolean>();
  const todo = [start.sort];
  while (todo.length > 0) {
    const sort = todo[todo.length - 1];
    const name = manager.sortNames[sort];
    if (isBlack.get(name) === true) {
      todo.pop();
      continue;
    }
    const def = manager.datatypeDefs.get(name);
    if (def === undefined) return true;
    isBlack.set(name, false);
    let canProcess = true;
    for (const constructor of def.constructors)
      for (const accessor of constructor.accessors)
        for (const subsort of getSubsorts(manager, accessor.range, [])) {
          if (!manager.isDatatypeSort(subsort)) continue;
          const status = isBlack.get(manager.sortNames[subsort]);
          if (status === false && manager.sortNames[subsort] === start.name) return true;
          if (status !== undefined) continue;
          todo.push(subsort);
          canProcess = false;
        }
    if (!canProcess) continue;
    isBlack.set(name, true);
    todo.pop();
  }
  return false;
};

const getSortSizeTerm = (
  manager: AstManager,
  parameters: number[],
  sort: number,
): SizeTerm | undefined => {
  if (parameters.length === 0 && !manager.isDatatypeSort(sort))
    return mkOffset(manager.getSortSize(sort));
  if (manager.isDatatypeSort(sort)) {
    const def = getDatatypeDef(manager, sort);
    if (def === undefined) return undefined;
    const substitution = manager
      .getSortParameters(sort)
      .map((parameter) => getSortSizeTerm(manager, parameters, parameter));
    if (def.size === undefined) def.size = mkOffset(SORT_SIZE_INFINITE);
    return substituteSize(def.size, substitution);
  }
  if (manager.isArraySort(sort)) {
    const sortParameters = manager.getSortParameters(sort);
    const domainSizes = sortParameters
      .slice(0, -1)
      .map((domain) => getSortSizeTerm(manager, parameters, domain));
    const rangeSize = getSortSizeTerm(manager, parameters, manager.getArrayRange(sort));
    if (rangeSize === undefined || domainSizes.some((size) => size === undefined)) return undefined;
    return mkSizeTerm(SIZE_POWER, 0n, 0, [
      rangeSize,
      mkFold(
        SIZE_TIMES,
        domainSizes.flatMap((size) => (size === undefined ? [] : [size])),
        1n,
      ),
    ]);
  }
  const index = parameters.indexOf(sort);
  if (index !== -1) return mkSizeTerm(SIZE_PARAMETER, 0n, index, []);
  return mkOffset(manager.getSortSize(sort));
};

const substituteSize = (term: SizeTerm, substitution: (SizeTerm | undefined)[]): SizeTerm => {
  if (term.kind === SIZE_OFFSET) return term;
  if (term.kind === SIZE_PARAMETER) return substitution[term.index] ?? mkOffset(SORT_SIZE_INFINITE);
  return mkSizeTerm(
    term.kind,
    0n,
    0,
    term.args.map((arg) => substituteSize(arg, substitution)),
  );
};

const computeSizeFunctions = (manager: AstManager, names: string[]) => {
  const isBlack = new Map<string, boolean>();
  const todo = [...names];
  while (todo.length > 0) {
    const name = todo[todo.length - 1];
    if (isBlack.get(name) === true) {
      todo.pop();
      continue;
    }
    isBlack.set(name, false);
    let isInfinite = false;
    let canProcess = true;
    const def = manager.datatypeDefs.get(name);
    if (def === undefined) return;
    for (const constructor of def.constructors)
      for (const accessor of constructor.accessors) {
        if (!manager.isDatatypeSort(accessor.range)) continue;
        const rangeName = manager.sortNames[accessor.range];
        const status = isBlack.get(rangeName);
        if (status === false) isInfinite = true;
        else if (status === undefined && names.includes(rangeName)) {
          todo.push(rangeName);
          canProcess = false;
        }
      }
    if (!canProcess) continue;
    todo.pop();
    isBlack.set(name, true);
    if (isInfinite) {
      def.size = mkOffset(SORT_SIZE_INFINITE);
      continue;
    }
    def.size = mkFold(
      SIZE_PLUS,
      def.constructors.map((constructor) =>
        mkFold(
          SIZE_TIMES,
          constructor.accessors.flatMap((accessor) => {
            const size = getSortSizeTerm(manager, def.parameters, accessor.range);
            return size === undefined ? [] : [size];
          }),
          1n,
        ),
      ),
      0n,
    );
  }
};

const resetDeclarations = (manager: AstManager) => {
  manager.datatypeConstructors = [];
  manager.constructorAccessors = [];
  manager.constructorRecognizers = [];
  manager.nonRecConstructors = [];
  manager.nonRecDepths = [];
};

export const removeDatatype = (manager: AstManager, name: string) => {
  manager.datatypeDefs.delete(name);
  resetDeclarations(manager);
};

export const mkDatatypeDef = (
  manager: AstManager,
  name: string,
  parameters: number[],
  constructors: ConstructorDef[],
): DatatypeDef => ({
  name,
  classId: manager.datatypeDefs.size,
  parameters,
  constructors,
  sort: -1,
  size: undefined,
  isRecursive: false,
});

export const mkDatatypes = (manager: AstManager, defs: DatatypeDef[]): number[] | string => {
  for (const def of defs) {
    if (manager.datatypeDefs.has(def.name)) resetDeclarations(manager);
    manager.datatypeDefs.set(def.name, def);
  }
  const sorts = defs.map((def) => instantiateDef(manager, def, []));
  for (const def of defs)
    for (const constructor of def.constructors)
      for (const accessor of constructor.accessors)
        if (accessor.range < 0) accessor.range = sorts[-1 - accessor.range];
  if (!isWellFounded(manager, defs, sorts)) return "datatype is not well-founded";
  if (!isCovariant(manager, defs, sorts)) return "datatype is not co-variant";
  if (
    defs.some((def) =>
      def.constructors.some((constructor) =>
        constructor.accessors.some(
          (accessor) =>
            manager.isArraySort(accessor.range) &&
            sorts.includes(manager.getArrayRange(accessor.range)),
        ),
      ),
    )
  )
    manager.hasNestedRecDatatype = true;
  computeSizeFunctions(
    manager,
    defs.map((def) => def.name),
  );
  for (const def of defs) mkDatatypeSort(manager, def.name, def.parameters);
  for (const def of defs) def.isRecursive = isRecursiveDef(manager, def);
  return sorts;
};

const getConstructorDef = (manager: AstManager, constructor: number) =>
  getDef(manager, manager.funcDecls[constructor].range).constructors[
    manager.funcDecls[constructor].parameters[0]
  ];

const mkAccessor = (manager: AstManager, sort: number, constructorIndex: number, index: number) => {
  const def = getDef(manager, sort);
  const constructor = def.constructors[constructorIndex];
  const accessor = constructor.accessors[index];
  return manager.mkDatatypeDecl(
    OP_DT_ACCESSOR,
    accessor.name,
    [constructorIndex, index],
    [getSymbolHash(accessor.name), getSymbolHash(constructor.name)],
    [sort],
    substituteSort(manager, accessor.range, def.parameters, manager.getSortParameters(sort)),
  );
};

export const getDatatypeConstructors = (manager: AstManager, sort: number) => {
  const existing = manager.datatypeConstructors[sort];
  if (existing !== undefined) return existing;
  const def = getDef(manager, sort);
  const parameters = manager.getSortParameters(sort);
  const constructors = def.constructors.map((constructor, index) =>
    manager.mkDatatypeDecl(
      OP_DT_CONSTRUCTOR,
      constructor.name,
      [index],
      [getSymbolHash(constructor.name)],
      constructor.accessors.map((accessor) =>
        substituteSort(manager, accessor.range, def.parameters, parameters),
      ),
      instantiateDef(manager, def, parameters),
    ),
  );
  manager.datatypeConstructors[sort] = constructors;
  return constructors;
};

export const getConstructorAccessors = (manager: AstManager, constructor: number) => {
  const existing = manager.constructorAccessors[constructor];
  if (existing !== undefined) return existing;
  const funcDecl = manager.funcDecls[constructor];
  const accessors = getConstructorDef(manager, constructor).accessors.map((_accessor, index) =>
    mkAccessor(manager, funcDecl.range, funcDecl.parameters[0], index),
  );
  manager.constructorAccessors[constructor] = accessors;
  return accessors;
};

export const getConstructorRecognizer = (manager: AstManager, constructor: number) => {
  const existing = manager.constructorRecognizers[constructor];
  if (existing !== undefined) return existing;
  const name = getConstructorDef(manager, constructor).recognizer;
  const recognizer = manager.mkDatatypeDecl(
    OP_DT_RECOGNISER,
    name,
    [constructor],
    [manager.getDeclHash(constructor), getSymbolHash(name)],
    [manager.funcDecls[constructor].range],
    SORT_BOOL,
  );
  manager.constructorRecognizers[constructor] = recognizer;
  return recognizer;
};

export const getConstructorIs = (manager: AstManager, constructor: number) =>
  manager.mkDatatypeDecl(
    OP_DT_IS,
    "is",
    [constructor],
    [manager.getDeclHash(constructor)],
    [manager.funcDecls[constructor].range],
    SORT_BOOL,
  );

export const mkUpdateField = (manager: AstManager, accessor: number) => {
  const funcDecl = manager.funcDecls[accessor];
  return manager.mkDatatypeDecl(
    OP_DT_UPDATE_FIELD,
    "update-field",
    [accessor],
    [manager.getDeclHash(accessor)],
    [funcDecl.domain[0], funcDecl.range],
    funcDecl.domain[0],
  );
};

export const getAccessorConstructor = (manager: AstManager, accessor: number) => {
  const funcDecl = manager.funcDecls[accessor];
  return getDatatypeConstructors(manager, funcDecl.domain[0])[funcDecl.parameters[0]];
};

export const getConstructorIndex = (manager: AstManager, constructor: number) =>
  manager.funcDecls[constructor].parameters[0];

export const getRecognizerConstructor = (manager: AstManager, recognizer: number) =>
  manager.funcDecls[recognizer].parameters[0];

export const getNumConstructors = (manager: AstManager, sort: number) =>
  getDatatypeDef(manager, sort)?.constructors.length ?? 0;

export const isRecursiveDatatype = (manager: AstManager, sort: number) =>
  getDatatypeDef(manager, sort)?.isRecursive ?? true;

export const instantiateConstructor = (
  manager: AstManager,
  def: DatatypeDef,
  index: number,
  parameters: number[],
) => getDatatypeConstructors(manager, instantiateDef(manager, def, parameters))[index];

export const instantiateAccessor = (
  manager: AstManager,
  sort: number,
  constructorIndex: number,
  index: number,
) => mkAccessor(manager, sort, constructorIndex, index);

const getArrayRangeRec = (manager: AstManager, sort: number) => {
  let current = sort;
  while (manager.isArraySort(current)) current = manager.getArrayRange(current);
  return current;
};

const isRecursiveNested = (manager: AstManager, sort: number) => {
  if (!manager.isArraySort(sort)) return false;
  const range = getArrayRangeRec(manager, sort);
  return manager.isDatatypeSort(range) && isRecursiveDatatype(manager, range);
};

const getNonRecConstructorCore = (
  manager: AstManager,
  sort: number,
  forbidden: number[],
): { constructor: number; depth: number } => {
  const constructors = getDatatypeConstructors(manager, sort);
  const found = manager.nonRecConstructors[sort];
  if (found !== undefined) return { constructor: found, depth: manager.nonRecDepths[sort] };
  const remember = (constructor: number, depth: number) => {
    manager.nonRecConstructors[sort] = constructor;
    manager.nonRecDepths[sort] = depth;
    return { constructor, depth };
  };
  const random = new RandomGen(manager.getSortSmallId(sort));
  const start = random.next();
  for (let offset = 0; offset < constructors.length; offset++) {
    const constructor = constructors[(start + offset) % constructors.length];
    if (
      manager.funcDecls[constructor].domain.every(
        (argSort) => !manager.isDatatypeSort(argSort) && !isRecursiveNested(manager, argSort),
      )
    )
      return remember(constructor, 1);
  }
  let result = -1;
  let minDepth = Number.MAX_SAFE_INTEGER;
  for (let offset = 0; offset < constructors.length; offset++) {
    const constructor = constructors[(start + offset) % constructors.length];
    const domain = manager.funcDecls[constructor].domain;
    const argStart = random.next();
    let maxDepth = 0;
    let argOffset = 0;
    for (; argOffset < domain.length; argOffset++) {
      const argSort = getArrayRangeRec(manager, domain[(argStart + argOffset) % domain.length]);
      if (!manager.isDatatypeSort(argSort)) continue;
      if (forbidden.includes(argSort)) break;
      forbidden.push(argSort);
      const nested = getNonRecConstructorCore(manager, argSort, forbidden);
      forbidden.pop();
      if (nested.constructor === -1) break;
      maxDepth = Math.max(nested.depth + 1, maxDepth);
    }
    if (argOffset === domain.length && maxDepth < minDepth) {
      result = constructor;
      minDepth = maxDepth;
    }
  }
  return result === -1 ? { constructor: -1, depth: 0 } : remember(result, minDepth);
};

export const getNonRecConstructor = (manager: AstManager, sort: number) =>
  getNonRecConstructorCore(manager, sort, [sort]).constructor;
