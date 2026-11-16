(*---
description: An undefined _POSSIBLE is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
---*)
---- MODULE undefined_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The possible Pred specified in the configuration file
    is not defined in the specification.
---*)
