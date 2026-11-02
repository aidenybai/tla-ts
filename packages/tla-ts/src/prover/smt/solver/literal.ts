// Ported from Z3 (src/smt/smt_literal.h, src/smt/smt_types.h), MIT license, see z3-license.txt.
// A Boolean variable numbers an atom. A literal is a variable or its negation, encoded as twice the
// variable plus one when negated, so a literal indexes per-literal arrays directly.
declare const boolVarBrand: unique symbol;
declare const literalBrand: unique symbol;

export type BoolVar = number & { readonly [boolVarBrand]: true };
export type Literal = number & { readonly [literalBrand]: true };

// The variable of true. Its positive literal is true and its negative literal false.
export const TRUE_BOOL_VAR = 0 as BoolVar;
export const TRUE_LITERAL = 0 as Literal;
export const FALSE_LITERAL = 1 as Literal;

export const toBoolVar = (index: number) => index as BoolVar;

export const mkLiteral = (boolVar: BoolVar, isNegated = false) =>
  (boolVar * 2 + (isNegated ? 1 : 0)) as Literal;

export const negate = (literal: Literal) => (literal ^ 1) as Literal;

export const getVar = (literal: Literal) => (literal >> 1) as BoolVar;

export const isNegated = (literal: Literal) => (literal & 1) === 1;
