---- MODULE OperatorRecord ----
EXTENDS Naturals, TLC
VARIABLE x, y
HasOp == "context" \in DOMAIN TLCGet("action")
Step(F(_)) == x < 3 /\ x' = F(x) /\ y' = [context |-> IF HasOp THEN TLCGet("action").context ELSE 0]
Inc(n) == n + 1
Init == x = 0 /\ y = [context |-> 0]
Next == Step(Inc)
====
