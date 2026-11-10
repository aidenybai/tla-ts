(*---
description: Ported from TLC's TLCExtTraceAliasTest.
source: tlatools/org.lamport.tlatools/test/tlc2/module/TLCExtTraceAliasTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION Spec
  INVARIANT Inv2
  ALIAS Alias
args:
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
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv2 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 1
    /\ t = <<[x |-> 1]>>
    2217:4 2: <Action line 27, col 21 to line 27, col 40 of module TLCExtTrace>
    /\ x = 2
    /\ t = <<[x |-> 1], [x |-> 2]>>
    2217:4 3: <Action line 27, col 21 to line 27, col 40 of module TLCExtTrace>
    /\ x = 3
    /\ t = <<[x |-> 1], [x |-> 2], [x |-> 3]>>
    2217:4 4: <Action line 27, col 21 to line 27, col 40 of module TLCExtTrace>
    /\ x = 4
    /\ t = <<[x |-> 1], [x |-> 2], [x |-> 3], [x |-> 4]>>
    2217:4 5: <Action line 27, col 21 to line 27, col 40 of module TLCExtTrace>
    /\ x = 5
    /\ t = <<[x |-> 1], [x |-> 2], [x |-> 3], [x |-> 4], [x |-> 5]>>
    2217:4 6: <Action line 27, col 21 to line 27, col 40 of module TLCExtTrace>
    /\ x = 6
    /\ t = <<[x |-> 1], [x |-> 2], [x |-> 3], [x |-> 4], [x |-> 5], [x |-> 6]>>
    2217:4 7: <Action line 27, col 21 to line 27, col 40 of module TLCExtTrace>
    /\ x = 7
    /\ t = <<[x |-> 1], [x |-> 2], [x |-> 3], [x |-> 4], [x |-> 5], [x |-> 6], [x |-> 7]>>
    2199:0 7 states generated, 7 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 7.
---*)
