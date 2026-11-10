(*---
description: Ported from TLC's SubseteqNextStateTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/SubseteqNextStateTest.java
features:
  - tlc-regression
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANTS TypeOK Inv
  _POSSIBLE FullSet GainThree
  POSTCONDITION PossibleCounts
args:
  - -deadlock
---*)
---- MODULE SubseteqNextState ----
EXTENDS TLC
VARIABLES x, y
TypeOK == x \subseteq {1, 2, 3}
Inv ==
  /\ ENABLED (x' \subseteq {1})
  /\ y = {1, 2, 3}
Init ==
  /\ x \subseteq {1, 2}
  /\ y = {1, 2, 3}
Next ==
  /\ UNCHANGED y
  /\ x' \subseteq y'

FullSet == x = {1, 2, 3}

GainThree == 3 \in x' /\ 3 \notin x

PossibleCounts ==
    LET p == TLCGet("all:named")["s:_possible"][1]
    IN /\ p["FullSet"] = 8
       /\ p["GainThree"] = 16
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.6E-17
    2199:0 68 states generated, 8 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 4 and the 95th percentile is 4).
---*)
