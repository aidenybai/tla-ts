(*---
description: A CONSTRAINT naming an undefined operator is a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processModelConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE undefined_state_constraint ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The constraint Con specified in the configuration file
    is not defined in the specification.
---*)
