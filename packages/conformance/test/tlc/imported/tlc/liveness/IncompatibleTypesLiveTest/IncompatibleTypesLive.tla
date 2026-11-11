(*---
description: Ported from TLC's IncompatibleTypesLiveTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/IncompatibleTypesLiveTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - IncompatibleTypesLive.tla
  - -deadlock
---*)
---- CONFIG IncompatibleTypesLive ----
SPECIFICATION 
    Spec
PROPERTIES
    Prop
====

---- MODULE IncompatibleTypesLive ----
EXTENDS Naturals

VARIABLES x

Init == x = 0

Next == 
    \/ x' \in 1..100 \* Need to create enough successors for SetOfState to exhibit collisions.
    \/ x' = FALSE 
    \/ x' = "abc"

Spec == Init /\ [][Next]_x

Prop == <>[]TRUE
=====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 103 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.8E-14
    2199:0 10507 states generated, 103 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 31 and the 95th percentile is 0).
---*)
