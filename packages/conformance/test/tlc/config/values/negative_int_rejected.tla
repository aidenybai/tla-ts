(*---
description: "'-' is a separate token that becomes a model value, and then 1 is read as a new left-hand side with no '=' after it."
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = -1
---*)
---- MODULE negative_int_rejected ----
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
