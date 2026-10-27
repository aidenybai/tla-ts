import { resolve } from "node:path";
import ts from "typescript";
import { writesState } from "./actions";
import { type Context, createContext } from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { TsproverError } from "./errors";
import { indent, wrapEquated } from "./formula";
import { translateBody } from "./functions";
import { type Exported, type Model, readModel, type Variable } from "./model";
import { createProgram } from "./program";
import { translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { translateStep } from "./steps";
import { getDomain } from "./types";

export type { CompiledSpec } from "./emit";

// A state variable starts at its initializer, or at every value of its type without one.
const translateInitial = (variable: Variable, context: Context) => {
  const initializer = variable.declaration.initializer;
  if (initializer === undefined) {
    const type = context.checker.getTypeAtLocation(variable.declaration.name);
    return `${variable.name} \\in ${getDomain(type, variable.declaration, context)}`;
  }
  const value = translateBody(initializer, createStateScope(context), context);
  return `${variable.name} = ${indent(wrapEquated(value), "     ")}`;
};

// An exported function is a property if a tag says so, an action if it changes state, and an
// invariant if it returns a boolean.
const translateExported = (
  definition: Exported,
  model: Model,
  sections: Sections,
  context: Context,
) => {
  const tag = [...definition.tags.keys()].find((candidate) => VALUE_TAGS.has(candidate));
  if (tag !== undefined) return translateProperty(definition, tag, model, sections, context);
  if (writesState(definition.body, context, new Set())) {
    return translateStep(definition, sections, context);
  }
  const returnType = context.checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  if (
    returnType === undefined ||
    (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0
  ) {
    return translateStep(definition, sections, context);
  }
  if (!(returnType.flags & ts.TypeFlags.BooleanLike)) {
    throw new TsproverError(
      "An exported function that returns a value must return a boolean, or be tagged, such as @view",
      definition.node,
    );
  }
  return translateInvariant(definition, sections, context);
};

// Compiles a TypeScript model into a TLA+ spec and the config that checks it. Imports resolve
// relative to fileName.
export const compile = (source: string, fileName = "spec.ts"): CompiledSpec => {
  const program = createProgram(source, resolve(fileName).replaceAll("\\", "/"));
  const context = createContext(program.checker);
  const model = readModel(program.sourceFile, context);
  const sections = createSections();
  sections.init.push(...model.variables.map((variable) => translateInitial(variable, context)));
  for (const definition of model.exported) translateExported(definition, model, sections, context);
  return emit(model, sections, context);
};
