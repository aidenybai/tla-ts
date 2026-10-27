---------------------------- MODULE BindersInner ----------------------------
EXTENDS Naturals

CONSTANT c, Combine(_, _)

VARIABLE x

Near == \E y \in 0..5 : y = x + c

Combined == \E i \in 0..3 : Combine(i, x) = c + 3

Named == \E Lambda \in 0..3 : Combine(Lambda, x) = c + 3
=============================================================================
