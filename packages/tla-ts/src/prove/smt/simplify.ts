// The rewrites of encode/n_rewrite.ml that run on the sequent before Type.Synthesize.

import { applyBuiltin, at, mapChildren, type Expr } from "../../obligations/expression";
import { compareStrings } from "../ocaml";

type RecordExpr = Extract<Expr, { kind: "Record" }>;

const isSameFieldSet = (left: RecordExpr, right: RecordExpr) =>
  left.fields.length === right.fields.length &&
  left.fields.every((field) => right.fields.some((other) => other.name === field.name)) &&
  right.fields.every((field) => left.fields.some((other) => other.name === field.name));

// mk_conj: e1 /\ (e2 /\ ...).
const conjoinRight = (items: Expr[]): Expr =>
  items.length === 1
    ? items[0]
    : applyBuiltin("Conj", [items[0], conjoinRight(items.slice(1))], items[0]);

const decompose = (left: Expr, right: Expr, from: Expr): Expr => {
  if (left.kind !== "Record" || right.kind !== "Record" || !isSameFieldSet(left, right))
    return applyBuiltin("Eq", [left, right], from);
  return conjoinRight(
    left.fields.map((field) =>
      decompose(
        field.value,
        right.fields.find((other) => other.name === field.name)?.value ?? field.value,
        from,
      ),
    ),
  );
};

// simpl_receq: an equality of two record constructors with the same fields is the conjunction of
// the equalities of their fields, paired by name.
export const simplifyRecordEqualities = (expression: Expr): Expr => {
  const inner = mapChildren(expression, simplifyRecordEqualities);
  const isRecordEquality =
    inner.kind === "Apply" &&
    inner.operator.kind === "Internal" &&
    inner.operator.builtin === "Eq" &&
    inner.args.length === 2 &&
    inner.args[0].kind === "Record" &&
    inner.args[1].kind === "Record";
  return isRecordEquality && inner.kind === "Apply"
    ? at(decompose(inner.args[0], inner.args[1], inner), inner)
    : inner;
};

// sort_recfields: a record's or a record set's fields in order. Like tlapm, it doesn't visit the
// field values, so a record inside a record keeps the order it's written in.
export const sortRecordFields = (expression: Expr): Expr =>
  expression.kind === "Record" || expression.kind === "Rect"
    ? {
        ...expression,
        fields: expression.fields.toSorted((left, right) => compareStrings(left.name, right.name)),
      }
    : mapChildren(expression, sortRecordFields);
