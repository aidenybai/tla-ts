(*---
description: Ported from TLC's Github1198cTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1198cTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION SpecC
  PROPERTY LiveC
args:
  - -deadlock
includes:
  - Github1198abs.tla
---*)
---- MODULE Github1198 ----

VARIABLE b

Init ==
    b = FALSE

Next ==
    b' = TRUE

------
\* L equiv F. Warning is raised.

LiveA ==
    WF_b(Next)

SpecA ==
	Init /\ [][Next]_b /\ LiveA

------
\* L equiv F (Conjunction). Warning is raised.

S1B ==
	WF_b(Next)

S2B ==
	S1B

LiveB ==
    /\ S1B
    /\ S2B

SpecB ==
	Init /\ [][Next]_b /\ LiveB

------
\* L equiv F (Quantification). Warning is raised.

LiveC ==
	\A i \in {1,2}: WF_b(Next)

SpecC ==
	Init /\ [][Next]_b /\ LiveC

------
\* F superset of L. Warning is not raised.

LiveD ==
	WF_b(Next)

SpecD ==
	Init /\ [][Next]_b /\ \A i \in {1,2}: LiveD

------
\* L1 /\ L2 equiv F1 /\ F2. Warning should be raised raised. Not supported yet.

LiveE1 ==
	WF_b(Next)

LiveE2 ==
	WF_b(Next)

SpecE ==
	Init /\ [][Next]_b /\ LiveE1 /\ LiveE2

------
\* L superset of F. Warning is not raised.

LiveF1 ==
	WF_b(Next)

LiveF2 ==
	WF_b(Next)

SpecF ==
	Init /\ [][Next]_b /\ LiveF1

------
\* F superset of L. Warning should be raised. Not supported yet.

LiveG1 ==
	WF_b(Next)

SpecG ==
	Init /\ [][Next]_b /\ LiveG1 /\ WF_b(Next)

------

Abstract == 
	INSTANCE Github1198abs

SpecH ==
    Init /\ [][Next]_b
    
Refinement ==
    Abstract!Spec
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2258:3 Implied-temporal checking is a tautology.
    The temporal formula LiveC at line 53, col 1 to line 54, col 34 of module Github1198 equals
    the fairness constraints of the behavior specification SpecC at line 56, col 1 to line 57, col 35 of module Github1198.
    Therefore, checking whether SpecC => LiveC using TLC will never result in a violation of LiveC.
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
