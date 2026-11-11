(*---
description: INIT given twice fails even when both name the same operator.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  INIT Init
  NEXT Next
---*)
---- MODULE same_init_name_twice_is_still_an_error ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5004:1 TLC found an error in the configuration file at line 2
    The keyword INIT appeared twice.
---*)
