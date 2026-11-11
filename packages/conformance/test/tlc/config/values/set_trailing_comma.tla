(*---
description: After a comma parseValue expects another value, so } becomes a model value, and the set then has no closing brace.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = {1, }
---*)
---- MODULE set_trailing_comma ----
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
