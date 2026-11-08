import ts from "@typescript/typescript6";
import { translateScript, writesState } from "./actions";
import { rejectSharing } from "./aliasing";
import { type Context, createContext } from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { render } from "./formula";
import { translateBody } from "./functions";
import { type Exported, type Model, readModel, type Variable } from "./model";
import { createProgram } from "./program";
import { translateCall, translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { TlaTypeScriptError } from "../errors";
import { translateStep } from "./steps";
import { apply, getLocation, getModuleName, locate } from "./tla";
import { getDomain } from "./types";

// A state variable starts at its initializer, or at every value of its type without one.
const translateInitial = (variable: Variable, context: Context) => {
  const declaration = variable.declaration;
  const name = context.variables.get(variable.symbol);
  if (name === undefined) throw new TlaTypeScriptError("Unknown variable", declaration);
  const initializer = declaration.initializer;
  if (initializer === undefined) {
    const type = context.checker.getTypeAtLocation(declaration.name);
    return locate(
      apply("\\in", [name, getDomain(type, declaration, context)]),
      getLocation(declaration),
    );
  }
  const value = translateBody(initializer, createStateScope(context), context);
  return locate(apply("=", [name, value]), getLocation(declaration));
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
  rejectSharing(program.sourceFile, context);
  const sections = createSections();
  sections.init.push(
    ...(model.script.every(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.every((declaration) =>
          ts.isIdentifier(declaration.name),
        ),
    )
      ? model.variables.map((variable) => translateInitial(variable, context))
      : [
          locate(
            render(translateScript(model.script, model.exported.length === 0, context)),
            getLocation(model.script[0]),
          ),
        ]),
  );
  for (const definition of model.exported) translateExported(definition, model, sections, context);
  return emit(getModuleName(fileName), program.sourceFile, model, sections, context);
};
