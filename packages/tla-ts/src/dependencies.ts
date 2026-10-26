import type { Definition, Expression } from "./ast";
import { getChildren, IMPURE_BUILTINS, type Environment } from "./evaluate";

const STATE_INDEPENDENT_KINDS = new Set([
  "Prime",
  "Unchanged",
  "Enabled",
  "Always",
  "Eventually",
  "BoxAction",
  "AngleAction",
  "WeakFairness",
  "StrongFairness",
]);

const getReferencedName = (expression: Expression) => {
  if (expression.kind === "Identifier") return expression.name;
  if (expression.kind === "Apply" || expression.kind === "OperatorReference")
    return expression.operator;
  return undefined;
};

export const getReadVariables = (
  expression: Expression,
  environment: Environment,
): number[] | undefined => {
  const variables = new Set<number>();
  const visited = new Set<Definition>();
  const visit = (node: Expression): boolean => {
    if (STATE_INDEPENDENT_KINDS.has(node.kind)) return false;
    const name = getReferencedName(node);
    if (name !== undefined && !environment.constants.has(name)) {
      const target = environment.substitutions.get(name) ?? name;
      const definition = environment.definitions.get(target);
      if (!definition && IMPURE_BUILTINS.has(target) && environment.builtins.has(target))
        return false;
      const variableIndex = environment.variableIndex.get(name);
      if (variableIndex !== undefined) variables.add(variableIndex);
      if (definition && !visited.has(definition)) {
        visited.add(definition);
        const isPure =
          visit(definition.body) &&
          (definition.kind === "Operator" || definition.bounds.every((bound) => visit(bound.set)));
        if (!isPure) return false;
      }
    }
    return getChildren(node).every(visit);
  };
  return visit(expression) ? [...variables] : undefined;
};
