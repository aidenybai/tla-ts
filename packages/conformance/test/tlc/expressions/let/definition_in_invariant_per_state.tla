(*---
description: "A LET definition in an invariant runs again in each state, so a cached value does not leak between states."
ref: "tlc2/value/impl/LazyValue.java"
outcome: success
config: |
  SPECIFICATION Spec
  INVARIANT Inv
args: [-deadlock]
---*)
---- MODULE definition_in_invariant_per_state ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Inv == LET a == P(x, x) IN a = x
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 0
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 2
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
