---- MODULE RandomModelValue ----
EXTENDS Naturals, TLC
CONSTANT Proc
VARIABLES zeta, owner
Init == zeta = 0 /\ owner = CHOOSE p \in Proc : TRUE
Next == zeta < 6 /\ zeta' = zeta + 1 /\ owner' = RandomElement(Proc)
Inv == zeta < 6
====
