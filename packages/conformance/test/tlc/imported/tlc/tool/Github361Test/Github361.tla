(*---
description: Ported from TLC's Github361Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github361Test.java
features:
  - tlc-regression
outcome: success
config: |-
  INIT
  Init
  NEXT
  Next
args:
  - -deadlock
---*)
---- MODULE Github361 ----
EXTENDS TLC, Naturals

Nodes == {1, 2, 3, 4, 5}
null == 6 \* not in Nodes

Vertices == [nodes : SUBSET Nodes, succ : Nodes \cup {null}, dead : BOOLEAN]

Partitions == {P \in SUBSET Vertices :
                 /\ \A v1, v2 \in P : 
                       (v1 # v2) => ((v1.nodes \cap v2.nodes) = {})
                 /\ \A v \in P : /\ v.nodes # {}
                                 /\ \E w \in P : \/ v.succ = null
                                                 \/ v.succ \in w.nodes}     

VARIABLES partition

TypeOK == partition \in Partitions

Init == partition = {}

Next == UNCHANGED partition

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
