(*---
description: "A lazy filter holds a copy of the current state, used when it answers membership."
ref: "tlc2/value/impl/SetPredValue.java#SetPredValue"
outcome: success
config: |
  SPECIFICATION Spec
args: [-deadlock]
---*)
---- MODULE lazy_filter_body_sees_definition_state ----
EXTENDS Integers
VARIABLE x
Init == x = 0
Next == /\ x < 2
        /\ LET s == {y \in Nat : y > x} IN (x + 1) \in s
        /\ x' = x + 1
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
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
