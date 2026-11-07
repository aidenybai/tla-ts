(*---
description: 'A state predicate disjoined with an action is level 2 and not split.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE disjunctive_action_no_box ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init \/ Next
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2239:1 TLC cannot handle this conjunct of the spec:
    line 15, col 9 to line 15, col 20 of module disjunctive_action_no_box
---*)
