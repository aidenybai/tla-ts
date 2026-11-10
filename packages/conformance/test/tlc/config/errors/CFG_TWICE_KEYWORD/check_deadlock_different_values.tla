(*---
description: CHECK_DEADLOCK fails on the second use whichever value it has.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CHECK_DEADLOCK TRUE
  CHECK_DEADLOCK FALSE
---*)
---- MODULE check_deadlock_different_values ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5004:1 TLC found an error in the configuration file at line 2
    The keyword CHECK_DEADLOCK appeared twice.
---*)
