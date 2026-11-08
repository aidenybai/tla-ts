---- MODULE MixedValues ----
EXTENDS Naturals
CONSTANTS M
VARIABLES x, count
Init == x = 0 /\ count = [v \in M |-> 0]
Next ==
  \E v \in {0, 1} \cup M :
    /\ v # x
    /\ x' = v
    /\ count' = IF v \in M THEN [count EXCEPT ![v] = (@ + 1) % 3] ELSE count
====
