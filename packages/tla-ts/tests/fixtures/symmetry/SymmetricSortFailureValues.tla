---- MODULE SymmetricSortFailureValues ----
EXTENDS TLC

CONSTANTS m1, m2, m3, m4, Typed

VARIABLES x, y, typed

Entry(key, value) == [key |-> key, value |-> value]

Init ==
  /\ x = m4
  /\ y = { {Entry(m1, 1), Entry(m2, "a")}, {Entry(m1, 2), Entry(m2, 7)} }
  /\ typed = Typed

Next == UNCHANGED <<x, y, typed>>

\* A typed model value leaves the state to the comparison of its values.
Swapping == (m1 :> m2) @@ (m2 :> m1) @@ (m3 :> m4) @@ (m4 :> m3)
Keeping == (m1 :> m3) @@ (m2 :> m4) @@ (m3 :> m2) @@ (m4 :> m1)
Symmetry == {Swapping, Keeping}
====
