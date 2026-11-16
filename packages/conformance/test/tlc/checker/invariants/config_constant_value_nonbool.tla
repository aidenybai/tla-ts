(*---
description: An INVARIANT name replaced in the config by a value is reported as having a value.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT Inv = 1
---*)
---- MODULE config_constant_value_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
CONSTANT Inv
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The invariant of Inv is equal to 1
---*)
