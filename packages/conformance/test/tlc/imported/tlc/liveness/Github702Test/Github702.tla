(*---
description: Ported from TLC's Github702Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github702Test.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
args:
  - -deadlock
---*)
\* Copyright (c) 2022, Oracle and/or its affiliates.

---- MODULE Github702 ----
\* Previously, TLC would fail with
\*  > In computing next states, TLC found the identifier
\*  > fizzbuzz undefined in an UNCHANGED expression

EXTENDS Naturals
VARIABLES y, z

fizzbuzz == 1
INSTANCE x_unchanged WITH
    x <- fizzbuzz

====

---- MODULE x_unchanged ----

EXTENDS Naturals

VARIABLES x, y, z

Init ==
    /\ x \in {1,2,3}
    /\ y \in {1,2,3}
    /\ z \in {1,2,3}

Next ==
    /\ y < 10
    /\ y' = y + 1
    /\ UNCHANGED <<x, z>>

Spec == Init /\ [][Next]_<<x, y, z>>

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2190:0 Finished computing initial states: 9 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 9.8E-18
    2199:0 36 states generated, 30 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 8.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
