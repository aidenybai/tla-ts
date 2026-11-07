(*---
description: Two elements with no comma end the element loop at 2, which isn't the closing brace.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = {1 2}
---*)
---- MODULE set_missing_comma ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting }, but did not find it.
---*)
