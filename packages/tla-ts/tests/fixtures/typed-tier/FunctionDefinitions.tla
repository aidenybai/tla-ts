---- MODULE FunctionDefinitions ----
EXTENDS Naturals, Sequences
CONSTANTS Nodes
VARIABLES link, up, order
Reachable[n \in Nodes] == up[n] /\ \E m \in Nodes : link[n, m]
OneWay(a, b) == /\ up[a] /\ up[b] /\ link[a, b]
Connected(a, b) == OneWay(a, b) /\ OneWay(b, a)
Init ==
  /\ link = [pair \in Nodes \X Nodes |-> FALSE]
  /\ up = [n \in Nodes |-> TRUE]
  /\ order = << >>
Next ==
  \/ \E a, b \in Nodes :
       /\ a # b
       /\ ~link[a, b]
       /\ link' = [link EXCEPT ![a, b] = TRUE]
       /\ UNCHANGED <<up, order>>
  \/ \E n \in Nodes :
       /\ Reachable[n]
       /\ up' = [up EXCEPT ![n] = FALSE]
       /\ UNCHANGED <<link, order>>
  \/ \E a, b \in Nodes :
       /\ Connected(a, b)
       /\ \A n \in Nodes : Reachable[n] \/ ~up[n]
       /\ order' = IF Reachable[a] THEN <<a, b>> ELSE << >>
       /\ UNCHANGED <<link, up>>
====
