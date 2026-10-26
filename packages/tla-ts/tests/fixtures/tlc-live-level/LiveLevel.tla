---- MODULE LiveLevel ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 1}
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x /\ WF_x(Next)
ReachesThree == <>(TLCGet("level") = 3)
ReachesFour == <>(TLCGet("level") = 4)
StepsUp == []<><<TLCGet("level")' = TLCGet("level") + 1>>_x
LevelsAtMostTwo == [](TLCGet("level") <= 2)
====
