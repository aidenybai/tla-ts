---- MODULE UserFile ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT(<<"init", x>>)
Next == x < 2 /\ x' = x + 1 /\ Print(<<"next", x>>, TRUE)
Inv == x < 2
====
