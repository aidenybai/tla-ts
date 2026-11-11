(*---
description: 'SPECIFICATION naming a CONSTANT is not an OpDefNode: TLC_CONFIG_ID_HAS_VALUE reports it as a value.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION C
  CONSTANT C = TRUE
---*)
---- MODULE spec_name_is_constant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

CONSTANT C
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The value of C is equal to TRUE
---*)
