---- MODULE SymmetricSortFailure ----
EXTENDS TLC

CONSTANTS m1, m2, m3, m4

VARIABLES x, y

Entry(key, value) == [key |-> key, value |-> value]

Init ==
  /\ x = m4
  /\ y = { {Entry(m1, 1), Entry(m2, "a")}, {Entry(m1, 2), Entry(m2, 7)} }

Next == UNCHANGED <<x, y>>

\* The first permutation gives a smaller x than the state. Sorting its image of y would compare "a"
\* with 7, but the second gives a smaller x still, so TLC never sorts it.
Swapping == (m1 :> m2) @@ (m2 :> m1) @@ (m3 :> m4) @@ (m4 :> m3)
Keeping == (m1 :> m3) @@ (m2 :> m4) @@ (m3 :> m2) @@ (m4 :> m1)
Symmetry == {Swapping, Keeping}
====
