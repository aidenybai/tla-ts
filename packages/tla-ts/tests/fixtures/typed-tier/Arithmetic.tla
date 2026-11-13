---- MODULE Arithmetic ----
EXTENDS Naturals, FiniteSets
VARIABLES x, s
Init == x = 1 /\ s = {}
Next == \/ /\ x' = (x * 7 + 3) % 11
           /\ s' = {n \in 0..x : n % 3 = 0}
        \/ /\ \E k \in 1..x : x' = (x + k) \div 2
           /\ s' = {n \div 2 : n \in s}
====
