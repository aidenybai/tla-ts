(*---
description: A constant name at the end of the file reports that '=' or '<-' was expected.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT N
---*)
---- MODULE missing_equals_at_eof ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 2
    It was expecting = or <-, but did not find it.
---*)
