---- MODULE SparseBags ----
EXTENDS Naturals, Bags
VARIABLE network
Nodes == 0..2
Add(bag, x) ==
  IF x \in DOMAIN bag
  THEN [bag EXCEPT ![x] = @ + 1]
  ELSE [e \in DOMAIN bag \cup {x} |-> IF e = x THEN 1 ELSE bag[e]]
Remove(bag, x) ==
  IF bag[x] = 1 THEN [e \in DOMAIN bag \ {x} |-> bag[e]] ELSE [bag EXCEPT ![x] = @ - 1]
Init ==
  network = [n \in Nodes |-> IF n = 0 THEN SetToBag({[kind |-> "tok", q |-> 0]}) ELSE EmptyBag]
Next ==
  \E from, to \in Nodes : \E m \in DOMAIN network[from] :
    /\ from # to
    /\ m.q < 3
    /\ network' = [network EXCEPT
         ![from] = Remove(@, m),
         ![to] = Add(@, [m EXCEPT !.q = @ + 1])]
====
