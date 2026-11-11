(*---
description: "'= [mod]' at the end of the file reports that a value was expected."
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT K = [inner]
---*)
---- MODULE equals_bracket_complete_at_eof ----
K == 1
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 2
    It was expecting a value, but did not find it.
---*)
