(*---
description: Ported from TLC's TLCExtTraceSimTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TLCExtTraceSimTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - TLCExtTrace.tla
  - -simulate
  - num=1
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
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 10 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 10 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 10
    Simulation using seed 4 and aril 0
---*)
