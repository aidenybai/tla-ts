(*---
description: 'A SPECIFICATION defined as just TRUE holds a value too, and fails with TLC_CONFIG_ID_HAS_VALUE before any missing init check.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE spec_is_only_true ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The value of Spec is equal to TRUE
---*)
