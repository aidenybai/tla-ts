(*---
description: 'A parenthesized numeral parses, has no case in the collector, and the failure is caught and turned into TLC_COULD_NOT_DETERMINE_SUBSCRIPT.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec (SubscriptCollector)
features: [liveness, subscript]
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE parenthesized_numeral ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y
Spec == Init /\ [][Next]_(1)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2139:3 TLC could not determine if the subscript of the next-state relation contains
    all state variables. Proceed with fingers crossed.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
