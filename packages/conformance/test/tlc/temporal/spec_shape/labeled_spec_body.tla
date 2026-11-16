(*---
description: 'processConfigSpec has no LabelNode case, so a labeled specification body falls to the level test: temporal level, classified as fairness, leaving no initial predicate. Real TLC bug, as a label does not change the meaning of the formula it names.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness, tlc-bug]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
correct:
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
---- MODULE labeled_spec_body ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == lbl :: (Init /\ [][Next]_x)
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
