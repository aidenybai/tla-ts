(*---
description: An undefined CONSTRAINT is called a constraint.
ref: tlc2/tool/impl/SpecProcessor.java#processModelConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Nope
---*)
---- MODULE constraint ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The constraint Nope specified in the configuration file
    is not defined in the specification.
---*)
