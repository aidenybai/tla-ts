import { basename } from "node:path";
import ts from "@typescript/typescript6";
import { writesState } from "./actions";
import { type Context, createContext } from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { TlaTypeScriptError } from "../errors";
import { indent, wrapEquated } from "./formula";
import { translateBody } from "./functions";
import { type Exported, type Model, readModel, type Variable } from "./model";
import { createProgram } from "./program";
import { translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { translateStep } from "./steps";
import { getDomain } from "./types";

const translateInitial = (variable: Variable, context: Context) => {
  const initializer = variable.declaration.initializer;
  if (initializer === undefined) {
    const type = context.checker.getTypeAtLocation(variable.declaration.name);
    return `${variable.name} \\in ${getDomain(type, variable.declaration, context)}`;
  }
  const value = translateBody(initializer, createStateScope(context), context);
  return `${variable.name} = ${indent(wrapEquated(value), "     ")}`;
};

const translateExported = (
  definition: Exported,
  model: Model,
  sections: Sections,
  context: Context,
) => {
  const tag = [...definition.tags.keys()].find((candidate) => VALUE_TAGS.has(candidate));
  if (tag !== undefined) return translateProperty(definition, tag, model, sections, context);
  const returnType = context.checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  if (
    writesState(definition.body, context) ||
    returnType === undefined ||
    (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0
  ) {
    return translateStep(definition, sections, context);
  }
  if (!(returnType.flags & ts.TypeFlags.BooleanLike)) {
    throw new TlaTypeScriptError(
      "An exported function that returns a value must return a boolean, or be tagged, such as @view",
      definition.node,
    );
  }
  return translateInvariant(definition, sections, context);
};

export const compile = (source: string, fileName = "spec.ts"): CompiledSpec => {
  const program = createProgram(source, fileName.replaceAll("\\", "/"));
  const context = createContext(program.checker);
  const model = readModel(program.sourceFile, context);
  const sections = createSections();
  sections.init.push(...model.variables.map((variable) => translateInitial(variable, context)));
  for (const definition of model.exported) translateExported(definition, model, sections, context);
  const moduleName = basename(fileName, ".ts")
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return emit(moduleName, model, sections, context);
};
