---- MODULE InfiniteDifference ----
EXTENDS Integers
VARIABLE x
Init == x \in 0..2
Next == /\ x - 1 \in Nat \ {2}
        /\ x' \in {x - 1, x + 2}
        /\ x' \in Int \ {-1, 6}
TypeOK == x \in Nat \ {6} /\ x \notin Int \ (0..5)
====
