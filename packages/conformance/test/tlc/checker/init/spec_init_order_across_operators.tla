(*---
description: Two initial conjuncts inside operators keep source order across the operators.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: success
config: |
  SPECIFICATION Spec
---*)
---- MODULE spec_init_order_across_operators ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
I1 == x = 1
I2 == y = x + 1
Spec == I1 /\ I2 /\ PrintT(<<x, y>>) /\ [][Next]_<<x, y>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 2>>
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
