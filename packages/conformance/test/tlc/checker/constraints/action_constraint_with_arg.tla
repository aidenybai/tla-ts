(*---
description: An ACTION_CONSTRAINT with parameters is a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processActionConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE action_constraint_with_arg ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con(v) == v
====

(*--- recorded
all:
  exit: 151
  transcript: "2228:1 TLC requires action constraint not to take any argument, but one was given: Con"
---*)
