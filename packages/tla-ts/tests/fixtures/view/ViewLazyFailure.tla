---- MODULE ViewLazyFailure ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = {}
Next == /\ x' = (x + 1) % 2
        /\ y' = IF x = 1 THEN {{1}, {"a"}, [i \in {1} |-> {1, "a"}]} ELSE {}
Spec == Init /\ [][Next]_<<x, y>>
V == x
====
