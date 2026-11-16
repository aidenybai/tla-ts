---- MODULE LiveFail ----
EXTENDS Naturals, TLC
VARIABLE x

Init == x = 0
Next == x < 3 /\ PrintT(<<"level", TLCGet("level"), x>>) /\ x' = x + 1
Spec == Init /\ [][Next]_x /\ WF_x(Next)

Bad == IF x = 2 THEN x = "a" ELSE TRUE
Prop == <>[](Bad)
====
