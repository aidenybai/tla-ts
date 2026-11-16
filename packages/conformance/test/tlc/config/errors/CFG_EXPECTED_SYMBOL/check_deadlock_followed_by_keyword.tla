(*---
description: CHECK_DEADLOCK reads the next token as its value even when it is a keyword.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CHECK_DEADLOCK INIT Init
  NEXT Next
---*)
---- MODULE check_deadlock_followed_by_keyword ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting TRUE or FALSE, but did not find it.
---*)
