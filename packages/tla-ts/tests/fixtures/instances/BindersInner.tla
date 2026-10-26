---------------------------- MODULE BindersInner ----------------------------
EXTENDS Naturals

CONSTANT c, Combine(_, _)

VARIABLE x

Shift == x + c

Has(S) == \E i \in S : x + c = i

AllAbove(S) == \A i \in S : Shift > i

Add(i) == x + c + i

Local == LET i == 10 IN x + c + i

Picked == CHOOSE i \in 0..20 : i = x + c

Matching == {i \in 0..20 : i >= x + c}

Doubled == {i * 2 : i \in 0..c}

Table == [i \in 0..2 |-> i + c]

f[i \in 0..3] == IF i = 0 THEN c ELSE f[i - 1] + 1

Mapped(F(_)) == F(c)

UsesLambda == Mapped(LAMBDA i : i + x)

Combined == \E i \in 0..3 : Combine(i, x) = c + 3

Labeled == \E i \in 0..20 : lab(i) :: i = Shift

Near == \E y \in 0..5 : y = x + c

Plus(y) == x + y

Offset[y \in 0..2] == x + y

Scaled == {Combine(w, 1) : w \in 0..2}

Named == \E Lambda \in 0..3 : Combine(Lambda, x) = c + 3
=============================================================================
