---- MODULE Loop ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT(<<"init", x>>)
Up == x < 2 /\ PrintT(<<"up", x>>) /\ x' = x + 1
Reset == x = 2 /\ PrintT(<<"reset", x>>) /\ x' = 0
Next == Up \/ Reset
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Live == <>(x = 5)
====
