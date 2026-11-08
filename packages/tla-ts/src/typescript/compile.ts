import { basename } from "node:path";
import ts from "@typescript/typescript6";
import { translateScript, writesState } from "./actions";
import { type Context, createContext } from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { indent, render, wrapEquated } from "./formula";
import { translateBody } from "./functions";
import { type Exported, type Model, readModel, type Variable } from "./model";
import { createProgram } from "./program";
import { translateCall, translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { translateStep } from "./steps";
import { getDomain } from "./types";

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
  if (writesState(definition.body, context)) {
    return translateStep(definition, sections, context);
  }
  const returnType = context.checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  if (
    returnType === undefined ||
    (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0
  ) {
    return translateStep(definition, sections, context);
  }
  return returnType.flags & ts.TypeFlags.BooleanLike
    ? translateInvariant(definition, sections, context)
    : translateCall(definition, sections, context);
};

// Compiles a TypeScript file into a TLA+ spec and the config that checks it. Imports resolve
// relative to fileName, and the module takes its name, so die-hard.ts is the module DieHard.
export const compile = (source: string, fileName = "spec.ts"): CompiledSpec => {
  const program = createProgram(source, fileName.replaceAll("\\", "/"));
  const context = createContext(program.checker);
  const model = readModel(program.sourceFile, context);
  const sections = createSections();
  sections.init.push(
    ...(model.script.every(ts.isVariableStatement)
      ? model.variables.map((variable) => translateInitial(variable, context))
      : [render(translateScript(model.script, context))]),
  );
  for (const definition of model.exported) translateExported(definition, model, sections, context);
  const moduleName = basename(fileName, ".ts")
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return emit(moduleName, model, sections, context);
};
