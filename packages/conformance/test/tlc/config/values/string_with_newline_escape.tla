(*---
description: A string with \n hits the same rejection of backslashes.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = "a\nb"
---*)
---- MODULE string_with_newline_escape ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5007:1 TLC found an error in the configuration file:
    escape sequences are not supported in strings at line 1
---*)
