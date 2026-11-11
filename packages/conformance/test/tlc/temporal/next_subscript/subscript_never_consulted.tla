(*---
description: 'TLC generates successors from the action alone: a step that leaves the subscript unchanged is still explored as a real step.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec (SubscriptCollector)
features: [liveness, subscript]
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE subscript_never_consulted ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y

N == x < 2 /\ x' = x + 1 /\ y' = y
Spec == Init /\ [][N]_y
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable x
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
