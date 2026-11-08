// Ported from Z3 (src/ast/array_decl_plugin.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  isArithSort,
  OP_ARRAY_DEFAULT,
  OP_ARRAY_EXT,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_SELECT,
  OP_STORE,
} from "./ast";

interface ArraySignature {
  name: string;
  domain: number[];
  range: number;
}

const isCompatible = (first: number, second: number) =>
  first === second || (isArithSort(first) && isArithSort(second));

const getSelectSignature = (manager: AstManager, argSorts: number[]): ArraySignature | string => {
  if (argSorts.length <= 1) return "select takes at least two arguments";
  const sort = argSorts[0];
  if (!manager.isArraySort(sort))
    return `select expects the first argument sort to be an array, but was provided a value of sort ${manager.getSortName(sort)}`;
  const parameters = manager.getSortParameters(sort);
  if (parameters.length !== argSorts.length)
    return `select expects the first argument to be an array taking ${parameters.length - 1}, instead it was passed ${argSorts.length - 1} arguments`;
  for (let index = 0; index + 1 < parameters.length; index++)
    if (!isCompatible(argSorts[index + 1], parameters[index]))
      return `domain sort ${manager.getSortName(argSorts[index + 1])} and parameter ${manager.getSortName(parameters[index])} do not match`;
  return {
    name: "select",
    domain: [sort, ...parameters.slice(0, -1)],
    range: manager.getArrayRange(sort),
  };
};

const getStoreSignature = (manager: AstManager, argSorts: number[]): ArraySignature | string => {
  if (argSorts.length < 3) return "store takes at least 3 arguments";
  const sort = argSorts[0];
  if (!manager.isArraySort(sort)) return "store expects the first argument sort to be an array";
  const parameters = manager.getSortParameters(sort);
  if (argSorts.length !== parameters.length + 1)
    return `store expects the first argument to be an array taking ${parameters.length + 1}, instead it was passed ${argSorts.length - 1} arguments`;
  for (let index = 0; index < parameters.length; index++)
    if (!isCompatible(parameters[index], argSorts[index + 1]))
      return `domain sort ${manager.getSortName(argSorts[index + 1])} and parameter sort ${manager.getSortName(parameters[index])} do not match`;
  return { name: "store", domain: [sort, ...parameters], range: sort };
};

const getConstSignature = (
  manager: AstManager,
  sort: number,
  argSorts: number[],
): ArraySignature | string => {
  if (argSorts.length !== 1) return "invalid const array definition, expected one argument";
  if (!manager.isArraySort(sort))
    return "invalid const array definition, parameter is not an array sort";
  if (manager.getArrayRange(sort) !== argSorts[0])
    return "invalid const array definition, sort mismatch between array range and argument";
  return { name: "const", domain: argSorts, range: sort };
};

export const getMapSignature = (
  manager: AstManager,
  mapped: { domain: readonly number[]; range: number },
  argSorts: number[],
): ArraySignature | string => {
  if (argSorts.length !== mapped.domain.length)
    return `map expects to take as many arguments as the function being mapped, it was given ${argSorts.length} but expects ${mapped.domain.length}`;
  if (argSorts.length === 0) return "don't use map on constants";
  const arity = manager.getArrayArity(argSorts[0]);
  for (let index = 0; index < argSorts.length; index++) {
    const sort = argSorts[index];
    if (!manager.isArraySort(sort))
      return `map expects an array sort as argument at position ${index}`;
    if (manager.getArrayArity(sort) !== arity)
      return `map expects all arguments to have the same array domain,  this is not the case for argument ${index}`;
    for (let position = 0; position < arity; position++)
      if (
        manager.getSortParameters(sort)[position] !==
        manager.getSortParameters(argSorts[0])[position]
      )
        return `map expects all arguments to have the same array domain, this is not the case for argument ${index}`;
    if (manager.getArrayRange(sort) !== mapped.domain[index])
      return `map expects the argument at position ${index} to have the array range the same as the function`;
  }
  const range = manager.mkArraySort([
    ...manager.getSortParameters(argSorts[0]).slice(0, -1),
    mapped.range,
  ]);
  return { name: "map", domain: argSorts, range };
};

const getDefaultSignature = (manager: AstManager, argSorts: number[]): ArraySignature | string => {
  if (argSorts.length !== 1) return "invalid default array definition, invalid domain size";
  if (manager.getSortParameters(argSorts[0]).length <= 1)
    return "parameter mismatch. There should be more than one parameter to defaults";
  return { name: "default", domain: argSorts, range: manager.getArrayRange(argSorts[0]) };
};

const getExtSignature = (
  manager: AstManager,
  index: number,
  argSorts: number[],
): ArraySignature | string => {
  if (argSorts.length !== 2 || argSorts[0] !== argSorts[1])
    return "incorrect arguments passed to array-ext";
  const parameters = manager.getSortParameters(argSorts[0]);
  if (parameters.length === 0 || index >= parameters.length - 1)
    return "incorrect arguments passed to array-ext";
  return { name: "array-ext", domain: argSorts, range: parameters[index] };
};

// The parameter of const is its array sort, of map the declaration it maps, and of array-ext the
// index of its domain.
export const getArraySignature = (
  manager: AstManager,
  op: number,
  argSorts: number[],
  parameters: number[],
): ArraySignature | string => {
  switch (op) {
    case OP_SELECT:
      return getSelectSignature(manager, argSorts);
    case OP_STORE:
      return getStoreSignature(manager, argSorts);
    case OP_CONST_ARRAY:
      return getConstSignature(manager, parameters[0], argSorts);
    case OP_ARRAY_MAP:
      return getMapSignature(manager, manager.funcDecls[parameters[0]], argSorts);
    case OP_ARRAY_DEFAULT:
      return getDefaultSignature(manager, argSorts);
    case OP_ARRAY_EXT:
      return getExtSignature(manager, parameters[0] ?? 0, argSorts);
    default:
      return "invalid array operator";
  }
};

export const mkArrayDecl = (
  manager: AstManager,
  op: number,
  argSorts: number[],
  parameters: number[] = [],
) => {
  const signature = getArraySignature(manager, op, argSorts, parameters);
  if (typeof signature === "string") throw new SmtInvariantError(signature);
  return manager.mkArrayDecl(op, signature.name, parameters, signature.domain, signature.range);
};

export const mkArrayApp = (
  manager: AstManager,
  op: number,
  args: number[],
  parameters: number[] = [],
) => {
  const decl = mkArrayDecl(
    manager,
    op,
    args.map((arg) => manager.sorts[arg]),
    parameters,
  );
  return manager.mkApp(decl, args, manager.funcDecls[decl].range);
};

// mk_as_array: a constant whose array sort is the signature of the declaration it stands for.
export const mkAsArray = (manager: AstManager, decl: number) => {
  const funcDecl = manager.funcDecls[decl];
  const sort = manager.mkArraySort([...funcDecl.domain, funcDecl.range]);
  const asArray = manager.mkArrayDecl(OP_AS_ARRAY, "as-array", [decl], [], sort);
  return manager.mkApp(asArray, [], sort);
};
