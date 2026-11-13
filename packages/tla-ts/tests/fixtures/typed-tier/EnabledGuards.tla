---- MODULE EnabledGuards ----
EXTENDS Naturals
VARIABLES x, y
Inc == x < 3 /\ x' = x + 1 /\ UNCHANGED y
Swap == x > y /\ x' = y /\ y' = x
Init == x = 0 /\ y = 0
Next ==
  \/ Inc
  \/ /\ ~ENABLED Inc
     /\ y < 2
     /\ x' = 0
     /\ y' = y + 1
  \/ /\ ENABLED Swap
     /\ y = 1
     /\ x' = x
     /\ y' = 2
Resettable == x = 3 => ENABLED (x' = 0 /\ y' = y)
Always == []Resettable
====
