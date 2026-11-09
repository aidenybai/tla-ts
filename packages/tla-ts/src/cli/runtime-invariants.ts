import { TlaEvaluationError, TlaSyntaxError } from "../errors";
import { EXIT_STATUS, setExitCode } from "../exit-codes";
import { parseModule } from "../parser";
import { generateSanySpecification } from "../sany/generator";
import { checkModuleLevels } from "../sany/levels";
import {
  VARIABLE_DECL_KIND,
  type ModuleNode,
  type OpDefNode,
  type SymbolNode,
} from "../sany/nodes";
import type { TlcVersion } from "../tlc/version";
import type { RuntimeInvariant } from "./tlc-arguments";

const CONSTANT_LEVEL = 0;
const TEMPORAL_LEVEL = 3;

const isUserDefinition = (symbol: SymbolNode): symbol is OpDefNode =>
  symbol.kind === "OpDef" && symbol.defKind !== "BuiltIn" && symbol.defKind !== "ModuleInstance";

const findDefinition = (module: ModuleNode, name: string) =>
  module.context.symbols.find(
    (symbol): symbol is OpDefNode => isUserDefinition(symbol) && symbol.name === name,
  );

const createParsingFailure = (detail: string) =>
  setExitCode(
    new TlaEvaluationError(
      `Parsing or semantic analysis failed.Parsing or semantic analysis failed.${detail}`,
    ),
    EXIT_STATUS.specParseError,
  );

const getDebuggerExpressionLevel = (
  root: string,
  name: string,
  expression: string,
  loadModule: (name: string) => string | undefined,
  version: TlcVersion,
) => {
  const moduleName = name.replace("__DebuggerExpr__", "__DebuggerModule__");
  const text = `---- MODULE ${moduleName} ----\nEXTENDS ${root}\n\n${name} == ${expression}\n====`;
  const createFailure = (message: string) =>
    createParsingFailure(
      `Unknown location\n\n${message} while parsing breakpoint expression "${expression}"`,
    );
  try {
    parseModule(text);
  } catch (error) {
    if (!(error instanceof TlaSyntaxError)) throw error;
    throw createParsingFailure(`Syntax error while parsing breakpoint expression "${expression}"`);
  }
  const result = { isSemanticCorrect: false, isLevelCorrect: false };
  const specification = (() => {
    try {
      return generateSanySpecification(text, loadModule, {
        version,
        onModule: (module, messages) => {
          const isCorrect = () => messages.every((message) => message.isWarning);
          if (!isCorrect()) return;
          const isLevelCorrect = checkModuleLevels(module, {
            messages,
            isTlc174: version === "1.7.4",
          });
          if (module.name !== moduleName) return;
          result.isSemanticCorrect = true;
          result.isLevelCorrect = isLevelCorrect && isCorrect();
        },
      });
    } catch (error) {
      if (!(error instanceof TlaSyntaxError)) throw error;
      throw createFailure("Semantic error");
    }
  })();
  if (!result.isSemanticCorrect) throw createFailure("Semantic error");
  if (!result.isLevelCorrect) throw createFailure("Level-checking error");
  const level = findDefinition(specification.root, name)?.level ?? CONSTANT_LEVEL;
  if (level === TEMPORAL_LEVEL) {
    throw createParsingFailure(
      `Unknown location\n\nDebug expressions must be action-level or below; actual level: ${level} (Temporal)`,
    );
  }
  return level;
};

// TLC puts a generated operator in a module that extends the root module; tla-ts appends it instead.
export const addRuntimeInvariants = (
  source: string,
  root: ModuleNode,
  invariants: RuntimeInvariant[],
  loadModule: (name: string) => string | undefined,
  version: TlcVersion,
) => {
  const stamp = Date.now();
  const named = invariants.map((invariant, index) => ({
    expression: invariant.expression,
    name: findDefinition(root, invariant.expression)
      ? invariant.expression
      : `__DebuggerExpr__${stamp + index}`,
  }));
  const names = named.map((invariant) => invariant.name);
  const generated = named.filter((invariant) => invariant.name !== invariant.expression);
  if (generated.length === 0) return { names, source };
  const loadDependency = (name: string) => (name === root.name ? source : loadModule(name));
  const variable = root.context.symbols.find(
    (symbol) => symbol.kind === "OpDecl" && symbol.declKind === VARIABLE_DECL_KIND,
  );
  const definitions = generated.map((invariant) => {
    const head = `${invariant.name} == `;
    const level = getDebuggerExpressionLevel(
      root.name,
      invariant.name,
      invariant.expression,
      loadDependency,
      version,
    );
    // HACK: TLC checks a constant-level -inv in every state, so an unused LET makes it depend on one.
    return level === CONSTANT_LEVEL && variable
      ? `${invariant.name} ==\nLET ${invariant.name}State == ${variable.name} IN\n${" ".repeat(head.length)}${invariant.expression}`
      : `${head}${invariant.expression}`;
  });
  const lines = source.split("\n");
  const end = (parseModule(source).location.range?.end.line ?? lines.length) - 1;
  const terminator = lines[end].search(/={4,}/);
  return {
    names,
    source: [
      ...lines.slice(0, end),
      lines[end].slice(0, terminator),
      ...definitions,
      lines[end].slice(terminator),
      ...lines.slice(end + 1),
    ].join("\n"),
  };
};
