(*---
description: An ACTION_CONSTRAINT naming an undefined operator is a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processActionConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE undefined_action_constraint ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The action constraint Con specified in the configuration file
    is not defined in the specification.
---*)
