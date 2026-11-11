(*---
description: CHECK_DEADLOCK with a non-Boolean value is a config error.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK 1
---*)
---- MODULE config_nonboolean ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 3
    It was expecting TRUE or FALSE, but did not find it.
---*)
