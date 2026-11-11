(*---
description: An undefined ACTION_CONSTRAINT is called an action constraint.
ref: tlc2/tool/impl/SpecProcessor.java#processActionConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Nope
---*)
---- MODULE action_constraint ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The action constraint Nope specified in the configuration file
    is not defined in the specification.
---*)
