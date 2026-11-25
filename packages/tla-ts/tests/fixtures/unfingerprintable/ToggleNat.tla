---- MODULE ToggleNat ----
EXTENDS Naturals
VARIABLE x, y, z
Init == x = 0 /\ y = 0 /\ z = 0
Next == (x < 3 /\ x' = x + 1 /\ y' = (IF x = 1 THEN Nat ELSE 0) /\ UNCHANGED z) \/ (x = 2 /\ z' = 1 - z /\ UNCHANGED <<x, y>>) \/ UNCHANGED <<x, y, z>>
Inv == x < 3
Vx == x
Vxy == <<x, y>>
====
