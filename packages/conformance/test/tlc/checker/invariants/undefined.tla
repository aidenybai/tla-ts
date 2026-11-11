(*---
description: An INVARIANT naming an undefined operator is a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE undefined ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The invariant Inv specified in the configuration file
    is not defined in the specification.
---*)
