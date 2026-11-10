(*---
description: 'The warnings follow declaration order and not the name of the variable.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec (SubscriptCollector)
features: [liveness, subscript]
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE declaration_order_is_not_alphabetical ----
EXTENDS Naturals
VARIABLES b, a
Spec == b = 0 /\ a = 0 /\ [][UNCHANGED <<a, b>>]_<<>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable a
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable b
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
