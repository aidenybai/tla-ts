(*---
description: "A cached lazy argument stays valid in Next after a primed assignment grows the next state, so it prints once for each source state."
ref: "tlc2/value/impl/LazyValue.java#getCachedValue"
outcome: success
config: |
  SPECIFICATION Spec
args: [-deadlock]
---*)
---- MODULE argument_cached_as_next_state_grows ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
VARIABLE x
G(a) == /\ a = 0
        /\ x' = 1
        /\ a = 0
Init == x = 0
Next == G(P(1, x))
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
