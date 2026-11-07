(*---
description: A decimal isn't an integer token form parseValue accepts.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = 1.5
---*)
---- MODULE decimal_rejected ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting = or <-, but did not find it.
---*)
