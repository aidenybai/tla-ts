---- MODULE LetFunctionWays ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Paths(n) == LET P[m \in 0..3] == \/ m = 0
                                 \/ \E k \in 0..(m - 1) : P[k] /\ (k < x \/ k = 0)
            IN P[n]
Next == \/ \E n \in 0..3 : /\ Paths(n)
                           /\ x' = (x + n) % 4
                           /\ y' = (y + 1) % 3
        \/ /\ \A n \in {x, 2} : Paths(n)
           /\ x' = x
           /\ y' = (y + 2) % 3
====
