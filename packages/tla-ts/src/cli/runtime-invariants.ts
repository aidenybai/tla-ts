import { TlaEvaluationError, TlaSyntaxError } from "../errors";
import { EXIT_STATUS, setExitCode } from "../exit-codes";
import { parseModule } from "../parser";
import { generateSanySpecification } from "../sany/generator";
import { checkModuleLevels } from "../sany/levels";
import type { ModuleNode, OpDefNode, SymbolNode } from "../sany/nodes";
import type { TlcVersion } from "../tlc/version";
import type { RuntimeInvariantTemplate } from "./tlc-arguments";

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

const checkDebuggerExpression = (
  source: string,
  moduleName: string,
  name: string,
  expression: string,
  loadModule: (name: string) => string | undefined,
  version: TlcVersion,
) => {
  const createFailure = (message: string) =>
    createParsingFailure(
      `Unknown location\n\n${message} while parsing breakpoint expression "${expression}"`,
    );
  try {
    parseModule(source);
  } catch (error) {
    if (!(error instanceof TlaSyntaxError)) throw error;
    throw createParsingFailure(`Syntax error while parsing breakpoint expression "${expression}"`);
  }
  let isSemanticCorrect = false;
  let isLevelCorrect = false;
  const specification = (() => {
    try {
      return generateSanySpecification(source, loadModule, {
        version,
        onModule: (module, messages) => {
          const isCorrect = () => messages.every((message) => message.isWarning);
          if (!isCorrect()) return;
          const isLevelChecked = checkModuleLevels(module, {
            messages,
            isTlc174: version === "1.7.4",
          });
          if (module.name !== moduleName) return;
          isSemanticCorrect = true;
          isLevelCorrect = isLevelChecked && isCorrect();
        },
      });
    } catch (error) {
      if (!(error instanceof TlaSyntaxError)) throw error;
      throw createFailure("Semantic error");
    }
  })();
  if (!isSemanticCorrect) throw createFailure("Semantic error");
  if (!isLevelCorrect) throw createFailure("Level-checking error");
  const level = findDefinition(specification.root, name)?.level ?? CONSTANT_LEVEL;
  if (level === TEMPORAL_LEVEL) {
    throw createParsingFailure(
      `Unknown location\n\nDebug expressions must be action-level or below; actual level: ${level} (Temporal)`,
    );
  }
};

export const getRuntimeInvariants = (
  source: string,
  root: ModuleNode,
  invariants: RuntimeInvariantTemplate[],
  loadModule: (name: string) => string | undefined,
  version: TlcVersion,
) => {
  const loadDependency = (name: string) => (name === root.name ? source : loadModule(name));
  // Deviation from TLC: TLC reads the clock for each name, which no fixed output can match; one reading plus an index keeps the names apart.
  const stamp = Date.now();
  return invariants.map((invariant, index) => {
    if (findDefinition(root, invariant.expression)) {
      return { name: invariant.expression, module: undefined, source: undefined };
    }
    const module = `__DebuggerModule__${stamp + index}`;
    const name = `__DebuggerExpr__${stamp + index}`;
    const text = `---- MODULE ${module} ----\nEXTENDS ${root.name}\n\n${name} == ${invariant.expression}\n====`;
    checkDebuggerExpression(text, module, name, invariant.expression, loadDependency, version);
    return { name, module, source: text };
  });
};
