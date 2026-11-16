(*---
description: The escape rejection gives the line of the string in its message.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  

  CONSTANT N = "a\tb"
---*)
---- MODULE backslash_in_first_string ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5007:1 TLC found an error in the configuration file:
    escape sequences are not supported in strings at line 3
---*)
