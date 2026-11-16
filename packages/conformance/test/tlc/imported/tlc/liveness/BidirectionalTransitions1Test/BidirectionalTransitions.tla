(*---
description: Ported from TLC's BidirectionalTransitions1Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/BidirectionalTransitions1Test.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION Spec1A
  PROPERTY Prop1A
args:
  - -deadlock
---*)
-------- MODULE BidirectionalTransitions --------
EXTENDS Naturals
VARIABLE x

-------------------------------------------------

A == \/ x' = (x + 1) % 3
B == x' \in 0..2
Spec1A == (x=0) /\ [][A \/ B]_x/\ WF_x(A)
Prop1A == Spec1A /\ WF_x(A) /\ []<><<A>>_x

Fair1B == WF_x(B)
Spec1B == (x=0) /\ [][A \/ B]_x/\ Fair1B
Prop1Bx == WF_x(A)
Prop1By == []<><<A>>_x

-------------------------------------------------

C == x' = (x + 1) % 4
D == IF x = 0 THEN x' = 3 ELSE  x' = x - 1 
Spec2 == (x=0) /\ [][C \/ D]_x/\ WF_x(D)
Prop2 == Spec2 /\ WF_x(D) /\ []<><<D>>_x

Fair2C == WF_x(C)
Spec2C == (x=0) /\ [][C \/ D]_x/\ Fair2C
Prop2Cx == WF_x(D)
Prop2Cy == []<><<D>>_x

neg_Prop1Bx == ~(Prop1Bx)
neg_Prop1By == ~(Prop1By)
neg_Prop2Cx == ~(Prop2Cx)
neg_Prop2Cy == ~(Prop2Cy)

XChanges == (x = 1) ~> (x # 1)
XCyclesToZero == []<>(x = 0)

Tautology == (x = x) ~> (x = x)
=================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-18
    2199:0 13 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)
