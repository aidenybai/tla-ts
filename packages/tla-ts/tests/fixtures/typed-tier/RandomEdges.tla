---- MODULE RandomEdges ----
EXTENDS Integers, TLC

Nodes == 1..6

Edges == UNION {{{n, m} : m \in RandomElement(SUBSET (Nodes \ {n}))} : n \in Nodes}

VARIABLES reached, hops

Init == reached = {1} /\ hops = [n \in Nodes |-> IF n = 1 THEN 0 ELSE 6]

Next == \E e \in Edges, n \in Nodes, m \in Nodes :
          /\ e = {n, m}
          /\ n \in reached
          /\ hops[n] + 1 < hops[m]
          /\ reached' = reached \cup {m}
          /\ hops' = [hops EXCEPT ![m] = hops[n] + 1]

TypeOK == reached \subseteq Nodes
====
