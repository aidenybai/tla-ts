(*---
description: Permutations of a one-element set can't reduce anything, so TLC warns.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTANT S = {a}
  SYMMETRY Sym
---*)
---- MODULE one_element ----
EXTENDS TLC
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == Permutations(S)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2300:3 The set S has been defined to be a symmetry set but contains less than two elements.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
