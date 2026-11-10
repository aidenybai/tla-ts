(*---
description: Ported from TLC's Github798NTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github798NTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github798N.tla
  - -deadlock
---*)
---------------------------- MODULE Github798N ---------------------------
S == {"n1", "n2"}

Direct(xx, yy) ==
    /\ xx \in [S -> {"a"}]
    /\ yy \in [S -> S]
    /\ \A s \in S : 
        xx[s] = "a" => yy[s] = s

Indirect(xx, yy) == 
    /\ Direct(xx, yy)

InIndirect(xx, yy) ==
	LET zz == xx IN
    Indirect(zz, yy)

VARIABLE x, y

vars == <<x, y>>

Init == 
	/\ x = {}
	/\ y = {}

Next ==
    InIndirect(x', y')
   
Spec == 
    Init /\ [][Next]_vars

==========================================================================
---------------------------- CONFIG Github798N ----------------------------
SPECIFICATION
    Spec
===========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
