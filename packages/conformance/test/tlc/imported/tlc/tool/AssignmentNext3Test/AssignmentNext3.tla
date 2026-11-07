(*---
description: Ported from TLC's AssignmentNext3Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/AssignmentNext3Test.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION
  Spec
args:
  - -deadlock
---*)
--------------------------- MODULE AssignmentNext3 ---------------------------
EXTENDS Integers
VARIABLE s

F(var) == (var \in 0..9 /\ (var % 2 = 0))

Spec == s=0 /\ [][F(s')]_s

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.7E-18
    2199:0 26 states generated, 5 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 4 and the 95th percentile is 4).
---*)
