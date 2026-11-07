---- MODULE AsymmetricConstraint ----
EXTENDS Naturals, TLC
CONSTANTS A, B
VARIABLES owner, step
Init == owner \in {A, B} /\ step = 0
Next == /\ step < 4
        /\ step' = step + 1
        /\ owner' \in {A, B}
Spec == Init /\ [][Next]_<<owner, step>>
\* Holds of one state in an orbit and not of the other, so a state outside the model has the
\* representative of a state inside it.
Bound == ~(owner = A /\ step = 2)
Perms == Permutations({A, B})
====
