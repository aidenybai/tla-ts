---- MODULE InitialComparers ----
EXTENDS Naturals
VARIABLES x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
StartsPaired == {<<x, x>>, <<x, 1>>} = {<<0, 1>>, <<0, 0>>}
Property == StartsPaired /\ [][x' # x]_x
====
