---- MODULE Unbounded ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Returns == []<>(x = 0)
Always == 1 + 1 = 2
====
