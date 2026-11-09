(*---
description: 'A labeled box is not recognized as a next-state relation, because LabelNode is not an OpApplNode: it becomes a temporal conjunct and no action exists. Real TLC bug, as a label does not change the meaning of the formula it names.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness, tlc-bug]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
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
