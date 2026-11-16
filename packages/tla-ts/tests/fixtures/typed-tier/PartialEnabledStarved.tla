---- MODULE PartialEnabledStarved ----
EXTENDS Naturals
VARIABLES x, y
Inner == INSTANCE PartialEnabledInner
Init == x = 0 /\ y = 0
Next == \/ x < 2 /\ x' = x + 1 /\ y' = y
        \/ y < 1 /\ y' = y + 1 /\ UNCHANGED x
Spec == Init /\ [][Next]_<<x, y>>
Refines == Inner!Spec
CanStep == x < 2 => ENABLED (x' = x + 1)
====
