(*---
description: CHECK_DEADLOCK takes only the uppercase words.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CHECK_DEADLOCK true
---*)
---- MODULE check_deadlock_lowercase ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting TRUE or FALSE, but did not find it.
---*)
