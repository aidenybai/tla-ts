(*---
description: Ported from TLC's Github725bTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github725bTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -deadlock
---*)
---- MODULE Github725b ----
EXTENDS Naturals

VARIABLE outerX

---- MODULE Inner725b ----
    VARIABLE x

    Step == x < 3 /\ x' = x + 1

    Fairness == WF_x(Step)
====

Svc == INSTANCE Inner725b WITH x <- outerX

Init == outerX = 0

Step ==
    \/ Svc!Step
    \/ ~ENABLED Svc!Step /\ UNCHANGED outerX

Spec ==
    /\ Init
    /\ [][Step]_outerX
    /\ Svc!Fairness

Prop == <>(outerX = 3)

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
