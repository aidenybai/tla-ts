(*---
description: Symmetric successors count as one distinct state.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTANTS A = A
  B = B
  C = C
  SYMMETRY Perms
---*)
---- MODULE merges_successors ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x = {}
Next == \E m \in {A, B, C} : x' = x \cup {m}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.0E-18
    2199:0 13 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
