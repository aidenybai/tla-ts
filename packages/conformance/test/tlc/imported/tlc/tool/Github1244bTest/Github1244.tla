(*---
description: Ported from TLC's Github1244bTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1244bTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION SpecNext
args:
  - -deadlock
---*)
---------------------------- MODULE Github1244 ----------------------------
VARIABLE x
vars == <<x>>
Init == x = FALSE
Next == x' = ~x

MyInit(myInit) == myInit                       \* state-level
Spec ==
  /\ MyInit(Init)
  /\ [][Next]_vars

MyAction(myAction) == myAction                 \* action-level
SpecAction ==
  /\ Init
  /\ [][MyAction(Next)]_vars

MyNext(myNext) == myNext                       \* temporal-level
SpecNext ==
  /\ Init
  /\ MyNext([][Next]_vars)
===========================================================================

---------------------------- CONFIG Github1244 ----------------------------
SPECIFICATION Spec
===========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
