import { TlaUnsupportedError } from "../../errors";
import { consSubstitution, shift, substituteExpr, type Expr } from "../../obligation-expression";

// Elab.let_normalize: each LET definition is substituted into the rest.
export const expandLet = (expression: Extract<Expr, { kind: "Let" }>): Expr => {
  const [definition, ...rest] = expression.definitions;
  if (!definition) return expression.body;
  if (definition.kind !== "Operator")
    throw new TlaUnsupportedError(`a LET ${definition.kind} definition`);
  const remaining: Expr =
    rest.length === 0 ? expression.body : { ...expression, definitions: rest };
  return substituteExpr(consSubstitution(definition.body, shift(0)), remaining);
};
