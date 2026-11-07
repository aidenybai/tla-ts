(*---
description: Ported from TLC's PossibleCountsTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/PossibleCountsTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  _POSSIBLE AtOne WrapAround
  POSTCONDITION CountsPostCondition
args:
  - -deadlock
---*)
---- MODULE PossibleCountsTest ----
EXTENDS Naturals, _Possible
VARIABLE x

Init == x = 0

Next == x' = (x + 1) % 3

AtOne == x = 1

WrapAround == x = 2 /\ x' = 0

Spec == Init /\ [][Next]_x

Count(name) == IF name \in DOMAIN _Counts THEN _Counts[name] ELSE 0

\* This postcondition mentions no variable, so _Counts alone determines its
\* level.  TLC rejects a constant postcondition, and it folds a constant
\* definition away at startup, when the counts are still empty.  Both make this
\* postcondition a regression test for the level that the _Counts override
\* declares.
CountsPostCondition ==
    /\ DOMAIN _Counts = {"AtOne", "WrapAround"}
    /\ Count("AtOne") = 1
    /\ Count("WrapAround") = 1
    /\ Count("NotAPossibilityCondition") = 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
