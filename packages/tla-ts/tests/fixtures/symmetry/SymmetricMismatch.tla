---- MODULE SymmetricMismatch ----
EXTENDS Naturals, TLC
CONSTANT Proc
VARIABLE x
Init == x = [p \in Proc |-> IF p = CHOOSE q \in Proc : TRUE THEN "a" ELSE 1]
Next == UNCHANGED x
Spec == Init /\ [][Next]_x
Symmetric == Permutations(Proc)
====
