---- MODULE ImpliesBranches ----
EXTENDS Naturals
VARIABLE now
Init == now = 0
Next == /\ now < 3
        /\ now' = now + 1
        /\ now > 0 => (TRUE \/ now' > 0)
====
