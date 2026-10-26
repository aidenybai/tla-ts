-------------------------- MODULE SymmetricLiveness --------------------------
EXTENDS TLC

CONSTANTS m1, m2

S == {m1, m2}

VARIABLE x

Init == x \in S

Next == x' \in S

Spec == Init /\ [][Next]_x /\ WF_x(Next)

Live == \A i \in S : []<>(x = i)

Symmetry == Permutations(S)
=============================================================================
