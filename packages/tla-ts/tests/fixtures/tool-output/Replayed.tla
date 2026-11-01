---- MODULE Replayed ----
EXTENDS Naturals, Sequences
VARIABLES x
Init == x \in {0, 1, 2}
Next == x' = IF x = 1 THEN Head(<<>>) ELSE x
Spec == Init /\ [][Next]_x
Live == [](ENABLED Next => <>TRUE)
Small == x # 1
====
