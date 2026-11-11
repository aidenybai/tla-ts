(*---
description: Ported from TLC's AssignmentNext2Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/AssignmentNext2Test.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION
  Spec
args:
  - -deadlock
---*)
--------------------------- MODULE AssignmentNext2 ---------------------------
EXTENDS Integers
VARIABLE s

Next(var) == \E val \in 0..1: (var = val /\ var > 0)

Spec == s = "" /\ [][Next(s')]_s

=============================================================================

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
