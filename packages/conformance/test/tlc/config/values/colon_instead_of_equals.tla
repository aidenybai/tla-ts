(*---
description: Any token other than '=', '<-' or '(' after the name reports that '=' or '<-' was expected.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT N : 3
---*)
---- MODULE colon_instead_of_equals ----
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
