(*---
description: CHECK_DEADLOCKS is not in ModelConfig's keyword table, so the file fails with a request for a keyword.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CHECK_DEADLOCKS Init
---*)
---- MODULE not_a_keyword_check_deadlocks ----
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
    It was expecting a keyword, but did not find it.
---*)
