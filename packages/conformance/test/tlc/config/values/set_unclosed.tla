(*---
description: A set with no closing brace at the end of the file reports the missing }.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = {1, 2
---*)
---- MODULE set_unclosed ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 2
    It was expecting }, but did not find it.
---*)
