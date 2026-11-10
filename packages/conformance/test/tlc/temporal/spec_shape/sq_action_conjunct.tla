(*---
description: 'A square action with no box is action level and reaches TLC, which fails with TLC_CANT_HANDLE_CONJUNCT because it cannot be init, next or fairness.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sq_action_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2239:1 TLC cannot handle this conjunct of the spec:
    line 15, col 17 to line 15, col 24 of module sq_action_conjunct
---*)
