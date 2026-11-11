(*---
description: "A LET definition with a primed variable sees the value assigned earlier in the same action."
ref: "tlc2/value/impl/LazyValue.java"
outcome: success
config: |
  SPECIFICATION Spec
args: [-deadlock]
---*)
---- MODULE definition_recomputed_for_primed_change ----
EXTENDS Integers
VARIABLE x
Init == x = 0
Next == x = 0 /\ x' = 1 /\ LET a == x' + 1 IN a = 2
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
