(*---
description: 'An angle action with no temporal conjunct is a conjunct TLC cannot handle.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE angle_action_no_box ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ <<Next>>_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2239:1 TLC cannot handle this conjunct of the spec:
    line 15, col 17 to line 15, col 26 of module angle_action_no_box
---*)
