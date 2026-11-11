(*---
description: CHECK_DEADLOCK at the end of the file is missing its operand, and the error gives the keyword and line.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  
  CHECK_DEADLOCK
---*)
---- MODULE check_deadlock_at_eof ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5003:1 TLC found an error in the configuration file at line 2
    The keyword CHECK_DEADLOCK was not followed by an identifier.
---*)
