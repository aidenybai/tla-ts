---- MODULE EventualAction ----
EXTENDS TLC
CONSTANTS a, b
VARIABLE x
Init == x = a
Next == x' = b
Spec == Init /\ [][Next]_x
Prop == <><<Next>>_x
Sym == Permutations({a, b})
====
