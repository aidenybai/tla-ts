---- MODULE StateNat ----
EXTENDS Naturals
VARIABLE x, y
Init == x = 0 /\ y = 0
Next == x < 3 /\ x' = x + 1 /\ y' = IF x = 1 THEN Nat ELSE 0
Inv == x < 3
====
