---- MODULE RepeatedActions ----
CONSTANTS Nodes
VARIABLES up, link
OneWay(a, b) == up[a] /\ up[b] /\ link[a][b]
Connected(a, b) == OneWay(a, b) /\ OneWay(b, a)
Init ==
  /\ up = [n \in Nodes |-> TRUE]
  /\ link = [a \in Nodes |-> [b \in Nodes |-> FALSE]]
Next ==
  \/ \E a, b \in Nodes :
       /\ a # b
       /\ ~link[a][b]
       /\ link' = [link EXCEPT ![a][b] = TRUE]
       /\ UNCHANGED up
  \/ \E a, b \in Nodes :
       /\ Connected(a, b)
       /\ up' = [up EXCEPT ![a] = FALSE]
       /\ UNCHANGED link
====
