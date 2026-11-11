(*---
description: "A state constraint with the constant value FALSE is rejected as a configuration error before checking."
ref: tlc2/tool/impl/SpecProcessor.java#processModelConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE state_constraint_constant_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Con == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The constraint of Con is equal to FALSE
---*)
