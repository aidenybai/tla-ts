---- MODULE RandomLet ----
EXTENDS Integers, TLC
VARIABLES zeta, alpha
Init == zeta = 0 /\ alpha = 0
Next == /\ zeta < 6
        /\ zeta' = zeta + 1
        /\ LET r == RandomElement(1..100) IN alpha' = r + r - r
Inv == zeta < 6
====
