(*---
description: "'=' at the end of the file reports that a value was expected."
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N =
---*)
---- MODULE missing_value_at_eof ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 2
    It was expecting a value, but did not find it.
---*)
