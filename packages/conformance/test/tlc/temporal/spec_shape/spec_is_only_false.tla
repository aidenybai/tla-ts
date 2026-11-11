(*---
description: 'A SPECIFICATION defined as just FALSE is a constant definition that holds a value, so it fails with TLC_CONFIG_ID_HAS_VALUE and not the trivial-spec error.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE spec_is_only_false ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The value of Spec is equal to FALSE
---*)
