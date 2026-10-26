---------------------------- MODULE SymbolsInner ----------------------------
EXTENDS Integers

CONSTANT Op(_, _), Neg(_)

Twice(F(_, _), a) == F(a, a)

Applied == Op(2, 3)

Passed == Twice(Op, 4)

Negated == Neg(5)

PassedNeg == LET G(H(_)) == H(1) IN G(Neg)

=============================================================================
