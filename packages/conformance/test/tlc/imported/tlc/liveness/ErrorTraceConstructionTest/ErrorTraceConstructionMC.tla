(*---
description: Ported from TLC's ErrorTraceConstructionTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ErrorTraceConstructionTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  \* SPECIFICATION definition
  SPECIFICATION
  spec_14411937652404000
  \* PROPERTY definition
  PROPERTY
  prop_14411937652505000
  PROPERTY neg_prop_14411937652505000
  PROPERTY YReachesThree
  PROPERTY Tautology
args:
  - -deadlock
includes:
  - ErrorTraceConstruction.tla
---*)
---- MODULE ErrorTraceConstructionMC ----
EXTENDS ErrorTraceConstruction, TLC

\* SPECIFICATION definition @modelBehaviorSpec:0
spec_14411937652404000 ==
Spec
----
\* PROPERTY definition @modelCorrectnessProperties:0
prop_14411937652505000 ==
Prop
----
\* NEGATED PROPERTY definition
neg_prop_14411937652505000 ==
~(Prop)
----

YReachesThree == []<>(y = 3)

Tautology == (x = x) ~> (x = x)
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 16 total distinct states at (<date>)
    2116:1 Temporal property prop_14411937652505000 was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <N0 line 11, col 7 to line 13, col 15 of module ErrorTraceConstruction>
    /\ x = 0
    /\ y = 1
    2217:4 3: <N1 line 14, col 7 to line 16, col 15 of module ErrorTraceConstruction>
    /\ x = 0
    /\ y = 2
    2217:4 4: <N2 line 17, col 7 to line 19, col 15 of module ErrorTraceConstruction>
    /\ x = 0
    /\ y = 3
    2217:4 5: <N3 line 20, col 7 to line 22, col 15 of module ErrorTraceConstruction>
    /\ x = 0
    /\ y = 4
    2217:4 6: <N4 line 23, col 7 to line 25, col 22 of module ErrorTraceConstruction>
    /\ x = 1
    /\ y = 5
    2217:4 7: <N5 line 26, col 7 to line 28, col 22 of module ErrorTraceConstruction>
    /\ x = 0
    /\ y = 6
    2217:4 8: <N6 line 29, col 7 to line 31, col 15 of module ErrorTraceConstruction>
    /\ x = 0
    /\ y = 7
    2122:4 4: Back to state: <N7 line 32, col 7 to line 34, col 15 of module ErrorTraceConstruction>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 9 states generated, 8 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 8.
---*)
