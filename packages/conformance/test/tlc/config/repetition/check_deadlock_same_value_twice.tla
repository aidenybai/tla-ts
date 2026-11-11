(*---
description: CHECK_DEADLOCK given twice fails even with the same value.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK TRUE
  CHECK_DEADLOCK TRUE
---*)
---- MODULE check_deadlock_same_value_twice ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5004:1 TLC found an error in the configuration file at line 4
    The keyword CHECK_DEADLOCK appeared twice.
---*)
