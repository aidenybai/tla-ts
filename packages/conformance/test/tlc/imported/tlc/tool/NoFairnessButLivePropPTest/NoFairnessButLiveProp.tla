(*---
description: Ported from TLC's NoFairnessButLivePropPTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/NoFairnessButLivePropPTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION SpecNoFair
  PROPERTY VacuousLive
args:
  - -deadlock
---*)
---- MODULE NoFairnessButLiveProp ----

VARIABLE b

Init ==
    b = FALSE

Next ==
    b' = TRUE

SpecNoFair ==
    Init /\ [][Next]_b

SpecWithFair ==
    Init /\ [][Next]_b /\ WF_b(Next)

SpecWithCustomFair ==
    Init /\ [][Next]_b /\ <>(b = TRUE)

------

Live ==
    WF_b(Next)

SafetyProp ==
    [](b => [](~b => []~b))

EventuallyB ==
    <>(b = TRUE)

LeadsToB ==
    (b = FALSE) ~> (b = TRUE)

InfOftenB ==
    []<>(b = TRUE)

EventuallyAlwaysB ==
    <>[](b = TRUE)

VacuousLive ==
    (b = TRUE) => <>(b = FALSE)

------

H == INSTANCE H

RefinementNoFair ==
    H!SpecNoFair

RefinementWithFair ==
    H!SpecWithFair

=============================================================================
---- MODULE H ----

VARIABLE b

SpecNoFair ==
    b \in BOOLEAN /\ [][b' \in BOOLEAN]_b

SpecWithFair ==
    b \in BOOLEAN /\ [][b' \in BOOLEAN]_b /\ WF_b(b' \in BOOLEAN)
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
