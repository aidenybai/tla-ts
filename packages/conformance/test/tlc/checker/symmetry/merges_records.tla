(*---
description: Records with model values merge by permutation of the values.
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
---- MODULE merges_records ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x \in [a : {A, B, C}, b : {A, B, C}]
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2191:0 Finished computing initial states: 9 states generated, with 2 of them distinct at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 9.8E-19
    2199:0 11 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
