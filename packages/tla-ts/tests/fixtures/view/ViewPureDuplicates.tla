---- MODULE ViewPureDuplicates ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = {}
Next == \/ x' = (x + 1) % 3 /\ y' = y
        \/ x' = x /\ y' = IF x = 1 THEN y \union {x} ELSE y
Spec == Init /\ [][Next]_<<x, y>>
Inv == x < 3
V == <<x>>
====
