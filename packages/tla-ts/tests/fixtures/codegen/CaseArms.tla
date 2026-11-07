---- MODULE CaseArms ----
EXTENDS Naturals

VARIABLE x

Classify(n) == CASE n = 0 -> "zero"
                 [] n = 1 -> "one"
                 [] OTHER -> "many"

Sizes == {CASE k < 2 -> k + 10 [] k >= 2 -> k + 20 : k \in 0..3}

Init == x = 0

Next == /\ x < 3
        /\ \E k \in 1..2 : x' = CASE k = 1 -> x + 1 [] k = 2 -> x + 2 [] OTHER -> 0

Inv == /\ Classify(0) = "zero"
       /\ Classify(1) = "one"
       /\ Classify(7) = "many"
       /\ Sizes = {10, 11, 22, 23}
       /\ \A k \in 0..2 : (CASE k = 0 -> TRUE [] k > 0 -> k > 0)
====
