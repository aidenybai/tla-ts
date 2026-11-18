---- MODULE AliasSteps ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 3 /\ x' = x + 1 /\ PrintT(<<"step", x>>)
Small == x < 2
Alias == [x |-> x, p |-> PrintT(<<"alias", x>>)]
====
