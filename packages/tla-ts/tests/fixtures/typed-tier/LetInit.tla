---- MODULE LetInit ----
EXTENDS Naturals
CONSTANT N
VARIABLES x, y
Init ==
  LET start(k) == k * 2
      low == 1
  IN /\ x \in {start(k) : k \in low..N}
     /\ y = start(low)
Next ==
  \/ x < 10 /\ x' = x + 1 /\ y' = y
  \/ y < 6 /\ y' = y + (x % 3) + 1 /\ x' = x
Spec == Init /\ [][Next]_<<x, y>>
====
