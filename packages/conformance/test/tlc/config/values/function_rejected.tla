(*---
description: "'=[' starts a module-specific constant, and \\in fails the check for ']'."
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = [i \in {1} |-> i]
---*)
---- MODULE function_rejected ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting ], but did not find it.
---*)
