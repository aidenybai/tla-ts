---- MODULE LiveComparers ----
EXTENDS Naturals
VARIABLES x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Paired == []<>({<<x, x>>, <<x, 1>>} = {<<2, 1>>, <<2, 2>>})
====
