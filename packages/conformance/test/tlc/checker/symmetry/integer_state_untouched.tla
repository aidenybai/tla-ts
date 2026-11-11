(*---
description: Values that aren't model values are unaffected by a symmetry set.
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
---- MODULE integer_state_untouched ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x \in 0..2
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 3 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.9E-19
    2199:0 6 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
