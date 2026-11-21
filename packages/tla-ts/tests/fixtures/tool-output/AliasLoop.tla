---- MODULE AliasLoop ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == (IF x < 3 THEN x' = x + 1 ELSE x' = 2) /\ PrintT(<<"step", x>>)
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Live == <>(x = 5)
Alias == [x |-> x, p |-> PrintT(<<"alias", x>>)]
====
