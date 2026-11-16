(*---
description: Ported from TLC's Github798ITest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github798ITest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github798I.tla
  - -deadlock
---*)
---------------------------- MODULE Github798I ----------------------------
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
    InIndirect(x, y)
   
Spec == 
    Init /\ [][InIndirect(x', y')]_vars

==========================================================================
---------------------------- CONFIG Github798I -----------------------------
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
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
