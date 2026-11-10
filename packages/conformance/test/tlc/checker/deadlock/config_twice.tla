(*---
description: "A second CHECK_DEADLOCK in a configuration file is a parse error, since only one is allowed."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK TRUE
  CHECK_DEADLOCK FALSE
---*)
---- MODULE config_twice ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5004:1 TLC found an error in the configuration file at line 4
    The keyword CHECK_DEADLOCK appeared twice.
---*)
