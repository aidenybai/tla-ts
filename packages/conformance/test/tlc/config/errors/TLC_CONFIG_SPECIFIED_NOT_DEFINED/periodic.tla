(*---
description: An undefined _PERIODIC is reported as not defined.
ref: tlc2/tool/impl/SpecProcessor.java#processPeriodic
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _PERIODIC Nope
---*)
---- MODULE periodic ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The periodic Nope specified in the configuration file
    is not defined in the specification.
---*)
