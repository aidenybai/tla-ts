(*---
description: Ported from TLC's DistributedDoInitFunctorInvariantContinueTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/distributed/DistributedDoInitFunctorInvariantContinueTest.java
features:
  - tlc-regression
  - tlc-bug
outcome: success
config: |
  SPECIFICATION
  Spec
  INVARIANT
  NotNine
args:
  - -continue
  - -deadlock
correct:
  all:
    exit: 12
    transcript: |-
      2269:0 Computed 2 initial states...
      2269:0 Computed 4 initial states...
      2269:0 Computed 8 initial states...
      2107:1 Invariant NotNine is violated by the initial state:
      x = 9
      2190:0 Finished computing initial states: 10 distinct states generated at <date>.
      2199:0 21 states generated, 11 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 2.
---*)
--------------------------- MODULE DoInitFunctorInvariant ---------------------------
EXTENDS Integers

VARIABLES x
vars == <<x>>

Init == x \in 1..10

Next == x' = 0

Spec == Init /\ [][Next]_vars

(* This property is violated by one of the init states *)
NotNine == x # 9 
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2107:1 Invariant NotNine is violated by the initial state:
    x = 9
    2190:0 Finished computing initial states: 10 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 6.0E-18
    2199:0 21 states generated, 11 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
