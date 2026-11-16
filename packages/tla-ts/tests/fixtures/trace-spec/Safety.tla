---- MODULE Safety ----
EXTENDS Naturals
CONSTANT N, P
VARIABLE x, y, zeta
Init == x = 0 /\ y = "a" /\ zeta = [p \in P |-> {}]
Next == x' = (x + 1) % N /\ y' = y /\ zeta' = [zeta EXCEPT ![CHOOSE p \in P : TRUE] = @ \cup {x}]
Inv == x < 2
====
