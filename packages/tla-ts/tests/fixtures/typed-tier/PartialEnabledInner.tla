---- MODULE PartialEnabledInner ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Step == x < 2 /\ x' = x + 1
Spec == Init /\ [][Step]_x /\ WF_x(Step)
====
