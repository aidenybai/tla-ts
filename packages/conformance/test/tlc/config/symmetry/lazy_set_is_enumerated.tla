(*---
description: A filter set counts as a set, because it is enumerable.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTANT S = {a, b}
  SYMMETRY Sym
---*)
---- MODULE lazy_set_is_enumerated ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == {f \in Permutations(S) : TRUE}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2191:0 Finished computing initial states: 2 states generated, with 1 of them distinct at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
