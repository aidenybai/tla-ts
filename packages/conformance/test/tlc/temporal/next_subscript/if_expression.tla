(*---
description: 'IF is a built-in other than a tuple, so even tuples in its branches are not seen.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec (SubscriptCollector)
features: [liveness, subscript]
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE if_expression ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y
Spec == Init /\ [][Next]_(IF TRUE THEN <<x, y>> ELSE <<x, y>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable x
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable y
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
