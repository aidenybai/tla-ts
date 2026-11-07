(*---
description: 'processConfigSpec has no LabelNode case, so a labeled specification body falls to the level test: temporal level, classified as fairness, leaving no initial predicate.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
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
