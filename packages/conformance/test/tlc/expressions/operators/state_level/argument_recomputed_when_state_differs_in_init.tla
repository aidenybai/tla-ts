(*---
description: "A cached lazy argument is computed again in another disjunct, where a variable of the cached state has a different value, so it never returns a stale value."
ref: "tlc2/value/impl/LazyValue.java#getCachedValue"
outcome: success
config: |
  SPECIFICATION Spec
---*)
---- MODULE argument_recomputed_when_state_differs_in_init ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
VARIABLE x
G(a) == /\ \/ x = 0
           \/ x = 1
        /\ a = x
Init == G(P(1, x))
Next == UNCHANGED x
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 1
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
