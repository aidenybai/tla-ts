---- MODULE RandomOperator ----
EXTENDS Naturals, TLC
VARIABLES zeta, alpha
Pick(S) == RandomElement(S)
Init == zeta = 0 /\ alpha = 0
Next == zeta < 6 /\ zeta' = zeta + 1 /\ alpha' = Pick(1..100)
Inv == zeta < 6
====
