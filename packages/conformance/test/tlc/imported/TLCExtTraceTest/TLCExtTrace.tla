(*---
description: Ported from TLC's TLCExtTraceTest.
source: tlatools/org.lamport.tlatools/test/tlc2/module/TLCExtTraceTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - TLCExtTrace.tla
  - -deadlock
---*)
------------- CONFIG TLCExtTrace ---------

SPECIFICATION Spec
INVARIANT Inv
CONSTRAINT Inv
===================

---- MODULE TLCExtTrace ----

EXTENDS Integers, TLCExt, Sequences

VARIABLE x

Spec == x = 1 /\ [][x < 10 /\ x' = x + 1]_x

\* Assert that Trace is the sequence of states up to the current value of x.
Inv == /\ Len(Trace) = x
       /\ \A i \in 1..x : /\ Trace[i].x = i

Inv2 == x < 7

Alias ==
[
	x |-> x,
	t |-> Trace
]
==================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 10 states generated, 10 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 10.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
