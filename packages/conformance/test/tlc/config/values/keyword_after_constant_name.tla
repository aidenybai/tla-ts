(*---
description: The section check runs only before a left-hand side, so a keyword after a name is not a section start.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT N
  INIT Init
---*)
---- MODULE keyword_after_constant_name ----
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
