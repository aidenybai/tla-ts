(*---
description: Ported from TLC's SubsetEqTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/SubsetEqTest.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -deadlock
---*)
------------------------------ MODULE SubsetEq ------------------------------
EXTENDS Integers, FiniteSets

VARIABLE b

Init == b = TRUE

Next == b' = /\ (SUBSET (1..23) \subseteq SUBSET (1..42))
             /\ ~(SUBSET (1..42) \subseteq SUBSET (1..23))
             /\ ~(SUBSET (1..42) \subseteq SUBSET (2..42))
             /\ (SUBSET (2..42) \subseteq SUBSET (1..42))
             /\ (SUBSET {1,2,3} \subseteq SUBSET {1,2,3,4})
             /\ (SUBSET {} \subseteq SUBSET {})
             /\ (SUBSET {} \subseteq SUBSET {1})
             /\ ~(SUBSET {1} \subseteq SUBSET {})
             /\ (SUBSET {1} \subseteq SUBSET Int)
             /\ (SUBSET {1} \subseteq SUBSET Nat)

Spec == Init /\ [][Next]_<<b>>

Inv == b = TRUE /\ b \in BOOLEAN
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
