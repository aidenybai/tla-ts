// What backend/zenon.ml and backend/isabelle.ml share in printing an obligation that Backend.Prep
// has shipped.

import { TlapmBugError, TlaProverError, TlaUnsupportedError } from "../errors";
import { popNames, type Context } from "../obligations/ctx";
import { shiftExpr } from "../obligations/substitution";
import { type Bound, type Builtin, type Expr } from "../obligations/expression";

// The temporal operators neither backend has a counterpart for, by the name tlapm reports.
const TEMPORAL_OPERATORS: Partial<Record<Builtin, [string, number]>> = {
  Leadsto: ["Leadsto", 2],
  ENABLED: ["ENABLED", 1],
  Cdot: ["\\cdot", 2],
  Actplus: ["-+->", 2],
  BoxTrue: ["[]", 1],
  BoxFalse: ["[]", 1],
  Diamond: ["<>", 1],
};

// Why a backend can't print an application of builtin, which it reports as where.
export const getUnprintableError = (builtin: Builtin, arity: number, where: string) => {
  const isFrontend = builtin === "Prime" || builtin === "StrongPrime" || builtin === "UNCHANGED";
  if (isFrontend && arity === 1) return new TlapmBugError();
  const temporal = TEMPORAL_OPERATORS[builtin];
  return temporal && temporal[1] === arity
    ? new TlaProverError(`Unsupported operator \`${temporal[0]}\`.\n`)
    : new TlaProverError(where);
};

interface SplitQuantifier {
  first: Bound;
  inner: Expr;
}

// A quantifier's first bound binds around a quantifier over the others, which move under it. A
// ditto after the first bound copies its domain.
export const splitFirstBound = (
  quantifier: "Forall" | "Exists",
  bounds: Bound[],
  body: Expr,
): SplitQuantifier => {
  const first = bounds[0];
  const rest = bounds.slice(1);
  const undittoed =
    rest[0]?.domain.kind === "Ditto"
      ? [{ ...rest[0], domain: first.domain }, ...rest.slice(1)]
      : rest;
  if (undittoed.length === 0) return { first, inner: body };
  return {
    first,
    inner: {
      kind: "Quant",
      quantifier,
      bounds: undittoed.map((other) =>
        other.domain.kind === "Domain"
          ? {
              ...other,
              domain: { kind: "Domain", expression: shiftExpr(1, other.domain.expression) },
            }
          : other,
      ),
      body,
      location: body.location,
    },
  };
};

// tlapm prints a fact to a formatter that drops its output first, to omit an unsupported one: the
// fact's print, or the error that omits it once the names it bound are out of scope.
export const printFact = <Printed>(context: Context, print: () => Printed) => {
  const depth = context.stack.length;
  try {
    return print();
  } catch (error) {
    if (!(error instanceof TlaUnsupportedError)) throw error;
    popNames(context, context.stack.length - depth);
    return error;
  }
};
