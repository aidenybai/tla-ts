(*---
description: Ported from TLC's PossibleTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/PossibleTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  _POSSIBLE AllDone AtOne WrapAround
  POSTCONDITION PossibleCounts
args:
  - -deadlock
---*)
---- MODULE PossibleTest ----
EXTENDS Naturals, TLC
VARIABLE x

Init == x = 0

Next == x' = (x + 1) % 3

AllDone == x = 2

AtOne == x = 1

WrapAround == x = 2 /\ x' = 0

Spec == Init /\ [][Next]_x

PossibleCounts ==
    LET p == TLCGet("all:named")["s:_possible"][1]
    IN /\ p["AllDone"] = 1
       /\ p["AtOne"] = 1
       /\ p["WrapAround"] = 1
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
