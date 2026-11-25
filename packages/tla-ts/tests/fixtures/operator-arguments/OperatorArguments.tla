---- MODULE OperatorArguments ----
EXTENDS Naturals, TLC
VARIABLE x
Step(F(_)) == x < 3 /\ x' = F(x)
Inc(y) == y + 1
Init == x = 0
Next == Step(Inc) \/ Step(LAMBDA y : y + 2) \/ Step(LAMBDA y : y + x - x + 1)
Inv == x < 3
Alias == [x |-> x, action |-> TLCGet("action"), counts |-> TLCGet("stats").behavior.actions]
====
