(*---
description: 'A labeled box is not recognized as a next-state relation, because LabelNode is not an OpApplNode: it becomes a temporal conjunct and no action exists. Real TLC bug, as a label does not change the meaning of the formula it names.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness, tlc-bug]
outcome: evaluation-failure
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
---- MODULE labeled_box_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == Init /\ (lbl :: [][Next]_x)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2115:1 No next state actions defined to generate successor states from.
---*)
