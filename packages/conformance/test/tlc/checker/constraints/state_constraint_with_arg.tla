(*---
description: A CONSTRAINT with parameters is a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processModelConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE state_constraint_with_arg ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con(v) == v
====

(*--- recorded
all:
  exit: 151
  transcript: "2228:1 TLC requires constraint not to take any argument, but one was given: Con"
---*)
