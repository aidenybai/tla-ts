(*---
description: "A cached lazy argument that reads a primed variable is computed again in another disjunct of Next, once for each branch of each source state."
ref: "tlc2/value/impl/LazyValue.java#getCachedValue"
outcome: success
config: |
  SPECIFICATION Spec
---*)
---- MODULE argument_recomputed_when_next_state_differs ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
VARIABLE x
G(a) == /\ \/ x' = 0
           \/ x' = 1
        /\ a = x'
Init == x = 0
Next == G(P(1, x'))
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 1
    | 1
    | 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
    2199:0 5 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
