--------------------------- MODULE Subexpressions ---------------------------
EXTENDS Naturals

VARIABLE x

Max == 3

Step(n) == /\ guard :: x < n
           /\ x' = x + 1

Pair(a, b) == {y \in a..b : keep(y) :: y % 2 = 0}

Shift(n) == \A i \in 1..n : bound(i) :: LET inc(k) == k + i IN inc(n) > 0

Apply(Op(_, _, _), a, b, c) == Op(a, b, c)

Choice(a) == CASE a = 0 -> "zero" [] a = 1 -> "one" [] OTHER -> "many"

THEOREM Positive == lab :: Max > 0

A == INSTANCE Arithmetic WITH Offset <- 1

ASSUME Pair(1, 4)!1 = 1..4
ASSUME Pair(1, 4)!(2) = TRUE
ASSUME Pair(1, 4)!keep(3) = FALSE
ASSUME Apply(Pair!@, 1, 4, 6) = TRUE
ASSUME Shift(2)!(1)!inc(5) = 6
ASSUME Shift(2)!bound(2)!:!inc(5) = 7
ASSUME Choice(1)!2!2 = "one"
ASSUME Choice(1)!3!2 = "many"
ASSUME Positive!lab
ASSUME Positive!<< = 3
ASSUME A!Double(4)!sum = 9
ASSUME A!Double(4)!1 = 8
ASSUME A!Double(4)!1!<< = 4
ASSUME A!Ranges(4)!even(3) = FALSE

Init == x = 0

Next == \/ Step(Max)
        \/ ~Step(Max)!guard /\ x' = 0

Spec == Init /\ [][Next]_x

Inv == Step(Max)!1 \/ x = Max

Broken == Step(Max)!guard
=============================================================================
