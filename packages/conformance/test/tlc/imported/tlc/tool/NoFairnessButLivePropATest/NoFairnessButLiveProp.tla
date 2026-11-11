(*---
description: Ported from TLC's NoFairnessButLivePropATest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/NoFairnessButLivePropATest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION SpecNoFair
  PROPERTY Live
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
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Live was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    b = FALSE
    2218:4 2: Stuttering
    2259:3 The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification SpecNoFair defined at line 23, col 1 to line 24, col 22 of module NoFairnessButLiveProp. To rule out such counterexamples, conjoin a suitable fairness constraint to SpecNoFair (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
