(*---
description: 'With no temporal conjunct SANY accepts the mix of state and action levels, so TLC itself rejects the named action with TLC_CANT_HANDLE_CONJUNCT.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE named_action_conjunct_no_box ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ Next
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2239:1 TLC cannot handle this conjunct of the spec:
    line 14, col 18 to line 14, col 27 of module named_action_conjunct_no_box
---*)
