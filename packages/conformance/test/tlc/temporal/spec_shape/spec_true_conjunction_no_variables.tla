(*---
description: 'A conjunction of TRUEs is constant level as well and holds a value, so it hits TLC_CONFIG_ID_HAS_VALUE.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
---*)
---- MODULE spec_true_conjunction_no_variables ----
Spec == TRUE /\ TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The value of Spec is equal to TRUE
---*)
